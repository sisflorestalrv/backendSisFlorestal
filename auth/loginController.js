const db = require("../config/db");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // 1. Importe o bcrypt

const loginController = {
  login: (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
    }

    const sql = "SELECT id, username, password, tipo_usuario, foto_perfil_url FROM usuarios WHERE username = ?";
    db.query(sql, [username], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.length === 0) {
        // Mensagem genérica para não informar qual campo está errado
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }

      const user = results[0];

      try {
        // 2. Use bcrypt.compare para verificar a senha
        // Ele compara a senha que o usuário digitou (password) com o hash do banco (user.password)
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
          // Se as senhas correspondem, crie o token como antes
          const payload = {
            id: user.id,
            username: user.username,
            tipo_usuario: user.tipo_usuario 
          };

          const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, // Lê a chave segura do .env
            { expiresIn: '8h' }
          );

          return res.status(200).json({
            message: "Login bem-sucedido",
            token: token,
            user: {
                tipo_usuario: user.tipo_usuario,
                foto_perfil_url: user.foto_perfil_url
            }
          });
          
        } else {
          // Se a senha não corresponde, retorne o mesmo erro genérico
          return res.status(401).json({ error: "Usuário ou senha incorretos" });
        }
      } catch (compareError) {
          console.error("Erro ao comparar senhas:", compareError);
          return res.status(500).json({ error: "Erro interno no servidor." });
      }
    });
  },
};

module.exports = loginController;