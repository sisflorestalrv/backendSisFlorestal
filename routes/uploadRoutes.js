// routes/uploadRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/db");

// Configuração do Multer para o upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Pasta onde as imagens serão salvas
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome único para a imagem
  },
});

const upload = multer({ storage: storage });

// Configuração do Multer para upload de mapas
const storageMapas = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./mapas";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const uploadMapas = multer({ storage: storageMapas });

// Configuração do Multer para upload de arquivos
const storageArquivos = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./arquivos";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const uploadArquivos = multer({ storage: storageArquivos });

// Rota para postar a imagem de um imóvel
router.post("/imoveis/:id/imagens", upload.single("imagem"), (req, res) => {
  const { id } = req.params;
  const caminhoImagem = req.file ? req.file.path : null;
  const { titulo } = req.body; // Obtendo o título

  if (!caminhoImagem) {
    return res.status(400).json({ error: "Imagem é obrigatória" });
  }

  const sql = "INSERT INTO imagens (imovel_id, caminho, titulo) VALUES (?, ?, ?)";
  const values = [id, caminhoImagem, titulo];

  db.query(sql, values, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Imagem cadastrada com sucesso!" });
  });
});

// Rota para listar as imagens de um imóvel
router.get("/imoveis/:id/imagens", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM imagens WHERE imovel_id = ?";

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Nenhuma imagem encontrada para este imóvel." });
    }

    // Log do caminho das imagens para depuração
    console.log('Imagens encontradas:', results);

    res.json(results);
  });
});

// Rota para excluir uma imagem de um imóvel
router.delete("/imoveis/:id/imagens/:imageId", (req, res) => {
  const { id, imageId } = req.params;

  // Primeiro, busque o caminho da imagem na base de dados
  const selectSql = "SELECT caminho FROM imagens WHERE id = ? AND imovel_id = ?";
  db.query(selectSql, [imageId, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Imagem não encontrada." });
    }

    const imagePath = results[0].caminho;

    // Exclua o arquivo do sistema de arquivos (se necessário)
    const fs = require('fs');
    const path = require('path');
    const imageFullPath = path.join(__dirname, imagePath);

    fs.unlink(imageFullPath, (unlinkErr) => {
      if (unlinkErr) {
        return res.status(500).json({ error: "Erro ao excluir o arquivo de imagem." });
      }

      // Após excluir o arquivo, remova o registro do banco de dados
      const deleteSql = "DELETE FROM imagens WHERE id = ?";
      db.query(deleteSql, [imageId], (deleteErr) => {
        if (deleteErr) {
          return res.status(500).json({ error: deleteErr.message });
        }

        res.status(200).json({ message: "Imagem excluída com sucesso!" });
      });
    });
  });
});

// Rota para fazer upload de um mapa
router.post("/imoveis/:id/mapas", uploadMapas.single("mapa"), (req, res) => {
  const { id } = req.params;
  const { titulo } = req.body;  // Capturando o título enviado

  console.log(`Uploading map for imovelId: ${id}`);

  const caminhoMapa = req.file ? req.file.path : null;
  const nomeArquivo = req.file ? req.file.originalname : null;

  if (!caminhoMapa) {
    return res.status(400).json({ error: "O arquivo do mapa é obrigatório." });
  }

  if (!titulo) {
    return res.status(400).json({ error: "O título do mapa é obrigatório." });
  }

  // Inserindo o título e o caminho do mapa no banco de dados
  const sql = "INSERT INTO mapas (imovel_id, nome_arquivo, caminho, titulo) VALUES (?, ?, ?, ?)";
  db.query(sql, [id, nomeArquivo, caminhoMapa, titulo], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Mapa cadastrado com sucesso!" });
  });
});

// Rota para listar os mapas de um imóvel
router.get("/imoveis/:id/mapas", (req, res) => {
  const { id } = req.params;

  const sql = "SELECT id, nome_arquivo, caminho, titulo, data_upload FROM mapas WHERE imovel_id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results); // Retorna os resultados com o título
  });
});

// Rota para excluir um mapa
router.delete("/imoveis/:id/mapas/:mapaId", (req, res) => {
  const { id, mapaId } = req.params;

  // Buscar o caminho do mapa no banco
  const selectSql = "SELECT caminho FROM mapas WHERE id = ? AND imovel_id = ?";
  db.query(selectSql, [mapaId, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Mapa não encontrado." });
    }

    const caminhoMapa = results[0].caminho;

    // Excluir o arquivo do sistema de arquivos
    fs.unlink(caminhoMapa, (unlinkErr) => {
      if (unlinkErr) {
        return res.status(500).json({ error: "Erro ao excluir o arquivo do mapa." });
      }

      // Excluir o registro do banco de dados
      const deleteSql = "DELETE FROM mapas WHERE id = ?";
      db.query(deleteSql, [mapaId], (deleteErr) => {
        if (deleteErr) {
          return res.status(500).json({ error: deleteErr.message });
        }
        res.status(200).json({ message: "Mapa excluído com sucesso!" });
      });
    });
  });
});

// Rota para fazer upload de um arquivo
router.post("/imoveis/:id/arquivos", uploadArquivos.single("arquivo"), (req, res) => {
  const { id } = req.params;
  const { titulo } = req.body;  // Capturando o título enviado

  console.log(`Uploading file for imovelId: ${id}`);

  const caminhoArquivo = req.file ? req.file.path : null;
  const nomeArquivo = req.file ? req.file.originalname : null;

  if (!caminhoArquivo) {
    return res.status(400).json({ error: "O arquivo é obrigatório." });
  }

  if (!titulo) {
    return res.status(400).json({ error: "O título do arquivo é obrigatório." });
  }

  // Inserindo o título e o caminho do arquivo no banco de dados
  const sql = "INSERT INTO arquivos (imovel_id, nome_arquivo, caminho, titulo) VALUES (?, ?, ?, ?)";
  db.query(sql, [id, nomeArquivo, caminhoArquivo, titulo], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Arquivo cadastrado com sucesso!" });
  });
});

// Rota para listar os arquivos de um imóvel
router.get("/imoveis/:id/arquivos", (req, res) => {
  const { id } = req.params;

  const sql = "SELECT id, nome_arquivo, caminho, titulo, data_upload FROM arquivos WHERE imovel_id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results); // Retorna os resultados com o título
  });
});

// Rota para excluir um arquivo
router.delete("/imoveis/:id/arquivos/:arquivoId", (req, res) => {
  const { id, arquivoId } = req.params;

  // Buscar o caminho do arquivo no banco
  const selectSql = "SELECT caminho FROM arquivos WHERE id = ? AND imovel_id = ?";
  db.query(selectSql, [arquivoId, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Arquivo não encontrado." });
    }

    const caminhoArquivo = results[0].caminho;

    // Excluir o arquivo do sistema de arquivos
    fs.unlink(caminhoArquivo, (unlinkErr) => {
      if (unlinkErr) {
        return res.status(500).json({ error: "Erro ao excluir o arquivo." });
      }

      // Excluir o registro do banco de dados
      const deleteSql = "DELETE FROM arquivos WHERE id = ?";
      db.query(deleteSql, [arquivoId], (deleteErr) => {
        if (deleteErr) {
          return res.status(500).json({ error: deleteErr.message });
        }
        res.status(200).json({ message: "Arquivo excluído com sucesso!" });
      });
    });
  });
});

module.exports = router;