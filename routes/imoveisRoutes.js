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


// NOVA ROTA DE ESTATÍSTICAS PARA O PAINEL
router.get("/imoveis/stats", (req, res) => {
  const sql = `
    SELECT
      COUNT(id) AS totalImoveis,
      SUM(CASE WHEN arrendatario IS NULL OR arrendatario = '' THEN 1 ELSE 0 END) AS proprios,
      SUM(CASE WHEN arrendatario IS NOT NULL AND arrendatario != '' THEN 1 ELSE 0 END) AS arrendados
    FROM imoveis;
  `;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Retorna o primeiro (e único) objeto do array de resultados
    res.json(results[0]);
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
  // SQL com as colunas novas de percentual
  const sql = `INSERT INTO imoveis (
    codigo_cc, descricao, area_imovel, area_plantio, especie, origem,
    num_arvores_plantadas, num_arvores_cortadas, num_arvores_remanescentes,
    num_arvores_por_hectare, matricula, data_plantio, data_contrato, 
    vencimento_contrato, numero_ccir, numero_itr, proprietario, 
    arrendatario, municipio, localidade, altura_desrama, numero_car,
    
    -- ADICIONE ESTAS NOVAS COLUNAS --
    percentual_arrendatario,
    percentual_arrendadores,
    area_plantio_arrendatario,
    area_plantio_arrendadores,
    data_divisao_percentual

  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`; // <-- Aumentou o número de '?'

  // Array de valores com os dados novos do req.body
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
    req.body.numero_car,

    // -- ADICIONE ESTES NOVOS VALORES NA MESMA ORDEM DA QUERY --
    req.body.percentual_arrendatario,
    req.body.percentual_arrendadores,
    req.body.area_plantio_arrendatario,
    req.body.area_plantio_arrendadores,
    req.body.data_divisao_percentual,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      // Se houver um erro, é útil logar os valores para depuração
      console.error("Erro ao inserir no DB:", err);
      console.error("Valores enviados:", values);
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
        // --- 1. CAPTURE OS NOVOS VALORES DO CORPO DA REQUISIÇÃO ---
        percentual_arrendatario,
        percentual_arrendadores,
        area_plantio_arrendatario,
        area_plantio_arrendadores,
        data_divisao_percentual,
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
            vencimento_contrato = ?,
            -- --- 2. ADICIONE AS NOVAS COLUNAS PARA ATUALIZAR ---
            percentual_arrendatario = ?,
            percentual_arrendadores = ?,
            area_plantio_arrendatario = ?,
            area_plantio_arrendadores = ?,
            data_divisao_percentual = ?
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
            // --- 3. PASSE OS NOVOS VALORES PARA A QUERY NA ORDEM CORRETA ---
            percentual_arrendatario,
            percentual_arrendadores,
            area_plantio_arrendatario,
            area_plantio_arrendadores,
            data_divisao_percentual,
            // O ID permanece no final para o WHERE
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

// Rota para excluir um imóvel pelo ID (VERSÃO CORRIGIDA COM TRANSAÇÃO)
router.delete("/imoveis/:id", (req, res) => {
  const { id } = req.params;

  // 1. Pegar uma conexão da pool
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Erro ao obter conexão do pool:", err);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }

    // 2. Iniciar a transação na conexão específica
    connection.beginTransaction((transactionErr) => {
      if (transactionErr) {
        connection.release(); // Sempre libere a conexão
        return res.status(500).json({ error: "Erro ao iniciar transação." });
      }

      // Funções de callback para os deletes em sequência
      const deleteImages = (callback) => {
        connection.query("DELETE FROM imagens WHERE imovel_id = ?", [id], callback);
      };
      const deleteDespesas = (callback) => {
        connection.query("DELETE FROM despesas WHERE imovel_id = ?", [id], callback);
      };
      const deleteDesramas = (callback) => {
        connection.query("DELETE FROM desramas WHERE imovel_id = ?", [id], callback);
      };
      const deleteDesbastes = (callback) => {
        connection.query("DELETE FROM desbaste WHERE imovel_id = ?", [id], callback);
      };
      const deleteInventario = (callback) => {
        connection.query("DELETE FROM inventario WHERE imovel_id = ?", [id], callback);
      };
      const deleteImovel = (callback) => {
        connection.query("DELETE FROM imoveis WHERE id = ?", [id], callback);
      };

      // 3. Executar todas as queries em sequência dentro da transação
      deleteImages((err) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({ error: "Erro ao excluir imagens." });
          });
        }
        deleteDespesas((err) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ error: "Erro ao excluir despesas." });
            });
          }
          deleteDesramas((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ error: "Erro ao excluir desramas." });
              });
            }
            deleteDesbastes((err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({ error: "Erro ao excluir desbastes." });
                });
              }
              deleteInventario((err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ error: "Erro ao excluir inventário." });
                  });
                }
                deleteImovel((err, result) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      res.status(500).json({ error: "Erro ao excluir o imóvel." });
                    });
                  }
                  if (result.affectedRows === 0) {
                      return connection.rollback(() => {
                          connection.release();
                          res.status(404).json({ message: "Imóvel não encontrado." });
                      });
                  }

                  // 4. Se tudo deu certo, comitar a transação
                  connection.commit((commitErr) => {
                    if (commitErr) {
                      return connection.rollback(() => {
                        connection.release();
                        res.status(500).json({ error: "Erro ao confirmar a exclusão." });
                      });
                    }

                    // 5. Liberar a conexão de volta para a pool
                    connection.release();
                    res.status(200).json({ message: "Imóvel e registros associados excluídos com sucesso." });
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
    tipo_imovel, // Adiciona o tipo de imóvel (próprio ou arrendado)
  } = req.body; // Captura os dados do imóvel do corpo da requisição

  // Define os valores de arrendatario, data_contrato e vencimento_contrato com base no tipo de imóvel
  const arrendatarioFinal = tipo_imovel === "arrendado" ? arrendatario : null;
  const dataContratoFinal = tipo_imovel === "arrendado" ? data_contrato : null;
  const vencimentoContratoFinal =
    tipo_imovel === "arrendado" ? vencimento_contrato : null;

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
      data_plantio = COALESCE(?, data_plantio),
      data_contrato = COALESCE(?, data_contrato),
      vencimento_contrato = COALESCE(?, vencimento_contrato)
    WHERE id = ?
  `;

  // Valores a serem atualizados
  const values = [
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
    arrendatarioFinal, // Usa o valor ajustado
    municipio,
    localidade,
    altura_desrama,
    numero_car,
    codigo_cc,
    data_plantio,
    dataContratoFinal, // Usa o valor ajustado
    vencimentoContratoFinal, // Usa o valor ajustado
    id,
  ];

  // Executa a query
  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Imóvel não encontrado." });
    }
    res.status(200).json({ message: "Imóvel atualizado com sucesso." });
  });
});


module.exports = router;