/* Taskora – Calendar Sizing Override (não-invasivo)
   - Calcula a altura da célula por Nº de semanas do mês (layoutOK style).
   - Não altera seu calendar.js; apenas observa render e aplica --cal-cell-h.
   - Também mitiga “dias duplicados” garantindo limpeza antes de repinturas via evento.
*/

(function () {
  const SELECTORS = {
    grid: '.tk-cal, .calendar-grid, [data-cal-grid]',
    cell: '.cal-cell, .tk-day',
    pageRoot: '#page-root, .page-root, #app, body'
  };

  function $(sel) {
    for (const s of sel.split(',')) {
      const el = document.querySelector(s.trim());
      if (el) return el;
    }
    return null;
  }

  function all(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function computeWeeks(gridEl) {
    // Se não houver células ainda, estima 6 semanas (pior caso)
    const cells = all(SELECTORS.cell, gridEl);
    if (!cells.length) return 6;
    // Tenta inferir pelas células montadas
    const count = cells.length;
    const weeks = Math.ceil(count / 7);
    return Math.min(Math.max(weeks, 4), 6); // clamp 4..6
  }

  function applyCellHeight(gridEl) {
    try {
      const root = $(SELECTORS.pageRoot) || document.body;
      const rootRect = root.getBoundingClientRect();
      const gridRect = gridEl.getBoundingClientRect();

      const viewportH = window.innerHeight;
      // Altura útil até o fim do container branco / viewport (o que vier primeiro)
      const baseBottom = Math.min(rootRect.bottom, viewportH);
      const BOTTOM_MARGIN = 16;     // respiro p/ não forçar scroll
      const available = Math.max(300, Math.floor(baseBottom - gridRect.top - BOTTOM_MARGIN));

      const weeks = computeWeeks(gridEl);
      // Gap da grid (pega do CSS computado da grid)
      const gridStyles = getComputedStyle(gridEl);
      const rowGap = parseFloat(gridStyles.rowGap || gridStyles.gap || '6') || 6;
      const totalGaps = (weeks - 1) * rowGap;

      const raw = (available - totalGaps) / weeks;
      const h = Math.max(100, Math.floor(raw)); // mínimo confortável

      document.documentElement.style.setProperty('--cal-cell-h', `${h}px`);
    } catch (_) { /* silencioso */ }
  }

  function fitNow() {
    const grid = $(SELECTORS.grid);
    if (!grid) return;
    applyCellHeight(grid);
  }

  // Observa a grid e re-aplica sizing quando ela é redesenhada
  const mo = new MutationObserver((mutations) => {
    // Se a quantidade de células mudou, refaz o cálculo
    let relevant = false;
    for (const m of mutations) {
      if (m.type === 'childList') { relevant = true; break; }
    }
    if (relevant) {
      requestAnimationFrame(fitNow);
    }
  });

  function tryObserve() {
    const grid = $(SELECTORS.grid);
    if (!grid) return false;
    mo.observe(grid, { childList: true, subtree: false });
    return true;
  }

  // Eventos “amigáveis” que o calendário pode emitir
  document.addEventListener('taskora:calendar:rendered', fitNow, { passive: true });
  document.addEventListener('taskora:calendar:layout',   fitNow, { passive: true });

  // Debounce em resize/zoom
  let raf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(fitNow);
  }, { passive: true });

  // Mitigação simples para “dias duplicados” em repaints encadeados:
  // se o app emitir este evento antes de redesenhar, limpamos a grid.
  document.addEventListener('taskora:calendar:before-render', () => {
    const grid = $(SELECTORS.grid);
    if (grid) grid.innerHTML = '';
  });

  // Boot
  function init() {
    if (tryObserve()) {
      fitNow();
    } else {
      // tenta novamente quando a página montar
      setTimeout(init, 60);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API opcional global
  window.TaskoraCalendarSizing = { fit: fitNow };
})();
