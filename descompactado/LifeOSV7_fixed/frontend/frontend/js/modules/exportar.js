/** UI-only shell module. */
'use strict';
function renderExportar(stage){stage.innerHTML=`<section class="card"><div class="section-head"><h2>Exportar</h2></div>${_emptyState('Sem dados','Exportação desativada até a conexão.')}</section>`;}
function exportAllJSON(){showToast('Sem dados para exportar');}
function exportVisualReport(){showToast('Sem dados para exportar');}
