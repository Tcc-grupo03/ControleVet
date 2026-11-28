const pacientes = [
  { id: 'PET-001', nome: 'Luna',  especie: 'Canina', raca: 'Golden retriever', tutor: 'Ana Oliveira',    ultimaVisita: '20/10/2026' },
  { id: 'PET-002', nome: 'Bento', especie: 'Canina', raca: 'Shih-tzu',         tutor: 'Pedro Lima',      ultimaVisita: '20/10/2026' },
  { id: 'PET-003', nome: 'Mel',   especie: 'Felina', raca: 'Siamês',           tutor: 'Juliana Santos',  ultimaVisita: '18/10/2026' },
  { id: 'PET-004', nome: 'Thor',  especie: 'Canina', raca: 'Labrador',         tutor: 'Lucas Ferreira',  ultimaVisita: '19/10/2026' },
  { id: 'PET-005', nome: 'Nina',  especie: 'Canina', raca: 'Sem raça definida', tutor: 'Fernanda Rocha', ultimaVisita: '16/10/2026' },
  { id: 'PET-006', nome: 'Simba', especie: 'Felina', raca: 'Sem raça definida', tutor: 'Ana Oliveira',   ultimaVisita: '15/10/2026' },
  { id: 'PET-007', nome: 'Sol', especie: 'Felina', raca: 'Sem raça definida', tutor: 'Raquel Pinheiro',   ultimaVisita: '20/05/2026' }
];

const CHAVE_CLIENTES = 'maisvet-clientes';
const CHAVE_MIGRACAO_CLIENTES = 'maisvet-clientes-pacientes-migrados';
const CHAVE_PRONTUARIOS = 'maisvet-prontuarios';
export const CHAVE_PACIENTE_PRONTUARIO_SELECIONADO = 'paciente-prontuario-selecionado';
const TIPOS_PRONTUARIO = ['Consulta', 'Vacinação', 'Exame', 'Procedimento', 'Retorno', 'Outro'];

const contatosDemonstracao = {
  'Ana Oliveira': {
    telefone: '(11) 90000-0001',
    email: 'ana.oliveira@example.com',
    cpf: '000.000.000-01',
    endereco: 'Rua das Flores, 100 - Jardins, São Paulo/SP'
  },
  'Pedro Lima': {
    telefone: '(11) 90000-0002',
    email: 'pedro.lima@example.com',
    cpf: '000.000.000-02',
    endereco: 'Av. Paulista, 200 - Bela Vista, São Paulo/SP'
  },
  'Juliana Santos': {
    telefone: '(11) 90000-0003',
    email: 'juliana.santos@example.com',
    cpf: '000.000.000-03',
    endereco: 'Rua das Acácias, 300 - Pinheiros, São Paulo/SP'
  },
  'Lucas Ferreira': {
    telefone: '(11) 90000-0004',
    email: 'lucas.ferreira@example.com',
    cpf: '000.000.000-04',
    endereco: 'Rua dos Ipês, 400 - Moema, São Paulo/SP'
  },
  'Fernanda Rocha': {
    telefone: '(11) 90000-0005',
    email: 'fernanda.rocha@example.com',
    cpf: '000.000.000-05',
    endereco: 'Alameda Santos, 500 - Jardins, São Paulo/SP'
  },
  'Raquel Pinheiro': {
    telefone: '(11) 90000-0006',
    email: 'raquel.pinheiro@example.com',
    cpf: '000.000.000-06',
    endereco: 'Rua Harmonia, 600 - Vila Madalena, São Paulo/SP'
  }
};

function normalizarTexto(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function criarClientesDosPacientes() {
  const clientesPorTutor = new Map();

  pacientes.forEach(paciente => {
    if (!clientesPorTutor.has(paciente.tutor)) {
      const contato = contatosDemonstracao[paciente.tutor];
      clientesPorTutor.set(paciente.tutor, {
        id: `CLI-PAC-${String(clientesPorTutor.size + 1).padStart(3, '0')}`,
        nome: paciente.tutor,
        ...contato,
        pets: []
      });
    }

    clientesPorTutor.get(paciente.tutor).pets.push({
      id: paciente.id,
      nome: paciente.nome,
      especie: paciente.especie,
      raca: paciente.raca,
      ultimaVisita: paciente.ultimaVisita.split('/').reverse().join('-')
    });
  });

  return Array.from(clientesPorTutor.values());
}

function mesclarClientesDosPacientes(clientes) {
  criarClientesDosPacientes().forEach(clienteInicial => {
    const clienteExistente = clientes.find(cliente =>
      normalizarTexto(cliente.nome) === normalizarTexto(clienteInicial.nome)
    );
    if (!clienteExistente) {
      clientes.push(clienteInicial);
      return;
    }

    ['telefone', 'email', 'cpf', 'endereco'].forEach(campo => {
      if (!clienteExistente[campo]) clienteExistente[campo] = clienteInicial[campo];
    });

    clienteInicial.pets.forEach(petInicial => {
      const petExistente = clienteExistente.pets.find(pet =>
        normalizarTexto(pet.nome) === normalizarTexto(petInicial.nome)
      );
      if (!petExistente) {
        clienteExistente.pets.push(petInicial);
        return;
      }

      ['especie', 'raca', 'ultimaVisita'].forEach(campo => {
        if (!petExistente[campo]) petExistente[campo] = petInicial[campo];
      });
    });
  });

  return clientes;
}

export function carregarClientes() {
  const dados = localStorage.getItem(CHAVE_CLIENTES);
  let clientes = [];
  if (dados) {
    try {
      clientes = JSON.parse(dados);
    } catch {
      throw new Error('Os clientes salvos estão inválidos. Limpe os dados do navegador para continuar.');
    }
  }
  if (!Array.isArray(clientes)) {
    throw new Error('Os clientes salvos estão inválidos. Limpe os dados do navegador para continuar.');
  }
  const clientesValidos = clientes.every(cliente =>
    cliente &&
    typeof cliente.nome === 'string' &&
    typeof cliente.telefone === 'string' &&
    Array.isArray(cliente.pets) &&
    cliente.pets.every(pet =>
      pet &&
      typeof pet.nome === 'string' &&
      typeof pet.especie === 'string' &&
      typeof pet.raca === 'string'
    )
  );
  if (!clientesValidos) {
    throw new Error('Os clientes salvos estão inválidos. Limpe os dados do navegador para continuar.');
  }

  if (localStorage.getItem(CHAVE_MIGRACAO_CLIENTES) !== 'true') {
    clientes = mesclarClientesDosPacientes(clientes);
    salvarClientes(clientes);
    localStorage.setItem(CHAVE_MIGRACAO_CLIENTES, 'true');
  }
  return clientes;
}

export function salvarClientes(clientes) {
  localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(clientes));
}

export function carregarProntuarios() {
  const dados = localStorage.getItem(CHAVE_PRONTUARIOS);
  if (!dados) return [];

  let prontuarios;
  try {
    prontuarios = JSON.parse(dados);
  } catch {
    throw new Error('Os prontuários salvos estão inválidos. Limpe os dados do navegador para continuar.');
  }

  const prontuariosValidos = Array.isArray(prontuarios) && prontuarios.every(prontuario =>
    prontuario &&
    typeof prontuario.id === 'string' &&
    typeof prontuario.pacienteId === 'string' &&
    typeof prontuario.data === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(prontuario.data) &&
    TIPOS_PRONTUARIO.includes(prontuario.tipo) &&
    typeof prontuario.procedimento === 'string' &&
    typeof prontuario.profissional === 'string' &&
    typeof prontuario.peso === 'string' &&
    typeof prontuario.diagnostico === 'string' &&
    typeof prontuario.conduta === 'string'
  );
  if (!prontuariosValidos) {
    throw new Error('Os prontuários salvos estão inválidos. Limpe os dados do navegador para continuar.');
  }

  return prontuarios;
}

export function salvarProntuarios(prontuarios) {
  localStorage.setItem(CHAVE_PRONTUARIOS, JSON.stringify(prontuarios));
}

export function obterPacientes() {
  return carregarClientes().flatMap(cliente =>
    cliente.pets.map(pet => ({
      ...pet,
      tutor: cliente.nome,
      ultimaVisita: pet.ultimaVisita
        ? pet.ultimaVisita.split('-').reverse().join('/')
        : '—'
    }))
  );
}