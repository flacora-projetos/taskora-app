// toast.js - Sistema de notificações toast

/**
 * Mostra uma notificação toast
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo da notificação (success, error, warning, info)
 * @param {number} duration - Duração em milissegundos (padrão: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  // Remove toasts existentes do mesmo tipo para evitar acúmulo
  const existingToasts = document.querySelectorAll(`.toast.${type}`);
  existingToasts.forEach(toast => toast.remove());

  // Cria o elemento toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  // Estilos inline para garantir que funcione sem CSS externo
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '6px',
    color: 'white',
    fontWeight: '500',
    fontSize: '14px',
    zIndex: '10000',
    maxWidth: '400px',
    wordWrap: 'break-word',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transform: 'translateX(100%)',
    transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
    opacity: '0'
  });

  // Cores baseadas no tipo
  const colors = {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6'
  };

  toast.style.backgroundColor = colors[type] || colors.info;

  // Adiciona ao DOM
  document.body.appendChild(toast);

  // Anima a entrada
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });

  // Remove automaticamente após a duração especificada
  setTimeout(() => {
    removeToast(toast);
  }, duration);

  // Permite fechar clicando no toast
  toast.addEventListener('click', () => {
    removeToast(toast);
  });

  // Adiciona cursor pointer para indicar que é clicável
  toast.style.cursor = 'pointer';

  return toast;
}

/**
 * Remove um toast com animação
 * @param {HTMLElement} toast - Elemento toast a ser removido
 */
function removeToast(toast) {
  if (!toast || !toast.parentNode) return;

  toast.style.transform = 'translateX(100%)';
  toast.style.opacity = '0';

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

/**
 * Funções de conveniência para diferentes tipos de toast
 */
export const toast = {
  success: (message, duration) => showToast(message, 'success', duration),
  error: (message, duration) => showToast(message, 'error', duration),
  warning: (message, duration) => showToast(message, 'warning', duration),
  info: (message, duration) => showToast(message, 'info', duration)
};

/**
 * Remove todos os toasts ativos
 */
export function clearAllToasts() {
  const toasts = document.querySelectorAll('.toast');
  toasts.forEach(toast => removeToast(toast));
}

// Para compatibilidade com módulos que não usam ES6
if (typeof window !== 'undefined') {
  window.showToast = showToast;
  window.toast = toast;
  window.clearAllToasts = clearAllToasts;
}