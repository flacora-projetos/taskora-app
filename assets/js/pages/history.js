// assets/js/pages/history.js
import { listClients } from '../data/clientsRepo.js';
import { listTasksRaw } from '../data/tasksRepo.js';

(function(global) {
  // Variáveis globais do módulo
  let elPageTitle, elStatsGrid, elFiltersPanel, elTimeline;
  let elTotalTasks, elCompletedTasks, elTotalHours, elCompletionRate;
  let elStatusFilter, elClientFilter, elOwnerFilter;
  let elDateFromFilter, elDateToFilter, elQuickFilter;
  let allClients = [];
  let allTasks = [];
  let selectedClient = null;
  let filteredTasks = [];

  // Utilitários
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
  
  // Normalização de status para compatibilidade com dados legados
  function normalizeStatus(status) {
    if (!status) return '';
    const statusStr = status.toString().toLowerCase();
    
    // Mapeamento de valores legados para valores atuais
    const legacyMapping = {
      'nao_realizada': 'não realizada',  // Status legado NAO_REALIZADA mantém como não realizada
      'em_progresso': 'em progresso', 
      'concluida': 'concluída',
      'cancelada': 'não realizada',  // Status legado CANCELADA mapeia para não realizada
      'iniciadas': 'iniciada'  // Apenas INICIADAS mapeia para iniciada
    };
    
    // Verificar se é um valor legado
    if (legacyMapping[statusStr]) {
      return legacyMapping[statusStr];
    }
    
    // Retornar valor original se já estiver no formato atual
    return status;
  }
  
  function getStatusColor(status) {
    const normalizedStatus = normalizeStatus(status);
    const colors = {
      'concluída': { bg: '#DCFCE7', fg: '#166534', bd: '#BBF7D0' },
      'em progresso': { bg: '#DBEAFE', fg: '#1E40AF', bd: '#BFDBFE' },
      'iniciada': { bg: '#FEF3C7', fg: '#92400E', bd: '#FDE68A' },
      'não realizada': { bg: '#FEE2E2', fg: '#DC2626', bd: '#FECACA' },
      'cancelada': { bg: '#F3F4F6', fg: '#6B7280', bd: '#E5E7EB' }
    };
    return colors[normalizedStatus] || { bg: '#F3F4F6', fg: '#6B7280', bd: '#E5E7EB' };
  }
  
  function translatePriority(priority) {
    const translations = {
      'low': 'baixa',
      'medium': 'média', 
      'high': 'alta',
      'urgent': 'urgente'
    };
    return translations[priority?.toLowerCase()] || priority || 'média';
  }
  
  function getPriorityColor(priority) {
    const translatedPriority = translatePriority(priority);
    const colors = {
      'alta': { bg: '#FEE2E2', fg: '#DC2626', bd: '#FECACA' },
      'urgente': { bg: '#FEE2E2', fg: '#DC2626', bd: '#FECACA' },
      'média': { bg: '#FEF3C7', fg: '#92400E', bd: '#FDE68A' },
      'baixa': { bg: '#DCFCE7', fg: '#166534', bd: '#BBF7D0' }
    };
    return colors[translatedPriority] || { bg: '#F3F4F6', fg: '#6B7280', bd: '#E5E7EB' };
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
        .hs-task-dot.not-done { background: #EF4444; border-color: #EF4444 }
        
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
           <!-- Seletor principal removido - usando apenas filtro global -->
         </div>
        
        <div class="hs-stats-grid" id="statsGrid" style="display: none;">
          <div class="hs-stat-card">
            <div class="hs-stat-number" id="totalTasks">0</div>
            <div class="hs-stat-label">Total Geral de Tarefas</div>
          </div>
          <div class="hs-stat-card">
            <div class="hs-stat-number" id="completedTasks">0</div>
            <div class="hs-stat-label">Concluídas</div>
          </div>
          <div class="hs-stat-card">
            <div class="hs-stat-number" id="totalHours">0h</div>
            <div class="hs-stat-label">Horas Trabalhadas (Tarefas Concluídas)</div>
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
    
    // Inicializar elementos
    elPageTitle = root.querySelector('#pageTitle');
    elStatsGrid = root.querySelector('#statsGrid');
    elFiltersPanel = root.querySelector('#filtersPanel');
    elTimeline = root.querySelector('#timeline');
    elTotalTasks = root.querySelector('#totalTasks');
    elCompletedTasks = root.querySelector('#completedTasks');
    elTotalHours = root.querySelector('#totalHours');
    elCompletionRate = root.querySelector('#completionRate');
    elStatusFilter = root.querySelector('#statusFilter');
    elClientFilter = root.querySelector('#clientFilter');
    elOwnerFilter = root.querySelector('#ownerFilter');
    elDateFromFilter = root.querySelector('#dateFromFilter');
    elDateToFilter = root.querySelector('#dateToFilter');
    elQuickFilter = root.querySelector('#quickFilter');
    
    // Carregar dados iniciais
    async function loadData() {
      try {
        elTimeline.innerHTML = '<div class="hs-loading">Carregando dados...</div>';
        
        const [clients, tasks] = await Promise.all([
          listClients(),
          listTasksRaw()
        ]);
        
        allClients = clients;
        allTasks = tasks;
        
        populateFilterSelects();
        
        // Inicializar com todas as tarefas
        loadAllTasks();
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        elTimeline.innerHTML = '<div class="hs-timeline-empty">Erro ao carregar dados. Tente novamente.</div>';
      }
    }
    
    // Função removida - usando apenas filtro global
    
    function populateFilterSelects() {
      // Popular filtro de clientes
      elClientFilter.innerHTML = '<option value="all">Todos</option>';
      allClients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
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
    
    // Função removida - usando apenas filtro global de clientes
    
    function loadAllTasks() {
      // Mostrar painel de filtros e estatísticas
      elStatsGrid.style.display = 'grid';
      elFiltersPanel.style.display = 'block';
      
      // Carregar todas as tarefas e aplicar filtros
      filteredTasks = [...allTasks];
      applyFilters();
      updateStats();
      renderTimeline();
      updatePageTitle();
    }
    
    function applyFilters() {
      // Começar com todas as tarefas
      let filtered = [...allTasks];
      
      // Filtro por status (com normalização para compatibilidade com dados legados)
      if (elStatusFilter.value !== 'all') {
        filtered = filtered.filter(task => normalizeStatus(task.status) === elStatusFilter.value);
      }
      
      // Filtro por cliente - VERSÃO CORRIGIDA
      if (elClientFilter.value !== 'all') {
        const selectedClient = allClients.find(c => c.id === elClientFilter.value);
        const clientName = selectedClient ? selectedClient.name : elClientFilter.value;
        
        console.log('🎯 [FILTRO] Cliente selecionado:', clientName);
        console.log('🎯 [FILTRO] Total de tarefas antes do filtro:', filtered.length);
        
        filtered = filtered.filter(task => {
          if (!task.client) {
            console.log('❌ [FILTRO] Tarefa sem cliente:', task.title);
            return false;
          }
          
          if (!clientName) {
            console.log('❌ [FILTRO] Nome do cliente não encontrado');
            return false;
          }
          
          // Múltiplas estratégias de comparação
          const taskClient = task.client;
          
          // 1. Correspondência exata
          if (taskClient === clientName) {
            console.log('✅ [FILTRO] Match exato:', task.title, '|', taskClient);
            return true;
          }
          
          // 2. Correspondência case-insensitive
          if (taskClient.toLowerCase() === clientName.toLowerCase()) {
            console.log('✅ [FILTRO] Match case-insensitive:', task.title, '|', taskClient);
            return true;
          }
          
          // 3. Correspondência com normalização de espaços
          const taskClientNorm = taskClient.trim().replace(/\s+/g, ' ');
          const clientNameNorm = clientName.trim().replace(/\s+/g, ' ');
          
          if (taskClientNorm.toLowerCase() === clientNameNorm.toLowerCase()) {
            console.log('✅ [FILTRO] Match normalizado:', task.title, '|', taskClient, '->', taskClientNorm);
            return true;
          }
          
          // 4. Correspondência parcial (contém)
          if (taskClient.toLowerCase().includes(clientName.toLowerCase()) || 
              clientName.toLowerCase().includes(taskClient.toLowerCase())) {
            console.log('✅ [FILTRO] Match parcial:', task.title, '|', taskClient);
            return true;
          }
          
          console.log('❌ [FILTRO] Sem match:', task.title, '|', `"${taskClient}" ≠ "${clientName}"`);
          return false;
        });
        
        console.log('🎯 [FILTRO] Total de tarefas após filtro:', filtered.length);
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
      const completed = filteredTasks.filter(t => normalizeStatus(t.status) === 'concluída').length;
      
      // Calcular horas usando o campo hours (decimal) do repositório apenas de tarefas concluídas
      const totalMinutes = filteredTasks.reduce((sum, t) => {
        // Verificar se a tarefa está concluída
        if (normalizeStatus(t.status) === 'concluída') {
          // Usar o campo hours como número decimal (aceita qualquer valor, incluindo 0)
          if (typeof t.hours === 'number') {
            return sum + (t.hours * 60); // converter horas para minutos
          }
        }
        return sum;
      }, 0);
      
      // Arredondar para evitar problemas de precisão decimal
      const roundedTotalMinutes = Math.round(totalMinutes);
      
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // Converter minutos para formato HH:MM
      const hours = Math.floor(roundedTotalMinutes / 60);
      const minutes = roundedTotalMinutes % 60;
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
          
          const normalizedStatus = normalizeStatus(task.status);
          let dotClass = 'hs-task-dot';
          if (normalizedStatus === 'concluída') dotClass += ' completed';
          else if (normalizedStatus === 'em progresso') dotClass += ' in-progress';
          else if (normalizedStatus === 'não realizada') dotClass += ' not-done';
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
                          ${translatePriority(task.priority)}
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
    
    // Event listeners para filtros globais
    
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
    
    // Escutar mudanças dos filtros globais
    if (window.TaskoraFilters && typeof window.TaskoraFilters.on === 'function') {
      window.TaskoraFilters.on((state, evt) => {
        if (evt?.type === 'apply') {
          console.log('🔄 TaskoraFilters aplicado, atualizando filtros locais:', state);
          
          // Sincronizar filtros locais com os globais
          if (state.client && state.client !== 'all' && elClientFilter) {
            elClientFilter.value = state.client;
          }
          if (state.status && state.status !== 'all' && elStatusFilter) {
            elStatusFilter.value = state.status;
          }
          if (state.owner && state.owner !== 'all' && elOwnerFilter) {
            elOwnerFilter.value = state.owner;
          }
          if (state.dateFrom && elDateFromFilter) {
            elDateFromFilter.value = state.dateFrom;
          }
          if (state.dateTo && elDateToFilter) {
            elDateToFilter.value = state.dateTo;
          }
          
          // Reaplicar filtros
          applyFilters();
          updateStats();
          renderTimeline();
          updatePageTitle();
        }
      });
    }
    
    return root;
  }
  
  // Função global para selecionar cliente (pode ser chamada de outras páginas)
  async function selectClientById(clientId) {
    console.log('🎯 selectClientById chamada com:', clientId);
    
    // Aguardar dados serem carregados se necessário
    if (!allClients || allClients.length === 0) {
      console.log('⏳ Aguardando carregamento dos dados...');
      let attempts = 0;
      while ((!allClients || allClients.length === 0) && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
    }
    
    if (elClientFilter && allClients.length > 0) {
      const client = allClients.find(c => c.id === clientId);
      if (client) {
        console.log('✅ Cliente encontrado:', client.name);
        
        // Definir filtro de cliente e aplicar
        elClientFilter.value = client.id;
        
        // Mostrar painel de filtros e estatísticas
        elStatsGrid.style.display = 'grid';
        elFiltersPanel.style.display = 'block';
        
        // Inicializar filtro rápido com "Últimos 30 dias"
        elQuickFilter.value = 'last30';
        setDates(addDays(today(), -29), today());
        
        // Aplicar filtros
        applyFilters();
        updateStats();
        renderTimeline();
        updatePageTitle();
        
        console.log('📋 Cliente selecionado na página de histórico:', client.name);
        return true;
      } else {
        console.error('❌ Cliente não encontrado com ID:', clientId);
        console.log('📋 Clientes disponíveis:', allClients.map(c => ({id: c.id, name: c.name})));
        return false;
      }
    } else {
      console.error('❌ Filtro não disponível ou clientes não carregados');
      return false;
    }
  }

  global.TaskoraPages = global.TaskoraPages || {};
  global.TaskoraPages.history = { render, selectClientById };
})(window);
