(function(global){
  // Carregar Chart.js
    const chartScript = document.createElement('script');
    chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    chartScript.onload = function() {
      console.log('Chart.js carregado com sucesso');
    };
    document.head.appendChild(chartScript);
  
  // Variáveis globais do módulo
  let allTasks = [];
  let allClients = [];
  let filteredTasks = [];
  let hoursChart = null;
  let tasksChart = null;
  
  // Elementos dos filtros
  let elStatusFilter, elClientFilter, elOwnerFilter, elDateFromFilter, elDateToFilter, elQuickFilter;
  let currentTab = 'dashboard';
  let tasksPerPage = 20;
  let currentTasksShown = 20;
  
  // Carregar dados do Firebase
  async function loadData() {
    try {
      const { listClients } = await import('../data/clientsRepo.js');
      const { listTasksRaw } = await import('../data/tasksRepo.js');
      
      const [clients, tasks] = await Promise.all([
        listClients(),
        listTasksRaw()
      ]);
      
      allClients = clients;
      allTasks = tasks;
      
      updateMetrics();
      
      console.log('[Insights] Dados carregados com sucesso:', { 
        tasks: allTasks.length, 
        clients: allClients.length
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }
  
  function updateMetrics() {
    // Verificar se há filtros ativos
    const filters = getCurrentFilters();
    const hasActiveFilters = filters.status !== 'all' || filters.client !== 'all' || filters.owner !== 'all' || filters.dateFrom || filters.dateTo || filters.quickFilter !== 'all';
    
    const tasksToUse = hasActiveFilters ? filteredTasks : allTasks;
    const totalTasks = tasksToUse.length;
    
    console.log('[Insights] updateMetrics - tasksToUse:', tasksToUse.length, 'filteredTasks:', filteredTasks.length, 'allTasks:', allTasks.length);
    
    const completedTasks = tasksToUse.filter(task => {
      const normalizedStatus = normalizeStatus(task.status);
      return normalizedStatus === 'concluída';
    }).length;
    // Calcular horas usando o campo hours (decimal) do repositório apenas de tarefas concluídas
    const totalMinutes = tasksToUse.reduce((sum, task) => {
      // Verificar se a tarefa está concluída
      if (normalizeStatus(task.status) === 'concluída') {
        // Usar o campo hours como número decimal (aceita qualquer valor, incluindo 0)
        if (typeof task.hours === 'number') {
          return sum + (task.hours * 60); // converter horas para minutos
        }
      }
      return sum;
    }, 0);
    
    // Arredondar para evitar problemas de precisão decimal
    const roundedTotalMinutes = Math.round(totalMinutes);
    
    // Converter minutos para formato HH:MM
    const hours = Math.floor(roundedTotalMinutes / 60);
    const minutes = roundedTotalMinutes % 60;
    const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Atualizar elementos da UI
    const totalClientsEl = document.querySelector('#totalClients');
    const completedTasksEl = document.querySelector('#completedTasks');
    const productivityEl = document.querySelector('#productivity');
    const avgUsageEl = document.querySelector('#avgUsage');
    
    if (totalClientsEl) totalClientsEl.textContent = totalTasks;
    if (completedTasksEl) completedTasksEl.textContent = completedTasks;
    if (productivityEl) productivityEl.textContent = timeFormatted;
    if (avgUsageEl) avgUsageEl.textContent = completionRate + '%';
    
    // Atualizar gráficos
    updateCharts();
  }
  
  // Função para criar gráfico de pizza (horas por responsável)
  function createHoursChart() {
    const ctx = document.getElementById('hoursChart');
    if (!ctx || !window.Chart) return;
    
    // Destruir gráfico existente se houver
    if (hoursChart) {
      hoursChart.destroy();
    }
    
    const hoursData = getHoursDataByOwner();
    
    hoursChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: hoursData.labels,
        datasets: [{
          data: hoursData.data,
          backgroundColor: [
               '#016B3A', '#B8621B', '#5A5A5A', '#4ECDC4', '#45B7D1',
               '#96CEB4', '#FFEAA7', '#8B4513', '#98D8C8', '#F7DC6F'
             ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const hours = Math.floor(context.parsed / 60);
                const minutes = context.parsed % 60;
                return `${context.label}: ${hours}h ${minutes}m`;
              }
            }
          }
        }
      }
    });
  }
  
  // Função para criar gráfico de barras (tarefas por responsável)
  function createTasksChart() {
    const ctx = document.getElementById('tasksChart');
    if (!ctx || !window.Chart) return;
    
    // Destruir gráfico existente se houver
    if (tasksChart) {
      tasksChart.destroy();
    }
    
    const tasksData = getTasksDataByOwner();
    
    tasksChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: tasksData.labels,
        datasets: [{
             label: 'Número de Tarefas',
             data: tasksData.data,
             backgroundColor: [
               '#016B3A', '#B8621B', '#5A5A5A', '#4ECDC4', '#45B7D1',
               '#96CEB4', '#FFEAA7', '#8B4513', '#98D8C8', '#F7DC6F'
             ],
             borderColor: [
               '#014029', '#8B4513', '#404040', '#3CBCB4', '#3A9BC1',
               '#7FB069', '#FFD93D', '#654321', '#7BC4C4', '#F4D03F'
             ],
             borderWidth: 1,
             borderRadius: 4
           }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed.y} tarefas`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          },
          x: {
            ticks: {
              maxRotation: 45
            }
          }
        }
      }
    });
  }
  
  // Função para obter dados de horas por responsável
  function getHoursDataByOwner() {
    const hoursMap = new Map();
    
    // Verificar se há filtros ativos
    const filters = getCurrentFilters();
    const hasActiveFilters = filters.status !== 'all' || filters.client !== 'all' || filters.owner !== 'all' || filters.dateFrom || filters.dateTo || filters.quickFilter !== 'all';
    
    const tasksToUse = hasActiveFilters ? filteredTasks : allTasks;
    
    // Considerar apenas tarefas concluídas para horas trabalhadas
    const completedTasks = tasksToUse.filter(task => normalizeStatus(task.status) === 'concluída');
    
    completedTasks.forEach(task => {
      const owner = task.owner || 'Sem responsável';
      // Usar a mesma lógica do card: verificar se hours é um número
      if (typeof task.hours === 'number') {
        const minutes = Math.round(task.hours * 60);
        hoursMap.set(owner, (hoursMap.get(owner) || 0) + minutes);
      }
    });
    
    const sortedEntries = Array.from(hoursMap.entries())
      .sort((a, b) => b[1] - a[1]); // Ordenar por horas decrescente
    
    return {
      labels: sortedEntries.map(entry => entry[0]),
      data: sortedEntries.map(entry => entry[1])
    };
  }
  
  // Função para obter dados de tarefas por responsável
  function getTasksDataByOwner() {
    const tasksMap = new Map();
    
    // Verificar se há filtros ativos
    const filters = getCurrentFilters();
    const hasActiveFilters = filters.status !== 'all' || filters.client !== 'all' || filters.owner !== 'all' || filters.dateFrom || filters.dateTo || filters.quickFilter !== 'all';
    
    const tasksToUse = hasActiveFilters ? filteredTasks : allTasks;
    
    tasksToUse.forEach(task => {
      const owner = task.owner || 'Sem responsável';
      tasksMap.set(owner, (tasksMap.get(owner) || 0) + 1);
    });
    
    const sortedEntries = Array.from(tasksMap.entries())
      .sort((a, b) => b[1] - a[1]); // Ordenar por número de tarefas decrescente
    
    return {
      labels: sortedEntries.map(entry => entry[0]),
      data: sortedEntries.map(entry => entry[1])
    };
  }
  
  // Função para obter filtros atuais
    function getCurrentFilters() {
      return {
        status: elStatusFilter ? elStatusFilter.value : 'all',
        client: elClientFilter ? elClientFilter.value : 'all',
        owner: elOwnerFilter ? elOwnerFilter.value : 'all',
        dateFrom: elDateFromFilter ? elDateFromFilter.value : '',
        dateTo: elDateToFilter ? elDateToFilter.value : '',
        quickFilter: elQuickFilter ? elQuickFilter.value : 'all'
      };
    }
    
    // Função para atualizar gráficos
    function updateCharts() {
      // Aguardar Chart.js carregar
      if (window.Chart) {
        createHoursChart();
        createTasksChart();
      } else {
        // Tentar novamente após um pequeno delay
        setTimeout(updateCharts, 100);
      }
    }
  
  function normalizeStatus(status) {
    if (!status) return 'pendente';
    const s = status.toLowerCase().trim();
    
    // Mapeamento de status - COMPATÍVEL COM HISTÓRICO
    const statusMap = {
      'concluida': 'concluída',
      'concluído': 'concluída',
      'concluída': 'concluída',
      'finalizada': 'concluída',
      'finalizado': 'concluída',
      'completa': 'concluída',
      'completo': 'concluída',
      'done': 'concluída',
      'finished': 'concluída',
      'completed': 'concluída',
      'iniciada': 'iniciada',
      'iniciado': 'iniciada',
      'em andamento': 'em progresso',
      'andamento': 'em progresso',
      'em progresso': 'em progresso',
      'progress': 'em progresso',
      'in progress': 'em progresso',
      'working': 'em progresso',
      'active': 'em progresso',
      'não realizada': 'não realizada',
      'nao realizada': 'não realizada',
      'cancelada': 'não realizada',
      'cancelado': 'não realizada',
      'cancelled': 'não realizada',
      'canceled': 'não realizada'
    };
    
    return statusMap[s] || 'pendente';
  }
  
  function getCurrentFilters() {
    return {
      status: elStatusFilter ? elStatusFilter.value : 'all',
      client: elClientFilter ? elClientFilter.value : 'all',
      owner: elOwnerFilter ? elOwnerFilter.value : 'all',
      dateFrom: elDateFromFilter ? elDateFromFilter.value : '',
      dateTo: elDateToFilter ? elDateToFilter.value : '',
      quickFilter: elQuickFilter ? elQuickFilter.value : 'all'
    };
  }
  
  function applyFilters() {
    const filters = getCurrentFilters();
    
    // Reset da paginação ao aplicar filtros
    currentTasksShown = tasksPerPage;
    
    // Começar com todas as tarefas
    let filtered = [...allTasks];
    
    // Filtro por status (com normalização para compatibilidade com dados legados)
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => normalizeStatus(task.status) === filters.status);
    }
    
    // Filtro por cliente - VERSÃO CORRIGIDA (mesma lógica do history.js)
    if (filters.client !== 'all') {
      const selectedClient = allClients.find(c => c.id === filters.client);
      const clientName = selectedClient ? selectedClient.name : filters.client;
      
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
    if (filters.owner !== 'all') {
      filtered = filtered.filter(task => task.owner === filters.owner);
    }
    
    // Filtro por data - usar data de início (date) ou criação como fallback
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(task => {
        // Para insights, filtrar pela data de início (mesma lógica da tabela)
        const taskDate = task.date || task.createdAt;
        if (!taskDate) return false;
        
        const date = new Date(taskDate);
        if (isNaN(date.getTime())) return false;
        
        const dateStr = date.toISOString().split('T')[0];
        
        if (filters.dateFrom && dateStr < filters.dateFrom) return false;
        if (filters.dateTo && dateStr > filters.dateTo) return false;
        
        return true;
      });
    }
    
    filteredTasks = filtered;
    updateMetrics();
    renderTasksTable();
  }
  
  function populateFilterSelects() {
    // Popular filtro de status - MESMOS ELEMENTOS DO HISTÓRICO
    if (elStatusFilter) {
      elStatusFilter.innerHTML = `
        <option value="all">Todos</option>
        <option value="iniciada">Iniciada</option>
        <option value="em progresso">Em progresso</option>
        <option value="concluída">Concluída</option>
        <option value="não realizada">Não realizada</option>
      `;
    }
    
    // Popular filtro de clientes - usando mesma lógica do history.js
    if (elClientFilter && allClients) {
      elClientFilter.innerHTML = '<option value="all">Todos os Clientes</option>';
      allClients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        elClientFilter.appendChild(option);
      });
    }
    
    // Popular filtro de responsáveis
    if (elOwnerFilter && allTasks) {
      elOwnerFilter.innerHTML = '<option value="all">Todos os Responsáveis</option>';
      const owners = [...new Set(allTasks.map(task => task.owner).filter(Boolean))];
      owners.sort().forEach(owner => {
        const option = document.createElement('option');
        option.value = owner;
        option.textContent = owner;
        elOwnerFilter.appendChild(option);
      });
    }
  }
  
  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return 'N/A';
    }
  }
  

  
  function setDates(from, to) {
    // Usar toISOString para consistência com outras páginas
    if (elDateFromFilter) elDateFromFilter.value = from.toISOString().split('T')[0];
    if (elDateToFilter) elDateToFilter.value = to.toISOString().split('T')[0];
  }
  
  function toLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
  
  function switchTab(tabName) {
    currentTab = tabName;
    
    // Atualizar abas ativas
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Atualizar conteúdo baseado na aba
    const contentArea = document.querySelector('.tab-content');
    if (contentArea) {
      contentArea.style.display = tabName === 'dashboard' ? 'block' : 'none';
    }
    
    // Placeholder para outras abas
    if (tabName !== 'dashboard') {
      const placeholder = document.querySelector('.tab-placeholder');
      if (placeholder) {
        placeholder.style.display = 'block';
        placeholder.innerHTML = `
          <div style="text-align: center; padding: 60px; color: #6c757d;">
            <h3>🚧 Aba ${getTabDisplayName(tabName)} em Desenvolvimento</h3>
            <p>Esta funcionalidade será implementada em breve.</p>
          </div>
        `;
      }
    } else {
      const placeholder = document.querySelector('.tab-placeholder');
      if (placeholder) placeholder.style.display = 'none';
    }
  }
  
  function getTabDisplayName(tabName) {
    const names = {
      'dashboard': 'Dashboard',
      'clients': 'Clientes',
      'tasks': 'Tarefas',
      'team': 'Team',
      'usage': 'Uso do App',
      'platforms': 'Plataformas'
    };
    return names[tabName] || tabName;
  }

  // Função formatToBrazilian copiada do dateFormat.js para usar a mesma lógica das outras páginas
  function formatToBrazilian(date) {
    if (!date) return '';
    
    let d;
    
    // Se é um Timestamp do Firestore
    if (date && typeof date.toDate === 'function') {
      d = date.toDate();
    }
    // Se é uma string no formato americano
    else if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}/)) {
      const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!match) return '';
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
    // Se é uma string no formato brasileiro, retorna como está
    else if (typeof date === 'string' && date.match(/^\d{2}\/\d{2}\/\d{4}/)) {
      return date;
    }
    // Se é uma Date ou timestamp numérico
    else if (date instanceof Date || typeof date === 'number') {
      d = new Date(date);
    }
    else {
      return '';
    }
    
    if (isNaN(d)) return '';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
  
  function updateLoadMoreButton(hasMoreTasks, totalTasks) {
     let loadMoreContainer = document.getElementById('loadMoreContainer');
     
     if (!loadMoreContainer) {
       // Criar container do botão se não existir
       loadMoreContainer = document.createElement('div');
       loadMoreContainer.id = 'loadMoreContainer';
       
       const tableContent = document.querySelector('.table-content');
       if (tableContent) {
         tableContent.appendChild(loadMoreContainer);
       }
     }
     
     if (hasMoreTasks) {
       loadMoreContainer.innerHTML = `
         <button id="loadMoreBtn">
           📄 Carregar Mais (${currentTasksShown} de ${totalTasks})
         </button>
       `;
       
       const loadMoreBtn = document.getElementById('loadMoreBtn');
       if (loadMoreBtn) {
         loadMoreBtn.addEventListener('click', loadMoreTasks);
       }
     } else {
       loadMoreContainer.innerHTML = `
         <div class="load-more-info">
           ✅ Mostrando todas as ${totalTasks} tarefas encontradas
         </div>
       `;
     }
   }
  
  function loadMoreTasks() {
    currentTasksShown += tasksPerPage;
    renderTasksTable();
  }
  
  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function statusView(status) {
    const normalizedStatus = normalizeStatus(status);
    const statusMap = {
      'pendente': { class: 'pending', text: 'Pendente' },
      'iniciada': { class: 'active', text: 'Em Andamento' },
      'concluída': { class: 'completed', text: 'Concluída' },
      'cancelada': { class: 'cancelled', text: 'Cancelada' },
      'pausada': { class: 'paused', text: 'Pausada' }
    };
    const statusInfo = statusMap[normalizedStatus] || { class: 'pending', text: normalizedStatus };
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
  }
  
  function clientView(clientData) {
    if (!clientData) return "Cliente não informado";
    
    // Se clientData é string, buscar o cliente na lista
    if (typeof clientData === 'string') {
      const client = allClients.find(c => c.id === clientData || c.name === clientData);
      return client ? client.name : clientData;
    }
    
    // Se é objeto, usar a propriedade name
    return clientData.name || clientData.displayName || "Cliente não informado";
  }
  
  function hoursFmt(hours) {
    if (!hours && hours !== 0) return "—";
    return `${hours}h`;
  }
  
  function renderTasksTable() {
    const tableBody = document.getElementById('tasksTableBody');
    if (!tableBody) return;
    
    // Usar tarefas filtradas ou todas se não há filtros
    const filters = getCurrentFilters();
    const hasActiveFilters = filters.status !== 'all' || filters.client !== 'all' || filters.owner !== 'all' || filters.dateFrom || filters.dateTo || filters.quickFilter !== 'all';
    const tasksToShow = hasActiveFilters ? filteredTasks : allTasks;
    
    // Ordenar tarefas usando a mesma lógica da página de tarefas (campo 'date' em ordem decrescente)
    const sortedTasks = [...tasksToShow].sort((a, b) => {
      // Usar a mesma prioridade de campos da página de tarefas: date > startDate > dueDate
      const dateA = a.date ? new Date(a.date).getTime() : (a.startDate?.getTime?.() ?? a.dueDate?.getTime?.() ?? 0);
      const dateB = b.date ? new Date(b.date).getTime() : (b.startDate?.getTime?.() ?? b.dueDate?.getTime?.() ?? 0);
      return dateB - dateA; // Ordem decrescente: mais recentes primeiro
    });
    
    // Mostrar tarefas baseado na quantidade atual
    const tasksToDisplay = sortedTasks.slice(0, currentTasksShown);
    const hasMoreTasks = sortedTasks.length > currentTasksShown;
    
    if (tasksToDisplay.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px; color: #6c757d;">
            📋 Nenhuma tarefa encontrada com os filtros aplicados
          </td>
        </tr>
      `;
      return;
    }
    
    // Usar a mesma lógica de renderização da página de tarefas
    const rowsHtml = tasksToDisplay.map(task => {
      // Data de criação usando a mesma lógica da página de tarefas
      const dStart = formatToBrazilian(task.date || task.createdAt);
      
      // Renderizar descrição usando as mesmas funções da página de tarefas
      const descriptionHTML = window.renderDescription ? 
        window.renderDescription(task.description, { maxLength: 100, allowHTML: true }) :
        escapeHtml(task.title || task.name || task.description || 'Sem título');
      
      // Converter HTML para texto plano para o hover
      const plainDescription = window.htmlToText ? 
        window.htmlToText(task.description || "") :
        (task.description || task.title || task.name || "");
      
      const ownerName = escapeHtml(task.owner || task.assignedTo || '—');
      
      return `
        <tr>
          <td>${clientView(task.client)}</td>
          <td class="tk-desc" title="${escapeHtml(plainDescription)}">${descriptionHTML}</td>
          <td>${ownerName}</td>
          <td>${statusView(task.status)}</td>
          <td>${dStart || '—'}</td>
        </tr>
      `;
    }).join("");
    
    tableBody.innerHTML = rowsHtml;
    
    // Gerenciar botão "Carregar Mais"
    updateLoadMoreButton(hasMoreTasks, sortedTasks.length);
  }
  
  function render(){
    const container = document.createElement('div');
    container.innerHTML = `
      <style>
        .insights-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .insights-header {
          margin-bottom: 30px;
        }
        
        .insights-title {
          font-size: 28px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 8px 0;
        }
        
        .insights-subtitle {
          color: #666;
          font-size: 16px;
          margin: 0;
        }
        
        /* Topbar simulada */
        .mock-topbar {
          background: #B8621B;
          color: white;
          padding: 15px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .mock-brand {
          font-weight: 800;
          font-size: 18px;
        }
        
        .mock-user {
          font-weight: 500;
          font-size: 11px;
          font-style: italic;
          opacity: 0.8;
        }
        
        .insights-tabs {
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
          padding: 0 20px;
          display: flex;
          gap: 2px;
          overflow-x: auto;
        }
        
        .tab {
          padding: 15px 20px;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #666;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .tab:hover {
          color: #016B3A;
          background: rgba(1, 107, 58, 0.05);
        }
        
        .tab.active {
          color: #016B3A;
          border-bottom-color: #016B3A;
          background: rgba(1, 107, 58, 0.08);
        }
        
        .insights-content {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .metric-card {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
        }
        
        .metric-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }
        
        .metric-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .metric-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        
        .metric-icon.clients { background: rgba(1, 107, 58, 0.1); color: #016B3A; }
        .metric-icon.tasks { background: rgba(184, 98, 27, 0.1); color: #B8621B; }
        .metric-icon.hours { background: rgba(108, 117, 125, 0.1); color: #6c757d; }
        .metric-icon.rate { background: rgba(13, 110, 253, 0.1); color: #0d6efd; }
        
        .metric-title {
          font-weight: 600;
          font-size: 12px;
          color: #6B7280;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: 'Red Hat Display', system-ui, -apple-system, sans-serif;
        }
        
        .metric-value {
          font-size: 32px;
          font-weight: 800;
          color: #014029;
          margin: 0;
          font-family: 'Red Hat Display', system-ui, -apple-system, sans-serif;
          line-height: 1;
        }
        
        /* Filtros */
        .insights-filters {
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
          padding: 15px 20px;
          display: flex;
          gap: 15px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .filter-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #666;
        }
        
        .filter-select {
          height: 32px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 0 10px;
          font-size: 12px;
          color: #333;
          min-width: 120px;
        }
        
        .filter-select:focus {
          outline: none;
          border-color: #016B3A;
        }
        
        .tab-placeholder {
          display: none;
        }
        
        /* Tabela de dados */
        .data-table {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          margin-top: 30px;
        }
        
        .table-header {
          background: #f8f9fa;
          padding: 20px 25px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .table-title {
          font-weight: 600;
          font-size: 16px;
          color: #333;
          margin: 0;
        }
        
        .table-content {
          padding: 25px;
        }
        
        .tasks-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        
        .tasks-table th {
          text-align: center;
          padding: 12px 8px;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #666;
          border-bottom: 2px solid #e9ecef;
        }
        
        .tasks-table th:nth-child(1) { width: 20%; } /* Cliente */
        .tasks-table th:nth-child(2) { width: 35%; } /* Tarefa */
        .tasks-table th:nth-child(3) { width: 20%; } /* Responsável */
        .tasks-table th:nth-child(4) { width: 15%; } /* Status */
        .tasks-table th:nth-child(5) { width: 10%; } /* Data */
        
        .tasks-table td {
          padding: 15px 8px;
          border-bottom: 1px solid #f1f3f4;
          color: #333;
          text-align: center;
          vertical-align: middle;
          word-wrap: break-word;
        }
        
        .tasks-table td:nth-child(2) {
          text-align: left;
          padding-left: 12px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-badge.active { background: rgba(25, 135, 84, 0.1); color: #198754; }
        .status-badge.pending { background: rgba(255, 193, 7, 0.1); color: #f57c00; }
        .status-badge.completed { background: rgba(1, 107, 58, 0.1); color: #016B3A; }
        .status-badge.cancelled { background: rgba(220, 53, 69, 0.1); color: #dc3545; }
        .status-badge.paused { background: rgba(108, 117, 125, 0.1); color: #6c757d; }
        
        /* Estilos do botão Carregar Mais */
        #loadMoreContainer {
          text-align: center;
          padding: 20px;
          border-top: 1px solid #e9ecef;
          background: #f8f9fa;
        }
        
        #loadMoreBtn {
          background: #016B3A;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        
        #loadMoreBtn:hover {
          background: #014029;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(1, 107, 58, 0.2);
        }
        
        .load-more-info {
          color: #6c757d;
          font-size: 14px;
          font-style: italic;
          margin: 0;
        }
        
        /* Estilos dos gráficos */
        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .chart-container {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #e9ecef;
        }
        
        .chart-title {
          margin: 0 0 20px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          text-align: center;
        }
        
        .chart-content {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }
        
        .chart-content canvas {
          max-width: 100%;
          height: auto;
        }
        
        @media (max-width: 768px) {
          .insights-container {
            padding: 15px;
          }
          
          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 15px;
            padding: 20px;
          }
          
          .filters-grid {
            grid-template-columns: 1fr;
          }
          
          .insights-tabs {
            gap: 4px;
          }
          
          .tab {
            padding: 10px 16px;
            font-size: 13px;
          }
          
          .charts-grid {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .chart-container {
            padding: 15px;
          }
          
          .chart-content {
            min-height: 250px;
          }
        }
      </style>
      
      <div class="insights-container">
        <!-- Topbar simulada -->
        <div class="mock-topbar">
          <div class="mock-brand">Dácora - <span id="current-tab-name">Dashboard</span></div>
          <div class="mock-user">Powered by Taskora</div>
        </div>
        
        <!-- Abas de navegação -->
        <div class="insights-tabs">
          <button class="tab active" data-tab="dashboard">📈 Dashboard</button>
          <button class="tab" data-tab="clients">👥 Clientes</button>
          <button class="tab" data-tab="tasks">✅ Tarefas</button>
          <button class="tab" data-tab="team">👨‍💼 Team</button>
          <button class="tab" data-tab="usage">📱 Uso do App</button>
          <button class="tab" data-tab="platforms">🌐 Plataformas</button>
        </div>
        
        <!-- Filtros -->
        <div class="insights-filters">
          <div class="filter-group">
            <label class="filter-label">Status</label>
            <select id="statusFilter" class="filter-select">
              <option value="all">Todos os Status</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Cliente</label>
            <select id="clientFilter" class="filter-select">
              <option value="all">Todos os Clientes</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Responsável</label>
            <select id="ownerFilter" class="filter-select">
              <option value="all">Todos os Responsáveis</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Intervalo rápido</label>
            <select id="quickFilter" class="filter-select">
              <option value="custom">Personalizado</option>
              <option value="today">Hoje</option>
              <option value="yesterday">Ontem</option>
              <option value="last7">Últimos 7 dias</option>
              <option value="last30" selected>Últimos 30 dias</option>
              <option value="thisMonth">Este mês</option>
              <option value="prevMonth">Mês anterior</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Data Início</label>
            <input type="date" id="dateFromFilter" class="filter-select">
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Data Fim</label>
            <input type="date" id="dateToFilter" class="filter-select">
          </div>
        </div>
       
       <!-- Conteúdo principal -->
       <div class="insights-content">
         <!-- Conteúdo da aba Dashboard -->
         <div class="tab-content">
           <!-- Grid de métricas -->
           <div class="metrics-grid">
             <div class="metric-card">
               <div class="metric-header">
                 <div class="metric-icon tasks">📋</div>
                 <h3 class="metric-title">Total Geral de Tarefas</h3>
               </div>
               <div class="metric-value" id="totalClients">0</div>
             </div>
             
             <div class="metric-card">
               <div class="metric-header">
                 <div class="metric-icon tasks">✅</div>
                 <h3 class="metric-title">Tarefas Concluídas</h3>
               </div>
               <div class="metric-value" id="completedTasks">0</div>
             </div>
             
             <div class="metric-card">
               <div class="metric-header">
                 <div class="metric-icon hours">⏱️</div>
                 <h3 class="metric-title">Horas Trabalhadas (Tarefas Concluídas)</h3>
               </div>
               <div class="metric-value" id="productivity">0h</div>
             </div>
             
             <div class="metric-card">
               <div class="metric-header">
                 <div class="metric-icon rate">📊</div>
                 <h3 class="metric-title">Taxa de Conclusão</h3>
               </div>
               <div class="metric-value" id="avgUsage">0%</div>
             </div>
           </div>
           
           <!-- Grid de gráficos -->
           <div class="charts-grid">
             <div class="chart-container">
               <h3 class="chart-title">📊 Horas Trabalhadas por Responsável</h3>
               <div class="chart-content">
                 <canvas id="hoursChart" width="400" height="400"></canvas>
               </div>
             </div>
             
             <div class="chart-container">
               <h3 class="chart-title">📈 Número de Tarefas por Responsável</h3>
               <div class="chart-content">
                 <canvas id="tasksChart" width="400" height="400"></canvas>
               </div>
             </div>
           </div>
           
           <!-- Tabela de dados -->
           <div class="data-table">
             <div class="table-header">
               <h3 class="table-title">📋 Últimas Atividades</h3>
             </div>
             <div class="table-content">
               <table class="tasks-table">
                 <thead>
                   <tr>
                     <th>Cliente</th>
                     <th>Tarefa</th>
                     <th>Responsável</th>
                     <th>Status</th>
                     <th>Data</th>
                   </tr>
                 </thead>
                 <tbody id="tasksTableBody">
                   <!-- Dados serão inseridos aqui dinamicamente -->
                 </tbody>
               </table>
             </div>
           </div>
         </div>
         
         <!-- Placeholder para outras abas -->
         <div class="tab-placeholder"></div>
       </div>
     `;
     
     // Event listeners para as abas
     container.querySelectorAll('.tab').forEach(tab => {
       tab.addEventListener('click', () => {
         const tabName = tab.getAttribute('data-tab');
         
         // Atualizar nome da aba no cabeçalho
         const tabText = tab.textContent.replace(/^[📈👥✅👨‍💼📱🌐]\s+/, '').trim(); // Remove emoji e espaços
         const currentTabNameEl = document.getElementById('current-tab-name');
         if (currentTabNameEl) {
           currentTabNameEl.textContent = tabText;
         }
         
         switchTab(tabName);
       });
     });
     
     // Carregar dados primeiro
     loadData().then(() => {
       // Inicializar elementos dos filtros após carregar dados
       setTimeout(() => {
         elStatusFilter = document.getElementById('statusFilter');
         elClientFilter = document.getElementById('clientFilter');
         elOwnerFilter = document.getElementById('ownerFilter');
         elDateFromFilter = document.getElementById('dateFromFilter');
         elDateToFilter = document.getElementById('dateToFilter');
         elQuickFilter = document.getElementById('quickFilter');
         
         // Popular os filtros após inicializar elementos
         populateFilterSelects();
         
         // Aplicar filtros iniciais e renderizar tabela
         applyFilters();
         updateMetrics();
         
         // Inicializar gráficos após um pequeno delay
         setTimeout(() => {
           updateCharts();
         }, 500);
         
         // Event listeners para os filtros
         if (elStatusFilter) {
           elStatusFilter.addEventListener('change', () => {
             applyFilters();
             updateMetrics();
           });
         }
         
         if (elClientFilter) {
           elClientFilter.addEventListener('change', () => {
             applyFilters();
             updateMetrics();
           });
         }
         
         if (elOwnerFilter) {
           elOwnerFilter.addEventListener('change', () => {
             applyFilters();
             updateMetrics();
           });
         }
         
         if (elDateFromFilter) {
           elDateFromFilter.addEventListener('change', () => {
             if (elQuickFilter) elQuickFilter.value = 'custom';
             applyFilters();
             updateMetrics();
           });
         }
         
         if (elDateToFilter) {
           elDateToFilter.addEventListener('change', () => {
             if (elQuickFilter) elQuickFilter.value = 'custom';
             applyFilters();
             updateMetrics();
           });
         }
         
         if (elQuickFilter) {
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
               updateMetrics();
             }
           });
         }
       }, 100);
     });
     
     return container;
   }
   
   global.TaskoraPages = global.TaskoraPages || {};
   global.TaskoraPages.insights = { render };
 })(window);