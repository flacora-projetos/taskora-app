// Taskora — Firebase (PROJETO NOVO)
// Este arquivo injeta o firebaseConfig no window antes do app iniciar.
// Mantemos o nome e caminho para não precisar alterar os HTMLs.
// Ambiente: produção com autenticação anônima habilitada (sem tela de login).

export const firebaseConfig = {
  apiKey: "AIzaSyBQt2qBnUR4P3Wd3CPl3c6W9xMCz2yf6-4",
  authDomain: "taskora-39404.firebaseapp.com",
  projectId: "taskora-39404",
  storageBucket: "taskora-39404.firebasestorage.app",
  messagingSenderId: "650011927392",
  appId: "1:650011927392:web:26d75b732ecbb21dacf405"
}; // valores fornecidos pelo usuário:contentReference[oaicite:1]{index=1}

if (typeof window !== "undefined") {
  // Disponibiliza para assets/js/firebase.js
  window.firebaseConfig = firebaseConfig;
  // Log leve para conferência no console
  console.log("[Taskora] Firebase config carregado:", firebaseConfig.projectId);
}
