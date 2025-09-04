// insights.js - Módulo de insights e relatórios
// Segue padrão visual da Dácora e estrutura dos outros módulos

import { showToast } from "../utils/toast.js";
import { formatCurrency, formatDate, roundToDecimals } from "../utils/formatters.js";

(function (global) {
  "use strict";

  // Estado do módulo
  let currentFilters = {};
  let isLoading = false;

  // Elementos DOM
  let elInsightsContainer, elFilters, elContent;

  /**
   * Renderiza o módulo Insights
   */
  function render() {
    const container = document.createElement('div');
    container.id = 'insights-container';
    
    container.innerHTML = `
      <style>
        /* Estilos específicos do módulo Insights */
        /* Container removido - usando estrutura padrão da aplicação */
        .in-sticky-section { position: sticky; top: 75px; z-index: 10; background: #F8F9FA; padding: 32px 32px 20px 32px; border-bottom: 2px solid #E4E7E4; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .in-content-section { position: relative; overflow: auto; padding: 0 32px 32px 32px; }
        
        /* Título */
        .in-header { margin-bottom: 24px; }
        .in-header h2 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #014029; text-transform: uppercase; font-family: system-ui, -apple-system, sans-serif; }
        
        /* Filtros exclusivos do Insights */
        .in-filters-bar { background: #F8F9FA; border: 1px solid #E4E7E4; padding: 16px 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .in-filters-form { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
        .in-filters-group { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
        .in-filter-field { display: flex; flex-direction: column; gap: 4px; }
        .in-filter-label { font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; }
        .in-filter-select, .in-filter-input { padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 13px; background: white; min-width: 120px; }
        .in-filter-select:focus, .in-filter-input:focus { outline: none; border-color: #014029; box-shadow: 0 0 0 2px rgba(1,64,41,0.1); }
        .in-filter-button { padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 13px; background: #F3F4F6; color: #374151; min-width: 120px; cursor: pointer; transition: all 0.2s; }
        .in-filter-button:hover { background: #E5E7EB; border-color: #9CA3AF; }
        .in-filters-actions { display: flex; gap: 8px; align-items: flex-end; padding-bottom: 0; }
        .in-btn-primary { background: #014029; color: white; padding: 8px 16px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .in-btn-primary:hover { background: #025a35; transform: translateY(-1px); }
        .in-btn-secondary { background: #F3F4F6; color: #374151; padding: 8px 16px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .in-btn-secondary:hover { background: #E5E7EB; }
        
        /* Cards de estatísticas */
        .in-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .in-stat-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 20px; border: 1px solid #E4E7E4; }
        .in-stat-title { font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .in-stat-value { font-size: 24px; font-weight: 800; color: #014029; margin-bottom: 4px; }
        .in-stat-change { font-size: 12px; color: #6B7280; }
        
        /* Gráficos e conteúdo */
        .in-content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .in-chart-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 24px; border: 1px solid #E4E7E4; }
        .in-chart-title { font-size: 16px; font-weight: 600; color: #1F2937; margin-bottom: 16px; }
        .in-chart-placeholder { height: 300px; background: #F8F9FA; border: 2px dashed #D1D5DB; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #6B7280; font-style: italic; }
        
        /* Loading */
        .in-loading { text-align: center; padding: 40px; color: #64748B; }
        
        /* Responsividade */
        @media (max-width: 768px) {
          .in-content-grid { grid-template-columns: 1fr; }
          .in-stats-grid { grid-template-columns: 1fr; }
        }
      </style>

      <div>
        <!-- Área Sticky -->
        <div class="in-sticky-section">
          <!-- Título -->
          <div class="in-header">
            <h2>INSIGHTS DÁCORA</h2>
          </div>
          
          <!-- Filtros Exclusivos do Insights -->
          <div class="in-filters-bar">
            <div class="in-filters-form">
              <div class="in-filters-group">
                <div class="in-filter-field">
                  <label class="in-filter-label">Período</label>
                  <select id="in-period-filter" class="in-filter-select">
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d" selected>Últimos 30 dias</option>
                    <option value="90d">Últimos 90 dias</option>
                    <option value="1y">Último ano</option>
                  </select>
                </div>
                <div class="in-filter-field">
                  <label class="in-filter-label">Métrica</label>
                  <select id="in-metric-filter" class="in-filter-select">
                    <option value="all">Todas</option>
                    <option value="clients">Clientes</option>
                    <option value="tasks">Tarefas</option>
                    <option value="team">Equipe</option>
                  </select>
                </div>
                <div class="in-filter-field">
                  <label class="in-filter-label">&nbsp;</label>
                  <button id="in-clear-filters" class="in-filter-button">🗑 Limpar</button>
                </div>
              </div>
              <div class="in-filters-actions">
                <button id="in-btn-export" class="in-btn-secondary">📊 Exportar</button>
                <button id="in-btn-refresh" class="in-btn-primary">🔄 Atualizar</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Conteúdo Principal -->
        <div class="in-content-section">
          <!-- Cards de Estatísticas -->
          <div class="in-stats-grid">
            <div class="in-stat-card">
              <div class="in-stat-title">Total de Clientes</div>
              <div class="in-stat-value" id="in-total-clients">-</div>
              <div class="in-stat-change" id="in-clients-change">Carregando...</div>
            </div>
            <div class="in-stat-card">
              <div class="in-stat-title">Tarefas Concluídas</div>
              <div class="in-stat-value" id="in-completed-tasks">-</div>
              <div class="in-stat-change" id="in-tasks-change">Carregando...</div>
            </div>
            <div class="in-stat-card">
              <div class="in-stat-title">Membros Ativos</div>
              <div class="in-stat-value" id="in-active-members">-</div>
              <div class="in-stat-change" id="in-members-change">Carregando...</div>
            </div>
            <div class="in-stat-card">
              <div class="in-stat-title">Receita Total</div>
              <div class="in-stat-value" id="in-total-revenue">-</div>
              <div class="in-stat-change" id="in-revenue-change">Carregando...</div>
            </div>
          </div>
          
          <!-- Gráficos -->
          <div class="in-content-grid">
            <div class="in-chart-card">
              <div class="in-chart-title">Evolução de Clientes</div>
              <div class="in-chart-placeholder">Gráfico será implementado em breve</div>
            </div>
            <div class="in-chart-card">
              <div class="in-chart-title">Performance da Equipe</div>
              <div class="in-chart-placeholder">Gráfico será implementado em breve</div>
            </div>
            <div class="in-chart-card">
              <div class="in-chart-title">Distribuição de Tarefas</div>
              <div class="in-chart-placeholder">Gráfico será implementado em breve</div>
            </div>
            <div class="in-chart-card">
              <div class="in-chart-title">Receita por Período</div>
              <div class="in-chart-placeholder">Gráfico será implementado em breve</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Inicializar após renderizar
    setTimeout(() => {
      initInsightsModule(container);
    }, 100);
    
    return container;
  }

  /**
   * Inicializa o módulo Insights após renderização
   */
  function initInsightsModule(container) {
    // Elementos DOM
    elInsightsContainer = container;
    elFilters = container.querySelector('.in-filters-bar');
    elContent = container.querySelector('.in-content-section');

    // Event listeners
    setupEventListeners();
    
    // Carregar dados iniciais
    loadInsightsData();
  }

  /**
   * Configura event listeners
   */
  function setupEventListeners() {
    // Filtros
    const periodFilter = elInsightsContainer.querySelector('#in-period-filter');
    const metricFilter = elInsightsContainer.querySelector('#in-metric-filter');
    const clearFilters = elInsightsContainer.querySelector('#in-clear-filters');
    const refreshBtn = elInsightsContainer.querySelector('#in-btn-refresh');
    const exportBtn = elInsightsContainer.querySelector('#in-btn-export');

    if (periodFilter) {
      periodFilter.addEventListener('change', () => {
        currentFilters.period = periodFilter.value;
        loadInsightsData();
      });
    }

    if (metricFilter) {
      metricFilter.addEventListener('change', () => {
        currentFilters.metric = metricFilter.value;
        loadInsightsData();
      });
    }

    if (clearFilters) {
      clearFilters.addEventListener('click', () => {
        clearAllFilters();
      });
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        loadInsightsData();
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        showToast('Funcionalidade de exportação será implementada em breve', 'info');
      });
    }
  }

  /**
   * Carrega dados dos insights
   */
  function loadInsightsData() {
    if (isLoading) return;
    
    isLoading = true;
    
    // Simular carregamento de dados
    setTimeout(() => {
      // Dados mockados para demonstração
      updateStatsCards({
        totalClients: 45,
        completedTasks: 128,
        activeMembers: 8,
        totalRevenue: 125000
      });
      
      isLoading = false;
    }, 1000);
  }

  /**
   * Atualiza os cards de estatísticas
   */
  function updateStatsCards(data) {
    const totalClientsEl = elInsightsContainer.querySelector('#in-total-clients');
    const completedTasksEl = elInsightsContainer.querySelector('#in-completed-tasks');
    const activeMembersEl = elInsightsContainer.querySelector('#in-active-members');
    const totalRevenueEl = elInsightsContainer.querySelector('#in-total-revenue');
    
    const clientsChangeEl = elInsightsContainer.querySelector('#in-clients-change');
    const tasksChangeEl = elInsightsContainer.querySelector('#in-tasks-change');
    const membersChangeEl = elInsightsContainer.querySelector('#in-members-change');
    const revenueChangeEl = elInsightsContainer.querySelector('#in-revenue-change');

    if (totalClientsEl) totalClientsEl.textContent = data.totalClients;
    if (completedTasksEl) completedTasksEl.textContent = data.completedTasks;
    if (activeMembersEl) activeMembersEl.textContent = data.activeMembers;
    if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(data.totalRevenue);
    
    // Simular mudanças percentuais
    if (clientsChangeEl) clientsChangeEl.textContent = '+12% vs período anterior';
    if (tasksChangeEl) tasksChangeEl.textContent = '+8% vs período anterior';
    if (membersChangeEl) membersChangeEl.textContent = 'Sem alteração';
    if (revenueChangeEl) revenueChangeEl.textContent = '+15% vs período anterior';
  }

  /**
   * Limpa todos os filtros
   */
  function clearAllFilters() {
    currentFilters = {};
    
    const periodFilter = elInsightsContainer.querySelector('#in-period-filter');
    const metricFilter = elInsightsContainer.querySelector('#in-metric-filter');
    
    if (periodFilter) periodFilter.value = '30d';
    if (metricFilter) metricFilter.value = 'all';
    
    loadInsightsData();
    showToast('Filtros limpos', 'success');
  }

  // Exportar funções públicas
  global.TaskoraPages = global.TaskoraPages || {};
  global.TaskoraPages.insights = { 
    render: () => {
      const container = render();
      return container;
    }
  };

})(window);
