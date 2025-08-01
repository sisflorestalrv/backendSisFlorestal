// routes/arquivosRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
// <-- MUDANÇA AQUI: Importa a configuração específica para galeria
const { galleryUpload } = require('../config/multerConfig');
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

// Rota para fazer UPLOAD de um ou mais arquivos
// <-- MUDANÇA AQUI: Usa o middleware 'galleryUpload'
// Nota: .array('files', 10) permite o upload de até 10 arquivos de uma vez com o campo 'files'.
// Se seu frontend envia um arquivo por vez no campo 'file', use .single('file').
router.post('/imoveis/:imovelId/arquivos/:folderName', galleryUpload.array('files', 10), (req, res) => {
    const { imovelId, folderName } = req.params;
    
    // Agora verificamos por 'req.files' (plural) que o .array() cria
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    // Mapeia cada arquivo enviado para uma linha a ser inserida no banco
    const insertPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
            const { originalname, path: filePath, mimetype, size } = file;
            const publicPath = filePath.replace(/\\/g, '/').replace('public', '');
            const fileSizeKB = (size / 1024).toFixed(2);

            const sql = `
                INSERT INTO arquivos (imovel_id, folder_name, file_name, file_path, file_type, file_size_kb)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const values = [imovelId, folderName, originalname, publicPath, mimetype, fileSizeKB];

            db.query(sql, values, (err, result) => {
                if (err) {
                    fs.unlinkSync(filePath); // Apaga o arquivo se a inserção no DB falhar
                    return reject(err);
                }
                resolve({ fileId: result.insertId, filePath: publicPath, originalName: originalname });
            });
        });
    });

    // Executa todas as inserções
    Promise.all(insertPromises)
        .then(results => {
            res.status(201).json({ message: 'Arquivos enviados com sucesso!', uploadedFiles: results });
        })
        .catch(err => {
            res.status(500).json({ error: 'Erro ao salvar um ou mais arquivos no banco.', details: err.message });
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