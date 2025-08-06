const express = require("express");
const db = require("../config/db");
const bcrypt = require('bcrypt'); // 1. Importe o bcrypt
const { profileUpload } = require('../config/multerConfig'); 
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../auth/authMiddleware');
const adminOnly = require('../auth/adminOnly');

const router = express.Router();
const saltRounds = 10; // Fator de custo para o hash

// --- ROTAS DE GERENCIAMENTO DE USUÁRIOS (Apenas Admins) ---

// Rota para criar um novo usuário (Admin) - VERSÃO ATUALIZADA
router.post("/usuarios", adminOnly, profileUpload.single('foto_perfil'), async (req, res) => {
    const { username, password, tipo_usuario, nome_completo, cpf, numero_habilitacao } = req.body;
    const foto_perfil_url = req.file ? `/uploads/perfis/${req.file.filename}` : null;

    if (!username || !password || !tipo_usuario) {
        return res.status(400).json({ error: "Nome de usuário, senha e tipo são obrigatórios." });
    }

    // Validação extra se o tipo for motorista
    if (tipo_usuario === 'motorista' && (!nome_completo || !cpf || !numero_habilitacao)) {
        return res.status(400).json({ error: "Para motoristas, nome completo, CPF e habilitação são obrigatórios." });
    }

    const connection = await db.promise().getConnection();

    try {
        await connection.beginTransaction();

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 1. Insere na tabela de usuários
        const userSql = "INSERT INTO usuarios (username, password, tipo_usuario, foto_perfil_url) VALUES (?, ?, ?, ?)";
        const [userResult] = await connection.query(userSql, [username, hashedPassword, tipo_usuario, foto_perfil_url]);
        const newUserId = userResult.insertId;

        // 2. Se for motorista, insere na tabela de motoristas
        if (tipo_usuario === 'motorista') {
            const driverSql = "INSERT INTO motoristas (usuario_id, nome_completo, cpf, numero_habilitacao) VALUES (?, ?, ?, ?)";
            await connection.query(driverSql, [newUserId, nome_completo, cpf, numero_habilitacao]);
        }

        await connection.commit();
        res.status(201).json({ message: "Usuário criado com sucesso!", userId: newUserId });

    } catch (error) {
        await connection.rollback();
        if (req.file) fs.unlinkSync(req.file.path); // Remove a foto se a transação falhar

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Este nome de usuário, CPF ou habilitação já existe." });
        }
        console.error("Erro ao criar usuário:", error);
        return res.status(500).json({ error: "Erro interno ao criar o usuário." });

    } finally {
        if (connection) connection.release();
    }
});


// Rota para listar todos os usuários (Admin) - Sem alterações
router.get("/usuarios", adminOnly, (req, res) => {
    const sql = "SELECT id, username, tipo_usuario, foto_perfil_url FROM usuarios";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Rota para editar um usuário (Admin) - Sem alterações na senha aqui
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

// Rota para excluir um usuário (Admin) - Sem alterações
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

// Rota para buscar dados do próprio perfil - Sem alterações
router.get('/perfil', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const sql = "SELECT id, username, foto_perfil_url FROM usuarios WHERE id = ?";
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'Usuário não encontrado.' });
        res.json(results[0]);
    });
});

// Rota para atualizar os próprios dados (nome e foto) - Sem alterações na senha
router.put('/perfil/dados', authMiddleware, profileUpload.single('foto_perfil'), (req, res) => {
    const userId = req.user.id;
    const { username } = req.body;

    if (!username) return res.status(400).json({ error: "O nome de usuário é obrigatório." });

    db.query("SELECT foto_perfil_url FROM usuarios WHERE id = ?", [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }
        
        const oldFotoUrl = results[0]?.foto_perfil_url;
        const fieldsToUpdate = { username };
        let newImageUrl = null;

        if (req.file) {
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
                newImageUrl: newImageUrl
            });
        });
    });
});

// Rota para atualizar a própria senha - AGORA COM HASH
router.put('/perfil/senha', authMiddleware, (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Todos os campos de senha são obrigatórios." });
    }

    const sqlSelect = "SELECT password FROM usuarios WHERE id = ?";
    db.query(sqlSelect, [userId], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const user = results[0];
        try {
            // 3. Compare a senha atual (texto plano) com o hash do banco de dados
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(403).json({ error: "A senha atual está incorreta." });
            }

            // 4. Crie o hash da NOVA senha
            const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

            const sqlUpdate = "UPDATE usuarios SET password = ? WHERE id = ?";
            db.query(sqlUpdate, [newHashedPassword, userId], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(200).json({ message: "Senha alterada com sucesso!" });
            });
        } catch (compareError) {
            console.error("Erro ao comparar senhas:", compareError);
            return res.status(500).json({ error: "Erro interno ao verificar a senha." });
        }
    });
});

module.exports = router;