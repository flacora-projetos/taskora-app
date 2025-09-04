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
      <!-- Espaço para futuras funcionalidades -->
    </div>
    
    <div class="brand-right">
      ${user ? `
        <div class="user-info">
          <div class="user-details">
            <span class="user-name">${displayName}</span>
            <span class="user-email">${email}</span>
          </div>
          <button class="logout-btn" id="logoutBtn" title="Sair">
            <span class="logout-icon">🚪</span>
            Sair
          </button>
        </div>
      ` : `
        <span title="Powered by Taskora">Powered by Taskora</span>
      `}
    </div>
  `;
}

function attachEventListeners(el) {
  const logoutBtn = el.querySelector('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

async function handleLogout() {
  if (confirm('Tem certeza que deseja sair?')) {
    try {
      await authManager.logout();
      console.log('[Topbar] Logout realizado com sucesso');
    } catch (error) {
      console.error('[Topbar] Erro ao fazer logout:', error);
      alert('Erro ao sair. Tente novamente.');
    }
  }
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

// Adicionar estilos CSS inline para a topbar
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      min-height: 60px;
    }
    
    .topbar-center {
      flex: 1;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .user-details {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
    }
    
    .user-name {
      font-weight: 600;
      font-size: 14px;
      color: #2d3748;
    }
    
    .user-email {
      font-size: 12px;
      color: #718096;
    }
    
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      color: #4a5568;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .logout-btn:hover {
      background: #edf2f7;
      border-color: #cbd5e0;
      color: #2d3748;
    }
    
    .logout-icon {
      font-size: 14px;
    }
    
    @media (max-width: 768px) {
      .user-details {
        display: none;
      }
      
      .logout-btn {
        padding: 8px;
      }
      
      .logout-btn span:not(.logout-icon) {
        display: none;
      }
    }
  `;
  document.head.appendChild(style);
}
