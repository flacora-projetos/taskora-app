import app from "../config/firebase.js";
import "./store/filtersStore.js";
import SidebarNav from "./components/layout/SidebarNav.js";
import Topbar from "./components/layout/Topbar.js";
import GlobalFiltersBar from "./components/layout/GlobalFiltersBar.js";
import authManager from "./auth/authManager.js";

// Pages (placeholders rápidos)
import "./pages/tasks.js";
import "./pages/calendar.js";
import "./pages/clients.js";
import "./pages/history.js";
import "./pages/insights.js";
import "./pages/team.js";
import "./pages/settings.js";

const elSidebar = document.getElementById("sidebar");
const elTopbar = document.getElementById("topbar");
const elFilters = document.getElementById("global-filters");
const elPageRoot = document.getElementById("page-root");

// Mount layout
SidebarNav.mount(elSidebar);
Topbar.mount(elTopbar);
GlobalFiltersBar.mount(elFilters);

// Router simples por hash
const routes = {
  "#/tasks": window.TaskoraPages.tasks,
  "#/calendar": window.TaskoraPages.calendar,
  "#/clients": window.TaskoraPages.clients,
  "#/history": window.TaskoraPages.history,
  "#/insights": window.TaskoraPages.insights,
  "#/team": window.TaskoraPages.team,
  "#/settings": window.TaskoraPages.settings
};

function renderRoute() {
  const hash = window.location.hash || "#/tasks";
  const page = routes[hash] || routes["#/tasks"];
  
  // hide/show global filters based on page
  const hideGlobalFilters = ["#/clients", "#/history", "#/tasks", "#/team"].includes(hash);
  elFilters.style.display = hideGlobalFilters ? "none" : "block";
  
  // atualiza active do menu
  SidebarNav.setActive(hash);
  // render page
  elPageRoot.innerHTML = "";
  const node = page.render();
  elPageRoot.appendChild(node);
  
  // render integrated filters for tasks page
  if (hash === "#/tasks") {
    const tasksFiltersContainer = node.querySelector("#global-filters-container");
    if (tasksFiltersContainer) {
      GlobalFiltersBar.mount(tasksFiltersContainer);
    }
  }
  
  if (page.afterRender) page.afterRender();
}

// Variáveis de controle de autenticação
let isAppInitialized = false;

// Inicialização da aplicação
async function initializeApp() {
  try {
    console.log('[Taskora] Inicializando aplicação com autenticação anônima...');
    
    // Aguarda a inicialização do auth
    await authManager.waitForAuthInit();
    
    // Com autenticação anônima, sempre mostra a app principal
    showMainApp();
    
  } catch (error) {
    console.error('[Taskora] Erro na inicialização:', error);
    // Mesmo com erro, tenta mostrar a app
    showMainApp();
  }
}

function showMainApp() {
  console.log('[Taskora] Exibindo aplicação principal');
  
  // Exibe a aplicação principal
  document.body.classList.remove('auth-mode');
  document.body.classList.add('app-mode');
  
  // Renderiza a rota atual
  renderRoute();
  
  if (!isAppInitialized) {
    // Configura o router
    window.addEventListener('hashchange', renderRoute);
    isAppInitialized = true;
  }
}

// Listener para mudanças no estado de autenticação
authManager.onAuthStateChange((user) => {
  if (user) {
    console.log('[Taskora] Usuário conectado anonimamente:', user.uid);
    if (!isAppInitialized) {
      showMainApp();
    }
  } else {
    console.log('[Taskora] Usuário desconectado, tentando reconectar...');
    // Tenta reconectar automaticamente
    authManager.signInAnonymously();
  }
});

// Inicializar quando a página carregar
window.addEventListener("load", initializeApp);

// Expor funções globalmente para debug
if (typeof window !== 'undefined') {
  window.TaskoraApp = {
    authManager,
    showMainApp,
    renderRoute
  };
}
