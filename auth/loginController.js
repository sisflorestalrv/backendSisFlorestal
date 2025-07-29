const db = require("../config/db");
const jwt = require('jsonwebtoken'); // Importe a biblioteca JWT

const loginController = {
  login: (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
    }

    // Seleciona todos os dados necessários do usuário
    const sql = "SELECT id, username, password, tipo_usuario, foto_perfil_url FROM usuarios WHERE username = ?";
    db.query(sql, [username], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }

      const user = results[0];

      // IMPORTANTE: Você deve usar uma biblioteca como 'bcrypt' para comparar senhas com hash.
      // A comparação direta de senhas em texto plano não é segura.
      if (password === user.password) {
        
        const payload = {
          id: user.id,
          username: user.username,
          tipo_usuario: user.tipo_usuario 
        };

        // É altamente recomendado usar uma variável de ambiente para a chave secreta (process.env.JWT_SECRET)
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'sua_chave_secreta_super_segura', { expiresIn: '8h' });

        // --- CORREÇÃO PRINCIPAL AQUI ---
        // Retorna o token e um objeto 'user' com os dados que o frontend precisa.
        return res.status(200).json({
          message: "Login bem-sucedido",
          token: token,
          user: {
              tipo_usuario: user.tipo_usuario,
              foto_perfil_url: user.foto_perfil_url // Enviando a URL da foto
          }
        });
        
      } else {
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }
    });
  },
};

module.exports = loginController;
