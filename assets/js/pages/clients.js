// assets/js/pages/clients.js
// Clients page - Gestão completa de clientes com orçamentos por plataforma
// Paleta: terracota #993908, verde #014029, off-white #F2EFEB

import { 
  listClients, 
  createClient, 
  updateClient, 
  deleteClient, 
  getClientsStats,
  getResponsibles,
  MARKETING_PLATFORMS,
  CLIENT_TIERS,
  CLIENT_STATUS,
  PAYMENT_METHODS
} from "../data/clientsRepo.js";

(function (global) {
  const PAGE_SIZE = 20;
  
  // ============================ Utils ============================
  const escapeHtml = str => String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
  
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return '—';
    }
  };
  
  const getTierColor = (tier) => {
    switch (tier) {
      case 'KEY_ACCOUNT': return { bg: '#FEF3C7', fg: '#92400E', bd: '#F59E0B' };
      case 'MID_TIER': return { bg: '#DBEAFE', fg: '#1E40AF', bd: '#3B82F6' };
      case 'LOW_TIER': return { bg: '#F3F4F6', fg: '#374151', bd: '#9CA3AF' };
      default: return { bg: '#F3F4F6', fg: '#374151', bd: '#9CA3AF' };
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'ATIVO': return { bg: '#D1FAE5', fg: '#065F46', bd: '#10B981' };
      case 'INATIVO': return { bg: '#FEE2E2', fg: '#991B1B', bd: '#EF4444' };
      case 'PROSPECT': return { bg: '#E0F2FE', fg: '#0C4A6E', bd: '#0EA5E9' };
      default: return { bg: '#F3F4F6', fg: '#374151', bd: '#9CA3AF' };
    }
  };
  
  // ============================ Página =============================
  function render() {
    const root = document.createElement("div");
    root.className = "clients-page";
    root.innerHTML = `
      <style>
        .clients-page { background: #F8F9FA; min-height: 100vh; font-size: 13px; color: #2F3B2F; display: flex; flex-direction: column; }
        
        /* Campo sticky com título, cards e filtros */
        .cl-sticky-section {
          position: sticky;
          top: 75px;
          z-index: 10;
          background: #F8F9FA;
          padding: 32px 32px 20px 32px;
          border-bottom: 2px solid #E4E7E4;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .cl-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
        
        .cl-stats-grid { margin-bottom: 20px; }
        
        .cl-toolbar { margin-bottom: 0; }
        
        /* Campo da listagem separado */
        .cl-content-section {
          flex: 1;
          padding: 0 32px 32px 32px;
          overflow: auto;
        }
         .cl-header h2 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #014029; text-transform: uppercase; font-family: system-ui, -apple-system, sans-serif }
         .cl-header-actions { display: flex; gap: 8px; align-items: center }
         .cl-header .btn { padding: 10px 20px; font-size: 13px; font-weight: 600; border-radius: 8px; background: #014029; color: #fff; border: none; cursor: pointer; transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px }
         .cl-header .btn:hover { background: #025a35; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(1,64,41,0.3) }
         .cl-header .btn-secondary { background: #993908; color: #fff; border: 1px solid #993908 }
         .cl-header .btn-secondary:hover { background: #7a2d06; box-shadow: 0 4px 12px rgba(153,57,8,0.3) }
         .cl-header .btn svg { width: 14px; height: 14px; flex-shrink: 0 }
        
        .cl-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px }
        .cl-stat-card { background: #fff; border: 1px solid #E4E7E4; border-radius: 10px; padding: 18px 16px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s ease }
        .cl-stat-card:hover { box-shadow: 0 3px 8px rgba(0,0,0,0.08); transform: translateY(-1px) }
        .cl-stat-number { font-size: 24px; font-weight: 700; color: #014029; margin-bottom: 6px; font-variant-numeric: tabular-nums; line-height: 1 }
        .cl-stat-label { font-size: 10px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.2 }
        @media (max-width: 768px) { .cl-stats-grid { grid-template-columns: repeat(2, 1fr) } }
        @media (max-width: 480px) { .cl-stats-grid { grid-template-columns: 1fr } }
        
        .cl-card { background: transparent; border: none; border-radius: 0; padding: 0; }
        .cl-toolbar { display: flex; align-items: center; gap: 12px; margin: 0 0 16px 0; flex-wrap: wrap }
        .cl-filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center }
        .cl-filter-group { display: flex; gap: 4px; align-items: center }
        .cl-filter-label { font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 4px }
        .cl-filter-select { background: #fff; border: 1px solid #E4E7E4; border-radius: 6px; padding: 4px 8px; font-size: 12px; cursor: pointer; transition: all 0.2s ease; min-width: 100px }
        .cl-filter-select:hover { background: #F7F9F7 }
        .cl-filter-select:focus { outline: none; border-color: #014029; box-shadow: 0 0 0 2px rgba(1,64,41,0.1) }
        .cl-budget-range { display: flex; gap: 4px; align-items: center }
        .cl-budget-input { width: 80px; padding: 4px 6px; border: 1px solid #E4E7E4; border-radius: 4px; font-size: 11px }
        .cl-search { flex: 1; min-width: 200px; max-width: 300px; padding: 8px 12px; border: 1px solid #E4E7E4; border-radius: 8px; font-size: 13px }
        .cl-clear-filters { 
          background: #993908; 
          border: 1px solid #993908; 
          border-radius: 6px; 
          padding: 4px 8px; 
          font-size: 11px; 
          cursor: pointer; 
          color: #fff; 
          transition: all 0.2s ease;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .cl-clear-filters:hover { 
          background: #7a2d06; 
          border-color: #7a2d06;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(153, 57, 8, 0.3);
        }
        
        .cl-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; table-layout: fixed }
        .cl-content-section { position: relative; overflow: auto; padding: 0 32px 32px 32px; }
        
        /* Cabeçalho da tabela dentro do sticky */
        .cl-table-header { 
          background: #FFFFFF; 
          border: 1px solid #E4E7E4;
          border-radius: 8px;
          padding: 0;
          margin: 16px 0 0 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .cl-header-row { display: flex; width: 100%; }
        .cl-header-cell { text-align: left; font-weight: 900; font-size: 12px; color: #334155; padding: 12px 10px; letter-spacing: 0.2px; background: #F8F9FA; }
        .cl-header-cell:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
        .cl-header-cell:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
        .cl-header-cell.col-name { width: 25%; }
        .cl-header-cell.col-tier { width: 12%; }
        .cl-header-cell.col-status { width: 10%; }
        .cl-header-cell.col-responsible { width: 15%; }
        .cl-header-cell.col-budget { width: 12%; }
        .cl-header-cell.col-platforms { width: 16%; }
        .cl-header-cell.col-actions { width: 10%; text-align: right; }
        .cl-row { box-shadow: 0 1px 1px rgba(0,0,0,0.03), 0 6px 16px rgba(0,0,0,0.03) }
        .cl-cell { background: #fff; border: 1px solid #EEE; padding: 10px 12px; vertical-align: middle; overflow: hidden }
        .cl-cell:first-child { border-top-left-radius: 10px; border-bottom-left-radius: 10px }
        .cl-cell:last-child { border-top-right-radius: 10px; border-bottom-right-radius: 10px }
        .cl-name { font-weight: 600; color: #1f2937 }
         .cl-name-clickable { cursor: pointer; transition: color 0.2s ease; }
         .cl-name-clickable:hover { color: #014029; text-decoration: underline; }
         .cl-email { color: #6b7280; font-size: 12px }
        .cl-chip { display: inline-block; padding: 3px 8px; border-radius: 999px; font-weight: 700; font-size: 10px; line-height: 1; border: 1px solid var(--bd); color: var(--fg); background: var(--bg); white-space: nowrap; letter-spacing: 0.2px }
        .cl-budget { font-weight: 600; color: #059669; font-variant-numeric: tabular-nums }
        .cl-platforms { display: flex; flex-wrap: wrap; gap: 2px }
        .cl-platform-tag { background: #F3F4F6; color: #374151; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500 }
        
        /* Flags de Status do Saldo */
        .balance-flag { 
          display: inline-flex; 
          align-items: center; 
          justify-content: center; 
          width: 16px; 
          height: 16px; 
          border-radius: 50%; 
          margin-left: 6px; 
          font-size: 10px; 
          font-weight: 700; 
          cursor: help; 
          transition: all 0.2s ease;
        }
        .balance-flag:hover { 
          transform: scale(1.1); 
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        .balance-flag.status-ok { 
          background: #10B981; 
          color: #fff; 
        }
        .balance-flag.status-low { 
          background: #F59E0B; 
          color: #fff; 
        }
        .balance-flag.status-depleted { 
          background: #EF4444; 
          color: #fff; 
        }
        
        .col-name { width: 25% }
        .col-tier { width: 12% }
        .col-status { width: 10% }
        .col-responsible { width: 15% }
        .col-budget { width: 12% }
        .col-platforms { width: 16% }
        .col-actions { width: 10%; text-align: right }
        
        .cl-actions { display: inline-flex; gap: 6px; justify-content: flex-end; width: 100% }
        .cl-iconbtn { --size: 26px; width: var(--size); height: var(--size); display: inline-flex; align-items: center; justify-content: center; border: 1px solid #E4E7E4; border-radius: 8px; background: #fff; cursor: pointer; transition: all 0.2s ease }
        .cl-iconbtn:hover { background: #F2EFEB }
        .cl-icon--edit { color: #014029 }
        .cl-icon--delete { color: #8A1C12 }
        .cl-iconbtn svg { width: 14px; height: 14px }
        
        .cl-empty { text-align: center; padding: 40px; color: #6b7280 }
        .cl-loading { text-align: center; padding: 40px; color: #6b7280 }
        
        @media (max-width: 900px) { 
          .cl-hide-sm { display: none } 
          .col-name { width: 35% }
          .col-tier { width: 15% }
          .col-status { width: 15% }
          .col-budget { width: 20% }
          .col-actions { width: 15% }
        }
      </style>
      
      <!-- Campo Sticky: Título + Cards + Filtros -->
      <div class="cl-sticky-section">
        <div class="cl-header">
          <h2>Clientes</h2>
          <div class="cl-header-actions">
            <button id="exportCsvBtn" class="btn btn-secondary" type="button">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
              CSV
            </button>
            <button id="exportPdfBtn" class="btn btn-secondary" type="button">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clip-rule="evenodd" />
              </svg>
              PDF
            </button>
            <button id="newClientBtn" class="btn" type="button">Novo Cliente</button>
          </div>
        </div>
        
        <div class="cl-stats-grid" id="stats-grid">
          <div class="cl-stat-card">
            <div class="cl-stat-number" id="stat-total">0</div>
            <div class="cl-stat-label">Total de Clientes</div>
          </div>
          <div class="cl-stat-card">
            <div class="cl-stat-number" id="stat-budget">R$ 0</div>
            <div class="cl-stat-label">Orçamento Total</div>
          </div>
          <div class="cl-stat-card">
            <div class="cl-stat-number" id="stat-key-accounts">0</div>
            <div class="cl-stat-label">Key Accounts</div>
          </div>
          <div class="cl-stat-card">
            <div class="cl-stat-number" id="stat-active">0</div>
            <div class="cl-stat-label">Ativos</div>
          </div>
        </div>
        
        <div class="cl-card">
           <div class="cl-toolbar">
             <div class="cl-filters">
               <div class="cl-filter-group">
                 <span class="cl-filter-label">Status:</span>
                 <select class="cl-filter-select" id="statusFilter">
                   <option value="all">Todos</option>
                   <option value="ATIVO">Ativos</option>
                   <option value="INATIVO">Inativos</option>
                   <option value="PROSPECT">Prospects</option>
                 </select>
               </div>
               
               <div class="cl-filter-group">
                 <span class="cl-filter-label">Tier:</span>
                 <select class="cl-filter-select" id="tierFilter">
                   <option value="all">Todos</option>
                   <option value="KEY_ACCOUNT">Key Account</option>
                   <option value="MID_TIER">Mid Tier</option>
                   <option value="LOW_TIER">Low Tier</option>
                 </select>
               </div>
               
               <div class="cl-filter-group">
                 <span class="cl-filter-label">Responsável:</span>
                 <select class="cl-filter-select" id="responsibleFilter">
                   <option value="all">Todos</option>
                 </select>
               </div>
               
               <div class="cl-filter-group">
                  <span class="cl-filter-label">Orçamento:</span>
                  <div class="cl-budget-range">
                    <input type="number" class="cl-budget-input" id="budgetMin" placeholder="Min" min="0">
                    <span style="color: #6B7280; font-size: 11px;">até</span>
                    <input type="number" class="cl-budget-input" id="budgetMax" placeholder="Max" min="0">
                  </div>
                </div>
                
                <div class="cl-filter-group">
                  <span class="cl-filter-label">Forma de Pagamento:</span>
                  <select class="cl-filter-select" id="paymentMethodFilter">
                    <option value="all">Todas</option>
                    <option value="BOLETO">Boleto</option>
                    <option value="PIX">PIX</option>
                    <option value="CREDIT_CARD">Cartão de Crédito</option>
                  </select>
                </div>
                
                <div class="cl-filter-group">
                  <span class="cl-filter-label">Presença Digital:</span>
                  <select class="cl-filter-select" id="digitalPresenceFilter">
                    <option value="all">Todos</option>
                    <option value="website">Com Website</option>
                    <option value="instagram">Com Instagram</option>
                    <option value="both">Website + Instagram</option>
                    <option value="none">Sem presença</option>
                  </select>
                </div>
                
                <button class="cl-clear-filters" id="clearFilters">Limpar</button>
             </div>
             <input type="text" class="cl-search" id="searchInput" placeholder="Buscar clientes...">
           </div>
         </div>
         
         <!-- Cabeçalho da Tabela dentro do Sticky -->
         <div class="cl-table-header">
           <div class="cl-header-row">
             <div class="cl-header-cell col-name">Cliente</div>
             <div class="cl-header-cell col-tier">Tier</div>
             <div class="cl-header-cell col-status">Status</div>
             <div class="cl-header-cell col-responsible cl-hide-sm">Responsável</div>
             <div class="cl-header-cell col-budget">Orçamento</div>
             <div class="cl-header-cell col-platforms cl-hide-sm">Plataformas</div>
             <div class="cl-header-cell col-actions">Ações</div>
           </div>
         </div>
        </div>
      
      <!-- Campo da Listagem Separado -->
      <div class="cl-content-section">
        <div id="table-wrap">
          <div class="cl-loading">Carregando clientes...</div>
        </div>
      </div>
    `;
    
    const elTableWrap = root.querySelector("#table-wrap");
      const elNewBtn = root.querySelector("#newClientBtn");
      const elExportCsvBtn = root.querySelector("#exportCsvBtn");
      const elExportPdfBtn = root.querySelector("#exportPdfBtn");
      const elSearchInput = root.querySelector("#searchInput");
     const elStatTotal = root.querySelector("#stat-total");
     const elStatBudget = root.querySelector("#stat-budget");
     const elStatKeyAccounts = root.querySelector("#stat-key-accounts");
     const elStatActive = root.querySelector("#stat-active");
     
     // Novos elementos de filtro
      const elStatusFilter = root.querySelector("#statusFilter");
      const elTierFilter = root.querySelector("#tierFilter");
      const elResponsibleFilter = root.querySelector("#responsibleFilter");
      const elBudgetMin = root.querySelector("#budgetMin");
      const elBudgetMax = root.querySelector("#budgetMax");
      const elPaymentMethodFilter = root.querySelector("#paymentMethodFilter");
      const elDigitalPresenceFilter = root.querySelector("#digitalPresenceFilter");
      const elClearFilters = root.querySelector("#clearFilters");
      
      let allClients = [];
      let currentFilters = { 
        status: 'all', 
        tier: 'all', 
        responsible: 'all', 
        budgetMin: '', 
        budgetMax: '', 
        paymentMethod: 'all',
        digitalPresence: 'all',
        search: '' 
      };
    
    // ============================ Renderização ============================
    function renderTable(clients) {
      if (!clients || clients.length === 0) {
        elTableWrap.innerHTML = `
          <div class="cl-empty">
            <p>Nenhum cliente encontrado.</p>
            <button class="btn" onclick="document.getElementById('newClientBtn').click()">Adicionar Primeiro Cliente</button>
          </div>
        `;
        return;
      }
      
      const rows = clients.map(client => {
        const tierStyle = getTierColor(client.tier);
        const statusStyle = getStatusColor(client.status);
        
        // Calcular status geral do saldo
        const balanceStatus = getOverallBalanceStatus(client);
        const balanceFlag = balanceStatus ? `<span class="cl-balance-flag ${balanceStatus.class}" title="${balanceStatus.tooltip}">${balanceStatus.icon}</span>` : '';
        
        const platformTags = (client.activePlatforms || []).slice(0, 3).map(platform => 
          `<span class="cl-platform-tag">${MARKETING_PLATFORMS[platform] || platform}</span>`
        ).join('');
        
        const moreCount = Math.max(0, (client.activePlatforms || []).length - 3);
        const morePlatforms = moreCount > 0 ? `<span class="cl-platform-tag">+${moreCount}</span>` : '';
        
        return `
          <tr class="cl-row">
            <td class="cl-cell col-name">
               <div class="cl-name-wrapper">
                 <div class="cl-name cl-name-clickable" data-client-id="${client.id}" title="Clique para ver detalhes">${escapeHtml(client.name)} ${balanceFlag}</div>
                 <div class="cl-email">${escapeHtml(client.email)}</div>
               </div>
             </td>
            <td class="cl-cell col-tier">
              <span class="cl-chip" style="--bg:${tierStyle.bg}; --fg:${tierStyle.fg}; --bd:${tierStyle.bd}">
                ${CLIENT_TIERS[client.tier] || client.tier}
              </span>
            </td>
            <td class="cl-cell col-status">
              <span class="cl-chip" style="--bg:${statusStyle.bg}; --fg:${statusStyle.fg}; --bd:${statusStyle.bd}">
                ${CLIENT_STATUS[client.status] || client.status}
              </span>
            </td>
            <td class="cl-cell col-responsible cl-hide-sm">${escapeHtml(client.responsible)}</td>
            <td class="cl-cell col-budget">
              <span class="cl-budget">${formatCurrency(client.totalBudget)}</span>
            </td>
            <td class="cl-cell col-platforms cl-hide-sm">
              <div class="cl-platforms">${platformTags}${morePlatforms}</div>
            </td>
            <td class="cl-cell col-actions">
              <div class="cl-actions">
                <button class="cl-iconbtn cl-icon--edit" data-action="edit" data-id="${client.id}" title="Editar">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button class="cl-iconbtn cl-icon--delete" data-action="delete" data-id="${client.id}" title="Excluir">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0v3a1 1 0 11-2 0V9zm4 0a1 1 0 10-2 0v3a1 1 0 102 0V9z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
      
      elTableWrap.innerHTML = `
        <table class="cl-table">
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    }
    
    function updateStats(clients) {
      const stats = {
        total: clients.length,
        totalBudget: clients.reduce((sum, c) => sum + (c.totalBudget || 0), 0),
        keyAccounts: clients.filter(c => c.tier === 'KEY_ACCOUNT').length,
        active: clients.filter(c => c.status === 'ATIVO').length
      };
      
      elStatTotal.textContent = stats.total;
      elStatBudget.textContent = formatCurrency(stats.totalBudget);
      elStatKeyAccounts.textContent = stats.keyAccounts;
      elStatActive.textContent = stats.active;
    }
    
    function filterClients() {
       let filtered = [...allClients];
       
       // Filtro por status
       if (currentFilters.status !== 'all') {
         filtered = filtered.filter(c => c.status === currentFilters.status);
       }
       
       // Filtro por tier
       if (currentFilters.tier !== 'all') {
         filtered = filtered.filter(c => c.tier === currentFilters.tier);
       }
       
       // Filtro por responsável
       if (currentFilters.responsible !== 'all') {
         filtered = filtered.filter(c => c.responsible === currentFilters.responsible);
       }
       
       // Filtro por faixa de orçamento
        if (currentFilters.budgetMin !== '' || currentFilters.budgetMax !== '') {
          const minBudget = parseFloat(currentFilters.budgetMin) || 0;
          const maxBudget = parseFloat(currentFilters.budgetMax) || Infinity;
          
          filtered = filtered.filter(c => {
            const budget = c.totalBudget || 0;
            return budget >= minBudget && budget <= maxBudget;
          });
        }
        
        // Filtro por forma de pagamento
        if (currentFilters.paymentMethod !== 'all') {
          filtered = filtered.filter(c => {
            return c.paymentMethod === currentFilters.paymentMethod;
          });
        }
        
        // Filtro por presença digital
        if (currentFilters.digitalPresence !== 'all') {
          filtered = filtered.filter(c => {
            const hasWebsite = !!(c.website && c.website.trim());
            const hasInstagram = !!(c.instagram && c.instagram.trim());
            
            switch (currentFilters.digitalPresence) {
              case 'website': return hasWebsite;
              case 'instagram': return hasInstagram;
              case 'both': return hasWebsite && hasInstagram;
              case 'none': return !hasWebsite && !hasInstagram;
              default: return true;
            }
          });
        }
        
        // Filtro por busca
       if (currentFilters.search) {
         const search = currentFilters.search.toLowerCase();
         filtered = filtered.filter(c => 
           c.name.toLowerCase().includes(search) ||
           c.email.toLowerCase().includes(search) ||
           c.responsible.toLowerCase().includes(search) ||
           c.website.toLowerCase().includes(search) ||
           c.instagram.toLowerCase().includes(search)
         );
       }
       
       renderTable(filtered);
       updateStats(filtered);
     }
    
    // ============================ Eventos ============================
     async function populateResponsibleFilter() {
       try {
         // Importar função para buscar membros do Team
         const { listTeamMembers } = await import('../data/metaRepo.js');
         const teamMembers = await listTeamMembers();
         const responsibles = teamMembers.map(member => member.name).sort();
         
         // Limpar opções existentes (exceto "Todos")
         elResponsibleFilter.innerHTML = '<option value="all">Todos</option>';
         
         // Adicionar membros do Team
         responsibles.forEach(responsible => {
           const option = document.createElement('option');
           option.value = responsible;
           option.textContent = responsible;
           elResponsibleFilter.appendChild(option);
         });
         
         console.log(`[Clients] ${responsibles.length} responsáveis carregados do Team:`, responsibles);
         
       } catch (error) {
         console.error('[Clients] Erro ao carregar responsáveis do Team:', error);
         
         // Fallback: usar responsáveis dos clientes existentes
         const responsibles = [...new Set(allClients.map(c => c.responsible).filter(r => r))].sort();
         
         elResponsibleFilter.innerHTML = '<option value="all">Todos</option>';
         responsibles.forEach(responsible => {
           const option = document.createElement('option');
           option.value = responsible;
           option.textContent = responsible;
           elResponsibleFilter.appendChild(option);
         });
         
         console.warn('[Clients] Usando fallback - responsáveis dos clientes existentes');
       }
      }
     
     async function loadClients() {
       try {
         elTableWrap.innerHTML = '<div class="cl-loading">Carregando clientes...</div>';
         allClients = await listClients();
         await populateResponsibleFilter();
         filterClients();
       } catch (error) {
         console.error('Erro ao carregar clientes:', error);
         elTableWrap.innerHTML = '<div class="cl-empty">Erro ao carregar clientes. Tente novamente.</div>';
       }
      }
    
    // Event listeners para filtros
     elStatusFilter.addEventListener('change', (e) => {
       currentFilters.status = e.target.value;
       filterClients();
     });
     
     elTierFilter.addEventListener('change', (e) => {
       currentFilters.tier = e.target.value;
       filterClients();
     });
     
     elResponsibleFilter.addEventListener('change', (e) => {
       currentFilters.responsible = e.target.value;
       filterClients();
     });
     
     elBudgetMin.addEventListener('input', (e) => {
       currentFilters.budgetMin = e.target.value;
       filterClients();
     });
     
     elBudgetMax.addEventListener('input', (e) => {
        currentFilters.budgetMax = e.target.value;
        filterClients();
      });
      
      elPaymentMethodFilter.addEventListener('change', (e) => {
        currentFilters.paymentMethod = e.target.value;
        filterClients();
      });
      
      elDigitalPresenceFilter.addEventListener('change', (e) => {
        currentFilters.digitalPresence = e.target.value;
        filterClients();
      });
      
      // Limpar filtros
      elClearFilters.addEventListener('click', () => {
        currentFilters = { 
          status: 'all', 
          tier: 'all', 
          responsible: 'all', 
          budgetMin: '', 
          budgetMax: '', 
          paymentMethod: 'all',
          digitalPresence: 'all',
          search: '' 
        };
        
        // Resetar elementos do formulário
        elStatusFilter.value = 'all';
        elTierFilter.value = 'all';
        elResponsibleFilter.value = 'all';
        elBudgetMin.value = '';
        elBudgetMax.value = '';
        elPaymentMethodFilter.value = 'all';
        elDigitalPresenceFilter.value = 'all';
        elSearchInput.value = '';
        
        filterClients();
      });
    
    // Busca
    elSearchInput.addEventListener('input', (e) => {
      currentFilters.search = e.target.value;
      filterClients();
    });
    
    // Ações da tabela
     root.addEventListener('click', async (e) => {
       // Clique no nome do cliente para ver detalhes
       const nameClick = e.target.closest('.cl-name-clickable');
       if (nameClick) {
         const clientId = nameClick.getAttribute('data-client-id');
         const client = allClients.find(c => c.id === clientId);
         if (client) {
           await openClientDetailModal(client);
         }
         return;
       }
       
       // Ações de editar/excluir
       const btn = e.target.closest('[data-action]');
       if (!btn) return;
       
       const action = btn.getAttribute('data-action');
       const clientId = btn.getAttribute('data-id');
       
       if (action === 'edit') {
         const client = allClients.find(c => c.id === clientId);
         if (client) {
           await openClientModal(client);
         }
       } else if (action === 'delete') {
         if (confirm('Tem certeza que deseja excluir este cliente?')) {
           try {
             await deleteClient(clientId);
             await loadClients();
           } catch (error) {
             alert('Erro ao excluir cliente: ' + error.message);
           }
         }
       }
     });
    
    // Novo cliente
     elNewBtn.addEventListener('click', async () => {
       await openClientModal();
     });
     
     // Exportação CSV
     elExportCsvBtn.addEventListener('click', () => {
       exportToCSV();
     });
     
     // Exportação PDF
     elExportPdfBtn.addEventListener('click', () => {
       exportToPDF();
     });
     
     // Atualização em tempo real
     window.addEventListener('taskora:clients:changed', () => {
       loadClients();
     });
     
     // ============================ Exportação ============================
     function getFilteredClients() {
       let filtered = [...allClients];
       
       // Aplicar os mesmos filtros da interface
       if (currentFilters.status !== 'all') {
         filtered = filtered.filter(c => c.status === currentFilters.status);
       }
       if (currentFilters.tier !== 'all') {
         filtered = filtered.filter(c => c.tier === currentFilters.tier);
       }
       if (currentFilters.responsible !== 'all') {
         filtered = filtered.filter(c => c.responsible === currentFilters.responsible);
       }
       if (currentFilters.budgetMin !== '' || currentFilters.budgetMax !== '') {
         const minBudget = parseFloat(currentFilters.budgetMin) || 0;
         const maxBudget = parseFloat(currentFilters.budgetMax) || Infinity;
         filtered = filtered.filter(c => {
           const budget = c.totalBudget || 0;
           return budget >= minBudget && budget <= maxBudget;
         });
       }
       if (currentFilters.paymentMethod !== 'all') {
         filtered = filtered.filter(c => {
           return c.paymentMethod === currentFilters.paymentMethod;
         });
       }
       if (currentFilters.digitalPresence !== 'all') {
         filtered = filtered.filter(c => {
           const hasWebsite = !!(c.website && c.website.trim());
           const hasInstagram = !!(c.instagram && c.instagram.trim());
           switch (currentFilters.digitalPresence) {
             case 'website': return hasWebsite;
             case 'instagram': return hasInstagram;
             case 'both': return hasWebsite && hasInstagram;
             case 'none': return !hasWebsite && !hasInstagram;
             default: return true;
           }
         });
       }
       if (currentFilters.search) {
         const search = currentFilters.search.toLowerCase();
         filtered = filtered.filter(c => 
           c.name.toLowerCase().includes(search) ||
           c.email.toLowerCase().includes(search) ||
           c.responsible.toLowerCase().includes(search) ||
           c.website.toLowerCase().includes(search) ||
           c.instagram.toLowerCase().includes(search)
         );
       }
       
       return filtered;
     }
     
     function exportToCSV() {
       const clients = getFilteredClients();
       
       if (clients.length === 0) {
         alert('Nenhum cliente encontrado para exportar.');
         return;
       }
       
       // Cabeçalhos CSV
       const headers = [
         'Nome',
         'Email', 
         'Telefone',
         'Website',
         'Instagram',
         'Tier',
         'Status',
         'Responsável',
         'Data de Entrada',
         'Orçamento Total (BRL)',
         'Meta Ads (BRL)',
         'Google Ads (BRL)',
         'TikTok Ads (BRL)',
         'LinkedIn Ads (BRL)',
         'YouTube Ads (BRL)',
         'Plataformas Ativas',
         'Links de Documentos',
         'Notas'
       ];
       
       // Dados CSV
       const rows = clients.map(client => [
         client.name || '',
         client.email || '',
         client.phone || '',
         client.website || '',
         client.instagram || '',
         CLIENT_TIERS[client.tier] || client.tier || '',
         CLIENT_STATUS[client.status] || client.status || '',
         client.responsible || '',
         formatDate(client.entryDate),
         formatCurrency(client.totalBudget || 0).replace('R$\u00A0', ''),
         (client.budgets?.META_ADS || 0).toFixed(2),
         (client.budgets?.GOOGLE_ADS || 0).toFixed(2),
         (client.budgets?.TIKTOK_ADS || 0).toFixed(2),
         (client.budgets?.LINKEDIN_ADS || 0).toFixed(2),
         (client.budgets?.YOUTUBE_ADS || 0).toFixed(2),
         (client.activePlatforms || []).map(p => MARKETING_PLATFORMS[p] || p).join('; '),
         (client.documentLinks || '').replace(/\n/g, '; '),
         (client.notes || '').replace(/\n/g, '; ')
       ]);
       
       // Criar CSV
       const csvContent = [headers, ...rows]
         .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
         .join('\n');
       
       // Download
       const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
       const link = document.createElement('a');
       const url = URL.createObjectURL(blob);
       link.setAttribute('href', url);
       link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
       link.style.visibility = 'hidden';
       document.body.appendChild(link);
       link.click();
       document.body.removeChild(link);
     }
     
     function exportToPDF() {
       const clients = getFilteredClients();
       
       if (clients.length === 0) {
         alert('Nenhum cliente encontrado para exportar.');
         return;
       }
       
       const now = new Date().toLocaleString('pt-BR');
       
       // Criar HTML para impressão
       const tableRows = clients.map(client => `
         <tr>
           <td>${escapeHtml(client.name)}</td>
           <td>${escapeHtml(client.email)}</td>
           <td>${escapeHtml(CLIENT_TIERS[client.tier] || client.tier)}</td>
           <td>${escapeHtml(CLIENT_STATUS[client.status] || client.status)}</td>
           <td>${escapeHtml(client.responsible)}</td>
           <td>${formatCurrency(client.totalBudget || 0)}</td>
           <td>${(client.activePlatforms || []).length}</td>
         </tr>
       `).join('');
       
       const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Relatório de Clientes - Taskora</title>
  <style>
    @media print { .no-print { display: none !important; } }
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 20px; color: #333; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #014029; padding-bottom: 8px; margin-bottom: 20px; }
    h1 { font-size: 18px; margin: 0; color: #014029; font-weight: 800; }
    .meta { color: #6b7280; font-weight: 600; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e5e7eb; padding: 6px 8px; vertical-align: top; text-align: left; }
    th { background: #f9fafb; font-weight: 700; color: #374151; }
    .btn-print { background: #014029; color: #fff; border: none; border-radius: 6px; padding: 8px 12px; font-weight: 600; cursor: pointer; font-size: 12px; }
    .summary { margin-bottom: 16px; padding: 12px; background: #f9fafb; border-radius: 6px; font-size: 12px; }
    .summary strong { color: #014029; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Relatório de Clientes</h1>
      <div class="meta">Gerado em ${now}</div>
    </div>
    <button class="btn-print no-print" onclick="window.print()">Imprimir / Salvar PDF</button>
  </div>
  
  <div class="summary">
    <strong>Total de clientes:</strong> ${clients.length} | 
    <strong>Orçamento total:</strong> ${formatCurrency(clients.reduce((sum, c) => sum + (c.totalBudget || 0), 0))} | 
    <strong>Key Accounts:</strong> ${clients.filter(c => c.tier === 'KEY_ACCOUNT').length}
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Cliente</th>
        <th>Email</th>
        <th>Tier</th>
        <th>Status</th>
        <th>Responsável</th>
        <th>Orçamento</th>
        <th>Plataformas</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows || '<tr><td colspan="7" style="text-align:center;color:#6b7280">Nenhum cliente encontrado.</td></tr>'}
    </tbody>
  </table>
  
  <div style="margin-top: 20px; font-size: 10px; color: #6b7280; text-align: center;">
    Powered by Taskora - Relatório gerado automaticamente
  </div>
  
  <script>
    setTimeout(() => {
      try { window.print(); } catch(e) {}
    }, 500);
  </script>
</body>
</html>`;
       
       // Abrir em nova janela para impressão
       const printWindow = window.open('', '_blank', 'width=800,height=600');
       if (!printWindow) {
         alert('Não foi possível abrir a janela de impressão. Verifique se pop-ups estão habilitados.');
         return;
       }
       
       printWindow.document.open();
       printWindow.document.write(html);
       printWindow.document.close();
     }
    
    // ============================ Modal de Detalhes ============================
     async function openClientDetailModal(client) {
       const modalId = 'client-detail-modal-' + Date.now();
       
       // Criar backdrop do modal
       const backdrop = document.createElement('div');
       backdrop.className = 'cl-modal-backdrop';
       backdrop.innerHTML = `
         <style>
            .cl-modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
            .cl-detail-modal { background: #fff; border-radius: 12px; width: min(90vw, 700px); max-height: 90vh; overflow: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
           .cl-detail-header { padding: 20px 24px 16px; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center; }
           .cl-detail-title { font-size: 20px; font-weight: 700; color: #014029; margin: 0; }
           .cl-detail-actions { display: flex; gap: 8px; }
           .cl-detail-body { padding: 24px; }
           .cl-detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
           .cl-detail-section { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; }
           .cl-detail-section-title { font-size: 14px; font-weight: 600; color: #374151; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px; }
           .cl-detail-item { margin-bottom: 12px; }
           .cl-detail-label { font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
           .cl-detail-value { font-size: 14px; color: #374151; font-weight: 500; }
           .cl-detail-value.empty { color: #9CA3AF; font-style: italic; }
           .cl-detail-platforms { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
           .cl-detail-platform { background: #E0F2FE; color: #0C4A6E; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
           .cl-detail-budgets { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px; }
           .cl-detail-budget { background: #fff; border: 1px solid #E5E7EB; border-radius: 6px; padding: 8px; text-align: center; }
           .cl-detail-budget-platform { font-size: 10px; color: #6B7280; font-weight: 500; }
           .cl-detail-budget-value { font-size: 13px; color: #059669; font-weight: 600; margin-top: 2px; }
           .cl-detail-footer { padding: 16px 24px; border-top: 1px solid #E5E7EB; display: flex; gap: 12px; justify-content: space-between; }
           .cl-detail-footer-left { display: flex; gap: 8px; }
            .cl-btn { padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 0.5px; border: none; display: inline-flex; align-items: center; gap: 6px; }
            .cl-btn-outline { background: #993908; color: #fff; }
            .cl-btn-outline:hover { background: #7a2d06; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(153,57,8,0.3); }
            .cl-btn-primary { background: #014029; color: #fff; }
            .cl-btn-primary:hover { background: #025a35; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(1,64,41,0.3); }
            .cl-btn-history { background: #0EA5E9; color: #fff; }
             .cl-btn-history:hover { background: #0284C7; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(14,165,233,0.3); }
           .cl-single-column { grid-column: span 2; }
           
           /* Estilos para Controle de Saldo */
           .cl-balance-platforms { display: flex; flex-direction: column; gap: 12px; }
           .cl-balance-platform { background: #fff; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; }
           .cl-balance-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
           .cl-balance-platform-name { font-size: 13px; font-weight: 600; color: #374151; }
           .cl-balance-status { font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; }
           .cl-balance-status.good { background: #D1FAE5; color: #065F46; }
           .cl-balance-status.low { background: #FEF3C7; color: #92400E; }
           .cl-balance-status.depleted { background: #FEE2E2; color: #991B1B; }
           .cl-balance-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
           .cl-balance-item { display: flex; flex-direction: column; }
           .cl-balance-label { font-size: 10px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
           .cl-balance-value { font-size: 12px; color: #374151; font-weight: 500; }
           .cl-balance-value.negative { color: #DC2626; font-weight: 600; }
           
           /* Estilos para formulário de controle de saldo */
           .cl-balance-form-grid {
             display: grid;
             grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
             gap: 20px;
             margin-top: 12px;
           }
           
           .cl-balance-form-platform {
             background: #f8fafc;
             border: 1px solid #e2e8f0;
             border-radius: 8px;
             padding: 16px;
           }
           
           .cl-balance-form-platform-title {
             font-size: 13px;
             font-weight: 600;
             color: #374151;
             margin: 0 0 12px 0;
             padding-bottom: 8px;
             border-bottom: 1px solid #e2e8f0;
           }
           
           .cl-balance-form-fields {
             display: grid;
             grid-template-columns: 1fr 1fr;
             gap: 12px;
           }
           
           .cl-balance-form-fields .cl-form-group {
             margin: 0;
           }
           
           .cl-balance-form-fields .cl-form-label {
             font-size: 11px;
             font-weight: 500;
             color: #6b7280;
             margin-bottom: 4px;
             display: block;
           }
           
           .cl-balance-form-fields .cl-form-input {
             width: 100%;
             padding: 6px 8px;
             border: 1px solid #d1d5db;
             border-radius: 4px;
             font-size: 12px;
             background: white;
           }
           
           .cl-balance-form-fields .cl-form-input:focus {
             outline: none;
             border-color: #3b82f6;
             box-shadow: 0 0 0 1px #3b82f6;
           }
         </style>
         
         <div class="cl-detail-modal" id="${modalId}">
           <div class="cl-detail-header">
             <h3 class="cl-detail-title">${escapeHtml(client.name)}</h3>
             <div class="cl-detail-actions">
               <span class="cl-chip" style="--bg:${getTierColor(client.tier).bg}; --fg:${getTierColor(client.tier).fg}; --bd:${getTierColor(client.tier).bd}">
                 ${CLIENT_TIERS[client.tier] || client.tier}
               </span>
               <span class="cl-chip" style="--bg:${getStatusColor(client.status).bg}; --fg:${getStatusColor(client.status).fg}; --bd:${getStatusColor(client.status).bd}">
                 ${CLIENT_STATUS[client.status] || client.status}
               </span>
             </div>
           </div>
           
           <div class="cl-detail-body">
             <div class="cl-detail-grid">
               <!-- Metas e Performance -->
               <div class="cl-detail-section">
                 <h4 class="cl-detail-section-title">📊 Metas & Performance</h4>
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Meta de Faturamento Mensal</div>
                   <div class="cl-detail-value ${!client.billingGoal ? 'empty' : ''}">
                     ${client.billingGoal ? `R$ ${parseFloat(client.billingGoal).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'Não definida'}
                   </div>
                 </div>
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Faturamento Real</div>
                   <div class="cl-detail-value ${!client.realBilling ? 'empty' : ''}">
                     ${client.realBilling ? `R$ ${parseFloat(client.realBilling).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'Não informado'}
                   </div>
                 </div>
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Meta de Leads</div>
                   <div class="cl-detail-value ${!client.monthlyLeads ? 'empty' : ''}">${client.monthlyLeads || 'Não informado'}</div>
                 </div>
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Número Real de Leads</div>
                   <div class="cl-detail-value ${!client.realLeads ? 'empty' : ''}">${client.realLeads || 'Não informado'}</div>
                 </div>
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Taxa de Conversão</div>
                   <div class="cl-detail-value ${!client.conversionRate ? 'empty' : ''}">
                     ${client.conversionRate ? `${client.conversionRate}%` : 'Não informada'}
                   </div>
                 </div>
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">ROI Calculado</div>
                   <div class="cl-detail-value ${!client.realBilling || !client.budgets ? 'empty' : ''}">
                     ${(() => {
                       if (!client.realBilling || !client.budgets) return 'Não calculado';
                       const roi = calculateROI(client.realBilling, client.budgets);
                       return roi > 0 ? `${roi.toFixed(2)}` : 'Não calculado';
                     })()}
                   </div>
                 </div>
               </div>
               
               <!-- Controle de Saldo -->
               <div class="cl-detail-section">
                 <h4 class="cl-detail-section-title">💰 Controle de Saldo</h4>
                 ${client.balanceControl ? `
                   <div class="cl-balance-platforms">
                     ${['metaAds', 'googleAds', 'tiktokAds', 'pinterestAds'].map(platform => {
                       const balance = client.balanceControl[platform];
                       if (!balance || (!balance.lastDeposit && !balance.dailyBudget)) return '';
                       
                       const daysSinceDeposit = balance.depositDate ? 
                         Math.floor((new Date() - new Date(balance.depositDate)) / (1000 * 60 * 60 * 24)) : 0;
                       const estimatedBalance = balance.lastDeposit - (daysSinceDeposit * balance.dailyBudget);
                       
                       const platformNames = {
                         metaAds: 'Meta Ads (Facebook/Instagram)',
                         googleAds: 'Google Ads',
                         tiktokAds: 'TikTok Ads',
                         pinterestAds: 'Pinterest Ads'
                       };
                       
                       return `
                           <div class="cl-balance-platform">
                             <div class="cl-balance-header">
                               <span class="cl-balance-platform-name">${platformNames[platform]}</span>
                               <span class="cl-balance-status ${estimatedBalance <= 0 ? 'depleted' : estimatedBalance < 15.00 ? 'low' : 'good'}">
                                 ${estimatedBalance <= 0 ? '🔴 Esgotado' : estimatedBalance < 15.00 ? '🟡 Baixo' : '🟢 OK'}
                               </span>
                             </div>
                             <div class="cl-balance-details">
                               <div class="cl-balance-item">
                                 <span class="cl-balance-label">Último Depósito:</span>
                                 <span class="cl-balance-value">${formatCurrency(balance.lastDeposit)} em ${formatDate(balance.depositDate)}</span>
                               </div>
                               <div class="cl-balance-item">
                                 <span class="cl-balance-label">Orçamento Diário:</span>
                                 <span class="cl-balance-value">${formatCurrency(balance.dailyBudget)}</span>
                               </div>
                               <div class="cl-balance-item">
                                 <span class="cl-balance-label">Dias Corridos:</span>
                                 <span class="cl-balance-value">${daysSinceDeposit} dias</span>
                               </div>
                               <div class="cl-balance-item">
                                 <span class="cl-balance-label">Saldo Estimado:</span>
                                 <span class="cl-balance-value ${estimatedBalance <= 0 ? 'negative' : ''}">${formatCurrency(Math.max(0, estimatedBalance))}</span>
                               </div>
                               ${balance.realBalance !== undefined ? `
                                 <div class="cl-balance-item">
                                   <span class="cl-balance-label">Saldo Real:</span>
                                   <span class="cl-balance-value ${balance.realBalance <= 0 ? 'negative' : ''}">${formatCurrency(Math.max(0, balance.realBalance))}</span>
                                 </div>
                               ` : ''}
                           </div>
                         </div>
                       `;
                     }).filter(Boolean).join('')}
                   </div>
                 ` : `
                   <div class="cl-detail-item">
                     <div class="cl-detail-value empty">Nenhum controle de saldo configurado</div>
                   </div>
                 `}
               </div>
               
               <!-- Informações Básicas -->
               <div class="cl-detail-section">
                 <h4 class="cl-detail-section-title">Informações Básicas</h4>
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Email</div>
                   <div class="cl-detail-value ${!client.email ? 'empty' : ''}">${client.email || 'Não informado'}</div>
                 </div>
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Telefone</div>
                   <div class="cl-detail-value ${!client.phone ? 'empty' : ''}">${client.phone || 'Não informado'}</div>
                 </div>
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Website</div>
                   <div class="cl-detail-value ${!client.website ? 'empty' : ''}">
                     ${client.website ? `<a href="${client.website}" target="_blank" style="color: #014029;">${client.website}</a>` : 'Não informado'}
                   </div>
                 </div>
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Instagram</div>
                   <div class="cl-detail-value ${!client.instagram ? 'empty' : ''}">
                     ${client.instagram ? `<a href="https://instagram.com/${client.instagram.replace('@', '')}" target="_blank" style="color: #014029;">${client.instagram}</a>` : 'Não informado'}
                   </div>
                 </div>
               </div>
               
               <!-- Gestão -->
               <div class="cl-detail-section">
                 <h4 class="cl-detail-section-title">Gestão</h4>
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Responsável</div>
                   <div class="cl-detail-value">${escapeHtml(client.responsible)}</div>
                 </div>
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Forma de Pagamento</div>
                   <div class="cl-detail-value">${PAYMENT_METHODS[client.paymentMethod] || 'Boleto'}</div>
                 </div>
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Data de Entrada</div>
                   <div class="cl-detail-value ${!client.entryDate ? 'empty' : ''}">${formatDate(client.entryDate) || 'Não informado'}</div>
                 </div>
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Orçamento Total</div>
                   <div class="cl-detail-value" style="color: #059669; font-weight: 600;">${formatCurrency(client.totalBudget || 0)}</div>
                 </div>
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Plataformas Ativas</div>
                   <div class="cl-detail-platforms">
                     ${(client.activePlatforms || []).length > 0 
                       ? (client.activePlatforms || []).map(platform => 
                           `<span class="cl-detail-platform">${MARKETING_PLATFORMS[platform] || platform}</span>`
                         ).join('')
                       : '<span class="cl-detail-value empty">Nenhuma plataforma ativa</span>'
                     }
                   </div>
                 </div>
               </div>
               
               <!-- Orçamentos por Plataforma -->
               ${Object.keys(client.budgets || {}).length > 0 ? `
               <div class="cl-detail-section cl-single-column">
                 <h4 class="cl-detail-section-title">Orçamentos por Plataforma</h4>
                 <div class="cl-detail-budgets">
                   ${Object.entries(client.budgets || {}).map(([platform, amount]) => `
                     <div class="cl-detail-budget">
                       <div class="cl-detail-budget-platform">${MARKETING_PLATFORMS[platform] || platform}</div>
                       <div class="cl-detail-budget-value">${formatCurrency(amount)}</div>
                     </div>
                   `).join('')}
                 </div>
               </div>
               ` : ''}
               
               <!-- Links e Notas -->
               ${(client.documentLinks || client.notes) ? `
               <div class="cl-detail-section cl-single-column">
                 <h4 class="cl-detail-section-title">Documentos e Notas</h4>
                 ${client.documentLinks ? `
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Links de Documentos</div>
                   <div class="cl-detail-value" style="white-space: pre-line; font-size: 13px;">${escapeHtml(client.documentLinks)}</div>
                 </div>
                 ` : ''}
                 ${client.notes ? `
                 <div class="cl-detail-item">
                   <div class="cl-detail-label">Notas</div>
                   <div class="cl-detail-value" style="white-space: pre-line; font-size: 13px;">${escapeHtml(client.notes)}</div>
                 </div>
                 ` : ''}
               </div>
               ` : ''}
             </div>
           </div>
           
           <div class="cl-detail-footer">
             <div class="cl-detail-footer-left">
               <button type="button" class="cl-btn cl-btn-history" id="historyBtn" data-client-id="${client.id}">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                  </svg>
                  Histórico de Tarefas
                </button>
             </div>
             <div>
               <button type="button" class="cl-btn cl-btn-outline" onclick="this.closest('.cl-modal-backdrop').remove()">Fechar</button>
               <button type="button" class="cl-btn cl-btn-primary" id="edit-client-btn">Editar Cliente</button>
             </div>
           </div>
         </div>
       `;
       
       // Adicionar ao DOM
       document.body.appendChild(backdrop);
       
       // Popular select de responsáveis com membros do Team
       await populateClientResponsibleSelect();
       
       // Event listener para editar
        const editBtn = backdrop.querySelector('#edit-client-btn');
        editBtn.addEventListener('click', async () => {
          backdrop.remove();
          await openClientModal(client);
        });
        
        // Event listener para histórico
        const historyBtn = backdrop.querySelector('#historyBtn');
        historyBtn.addEventListener('click', () => {
          backdrop.remove();
          // Navegar para página de histórico com cliente pré-selecionado
          window.location.hash = '#/history';
          // Aguardar um pouco para a página carregar e então selecionar o cliente
          setTimeout(() => {
            const historyPage = document.querySelector('.history-page');
            if (historyPage) {
              const clientSelector = historyPage.querySelector('#clientSelector');
              if (clientSelector) {
                clientSelector.value = client.id;
                clientSelector.dispatchEvent(new Event('change'));
              }
            }
          }, 100);
        });
       
       // Fechar modal ao clicar no backdrop
       backdrop.addEventListener('click', (e) => {
         if (e.target === backdrop) {
           backdrop.remove();
         }
       });
     }
     
     // ============================ Modal ============================
     async function populateClientResponsibleSelect() {
       try {
         const { listTeamMembers } = await import('../data/metaRepo.js');
         const teamMembers = await listTeamMembers();
         const responsibles = teamMembers.map(member => member.name).sort();
         
         const selectElement = document.getElementById('client-responsible-select');
         if (selectElement) {
           // Limpar opções existentes (exceto a primeira)
           selectElement.innerHTML = '<option value="">Selecione um responsável...</option>';
           
           // Adicionar membros do Team
           responsibles.forEach(responsible => {
             const option = document.createElement('option');
             option.value = responsible;
             option.textContent = responsible;
             selectElement.appendChild(option);
           });
           
           console.log(`[Client Modal] ${responsibles.length} responsáveis carregados do Team`);
         }
         
       } catch (error) {
         console.error('[Client Modal] Erro ao carregar responsáveis do Team:', error);
       }
     }

     async function openClientModal(client = null) {
       const isEdit = !!client;
       const modalId = 'client-modal-' + Date.now();
       
       // Criar backdrop do modal
       const backdrop = document.createElement('div');
       backdrop.className = 'cl-modal-backdrop';
       backdrop.innerHTML = `
         <style>
           .cl-modal-backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
           .cl-modal { background: #fff; border-radius: 12px; width: min(90vw, 800px); max-height: 90vh; overflow: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
           .cl-modal-header { padding: 20px 24px 16px; border-bottom: 1px solid #E5E7EB; }
           .cl-modal-title { font-size: 18px; font-weight: 700; color: #014029; margin: 0; }
           .cl-modal-body { padding: 24px; }
           .cl-form-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
           .cl-form-group { display: flex; flex-direction: column; gap: 6px; }
           .cl-form-label { font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; }
           .cl-form-input, .cl-form-select, .cl-form-textarea { padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 14px; transition: border-color 0.2s; }
           .cl-form-input:focus, .cl-form-select:focus, .cl-form-textarea:focus { outline: none; border-color: #014029; box-shadow: 0 0 0 2px rgba(1,64,41,0.1); }
           .cl-form-textarea { resize: vertical; min-height: 80px; }
           .cl-budget-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
           .cl-budget-item { display: flex; flex-direction: column; gap: 4px; }
           .cl-budget-label { font-size: 11px; font-weight: 500; color: #6B7280; }
           .cl-budget-input { padding: 6px 8px; border: 1px solid #D1D5DB; border-radius: 4px; font-size: 13px; }
           .cl-platforms-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
           .cl-platform-checkbox { display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid #E5E7EB; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
           .cl-platform-checkbox:hover { background: #F9FAFB; }
           .cl-platform-checkbox input[type="checkbox"] { margin: 0; }
           .cl-platform-label { font-size: 12px; font-weight: 500; color: #374151; }
           .cl-modal-footer { padding: 16px 24px; border-top: 1px solid #E5E7EB; display: flex; gap: 12px; justify-content: flex-end; }
           .cl-btn { padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 0.5px; border: none; display: inline-flex; align-items: center; gap: 6px; }
            .cl-btn-primary { background: #014029; color: #fff; }
            .cl-btn-primary:hover { background: #025a35; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(1,64,41,0.3); }
            .cl-btn-secondary { background: #993908; color: #fff; }
            .cl-btn-secondary:hover { background: #7a2d06; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(153,57,8,0.3); }
           .col-span-2 { grid-column: span 2; }
           .col-span-3 { grid-column: span 3; }
           .col-span-4 { grid-column: span 4; }
           .col-span-6 { grid-column: span 6; }
           .col-span-12 { grid-column: span 12; }
         </style>
         
         <div class="cl-modal" id="${modalId}">
           <div class="cl-modal-header">
             <h3 class="cl-modal-title">${isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h3>
           </div>
           
           <div class="cl-modal-body">
             <form class="cl-form-grid" id="client-form">
               <!-- Informações Básicas -->
               <div class="cl-form-group col-span-6">
                 <label class="cl-form-label">Nome do Cliente *</label>
                 <input type="text" class="cl-form-input" name="name" required>
               </div>
               
               <div class="cl-form-group col-span-6">
                 <label class="cl-form-label">Email</label>
                 <input type="email" class="cl-form-input" name="email">
               </div>
               
               <div class="cl-form-group col-span-4">
                 <label class="cl-form-label">Telefone</label>
                 <input type="tel" class="cl-form-input" name="phone">
               </div>
               
               <div class="cl-form-group col-span-4">
                 <label class="cl-form-label">Website</label>
                 <input type="url" class="cl-form-input" name="website" placeholder="https://">
               </div>
               
               <div class="cl-form-group col-span-4">
                 <label class="cl-form-label">Instagram</label>
                 <input type="text" class="cl-form-input" name="instagram" placeholder="@usuario">
               </div>
               
               <!-- Classificação -->
               <div class="cl-form-group col-span-4">
                 <label class="cl-form-label">Tier *</label>
                 <select class="cl-form-select" name="tier" required>
                   <option value="">Selecione...</option>
                   <option value="KEY_ACCOUNT">Key Account</option>
                   <option value="MID_TIER">Mid Tier</option>
                   <option value="LOW_TIER">Low Tier</option>
                 </select>
               </div>
               
               <div class="cl-form-group col-span-4">
                 <label class="cl-form-label">Status *</label>
                 <select class="cl-form-select" name="status" required>
                   <option value="">Selecione...</option>
                   <option value="ATIVO">Ativo</option>
                   <option value="INATIVO">Inativo</option>
                   <option value="PROSPECT">Prospect</option>
                 </select>
               </div>
               
               <div class="cl-form-group col-span-4">
                 <label class="cl-form-label">Data de Entrada</label>
                 <input type="date" class="cl-form-input" name="entryDate">
               </div>
               
               <div class="cl-form-group col-span-12">
                 <label class="cl-form-label">Responsável *</label>
                 <select class="cl-form-select" name="responsible" id="client-responsible-select" required>
                   <option value="">Selecione um responsável...</option>
                 </select>
               </div>
               
               <div class="cl-form-group col-span-4">
                 <label class="cl-form-label">Forma de Pagamento</label>
                 <select class="cl-form-select" name="paymentMethod">
                   <option value="BOLETO">Boleto</option>
                   <option value="PIX">PIX</option>
                   <option value="CREDIT_CARD">Cartão de Crédito</option>
                 </select>
               </div>
               
               <!-- Metas e Performance -->
               <div class="col-span-12">
                 <h4 style="margin: 16px 0 12px 0; font-size: 14px; font-weight: 600; color: #374151;">📊 Metas & Performance</h4>
                 
                 <div class="cl-form-group col-span-3">
                   <label class="cl-form-label">Meta Faturamento Mensal</label>
                   <input type="number" class="cl-form-input" name="billingGoal" placeholder="0.00" step="0.01" min="0">
                 </div>
                 <div class="cl-form-group col-span-3">
                   <label class="cl-form-label">Faturamento Real</label>
                   <input type="number" class="cl-form-input" name="realBilling" placeholder="0.00" step="0.01" min="0">
                 </div>
                 <div class="cl-form-group col-span-3">
                   <label class="cl-form-label">Meta de Leads</label>
                   <input type="number" class="cl-form-input" name="monthlyLeads" placeholder="0" min="0">
                 </div>
                 <div class="cl-form-group col-span-3">
                   <label class="cl-form-label">Número Real de Leads</label>
                   <input type="number" class="cl-form-input" name="realLeads" placeholder="0" min="0">
                 </div>
                 <div class="cl-form-group col-span-6">
                   <label class="cl-form-label">Taxa Conversão (%)</label>
                   <input type="number" class="cl-form-input" name="conversionRate" placeholder="0.00" step="0.01" min="0" max="100">
                 </div>
                 <div class="cl-form-group col-span-6">
                   <label class="cl-form-label">ROI - Calculado Automaticamente</label>
                   <input type="number" class="cl-form-input" name="currentROI" placeholder="0.00" step="0.01" readonly style="background-color: #f9fafb; cursor: not-allowed;">
                 </div>
               </div>
               
               <!-- Controle de Saldo -->
               <div class="col-span-12">
                 <h4 style="margin: 16px 0 12px 0; font-size: 14px; font-weight: 600; color: #374151;">💰 Controle de Saldo</h4>
                 <div class="cl-balance-form-grid">
                   <!-- Meta Ads -->
                   <div class="cl-balance-form-platform">
                     <h5 class="cl-balance-form-platform-title">Meta Ads</h5>
                     <div class="cl-balance-form-fields">
                       <div class="cl-form-group">
                         <label class="cl-form-label">Último Depósito (R$)</label>
                         <input type="number" class="cl-form-input" name="balance_metaAds_lastDeposit" placeholder="0.00" step="0.01" min="0">
                       </div>
                       <div class="cl-form-group">
                         <label class="cl-form-label">Data do Depósito</label>
                         <input type="date" class="cl-form-input" name="balance_metaAds_depositDate">
                       </div>
                       <div class="cl-form-group">
                         <label class="cl-form-label">Orçamento Diário (R$)</label>
                         <input type="number" class="cl-form-input" name="balance_metaAds_dailyBudget" placeholder="0.00" step="0.01" min="0">
                       </div>
                       <div class="cl-form-group">
                         <label class="cl-form-label">Saldo Real (R$)</label>
                         <input type="number" class="cl-form-input" name="balance_metaAds_realBalance" placeholder="0.00" step="0.01" min="0">
                       </div>
                     </div>
                   </div>
                   
                   <!-- Google Ads -->
                   <div class="cl-balance-form-platform">
                     <h5 class="cl-balance-form-platform-title">Google Ads</h5>
                     <div class="cl-balance-form-fields">
                       <div class="cl-form-group">
                         <label class="cl-form-label">Último Depósito (R$)</label>
                         <input type="number" class="cl-form-input" name="balance_googleAds_lastDeposit" placeholder="0.00" step="0.01" min="0">
                       </div>
                       <div class="cl-form-group">
                         <label class="cl-form-label">Data do Depósito</label>
                         <input type="date" class="cl-form-input" name="balance_googleAds_depositDate">
                       </div>
                       <div class="cl-form-group">
                         <label class="cl-form-label">Orçamento Diário (R$)</label>
                         <input type="number" class="cl-form-input" name="balance_googleAds_dailyBudget" placeholder="0.00" step="0.01" min="0">
                       </div>
                       <div class="cl-form-group">
                         <label class="cl-form-label">Saldo Real (R$)</label>
                         <input type="number" class="cl-form-input" name="balance_googleAds_realBalance" placeholder="0.00" step="0.01" min="0">
                       </div>
                     </div>
                   </div>
                   
                   <!-- TikTok Ads -->
                   <div class="cl-balance-form-platform">
                     <h5 class="cl-balance-form-platform-title">TikTok Ads</h5>
                     <div class="cl-balance-form-fields">
                       <div class="cl-form-group">
                         <label class="cl-form-label">Último Depósito (R$)</label>
                         <input type="number" class="cl-form-input" name="balance_tiktokAds_lastDeposit" placeholder="0.00" step="0.01" min="0">
                       </div>
                       <div class="cl-form-group">
                         <label class="cl-form-label">Data do Depósito</label>
                         <input type="date" class="cl-form-input" name="balance_tiktokAds_depositDate">
                       </div>
                       <div class="cl-form-group">
                         <label class="cl-form-label">Orçamento Diário (R$)</label>
                         <input type="number" class="cl-form-input" name="balance_tiktokAds_dailyBudget" placeholder="0.00" step="0.01" min="0">
                       </div>
                       <div class="cl-form-group">
                         <label class="cl-form-label">Saldo Real (R$)</label>
                         <input type="number" class="cl-form-input" name="balance_tiktokAds_realBalance" placeholder="0.00" step="0.01" min="0">
                       </div>
                     </div>
                   </div>
                   
                   <!-- Pinterest Ads -->
                   <div class="cl-balance-form-platform">
                     <h5 class="cl-balance-form-platform-title">Pinterest Ads</h5>
                     <div class="cl-balance-form-fields">
                       <div class="cl-form-group">
                         <label class="cl-form-label">Último Depósito (R$)</label>
                         <input type="number" class="cl-form-input" name="balance_pinterestAds_lastDeposit" placeholder="0.00" step="0.01" min="0">
                       </div>
                       <div class="cl-form-group">
                         <label class="cl-form-label">Data do Depósito</label>
                         <input type="date" class="cl-form-input" name="balance_pinterestAds_depositDate">
                       </div>
                       <div class="cl-form-group">
                         <label class="cl-form-label">Orçamento Diário (R$)</label>
                         <input type="number" class="cl-form-input" name="balance_pinterestAds_dailyBudget" placeholder="0.00" step="0.01" min="0">
                       </div>
                       <div class="cl-form-group">
                         <label class="cl-form-label">Saldo Real (R$)</label>
                         <input type="number" class="cl-form-input" name="balance_pinterestAds_realBalance" placeholder="0.00" step="0.01" min="0">
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
               
               <!-- Orçamentos por Plataforma -->
               <div class="col-span-12">
                 <h4 style="margin: 16px 0 12px 0; font-size: 14px; font-weight: 600; color: #374151;">Orçamentos Mensais (BRL)</h4>
                 <div class="cl-budget-grid">
                   <div class="cl-budget-item">
                     <label class="cl-budget-label">Meta Ads</label>
                     <input type="number" class="cl-budget-input" name="budget_META_ADS" min="0" step="0.01" placeholder="0,00">
                   </div>
                   <div class="cl-budget-item">
                     <label class="cl-budget-label">Google Ads</label>
                     <input type="number" class="cl-budget-input" name="budget_GOOGLE_ADS" min="0" step="0.01" placeholder="0,00">
                   </div>
                   <div class="cl-budget-item">
                     <label class="cl-budget-label">TikTok Ads</label>
                     <input type="number" class="cl-budget-input" name="budget_TIKTOK_ADS" min="0" step="0.01" placeholder="0,00">
                   </div>
                   <div class="cl-budget-item">
                     <label class="cl-budget-label">LinkedIn Ads</label>
                     <input type="number" class="cl-budget-input" name="budget_LINKEDIN_ADS" min="0" step="0.01" placeholder="0,00">
                   </div>
                   <div class="cl-budget-item">
                     <label class="cl-budget-label">YouTube Ads</label>
                     <input type="number" class="cl-budget-input" name="budget_YOUTUBE_ADS" min="0" step="0.01" placeholder="0,00">
                   </div>
                   <div class="cl-budget-item">
                     <label class="cl-budget-label">Pinterest Ads</label>
                     <input type="number" class="cl-budget-input" name="budget_PINTEREST_ADS" min="0" step="0.01" placeholder="0,00">
                   </div>
                   <div class="cl-budget-item">
                     <label class="cl-budget-label">Twitter Ads</label>
                     <input type="number" class="cl-budget-input" name="budget_TWITTER_ADS" min="0" step="0.01" placeholder="0,00">
                   </div>
                   <div class="cl-budget-item">
                     <label class="cl-budget-label">Snapchat Ads</label>
                     <input type="number" class="cl-budget-input" name="budget_SNAPCHAT_ADS" min="0" step="0.01" placeholder="0,00">
                   </div>
                   <div class="cl-budget-item">
                     <label class="cl-budget-label">Outras</label>
                     <input type="number" class="cl-budget-input" name="budget_OTHER" min="0" step="0.01" placeholder="0,00">
                   </div>
                 </div>
               </div>
               
               <!-- Plataformas Ativas -->
               <div class="col-span-12">
                 <h4 style="margin: 16px 0 12px 0; font-size: 14px; font-weight: 600; color: #374151;">Plataformas Ativas</h4>
                 <div class="cl-platforms-grid">
                   <label class="cl-platform-checkbox">
                     <input type="checkbox" name="activePlatforms" value="META_ADS">
                     <span class="cl-platform-label">Meta Ads</span>
                   </label>
                   <label class="cl-platform-checkbox">
                     <input type="checkbox" name="activePlatforms" value="GOOGLE_ADS">
                     <span class="cl-platform-label">Google Ads</span>
                   </label>
                   <label class="cl-platform-checkbox">
                     <input type="checkbox" name="activePlatforms" value="TIKTOK_ADS">
                     <span class="cl-platform-label">TikTok Ads</span>
                   </label>
                   <label class="cl-platform-checkbox">
                     <input type="checkbox" name="activePlatforms" value="LINKEDIN_ADS">
                     <span class="cl-platform-label">LinkedIn Ads</span>
                   </label>
                   <label class="cl-platform-checkbox">
                     <input type="checkbox" name="activePlatforms" value="YOUTUBE_ADS">
                     <span class="cl-platform-label">YouTube Ads</span>
                   </label>
                   <label class="cl-platform-checkbox">
                     <input type="checkbox" name="activePlatforms" value="PINTEREST_ADS">
                     <span class="cl-platform-label">Pinterest Ads</span>
                   </label>
                   <label class="cl-platform-checkbox">
                     <input type="checkbox" name="activePlatforms" value="TWITTER_ADS">
                     <span class="cl-platform-label">Twitter Ads</span>
                   </label>
                   <label class="cl-platform-checkbox">
                     <input type="checkbox" name="activePlatforms" value="SNAPCHAT_ADS">
                     <span class="cl-platform-label">Snapchat Ads</span>
                   </label>
                   <label class="cl-platform-checkbox">
                     <input type="checkbox" name="activePlatforms" value="OTHER">
                     <span class="cl-platform-label">Outras</span>
                   </label>
                 </div>
               </div>
               
               <!-- Links de Documentos -->
               <div class="cl-form-group col-span-12">
                 <label class="cl-form-label">Links de Documentos</label>
                 <textarea class="cl-form-textarea" name="documentLinks" placeholder="Cole aqui os links de documentos, contratos, briefings, etc. (um por linha)"></textarea>
               </div>
               
               <!-- Notas -->
               <div class="cl-form-group col-span-12">
                 <label class="cl-form-label">Notas</label>
                 <textarea class="cl-form-textarea" name="notes" placeholder="Observações adicionais sobre o cliente..."></textarea>
               </div>
             </form>
           </div>
           
           <div class="cl-modal-footer">
             <button type="button" class="cl-btn cl-btn-secondary" onclick="this.closest('.cl-modal-backdrop').remove()">Cancelar</button>
             <button type="button" class="cl-btn cl-btn-primary" id="save-client-btn">${isEdit ? 'Atualizar' : 'Criar'} Cliente</button>
           </div>
         </div>
       `;
       
       // Adicionar ao DOM
       document.body.appendChild(backdrop);
       
       // Popular select de responsáveis com membros do Team
       await populateClientResponsibleSelect();
       
       // Preencher dados se for edição
       if (isEdit && client) {
         const form = backdrop.querySelector('#client-form');
         form.name.value = client.name || '';
         form.email.value = client.email || '';
         form.phone.value = client.phone || '';
         form.website.value = client.website || '';
         form.instagram.value = client.instagram || '';
         form.tier.value = client.tier || '';
         form.status.value = client.status || '';
         form.entryDate.value = client.entryDate || '';
         form.responsible.value = client.responsible || '';
         form.paymentMethod.value = client.paymentMethod || 'BOLETO';
         form.documentLinks.value = client.documentLinks || '';
         form.notes.value = client.notes || '';
         
         // Preencher campos de metas e performance
         form.billingGoal.value = client.billingGoal || '';
         form.realBilling.value = client.realBilling || '';
         form.monthlyLeads.value = client.monthlyLeads || '';
         form.realLeads.value = client.realLeads || '';
         form.conversionRate.value = client.conversionRate || '';
         form.currentROI.value = client.currentROI || '';
         
         // Preencher campos de controle de saldo
         if (client.balanceControl) {
           Object.keys(client.balanceControl).forEach(platformKey => {
             const balance = client.balanceControl[platformKey];
             if (balance) {
               const depositInput = form.querySelector(`[name="balance_${platformKey}_lastDeposit"]`);
               const dateInput = form.querySelector(`[name="balance_${platformKey}_depositDate"]`);
               const dailyInput = form.querySelector(`[name="balance_${platformKey}_dailyBudget"]`);
               const realInput = form.querySelector(`[name="balance_${platformKey}_realBalance"]`);
               
               if (depositInput) depositInput.value = balance.lastDeposit || '';
               if (dateInput) dateInput.value = balance.depositDate || '';
               if (dailyInput) dailyInput.value = balance.dailyBudget || '';
               if (realInput) realInput.value = balance.realBalance || '';
             }
           });
         }
         
         // Preencher orçamentos
         if (client.budgets) {
           Object.keys(client.budgets).forEach(platform => {
             const input = form.querySelector(`[name="budget_${platform}"]`);
             if (input) {
               input.value = client.budgets[platform] || '';
             }
           });
         }
         
         // Preencher plataformas ativas
         if (client.activePlatforms) {
           client.activePlatforms.forEach(platform => {
             const checkbox = form.querySelector(`[name="activePlatforms"][value="${platform}"]`);
             if (checkbox) {
               checkbox.checked = true;
             }
           });
         }
       }
       
       // Event listener para salvar
       const saveBtn = backdrop.querySelector('#save-client-btn');
       saveBtn.addEventListener('click', async () => {
         try {
           const form = backdrop.querySelector('#client-form');
           const formData = new FormData(form);
           
           // Validar campos obrigatórios
           if (!formData.get('name') || !formData.get('tier') || !formData.get('status') || !formData.get('responsible')) {
             alert('Por favor, preencha todos os campos obrigatórios.');
             return;
           }
           
           // Coletar orçamentos
           const budgets = {};
           Object.keys(MARKETING_PLATFORMS).forEach(platform => {
             const value = formData.get(`budget_${platform}`);
             if (value && parseFloat(value) > 0) {
               budgets[platform] = parseFloat(value);
             }
           });
           
           // Coletar plataformas ativas
           const activePlatforms = formData.getAll('activePlatforms');
           
           // Coletar dados de controle de saldo
           const balanceControl = {};
           ['metaAds', 'googleAds', 'tiktokAds', 'pinterestAds'].forEach(platform => {
             const deposit = formData.get(`balance_${platform}_lastDeposit`);
             const date = formData.get(`balance_${platform}_depositDate`);
             const daily = formData.get(`balance_${platform}_dailyBudget`);
             const actual = formData.get(`balance_${platform}_realBalance`);
             
             if (deposit || date || daily || actual) {
               balanceControl[platform] = {
                 lastDeposit: deposit ? parseFloat(deposit) : 0,
                 depositDate: date || null,
                 dailyBudget: daily ? parseFloat(daily) : 0,
                 realBalance: actual ? parseFloat(actual) : null
               };
             }
           });
           
           // Preparar payload
           const payload = {
             name: formData.get('name'),
             email: formData.get('email'),
             phone: formData.get('phone'),
             website: formData.get('website'),
             instagram: formData.get('instagram'),
             tier: formData.get('tier'),
             status: formData.get('status'),
             entryDate: formData.get('entryDate'),
             responsible: formData.get('responsible'),
             paymentMethod: formData.get('paymentMethod') || 'BOLETO',
             budgets: budgets,
             activePlatforms: activePlatforms,
             documentLinks: formData.get('documentLinks'),
             notes: formData.get('notes'),
             // Metas e Performance
             billingGoal: formData.get('billingGoal') ? parseFloat(formData.get('billingGoal')) : null,
             realBilling: formData.get('realBilling') ? parseFloat(formData.get('realBilling')) : null,
             monthlyLeads: formData.get('monthlyLeads') ? parseInt(formData.get('monthlyLeads')) : null,
             realLeads: formData.get('realLeads') ? parseInt(formData.get('realLeads')) : null,
             conversionRate: formData.get('conversionRate') ? parseFloat(formData.get('conversionRate')) : null,
             currentROI: formData.get('currentROI') ? parseFloat(formData.get('currentROI')) : null,
             // Controle de Saldo
             balanceControl: Object.keys(balanceControl).length > 0 ? balanceControl : null
           };
           
           // Salvar
           if (isEdit) {
             await updateClient(client.id, payload);
           } else {
             await createClient(payload);
           }
           
           // Fechar modal e recarregar dados
           backdrop.remove();
           await loadClients();
           
         } catch (error) {
           console.error('Erro ao salvar cliente:', error);
           alert('Erro ao salvar cliente: ' + error.message);
         }
       });
       
       // Fechar modal ao clicar no backdrop
       backdrop.addEventListener('click', (e) => {
         if (e.target === backdrop) {
           backdrop.remove();
         }
       });
     }
    
    // Função para calcular saldo estimado automaticamente
    function calculateEstimatedBalance(lastDeposit, depositDate, dailyBudget) {
      if (!lastDeposit || !depositDate || !dailyBudget) {
        return 0;
      }
      
      const today = new Date();
      const deposit = new Date(depositDate);
      
      // Calcular diferença em dias
      const timeDiff = today.getTime() - deposit.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
      
      // Calcular saldo estimado
      const estimatedBalance = lastDeposit - (daysDiff * dailyBudget);
      
      return Math.max(0, estimatedBalance);
    }
    
    // Função para calcular status geral do saldo do cliente
    function getOverallBalanceStatus(client) {
      if (!client.balanceControl) return null;
      
      // Não exibir flags de saldo para clientes com Cartão de Crédito
      if (client.paymentMethod === 'CREDIT_CARD') return null;
      
      const platforms = ['metaAds', 'googleAds', 'tiktokAds', 'pinterestAds'];
      let hasAnyBalance = false;
      let hasLowBalance = false;
      let hasDepletedBalance = false;
      
      platforms.forEach(platform => {
        const balance = client.balanceControl[platform];
        if (balance && balance.lastDeposit && balance.depositDate && balance.dailyBudget) {
          hasAnyBalance = true;
          
          const daysSinceDeposit = Math.floor((new Date() - new Date(balance.depositDate)) / (1000 * 60 * 60 * 24));
          const estimatedBalance = balance.lastDeposit - (daysSinceDeposit * balance.dailyBudget);
          
          if (estimatedBalance <= 0) {
            hasDepletedBalance = true;
          } else if (estimatedBalance < 15.00) {
            hasLowBalance = true;
          }
        }
      });
      
      if (!hasAnyBalance) return null;
      
      if (hasDepletedBalance) {
        return {
          icon: '🔴',
          class: 'depleted',
          tooltip: 'Cliente com saldo esgotado em uma ou mais plataformas'
        };
      }
      
      if (hasLowBalance) {
        return {
          icon: '🟡',
          class: 'low',
          tooltip: 'Cliente com saldo baixo (< R$ 15,00) em uma ou mais plataformas'
        };
      }
      
      return {
        icon: '🟢',
        class: 'good',
        tooltip: 'Cliente com saldo OK (≥ R$ 15,00) em todas as plataformas'
      };
    }
    
    // Função para calcular ROI automaticamente
    function calculateROI(realBilling, budgets) {
      if (!realBilling || realBilling <= 0) {
        return 0;
      }
      
      // Calcular despesa total dos orçamentos das plataformas
      let totalBudget = 0;
      if (budgets && typeof budgets === 'object') {
        Object.values(budgets).forEach(budget => {
          totalBudget += parseFloat(budget) || 0;
        });
      }
      
      if (totalBudget <= 0) {
        return 0;
      }
      
      // Calcular ROI: Receita / Despesa
      const roi = realBilling / totalBudget;
      return Math.round(roi * 100) / 100; // Arredondar para 2 casas decimais
    }
    
    // Função para atualizar ROI em tempo real
    function updateROI() {
      const form = document.querySelector('#clientModal form');
      if (!form) return;
      
      const realBillingInput = form.querySelector('[name="realBilling"]');
      const roiInput = form.querySelector('[name="currentROI"]');
      
      if (!realBillingInput || !roiInput) return;
      
      const realBilling = parseFloat(realBillingInput.value) || 0;
      
      // Coletar orçamentos das plataformas
      const budgets = {};
      const platforms = ['metaAds', 'googleAds', 'tiktokAds', 'pinterestAds'];
      
      platforms.forEach(platform => {
        const budgetInput = form.querySelector(`[name="budgets[${platform}]"]`);
        if (budgetInput && budgetInput.value) {
          budgets[platform] = parseFloat(budgetInput.value) || 0;
        }
      });
      
      const roi = calculateROI(realBilling, budgets);
      roiInput.value = roi.toFixed(2);
    }
    
    // Função para atualizar saldos estimados em tempo real
    function updateEstimatedBalances() {
      const balanceItems = document.querySelectorAll('.cl-balance-platform');
      
      balanceItems.forEach(item => {
        const depositInput = item.querySelector('[name*="_deposit"]');
        const dateInput = item.querySelector('[name*="_date"]');
        const dailyInput = item.querySelector('[name*="_daily"]');
        const estimatedDisplay = item.querySelector('.estimated-balance');
        
        if (depositInput && dateInput && dailyInput && estimatedDisplay) {
          const lastDeposit = parseFloat(depositInput.value) || 0;
          const depositDate = dateInput.value;
          const dailyBudget = parseFloat(dailyInput.value) || 0;
          
          const estimatedBalance = calculateEstimatedBalance(lastDeposit, depositDate, dailyBudget);
          estimatedDisplay.textContent = formatCurrency(estimatedBalance);
          
          // Atualizar status visual
          const statusElement = item.querySelector('.cl-balance-status');
          if (statusElement) {
            statusElement.className = 'cl-balance-status';
            if (estimatedBalance <= 0) {
              statusElement.classList.add('depleted');
              statusElement.textContent = '🔴 Esgotado';
            } else if (estimatedBalance < 15.00) {
              statusElement.classList.add('low');
              statusElement.textContent = '🟡 Baixo';
            } else {
              statusElement.classList.add('good');
              statusElement.textContent = '🟢 OK';
            }
          }
        }
      });
      

    }
    
    // Adicionar listeners para atualização automática nos formulários
    document.addEventListener('input', (e) => {
      if (e.target.matches('[name*="balance_"][name*="_deposit"], [name*="balance_"][name*="_date"], [name*="balance_"][name*="_daily"]')) {
        setTimeout(updateEstimatedBalances, 100); // Pequeno delay para garantir que o valor foi atualizado
      }
      
      // Atualizar ROI quando faturamento real ou orçamentos das plataformas forem alterados
      if (e.target.matches('[name="realBilling"], [name*="budgets["]')) {
        setTimeout(updateROI, 100);
      }
    });
    
    // Carregar dados iniciais
    loadClients();
    
    return root;
  }
  
  // Exportar para uso global
  global.TaskoraPages = global.TaskoraPages || {};
  global.TaskoraPages.clients = { render };
  
})(window);
