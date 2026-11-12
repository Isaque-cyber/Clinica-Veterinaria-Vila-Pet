const $ = (id) => document.getElementById(id);
const IDLE_MS = 15 * 60 * 1000;
let idleTimer;

/* ---------- API ---------- */
async function api(url, method = 'GET', body) {
  const res = await fetch('/api' + url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (sessionStorage.token || '') },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !url.startsWith('/auth')) { sair('Sessão expirada. Entre novamente.'); throw new Error('401'); }
  if (!res.ok) throw new Error(data.erro || 'Erro inesperado');
  return data;
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtData = (d) => new Date(d.replace(' ', 'T')).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const maskCpf = (c) => c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

/* ---------- Sessão ---------- */
function resetIdle() { clearTimeout(idleTimer); idleTimer = setTimeout(() => sair('Sessão expirada por inatividade.'), IDLE_MS); }
['click', 'keydown', 'mousemove'].forEach((e) => document.addEventListener(e, () => sessionStorage.token && resetIdle()));

function sair(msg = '') {
  sessionStorage.clear(); clearTimeout(idleTimer);
  $('tela-app').hidden = true; $('tela-login').hidden = false; $('login-erro').textContent = msg;
}
function entrar(nome) {
  $('tela-login').hidden = true; $('tela-app').hidden = false;
  $('usuario').textContent = $('usuario2').textContent = nome;
  resetIdle(); rota();
}
$('btn-sair').onclick = () => sair();
$('form-login').onsubmit = async (e) => {
  e.preventDefault(); $('login-erro').textContent = '';
  try {
    const r = await api('/auth/login', 'POST', { email: $('login-email').value, senha: $('login-senha').value });
    sessionStorage.token = r.token; sessionStorage.nome = r.nome; $('login-senha').value = '';
    entrar(r.nome);
  } catch (err) { $('login-erro').textContent = err.message; }
};

/* ---------- Rotas ---------- */
const secoes = ['home', 'tutores', 'pets', 'agendamentos'];
function rota() {
  const s = secoes.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
  secoes.forEach((x) => ($(x).hidden = x !== s));
  if (s === 'tutores') carregarTutores();
  if (s === 'pets') carregarPets();
  if (s === 'agendamentos') carregarAg();
}
window.onhashchange = () => sessionStorage.token && rota();

/* ---------- Tutores ---------- */
let tutores = [];
async function carregarTutores() {
  tutores = await api('/tutores?busca=' + encodeURIComponent($('busca-tutor').value));
  $('lista-tutores').innerHTML = tutores.map((t) => `<tr>
    <td>${esc(t.nome)}</td><td>${maskCpf(t.cpf)}</td><td>${esc(t.telefone)}</td><td>${esc(t.email)}</td>
    <td><button onclick="editarTutor(${t.id})">Editar</button>
        <button class="del" onclick="excluirTutor(${t.id})">Excluir</button></td></tr>`).join('')
    || '<tr><td colspan="5">Nenhum tutor encontrado.</td></tr>';
}
let deb; $('busca-tutor').oninput = () => { clearTimeout(deb); deb = setTimeout(carregarTutores, 250); };
window.editarTutor = (id) => {
  const t = tutores.find((x) => x.id === id);
  $('t-id').value = t.id; $('t-nome').value = t.nome; $('t-cpf').value = t.cpf; $('t-tel').value = t.telefone || ''; $('t-email').value = t.email || '';
  window.scrollTo(0, 0);
};
window.excluirTutor = async (id) => {
  if (!confirm('Excluir este tutor?')) return;
  try { await api('/tutores/' + id, 'DELETE'); $('t-msg').textContent = ''; carregarTutores(); }
  catch (e) { $('t-msg').textContent = e.message; }
};
const limparTutor = () => { $('form-tutor').reset(); $('t-id').value = ''; };
$('t-cancel').onclick = limparTutor;
$('form-tutor').onsubmit = async (e) => {
  e.preventDefault();
  const body = { nome: $('t-nome').value, cpf: $('t-cpf').value, telefone: $('t-tel').value, email: $('t-email').value };
  const id = $('t-id').value;
  try {
    await api(id ? '/tutores/' + id : '/tutores', id ? 'PUT' : 'POST', body);
    $('t-msg').textContent = ''; limparTutor(); carregarTutores();
  } catch (err) { $('t-msg').textContent = err.message; }
};

/* ---------- Pets ---------- */
let pets = [];
async function carregarPets() {
  const [ts, ps] = await Promise.all([api('/tutores'), api('/pets')]);
  pets = ps;
  $('p-tutor').innerHTML = '<option value="">Selecione o tutor...</option>' + ts.map((t) => `<option value="${t.id}">${esc(t.nome)}</option>`).join('');
  $('lista-pets').innerHTML = ps.map((p) => `<tr>
    <td>${esc(p.nome)}</td><td>${esc(p.especie)}</td><td>${esc(p.raca)}</td><td>${esc(p.tutor_nome)}</td>
    <td><button onclick="editarPet(${p.id})">Editar</button>
        <button class="del" onclick="excluirPet(${p.id})">Excluir</button></td></tr>`).join('')
    || '<tr><td colspan="5">Nenhum pet cadastrado.</td></tr>';
}
window.editarPet = (id) => {
  const p = pets.find((x) => x.id === id);
  $('p-id').value = p.id; $('p-nome').value = p.nome; $('p-especie').value = p.especie; $('p-raca').value = p.raca || ''; $('p-tutor').value = p.tutor_id;
};
window.excluirPet = async (id) => {
  if (!confirm('Excluir este pet?')) return;
  try { await api('/pets/' + id, 'DELETE'); carregarPets(); } catch (e) { $('p-msg').textContent = e.message; }
};
const limparPet = () => { $('form-pet').reset(); $('p-id').value = ''; };
$('p-cancel').onclick = limparPet;
$('form-pet').onsubmit = async (e) => {
  e.preventDefault();
  const body = { nome: $('p-nome').value, especie: $('p-especie').value, raca: $('p-raca').value, tutor_id: $('p-tutor').value };
  const id = $('p-id').value;
  try {
    await api(id ? '/pets/' + id : '/pets', id ? 'PUT' : 'POST', body);
    $('p-msg').textContent = ''; limparPet(); carregarPets();
  } catch (err) { $('p-msg').textContent = err.message; }
};

/* ---------- Agendamentos ---------- */
async function carregarAg() {
  const [ps, ags] = await Promise.all([api('/pets'), api('/agendamentos')]);
  $('a-pet').innerHTML = '<option value="">Selecione o pet...</option>' + ps.map((p) => `<option value="${p.id}">${esc(p.nome)} (${esc(p.tutor_nome)})</option>`).join('');
  $('lista-ag').innerHTML = ags.map((a) => `<tr>
    <td>${fmtData(a.data_agendamento)}</td><td>${esc(a.pet_nome)}</td><td>${esc(a.tutor_nome)}</td>
    <td>${esc(a.tutor_telefone)}</td><td>${esc(a.motivo)}</td>
    <td><button onclick="remarcar(${a.id}, '${a.data_agendamento}')">Remarcar</button>
        <button class="del" onclick="cancelarAg(${a.id})">Cancelar</button></td></tr>`).join('')
    || '<tr><td colspan="6">Nenhum agendamento.</td></tr>';
}
$('form-ag').onsubmit = async (e) => {
  e.preventDefault();
  try {
    await api('/agendamentos', 'POST', { pet_id: $('a-pet').value, data_agendamento: $('a-data').value, motivo: $('a-motivo').value });
    $('a-msg').textContent = ''; $('form-ag').reset(); carregarAg();
  } catch (err) { $('a-msg').textContent = err.message; }
};
window.remarcar = async (id, atual) => {
  const nova = prompt('Nova data e hora (AAAA-MM-DD HH:MM):', atual.slice(0, 16));
  if (!nova) return;
  try { await api(`/agendamentos/${id}/data`, 'PATCH', { data_agendamento: nova }); carregarAg(); }
  catch (e) { $('a-msg').textContent = e.message; }
};
window.cancelarAg = async (id) => {
  if (confirm('Cancelar este agendamento?')) { await api('/agendamentos/' + id, 'DELETE'); carregarAg(); }
};

/* ---------- Início ---------- */
if (sessionStorage.token) entrar(sessionStorage.nome);
