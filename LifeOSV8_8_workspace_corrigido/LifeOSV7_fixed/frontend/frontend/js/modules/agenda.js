/** UI-only shell module. */
'use strict';
function renderAgenda(stage){stage.innerHTML=`<section class="card"><div class="section-head"><h2>Agenda</h2></div>${_emptyState('Agenda vazia','Eventos serão carregados futuramente.')}</section>`;}
function renderNotas(stage){renderAgenda(stage);}
