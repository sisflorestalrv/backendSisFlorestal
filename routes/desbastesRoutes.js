// routes/desbastesRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Rota para cadastrar uma previsão de desbaste
router.post("/imoveis/:id/desbastes/previsao", (req, res) => {
  const { id } = req.params;
  const { previsao, numero, data, arvores_cortadas, lenha, toretes, toras_20_25cm, toras_25_33cm, toras_acima_33cm, preco_lenha, preco_toretes, preco_toras_20_25cm, preco_toras_25_33cm, preco_toras_acima_33cm, valor_extracao } = req.body;

  if (!previsao) {
    return res.status(400).json({ error: "O campo 'previsao' é obrigatório." });
  }

  const insertDesbasteSql = `
    INSERT INTO desbaste (
      imovel_id, numero, data, arvores_cortadas, lenha, toretes, toras_20_25cm, toras_25_33cm, toras_acima_33cm, 
      preco_lenha, preco_toretes, preco_toras_20_25cm, preco_toras_25_33cm, preco_toras_acima_33cm, valor_extracao, previsao
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(insertDesbasteSql, [
    id, 
    numero || null, 
    data || null, 
    arvores_cortadas || null, 
    lenha || null, 
    toretes || null, 
    toras_20_25cm || null, 
    toras_25_33cm || null, 
    toras_acima_33cm || null, 
    preco_lenha || null, 
    preco_toretes || null, 
    preco_toras_20_25cm || null, 
    preco_toras_25_33cm || null, 
    preco_toras_acima_33cm || null, 
    valor_extracao || null, 
    previsao
  ], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({ message: "Previsão de desbaste cadastrada com sucesso!" });
  });
});

// Rota para listar previsões de desbaste
router.get("/imoveis/:id/desbastes/previsoes", (req, res) => {
  const { id } = req.params;

  const selectPrevisoesSql = `
    SELECT * 
    FROM desbaste 
    WHERE imovel_id = ? 
      AND arvores_cortadas IS NULL 
      AND lenha IS NULL 
      AND toretes IS NULL 
      AND toras_20_25cm IS NULL 
      AND toras_25_33cm IS NULL 
      AND toras_acima_33cm IS NULL 
      AND previsao IS NOT NULL
  `;

  db.query(selectPrevisoesSql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Nenhuma previsão encontrada para este imóvel." });
    }

    res.status(200).json(results);
  });
});

// Rota para atualizar uma previsão de desbaste
router.put("/desbastes/:id", (req, res) => {
  const { id } = req.params;
  const { numero, data, arvores_cortadas, lenha, toretes, toras_20_25cm, toras_25_33cm, toras_acima_33cm, preco_lenha, preco_toretes, preco_toras_20_25cm, preco_toras_25_33cm, preco_toras_acima_33cm, valor_extracao } = req.body;

  if (!numero || !data || !arvores_cortadas || !lenha || !toretes || !toras_20_25cm || !toras_25_33cm || !toras_acima_33cm || !preco_lenha || !preco_toretes || !preco_toras_20_25cm || !preco_toras_25_33cm || !preco_toras_acima_33cm || !valor_extracao) {
    return res.status(400).json({ error: "Todos os campos (número, data, árvores cortadas, lenha, toretes, toras, preços, valor de extração) são obrigatórios." });
  }

  const updateDesbasteSql = `
    UPDATE desbaste
    SET numero = ?, data = ?, arvores_cortadas = ?, lenha = ?, toretes = ?, toras_20_25cm = ?, toras_25_33cm = ?, toras_acima_33cm = ?, preco_lenha = ?, preco_toretes = ?, preco_toras_20_25cm = ?, preco_toras_25_33cm = ?, preco_toras_acima_33cm = ?, valor_extracao = ?
    WHERE id = ?
  `;

  db.query(updateDesbasteSql, [
    numero, 
    data, 
    arvores_cortadas, 
    lenha, 
    toretes, 
    toras_20_25cm, 
    toras_25_33cm, 
    toras_acima_33cm, 
    preco_lenha, 
    preco_toretes, 
    preco_toras_20_25cm, 
    preco_toras_25_33cm, 
    preco_toras_acima_33cm, 
    valor_extracao, 
    id
  ], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(200).json({ message: "Previsão de desbaste atualizada com sucesso!" });
  });
});

// Rota para listar desbastes completos
router.get("/imoveis/:id/desbastes", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT * 
    FROM desbaste 
    WHERE imovel_id = ? 
      AND numero IS NOT NULL 
      AND data IS NOT NULL 
      AND arvores_cortadas IS NOT NULL 
      AND lenha IS NOT NULL 
      AND toretes IS NOT NULL 
      AND toras_20_25cm IS NOT NULL 
      AND toras_25_33cm IS NOT NULL 
      AND toras_acima_33cm IS NOT NULL 
      AND preco_lenha IS NOT NULL 
      AND preco_toretes IS NOT NULL 
      AND preco_toras_20_25cm IS NOT NULL 
      AND preco_toras_25_33cm IS NOT NULL 
      AND preco_toras_acima_33cm IS NOT NULL 
      AND valor_extracao IS NOT NULL;
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Nenhum registro completo encontrado para este imóvel." });
    }

    res.json(results);
  });
});

// Rota para excluir um desbaste
router.delete("/imoveis/:imovelId/desbastes/:desbasteId", (req, res) => {
  const { imovelId, desbasteId } = req.params;

  const selectDesbasteSql = "SELECT arvores_cortadas FROM desbaste WHERE id = ?";
  
  db.query(selectDesbasteSql, [desbasteId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Desbaste não encontrado." });
    }

    const arvoresCortadas = results[0].arvores_cortadas;

    const updateArvoresCortadasSql = `
      UPDATE imoveis
      SET num_arvores_cortadas = num_arvores_cortadas - ?
      WHERE id = ?
    `;
    
    const deleteDesbasteSql = "DELETE FROM desbaste WHERE id = ?";

    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao iniciar transação." });
      }

      db.query(updateArvoresCortadasSql, [arvoresCortadas, imovelId], (err) => {
        if (err) {
          return db.rollback(() => res.status(500).json({ error: err.message }));
        }

        db.query(deleteDesbasteSql, [desbasteId], (err) => {
          if (err) {
            return db.rollback(() => res.status(500).json({ error: err.message }));
          }

          db.commit((err) => {
            if (err) {
              return db.rollback(() => res.status(500).json({ error: err.message }));
            }

            res.status(200).json({ message: "Desbaste excluído com sucesso e número de árvores cortadas atualizado." });
          });
        });
      });
    });
  });
});

module.exports = router;