const r = require('express').Router();
const db = require('../db');
const { encrypt, decrypt, hash, cpfValido } = require('../crypto');

const out = (t) => ({ id: t.id, nome: t.nome, cpf: decrypt(t.cpf_cifrado), telefone: t.telefone, email: t.email });
const limpa = (c) => String(c || '').replace(/\D/g, '');

r.get('/', async (req, res) => {
  const busca = `%${(req.query.busca || '').trim()}%`;
  const [rows] = await db.query('SELECT * FROM tutores WHERE nome LIKE ? ORDER BY nome', [busca]);
  res.json(rows.map(out));
});

r.post('/', async (req, res) => {
  const { nome, telefone, email } = req.body || {};
  const cpf = limpa(req.body?.cpf);
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });
  if (!cpfValido(cpf)) return res.status(400).json({ erro: 'CPF inválido.' });
  try {
    const [x] = await db.query(
      'INSERT INTO tutores (nome, cpf_cifrado, cpf_hash, telefone, email) VALUES (?,?,?,?,?)',
      [nome.trim(), encrypt(cpf), hash(cpf), telefone || null, email || null]);
    res.status(201).json({ id: x.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'CPF já cadastrado.' });
    throw e;
  }
});

r.put('/:id', async (req, res) => {
  const { nome, telefone, email } = req.body || {};
  const cpf = limpa(req.body?.cpf);
  if (!nome?.trim()) return res.status(400).json({ erro: 'Nome é obrigatório.' });
  if (!cpfValido(cpf)) return res.status(400).json({ erro: 'CPF inválido.' });
  try {
    const [x] = await db.query(
      'UPDATE tutores SET nome=?, cpf_cifrado=?, cpf_hash=?, telefone=?, email=? WHERE id=?',
      [nome.trim(), encrypt(cpf), hash(cpf), telefone || null, email || null, req.params.id]);
    if (!x.affectedRows) return res.status(404).json({ erro: 'Tutor não encontrado.' });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'CPF já cadastrado.' });
    throw e;
  }
});

r.delete('/:id', async (req, res) => {
  try {
    const [x] = await db.query('DELETE FROM tutores WHERE id = ?', [req.params.id]);
    if (!x.affectedRows) return res.status(404).json({ erro: 'Tutor não encontrado.' });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ erro: 'Tutor possui pets. Exclua os pets primeiro.' });
    throw e;
  }
});
module.exports = r;
