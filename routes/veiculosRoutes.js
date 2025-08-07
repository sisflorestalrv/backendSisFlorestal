// routes/veiculosRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Função para remover a formatação da moeda (ex: "R$ 1.234,56" -> 1234.56)
const parseCurrency = (value) => {
    if (typeof value !== 'string') return value;
    const number = parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
    return isNaN(number) ? 0 : number;
};

// --- Rota para buscar todos os motoristas (ID e Nome Completo) ---
router.get("/motoristas", (req, res) => {
    const sql = `
        SELECT 
            m.id, 
            m.nome_completo 
        FROM motoristas m
        JOIN usuarios u ON m.usuario_id = u.id
        WHERE u.tipo_usuario = 'motorista'
        ORDER BY m.nome_completo ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar motoristas:", err);
            return res.status(500).json({ error: "Erro interno ao buscar os motoristas." });
        }
        res.json(results);
    });
});


// --- Rota para cadastrar um novo veículo ---
router.post("/veiculos", (req, res) => {
    const {
        tipoVeiculo, marca, modelo, anoFabricacao, anoModelo,
        placa, renavam, chassi, cor, potenciaMotor,
        quilometragem, tipoCombustivel, capacidadeTanque, dataAquisicao,
        valorAquisicao, codigo_cc, observacoes,
        motorista_id
    } = req.body;

    if (!tipoVeiculo || !marca || !modelo || !anoFabricacao || !anoModelo || !placa || !renavam || !chassi || !cor || !quilometragem || !tipoCombustivel || !capacidadeTanque || !dataAquisicao || !valorAquisicao) {
        return res.status(400).json({ error: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    const sql = `
        INSERT INTO veiculos (
            tipoVeiculo, marca, modelo, anoFabricacao, anoModelo, placa, renavam, 
            chassi, cor, potenciaMotor, quilometragem, tipoCombustivel, capacidadeTanque, 
            dataAquisicao, valorAquisicao, codigo_cc, observacoes, motorista_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        tipoVeiculo, marca, modelo, anoFabricacao, anoModelo,
        placa, renavam, chassi, cor, 
        potenciaMotor || null,
        quilometragem,
        tipoCombustivel, capacidadeTanque, dataAquisicao,
        parseCurrency(valorAquisicao),
        codigo_cc || null,
        observacoes,
        motorista_id || null
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: `Veículo com dados duplicados (placa, renavam ou chassi) já existe.` });
            }
            console.error("Erro ao inserir veículo:", err);
            return res.status(500).json({ error: "Erro interno ao cadastrar o veículo." });
        }
        res.status(201).json({ message: "Veículo cadastrado com sucesso!", id: result.insertId });
    });
});

// --- Rota para obter todos os veículos (com nome do motorista) ---
router.get("/veiculos", (req, res) => {
    const sql = `
        SELECT 
            v.*, 
            m.nome_completo AS motorista_nome 
        FROM veiculos v
        LEFT JOIN motoristas m ON v.motorista_id = m.id
        ORDER BY v.marca, v.modelo
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar veículos:", err);
            return res.status(500).json({ error: "Erro interno ao buscar os veículos." });
        }
        res.json(results);
    });
});

// --- Rota para obter um veículo pelo ID (com nome e CNH do motorista) ---
router.get("/veiculos/:id", (req, res) => {
    const { id } = req.params;
    // ATUALIZAÇÃO: Adicionado 'm.numero_habilitacao' ao SELECT
    const sql = `
        SELECT 
            v.*, 
            m.nome_completo AS motorista_nome,
            m.numero_habilitacao AS motorista_cnh 
        FROM veiculos v
        LEFT JOIN motoristas m ON v.motorista_id = m.id
        WHERE v.id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar veículo por ID:", err);
            return res.status(500).json({ error: "Erro interno ao buscar o veículo." });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Veículo não encontrado." });
        }
        // Envia o objeto do veículo com os campos 'motorista_nome' e 'motorista_cnh'
        res.json(results[0]);
    });
});

// --- Rota para excluir um veículo ---
router.delete("/veiculos/:id", (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM veiculos WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Erro ao excluir veículo:", err);
            return res.status(500).json({ error: "Erro interno ao excluir o veículo." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Veículo não encontrado." });
        }
        res.status(200).json({ message: "Veículo excluído com sucesso!" });
    });
});

// --- Rota para atualizar um veículo (PUT) ---
router.put("/veiculos/:id", (req, res) => {
    const { id } = req.params;
    const {
        tipoVeiculo, marca, modelo, anoFabricacao, anoModelo,
        placa, renavam, chassi, cor, potenciaMotor,
        quilometragem, tipoCombustivel, capacidadeTanque, dataAquisicao,
        valorAquisicao, codigo_cc, observacoes,
        motorista_id
    } = req.body;

    if (!tipoVeiculo || !marca || !modelo || !placa || !quilometragem) {
        return res.status(400).json({ error: "Campos essenciais como tipo, marca, modelo, placa e quilometragem são obrigatórios." });
    }

    const sql = `
        UPDATE veiculos SET
            tipoVeiculo = ?, marca = ?, modelo = ?, anoFabricacao = ?, anoModelo = ?,
            placa = ?, renavam = ?, chassi = ?, cor = ?, potenciaMotor = ?, 
            quilometragem = ?, tipoCombustivel = ?, capacidadeTanque = ?, dataAquisicao = ?,
            valorAquisicao = ?, codigo_cc = ?, observacoes = ?, motorista_id = ?
        WHERE id = ?
    `;

    const values = [
        tipoVeiculo, marca, modelo, anoFabricacao, anoModelo,
        placa, renavam, chassi, cor, 
        potenciaMotor || null,
        quilometragem,
        tipoCombustivel, capacidadeTanque, dataAquisicao,
        parseCurrency(valorAquisicao),
        codigo_cc || null,
        observacoes,
        motorista_id || null,
        id
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: `Dados duplicados. A placa, renavam ou chassi já pertencem a outro veículo.` });
            }
            console.error("Erro ao atualizar veículo:", err);
            return res.status(500).json({ error: "Erro interno ao atualizar o veículo." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Veículo não encontrado." });
        }
        res.status(200).json({ message: "Veículo atualizado com sucesso!" });
    });
});

module.exports = router;
