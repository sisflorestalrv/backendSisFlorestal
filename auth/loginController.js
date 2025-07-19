const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginController = {
  // Tornamos a função 'async' para poder usar 'await'
  login: async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
    }

    try {
      // 1. Busca o usuário no banco de dados
      const sql = "SELECT * FROM usuarios WHERE username = ?";
      const [results] = await db.query(sql, [username]); // Usamos await para esperar a resposta

      // 2. Verifica se o usuário existe
      if (results.length === 0) {
        // Mensagem genérica para não informar se o usuário existe ou não
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }

      const user = results[0];

      // 3. Compara a senha enviada pelo usuário com o hash salvo no banco
      const isMatch = await bcrypt.compare(password, user.password);

      // 4. Se a senha não corresponder, retorna erro
      if (!isMatch) {
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }

      // 5. Se a senha estiver correta, gera um Token JWT
      const token = jwt.sign(
        { id: user.id, username: user.username }, // Dados que serão armazenados no token
        process.env.JWT_SECRET,                   // Chave secreta do seu .env
        { expiresIn: '8h' }                       // O token expira em 8 horas
      );

      // 6. Envia a resposta de sucesso com o token
      return res.status(200).json({
        message: "Login bem-sucedido",
        token: token
      });

    } catch (err) {
      console.error("Ocorreu um erro durante o login:", err);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  },
};

module.exports = loginController;