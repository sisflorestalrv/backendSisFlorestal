const express = require('express');
const router = express.Router();

// Importando os controladores e middlewares
const loginController = require("../auth/loginController");
const authMiddleware = require("../auth/authMiddleware");

// Importando os arquivos de rotas
const imoveisRoutes = require("./imoveisRoutes");
const despesasRoutes = require("./despesasRoutes");
const desramasRoutes = require("./desramasRoutes");
const desbastesRoutes = require("./desbastesRoutes");
const notasRoutes = require("./notasRoutes");
const inventarioRoutes = require("./inventarioRoutes");

// --- ROTAS PÚBLICAS ---
router.post("/login", loginController.login);

// --- APLICAÇÃO DO MIDDLEWARE DE AUTENTICAÇÃO ---
// Todas as rotas abaixo desta linha estarão protegidas
router.use(authMiddleware);

// --- ROTAS PROTEGIDAS ---
router.get("/protected", (req, res) => {
  res.json({ message: "Você acessou uma rota protegida!" });
});

// Agrupando as rotas
router.use(imoveisRoutes);
router.use(despesasRoutes);
router.use(desramasRoutes);
router.use(desbastesRoutes);
router.use(notasRoutes);
router.use(inventarioRoutes);

module.exports = router;