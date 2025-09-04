// LoginForm.js - Interface de Login/Registro para Taskora
// Substitui o modo anônimo por autenticação real

import authManager from '../../auth/authManager.js';

class LoginForm {
  constructor() {
    this.isLoginMode = true; // true = login, false = registro
    this.isLoading = false;
  }

  /**
   * Renderiza o formulário de login/registro
   */
  render() {
    const container = document.createElement('div');
    container.className = 'auth-container';
    container.innerHTML = this.getHTML();
    
    this.attachEventListeners(container);
    return container;
  }

  /**
   * HTML do formulário
   */
  getHTML() {
    return `
      <div class="auth-overlay">
        <div class="auth-modal">
          <div class="auth-header">
            <div class="brand-container">
               <div class="brand-text">
                 <h1 class="main-brand">Dácora</h1>
                 <p class="powered-by">powered by Taskora</p>
               </div>
             </div>
            <p class="auth-subtitle">
              ${this.isLoginMode ? 'Entre na sua conta' : 'Crie sua conta'}
            </p>
          </div>

          <form class="auth-form" id="authForm">
            ${!this.isLoginMode ? `
              <div class="form-group">
                <label for="displayName">Nome completo</label>
                <input 
                  type="text" 
                  id="displayName" 
                  name="displayName" 
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            ` : ''}

            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="seu@email.com"
                required
              />
            </div>

            <div class="form-group">
              <label for="password">Senha</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="${this.isLoginMode ? 'Sua senha' : 'Mínimo 6 caracteres'}"
                required
                minlength="6"
              />
            </div>

            <button 
              type="submit" 
              class="auth-submit-btn"
              ${this.isLoading ? 'disabled' : ''}
            >
              ${this.isLoading ? 'Carregando...' : (this.isLoginMode ? 'Entrar' : 'Criar conta')}
            </button>

            <div class="auth-error" id="authError" style="display: none;"></div>
            
            ${this.isLoginMode ? `
              <div class="forgot-password-link" id="forgotPasswordLink">
                <a href="#" id="forgotPasswordBtn">Esqueci minha senha</a>
              </div>
            ` : ''}
          </form>

          <div class="auth-divider">
            <span>ou</span>
          </div>
          
          <button type="button" class="google-auth-button" id="googleSignInButton">
            <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continuar com Google</span>
          </button>

          <div class="auth-footer">
            <p>
              ${this.isLoginMode ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button type="button" class="auth-toggle-btn" id="toggleMode">
                ${this.isLoginMode ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </div>

          <div class="auth-info">
            <p><strong>🔒 Segurança:</strong></p>
            <ul>
              <li>Suas credenciais são protegidas pelo Firebase</li>
              <li>Dados criptografados em trânsito e em repouso</li>
              <li>Acesso restrito apenas aos seus dados</li>
            </ul>
          </div>
        </div>
        
        <!-- Modal de Recuperação de Senha -->
        <div class="modal-overlay" id="forgotPasswordModal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Recuperar Senha</h3>
              <button class="modal-close" id="closeForgotModal">&times;</button>
            </div>
            <div class="modal-body">
              <p>Digite seu email para receber um link de recuperação de senha:</p>
              <div class="form-group">
                <input type="email" id="resetEmail" placeholder="Seu email" required>
              </div>
              <div class="auth-error" id="resetErrorMessage" style="display: none;"></div>
              <div class="success-message" id="resetSuccessMessage" style="display: none;"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="auth-submit-btn" id="sendResetButton">
                <span class="button-text">Enviar Link</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Anexa event listeners
   */
  attachEventListeners(container) {
    const form = container.querySelector('#authForm');
    const toggleBtn = container.querySelector('#toggleMode');
    const errorDiv = container.querySelector('#authError');
    const googleBtn = container.querySelector('#googleSignInButton');
    const forgotPasswordBtn = container.querySelector('#forgotPasswordBtn');
    const closeForgotModal = container.querySelector('#closeForgotModal');
    const sendResetButton = container.querySelector('#sendResetButton');
    const forgotPasswordModal = container.querySelector('#forgotPasswordModal');

    // Submit do formulário
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleSubmit(form, errorDiv);
    });

    // Toggle entre login e registro
    toggleBtn.addEventListener('click', () => {
      this.toggleMode(container);
    });

    // Google Sign In
    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        await this.handleGoogleSignIn(errorDiv);
      });
    }

    // Eventos do modal de recuperação
    if (forgotPasswordBtn) {
      forgotPasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showForgotPasswordModal(container);
      });
    }
    
    if (closeForgotModal) {
      closeForgotModal.addEventListener('click', () => this.hideForgotPasswordModal(container));
    }
    
    if (forgotPasswordModal) {
      forgotPasswordModal.addEventListener('click', (e) => {
        if (e.target === forgotPasswordModal) {
          this.hideForgotPasswordModal(container);
        }
      });
    }
    
    if (sendResetButton) {
      sendResetButton.addEventListener('click', () => this.handlePasswordReset(container));
    }

    // Enter para submit
    form.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.isLoading) {
        form.dispatchEvent(new Event('submit'));
      }
    });
  }

  /**
   * Manipula o submit do formulário
   */
  async handleSubmit(form, errorDiv) {
    if (this.isLoading) return;

    const formData = new FormData(form);
    const email = formData.get('email')?.trim();
    const password = formData.get('password');
    const displayName = formData.get('displayName')?.trim();

    // Validações
    if (!email || !password) {
      this.showError(errorDiv, 'Preencha todos os campos obrigatórios.');
      return;
    }

    if (!authManager.isValidEmail(email)) {
      this.showError(errorDiv, 'Email inválido.');
      return;
    }

    if (!authManager.isValidPassword(password)) {
      this.showError(errorDiv, 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (!this.isLoginMode && !displayName) {
      this.showError(errorDiv, 'Nome completo é obrigatório.');
      return;
    }

    this.setLoading(true, form);
    this.hideError(errorDiv);

    try {
      if (this.isLoginMode) {
        await authManager.login(email, password);
      } else {
        await authManager.register(email, password, displayName);
      }
      
      // Sucesso - o AuthManager irá notificar os listeners
      console.log('[LoginForm] Autenticação realizada com sucesso');
      
    } catch (error) {
      console.error('[LoginForm] Erro na autenticação:', error);
      this.showError(errorDiv, error.message || 'Erro na autenticação. Tente novamente.');
      
    } finally {
      this.setLoading(false, form);
    }
  }

  /**
   * Manipula o login com Google
   */
  async handleGoogleSignIn(errorDiv) {
    if (this.isLoading) return;

    this.setLoading(true);
    this.hideError(errorDiv);

    try {
      await authManager.signInWithGoogle();
      console.log('[LoginForm] Login com Google realizado com sucesso');
      
    } catch (error) {
      console.error('[LoginForm] Erro no login com Google:', error);
      this.showError(errorDiv, error.message || 'Erro no login com Google. Tente novamente.');
      
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Alterna entre modo login e registro
   */
  toggleMode(container) {
    this.isLoginMode = !this.isLoginMode;
    
    // Re-renderizar o conteúdo
    const modal = container.querySelector('.auth-modal');
    modal.innerHTML = this.getHTML().match(/<div class="auth-modal">(.*)<\/div>/s)[1];
    
    // Re-anexar event listeners
    this.attachEventListeners(container);
  }

  /**
   * Define estado de loading
   */
  setLoading(loading, form = null) {
    this.isLoading = loading;
    
    const container = form || document.querySelector('.auth-container');
    if (!container) return;
    
    const submitBtn = container.querySelector('.auth-submit-btn');
    const googleBtn = container.querySelector('#googleSignInButton');
    const inputs = container.querySelectorAll('input');
    
    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? 'Carregando...' : (this.isLoginMode ? 'Entrar' : 'Criar conta');
    }
    
    if (googleBtn) {
      googleBtn.disabled = loading;
      if (loading) {
        googleBtn.style.opacity = '0.6';
      } else {
        googleBtn.style.opacity = '1';
      }
    }
    
    inputs.forEach(input => {
      input.disabled = loading;
    });
  }

  /**
   * Mostra erro
   */
  showError(errorDiv, message) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Esconde erro
   */
  hideError(errorDiv) {
    errorDiv.style.display = 'none';
  }

  /**
   * Mostra modal de recuperação de senha
   */
  showForgotPasswordModal(container) {
    const modal = container.querySelector('#forgotPasswordModal');
    const resetEmail = container.querySelector('#resetEmail');
    const errorMessage = container.querySelector('#resetErrorMessage');
    const successMessage = container.querySelector('#resetSuccessMessage');
    
    // Limpar campos e mensagens
    resetEmail.value = '';
    this.hideError(errorMessage);
    successMessage.style.display = 'none';
    
    modal.style.display = 'flex';
    resetEmail.focus();
  }

  /**
   * Esconde modal de recuperação de senha
   */
  hideForgotPasswordModal(container) {
    const modal = container.querySelector('#forgotPasswordModal');
    modal.style.display = 'none';
  }

  /**
   * Manipula recuperação de senha
   */
  async handlePasswordReset(container) {
    const resetEmail = container.querySelector('#resetEmail');
    const errorMessage = container.querySelector('#resetErrorMessage');
    const successMessage = container.querySelector('#resetSuccessMessage');
    const sendButton = container.querySelector('#sendResetButton');
    
    const email = resetEmail.value.trim();
    
    if (!email) {
      this.showError(errorMessage, 'Por favor, digite seu email');
      return;
    }
    
    if (!authManager.isValidEmail(email)) {
      this.showError(errorMessage, 'Email inválido');
      return;
    }
    
    this.setLoading(true);
    this.hideError(errorMessage);
    successMessage.style.display = 'none';
    
    try {
      await authManager.sendPasswordReset(email);
      
      successMessage.textContent = 'Email de recuperação enviado! Verifique sua caixa de entrada.';
      successMessage.style.display = 'block';
      
      // Fechar modal após 3 segundos
      setTimeout(() => {
        this.hideForgotPasswordModal(container);
      }, 3000);
      
    } catch (error) {
      console.error('[LoginForm] Erro na recuperação de senha:', error);
      this.showError(errorMessage, error.message || 'Erro ao enviar email de recuperação.');
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Remove o formulário do DOM
   */
  destroy() {
    const container = document.querySelector('.auth-container');
    if (container) {
      container.remove();
    }
  }
}

export default LoginForm;