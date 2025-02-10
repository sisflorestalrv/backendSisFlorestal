const express = require("express");
const db = require("../config/db"); // Importa a conexão com o banco de dados

const router = express.Router();

// Rota para registrar uma despesa específica associada a um imóvel
router.post("/imoveis/:id/despesas", (req, res) => {
  const { id } = req.params; // ID do imóvel
  const {
    data,
    descricao,
    numero_nota_fiscal,
    fornecedor,
    produto,
    unidade,
    quantidade,
    valor_unitario,
    total,
    tipo_de_despesa,
    validade,
  } = req.body;

  // Validação dos campos obrigatórios
  if (
    !data ||
    !descricao ||
    !numero_nota_fiscal ||
    !fornecedor ||
    !produto ||
    !unidade ||
    quantidade === undefined ||
    valor_unitario === undefined ||
    total === undefined ||
    !tipo_de_despesa ||
    !validade
  ) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  // Inserção da despesa no banco de dados
  const sql = `
    INSERT INTO despesas (
      imovel_id, data, descricao, numero_nota_fiscal, fornecedor, produto,
      unidade, quantidade, valor_unitario, total, tipo_de_despesa, validade
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    id, data, descricao, numero_nota_fiscal, fornecedor, produto, unidade,
    quantidade, valor_unitario, total, tipo_de_despesa, validade
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Despesa registrada com sucesso!" });
  });
});

// Rota para obter todas as despesas de um imóvel específico
router.get("/imoveis/:id/despesas", (req, res) => {
  const { id } = req.params; // Captura o ID do imóvel

  // SQL para buscar as despesas associadas ao imóvel e o código CC do imóvel
  const sql = `
    SELECT despesas.*, imoveis.codigo_cc
    FROM despesas
    INNER JOIN imoveis ON despesas.imovel_id = imoveis.id
    WHERE imoveis.id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Nenhuma despesa encontrada para este imóvel." });
    }
    res.json(results);  // Envia os resultados da consulta para o frontend, agora com o código cc
  });
});

// Rota para obter todas as despesas
router.get("/despesas", (req, res) => {
  // Modificando a consulta para incluir todos os campos das despesas e a descrição do imóvel
  const sql = `
    SELECT despesas.*, imoveis.descricao AS descricao_imovel
    FROM despesas
    JOIN imoveis ON despesas.imovel_id = imoveis.id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Rota para excluir uma despesa
router.delete("/despesas/:id", (req, res) => {
  const { id } = req.params; // ID da despesa a ser excluída

  // SQL para excluir a despesa
  const deleteDespesaSql = `DELETE FROM despesas WHERE id = ?`;

  db.query(deleteDespesaSql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Despesa não encontrada." });
    }

    res.status(200).json({ message: "Despesa excluída com sucesso!" });
  });
});

module.exports = router;