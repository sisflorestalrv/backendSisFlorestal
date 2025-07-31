const express = require('express');
const router = express.Router();

// --- Controladores e Middlewares de Autenticação ---
const loginController = require("../auth/loginController");
const authMiddleware = require("../auth/authMiddleware");

// --- Importação de todos os módulos de Rota ---
const imoveisRoutes = require("./imoveisRoutes");
const despesasRoutes = require("./despesasRoutes");
const desramasRoutes = require("./desramasRoutes");
const desbastesRoutes = require("./desbastesRoutes");
const inventarioRoutes = require("./inventarioRoutes");
const notasRoutes = require("./notasRoutes");
const userRoutes = require("./userRoutes");
const veiculosRoutes = require("./veiculosRoutes");
const arquivosRoutes = require("./arquivosRoutes"); // <-- ADICIONE ESTA LINHA

/*
 * =================================================================
 * Estrutura de Rotas da API
 * =================================================================
 */

// 1. ROTA PÚBLICA
router.post("/login", loginController.login);

// 2. MIDDLEWARE DE AUTENTICAÇÃO GLOBAL
router.use(authMiddleware);

// 3. ROTAS PROTEGIDAS
router.use(imoveisRoutes);
router.use(despesasRoutes);
router.use(desramasRoutes);
router.use(desbastesRoutes);
router.use(inventarioRoutes);
router.use(notasRoutes);
router.use(veiculosRoutes);
router.use(arquivosRoutes); // <-- ADICIONE ESTA LINHA

// 4. ROTAS DE ADMINISTRAÇÃO
router.use(userRoutes);

module.exports = router;