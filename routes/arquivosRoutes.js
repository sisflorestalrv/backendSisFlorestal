const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");

// Configuração do Multer para o upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/arquivos/"); // Pasta onde os arquivos serão salvos
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome único para o arquivo
  },
});

const upload = multer({ storage: storage });

// Rota para postar um arquivo de um imóvel
router.post("/imoveis/:id/arquivos", upload.single("arquivo"), (req, res) => {
  const { id } = req.params;
  const caminhoArquivo = req.file ? req.file.path : null;
  const { titulo } = req.body; // Obtendo o título

  if (!caminhoArquivo) {
    return res.status(400).json({ error: "Arquivo é obrigatório" });
  }

  const sql = "INSERT INTO arquivos (imovel_id, caminho, titulo) VALUES (?, ?, ?)";
  const values = [id, caminhoArquivo, titulo];

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Arquivo cadastrado com sucesso!" });
  });
});

// Rota para listar os arquivos de um imóvel
router.get("/imoveis/:id/arquivos", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM arquivos WHERE imovel_id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Nenhum arquivo encontrado para este imóvel." });
    }

    res.json(results);
  });
});

// Rota para excluir um arquivo de um imóvel
router.delete("/imoveis/:id/arquivos/:fileId", (req, res) => {
  const { id, fileId } = req.params;

  // Primeiro, busque o caminho do arquivo na base de dados
  const selectSql = "SELECT caminho FROM arquivos WHERE id = ? AND imovel_id = ?";
  db.query(selectSql, [fileId, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Arquivo não encontrado." });
    }

    const filePath = results[0].caminho;

    // Exclua o arquivo do sistema de arquivos (se necessário)
    const fs = require('fs');
    const path = require('path');
    const fileFullPath = path.join(__dirname, filePath);

    fs.unlink(fileFullPath, (unlinkErr) => {
      if (unlinkErr) {
        return res.status(500).json({ error: "Erro ao excluir o arquivo." });
      }

      // Após excluir o arquivo, remova o registro do banco de dados
      const deleteSql = "DELETE FROM arquivos WHERE id = ?";
      db.query(deleteSql, [fileId], (deleteErr) => {
        if (deleteErr) {
          return res.status(500).json({ error: deleteErr.message });
        }

        res.status(200).json({ message: "Arquivo excluído com sucesso!" });
      });
    });
  });
});

module.exports = router;