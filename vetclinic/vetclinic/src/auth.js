const jwt = require('jsonwebtoken');
exports.gerarToken = (u) =>
  jwt.sign({ id: u.id, nome: u.nome }, process.env.JWT_SECRET, { expiresIn: '15m' }); // sessão expira sozinha
exports.auth = (req, res, next) => {
  const h = req.headers.authorization || '';
  try {
    req.user = jwt.verify(h.replace('Bearer ', ''), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  }
};
