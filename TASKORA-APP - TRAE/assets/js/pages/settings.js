(function(global){
  function render(){
    const div = document.createElement("div");
    div.innerHTML = `<h2>Ajustes</h2><p>Preferências locais do app aparecerão aqui.</p>`;
    return div;
  }
  global.TaskoraPages = global.TaskoraPages || {};
  global.TaskoraPages.settings = { render };
})(window);
