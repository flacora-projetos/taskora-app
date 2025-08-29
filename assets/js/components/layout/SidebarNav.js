// Sidebar com título "Menu" no topo e navegação organizada por seções
const NAV_SECTIONS = [
  {
    title: "Principais",
    items: [
      { hash: "#/tasks",     label: "Tasks",      icon: iconTasks },
      { hash: "#/calendar",  label: "Calendário", icon: iconCalendar }
    ]
  },
  {
    title: "Gestão",
    items: [
      { hash: "#/clients",   label: "Clientes",   icon: iconClients },
      { hash: "#/history",   label: "Histórico",  icon: iconHistory },
      { hash: "#/insights",  label: "Insights",   icon: iconInsights }
    ]
  },
  {
    title: "Configurações",
    items: [
      { hash: "#/team",      label: "Team",       icon: iconTeam },
      { hash: "#/settings",  label: "Ajustes",    icon: iconSettings }
    ]
  }
];

// Lista plana para compatibilidade
const NAV = NAV_SECTIONS.flatMap(section => section.items);

let container;

function mount(el){
  container = el;
  render();
}

function render(){
  container.innerHTML = `
    <div class="menu-title">
      ${iconHamburger()}
      <span>Menu</span>
    </div>

    <nav class="nav" role="navigation" aria-label="Navegação principal">
      ${NAV_SECTIONS.map(section => `
        <div class="nav-section">
          <div class="section-title">${section.title}</div>
          ${section.items.map(item => `
            <a class="item" href="${item.hash}" data-hash="${item.hash}">
              ${item.icon()}
              <span class="label">${item.label}</span>
            </a>
          `).join("")}
        </div>
      `).join("")}
    </nav>
  `;
}

function setActive(hash){
  const items = container.querySelectorAll(".nav .item");
  items.forEach(a => a.classList.toggle("active", a.dataset.hash===hash));
}

/* Ícones */
function iconHamburger(){ return svg(`<path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`); }
// NOVO: check para Tasks
function iconTasks(){ return svg(`<path d="M20 7l-11 11-5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`); }

function iconCalendar(){ return svg(`<rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 3v4M16 3v4M3 9h18" stroke="currentColor" stroke-width="2"/>`); }
function iconClients(){ return svg(`<path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4Z" stroke="currentColor" stroke-width="2" fill="none"/>`); }
function iconHistory(){ return svg(`<path d="M3 12a9 9 0 1 0 3-6.7" stroke="currentColor" stroke-width="2" fill="none"/><path d="M3 3v5h5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 7v6l4 2" stroke="currentColor" stroke-width="2" fill="none"/>`); }
function iconInsights(){ return svg(`<path d="M5 13v6M10 9v10M15 5v14M20 2v17" stroke="currentColor" stroke-width="2"/>`); }
function iconTeam(){ return svg(`<path d="M8 13a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M2 20c0-3 3-5 6-5m8 5c0-3-3-5-6-5" stroke="currentColor" stroke-width="2" fill="none"/>`); }
function iconSettings(){ return svg(`<path d="M12 8a4 4 0 1 0 4 4 4 4 0 0 0-4-4Z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M19.4 15a1 1 0 0 0 .2 1.1l.2.2a2 2 0 1 1-2.8 2.8l-.2-.2a1 1 0 0 0-1.1-.2 8.1 8.1 0 0 1-2.7 1.1 1 1 0 0 0-.8.9V22a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.8-.9 8.1 8.1 0 0 1-2.7-1.1 1 1 0 0 0-1.1.2l-.2.2a2 2 0 1 1-2.8-2.8l.2-.2a1 1 0 0 0 .2-1.1A8.1 8.1 0 0 1 2.6 12 8.1 8.1 0 0 1 3.7 9.3a1 1 0 0 0-.2-1.1l-.2-.2A2 2 0 1 1 6.1 5l.2.2a1 1 0 0 0 1.1.2A8.1 8.1 0 0 1 10.1 4a1 1 0 0 0 .8-.9V3a2 2 0 0 1 4 0v.2a1 1 0 0 0 .8.9 8.1 8.1 0 0 1 2.7 1.1 1 1 0 0 0 1.1-.2l.2-.2a2 2 0 1 1 2.8 2.8l-.2.2a1 1 0 0 0-.2 1.1A8.1 8.1 0 0 1 21.4 12a8.1 8.1 0 0 1-2 3Z" stroke="currentColor" stroke-width="1.5" fill="none"/>`); }

function svg(inner){ return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`; }

export default { mount, setActive };
