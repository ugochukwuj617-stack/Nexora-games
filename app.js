const API_BASE="";const tg=window.Telegram?.WebApp||null;
const $=s=>document.querySelector(s);const $$=s=>document.querySelectorAll(s);
function toast(x){const e=$("#toast");e.textContent=x;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),2500)}
function nav(p){$$(".page").forEach(x=>x.classList.remove("active"));$(`#${p}`).classList.add("active");$$(".nav button").forEach(x=>x.classList.toggle("active",x.dataset.page===p));scrollTo(0,0)}
async function api(path,opt={}){if(!API_BASE)throw Error("backend not connected");const h={"Content-Type":"application/json"};if(tg?.initData)h["X-Telegram-Init-Data"]=tg.initData;const r=await fetch(API_BASE+path,{...opt,headers:h});if(!r.ok)throw Error("API "+r.status);return r.json()}
function openGame(g){$("#modal").classList.remove("hidden");let html="";
if(g==="number")html=`<h2>🔢 Number Guess</h2><p>Choose Even or Odd and pick 3 numbers.</p><div class="choice"><button>EVEN</button><button>ODD</button></div><button class="primary" style="margin-top:12px">Continue</button>`;
if(g==="coin")html=`<h2>🪙 Coin Flip</h2><p>Choose Head or Tail and flip.</p><div class="choice"><button>HEADS</button><button>TAILS</button></div><button class="primary" style="margin-top:12px">Flip Coin</button>`;
if(g==="mines")html=`<h2>💣 Mines</h2><p>Reveal safe tiles and cash out before a mine.</p><div class="minegrid">${Array.from({length:25},()=>"<button>?</button>").join("")}</div><button class="primary" style="margin-top:12px">Start Game</button>`;
$("#game").innerHTML=html;$("#game").querySelector(".primary")?.addEventListener("click",()=>toast("Secure game endpoint must be connected before accepting real-money bets."))}
document.addEventListener("DOMContentLoaded",()=>{
if(tg){tg.ready();tg.expand()}const u=tg?.initDataUnsafe?.user;if(u)$("#username").textContent=u.username?"@"+u.username:"Telegram user";
$$(".nav button").forEach(b=>b.onclick=()=>nav(b.dataset.page));$$("[data-game]").forEach(b=>b.onclick=()=>openGame(b.dataset.game));$("#close").onclick=()=>$("#modal").classList.add("hidden");
$$("[data-invest]").forEach(b=>b.onclick=()=>toast("Investment purchase will be enabled through the secure backend."));
$$("[data-action]").forEach(b=>b.onclick=()=>toast(b.dataset.action+" will use the secure backend."));
$("#copy").onclick=async()=>{const x=$("#refLink").textContent;if(x!=="—"){try{await navigator.clipboard.writeText(x);toast("Referral link copied")}catch(e){toast("Copy unavailable")}}};
if(API_BASE)loadData();
});
async function loadData(){try{const [w,r]=await Promise.all([api("/api/wallet"),api("/api/referrals")]);$("#ngn").textContent="₦"+Number(w.ngn_balance).toLocaleString();$("#usdt").textContent="$"+Number(w.usdt_balance).toLocaleString();$("#angn").textContent="₦"+Number(w.ngn_balance).toLocaleString();$("#ausdt").textContent="$"+Number(w.usdt_balance).toLocaleString();$("#refLink").textContent=r.referral_link||"—";$("#refs").textContent=r.count??"—";$("#commission").textContent=r.total_commission_display||"—"}catch(e){toast("Unable to load secure server data")}}
