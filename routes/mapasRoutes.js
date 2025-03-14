const path = require('path');
const fs = require('fs');
const multer = require('multer');
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Configuração do Multer para o upload de mapas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'mapas'); // Pasta na raiz
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true }); // Cria a pasta se não existir
    }
    cb(null, uploadPath); // Destino dos uploads
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

  const selectSql = "SELECT caminho FROM mapas WHERE id = ? AND imovel_id = ?";
  db.query(selectSql, [mapaId, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Mapa não encontrado." });
    }

    const filePath = results[0].caminho;
    const fileFullPath = path.join(__dirname, filePath);

    fs.unlink(fileFullPath, (unlinkErr) => {
      if (unlinkErr) {
        return res.status(500).json({ error: "Erro ao excluir o mapa." });
      }

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

// Rota para baixar o mapa
router.get("/mapas/download/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '..', 'uploads', 'mapas', filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath); // Permite o download do arquivo
  } else {
    res.status(404).json({ error: "Arquivo não encontrado." });
  }
});

module.exports = router;
