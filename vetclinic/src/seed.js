require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');
(async () => {
  const h = await bcrypt.hash('123456', 10);
  await db.query('INSERT IGNORE INTO usuarios (nome, email, senha_hash) VALUES (?,?,?)',
    ['Marcos', 'marcos@clinica.com', h]);
  console.log('Usuário criado: marcos@clinica.com / 123456');
  process.exit();
})();
