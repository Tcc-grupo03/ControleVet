import { CHAVE_PACIENTE_PRONTUARIO_SELECIONADO, obterPacientes } from "./dados.js";

export function iniciarPacientes() {
    const busca = document.getElementById('filtro-busca');
    const especie = document.getElementById('filtro-especie');
    const corpo = document.getElementById('corpo-tabela');
    const contador = document.getElementById('contador');

    function escaparHtml(valor) {
        return String(valor).replace(/[&<>"']/g, caractere => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[caractere]);
    }

    corpo.addEventListener('click', evento => {
        const linkFicha = evento.target.closest('a[data-paciente-id]');
        if (linkFicha) {
            sessionStorage.setItem(CHAVE_PACIENTE_PRONTUARIO_SELECIONADO, linkFicha.dataset.pacienteId);
        }
    });

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
            <td><a href="#procedimentos" data-paciente-id="${escaparHtml(p.id)}" aria-label="Ver ficha de ${escaparHtml(p.nome)}">Ver ficha</a></td>
          </tr>`).join('')
            : '<tr><td colspan="6">Nenhum paciente encontrado.</td></tr>';
    }

    busca.addEventListener('input', desenhar);
    especie.addEventListener('change', desenhar);
    desenhar();
};