// assets/js/tools/calendar-fit.js
// Calcula a altura das linhas do calendário para ocupar a área visível, sem rolagem.

const CALFIT = (() => {
  // Seletor do container "branco" onde o calendário vive
  const ROOT_SEL = '#page-root, .page-root, main, body';
  // Seletor da grade e das células (ajuste se for diferente no seu HTML/CSS)
  const GRID_SEL = '.cal-grid';

  // Número fixo de linhas do mês
  const LINHAS = 6;

  // Margem de segurança no rodapé (px).
  // Se sobrar “faixa branca” no fim, diminua este valor.
  // Se aparecer rolagem, aumente um pouco.
  const RESPIRO_PX = 2;

  // Lê uma variável CSS do elemento
  const cssVar = (el, name, fallback = '0') =>
    parseFloat(getComputedStyle(el).getPropertyValue(name) || fallback);

  const getRoot = () => document.querySelector(ROOT_SEL);
  const getGrid = () => document.querySelector(GRID_SEL);

  function aplicar() {
    const root = getRoot();
    const grid = getGrid();
    if (!root || !grid) return;

    // Topo da grade relativo à janela
    const top = grid.getBoundingClientRect().top;
    const vh  = window.innerHeight;

    // gap entre linhas (vem do CSS: --cal-gap)
    const gap = cssVar(grid, '--cal-gap', '12');

    // Altura disponível: da posição do topo da grade até o fim da janela, descontando o RESPIRO_PX
    const disponivel = Math.max(320, Math.floor(vh - top - RESPIRO_PX));

    // Altura de linhas = (altura disponível - gaps entre as 6 linhas) / 6
    const alturaLinha = Math.floor((disponivel - gap * (LINHAS - 1)) / LINHAS);

    // Aplica como variável CSS que a .cal-grid usa no grid-auto-rows
    grid.style.setProperty('--cal-altura-linha', `${alturaLinha}px`);

    // Força a altura exata da grade (somatório de linhas + gaps) e esconde rolagem vertical aqui
    const alturaGrade = alturaLinha * LINHAS + gap * (LINHAS - 1);
    grid.style.height = `${alturaGrade}px`;
    grid.style.overflowY = 'hidden';
  }

  // Recalcula em eventos de resize e quando o DOM mudar (ex.: filtros alteram a barra e movem o grid)
  function instalarObservers() {
    window.addEventListener('resize', aplicar, { passive: true });

    // Se a app alterar cabeçalhos/filtros (altura acima do calendário), o topo do grid muda => refit
    const obs = new MutationObserver(() => aplicar());
    obs.observe(document.body, { childList: true, subtree: true, attributes: true });

    // Algumas telas “repintam” o calendário — oferecemos um hook:
    window.addEventListener('taskora:calendar:rerender', aplicar);
  }

  function init() {
    // roda depois do paint inicial
    requestAnimationFrame(aplicar);
    instalarObservers();
  }

  document.addEventListener('DOMContentLoaded', init);

  // Exponho um helper para você chamar manualmente se quiser:
  return { refit: aplicar };
})();
