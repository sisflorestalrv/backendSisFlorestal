// app.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const https = require("https");

// Configurações para o HTTPS
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

app.use(bodyParser.json());

const corsOptions = {
  origin: "https://sisflorestalrioverde.com.br", // Substitua pelo domínio do frontend
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));

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



//app.listen(port, () => {
//  console.log(`Servidor rodando na porta ${port}`);
//}
https.createServer(options, app).listen(5000, () => {
  console.log('Servidor HTTPS rodando na porta {port}');
});
