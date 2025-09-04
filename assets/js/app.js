import { app } from "./firebase.js";
import "./store/filtersStore.js";
import SidebarNav from "./components/layout/SidebarNav.js";
import Topbar from "./components/layout/Topbar.js";
import GlobalFiltersBar from "./components/layout/GlobalFiltersBar.js";
import authManager from "./auth/authManager.js";
import LoginForm from "./components/auth/LoginForm.js";

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
let loginForm = null;

// Inicializar aplicação com autenticação
async function initializeApp() {
  console.log('[App] Inicializando aplicação com autenticação...');
  
  // Aguardar inicialização da autenticação
  const user = await authManager.waitForAuthInit();
  
  if (user) {
    console.log('[App] Usuário autenticado:', user.email);
    showMainApp();
  } else {
    console.log('[App] Usuário não autenticado, mostrando tela de login');
    showLoginForm();
  }
}

// Mostrar aplicação principal
function showMainApp() {
  // Remover tela de login se existir
  if (loginForm) {
    loginForm.destroy();
    loginForm = null;
  }
  
  // Mostrar elementos da aplicação
  const appShell = document.querySelector('.app-shell');
  if (appShell) {
    appShell.style.display = 'flex';
  }
  
  // Inicializar roteamento se ainda não foi feito
  if (!isAppInitialized) {
    window.addEventListener("hashchange", renderRoute);
    renderRoute(); // Renderizar rota inicial
    isAppInitialized = true;
    console.log('[App] Aplicação principal inicializada');
  }
}

// Mostrar formulário de login
function showLoginForm() {
  // Esconder aplicação principal
  const appShell = document.querySelector('.app-shell');
  if (appShell) {
    appShell.style.display = 'none';
  }
  
  // Criar e mostrar formulário de login
  if (!loginForm) {
    loginForm = new LoginForm();
    document.body.appendChild(loginForm.render());
    console.log('[App] Tela de login exibida');
  }
}

// Listener para mudanças no estado de autenticação
authManager.onAuthStateChange((user) => {
  if (user) {
    console.log('[App] Usuário logou:', user.email);
    showMainApp();
  } else {
    console.log('[App] Usuário deslogou');
    showLoginForm();
    isAppInitialized = false;
  }
});

// Inicializar quando a página carregar
window.addEventListener("load", initializeApp);

// Expor funções globalmente para debug
if (typeof window !== 'undefined') {
  window.TaskoraApp = {
    authManager,
    showLoginForm,
    showMainApp,
    renderRoute
  };
}
