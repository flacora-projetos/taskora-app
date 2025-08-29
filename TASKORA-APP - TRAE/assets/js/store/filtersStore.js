// assets/js/tools/filtersStore.js
// Store simples para filtros globais (pub/sub) — reseta ao sair do app
(function(global){
  const listeners = new Set();

  const defaults = {
    status: "all",
    client: "all",
    owner: "all",
    dateFrom: "",
    dateTo: "",
    quick: "last30" // apenas UI
  };

  let state = {
    ...defaults,
    ...(JSON.parse(localStorage.getItem("taskora.filters") || "{}"))
  };

  function get(){ return { ...state }; }

  function set(patch){
    state = { ...state, ...(patch || {}) };
    localStorage.setItem("taskora.filters", JSON.stringify(state));
    emit({type:"change"});
  }

  function apply(){
    localStorage.setItem("taskora.filters", JSON.stringify(state));
    emit({type:"apply"});
  }

  function clear(){
    state = {...defaults};
    localStorage.setItem("taskora.filters", JSON.stringify(state));
    emit({type:"clear"});
  }

  function on(fn){ listeners.add(fn); return ()=>listeners.delete(fn); }
  function emit(evt){ for(const fn of listeners) fn(get(), evt||{type:"change"}); }

  // Resetar filtros ao sair do app
  window.addEventListener('beforeunload', () => {
    try {
      localStorage.removeItem("taskora.filters");
      state = { ...defaults };
    } catch(_) {}
  });

  global.TaskoraFilters = { get, set, on, apply, clear, defaults };
})(window);
