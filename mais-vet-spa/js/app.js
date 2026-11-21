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

function escaparHtml(valor) {
  return String(valor).replace(/[&<>"']/g, caractere => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[caractere]);
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
    link.classList.toggle('ativo', link.getAttribute('href') === hash);
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

function iniciarPacientes() {
  const busca = document.getElementById('filtro-busca');
  const especie = document.getElementById('filtro-especie');
  const corpo = document.getElementById('corpo-tabela');
  const contador = document.getElementById('contador');

  function desenhar() {
    const termo = busca.value.trim().toLowerCase();
    let todosPacientes;
    try {
      todosPacientes = obterPacientes();
    } catch (erro) {
      contador.textContent = erro.message;
      corpo.innerHTML = '<tr><td colspan="6">Não foi possível carregar os pacientes.</td></tr>';
      return;
    }

    const filtrados = todosPacientes.filter(p =>
      (!especie.value || p.especie === especie.value) &&
      (!termo ||
        p.nome.toLowerCase().includes(termo) ||
        p.id.toLowerCase().includes(termo) ||
        p.tutor.toLowerCase().includes(termo))
    );

    contador.textContent = `${filtrados.length} paciente(s) encontrado(s)`;
    corpo.innerHTML = filtrados.length
      ? filtrados.map(p => `
          <tr>
            <td><strong>${escaparHtml(p.nome)}</strong><br><small>${escaparHtml(p.id)}</small></td>
            <td>${escaparHtml(p.especie)} · ${escaparHtml(p.raca)}</td>
            <td>${escaparHtml(p.tutor)}</td>
            <td>${escaparHtml(p.ultimaVisita)}</td>
            <td><span class="selo">Ativo</span></td>
            <td><a href="#pacientes">Ver ficha</a></td>
          </tr>`).join('')
      : '<tr><td colspan="6">Nenhum paciente encontrado.</td></tr>';
  }

  busca.addEventListener('input', desenhar);
  especie.addEventListener('change', desenhar);
  desenhar();
}

function iniciarClientes() {
  const form = document.getElementById('form-cliente');
  const petsContainer = document.getElementById('lista-pets-form');
  const busca = document.getElementById('filtro-clientes');
  const corpo = document.getElementById('corpo-clientes');
  const contadorClientes = document.getElementById('contador-clientes');
  const contadorPets = document.getElementById('contador-pets');
  const mensagem = document.getElementById('mensagem-cliente');
  const tituloFormulario = document.getElementById('titulo-cadastro-cliente');
  const descricaoFormulario = document.getElementById('descricao-form-cliente');
  const botaoSalvar = form.querySelector('button[type="submit"]');
  const botaoCancelarEdicao = document.getElementById('cancelar-edicao-cliente');

  let clientes;
  let clienteEmEdicaoId = null;
  try {
    clientes = carregarClientes();
  } catch (erro) {
    mensagem.textContent = erro.message;
    mensagem.classList.add('erro');
    botaoSalvar.disabled = true;
    return;
  }

  function mostrarMensagem(texto, ehErro) {
    mensagem.textContent = texto;
    mensagem.classList.toggle('erro', ehErro);
  }

  function atualizarBotoesRemover() {
    const botoes = petsContainer.querySelectorAll('.remover-pet');
    botoes.forEach(botao => {
      botao.disabled = botoes.length === 1;
    });
  }

  function criarFormularioPet(pet) {
    const item = document.createElement('div');
    item.className = 'cliente-pet-form';
    item.innerHTML = `
      <div class="cliente-pet-campos">
        <label>Nome do pet<input class="pet-nome" type="text" required maxlength="80"></label>
        <label>Espécie
          <select class="pet-especie" required>
            <option value="">Selecione</option>
            <option>Canina</option>
            <option>Felina</option>
            <option>Ave</option>
            <option>Réptil</option>
            <option>Roedor</option>
            <option>Outra</option>
          </select>
        </label>
        <label>Raça<input class="pet-raca" type="text" required maxlength="80"></label>
          <div class="cliente-pet-visita">
            <button class="btn-secundario btn-visita-pet" type="button">＋ Registrar última visita</button>
            <label class="campo-visita oculto">Data da última visita
              <input class="pet-ultima-visita" type="date">
            </label>
          </div>
      </div>
      <button class="btn-remover-pet remover-pet" type="button" aria-label="Remover pet">Remover</button>`;

    const campoVisita = item.querySelector('.campo-visita');
    const botaoVisita = item.querySelector('.btn-visita-pet');
    if (pet) {
      if (pet.id) item.dataset.petId = pet.id;
      item.querySelector('.pet-nome').value = pet.nome;
      item.querySelector('.pet-especie').value = pet.especie;
      item.querySelector('.pet-raca').value = pet.raca;
      item.querySelector('.pet-ultima-visita').value = pet.ultimaVisita || '';
      if (pet.ultimaVisita) {
          campoVisita.classList.remove('oculto');
          botaoVisita.textContent = 'Ocultar data';
      }
    }
    return item;
  }

  function limparFormularioCliente() {
    form.reset();
    petsContainer.innerHTML = '';
    petsContainer.appendChild(criarFormularioPet());
    clienteEmEdicaoId = null;
    tituloFormulario.textContent = 'Cadastrar cliente';
    descricaoFormulario.textContent = 'Preencha os dados do tutor e adicione um ou mais pets.';
    botaoSalvar.textContent = 'Salvar cadastro';
    botaoCancelarEdicao.hidden = true;
    atualizarBotoesRemover();
  }

  function iniciarEdicao(cliente) {
    clienteEmEdicaoId = cliente.id;
    document.getElementById('cliente-nome').value = cliente.nome;
    document.getElementById('cliente-telefone').value = cliente.telefone;
    document.getElementById('cliente-email').value = cliente.email || '';
    document.getElementById('cliente-cpf').value = cliente.cpf || '';
    document.getElementById('cliente-endereco').value = cliente.endereco || '';
    petsContainer.innerHTML = '';
    (cliente.pets.length ? cliente.pets : [null]).forEach(pet => {
      petsContainer.appendChild(criarFormularioPet(pet));
    });
    tituloFormulario.textContent = 'Editar cliente';
    descricaoFormulario.textContent = 'Atualize os dados do tutor e dos pets vinculados.';
    botaoSalvar.textContent = 'Salvar alterações';
    botaoCancelarEdicao.hidden = false;
    mostrarMensagem('', false);
    atualizarBotoesRemover();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('cliente-nome').focus();
  }

  function desenharClientes() {
    const termo = busca.value.trim().toLowerCase();
    const filtrados = clientes.filter(cliente => {
      const texto = [
        cliente.nome,
        cliente.telefone,
        cliente.email,
        ...cliente.pets.map(pet => pet.nome)
      ].join(' ').toLowerCase();
      return texto.includes(termo);
    });

    contadorClientes.textContent = clientes.length;
    contadorPets.textContent = clientes.reduce((total, cliente) => total + cliente.pets.length, 0);
    corpo.innerHTML = filtrados.length
      ? filtrados.map(cliente => `
          <tr>
            <td><strong>${escaparHtml(cliente.nome)}</strong><br><small>${escaparHtml(cliente.email || 'E-mail não informado')}</small></td>
            <td>${escaparHtml(cliente.telefone)}</td>
            <td><div class="clientes-pets-resumo">${cliente.pets.map(pet => `<span class="cliente-pet-resumo">${escaparHtml(pet.nome)} · ${escaparHtml(pet.especie)}</span>`).join('')}</div></td>
            <td>${cliente.pets.length}</td>
            <td>
              <div class="clientes-acoes">
                <button class="btn-acao-tabela editar" type="button" data-acao="editar" data-cliente-id="${escaparHtml(cliente.id)}" aria-label="Editar cliente ${escaparHtml(cliente.nome)}">Editar</button>
                <button class="btn-acao-tabela remover" type="button" data-acao="remover" data-cliente-id="${escaparHtml(cliente.id)}" aria-label="Remover cliente ${escaparHtml(cliente.nome)}">Remover</button>
              </div>
            </td>
          </tr>`).join('')
      : `<tr><td colspan="5">${termo ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</td></tr>`;
  }

  document.getElementById('adicionar-pet').addEventListener('click', () => {
    petsContainer.appendChild(criarFormularioPet());
    atualizarBotoesRemover();
    petsContainer.lastElementChild.querySelector('.pet-nome').focus();
  });

  petsContainer.addEventListener('click', evento => {
    const botaoVisita = evento.target.closest('.btn-visita-pet');
    if (botaoVisita) {
      const campoVisita = botaoVisita.closest('.cliente-pet-form').querySelector('.campo-visita');
      const oculto = campoVisita.classList.toggle('oculto');
      botaoVisita.textContent = oculto ? '＋ Registrar última visita' : 'Ocultar data';
      if (!oculto) campoVisita.querySelector('input').focus();
      return;
    }

    const botao = evento.target.closest('.remover-pet');
    if (!botao || botao.disabled) return;
    botao.closest('.cliente-pet-form').remove();
    atualizarBotoesRemover();
  });

  botaoCancelarEdicao.addEventListener('click', () => {
    limparFormularioCliente();
    mostrarMensagem('Edição cancelada.', false);
  });

  corpo.addEventListener('click', evento => {
    const botao = evento.target.closest('[data-acao][data-cliente-id]');
    if (!botao) return;
    const cliente = clientes.find(item => item.id === botao.dataset.clienteId);
    if (!cliente) return;

    if (botao.dataset.acao === 'editar') {
      iniciarEdicao(cliente);
      return;
    }

    if (botao.dataset.acao !== 'remover') return;
    const quantidadePets = cliente.pets.length;
    if (!confirm(`Remover ${cliente.nome} e os ${quantidadePets} pet(s) vinculados?`)) return;

    const clientesAtualizados = clientes.filter(item => item.id !== cliente.id);
    try {
      salvarClientes(clientesAtualizados);
      clientes = clientesAtualizados;
    } catch (erro) {
      mostrarMensagem(`Não foi possível remover o cadastro: ${erro.message}`, true);
      return;
    }

    if (clienteEmEdicaoId === cliente.id) limparFormularioCliente();
    mostrarMensagem('Cliente e pets removidos com sucesso.', false);
    desenharClientes();
  });

  busca.addEventListener('input', desenharClientes);
  form.addEventListener('submit', evento => {
    evento.preventDefault();
    const itensPets = Array.from(petsContainer.querySelectorAll('.cliente-pet-form'));
    const pets = itensPets.map(item => ({
      id: item.dataset.petId || null,
      nome: item.querySelector('.pet-nome').value.trim(),
      especie: item.querySelector('.pet-especie').value,
      raca: item.querySelector('.pet-raca').value.trim(),
      ultimaVisita: item.querySelector('.pet-ultima-visita').value
    }));
    const idsExistentes = clientes.flatMap(cliente => [cliente.id, ...cliente.pets.map(pet => pet.id)]);
    const clienteAtualizado = {
      id: clienteEmEdicaoId || gerarIdentificador('CLI', idsExistentes),
      nome: document.getElementById('cliente-nome').value.trim(),
      telefone: document.getElementById('cliente-telefone').value.trim(),
      email: document.getElementById('cliente-email').value.trim(),
      cpf: document.getElementById('cliente-cpf').value.trim(),
      endereco: document.getElementById('cliente-endereco').value.trim(),
      pets: pets.map(pet => ({
        ...pet,
        id: pet.id || gerarIdentificador('PET', idsExistentes)
      }))
    };

    try {
      const clientesAtualizados = clienteEmEdicaoId
        ? clientes.map(cliente => cliente.id === clienteEmEdicaoId ? clienteAtualizado : cliente)
        : [clienteAtualizado, ...clientes];
      salvarClientes(clientesAtualizados);
      clientes = clientesAtualizados;
    } catch (erro) {
      mostrarMensagem(`Não foi possível salvar o cadastro: ${erro.message}`, true);
      return;
    }

    const estavaEditando = Boolean(clienteEmEdicaoId);
    limparFormularioCliente();
    mostrarMensagem(estavaEditando ? 'Alterações salvas com sucesso.' : 'Cliente e pets cadastrados com sucesso.', false);
    desenharClientes();
  });

  desenharClientes();
}

function gerarIdentificador(prefixo, existentes) {
  let identificador;
  do {
    identificador = `${prefixo}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  } while (existentes.includes(identificador));
  existentes.push(identificador);
  return identificador;
}

const iniciadores = {
  '#login': iniciarLogin,
  '#pacientes': iniciarPacientes,
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