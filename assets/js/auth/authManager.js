// authManager.js - Sistema de Autenticação para Taskora
// Substitui o modo anônimo por autenticação real com email/senha

import { auth } from '../config/firebase.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.isInitialized = false;
    
    // Inicializar listener de estado de autenticação
    this.initAuthStateListener();
  }

  /**
   * Inicializa o listener de estado de autenticação
   */
  initAuthStateListener() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.isInitialized = true;
      
      // Notificar todos os listeners
      this.authStateListeners.forEach(callback => {
        try {
          callback(user);
        } catch (error) {
          console.error('[AuthManager] Erro no listener de estado:', error);
        }
      });
      
      console.log('[AuthManager] Estado de autenticação:', user ? 'Autenticado' : 'Não autenticado');
    });
  }

  /**
   * Adiciona um listener para mudanças no estado de autenticação
   */
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    
    // Se já inicializado, chama o callback imediatamente
    if (this.isInitialized) {
      callback(this.currentUser);
    }
  }

  /**
   * Remove um listener de estado de autenticação
   */
  removeAuthStateListener(callback) {
    const index = this.authStateListeners.indexOf(callback);
    if (index > -1) {
      this.authStateListeners.splice(index, 1);
    }
  }

  /**
   * Registra um novo usuário
   */
  async register(email, password, displayName = '') {
    try {
      console.log('[AuthManager] Registrando usuário:', email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Atualizar nome de exibição se fornecido
      if (displayName.trim()) {
        await updateProfile(user, {
          displayName: displayName.trim()
        });
      }
      
      console.log('[AuthManager] Usuário registrado com sucesso:', user.uid);
      return user;
      
    } catch (error) {
      console.error('[AuthManager] Erro ao registrar usuário:', error);
      throw this.formatAuthError(error);
    }
  }

  /**
   * Faz login com email e senha
   */
  async login(email, password) {
    try {
      console.log('[AuthManager] Fazendo login:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('[AuthManager] Login realizado com sucesso:', user.uid);
      return user;
      
    } catch (error) {
      console.error('[AuthManager] Erro ao fazer login:', error);
      throw this.formatAuthError(error);
    }
  }

  /**
   * Login com Google
   */
  async signInWithGoogle() {
    try {
      console.log('[AuthManager] Fazendo login com Google');
      
      const provider = new GoogleAuthProvider();
      
      // Configurar provider para solicitar informações básicas
      provider.addScope('email');
      provider.addScope('profile');
      
      // Configurar parâmetros customizados
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log('[AuthManager] Login com Google realizado com sucesso:', user.uid);
      console.log('[AuthManager] Email:', user.email);
      console.log('[AuthManager] Nome:', user.displayName);
      
      return user;

    } catch (error) {
      console.error('[AuthManager] Erro no login com Google:', error);
      
      // Tratar erros específicos do Google Auth
      if (error.code === 'auth/popup-closed-by-user') {
        throw this.formatAuthError({ ...error, message: 'Login cancelado pelo usuário' });
      } else if (error.code === 'auth/popup-blocked') {
        throw this.formatAuthError({ ...error, message: 'Popup bloqueado pelo navegador. Permita popups para este site.' });
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw this.formatAuthError({ ...error, message: 'Solicitação de login cancelada' });
      } else {
        throw this.formatAuthError(error);
      }
    }
  }

  /**
   * Enviar email de recuperação de senha
   */
  async sendPasswordReset(email) {
    try {
      console.log('[AuthManager] Enviando email de recuperação para:', email);
      
      await sendPasswordResetEmail(auth, email);
      
      console.log('[AuthManager] Email de recuperação enviado com sucesso');
      return true;
      
    } catch (error) {
      console.error('[AuthManager] Erro ao enviar email de recuperação:', error);
      throw this.formatAuthError(error);
    }
  }

  /**
   * Faz logout
   */
  async logout() {
    try {
      console.log('[AuthManager] Fazendo logout');
      await signOut(auth);
      console.log('[AuthManager] Logout realizado com sucesso');
      
    } catch (error) {
      console.error('[AuthManager] Erro ao fazer logout:', error);
      throw this.formatAuthError(error);
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * Obtém o usuário atual
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Obtém o UID do usuário atual
   */
  getCurrentUserId() {
    return this.currentUser?.uid || null;
  }

  /**
   * Obtém o email do usuário atual
   */
  getCurrentUserEmail() {
    return this.currentUser?.email || null;
  }

  /**
   * Obtém o nome de exibição do usuário atual
   */
  getCurrentUserDisplayName() {
    return this.currentUser?.displayName || this.currentUser?.email || 'Usuário';
  }

  /**
   * Aguarda a inicialização da autenticação
   */
  async waitForAuthInit() {
    if (this.isInitialized) {
      return this.currentUser;
    }
    
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  /**
   * Formata erros de autenticação para exibição
   */
  formatAuthError(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'Este email já está sendo usado por outra conta.',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
      'auth/invalid-email': 'Email inválido.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
      'auth/invalid-credential': 'Credenciais inválidas.',
      'auth/user-disabled': 'Esta conta foi desabilitada.',
      'auth/operation-not-allowed': 'Operação não permitida.',
      'auth/requires-recent-login': 'Esta operação requer login recente.',
      'auth/popup-closed-by-user': 'Login cancelado pelo usuário.',
      'auth/popup-blocked': 'Popup bloqueado pelo navegador. Permita popups para este site.',
      'auth/cancelled-popup-request': 'Solicitação de login cancelada.',
      'auth/missing-email': 'Email é obrigatório para recuperação de senha.'
    };

    const message = errorMessages[error.code] || error.message || 'Erro de autenticação desconhecido';
    
    return {
      code: error.code,
      message: message,
      originalError: error
    };
  }

  /**
   * Valida email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida senha
   */
  isValidPassword(password) {
    return password && password.length >= 6;
  }
}

// Instância singleton
const authManager = new AuthManager();

// Exportar instância e classe
export default authManager;
export { AuthManager };

// Disponibilizar globalmente para debug
if (typeof window !== 'undefined') {
  window.TaskoraAuth = authManager;
  console.log('[AuthManager] Sistema de autenticação inicializado');
}