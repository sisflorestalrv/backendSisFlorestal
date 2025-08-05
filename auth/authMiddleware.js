const jwt = require('jsonwebtoken');

// Middleware de autenticação que valida apenas tokens JWT (Bearer Token).
module.exports = function(req, res, next) {
    const authHeader = req.header('Authorization');

    // 1. Verifica se o cabeçalho 'Authorization' existe e se começa com 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido ou mal formatado.' });
    }

    // 2. Extrai o token do cabeçalho
    const token = authHeader.replace('Bearer ', '');
    
    // Se o token estiver vazio após a extração (ex: "Bearer "), nega o acesso.
    if (!token) {
        return res.status(401).json({ error: 'Token de portador está vazio.' });
    }

    try {
        // 3. Verifica a validade do token usando a chave secreta do arquivo .env
        // A variável 'process.env.JWT_SECRET' lê a linha que você adicionou ao .env
        const secret = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        
        // 4. Anexa os dados do usuário (decodificados do token) à requisição
        // Isso permite que middlewares subsequentes (como o adminOnly) saibam quem é o usuário.
        req.user = decoded; 
        
        // 5. Permite que a requisição continue para a rota desejada
        return next(); 

    } catch (ex) {
        // Se a verificação falhar (token expirado, assinatura inválida, etc.), retorna erro.
        return res.status(400).json({ error: 'Token inválido ou expirado.' });
    }
};