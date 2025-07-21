const express = require('express');
const router = express.Router();

const loginController = require("../auth/loginController");
const authMiddleware = require("../auth/authMiddleware"); // Nosso novo middleware inteligente

// Rotas
const imoveisRoutes = require("./imoveisRoutes");
const despesasRoutes = require("./despesasRoutes");
// ... outras rotas
const userRoutes = require("./userRoutes");

// --- ROTA PÚBLICA ---
router.post("/login", loginController.login);

// --- APLICAÇÃO DO MIDDLEWARE DE AUTENTICAÇÃO GLOBAL ---
// Todas as rotas abaixo desta linha estarão protegidas pelo nosso novo authMiddleware.
router.use(authMiddleware);

// --- ROTAS PROTEGIDAS ---
// Agora todas estas rotas funcionarão com qualquer um dos dois tokens.
router.use(imoveisRoutes);
router.use(despesasRoutes);
// ...
// E a rota de usuários terá sua camada extra de segurança (adminOnly) aplicada internamente.
router.use(userRoutes);

module.exports = router;