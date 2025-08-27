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
        vencimentoCronotacografo, vencimentoDocumentos
    } = req.body;

    // <<< INÍCIO DA CORREÇÃO: VALIDAÇÃO MAIS INTELIGENTE >>>
    // 1. Validação dos campos que são considerados essenciais para qualquer veículo.
    const camposEssenciais = { tipoVeiculo, marca, modelo, placa, chassi, quilometragem };
    for (const campo in camposEssenciais) {
        if (!camposEssenciais[campo]) {
            // Retorna uma mensagem de erro mais específica.
            return res.status(400).json({ error: `O campo '${campo}' é obrigatório.` });
        }
    }

    // 2. Validação condicional: combustível e tanque são obrigatórios, EXCETO para semirreboques.
    if (tipoVeiculo !== 'SEMIRREBOQUE') {
        if (!tipoCombustivel || !capacidadeTanque) {
            return res.status(400).json({ error: "Para este tipo de veículo, o Tipo de Combustível e a Capacidade do Tanque são obrigatórios." });
        }
    }
    // <<< FIM DA CORREÇÃO >>>

    const sql = `
        INSERT INTO veiculos (
            tipoVeiculo, marca, modelo, anoFabricacao, anoModelo, placa, renavam, 
            chassi, cor, potenciaMotor, quilometragem, tipoCombustivel, capacidadeTanque, 
            codigo_cc, observacoes, motorista_id,
            vencimentoAET, vencimento_aet_estadual,
            vencimentoCronotacografo, vencimentoDocumentos
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // CÓDIGO CORRIGIDO
const values = [
    tipoVeiculo, marca, modelo, anoFabricacao || null, anoModelo || null,
    placa, renavam || null, chassi, cor || null,
    // CORREÇÃO: Garante que 'potenciaMotor' seja null para SEMIRREBOQUE
    tipoVeiculo === 'SEMIRREBOQUE' ? null : potenciaMotor || null, 
    quilometragem,
    tipoVeiculo === 'SEMIRREBOQUE' ? null : tipoCombustivel,
    tipoVeiculo === 'SEMIRREBOQUE' ? null : capacidadeTanque,
    codigo_cc || null,
    observacoes || null,
    motorista_id || null,
    vencimentoAET || null,
    vencimento_aet_estadual || null,
    vencimentoCronotacografo || null,
    vencimentoDocumentos || null
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

// --- Rota para obter um veículo pelo ID (com nome e CNH do motorista) ---
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
        vencimentoCronotacografo, vencimentoDocumentos
    } = req.body;

    // <<< INÍCIO DA CORREÇÃO: VALIDAÇÃO ATUALIZADA (IGUAL AO POST) >>>
    const camposEssenciais = { tipoVeiculo, marca, modelo, placa, chassi, quilometragem };
    for (const campo in camposEssenciais) {
        if (!camposEssenciais[campo]) {
            return res.status(400).json({ error: `O campo '${campo}' é obrigatório.` });
        }
    }

    if (tipoVeiculo !== 'SEMIRREBOQUE') {
        if (!tipoCombustivel || !capacidadeTanque) {
            return res.status(400).json({ error: "Para este tipo de veículo, o Tipo de Combustível e a Capacidade do Tanque são obrigatórios." });
        }
    }
    // <<< FIM DA CORREÇÃO >>>

    const sql = `
        UPDATE veiculos SET
            tipoVeiculo = ?, marca = ?, modelo = ?, anoFabricacao = ?, anoModelo = ?,
            placa = ?, renavam = ?, chassi = ?, cor = ?, potenciaMotor = ?, 
            quilometragem = ?, tipoCombustivel = ?, capacidadeTanque = ?,
            codigo_cc = ?, observacoes = ?, motorista_id = ?,
            vencimentoAET = ?, vencimento_aet_estadual = ?,
            vencimentoCronotacografo = ?, vencimentoDocumentos = ?
        WHERE id = ?
    `;

    // <<< INÍCIO DA CORREÇÃO: GARANTIR NULL PARA SEMIRREBOQUE >>>
    const values = [
        tipoVeiculo, marca, modelo, anoFabricacao || null, anoModelo || null,
        placa, renavam || null, chassi, cor || null, 
        tipoVeiculo === 'SEMIRREBOQUE' ? null : potenciaMotor || null,
        quilometragem,
        tipoVeiculo === 'SEMIRREBOQUE' ? null : tipoCombustivel,
        tipoVeiculo === 'SEMIRREBOQUE' ? null : capacidadeTanque,
        codigo_cc || null,
        observacoes || null,
        motorista_id || null,
        vencimentoAET || null,
        vencimento_aet_estadual || null,
        vencimentoCronotacografo || null,
        vencimentoDocumentos || null,
        id
    ];
    // <<< FIM DA CORREÇÃO >>>

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