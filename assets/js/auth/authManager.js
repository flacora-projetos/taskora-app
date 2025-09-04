// authManager.js - Sistema de Autenticação Anônima para Taskora
// Versão simplificada usando apenas autenticação anônima

import { auth } from '../config/firebase.js';
import { 
  signInAnonymously,
  signOut, 
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.isInitialized = false;
    
    // Inicializar listener de estado de autenticação
    this.initAuthStateListener();
    
    // Fazer login anônimo automaticamente
    this.signInAnonymously();
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
      
      console.log('[AuthManager] Estado de autenticação anônima:', user ? 'Conectado' : 'Desconectado');
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
   * Faz login anônimo
   */
  async signInAnonymously() {
    try {
      console.log('[AuthManager] Fazendo login anônimo...');
      
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;
      
      console.log('[AuthManager] Login anônimo realizado com sucesso:', user.uid);
      return user;
      
    } catch (error) {
      console.error('[AuthManager] Erro no login anônimo:', error);
      throw this.formatAuthError(error);
    }
  }

  /**
   * Faz logout (reconecta anonimamente)
   */
  async logout() {
    try {
      console.log('[AuthManager] Fazendo logout e reconectando anonimamente...');
      
      await signOut(auth);
      
      // Reconectar anonimamente após logout
      setTimeout(() => {
        this.signInAnonymously();
      }, 100);
      
      console.log('[AuthManager] Logout realizado com sucesso');
      
    } catch (error) {
      console.error('[AuthManager] Erro ao fazer logout:', error);
      throw this.formatAuthError(error);
    }
  }

  /**
   * Verifica se o usuário está autenticado (anonimamente)
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
   * Verifica se é usuário anônimo
   */
  isAnonymous() {
    return this.currentUser ? this.currentUser.isAnonymous : false;
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
   * Formata erros de autenticação para exibição amigável
   */
  formatAuthError(error) {
    const errorMessages = {
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      'auth/operation-not-allowed': 'Autenticação anônima não está habilitada.',
      'auth/invalid-api-key': 'Chave de API inválida.',
      'auth/app-deleted': 'Aplicação Firebase foi deletada.',
      'auth/user-disabled': 'Usuário foi desabilitado.',
      'auth/web-storage-unsupported': 'Armazenamento web não suportado.'
    };

    return {
      code: error.code || 'unknown',
      message: errorMessages[error.code] || error.message || 'Erro desconhecido de autenticação anônima'
    };
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