// staticTeamData.js - Dados estáticos da equipe para contornar problemas de Firebase
// Esta é uma solução temporária até resolver os problemas de conexão WebChannel

export const STATIC_TEAM_MEMBERS = [
  {
    id: 'team-001',
    name: 'Ana Silva',
    email: 'ana@dacora.com.br',
    phone: '(11) 99999-9999',
    specialty: ['Marketing', 'Estratégia'],
    level: 'Sênior',
    status: 'Ativo',
    notes: 'Especialista em estratégia digital e marketing de conteúdo',
    totalHours: 240,
    totalTasks: 15,
    averageRating: 4.8,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-08-30')
  },
  {
    id: 'team-002',
    name: 'Carlos Santos',
    email: 'carlos@dacora.com.br',
    phone: '(11) 88888-8888',
    specialty: ['Desenvolvimento'],
    level: 'Pleno',
    status: 'Ativo',
    notes: 'Full-stack developer especializado em React e Node.js',
    totalHours: 320,
    totalTasks: 22,
    averageRating: 4.6,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-08-30')
  },
  {
    id: 'team-003',
    name: 'Maria Costa',
    email: 'maria@dacora.com.br',
    phone: '(11) 77777-7777',
    specialty: ['Gestor de Tráfego'],
    level: 'Lead',
    status: 'Ativo',
    notes: 'Especialista em tráfego pago Google Ads e Facebook Ads',
    totalHours: 280,
    totalTasks: 18,
    averageRating: 4.9,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-08-30')
  },
  {
    id: 'team-004',
    name: 'João Oliveira',
    email: 'joao@dacora.com.br',
    phone: '(11) 66666-6666',
    specialty: ['Copywriting', 'Social Media'],
    level: 'Pleno',
    status: 'Ativo',
    notes: 'Copywriter e social media manager',
    totalHours: 195,
    totalTasks: 12,
    averageRating: 4.5,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-08-30')
  },
  {
    id: 'team-005',
    name: 'Fernanda Lima',
    email: 'fernanda@dacora.com.br',
    phone: '(11) 55555-5555',
    specialty: ['SEO/SEM', 'Gestão de Projetos'],
    level: 'Sênior',
    status: 'Ativo',
    notes: 'Especialista em SEO e gestão de projetos digitais',
    totalHours: 310,
    totalTasks: 20,
    averageRating: 4.7,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-08-30')
  },
  {
    id: 'team-006',
    name: 'Pedro Almeida',
    email: 'pedro@dacora.com.br',
    phone: '(11) 44444-4444',
    specialty: ['Desenvolvimento', 'SEO/SEM'],
    level: 'Júnior',
    status: 'Ativo',
    notes: 'Desenvolvedor frontend e especialista em SEO técnico',
    totalHours: 150,
    totalTasks: 8,
    averageRating: 4.3,
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-08-30')
  }
];

/**
 * Simula a função listTeamMembers do Firebase
 * Retorna apenas membros ativos
 */
export function getActiveTeamMembers() {
  return STATIC_TEAM_MEMBERS.filter(member => member.status === 'Ativo');
}

/**
 * Simula a função de busca por ID
 */
export function getTeamMemberById(id) {
  return STATIC_TEAM_MEMBERS.find(member => member.id === id);
}

/**
 * Simula estatísticas da equipe
 */
export function getTeamStats() {
  const activeMembers = getActiveTeamMembers();
  
  return {
    totalMembers: STATIC_TEAM_MEMBERS.length,
    activeMembers: activeMembers.length,
    totalHours: activeMembers.reduce((sum, member) => sum + member.totalHours, 0),
    totalTasks: activeMembers.reduce((sum, member) => sum + member.totalTasks, 0),
    averageRating: activeMembers.reduce((sum, member) => sum + member.averageRating, 0) / activeMembers.length
  };
}

/**
 * Lista apenas os nomes dos membros ativos (para compatibilidade com metaRepo)
 */
export function getActiveTeamMemberNames() {
  return getActiveTeamMembers().map(member => member.name);
}

console.log('📊 Dados estáticos da equipe carregados:', {
  total: STATIC_TEAM_MEMBERS.length,
  ativos: getActiveTeamMembers().length,
  nomes: getActiveTeamMemberNames()
});