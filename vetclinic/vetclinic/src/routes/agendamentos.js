const r = require('express').Router();
const db = require('../db');
const fmt = (d) => String(d).replace('T', ' ');
const valida = (d) => !!d && !isNaN(new Date(d));

r.get('/', async (req, res) => {
  const [rows] = await db.query(
    `SELECT a.id, a.data_agendamento, a.motivo,
            p.id AS pet_id, p.nome AS pet_nome, p.especie,
            t.id AS tutor_id, t.nome AS tutor_nome, t.telefone AS tutor_telefone
     FROM agendamentos a
     JOIN pets p ON p.id = a.pet_id
     JOIN tutores t ON t.id = p.tutor_id
     ORDER BY a.data_agendamento ASC`);
  res.json(rows);
});

r.post('/', async (req, res) => {
  const { pet_id, data_agendamento, motivo } = req.body || {};
  if (!pet_id || !valida(data_agendamento)) return res.status(400).json({ erro: 'Informe pet e data válida.' });
  try {
    const [x] = await db.query('INSERT INTO agendamentos (pet_id, data_agendamento, motivo) VALUES (?,?,?)',
      [pet_id, fmt(data_agendamento), motivo || null]);
    res.status(201).json({ id: x.insertId });
  } catch (e) {
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ erro: 'Pet inexistente.' });
    throw e;
  }
});

// remarcar
r.patch('/:id/data', async (req, res) => {
  const { data_agendamento } = req.body || {};
  if (!valida(data_agendamento)) return res.status(400).json({ erro: 'Data inválida.' });
  const [x] = await db.query('UPDATE agendamentos SET data_agendamento=? WHERE id=?',
    [fmt(data_agendamento), req.params.id]);
  x.affectedRows ? res.json({ ok: true }) : res.status(404).json({ erro: 'Agendamento não encontrado.' });
});

r.delete('/:id', async (req, res) => {
  const [x] = await db.query('DELETE FROM agendamentos WHERE id = ?', [req.params.id]);
  x.affectedRows ? res.json({ ok: true }) : res.status(404).json({ erro: 'Agendamento não encontrado.' });
});
module.exports = r;
