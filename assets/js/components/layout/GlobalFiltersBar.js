// Barra de Filtros Global — layout compacto + CSV/PDF funcionais (sem índices compostos)
// Paleta Dácora: terracota #993908, verde #014029, off-white #F2EFEB
// Mantém contrato com TaskoraFilters (auto-aplicar; sem botão Aplicar)

import { listClients, listTeamMembers } from "../../data/metaRepo.js";
import { db } from "../../firebase.js";
import {
  collection, query, orderBy, limit, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* global TaskoraFilters */

import { formatToBrazilian } from "../../utils/dateFormat.js";

const BRAND = {
  terracota: "#993908",
  green: "#014029",
  offwhite: "#F2EFEB",
};

function injectStylesOnce() {
  if (document.getElementById("taskora-global-filters-style")) return;
  const style = document.createElement("style");
  style.id = "taskora-global-filters-style";
  style.textContent = `
    :root{
      --tgf-h: 28px;
      --tgf-fs: 11.5px;
      --tgf-ico: 12px;
      --tgf-pad-x: 8px;
      --tgf-radius: 10px;
      --tgf-gap: 8px;
    }
    .tgf-wrap{ 
      background: var(--bg-secondary, ${BRAND.offwhite}); 
      border-bottom: 1px solid var(--border-color, #E6E3DF); 
      padding: 12px 20px; 
      position: sticky; 
      top: 65px; 
      z-index: 15; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .tgf-form{ 
      display: flex; 
      flex-wrap: wrap; 
      align-items: flex-end; 
      gap: var(--tgf-gap); 
      min-width: 0; 
      justify-content: space-between;
    }
    .tgf-filters-group {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: var(--tgf-gap);
      flex: 1;
    }
    
    .tgf-field{ display:flex; flex-direction:column; gap:4px; min-width:0; }
    .tgf-label{ 
      font-size: 11px; 
      font-weight: 800; 
      color: var(--text-secondary, #2F3B2F); 
      letter-spacing: .2px; 
      line-height: 1; 
      text-transform: uppercase;
    }
    .tgf-input, .tgf-select{
      height: var(--tgf-h); 
      padding: 0 var(--tgf-pad-x); 
      border: 1px solid var(--border-color, #E4E7E4);
      border-radius: var(--tgf-radius); 
      font: inherit; 
      background: var(--bg-primary, #fff); 
      color: var(--text-primary, #333);
      font-size: var(--tgf-fs); 
      min-width: 0;
      transition: all 0.2s ease;
    }
    .tgf-input:focus, .tgf-select:focus {
      outline: none;
      border-color: var(--brand-green, #014029);
      box-shadow: 0 0 0 2px rgba(1, 64, 41, 0.1);
    }
    .tgf-w-status { width: clamp(110px, 10vw, 140px); }
    .tgf-w-client { width: clamp(140px, 12vw, 180px); }
    .tgf-w-owner  { width: clamp(140px, 12vw, 180px); }
    .tgf-w-date   { width: clamp(130px, 10vw, 160px); }
    .tgf-w-quick  { width: clamp(150px, 12vw, 180px); }

    .tgf-btn{
      display:inline-flex; align-items:center; justify-content:center; gap:6px;
      height:var(--tgf-h); padding:0 calc(var(--tgf-pad-x) - 2px);
      border-radius:var(--tgf-radius); font-weight:800; font-size:var(--tgf-fs);
      border:1px solid transparent; cursor:pointer; white-space:nowrap;
      letter-spacing:.2px; transition:filter .15s ease, transform .02s ease;
      min-width: clamp(74px, 7vw, 92px);
    }
    .tgf-btn:focus-visible{ outline:2px solid #153; outline-offset:2px }
    .tgf-btn:hover{ filter:brightness(1.05) }
    .tgf-btn:active{ transform:translateY(1px) }
    .tgf-btn--clear{
        height: var(--tgf-h);
        padding: 0 var(--tgf-pad-x);
        border: 1px solid ${BRAND.terracota};
        border-radius: var(--tgf-radius);
        font: inherit;
        background: ${BRAND.terracota};
        color: #fff;
        font-size: var(--tgf-fs);
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-width: 0;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .tgf-btn--clear:hover{
        background: #7a2d06;
        border-color: #7a2d06;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(153, 57, 8, 0.3);
      }
      .tgf-btn--clear:focus {
        outline: none;
        border-color: var(--brand-green, #014029);
        box-shadow: 0 0 0 2px rgba(1, 64, 41, 0.1);
      }
    
    .tgf-btn .ico{ width:var(--tgf-ico); height:var(--tgf-ico); display:inline-flex; }
    .tgf-btn .ico svg{ width:100%; height:100%; display:block; }

    @media (max-width: 1200px){
      .tgf-form{ flex-wrap:wrap; row-gap:10px; }
      .tgf-actions{ margin-left:auto; }
    }
  `;
  document.head.appendChild(style);
}

// ===== utilitários de datas/normalização (coerentes com a página) =====
const _pad = (n)=>String(n).padStart(2,"0");
function toISO(d){ return `${d.getFullYear()}-${_pad(d.getMonth()+1)}-${_pad(d.getDate())}`; }
function today(){ const d=new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d,n){ const r=new Date(d); r.setDate(r.getDate()+n); return r; }

function toISOfromAny(x){
  if (!x) return "";
  if (typeof x === "string") return x;                 // já “YYYY-MM-DD”
  if (x && x.seconds){                                  // Firestore Timestamp
    const d = new Date(x.seconds*1000);
    return toISO(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
  }
  const d = new Date(x);
  return isNaN(d) ? "" : toISO(d);
}

const _norm = s => (s||"").toString().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[_\s]+/g,"").toLowerCase();
function _canonStatus(raw){
  const n = _norm(raw);
  if(!n) return "";
  if(["aberta","aberto","afazer","todo","open","nova","pendente","backlog"].includes(n)) return "iniciada";
  if(["emandamento","emprogresso","inprogress","doing","andamento","progresso"].includes(n)) return "em progresso";
  if(["concluida","concluido","finalizada","finalizado","done","completed","fechada","fechado"].includes(n)) return "concluída";
  if(["naorealizada","naorealizado","cancelada","cancelado","notdone","canceled","nrealizada"].includes(n)) return "não realizada";
  return raw || "";
}

// ============================ Componente ============================
export function GlobalFiltersBar(rootEl) {
  if (!rootEl) return;
  injectStylesOnce();

  const wrap = document.createElement("div");
  wrap.className = "tgf-wrap";
  wrap.innerHTML = `
    <form class="tgf-form" id="taskora-global-filters" autocomplete="off">
      <div class="tgf-filters-group">
        <div class="tgf-field">
          <label class="tgf-label" for="f-status">Status</label>
          <select id="f-status" class="tgf-select tgf-input tgf-w-status">
            <option value="all">Todos</option>
            <option value="iniciada">Iniciada</option>
            <option value="em progresso">Em progresso</option>
            <option value="concluída">Concluída</option>
            <option value="não realizada">Não realizada</option>
          </select>
        </div>

        <div class="tgf-field">
          <label class="tgf-label" for="f-client">Cliente</label>
          <select id="f-client" class="tgf-select tgf-input tgf-w-client">
            <option value="all">Todos</option>
          </select>
        </div>

        <div class="tgf-field">
          <label class="tgf-label" for="f-owner">Responsável</label>
          <select id="f-owner" class="tgf-select tgf-input tgf-w-owner">
            <option value="all">Todos</option>
          </select>
        </div>

        <div class="tgf-field">
          <label class="tgf-label" for="f-date-from">Data inicial</label>
          <input id="f-date-from" type="date" class="tgf-input tgf-w-date" inputmode="numeric" pattern="\\d{4}-\\d{2}-\\d{2}" />
        </div>

        <div class="tgf-field">
          <label class="tgf-label" for="f-date-to">Data final</label>
          <input id="f-date-to" type="date" class="tgf-input tgf-w-date" inputmode="numeric" pattern="\\d{4}-\\d{2}-\\d{2}" />
        </div>

        <div class="tgf-field">
           <label class="tgf-label" for="f-quick">Intervalo rápido</label>
           <select id="f-quick" class="tgf-select tgf-input tgf-w-quick">
             <option value="custom">Personalizado</option>
             <option value="today">Hoje</option>
             <option value="yesterday">Ontem</option>
             <option value="last7">Últimos 7 dias</option>
             <option value="last30" selected>Últimos 30 dias</option>
             <option value="thisMonth">Este mês</option>
             <option value="prevMonth">Mês anterior</option>
           </select>
         </div>

         <div class="tgf-field">
           <label class="tgf-label" style="opacity: 0;">Ações</label>
           <button type="button" class="tgf-btn tgf-btn--clear" id="f-clear" aria-label="Limpar filtros" title="Limpar filtros">
             <span class="ico" aria-hidden="true">
               <svg viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
             </span>
             <span class="lbl">Limpar</span>
           </button>
         </div>
       </div>
    </form>
  `;
  rootEl.innerHTML = "";
  rootEl.appendChild(wrap);

  const $ = (sel) => wrap.querySelector(sel);

  // Popular selects (clientes / responsáveis)
  (async () => {
    try{
      const clients = await listClients();
      const teamMembers = await listTeamMembers();
      const owners = teamMembers.map(member => member.name);
      const clientEl = $("#f-client");
      const ownerEl  = $("#f-owner");
      for(const c of clients){
        const opt = document.createElement("option");
        opt.value = c.value ?? c;
        opt.textContent = c.label ?? c;
        clientEl.appendChild(opt);
      }
      for(const o of owners){
        const opt = document.createElement("option");
        opt.value = o.value ?? o;
        opt.textContent = o.label ?? o;
        ownerEl.appendChild(opt);
      }
    }catch(e){
      console.error("[Taskora] Erro ao popular selects de filtros:", e);
    }
  })();

  // Auto-aplicação (sem botão Aplicar)
  let _applyTimer = null;
  function scheduleApply() {
    clearTimeout(_applyTimer);
    _applyTimer = setTimeout(() => {
      const from = $("#f-date-from").value || "";
      const to   = $("#f-date-to").value   || "";

      // IMPORTANTE: publicamos AMBOS os pares para máxima compatibilidade entre telas.
      TaskoraFilters.set({
        status: $("#f-status").value || "all",
        client: $("#f-client").value || "all",
        owner:  $("#f-owner").value  || "all",

        // nomes usados em Tasks e exportações:
        dateFrom: from,
        dateTo:   to,
        // sinônimos usados por outros consumidores (ex.: versões antigas de Calendário/Repo):
        startDate: from,
        endDate:   to,

        quick: $("#f-quick").value || "custom"
      });
      TaskoraFilters.apply();
    }, 180);
  }
  ["#f-status","#f-client","#f-owner","#f-date-from","#f-date-to","#f-quick"].forEach(sel=>{
    const node = $(sel);
    if(!node) return;
    node.addEventListener("change", scheduleApply);
  });

  // Intervalos rápidos
  $("#f-quick").addEventListener("change", () => {
    const v = $("#f-quick").value;
    if (v === "today") {
      setDates(today(), today());
    } else if (v === "yesterday") {
      const y = addDays(today(), -1);
      setDates(y, y);
    } else if (v === "last7") {
      setDates(addDays(today(), -6), today());
    } else if (v === "last30") {
      setDates(addDays(today(), -29), today());
    } else if (v === "thisMonth") {
      const d = new Date();
      const from = new Date(d.getFullYear(), d.getMonth(), 1);
      const to   = new Date(d.getFullYear(), d.getMonth()+1, 0);
      setDates(from, to);
    } else if (v === "prevMonth") {
      const d = new Date();
      const from = new Date(d.getFullYear(), d.getMonth()-1, 1);
      const to   = new Date(d.getFullYear(), d.getMonth(), 0);
      setDates(from, to);
    }
    scheduleApply();
  });

  // Limpar
  $("#f-clear").addEventListener("click", () => {
    TaskoraFilters.clear();
    setFromState(TaskoraFilters.get());
    TaskoraFilters.apply();
  });

  // ===================== EXPORTAÇÃO (CSV/PDF) =====================
  // Busca alinhada com a página: tenta createdAt desc (PREFETCH alto) e cai para simples; filtro em memória.
  async function _fetchTasksRaw(max = 5000) {
    try{
      const q = query(collection(db,"tasks"), orderBy("createdAt","desc"), limit(max));
      const snap = await getDocs(q);
      return snap.docs.map(d=>({ id:d.id, ...d.data() }));
    }catch(e){
      console.warn("[Export] Falha createdAt desc; fallback simples.", e);
      const snap = await getDocs(collection(db,"tasks"));
      return snap.docs.map(d=>({ id:d.id, ...d.data() }));
    }
  }

  function _applyCurrentFilters(rows){
    const f = TaskoraFilters.get ? TaskoraFilters.get() : {};
    // Compatibilidade: aceita dateFrom/dateTo OU startDate/endDate
    const df = f.dateFrom || f.startDate || "";
    const dt = f.dateTo   || f.endDate   || "";

    const inRange = (docDate) => {
      const dd = (docDate || "");
      if(df && dd < df) return false;
      if(dt && dd > dt) return false;
      return true;
    };
    return rows.filter(r =>
      (!f.status || f.status==="all" || _norm(_canonStatus(r.status))===_norm(f.status)) &&
      (!f.client || f.client==="all" || r.client===f.client) &&
      (!f.owner  || f.owner==="all"  || r.owner===f.owner) &&
      inRange(r.date || r.dueDate || toISOfromAny(r.createdAt))
    );
  }

  async function fetchTasksForExport() {
    const raw = await _fetchTasksRaw();
    return _applyCurrentFilters(raw);
  }

  function formatCSVCell(value) {
    const v = (value ?? "").toString().replace(/"/g, '""').replace(/\r?\n/g, " ");
    return `"${v}"`;
  }
  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  async function exportCSV() {
    const rows = await fetchTasksForExport();
    const headers = ["Status","Cliente","Tarefa","Responsável","Início","Limite","Horas"];
    const sep = ";";
    const lines = [ headers.join(sep) ];
    for (const r of rows) {
      const start = formatToBrazilian(r.date || r.createdAt);
      const due   = formatToBrazilian(r.dueDate) || "";
      const hours = (typeof r.hours === "number" && Number.isFinite(r.hours)) ? String(r.hours) : "";
      lines.push([
        formatCSVCell(r.status ?? ""),
        formatCSVCell(r.client ?? ""),
        formatCSVCell(r.description ?? ""),
        formatCSVCell(r.owner ?? ""),
        formatCSVCell(start),
        formatCSVCell(due),
        formatCSVCell(hours)
      ].join(sep));
    }
    const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
    downloadBlob(`tasks_${stamp}.csv`, blob);
  }

  function escapeHtml(s){
    return String(s ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  function buildPrintHTML(rows){
    const now = new Date();
    const pad = (n)=>String(n).padStart(2,"0");
    const when = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const tableRows = rows.map(r=>{
      const start = formatToBrazilian(r.date || r.createdAt);
      const due   = formatToBrazilian(r.dueDate) || "";
      const hours = (typeof r.hours === "number" && Number.isFinite(r.hours)) ? r.hours : "";
      return `
        <tr>
          <td>${escapeHtml(r.status || "")}</td>
          <td>${escapeHtml(r.client || "")}</td>
          <td>${escapeHtml(r.description || "")}</td>
          <td>${escapeHtml(r.owner || "")}</td>
          <td>${escapeHtml(start)}</td>
          <td>${escapeHtml(due)}</td>
          <td style="text-align:right">${escapeHtml(String(hours))}</td>
        </tr>`;
    }).join("");

    return `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Tasks - Export PDF</title>
<style>
  :root{
    --terracota: ${BRAND.terracota};
    --green: ${BRAND.green};
    --paper-bg: #ffffff;
    --ink: #1f2937;
    --muted: #6b7280;
  }
  @media print {
    @page { size: A4 landscape; margin: 14mm; }
    .no-print { display: none !important; }
  }
  html,body{ margin:0; padding:0; background:var(--paper-bg); color:var(--ink); font:12px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; }
  header{ display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--terracota); padding-bottom:8px; margin-bottom:12px; }
  h1{ font-size:16px; margin:0; color:var(--terracota) }
  .meta{ color:var(--muted); font-weight:600 }
  table{ width:100%; border-collapse:collapse; }
  th, td{ border:1px solid #e5e7eb; padding:6px 8px; vertical-align:top; }
  th{ text-align:left; background:#fafafa; font-weight:800 }
  td:last-child{ text-align:right }
  footer{ margin-top:10px; color:var(--muted); font-size:11px }
  .btn-print{ background:var(--green); color:#fff; border:none; border-radius:8px; padding:6px 10px; font-weight:800; cursor:pointer }
</style>
</head>
<body>
  <header>
    <div>
      <h1>Relatório de Tarefas</h1>
      <div class="meta">Gerado em ${when}</div>
    </div>
    <button class="btn-print no-print" onclick="window.print()">Imprimir / PDF</button>
  </header>
  <table>
    <thead>
      <tr>
        <th>Status</th>
        <th>Cliente</th>
        <th>Tarefa</th>
        <th>Responsável</th>
        <th>Início</th>
        <th>Limite</th>
        <th>Horas</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows || `<tr><td colspan="7" style="text-align:center;color:#6b7280">Sem registros para os filtros atuais.</td></tr>`}
    </tbody>
  </table>
  <footer>Powered by Taskora</footer>
  <script>setTimeout(()=>{ try{ window.print() }catch(e){} }, 300);</script>
</body>
</html>`;
  }

  async function exportPDF() {
    const rows = await fetchTasksForExport();
    const html = buildPrintHTML(rows);
    const w = window.open("", "_blank", "noopener,noreferrer");
    if (!w) {
      alert("Não foi possível abrir a janela de impressão. Libere pop-ups para este site.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  // Botões de exportação foram movidos para o header da página

  // Estado inicial
  setFromState(TaskoraFilters.get());

  function setFromState(s){
    $("#f-status").value    = s.status || "all";
    $("#f-client").value    = s.client || "all";
    $("#f-owner").value     = s.owner || "all";
    // aceita ambos os nomes
    $("#f-date-from").value = s.dateFrom || s.startDate || "";
    $("#f-date-to").value   = s.dateTo   || s.endDate   || "";
    $("#f-quick").value     = s.quick || "custom";
  }
  function setDates(from,to){
    $("#f-date-from").value = toISO(from);
    $("#f-date-to").value   = toISO(to);
  }
}

export default { mount: GlobalFiltersBar };
