// assets/js/utils/dragDropManager.js
// Sistema de drag & drop para tarefas entre status
// Compatível com o plano Spark (apenas frontend, otimiza writes)

class DragDropManager {
  constructor(options = {}) {
    this.options = {
      dragSelector: '[data-draggable]',
      dropZoneSelector: '[data-drop-zone]',
      dragHandleSelector: '[data-drag-handle]',
      ghostClass: 'drag-ghost',
      dragOverClass: 'drag-over',
      draggingClass: 'dragging',
      animationDuration: 300,
      onDragStart: null,
      onDragEnd: null,
      onDrop: null,
      ...options
    };
    
    this.draggedElement = null;
    this.draggedData = null;
    this.dropZones = new Map();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.injectStyles();
  }

  injectStyles() {
    if (document.getElementById('drag-drop-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'drag-drop-styles';
    styles.textContent = `
      /* Drag & Drop Styles */
      [data-draggable] {
        cursor: grab;
        transition: all 0.2s ease;
      }
      
      [data-draggable]:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      [data-draggable].dragging {
        opacity: 0.7;
        transform: rotate(1deg) scale(0.85);
        cursor: grabbing;
        z-index: 1000;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
      }
      
      .drag-ghost {
        background: var(--bg-secondary, #f8f9fa) !important;
        border: 2px dashed var(--brand-green, #016B3A) !important;
        opacity: 0.6;
        transform: rotate(-1deg) scale(0.9);
        box-shadow: 0 12px 35px rgba(1, 107, 58, 0.25);
        filter: blur(0.5px);
      }
      
      [data-drop-zone] {
        transition: all 0.3s ease;
        position: relative;
      }
      
      [data-drop-zone].drag-over {
        background: rgba(1, 107, 58, 0.08);
        border: 2px dashed var(--brand-green, #016B3A);
        transform: scale(1.03);
        box-shadow: 0 4px 20px rgba(1, 107, 58, 0.15);
      }
      
      [data-drop-zone].drag-over::before {
        content: 'Solte aqui para alterar status';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--brand-green, #016B3A);
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        z-index: 10;
        pointer-events: none;
        white-space: nowrap;
      }
      
      /* Indicador de status durante drag */
      .status-indicator {
        position: fixed;
        top: 10px;
        right: 10px;
        background: var(--brand-green, #016B3A);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        z-index: 1001;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease;
        pointer-events: none;
      }
      
      .status-indicator.show {
        opacity: 1;
        transform: translateY(0);
      }
      
      /* Animação de sucesso */
      @keyframes dropSuccess {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      .drop-success {
        animation: dropSuccess 0.4s ease;
      }
      
      /* Responsivo */
      @media (max-width: 768px) {
        [data-draggable]:hover {
          transform: none;
          box-shadow: none;
        }
        
        [data-drop-zone].drag-over::before {
          font-size: 10px;
          padding: 6px 12px;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  setupEventListeners() {
    document.addEventListener('dragstart', this.handleDragStart.bind(this));
    document.addEventListener('dragend', this.handleDragEnd.bind(this));
    document.addEventListener('dragover', this.handleDragOver.bind(this));
    document.addEventListener('dragenter', this.handleDragEnter.bind(this));
    document.addEventListener('dragleave', this.handleDragLeave.bind(this));
    document.addEventListener('drop', this.handleDrop.bind(this));
  }

  makeDraggable(element, data = {}) {
    if (!element) return;
    
    element.setAttribute('draggable', 'true');
    element.setAttribute('data-draggable', 'true');
    element.dataset.dragData = JSON.stringify(data);
  }

  makeDropZone(element, acceptedTypes = [], onDrop = null) {
    if (!element) return;
    
    element.setAttribute('data-drop-zone', 'true');
    element.dataset.acceptedTypes = JSON.stringify(acceptedTypes);
    
    if (onDrop) {
      this.dropZones.set(element, onDrop);
    }
  }

  handleDragStart(e) {
    const draggable = e.target.closest(this.options.dragSelector);
    if (!draggable) return;
    
    this.draggedElement = draggable;
    this.draggedData = JSON.parse(draggable.dataset.dragData || '{}');
    
    // Adicionar classe de dragging
    draggable.classList.add(this.options.draggingClass);
    
    // Criar ghost image personalizada
    const ghost = this.createGhostElement(draggable);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    
    // Configurar data transfer
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(this.draggedData));
    
    // Mostrar indicador de status
    this.showStatusIndicator();
    
    // Callback personalizado
    if (this.options.onDragStart) {
      this.options.onDragStart(this.draggedData, draggable);
    }
    
    // Remover ghost element após um tempo
    setTimeout(() => {
      if (ghost && ghost.parentNode) {
        ghost.parentNode.removeChild(ghost);
      }
    }, 0);
  }

  handleDragEnd(e) {
    if (!this.draggedElement) return;
    
    // Remover classes
    this.draggedElement.classList.remove(this.options.draggingClass);
    document.querySelectorAll(`.${this.options.dragOverClass}`).forEach(el => {
      el.classList.remove(this.options.dragOverClass);
    });
    
    // Esconder indicador de status
    this.hideStatusIndicator();
    
    // Callback personalizado
    if (this.options.onDragEnd) {
      this.options.onDragEnd(this.draggedData, this.draggedElement);
    }
    
    // Reset
    this.draggedElement = null;
    this.draggedData = null;
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  handleDragEnter(e) {
    const dropZone = e.target.closest(this.options.dropZoneSelector);
    if (!dropZone || !this.draggedElement) return;
    
    // Verificar se aceita o tipo
    const acceptedTypes = JSON.parse(dropZone.dataset.acceptedTypes || '[]');
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(this.draggedData.type)) {
      return;
    }
    
    dropZone.classList.add(this.options.dragOverClass);
  }

  handleDragLeave(e) {
    const dropZone = e.target.closest(this.options.dropZoneSelector);
    if (!dropZone) return;
    
    // Verificar se realmente saiu da drop zone
    const rect = dropZone.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      dropZone.classList.remove(this.options.dragOverClass);
    }
  }

  handleDrop(e) {
    e.preventDefault();
    
    const dropZone = e.target.closest(this.options.dropZoneSelector);
    if (!dropZone || !this.draggedElement) return;
    
    // Remover classe de drag over
    dropZone.classList.remove(this.options.dragOverClass);
    
    // Verificar se aceita o tipo
    const acceptedTypes = JSON.parse(dropZone.dataset.acceptedTypes || '[]');
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(this.draggedData.type)) {
      this.showFeedback('Tipo de item não aceito nesta área', 'error');
      return;
    }
    
    // Obter dados do drop
    const dropData = JSON.parse(dropZone.dataset.dropData || '{}');
    
    // Callback da drop zone específica
    const dropZoneCallback = this.dropZones.get(dropZone);
    if (dropZoneCallback) {
      const result = dropZoneCallback(this.draggedData, dropData, this.draggedElement, dropZone);
      if (result === false) return; // Cancelar drop
    }
    
    // Callback global
    if (this.options.onDrop) {
      const result = this.options.onDrop(this.draggedData, dropData, this.draggedElement, dropZone);
      if (result === false) return; // Cancelar drop
    }
    
    // Animação de sucesso
    this.animateDropSuccess(dropZone);
  }

  createGhostElement(original) {
    const ghost = original.cloneNode(true);
    ghost.classList.add(this.options.ghostClass);
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    ghost.style.left = '-1000px';
    ghost.style.width = original.offsetWidth + 'px';
    ghost.style.height = original.offsetHeight + 'px';
    ghost.style.pointerEvents = 'none';
    
    document.body.appendChild(ghost);
    return ghost;
  }

  showStatusIndicator() {
    let indicator = document.getElementById('drag-status-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'drag-status-indicator';
      indicator.className = 'status-indicator';
      document.body.appendChild(indicator);
    }
    
    indicator.textContent = `Arrastando: ${this.draggedData.title || 'Item'}`;
    indicator.classList.add('show');
  }

  hideStatusIndicator() {
    const indicator = document.getElementById('drag-status-indicator');
    if (indicator) {
      indicator.classList.remove('show');
    }
  }

  animateDropSuccess(element) {
    element.classList.add('drop-success');
    setTimeout(() => {
      element.classList.remove('drop-success');
    }, 400);
  }

  showFeedback(message, type = 'info') {
    // Integração com o sistema de toast existente
    if (window.showCenterToast) {
      window.showCenterToast(message);
    } else {
      console.log(`[DragDrop] ${type.toUpperCase()}: ${message}`);
    }
  }

  // Métodos públicos para integração
  enableDragDrop(container) {
    if (!container) return;
    
    // Tornar todos os elementos com data-draggable arrastáveis
    container.querySelectorAll('[data-draggable]').forEach(el => {
      if (!el.getAttribute('draggable')) {
        el.setAttribute('draggable', 'true');
      }
    });
  }

  disableDragDrop(container) {
    if (!container) return;
    
    container.querySelectorAll('[data-draggable]').forEach(el => {
      el.setAttribute('draggable', 'false');
      el.classList.remove(this.options.draggingClass);
    });
  }

  updateDragData(element, newData) {
    if (!element) return;
    element.dataset.dragData = JSON.stringify(newData);
  }

  destroy() {
    // Remover event listeners
    document.removeEventListener('dragstart', this.handleDragStart.bind(this));
    document.removeEventListener('dragend', this.handleDragEnd.bind(this));
    document.removeEventListener('dragover', this.handleDragOver.bind(this));
    document.removeEventListener('dragenter', this.handleDragEnter.bind(this));
    document.removeEventListener('dragleave', this.handleDragLeave.bind(this));
    document.removeEventListener('drop', this.handleDrop.bind(this));
    
    // Remover estilos
    const styles = document.getElementById('drag-drop-styles');
    if (styles) styles.remove();
    
    // Remover indicador
    const indicator = document.getElementById('drag-status-indicator');
    if (indicator) indicator.remove();
    
    // Limpar referências
    this.dropZones.clear();
    this.draggedElement = null;
    this.draggedData = null;
  }
}

// Exportar para uso global
window.DragDropManager = DragDropManager;

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DragDropManager;
}

// Export default para ES6 modules
export default DragDropManager;