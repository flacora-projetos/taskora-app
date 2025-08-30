// teamRepo.js - Repositório de dados para gestão da equipe
// Compatível com SCHEMA_TASKORA.md

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

import { db } from '../firebase.js';
import { EventBus } from '../utils/eventBus.js';

// Constantes para especialidades
export const TEAM_SPECIALTIES = {
  DEVELOPMENT: 'Desenvolvimento',
  MARKETING: 'Marketing',
  COPYWRITING: 'Copywriting',
  SOCIAL_MEDIA: 'Social Media',
  SEO: 'SEO/SEM',
  PROJECT_MANAGEMENT: 'Gestão de Projetos',
  TRAFFIC_MANAGER: 'Gestor de Tráfego',
  STRATEGY: 'Estratégia'
};

// Constantes para níveis
export const TEAM_LEVELS = {
  JUNIOR: 'Júnior',
  PLENO: 'Pleno',
  SENIOR: 'Sênior',
  LEAD: 'Lead',
  MANAGER: 'Manager',
  DIRECTOR: 'Diretor'
};

// Constantes para status
export const TEAM_STATUS = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  VACATION: 'Férias',
  SICK_LEAVE: 'Afastado'
};

// Cache para otimização
let teamCache = [];
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Listener para mudanças em tempo real
let unsubscribeTeam = null;

/**
 * Inicializa o listener em tempo real para a coleção team
 */
export function initTeamListener() {
  if (unsubscribeTeam) {
    unsubscribeTeam();
  }

  const q = query(
    collection(db, 'team'),
    orderBy('name', 'asc')
  );

  unsubscribeTeam = onSnapshot(q, (snapshot) => {
    teamCache = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    lastFetch = Date.now();
    EventBus.emit('team:updated', teamCache);
  }, (error) => {
    console.error('Erro no listener de team:', error);
    EventBus.emit('team:error', error);
  });
}

/**
 * Para o listener em tempo real
 */
export function stopTeamListener() {
  if (unsubscribeTeam) {
    unsubscribeTeam();
    unsubscribeTeam = null;
  }
}

/**
 * Lista todos os membros da equipe
 */
export async function listTeamMembers() {
  try {
    // Verifica cache
    if (teamCache.length > 0 && (Date.now() - lastFetch) < CACHE_DURATION) {
      return teamCache;
    }

    const q = query(
      collection(db, 'team'),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    teamCache = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    lastFetch = Date.now();
    return teamCache;
  } catch (error) {
    console.error('Erro ao listar membros da equipe:', error);
    throw error;
  }
}

/**
 * Busca um membro específico por ID
 */
export async function getTeamMember(id) {
  try {
    const docRef = doc(db, 'team', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('Membro não encontrado');
    }
  } catch (error) {
    console.error('Erro ao buscar membro:', error);
    throw error;
  }
}

/**
 * Cria um novo membro da equipe
 */
export async function createTeamMember(memberData) {
  try {
    // Validação dos dados obrigatórios
    const requiredFields = ['name', 'email', 'specialty', 'level'];
    for (const field of requiredFields) {
      if (!memberData[field] || (Array.isArray(memberData[field]) && memberData[field].length === 0)) {
        throw new Error(`Campo obrigatório: ${field}`);
      }
    }

    // Validação de email único
    const existingMember = await checkEmailExists(memberData.email);
    if (existingMember) {
      throw new Error('Email já cadastrado');
    }

    const newMember = {
      ...memberData,
      status: memberData.status || TEAM_STATUS.ACTIVE,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      totalHours: 0,
      totalTasks: 0,
      averageRating: 0
    };

    const docRef = await addDoc(collection(db, 'team'), newMember);
    
    const createdMember = {
      id: docRef.id,
      ...newMember
    };

    EventBus.emit('team:created', createdMember);
    return createdMember;
  } catch (error) {
    console.error('Erro ao criar membro:', error);
    throw error;
  }
}

/**
 * Atualiza um membro da equipe
 */
export async function updateTeamMember(id, updateData) {
  try {
    // Validação de email único (se email foi alterado)
    if (updateData.email) {
      const existingMember = await checkEmailExists(updateData.email, id);
      if (existingMember) {
        throw new Error('Email já cadastrado');
      }
    }

    const docRef = doc(db, 'team', id);
    const dataToUpdate = {
      ...updateData,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, dataToUpdate);
    
    const updatedMember = await getTeamMember(id);
    EventBus.emit('team:updated', updatedMember);
    return updatedMember;
  } catch (error) {
    console.error('Erro ao atualizar membro:', error);
    throw error;
  }
}

/**
 * Remove um membro da equipe
 */
export async function deleteTeamMember(id) {
  try {
    // Verifica se o membro tem tarefas ativas
    const activeTasks = await checkMemberActiveTasks(id);
    if (activeTasks > 0) {
      throw new Error(`Não é possível excluir. Membro possui ${activeTasks} tarefa(s) ativa(s).`);
    }

    const docRef = doc(db, 'team', id);
    await deleteDoc(docRef);
    
    EventBus.emit('team:deleted', id);
    return true;
  } catch (error) {
    console.error('Erro ao excluir membro:', error);
    throw error;
  }
}

/**
 * Verifica se email já existe
 */
async function checkEmailExists(email, excludeId = null) {
  try {
    const q = query(
      collection(db, 'team'),
      where('email', '==', email)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (excludeId) {
      return querySnapshot.docs.find(doc => doc.id !== excludeId);
    }
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return false;
  }
}

/**
 * Verifica se membro tem tarefas ativas
 */
async function checkMemberActiveTasks(memberId) {
  try {
    const q = query(
      collection(db, 'tasks'),
      where('owner', '==', memberId),
      where('status', '!=', 'concluída')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Erro ao verificar tarefas ativas:', error);
    return 0;
  }
}

/**
 * Obtém estatísticas da equipe
 */
export async function getTeamStats() {
  try {
    const members = await listTeamMembers();
    
    const stats = {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.status === TEAM_STATUS.ACTIVE).length,
      averageHourlyRate: 0,
      totalHoursWorked: 0,
      specialtyDistribution: {},
      levelDistribution: {}
    };

    // Calcula estatísticas
    let totalRate = 0;
    let totalHours = 0;

    members.forEach(member => {
      // Taxa média
      if (member.hourlyRate) {
        totalRate += member.hourlyRate;
      }

      // Horas totais
      if (member.totalHours) {
        totalHours += member.totalHours;
      }

      // Distribuição por especialidade
      const specialty = member.specialty || 'Não definido';
      stats.specialtyDistribution[specialty] = (stats.specialtyDistribution[specialty] || 0) + 1;

      // Distribuição por nível
      const level = member.level || 'Não definido';
      stats.levelDistribution[level] = (stats.levelDistribution[level] || 0) + 1;
    });

    stats.averageHourlyRate = members.length > 0 ? Math.round(totalRate / members.length) : 0;
    stats.totalHoursWorked = totalHours;

    return stats;
  } catch (error) {
    console.error('Erro ao obter estatísticas da equipe:', error);
    throw error;
  }
}

/**
 * Busca membros por filtros
 */
export async function searchTeamMembers(filters = {}) {
  try {
    let members = await listTeamMembers();

    // Aplicar filtros
    if (filters.status) {
      members = members.filter(member => member.status === filters.status);
    }

    if (filters.specialty) {
      members = members.filter(member => member.specialty === filters.specialty);
    }

    if (filters.level) {
      members = members.filter(member => member.level === filters.level);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      members = members.filter(member => 
        member.name?.toLowerCase().includes(searchTerm) ||
        member.email?.toLowerCase().includes(searchTerm) ||
        member.phone?.toLowerCase().includes(searchTerm)
      );
    }

    return members;
  } catch (error) {
    console.error('Erro ao buscar membros:', error);
    throw error;
  }
}

/**
 * Atualiza estatísticas de um membro (horas, tarefas, etc.)
 */
export async function updateMemberStats(memberId, stats) {
  try {
    const docRef = doc(db, 'team', memberId);
    await updateDoc(docRef, {
      ...stats,
      updatedAt: serverTimestamp()
    });
    
    EventBus.emit('team:stats-updated', { memberId, stats });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar estatísticas do membro:', error);
    throw error;
  }
}

// Inicializa o listener automaticamente
if (typeof window !== 'undefined') {
  initTeamListener();
}