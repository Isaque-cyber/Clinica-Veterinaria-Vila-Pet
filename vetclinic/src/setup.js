require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const c = await mysql.createConnection({
      host: process.env.DB_HOST, user: process.env.DB_USER,
      password: process.env.DB_PASSWORD, multipleStatements: true
    });
    await c.query(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));
    console.log('Banco e tabelas criados.');
    await c.query('USE ' + process.env.DB_NAME);
    const h = await bcrypt.hash('123456', 10);
    await c.query('INSERT IGNORE INTO usuarios (nome, email, senha_hash) VALUES (?,?,?)',
      ['Marcos', 'marcos@clinica.com', h]);
    console.log('Usuário criado: marcos@clinica.com / 123456');
    await c.end();
  } catch (e) {
    if (e.code === 'ER_ACCESS_DENIED_ERROR') console.error('Senha do MySQL errada. Corrija DB_PASSWORD no arquivo .env');
    else if (e.code === 'ECONNREFUSED') console.error('MySQL desligado. Inicie o serviço MySQL (services.msc).');
    else console.error(e.message);
    process.exit(1);
  }
})();
