// assets/js/utils/tasksDragDrop.js
// Integração específica do drag & drop para o módulo de tarefas
// Permite arrastar tarefas entre status diferentes

import DragDropManager from './dragDropManager.js';
import { updateTask } from '../data/tasksRepo.js';

class TasksDragDrop {
  constructor() {
    this.dragDropManager = null;
    this.statusZones = new Map();
    this.init();
  }

  init() {
    this.setupDragDropManager();
    this.createStatusZones();
  }

  setupDragDropManager() {
    this.dragDropManager = new DragDropManager({
      dragSelector: '[data-task-row]',
      dropZoneSelector: '[data-status-zone]',
      onDragStart: this.handleTaskDragStart.bind(this),
      onDrop: this.handleTaskDrop.bind(this),
      onDragEnd: this.handleTaskDragEnd.bind(this)
    });
  }

  createStatusZones() {
    // Remover zones existentes
    document.querySelectorAll('.status-drop-zone').forEach(zone => zone.remove());
    
    // Criar zones para cada status
    const statusList = [
      { key: 'iniciada', label: 'INICIADA', color: '#334155' },
      { key: 'em progresso', label: 'EM PROGRESSO', color: '#8A5B00' },
      { key: 'concluída', label: 'CONCLUÍDA', color: '#0B6B2C' },
      { key: 'não realizada', label: 'NÃO REALIZADA', color: '#8A1C12' }
    ];
    
    const container = this.createStatusContainer();
    
    statusList.forEach(status => {
      const zone = this.createStatusZone(status);
      container.appendChild(zone);
      
      // Configurar como drop zone
      this.dragDropManager.makeDropZone(
        zone, 
        ['task'], 
        this.handleStatusDrop.bind(this, status.key)
      );
    });
    
    // Adicionar container ao DOM
    this.insertStatusContainer(container);
  }

  createStatusContainer() {
    const container = document.createElement('div');
    container.className = 'status-zones-container';
    container.innerHTML = `
      <style>
        .status-zones-container {
          position: fixed;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          display: none;
          flex-direction: column;
          gap: 12px;
          z-index: 1002;
          opacity: 0;
          transition: all 0.3s ease;
        }
        
        .status-zones-container.show {
          display: flex;
          opacity: 1;
        }
        
        .status-drop-zone {
          width: 120px;
          height: 60px;
          border: 2px dashed transparent;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          text-align: center;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        
        .status-drop-zone::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--zone-color);
          opacity: 0.1;
          transition: opacity 0.3s ease;
        }
        
        .status-drop-zone:hover::before,
        .status-drop-zone.drag-over::before {
          opacity: 0.2;
        }
        
        .status-drop-zone.drag-over {
          border-color: var(--zone-color);
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .status-zone-label {
          position: relative;
          z-index: 1;
          color: var(--zone-color);
          line-height: 1.2;
        }
        
        @media (max-width: 768px) {
          .status-zones-container {
            right: 10px;
            gap: 8px;
          }
          
          .status-drop-zone {
            width: 100px;
            height: 50px;
            font-size: 9px;
          }
        }
      </style>
    `;
    
    return container;
  }

  createStatusZone(status) {
    const zone = document.createElement('div');
    zone.className = 'status-drop-zone';
    zone.setAttribute('data-status-zone', 'true');
    zone.setAttribute('data-status', status.key);
    zone.style.setProperty('--zone-color', status.color);
    
    zone.innerHTML = `
      <div class="status-zone-label">${status.label}</div>
    `;
    
    return zone;
  }

  insertStatusContainer(container) {
    document.body.appendChild(container);
  }

  handleTaskDragStart(dragData, element) {
    // Mostrar zones de status
    const container = document.querySelector('.status-zones-container');
    if (container) {
      container.classList.add('show');
    }
    
    // Adicionar dados específicos da tarefa
    const taskRow = element.closest('[data-row-id]');
    if (taskRow) {
      const taskId = taskRow.dataset.rowId;
      const currentStatus = this.extractCurrentStatus(taskRow);
      
      dragData.taskId = taskId;
      dragData.currentStatus = currentStatus;
      dragData.type = 'task';
      
      // Atualizar dados no elemento
      this.dragDropManager.updateDragData(element, dragData);
    }
  }

  handleTaskDragEnd(dragData, element) {
    // Esconder zones de status
    const container = document.querySelector('.status-zones-container');
    if (container) {
      container.classList.remove('show');
    }
  }

  async handleStatusDrop(newStatus, dragData, dropData, dragElement, dropZone) {
    if (!dragData.taskId || !newStatus) {
      this.showFeedback('Erro: dados da tarefa não encontrados', 'error');
      return false;
    }
    
    // Verificar se o status é diferente
    if (dragData.currentStatus === newStatus) {
      this.showFeedback('A tarefa já está neste status', 'info');
      return false;
    }
    
    try {
      // Mostrar loading
      this.showFeedback('Atualizando status...', 'info');
      
      // Atualizar no Firebase - apenas o status, preservando todos os outros dados
      const { updateDoc, doc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
      const { db } = await import('../config/firebase.js');
      
      await updateDoc(doc(db, 'tasks', dragData.taskId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      // Atualizar UI imediatamente
      this.updateTaskRowStatus(dragData.taskId, newStatus);
      
      // Feedback de sucesso
      this.showFeedback(`Status alterado para: ${this.getStatusLabel(newStatus)}`, 'success');
      
      // Emitir evento para atualizar estatísticas
      this.emitTaskStatusChanged(dragData.taskId, dragData.currentStatus, newStatus);
      
      return true;
      
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      this.showFeedback('Erro ao atualizar status. Tente novamente.', 'error');
      return false;
    }
  }

  handleTaskDrop(dragData, dropData, dragElement, dropZone) {
    // Este método é chamado para drops gerais
    // A lógica específica de status é tratada em handleStatusDrop
    return true;
  }

  extractCurrentStatus(taskRow) {
    const statusCell = taskRow.querySelector('.tk-chip--status');
    if (!statusCell) return '';
    
    const statusText = statusCell.textContent.trim().toLowerCase();
    
    // Mapear texto para status canônico
    const statusMap = {
      'iniciada': 'iniciada',
      'em progresso': 'em progresso',
      'concluída': 'concluída',
      'não realizada': 'não realizada'
    };
    
    return statusMap[statusText] || statusText;
  }

  updateTaskRowStatus(taskId, newStatus) {
    const taskRow = document.querySelector(`[data-row-id="${taskId}"]`);
    if (!taskRow) return;
    
    const statusCell = taskRow.querySelector('.tk-chip--status');
    if (!statusCell) return;
    
    // Atualizar visual do status
    const statusConfig = this.getStatusConfig(newStatus);
    statusCell.textContent = statusConfig.label;
    statusCell.style.setProperty('--bg', statusConfig.bg);
    statusCell.style.setProperty('--fg', statusConfig.fg);
    statusCell.style.setProperty('--bd', statusConfig.bd);
    
    // Animação de atualização
    taskRow.style.animation = 'none';
    taskRow.offsetHeight; // Trigger reflow
    taskRow.style.animation = 'dropSuccess 0.4s ease';
  }

  getStatusConfig(status) {
    const configs = {
      'iniciada': { bg: '#EEF0F3', fg: '#334155', bd: '#E0E5EA', label: 'INICIADA' },
      'em progresso': { bg: '#FFF3D6', fg: '#8A5B00', bd: '#FFE4A6', label: 'EM PROGRESSO' },
      'concluída': { bg: '#E7F4EC', fg: '#0B6B2C', bd: '#C9E7D2', label: 'CONCLUÍDA' },
      'não realizada': { bg: '#FDE9E7', fg: '#8A1C12', bd: '#F6C8C2', label: 'NÃO REALIZADA' }
    };
    
    return configs[status] || configs['iniciada'];
  }

  getStatusLabel(status) {
    const labels = {
      'iniciada': 'Iniciada',
      'em progresso': 'Em Progresso',
      'concluída': 'Concluída',
      'não realizada': 'Não Realizada'
    };
    
    return labels[status] || status;
  }

  emitTaskStatusChanged(taskId, oldStatus, newStatus) {
    const event = new CustomEvent('taskStatusChanged', {
      detail: {
        taskId,
        oldStatus,
        newStatus,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(event);
  }

  showFeedback(message, type = 'info') {
    // Usar o sistema de toast existente
    if (window.showCenterToast) {
      window.showCenterToast(message);
    } else {
      console.log(`[TasksDragDrop] ${type.toUpperCase()}: ${message}`);
    }
  }

  // Métodos públicos para integração
  enableForTasksTable(tableContainer) {
    if (!tableContainer) return;
    
    // Tornar todas as linhas de tarefa arrastáveis
    const taskRows = tableContainer.querySelectorAll('[data-row-id]');
    taskRows.forEach(row => {
      row.setAttribute('data-task-row', 'true');
      this.dragDropManager.makeDraggable(row, {
        type: 'task',
        taskId: row.dataset.rowId,
        title: this.extractTaskTitle(row)
      });
    });
    
    // Habilitar drag & drop
    this.dragDropManager.enableDragDrop(tableContainer);
  }

  extractTaskTitle(taskRow) {
    const descCell = taskRow.querySelector('.tk-desc');
    return descCell ? descCell.textContent.trim() : 'Tarefa';
  }

  disable() {
    const container = document.querySelector('.status-zones-container');
    if (container) {
      container.remove();
    }
    
    if (this.dragDropManager) {
      this.dragDropManager.destroy();
    }
  }

  // Método para escutar mudanças de status
  onStatusChange(callback) {
    window.addEventListener('taskStatusChanged', callback);
  }
}

// Instância global
let tasksDragDropInstance = null;

// Função para inicializar
export function initTasksDragDrop() {
  if (!tasksDragDropInstance) {
    tasksDragDropInstance = new TasksDragDrop();
  }
  return tasksDragDropInstance;
}

// Função para obter instância
export function getTasksDragDrop() {
  return tasksDragDropInstance;
}

// Exportar classe
export default TasksDragDrop;

// Disponibilizar globalmente
window.TasksDragDrop = TasksDragDrop;
window.initTasksDragDrop = initTasksDragDrop;
window.getTasksDragDrop = getTasksDragDrop;