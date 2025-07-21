// Este middleware assume que o middleware principal (authMiddleware) já foi executado
// e já decodificou o token JWT, adicionando o objeto 'user' à requisição.

module.exports = function(req, res, next) {
    // Verifica se o objeto 'user' existe e se o tipo de usuário é 'admin'
    if (req.user && req.user.tipo_usuario === 'admin') {
        // Se for admin, permite que a requisição continue
        return next();
    }

    // Se não for admin ou se o usuário não estiver logado com JWT, nega o acesso.
    return res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador.' });
};