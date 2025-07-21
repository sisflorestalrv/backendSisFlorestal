const db = require("../config/db"); // Importa a conexão com o banco de dados
const express = require("express");
// const authAdmin = require('../auth/authAdmin'); // Linha antiga removida
const adminOnly = require('../auth/adminOnly'); // --- CORREÇÃO 1: Importa o novo middleware ---

const router = express.Router();

// --- CORREÇÃO 2: Aplica o middleware que verifica se o usuário é admin ---
// Este middleware só será executado se o `authMiddleware` principal (do index.js)
// já tiver validado o token JWT e adicionado o `req.user`.
router.use(adminOnly);

// Rota para criar um novo usuário (Ex: POST /api/usuarios)
router.post("/usuarios", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Nome de usuário e senha são obrigatórios." });
  }

  const sql = "INSERT INTO usuarios (username, password) VALUES (?, ?)";

  db.query(sql, [username, password], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: "Este nome de usuário já existe." });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Usuário criado com sucesso!", userId: result.insertId });
  });
});

// Rota para listar todos os usuários (Ex: GET /api/usuarios)
router.get("/usuarios", (req, res) => {
  const sql = "SELECT id, username, tipo_usuario FROM usuarios"; // Adicionado tipo_usuario para visualização
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Rota para editar um usuário pelo ID (Ex: PUT /api/usuarios/5)
router.put("/usuarios/:id", (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Nome de usuário e senha são obrigatórios." });
  }

  const sql = "UPDATE usuarios SET username = ?, password = ? WHERE id = ?";

  db.query(sql, [username, password, id], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: "Este nome de usuário já existe." });
      }
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    res.status(200).json({ message: "Usuário atualizado com sucesso." });
  });
});

// Rota para excluir um usuário pelo ID (Ex: DELETE /api/usuarios/5)
router.delete("/usuarios/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM usuarios WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    res.status(200).json({ message: "Usuário excluído com sucesso." });
  });
});

module.exports = router;