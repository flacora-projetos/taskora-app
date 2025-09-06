// assets/js/data/metaRepo.js
// Taskora Meta Repo — listas para selects (clientes, responsáveis)

let _db = null;
async function getDb() {
  if (_db) return _db;
  if (window.db) { _db = window.db; return _db; }

  if (!window.firebaseConfig) throw new Error('firebaseConfig não encontrado.');
  const appMod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
  const fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const { initializeApp } = appMod;
  const { getFirestore }   = fsMod;
  const app = initializeApp(window.firebaseConfig);
  _db = getFirestore(app);
  return _db;
}

export async function listClients() {
  try {
    const db = await getDb();
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const { collection, getDocs, where, query } = fs;

    // Oficial
    const q = query(collection(db, 'clients'), where('orgId', '==', 'dacora'));
    const snap = await getDocs(q);
    const items = [];
    snap.forEach(d => {
      const v = d.data();
      if (v?.displayName) items.push(String(v.displayName));
    });

    // Fallback (lê tasks.client se não houver clients)
    if (items.length === 0) {
      const tSnap = await getDocs(collection(db, 'tasks'));
      const set = new Set();
      tSnap.forEach(d => { 
        const v = d.data(); 
        if (v?.client) set.add(String(v.client)); 
      });
      return Array.from(set).sort((a,b)=>a.localeCompare(b));
    }
    return items.sort((a,b)=>a.localeCompare(b));
  } catch (error) {
    console.error('[MetaRepo] Erro em listClients:', error);
    return [];
  }
}

export async function listOwners() {
  const db = await getDb();
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const { collection, getDocs } = fs;

  // Oficial: orgUsers/{org}/users
  const ORG = 'dacora';
  const usersSnap = await getDocs(collection(db, 'orgUsers', ORG, 'users'));
  const owners = [];
  usersSnap.forEach(d => {
    const v = d.data();
    if (v?.displayName) owners.push(String(v.displayName));
  });

  // Fallback: owners (legado)
  if (owners.length === 0) {
    const os = await getDocs(collection(db, 'owners'));
    os.forEach(d => {
      const v = d.data();
      const n = v?.name || v?.owner;
      if (n) owners.push(String(n));
    });
  }
  return owners.sort((a,b)=>a.localeCompare(b));
}

/**
 * Lista membros ativos da equipe para usar como responsáveis
 */
export async function listTeamMembers() {
  try {
    const db = await getDb();
    const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const { collection, getDocs, where, query } = fs;

    // Buscar membros ativos do Team
    const q = query(
      collection(db, 'team'), 
      where('status', '==', 'Ativo')
    );
    
    const snap = await getDocs(q);
    const members = [];
    
    snap.forEach(d => {
      const member = d.data();
      if (member?.name) {
        members.push({
          id: d.id,
          name: member.name,
          email: member.email,
          specialty: member.specialty
        });
      }
    });

    // Fallback: se não houver membros ativos, usar listOwners como backup
    if (members.length === 0) {
      console.warn('[Team Integration] Nenhum membro ativo encontrado, usando fallback para owners');
      const owners = await listOwners();
      return owners.map(name => ({ id: null, name, email: null, specialty: null }));
    }

    return members.sort((a, b) => a.name.localeCompare(b.name));
    
  } catch (error) {
    console.error('Erro ao buscar membros da equipe:', error);
    
    // Fallback final para owners
    try {
      const owners = await listOwners();
      return owners.map(name => ({ id: null, name, email: null, specialty: null }));
    } catch (fallbackError) {
      console.error('Erro no fallback para owners:', fallbackError);
      return [];
    }
  }
}
