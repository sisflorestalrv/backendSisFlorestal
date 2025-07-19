const mysql = require("mysql2");
require("dotenv").config();

// Configuração do pool de conexões com o banco de dados
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('A conexão com o banco de dados foi perdida.');
    } else if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('O banco de dados tem muitas conexões.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('A conexão com o banco de dados foi recusada.');
    }
  } else {
    console.log("Conectado ao banco de dados MySQL com sucesso usando um pool de conexões.");
    connection.release(); 
  }
});

module.exports = pool;