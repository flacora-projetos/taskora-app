// assets/js/data/clientsRepo.js
// Clients Repository - Gestão de clientes com orçamentos por plataforma
// Baseado no padrão do tasksRepo.js e schema TASKORA

let _db = null;

async function getDb() {
  if (_db) return _db;
  if (window.db) { _db = window.db; return _db; }

  if (!window.firebaseConfig) throw new Error('firebaseConfig não encontrado no window.');
  const appMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
  const fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const { initializeApp } = appMod;
  const { getFirestore }   = fsMod;
  const app = initializeApp(window.firebaseConfig);
  _db = getFirestore(app);
  return _db;
}

// Emitir evento global para atualização em tempo real
function emitClientsChanged(action, clientId) {
  try {
    const event = new CustomEvent('taskora:clients:changed', {
      detail: { action, clientId, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  } catch (err) {
    console.warn('[ClientsRepo] Erro ao emitir evento:', err);
  }
}

// Plataformas de marketing disponíveis
export const MARKETING_PLATFORMS = {
  META_ADS: 'Meta Ads (Facebook/Instagram)',
  GOOGLE_ADS: 'Google Ads',
  TIKTOK_ADS: 'TikTok Ads',
  LINKEDIN_ADS: 'LinkedIn Ads',
  YOUTUBE_ADS: 'YouTube Ads',
  PINTEREST_ADS: 'Pinterest Ads',
  TWITTER_ADS: 'Twitter Ads',
  SNAPCHAT_ADS: 'Snapchat Ads',
  OTHER: 'Outras Plataformas'
};

// Tiers de clientes
export const CLIENT_TIERS = {
  KEY_ACCOUNT: 'Key Account',
  MID_TIER: 'Mid Tier',
  LOW_TIER: 'Low Tier'
};

// Status de clientes
export const CLIENT_STATUS = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  PROSPECT: 'Prospect'
};

// Mapear dados da UI para o banco
async function mapUiToDb(uiPayload) {
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const { serverTimestamp } = fs;

  // Processar data de entrada
  let entryDate = null;
  if (uiPayload.entryDate) {
    const date = new Date(uiPayload.entryDate);
    if (!isNaN(date.getTime())) {
      entryDate = date;
    }
  }

  // Processar orçamentos por plataforma
  const budgets = {};
  if (uiPayload.budgets && typeof uiPayload.budgets === 'object') {
    Object.keys(uiPayload.budgets).forEach(platform => {
      const amount = parseFloat(uiPayload.budgets[platform]) || 0;
      if (amount > 0) {
        budgets[platform] = amount;
      }
    });
  }

  // Processar plataformas ativas
  const activePlatforms = Array.isArray(uiPayload.activePlatforms) 
    ? uiPayload.activePlatforms 
    : [];

  return {
    orgId: 'dacora', // Padrão da aplicação
    displayName: uiPayload.name || '',
    email: uiPayload.email || '',
    phone: uiPayload.phone || '',
    website: uiPayload.website || '',
    instagram: uiPayload.instagram || '',
    status: uiPayload.status || 'ATIVO',
    tier: uiPayload.tier || 'MID_TIER',
    responsible: uiPayload.responsible || '',
    entryDate: entryDate,
    budgets: budgets,
    activePlatforms: activePlatforms,
    documentLinks: uiPayload.documentLinks || '',
    notes: uiPayload.notes || '',
    tags: Array.isArray(uiPayload.tags) ? uiPayload.tags : [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

// Mapear dados do banco para a UI
async function mapDbToUi(docSnap) {
  const data = docSnap.data();
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const { Timestamp } = fs;

  // Processar data de entrada
  let entryDateStr = '';
  if (data.entryDate) {
    const date = data.entryDate instanceof Timestamp 
      ? data.entryDate.toDate() 
      : new Date(data.entryDate);
    if (!isNaN(date.getTime())) {
      entryDateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
  }

  // Calcular orçamento total
  let totalBudget = 0;
  if (data.budgets && typeof data.budgets === 'object') {
    totalBudget = Object.values(data.budgets).reduce((sum, amount) => {
      return sum + (parseFloat(amount) || 0);
    }, 0);
  }

  return {
    id: docSnap.id,
    name: data.displayName || '',
    email: data.email || '',
    phone: data.phone || '',
    website: data.website || '',
    instagram: data.instagram || '',
    status: data.status || 'ATIVO',
    tier: data.tier || 'MID_TIER',
    responsible: data.responsible || '',
    entryDate: entryDateStr,
    budgets: data.budgets || {},
    totalBudget: totalBudget,
    activePlatforms: data.activePlatforms || [],
    documentLinks: data.documentLinks || '',
    notes: data.notes || '',
    tags: data.tags || [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    orgId: data.orgId || null
  };
}

// Listar todos os clientes
export async function listClients(filters = {}) {
  try {
    const db = await getDb();
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const { collection, getDocs, query, orderBy, limit } = fs;
    
    let q = collection(db, 'clients');
    
    // Aplicar ordenação
    q = query(q, orderBy('displayName', 'asc'));
    
    // Aplicar limite se especificado
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }
    
    const snap = await getDocs(q);
    let clients = [];
    
    for (const doc of snap.docs) {
      const client = await mapDbToUi(doc);
      clients.push(client);
    }
    
    // Filtrar por orgId
    clients = clients.filter(c => c.orgId === 'dacora' || !c.orgId);
    
    // Aplicar filtros adicionais
    if (filters.status && filters.status !== 'all') {
      clients = clients.filter(c => c.status === filters.status);
    }
    
    if (filters.tier && filters.tier !== 'all') {
      clients = clients.filter(c => c.tier === filters.tier);
    }
    
    if (filters.responsible && filters.responsible !== 'all') {
      clients = clients.filter(c => c.responsible === filters.responsible);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      clients = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm) ||
        c.responsible.toLowerCase().includes(searchTerm)
      );
    }
    
    return clients;
  } catch (error) {
    console.error('[ClientsRepo] Erro ao listar clientes:', error);
    return [];
  }
}

// Criar novo cliente
export async function createClient(uiPayload) {
  try {
    const db = await getDb();
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const { collection, addDoc } = fs;
    
    const toSave = await mapUiToDb(uiPayload);
    const ref = await addDoc(collection(db, 'clients'), toSave);
    
    emitClientsChanged('create', ref.id);
    return ref.id;
  } catch (error) {
    console.error('[ClientsRepo] Erro ao criar cliente:', error);
    throw error;
  }
}

// Atualizar cliente existente
export async function updateClient(clientId, uiPayload) {
  try {
    const db = await getDb();
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const { doc, updateDoc, serverTimestamp } = fs;
    
    const toSave = await mapUiToDb(uiPayload);
    toSave.updatedAt = serverTimestamp();
    
    await updateDoc(doc(db, 'clients', clientId), toSave);
    
    emitClientsChanged('update', clientId);
  } catch (error) {
    console.error('[ClientsRepo] Erro ao atualizar cliente:', error);
    throw error;
  }
}

// Deletar cliente
export async function deleteClient(clientId) {
  try {
    const db = await getDb();
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const { doc, deleteDoc } = fs;
    
    await deleteDoc(doc(db, 'clients', clientId));
    
    emitClientsChanged('delete', clientId);
  } catch (error) {
    console.error('[ClientsRepo] Erro ao deletar cliente:', error);
    throw error;
  }
}

// Obter cliente por ID
export async function getClientById(clientId) {
  try {
    const db = await getDb();
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const { doc, getDoc } = fs;
    
    const docSnap = await getDoc(doc(db, 'clients', clientId));
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return await mapDbToUi(docSnap);
  } catch (error) {
    console.error('[ClientsRepo] Erro ao obter cliente:', error);
    return null;
  }
}

// Obter estatísticas dos clientes
export async function getClientsStats() {
  try {
    const clients = await listClients();
    
    const stats = {
      total: clients.length,
      totalBudget: 0,
      byTier: {
        KEY_ACCOUNT: 0,
        MID_TIER: 0,
        LOW_TIER: 0
      },
      byStatus: {
        ATIVO: 0,
        INATIVO: 0,
        PROSPECT: 0
      },
      topPlatforms: {}
    };
    
    clients.forEach(client => {
      // Somar orçamento total
      stats.totalBudget += client.totalBudget || 0;
      
      // Contar por tier
      if (stats.byTier[client.tier] !== undefined) {
        stats.byTier[client.tier]++;
      }
      
      // Contar por status
      if (stats.byStatus[client.status] !== undefined) {
        stats.byStatus[client.status]++;
      }
      
      // Contar plataformas ativas
      if (client.activePlatforms) {
        client.activePlatforms.forEach(platform => {
          stats.topPlatforms[platform] = (stats.topPlatforms[platform] || 0) + 1;
        });
      }
    });
    
    return stats;
  } catch (error) {
    console.error('[ClientsRepo] Erro ao obter estatísticas:', error);
    return {
      total: 0,
      totalBudget: 0,
      byTier: { KEY_ACCOUNT: 0, MID_TIER: 0, LOW_TIER: 0 },
      byStatus: { ATIVO: 0, INATIVO: 0, PROSPECT: 0 },
      topPlatforms: {}
    };
  }
}

// Obter lista de responsáveis únicos
export async function getResponsibles() {
  try {
    const clients = await listClients();
    const responsibles = [...new Set(clients.map(c => c.responsible).filter(r => r))]
      .sort();
    return responsibles;
  } catch (error) {
    console.error('[ClientsRepo] Erro ao obter responsáveis:', error);
    return [];
  }
}