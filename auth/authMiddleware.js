const jwt = require('jsonwebtoken');

// Este é o novo middleware principal que lida com AMBOS os tipos de token.
module.exports = function(req, res, next) {
    const authHeader = req.header('Authorization');

    // Se não houver nenhum cabeçalho de autorização, nega o acesso.
    if (!authHeader) {
        return res.status(401).json({ error: 'Acesso negado, nenhum token fornecido.' });
    }

    // --- TENTATIVA 1: Validar Token JWT (o novo sistema) ---
    if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        try {
            const secret = 'sua_chave_secreta_super_segura'; // Mesma chave do loginController
            const decoded = jwt.verify(token, secret);
            
            // Se o token for válido, anexa os dados do usuário à requisição
            // para que outros middlewares (como o adminOnly) possam usá-los.
            req.user = decoded; 
            
            return next(); // Token JWT válido, pode passar.
        } catch (ex) {
            // Se a verificação falhar (token expirado, inválido), retorna erro.
            return res.status(400).json({ error: 'Token JWT inválido ou expirado.' });
        }
    }

    // --- TENTATIVA 2: Validar Token Antigo ---
    if (authHeader === 'Basic my-simple-token') {
        // O token antigo é válido. Deixa passar, mas não anexa nenhum 'req.user'.
        return next();
    }

    // Se não corresponder a nenhum dos formatos esperados, nega o acesso.
    return res.status(401).json({ error: 'Formato de token não suportado ou inválido.' });
};