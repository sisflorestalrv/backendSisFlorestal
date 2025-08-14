// auth/loginController.js
const db = require("../config/db");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const loginController = {
  login: (req, res) => {
    const { username, password } = req.body;
    // highlight-start
    const ip_address = req.ip;
    const user_agent = req.headers['user-agent'];
    // highlight-end

    if (!username || !password) {
      return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
    }

    const sql = "SELECT id, username, password, tipo_usuario, foto_perfil_url FROM usuarios WHERE username = ?";
    db.query(sql, [username], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }

      const user = results[0];

      try {
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
          // highlight-start
          // Inclui um ID de sessão único (jti) no token
          const sessionId = Date.now().toString() + user.id;
          const payload = {
            id: user.id,
            username: user.username,
            tipo_usuario: user.tipo_usuario,
            jti: sessionId // jti é a abreviação padrão para "JWT ID"
          };
          // highlight-end

          const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '30d' } 
          );

          // highlight-start
          // Salva a nova sessão no banco de dados
          const sessionSql = "INSERT INTO sessoes (id, usuario_id, token_jwt, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)";
          db.query(sessionSql, [sessionId, user.id, token, ip_address, user_agent], (sessionErr, sessionResult) => {
            if (sessionErr) {
              console.error("Erro ao salvar a sessão:", sessionErr);
              // Continua mesmo se houver erro, para não impedir o login
            }
          });
          // highlight-end
          
          const responsePayload = {
            message: "Login bem-sucedido",
            token: token,
            user: {
              tipo_usuario: user.tipo_usuario,
              foto_perfil_url: user.foto_perfil_url
            }
          };

          if (user.tipo_usuario === 'motorista') {
            // ... (sua lógica de motorista permanece a mesma)
          } else {
            return res.status(200).json(responsePayload);
          }

        } else {
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