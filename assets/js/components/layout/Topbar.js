import authManager from '../../auth/authManager.js';

function mount(el) {
  render(el);
  attachEventListeners(el);
}

function render(el) {
  const user = authManager.getCurrentUser();
  const displayName = authManager.getCurrentUserDisplayName();
  const email = authManager.getCurrentUserEmail();
  
  el.innerHTML = `
    <div class="brand-left">
      <span>Dácora</span>
    </div>
    
    <div class="topbar-center">
      ${user ? `
        <div class="user-info">
          <span class="user-name">${displayName}</span>
          <span class="user-email">${email}</span>
        </div>
      ` : ''}
    </div>
    
    <div class="brand-right">
      <span title="Powered by Taskora">Powered by Taskora</span>
    </div>
  `;
}

function attachEventListeners(el) {
  // Event listeners removidos temporariamente
}

// Atualizar topbar quando o estado de autenticação mudar
function updateTopbar() {
  const topbarEl = document.getElementById('topbar');
  if (topbarEl) {
    render(topbarEl);
    attachEventListeners(topbarEl);
  }
}

// Listener para mudanças de autenticação
if (typeof authManager !== 'undefined') {
  authManager.onAuthStateChange(() => {
    updateTopbar();
  });
}

export default { mount, updateTopbar };

// Estilos CSS movidos para styles.css para evitar conflitos
