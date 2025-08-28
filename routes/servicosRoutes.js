// routes/servicosRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const authMiddleware = require("../auth/authMiddleware");

// --- Rota para LISTAR todos os serviços (Checklists e OS) de um veículo ---
router.get("/veiculos/:veiculoId/servicos", authMiddleware, async (req, res) => {
    const { veiculoId } = req.params;
    let connection;
    try {
        connection = await db.promise().getConnection();
        
        // 1. Busca todos os serviços principais do veículo
        const [servicos] = await connection.query("SELECT * FROM servicos_veiculo WHERE veiculo_id = ? ORDER BY created_at DESC", [veiculoId]);

        if (servicos.length === 0) {
            return res.json([]);
        }

        // 2. Busca todos os itens para os serviços encontrados
        const servicoIds = servicos.map(s => s.id);
        const [itens] = await connection.query("SELECT * FROM servicos_veiculo_itens WHERE servico_id IN (?)", [servicoIds]);

        // 3. Mapeia os itens para seus respectivos serviços
        const servicosComItens = servicos.map(servico => ({
            ...servico,
            itens: itens.filter(item => item.servico_id === servico.id)
        }));

        res.json(servicosComItens);

    } catch (err) {
        console.error("Erro ao buscar serviços:", err);
        res.status(500).json({ error: "Erro interno ao buscar os serviços." });
    } finally {
        if (connection) connection.release();
    }
});

// --- Rota para CRIAR um novo serviço (Checklist ou OS) ---
router.post("/veiculos/:veiculoId/servicos", authMiddleware, async (req, res) => {
    const { veiculoId } = req.params;
    const { titulo, fornecedor_id, numero_os, data_emissao, status, observacoes_gerais, itens } = req.body;

    if (!titulo || !Array.isArray(itens)) {
        return res.status(400).json({ error: "Título e uma lista de itens são obrigatórios." });
    }

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // 1. Insere o registro principal na tabela 'servicos_veiculo'
        const servicoSql = `
            INSERT INTO servicos_veiculo 
            (veiculo_id, titulo, fornecedor_id, numero_os, data_emissao, status, observacoes_gerais) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const servicoValues = [veiculoId, titulo, fornecedor_id || null, numero_os || null, data_emissao || null, status || 'Pendente', observacoes_gerais || null];
        const [servicoResult] = await connection.query(servicoSql, servicoValues);
        const servicoId = servicoResult.insertId;

        // 2. Insere os itens na tabela 'servicos_veiculo_itens'
        if (itens.length > 0) {
            const itensSql = `
                INSERT INTO servicos_veiculo_itens 
                (servico_id, descricao, quantidade, unidade, valor_unitario) 
                VALUES ?
            `;
            const itensValues = itens.map(item => [
                servicoId,
                item.descricao,
                item.quantidade || null,
                item.unidade || null,
                item.valor_unitario || null
            ]);
            await connection.query(itensSql, [itensValues]);
        }

        await connection.commit();
        res.status(201).json({ message: "Serviço criado com sucesso!", id: servicoId });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Erro ao criar serviço:", err);
        res.status(500).json({ error: "Erro interno ao criar o serviço." });
    } finally {
        if (connection) connection.release();
    }
});


// --- Rota para ATUALIZAR um serviço (Checklist ou OS) ---
router.put("/servicos/:servicoId", authMiddleware, async (req, res) => {
    const { servicoId } = req.params;
    const { titulo, fornecedor_id, numero_os, data_emissao, status, observacoes_gerais, itens } = req.body;

    if (!titulo || !Array.isArray(itens)) {
        return res.status(400).json({ error: "Título e uma lista de itens são obrigatórios." });
    }
    
    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        // 1. Atualiza o registro principal
        const servicoSql = `
            UPDATE servicos_veiculo SET 
            titulo = ?, fornecedor_id = ?, numero_os = ?, data_emissao = ?, status = ?, observacoes_gerais = ?
            WHERE id = ?
        `;
        const servicoValues = [titulo, fornecedor_id || null, numero_os || null, data_emissao || null, status || 'Pendente', observacoes_gerais || null, servicoId];
        await connection.query(servicoSql, servicoValues);

        // 2. Deleta os itens antigos para depois reinserir (estratégia simples e eficaz)
        await connection.query("DELETE FROM servicos_veiculo_itens WHERE servico_id = ?", [servicoId]);

        // 3. Reinsere os itens atualizados
        if (itens.length > 0) {
            const itensSql = `
                INSERT INTO servicos_veiculo_itens 
                (servico_id, descricao, quantidade, unidade, valor_unitario) 
                VALUES ?
            `;
            const itensValues = itens.map(item => [
                servicoId,
                item.descricao,
                item.quantidade || null,
                item.unidade || null,
                item.valor_unitario || null
            ]);
            await connection.query(itensSql, [itensValues]);
        }
        
        await connection.commit();
        res.status(200).json({ message: "Serviço atualizado com sucesso!" });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Erro ao atualizar serviço:", err);
        res.status(500).json({ error: "Erro interno ao atualizar o serviço." });
    } finally {
        if (connection) connection.release();
    }
});


// --- Rota para DELETAR um serviço ---
// Graças ao 'ON DELETE CASCADE' no banco de dados, deletar o serviço principal
// automaticamente deletará todos os seus itens associados.
router.delete("/servicos/:servicoId", authMiddleware, (req, res) => {
    const { servicoId } = req.params;
    const sql = "DELETE FROM servicos_veiculo WHERE id = ?";

    db.query(sql, [servicoId], (err, result) => {
        if (err) {
            console.error("Erro ao deletar serviço:", err);
            return res.status(500).json({ error: "Erro interno ao deletar o serviço." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Serviço não encontrado." });
        }
        res.status(200).json({ message: "Serviço deletado com sucesso!" });
    });
});


module.exports = router;