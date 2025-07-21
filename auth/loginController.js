const db = require("../config/db");
const jwt = require('jsonwebtoken'); // Importe a biblioteca JWT

const loginController = {
  login: (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
    }

    const sql = "SELECT * FROM usuarios WHERE username = ?";
    db.query(sql, [username], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }

      const user = results[0];

      if (password === user.password) {
        // --- CORREÇÃO PRINCIPAL AQUI ---
        // Crie o "payload" do token com os dados do usuário.
        const payload = {
          id: user.id,
          username: user.username,
          tipo_usuario: user.tipo_usuario 
        };

        // Gere o token. Use uma chave secreta segura.
        // É recomendado usar uma variável de ambiente (process.env.JWT_SECRET)
        const token = jwt.sign(payload, 'sua_chave_secreta_super_segura', { expiresIn: '8h' });

        // Retorne o token e o tipo_usuario na resposta.
        return res.status(200).json({
          message: "Login bem-sucedido",
          token: token, // Enviando o token gerado
          tipo_usuario: user.tipo_usuario
        });
        
      } else {
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }
    });
  },
};

module.exports = loginController;