// routes/veiculosRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../auth/authMiddleware");

// =======================================================================
// ========================= ROTA DE STATS ===============================
// =======================================================================

router.get("/frota/stats", authMiddleware, async (req, res) => {
    try {
        const connection = await db.promise().getConnection();
        
        const totalVeiculosQuery = "SELECT COUNT(id) as total FROM veiculos";
        const emManutencaoQuery = "SELECT COUNT(id) as emManutencao FROM veiculos WHERE status_manutencao = 'in-progress'";
        const disponiveisQuery = "SELECT COUNT(id) as disponiveis FROM veiculos WHERE status_manutencao = 'disponivel'";
        const agendadasQuery = "SELECT COUNT(id) as agendadas FROM veiculos WHERE status_manutencao = 'to-do'";

        const [
            totalRows,
            manutencaoRows,
            disponiveisRows,
            agendadasRows
        ] = await Promise.all([
            connection.query(totalVeiculosQuery),
            connection.query(emManutencaoQuery),
            connection.query(disponiveisQuery),
            connection.query(agendadasQuery)
        ]);
        
        connection.release();

        const totalResult = totalRows[0][0];
        const manutencaoResult = manutencaoRows[0][0];
        const disponiveisResult = disponiveisRows[0][0];
        const agendadasResult = agendadasRows[0][0];

        res.json({
            totalVeiculos: totalResult.total,
            emManutencao: manutencaoResult.emManutencao,
            disponiveis: disponiveisResult.disponiveis,
            agendadas: agendadasResult.agendadas
        });

    } catch (err) {
        console.error("Erro ao buscar estatísticas da frota:", err);
        res.status(500).json({ error: "Erro interno ao buscar estatísticas." });
    }
});

// --- Rota para buscar todos os motoristas (ID e Nome Completo) ---
router.get("/motoristas", authMiddleware, (req, res) => {
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
router.post("/veiculos", authMiddleware, (req, res) => {
    const {
        tipoVeiculo, marca, modelo, anoFabricacao, anoModelo,
        placa, renavam, chassi, cor, potenciaMotor,
        quilometragem, tipoCombustivel, capacidadeTanque,
        codigo_cc, observacoes, motorista_id,
        vencimentoAET, vencimento_aet_estadual,
        vencimentoCronotacografo, vencimentoDocumentos,
        horimetro 
    } = req.body;

    // 1. Validação dos campos que são considerados essenciais para qualquer veículo.
    const camposEssenciais = { tipoVeiculo, marca, modelo, chassi };
    for (const campo in camposEssenciais) {
        if (!camposEssenciais[campo]) {
            return res.status(400).json({ error: `O campo '${campo}' é obrigatório.` });
        }
    }

    // Validação condicional para combustível e placa
    if (tipoVeiculo !== 'SEMIRREBOQUE') { // CORREÇÃO: Removido '&& tipoVeiculo !== 'MAQUINA''
        if (!tipoCombustivel || !capacidadeTanque) {
            return res.status(400).json({ error: "Para este tipo de veículo, o Tipo de Combustível e a Capacidade do Tanque são obrigatórios." });
        }
    }
    
    // Placa não é obrigatória para MÁQUINA
    if (tipoVeiculo !== 'MAQUINA' && tipoVeiculo !== 'SEMIRREBOQUE') {
         if (!placa) {
            return res.status(400).json({ error: "O campo 'placa' é obrigatório para este tipo de veículo." });
        }
    }

    // Validação de horímetro vs quilometragem
    if (tipoVeiculo === 'MAQUINA') {
        if (horimetro === null || horimetro === undefined || horimetro < 0) {
             return res.status(400).json({ error: "O campo 'horímetro' é obrigatório para máquinas." });
        }
    } else {
         if (quilometragem === null || quilometragem === undefined || quilometragem < 0) {
             return res.status(400).json({ error: "O campo 'quilometragem' é obrigatório." });
        }
    }

    const sql = `
        INSERT INTO veiculos (
            tipoVeiculo, marca, modelo, anoFabricacao, anoModelo, placa, renavam, 
            chassi, cor, potenciaMotor, quilometragem, tipoCombustivel, capacidadeTanque, 
            codigo_cc, observacoes, motorista_id,
            vencimentoAET, vencimento_aet_estadual,
            vencimentoCronotacografo, vencimentoDocumentos,
            horimetro
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        tipoVeiculo,
        marca,
        modelo,
        anoFabricacao || null, 
        anoModelo || null,
        tipoVeiculo === 'MAQUINA' ? null : placa,
        tipoVeiculo === 'MAQUINA' ? null : (renavam || null),
        chassi,
        cor,
        ['SEMIRREBOQUE'].includes(tipoVeiculo) || !potenciaMotor ? null : potenciaMotor,
        tipoVeiculo === 'MAQUINA' ? null : quilometragem,
        tipoVeiculo === 'SEMIRREBOQUE' ? null : tipoCombustivel, // CORREÇÃO: Removido 'MAQUINA'
        tipoVeiculo === 'SEMIRREBOQUE' ? null : capacidadeTanque, // CORREÇÃO: Removido 'MAQUINA'
        codigo_cc || null,
        observacoes || null,
        motorista_id || null,
        vencimentoAET || null,
        vencimento_aet_estadual || null,
        vencimentoCronotacografo || null,
        vencimentoDocumentos || null,
        tipoVeiculo === 'MAQUINA' ? horimetro : null
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
router.get("/veiculos", authMiddleware, (req, res) => {
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

// --- Rota para obter um veículo pelo ID ---
router.get("/veiculos/:id", authMiddleware, (req, res) => {
    const { id } = req.params;
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
        res.json(results[0]);
    });
});

// --- Rota para excluir um veículo ---
router.delete("/veiculos/:id", authMiddleware, (req, res) => {
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
router.put("/veiculos/:id", authMiddleware, (req, res) => {
    const { id } = req.params;
    const {
        tipoVeiculo, marca, modelo, anoFabricacao, anoModelo,
        placa, renavam, chassi, cor, potenciaMotor,
        quilometragem, tipoCombustivel, capacidadeTanque,
        codigo_cc, observacoes, motorista_id,
        vencimentoAET, vencimento_aet_estadual,
        vencimentoCronotacografo, vencimentoDocumentos,
        horimetro
    } = req.body;

    const camposEssenciais = { tipoVeiculo, marca, modelo, chassi };
    for (const campo in camposEssenciais) {
        if (!camposEssenciais[campo]) {
            return res.status(400).json({ error: `O campo '${campo}' é obrigatório.` });
        }
    }

    // Validação condicional
    if (tipoVeiculo !== 'SEMIRREBOQUE') { // CORREÇÃO: Removido '&& tipoVeiculo !== 'MAQUINA''
        if (!tipoCombustivel || !capacidadeTanque) {
            return res.status(400).json({ error: "Para este tipo de veículo, o Tipo de Combustível e a Capacidade do Tanque são obrigatórios." });
        }
    }

    if (tipoVeiculo !== 'MAQUINA' && tipoVeiculo !== 'SEMIRREBOQUE') {
         if (!placa) {
            return res.status(400).json({ error: "O campo 'placa' é obrigatório para este tipo de veículo." });
        }
    }
    
    if (tipoVeiculo === 'MAQUINA') {
        if (horimetro === null || horimetro === undefined || horimetro < 0) {
             return res.status(400).json({ error: "O campo 'horímetro' é obrigatório para máquinas." });
        }
    } else {
         if (quilometragem === null || quilometragem === undefined || quilometragem < 0) {
             return res.status(400).json({ error: "O campo 'quilometragem' é obrigatório." });
        }
    }

    const sql = `
        UPDATE veiculos SET
            tipoVeiculo = ?, marca = ?, modelo = ?, anoFabricacao = ?, anoModelo = ?,
            placa = ?, renavam = ?, chassi = ?, cor = ?, potenciaMotor = ?, 
            quilometragem = ?, tipoCombustivel = ?, capacidadeTanque = ?,
            codigo_cc = ?, observacoes = ?, motorista_id = ?,
            vencimentoAET = ?, vencimento_aet_estadual = ?,
            vencimentoCronotacografo = ?, vencimentoDocumentos = ?,
            horimetro = ?
        WHERE id = ?
    `;

    const values = [
        tipoVeiculo, marca, modelo, anoFabricacao || null, anoModelo || null,
        tipoVeiculo === 'MAQUINA' ? null : placa,
        tipoVeiculo === 'MAQUINA' ? null : (renavam || null),
        chassi, cor || null, 
        ['SEMIRREBOQUE'].includes(tipoVeiculo) ? null : potenciaMotor || null,
        tipoVeiculo === 'MAQUINA' ? null : quilometragem,
        tipoVeiculo === 'SEMIRREBOQUE' ? null : tipoCombustivel, // CORREÇÃO: Removido 'MAQUINA'
        tipoVeiculo === 'SEMIRREBOQUE' ? null : capacidadeTanque, // CORREÇÃO: Removido 'MAQUINA'
        codigo_cc || null,
        observacoes || null,
        motorista_id || null,
        vencimentoAET || null,
        vencimento_aet_estadual || null,
        vencimentoCronotacografo || null,
        vencimentoDocumentos || null,
        tipoVeiculo === 'MAQUINA' ? horimetro : null,
        id
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Erro ao atualizar veículo:", err); 
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: `Dados duplicados. A placa, renavam ou chassi já pertencem a outro veículo.` });
            }
            return res.status(500).json({ error: "Erro interno ao atualizar o veículo." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Veículo não encontrado." });
        }
        res.status(200).json({ message: "Veículo atualizado com sucesso!" });
    });
});

// --- Rota para atualizar o status e a descrição da manutenção ---
router.put("/veiculos/:id/manutencao", authMiddleware, (req, res) => {
    const { id } = req.params;
    const { status, description } = req.body;

    if (!status) {
        return res.status(400).json({ error: "O campo 'status' é obrigatório." });
    }

    const finalDescription = description !== undefined ? description : null;

    const sql = `
        UPDATE veiculos 
        SET status_manutencao = ?, descricao_manutencao = ?
        WHERE id = ?
    `;

    db.query(sql, [status, finalDescription, id], (err, result) => {
        if (err) {
            console.error("Erro ao atualizar status da manutenção:", err);
            return res.status(500).json({ error: "Erro interno ao atualizar a manutenção." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Veículo não encontrado." });
        }
        res.status(200).json({ message: "Status da manutenção atualizado com sucesso!" });
    });
});

module.exports = router;