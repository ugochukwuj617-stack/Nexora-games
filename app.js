const API_BASE = window.NEXORA_API_BASE || '/api';
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const state = { page:'home', account:null, winners:[], winnerIndex:0, betAmount:null };
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>[...document.querySelectorAll(s)];
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2200); }
function money(v,cur){ if(v===null||v===undefined||v==='') return cur==='NGN'?'₦ —':'$ —'; const n=Number(v); return cur==='NGN'?`₦ ${n.toLocaleString('en-NG',{minimumFractionDigits:2})}`:`$ ${n.toFixed(2)}`; }
function showPage(id){ $$('.page').forEach(p=>p.classList.remove('active')); const el=$('#'+id); if(el) el.classList.add('active'); $$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===id)); state.page=id; window.scrollTo(0,0); }
async function api(path,options={}){
  const headers={'Content-Type':'application/json'};
  if(tg?.initData) headers['X-Telegram-Init-Data']=tg.initData;
  const res=await fetch(API_BASE+path,{...options,headers:{...headers,...(options.headers||{})}});
  if(!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
function applyAccount(a){
  state.account=a;
  const ngn=money(a.ngnBalance,'NGN'), usdt=money(a.usdtBalance,'USDT');
  ['#homeNgn','#investNgn','#assetNgn'].forEach(s=>{const e=$(s);if(e)e.textContent=ngn});
  ['#homeUsdt','#investUsdt','#assetUsdt'].forEach(s=>{const e=$(s);if(e)e.textContent=usdt});
  const u=a.telegramUsername?`@${a.telegramUsername}`:'Telegram account'; const tu=$('#telegramUser'); if(tu)tu.textContent=u;
  if(a.referralLink) $('#refLink').textContent=a.referralLink;
  if(a.referralCount!==undefined) $('#refCount').textContent=a.referralCount;
  if(a.referralCommission!==undefined) $('#refCommission').textContent=money(a.referralCommission,'NGN');
  if(a.kycStatus) $('#kycStatus').textContent=a.kycStatus;
  if(a.twoFaEnabled!==undefined) $('#twofaStatus').textContent=a.twoFaEnabled?'Enabled':'Not enabled';
}
async function loadAccount(){
  try { const data=await api('/me'); applyAccount(data.user||data); if(data.referralHistory) renderHistory('#refHistory',data.referralHistory); if(data.transactions) renderHistory('#assetHistory',data.transactions); }
  catch(e){ console.warn(e); toast('Secure account service is not connected yet. No fake balance is shown.'); }
}
function renderHistory(sel,rows){ const e=$(sel); if(!e)return; if(!rows?.length){e.textContent='No settled transactions yet.';return} e.innerHTML=rows.slice(0,20).map(r=>`<div class="history-row"><span>${String(r.type||'Transaction')}</span><b>${String(r.amount??'—')} ${String(r.currency||'')}</b></div>`).join(''); }
async function loadWinners(){
  try { const d=await api('/games/winners?limit=20'); state.winners=d.winners||[]; renderWinner(); }
  catch(e){ /* Intentionally no fabricated winners. */ }
}
function renderWinner(){
  if(!state.winners.length)return; const w=state.winners[state.winnerIndex%state.winners.length];
  $('#winnerName').textContent=w.username||'Player'; $('#winnerMeta').textContent=w.game?`${w.game} • ${w.ageLabel||'settled'}`:'Settled result'; $('#winnerAmount').textContent=w.amount?money(w.amount,w.currency||'NGN'):'—'; $('#winnerName').previousElementSibling.textContent=(w.initial||String(w.username||'P').charAt(0)).toUpperCase(); state.winnerIndex++;
}
setInterval(renderWinner,2000);
function openGame(game){ showPage('game-'+game); if(game==='luckyjet')loadLucky(); if(game==='mines')loadMines(); if(game==='coinflip')loadCoin(); }
async function loadLucky(){
  try{ const d=await api('/games/luckyjet/state'); $('#luckyMultiplier').textContent=d.multiplier?`x${Number(d.multiplier).toFixed(2)}`:'—'; $('#luckyBet').textContent=d.minimumBet?money(d.minimumBet,d.currency||'NGN'):'—'; (d.roundHistory||[]).forEach((x,i)=>{const e=document.createElement('span');e.textContent=x.multiplier?`x${x.multiplier}`:'—';$('#luckyRounds').appendChild(e)}); }
  catch(e){ $('#luckyMultiplier').textContent='—'; }
}
async function loadMines(){
  const board=$('#mineBoard'); board.innerHTML=''; for(let i=0;i<25;i++){const b=document.createElement('button');b.type='button';b.textContent='';b.disabled=true;board.appendChild(b)}
  try{const d=await api('/games/mines/state');$('#mineMax').textContent=d.maxWin??'—';$('#mineTraps').textContent=d.traps??'—';$('#mineBet').textContent=d.minimumBet?money(d.minimumBet,d.currency||'NGN'):'—';}catch(e){}
}
async function loadCoin(){ try{const d=await api('/games/coinflip/state');$('#coinPrev').textContent=d.previousOutcome||'—';$('#coinBet').textContent=d.minimumBet?money(d.minimumBet,d.currency||'NGN'):'—';}catch(e){} }
$$('[data-nav]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.nav)));
$$('[data-game]').forEach(c=>c.addEventListener('click',e=>{if(e.target.closest('button'))openGame(c.dataset.game);else openGame(c.dataset.game)}));
$$('[data-back]').forEach(b=>b.addEventListener('click',()=>showPage('home')));
$$('[data-invest]').forEach(b=>b.addEventListener('click',async()=>{try{await api('/investments',{method:'POST',body:JSON.stringify({planId:Number(b.dataset.invest)})});toast('Investment request submitted for server processing.');loadAccount();}catch(e){toast('Investment service is unavailable. No balance was changed.')}}));
$('#copyRef')?.addEventListener('click',async()=>{const v=$('#refLink').textContent;if(!v||v.includes('Loading'))return toast('Referral link is not available yet.');try{await navigator.clipboard.writeText(v);toast('Referral link copied.')}catch(e){toast(v)}});
$$('[data-action]').forEach(b=>b.addEventListener('click',async()=>{const action=b.dataset.action; if(action.startsWith('deposit'))showPage('assets'); toast(`${action.replaceAll('-',' ')} requires the secure wallet service.`)}));
$('#luckyBetBtn')?.addEventListener('click',async()=>{try{await api('/games/luckyjet/bets',{method:'POST',body:JSON.stringify({amount:$('#luckyBet').textContent,autoCashout:$('#autoCash').checked})});toast('Bet accepted by the server.');}catch(e){toast('Bet not placed. Server did not confirm it.')}});
$('#minePlay')?.addEventListener('click',async()=>{try{const d=await api('/games/mines/rounds',{method:'POST',body:JSON.stringify({amount:$('#mineBet').textContent})});toast(d.message||'Round created by server.');}catch(e){toast('Round not started. Server did not confirm it.')}});
$$('[data-side]').forEach(b=>b.addEventListener('click',async()=>{try{const d=await api('/games/coinflip/bets',{method:'POST',body:JSON.stringify({side:b.dataset.side,amount:$('#coinBet').textContent})});toast(d.message||'Bet accepted by the server.');}catch(e){toast('Bet not placed. Server did not confirm it.')}}));
loadAccount(); loadWinners();
