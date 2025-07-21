const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    console.log('\n--- Middleware authAdmin foi executado ---');

    const authHeader = req.header('Authorization');
    console.log('1. Lendo o Header Authorization:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('-> ERRO: Header não encontrado ou não começa com "Bearer ".');
        return res.status(401).json({ error: 'Acesso negado, token não fornecido ou mal formatado.' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('2. Token extraído do header:', token);

    if (!token || token === 'undefined' || token === 'null') {
        console.log('-> ERRO: O token está vazio ou é a string "undefined"/"null".');
        return res.status(401).json({ error: 'Token de portador está vazio ou inválido.' });
    }

    try {
        // IMPORTANTE: Garanta que esta chave secreta é a mesma usada no seu loginController.js
        const secret = 'sua_chave_secreta_super_segura';
        console.log('3. Verificando o token com a chave secreta...');

        const decoded = jwt.verify(token, secret);
        console.log('4. Token decodificado com sucesso. Conteúdo:', decoded);

        // Verificando a propriedade 'tipo_usuario'
        if (decoded.tipo_usuario !== 'admin') {
            console.log(`-> FALHA NA AUTORIZAÇÃO: O tipo de usuário é "${decoded.tipo_usuario}", mas é necessário ser "admin".`);
            return res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador.' });
        }

        console.log('5. SUCESSO: Usuário é admin. Permitindo acesso à próxima rota.');
        req.user = decoded;
        next(); // Tudo certo, pode continuar

    } catch (ex) {
        console.error('-> ERRO CATCH: Falha ao verificar o token (pode estar expirado ou a assinatura pode estar errada). Mensagem:', ex.message);
        // O erro "Não autorizado" PODE estar vindo de outra parte se este catch não for acionado.
        res.status(400).json({ error: 'Token inválido ou expirado.' });
    }
};