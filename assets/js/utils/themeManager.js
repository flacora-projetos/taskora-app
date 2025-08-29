// assets/js/utils/themeManager.js
// Gerenciador de tema escuro/claro para o Taskora
// Inclui persistência, detecção automática e toggle suave

class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.storageKey = 'taskora-theme';
    this.init();
  }

  init() {
    // Detectar tema inicial
    this.detectInitialTheme();
    
    // Aplicar tema
    this.applyTheme(this.currentTheme);
    
    // Criar toggle button
    this.createToggleButton();
    
    // Escutar mudanças na preferência do sistema
    this.listenToSystemChanges();
    
    // Escutar atalho de teclado
    this.setupKeyboardShortcut();
  }

  detectInitialTheme() {
    // 1. Verificar localStorage primeiro
    const savedTheme = localStorage.getItem(this.storageKey);
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      this.currentTheme = savedTheme;
      return;
    }

    // 2. Verificar preferência do sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.currentTheme = 'dark';
    } else {
      this.currentTheme = 'light';
    }
  }

  applyTheme(theme) {
    const html = document.documentElement;
    
    // Remover tema anterior
    html.removeAttribute('data-theme');
    
    // Aplicar novo tema
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
    }
    
    // Salvar no localStorage
    localStorage.setItem(this.storageKey, theme);
    
    // Atualizar estado interno
    this.currentTheme = theme;
    
    // Emitir evento personalizado
    this.emitThemeChangeEvent(theme);
    
    // Atualizar ícone do toggle
    this.updateToggleIcon();
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(newTheme);
  }

  createToggleButton() {
    // Verificar se já existe
    if (document.querySelector('.theme-toggle')) {
      return;
    }

    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Alternar tema');
    toggle.setAttribute('title', 'Alternar entre tema claro e escuro (Ctrl+Shift+T)');
    
    // Ícones SVG
    toggle.innerHTML = `
      <svg class="sun-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <svg class="moon-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;
    
    // Event listener
    toggle.addEventListener('click', () => {
      this.toggleTheme();
      this.animateToggle(toggle);
    });
    
    // Adicionar ao DOM
    document.body.appendChild(toggle);
  }

  updateToggleIcon() {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    
    const sunIcon = toggle.querySelector('.sun-icon');
    const moonIcon = toggle.querySelector('.moon-icon');
    
    if (this.currentTheme === 'dark') {
      toggle.setAttribute('aria-label', 'Mudar para tema claro');
      toggle.setAttribute('title', 'Mudar para tema claro (Ctrl+Shift+T)');
    } else {
      toggle.setAttribute('aria-label', 'Mudar para tema escuro');
      toggle.setAttribute('title', 'Mudar para tema escuro (Ctrl+Shift+T)');
    }
  }

  animateToggle(button) {
    // Animação de feedback visual
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 150);
  }

  setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+T para toggle do tema
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.toggleTheme();
        
        // Feedback visual no toggle button
        const toggle = document.querySelector('.theme-toggle');
        if (toggle) {
          this.animateToggle(toggle);
        }
      }
    });
  }

  listenToSystemChanges() {
    if (!window.matchMedia) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      // Só aplicar mudança automática se não houver preferência salva
      const savedTheme = localStorage.getItem(this.storageKey);
      if (!savedTheme) {
        const newTheme = e.matches ? 'dark' : 'light';
        this.applyTheme(newTheme);
      }
    });
  }

  emitThemeChangeEvent(theme) {
    const event = new CustomEvent('themeChanged', {
      detail: {
        theme: theme,
        timestamp: Date.now()
      }
    });
    
    window.dispatchEvent(event);
  }

  // Métodos públicos para integração
  getCurrentTheme() {
    return this.currentTheme;
  }

  setTheme(theme) {
    if (['light', 'dark'].includes(theme)) {
      this.applyTheme(theme);
    }
  }

  resetToSystemPreference() {
    localStorage.removeItem(this.storageKey);
    this.detectInitialTheme();
    this.applyTheme(this.currentTheme);
  }

  // Método para integração com outros componentes
  onThemeChange(callback) {
    window.addEventListener('themeChanged', callback);
  }

  // Método para remover listeners (cleanup)
  destroy() {
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.remove();
    }
    
    // Remover listeners seria necessário se armazenássemos referências
    // Por simplicidade, deixamos o garbage collector cuidar disso
  }
}

// Inicialização automática quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
  });
} else {
  window.themeManager = new ThemeManager();
}

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}

// Exportar para uso global
window.ThemeManager = ThemeManager;