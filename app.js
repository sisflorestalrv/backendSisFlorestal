// app.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const https = require("https");
const mysql = require("mysql2");

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


const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};


// Função para criar e reconectar com o MySQL
let dbConnection;

const connectToDatabase = () => {
  dbConnection = mysql.createConnection(dbConfig);

  dbConnection.connect((err) => {
    if (err) {
      console.error("Erro ao conectar no MySQL:", err);
      setTimeout(connectToDatabase, 5000); // Tenta reconectar após 5 segundos
    } else {
      console.log("Conexão com o banco de dados MySQL estabelecida com sucesso!");
    }
  });

  // Manter a conexão viva, evitando timeout
  dbConnection.on('error', (err) => {
    console.error("Erro de conexão com o MySQL:", err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      connectToDatabase();  // Reconecta se a conexão for perdida
    } else {
      throw err;
    }
  });
};

// Conectar ao banco de dados no início
connectToDatabase();

// Configuração do Express
app.use(bodyParser.json());

// Definindo o prefixo para a API (mascara)
const apiPrefix = '/api/v1';  // Isso oculta as rotas e organiza melhor a estrutura das APIs

// Configuração do CORS
const corsOptions = {
  origin: "https://sisflorestalrioverde.com.br", // Substitua pelo domínio do frontend
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
};
app.use(cors(corsOptions))

// Rotas de autenticação
app.get(`${apiPrefix}/protected`, authMiddleware, (req, res) => {
  res.json({ message: "Você acessou uma rota protegida!" });
});

app.post(`${apiPrefix}/login`, loginController.login);

// Rotas de upload
app.use(apiPrefix, imagesRoutes); // Usando as rotas de upload

// Rotas de imóveis
app.use(apiPrefix, imoveisRoutes);

// Rotas de despesas
app.use(apiPrefix, despesasRoutes);

// Rotas de desramas
app.use(apiPrefix, desramasRoutes);

// Rotas de desbaste
app.use(apiPrefix, desbastesRoutes);

// Rotas de notas
app.use(apiPrefix, notasRoutes);

// Rota de inventário
app.use(apiPrefix, inventarioRoutes);

// Servidor HTTPS
https.createServer(options, app).listen(port, () => {
  console.log(`Servidor HTTPS rodando na porta ${port}`);
})


// // app.js
// const express = require("express");
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const fs = require("fs");
// const path = require("path");
// const https = require("https");

// // Configurações para o HTTPS
// const options = {
//   key: fs.readFileSync('/etc/letsencrypt/live/srv690508.hstgr.cloud/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/srv690508.hstgr.cloud/fullchain.pem')
// };

// const authMiddleware = require("./auth/authMiddleware");
// const loginController = require("./auth/loginController");
// const imagesRoutes = require("./routes/imagesRoutes"); // Importando as rotas de upload
// const imoveisRoutes = require("./routes/imoveisRoutes");
// const despesasRoutes = require("./routes/despesasRoutes");
// const desramasRoutes = require("./routes/desramasRoutes");
// const desbastesRoutes = require("./routes/desbastesRoutes");
// const notasRoutes = require("./routes/notasRoutes");
// const inventarioRoutes = require("./routes/inventarioRoutes");

// // Criação das pastas necessárias
// const uploadsDir = path.join(__dirname, "uploads");

// [uploadsDir].forEach((dir) => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//     console.log(`Pasta "${dir}" criada com sucesso.`);
//   }
// });

// const app = express();
// const port = 5000;

// app.use(bodyParser.json());

// // Definindo o prefixo para a API (mascara)
// const apiPrefix = '/api/v1';  // Isso oculta as rotas e organiza melhor a estrutura das APIs

// // Configuração do CORS
// const corsOptions = {
//   origin: "https://sisflorestalrioverde.com.br", // Substitua pelo domínio do frontend
//   methods: "GET,POST,PUT,DELETE",
//   credentials: true,
// };
// app.use(cors(corsOptions))

// //const corsOptions = {
// // origin: "http://localhost:3000", // Permite solicitações do frontend local
// // methods: "GET,POST,PUT,DELETE",
// // credentials: true,
// //};

// // Rotas de autenticação
// app.get(`${apiPrefix}/protected`, authMiddleware, (req, res) => {
//   res.json({ message: "Você acessou uma rota protegida!" });
// });

// app.post(`${apiPrefix}/login`, loginController.login);

// // Rotas de upload
// app.use(apiPrefix, imagesRoutes); // Usando as rotas de upload

// // Rotas de imóveis
// app.use(apiPrefix, imoveisRoutes);

// // Rotas de despesas
// app.use(apiPrefix, despesasRoutes);

// // Rotas de desramas
// app.use(apiPrefix, desramasRoutes);

// // Rotas de desbaste
// app.use(apiPrefix, desbastesRoutes);

// // Rotas de notas
// app.use(apiPrefix, notasRoutes);

// // Rota de inventário
// app.use(apiPrefix, inventarioRoutes);

// // Servidor HTTPS
// https.createServer(options, app).listen(port, () => {
//   console.log(`Servidor HTTPS rodando na porta ${port}`);
// })
