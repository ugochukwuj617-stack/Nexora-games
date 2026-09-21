/*
  Nexora Games frontend.
  IMPORTANT: real-money outcomes, balances, deposits, withdrawals and referral
  commissions must be verified by a secure backend. No secret payment keys belong here.
*/
const API_BASE = ""; // Set to your HTTPS backend URL when it is deployed.

const state = {
  page: "home",
  asset: "ngn",
  numberSide: null,
  selectedNumbers: [],
  coinSide: null
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function toast(message){
  const t=$("#toast"); t.textContent=message; t.classList.add("show");
  clearTimeout(window.__toast); window.__toast=setTimeout(()=>t.classList.remove("show"),2600);
}

async function api(path, options={}){
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  if(window.Telegram?.WebApp?.initData) headers["X-Telegram-Init-Data"]=Telegram.WebApp.initData;
  const res=await fetch(API_BASE+path,{...options,headers});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.message||"Server request failed");
  return data;
}

function showPage(name){
  state.page=name;
  $$(".page").forEach(p=>p.classList.remove("active"));
  const target=$("#"+(name==="number"?"game-number":name==="coin"?"game-coin":name==="spin"?"game-spin":name));
  if(target) target.classList.add("active");
  $$(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
  window.scrollTo({top:0,behavior:"smooth"});
}

function openGame(game){ showPage(game); }

function buildNumbers(){
  const grid=$("#numberGrid");
  for(let n=2;n<=50;n++){
    const b=document.createElement("button"); b.textContent=n; b.dataset.number=n;
    b.onclick=()=>{
      if(!state.numberSide){toast("Choose Even or Odd first.");return}
      if(state.selectedNumbers.includes(n)){
        state.selectedNumbers=state.selectedNumbers.filter(x=>x!==n);
        b.classList.remove("selected");
      }else if(state.selectedNumbers.length<3){
        state.selectedNumbers.push(n); b.classList.add("selected");
      }else toast("You can select exactly 3 numbers.");
      $("#numberCount").textContent=`${state.selectedNumbers.length} / 3`;
      $("#playNumber").disabled=!(state.numberSide && state.selectedNumbers.length===3);
    };
    grid.appendChild(b);
  }
}

$$("[data-open-game]").forEach(b=>b.onclick=()=>openGame(b.dataset.openGame));
$$("[data-home]").forEach(b=>b.onclick=()=>showPage("home"));
$$(".nav-btn").forEach(b=>b.onclick=()=>showPage(b.dataset.page));

$$("[data-side]").forEach(b=>b.onclick=()=>{
  state.numberSide=b.dataset.side;
  $$("[data-side]").forEach(x=>x.classList.toggle("selected",x===b));
  $("#playNumber").disabled=state.selectedNumbers.length!==3;
});

$("#playNumber").onclick=async()=>{
  if(state.selectedNumbers.length!==3||!state.numberSide)return;
  const result=$("#numberResult"); result.classList.remove("hidden"); result.textContent="Generating secure draws…";
  $("#playNumber").disabled=true;
  try{
    const data=await api("/api/games/number-guess",{method:"POST",body:JSON.stringify({
      side:state.numberSide,numbers:state.selectedNumbers
    })});
    result.innerHTML=`<b>${data.message||"Game complete."}</b>`;
    await loadAccount();
  }catch(e){result.textContent=e.message;toast(e.message)}
  finally{$("#playNumber").disabled=false}
};

$$("[data-coin]").forEach(b=>b.onclick=()=>{
  state.coinSide=b.dataset.coin;
  $$("[data-coin]").forEach(x=>x.classList.toggle("selected",x===b));
  $("#flipCoin").disabled=false;
});

$("#flipCoin").onclick=async()=>{
  const coin=$("#coin"), result=$("#coinResult");
  coin.classList.add("flipping"); result.classList.add("hidden"); $("#flipCoin").disabled=true;
  try{
    const data=await api("/api/games/coin-flip",{method:"POST",body:JSON.stringify({choice:state.coinSide})});
    setTimeout(()=>{
      coin.classList.remove("flipping");
      coin.textContent=(data.outcome||"N").toString().toUpperCase()==="HEAD"?"H":"T";
      result.classList.remove("hidden"); result.innerHTML=`<b>${data.message||"Flip complete."}</b>`;
    },800);
    setTimeout(loadAccount,900);
  }catch(e){coin.classList.remove("flipping");result.classList.remove("hidden");result.textContent=e.message;toast(e.message)}
  finally{setTimeout(()=>$("#flipCoin").disabled=false,850)}
};

$("#spinNow").onclick=async()=>{
  const wheel=$("#wheel"), result=$("#spinResult");
  wheel.classList.remove("spin"); void wheel.offsetWidth; wheel.classList.add("spin");
  $("#spinNow").disabled=true; result.classList.add("hidden");
  try{
    const data=await api("/api/games/lucky-spin",{method:"POST"});
    setTimeout(()=>{
      result.classList.remove("hidden"); result.innerHTML=`<b>${data.message||"Spin complete."}</b>`;
    },2550);
    setTimeout(loadAccount,2600);
  }catch(e){result.classList.remove("hidden");result.textContent=e.message;toast(e.message)}
  finally{setTimeout(()=>$("#spinNow").disabled=false,2600)}
};

$$(".tab").forEach(b=>b.onclick=()=>{
  state.asset=b.dataset.asset;
  $$(".tab").forEach(x=>x.classList.toggle("active",x===b));
  loadAccount(); renderAssetAction("deposit");
});

$$("[data-action]").forEach(b=>b.onclick=()=>renderAssetAction(b.dataset.action));

function renderAssetAction(action){
  const box=$("#assetContent"), symbol=state.asset==="ngn"?"₦":"₮";
  if(action==="history"){
    box.innerHTML=`<h3>Recent transactions</h3><p class="muted">Transactions will appear here after the secure backend returns verified ledger records.</p><div id="historyList"></div>`;
    loadHistory(); return;
  }
  if(action==="deposit"){
    box.innerHTML=`<h3>Deposit ${state.asset.toUpperCase()}</h3><p class="muted">${state.asset==="ngn"?"Use the approved NGN payment method generated by the server.":"Use the USDT address/network supplied by the server."}</p>
      <input class="field" id="depositAmount" type="number" min="1" placeholder="Amount">
      <button class="primary-btn" id="depositBtn">Continue Deposit</button>`;
    $("#depositBtn").onclick=deposit; return;
  }
  box.innerHTML=`<h3>Withdraw ${state.asset.toUpperCase()}</h3><p class="muted">${state.asset==="ngn"?"Enter your verified Nigerian bank details.":"Enter your verified USDT address and supported network."}</p>
    <input class="field" id="withdrawAmount" type="number" min="1" placeholder="Amount">
    <input class="field" id="withdrawDestination" placeholder="${state.asset==="ngn"?"Bank account number":"USDT wallet address"}">
    <input class="field" id="withdrawNetwork" placeholder="${state.asset==="ngn"?"Bank name/code":"Network e.g. TRC20"}">
    <p class="danger-note">Withdrawals are processed only after server-side validation and risk checks.</p>
    <button class="primary-btn" id="withdrawBtn">Request Withdrawal</button>`;
  $("#withdrawBtn").onclick=withdraw;
}

async function deposit(){
  const amount=Number($("#depositAmount").value);
  if(!amount||amount<=0){toast("Enter a valid amount.");return}
  try{
    const data=await api("/api/assets/deposit",{method:"POST",body:JSON.stringify({asset:state.asset,amount})});
    if(data.checkoutUrl) window.location.href=data.checkoutUrl;
    else toast(data.message||"Deposit instructions created.");
  }catch(e){toast(e.message)}
}

async function withdraw(){
  const amount=Number($("#withdrawAmount").value), destination=$("#withdrawDestination").value.trim(), network=$("#withdrawNetwork").value.trim();
  if(!amount||!destination||!network){toast("Complete all withdrawal fields.");return}
  try{
    const data=await api("/api/assets/withdraw",{method:"POST",body:JSON.stringify({asset:state.asset,amount,destination,network})});
    toast(data.message||"Withdrawal request submitted.");
    await loadAccount();
  }catch(e){toast(e.message)}
}

async function loadHistory(){
  try{
    const data=await api(`/api/assets/transactions?asset=${state.asset}`);
    const list=$("#historyList");
    list.innerHTML=(data.transactions||[]).map(x=>`<div class="stat-card" style="margin-top:8px"><span>${x.type} • ${x.status}</span><b>${x.amount} ${state.asset.toUpperCase()}</b></div>`).join("")||'<p class="muted">No verified transactions yet.</p>';
  }catch(e){$("#historyList").innerHTML=`<p class="muted">${e.message}</p>`}
}

async function loadAccount(){
  try{
    const d=await api("/api/account");
    if(d.ngnBalance!==undefined){$("#ngnBalance").textContent=`₦${Number(d.ngnBalance).toLocaleString()}`}
    if(d.usdtBalance!==undefined){$("#usdtBalance").textContent=Number(d.usdtBalance).toFixed(2)}
    const bal=state.asset==="ngn"?d.ngnBalance:d.usdtBalance;
    $("#assetBalance").textContent=state.asset==="ngn"&&bal!==undefined?`₦${Number(bal).toLocaleString()}`:bal!==undefined?`${Number(bal).toFixed(2)} USDT`:"—";
    if(d.referralCount!==undefined)$("#refCount").textContent=d.referralCount;
    if(d.referralCommission!==undefined)$("#refCommission").textContent=`₦${Number(d.referralCommission).toLocaleString()}`;
    if(d.referralLink)$("#refLink").textContent=d.referralLink;
  }catch(e){
    // No invented balances: keep unavailable fields as “—”.
  }
}

$("#copyRef").onclick=async()=>{
  const value=$("#refLink").textContent;
  if(!value||value==="Loading…")return toast("Referral link is not ready.");
  await navigator.clipboard.writeText(value); toast("Referral link copied.");
};
$("#shareRef").onclick=async()=>{
  const value=$("#refLink").textContent;
  if(navigator.share&&value) await navigator.share({title:"Nexora Games",text:"Join me on Nexora Games",url:value});
  else toast("Use Copy Link to share your referral link.");
};

$("#notifyBtn").onclick=()=>toast("Notifications will come from the Nexora backend.");

if(window.Telegram?.WebApp){Telegram.WebApp.ready();Telegram.WebApp.expand();}
buildNumbers(); renderAssetAction("deposit"); loadAccount();
