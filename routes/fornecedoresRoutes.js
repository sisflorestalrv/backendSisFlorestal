// routes/fornecedoresRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../auth/authMiddleware");

// Rota para CRIAR um novo fornecedor
router.post("/fornecedores", authMiddleware, (req, res) => {
    const { nome_empresa, cnpj, inscricao_estadual, endereco, telefone, email, contato_principal } = req.body;

    if (!nome_empresa) {
        return res.status(400).json({ error: "O nome da empresa é obrigatório." });
    }

    const sql = `INSERT INTO fornecedores (nome_empresa, cnpj, inscricao_estadual, endereco, telefone, email, contato_principal) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [nome_empresa, cnpj || null, inscricao_estadual || null, endereco || null, telefone || null, email || null, contato_principal || null];

    db.query(sql, values, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: "Já existe um fornecedor com este CNPJ." });
            }
            console.error("Erro ao criar fornecedor:", err);
            return res.status(500).json({ error: "Erro interno ao criar o fornecedor." });
        }
        res.status(201).json({ message: "Fornecedor criado com sucesso!", id: result.insertId });
    });
});

// Rota para LISTAR todos os fornecedores
router.get("/fornecedores", authMiddleware, (req, res) => {
    const sql = "SELECT * FROM fornecedores ORDER BY nome_empresa ASC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar fornecedores:", err);
            return res.status(500).json({ error: "Erro interno ao buscar os fornecedores." });
        }
        res.json(results);
    });
});

// Rota para ATUALIZAR um fornecedor
router.put("/fornecedores/:id", authMiddleware, (req, res) => {
    const { id } = req.params;
    const { nome_empresa, cnpj, inscricao_estadual, endereco, telefone, email, contato_principal } = req.body;

    if (!nome_empresa) {
        return res.status(400).json({ error: "O nome da empresa é obrigatório." });
    }

    const sql = `UPDATE fornecedores SET nome_empresa = ?, cnpj = ?, inscricao_estadual = ?, endereco = ?, telefone = ?, email = ?, contato_principal = ? WHERE id = ?`;
    const values = [nome_empresa, cnpj || null, inscricao_estadual || null, endereco || null, telefone || null, email || null, contato_principal || null, id];

    db.query(sql, values, (err, result) => {
        if (err) {
             if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: "Já existe um fornecedor com este CNPJ." });
            }
            console.error("Erro ao atualizar fornecedor:", err);
            return res.status(500).json({ error: "Erro interno ao atualizar o fornecedor." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Fornecedor não encontrado." });
        }
        res.status(200).json({ message: "Fornecedor atualizado com sucesso!" });
    });
});

// Rota para DELETAR um fornecedor
router.delete("/fornecedores/:id", authMiddleware, (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM fornecedores WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Erro ao deletar fornecedor:", err);
            return res.status(500).json({ error: "Erro interno ao deletar o fornecedor." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Fornecedor não encontrado." });
        }
        res.status(200).json({ message: "Fornecedor deletado com sucesso!" });
    });
});

// Rota para buscar UM fornecedor pelo ID
router.get("/fornecedores/:id", authMiddleware, (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM fornecedores WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Erro ao buscar fornecedor:", err);
            return res.status(500).json({ error: "Erro interno ao buscar o fornecedor." });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Fornecedor não encontrado." });
        }
        res.json(result[0]); // Retorna o primeiro (e único) resultado
    });
});


module.exports = router;