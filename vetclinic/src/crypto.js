const crypto = require('crypto');
const key = Buffer.from(process.env.CPF_KEY || '', 'hex');
if (key.length !== 32) throw new Error('CPF_KEY deve ter 64 caracteres hex (32 bytes)');

exports.encrypt = (txt) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(txt, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64');
};
exports.decrypt = (b64) => {
  const buf = Buffer.from(b64, 'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', key, buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8');
};
exports.hash = (txt) => crypto.createHmac('sha256', key).update(txt).digest('hex');

exports.cpfValido = (cpf) => {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false;
  for (const t of [9, 10]) {
    let s = 0;
    for (let i = 0; i < t; i++) s += +cpf[i] * (t + 1 - i);
    if (((s * 10) % 11) % 10 !== +cpf[t]) return false;
  }
  return true;
};
