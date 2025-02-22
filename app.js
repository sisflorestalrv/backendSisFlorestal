// app.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const https = require("https");

// Carregue o certificado e a chave privada
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/srv690508.hstgr.cloud/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/srv690508.hstgr.cloud/fullchain.pem')
};

const authMiddleware = require("./auth/authMiddleware");
const loginController = require("./auth/loginController");
const imagesRoutes = require("./routes/imagesRoutes"); // Importando as rotas de upload
const imoveisRoutes = require("./routes/imoveisRoutes");
const despesasRoutes = require("./routes/despesasRoutes");
const desramasRoutes = require("./routes/desramasRoutes");
const desbastesRoutes = require("./routes/desbastesRoutes");
const notasRoutes = require("./routes/notasRoutes");
const inventarioRoutes = require("./routes/inventarioRoutes");

// Criação das pastas necessárias
const uploadsDir = path.join(__dirname, "uploads");

[uploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Pasta "${dir}" criada com sucesso.`);
  }
});

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Rotas de autenticação
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "Você acessou uma rota protegida!" });
});

app.post("/api/login", loginController.login);

// Rotas de upload
app.use("/api", imagesRoutes); // Usando as rotas de upload

// Rotas de imóveis
app.use("/api", imoveisRoutes);

// Rotas de despesas
app.use("/api", despesasRoutes);

// Rotas de desramas
app.use("/api", desramasRoutes);

// Rotas de desbaste
app.use("/api", desbastesRoutes);

// Rotas de notas
app.use("/api", notasRoutes);

app.use('/api', inventarioRoutes);



// Crie o servidor HTTPS
https.createServer(options, app).listen(5000, () => {
  console.log('Servidor HTTPS rodando na porta {port}');
});