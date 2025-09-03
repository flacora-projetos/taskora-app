// assets/js/pages/tasks.js
// Tasks list — layout refinado + NewTaskModal (CRUD: criar/editar/duplicar/excluir)
// Paleta: terracota #993908, verde #014029, off-white #F2EFEB

import { db } from "../firebase.js";
import {
  collection, query, orderBy, limit, getDocs,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { createTask, updateTask, deleteTask } from "../data/tasksRepo.js";
import { formatToBrazilian, formatToAmerican, parseBrazilianDate } from "../utils/dateFormat.js";
import { initTasksDragDrop } from "../utils/tasksDragDrop.js";

/* global TaskoraFilters */

(function (global) {
  const PAGE_SIZE = 20;
  const PREFETCH = 200;

  // ============================ Utils ============================
  const pad = n => String(n).padStart(2,"0");
  const todayLocal = () => { 
    const d = new Date(); 
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); 
  };
  const toISOLocal = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
  function parseISOLocal(s){ 
    if(!s) return null; 
    const [y,m,dd]=s.split("-").map(Number); 
    return new Date(Date.UTC(y,(m||1)-1,dd||1)); 
  }
  function fmtDateISO(x){
    if(!x) return "";
    if(typeof x === "string") return x;          // "YYYY-MM-DD"
    if(x && x.seconds){                          // Firestore Timestamp
      const d = new Date(x.seconds*1000);
      return toISOLocal(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
    }
    return "";
  }
  function hoursFmt(v){ 
    const n = typeof v==="number" ? v : 0; 
    if (n === 0) return "00:00";
    const hours = Math.floor(n);
    const minutes = Math.round((n - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  
  function decimalToTime(v){
    const n = typeof v==="number" ? v : 0;
    if (n === 0) return "00:00";
    const hours = Math.floor(n);
    const minutes = Math.round((n - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  
  function timeToDecimal(timeStr){
    if (!timeStr || timeStr === "00:00") return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
  }
  const escapeHtml = s => String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function hashHue(str){ let h=0; const s=String(str||""); for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h%360; }
  // remove somente undefined (Firestore não aceita undefined)
  const noUndef = (obj) => {
    const out = {};
    Object.keys(obj || {}).forEach(k => { if (obj[k] !== undefined) out[k] = obj[k]; });
    return out;
  };

  // ===================== Normalização de status =====================
  const STATUS_OFFICIAL = ["iniciada","em progresso","concluída","não realizada"];
  const norm = s => (s||"").toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[_\s]+/g,"").toLowerCase();
  function canonStatus(raw){
    const n = norm(raw);
    if(!n) return "";
    if(["aberta","aberto","afazer","todo","open","nova","pendente","backlog"].includes(n)) return "iniciada";
    if(["emandamento","emprogresso","inprogress","doing","andamento","progresso"].includes(n)) return "em progresso";
    if(["concluida","concluido","finalizada","finalizado","done","completed","fechada","fechado"].includes(n)) return "concluída";
    if(["naorealizada","naorealizado","cancelada","cancelado","notdone","canceled","nrealizada"].includes(n)) return "não realizada";
    if(STATUS_OFFICIAL.map(norm).includes(n)) return raw;
    return raw || "";
  }

  // =========================== UI helpers ==========================
  function statusView(statusRaw){
    const cs = canonStatus(statusRaw);
    const lower = cs.toString().toLowerCase();
    const palette = {
      "iniciada":      { bg:"#EEF0F3", fg:"#334155", bd:"#E0E5EA", label:"INICIADA" },
      "em progresso":  { bg:"#FFF3D6", fg:"#8A5B00", bd:"#FFE4A6", label:"EM PROGRESSO" },
      "concluída":     { bg:"#E7F4EC", fg:"#0B6B2C", bd:"#C9E7D2", label:"CONCLUÍDA" },
      "não realizada": { bg:"#FDE9E7", fg:"#8A1C12", bd:"#F6C8C2", label:"NÃO REALIZADA" }
    };
    if(palette[lower]){ const p=palette[lower]; return `<span class="tk-chip tk-chip--status" style="--bg:${p.bg};--fg:${p.fg};--bd:${p.bd}">${p.label}</span>`; }
    if(!cs) return `<span class="tk-chip" style="--bg:#EEF1EF;--fg:#475569;--bd:#E1E5E1">—</span>`;
    return `<span class="tk-chip" style="--bg:#EEF1EF;--fg:#475569;--bd:#E1E5E1">${escapeHtml(String(cs).toUpperCase())}</span>`;
  }
  function clientView(name){
    const v=(name||"—").trim(); const h=hashHue(v);
    const bg=`hsl(${h} 60% 96%)`, bd=`hsl(${h} 55% 85%)`, fg=`hsl(${h} 50% 28%)`;
    return `<span class="tk-chip tk-chip--client" style="--bg:${bg};--fg:${fg};--bd:${bd}">${escapeHtml(v)}</span>`;
  }

  // ====================== Toast central (overlay) ===================
  function showCenterToast(message, ms=2200){
    let overlay=document.getElementById("tk-center-toast");
    if(!overlay){
      overlay=document.createElement("div");
      overlay.id="tk-center-toast";
      overlay.innerHTML=`
        <style id="tk-center-toast-style">
          #tk-center-toast{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:2000;opacity:0;transition:opacity .18s ease}
          #tk-center-toast .tk-bubble{pointer-events:auto;background:#014029;color:#fff;border-radius:12px;padding:12px 16px;font-weight:800;box-shadow:0 10px 30px rgba(0,0,0,.25);letter-spacing:.2px;min-width:260px;text-align:center}
        </style>
        <div class="tk-bubble" role="status" aria-live="polite"></div>`;
      document.body.appendChild(overlay);
    }
    overlay.querySelector(".tk-bubble").textContent=message;
    overlay.style.opacity="1";
    clearTimeout(showCenterToast._t);
    showCenterToast._t=setTimeout(()=>{ overlay.style.opacity="0"; }, ms);
  }

  // ============================ Página =============================
  function render(){
    const root=document.createElement("div");
    root.className="tasks-page";
    root.innerHTML=`
      <style>
        .tasks-page{ background:#F8F9FA; min-height:100vh; font-size:13px; color:#2F3B2F; display:flex; flex-direction:column; }
        
        /* Campo sticky com título, cards e filtros */
        .tk-sticky-section {
          position: sticky;
          top: 65px;
          z-index: 10;
          background: #F8F9FA;
          padding: 32px 32px 20px 32px;
          border-bottom: 2px solid #E4E7E4;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .tk-header{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px; }
        .tk-header h2 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #014029; text-transform: uppercase; font-family: system-ui, -apple-system, sans-serif }
        .tk-header-actions{ display:flex; gap:8px; align-items:center }
        .tk-header .tk-btn { padding: 10px 20px; font-size: 13px; font-weight: 600; border-radius: 8px; background: #014029; color: #fff; border: none; cursor: pointer; transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px }
        .tk-header .tk-btn:hover { background: #025a35; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(1,64,41,0.3) }
        .tk-header .tk-btn--secondary { background: #993908; color: #fff; border: 1px solid #993908 }
        .tk-header .tk-btn--secondary:hover { background: #7a2d06; box-shadow: 0 4px 12px rgba(153,57,8,0.3) }
        .tk-header .tk-btn svg { width: 14px; height: 14px; flex-shrink: 0 }
        
        .tk-stats-grid{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px }
        .tk-stat-card{ background:#fff; border:1px solid #E4E7E4; border-radius:12px; padding:20px; text-align:center; transition:all 0.2s ease }
        .tk-stat-card:hover{ transform:translateY(-2px); box-shadow:0 8px 25px rgba(0,0,0,0.1) }
        .tk-stat-number{ font-size:24px; font-weight:800; color:#014029; margin-bottom:4px; letter-spacing:-0.5px }
        .tk-stat-label{ font-size:11px; color:#6B7280; text-transform:uppercase; letter-spacing:0.5px; font-weight:600 }
        
        .tk-filters-section .tgf-wrap{ 
          background: #FAFAF8; 
          border: 1px solid #ECEDEA; 
          border-radius: 12px; 
          padding: 16px; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        
        /* Campo da listagem separado */
        .tk-content-section {
          flex: 1;
          padding: 0;
          overflow: auto;
        }
        .tk-card { background: #fff; border: none; border-radius: 0; box-shadow: none; }
        .tk-toolbar { padding: 0; border-bottom: none; display: flex; justify-content: space-between; align-items: center; }
        .tk-left, .tk-right { display: flex; gap: 8px; align-items: center; }
        }
        .tk-header h2{ margin:0; font-size:28px; font-weight:800; letter-spacing:-0.5px; color:#014029; text-transform:uppercase; font-family:system-ui, -apple-system, sans-serif }
        .tk-header .tk-btn{ padding:10px 20px; font-size:13px; font-weight:600; border-radius:8px; border:none; cursor:pointer; transition:all 0.2s ease; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:6px }
        .tk-header .tk-btn--primary{ background:#014029; color:#fff; }
        .tk-header .tk-btn--primary:hover{ background:#025a35; transform:translateY(-1px); box-shadow:0 4px 12px rgba(1,64,41,0.3) }
        .tk-header .tk-btn--secondary{ background:#993908; color:#fff; border:1px solid #993908; }
        .tk-header .tk-btn--secondary:hover{ background:#7a2d06; box-shadow:0 4px 12px rgba(153,57,8,0.3); transform:translateY(-1px); }
        .tk-header .tk-btn svg{ width:14px; height:14px; flex-shrink:0; }
        .tk-stats-grid{ display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin-bottom:24px }
        .tk-stat-card{ background:#fff; border:1px solid #E4E7E4; border-radius:10px; padding:18px 16px; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.04); transition:all 0.2s ease }
        .tk-stat-card:hover{ box-shadow:0 3px 8px rgba(0,0,0,0.08); transform:translateY(-1px) }
        .tk-stat-number{ font-size:24px; font-weight:700; color:#014029; margin-bottom:6px; font-variant-numeric:tabular-nums; line-height:1 }
        .tk-stat-label{ font-size:10px; font-weight:600; color:#6B7280; text-transform:uppercase; letter-spacing:0.5px; line-height:1.2 }
        @media (max-width: 768px){ .tk-stats-grid{ grid-template-columns:repeat(2, 1fr); gap:16px } }
        @media (max-width: 480px){ .tk-stats-grid{ grid-template-columns:1fr; gap:12px } .tk-stat-card{ padding:20px 16px } }
        .tk-card{ background:#FAFAF8; border:1px solid #ECEDEA; border-radius:12px; padding:12px }
        .tk-toolbar{ display:flex; align-items:center; gap:8px; margin:0 0 10px 0; justify-content:space-between }
        .tk-left{ display:flex; align-items:center; gap:8px }
        .tk-count{ font-weight:700; color:#152015 }
        .tk-btn{ background:#fff; border:1px solid #E4E7E4; border-radius:10px; height:32px; padding:0 12px; cursor:pointer; font-weight:800; transition:background .15s ease, border-color .15s ease }
        .tk-btn--primary{ background:#014029; border-color:#014029; color:#fff }
        .tk-btn:hover{ background:#F7F9F7 }
        .tk-btn.tk-btn--primary:hover{ background:#013522; border-color:#013522; color:#fff }
        .tk-table{ width:100%; border-collapse:separate; border-spacing:0; table-layout:fixed }
        .tk-content-section{ position:relative; overflow:auto; }
        
        /* Cabeçalho da tabela dentro do sticky */
        .tk-table-header { 
          background: #FFFFFF; 
          border: 1px solid #E4E7E4;
          border-radius: 8px;
          padding: 0;
          margin: 16px 0 0 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .tk-table-header table { border-collapse: separate; border-spacing: 0; }
        .tk-table-header th { text-align: left; font-weight: 900; font-size: 12px; color: #334155; padding: 12px 10px; letter-spacing: 0.2px; background: #F8F9FA; border: none; }
        .tk-table-header th:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
        .tk-table-header th:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
        


        .tk-row{ box-shadow:0 1px 1px rgba(0,0,0,.03), 0 6px 16px rgba(0,0,0,.03) }
        .tk-cell{ background:#fff; border:1px solid #EEE; padding:10px 12px; vertical-align:middle; overflow:hidden; }
        .tk-cell:first-child{ border-top-left-radius:10px; border-bottom-left-radius:10px }
        .tk-cell:last-child{ border-top-right-radius:10px; border-bottom-right-radius:10px }
        .tk-num{ text-align:right; font-variant-numeric:tabular-nums }
        .tk-desc{ color:#1f2937; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; }
        .tk-chip{ display:inline-block; padding:3px 10px; border-radius:999px; font-weight:800; font-size:11px; line-height:1; border:1px solid var(--bd); color:var(--fg); background:var(--bg); white-space:nowrap }
        .tk-chip--status{ letter-spacing:.2px }
        .tk-chip--client{ font-weight:700 }
        /* Ajuste de larguras (reduzimos a descrição para caber ações) */
        .col-status{ width:130px }
        .col-client{ width:200px }
        .col-desc{ width: min(44vw, 520px) }
        .col-owner{ width:160px }
        .col-date{ width:110px; text-align:center }
        .col-hours{ width:80px; text-align:center }
        .col-actions{ width:100px; text-align:center }
        /* Botões de ação por linha */
        .tk-actions{ display:inline-flex; gap:6px; justify-content:flex-end; width:100% }
        .tk-iconbtn{
          --size:26px; width:var(--size); height:var(--size);
          display:inline-flex; align-items:center; justify-content:center;
          border:1px solid #E4E7E4; border-radius:8px; background:#fff; cursor:pointer;
        }
        .tk-iconbtn:hover{ background:#F2EFEB }
        .tk-icon--edit{ color:#014029 }
        .tk-icon--copy{ color:#993908 }
        .tk-icon--trash{ color:#8A1C12 }
        .tk-iconbtn svg{ width:14px; height:14px }
        @media (max-width: 900px){ .tk-hide-sm{ display:none } .tk-desc{ display:block; max-width:420px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap } }
      </style>

      <!-- Campo Sticky: Título + Cards + Filtros -->
      <div class="tk-sticky-section">
        <div class="tk-header">
           <h2>Tasks</h2>
           <div class="tk-header-actions">
             <button id="exportCsvBtn" class="tk-btn tk-btn--secondary" type="button">
               <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                 <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
               </svg>
               CSV
             </button>
             <button id="exportPdfBtn" class="tk-btn tk-btn--secondary" type="button">
               <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                 <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clip-rule="evenodd" />
               </svg>
               PDF
             </button>
             <button id="newTaskBtn" class="tk-btn tk-btn--primary" data-new-task type="button">Nova Tarefa</button>
           </div>
         </div>
        
        <div class="tk-stats-grid" id="stats-grid">
          <div class="tk-stat-card">
            <div class="tk-stat-number" id="stat-total">0</div>
            <div class="tk-stat-label">Tarefas (total)</div>
          </div>
          <div class="tk-stat-card">
            <div class="tk-stat-number" id="stat-hours">0</div>
            <div class="tk-stat-label">Horas (total)</div>
          </div>
          <div class="tk-stat-card">
            <div class="tk-stat-number" id="stat-pending">0</div>
            <div class="tk-stat-label">Pendentes</div>
          </div>
          <div class="tk-stat-card">
            <div class="tk-stat-number" id="stat-completed">0</div>
            <div class="tk-stat-label">Concluídas</div>
          </div>
        </div>
        
        <!-- Filtros Globais Integrados -->
        <div class="tk-filters-section" id="global-filters-container">
          <!-- Os filtros globais serão inseridos aqui -->
        </div>
        
        <!-- Cabeçalho da Tabela -->
        <div class="tk-table-header">
          <table class="tk-table" style="margin: 0;">
            <thead>
              <tr>
                <th class="col-status">STATUS</th>
                <th class="col-client">CLIENTE</th>
                <th class="col-desc" style="text-align: center;">TAREFA</th>
                <th class="col-owner">RESPONSÁVEL</th>
                <th class="col-date tk-hide-sm" style="text-align: center;">INÍCIO</th>
                <th class="col-date tk-hide-sm" style="text-align: center;">LIMITE</th>
                <th class="col-hours" style="text-align: center;">HORAS</th>
                <th class="col-actions" style="text-align: center;">AÇÕES</th>
              </tr>
            </thead>
          </table>
        </div>

      </div>
      
      <!-- Campo da Listagem Separado -->
      <div class="tk-content-section">
        <div class="tk-card">
          <div class="tk-toolbar">
            <div class="tk-left"></div>
            <div class="tk-right">
              <button id="more" class="tk-btn" hidden type="button">Carregar mais</button>
            </div>
          </div>

          <div id="table-wrap"></div>
        </div>
      </div>
    `;

    const elTableWrap = root.querySelector("#table-wrap");
    const elMore = root.querySelector("#more");
    const elNew = root.querySelector("#newTaskBtn");
    const elStatTotal = root.querySelector("#stat-total");
    const elStatHours = root.querySelector("#stat-hours");
    const elStatPending = root.querySelector("#stat-pending");
    const elStatCompleted = root.querySelector("#stat-completed");

    let allRows=[]; let page=0;

    const setLoading = on => elTableWrap.innerHTML = on ? `<div class="tk-card" style="text-align:center;color:#6b7280">Carregando…</div>` : '';
    
    function updateStats() {
      const total = allRows.length;
      const totalHours = allRows.reduce((sum, row) => sum + (row.hours || 0), 0);
      const pending = allRows.filter(row => {
        const status = canonStatus(row.status || '').toLowerCase();
        return status === 'iniciada' || status === 'em progresso' || status === 'não realizada';
      }).length;
      const completed = allRows.filter(row => {
        const status = canonStatus(row.status || '').toLowerCase();
        return status === 'concluída';
      }).length;
      
      elStatTotal.textContent = total;
      elStatHours.textContent = hoursFmt(totalHours);
      elStatPending.textContent = pending;
      elStatCompleted.textContent = completed;
    }

    function actionsCell(r){
      return `
        <div class="tk-actions" data-actions data-id="${r.id}">
          <button class="tk-iconbtn" data-edit title="Editar">
            <svg class="tk-icon--edit" viewBox="0 0 24 24" fill="none"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" stroke-width="1.5"/><path d="M14.06 6.19l3.75 3.75" stroke="currentColor" stroke-width="1.5"/></svg>
          </button>
          <button class="tk-iconbtn" data-dup title="Duplicar">
            <svg class="tk-icon--copy" viewBox="0 0 24 24" fill="none"><path d="M8 8h11v11H8z" stroke="currentColor" stroke-width="1.5"/><path d="M5 5h11v11" stroke="currentColor" stroke-width="1.5"/></svg>
          </button>
          <button class="tk-iconbtn" data-del title="Excluir">
            <svg class="tk-icon--trash" viewBox="0 0 24 24" fill="none"><path d="M6 7h12M9 7V5h6v2M8 7l1 12h6l1-12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </div>`;
    }

    function renderTableSlice(){
      const start=page*PAGE_SIZE;
      const slice=allRows.slice(start,start+PAGE_SIZE);

      if(page===0){
            elTableWrap.innerHTML=`
              <table class="tk-table">
                <thead style="visibility: hidden; height: 0; line-height: 0;">
                  <tr>
                    <th class="col-status" style="padding: 0; border: none;">STATUS</th>
                    <th class="col-client" style="padding: 0; border: none;">CLIENTE</th>
                    <th class="col-desc" style="padding: 0; border: none;">TAREFA</th>
                    <th class="col-owner" style="padding: 0; border: none;">RESPONSÁVEL</th>
                    <th class="col-date tk-hide-sm" style="padding: 0; border: none;">INÍCIO</th>
                    <th class="col-date tk-hide-sm" style="padding: 0; border: none;">LIMITE</th>
                    <th class="col-hours" style="padding: 0; border: none;">HORAS</th>
                    <th class="col-actions" style="padding: 0; border: none;">AÇÕES</th>
                  </tr>
                </thead>
                <tbody class="tk-tbody"></tbody>
              </table>`;
          }

      const tbody=elTableWrap.querySelector(".tk-tbody");
      if(slice.length===0 && page===0){
        tbody.innerHTML=`<tr class="tk-row"><td class="tk-cell" colspan="8" style="text-align:center">Nenhuma tarefa para os filtros atuais.</td></tr>`;
      }else{
        const rowsHtml = slice.map(r=>{
          const dStart = formatToBrazilian(r.date || r.createdAt);
          const dDue   = formatToBrazilian(r.dueDate);
          return `
            <tr class="tk-row" data-row-id="${r.id}" data-task-row="true" style="cursor: grab;" title="Arraste para alterar o status">
              <td class="tk-cell">${statusView(r.status)}</td>
              <td class="tk-cell">${clientView(r.client)}</td>
              <td class="tk-cell tk-desc" title="${escapeHtml(r.description || "")}">${escapeHtml(r.description || "—")}</td>
              <td class="tk-cell">${escapeHtml(r.owner || "—")}</td>
              <td class="tk-cell tk-hide-sm">${dStart || "—"}</td>
              <td class="tk-cell tk-hide-sm">${dDue || "—"}</td>
              <td class="tk-cell tk-num">${hoursFmt(r.hours)}</td>
              <td class="tk-cell">${actionsCell(r)}</td>
            </tr>`;
        }).join("");
        tbody.insertAdjacentHTML("beforeend", rowsHtml);
        
        // Inicializar drag & drop após renderizar
        setTimeout(() => {
          initDragDrop();
        }, 100);
      }

      const total=allRows.length, shown=Math.min((page+1)*PAGE_SIZE,total);
      elMore.hidden = shown >= total;
      
      // Atualizar estatísticas
      updateStats();
    }

    async function fetchFromFirestoreOrdered(){
      const q = query(collection(db,"tasks"), orderBy("createdAt","desc"), limit(PREFETCH));
      const snap = await getDocs(q);
      return snap.docs.map(d=>({id:d.id, ...d.data()}));
    }
    async function fetchFromFirestoreSimple(){
      const snap = await getDocs(collection(db,"tasks"));
      return snap.docs.map(d=>({id:d.id, ...d.data()}));
    }

    async function fetchAndFilter(current){
      setLoading(true); page=0;
      try{
        let docs=[];
        try{
          docs = await fetchFromFirestoreOrdered();
        }catch(err){
          console.error("[Tasks] Falha na consulta ordenada por createdAt. Fazendo fallback simples.", err);
          docs = await fetchFromFirestoreSimple();
        }

        const inRange = (docDate) => {
          if(!current.dateFrom && !current.dateTo) return true;
          const dd = (docDate || "");
          if(current.dateFrom && dd < current.dateFrom) return false;
          if(current.dateTo && dd > current.dateTo) return false;
          return true;
        };

        allRows = docs.filter(r =>
          (!current.status || current.status==="all" || norm(canonStatus(r.status))===norm(current.status)) &&
          (!current.client || current.client==="all" || r.client===current.client) &&
          (!current.owner || current.owner==="all" || r.owner===current.owner) &&
          inRange(r.date || r.dueDate || fmtDateISO(r.createdAt))
        );
      }catch(err){
        console.error("[Tasks] Erro ao buscar tarefas:", err);
        allRows = [];
      }finally{
        setLoading(false);
      }
      renderTableSlice();
    }

    elMore.addEventListener("click", ()=>{ page+=1; renderTableSlice(); });

    // ==================== NewTaskModal (UI) ====================
    const NewTaskModal = (()=>{
      function open({clients=[], owners=[], onOk=()=>{}, initial=null, isEdit=false}){
        const wrap=document.createElement("div");
        wrap.innerHTML=`
          <style>
            .nt-backdrop{ position:fixed; inset:0; background:rgba(0,0,0,.35); display:flex; align-items:flex-start; justify-content:center; padding:4vh 16px; z-index:1000 }
            .nt-modal{ width:min(980px,96vw); background:#fff; border-radius:16px; box-shadow:0 20px 60px rgba(0,0,0,.25); overflow:hidden }
            .nt-hd{ background:#F2EFEB; border-bottom:1px solid #E6E3DF; padding:14px 18px; display:flex; align-items:center; justify-content:space-between }
            .nt-title{ margin:0; font-weight:900; color:#152015; letter-spacing:.2px }
            .nt-close{ border:none; background:transparent; cursor:pointer; font-size:18px; padding:4px 8px }
            .nt-bd{ padding:16px 18px }
            .nt-grid{ display:grid; grid-template-columns:repeat(12,1fr); gap:12px }
            .nt-field{ display:flex; flex-direction:column; gap:6px }
            .nt-label{ font-size:12px; font-weight:800; color:#2F3B2F; letter-spacing:.2px }
            .nt-input,.nt-select,.nt-textarea{ height:36px; padding:0 12px; border:1px solid #E4E7E4; border-radius:10px; font:inherit; background:#fff }
            .nt-textarea{ height:72px; padding:10px 12px; resize:vertical }
            .nt-row{ display:flex; gap:10px; align-items:center }
            .nt-help{ font-size:12px; color:#6b7280 }
            .nt-chip{ display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border:1px solid #E4E7E4; border-radius:999px; cursor:pointer; user-select:none }
            .nt-chip.is-on{ background:#014029; color:#fff; border-color:#014029 }
            .nt-ft{ display:flex; justify-content:space-between; align-items:center; padding:14px 18px; border-top:1px solid #EDEDED; background:#FAFAF8 }
            .nt-actions{ display:flex; gap:10px }
            .nt-btn{ height:36px; padding:0 14px; border-radius:10px; border:1px solid #E4E7E4; background:#fff; cursor:pointer; font-weight:800 }
            .nt-btn--primary{ background:#993908; border-color:#993908; color:#fff }
            .nt-btn[disabled]{ opacity:.6; cursor:not-allowed }
            @media (max-width:900px){ .nt-grid{ grid-template-columns:repeat(6,1fr) } }
            @media (max-width:560px){ .nt-grid{ grid-template-columns:repeat(2,1fr) } }
          </style>

          <div class="nt-backdrop" role="dialog" aria-modal="true" aria-labelledby="nt-title">
            <div class="nt-modal">
              <div class="nt-hd">
                <h3 class="nt-title" id="nt-title">${isEdit?'Editar Tarefa':'Adicionar Nova Tarefa'}</h3>
                <button class="nt-close" aria-label="Fechar" type="button">✕</button>
              </div>
              <div class="nt-bd">
                <div class="nt-grid" id="nt-form">
                  <div class="nt-field" style="grid-column:span 6">
                    <label class="nt-label" for="nt-client">Cliente *</label>
                    <select id="nt-client" class="nt-select"></select>
                  </div>
                  <div class="nt-field" style="grid-column:span 6">
                    <label class="nt-label" for="nt-owner">Responsável *</label>
                    <select id="nt-owner" class="nt-select"></select>
                  </div>
                  <div class="nt-field" style="grid-column:span 12">
                    <label class="nt-label" for="nt-desc-input">Descrição da Tarefa *</label>
                    <textarea id="nt-desc-input" class="nt-textarea" placeholder="O que precisa ser feito?"></textarea>
                  </div>
                  <div class="nt-field" style="grid-column:span 4">
                    <label class="nt-label" for="nt-status">Status</label>
                    <select id="nt-status" class="nt-select">
                      <option value="não realizada">Não realizada</option>
                      <option value="iniciada">Iniciada</option>
                      <option value="em progresso">Em progresso</option>
                      <option value="concluída">Concluída</option>
                    </select>
                  </div>
                  <div class="nt-field" style="grid-column:span 4">
                    <label class="nt-label" for="nt-hours">Horas (opcional)</label>
                    <input id="nt-hours" type="time" class="nt-input" value="00:00"/>
                  </div>
                  <div class="nt-field" style="grid-column:span 4">
                    <label class="nt-label" for="nt-date">Início *</label>
                    <input id="nt-date" type="date" class="nt-input"/>
                  </div>
                  <div class="nt-field" style="grid-column:span 4">
                    <label class="nt-label" for="nt-due">Limite *</label>
                    <input id="nt-due" type="date" class="nt-input"/>
                  </div>
                  <div class="nt-field" style="grid-column:span 4">
                    <label class="nt-label" for="nt-end">Término (opcional)</label>
                    <input id="nt-end" type="date" class="nt-input"/>
                  </div>
                  <div class="nt-field" style="grid-column:span 4">
                    <label class="nt-label" for="nt-recur">Recorrência</label>
                    <select id="nt-recur" class="nt-select">
                      <option value="none">Nenhuma</option>
                      <option value="daily">Todo dia</option>
                      <option value="weekdays">Dias úteis (seg–sex)</option>
                      <option value="weekly">Toda semana</option>
                      <option value="monthly">Todo mês</option>
                      <option value="weekly-one">Dia específico da semana</option>
                    </select>
                  </div>
                  <div id="nt-recur-extra" class="nt-field" style="grid-column:span 8; display:none">
                    <label class="nt-label">Configuração da recorrência</label>
                    <div id="nt-weekday-chips" class="nt-row" style="display:none">
                      ${[["1","Seg"],["2","Ter"],["3","Qua"],["4","Qui"],["5","Sex"]].map(([v,l])=>`<button type="button" class="nt-chip" data-day="${v}">${l}</button>`).join("")}
                      <span class="nt-help">Selecione 1 dia.</span>
                    </div>
                    <div id="nt-until-row" class="nt-row" style="display:none">
                      <span class="nt-help">Até (opcional):</span>
                      <input id="nt-until" type="date" class="nt-input"/>
                    </div>
                  </div>
                </div>
              </div>
              <div class="nt-ft">
                <div class="nt-actions">
                  <button class="nt-btn" id="nt-cancel" type="button">Cancelar</button>
                  <button class="nt-btn nt-btn--primary" id="nt-save" type="button">${isEdit?'Salvar alterações':'Salvar'}</button>
                </div>
              </div>
            </div>
          </div>`;

        const styleEl=wrap.querySelector("style");
        const backdrop=wrap.querySelector(".nt-backdrop");
        document.body.append(styleEl,backdrop);

        const btnSave=backdrop.querySelector("#nt-save");
        const btnCancel=backdrop.querySelector("#nt-cancel");
        const btnClose=backdrop.querySelector(".nt-close");
        const selClient=backdrop.querySelector("#nt-client");
        const selOwner=backdrop.querySelector("#nt-owner");

        selClient.innerHTML = `<option value="">Selecione…</option>` + (clients||[]).map(c=>`<option>${escapeHtml(c)}</option>`).join("");
        selOwner.innerHTML  = `<option value="">Selecione…</option>` + (owners||[]).map(o=>`<option>${escapeHtml(o)}</option>`).join("");

        const dToday=toISOLocal(todayLocal());
        backdrop.querySelector("#nt-date").value=dToday;
        backdrop.querySelector("#nt-due").value=dToday;
        backdrop.querySelector("#nt-status").value="não realizada";

        const recurSel=backdrop.querySelector("#nt-recur");
        const extraBox=backdrop.querySelector("#nt-recur-extra");
        const chipsRow=backdrop.querySelector("#nt-weekday-chips");
        const untilRow=backdrop.querySelector("#nt-until-row");
        const untilInp=backdrop.querySelector("#nt-until");
        function updateRecurUI(){
          const v=recurSel.value;
          extraBox.style.display=(v==="none")?"none":"block";
          chipsRow.style.display=(v==="weekly-one")?"flex":"none";
          untilRow.style.display=(v==="none")?"none":"flex";
          if(v!=="weekly-one"){ chipsRow.querySelectorAll(".nt-chip").forEach(c=>c.classList.remove("is-on")); }
        }
        updateRecurUI();
        recurSel.addEventListener("change",updateRecurUI);
        chipsRow.addEventListener("click",e=>{
          const btn=e.target.closest(".nt-chip"); if(!btn) return;
          chipsRow.querySelectorAll(".nt-chip").forEach(c=>c.classList.remove("is-on"));
          btn.classList.add("is-on");
        });

        // Pré‑preencher se for edição
        if(initial){
          selClient.value = initial.client || "";
          selOwner.value  = initial.owner  || "";
          backdrop.querySelector("#nt-desc-input").value = initial.description || "";
          backdrop.querySelector("#nt-status").value = canonStatus(initial.status || "não realizada");
          backdrop.querySelector("#nt-hours").value  = decimalToTime(initial.hours);
          backdrop.querySelector("#nt-date").value   = formatToAmerican(initial.date || initial.createdAt) || dToday;
          backdrop.querySelector("#nt-due").value    = formatToAmerican(initial.dueDate) || dToday;
          backdrop.querySelector("#nt-end").value    = formatToAmerican(initial.endDate) || "";
          // recorrência básica
          if(initial.recurrenceType && initial.recurrenceType!=="none"){
            recurSel.value = initial.recurrenceType === "weekly" && initial.recurrenceDays?.length===1 ? "weekly-one" : initial.recurrenceType;
            updateRecurUI();
            if(recurSel.value==="weekly-one" && initial.recurrenceDays?.[0]){
              const d = String(initial.recurrenceDays[0]);
              const btn = chipsRow.querySelector(`[data-day="${d}"]`); if(btn) btn.classList.add("is-on");
            }
            if(initial.recurrenceUntil) untilInp.value = initial.recurrenceUntil;
          }
        }

        function getPayloadFromForm(){
          const description=backdrop.querySelector("#nt-desc-input").value.trim();
          const status=backdrop.querySelector("#nt-status").value;
          const hoursStr=backdrop.querySelector("#nt-hours").value.trim();
          const date=backdrop.querySelector("#nt-date").value;
          const dueDate=backdrop.querySelector("#nt-due").value;
          const endDate=backdrop.querySelector("#nt-end").value;

          const errs=[];
          const client=selClient.value.trim();
          const owner=selOwner.value.trim();
          if(!client) errs.push("Cliente é obrigatório.");
          if(!owner) errs.push("Responsável é obrigatório.");
          if(description.length<3) errs.push("Descrição deve ter pelo menos 3 caracteres.");
          if(!date) errs.push("Data de início é obrigatória.");
          if(!dueDate) errs.push("Data limite é obrigatória.");

          const d0=parseISOLocal(date), d1=parseISOLocal(dueDate);
          if(d0&&d1&&d1<d0) errs.push("Data limite deve ser igual ou posterior ao início.");
          const de=endDate?parseISOLocal(endDate):null;
          if(de&&d0&&de<d0) errs.push("Término (se informado) deve ser igual ou posterior ao início.");

          let hours=undefined;
          if(hoursStr!=="" && hoursStr!=="00:00"){ 
            const n = timeToDecimal(hoursStr); 
            if(!(n>=0)) errs.push("Horas deve ser um horário válido."); 
            else hours = n; 
          }

          let recurrence={type:"none"}, recurrenceDays=undefined, recurrenceType="none", recurrenceUntil=undefined;
          const rv=recurSel.value;
          if(rv!=="none"){
            recurrenceType = rv==="weekly-one" ? "weekly" : rv;
            recurrence={type:recurrenceType};
            if(rv==="weekdays"){ recurrence.days=[1,2,3,4,5]; recurrenceDays=[1,2,3,4,5]; }
            if(rv==="weekly-one"){
              const on=chipsRow.querySelector(".nt-chip.is-on");
              if(!on) errs.push("Selecione exatamente um dia da semana para a recorrência.");
              else { const d=Number(on.getAttribute("data-day")); recurrence.days=[d]; recurrenceDays=[d]; }
            }
            if(untilInp.value){
              const du=parseISOLocal(untilInp.value);
              if(du&&d0&&du<d0) errs.push("Recorrência: 'Até' deve ser igual ou posterior ao início.");
              recurrence.until=untilInp.value; recurrenceUntil=untilInp.value;
            }
          }

          return {
            ok: errs.length===0,
            errors: errs,
            payload: {
              client, owner, description,
              status: canonStatus(status) || "não realizada",
              hours, date, dueDate, endDate: endDate || undefined,
              recurrence: (recurrence.type==="none" ? {type:"none"} : recurrence),
              ...(recurrenceType!=="none" ? {recurrenceType} : {recurrenceType:"none"}),
              ...(recurrenceDays ? {recurrenceDays} : {}),
              ...(recurrenceUntil ? {recurrenceUntil} : {}),
            }
          };
        }

        function close(){
          if(backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
          if(styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
          document.removeEventListener("keydown", onEsc);
        }
        const onEsc=e=>{ if(e.key==="Escape"){ e.preventDefault(); close(); } };
        document.addEventListener("keydown",onEsc);
        backdrop.addEventListener("click",e=>{ if(e.target===backdrop) close(); });

        btnCancel.addEventListener("click",e=>{ e.preventDefault(); close(); });
        btnClose .addEventListener("click",e=>{ e.preventDefault(); close(); });
        btnSave  .addEventListener("click",e=>{
          e.preventDefault();
          const {ok,errors,payload}=getPayloadFromForm();
          if(!ok){ alert(errors[0]); return; }
          try{ onOk(payload); }catch{}
          close();
        });

        setTimeout(()=>{ try{ btnSave && btnSave.focus(); }catch{} },10);
        return { close };
      }
      return { open };
    })();

    // ===================== Ações (CRUD) ======================
    async function handleDelete(id){
      if(!id) return;
      if(!confirm("Excluir esta tarefa? Essa ação não pode ser desfeita.")) return;
      try{
        await deleteDoc(doc(db,"tasks", id));
        showCenterToast("Tarefa excluída");
        // remove local e re-renderiza rápido
        allRows = allRows.filter(r=>r.id!==id);
        elTableWrap.querySelector(`tr[data-row-id="${id}"]`)?.remove();
      }catch(err){
        console.error("[Tasks] Erro ao excluir:", err);
        alert("Falha ao excluir a tarefa.");
      }
    }

    async function handleDuplicate(row){
      try{
        const copyPayload = {
          title: row.title || row.description || "(cópia)",
          description: row.description ? `${row.description} (cópia)` : "(cópia)",
          client: row.client || "",
          owner: row.owner || "",
          status: canonStatus(row.status || "não realizada"),
          hours: (typeof row.hours==="number" ? row.hours : undefined),
          date: row.date || fmtDateISO(row.createdAt) || toISOLocal(todayLocal()),
          dueDate: row.dueDate || fmtDateISO(todayLocal()),
          recurrenceType: row.recurrenceType || "none",
          ...(row.recurrenceDays ? {recurrenceDays:[...row.recurrenceDays]} : {}),
          ...(row.recurrenceUntil ? {recurrenceUntil: row.recurrenceUntil} : {})
        };
        const taskId = await createTask(copyPayload);
        showCenterToast("Tarefa duplicada");
        // Recarrega a lista para mostrar a nova tarefa
        page = 0; 
        await loadTasks();
      }catch(err){
        console.error("[Tasks] Erro ao duplicar:", err);
        alert("Falha ao duplicar a tarefa.");
      }
    }

    async function handleEdit(row){
      let clients=[], owners=[];
      try{
        const { listClients, listTeamMembers } = await import("../data/metaRepo.js");
        clients = await listClients();
        const teamMembers = await listTeamMembers();
        owners = teamMembers.map(member => member.name);
      }catch{}
      NewTaskModal.open({
        clients, owners, isEdit:true, initial: row,
        async onOk(payload){
          try{
            await updateTask(row.id, payload);
            showCenterToast("Tarefa atualizada");
            // Recarrega a lista para mostrar as alterações
            page = 0; 
            await loadTasks();
          }catch(err){
            console.error("[Tasks] Erro ao atualizar:", err);
            alert("Falha ao salvar alterações.");
          }
        }
      });
    }

    // Botão "Nova Tarefa" (criação real)
    async function openNewTaskModal(e){
      if(e) e.preventDefault();
      let clients=[], owners=[];
      try{
        const { listClients, listTeamMembers } = await import("../data/metaRepo.js");
        clients = await listClients();
        const teamMembers = await listTeamMembers();
        owners = teamMembers.map(member => member.name);
      }catch{}
      NewTaskModal.open({
        clients, owners,
        async onOk(payload){
          try{
            console.log('[Tasks] 🚀 Criando tarefa:', payload);
            const taskId = await createTask(payload);
            showCenterToast("Tarefa criada com sucesso");
            console.log('[Tasks] ✅ Tarefa criada com ID:', taskId);
            
            // Adicionar tarefa localmente para exibição imediata
            const newTask = { 
              id: taskId, 
              ...payload, 
              createdAt: { seconds: Math.floor(Date.now() / 1000) } 
            };
            allRows.unshift(newTask);
            page = 0; 
            renderTableSlice();
          }catch(err){
            console.error("[Tasks] Erro ao criar tarefa:", err);
            alert("Falha ao criar tarefa. Veja o console para detalhes.");
          }
        }
      });
    }

    // Delegação de eventos para AÇÕES por linha
    elTableWrap.addEventListener("click", (e)=>{
      const act = e.target.closest("[data-edit],[data-dup],[data-del]");
      if(!act) return;
      const wrap = e.target.closest("[data-actions]");
      const id = wrap?.dataset?.id;
      if(!id) return;
      const row = allRows.find(r=>r.id===id);
      if(!row) return;

      if(act.hasAttribute("data-del"))      handleDelete(id);
      else if(act.hasAttribute("data-dup")) handleDuplicate(row);
      else if(act.hasAttribute("data-edit")) handleEdit(row);
    });

    elNew.addEventListener("click", openNewTaskModal);

    // Inicializar drag & drop para tarefas
    let tasksDragDrop = null;
    
    function initDragDrop() {
      if (!tasksDragDrop) {
        tasksDragDrop = initTasksDragDrop();
        
        // Escutar mudanças de status via drag & drop
        tasksDragDrop.onStatusChange((event) => {
          const { taskId, oldStatus, newStatus } = event.detail;
          console.log(`[Tasks] Status alterado via drag & drop: ${taskId} (${oldStatus} → ${newStatus})`);
          
          // Atualizar estatísticas
          updateStats();
          
          // Opcional: recarregar dados para garantir sincronização
          // fetchAndFilter(TaskoraFilters.get());
        });
      }
      
      // Habilitar drag & drop na tabela atual
      const tableContainer = elTableWrap.querySelector('.tk-table');
      if (tableContainer) {
        tasksDragDrop.enableForTasksTable(tableContainer);
      }
    }
    
    // Primeira carga + filtros globais (mantido)
    fetchAndFilter(TaskoraFilters.get());
    TaskoraFilters.on((state, evt)=>{ if(evt?.type==="change") return; fetchAndFilter(state); });

    return root;
  }

  global.TaskoraPages = global.TaskoraPages || {};
  global.TaskoraPages.tasks = { render };
})(window);
