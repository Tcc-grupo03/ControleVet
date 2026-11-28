import { iniciarPacientes } from "./pacientes.js";
import { iniciarProcedimentos } from "./procedimentos.js";
import { iniciarClientes } from "./clientes.js";
import { rotas } from "./rotas.js";

const conteudo = document.getElementById('conteudo');
const menu = document.getElementById('menu');
const btnMenu = document.getElementById('btn-menu');

const USUARIO_TESTE = { email: 'admin@email.com', senha: 'Senha123' };

function estaLogado() {
  return sessionStorage.getItem('logado') === 'true';
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function senhaValida(senha) {
  return senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha);
}

function mostrarErro(elemento, mensagem) {
  elemento.textContent = mensagem;
}

async function carregarPagina() {
  const hash = rotas[location.hash] ? location.hash : '#login';
  const rota = rotas[hash];
  const logado = estaLogado();

  if (!rota.publica && !logado) {
    location.hash = '#login';
    return;
  }
  if (hash === '#login' && logado) {
    location.hash = '#visao-geral';
    return;
  }

  menu.classList.toggle('oculto', rota.publica === true && !logado);

  document.querySelectorAll('#menu nav a').forEach(link => {
    const ativo = link.getAttribute('href') === hash;
    link.classList.toggle('ativo', ativo);
    link.querySelectorAll('i').forEach(icone => {
      icone.classList.toggle('fa-jello', ativo);
    });
  });
  document.title = `${rota.titulo} · MaisVET`;

  try {
    const resposta = await fetch(rota.pagina);
    if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
    conteudo.innerHTML = await resposta.text();
  } catch (erro) {
    conteudo.innerHTML = '<p class="erro">Não foi possível carregar a página. Verifique se o projeto está rodando em um servidor local.</p>';
    return;
  }

  const iniciar = iniciadores[hash];
  if (iniciar) iniciar();
}

function iniciarLogin() {
  const form = document.getElementById('form-login');
  const erro = document.getElementById('erro-login');

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    if (!emailValido(email)) {
      mostrarErro(erro, 'Informe um e-mail válido.');
      return;
    }
    if (!senhaValida(senha)) {
      mostrarErro(erro, 'A senha deve ter pelo menos 8 caracteres, com letras e números.');
      return;
    }
    if (email !== USUARIO_TESTE.email || senha !== USUARIO_TESTE.senha) {
      mostrarErro(erro, 'E-mail ou senha incorretos.');
      return;
    }

    sessionStorage.setItem('logado', 'true');
    location.hash = '#visao-geral';
  });
}

const iniciadores = {
  '#login': iniciarLogin,
  '#pacientes': iniciarPacientes,
  '#procedimentos': iniciarProcedimentos,
  '#clientes': iniciarClientes
};

document.getElementById('btn-sair').addEventListener('click', () => {
  sessionStorage.removeItem('logado');
  location.hash = '#login';
});

btnMenu.addEventListener('click', () => {
  const recolhido = menu.classList.toggle('recolhido');
  btnMenu.setAttribute('aria-expanded', String(!recolhido));
  btnMenu.setAttribute('aria-label', recolhido ? 'Expandir menu' : 'Recolher menu');
});

window.addEventListener('hashchange', carregarPagina);
carregarPagina();