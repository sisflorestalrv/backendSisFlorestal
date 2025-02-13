const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Rota para cadastrar um inventário
router.post("/imoveis/:id/inventario", (req, res) => {
  const { id } = req.params;
  const {
    numeroInventario,
    data,
    quantidadeAmostras,
    quantidadeArvores,
    pesoKgM3,
    diametroMedio,
    alturaMedia,
    volumeTotalM3,
    volumeTotalTON,
    volumeLenha,
    volume15a20,
    volume20a25,
    volume25a33,
    volume33Acima,
    valorLenha,
    valor15a20,
    valor20a25,
    valor25a33,
    valor33Acima,
    valorTotal,
  } = req.body;

  if (!numeroInventario || !data) {
    return res.status(400).json({ error: "Número do inventário e data são obrigatórios." });
  }

  const insertInventarioSql = `
    INSERT INTO inventario (
      imovel_id, numero_inventario, data, quantidade_amostras, quantidade_arvores, peso_kg_m3,
      diametro_medio, altura_media, volume_total_m3, volume_total_ton, volume_lenha,
      volume_15_a_20, volume_20_a_25, volume_25_a_33, volume_33_acima, valor_lenha,
      valor_15_a_20, valor_20_a_25, valor_25_a_33, valor_33_acima, valor_total
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    insertInventarioSql,
    [
      id,
      numeroInventario,
      data,
      quantidadeAmostras || null,
      quantidadeArvores || null,
      pesoKgM3 || null,
      diametroMedio || null,
      alturaMedia || null,
      volumeTotalM3 || null,
      volumeTotalTON || null,
      volumeLenha || null,
      volume15a20 || null,
      volume20a25 || null,
      volume25a33 || null,
      volume33Acima || null,
      valorLenha || null,
      valor15a20 || null,
      valor20a25 || null,
      valor25a33 || null,
      valor33Acima || null,
      valorTotal || null,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: "Inventário cadastrado com sucesso!" });
    }
  );
});

// Rota para listar inventários de um imóvel
router.get("/imoveis/:id/inventario", (req, res) => {
  const { id } = req.params;

  const selectInventarioSql = `
    SELECT * 
    FROM inventario 
    WHERE imovel_id = ?
  `;

  db.query(selectInventarioSql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Nenhum inventário encontrado para este imóvel." });
    }

    res.status(200).json(results);
  });
});

module.exports = router;