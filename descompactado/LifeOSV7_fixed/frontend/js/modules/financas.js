/* ============================================================
   LIFEOS — MÓDULO: FINANÇAS INTELIGENTES
============================================================ */
'use strict';

(function injectFinancasCSS(){
  if(document.getElementById('fi-style')) return;
  const s=document.createElement('style');
  s.id='fi-style';
  s.textContent=`
/* ── FI: tokens (scoped to avoid conflict) ── */
.fi-wrap{
  --fi-bg:#F0F2F8;--fi-wh:#FFFFFF;--fi-b1:#E4E8F2;--fi-b2:#C8D0E4;
  --fi-tx:#17203A;--fi-t2:#5B6685;--fi-t3:#9AA4BE;
  --fi-acc:#4361EE;--fi-acc2:#3151D4;--fi-pur:#7B2FBE;
  --fi-pink:#F72585;--fi-teal:#2EC4B6;--fi-cyan:#4CC9F0;
  --fi-red:#EF233C;
  --fi-g1:linear-gradient(135deg,#4361EE,#7B2FBE);
  --fi-g2:linear-gradient(135deg,#F72585,#7B2FBE);
  --fi-sh:0 1px 8px rgba(67,97,238,.07),0 2px 20px rgba(67,97,238,.05);
  --fi-sh2:0 4px 24px rgba(67,97,238,.12);
  --fi-r:12px;--fi-r2:8px;--fi-r3:6px;
  --fi-tr:.2s cubic-bezier(.4,0,.2,1);
  font-family:'DM Sans',-apple-system,sans-serif;
  font-size:14px;
}
/* wrap & page */
.fi-wrap{display:flex;flex-direction:column;gap:16px;max-width:1200px;margin:0 auto;padding:4px 0 24px;width:100%;box-sizing:border-box}
/* card */
.fi-card{background:var(--fi-wh);border:1px solid var(--fi-b1);border-radius:var(--fi-r);box-shadow:var(--fi-sh);overflow:hidden;min-width:0}
.fi-card:hover{border-color:var(--fi-b2)}
.fi-ch{padding:12px 16px 10px;border-bottom:1px solid var(--fi-b1);display:flex;align-items:center;justify-content:space-between;gap:8px}
.fi-ch-t{font-size:.66rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--fi-tx)}
.fi-ch-s{font-size:.58rem;color:var(--fi-t3);margin-top:2px}
.fi-badge{font-family:'DM Mono',monospace;font-size:.58rem;font-weight:500;padding:2px 8px;border-radius:100px;background:rgba(67,97,238,.08);color:var(--fi-acc);border:1px solid rgba(67,97,238,.15);white-space:nowrap}
.fi-ch-r{display:flex;align-items:center;gap:6px}
/* kpi row */
.fi-kpi-row{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.fi-kpi{background:var(--fi-wh);border:1px solid var(--fi-b1);border-radius:var(--fi-r);box-shadow:var(--fi-sh);padding:12px 14px;display:flex;align-items:center;gap:10px;transition:transform .22s cubic-bezier(.34,1.2,.64,1),box-shadow var(--fi-tr);cursor:default;min-width:0}
.fi-kpi:hover{transform:translateY(-2px);box-shadow:var(--fi-sh2)}
.fi-ki{width:36px;height:36px;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.95rem}
.fi-kpi.k1 .fi-ki{background:rgba(67,97,238,.1);color:var(--fi-acc)}
.fi-kpi.k2 .fi-ki{background:rgba(123,47,190,.1);color:var(--fi-pur)}
.fi-kpi.k3 .fi-ki{background:rgba(247,37,133,.1);color:var(--fi-pink)}
.fi-kpi.k4 .fi-ki{background:rgba(46,196,182,.1);color:var(--fi-teal)}
.fi-kpi.k5 .fi-ki{background:rgba(76,201,240,.1);color:var(--fi-cyan)}
.fi-kb{min-width:0;flex:1}
.fi-kl{font-size:.55rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--fi-t3)}
.fi-kv{font-family:'DM Mono',monospace;font-size:.95rem;font-weight:500;letter-spacing:-.03em;color:var(--fi-tx);margin-top:2px;line-height:1}
.fi-kd{font-size:.58rem;margin-top:3px;color:var(--fi-t2)}
.fi-kd.up{color:var(--fi-teal)}.fi-kd.dn{color:var(--fi-red)}
.fi-kbar{height:2px;background:var(--fi-bg);border-radius:100px;margin-top:8px;overflow:hidden}
.fi-kbar-f{height:100%;border-radius:100px;width:0%;transition:width 1.2s cubic-bezier(.4,0,.2,1)}
.fi-kpi.k1 .fi-kbar-f{background:var(--fi-acc)}.fi-kpi.k2 .fi-kbar-f{background:var(--fi-pur)}
.fi-kpi.k3 .fi-kbar-f{background:var(--fi-pink)}.fi-kpi.k4 .fi-kbar-f{background:var(--fi-teal)}
.fi-kpi.k5 .fi-kbar-f{background:var(--fi-cyan)}
/* cta */
.fi-cta{background:var(--fi-wh);border:1px solid var(--fi-b1);border-radius:var(--fi-r);box-shadow:var(--fi-sh);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.fi-cta-t{font-size:.86rem;font-weight:800;letter-spacing:-.025em;color:var(--fi-tx)}
.fi-cta-s{font-size:.68rem;color:var(--fi-t2);margin-top:2px}
.fi-cta-btn{display:flex;align-items:center;gap:6px;flex-shrink:0;padding:9px 18px;border-radius:var(--fi-r2);background:var(--fi-g1);color:#fff;font-size:.76rem;font-weight:800;letter-spacing:.01em;box-shadow:0 4px 14px rgba(67,97,238,.28);border:none;cursor:pointer;transition:transform .22s cubic-bezier(.34,1.2,.64,1),box-shadow var(--fi-tr)}
.fi-cta-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(67,97,238,.38)}
.fi-cta-btn:active{transform:scale(.97)}
/* row2 */
.fi-row2{display:grid;grid-template-columns:1fr 255px;gap:14px;align-items:start}
/* row3 */
.fi-row3{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
/* chart body */
.fi-cbody{padding:12px 14px 8px}
.fi-legend{display:flex;gap:12px;padding:0 14px 10px;flex-wrap:wrap}
.fi-leg{display:flex;align-items:center;gap:4px;font-size:.6rem;color:var(--fi-t2)}
.fi-leg-d{width:7px;height:7px;border-radius:2px;flex-shrink:0}
/* seg pills */
.fi-pills{display:flex;gap:3px}
.fi-sp{font-size:.58rem;font-weight:700;padding:3px 9px;border-radius:100px;cursor:pointer;border:1px solid var(--fi-b1);color:var(--fi-t3);background:none;transition:all var(--fi-tr)}
.fi-sp.on{background:var(--fi-acc);color:#fff;border-color:var(--fi-acc)}
/* donut */
.fi-dinn{padding:12px 14px}
.fi-dsv{display:block;width:120px;height:120px;margin:0 auto 10px}
.fi-dleg{display:flex;flex-direction:column;gap:7px}
.fi-dl{display:flex;align-items:center;justify-content:space-between;gap:5px}
.fi-dl-l{display:flex;align-items:center;gap:5px}
.fi-dl-d{width:6px;height:6px;border-radius:2px;flex-shrink:0}
.fi-dl-n{font-size:.63rem;color:var(--fi-t2);font-weight:500}
.fi-dl-v{font-family:'DM Mono',monospace;font-size:.62rem;color:var(--fi-tx);font-weight:500}
.fi-dl-p{font-size:.56rem;color:var(--fi-t3)}
.fi-dsep{height:1px;background:var(--fi-b1);margin:4px 0}
/* table */
.fi-tbl-bar{display:flex;align-items:center;gap:6px;padding:7px 12px;border-bottom:1px solid var(--fi-b1);flex-wrap:wrap}
.fi-tbl-s{display:flex;align-items:center;gap:4px;flex:1;min-width:80px;background:var(--fi-bg);border:1px solid var(--fi-b1);border-radius:var(--fi-r2);padding:4px 8px;transition:all var(--fi-tr)}
.fi-tbl-s:focus-within{background:var(--fi-wh);border-color:var(--fi-acc)}
.fi-tbl-s svg{width:11px;height:11px;stroke:var(--fi-t3);fill:none;stroke-width:2;stroke-linecap:round;flex-shrink:0}
.fi-tbl-s input{border:none;background:none;outline:none;font-size:.68rem;color:var(--fi-tx);width:100%}
.fi-tbl-s input::placeholder{color:var(--fi-t3)}
.fi-ta{padding:4px 8px;border-radius:var(--fi-r2);background:var(--fi-bg);border:1px solid var(--fi-b1);font-size:.62rem;font-weight:700;color:var(--fi-t2);cursor:pointer;white-space:nowrap;transition:all var(--fi-tr)}
.fi-ta:hover{border-color:var(--fi-b2);color:var(--fi-tx)}
.fi-ta.p{background:var(--fi-g1);color:#fff;border-color:transparent;box-shadow:0 2px 8px rgba(67,97,238,.2)}
.fi-tscroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
.fi-tbl{width:100%;border-collapse:collapse;min-width:380px}
.fi-tbl thead th{padding:6px 11px;text-align:left;font-size:.55rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--fi-t3);background:var(--fi-bg);border-bottom:1px solid var(--fi-b1);white-space:nowrap}
.fi-tbl tbody tr{border-bottom:1px solid var(--fi-b1);transition:background var(--fi-tr)}
.fi-tbl tbody tr:last-child{border-bottom:none}
.fi-tbl tbody tr:hover{background:var(--fi-bg)}
.fi-tbl td{padding:7px 11px;font-size:.7rem;color:var(--fi-tx);white-space:nowrap;vertical-align:middle}
.fi-tbl td.m{font-family:'DM Mono',monospace;font-size:.66rem}
.fi-bdg{display:inline-flex;align-items:center;padding:2px 7px;border-radius:100px;font-size:.54rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.fi-tfoot{padding:6px 12px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--fi-b1);background:var(--fi-bg)}
.fi-tinfo{font-size:.58rem;color:var(--fi-t3);font-weight:600}
.fi-pgs{display:flex;gap:3px}
.fi-pg{width:22px;height:22px;border-radius:var(--fi-r3);background:var(--fi-wh);border:1px solid var(--fi-b1);font-size:.6rem;font-weight:700;color:var(--fi-t2);display:flex;align-items:center;justify-content:center;transition:all var(--fi-tr);cursor:pointer}
.fi-pg:hover{border-color:var(--fi-acc);color:var(--fi-acc)}
.fi-pg.on{background:var(--fi-acc);border-color:var(--fi-acc);color:#fff}
/* empty */
.fi-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:32px 16px;color:var(--fi-t3);text-align:center}
.fi-empty-i{font-size:1.7rem;opacity:.3}
.fi-empty-t{font-size:.7rem;line-height:1.5;max-width:220px}
/* modal */
.fi-ov{position:fixed;inset:0;z-index:600;background:rgba(17,22,40,.5);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;pointer-events:none;transition:opacity .25s}
.fi-ov.open{opacity:1;pointer-events:all}
.fi-modal{width:min(540px,100%);max-height:90vh;overflow-y:auto;background:var(--fi-wh);border:1px solid var(--fi-b1);border-radius:16px;box-shadow:0 24px 60px rgba(17,22,40,.22);transform:translateY(18px) scale(.97);opacity:0;transition:transform .35s cubic-bezier(.34,1.2,.64,1),opacity .28s}
.fi-ov.open .fi-modal{transform:translateY(0) scale(1);opacity:1}
.fi-mh{padding:14px 18px;border-bottom:1px solid var(--fi-b1);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--fi-wh);z-index:1}
.fi-mh-l{display:flex;align-items:center;gap:9px}
.fi-mico{width:30px;height:30px;border-radius:8px;background:var(--fi-g1);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.8rem;flex-shrink:0}
.fi-mt{font-size:.86rem;font-weight:800;letter-spacing:-.02em;color:var(--fi-tx)}
.fi-ms{font-size:.62rem;color:var(--fi-t3);margin-top:1px}
.fi-mx{width:24px;height:24px;border-radius:7px;background:var(--fi-bg);border:1px solid var(--fi-b1);color:var(--fi-t3);font-size:.76rem;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all var(--fi-tr)}
.fi-mx:hover{background:rgba(239,35,60,.08);border-color:rgba(239,35,60,.18);color:var(--fi-red)}
.fi-mb{padding:16px 18px}
/* steps */
.fi-sbar{display:flex;align-items:center;gap:5px;margin-bottom:14px}
.fi-si{display:flex;align-items:center;gap:4px;font-size:.58rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--fi-t3)}
.fi-si.active{color:var(--fi-acc)}.fi-si.done{color:var(--fi-teal)}
.fi-sn{width:17px;height:17px;border-radius:50%;border:1.5px solid currentColor;display:flex;align-items:center;justify-content:center;font-size:.56rem;font-weight:800;flex-shrink:0}
.fi-si.done .fi-sn{background:var(--fi-teal);border-color:var(--fi-teal);color:#fff}
.fi-si.active .fi-sn{background:var(--fi-acc);border-color:var(--fi-acc);color:#fff}
.fi-ssep{flex:1;height:1px;background:var(--fi-b1)}.fi-ssep.done{background:var(--fi-teal)}
.fi-panel{display:none}
.fi-panel.active{display:block;animation:fipi .25s cubic-bezier(.34,1.2,.64,1)}
@keyframes fipi{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
.fi-pt{font-size:.73rem;font-weight:800;color:var(--fi-tx);margin-bottom:12px;display:flex;align-items:center;gap:5px}
.fi-pt::before{content:'';width:3px;height:12px;background:var(--fi-g1);border-radius:2px}
.fi-fg{display:grid;grid-template-columns:1fr 1fr;gap:9px}
.fi-frow{display:flex;flex-direction:column;gap:3px}
.fi-frow label{font-size:.6rem;font-weight:700;color:var(--fi-t2);letter-spacing:.03em}
.fi-frow input,.fi-frow select,.fi-frow textarea{padding:7px 9px;background:var(--fi-bg);border:1.5px solid var(--fi-b1);border-radius:var(--fi-r2);color:var(--fi-tx);font-size:.76rem;outline:none;font-family:inherit;transition:border-color var(--fi-tr),box-shadow var(--fi-tr),background var(--fi-tr)}
.fi-frow input:focus,.fi-frow select:focus,.fi-frow textarea:focus{border-color:var(--fi-acc);background:var(--fi-wh);box-shadow:0 0 0 3px rgba(67,97,238,.09)}
.fi-frow select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23B4BCCE' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;padding-right:26px}
.fi-frow textarea{min-height:60px;resize:vertical}
.fi-hint{font-size:.56rem;color:var(--fi-t3);margin-top:-1px}
.fi-mf{padding:10px 18px;border-top:1px solid var(--fi-b1);display:flex;justify-content:flex-end;gap:5px;position:sticky;bottom:0;background:var(--fi-wh)}
.fi-bg-btn{padding:6px 12px;border-radius:var(--fi-r2);background:var(--fi-bg);border:1px solid var(--fi-b1);color:var(--fi-t2);font-size:.72rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all var(--fi-tr)}
.fi-bg-btn:hover{background:var(--fi-b1);color:var(--fi-tx)}
.fi-p-btn{padding:6px 16px;border-radius:var(--fi-r2);background:var(--fi-g1);color:#fff;font-size:.72rem;font-weight:800;box-shadow:0 3px 12px rgba(67,97,238,.25);cursor:pointer;font-family:inherit;border:none;transition:transform .2s cubic-bezier(.34,1.2,.64,1),box-shadow var(--fi-tr)}
.fi-p-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(67,97,238,.35)}
.fi-p-btn:active{transform:scale(.97)}
/* toast (fi-only) */
.fi-toast{position:fixed;bottom:calc(var(--carousel-h, 80px) + 10px);right:20px;z-index:700;background:#17203A;color:#fff;font-size:.72rem;font-weight:600;padding:8px 13px;border-radius:var(--fi-r2);box-shadow:0 8px 28px rgba(17,22,40,.3);opacity:0;transform:translateY(6px);pointer-events:none;transition:all .28s cubic-bezier(.34,1.2,.64,1);white-space:nowrap}
.fi-toast.show{opacity:1;transform:translateY(0)}
/* responsive */
@media(max-width:900px){
  .fi-kpi-row{grid-template-columns:repeat(2,1fr)}
  .fi-row2{grid-template-columns:1fr}
  .fi-row3{grid-template-columns:1fr}
  .fi-cta{flex-direction:column;align-items:flex-start;gap:10px}
  .fi-cta-btn{width:100%;justify-content:center}
}
@media(max-width:500px){
  .fi-kpi-row{grid-template-columns:1fr 1fr}
  .fi-kpi{padding:10px 10px}
  .fi-kv{font-size:.82rem}
  #fi-barWrap{height:150px!important}
  #fi-lineWrap{height:130px!important}
  .fi-fg{grid-template-columns:1fr!important}
  .fi-ov{align-items:flex-end;padding:0}
  .fi-modal{border-radius:16px 16px 0 0;max-height:88vh}
}
  `;
  document.head.appendChild(s);
})();

/* ── STATE ── */
let fiPlan=null, fiStep=0, fiView='month';
const fiSTS={ok:['#e8f8f5','#2EC4B6','Em dia'],meta:['#eef2ff','#4361EE','Meta ✓'],warn:['#fff8ee','#FF8C42','Atenção']};

function fiR(n,d=0){return`R$ ${n.toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d})}`}
function fi$(id){return document.getElementById(id)}

let fiTT;
function fiToast(m,dur=2400){
  const t=fi$('fi-toast');if(!t)return;
  t.textContent=m;t.classList.add('show');
  clearTimeout(fiTT);fiTT=setTimeout(()=>t.classList.remove('show'),dur);
}

/* ── MODAL ── */
function fiOpenModal(){fiStep=0;fiStepSync();const ov=fi$('fi-ov');if(ov)ov.classList.add('open')}
function fiCloseModal(){const ov=fi$('fi-ov');if(ov)ov.classList.remove('open')}

function fiStepSync(){
  ['fi-p0','fi-p1','fi-p2'].forEach((id,i)=>{const el=fi$(id);if(el)el.classList.toggle('active',i===fiStep)});
  for(let i=0;i<3;i++){
    const l=fi$(`fi-sl${i}`);const sep=i<2?fi$(`fi-ss${i}`):null;
    if(l)l.className='fi-si'+(i<fiStep?' done':i===fiStep?' active':'');
    if(sep)sep.className='fi-ssep'+(i<fiStep?' done':'');
  }
  const bb=fi$('fi-bBack');if(bb)bb.style.display=fiStep>0?'':'none';
  const bn=fi$('fi-bNext');if(bn)bn.textContent=fiStep===2?'✦ Gerar Plano':'Próximo →';
}

function fiValid(){
  if(fiStep===0){
    if(!fi$('fi-fi')?.value||+fi$('fi-fi').value<=0){fiToast('Informe sua renda mensal');return false}
    if(!fi$('fi-fe')?.value||+fi$('fi-fe').value<0){fiToast('Informe seus gastos mensais');return false}
    return true;
  }
  if(fiStep===1){
    if(!fi$('fi-fgt')?.value){fiToast('Selecione seu objetivo');return false}
    if(!fi$('fi-fga')?.value||+fi$('fi-fga').value<=0){fiToast('Informe o valor da meta');return false}
    if(!fi$('fi-fm')?.value||+fi$('fi-fm').value<1){fiToast('Informe o prazo em meses');return false}
    return true;
  }
  return true;
}

/* ── GENERATE ── */
function fiGen(){
  const inc=+fi$('fi-fi')?.value||0;
  const exp=+fi$('fi-fe')?.value||0;
  const sav=+fi$('fi-fs')?.value||0;
  const gAmt=+fi$('fi-fga')?.value||0;
  const mo=Math.max(1,+fi$('fi-fm')?.value||12);
  const smIn=+fi$('fi-fsm')?.value||0;
  const debt=fi$('fi-fd')?.value||'nao';
  const disc=fi$('fi-fdisc')?.value||'medio';
  const inv=fi$('fi-finv')?.value||'nao';
  const food=+fi$('fi-ffood')?.value||0;
  const gt=fi$('fi-fgt')?.value||'outro';

  const surplus=inc-exp;
  const canSave=Math.max(0,surplus);
  const saveM=smIn>0?Math.min(smIn,canSave):canSave;
  const saveD=saveM/30;
  const projFull=sav+saveM*mo;
  const rem=Math.max(0,gAmt-sav);
  const mNeeded=saveM>0?Math.ceil(rem/saveM):Infinity;
  const gPct=gAmt>0?Math.min(100,Math.round(sav/gAmt*100)):0;
  const sr=inc>0?saveM/inc:0;

  let sc=0;
  if(sr>=.3)sc+=35;else if(sr>=.15)sc+=22;else if(sr>0)sc+=10;
  if(debt==='nao')sc+=25;else if(debt==='pequena')sc+=15;else if(debt==='media')sc+=8;
  if(disc==='alto')sc+=20;else if(disc==='medio')sc+=12;
  if(inv!=='nao')sc+=20;
  sc=Math.min(100,sc);

  const lev=sc>=80?'Mestre':sc>=65?'Avançado':sc>=45?'Em Evolução':sc>=25?'Construindo':'Iniciante';
  const gL={reserva:'Reserva',viagem:'Viagem',investimento:'Investimento',divida:'Quitar Dívidas',imovel:'Imóvel',outro:'Meu Objetivo'}[gt]||'Objetivo';

  const MB=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const now=new Date();
  const fc=[];
  for(let i=0;i<=Math.min(mo,24);i++){
    const d=new Date(now.getFullYear(),now.getMonth()+i,1);
    fc.push({month:`${MB[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,income:inc,expenses:exp,save:saveM,balance:sav+saveM*i,target:gAmt||null});
  }

  const expF=exp||1;
  const cats=[
    {l:'Alimentação',v:food||Math.round(expF*.28),c:'#4361EE'},
    {l:'Moradia',    v:Math.round(expF*.32),       c:'#7B2FBE'},
    {l:'Transporte', v:Math.round(expF*.15),       c:'#F72585'},
    {l:'Outros',     v:Math.round(expF*.25),       c:'#4CC9F0'},
  ].filter(c=>c.v>0);

  fiPlan={inc,exp,sav,gAmt,mo,saveM,saveD,projFull,rem,mNeeded,gPct,sr,sc,lev,gL,fc,cats,surplus};
  fiUpdateKPI();fiDrawBar();fiDrawDonut();fiDrawLine();fiFillTable(fiPlan.fc);fiUpdateCTA();
  fiToast('✦ Plano gerado com sucesso!',3000);
  try{if(window.storage&&fiPlan)window.storage.set('fi3:plan',JSON.stringify(fiPlan))}catch(e){}
}

/* ── UPDATE KPI ── */
function fiUpdateKPI(){
  const p=fiPlan;
  const set=(id,v,d,w)=>{
    const ve=fi$(id);if(ve)ve.textContent=v;
    const de=fi$(id+'d');if(de)de.textContent=d;
    const be=fi$(id+'b');if(be)be.style.width=w;
  };
  set('fi-k-income',fiR(p.inc),fiR(p.exp)+' em gastos','100%');
  set('fi-k-save',fiR(p.saveM),Math.round(p.sr*100)+'% da renda',Math.min(p.sr*250,100)+'%');
  set('fi-k-exp',fiR(p.exp),'despesas mensais',p.inc>0?Math.min(p.exp/p.inc*100,100)+'%':'50%');
  set('fi-k-goal',fiR(p.gAmt),p.mNeeded===Infinity?'Reveja o plano':p.mNeeded+' meses',p.gPct+'%');
  set('fi-k-score',p.sc+'%',p.lev,p.sc+'%');
}
function fiUpdateCTA(){
  const p=fiPlan;
  const t=fi$('fi-ctaTitle');if(t)t.textContent=`Plano: ${p.gL} · Score ${p.sc}% — ${p.lev}`;
  const s=fi$('fi-ctaSub');if(s)s.textContent=`Guardando ${fiR(p.saveM)}/mês · Meta em ${p.mNeeded===Infinity?'∞':p.mNeeded} meses · Patrimônio ${fiR(p.projFull)}`;
}

/* ── BAR CHART ── */
function fiSetView(v,el){fiView=v;document.querySelectorAll('.fi-sp').forEach(s=>s.classList.remove('on'));if(el)el.classList.add('on');if(fiPlan)fiDrawBar()}

function fiDrawBar(){
  const p=fiPlan;
  const W=680,H=185,PL=38,PR=10,PT=12,PB=22,cW=W-PL-PR,cH=H-PT-PB;
  let data=p.fc.slice(0,fiView==='month'?12:fiView==='quarter'?12:p.fc.length);
  const stepN=fiView==='quarter'?3:1;
  let agg=[];
  for(let i=0;i<data.length;i+=stepN){
    const ch=data.slice(i,i+stepN);
    agg.push({l:ch[0].month,a:ch.reduce((s,c)=>s+c.income,0)/ch.length,b:ch.reduce((s,c)=>s+c.expenses,0)/ch.length,c:ch.reduce((s,c)=>s+c.save,0)/ch.length});
  }
  const n=agg.length;if(!n)return;
  const mxV=Math.max(...agg.map(d=>Math.max(d.a,d.b,d.c)))*1.18||1;
  const gW=cW/n;
  const bW=Math.max(4,Math.min(13,gW*.22));
  const gap=bW*.28;
  let out='',bars='',xlbls='';
  [0,.25,.5,.75,1].forEach(f=>{
    const yy=(PT+cH-f*cH).toFixed(1);
    const v=mxV*f;
    out+=`<line x1="${PL}" y1="${yy}" x2="${W-PR}" y2="${yy}" stroke="#EEF1F8" stroke-width="1"/>`;
    out+=`<text x="${PL-4}" y="${(PT+cH-f*cH+3).toFixed(1)}" font-family="DM Mono,monospace" font-size="7.5" fill="#9AA4BE" text-anchor="end">${v>=1000?Math.round(v/1000)+'k':Math.round(v)}</text>`;
  });
  agg.forEach((d,i)=>{
    const cx=(PL+i*gW+gW/2).toFixed(1);
    const x1=(+cx-bW-gap-bW/2).toFixed(1),x2=(+cx-bW/2).toFixed(1),x3=(+cx+gap+bW/2).toFixed(1);
    const bh1=Math.max(2,d.a/mxV*cH),bh2=Math.max(2,d.b/mxV*cH),bh3=Math.max(2,d.c/mxV*cH);
    const y1=(PT+cH-bh1).toFixed(1),y2=(PT+cH-bh2).toFixed(1),y3=(PT+cH-bh3).toFixed(1);
    const dl=i*32;
    bars+=`<rect x="${x1}" y="${H}" width="${bW}" height="0" fill="url(#fibG1)" rx="3" class="fi-abar" data-y="${y1}" data-h="${bh1.toFixed(1)}" style="transition:y .8s cubic-bezier(.34,1.4,.64,1) ${dl}ms,height .8s cubic-bezier(.34,1.4,.64,1) ${dl}ms"/>`;
    bars+=`<rect x="${x2}" y="${H}" width="${bW}" height="0" fill="url(#fibG2)" rx="3" class="fi-abar" data-y="${y2}" data-h="${bh2.toFixed(1)}" style="transition:y .8s cubic-bezier(.34,1.4,.64,1) ${dl+10}ms,height .8s cubic-bezier(.34,1.4,.64,1) ${dl+10}ms"/>`;
    bars+=`<rect x="${x3}" y="${H}" width="${bW}" height="0" fill="url(#fibG3)" rx="3" class="fi-abar" data-y="${y3}" data-h="${bh3.toFixed(1)}" style="transition:y .8s cubic-bezier(.34,1.4,.64,1) ${dl+20}ms,height .8s cubic-bezier(.34,1.4,.64,1) ${dl+20}ms"/>`;
    if(i%Math.max(1,Math.ceil(n/10))===0||i===n-1)
      xlbls+=`<text x="${cx}" y="${H-3}" font-family="DM Mono,monospace" font-size="7.5" fill="#9AA4BE" text-anchor="middle">${d.l}</text>`;
  });
  const bw=fi$('fi-barWrap');if(!bw)return;
  bw.innerHTML=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:100%;overflow:visible">
    <defs>
      <linearGradient id="fibG1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4361EE"/><stop offset="100%" stop-color="#7B2FBE"/></linearGradient>
      <linearGradient id="fibG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#F72585"/><stop offset="100%" stop-color="#7B2FBE"/></linearGradient>
      <linearGradient id="fibG3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4CC9F0"/><stop offset="100%" stop-color="#4361EE"/></linearGradient>
    </defs>
    ${out}${bars}${xlbls}</svg>`;
  const bs=fi$('fi-barSub');if(bs)bs.textContent=`${n} ${fiView==='month'?'meses':'períodos'} · Projeção personalizada`;
  requestAnimationFrame(()=>document.querySelectorAll('.fi-abar').forEach(r=>{r.setAttribute('y',r.dataset.y);r.setAttribute('height',r.dataset.h)}));
}

/* ── DONUT ── */
function fiDrawDonut(){
  const p=fiPlan;
  const CX=60,CY=60,R=40,SW=17;
  const circ=2*Math.PI*R;
  const total=p.cats.reduce((s,c)=>s+c.v,0)||1;
  let off=0,paths='';
  p.cats.forEach(c=>{
    const a=c.v/total;const dash=(circ*a).toFixed(2);const rest=(circ-circ*a).toFixed(2);
    paths+=`<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${c.c}" stroke-width="${SW}" stroke-dasharray="${dash} ${rest}" stroke-dashoffset="${(-off+circ/4).toFixed(2)}" transform="rotate(-90 ${CX} ${CY})" style="transition:stroke-dasharray .9s cubic-bezier(.4,0,.2,1)"/>`;
    off+=circ*a;
  });
  const dg=fi$('fi-donutG');if(dg)dg.innerHTML=paths;
  const dc=fi$('fi-dCenter');if(dc)dc.textContent=fiR(total);
  const dl=fi$('fi-dLbl');if(dl)dl.textContent='GASTOS';
  const db=fi$('fi-donutBadge');if(db)db.textContent=fiR(p.exp)+'/mês';
  const leg=fi$('fi-dLegend');if(!leg)return;
  const hdr=leg.firstElementChild;leg.innerHTML='';if(hdr)leg.appendChild(hdr);
  p.cats.forEach(c=>{
    const pct=Math.round(c.v/total*100);
    const row=document.createElement('div');row.className='fi-dl';
    row.innerHTML=`<div class="fi-dl-l"><div class="fi-dl-d" style="background:${c.c}"></div><span class="fi-dl-n">${c.l}</span></div>
      <div style="display:flex;align-items:center;gap:4px"><span class="fi-dl-v">${fiR(c.v)}</span><span class="fi-dl-p">${pct}%</span></div>`;
    leg.appendChild(row);
  });
}

/* ── LINE CHART ── */
function fiDrawLine(){
  const p=fiPlan;
  const W=500,H=155,PL=38,PR=12,PT=12,PB=20,cW=W-PL-PR,cH=H-PT-PB;
  const data=p.fc;const n=data.length;
  const mxV=Math.max(...data.map(d=>d.balance),p.gAmt||0)*1.15||1;
  const xs=data.map((_,i)=>PL+i/Math.max(n-1,1)*cW);
  const ys=data.map(d=>PT+cH-(d.balance/mxV)*cH);
  let lineD=`M${xs[0].toFixed(1)},${ys[0].toFixed(1)}`;
  for(let i=1;i<n;i++){const cx=(xs[i-1]+xs[i])/2;lineD+=` C${cx.toFixed(1)},${ys[i-1].toFixed(1)} ${cx.toFixed(1)},${ys[i].toFixed(1)} ${xs[i].toFixed(1)},${ys[i].toFixed(1)}`}
  const areaD=lineD+` L${xs[n-1].toFixed(1)},${(PT+cH).toFixed(1)} L${xs[0].toFixed(1)},${(PT+cH).toFixed(1)} Z`;
  let grid='',ylbls='',xlbls='',goal='';
  [0,.5,1].forEach(f=>{
    const yy=(PT+cH-f*cH).toFixed(1);const v=mxV*f;
    grid+=`<line x1="${PL}" y1="${yy}" x2="${W-PR}" y2="${yy}" stroke="#EEF1F8" stroke-width="1"/>`;
    ylbls+=`<text x="${PL-4}" y="${(+yy+3).toFixed(1)}" font-family="DM Mono,monospace" font-size="7.5" fill="#9AA4BE" text-anchor="end">${v>=1000?Math.round(v/1000)+'k':Math.round(v)}</text>`;
  });
  data.forEach((d,i)=>{if(i%Math.max(1,Math.ceil(n/6))===0||i===n-1)xlbls+=`<text x="${xs[i].toFixed(1)}" y="${H-4}" font-family="DM Mono,monospace" font-size="7.5" fill="#9AA4BE" text-anchor="middle">${d.month}</text>`});
  if(p.gAmt>0){const gy=(PT+cH-(p.gAmt/mxV)*cH).toFixed(1);let gD=`M${xs[0].toFixed(1)},${gy}`;xs.slice(1).forEach(x=>{gD+=` L${x.toFixed(1)},${gy}`});goal=`<path d="${gD}" fill="none" stroke="#2EC4B6" stroke-width="1.5" stroke-dasharray="5,4" opacity=".65"/>`}
  const lw=fi$('fi-lineWrap');if(!lw)return;
  lw.innerHTML=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:100%;overflow:visible">
    <defs>
      <linearGradient id="filaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4361EE" stop-opacity=".15"/><stop offset="100%" stop-color="#4361EE" stop-opacity="0"/></linearGradient>
      <filter id="filglow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    ${grid}${ylbls}
    <path d="${areaD}" fill="url(#filaG)"/>
    <path d="${lineD}" fill="none" stroke="#4361EE" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" filter="url(#filglow)"/>
    ${goal}${xlbls}
    <circle cx="${xs[n-1].toFixed(1)}" cy="${ys[n-1].toFixed(1)}" r="5" fill="#4361EE" stroke="#fff" stroke-width="2" filter="url(#filglow)"/></svg>`;
  const lb=fi$('fi-lineBadge');if(lb)lb.textContent=fiR(p.projFull);
}

/* ── TABLE ── */
function fiRowSt(r){if(r.target&&r.balance>=r.target)return'meta';if(r.save>=r.income*.1)return'ok';return r.save>0?'ok':'warn'}
function fiFillTable(data){
  const tb=fi$('fi-tbody');if(!tb)return;
  tb.innerHTML=data.map(r=>{
    const[bg,col,lbl]=fiSTS[fiRowSt(r)];
    return`<tr>
      <td style="font-weight:600">${r.month}</td>
      <td class="m">${fiR(r.income)}</td>
      <td class="m">${fiR(r.expenses)}</td>
      <td class="m" style="color:#2EC4B6;font-weight:600">+${fiR(r.save)}</td>
      <td class="m" style="font-weight:700;color:#4361EE">${fiR(r.balance)}</td>
      <td><span class="fi-bdg" style="background:${bg};color:${col}">${lbl}</span></td>
    </tr>`;
  }).join('');
  const ti=fi$('fi-tblInfo');if(ti)ti.textContent=`${data.length} registro${data.length!==1?'s':''}`;
  const tot=Math.ceil(data.length/6);
  const pg=fi$('fi-pages');if(pg)pg.innerHTML=[...Array(Math.min(tot,4))].map((_,i)=>
    `<button class="fi-pg ${i===0?'on':''}" onclick="document.querySelectorAll('.fi-pg').forEach(b=>b.classList.remove('on'));this.classList.add('on')">${i+1}</button>`
  ).join('')+(tot>4?`<button class="fi-pg">›</button>`:'');
}

/* ── EXPORT ── */
function fiExportCSV(){
  if(!fiPlan){fiToast('Crie um plano primeiro');return}
  const h=['Mês','Receita','Gastos','Poupança','Saldo'];
  const rows=fiPlan.fc.map(r=>[r.month,r.income,r.expenses,r.save,r.balance].join(','));
  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([[h.join(','),...rows].join('\n')],{type:'text/csv'})),download:'financas.csv'});
  a.click();fiToast('CSV exportado ✅');
}

/* ── MAIN RENDER ── */
async function renderFinancasInteligentes(s){
  s.innerHTML=`
  <div class="fi-wrap">

    <!-- KPI -->
    <div class="fi-kpi-row">
      <div class="fi-kpi k1"><div class="fi-ki">💰</div><div class="fi-kb"><div class="fi-kl">Receita</div><div class="fi-kv" id="fi-k-income">R$ —</div><div class="fi-kd" id="fi-k-incomed">Renda mensal</div><div class="fi-kbar"><div class="fi-kbar-f" id="fi-k-incomeb"></div></div></div></div>
      <div class="fi-kpi k2"><div class="fi-ki">📊</div><div class="fi-kb"><div class="fi-kl">Poupança</div><div class="fi-kv" id="fi-k-save">R$ —</div><div class="fi-kd" id="fi-k-saved">por mês</div><div class="fi-kbar"><div class="fi-kbar-f" id="fi-k-saveb"></div></div></div></div>
      <div class="fi-kpi k3"><div class="fi-ki">🛒</div><div class="fi-kb"><div class="fi-kl">Gastos</div><div class="fi-kv" id="fi-k-exp">R$ —</div><div class="fi-kd" id="fi-k-expd">Despesas mensais</div><div class="fi-kbar"><div class="fi-kbar-f" id="fi-k-expb"></div></div></div></div>
      <div class="fi-kpi k4"><div class="fi-ki">🎯</div><div class="fi-kb"><div class="fi-kl">Meta</div><div class="fi-kv" id="fi-k-goal">R$ —</div><div class="fi-kd" id="fi-k-goald">Objetivo</div><div class="fi-kbar"><div class="fi-kbar-f" id="fi-k-goalb"></div></div></div></div>
      <div class="fi-kpi k5"><div class="fi-ki">⚡</div><div class="fi-kb"><div class="fi-kl">Score</div><div class="fi-kv" id="fi-k-score">—%</div><div class="fi-kd" id="fi-k-scored">Saúde financeira</div><div class="fi-kbar"><div class="fi-kbar-f" id="fi-k-scoreb"></div></div></div></div>
    </div>

    <!-- CTA -->
    <div class="fi-cta">
      <div>
        <div class="fi-cta-t" id="fi-ctaTitle">Configure seu Plano Financeiro Inteligente</div>
        <div class="fi-cta-s" id="fi-ctaSub">Análise personalizada com projeções automáticas — leva menos de 2 minutos</div>
      </div>
      <button class="fi-cta-btn" onclick="fiOpenModal()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        Criar meu plano agora
      </button>
    </div>

    <!-- ROW 2: bar + donut -->
    <div class="fi-row2">
      <div class="fi-card">
        <div class="fi-ch">
          <div><div class="fi-ch-t">Performance Financeira</div><div class="fi-ch-s" id="fi-barSub">Configure o plano para ver dados</div></div>
          <div class="fi-ch-r">
            <div class="fi-pills">
              <button class="fi-sp on" onclick="fiSetView('month',this)">Mês</button>
              <button class="fi-sp" onclick="fiSetView('quarter',this)">Tri</button>
              <button class="fi-sp" onclick="fiSetView('year',this)">Ano</button>
            </div>
          </div>
        </div>
        <div class="fi-cbody" style="padding-bottom:6px">
          <div id="fi-barWrap" style="width:100%;height:185px">
            <div class="fi-empty"><div class="fi-empty-i">📊</div><div class="fi-empty-t">Crie seu plano para ver a performance financeira</div></div>
          </div>
        </div>
        <div class="fi-legend">
          <div class="fi-leg"><div class="fi-leg-d" style="background:linear-gradient(135deg,#4361EE,#7B2FBE)"></div>Receita</div>
          <div class="fi-leg"><div class="fi-leg-d" style="background:linear-gradient(135deg,#F72585,#7B2FBE)"></div>Gastos</div>
          <div class="fi-leg"><div class="fi-leg-d" style="background:linear-gradient(135deg,#4CC9F0,#4361EE)"></div>Poupança</div>
        </div>
      </div>
      <div class="fi-card">
        <div class="fi-ch"><div><div class="fi-ch-t">Por Categoria</div><div class="fi-ch-s">Distribuição dos gastos</div></div><div class="fi-badge" id="fi-donutBadge">—</div></div>
        <div class="fi-dinn">
          <svg id="fi-donutSvg" class="fi-dsv" viewBox="0 0 120 120">
            <defs><filter id="fi-dsh" x="-15%" y="-15%" width="130%" height="130%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(67,97,238,.1)"/></filter></defs>
            <g id="fi-donutG" filter="url(#fi-dsh)"></g>
            <text x="60" y="56" text-anchor="middle" font-family="DM Mono,monospace" font-size="11" font-weight="500" fill="#17203A" id="fi-dCenter">—</text>
            <text x="60" y="68" text-anchor="middle" font-family="DM Mono,monospace" font-size="6" fill="#9AA4BE" id="fi-dLbl">CONFIGURE</text>
          </svg>
          <div class="fi-dsep"></div>
          <div class="fi-dleg" id="fi-dLegend">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px">
              <span style="font-size:.55rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9AA4BE">Categoria</span>
              <span style="font-size:.55rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9AA4BE">Valor</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ROW 3: line + table -->
    <div class="fi-row3">
      <div class="fi-card">
        <div class="fi-ch"><div><div class="fi-ch-t">Crescimento Projetado</div><div class="fi-ch-s">Patrimônio acumulado mês a mês</div></div><div class="fi-badge" id="fi-lineBadge">—</div></div>
        <div class="fi-cbody">
          <div id="fi-lineWrap" style="width:100%;height:155px">
            <div class="fi-empty"><div class="fi-empty-i">📈</div><div class="fi-empty-t">Sua curva de crescimento aparecerá aqui</div></div>
          </div>
        </div>
        <div class="fi-legend">
          <div class="fi-leg"><div class="fi-leg-d" style="background:#4361EE;border-radius:50%"></div>Saldo</div>
          <div class="fi-leg"><div class="fi-leg-d" style="background:#2EC4B6;border-radius:50%"></div>Meta</div>
        </div>
      </div>
      <div class="fi-card">
        <div class="fi-ch"><div><div class="fi-ch-t">Previsão Mensal</div><div class="fi-ch-s">Log de projeção financeira</div></div></div>
        <div class="fi-tbl-bar">
          <div class="fi-tbl-s"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input placeholder="Buscar mês…" id="fi-tblSrch"/></div>
          <button class="fi-ta" onclick="fiExportCSV()">↓ CSV</button>
          <button class="fi-ta" onclick="fiOpenModal()">✎ Editar</button>
          <button class="fi-ta p" onclick="fiOpenModal()">+ Plano</button>
        </div>
        <div class="fi-tscroll">
          <table class="fi-tbl">
            <thead><tr><th>Mês</th><th>Receita</th><th>Gastos</th><th>Poupar</th><th>Saldo</th><th>Status</th></tr></thead>
            <tbody id="fi-tbody"><tr><td colspan="6" style="text-align:center;padding:24px;color:#9AA4BE;font-size:.7rem">Crie seu plano para ver a previsão detalhada</td></tr></tbody>
          </table>
        </div>
        <div class="fi-tfoot"><span class="fi-tinfo" id="fi-tblInfo">0 registros</span><div class="fi-pgs" id="fi-pages"></div></div>
      </div>
    </div>

  </div>

  <!-- MODAL -->
  <div class="fi-ov" id="fi-ov">
    <div class="fi-modal">
      <div class="fi-mh">
        <div class="fi-mh-l"><div class="fi-mico">✦</div><div><div class="fi-mt">Plano Financeiro Inteligente</div><div class="fi-ms">Análise personalizada em 3 passos</div></div></div>
        <button class="fi-mx" id="fi-mx">✕</button>
      </div>
      <div class="fi-mb">
        <div class="fi-sbar">
          <div class="fi-si active" id="fi-sl0"><div class="fi-sn">1</div><span>Situação</span></div>
          <div class="fi-ssep" id="fi-ss0"></div>
          <div class="fi-si" id="fi-sl1"><div class="fi-sn">2</div><span>Objetivo</span></div>
          <div class="fi-ssep" id="fi-ss1"></div>
          <div class="fi-si" id="fi-sl2"><div class="fi-sn">3</div><span>Detalhes</span></div>
        </div>
        <div class="fi-panel active" id="fi-p0">
          <div class="fi-pt">Sua situação financeira atual</div>
          <div class="fi-fg">
            <div class="fi-frow"><label>Renda mensal líquida (R$)</label><input type="number" id="fi-fi" placeholder="ex: 5000" min="0"/><span class="fi-hint">Salário + renda extra</span></div>
            <div class="fi-frow"><label>Gastos mensais totais (R$)</label><input type="number" id="fi-fe" placeholder="ex: 3200" min="0"/><span class="fi-hint">Aluguel, contas, alimentação…</span></div>
            <div class="fi-frow"><label>Saldo / reservas atuais (R$)</label><input type="number" id="fi-fs" placeholder="ex: 2000" min="0"/></div>
            <div class="fi-frow"><label>Perfil financeiro</label><select id="fi-fp"><option value="">Selecione…</option><option value="iniciante">Iniciante — Pouca reserva</option><option value="crescendo">Crescendo — Poupo às vezes</option><option value="organizado">Organizado — Controlo bem</option><option value="investidor">Investidor — Já invisto</option></select></div>
          </div>
        </div>
        <div class="fi-panel" id="fi-p1">
          <div class="fi-pt">Seu objetivo financeiro</div>
          <div class="fi-fg">
            <div class="fi-frow"><label>Tipo de objetivo</label><select id="fi-fgt"><option value="">Selecione…</option><option value="reserva">Reserva de emergência</option><option value="viagem">Viagem / grande compra</option><option value="investimento">Começar a investir</option><option value="divida">Quitar dívidas</option><option value="imovel">Imóvel / veículo</option><option value="outro">Outro objetivo</option></select></div>
            <div class="fi-frow"><label>Valor da meta (R$)</label><input type="number" id="fi-fga" placeholder="ex: 15000" min="0"/></div>
            <div class="fi-frow"><label>Prazo (meses)</label><input type="number" id="fi-fm" placeholder="ex: 12" min="1" max="120"/></div>
            <div class="fi-frow"><label>Quero guardar por mês (R$)</label><input type="number" id="fi-fsm" placeholder="0 = automático" min="0"/><span class="fi-hint">0 = calculado automaticamente</span></div>
          </div>
        </div>
        <div class="fi-panel" id="fi-p2">
          <div class="fi-pt">Contexto adicional</div>
          <div class="fi-fg">
            <div class="fi-frow"><label>Dívidas ativas</label><select id="fi-fd"><option value="nao">Não tenho dívidas</option><option value="pequena">Pequenas (até R$ 5k)</option><option value="media">Médias (R$ 5k–20k)</option><option value="grande">Grandes (acima de R$ 20k)</option></select></div>
            <div class="fi-frow"><label>Disciplina financeira</label><select id="fi-fdisc"><option value="baixo">Baixo — Gasto sem controle</option><option value="medio">Médio — Poupo às vezes</option><option value="alto">Alto — Sou disciplinado</option></select></div>
            <div class="fi-frow"><label>Investimentos atuais</label><select id="fi-finv"><option value="nao">Não invisto</option><option value="poupanca">Poupança</option><option value="renda-fixa">Renda fixa</option><option value="variavel">Renda variável</option></select></div>
            <div class="fi-frow"><label>Gasto com alimentação (R$)</label><input type="number" id="fi-ffood" placeholder="ex: 800" min="0"/></div>
          </div>
        </div>
      </div>
      <div class="fi-mf">
        <button class="fi-bg-btn" id="fi-bBack" style="display:none">← Voltar</button>
        <button class="fi-bg-btn" id="fi-bCancel">Cancelar</button>
        <button class="fi-p-btn" id="fi-bNext">Próximo →</button>
      </div>
    </div>
  </div>

  <!-- TOAST -->
  <div class="fi-toast" id="fi-toast"></div>
  `;

  /* wire events */
  fi$('fi-mx')?.addEventListener('click',fiCloseModal);
  fi$('fi-bCancel')?.addEventListener('click',fiCloseModal);
  fi$('fi-bBack')?.addEventListener('click',()=>{if(fiStep>0){fiStep--;fiStepSync()}});
  fi$('fi-bNext')?.addEventListener('click',()=>{if(!fiValid())return;if(fiStep<2){fiStep++;fiStepSync()}else{fiGen();fiCloseModal()}});
  fi$('fi-ov')?.addEventListener('click',e=>{if(e.target===fi$('fi-ov'))fiCloseModal()});
  fi$('fi-tblSrch')?.addEventListener('input',function(){if(fiPlan)fiFillTable(fiPlan.fc.filter(r=>r.month.toLowerCase().includes(this.value.toLowerCase())))});

  /* restore plan if exists */
  try{
    if(window.storage){
      const r=await window.storage.get('fi3:plan');
      if(r?.value){fiPlan=JSON.parse(r.value);fiUpdateKPI();fiDrawBar();fiDrawDonut();fiDrawLine();fiFillTable(fiPlan.fc);fiUpdateCTA()}
    }
  }catch(e){}

  /* resize handler */
  if(!window._fiRsz){
    window._fiRsz=true;
    let _rt;window.addEventListener('resize',()=>{clearTimeout(_rt);_rt=setTimeout(()=>{if(fiPlan&&activeModule==='financas'){fiDrawBar();fiDrawLine()}},180)});
  }
}

/* ─── 11 · ENERGIA E BEM-ESTAR ──────── */

/* ─── ENERGIA MENTAL (módulo unificado) ─── */
function renderEnergiaMental(s){
