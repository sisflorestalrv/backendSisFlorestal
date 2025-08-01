const express = require("express");
const db = require("../config/db");
// <-- MUDANÇA AQUI: Importa a configuração específica para perfil
const { profileUpload } = require('../config/multerConfig'); 
const fs = require('fs');
const path = require('path');

// Middlewares de autenticação e autorização
const authMiddleware = require('../auth/authMiddleware'); // Para usuários logados
const adminOnly = require('../auth/adminOnly'); // Apenas para administradores

const router = express.Router();

// --- ROTAS DE GERENCIAMENTO DE USUÁRIOS (Apenas Admins) ---

// Rota para criar um novo usuário (Admin)
// <-- MUDANÇA AQUI: Usa o 'profileUpload'
router.post("/usuarios", adminOnly, profileUpload.single('foto_perfil'), (req, res) => {
    const { username, password, tipo_usuario } = req.body;
    // <-- MUDANÇA AQUI: Adiciona a pasta /perfis/ no caminho da URL
    const foto_perfil_url = req.file ? `/uploads/perfis/${req.file.filename}` : null;

    if (!username || !password || !tipo_usuario) {
        return res.status(400).json({ error: "Nome de usuário, senha e tipo são obrigatórios." });
    }

    const sql = "INSERT INTO usuarios (username, password, tipo_usuario, foto_perfil_url) VALUES (?, ?, ?, ?)";
    db.query(sql, [username, password, tipo_usuario, foto_perfil_url], (err, result) => {
        if (err) {
            if (req.file) fs.unlinkSync(req.file.path);
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: "Este nome de usuário já existe." });
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: "Usuário criado com sucesso!", userId: result.insertId });
    });
});

// Rota para listar todos os usuários (Admin)
router.get("/usuarios", adminOnly, (req, res) => {
    const sql = "SELECT id, username, tipo_usuario, foto_perfil_url FROM usuarios";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Rota para editar um usuário (Admin)
// <-- MUDANÇA AQUI: Usa o 'profileUpload'
router.put("/usuarios/:id", adminOnly, profileUpload.single('foto_perfil'), (req, res) => {
    const { id } = req.params;
    const { username, tipo_usuario } = req.body;

    if (!username || !tipo_usuario) {
        return res.status(400).json({ error: "Nome de usuário e tipo são obrigatórios." });
    }

    db.query("SELECT foto_perfil_url FROM usuarios WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Usuário não encontrado." });

        const oldFotoUrl = results[0].foto_perfil_url;
        const fieldsToUpdate = { username, tipo_usuario };
        if (req.file) {
            // <-- MUDANÇA AQUI: Adiciona a pasta /perfis/ no caminho da URL
            fieldsToUpdate.foto_perfil_url = `/uploads/perfis/${req.file.filename}`;
        }

        const sql = "UPDATE usuarios SET ? WHERE id = ?";
        db.query(sql, [fieldsToUpdate, id], (err, result) => {
            if (err) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(500).json({ error: err.message });
            }
            if (req.file && oldFotoUrl) {
                const oldFotoPath = path.join(__dirname, '..', 'public', oldFotoUrl);
                if (fs.existsSync(oldFotoPath)) fs.unlinkSync(oldFotoPath);
            }
            res.status(200).json({ message: "Usuário atualizado com sucesso." });
        });
    });
});

// Rota para excluir um usuário (Admin)
router.delete("/usuarios/:id", adminOnly, (req, res) => {
    const { id } = req.params;
    db.query("SELECT foto_perfil_url FROM usuarios WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Usuário não encontrado." });

        const fotoUrl = results[0].foto_perfil_url;
        db.query("DELETE FROM usuarios WHERE id = ?", [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: "Usuário não encontrado." });

            if (fotoUrl) {
                const fotoPath = path.join(__dirname, '..', 'public', fotoUrl);
                if (fs.existsSync(fotoPath)) fs.unlinkSync(fotoPath);
            }
            res.status(200).json({ message: "Usuário excluído com sucesso." });
        });
    });
});


// --- ROTAS DE PERFIL DO PRÓPRIO USUÁRIO (Qualquer Usuário Logado) ---

// Rota para buscar dados do próprio perfil
router.get('/perfil', authMiddleware, (req, res) => {
    const userId = req.user.id; // Pega o ID do usuário a partir do token JWT
    const sql = "SELECT id, username, foto_perfil_url FROM usuarios WHERE id = ?";
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json(results[0]);
    });
});

// Rota para atualizar os próprios dados (nome e foto)
// <-- MUDANÇA AQUI: Usa o 'profileUpload'
router.put('/perfil/dados', authMiddleware, profileUpload.single('foto_perfil'), (req, res) => {
    const userId = req.user.id;
    const { username } = req.body;

    if (!username) return res.status(400).json({ error: "O nome de usuário é obrigatório." });

    db.query("SELECT foto_perfil_url FROM usuarios WHERE id = ?", [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
             // Caso raro, mas bom ter. Se o token for válido mas o usuário não existir mais.
            return res.status(404).json({ error: "Usuário não encontrado." });
        }
        
        const oldFotoUrl = results[0]?.foto_perfil_url;
        const fieldsToUpdate = { username };
        let newImageUrl = null;

        if (req.file) {
            // <-- MUDANÇA AQUI: Adiciona a pasta /perfis/ no caminho da URL
            newImageUrl = `/uploads/perfis/${req.file.filename}`;
            fieldsToUpdate.foto_perfil_url = newImageUrl;
        }

        const sql = "UPDATE usuarios SET ? WHERE id = ?";
        db.query(sql, [fieldsToUpdate, userId], (err, result) => {
            if (err) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(500).json({ error: err.message });
            }
            if (req.file && oldFotoUrl) {
                const oldFotoPath = path.join(__dirname, '..', 'public', oldFotoUrl);
                if (fs.existsSync(oldFotoPath)) fs.unlinkSync(oldFotoPath);
            }
            res.status(200).json({ 
                message: "Perfil atualizado com sucesso!",
                newImageUrl: newImageUrl // Retorna a nova URL para o frontend atualizar o estado
            });
        });
    });
});

// Rota para atualizar a própria senha
router.put('/perfil/senha', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Todos os campos de senha são obrigatórios." });
    }

    const sqlSelect = "SELECT password FROM usuarios WHERE id = ?";
    db.query(sqlSelect, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const user = results[0];
        // IMPORTANTE: Substitua pela sua lógica de comparação de hash (ex: bcrypt.compare)
        if (user.password !== currentPassword) {
            return res.status(403).json({ error: "A senha atual está incorreta." });
        }

        // IMPORTANTE: Substitua pela sua lógica de criação de hash (ex: bcrypt.hash)
        const newHashedPassword = newPassword;

        const sqlUpdate = "UPDATE usuarios SET password = ? WHERE id = ?";
        db.query(sqlUpdate, [newHashedPassword, userId], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json({ message: "Senha alterada com sucesso!" });
        });
    });
});

module.exports = router;