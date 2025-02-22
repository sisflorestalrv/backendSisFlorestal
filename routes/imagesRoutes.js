const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");

// Configuração do Multer para o upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Pasta onde as imagens serão salvas
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome único para a imagem
  },
});

const upload = multer({ storage: storage });


// Rota para postar a imagem de um imóvel
router.post("/imoveis/:id/imagens", upload.single("imagem"), (req, res) => {
  const { id } = req.params;
  const caminhoImagem = req.file ? req.file.path : null;
  const { titulo } = req.body; // Obtendo o título

  if (!caminhoImagem) {
    return res.status(400).json({ error: "Imagem é obrigatória" });
  }

  const sql = "INSERT INTO imagens (imovel_id, caminho, titulo) VALUES (?, ?, ?)";
  const values = [id, caminhoImagem, titulo];

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Imagem cadastrada com sucesso!" });
  });
});

// Rota para listar as imagens de um imóvel
router.get("/imoveis/:id/imagens", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM imagens WHERE imovel_id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Nenhuma imagem encontrada para este imóvel." });
    }

    // Log do caminho das imagens para depuração
    console.log('Imagens encontradas:', results);

    res.json(results);
  });
});

// Rota para excluir uma imagem de um imóvel
router.delete("/imoveis/:id/imagens/:imageId", (req, res) => {
  const { id, imageId } = req.params;

  // Primeiro, busque o caminho da imagem na base de dados
  const selectSql = "SELECT caminho FROM imagens WHERE id = ? AND imovel_id = ?";
  db.query(selectSql, [imageId, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Imagem não encontrada." });
    }

    const imagePath = results[0].caminho;

    // Exclua o arquivo do sistema de arquivos (se necessário)
    const fs = require('fs');
    const path = require('path');
    const imageFullPath = path.join(__dirname, imagePath);

    fs.unlink(imageFullPath, (unlinkErr) => {
      if (unlinkErr) {
        return res.status(500).json({ error: "Erro ao excluir o arquivo de imagem." });
      }

      // Após excluir o arquivo, remova o registro do banco de dados
      const deleteSql = "DELETE FROM imagens WHERE id = ?";
      db.query(deleteSql, [imageId], (deleteErr) => {
        if (deleteErr) {
          return res.status(500).json({ error: deleteErr.message });
        }

        res.status(200).json({ message: "Imagem excluída com sucesso!" });
      });
    });
  });
});

module.exports = router;