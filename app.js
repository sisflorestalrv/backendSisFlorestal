require("dotenv").config(); 
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const apiRoutes = require("./routes/index");

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());

const corsOptions = {
  origin: process.env.NODE_ENV === "production" 
    ? "https://sisflorestalrioverde.com.br" 
    : "http://localhost:3000",
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));

app.use("/api", apiRoutes);

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