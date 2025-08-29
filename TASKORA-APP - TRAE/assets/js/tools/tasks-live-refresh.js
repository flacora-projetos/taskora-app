// assets/js/tools/tasks-live-refresh.js
// Atualiza o calendário automaticamente após criar/editar/apagar tarefa
(() => {
  function onChanged() {
    try {
      // reaproveita o fluxo que o calendário já escuta
      window.TaskoraFilters?.apply?.();
    } catch (_) {}
  }
  window.addEventListener('taskora:tasks:changed', onChanged);
})();
