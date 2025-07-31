// routes/arquivosRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const upload = require('../config/multerConfig');
const fs = require('fs');
const path = require('path');

// Rota para LISTAR arquivos de uma pasta específica de um imóvel
router.get('/imoveis/:imovelId/arquivos/:folderName', (req, res) => {
    const { imovelId, folderName } = req.params;
    const sql = "SELECT * FROM arquivos WHERE imovel_id = ? AND folder_name = ? ORDER BY created_at DESC";

    db.query(sql, [imovelId, folderName], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Erro ao buscar arquivos no banco de dados." });
        }
        res.status(200).json(results);
    });
});

// Rota para fazer UPLOAD de um arquivo
// O multer é chamado como middleware aqui para processar o 'form-data'
router.post('/imoveis/:imovelId/arquivos/:folderName', upload.single('file'), (req, res) => {
    const { imovelId, folderName } = req.params;
    
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const { originalname, path: filePath, mimetype, size } = req.file;
    // Converte o caminho para usar barras normais e remove a parte 'public' para o acesso via URL
    const publicPath = filePath.replace(/\\/g, '/').replace('public', '');
    const fileSizeKB = (size / 1024).toFixed(2);

    const sql = `
        INSERT INTO arquivos (imovel_id, folder_name, file_name, file_path, file_type, file_size_kb)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [imovelId, folderName, originalname, publicPath, mimetype, fileSizeKB];

    db.query(sql, values, (err, result) => {
        if (err) {
            // Se der erro no DB, apaga o arquivo que já foi salvo pelo multer
            fs.unlinkSync(filePath); 
            return res.status(500).json({ error: 'Erro ao salvar informações do arquivo no banco.' });
        }
        res.status(201).json({ message: 'Arquivo enviado com sucesso!', fileId: result.insertId, filePath: publicPath });
    });
});

// Rota para EXCLUIR um arquivo
router.delete('/arquivos/:fileId', (req, res) => {
    const { fileId } = req.params;

    // Primeiro, busca o caminho do arquivo no banco para poder deletá-lo do disco
    const findSql = "SELECT file_path FROM arquivos WHERE id = ?";
    db.query(findSql, [fileId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar o arquivo.' });
        if (results.length === 0) return res.status(404).json({ error: 'Arquivo não encontrado no banco de dados.' });

        const filePath = results[0].file_path;
        // Monta o caminho completo no disco (adicionando 'public' de volta)
        const fullPath = path.join(__dirname, '..', 'public', filePath);

        // Deleta o registro do banco de dados
        const deleteSql = "DELETE FROM arquivos WHERE id = ?";
        db.query(deleteSql, [fileId], (err, result) => {
            if (err) return res.status(500).json({ error: 'Erro ao deletar o arquivo do banco de dados.' });

            // Se o registro foi deletado do DB, deleta o arquivo físico
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
            
            res.status(200).json({ message: 'Arquivo excluído com sucesso.' });
        });
    });
});

module.exports = router;