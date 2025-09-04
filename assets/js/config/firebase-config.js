// Taskora — Firebase (Configuração Segura)
// Este arquivo carrega a configuração do Firebase de forma segura, sem expor chaves de API no código fonte.
// As chaves de API são carregadas de variáveis de ambiente ou de um arquivo local não versionado.

// Função para carregar a configuração do Firebase
export function loadFirebaseConfig() {
  // Configuração padrão sem chaves sensíveis
  const defaultConfig = {
    authDomain: "dacora---tarefas.firebaseapp.com",
    projectId: "dacora---tarefas",
    storageBucket: "dacora---tarefas.firebasestorage.app",
    messagingSenderId: "406318974539",
    appId: "1:406318974539:web:d842997c1b064c0ba56fce"
  };

  // Tenta carregar a chave de API de um arquivo local não versionado
  try {
    // Importa dinamicamente o arquivo de configuração local (não versionado)
    import('./firebase-keys.js')
      .then(module => {
        // Mescla a configuração padrão com a chave de API
        const config = {
          ...defaultConfig,
          apiKey: module.FIREBASE_API_KEY
        };
        
        // Disponibiliza para assets/js/firebase.js
        if (typeof window !== "undefined") {
          window.firebaseConfig = config;
          console.log("[Taskora] Firebase config carregado com segurança:", config.projectId);
        }
      })
      .catch(error => {
        console.error("[Taskora] Erro ao carregar chaves do Firebase. Verifique se o arquivo firebase-keys.js existe:", error);
        console.warn("[Taskora] Usando configuração sem chave de API. O aplicativo não funcionará corretamente.");
        
        // Em caso de erro, disponibiliza a configuração sem a chave de API
        if (typeof window !== "undefined") {
          window.firebaseConfig = defaultConfig;
        }
      });
  } catch (error) {
    console.error("[Taskora] Erro ao carregar configuração do Firebase:", error);
    
    // Em caso de erro, disponibiliza a configuração sem a chave de API
    if (typeof window !== "undefined") {
      window.firebaseConfig = defaultConfig;
    }
  }
}

// Carrega a configuração automaticamente
loadFirebaseConfig();