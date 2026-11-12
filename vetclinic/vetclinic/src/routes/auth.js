const r = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { gerarToken } = require('../auth');

r.post('/login', async (req, res) => {
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' });
  const [[u]] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  if (!u) return res.status(401).json({ erro: 'Usuário não encontrado.' });
  if (!(await bcrypt.compare(senha, u.senha_hash))) return res.status(401).json({ erro: 'Senha incorreta.' });
  res.json({ token: gerarToken(u), nome: u.nome });
});
module.exports = r;
