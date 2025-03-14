<<<<<<< HEAD
const mysql = require("mysql2");
require("dotenv").config();

// Configuração da conexão com o banco de dados
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Verifica a conexão com o banco
db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco de dados MySQL");
  }
});

// Função para manter a conexão ativa
function keepAlive() {
  db.query('SELECT 1', (err) => {
    if (err) {
      console.error('Erro ao manter a conexão ativa:', err.message);
    } else {
      console.log('Conexão com o banco de dados mantida ativa.');
    }
  });
}

// Configura um intervalo para manter a conexão ativa a cada hora
setInterval(keepAlive, 3600000); // 3600000 ms = 1 hora

=======
const mysql = require("mysql2");
require("dotenv").config();

// Configuração da conexão com o banco de dados
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Verifica a conexão com o banco
db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco de dados MySQL");
  }
});

// Função para manter a conexão ativa
function keepAlive() {
  db.query('SELECT 1', (err) => {
    if (err) {
      console.error('Erro ao manter a conexão ativa:', err.message);
    } else {
      console.log('Conexão com o banco de dados mantida ativa.');
    }
  });
}

// Configura um intervalo para manter a conexão ativa a cada hora
setInterval(keepAlive, 3600000); // 3600000 ms = 1 hora

>>>>>>> 273357554b530a3d031e63fd2539c1bca7f5ecba
module.exports = db;