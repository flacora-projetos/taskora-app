// team.js - Módulo de gestão da equipe
// Segue padrão visual da Dácora e estrutura dos outros módulos

import { 
  listTeamMembers, 
  createTeamMember, 
  updateTeamMember, 
  deleteTeamMember, 
  getTeamStats,
  searchTeamMembers,
  calculateMemberHours,
  updateMemberStats,
  updateAllMembersHours,
  TEAM_SPECIALTIES,
  TEAM_LEVELS,
  TEAM_STATUS
} from "../data/teamRepo.js";

import { EventBus } from "../utils/eventBus.js";
import { showToast } from "../utils/toast.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";

(function (global) {
  "use strict";

  // Estado do módulo
  let allMembers = [];
  let filteredMembers = [];
  let currentFilters = {};
  let isLoading = false;

  // Paginação
  const PAGE_SIZE = 20;
  let currentPage = 0;

  // Elementos DOM
  let elMembersList, elStatsCards, elFilters, elSearchInput;
  let elTotalMembers, elActiveMembers, elAvgRate, elTotalHours;

  /**
   * Renderiza o módulo Team
   */
  function render() {
    const container = document.createElement('div');
    container.id = 'team-container';
    
    container.innerHTML = `
      <style>
        /* Estilos específicos do módulo Team */
        .tm-container { max-width: 1400px; margin: 0 auto; padding: 0; }
        .tm-sticky { position: sticky; top: 40px; z-index: 10; background: transparent; padding: 32px 32px 0 32px; }
        .tm-content-section { position: relative; overflow: auto; padding: 0 32px 32px 32px; }
        
        /* Tabela unificada */
        .tm-table-container { 
          background: #FFFFFF; 
          border: 1px solid #E4E7E4;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .tm-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .tm-table-header th { text-align: center; font-weight: 900; font-size: 12px; color: #334155; padding: 12px 10px; letter-spacing: 0.2px; background: #F8F9FA; border: none; border-bottom: 1px solid #E4E7E4; }
        .tm-table tbody tr { border-bottom: 1px solid #F1F5F9; }
        .tm-table tbody tr:last-child { border-bottom: none; }
        .tm-loading { text-align: center; padding: 40px; color: #6B7280; font-style: italic; }
        .tm-empty { text-align: center; padding: 40px; }
        .tm-empty p { margin-bottom: 16px; color: #6B7280; }
        .tm-cell { padding: 12px 10px; vertical-align: middle; border: none; }

        
        .tm-row{ box-shadow:0 1px 1px rgba(0,0,0,.03), 0 6px 16px rgba(0,0,0,.03) }
        .tm-cell{ background:#fff; border:1px solid #EEE; padding:10px 12px; vertical-align:middle; overflow:hidden; }
        .tm-table{ width:100%; table-layout:fixed; border-collapse:separate; border-spacing:0; }
        
        /* Larguras das colunas */
        .col-photo{ width:80px }
        .col-name{ width:200px }
        .col-specialty{ width:150px }
        .col-level{ width:120px }
        .col-status{ width:100px; text-align:center }
        .col-rate{ width:120px; text-align:center }
        .col-hours{ width:100px; text-align:center }
        .col-actions{ width:120px; text-align:center }
        
        /* Foto do membro */
        .tm-photo { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #E4E7E4; }
        .tm-photo-placeholder { width: 50px; height: 50px; border-radius: 50%; background: #F1F5F9; display: flex; align-items: center; justify-content: center; color: #64748B; font-weight: 600; font-size: 18px; }
        
        /* Status badges */
        .tm-status { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .tm-status.active { background: #DCFCE7; color: #166534; }
        .tm-status.inactive { background: #FEE2E2; color: #991B1B; }
        .tm-status.vacation { background: #FEF3C7; color: #92400E; }
        .tm-status.sick-leave { background: #E0E7FF; color: #3730A3; }
        
        /* Estrutura de card e toolbar */
        .tm-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin: 16px 0 0 0; }
        .tm-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #E5E7EB; }
        .tm-left, .tm-right { display: flex; align-items: center; gap: 12px; }
        .tm-btn { padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 6px; background: #F3F4F6; color: #374151; border: none; cursor: pointer; transition: all 0.2s ease; }
        .tm-btn:hover { background: #E5E7EB; }
        
        /* Título */
        .tm-header { margin-bottom: 24px; }
        .tm-header h2 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #014029; text-transform: uppercase; font-family: system-ui, -apple-system, sans-serif; }
        
        /* Filtros exclusivos do Team */
        .tm-filters-bar { background: #F8F9FA; border: 1px solid #E4E7E4; padding: 16px 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .tm-filters-form { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
        .tm-filters-group { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
        .tm-filter-field { display: flex; flex-direction: column; gap: 4px; }
        .tm-filter-label { font-size: 11px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; }
        .tm-filter-select, .tm-filter-input { padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 13px; background: white; min-width: 120px; }
         .tm-form-select { padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 14px; background: white; }
         .tm-checkbox-group { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 8px; border: 1px solid #D1D5DB; border-radius: 6px; background: white; }
         .tm-checkbox-item { display: flex; align-items: center; gap: 8px; padding: 4px; }
         .tm-checkbox-item input[type="checkbox"] { margin: 0; }
         .tm-checkbox-item label { font-size: 13px; color: #374151; cursor: pointer; margin: 0; }
        .tm-filter-select:focus, .tm-filter-input:focus { outline: none; border-color: #014029; box-shadow: 0 0 0 2px rgba(1,64,41,0.1); }
        .tm-filter-button { padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 13px; background: #F3F4F6; color: #374151; min-width: 120px; cursor: pointer; transition: all 0.2s; }
        .tm-filter-button:hover { background: #E5E7EB; border-color: #9CA3AF; }
        .tm-btn-new-member { padding: 8px 12px; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; background: #014029; color: white; min-width: 120px; cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
        .tm-btn-new-member:hover { background: #025a35; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(1,64,41,0.3); }
        .tm-filters-actions { display: flex; gap: 8px; align-items: flex-end; padding-bottom: 0; }
        .tm-btn-primary { background: #014029; color: white; padding: 8px 16px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .tm-btn-primary:hover { background: #025a35; transform: translateY(-1px); }
        .tm-btn-secondary { background: #F3F4F6; color: #374151; padding: 8px 16px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .tm-btn-secondary:hover { background: #E5E7EB; }
        
        /* Tabela com mesma largura dos filtros */
        .tm-table-container { width: 100%; }
        
        /* Specialty badges */
        .tm-specialty { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; background: #F8FAFC; color: #475569; border: 1px solid #E2E8F0; }
        
        /* Level badges */
        .tm-level { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
        .tm-level.junior { background: #FEF3C7; color: #92400E; }
        .tm-level.pleno { background: #DBEAFE; color: #1E40AF; }
        .tm-level.senior { background: #DCFCE7; color: #166534; }
        .tm-level.lead { background: #F3E8FF; color: #7C3AED; }
        .tm-level.manager { background: #FEE2E2; color: #991B1B; }
        .tm-level.director { background: #1F2937; color: #FFFFFF; }
        /* Aliases para níveis com acentos */
        .tm-level.senor { background: #DCFCE7; color: #166534; }
        .tm-level.snior { background: #DCFCE7; color: #166534; }
        .tm-level.diretor { background: #1F2937; color: #FFFFFF; }
        
        /* Botões de ação */
        .tm-actions { display: inline-flex; gap: 6px; justify-content: flex-end; width: 100%; }
        .tm-iconbtn { --size: 26px; width: var(--size); height: var(--size); display: inline-flex; align-items: center; justify-content: center; border: 1px solid #E4E7E4; border-radius: 8px; background: #fff; cursor: pointer; transition: all 0.2s ease; }
        .tm-iconbtn:hover { background: #F2EFEB; }
        .tm-icon--edit { color: #014029; }
        .tm-icon--delete { color: #8A1C12; }
        .tm-iconbtn svg { width: 14px; height: 14px; }
        
        /* Responsividade */
        @media (max-width: 768px) {
          .tm-hide-sm { display: none !important; }
          .col-photo{ width:60px }
          .col-name{ width:150px }
          .col-specialty{ width:120px }
        }
        
        /* Loading */
        .tm-loading { text-align: center; padding: 40px; color: #64748B; }
        .tm-empty { text-align: center; padding: 40px; color: #64748B; }
        
        /* Modal styles */
        .tm-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; }
        .tm-modal-content { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 8px; padding: 24px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .tm-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .tm-modal-title { font-size: 18px; font-weight: 600; color: #1F2937; }
        .tm-modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #6B7280; }
        .tm-form-group { margin-bottom: 16px; }
        .tm-form-label { display: block; margin-bottom: 4px; font-weight: 500; color: #374151; }
        .tm-form-input, .tm-form-select { width: 100%; padding: 8px 12px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 14px; }
        .tm-form-input:focus, .tm-form-select:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .tm-form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
        .tm-btn { padding: 8px 16px; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .tm-btn-primary { background: #3B82F6; color: white; }
        .tm-btn-primary:hover { background: #2563EB; }
        .tm-btn-secondary { background: #F3F4F6; color: #374151; }
        .tm-btn-secondary:hover { background: #E5E7EB; }
      </style>

      <div class="tm-container">
        <!-- Área Sticky -->
        <div class="tm-sticky">
          <!-- Título -->
          <div class="tm-header">
            <h2>TEAM DÁCORA</h2>
          </div>
          
          <!-- Filtros Exclusivos do Team -->
          <div class="tm-filters-bar">
            <div class="tm-filters-form">
              <div class="tm-filters-group">
                <div class="tm-filter-field">
                  <label class="tm-filter-label">Status</label>
                  <select id="tm-status-filter" class="tm-filter-select">
                    <option value="">Todos</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Férias">Férias</option>
                    <option value="Afastado">Afastado</option>
                  </select>
                </div>
                <div class="tm-filter-field">
                  <label class="tm-filter-label">Especialidade</label>
                  <select id="tm-specialty-filter" class="tm-filter-select">
                    <option value="">Todas</option>
                  </select>
                </div>
                <div class="tm-filter-field">
                   <label class="tm-filter-label">Nível</label>
                   <select id="tm-level-filter" class="tm-filter-select">
                     <option value="">Todos</option>
                   </select>
                 </div>
                 <div class="tm-filter-field">
                     <label class="tm-filter-label">&nbsp;</label>
                     <button id="tm-clear-filters" class="tm-filter-button">🗑 Limpar</button>
                   </div>
                 </div>
                 <div class="tm-filters-actions">
                   <button id="tm-btn-add" class="tm-btn-new-member">Novo Membro</button>
                 </div>
            </div>
          </div>
          
        </div>

        <!-- Tabela Unificada -->
        <div class="tm-content-section">
          <div class="tm-card">
              <div class="tm-table-container">
              <table class="tm-table" id="tm-members-table">
                <thead class="tm-table-header">
                   <tr>
                     <th class="col-photo">FOTO</th>
                     <th class="col-name">NOME</th>
                     <th class="col-specialty">ESPECIALIDADE</th>
                     <th class="col-level">NÍVEL</th>
                     <th class="col-status" style="text-align: center;">STATUS</th>
                     <th class="col-hours tm-hide-sm" style="text-align: center;">HORAS</th>
                     <th class="col-actions" style="text-align: center;">AÇÕES</th>
                   </tr>
                 </thead>
                <tbody id="tm-table-wrap">
                   <tr><td colspan="7" class="tm-loading">Carregando membros da equipe...</td></tr>
                 </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal para Adicionar/Editar Membro -->
      <div id="tm-modal" class="tm-modal">
        <div class="tm-modal-content">
          <div class="tm-modal-header">
            <h3 class="tm-modal-title" id="tm-modal-title">Novo Membro</h3>
            <button class="tm-modal-close" id="tm-modal-close">&times;</button>
          </div>
          <form id="tm-member-form">
            <div class="tm-form-group">
              <label class="tm-form-label">Nome *</label>
              <input type="text" id="tm-name" class="tm-form-input" required>
            </div>
            <div class="tm-form-group">
              <label class="tm-form-label">Email *</label>
              <input type="email" id="tm-email" class="tm-form-input" required>
            </div>
            <div class="tm-form-group">
              <label class="tm-form-label">Telefone</label>
              <input type="tel" id="tm-phone" class="tm-form-input">
            </div>
            <div class="tm-form-group">
              <label class="tm-form-label">Especialidades *</label>
              <div id="tm-specialty-checkboxes" class="tm-checkbox-group">
                <!-- Checkboxes serão populados dinamicamente -->
              </div>
            </div>
            <div class="tm-form-group">
              <label class="tm-form-label">Nível *</label>
              <select id="tm-level" class="tm-form-select" required>
                <option value="">Selecione...</option>
              </select>
            </div>

            <div class="tm-form-group">
              <label class="tm-form-label">Status</label>
              <select id="tm-status" class="tm-form-select">
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
                <option value="Férias">Férias</option>
                <option value="Afastado">Afastado</option>
              </select>
            </div>
            <div class="tm-form-group">
              <label class="tm-form-label">Observações</label>
              <textarea id="tm-notes" class="tm-form-input" rows="3"></textarea>
            </div>
            <div class="tm-form-actions">
              <button type="button" class="tm-btn tm-btn-secondary" id="tm-cancel">Cancelar</button>
              <button type="submit" class="tm-btn tm-btn-primary" id="tm-save">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Inicializar após renderizar
    setTimeout(() => {
      initTeamModule(container);
    }, 100);
    
    return container;
  }

  /**
   * Inicializa o módulo Team após renderização
   */
  async function initTeamModule(container) {
    try {
      // Elementos DOM
      elMembersList = container.querySelector('#tm-table-wrap');
      elTotalMembers = container.querySelector('#tm-total-members');
      elActiveMembers = container.querySelector('#tm-active-members');
      elAvgRate = container.querySelector('#tm-avg-rate');
      elTotalHours = container.querySelector('#tm-total-hours');
      elSearchInput = container.querySelector('#tm-search');

      setupEventListeners(container);
      await loadInitialData();
      
    } catch (error) {
      console.error('Erro ao inicializar módulo Team:', error);
      if (elMembersList) {
        elMembersList.innerHTML = '<div class="tm-empty">Erro ao carregar dados da equipe</div>';
      }
    }
  }

  /**
   * Configura event listeners
   */
  function setupEventListeners(container) {
    // Botão adicionar membro
    container.querySelector('#tm-btn-add')?.addEventListener('click', () => openMemberModal());
    
    // Filtros exclusivos do Team
      container.querySelector('#tm-status-filter')?.addEventListener('change', applyFilters);
      container.querySelector('#tm-specialty-filter')?.addEventListener('change', applyFilters);
      container.querySelector('#tm-level-filter')?.addEventListener('change', applyFilters);
      container.querySelector('#tm-clear-filters')?.addEventListener('click', clearFilters);
    
    // Modal
    container.querySelector('#tm-modal-close')?.addEventListener('click', closeMemberModal);
    container.querySelector('#tm-cancel')?.addEventListener('click', closeMemberModal);
    container.querySelector('#tm-member-form')?.addEventListener('submit', handleMemberSubmit);
    
    // Fechar modal clicando fora
    container.querySelector('#tm-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'tm-modal') {
        closeMemberModal();
      }
    });
  }

  /**
   * Carrega dados iniciais
   */
  async function loadInitialData() {
    try {
      setLoading(true);
      
      console.log('[Team] Carregando dados do Firebase...');
      
      // Carregar dados reais do Firebase
      allMembers = await listTeamMembers();
      
      console.log(`[Team] ${allMembers.length} membros carregados:`, allMembers.map(m => m.name));
      
      // Calcular e persistir horas trabalhadas para cada membro
      console.log('[Team] Calculando e salvando horas trabalhadas...');
      for (let i = 0; i < allMembers.length; i++) {
        const member = allMembers[i];
        const totalHours = await calculateMemberHours(member.name);
        
        // Persistir no Firebase se as horas mudaram
        if (member.totalHours !== totalHours) {
          await updateMemberStats(member.id, { totalHours });
          console.log(`[Team] Horas atualizadas para ${member.name}: ${totalHours}h`);
        }
        
        allMembers[i] = { ...member, totalHours };
      }
      
      filteredMembers = [...allMembers];
      
      await Promise.all([
        renderMembersList(),
        updateStatsCards(),
        populateFilterOptions()
      ]);
      
    } catch (error) {
      console.error('Erro ao carregar dados da equipe:', error);
      if (elMembersList) {
        elMembersList.innerHTML = '<div class="tm-empty">Erro ao carregar dados da equipe</div>';
      }
    } finally {
      setLoading(false);
    }
  }

  /**
   * Renderiza lista de membros
   */
  function renderMembersList() {
    if (!elMembersList) return;

    if (filteredMembers.length === 0) {
      elMembersList.innerHTML = `
        <tr>
          <td colspan="7" class="tm-empty">
            <p>Nenhum membro encontrado</p>
            <button onclick="TeamModule.openMemberModal()" class="tm-btn tm-btn-primary">Adicionar Primeiro Membro</button>
          </td>
        </tr>
      `;
      return;
    }

    renderTableSlice(0);
  }

  /**
   * Renderiza uma fatia da tabela
   */
  function renderTableSlice(page) {
    const start = page * PAGE_SIZE;
    const slice = filteredMembers.slice(start, start + PAGE_SIZE);

    if (page === 0) {
      elMembersList.innerHTML = '';
    }

    slice.forEach(member => {
      const row = createMemberRow(member);
      elMembersList.appendChild(row);
    });
  }

  /**
   * Cria uma linha da tabela para um membro
   */
  function createMemberRow(member) {
    const row = document.createElement('tr');
    row.className = 'tm-row';
    row.dataset.memberId = member.id;

    // Foto
    const photoCell = document.createElement('td');
    photoCell.className = 'tm-cell col-photo';
    const initials = member.name ? member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
    photoCell.innerHTML = `<div class="tm-photo-placeholder">${initials}</div>`;

    // Nome
    const nameCell = document.createElement('td');
    nameCell.className = 'tm-cell col-name';
    nameCell.innerHTML = `
      <div style="font-weight: 600; color: #1F2937;">${member.name || 'Sem nome'}</div>
      <div style="font-size: 12px; color: #6B7280;">${member.email || ''}</div>
    `;

    // Especialidade
    const specialtyCell = document.createElement('td');
    specialtyCell.className = 'tm-cell col-specialty';
    const specialties = Array.isArray(member.specialty) ? member.specialty : (member.specialty ? [member.specialty] : []);
    const specialtyText = specialties.length > 0 ? specialties.join(', ') : 'Não definido';
    specialtyCell.innerHTML = `<span class="tm-specialty">${specialtyText}</span>`;

    // Nível
    const levelCell = document.createElement('td');
    levelCell.className = 'tm-cell col-level';
    const levelClass = (member.level || '').toLowerCase().replace(/[^a-z]/g, '').replace('ê', 'e').replace('ú', 'u');
    levelCell.innerHTML = `<span class="tm-level ${levelClass}">${member.level || 'Não definido'}</span>`;

    // Status
    const statusCell = document.createElement('td');
    statusCell.className = 'tm-cell col-status';
    statusCell.style.textAlign = 'center';
    const statusClass = getStatusClass(member.status);
    statusCell.innerHTML = `<span class="tm-status ${statusClass}">${member.status || 'Ativo'}</span>`;

    // Horas trabalhadas
    const hoursCell = document.createElement('td');
    hoursCell.className = 'tm-cell tm-hide-sm col-hours';
    hoursCell.style.textAlign = 'center';
    hoursCell.textContent = `${member.totalHours || 0}h`;

    // Ações
    const actionsCell = document.createElement('td');
    actionsCell.className = 'tm-cell col-actions';
    actionsCell.style.textAlign = 'center';
    actionsCell.innerHTML = `
      <div class="tm-actions">
        <button class="tm-iconbtn tm-icon--edit" onclick="TeamModule.editMember('${member.id}')" title="Editar">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button class="tm-iconbtn tm-icon--delete" onclick="TeamModule.deleteMember('${member.id}')" title="Excluir">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 102 0v3a1 1 0 11-2 0V9zm4 0a1 1 0 10-2 0v3a1 1 0 102 0V9z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    `;

    row.appendChild(photoCell);
    row.appendChild(nameCell);
    row.appendChild(specialtyCell);
    row.appendChild(levelCell);
    row.appendChild(statusCell);
    row.appendChild(hoursCell);
    row.appendChild(actionsCell);

    return row;
  }

  /**
   * Obtém classe CSS para status
   */
  function getStatusClass(status) {
    const statusMap = {
      'Ativo': 'active',
      'Inativo': 'inactive',
      'Férias': 'vacation',
      'Afastado': 'sick-leave'
    };
    return statusMap[status] || 'active';
  }

  /**
   * Atualiza cards de estatísticas
   */
  function updateStatsCards() {
    const stats = {
      totalMembers: allMembers.length,
      activeMembers: allMembers.filter(m => m.status === 'Ativo').length,
      averageHourlyRate: allMembers.length > 0 ? Math.round(allMembers.reduce((sum, m) => sum + (m.hourlyRate || 0), 0) / allMembers.length) : 0,
      totalHoursWorked: allMembers.reduce((sum, m) => sum + (m.totalHours || 0), 0)
    };

    if (elTotalMembers) elTotalMembers.textContent = stats.totalMembers;
    if (elActiveMembers) elActiveMembers.textContent = stats.activeMembers;
    if (elAvgRate) elAvgRate.textContent = `R$ ${stats.averageHourlyRate}`;
    if (elTotalHours) elTotalHours.textContent = `${stats.totalHoursWorked}h`;
  }

  /**
   * Popula opções dos filtros
   */
  function populateFilterOptions() {
    // Especialidades
    const specialtySelect = document.getElementById('tm-specialty-filter');
    if (specialtySelect) {
      Object.values(TEAM_SPECIALTIES).forEach(specialty => {
        const option = document.createElement('option');
        option.value = specialty;
        option.textContent = specialty;
        specialtySelect.appendChild(option);
      });
    }

    // Níveis
    const levelSelect = document.getElementById('tm-level-filter');
    if (levelSelect) {
      Object.values(TEAM_LEVELS).forEach(level => {
        const option = document.createElement('option');
        option.value = level;
        option.textContent = level;
        levelSelect.appendChild(option);
      });
    }

    // Popula selects do modal também
    populateModalSelects();
  }

  /**
   * Popula selects do modal
   */
  function populateModalSelects() {
    // Especialidades no modal (checkboxes)
    const modalSpecialtyContainer = document.getElementById('tm-specialty-checkboxes');
    if (modalSpecialtyContainer) {
      modalSpecialtyContainer.innerHTML = '';
      Object.values(TEAM_SPECIALTIES).forEach(specialty => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'tm-checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `specialty-${specialty.replace(/\s+/g, '-').toLowerCase()}`;
        checkbox.value = specialty;
        checkbox.name = 'specialties';
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = specialty;
        
        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(label);
        modalSpecialtyContainer.appendChild(checkboxItem);
      });
    }

    // Níveis no modal
    const modalLevel = document.getElementById('tm-level');
    if (modalLevel) {
      modalLevel.innerHTML = '<option value="">Selecione...</option>';
      Object.values(TEAM_LEVELS).forEach(level => {
        const option = document.createElement('option');
        option.value = level;
        option.textContent = level;
        modalLevel.appendChild(option);
      });
    }
  }

  /**
   * Aplica filtros
   */
  function applyFilters() {
    const filters = {
      status: document.getElementById('tm-status-filter')?.value || '',
      specialty: document.getElementById('tm-specialty-filter')?.value || '',
      level: document.getElementById('tm-level-filter')?.value || ''
    };

    filteredMembers = allMembers.filter(member => {
      if (filters.status && member.status !== filters.status) return false;
      if (filters.specialty && member.specialty !== filters.specialty) return false;
      if (filters.level && member.level !== filters.level) return false;
      return true;
    });

    renderMembersList();
  }

  /**
   * Limpa filtros
   */
  function clearFilters() {
    document.getElementById('tm-status-filter').value = '';
    document.getElementById('tm-specialty-filter').value = '';
    document.getElementById('tm-level-filter').value = '';
    
    filteredMembers = [...allMembers];
    renderMembersList();
  }

  /**
   * Abre modal para adicionar/editar membro
   */
  function openMemberModal(member = null) {
    const modal = document.getElementById('tm-modal');
    const title = document.getElementById('tm-modal-title');
    const form = document.getElementById('tm-member-form');
    
    if (member) {
      title.textContent = 'Editar Membro';
      populateMemberForm(member);
      form.dataset.memberId = member.id;
    } else {
      title.textContent = 'Novo Membro';
      form.reset();
      delete form.dataset.memberId;
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Fecha modal
   */
  function closeMemberModal() {
    const modal = document.getElementById('tm-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  /**
   * Popula formulário com dados do membro
   */
  function populateMemberForm(member) {
    document.getElementById('tm-name').value = member.name || '';
    document.getElementById('tm-email').value = member.email || '';
    document.getElementById('tm-phone').value = member.phone || '';
    
    // Especialidades (checkboxes múltiplos)
    const specialties = Array.isArray(member.specialty) ? member.specialty : (member.specialty ? [member.specialty] : []);
    const checkboxes = document.querySelectorAll('input[name="specialties"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = specialties.includes(checkbox.value);
    });
    
    document.getElementById('tm-level').value = member.level || '';
    document.getElementById('tm-status').value = member.status || 'Ativo';
    document.getElementById('tm-notes').value = member.notes || '';
  }

  /**
   * Manipula submissão do formulário
   */
  async function handleMemberSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const memberId = form.dataset.memberId;
    
    // Coletar especialidades selecionadas
    const selectedSpecialties = [];
    const checkboxes = document.querySelectorAll('input[name="specialties"]:checked');
    checkboxes.forEach(checkbox => {
      selectedSpecialties.push(checkbox.value);
    });
    
    const memberData = {
      name: document.getElementById('tm-name').value.trim(),
      email: document.getElementById('tm-email').value.trim(),
      phone: document.getElementById('tm-phone').value.trim(),
      specialty: selectedSpecialties,
      level: document.getElementById('tm-level').value,
      status: document.getElementById('tm-status').value,
      notes: document.getElementById('tm-notes').value.trim()
    };

    try {
      if (memberId) {
        // Editar membro existente
        await updateTeamMember(memberId, memberData);
        const memberIndex = allMembers.findIndex(m => m.id === memberId);
        if (memberIndex !== -1) {
          allMembers[memberIndex] = { ...allMembers[memberIndex], ...memberData };
        }
      } else {
        // Criar novo membro
        const newMember = await createTeamMember(memberData);
        allMembers.push(newMember);
      }
      
      closeMemberModal();
      applyFilters();
      updateStatsCards();
      
    } catch (error) {
      console.error('Erro ao salvar membro:', error);
      alert('Erro ao salvar membro: ' + error.message);
    }
  }

  /**
   * Edita um membro
   */
  function editMember(memberId) {
    const member = allMembers.find(m => m.id === memberId);
    if (member) {
      openMemberModal(member);
    }
  }

  /**
   * Exclui um membro
   */
  async function deleteMember(memberId) {
    const member = allMembers.find(m => m.id === memberId);
    if (!member) return;

    if (confirm(`Tem certeza que deseja excluir ${member.name}?\n\nEsta ação não pode ser desfeita.`)) {
      try {
        await deleteTeamMember(memberId);
        allMembers = allMembers.filter(m => m.id !== memberId);
        applyFilters();
        updateStatsCards();
      } catch (error) {
        console.error('Erro ao excluir membro:', error);
        alert('Erro ao excluir membro: ' + error.message);
      }
    }
  }

  /**
   * Define estado de loading
   */
  function setLoading(loading) {
    isLoading = loading;
    
    if (loading && elMembersList) {
      elMembersList.innerHTML = '<div class="tm-loading">Carregando...</div>';
    }
  }

  /**
   * Utilitário debounce
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // API pública
  global.TaskoraPages = global.TaskoraPages || {};
  global.TaskoraPages.team = { render };
  
  global.TeamModule = {
    openMemberModal,
    editMember,
    deleteMember
  };

})(window);
