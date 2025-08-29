import { app } from "./firebase.js";
import "./store/filtersStore.js";
import SidebarNav from "./components/layout/SidebarNav.js";
import Topbar from "./components/layout/Topbar.js";
import GlobalFiltersBar from "./components/layout/GlobalFiltersBar.js";

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
  const hideGlobalFilters = ["#/clients", "#/history", "#/tasks"].includes(hash);
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

window.addEventListener("hashchange", renderRoute);
window.addEventListener("load", renderRoute);
