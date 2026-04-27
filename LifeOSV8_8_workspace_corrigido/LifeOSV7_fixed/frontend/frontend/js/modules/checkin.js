/** UI-only shell module. */
'use strict';
function renderCheckin(stage){stage.innerHTML=`<section class="card"><div class="section-head"><h2>Check-in</h2></div>${_emptyState('Aguardando conexão','Perguntas e respostas serão fornecidas pelo backend.')}</section>`;}
function answerCheckin(){showToast('Aguardando conexão');}
function finishCheckin(){showToast('Aguardando conexão');}
