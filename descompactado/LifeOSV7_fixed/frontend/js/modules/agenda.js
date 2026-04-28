/* ============================================================
   LIFEOS — MÓDULO: AGENDA
============================================================ */
'use strict';

/* ─── AGENDA (substitui Notas + Calendário) ─────────────────── */
let _agendaDate = new Date().toISOString().slice(0,10);
let _agendaShowForm = false;
let _agendaEditId = null;

function _agendaFmt(dateStr){
  const d = new Date(dateStr+'T12:00:00');
  return d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
}
function _agendaNav(offset){
  const d = new Date(_agendaDate+'T12:00:00');
  d.setDate(d.getDate()+offset);
  _agendaDate = d.toISOString().slice(0,10);
  _agendaShowForm = false;
  _agendaEditId = null;
  renderModule('notas');
}
function _agendaToday(){
  _agendaDate = new Date().toISOString().slice(0,10);
  _agendaShowForm = false;
  _agendaEditId = null;
  renderModule('notas');
}
function _agendaToggleForm(editId){
  if(editId!=null){ _agendaEditId=editId; _agendaShowForm=true; }
  else { _agendaEditId=null; _agendaShowForm=!_agendaShowForm; }
  renderModule('notas');
}
function _agendaSaveEvent(){
  const title = document.getElementById('ag-title').value.trim();
  const time  = document.getElementById('ag-time').value;
  const dur   = parseInt(document.getElementById('ag-dur').value)||30;
  const cat   = document.getElementById('ag-cat').value;
  const note  = document.getElementById('ag-note').value.trim();
  if(!title||!time){ showToast('Preencha título e horário ⚠️'); return; }
  if(_agendaEditId!=null){
    const ev = AGENDA_EVENTS.find(e=>e.id===_agendaEditId);
    if(ev){ ev.title=title; ev.time=time; ev.dur=dur; ev.cat=cat; ev.note=note; }
  } else {
    const newId = (AGENDA_EVENTS.reduce((m,e)=>Math.max(m,e.id),0))+1;
    AGENDA_EVENTS.push({id:newId,date:_agendaDate,time,dur,title,cat,note});
  }
  _agendaShowForm=false; _agendaEditId=null;
  showToast(_agendaEditId!=null?'Evento atualizado ✅':'Evento adicionado ✅');
  renderModule('notas');
}
function _agendaDeleteEvent(id){
  const idx = AGENDA_EVENTS.findIndex(e=>e.id===id);
  if(idx>-1){ AGENDA_EVENTS.splice(idx,1); showToast('Evento removido 🗑️'); renderModule('notas'); }
}

const AG_CAT_COLOR = {trabalho:'#a855f7',estudo:'#c084fc',saúde:'#10b981',pessoal:'#f59e0b'};
const AG_CAT_TAG   = {trabalho:'tag-blue',estudo:'tag-purple',saúde:'tag-green',pessoal:'tag-orange'};

function renderNotas(s){
  const todayIso = new Date().toISOString().slice(0,10);
  const isToday  = _agendaDate === todayIso;

  /* events of selected day, sorted by time */
  const dayEvs = AGENDA_EVENTS
    .filter(e=>e.date===_agendaDate)
    .sort((a,b)=>a.time.localeCompare(b.time));

  /* week strip */
  const weekBase = new Date(_agendaDate+'T12:00:00');
  const dow = weekBase.getDay(); // 0=sun
  const weekDays = [];
  for(let i=0;i<7;i++){
    const d2=new Date(weekBase); d2.setDate(weekBase.getDate()-dow+i);
    const ds=d2.toISOString().slice(0,10);
    const cnt=AGENDA_EVENTS.filter(e=>e.date===ds).length;
    weekDays.push({ds, label:d2.toLocaleDateString('pt-BR',{weekday:'short'}).slice(0,3), num:d2.getDate(), isToday:ds===todayIso, isSel:ds===_agendaDate, cnt});
  }

  /* edit data */
  let editEv = _agendaEditId!=null ? AGENDA_EVENTS.find(e=>e.id===_agendaEditId) : null;

  /* timeline: hours 05–23 */
  const nowH = new Date().getHours(), nowM = new Date().getMinutes();
  function timelineRows(){
    const hours=[];
    for(let h=5;h<=23;h++) hours.push(h);
    return hours.map(h=>{
      const hStr=String(h).padStart(2,'0')+':00';
      const eventsThisHour = dayEvs.filter(e=>{
        const [eh]=e.time.split(':').map(Number); return eh===h;
      });
      const isNowHour = isToday && nowH===h;
      return `<div class="ag-row${isNowHour?' ag-row-now':''}">
        <span class="ag-hour">${hStr}</span>
        <div class="ag-slot">
          ${isNowHour?`<div class="ag-now-line" style="top:${Math.round(nowM/60*100)}%"><span class="ag-now-dot"></span></div>`:''}
          ${eventsThisHour.map(ev=>{
            const col=AG_CAT_COLOR[ev.cat]||'var(--accent)';
            const tag=AG_CAT_TAG[ev.cat]||'tag-gray';
            return `<div class="ag-event" style="border-left:3px solid ${col};background:${col}18;">
              <div class="ag-ev-head">
                <span class="ag-ev-time">${ev.time} · ${ev.dur}min</span>
                <div class="ag-ev-actions">
                  <button class="ag-ev-btn" onclick="_agendaToggleForm(${ev.id})" title="Editar">✏️</button>
                  <button class="ag-ev-btn" onclick="_agendaDeleteEvent(${ev.id})" title="Excluir">🗑️</button>
                </div>
              </div>
              <p class="ag-ev-title">${ev.title}</p>
              ${ev.note?`<p class="ag-ev-note">${ev.note}</p>`:''}
              <span class="tag ${tag}" style="margin-top:.3rem">${ev.cat}</span>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('');
  }

  s.innerHTML=`
  <style>
  .ag-wrap{max-width:760px;margin:0 auto;padding:.25rem 0 3rem}
  /* nav */
  .ag-nav{display:flex;align-items:center;gap:.6rem;margin-bottom:1rem;flex-wrap:wrap}
  .ag-nav-btn{width:34px;height:34px;border-radius:50%;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:1rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all var(--tr)}
  .ag-nav-btn:hover{border-color:var(--accent);color:var(--accent)}
  .ag-date-label{font-size:1rem;font-weight:800;letter-spacing:-.03em;flex:1;text-transform:capitalize}
  .ag-today-btn{font-size:.72rem;padding:.3rem .8rem;border-radius:100px;border:1px solid var(--border);background:var(--bg);color:var(--t2);cursor:pointer;transition:all var(--tr);font-weight:600}
  .ag-today-btn:hover{border-color:var(--accent);color:var(--accent)}
  .ag-today-btn.active{background:var(--accent);color:#fff;border-color:var(--accent)}
  /* week strip */
  .ag-week{display:flex;gap:.3rem;margin-bottom:1.25rem;overflow-x:auto;padding-bottom:.25rem}
  .ag-week::-webkit-scrollbar{height:3px}.ag-week::-webkit-scrollbar-thumb{background:var(--border-mid);border-radius:3px}
  .ag-wday{flex:1;min-width:40px;border:1px solid var(--border);border-radius:var(--r);padding:.45rem .3rem;text-align:center;cursor:pointer;transition:all var(--tr);background:var(--bg);position:relative}
  .ag-wday:hover{border-color:var(--accent)}
  .ag-wday.sel{background:var(--accent);border-color:var(--accent);color:#fff}
  .ag-wday.today-mark{border-color:var(--accent)}
  .ag-wday .ag-wlbl{font-size:.62rem;color:var(--t3);text-transform:uppercase;font-weight:700;letter-spacing:.04em}
  .ag-wday.sel .ag-wlbl{color:rgba(255,255,255,.75)}
  .ag-wday .ag-wnum{font-size:.95rem;font-weight:800;margin-top:.1rem}
  .ag-wday .ag-wcnt{position:absolute;top:3px;right:4px;font-size:.55rem;background:var(--accent);color:#fff;border-radius:100px;padding:0 4px;min-width:14px;text-align:center;line-height:14px;font-weight:700}
  .ag-wday.sel .ag-wcnt{background:rgba(255,255,255,.3);color:#fff}
  /* timeline */
  .ag-timeline{display:flex;flex-direction:column;gap:0}
  .ag-row{display:flex;gap:.75rem;min-height:52px;position:relative}
  .ag-row-now .ag-hour{color:var(--accent);font-weight:700}
  .ag-hour{width:42px;flex-shrink:0;font-size:.72rem;color:var(--t3);font-weight:500;padding-top:.75rem;font-family:var(--font-mono);text-align:right}
  .ag-slot{flex:1;border-left:1px solid var(--border);padding:.5rem 0 .5rem .75rem;position:relative;display:flex;flex-direction:column;gap:.4rem}
  .ag-row:last-child .ag-slot{border-left:1px dashed var(--border)}
  /* now line */
  .ag-now-line{position:absolute;left:-1px;right:0;height:2px;background:var(--danger);border-radius:2px;z-index:2}
  .ag-now-dot{position:absolute;left:-4px;top:-3px;width:8px;height:8px;background:var(--danger);border-radius:50%;display:block}
  /* events */
  .ag-event{border-radius:var(--r-sm);padding:.55rem .75rem;cursor:default;transition:box-shadow var(--tr)}
  .ag-event:hover{box-shadow:var(--shadow)}
  .ag-ev-head{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-bottom:.2rem}
  .ag-ev-time{font-size:.68rem;color:var(--t3);font-family:var(--font-mono);font-weight:500}
  .ag-ev-actions{display:flex;gap:.2rem;opacity:0;transition:opacity .15s}
  .ag-event:hover .ag-ev-actions{opacity:1}
  .ag-ev-btn{background:none;border:none;cursor:pointer;font-size:.8rem;padding:.1rem .3rem;border-radius:var(--r-sm);transition:background .15s}
  .ag-ev-btn:hover{background:rgba(0,0,0,.07)}
  .ag-ev-title{font-size:.88rem;font-weight:700;line-height:1.3}
  .ag-ev-note{font-size:.75rem;color:var(--t2);margin-top:.15rem;line-height:1.5}
  /* empty */
  .ag-empty{text-align:center;padding:3rem 1rem;color:var(--t3);font-size:.85rem}
  .ag-empty-icon{font-size:2.5rem;margin-bottom:.75rem}
  /* form */
  .ag-form{margin-top:.5rem}
  .ag-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}
  @media(max-width:480px){.ag-form-grid{grid-template-columns:1fr}}
  .ag-form-label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--t2);display:block;margin-bottom:.3rem}
  </style>

  <div class="mod ag-wrap">
    <!-- Nav -->
    <div class="sec-header">
      <div style="display:flex;align-items:center;gap:.75rem;flex:1;flex-wrap:wrap">
        <button class="ag-nav-btn" onclick="_agendaNav(-1)">‹</button>
        <span class="ag-date-label">${_agendaFmt(_agendaDate)}</span>
        <button class="ag-nav-btn" onclick="_agendaNav(1)">›</button>
        <button class="ag-today-btn${isToday?' active':''}" onclick="_agendaToday()">Hoje</button>
      </div>
      <button class="btn btn-primary" onclick="_agendaToggleForm(null)">
        ${_agendaShowForm && _agendaEditId==null ? '✕ Fechar' : '+ Evento'}
      </button>
    </div>

    <!-- Week strip -->
    <div class="ag-week">
      ${weekDays.map(w=>`
        <div class="ag-wday${w.isSel?' sel':''}${w.isToday&&!w.isSel?' today-mark':''}" onclick="_agendaDate='${w.ds}';_agendaShowForm=false;_agendaEditId=null;renderModule('notas')">
          ${w.cnt>0?`<span class="ag-wcnt">${w.cnt}</span>`:''}
          <div class="ag-wlbl">${w.label}</div>
          <div class="ag-wnum">${w.num}</div>
        </div>`).join('')}
    </div>

    <!-- Form (add/edit) -->
    ${_agendaShowForm ? `
    <div class="card ag-form" style="margin-bottom:1.25rem;border-top:3px solid var(--accent)">
      <p class="card-title" style="margin-bottom:1rem">${editEv?'Editar evento':'Novo evento — '+_agendaFmt(_agendaDate)}</p>
      <div class="ag-form-grid">
        <div class="form-group" style="grid-column:1/-1">
          <label class="ag-form-label">Título *</label>
          <input id="ag-title" class="form-input" placeholder="Ex: Reunião com equipe" value="${editEv?editEv.title:''}">
        </div>
        <div class="form-group">
          <label class="ag-form-label">Horário *</label>
          <input id="ag-time" type="time" class="form-input" value="${editEv?editEv.time:'08:00'}">
        </div>
        <div class="form-group">
          <label class="ag-form-label">Duração (min)</label>
          <input id="ag-dur" type="number" class="form-input" placeholder="30" min="5" max="480" value="${editEv?editEv.dur:60}">
        </div>
        <div class="form-group">
          <label class="ag-form-label">Categoria</label>
          <select id="ag-cat" class="form-select">
            ${['trabalho','estudo','saúde','pessoal'].map(c=>`<option value="${c}"${(editEv?editEv.cat:'')==c?' selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="ag-form-label">Nota (opcional)</label>
          <input id="ag-note" class="form-input" placeholder="Detalhes..." value="${editEv?editEv.note:''}">
        </div>
      </div>
      <div style="display:flex;gap:.75rem;margin-top:1rem">
        <button class="btn btn-primary" onclick="_agendaSaveEvent()" style="flex:1">${editEv?'Salvar alterações':'Adicionar evento'}</button>
        <button class="btn btn-outline" onclick="_agendaShowForm=false;_agendaEditId=null;renderModule('notas')">Cancelar</button>
      </div>
    </div>` : ''}

    <!-- Timeline -->
    <div class="card" style="padding:1rem 1.25rem">
      ${dayEvs.length===0&&!_agendaShowForm?`
        <div class="ag-empty">
          <div class="ag-empty-icon">📭</div>
          <p style="font-weight:700;color:var(--t2);margin-bottom:.35rem">Nenhum evento neste dia</p>
          <p>Clique em <strong>+ Evento</strong> para adicionar um compromisso.</p>
        </div>` : ''}
      <div class="ag-timeline">
        ${timelineRows()}
      </div>
    </div>

    <!-- Resumo do dia -->
    ${dayEvs.length>0?`
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.75rem">
      ${['trabalho','estudo','saúde','pessoal'].map(cat=>{
        const cnt=dayEvs.filter(e=>e.cat===cat).length;
        if(!cnt) return '';
        return `<span class="tag ${AG_CAT_TAG[cat]}">${cat} · ${cnt} evento${cnt>1?'s':''}</span>`;
      }).join('')}
      <span class="tag tag-gray" style="margin-left:auto">${dayEvs.length} evento${dayEvs.length>1?'s':''} · ${dayEvs.reduce((t,e)=>t+e.dur,0)}min total</span>
    </div>` : ''}
  </div>`;
}

