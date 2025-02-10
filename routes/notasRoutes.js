// routes/notasRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Rota para registrar uma nota para um imóvel específico
router.post("/imoveis/:id/notas", (req, res) => {
  const { id } = req.params; // ID do imóvel
  const { titulo, descricao } = req.body; // Título e descrição da nota

  if (!titulo || !descricao) {
    return res.status(400).json({ error: "Título e descrição são obrigatórios." });
  }

  const sql = `
    INSERT INTO notas (imovel_id, titulo, descricao)
    VALUES (?, ?, ?)
  `;

  const values = [id, titulo, descricao];

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Nota registrada com sucesso!" });
  });
});

// Rota para listar todas as notas de um imóvel específico
router.get("/imoveis/:id/notas", (req, res) => {
  const { id } = req.params; // Captura o ID do imóvel

  const sql = "SELECT * FROM notas WHERE imovel_id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);  // Envia as notas encontradas para o frontend
  });
});

// Rota para deletar uma nota de um imóvel específico
router.delete("/imoveis/:id/notas/:notaId", (req, res) => {
  const { id, notaId } = req.params; // ID do imóvel e ID da nota a ser deletada

  // Verificação se a nota pertence ao imóvel
  const checkSql = "SELECT * FROM notas WHERE id = ? AND imovel_id = ?";
  db.query(checkSql, [notaId, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Nota não encontrada para este imóvel." });
    }

    // Deletando a nota
    const deleteSql = "DELETE FROM notas WHERE id = ?";
    db.query(deleteSql, [notaId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json({ message: "Nota deletada com sucesso!" });
    });
  });
});

// Rota para atualizar uma nota de um imóvel específico
router.put("/imoveis/:id/notas/:notaId", (req, res) => {
  const { id, notaId } = req.params; // ID do imóvel e da nota
  const { titulo, descricao } = req.body; // Novo título e descrição

  if (!titulo || !descricao) {
    return res.status(400).json({ error: "Título e descrição são obrigatórios." });
  }

  const sql = `
    UPDATE notas
    SET titulo = ?, descricao = ?
    WHERE id = ? AND imovel_id = ?
  `;

  const values = [titulo, descricao, notaId, id];

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Nota não encontrada para este imóvel." });
    }
    res.status(200).json({ message: "Nota atualizada com sucesso!" });
  });
});

module.exports = router;