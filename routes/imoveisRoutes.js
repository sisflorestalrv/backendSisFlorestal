const express = require("express");
const db = require("../config/db"); // Importa a conexão com o banco de dados

const router = express.Router();

// Rota para obter todos os imóveis
router.get("/imoveis", (req, res) => {
  const sql = "SELECT * FROM imoveis";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Rota para obter os detalhes de um imóvel pelo ID
router.get("/imoveis/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM imoveis WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: "Imóvel não encontrado" });
    }
    res.json(result[0]);
  });
});

// Rota para cadastrar um imóvel
router.post("/imoveis", (req, res) => {
  const sql = `INSERT INTO imoveis (
    codigo_cc, descricao, area_imovel, area_plantio, especie, origem,
    num_arvores_plantadas, num_arvores_cortadas, num_arvores_remanescentes,
    num_arvores_por_hectare, matricula, data_plantio, data_contrato, 
    vencimento_contrato, numero_ccir, numero_itr, proprietario, 
    arrendatario, municipio, localidade, altura_desrama, numero_car
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`; // Adicionado numero_car

  const values = [
    req.body.codigo_cc,
    req.body.descricao,
    req.body.area_imovel,
    req.body.area_plantio,
    req.body.especie,
    req.body.origem,
    req.body.num_arvores_plantadas,
    req.body.num_arvores_cortadas,
    req.body.num_arvores_remanescentes,
    req.body.num_arvores_por_hectare,
    req.body.matricula,
    req.body.data_plantio,
    req.body.data_contrato,
    req.body.vencimento_contrato,
    req.body.numero_ccir,
    req.body.numero_itr,
    req.body.proprietario,
    req.body.arrendatario,
    req.body.municipio,
    req.body.localidade,
    req.body.altura_desrama,
    req.body.numero_car, // Adicionado no array de valores
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Imóvel cadastrado com sucesso!" });
  });
});

// Rota para editar as informações de um imóvel
router.put("/imoveis/:id", (req, res) => {
  const { id } = req.params; // Captura o ID do imóvel
  const {
    descricao,
    area_imovel,
    area_plantio,
    especie,
    origem,
    num_arvores_plantadas,
    num_arvores_cortadas,
    num_arvores_remanescentes,
    num_arvores_por_hectare,
    matricula,
    numero_ccir,
    numero_itr,
    proprietario,
    arrendatario,
    municipio,
    localidade,
    altura_desrama,
    numero_car,
    codigo_cc,
    data_plantio,
    data_contrato,
    vencimento_contrato,
  } = req.body; // Captura os dados do imóvel do corpo da requisição

  // SQL para atualizar as informações do imóvel
  const sql = `
    UPDATE imoveis
    SET
      descricao = ?,
      area_imovel = ?,
      area_plantio = ?,
      especie = ?,
      origem = ?,
      num_arvores_plantadas = ?,
      num_arvores_cortadas = ?,
      num_arvores_remanescentes = ?,
      num_arvores_por_hectare = ?,
      matricula = ?,
      numero_ccir = ?,
      numero_itr = ?,
      proprietario = ?,
      arrendatario = ?,
      municipio = ?,
      localidade = ?,
      altura_desrama = ?,
      numero_car = ?,
      codigo_cc = ?,
      data_plantio = ?,
      data_contrato = ?,
      vencimento_contrato = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      descricao,
      area_imovel,
      area_plantio,
      especie,
      origem,
      num_arvores_plantadas,
      num_arvores_cortadas,
      num_arvores_remanescentes,
      num_arvores_por_hectare,
      matricula,
      numero_ccir,
      numero_itr,
      proprietario,
      arrendatario,
      municipio,
      localidade,
      altura_desrama,
      numero_car,
      codigo_cc,
      data_plantio,
      data_contrato,
      vencimento_contrato,
      id,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Imóvel não encontrado." });
      }
      res.status(200).json({ message: "Imóvel atualizado com sucesso." });
    }
  );
});

// Rota para excluir um imóvel pelo ID
router.delete("/imoveis/:id", (req, res) => {
  const { id } = req.params;

  // Verificar se o imóvel existe
  const checkSql = "SELECT * FROM imoveis WHERE id = ?";
  db.query(checkSql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Imóvel não encontrado." });
    }

    // Excluir registros associados ao imóvel, como imagens, despesas, etc.
    const deleteImagesSql = "DELETE FROM imagens WHERE imovel_id = ?";
    const deleteDespesasSql = "DELETE FROM despesas WHERE imovel_id = ?";
    const deleteDesramasSql = "DELETE FROM desramas WHERE imovel_id = ?";
    const deleteDesbastesSql = "DELETE FROM desbaste WHERE imovel_id = ?";
    const deleteInventarioSql = "DELETE FROM inventario WHERE imovel_id = ?";
    const deleteImovelSql = "DELETE FROM imoveis WHERE id = ?";

    // Iniciar transação
    db.beginTransaction((transactionErr) => {
      if (transactionErr) {
        return res.status(500).json({ error: "Erro ao iniciar transação." });
      }

      // Excluir imagens associadas
      db.query(deleteImagesSql, [id], (imageErr) => {
        if (imageErr) {
          return db.rollback(() =>
            res.status(500).json({ error: imageErr.message })
          );
        }

        // Excluir despesas associadas
        db.query(deleteDespesasSql, [id], (despesaErr) => {
          if (despesaErr) {
            return db.rollback(() =>
              res.status(500).json({ error: despesaErr.message })
            );
          }

          // Excluir desramas associadas
          db.query(deleteDesramasSql, [id], (desramaErr) => {
            if (desramaErr) {
              return db.rollback(() =>
                res.status(500).json({ error: desramaErr.message })
              );
            }

            // Excluir desbastes associados
            db.query(deleteDesbastesSql, [id], (desbasteErr) => {
              if (desbasteErr) {
                return db.rollback(() =>
                  res.status(500).json({ error: desbasteErr.message })
                );
              }

              // Excluir inventário associado
              db.query(deleteInventarioSql, [id], (inventarioErr) => {
                if (inventarioErr) {
                  return db.rollback(() =>
                    res.status(500).json({ error: inventarioErr.message })
                  );
                }

                // Excluir o imóvel
                db.query(deleteImovelSql, [id], (imovelErr) => {
                  if (imovelErr) {
                    return db.rollback(() =>
                      res.status(500).json({ error: imovelErr.message })
                    );
                  }

                  // Confirmar transação
                  db.commit((commitErr) => {
                    if (commitErr) {
                      return db.rollback(() =>
                        res
                          .status(500)
                          .json({ error: "Erro ao confirmar transação." })
                      );
                    }

                    res.status(200).json({
                      message: "Imóvel e registros associados excluídos com sucesso.",
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// Rota para verificar se o código CC já existe
router.get("/verificarCodigoCC", (req, res) => {
  const { codigo_cc } = req.query; // Obtém o código CC via query string

  if (!codigo_cc) {
    return res.status(400).json({ error: "Código CC é obrigatório." });
  }

  const sql = "SELECT * FROM imoveis WHERE codigo_cc = ?";

  db.query(sql, [codigo_cc], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      return res.json({ exists: true }); // Se o código CC já existe
    } else {
      return res.json({ exists: false }); // Se o código CC não existe
    }
  });
});

module.exports = router;