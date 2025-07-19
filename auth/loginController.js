const db = require("../config/db");

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
        return res.status(200).json({ message: "Login bem-sucedido" });
      } else {
        return res.status(401).json({ error: "Usuário ou senha incorretos" });
      }
    });
  },
};

module.exports = loginController;