// Taskora — Firebase (PROJETO NOVO)
// Este arquivo injeta o firebaseConfig no window antes do app iniciar.
// Mantemos o nome e caminho para não precisar alterar os HTMLs.
// Ambiente: produção com autenticação anônima habilitada (sem tela de login).

export const firebaseConfig = {
  apiKey: "AIzaSyD8Qv-wQBJsGrYAhY_6T1iHdWCjtjmxtEQ",
  authDomain: "dacora---tarefas.firebaseapp.com",
  projectId: "dacora---tarefas",
  storageBucket: "dacora---tarefas.firebasestorage.app",
  messagingSenderId: "406318974539",
  appId: "1:406318974539:web:d842997c1b064c0ba56fce"
}; // Configuração da Dácora - migrado do export-dacora-data.html

if (typeof window !== "undefined") {
  // Disponibiliza para assets/js/firebase.js
  window.firebaseConfig = firebaseConfig;
  // Log leve para conferência no console
  console.log("[Dácora] Firebase config carregado:", firebaseConfig.projectId);
}
