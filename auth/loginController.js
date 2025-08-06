// auth/loginController.js
const db = require("../config/db");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }

      const user = results[0];

      try {
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
          const payload = {
            id: user.id,
            username: user.username,
            tipo_usuario: user.tipo_usuario
          };

          const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '30d' } 
          );

          // Objeto de resposta base
          const responsePayload = {
            message: "Login bem-sucedido",
            token: token,
            user: {
              tipo_usuario: user.tipo_usuario,
              foto_perfil_url: user.foto_perfil_url
            }
          };

          // --- LÓGICA ADICIONAL PARA MOTORISTA ---
          if (user.tipo_usuario === 'motorista') {
            const motoristaSql = `
              SELECT v.id AS veiculo_id 
              FROM motoristas m
              JOIN veiculos v ON m.id = v.motorista_id
              WHERE m.usuario_id = ?
              LIMIT 1
            `;
            db.query(motoristaSql, [user.id], (motoristaErr, motoristaResults) => {
              if (motoristaErr) {
                console.error("Erro ao buscar veículo do motorista:", motoristaErr);
                return res.status(500).json({ error: "Erro ao verificar dados do motorista." });
              }

              if (motoristaResults.length > 0) {
                // Adiciona o ID do veículo à resposta se encontrado
                responsePayload.user.veiculo_id = motoristaResults[0].veiculo_id;
              }
              
              return res.status(200).json(responsePayload);
            });
          } else {
            // Para outros tipos de usuário, retorna a resposta padrão
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