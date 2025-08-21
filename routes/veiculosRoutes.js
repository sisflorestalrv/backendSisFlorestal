// routes/veiculosRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
// --- LINHA ADICIONADA ---
// Certifique-se de que o caminho para o seu arquivo authMiddleware está correto
const authMiddleware = require("../auth/authMiddleware");

// =======================================================================
// ========================= ROTA DE STATS ===============================
// =======================================================================

// DENTRO DO SEU ARQUIVO veiculosRoutes.js

router.get("/frota/stats", authMiddleware, async (req, res) => {
    try {
        const connection = await db.promise().getConnection();
        
        // Consultas ajustadas para os status corretos
        const totalVeiculosQuery = "SELECT COUNT(id) as total FROM veiculos";
        const emManutencaoQuery = "SELECT COUNT(id) as emManutencao FROM veiculos WHERE status_manutencao = 'in-progress'";
        const disponiveisQuery = "SELECT COUNT(id) as disponiveis FROM veiculos WHERE status_manutencao = 'disponivel'";
        const agendadasQuery = "SELECT COUNT(id) as agendadas FROM veiculos WHERE status_manutencao = 'to-do'";

        const [
            totalRows,
            manutencaoRows,
            disponiveisRows,
            agendadasRows // Alterado de avisosRows
        ] = await Promise.all([
            connection.query(totalVeiculosQuery),
            connection.query(emManutencaoQuery),
            connection.query(disponiveisQuery),
            connection.query(agendadasQuery) // Alterado de avisosVencimentoQuery
        ]);
        
        connection.release();

        const totalResult = totalRows[0][0];
        const manutencaoResult = manutencaoRows[0][0];
        const disponiveisResult = disponiveisRows[0][0];
        const agendadasResult = agendadasRows[0][0]; // Alterado de avisosResult

        res.json({
            totalVeiculos: totalResult.total,
            emManutencao: manutencaoResult.emManutencao,
            disponiveis: disponiveisResult.disponiveis,
            agendadas: agendadasResult.agendadas // Alterado de avisosVencimento
        });

    } catch (err) {
        console.error("Erro ao buscar estatísticas da frota:", err);
        res.status(500).json({ error: "Erro interno ao buscar estatísticas." });
    }
});

// A função parseCurrency não é mais necessária neste contexto e foi removida.

// --- Rota para buscar todos os motoristas (ID e Nome Completo) ---
router.get("/motoristas", authMiddleware, (req, res) => { // Adicionado authMiddleware aqui também por segurança
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
router.post("/veiculos", authMiddleware, (req, res) => { // Adicionado authMiddleware aqui também por segurança
    const {
        tipoVeiculo, marca, modelo, anoFabricacao, anoModelo,
        placa, renavam, chassi, cor, potenciaMotor,
        quilometragem, tipoCombustivel, capacidadeTanque, /* dataAquisicao, valorAquisicao, - REMOVIDO */
        codigo_cc, observacoes, motorista_id,
        vencimentoAET, vencimentoCronotacografo, vencimentoDocumentos
    } = req.body;

    // Validação atualizada
    if (!tipoVeiculo || !marca || !modelo || !anoFabricacao || !anoModelo || !placa || !renavam || !chassi || !cor || !quilometragem || !tipoCombustivel || !capacidadeTanque) {
        return res.status(400).json({ error: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    const sql = `
        INSERT INTO veiculos (
            tipoVeiculo, marca, modelo, anoFabricacao, anoModelo, placa, renavam, 
            chassi, cor, potenciaMotor, quilometragem, tipoCombustivel, capacidadeTanque, 
            /* dataAquisicao, valorAquisicao, - REMOVIDO */
            codigo_cc, observacoes, motorista_id,
            vencimentoAET, vencimentoCronotacografo, vencimentoDocumentos
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        tipoVeiculo, marca, modelo, anoFabricacao, anoModelo,
        placa, renavam, chassi, cor, 
        potenciaMotor || null,
        quilometragem,
        tipoCombustivel, capacidadeTanque, 
        /* dataAquisicao, parseCurrency(valorAquisicao), - REMOVIDO */
        codigo_cc || null,
        observacoes,
        motorista_id || null,
        vencimentoAET || null,
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
router.get("/veiculos", authMiddleware, (req, res) => { // Adicionado authMiddleware aqui também por segurança
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
router.get("/veiculos/:id", authMiddleware, (req, res) => { // Adicionado authMiddleware aqui também por segurança
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
router.delete("/veiculos/:id", authMiddleware, (req, res) => { // Adicionado authMiddleware aqui também por segurança
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
router.put("/veiculos/:id", authMiddleware, (req, res) => { // Adicionado authMiddleware aqui também por segurança
    const { id } = req.params;
    const {
        tipoVeiculo, marca, modelo, anoFabricacao, anoModelo,
        placa, renavam, chassi, cor, potenciaMotor,
        quilometragem, tipoCombustivel, capacidadeTanque,
        codigo_cc, observacoes, motorista_id,
        vencimentoAET, vencimentoCronotacografo, vencimentoDocumentos
    } = req.body;

    if (!tipoVeiculo || !marca || !modelo || !placa || !quilometragem) {
        return res.status(400).json({ error: "Campos essenciais como tipo, marca, modelo, placa e quilometragem são obrigatórios." });
    }

    // CORREÇÃO APLICADA AQUI:
    // A query SQL foi ajustada para não incluir mais os campos removidos.
    // Agora temos 19 assignments no SET e 1 no WHERE, totalizando 20 placeholders '?'.
    const sql = `
        UPDATE veiculos SET
            tipoVeiculo = ?, marca = ?, modelo = ?, anoFabricacao = ?, anoModelo = ?,
            placa = ?, renavam = ?, chassi = ?, cor = ?, potenciaMotor = ?, 
            quilometragem = ?, tipoCombustivel = ?, capacidadeTanque = ?,
            codigo_cc = ?, observacoes = ?, motorista_id = ?,
            vencimentoAET = ?, vencimentoCronotacografo = ?, vencimentoDocumentos = ?
        WHERE id = ?
    `;

    // CORREÇÃO APLICADA AQUI:
    // O array de valores também foi ajustado para ter 20 itens, correspondendo aos '?' da query.
    const values = [
        tipoVeiculo, marca, modelo, anoFabricacao, anoModelo,
        placa, renavam, chassi, cor, 
        potenciaMotor || null,
        quilometragem,
        tipoCombustivel, capacidadeTanque,
        codigo_cc || null,
        observacoes,
        motorista_id || null,
        vencimentoAET || null,
        vencimentoCronotacografo || null,
        vencimentoDocumentos || null,
        id
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            // Este é o erro que você provavelmente está recebendo no console do seu servidor
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
router.put("/veiculos/:id/manutencao", authMiddleware, (req, res) => { // Adicionado authMiddleware aqui também por segurança
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