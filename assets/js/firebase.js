// Inicialização Firebase (modular via CDN)
import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Lê o config previamente definido por assets/js/config/firebase-*.js
const cfg = (typeof window !== "undefined" && window.firebaseConfig) ? window.firebaseConfig : {};

if (!cfg || !cfg.projectId) {
  console.warn("[Taskora] firebaseConfig ausente ou inválido. Defina via assets/js/config/firebase-*.js antes do app.");
}

// Evita múltiplas inicializações em hot-reload/Live Server
const app = getApps().length ? getApp() : initializeApp(cfg, "taskora");
const db = getFirestore(app);

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
