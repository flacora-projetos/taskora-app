// assets/js/pages/calendar.js
// Calendário mensal com: células rígidas (sem overflow vertical), “mostrar mais”
// (2 por célula), modal por tarefa (pill) e modal “do dia” só pelo link “+X”.
// Editor inline dentro do modal (Salvar/Cancelar) e duplicação normalizada
// para a tarefa aparecer imediatamente na lista da aba Tasks.

import { listTasksByDateRange, updateTask, deleteTask } from "../data/tasksRepo.js";
import { formatToBrazilian, formatToAmerican } from "../utils/dateFormat.js";

/* globals TaskoraFilters, TaskoraLookups */

(function (global) {
  // ------------------ Config & utils ------------------
  const MAX_PER_CELL = 2; // 2 na célula; resto vira "+X mostrar mais"
  const COLORS = { terracota: "#993908", verde: "#014029", off: "#F2EFEB" };

  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) => {
    // Usar UTC para manter consistência
    const year = d.getUTCFullYear();
    const month = pad(d.getUTCMonth() + 1);
    const day = pad(d.getUTCDate());
    return `${year}-${month}-${day}`;
  };
  const addDays = (d, n) => {
    // Usar UTC para manter consistência
    const result = new Date(d.getTime());
    result.setUTCDate(result.getUTCDate() + n);
    return result;
  };
  const weekday = (d) => { 
    // Usar UTC para manter consistência
    const w = d.getUTCDay(); 
    return w === 0 ? 7 : w; 
  }; // 1..7 (seg..dom)
  const escapeHtml = (s) => String(s || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function parseISOStr(s) { 
    if (!s) return null; 
    const [y,m,d] = s.split("-").map(Number); 
    // Usar UTC para evitar problemas de timezone
    return new Date(Date.UTC(y,(m||1)-1,d||1)); 
  }

  function monthWindow(current) {
    const y = current.getUTCFullYear(), m = current.getUTCMonth();
    const first = new Date(Date.UTC(y, m, 1));
    const last  = new Date(Date.UTC(y, m + 1, 0));
    const start = new Date(first.getTime());
    while (weekday(start) !== 1) start.setUTCDate(start.getUTCDate() - 1);
    const end = new Date(last.getTime());
    while (weekday(end) !== 7) end.setUTCDate(end.getUTCDate() + 1);
    return { first, last, start, end };
  }

  // ------------------ Recurrence expansion ------------------
  function expandRecurrence(task, rangeStart, rangeEnd) {
    const baseDate = parseISOStr(task.date);
    if (!baseDate) return [];

    const type = (task.recurrenceType || (task.recurrence && task.recurrence.type) || "none");
    if (type === "none") return (baseDate >= rangeStart && baseDate <= rangeEnd) ? [baseDate] : [];

    const until = task.recurrenceUntil ? parseISOStr(task.recurrenceUntil) : null;
    const hardEnd = until && until < rangeEnd ? until : rangeEnd;
    const results = [];

    if (type === "daily") {
      for (let d = new Date(baseDate); d <= hardEnd; d = addDays(d, 1))
        if (d >= rangeStart) results.push(new Date(d));
      return results;
    }

    if (type === "weekdays") {
      for (let d = new Date(baseDate); d <= hardEnd; d = addDays(d, 1)) {
        const w = weekday(d);
        if (d >= rangeStart && w >= 1 && w <= 5) results.push(new Date(d));
      }
      return results;
    }

    if (type === "weekly") {
      const days = (task.recurrenceDays && task.recurrenceDays.length) ? task.recurrenceDays.slice() :
                   (task.recurrence && task.recurrence.days ? task.recurrence.days.slice() : []);
      if (!days.length) days.push(weekday(baseDate));
      for (let d = new Date(rangeStart); d <= hardEnd; d = addDays(d, 1)) {
        const w = weekday(d);
        if (days.includes(w) && d >= baseDate) results.push(new Date(d));
      }
      return results;
    }

    if (type === "monthly") {
      const dom = baseDate.getUTCDate();
      let cursor = new Date(baseDate.getTime());
      while (cursor <= hardEnd) {
        if (cursor >= rangeStart) results.push(new Date(cursor.getTime()));
        const y = cursor.getUTCFullYear(), m = cursor.getUTCMonth();
        const next = new Date(Date.UTC(y, m + 1, 1));
        const lastOfNext = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
        const domClamped = Math.max(1, Math.min(dom, lastOfNext));
        cursor = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth(), domClamped));
      }
      return results;
    }

    return (baseDate >= rangeStart && baseDate <= rangeEnd) ? [baseDate] : [];
  }

  function bucketizeByDay(tasks, rangeStart, rangeEnd) {
    const map = new Map();
    for (const t of tasks) {
      const dates = expandRecurrence(t, rangeStart, rangeEnd);
      for (const d of dates) {
        const key = toISO(d);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(t);
      }
    }
    return map;
  }

  // ------------------ UI helpers ------------------
  function cellHeader(d, currentMonth) {
    const muted = (d.getUTCMonth() !== currentMonth) ? 'opacity:.55' : 'opacity:1';
    return `<div class="cal-cell-hd" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
      <span class="cal-day-num" style="font-weight:800;color:#334155;${muted}">${d.getUTCDate()}</span>
    </div>`;
  }

  function statusStyle(statusRaw) {
    const key = (statusRaw || "").toLowerCase();
    if (key.includes('concl')) return { bg:"#E7F4EC", fg:"#0B6B2C", bd:"#C9E7D2" };
    if (key.includes('progr')) return { bg:"#FFF3D6", fg:"#8A5B00", bd:"#FFE4A6" };
    if (key.includes('inici')) return { bg:"#EEF0F3", fg:"#334155", bd:"#E0E5EA" };
    if (key.includes('realiz')) return { bg:"#FDE9E7", fg:"#8A1C12", bd:"#F6C8C2" };
    return { bg:"#fff", fg:"#1f2937", bd:"#E5E7EB" };
  }

  function taskChip(t) {
    const label = (t.client || "").trim() ? t.client : (t.owner || "—");
    const st = statusStyle(t.status);
    return `<div class="cal-chip" data-open-day="${escapeHtml(t.date || "")}" data-task-id="${escapeHtml(t.id||"")}" title="${escapeHtml(t.description||'')}" style="
      display:block; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;
      background:${st.bg}; border:1px solid ${st.bd}; border-radius:8px;
      padding:2px 6px; font-size:11px; color:${st.fg}; margin:2px 0; cursor:pointer;">
        ${escapeHtml(label)} — ${escapeHtml(t.description || "—")}
    </div>`;
  }

  function moreLink(count, iso) {
    return `<button class="cal-more" data-more="${iso}" type="button" style="
      margin-top:3px;border:none;background:transparent;color:${COLORS.terracota};
      font-weight:800;font-size:10px;cursor:pointer">+${count} mostrar mais</button>`;
  }

  // ------------------ Modal & editor ------------------
  function getModalWrap(){ return document.getElementById("taskora-cal-modal"); }
  function closeModal(){ const el = getModalWrap(); if (el) el.remove(); }

  // Duplicação robusta e NORMALIZADA (garante que aparece na listagem de Tasks)
  async function duplicateNormalized(taskId, fallbackDateISO){
    try{
      console.log('[Calendar][duplicateNormalized] Iniciando duplicação:', { taskId, fallbackDateISO });
      
      // Importar módulos do Firebase
      const { addDoc, collection, doc, getDoc, getFirestore, serverTimestamp } = 
        await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
      
      console.log('[Calendar][duplicateNormalized] Módulos Firebase importados');
      
      // Obter referência ao Firestore de forma mais robusta
      let db = null;
      
      // Primeiro, tentar usar instância existente
      if (window.db && typeof window.db === 'object') {
        db = window.db;
        console.log('[Calendar][duplicateNormalized] Usando instância existente do DB');
      } else if (global.db && typeof global.db === 'object') {
        db = global.db;
        console.log('[Calendar][duplicateNormalized] Usando instância global do DB');
      } else {
        // Criar nova conexão se necessário
        console.log('[Calendar][duplicateNormalized] Criando nova conexão Firebase');
        const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
        const cfg = global.firebaseConfig || global.FIREBASE_CONFIG;
        if (!cfg) {
          console.error('[Calendar][duplicateNormalized] Configuração Firebase não encontrada');
          return false;
        }
        
        // Verificar se já existe uma app inicializada
        let app;
        const existingApps = getApps();
        if (existingApps.length > 0) {
          app = existingApps[0];
        } else {
          app = initializeApp(cfg);
        }
        db = getFirestore(app);
      }
      
      if (!db) {
        console.error('[Calendar][duplicateNormalized] Não foi possível obter instância do Firestore');
        return false;
      }
      
      // Buscar tarefa original
      console.log('[Calendar][duplicateNormalized] Buscando tarefa:', taskId);
      const snap = await getDoc(doc(db, 'tasks', String(taskId)));
      if (!snap.exists()) {
        console.error('[Calendar][duplicateNormalized] Tarefa não encontrada:', taskId);
        return false;
      }
      const data = snap.data() || {};
      console.log('[Calendar][duplicateNormalized] Tarefa encontrada:', data);
      
      // SOLUÇÃO DEFINITIVA: Preservar a data original exatamente como está
      console.log("[Calendar] Dados originais da tarefa:", {
        id: taskId,
        date: data.date,
        fallbackDateISO: fallbackDateISO
      });
      
      // Criar payload da cópia com a data original preservada
      const payload = {
        ...data,
        description: (data.description || "Tarefa") + " (cópia)",
        orgId: data.orgId || 'dacora',
        status: data.status || 'não realizada',
        client: data.client || 'Cliente Demo',
        owner: data.owner || 'Responsável Demo'
      };
      
      // CORREÇÃO CRÍTICA: Preservar a data original sem processamento
      // Prioridade: 1. data original como string, 2. fallback fornecido, 3. data processada
      if (typeof data.date === 'string') {
        payload.date = data.date;
      } else if (fallbackDateISO) {
        payload.date = fallbackDateISO;
      } else if (data.date && typeof data.date.toDate === 'function') {
        // Timestamp do Firestore - usar UTC para consistência
        const d = data.date.toDate();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        payload.date = `${d.getUTCFullYear()}-${month}-${day}`;
      }
      
      // Preservar dueDate da mesma forma
      if (typeof data.dueDate === 'string') {
        payload.dueDate = data.dueDate;
      } else if (data.dueDate && typeof data.dueDate.toDate === 'function') {
        // Usar UTC para consistência
        const d = data.dueDate.toDate();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        payload.dueDate = `${d.getUTCFullYear()}-${month}-${day}`;
      } else {
        payload.dueDate = null;
      }
      
      console.log("[Calendar] Dados da tarefa duplicada:", {
        date: payload.date,
        dueDate: payload.dueDate
      });

      // 🔧 FIX: nunca envie campos inválidos para o Firestore
      delete payload.id;
      delete payload.__name__;
      delete payload.createdAt;
      delete payload.updatedAt;

      console.log('[Calendar][duplicateNormalized] Payload final:', payload);
      
      const ref = await addDoc(collection(db,'tasks'), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('[Calendar][duplicateNormalized] Tarefa duplicada com sucesso:', ref?.id);
      return !!ref?.id;
    }catch(e){
      console.error('[Calendar][duplicateNormalized] ERRO DETALHADO:', {
        message: e.message,
        stack: e.stack,
        name: e.name,
        code: e.code,
        fullError: e
      });
      return false;
    }
  }

  function buildLookups(items){
    const LK = global.TaskoraLookups || {};
    const clients = (LK.clients && Array.isArray(LK.clients) ? LK.clients.slice() : []);
    const owners  = (LK.owners  && Array.isArray(LK.owners)  ? LK.owners.slice()  :
                    (LK.team    && Array.isArray(LK.team)    ? LK.team.slice()    : []));

    if (!clients.length) {
      const set = new Set(); items.forEach(t=>{ if(t.client) set.add(String(t.client)); });
      clients.push(...Array.from(set));
    }
    if (!owners.length) {
      const set = new Set(); items.forEach(t=>{ if(t.owner) set.add(String(t.owner)); });
      owners.push(...Array.from(set));
    }
    return { clients, owners };
  }

  function renderEditInline(t, lookups){
    const ymd = (s)=> escapeHtml(String(s||'').slice(0,10));
  const ymdBrazilian = (s) => formatToBrazilian(s) || '';
    const opt = (arr,val)=> ['<option value=""></option>'].concat(arr.map(x=>`<option value="${escapeHtml(x)}"${String(x)===String(val)?' selected':''}>${escapeHtml(x)}</option>`)).join("");
    return `
      <div class="cal-edit" data-edit-id="${escapeHtml(t.id)}" style="margin-top:8px;border-top:1px dashed #E5E7EB;padding-top:8px;display:grid;grid-template-columns:repeat(12,1fr);gap:8px">
        <label style="grid-column:span 4;font-size:12px;color:#475569">Cliente
          <select class="cei" data-k="client" style="width:100%;border:1px solid #E2E8F0;border-radius:8px;padding:6px 8px">${opt(lookups.clients, t.client)}</select>
        </label>
        <label style="grid-column:span 4;font-size:12px;color:#475569">Responsável
          <select class="cei" data-k="owner" style="width:100%;border:1px solid #E2E8F0;border-radius:8px;padding:6px 8px">${opt(lookups.owners, t.owner)}</select>
        </label>
        <label style="grid-column:span 4;font-size:12px;color:#475569">Status
          <select class="cei" data-k="status" style="width:100%;border:1px solid #E2E8F0;border-radius:8px;padding:6px 8px">
            <option ${t.status==='iniciada'?'selected':''} value="iniciada">Iniciada</option>
            <option ${t.status==='em progresso'?'selected':''} value="em progresso">Em progresso</option>
            <option ${t.status==='concluída'?'selected':''} value="concluída">Concluída</option>
            <option ${t.status==='não realizada'?'selected':''} value="não realizada">Não realizada</option>
          </select>
        </label>
        <label style="grid-column:span 12;font-size:12px;color:#475569">Descrição
          <input class="cei" data-k="description" placeholder="Descrição" value="${escapeHtml(t.description||'')}" style="width:100%;border:1px solid #E2E8F0;border-radius:8px;padding:6px 8px"/>
        </label>
        <label style="grid-column:span 6;font-size:12px;color:#475569">Início
          <input class="cei" data-k="date" type="date" value="${ymd(t.date)}" style="width:100%;border:1px solid #E2E8F0;border-radius:8px;padding:6px 8px"/>
        </label>
        <label style="grid-column:span 6;font-size:12px;color:#475569">Limite
          <input class="cei" data-k="dueDate" type="date" value="${ymd(t.dueDate)}" style="width:100%;border:1px solid #E2E8F0;border-radius:8px;padding:6px 8px"/>
        </label>
        <div style="grid-column:span 12;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn-edit-save"   data-act="save"   style="border:1px solid #22c55e;background:#22c55e;color:#fff;border-radius:8px;padding:6px 12px;cursor:pointer">Salvar</button>
          <button class="btn-edit-cancel" data-act="cancel" style="border:1px solid #CBD5E1;background:#fff;color:#334155;border-radius:8px;padding:6px 12px;cursor:pointer">Cancelar</button>
        </div>
      </div>`;
  }

  function renderModalItem(t){
    const st = statusStyle(t.status);
    return `
      <div class="cal-modal-item" data-task-id="${escapeHtml(t.id||'')}" style="border:1px solid #E5E7EB;border-radius:10px;padding:10px 12px;margin:8px 0;background:#fff;display:flex;gap:8px;align-items:flex-start;justify-content:space-between">
        <div class="cal-item-main" style="min-width:0">
          <div style="font-weight:800;color:#334155;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${escapeHtml(t.client||"—")} — ${escapeHtml(t.description||"—")}
          </div>
          <div style="font-size:12px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            Resp.: ${escapeHtml(t.owner||"—")} • Status: ${escapeHtml(t.status||"—")}
          </div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px">
            Início: ${formatToBrazilian(t.date) || "—"} • Limite: ${formatToBrazilian(t.dueDate) || "—"}
          </div>
        </div>
        <div class="cal-actions" style="display:flex;gap:6px;flex-shrink:0">
          <button class="btn-act" data-act="edit"      title="Editar"   style="border:1px solid #E2E8F0;background:${st.bg};color:${st.fg};border-radius:8px;padding:6px 8px;cursor:pointer">✎</button>
          <button class="btn-act" data-act="duplicate" title="Duplicar" style="border:1px solid #E2E8F0;background:${st.bg};color:${st.fg};border-radius:8px;padding:6px 8px;cursor:pointer">⎘</button>
          <button class="btn-act" data-act="delete"    title="Deletar"  style="border:1px solid ${st.bd};background:${st.bg};color:${st.fg};border-radius:8px;padding:6px 8px;cursor:pointer">🗑</button>
        </div>
      </div>`;
  }

  function buildModalHTML(title, items){
    return `
      <div id="taskora-cal-modal" class="cal-modal-wrap" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:flex-start;justify-content:center;padding:5vh 16px;z-index:1000">
        <div class="cal-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}" style="width:min(900px,96vw);background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden">
          <div class="cal-modal-hd" style="display:flex;justify-content:space-between;align-items:center;background:${COLORS.off};border-bottom:1px solid #E5E2DD;padding:12px 16px">
            <strong style="letter-spacing:.2px">${escapeHtml(title)}</strong>
            <button type="button" class="cal-close" style="border:none;background:transparent;font-size:18px;cursor:pointer">✕</button>
          </div>
          <div class="cal-modal-body" style="padding:12px 16px;max-height:65vh;overflow:auto">
            ${ items.map(renderModalItem).join("") }
          </div>
        </div>
      </div>`;
  }

  function openModal(title, itemsInitial, opts){
    const onAfterChange = opts?.onAfterChange;
    closeModal();

    let itemsRef = Array.isArray(itemsInitial) ? itemsInitial.slice() : [];

    const wrap = document.createElement("div");
    wrap.innerHTML = buildModalHTML(title, itemsRef);
    const el = wrap.firstElementChild;

    // impedir que cliques internos fechem o modal
    el.addEventListener("click", (e)=>{ if (e.target.closest(".cal-modal")) e.stopPropagation(); });
    // fechar
    el.addEventListener("click", (e)=>{ if (e.target.classList.contains("cal-modal-wrap")) closeModal(); }, { passive:true });
    el.querySelector(".cal-close").addEventListener("click", (e)=>{ e.preventDefault(); e.stopPropagation(); closeModal(); });

    const body = () => document.querySelector("#taskora-cal-modal .cal-modal-body");

    // Delegação de eventos (ações e editor)
    el.addEventListener("click", async (e)=>{
      const btnAct = e.target.closest(".btn-act");
      const btnSave = e.target.closest(".btn-edit-save");
      const btnCancel = e.target.closest(".btn-edit-cancel");

      if (!btnAct && !btnSave && !btnCancel) return;
      e.preventDefault(); e.stopPropagation();

      // localizar item alvo
      const container = e.target.closest(".cal-modal-item, .cal-edit");
      const itemEl = container?.classList.contains("cal-edit")
        ? container.previousElementSibling
        : container;
      const id = itemEl?.getAttribute("data-task-id");
      const idx = itemsRef.findIndex(x => String(x.id) === String(id));
      if (idx < 0) return;
      const task = itemsRef[idx];

      // ação
      const action = btnAct?.getAttribute("data-act") || (btnSave ? "save" : "cancel");

      try{
        if (action === "duplicate") {
          // Garantir que a data da tarefa original seja preservada exatamente como está
          const originalDate = task.date;
          console.log("[Calendar] Duplicando tarefa com data original:", originalDate);
          
          const ok = await duplicateNormalized(task.id, originalDate);
          if (!ok) { alert("Não foi possível duplicar aqui."); return; }
          
          // Passar a data original explicitamente para garantir que seja preservada
          const fresh = await onAfterChange?.("duplicate", { id: task.id, date: originalDate });
          if (Array.isArray(fresh)) itemsRef = fresh;
          if (body()) body().innerHTML = itemsRef.map(renderModalItem).join("");

        } else if (action === "delete") {
          if (!confirm("Deseja excluir esta tarefa?")) return;
          await deleteTask(task.id);
          const fresh = await onAfterChange?.("delete", { id: task.id, date: task.date });
          if (Array.isArray(fresh)) itemsRef = fresh;
          if (body()) body().innerHTML = itemsRef.map(renderModalItem).join("");

        } else if (action === "edit") {
          const exist = itemEl.nextElementSibling;
          if (exist && exist.classList?.contains("cal-edit")) exist.remove();
          const lookups = buildLookups(itemsRef);
          itemEl.insertAdjacentHTML("afterend", renderEditInline(task, lookups));

        } else if (action === "save") {
          const editEl = e.target.closest(".cal-edit"); if (!editEl) return;
          const payload = {};
          editEl.querySelectorAll(".cei").forEach(inp=>{
            const k = inp.getAttribute("data-k");
            payload[k] = inp.value;
          });
          await updateTask(task.id, payload);
          const fresh = await onAfterChange?.("edit", { id: task.id, date: payload.date || task.date });
          if (Array.isArray(fresh)) itemsRef = fresh;
          if (body()) body().innerHTML = itemsRef.map(renderModalItem).join("");
          
          // Fechar o modal automaticamente após salvar
          closeModal();

        } else if (action === "cancel") {
          const editEl = e.target.closest(".cal-edit"); if (editEl) editEl.remove();
        }
      } catch(err){
        console.error("[Calendar][modal action] error:", err);
        alert("Não foi possível concluir a ação.");
      }
    });

    document.body.appendChild(el);
    return el;
  }

  // ------------------ Render principal ------------------
  function render(){
    const root = document.createElement("div");
    root.className = "calendar-page";
    root.innerHTML = `
      <style>
        .cal-grid{ display:grid; grid-template-columns:repeat(7,1fr); gap:10px; }
        .cal-cell{ background:#fff; border:1px solid #ECEDEA; border-radius:10px; padding:8px; overflow:hidden; min-height:112px; }
        .cal-week-hd{ display:grid; grid-template-columns:repeat(7,1fr); gap:10px; margin-bottom:12px }
        .cal-week-hd > div{ background:${COLORS.off}; border:1px solid #E6E3DF; border-radius:8px; padding:10px 12px; font-weight:900; color:#334155; font-size:12px; text-align:center }
        @media (max-width: 900px){ .cal-cell{ min-height:130px } }
      </style>
      <div class="cal-header" style="margin:0 0 28px 0; padding-bottom:16px; border-bottom:2px solid #E4E7E4">
        <h2 style="margin:0; font-size:28px; font-weight:800; letter-spacing:-0.5px; color:#014029; text-transform:uppercase; font-family:system-ui, -apple-system, sans-serif">CALENDÁRIO</h2>
      </div>
      <div class="cal-week-hd">
        <div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div><div>Dom</div>
      </div>
      <div class="cal-grid" id="cal-grid"></div>
    `;

    const grid = root.querySelector("#cal-grid");

    (async ()=>{
      const today = new Date();
      const { start, end, first } = monthWindow(today);
      const currentMonth = first.getUTCMonth();

      const filters = (global.TaskoraFilters && typeof TaskoraFilters.get === "function") ? TaskoraFilters.get() : {};
      const rows = await listTasksByDateRange({ from: toISO(start), to: toISO(end), filters });
      const tasks = Array.isArray(rows) ? rows : [];
      let bucket = bucketizeByDay(tasks, start, end);

      /* === Calendar grid sizing (encaixe por viewport, 6 linhas) === */
const fitCalendarGrid = (gridEl) => {
  try {
    const ROWS = 6;
  

    // Medidas do grid
    const gridRect = gridEl.getBoundingClientRect();
    const gridCS   = getComputedStyle(gridEl);

    // Descontos internos do grid
    const padTop    = parseFloat(gridCS.paddingTop || '0');
    const padBottom = parseFloat(gridCS.paddingBottom || '0');
    const bTop      = parseFloat(gridCS.borderTopWidth || '0');
    const bBottom   = parseFloat(gridCS.borderBottomWidth || '0');
    const rowGap    = parseFloat(gridCS.rowGap || gridCS.gridRowGap || '0');

    // Altura disponível do topo do grid até o fim do viewport
    // Margem de segurança para evitar corte da última linha
    const viewportH = window.innerHeight;
    const gridTop   = Math.floor(gridRect.top);
    const epsilon   = 150; // Margem de segurança máxima para garantir visibilidade completa

    const available = Math.max(
      480, // Altura mínima aumentada para garantir visibilidade completa
      Math.floor(
        (viewportH - gridTop - epsilon)
        - padTop - padBottom
        - bTop - bBottom
        - rowGap * (ROWS - 1)
      )
    );

    // Calcula altura por linha e aplica
    let row = Math.floor(available / ROWS);
    row = Math.max(112, row); // Altura aumentada em 2px para teste

    gridEl.style.gridAutoRows = `${row}px`;

    // Altura total exata do grid = linhas + gaps + paddings + bordas
    const totalHeight =
      row * ROWS + rowGap * (ROWS - 1) + padTop + padBottom + bTop + bBottom;
    gridEl.style.height = `${totalHeight}px`;

    // Ajuste fino no próximo frame (caso sobre/estoure 1–2px)
    requestAnimationFrame(() => {
      const doc = document.documentElement;
      const overflow = doc.scrollHeight - doc.clientHeight; // >0 estourou, <0 sobrou
      if (overflow !== 0) {
        const adjust = Math.ceil(Math.abs(overflow) / ROWS);
        let newRow = overflow > 0 ? row - adjust : row + adjust;
        if (newRow < 80) newRow = 80;

        gridEl.style.gridAutoRows = `${newRow}px`;
        const total2 =
          newRow * ROWS + rowGap * (ROWS - 1) + padTop + padBottom + bTop + bBottom;
        gridEl.style.height = `${total2}px`;
      }
    });
  } catch (_) {}
};

// Chamar ao montar e no resize
requestAnimationFrame(() => fitCalendarGrid(grid));
window.addEventListener('resize', () => fitCalendarGrid(grid), { passive: true });
/* === end: Calendar grid sizing === */





      const days = []; for (let d = new Date(start); d <= end; d = addDays(d, 1)) days.push(new Date(d));
      grid.innerHTML = days.map(d=>{
        const iso = toISO(d);
        const list = bucket.get(iso) || [];
        const top = list.slice(0, MAX_PER_CELL);
        const hidden = list.length - top.length;
        return `<div class="cal-cell" data-iso="${iso}">
          ${cellHeader(d, currentMonth)}
          ${top.map(taskChip).join("")}
          ${hidden>0 ? moreLink(hidden, iso) : ""}
        </div>`;
      }).join("");

      async function refreshDayAndModal(iso, modalTitle){
        const rows2 = await listTasksByDateRange({ from: toISO(start), to: toISO(end), filters: (TaskoraFilters && TaskoraFilters.get? TaskoraFilters.get(): {}) });
        const tasks2 = Array.isArray(rows2) ? rows2 : [];
        bucket = bucketizeByDay(tasks2, start, end);

        // atualiza célula
        const cell = grid.querySelector(`.cal-cell[data-iso="${iso}"]`);
        if (cell) {
          const list2 = bucket.get(iso) || [];
          const top2 = list2.slice(0, MAX_PER_CELL);
          const hidden2 = list2.length - top2.length;
          cell.innerHTML = `${cellHeader(new Date(iso), currentMonth)}${top2.map(taskChip).join("")}${hidden2>0?moreLink(hidden2, iso):""}`;
        }

        // retorna lista atualizada p/ modal re-render
        const listForModal = (bucket.get(iso) || []).slice();
        return listForModal;
      }

      // Abrir modal do DIA pelo “mostrar mais”
      grid.addEventListener("click", async (e)=>{
        const btn = e.target.closest("[data-more]");
        if(!btn) return;
        e.preventDefault(); e.stopPropagation();
        const iso = btn.getAttribute("data-more");
        const all = (bucket.get(iso) || []).slice();

        openModal(`Tarefas em ${iso}`, all, {
          onAfterChange: async ()=> await refreshDayAndModal(iso, `Tarefas em ${iso}`)
        });
      });

      // Abrir modal de UMA TAREFA clicando na pill
      grid.addEventListener("click", (e)=>{
        const pill = e.target.closest(".cal-chip");
        if (!pill) return;
        e.preventDefault(); e.stopPropagation();
        const iso = pill.getAttribute("data-open-day");
        const id  = pill.getAttribute("data-task-id");
        const all = (bucket.get(iso) || []).slice();
        const one = all.filter(t => String(t.id) === String(id));
        const items = one.length ? one : all.slice(0,1);

        openModal(`Tarefa em ${iso}`, items, {
          onAfterChange: async ()=> {
            const fresh = await refreshDayAndModal(iso, `Tarefa em ${iso}`);
            return fresh.filter(t => one.length ? String(t.id) === String(id) : true);
          }
        });
      });

      // Reagir a alterações dos filtros globais (re-render da página)
      if (global.TaskoraFilters && typeof TaskoraFilters.on === "function") {
        TaskoraFilters.on((_state, evt) => {
          if (evt?.type === "change") return;
          try {
            const host = root.parentNode;
            if (host) {
              const again = render();
              host.replaceChild(again, root);
            }
          } catch {}
        });
      }
    })();

    return root;
  }

  global.TaskoraPages = global.TaskoraPages || {};
  global.TaskoraPages.calendar = { render };
})(window);
