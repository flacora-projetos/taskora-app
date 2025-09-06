// assets/js/data/tasksRepo.js
// Taskora Repo — compatível com Calendário e Tarefas
// Correções chave:
//  1) Parse robusto de datas: Date, ms, 'YYYY-MM-DD' e 'dd/mm/aaaa'.
//  2) listTasksByDateRange já considera TaskoraFilters (mantido).
//  3) NOVO: listTasks agora também aplica TaskoraFilters (datas + status/cliente/owner).
//  4) NOVO: emite evento global após create/update/delete para atualizar o calendário ao vivo.

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

// ==== Utils =========================================================
function minutesFromHHMM(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = String(hhmm).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return (h * 60) + m;
}
function hhmmFromMinutes(mins) {
  const m = Math.max(0, mins | 0);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}
function ymd(d){
  // Mantém formato americano para compatibilidade com inputs type="date"
  const y=d.getUTCFullYear(); const mo=String(d.getUTCMonth()+1).padStart(2,'0'); const da=String(d.getUTCDate()).padStart(2,'0');
  return `${y}-${mo}-${da}`;
}

// Função para exibição em formato brasileiro
function ymdBrazilian(d){
  const day = String(d.getUTCDate()).padStart(2,'0');
  const month = String(d.getUTCMonth()+1).padStart(2,'0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
function firstNonEmpty(...vals){
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    const s = (typeof v === 'string') ? v.trim() : v;
    if (s !== '' && s !== undefined && s !== null) return v;
  }
  return null;
}

// Aceita Date, ms, 'YYYY-MM-DD' e 'dd/mm/aaaa' ou 'dd-mm-aaaa'
function toMsLoose(x, endOfDay=false){
  if (!x) return null;
  if (x instanceof Date) return x.getTime();
  if (typeof x === 'number') return x;

  const s = String(x).trim();

  // YYYY-MM-DD -> força horário local de início/fim do dia
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(s + (endOfDay ? 'T23:59:59' : 'T00:00:00')).getTime();
  }

  // dd/mm/aaaa ou dd-mm-aaaa
  const m = s.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (m) {
    const iso = `${m[3]}-${m[2]}-${m[1]}${endOfDay ? 'T23:59:59' : 'T00:00:00'}`;
    return new Date(iso).getTime();
  }

  // fallback
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? null : t;
}

// ==== Map UI → DB ===================================================
async function resolveClientRefByName(db, clientName) {
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const { collection, query, where, getDocs } = fs;
  const q = query(collection(db, 'clients'), where('displayName', '==', clientName));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].ref;
}
async function resolveAssigneeRefByName(db, ownerName) {
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const { collection, getDocs } = fs;
  const ORG = 'dacora';

  // org nova
  const usersSnap = await getDocs(collection(db, 'orgUsers', ORG, 'users'));
  for (const d of usersSnap.docs) {
    const v = d.data();
    if (v?.displayName && String(v.displayName).toLowerCase() === String(ownerName).toLowerCase()) {
      return d.ref;
    }
  }

  // legado DEV
  const ownersSnap = await getDocs(collection(db, 'owners'));
  for (const d of ownersSnap.docs) {
    const v = d.data();
    const n = v?.name || v?.owner;
    if (n && String(n).toLowerCase() === String(ownerName).toLowerCase()) {
      return d.ref;
    }
  }
  return null;
}

async function mapUiToDb(payload) {
  const db = await getDb();
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const { Timestamp, serverTimestamp } = fs;

  const clientRef    = payload.client ? await resolveClientRefByName(db, payload.client) : null;
  const assigneeRef  = payload.owner  ? await resolveAssigneeRefByName(db, payload.owner) : null;

  const startAt = payload.startAt instanceof Date
    ? Timestamp.fromDate(payload.startAt)
    : (payload.startDate ? Timestamp.fromDate(new Date(payload.startDate)) : null);

  const dueAt   = payload.dueAt instanceof Date
    ? Timestamp.fromDate(payload.dueAt)
    : (payload.dueDate ? Timestamp.fromDate(new Date(payload.dueDate)) : null);

  const estimatedMinutes = typeof payload.estimatedMinutes === 'number'
    ? payload.estimatedMinutes
    : (typeof payload.hours === 'number' ? payload.hours * 60 : minutesFromHHMM(payload.hoursHHMM));

  let dateStr = payload.date || null;
  if (!dateStr) {
    if (payload.startAt instanceof Date) dateStr = ymd(payload.startAt);
    else if (payload.startDate)          dateStr = ymd(new Date(payload.startDate));
    else if (payload.dueAt   instanceof Date) dateStr = ymd(payload.dueAt);
    else if (payload.dueDate)             dateStr = ymd(new Date(payload.dueDate));
  }

  return {
    orgId: 'dacora',
    clientRef: clientRef ?? null,
    assigneeRef: assigneeRef ?? null,
    title: firstNonEmpty(payload.title, payload.task, payload.name, payload.description) || 'Tarefa sem título',
    description: payload.description || '',
    status: payload.status || 'NAO_REALIZADA',
    priority: payload.priority || 'MEDIUM',
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    startAt: startAt ?? null,
    dueAt: dueAt ?? null,
    reminderAt: null,
    estimatedMinutes,
    spentMinutes: payload.spentMinutes | 0,
    hours: payload.hours || null, // Campo hours decimal para compatibilidade
    createdBy: payload.createdByRef || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),

    client: payload.client || null,
    owner: payload.owner || null,

    date: dateStr || null,
    recurrenceType: payload.recurrenceType || null,
    recurrenceDays: payload.recurrenceDays || null,
    recurrenceUntil: payload.recurrenceUntil || null
  };
}

// ==== Normalização de status =======================================
const STATUS_OFFICIAL = ["iniciada","em progresso","concluída","não realizada"];
const norm = s => (s||"").toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[_\s]+/g,"").toLowerCase();
function canonStatus(raw){
  const n = norm(raw);
  if(!n) return "não realizada";
  // Mapeamento para "iniciada" - incluindo status legados
  if(["aberta","aberto","afazer","todo","open","nova","pendente","backlog","iniciadas"].includes(n)) return "iniciada";
  // Mapeamento para "em progresso"
  if(["emandamento","emprogresso","inprogress","doing","andamento","progresso"].includes(n)) return "em progresso";
  // Mapeamento para "concluída"
  if(["concluida","concluido","finalizada","finalizado","done","completed","fechada","fechado"].includes(n)) return "concluída";
  // Mapeamento para "não realizada" - incluindo cancelada e naorealizada
  if(["naorealizada","naorealizado","cancelada","cancelado","notdone","canceled","nrealizada"].includes(n)) return "não realizada";
  if(STATUS_OFFICIAL.map(norm).includes(n)) return raw;
  return raw || "não realizada";
}

// ==== Map DB → UI ===================================================
// Função mapDbToUi movida para a seção de exports para ser reutilizada

// ==== Helpers de evento =============================================
function emitTasksChanged(op, id){
  try {
    window.dispatchEvent(new CustomEvent('taskora:tasks:changed', {
      detail: { op, id, t: Date.now() }
    }));
  } catch(_) {}
}

// Função para atualizar horas do membro no Team com retry
async function updateTeamMemberHours(ownerName) {
  const maxRetries = 5;
  const retryDelay = 1000; // 1 segundo
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (window.TeamRepo && typeof window.TeamRepo.updateMemberHours === 'function') {
        await window.TeamRepo.updateMemberHours(ownerName);
        console.log(`[TasksRepo] ✅ Trigger: Horas atualizadas para ${ownerName} (tentativa ${attempt})`);
        return true;
      } else {
        console.warn(`[TasksRepo] ⏳ TeamRepo não disponível (tentativa ${attempt}/${maxRetries})`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    } catch(err) {
      console.error(`[TasksRepo] ❌ Erro na tentativa ${attempt}:`, err);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.error(`[TasksRepo] 🚨 FALHA: Não foi possível atualizar horas para ${ownerName} após ${maxRetries} tentativas`);
  return false;
}

// ==== API ============================================================

/**
 * Mapeia dados do banco para a UI
 * @param {DocumentSnapshot} docSnap - Snapshot do documento do Firestore
 * @returns {Promise<Object>} Objeto mapeado para a UI
 */
export async function mapDbToUi(docSnap) {
  const data = docSnap.data();
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const { Timestamp } = fs;

  const title = firstNonEmpty(data.title, data.task, data.name, '(sem título)');

  const startDate = (data.startAt instanceof Timestamp) ? data.startAt.toDate()
                   : (data.inicio && !isNaN(new Date(data.inicio)) ? new Date(data.inicio) : null);
  const dueDate   = (data.dueAt   instanceof Timestamp) ? data.dueAt.toDate()
                   : (data.limite && !isNaN(new Date(data.limite)) ? new Date(data.limite) : null);

  let dateStr = firstNonEmpty(data.date, data.data, data.startDateStr, data.inicioStr);
  if (!dateStr) {
    if (startDate)      dateStr = ymd(startDate);
    else if (dueDate)   dateStr = ymd(dueDate);
  }

  // Normalizar status para garantir compatibilidade com dados legados
  const rawStatus = data.status || 'NAO_REALIZADA';
  const normalizedStatus = canonStatus(rawStatus);

  return {
    id: docSnap.id,
    title,
    description: data.description || '',
    status: normalizedStatus,
    priority: data.priority || 'MEDIUM',
    client: firstNonEmpty(data.client, data.clientName, data.cliente) || null,
    owner:  firstNonEmpty(data.owner,  data.ownerName,  data.responsavel) || null,
    startDate,
    dueDate,
    date: dateStr,
    endDate: data.endDate || null,
    hours: data.hours || (data.estimatedMinutes ? data.estimatedMinutes / 60 : 0),
    hoursHHMM: data.estimatedMinutes ? hhmmFromMinutes(data.estimatedMinutes) : '00:00',
    createdAt: (data.createdAt instanceof Timestamp) ? data.createdAt.toDate() : new Date(),
    updatedAt: (data.updatedAt instanceof Timestamp) ? data.updatedAt.toDate() : null,
    orgId: data.orgId || 'dacora',
    recurrence: data.recurrence || { type: 'none' },
    recurrenceType: data.recurrenceType || 'none',
    recurrenceDays: data.recurrenceDays || [],
    recurrenceUntil: data.recurrenceUntil || null
  };
}

/**
 * Lista tarefas SEM aplicar filtros globais (para uso independente)
 * @param {number} max - Máximo de tarefas a retornar
 * @returns {Promise<Array>} Lista de tarefas sem filtros globais aplicados
 */
export async function listTasksRaw(max = 500) {
  const db = await getDb();
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const { collection, getDocs, limit } = fs;

  const snap = await getDocs(limit ? (await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')).query(
    collection(db, 'tasks'), limit(max)
  ) : collection(db,'tasks'));

  let items = [];
  for (const d of snap.docs) items.push(await mapDbToUi(d));

  // prioriza org 'dacora' (ou sem orgId)
  items = items.filter(t => t.orgId === 'dacora' || !t.orgId);

  // ordenação estável - priorizar campo 'date' (início)
  items.sort((a, b) => {
    const ad = a.date ? new Date(a.date).getTime() : (a.startDate?.getTime?.() ?? a.dueDate?.getTime?.() ?? 0);
    const bd = b.date ? new Date(b.date).getTime() : (b.startDate?.getTime?.() ?? b.dueDate?.getTime?.() ?? 0);
    return bd - ad; // Ordem decrescente: mais recentes primeiro
  });
  return items;
}

/**
 * Lista tarefas COM filtros globais aplicados (comportamento original)
 * @param {number} max - Máximo de tarefas a retornar
 * @returns {Promise<Array>} Lista de tarefas com filtros globais aplicados
 */
export async function listTasks(max = 500) {
  const db = await getDb();
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const { collection, getDocs, limit } = fs;

  const snap = await getDocs(limit ? (await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')).query(
    collection(db, 'tasks'), limit(max)
  ) : collection(db,'tasks'));

  let items = [];
  for (const d of snap.docs) items.push(await mapDbToUi(d));

  // prioriza org 'dacora' (ou sem orgId)
  items = items.filter(t => t.orgId === 'dacora' || !t.orgId);

  // ---------- aplica filtros globais se existirem ----------
  try {
    const TF = window.TaskoraFilters;
    if (TF && typeof TF.get === 'function') {
      const f = TF.get();
      const fromMs = toMsLoose(f?.startDate, false);
      const toMs   = toMsLoose(f?.endDate,   true);

      if (fromMs != null && toMs != null) {
        items = items.filter(it => {
          let base = null;
          if (it.date) {
            const t = new Date(it.date + 'T00:00:00').getTime();
            if (!Number.isNaN(t)) base = t;
          }
          const s = it.startDate ? it.startDate.getTime() : null;
          const e = it.dueDate   ? it.dueDate.getTime()   : null;

          return (base != null && base >= fromMs && base <= toMs) ||
                 (s != null && s <= toMs && (e ?? s) >= fromMs) ||
                 (e != null && e >= fromMs && (s ?? e) <= toMs);
        });
      }

      const norm = (x)=> String(x||'').trim().toLowerCase();
      if (f?.status && !['all','todos'].includes(norm(f.status))) {
        const needle = norm(f.status);
        items = items.filter(t => norm(t.status) === needle);
      }
      if (f?.client && !['all','todos'].includes(norm(f.client))) {
        const needle = norm(f.client);
        items = items.filter(t => norm(t.client) === needle);
      }
      if (f?.owner && !['all','todos'].includes(norm(f.owner))) {
        const needle = norm(f.owner);
        items = items.filter(t => norm(t.owner) === needle);
      }
    }
  } catch(_) {}

  // ordenação estável
  items.sort((a, b) => {
    const ad = a.startDate?.getTime?.() ?? a.dueDate?.getTime?.() ?? 0;
    const bd = b.startDate?.getTime?.() ?? b.dueDate?.getTime?.() ?? 0;
    return bd - ad;
  });
  return items;
}

export async function listTasksByDateRange(arg1, arg2, max = 1000) {
  let fromMs = null, toMs = null, filters = null;

  if (arg1 && typeof arg1 === 'object' && !(arg1 instanceof Date)) {
    fromMs  = toMsLoose(arg1.from, false);
    toMs    = toMsLoose(arg1.to,   true);
    filters = arg1.filters || null;
  } else {
    fromMs = toMsLoose(arg1, false);
    toMs   = toMsLoose(arg2, true);
  }

  // Se a barra global tiver datas, ela manda
  try {
    const TF = window.TaskoraFilters;
    if (TF && typeof TF.get === 'function') {
      const f = TF.get();
      const fFrom = toMsLoose(f?.startDate, false);
      const fTo   = toMsLoose(f?.endDate,   true);
      if (fFrom != null && fTo != null) {
        fromMs = fFrom;
        toMs   = fTo;
        filters = filters || { status: f.status, client: f.client, owner: f.owner };
      }
    }
  } catch(_) {}

  if (fromMs == null) fromMs = -Infinity;
  if (toMs   == null) toMs   = +Infinity;

  const db = await getDb();
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const { collection, getDocs, limit } = fs;
  const snap = await getDocs(limit ? (await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')).query(
    collection(db, 'tasks'), limit(max)
  ) : collection(db,'tasks'));

  let rows = [];
  for (const d of snap.docs) rows.push(await mapDbToUi(d));

  rows = rows.filter(t => t.orgId === 'dacora' || !t.orgId);

  rows = rows.filter(it => {
    let base = null;
    if (it.date) {
      const t = new Date(it.date + 'T00:00:00').getTime();
      if (!Number.isNaN(t)) base = t;
    }
    const s = it.startDate ? it.startDate.getTime() : null;
    const e = it.dueDate   ? it.dueDate.getTime()   : null;

    return (base != null && base >= fromMs && base <= toMs) ||
           (s != null && s <= toMs && (e ?? s) >= fromMs) ||
           (e != null && e >= fromMs && (s ?? e) <= toMs);
  });

  if (filters && typeof filters === 'object') {
    const norm = (x)=> String(x||'').trim().toLowerCase();
    if (filters.status && !['all','todos'].includes(norm(filters.status))) {
      const needle = norm(filters.status);
      rows = rows.filter(t => norm(t.status) === needle);
    }
    if (filters.client && !['all','todos'].includes(norm(filters.client))) {
      const needle = norm(filters.client);
      rows = rows.filter(t => norm(t.client) === needle);
    }
    if (filters.owner && !['all','todos'].includes(norm(filters.owner))) {
      const needle = norm(filters.owner);
      rows = rows.filter(t => norm(t.owner) === needle);
    }
  }

  rows.sort((a, b) => {
    const ad = a.date ? new Date(a.date).getTime() : (a.startDate?.getTime?.() ?? 0);
    const bd = b.date ? new Date(b.date).getTime() : (b.startDate?.getTime?.() ?? 0);
    return bd - ad; // Ordem decrescente: mais recentes primeiro
  });

  return rows;
}

export async function createTask(uiPayload) {
  const db = await getDb();
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const { collection, addDoc } = fs;

  const toSave = await mapUiToDb(uiPayload);
  const ref = await addDoc(collection(db, 'tasks'), toSave);
  emitTasksChanged('create', ref.id);
  
  // Atualizar horas do membro no Team se houver owner
  if (uiPayload.owner) {
    await updateTeamMemberHours(uiPayload.owner);
  }
  
  return ref.id;
}

export async function updateTask(taskId, uiPayload) {
  const db = await getDb();
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const { doc, updateDoc, serverTimestamp } = fs;

  const toSave = await mapUiToDb(uiPayload);
  toSave.updatedAt = serverTimestamp();
  await updateDoc(doc(db, 'tasks', taskId), toSave);
  emitTasksChanged('update', taskId);
  
  // Atualizar horas do membro no Team se houver owner
  if (uiPayload.owner) {
    await updateTeamMemberHours(uiPayload.owner);
  }
}

export async function deleteTask(taskId) {
  const db = await getDb();
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const { doc, deleteDoc } = fs;
  await deleteDoc(doc(db, 'tasks', taskId));
  emitTasksChanged('delete', taskId);
}
