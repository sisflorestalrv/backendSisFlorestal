const express = require("express");
const db = require("../config/db");

const router = express.Router();

// Rota para salvar a localização de um imóvel específico
router.post("/api/imoveis/:id/localizacao", (req, res) => {
    const { id } = req.params;  // Captura o ID do imóvel da URL
    const { latitude, longitude } = req.body; // Captura a latitude e longitude do corpo da requisição
  
    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Latitude e longitude são obrigatórios" });
    }
  
    const sql = "INSERT INTO localizacoes (imovel_id, latitude, longitude) VALUES (?, ?, ?)";
    const values = [id, latitude, longitude];
  
    db.query(sql, values, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: "Localização salva com sucesso!" });
    });
  });
  
  // Rota para listar as localizações de um imóvel
  router.get("/api/imoveis/:id/localizacao", (req, res) => {
    const { id } = req.params;  // Captura o ID do imóvel da URL
  
    const sql = "SELECT * FROM localizacoes WHERE imovel_id = ?";
    db.query(sql, [id], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    });
  });

module.exports = router;