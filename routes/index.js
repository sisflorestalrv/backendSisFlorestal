const express = require('express');
const router = express.Router();

// --- Controladores e Middlewares de Autenticação ---
const loginController = require("../auth/loginController");
const authMiddleware = require("../auth/authMiddleware"); // Middleware que valida o token

// --- Importação de todos os módulos de Rota ---
const imoveisRoutes = require("./imoveisRoutes");
const despesasRoutes = require("./despesasRoutes");
const desramasRoutes = require("./desramasRoutes");
const desbastesRoutes = require("./desbastesRoutes");
const inventarioRoutes = require("./inventarioRoutes");
const notasRoutes = require("./notasRoutes");
const userRoutes = require("./userRoutes"); // Rotas de admin

/*
 * =================================================================
 * Estrutura de Rotas da API
 * =================================================================
 */

// 1. ROTA PÚBLICA
// A rota de login não exige token e deve vir antes do middleware de autenticação.
router.post("/login", loginController.login);

// 2. MIDDLEWARE DE AUTENTICAÇÃO GLOBAL
// A partir desta linha, TODAS as rotas abaixo exigirão um token válido.
// O `authMiddleware` irá verificar o token e anexar os dados do usuário (req.user).
router.use(authMiddleware);

// 3. ROTAS PROTEGIDAS (acessíveis por qualquer usuário autenticado)
// Aqui ficam as rotas de operações gerais do sistema. Elas passam pelo
// `authMiddleware` acima, mas não pelo middleware de admin.
router.use(imoveisRoutes);
router.use(despesasRoutes);
router.use(desramasRoutes);
router.use(desbastesRoutes);
router.use(inventarioRoutes);
router.use(notasRoutes);

// 4. ROTAS DE ADMINISTRAÇÃO (acessíveis apenas por administradores)
// Este grupo de rotas é para gerenciamento de usuários.
// O próprio arquivo `userRoutes.js` já aplica o seu middleware `adminOnly` internamente.
// Ao colocá-lo por último, garantimos que ele não intercepte por engano outras rotas.
router.use(userRoutes);

module.exports = router;