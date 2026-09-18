export const user = {
  id: 'cand-1',
  name: 'Lucas Silva',
  title: 'Enfermeiro / Gestor de Saúde',
  cpf: '000.000.000-00',
  nationality: 'Brasileira',
  neighborhood: 'Bela Vista',
  number: '1000',
  complement: '',
  desiredSalary: 'R$ 8.500',
  availability: 'Imediata',
  workPreference: 'Presencial',
  summary: 'Enfermeiro com experiência em gestão, processos, liderança e indicadores.',
  portfolioUrl: 'https://lucasilva.example.com',
  email: 'lucas.silva@email.com',
  phone: '+55 11 98765-4321',
  birthDate: '1992-03-15',
  gender: 'Masculino',
  pcdOption: 'Não',
  cep: '01310-100',
  address: 'Av. Paulista, 1000',
  city: 'São Paulo',
  state: 'SP',
  location: 'São Paulo, SP',
  linkedin: 'linkedin.com/in/lucasilva',
  profileProgress: 85,
  profileMissingHint: 'Adicione Idiomas para atingir 100%',
  photoUrl: null,
}

export const ufList = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export const sectors = [
  { id: 'saude', label: 'Saúde', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  { id: 'financas', label: 'Finanças', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { id: 'comercial', label: 'Comercial / Vendas', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  { id: 'marketing', label: 'Marketing', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'logistica', label: 'Logística / Operações', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
]

const pipelineTemplates = {
  saude: ['Triagem de Currículo', 'Avaliação de Títulos', 'Entrevista com Gestor'],
  financas: ['Triagem de Currículo', 'Teste Técnico FP&A', 'Case Prático', 'Painel de Entrevistas', 'Proposta Final'],
  comercial: ['Triagem de Currículo', 'Teste Comportamental', 'Entrevista Comercial', 'Entrevista com Diretoria'],
  marketing: ['Triagem de Currículo', 'Case de Marketing', 'Entrevista com o Time', 'Teste de Conhecimentos'],
  logistica: ['Triagem de Currículo', 'Entrevista com RH', 'Entrevista com Operações'],
}

export const jobs = [
  {
    id: 'job-1',
    title: 'Enfermeiro Intensivista UTI',
    company: 'Rede D\'Or',
    sector: 'saude',
    location: 'São Paulo, SP',
    model: 'Presencial',
    salary: 'R$ 8.500 - R$ 11.000',
    type: 'CLT',
    postedAt: 'Há 3 dias',
    description:
      'Atuação em unidade de terapia intensiva adulto com suporte à equipe multidisciplinar, manejo de pacientes críticos, administração de medicamentos de alta complexidade e liderança do time de enfermagem em turnos de plantão. Buscamos profissionais com sólida vivência em UTI e perfil de liderança.',
    requirements: [
      'Graduação em Enfermagem e COREN ativo',
      'Especialização ou Residência em UTI',
      'Mínimo de 3 anos em UTI adulto',
      'Domínio de protocolos de sedação e ventilação mecânica',
      'Disponibilidade para plantões 12x36',
    ],
    benefits: [
      'Plano de saúde e odontológico integral',
      'Gympass',
      'Auxílio alimentação R$ 800',
      'Programa de educação continuada',
      'Day off de aniversário',
    ],
    pipeline: {
      totalSteps: pipelineTemplates.saude.length,
      steps: pipelineTemplates.saude,
    },
  },
  {
    id: 'job-2',
    title: 'Analista Financeiro FP&A Senior',
    company: 'Fintech Vertex',
    sector: 'financas',
    location: 'Remoto',
    model: 'Remoto',
    salary: 'R$ 12.000 - R$ 15.000',
    type: 'PJ',
    postedAt: 'Há 1 semana',
    description:
      'Responsável por modelagem financeira, orçamento anual e forecasting. Atuará junto à diretoria na construção de cenários, análises de viabilidade de novos produtos e relatórios gerenciais para investidores. Experiência com ferramentas de BI e domínio avançado de Excel são diferenciais determinantes.',
    requirements: [
      'Formação em Administração, Economia ou Engenharia',
      '5+ anos em FP&A ou Controladoria',
      'Domínio avançado de Excel e modelagem financeira',
      'Experiência com Looker/Power BI',
      'Inglês avançado para reporting global',
    ],
    benefits: [
      'Stock options',
      'Home office allowance R$ 300/mês',
      'Plano de saúde sem coparticipação',
      'Auxílio educação anual',
      'Horário flexível',
    ],
    pipeline: {
      totalSteps: pipelineTemplates.financas.length,
      steps: pipelineTemplates.financas,
    },
  },
  {
    id: 'job-3',
    title: 'Executivo de Contas B2B',
    company: 'SolarEnergy',
    sector: 'comercial',
    location: 'Campinas, SP',
    model: 'Híbrido',
    salary: 'R$ 6.000 - R$ 9.000 + Comissões',
    type: 'CLT + Variável',
    postedAt: 'Há 5 dias',
    description:
      'Prospecção e gestão de carteira de clientes empresariais de energia solar, negociação de contratos de longo prazo e apresentação de soluções de eficiência energética. Meta mensal de R$ 500 mil em propostas fechadas, com forte apoio de equipe de engenharia e pós-venda.',
    requirements: [
      'Experiência comprovada em vendas B2B complexas',
      'Bom relacionamento interpessoal e oratória',
      'Vivência com CRM (Salesforce ou RD Station)',
      'Disponibilidade para viagens regionais',
      'Ensino superior completo ou cursando',
    ],
    benefits: [
      'Comissões sem teto',
      'Carro da empresa + combustível',
      'Plano de saúde e seguro de vida',
      'Premiação anual por performance',
      'Previdência privada',
    ],
    pipeline: {
      totalSteps: pipelineTemplates.comercial.length,
      steps: pipelineTemplates.comercial,
    },
  },
  {
    id: 'job-4',
    title: 'Coordenador de Marketing Digital',
    company: 'ModaViva Retail',
    sector: 'marketing',
    location: 'Rio de Janeiro, RJ',
    model: 'Híbrido',
    salary: 'R$ 7.500 - R$ 10.000',
    type: 'CLT',
    postedAt: 'Há 2 dias',
    description:
      'Liderança do time de performance e conteúdo de uma rede varejista de moda. Responsável por planejar campanhas de aquisição, gerir verba de mídia em Google e Meta, e coordenar agências. Acompanhamento diário de KPIs e apresentação de resultados para a diretoria comercial.',
    requirements: [
      'Experiência com gestão de tráfego pago (Google/Meta)',
      'Liderança de equipes de marketing',
      'Domínio de GA4 e ferramentas de automação',
      'Visão analítica e orientação a resultados',
      'Portfólio de campanhas de alto investimento',
    ],
    benefits: [
      'Desconto exclusivo em produtos da marca',
      'Plano de saúde e dental',
      'Bônus por performance da operação',
      'Auxílio home office',
      'Programa de desenvolvimento de líderes',
    ],
    pipeline: {
      totalSteps: pipelineTemplates.marketing.length,
      steps: pipelineTemplates.marketing,
    },
  },
  {
    id: 'job-5',
    title: 'Supervisor de Logística e Frota',
    company: 'Expresso Brasil',
    sector: 'logistica',
    location: 'São Paulo, SP',
    model: 'Presencial',
    salary: 'R$ 5.500 - R$ 7.000',
    type: 'CLT',
    postedAt: 'Há 4 dias',
    description:
      'Supervisão de operação de transporte e distribuição com frota própria de 120 veículos. Gestão de roteirização, controle de custos com combustível e manutenção, e liderança de motoristas e auxiliares de logística. Garantir SLA de entrega e segurança operacional em todo o território nacional.',
    requirements: [
      'Experiência em operações logísticas e gestão de frota',
      'Conhecimento em roteirização e TMS',
      'Liderança de equipes operacionais',
      'Habilitação B e disponibilidade para plantões',
      'Ensino médio completo (superior diferencial)',
    ],
    benefits: [
      'Vale-alimentação e vale-refeição',
      'Plano de saúde',
      'Participação nos lucros (PLR)',
      'Cesta básica',
      'Escola de formação técnica interna',
    ],
    pipeline: {
      totalSteps: pipelineTemplates.logistica.length,
      steps: pipelineTemplates.logistica,
    },
  },
]

export const initialApplications = [
  {
    id: 'app-1',
    jobId: 'job-1',
    appliedAt: '2026-08-12',
    currentStep: 1,
    status: 'Em andamento',
    interviews: [
      {
        id: 'int-1',
        title: 'Entrevista com Gestor de Enfermagem',
        date: '2026-08-25',
        time: '14:30',
        host: 'Dra. Camila Rocha — Coord. UTI',
        status: 'confirmed',
        link: 'https://meet.example.com/uts-rede-dor',
        duration: '45 min',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Teste Comportamental',
        type: 'questionnaire',
        status: 'done',
        deadline: '2026-08-20',
        description: 'Avaliação de perfil de liderança e resiliência.',
        questions: [
          'Como você age sob pressão em um plantão superlotado?',
          'Descreva um conflito de equipe que você mediou.',
        ],
      },
      {
        id: 'task-2',
        title: 'Avaliação de Títulos e Certificados',
        type: 'document',
        status: 'pending',
        deadline: '2026-08-24',
        description: 'Envio de COREN, certificado de UTI e residência.',
      },
    ],
    documents: [
      { id: 'doc-1', name: 'COREN SP — Registro Ativo', type: 'Registro profissional', status: 'sent' },
      { id: 'doc-2', name: 'Certificado de Especialização em UTI', type: 'Certificado', status: 'review' },
      { id: 'doc-3', name: 'Comprovante de Residência', type: 'Comprovante', status: 'pending' },
    ],
  },
  {
    id: 'app-2',
    jobId: 'job-2',
    appliedAt: '2026-08-10',
    currentStep: 0,
    status: 'Em andamento',
    interviews: [
      {
        id: 'int-2',
        title: 'Entrevista Inicial com Recrutadora',
        date: '2026-08-28',
        time: '10:00',
        host: 'Mariana Costa — People Team',
        status: 'suggested',
        link: 'https://meet.example.com/vertex-fpa',
        duration: '30 min',
      },
    ],
    tasks: [
      {
        id: 'task-3',
        title: 'Teste Técnico FP&A',
        type: 'practical',
        status: 'pending',
        deadline: '2026-08-30',
        description: 'Planilha de modelagem com cenários de DRE.',
      },
    ],
    documents: [
      { id: 'doc-4', name: 'Currículo atualizado', type: 'Currículo', status: 'sent' },
    ],
  },
  {
    id: 'app-3',
    jobId: 'job-3',
    appliedAt: '2026-08-05',
    currentStep: 2,
    status: 'Em andamento',
    interviews: [
      {
        id: 'int-3',
        title: 'Entrevista Comercial com Gerente Regional',
        date: '2026-08-22',
        time: '16:00',
        host: 'Rafael Nogueira — Gerente Regional',
        status: 'pending',
        link: 'https://meet.example.com/solar-b2b',
        duration: '50 min',
      },
    ],
    tasks: [
      {
        id: 'task-4',
        title: 'Teste Comportamental',
        type: 'questionnaire',
        status: 'pending',
        deadline: '2026-08-21',
        description: 'Dinâmica de perfil comercial e negociação.',
        questions: [
          'Como você conduz uma objeção de preço no fechamento?',
          'Dê um exemplo de meta que você superou em vendas.',
        ],
      },
    ],
    documents: [
      { id: 'doc-5', name: 'Comprovante de Endereço', type: 'Comprovante', status: 'sent' },
    ],
  },
]

export const initialResume = {
  id: 'resume-main',
  name: 'Currículo Geral',
  summary:
    'Enfermeiro com 8 anos de experiência em UTI, gestão de equipes e projetos de saúde. Transição para carreira multi-setorial em gestão, com forte vivência em liderança, processos e dados.',
  experiences: [
    {
      id: 'exp-1',
      role: 'Enfermeiro Intensivista / Coordenador de Plantão',
      company: 'Hospital Sírio-Libanês',
      modality: 'Presencial · CLT',
      period: { start: 'Jan 2023', end: 'Presente' },
      current: true,
      description:
        'Coordenação de equipe de 14 técnicos e auxiliares de enfermagem em UTI de 30 leitos. Redução de 22% em eventos adversos via padronização de protocolos. Liderança de treinamentos mensais e auditorias internas.',
      skills: ['Liderança de Equipe', 'Protocolos de UTI', 'Gestão de Escala', 'SBAR', 'Indicadores Clínicos'],
    },
    {
      id: 'exp-2',
      role: 'Enfermeiro Sênior de UTI',
      company: 'Rede D\'Or São Luiz',
      modality: 'Presencial · CLT',
      period: { start: 'Mar 2019', end: 'Dez 2022' },
      current: false,
      description:
        'Assistência a pacientes críticos e participação no time de resposta rápida. Implantação de checklist de prevenção de infecções que reduziu 18% da taxa de PAVM.',
      skills: ['Ventilação Mecânica', 'Hemodiálise', 'Prevenção de Infecção', 'Acolhimento'],
    },
    {
      id: 'exp-3',
      role: 'Enfermeiro Assistencial',
      company: 'Hospital das Clínicas FMUSP',
      modality: 'Presencial · CLT',
      period: { start: 'Fev 2016', end: 'Fev 2019' },
      current: false,
      description:
        'Atuação em enfermaria de clínica médica e emergência. Desenvolvimento de materiais educativos para pacientes e familiares. Suporte a residentes em treinamento.',
      skills: ['Clínica Médica', 'Emergência', 'Educação em Saúde', 'Administração de Medicamentos'],
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'Residência em Enfermagem em UTI',
      institution: 'Hospital Sírio-Libanês',
      period: '2020 - 2022',
    },
    {
      id: 'edu-2',
      degree: 'Bacharelado em Enfermagem',
      institution: 'Universidade de São Paulo',
      period: '2011 - 2015',
    },
    {
      id: 'edu-3',
      degree: 'MBA em Gestão de Saúde',
      institution: 'FGV',
      period: '2023 - 2024',
    },
  ],
  skills: [
    { name: 'Liderança de Equipes', level: 'Avançado' },
    { name: 'Gestão de Escalas', level: 'Avançado' },
    { name: 'Indicadores Clínicos', level: 'Intermediário' },
    { name: 'Excel / Planilhas', level: 'Avançado' },
    { name: 'Power BI', level: 'Intermediário' },
    { name: 'PowerPoint', level: 'Intermediário' },
  ],
  languages: [
    { name: 'Português', level: 'Nativo' },
    { name: 'Inglês', level: 'Avançado' },
  ],
  portfolio: [
    { label: 'LinkedIn', url: 'https://linkedin.com/in/lucasilva', type: 'linkedin' },
    { label: 'Portfólio de Projetos', url: 'https://lucasilva.example.com', type: 'website' },
  ],
  certificates: [
    {
      id: 'cert-1',
      title: 'ACLS - Suporte Avançado de Vida Cardiovascular',
      institution: 'American Heart Association',
      year: '2025',
      description: 'Certificação internacional de atendimento à parada cardiorrespiratória.',
    },
    {
      id: 'cert-2',
      title: 'Excel Avançado para Gestão em Saúde',
      institution: 'FGV Educação Executiva',
      year: '2024',
      description: 'Análise de indicadores e dashboards gerenciais.',
    },
  ],
}
