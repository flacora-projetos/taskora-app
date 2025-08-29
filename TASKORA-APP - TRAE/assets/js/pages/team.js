(function(global){
  function render(){
    const div = document.createElement("div");
    div.innerHTML = `<h2>Team</h2><p>Em breve.</p>`;
    return div;
  }
  global.TaskoraPages = global.TaskoraPages || {};
  global.TaskoraPages.team = { render };
})(window);
