const express = require("express");
const db = require("../config/db");

const router = express.Router();

// Rota para registrar uma previsão de desrama associada a um imóvel
router.post("/imoveis/:id/desramas/previsao", (req, res) => {
  const { id } = req.params;
  const { previsao } = req.body;

  if (!previsao) {
    return res.status(400).json({ error: "O campo 'previsao' é obrigatório." });
  }

  const insertPrevisaoSql = `INSERT INTO desramas (imovel_id, previsao, altura, data, numero) VALUES (?, ?, NULL, NULL, NULL)`;
  
  db.query(insertPrevisaoSql, [id, previsao], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Previsão de desrama cadastrada com sucesso!" });
  });
});

router.get("/imoveis/:id/desramas/previsoes", (req, res) => {
  const { id } = req.params;

  const selectPrevisoesSql = `SELECT * FROM desramas WHERE imovel_id = ? AND altura IS NULL AND data IS NULL AND numero IS NULL AND previsao IS NOT NULL`;

  db.query(selectPrevisoesSql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Em vez de retornar erro 404, retorna lista vazia se não houver previsões
    res.status(200).json(results);
  });
});


// Rota para atualizar uma desrama
router.put("/desramas/:id", (req, res) => {
  const { id } = req.params;
  const { altura, data, numero } = req.body;

  if (!altura || !data || !numero) {
    return res.status(400).json({ error: "Todos os campos (altura, data, numero) são obrigatórios." });
  }

  const updateDesramaSql = `UPDATE desramas SET altura = ?, data = ?, numero = ? WHERE id = ?`;
  
  db.query(updateDesramaSql, [altura, data, numero, id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const getImovelIdSql = `SELECT imovel_id FROM desramas WHERE id = ?`;
    
    db.query(getImovelIdSql, [id], (getErr, rows) => {
      if (getErr) {
        return res.status(500).json({ error: getErr.message });
      }
      if (rows.length === 0) {
        return res.status(404).json({ error: "Desrama não encontrada." });
      }
      const imovelId = rows[0].imovel_id;
      
      const updateImovelSql = `UPDATE imoveis SET altura_desrama = altura_desrama + ? WHERE id = ?`;
      
      db.query(updateImovelSql, [altura, imovelId], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }
        res.status(200).json({ message: "Desrama atualizada com sucesso!" });
      });
    });
  });
});

// Rota para cadastrar uma desrama associada a um imóvel
router.post("/imoveis/:id/desramas", (req, res) => {
  const { id } = req.params;
  const { altura, data, numero } = req.body;

  if (!altura || !data || !numero) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const insertDesramaSql = `INSERT INTO desramas (imovel_id, altura, data, numero) VALUES (?, ?, ?, ?)`;
  
  db.query(insertDesramaSql, [id, altura, data, numero], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const updateImovelSql = `UPDATE imoveis SET altura_desrama = altura_desrama + ? WHERE id = ?`;
    
    db.query(updateImovelSql, [altura, id], (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ error: updateErr.message });
      }
      res.status(201).json({ message: "Desrama cadastrada e altura do imóvel atualizada com sucesso!" });
    });
  });
});

// Rota para listar TODAS AS DESRAMAS COMPLETAS de um imóvel específico
router.get("/imoveis/:id/desramas", (req, res) => {
  const { id } = req.params;
  
  // SQL ajustado para buscar apenas registros onde os campos principais não são nulos
  const sql = `
    SELECT * FROM desramas 
    WHERE imovel_id = ? 
      AND altura IS NOT NULL 
      AND data IS NOT NULL 
      AND numero IS NOT NULL
  `;
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Se não encontrar nenhum registro completo, retorna um 404 com a mensagem.
    // Isso corresponde ao comportamento que você está vendo.
    if (results.length === 0) {
      return res.status(404).json({ message: "Nenhum registro completo encontrado para este imóvel." });
    }

    // Se encontrar, envia a lista de desramas completas.
    res.status(200).json(results);
  });
});

// Rota para excluir uma desrama específica
router.delete("/imoveis/:id/desramas/:desramaId", (req, res) => {
  const { id, desramaId } = req.params;
  
  const selectDesramaSql = "SELECT altura FROM desramas WHERE id = ? AND imovel_id = ?";
  
  db.query(selectDesramaSql, [desramaId, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Desrama não encontrada." });
    }
    const alturaDesrama = results[0].altura;
    
    const deleteDesramaSql = "DELETE FROM desramas WHERE id = ? AND imovel_id = ?";
    
    db.query(deleteDesramaSql, [desramaId, id], (deleteErr) => {
      if (deleteErr) {
        return res.status(500).json({ error: deleteErr.message });
      }
      const updateImovelSql = `UPDATE imoveis SET altura_desrama = altura_desrama - ? WHERE id = ?`;
      
      db.query(updateImovelSql, [alturaDesrama, id], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }
        res.status(200).json({ message: "Desrama excluída e altura do imóvel atualizada com sucesso!" });
      });
    });
  });
});

module.exports = router;