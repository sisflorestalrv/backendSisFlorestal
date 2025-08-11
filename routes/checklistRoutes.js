const express = require("express");
const router = express.Router();
const db = require("../config/db");

// --- Rota para LISTAR todos os checklists de um veículo ---
router.get("/veiculos/:veiculoId/checklists", (req, res) => {
    const { veiculoId } = req.params;
    const sql = "SELECT * FROM checklists WHERE veiculo_id = ? ORDER BY created_at DESC";

    db.query(sql, [veiculoId], (err, results) => {
        if (err) {
            console.error("Erro ao buscar checklists:", err);
            return res.status(500).json({ error: "Erro interno ao buscar os checklists." });
        }

        // --- CORREÇÃO DE ROBUSTEZ APLICADA AQUI ---
        const checklists = results.map(c => {
            let parsedItens = [];
            // Verifica se 'c.itens' existe e é uma string antes de tentar o parse
            if (typeof c.itens === 'string' && c.itens) {
                try {
                    parsedItens = JSON.parse(c.itens);
                } catch (e) {
                    console.error(`Erro de parsing no JSON do checklist ID ${c.id}. Conteúdo problemático:`, c.itens);
                    // Se falhar, retorna um array vazio para este item, mas não quebra a aplicação.
                    parsedItens = []; 
                }
            } else if (Array.isArray(c.itens)) {
                // Se o driver já retornou como um array, apenas o usamos.
                parsedItens = c.itens;
            }
            
            return {
                ...c,
                // Garante que o resultado final é sempre um array
                itens: Array.isArray(parsedItens) ? parsedItens : [] 
            };
        });
        
        res.json(checklists);
    });
});

// --- Rota para CRIAR um novo checklist ---
router.post("/veiculos/:veiculoId/checklists", (req, res) => {
    const { veiculoId } = req.params;
    const { titulo, itens } = req.body;

    // Validação para garantir que 'itens' é sempre um array
    if (!titulo || !Array.isArray(itens)) {
        return res.status(400).json({ error: "Título e uma lista de itens (array) são obrigatórios." });
    }

    const sql = "INSERT INTO checklists (veiculo_id, titulo, itens) VALUES (?, ?, ?)";
    const values = [veiculoId, titulo, JSON.stringify(itens)];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Erro ao criar checklist:", err);
            return res.status(500).json({ error: "Erro interno ao criar o checklist." });
        }
        res.status(201).json({ message: "Checklist criado com sucesso!", id: result.insertId });
    });
});

// --- Rota para ATUALIZAR um checklist ---
router.put("/checklists/:checklistId", (req, res) => {
    const { checklistId } = req.params;
    const { titulo, itens } = req.body;

    if (!titulo || !Array.isArray(itens)) {
        return res.status(400).json({ error: "Título e uma lista de itens (array) são obrigatórios." });
    }

    const sql = "UPDATE checklists SET titulo = ?, itens = ? WHERE id = ?";
    const values = [titulo, JSON.stringify(itens), checklistId];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Erro ao atualizar checklist:", err);
            return res.status(500).json({ error: "Erro interno ao atualizar o checklist." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Checklist não encontrado." });
        }
        res.status(200).json({ message: "Checklist atualizado com sucesso!" });
    });
});

// --- Rota para DELETAR um checklist ---
router.delete("/checklists/:checklistId", (req, res) => {
    const { checklistId } = req.params;
    const sql = "DELETE FROM checklists WHERE id = ?";

    db.query(sql, [checklistId], (err, result) => {
        if (err) {
            console.error("Erro ao deletar checklist:", err);
            return res.status(500).json({ error: "Erro interno ao deletar o checklist." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Checklist não encontrado." });
        }
        res.status(200).json({ message: "Checklist deletado com sucesso!" });
    });
});

module.exports = router;