require('dotenv').config();
const express = require('express');
const path = require('path');
const { auth } = require('./auth');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tutores', auth, require('./routes/tutores'));
app.use('/api/pets', auth, require('./routes/pets'));
app.use('/api/agendamentos', auth, require('./routes/agendamentos'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});
const port = process.env.PORT || 3000;
app.listen(port, () => console.log('http://localhost:' + port));
