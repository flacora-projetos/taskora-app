// assets/js/pages/history.js
import { listClients } from '../data/clientsRepo.js';
import { listTasks } from '../data/tasksRepo.js';

(function(global) {
  // Utilitários
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Normalização de status (compatível com o módulo de tarefas)
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
  
  function formatDate(dateStr) {
    if (!dateStr) return '';
    
    let date;
    if (typeof dateStr === 'string') {
      date = new Date(dateStr);
    } else if (dateStr && dateStr.seconds) {
      // Firestore Timestamp
      date = new Date(dateStr.seconds * 1000);
    } else {
      date = new Date(dateStr);
    }
    
    if (isNaN(date.getTime())) return '';
    
    // Verificar se a data é muito antiga (antes de 1970) ou muito futura
    const year = date.getFullYear();
    if (year < 1970 || year > 2100) return '';
    
    return date.toLocaleDateString('pt-BR');
  }
  
  function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('pt-BR');
  }
  
  function getStatusColor(status) {
    const normalizedStatus = canonStatus(status);
    const colors = {
      'concluída': { bg: '#DCFCE7', fg: '#166534', bd: '#BBF7D0' },
      'em progresso': { bg: '#DBEAFE', fg: '#1E40AF', bd: '#BFDBFE' },
      'iniciada': { bg: '#FEF3C7', fg: '#92400E', bd: '#FDE68A' },
      'não realizada': { bg: '#FEE2E2', fg: '#DC2626', bd: '#FECACA' }
    };
    return colors[normalizedStatus] || { bg: '#F3F4F6', fg: '#6B7280', bd: '#E5E7EB' };
  }
  
  function getPriorityColor(priority) {
    const colors = {
      'alta': { bg: '#FEE2E2', fg: '#DC2626', bd: '#FECACA' },
      'média': { bg: '#FEF3C7', fg: '#92400E', bd: '#FDE68A' },
      'baixa': { bg: '#DCFCE7', fg: '#166534', bd: '#BBF7D0' }
    };
    return colors[priority] || { bg: '#F3F4F6', fg: '#6B7280', bd: '#E5E7EB' };
  }
  
  function getTimeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
  }
  
  function getTaskHours(task) {
    // Usar apenas o campo hours como número decimal (aceita qualquer valor, incluindo 0)
    if (typeof task.hours === 'number') {
      const totalMinutes = task.hours * 60;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    
    // Retorna vazio se não há campo hours
    return '';
  }

  function render() {
    const root = document.createElement('div');
    root.className = 'history-page';
    root.innerHTML = `
      <style>
        .history-page { min-height: 100vh; font-size: 13px; color: #2F3B2F }
         
         .hs-sticky-container { position: sticky; top: 40px; z-index: 10; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 32px; border-radius: 12px; }
          .hs-content { padding: 24px 32px 32px 32px; }
        
        .hs-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; padding-bottom: 8px; }
        .hs-header h2 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #014029; text-transform: uppercase; font-family: system-ui, -apple-system, sans-serif }
        .hs-header-actions { display: flex; gap: 12px; align-items: center }
        .hs-client-selector { min-width: 300px; padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 14px; background: #fff }
        .hs-client-info { display: flex; align-items: center; gap: 8px; margin-left: 16px }
        .hs-client-name { font-weight: 600; color: #014029 }
        .hs-client-tier { padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase }
        
        .hs-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 16px }
        .hs-stat-card { background: #fff; border: 1px solid #E4E7E4; border-radius: 12px; padding: 18px 16px; transition: all 0.2s ease }
        .hs-stat-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1) }
        .hs-stat-number { font-size: 24px; font-weight: 800; color: #014029; margin-bottom: 4px }
        .hs-stat-label { font-size: 10px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600 }
        
        .hs-filters { background: #fff; border: 1px solid #E4E7E4; border-radius: 12px; padding: 16px; margin-bottom: 8px }
        .hs-filters-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap }
        .hs-filter-group { display: flex; gap: 4px; align-items: center }
        .hs-filter-label { font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 4px }
        .hs-filter-select, .hs-filter-input { background: #fff; border: 1px solid #E4E7E4; border-radius: 6px; padding: 4px 8px; font-size: 12px; min-width: 120px }
        .hs-search { flex: 1; min-width: 200px; max-width: 300px; padding: 8px 12px; border: 1px solid #E4E7E4; border-radius: 8px; font-size: 13px }
        
        .hs-timeline { background: #fff; border: 1px solid #E4E7E4; border-radius: 12px; padding: 24px }
        .hs-timeline-empty { text-align: center; padding: 60px 20px; color: #6B7280 }
        .hs-timeline-month { margin-bottom: 32px }
        .hs-month-header { font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #E5E7EB }
        
        .hs-task-item { display: flex; gap: 16px; margin-bottom: 16px; padding: 16px; background: #FAFAFA; border: 1px solid #F0F0F0; border-radius: 8px; transition: all 0.2s ease }
        .hs-task-item:hover { background: #F5F5F5; border-color: #E0E0E0 }
        .hs-task-timeline { display: flex; flex-direction: column; align-items: center; min-width: 60px }
        .hs-task-date { font-size: 11px; color: #6B7280; font-weight: 500; text-align: center; margin-bottom: 4px }
        .hs-task-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid #E5E7EB; background: #fff }
        .hs-task-dot.completed { background: #10B981; border-color: #10B981 }
        .hs-task-dot.in-progress { background: #3B82F6; border-color: #3B82F6 }
        .hs-task-dot.overdue { background: #EF4444; border-color: #EF4444 }
        
        .hs-task-content { flex: 1 }
        .hs-task-header { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; margin-bottom: 8px }
        .hs-task-title-section { }
        .hs-task-title { font-weight: 600; color: #1F2937; margin-bottom: 4px; font-size: 14px }
        .hs-task-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap }
        .hs-task-status, .hs-task-priority { padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase }
        .hs-task-description { }
        .hs-task-description p { margin: 0; font-size: 13px; line-height: 1.4; color: #374151 }
        .hs-no-description { color: #9CA3AF; font-style: italic }
        .hs-task-details { font-size: 12px; color: #6B7280; line-height: 1.4 }
        .hs-task-owner { font-weight: 500; color: #374151 }
        .hs-task-hours { color: #059669; font-weight: 600 }
        
        .hs-loading { text-align: center; padding: 40px; color: #6B7280 }
        .hs-no-client { text-align: center; padding: 60px 20px; color: #6B7280 }
        
        @media (max-width: 768px) {
          .hs-stats-grid { grid-template-columns: repeat(2, 1fr) }
          .hs-filters-row { flex-direction: column; align-items: stretch }
          .hs-task-item { flex-direction: column; gap: 12px }
          .hs-task-timeline { flex-direction: row; min-width: auto; justify-content: flex-start }
          .hs-task-header { grid-template-columns: 1fr; gap: 8px }
          .hs-task-description { margin-top: 8px }
        }
      </style>
      
      <div class="hs-sticky-container">
         <div class="hs-header">
           <h2 id="pageTitle">Histórico de Tarefas</h2>
           <div class="hs-header-actions">
             <select class="hs-client-selector" id="clientSelector">
               <option value="">Selecione um cliente...</option>
             </select>
             <div class="hs-client-info" id="clientInfo" style="display: none;">
               <span class="hs-client-name" id="clientName"></span>
               <span class="hs-client-tier" id="clientTier"></span>
             </div>
           </div>
         </div>
        
        <div class="hs-stats-grid" id="statsGrid" style="display: none;">
          <div class="hs-stat-card">
            <div class="hs-stat-number" id="totalTasks">0</div>
            <div class="hs-stat-label">Total de Tarefas</div>
          </div>
          <div class="hs-stat-card">
            <div class="hs-stat-number" id="completedTasks">0</div>
            <div class="hs-stat-label">Concluídas</div>
          </div>
          <div class="hs-stat-card">
            <div class="hs-stat-number" id="totalHours">0h</div>
            <div class="hs-stat-label">Horas Trabalhadas</div>
          </div>
          <div class="hs-stat-card">
            <div class="hs-stat-number" id="completionRate">0%</div>
            <div class="hs-stat-label">Taxa de Conclusão</div>
          </div>
        </div>
        
        <div class="hs-filters" id="filtersPanel" style="display: none;">
          <div class="hs-filters-row">
            <div class="hs-filter-group">
              <span class="hs-filter-label">Status:</span>
              <select class="hs-filter-select" id="statusFilter">
                <option value="all">Todos</option>
                <option value="iniciada">Iniciada</option>
                <option value="em progresso">Em progresso</option>
                <option value="concluída">Concluída</option>
                <option value="não realizada">Não realizada</option>
              </select>
            </div>
            
            <div class="hs-filter-group">
              <span class="hs-filter-label">Cliente:</span>
              <select class="hs-filter-select" id="clientFilter">
                <option value="all">Todos</option>
              </select>
            </div>
            
            <div class="hs-filter-group">
              <span class="hs-filter-label">Responsável:</span>
              <select class="hs-filter-select" id="ownerFilter">
                <option value="all">Todos</option>
              </select>
            </div>
            
            <div class="hs-filter-group">
              <span class="hs-filter-label">Data inicial:</span>
              <input type="date" class="hs-filter-input" id="dateFromFilter">
            </div>
            
            <div class="hs-filter-group">
              <span class="hs-filter-label">Data final:</span>
              <input type="date" class="hs-filter-input" id="dateToFilter">
            </div>
            
            <div class="hs-filter-group">
              <span class="hs-filter-label">Intervalo rápido:</span>
              <select class="hs-filter-select" id="quickFilter">
                <option value="custom">Personalizado</option>
                <option value="today">Hoje</option>
                <option value="yesterday">Ontem</option>
                <option value="last7">Últimos 7 dias</option>
                <option value="last30" selected>Últimos 30 dias</option>
                <option value="thisMonth">Este mês</option>
                <option value="prevMonth">Mês anterior</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div class="hs-content">
        <div class="hs-timeline" id="timeline">
          <div class="hs-no-client">
            <h3>Selecione um cliente</h3>
            <p>Escolha um cliente no seletor acima para visualizar seu histórico de tarefas.</p>
          </div>
        </div>
      </div>
    `;
    
    // Elementos
    const elPageTitle = root.querySelector('#pageTitle');
    const elClientSelector = root.querySelector('#clientSelector');
    const elClientInfo = root.querySelector('#clientInfo');
    const elClientName = root.querySelector('#clientName');
    const elClientTier = root.querySelector('#clientTier');
    const elStatsGrid = root.querySelector('#statsGrid');
    const elFiltersPanel = root.querySelector('#filtersPanel');
    const elTimeline = root.querySelector('#timeline');
    const elTotalTasks = root.querySelector('#totalTasks');
    const elCompletedTasks = root.querySelector('#completedTasks');
    const elTotalHours = root.querySelector('#totalHours');
    const elCompletionRate = root.querySelector('#completionRate');
    const elStatusFilter = root.querySelector('#statusFilter');
    const elClientFilter = root.querySelector('#clientFilter');
    const elOwnerFilter = root.querySelector('#ownerFilter');
    const elDateFromFilter = root.querySelector('#dateFromFilter');
    const elDateToFilter = root.querySelector('#dateToFilter');
    const elQuickFilter = root.querySelector('#quickFilter');
    
    let allClients = [];
    let allTasks = [];
    let selectedClient = null;
    let filteredTasks = [];
    
    // Carregar dados iniciais
    async function loadData() {
      try {
        elTimeline.innerHTML = '<div class="hs-loading">Carregando dados...</div>';
        
        const [clients, tasks] = await Promise.all([
          listClients(),
          listTasks()
        ]);
        
        allClients = clients;
        allTasks = tasks;
        
        populateClientSelector();
        populateFilterSelects();
        
        // Inicializar com "Todos" selecionado
        selectClient('all');
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        elTimeline.innerHTML = '<div class="hs-timeline-empty">Erro ao carregar dados. Tente novamente.</div>';
      }
    }
    
    function populateClientSelector() {
      elClientSelector.innerHTML = '<option value="all">Todos</option><option value="">Selecione um cliente...</option>';
      
      allClients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        elClientSelector.appendChild(option);
      });
      
      // Definir "Todos" como padrão
      elClientSelector.value = 'all';
    }
    
    function populateFilterSelects() {
      // Popular filtro de clientes
      elClientFilter.innerHTML = '<option value="all">Todos</option>';
      allClients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.name;
        option.textContent = client.name;
        elClientFilter.appendChild(option);
      });
      
      // Popular filtro de responsáveis
      elOwnerFilter.innerHTML = '<option value="all">Todos</option>';
      const owners = [...new Set(allTasks.map(task => task.owner).filter(Boolean))];
      owners.sort().forEach(owner => {
        const option = document.createElement('option');
        option.value = owner;
        option.textContent = owner;
        elOwnerFilter.appendChild(option);
      });
    }
    
    function selectClient(clientId) {
      if (clientId === 'all') {
        selectedClient = { id: 'all', name: 'Todos os Clientes' };
        
        // Mostrar info para "Todos"
        elClientName.textContent = 'Todos os Clientes';
        elClientTier.textContent = 'Global';
        elClientTier.className = 'hs-client-tier';
        elClientTier.style.background = '#DBEAFE';
        elClientTier.style.color = '#1E40AF';
        
        elClientInfo.style.display = 'flex';
        elStatsGrid.style.display = 'grid';
        elFiltersPanel.style.display = 'block';
        
        // Inicializar filtro rápido com "Últimos 30 dias"
        elQuickFilter.value = 'last30';
        setDates(addDays(today(), -29), today());
        
        loadAllTasks();
        updatePageTitle();
        return;
      }
      
      selectedClient = allClients.find(c => c.id === clientId);
      
      if (!selectedClient) {
        elClientInfo.style.display = 'none';
        elStatsGrid.style.display = 'none';
        elFiltersPanel.style.display = 'none';
        elTimeline.innerHTML = `
          <div class="hs-no-client">
            <h3>Selecione um cliente</h3>
            <p>Escolha um cliente no seletor acima para visualizar seu histórico de tarefas.</p>
          </div>
        `;
        return;
      }
      
      // Mostrar info do cliente
      elClientName.textContent = selectedClient.name;
      elClientTier.textContent = selectedClient.tier || 'N/A';
      elClientTier.className = 'hs-client-tier';
      
      const tierColors = {
        'KEY_ACCOUNT': { bg: '#FEF3C7', fg: '#92400E' },
        'MID_TIER': { bg: '#DBEAFE', fg: '#1E40AF' },
        'LOW_TIER': { bg: '#F3F4F6', fg: '#6B7280' }
      };
      
      const tierColor = tierColors[selectedClient.tier] || tierColors['LOW_TIER'];
      elClientTier.style.background = tierColor.bg;
      elClientTier.style.color = tierColor.fg;
      
      elClientInfo.style.display = 'flex';
      elStatsGrid.style.display = 'grid';
      elFiltersPanel.style.display = 'block';
      
      // Inicializar filtro rápido com "Últimos 30 dias"
      elQuickFilter.value = 'last30';
      setDates(addDays(today(), -29), today());
      
      loadClientTasks();
      updatePageTitle();
    }
    
    function loadAllTasks() {
      if (!selectedClient || selectedClient.id !== 'all') return;
      
      // Carregar todas as tarefas
      filteredTasks = [...allTasks];
      applyFilters();
      updateStats();
      renderTimeline();
    }
    
    function loadClientTasks() {
      if (!selectedClient || selectedClient.id === 'all') return;
      
      // Filtrar tarefas do cliente
      const clientTasks = allTasks.filter(task => {
        if (!task.client) return false;
        
        // Tentar correspondência por ID do cliente primeiro
        if (task.clientRef === selectedClient.id) return true;
        
        // Fallback: correspondência por nome (mais flexível)
        const taskClientName = task.client.toLowerCase().trim();
        const selectedClientName = selectedClient.name.toLowerCase().trim();
        
        return taskClientName === selectedClientName || 
               taskClientName.includes(selectedClientName) ||
               selectedClientName.includes(taskClientName);
      });
      
      filteredTasks = clientTasks;
      applyFilters();
      updateStats();
      renderTimeline();
    }
    
    function applyFilters() {
      if (!selectedClient) return;
      
      let filtered;
      
      // Se "Todos" estiver selecionado, começar com todas as tarefas
      if (selectedClient.id === 'all') {
        filtered = [...allTasks];
      } else {
        // Senão, começar com tarefas do cliente específico
        filtered = allTasks.filter(task => {
          if (!task.client) return false;
          
          // Tentar correspondência por ID do cliente primeiro
          if (task.clientRef === selectedClient.id) return true;
          
          // Fallback: correspondência por nome (mais flexível)
          const taskClientName = task.client.toLowerCase().trim();
          const selectedClientName = selectedClient.name.toLowerCase().trim();
          
          return taskClientName === selectedClientName || 
                 taskClientName.includes(selectedClientName) ||
                 selectedClientName.includes(taskClientName);
        });
      }
      
      // Filtro por status
      if (elStatusFilter.value !== 'all') {
        filtered = filtered.filter(task => {
          const taskStatus = canonStatus(task.status);
          const filterStatus = canonStatus(elStatusFilter.value);
          return taskStatus === filterStatus;
        });
      }
      
      // Filtro por cliente (só aplicar se "Todos" estiver selecionado)
      if (selectedClient.id === 'all' && elClientFilter.value !== 'all') {
        filtered = filtered.filter(task => task.client === elClientFilter.value);
      }
      
      // Filtro por responsável
      if (elOwnerFilter.value !== 'all') {
        filtered = filtered.filter(task => task.owner === elOwnerFilter.value);
      }
      
      // Filtro por data
      const dateFrom = elDateFromFilter.value;
      const dateTo = elDateToFilter.value;
      
      if (dateFrom || dateTo) {
        filtered = filtered.filter(task => {
          const taskDate = task.date || task.dueDate || task.createdAt;
          if (!taskDate) return false;
          
          const date = new Date(taskDate);
          if (isNaN(date.getTime())) return false;
          
          const dateStr = date.toISOString().split('T')[0];
          
          if (dateFrom && dateStr < dateFrom) return false;
          if (dateTo && dateStr > dateTo) return false;
          
          return true;
        });
      }
      
      filteredTasks = filtered;
    }
    
    function updateStats() {
      const total = filteredTasks.length;
      const completed = filteredTasks.filter(t => canonStatus(t.status) === 'concluída').length;
      
      // Calcular horas usando o campo hours (decimal) do repositório
      const totalMinutes = filteredTasks.reduce((sum, t) => {
        // Usar o campo hours como número decimal (aceita qualquer valor, incluindo 0)
        if (typeof t.hours === 'number') {
          return sum + (t.hours * 60); // converter horas para minutos
        }
        return sum;
      }, 0);
      
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // Converter minutos para formato HH:MM
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      
      elTotalTasks.textContent = total;
      elCompletedTasks.textContent = completed;
      elTotalHours.textContent = timeFormatted;
      elCompletionRate.textContent = `${completionRate}%`;
    }
    
    function renderTimeline() {
      if (filteredTasks.length === 0) {
        elTimeline.innerHTML = `
          <div class="hs-timeline-empty">
            <h3>Nenhuma tarefa encontrada</h3>
            <p>Não há tarefas para este cliente com os filtros aplicados.</p>
          </div>
        `;
        return;
      }
      
      // Agrupar por mês
      const tasksByMonth = {};
      filteredTasks.forEach(task => {
        const dateValue = task.createdAt || task.dueDate;
        let monthKey, monthName;
        
        if (!dateValue) {
          // Tarefas sem data vão para seção personalizada
          monthKey = '0000-00';
          monthName = getCustomSectionTitle();
        } else {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) {
            // Datas inválidas também vão para "Sem Data"
            monthKey = '0000-00';
            monthName = 'Sem Data';
          } else {
            monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthName = date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
          }
        }
        
        if (!tasksByMonth[monthKey]) {
          tasksByMonth[monthKey] = {
            name: monthName,
            tasks: []
          };
        }
        
        tasksByMonth[monthKey].tasks.push(task);
      });
      
      // Ordenar meses (mais recente primeiro, "Sem Data" no final)
      const sortedMonths = Object.keys(tasksByMonth).sort((a, b) => {
        if (a === '0000-00') return 1; // "Sem Data" vai para o final
        if (b === '0000-00') return -1;
        return b.localeCompare(a); // Ordem decrescente para datas válidas
      });
      
      let timelineHtml = '';
      
      sortedMonths.forEach(monthKey => {
        const month = tasksByMonth[monthKey];
        timelineHtml += `
          <div class="hs-timeline-month">
            <div class="hs-month-header">${month.name}</div>
        `;
        
        // Ordenar tarefas por data (mais recente primeiro)
        const sortedTasks = month.tasks.sort((a, b) => {
          const dateValueA = a.createdAt || a.dueDate;
          const dateValueB = b.createdAt || b.dueDate;
          
          // Se ambas não têm data, ordenar por título
          if (!dateValueA && !dateValueB) {
            return (a.title || '').localeCompare(b.title || '');
          }
          if (!dateValueA) return 1; // Sem data vai para o final
          if (!dateValueB) return -1;
          
          const dateA = new Date(dateValueA);
          const dateB = new Date(dateValueB);
          
          // Se ambas têm datas inválidas, ordenar por título
          if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) {
            return (a.title || '').localeCompare(b.title || '');
          }
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          
          return dateB - dateA;
        });
        
        sortedTasks.forEach(task => {
          const statusColor = getStatusColor(task.status);
          const priorityColor = getPriorityColor(task.priority);
          
          // Usar a data mais apropriada disponível
          const dateValue = task.createdAt || task.dueDate || task.date;
          const taskDate = dateValue ? new Date(dateValue) : null;
          
          let dotClass = 'hs-task-dot';
          const normalizedStatus = canonStatus(task.status);
          if (normalizedStatus === 'concluída') dotClass += ' completed';
          else if (normalizedStatus === 'em progresso') dotClass += ' in-progress';
          else if (task.dueDate && new Date(task.dueDate) < new Date()) dotClass += ' overdue';
          
          const taskTitle = task.client || task.title || 'Tarefa sem título';
          const taskHours = getTaskHours(task);
          
          timelineHtml += `
            <div class="hs-task-item">
              <div class="hs-task-timeline">
                <div class="hs-task-date">${formatDate(dateValue) || 'Sem data'}</div>
                <div class="${dotClass}"></div>
              </div>
              <div class="hs-task-content">
                <div class="hs-task-header">
                  <div class="hs-task-title-section">
                    <div class="hs-task-title">${escapeHtml(taskTitle)}</div>
                    <div class="hs-task-meta">
                      <span class="hs-task-status" style="background: ${statusColor.bg}; color: ${statusColor.fg}; border: 1px solid ${statusColor.bd}">
                        ${normalizedStatus}
                      </span>
                      ${task.priority ? `
                        <span class="hs-task-priority" style="background: ${priorityColor.bg}; color: ${priorityColor.fg}; border: 1px solid ${priorityColor.bd}">
                          ${task.priority}
                        </span>
                      ` : ''}
                    </div>
                  </div>
                  <div class="hs-task-description">
                    ${task.description ? `<p>${escapeHtml(task.description)}</p>` : '<p class="hs-no-description">Sem descrição</p>'}
                  </div>
                </div>
                <div class="hs-task-details">
                  <div style="display: flex; gap: 16px; margin-top: 8px;">
                    ${task.owner ? `<span class="hs-task-owner">👤 ${escapeHtml(task.owner)}</span>` : ''}
                    ${taskHours ? `<span class="hs-task-hours">⏱️ ${taskHours}</span>` : ''}
                    ${task.dueDate ? `<span>📅 Prazo: ${formatDate(task.dueDate)}</span>` : ''}
                    ${task.completedAt ? `<span>✅ Concluída: ${formatDate(task.completedAt)}</span>` : ''}
                  </div>
                </div>
              </div>
            </div>
          `;
        });
        
        timelineHtml += '</div>';
      });
      
      elTimeline.innerHTML = timelineHtml;
    }
    
    // Funções para intervalos rápidos
    function setDates(from, to) {
      elDateFromFilter.value = from.toISOString().split('T')[0];
      elDateToFilter.value = to.toISOString().split('T')[0];
    }
    
    function today() {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    
    function addDays(date, days) {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }
    
    function getCustomSectionTitle() {
      let title = 'Histórico de Tarefas';
      
      // Adicionar nome do cliente
      if (selectedClient) {
        if (selectedClient.id === 'all') {
          title += ' - Todos os Clientes';
        } else {
          title += ` - ${selectedClient.name}`;
        }
      }
      
      // Adicionar período do filtro
      const quickFilter = elQuickFilter.value;
      const dateFrom = elDateFromFilter.value;
      const dateTo = elDateToFilter.value;
      
      if (quickFilter && quickFilter !== 'custom') {
        const periods = {
          'today': 'Hoje',
          'yesterday': 'Ontem',
          'last7': 'Últimos 7 dias',
          'last30': 'Últimos 30 dias',
          'thisMonth': 'Este mês',
          'prevMonth': 'Mês anterior'
        };
        title += ` - ${periods[quickFilter] || quickFilter}`;
      } else if (dateFrom || dateTo) {
        if (dateFrom && dateTo) {
          title += ` - ${formatDate(dateFrom)} a ${formatDate(dateTo)}`;
        } else if (dateFrom) {
          title += ` - A partir de ${formatDate(dateFrom)}`;
        } else if (dateTo) {
          title += ` - Até ${formatDate(dateTo)}`;
        }
      }
      
      return title;
    }
    
    function updatePageTitle() {
      elPageTitle.textContent = getCustomSectionTitle();
    }
    
    // Event listeners
    elClientSelector.addEventListener('change', (e) => {
      selectClient(e.target.value);
    });
    
    elStatusFilter.addEventListener('change', () => {
      applyFilters();
      updateStats();
      renderTimeline();
      updatePageTitle();
    });
    
    elClientFilter.addEventListener('change', () => {
      applyFilters();
      updateStats();
      renderTimeline();
      updatePageTitle();
    });
    
    elOwnerFilter.addEventListener('change', () => {
      applyFilters();
      updateStats();
      renderTimeline();
      updatePageTitle();
    });
    
    elDateFromFilter.addEventListener('change', () => {
      elQuickFilter.value = 'custom';
      applyFilters();
      updateStats();
      renderTimeline();
      updatePageTitle();
    });
    
    elDateToFilter.addEventListener('change', () => {
      elQuickFilter.value = 'custom';
      applyFilters();
      updateStats();
      renderTimeline();
      updatePageTitle();
    });
    
    elQuickFilter.addEventListener('change', () => {
      const value = elQuickFilter.value;
      
      if (value === 'today') {
        setDates(today(), today());
      } else if (value === 'yesterday') {
        const yesterday = addDays(today(), -1);
        setDates(yesterday, yesterday);
      } else if (value === 'last7') {
        setDates(addDays(today(), -6), today());
      } else if (value === 'last30') {
        setDates(addDays(today(), -29), today());
      } else if (value === 'thisMonth') {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setDates(firstDay, lastDay);
      } else if (value === 'prevMonth') {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        setDates(firstDay, lastDay);
      }
      
      if (value !== 'custom') {
        applyFilters();
        updateStats();
        renderTimeline();
        updatePageTitle();
      }
    });
    
    // Carregar dados iniciais
    loadData();
    
    return root;
  }
  
  global.TaskoraPages = global.TaskoraPages || {};
  global.TaskoraPages.history = { render };
})(window);
