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

    res.status(200).json(results); // Sempre retorna um array (pode ser vazio)
  });
});



// Rota para atualizar uma previsão de desbaste
router.put("/desbastes/:id", (req, res) => {
  const { id } = req.params;
  const { numero, data, arvores_cortadas, lenha, toretes, toras_20_25cm, toras_25_33cm, toras_acima_33cm, preco_lenha, preco_toretes, preco_toras_20_25cm, preco_toras_25_33cm, preco_toras_acima_33cm, valor_extracao } = req.body;

  if (!numero || !data || !arvores_cortadas || !lenha || !toretes || !toras_20_25cm || !toras_25_33cm || !toras_acima_33cm || !preco_lenha || !preco_toretes || !preco_toras_20_25cm || !preco_toras_25_33cm || !preco_toras_acima_33cm || !valor_extracao) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  // Obter o imovel_id pelo id do desbaste
  const getImovelIdSql = `SELECT imovel_id FROM desbaste WHERE id = ?`;
  db.query(getImovelIdSql, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) return res.status(404).json({ error: "Desbaste não encontrado." });

    const imovelId = result[0].imovel_id;

    // Obter dados do imóvel
    const getImovelSql = `SELECT num_arvores_cortadas, num_arvores_plantadas, area_plantio FROM imoveis WHERE id = ?`;
    db.query(getImovelSql, [imovelId], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.length === 0) return res.status(404).json({ error: "Imóvel não encontrado." });

      const { num_arvores_cortadas, num_arvores_plantadas, area_plantio } = result[0];
      const novasArvoresCortadas = Number(num_arvores_cortadas) + Number(arvores_cortadas);
      const arvoresRemanescentes = Number(num_arvores_plantadas) - novasArvoresCortadas;
      const num_arvores_por_hectare = area_plantio > 0 ? arvoresRemanescentes / area_plantio : 0;

      // Atualizar a tabela imoveis
      const updateImoveisSql = `
        UPDATE imoveis
        SET num_arvores_cortadas = ?, num_arvores_remanescentes = ?, num_arvores_por_hectare = ?
        WHERE id = ?
      `;
      db.query(updateImoveisSql, [novasArvoresCortadas, arvoresRemanescentes, num_arvores_por_hectare, imovelId], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // Atualizar a previsão de desbaste
        const updateDesbasteSql = `
          UPDATE desbaste
          SET numero = ?, data = ?, arvores_cortadas = ?, lenha = ?, toretes = ?, toras_20_25cm = ?, toras_25_33cm = ?, toras_acima_33cm = ?, preco_lenha = ?, preco_toretes = ?, preco_toras_20_25cm = ?, preco_toras_25_33cm = ?, preco_toras_acima_33cm = ?, valor_extracao = ?
          WHERE id = ?
        `;
        db.query(updateDesbasteSql, [
          numero, data, arvores_cortadas, lenha, toretes, toras_20_25cm, toras_25_33cm, toras_acima_33cm,
          preco_lenha, preco_toretes, preco_toras_20_25cm, preco_toras_25_33cm, preco_toras_acima_33cm,
          valor_extracao, id
        ], (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(200).json({ message: "Previsão de desbaste atualizada com sucesso!" });
        });
      });
    });
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
// Rota para excluir um desbaste (VERSÃO CORRIGIDA COM TRANSAÇÃO)
router.delete("/imoveis/:imovelId/desbastes/:desbasteId", (req, res) => {
  const { imovelId, desbasteId } = req.params;

  // 1. Pega uma conexão da pool
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Erro ao obter conexão do pool:", err);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }

    // 2. Inicia a transação na conexão específica
    connection.beginTransaction(transactionErr => {
      if (transactionErr) {
        connection.release();
        return res.status(500).json({ error: "Erro ao iniciar transação." });
      }

      // 3. Buscar os dados do desbaste que será excluído
      const selectDesbasteSql = "SELECT arvores_cortadas FROM desbaste WHERE id = ?";
      connection.query(selectDesbasteSql, [desbasteId], (err, desbasteResults) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({ error: err.message });
          });
        }
        if (desbasteResults.length === 0) {
          return connection.rollback(() => {
            connection.release();
            res.status(404).json({ message: "Desbaste não encontrado." });
          });
        }
        const arvoresCortadas = desbasteResults[0].arvores_cortadas;

        // 4. Buscar os dados atuais do imóvel
        const getImovelSql = "SELECT num_arvores_cortadas, num_arvores_plantadas, area_plantio FROM imoveis WHERE id = ?";
        connection.query(getImovelSql, [imovelId], (err, imovelResults) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ error: err.message });
            });
          }
          if (imovelResults.length === 0) {
            return connection.rollback(() => {
              connection.release();
              res.status(404).json({ message: "Imóvel não encontrado." });
            });
          }
          const { num_arvores_cortadas, num_arvores_plantadas, area_plantio } = imovelResults[0];

          // 5. Reverter as operações e atualizar o imóvel
          const novasArvoresCortadas = Number(num_arvores_cortadas) - Number(arvoresCortadas);
          const arvoresRemanescentes = Number(num_arvores_plantadas) - novasArvoresCortadas;
          const numArvoresPorHectare = area_plantio > 0 ? arvoresRemanescentes / area_plantio : 0;
          const updateImoveisSql = "UPDATE imoveis SET num_arvores_cortadas = ?, num_arvores_remanescentes = ?, num_arvores_por_hectare = ? WHERE id = ?";
          
          connection.query(updateImoveisSql, [novasArvoresCortadas, arvoresRemanescentes, numArvoresPorHectare, imovelId], (err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ error: err.message });
              });
            }

            // 6. Excluir o desbaste
            const deleteDesbasteSql = "DELETE FROM desbaste WHERE id = ?";
            connection.query(deleteDesbasteSql, [desbasteId], (err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({ error: err.message });
                });
              }

              // 7. Se tudo deu certo, comitar a transação
              connection.commit((commitErr) => {
                if (commitErr) {
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ error: "Erro ao confirmar a exclusão." });
                  });
                }
                
                // 8. Liberar a conexão de volta para a pool
                connection.release();
                res.status(200).json({ message: "Desbaste excluído e valores do imóvel revertidos com sucesso." });
              });
            });
          });
        });
      });
    });
  });
});

// Rota para buscar todas as previsões de desbaste por ano
router.get("/desbastes/previsoes/ano/:ano", (req, res) => {
  const { ano } = req.params;

  if (!ano || isNaN(parseInt(ano))) {
    return res.status(400).json({ error: "O ano fornecido é inválido." });
  }

  // Busca previsões que estão dentro do ano especificado
  const sql = `
    SELECT 
      d.id as previsao_id,
      d.previsao,
      i.id as imovel_id,
      i.codigo_cc,
      i.descricao,
      i.proprietario
    FROM desbaste d
    JOIN imoveis i ON d.imovel_id = i.id
    WHERE 
      d.previsao IS NOT NULL AND 
      YEAR(d.previsao) = ?
    ORDER BY i.codigo_cc
  `;

  db.query(sql, [ano], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});


module.exports = router;