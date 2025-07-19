/*const express = require("express");
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
const imoveisRoutes = require("./routes/imoveisRoutes");
const despesasRoutes = require("./routes/despesasRoutes");
const desramasRoutes = require("./routes/desramasRoutes");
const desbastesRoutes = require("./routes/desbastesRoutes");
const notasRoutes = require("./routes/notasRoutes");
const inventarioRoutes = require("./routes/inventarioRoutes");

const app = express();
const port = 5000;

app.use(bodyParser.json());

const corsOptions = {
  origin: "https://sisflorestalrioverde.com.br", // Substitua pelo domínio do frontend
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "Você acessou uma rota protegida!" });
});

app.post("/api/login", loginController.login);

app.use("/api", imoveisRoutes);

app.use("/api", despesasRoutes);

app.use("/api", desramasRoutes);

app.use("/api", desbastesRoutes);

app.use("/api", notasRoutes);

app.use('/api', inventarioRoutes);

https.createServer(options, app).listen(port, () => {
  console.log(`Servidor HTTPS rodando na porta ${port}`);
});
*/

// --- Local ---
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");

const authMiddleware = require("./auth/authMiddleware");
const loginController = require("./auth/loginController");
const imoveisRoutes = require("./routes/imoveisRoutes");
const despesasRoutes = require("./routes/despesasRoutes");
const desramasRoutes = require("./routes/desramasRoutes");
const desbastesRoutes = require("./routes/desbastesRoutes");
const notasRoutes = require("./routes/notasRoutes");
const inventarioRoutes = require("./routes/inventarioRoutes");

const app = express();
const port = 5000;

app.use(bodyParser.json());

const corsOptions = {
  origin: "http://localhost:3000", 
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));


app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "Você acessou uma rota protegida!" });
});

app.post("/api/login", loginController.login);

app.use("/api", imoveisRoutes);

app.use("/api", despesasRoutes);

app.use("/api", desramasRoutes);

app.use("/api", desbastesRoutes);

app.use("/api", notasRoutes);

app.use('/api', inventarioRoutes);

// Criando o servidor HTTP
http.createServer(app).listen(port, () => {
  console.log(`Servidor HTTP rodando na porta ${port}`);
});