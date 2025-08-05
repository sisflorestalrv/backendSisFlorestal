// Importa as bibliotecas necessárias
const bcrypt = require('bcrypt');
const db = require('../config/db'); // Importa a sua conexão à base de dados

// Fator de custo para o hash. Deve ser o mesmo que usa no seu código.
const saltRounds = 10;

// Função principal assíncrona para executar a migração
const migratePasswords = async () => {
    console.log('Iniciando a migração de senhas...');

    let connection;
    try {
        // Obter uma conexão do pool
        connection = await db.promise().getConnection();
        console.log('Conexão com a base de dados estabelecida.');

        // 1. Selecionar todos os utilizadores
        const [users] = await connection.execute('SELECT id, username, password FROM usuarios');
        console.log(`Encontrados ${users.length} utilizadores.`);

        let passwordsToUpdate = 0;

        // 2. Iterar sobre cada utilizador para verificar a senha
        for (const user of users) {
            // Verifica se a senha já é um hash bcrypt. Hashes começam com '$2a$', '$2b$', etc.
            // Se a senha for muito curta ou não começar com '$2', consideramos que é texto plano.
            if (user.password && !user.password.startsWith('$2')) {
                console.log(`-> Migrando senha para o utilizador: ${user.username}`);
                
                // 3. Gerar o hash para a senha em texto plano
                const hashedPassword = await bcrypt.hash(user.password, saltRounds);

                // 4. Atualizar a senha do utilizador na base de dados
                await connection.execute(
                    'UPDATE usuarios SET password = ? WHERE id = ?',
                    [hashedPassword, user.id]
                );
                
                passwordsToUpdate++;
            } else {
                console.log(`-> Senha para o utilizador '${user.username}' já está em formato hash. A ignorar.`);
            }
        }

        if (passwordsToUpdate > 0) {
            console.log(`\n✅ Migração concluída com sucesso! ${passwordsToUpdate} senhas foram atualizadas para o formato hash.`);
        } else {
            console.log('\n✅ Nenhuma senha precisou de ser atualizada. Todas já estão seguras.');
        }

    } catch (error) {
        console.error('❌ ERRO DURANTE A MIGRAÇÃO:', error);
    } finally {
        // 5. Libertar a conexão de volta para o pool, quer tenha sucesso ou falhe
        if (connection) {
            connection.release();
            console.log('Conexão com a base de dados libertada.');
        }
        // Termina a conexão geral para que o script possa ser encerrado
        db.end();
    }
};

// Executar a função de migração
migratePasswords();