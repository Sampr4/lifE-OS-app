/** UI-only shell module. */
'use strict';
function renderDashboard(stage){stage.innerHTML=`<div class="hero-row"><div class="hero-copy"><p class="hero-greet">Olá 👋</p><h1 class="hero-headline">LifeOS em modo visual.</h1><p class="hero-sub">Aguardando conexão. Nenhum dado real ou inventado está ativo.</p></div></div><section class="card">${_emptyState('Dashboard vazio','Cards e métricas serão carregados futuramente.')}</section>`;}
function editReminder(){showToast('Aguardando conexão');}
