// updatePasswords.js

const db = require('./config/db'); // Importa o pool JÁ COM PROMISES
const bcrypt = require('bcrypt');
const saltRounds = 10;

async function hashPasswords() {
  let connection;
  try {
    // Pega uma conexão do pool
    connection = await db.getConnection(); 
    console.log("Conexão com o banco de dados obtida para o script.");

    // Busca apenas senhas que não começam com o padrão do bcrypt ($2a$, $2b$, etc.)
    const [users] = await connection.query('SELECT id, password FROM usuarios WHERE password NOT LIKE "$2b$%"');

    if (users.length === 0) {
      console.log('✅ Nenhuma senha em texto plano para atualizar. Tudo certo!');
      return;
    }

    console.log(`Encontradas ${users.length} senhas para criptografar...`);

    for (const user of users) {
      // Gera o hash da senha
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      // Atualiza o banco de dados com a senha criptografada
      await connection.query('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, user.id]);
      console.log(`-> Senha do usuário com ID ${user.id} foi atualizada com sucesso.`);
    }

    console.log('🎉 Atualização de senhas concluída!');

  } catch (error) {
    console.error('❌ Erro ao atualizar senhas:', error.message);
  } finally {
    // Garante que a conexão seja liberada de volta para o pool
    if (connection) {
      console.log("Liberando a conexão com o banco de dados.");
      connection.release();
    }
    // Fecha o pool de conexões para que o script termine
    db.end();
  }
}

// Executa a função
hashPasswords();