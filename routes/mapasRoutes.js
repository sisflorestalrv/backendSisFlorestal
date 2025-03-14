const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");

// Configuração do Multer para o upload de mapas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/mapas/"); // Pasta onde os mapas serão salvos
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome único para o mapa
  },
});

const upload = multer({ storage: storage });

// Rota para postar um mapa de um imóvel
router.post("/imoveis/:id/mapas", upload.single("mapa"), (req, res) => {
  const { id } = req.params;
  const caminhoMapa = req.file ? req.file.path : null;
  const { titulo } = req.body; // Obtendo o título

  if (!caminhoMapa) {
    return res.status(400).json({ error: "Mapa é obrigatório" });
  }

  const sql = "INSERT INTO mapas (imovel_id, caminho, titulo) VALUES (?, ?, ?)";
  const values = [id, caminhoMapa, titulo];

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Mapa cadastrado com sucesso!" });
  });
});

// Rota para listar os mapas de um imóvel
router.get("/imoveis/:id/mapas", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM mapas WHERE imovel_id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Nenhum mapa encontrado para este imóvel." });
    }

    res.json(results);
  });
});

// Rota para excluir um mapa de um imóvel
router.delete("/imoveis/:id/mapas/:mapaId", (req, res) => {
  const { id, mapaId } = req.params;

  // Primeiro, busque o caminho do mapa na base de dados
  const selectSql = "SELECT caminho FROM mapas WHERE id = ? AND imovel_id = ?";
  db.query(selectSql, [mapaId, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Mapa não encontrado." });
    }

    const filePath = results[0].caminho;

    // Exclua o mapa do sistema de arquivos (se necessário)
    const fs = require('fs');
    const path = require('path');
    const fileFullPath = path.join(__dirname, filePath);

    fs.unlink(fileFullPath, (unlinkErr) => {
      if (unlinkErr) {
        return res.status(500).json({ error: "Erro ao excluir o mapa." });
      }

      // Após excluir o mapa, remova o registro do banco de dados
      const deleteSql = "DELETE FROM mapas WHERE id = ?";
      db.query(deleteSql, [mapaId], (deleteErr) => {
        if (deleteErr) {
          return res.status(500).json({ error: deleteErr.message });
        }

        res.status(200).json({ message: "Mapa excluído com sucesso!" });
      });
    });
  });
});

module.exports = router;
