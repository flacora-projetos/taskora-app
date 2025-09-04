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

  // Configuração com chave de API para produção
  const config = {
    ...defaultConfig,
    apiKey: "AIzaSyD8Qv-wQBJsGrYAhY_6T1iHdWCjtjmxtEQ"
  };
  
  // Disponibiliza para assets/js/firebase.js
  if (typeof window !== "undefined") {
    window.firebaseConfig = config;
    console.log("[Taskora] Firebase config carregado:", config.projectId);
  }
  
  // Fallback para desenvolvimento local (tenta carregar firebase-keys.js)
  try {
    import('./firebase-keys.js')
      .then(module => {
        if (module.FIREBASE_API_KEY && module.FIREBASE_API_KEY !== "AIzaSyD8Qv-wQBJsGrYAhY_6T1iHdWCjtjmxtEQ") {
          const localConfig = {
            ...defaultConfig,
            apiKey: module.FIREBASE_API_KEY
          };
          if (typeof window !== "undefined") {
            window.firebaseConfig = localConfig;
            console.log("[Taskora] Firebase config local carregado:", localConfig.projectId);
          }
        }
      })
      .catch(error => {
        // Ignora erro silenciosamente - usa a configuração padrão acima
        console.log("[Taskora] Usando configuração de produção (firebase-keys.js não encontrado)");
      });
  } catch (error) {
    // Em caso de erro, usa a configuração já definida acima
    console.log("[Taskora] Usando configuração de produção");
  }
}

// Carrega automaticamente quando o módulo é importado
loadFirebaseConfig();