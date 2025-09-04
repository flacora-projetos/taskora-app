// Inicialização Firebase (modular via CDN)
import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Detectar se está em ambiente de desenvolvimento
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('.local');

// Detectar se está em produção (Vercel, Netlify, etc.)
const isProduction = window.location.hostname.includes('.vercel.app') ||
                    window.location.hostname.includes('.netlify.app') ||
                    window.location.hostname.includes('.app') ||
                    !isDevelopment;

// Live Server configurado para usar localhost:8000 (mesma porta do npx serve)
// Isso evita problemas de autenticação com o Firebase Auth
if (isDevelopment) {
  console.log('🔧 Firebase configurado para localhost:8000 - compatível com Live Server');
} else {
  console.log('🚀 Firebase configurado para produção:', window.location.hostname);
}

// Configuração para aceitar tanto localhost quanto produção
const isLocalDevelopment = isDevelopment;

// Lê o config previamente definido por assets/js/config/firebase-*.js
const cfg = (typeof window !== "undefined" && window.firebaseConfig) ? window.firebaseConfig : {};

if (!cfg || !cfg.projectId) {
  console.warn("[Taskora] firebaseConfig ausente ou inválido. Defina via assets/js/config/firebase-*.js antes do app.");
}

// Evita múltiplas inicializações em hot-reload/Live Server
const app = getApps().length ? getApp() : initializeApp(cfg, "taskora");
const db = getFirestore(app);

if (isLocalDevelopment) {
  try {
    // Conectar aos emuladores do Firebase apenas se estiverem disponíveis
    // Comentado para forçar uso do Firebase de produção mesmo em desenvolvimento
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectAuthEmulator(auth, 'http://localhost:9099');
    // connectStorageEmulator(storage, 'localhost', 9199);
    // connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('🔧 Ambiente de desenvolvimento detectado, usando Firebase de produção');
  } catch (error) {
    console.warn('⚠️ Erro ao conectar aos emuladores, usando Firebase de produção:', error);
  }
}

// Exports padrão do app
export { app, db };

// Útil para inspeção no console
if (typeof window !== "undefined") {
  window.TaskoraFirebase = {
    app,
    db,
    projectId: cfg?.projectId || "(desconhecido)"
  };
  console.log("[Taskora] Firebase inicializado:", window.TaskoraFirebase.projectId);
}
