/**
 * ============================================================
 * LIFEOS — UTILS.JS
 * Arquivo: js/core/utils.js
 * Função: Funções utilitárias usadas por TODOS os módulos.
 *         Animações, exportação, toast, SVG, cursor glow.
 *         Nada aqui tem lógica de negócio — só ferramentas.
 * ============================================================
 */

'use strict';

// ── ATALHO getElementById ────────────────────────────────────
// Usada em todo o projeto como $('id') em vez de document.getElementById('id')
const $ = id => document.getElementById(id);

// ── DATAS ────────────────────────────────────────────────────

/**
 * Retorna data de hoje formatada com o locale do usuário.
 * Ex (pt-BR): "segunda-feira, 1 de abril"
 * Ex (en-US): "Monday, April 1"
 */
function todayStr() {
  return new Date().toLocaleDateString(LOCALE?.lang || 'pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

// ── ANIMAÇÕES ────────────────────────────────────────────────

/**
 * Anima um número de 0 até 'to' em 'dur' milissegundos.
 * Usada para animar o ring de progresso e métricas.
 * @param {HTMLElement} el - elemento que receberá o número
 * @param {number}      to - valor final
 * @param {number}      dur - duração em ms (padrão: 900)
 * @param {Function}    fmt - função de formatação (padrão: valor bruto)
 */
function animNum(el, to, dur = 900, fmt = v => v) {
  if (!el) return;
  const start = performance.now();
  const step  = now => {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3); // easing cúbico
    el.textContent = fmt(Math.round(to * e));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/**
 * Anima todas as barras e rings da página.
 * Busca elementos com data-bar="%" e data-ring="offset".
 * Chamada após renderizar qualquer módulo.
 */
function animateBars() {
  document.querySelectorAll('[data-bar]').forEach(el => {
    el.style.width = el.dataset.bar + '%';
  });
  document.querySelectorAll('[data-ring]').forEach(el => {
    el.style.strokeDashoffset = el.dataset.ring;
  });
}

// ── TOAST (NOTIFICAÇÃO FLUTUANTE) ────────────────────────────

/**
 * Exibe uma mensagem flutuante por 2.8 segundos.
 * @param {string} msg - mensagem a exibir
 */
function showToast(msg) {
  const t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── EXPORTAÇÃO DE DADOS ──────────────────────────────────────

/**
 * Faz download de conteúdo como arquivo.
 * @param {string} content  - conteúdo do arquivo
 * @param {string} filename - nome do arquivo
 * @param {string} type     - MIME type
 */
function download(content, filename, type) {
  const a = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(new Blob([content], { type })),
    download: filename,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Exporta array de objetos como CSV.
 * As colunas são detectadas automaticamente pelas chaves do primeiro objeto.
 * @param {Array}  rows     - array de objetos
 * @param {string} filename - nome do arquivo .csv
 */
function exportCSV(rows, filename) {
  if (!rows || !rows.length) {
    showToast('Nenhum dado para exportar.');
    return;
  }
  const headers = Object.keys(rows[0]);
  const body    = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');
  download(body, filename, 'text/csv;charset=utf-8;');
  showToast('CSV exportado ✅');
}

/**
 * Exporta qualquer objeto/array como JSON formatado.
 * @param {*}      data     - dados a exportar
 * @param {string} filename - nome do arquivo .json
 */
function exportJSON(data, filename) {
  download(JSON.stringify(data, null, 2), filename, 'application/json');
  showToast('JSON exportado ✅');
}

// ── SVG BAR (GRÁFICO DE BARRAS) ──────────────────────────────

/**
 * Gera SVG de barras de produtividade semanal.
 * Usada no Dashboard para mostrar consistência da semana.
 * @param {Array} data - [{ day: 'Seg', pct: 65 }, ...]
 * @returns {string} HTML do SVG
 */
function svgBar(data) {
  const W=340, H=130, pL=10, pB=24, pT=14, pR=10;
  const cW = W-pL-pR, cH = H-pB-pT;
  const bW = (cW / data.length) * 0.52;
  const gap = cW / data.length;
  let bars='', labels='', vals='';

  // Hoje = índice do dia da semana (0=Dom, mas array começa no Seg, então -1)
  const todayIdx = data.length > 7 ? -1 : new Date().getDay() - 1;
  const isDark   = document.body.classList.contains('dark-theme');
  const colToday = isDark ? '#a855f7' : '#0f0f0f';
  const colOther = isDark ? '#303030' : '#dddddd';

  data.forEach((d, i) => {
    const x  = pL + i * gap + gap / 2 - bW / 2;
    const bH = Math.max((d.pct / 100) * cH, 1);
    const y  = pT + cH - bH;

    // Cada barra tem transição com delay proporcional ao índice
    bars += `<rect x="${x.toFixed(1)}" y="${H}" width="${bW.toFixed(1)}" height="0" rx="3"
      fill="${i === todayIdx ? colToday : colOther}" class="svg-bar"
      data-y="${y.toFixed(1)}" data-h="${bH.toFixed(1)}"
      style="transition:y .9s cubic-bezier(0.34,1.4,0.64,1) ${i*55}ms,height .9s cubic-bezier(0.34,1.4,0.64,1) ${i*55}ms"
      onmouseenter="this.setAttribute('opacity','.5')" onmouseleave="this.setAttribute('opacity','1')"/>`;

    labels += `<text x="${(x+bW/2).toFixed(1)}" y="${H-5}"
      class="svg-lbl" fill="${isDark?'#888':'#999'}" text-anchor="middle">${d.day}</text>`;

    vals += `<text x="${(x+bW/2).toFixed(1)}" y="${y-4}"
      class="svg-val" fill="${isDark?'#bbb':'#666'}" text-anchor="middle"
      opacity="0" id="sv-${i}">${d.pct}%</text>`;
  });

  // Anima as barras após um pequeno delay (aguarda DOM renderizar)
  setTimeout(() => {
    document.querySelectorAll('.svg-bar').forEach((r, i) => {
      r.setAttribute('y',      r.dataset.y);
      r.setAttribute('height', r.dataset.h);
      setTimeout(() => {
        const v = document.getElementById(`sv-${i}`);
        if (v) v.setAttribute('opacity', '1');
      }, 500 + i * 55);
    });
  }, 150);

  const lineCol = isDark ? '#2a2a2a' : '#e8e8e8';
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:200px;overflow:visible">
    <line x1="${pL}" y1="${pT+cH}" x2="${W-pR}" y2="${pT+cH}" stroke="${lineCol}" stroke-width="1"/>
    ${bars}${labels}${vals}
  </svg>`;
}

/**
 * Retorna SVG de um ícone de check (✓ branco).
 * Usado nas listas de hábitos e tarefas concluídas.
 */
function svgCheck() {
  return `<svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <path d="M2 5.5l2.5 2.5L9 3" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

// ── CURSOR GLOW ──────────────────────────────────────────────

/**
 * Efeito de brilho que segue o cursor do mouse.
 * Só ativa em desktop (pointer: fine).
 * Usa lerp para movimento suave.
 */
function initCursorGlow() {
  const glow = $('cursor-glow');
  if (!glow || window.matchMedia('(pointer:coarse)').matches) return;

  let mx=0, my=0, cx=0, cy=0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    glow.style.opacity = '1';
  });
  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
  });

  // Interpolação linear — cria o efeito de "atraso" suave
  const lerp = (a, b, t) => a + (b - a) * t;

  (function tick() {
    cx = lerp(cx, mx, 0.07);
    cy = lerp(cy, my, 0.07);
    glow.style.left = cx + 'px';
    glow.style.top  = cy + 'px';
    requestAnimationFrame(tick);
  })();
}
