require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

// Importe suas rotas
const apiRoutes = require("./routes/index");

// 2. Inicialize o Express AQUI!
const app = express();
const port = process.env.PORT || 5000;

// 3. Configure os Middlewares (DEPOIS de inicializar o app)

// Opções do CORS
const corsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? "https://sisflorestalrioverde.com.br" 
    : "http://localhost:3000",
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));

// Substitui o bodyParser.json() que é antigo
app.use(express.json()); 

// --- CORREÇÃO PRINCIPAL ---
// A linha abaixo DEVE vir DEPOIS de 'const app = express();'
// Ela serve os arquivos da sua pasta 'public' (onde as imagens de perfil ficarão)
app.use(express.static('public'));

// 4. Configure as Rotas da API
// Todas as rotas em 'apiRoutes' serão prefixadas com '/api'
app.use("/api", apiRoutes);

// 5. Inicie o Servidor (lógica de HTTP/HTTPS mantida)
if (process.env.NODE_ENV === "production") {
  try {
    const options = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    };

    https.createServer(options, app).listen(port, () => {
      console.log(`Servidor HTTPS rodando em produção na porta ${port}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar o servidor HTTPS. Verifique os caminhos dos certificados no seu arquivo .env.", error);
  }
} else {
  http.createServer(app).listen(port, () => {
    console.log(`Servidor HTTP rodando em desenvolvimento na porta ${port}`);
  });
}