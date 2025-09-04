// firebase.js - Configuração do Firebase para Taskora
// ATUALIZADO: 15/09/2025 - Correção definitiva da chave de API

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getStorage, connectStorageEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { getFunctions, connectFunctionsEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js';

// Configuração do Firebase - Dácora (CORRIGIDA)
const firebaseConfig = {
  apiKey: "AIzaSyD8Qv-wQBJsGrYAhY_6T1iHdWCjtjmxtEQ",
  authDomain: "dacora---tarefas.firebaseapp.com",
  projectId: "dacora---tarefas",
  storageBucket: "dacora---tarefas.firebasestorage.app",
  messagingSenderId: "406318974539",
  appId: "1:406318974539:web:d842997c1b064c0ba56fce"
};

// Log para debug - verificar se a chave está correta
console.log('[Firebase] Configuração carregada - API Key:', firebaseConfig.apiKey.substring(0, 20) + '...');

// Inicializa o Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('[Dácora] Firebase inicializado com sucesso');
} catch (error) {
  console.error('[Dácora] Erro ao inicializar Firebase:', error);
  throw error;
}

// Inicializa os serviços
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Configuração para desenvolvimento (emuladores) - DESABILITADO PARA PERMITIR ACESSO LOCAL
const isDevelopment = false; // Forçar uso do Firebase de produção mesmo em localhost

// Comentado para permitir acesso local sem emuladores
/*
if (isDevelopment) {
  console.log('[Dácora] Modo desenvolvimento detectado');
  
  // Conecta aos emuladores se estiver em desenvolvimento
  try {
    // Firestore Emulator
    if (!db._delegate._databaseId.projectId.includes('demo-')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('[Taskora] Conectado ao Firestore Emulator');
    }
    
    // Auth Emulator
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    console.log('[Taskora] Conectado ao Auth Emulator');
    
    // Storage Emulator
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('[Taskora] Conectado ao Storage Emulator');
    
    // Functions Emulator
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('[Taskora] Conectado ao Functions Emulator');
    
  } catch (error) {
    console.warn('[Dácora] Emuladores não disponíveis, usando Firebase produção:', error.message);
  }
}
*/

console.log('[Dácora] Usando Firebase de produção para desenvolvimento local');

// Configurações globais
export const FIREBASE_CONFIG = {
  projectId: firebaseConfig.projectId,
  isDevelopment,
  collections: {
    tasks: 'tasks',
    clients: 'clients',
    team: 'team',
    projects: 'projects',
    settings: 'settings',
    users: 'users'
  },
  limits: {
    maxBatchSize: 500,
    maxQuerySize: 1000,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFilesPerUpload: 10
  }
};

// Utilitários para Firebase
export const FirebaseUtils = {
  /**
   * Verifica se o Firebase está conectado
   */
  async isConnected() {
    try {
      await db._delegate._databaseId;
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Obtém informações do projeto
   */
  getProjectInfo() {
    return {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      isDevelopment
    };
  },

  /**
   * Formata erro do Firebase para exibição
   */
  formatError(error) {
    const errorMessages = {
      'permission-denied': 'Permissão negada. Verifique suas credenciais.',
      'not-found': 'Documento não encontrado.',
      'already-exists': 'Documento já existe.',
      'resource-exhausted': 'Cota excedida. Tente novamente mais tarde.',
      'failed-precondition': 'Operação falhou. Verifique os dados.',
      'aborted': 'Operação cancelada devido a conflito.',
      'out-of-range': 'Valor fora do intervalo permitido.',
      'unimplemented': 'Operação não implementada.',
      'internal': 'Erro interno do servidor.',
      'unavailable': 'Serviço temporariamente indisponível.',
      'data-loss': 'Perda de dados detectada.',
      'unauthenticated': 'Usuário não autenticado.'
    };

    return errorMessages[error.code] || error.message || 'Erro desconhecido';
  },

  /**
   * Retry automático para operações
   */
  async retry(operation, maxAttempts = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        
        console.warn(`[Taskora] Tentativa ${attempt} falhou, tentando novamente em ${delay}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
};

// Event listeners para monitoramento
if (typeof window !== 'undefined') {
  // Monitora estado da conexão
  window.addEventListener('online', () => {
    console.log('[Taskora] Conexão restaurada');
  });

  window.addEventListener('offline', () => {
    console.warn('[Taskora] Conexão perdida');
  });

  // Expõe utilitários globalmente para debug
  window.FirebaseUtils = FirebaseUtils;
  window.FIREBASE_CONFIG = FIREBASE_CONFIG;
}

// Log de inicialização
console.log('[Dácora] Firebase configurado:', {
  projectId: firebaseConfig.projectId,
  isDevelopment,
  timestamp: new Date().toISOString()
});

export default app;