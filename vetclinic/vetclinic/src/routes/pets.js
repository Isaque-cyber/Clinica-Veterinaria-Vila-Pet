const r = require('express').Router();
const db = require('../db');

r.get('/', async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.id, p.nome, p.especie, p.raca, p.tutor_id, t.nome AS tutor_nome
     FROM pets p JOIN tutores t ON t.id = p.tutor_id ORDER BY p.nome`);
  res.json(rows);
});

async function salvar(req, res, sql, extra = []) {
  const { nome, especie, raca, tutor_id } = req.body || {};
  if (!nome?.trim() || !especie?.trim()) { res.status(400).json({ erro: 'Nome e espécie são obrigatórios.' }); return null; }
  if (!tutor_id) { res.status(400).json({ erro: 'Todo pet precisa de um tutor.' }); return null; }
  try {
    const [x] = await db.query(sql, [nome.trim(), especie.trim(), raca || null, tutor_id, ...extra]);
    return x;
  } catch (e) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') { res.status(400).json({ erro: 'Tutor inexistente.' }); return null; }
    throw e;
  }
}

r.post('/', async (req, res) => {
  const x = await salvar(req, res, 'INSERT INTO pets (nome, especie, raca, tutor_id) VALUES (?,?,?,?)');
  if (x) res.status(201).json({ id: x.insertId });
});
r.put('/:id', async (req, res) => {
  const x = await salvar(req, res, 'UPDATE pets SET nome=?, especie=?, raca=?, tutor_id=? WHERE id=?', [req.params.id]);
  if (x) x.affectedRows ? res.json({ ok: true }) : res.status(404).json({ erro: 'Pet não encontrado.' });
});
r.delete('/:id', async (req, res) => {
  const [x] = await db.query('DELETE FROM pets WHERE id = ?', [req.params.id]);
  x.affectedRows ? res.json({ ok: true }) : res.status(404).json({ erro: 'Pet não encontrado.' });
});
module.exports = r;
