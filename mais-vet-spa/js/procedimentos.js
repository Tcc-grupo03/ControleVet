import {
    CHAVE_PACIENTE_PRONTUARIO_SELECIONADO,
    obterPacientes,
    carregarProntuarios,
    salvarProntuarios
} from "./dados.js";

export function iniciarProcedimentos() {
    const form = document.getElementById('form-prontuario');
    const campoPaciente = document.getElementById('prontuario-paciente');
    const resultadosPaciente = document.getElementById('resultados-prontuario-paciente');
    const opcoesPaciente = document.getElementById('opcoes-prontuario-paciente');
    const semResultadosPaciente = document.getElementById('sem-resultados-prontuario-paciente');
    const filtroHistorico = document.getElementById('filtro-prontuario');
    const lista = document.getElementById('lista-prontuarios');
    const resumoPaciente = document.getElementById('resumo-paciente-prontuario');
    const contadorHistorico = document.getElementById('contador-historico-prontuario');
    const mensagem = document.getElementById('mensagem-prontuario');
    const botaoSalvar = document.getElementById('salvar-prontuario');
    const pacienteSolicitadoId = sessionStorage.getItem(CHAVE_PACIENTE_PRONTUARIO_SELECIONADO);
    sessionStorage.removeItem(CHAVE_PACIENTE_PRONTUARIO_SELECIONADO);
    const hoje = new Date();
    const dataLocal = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    document.getElementById('prontuario-data').value = dataLocal;

    function escaparHtml(valor) {
        return String(valor).replace(/[&<>"']/g, caractere => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[caractere]);
    }

    function gerarIdentificador(prefixo, existentes) {
      let identificador;
      do {
        identificador = `${prefixo}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      } while (existentes.includes(identificador));
      existentes.push(identificador);
      return identificador;
    };

    let pacientes;
    let prontuarios;
    let pacienteSelecionadoId = '';
    try {
        pacientes = obterPacientes();
        prontuarios = carregarProntuarios();
    } catch (erro) {
        mensagem.textContent = `Não foi possível carregar os dados: ${erro.message}`;
        mensagem.classList.add('erro');
        campoPaciente.disabled = true;
        botaoSalvar.disabled = true;
        lista.innerHTML = '<p class="prontuario-vazio">Não foi possível carregar as fichas médicas.</p>';
        return;
    }

    document.getElementById('total-pets-prontuario').textContent = pacientes.length;
    document.getElementById('total-registros-prontuario').textContent = prontuarios.length;
    document.getElementById('total-procedimentos-prontuario').textContent =
        prontuarios.filter(prontuario => prontuario.tipo === 'Procedimento').length;

    campoPaciente.disabled = pacientes.length === 0;
    campoPaciente.placeholder = pacientes.length
        ? 'Buscar por nome, código ou tutor'
        : 'Nenhum pet cadastrado';
    botaoSalvar.disabled = pacientes.length === 0;

    function desenharOpcoesPaciente() {
        const termo = campoPaciente.value.trim().toLowerCase();
        const filtrados = pacientes.filter(paciente =>
            [paciente.nome, paciente.id, paciente.especie, paciente.raca, paciente.tutor]
                .join(' ').toLowerCase().includes(termo)
        );

        opcoesPaciente.innerHTML = filtrados.map(paciente => `
      <button type="button" role="option" aria-selected="false" data-paciente-id="${escaparHtml(paciente.id)}">
        <strong>${escaparHtml(paciente.nome)} · ${escaparHtml(paciente.especie)} — ${escaparHtml(paciente.tutor)}</strong>
        <span>${escaparHtml(paciente.id)} · ${escaparHtml(paciente.raca)}</span>
      </button>
    `).join('');
        opcoesPaciente.hidden = filtrados.length === 0;
        semResultadosPaciente.hidden = filtrados.length !== 0;
        resultadosPaciente.hidden = false;
        campoPaciente.setAttribute('aria-expanded', 'true');
    }

    function selecionarPaciente(paciente) {
        pacienteSelecionadoId = paciente.id;
        campoPaciente.value = `${paciente.nome} · ${paciente.especie} — ${paciente.tutor}`;
        campoPaciente.setCustomValidity('');
        resultadosPaciente.hidden = true;
        campoPaciente.setAttribute('aria-expanded', 'false');
        desenharHistorico();
    }

    function desenharHistorico() {
        const paciente = pacientes.find(item => item.id === pacienteSelecionadoId);
        if (!paciente) {
            resumoPaciente.innerHTML = '';
            contadorHistorico.textContent = '';
            lista.innerHTML = '<p class="prontuario-vazio">Selecione um pet para consultar ou registrar sua ficha médica.</p>';
            return;
        }

        const registrosPaciente = prontuarios
            .filter(prontuario => prontuario.pacienteId === paciente.id)
            .sort((a, b) => b.data.localeCompare(a.data));
        const pesoAtual = registrosPaciente.find(prontuario => prontuario.peso);
        const pesoFormatado = pesoAtual
            ? `${pesoAtual.peso.replace('.', ',')} kg`
            : 'Peso não informado';
        const termo = filtroHistorico.value.trim().toLowerCase();
        const filtrados = registrosPaciente.filter(prontuario =>
            [
                prontuario.tipo,
                prontuario.procedimento,
                prontuario.profissional,
                prontuario.peso,
                prontuario.diagnostico,
                prontuario.conduta,
                prontuario.data
            ].join(' ').toLowerCase().includes(termo)
        );

        resumoPaciente.innerHTML = `
      <div class="prontuario-avatar" aria-hidden="true">${escaparHtml(paciente.nome.slice(0, 2).toUpperCase())}</div>
      <div>
        <strong>${escaparHtml(paciente.nome)}</strong>
        <span>${escaparHtml(paciente.especie)} · ${escaparHtml(paciente.raca)} · ${escaparHtml(pesoFormatado)}</span>
        <span>Tutor(a): ${escaparHtml(paciente.tutor)}</span>
      </div>`;
        contadorHistorico.textContent = `${filtrados.length} de ${registrosPaciente.length} registro(s) na ficha`;
        lista.innerHTML = filtrados.length
            ? filtrados.map(prontuario => `
          <article class="prontuario-registro">
            <div class="prontuario-registro-cabecalho">
              <div>
                <span class="selo">${escaparHtml(prontuario.tipo)}</span>
                <h3>${escaparHtml(prontuario.procedimento)}</h3>
              </div>
              <time datetime="${escaparHtml(prontuario.data)}">${escaparHtml(prontuario.data.split('-').reverse().join('/'))}</time>
            </div>
            <p class="prontuario-profissional">Doutor(a): ${escaparHtml(prontuario.profissional)}</p>
            ${prontuario.diagnostico ? `<div class="prontuario-detalhe"><strong>Avaliação</strong><p>${escaparHtml(prontuario.diagnostico)}</p></div>` : ''}
            ${prontuario.conduta ? `<div class="prontuario-detalhe"><strong>Conduta e observações</strong><p>${escaparHtml(prontuario.conduta)}</p></div>` : ''}
          </article>`).join('')
            : `<p class="prontuario-vazio">${termo ? 'Nenhum registro corresponde à busca.' : 'Ainda não há atendimentos registrados para este pet.'}</p>`;
    }

    campoPaciente.setCustomValidity('Selecione um pet da lista.');
    campoPaciente.addEventListener('focus', desenharOpcoesPaciente);
    campoPaciente.addEventListener('input', () => {
        pacienteSelecionadoId = '';
        campoPaciente.setCustomValidity('Selecione um pet da lista.');
        desenharOpcoesPaciente();
        desenharHistorico();
    });
    opcoesPaciente.addEventListener('click', evento => {
        const opcao = evento.target.closest('[data-paciente-id]');
        if (!opcao) return;

        const paciente = pacientes.find(item => item.id === opcao.dataset.pacienteId);
        if (paciente) selecionarPaciente(paciente);
    });
    filtroHistorico.addEventListener('input', desenharHistorico);
    form.addEventListener('submit', evento => {
        evento.preventDefault();
        const peso = document.getElementById('prontuario-peso').value;
        const novoProntuario = {
            id: gerarIdentificador('FICHA', prontuarios.map(prontuario => prontuario.id)),
            pacienteId: pacienteSelecionadoId,
            data: document.getElementById('prontuario-data').value,
            tipo: document.getElementById('prontuario-tipo').value,
            procedimento: document.getElementById('prontuario-procedimento').value.trim(),
            profissional: document.getElementById('prontuario-profissional').value.trim(),
            peso: peso ? Number(peso).toString() : '',
            diagnostico: document.getElementById('prontuario-diagnostico').value.trim(),
            conduta: document.getElementById('prontuario-conduta').value.trim()
        };

        try {
            const prontuariosAtualizados = [novoProntuario, ...prontuarios];
            salvarProntuarios(prontuariosAtualizados);
            prontuarios = prontuariosAtualizados;
        } catch (erro) {
            mensagem.textContent = `Não foi possível salvar o atendimento: ${erro.message}`;
            mensagem.classList.add('erro');
            return;
        }

        document.getElementById('total-registros-prontuario').textContent = prontuarios.length;
        document.getElementById('total-procedimentos-prontuario').textContent =
            prontuarios.filter(prontuario => prontuario.tipo === 'Procedimento').length;
        filtroHistorico.value = '';
        document.getElementById('prontuario-procedimento').value = '';
        document.getElementById('prontuario-profissional').value = '';
        document.getElementById('prontuario-peso').value = '';
        document.getElementById('prontuario-diagnostico').value = '';
        document.getElementById('prontuario-conduta').value = '';
        mensagem.textContent = 'Atendimento salvo na ficha médica.';
        mensagem.classList.remove('erro');
        desenharHistorico();
    });

    const pacienteSolicitado = pacientes.find(item => item.id === pacienteSolicitadoId);
    if (pacienteSolicitado) {
        selecionarPaciente(pacienteSolicitado);
    } else {
        if (pacienteSolicitadoId) {
            mensagem.textContent = 'Não foi possível localizar o pet para abrir a ficha médica.';
            mensagem.classList.add('erro');
        }
        desenharHistorico();
    }
};