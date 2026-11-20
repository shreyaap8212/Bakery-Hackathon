"use strict";
/* ---------- Icons ---------- */
const P={menu:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',order:'<path d="M4 3h16v18l-3-2-2.5 2-2.5-2-2.5 2L7 19l-3 2z"/><path d="M8 8h8M8 12h8"/>',bill:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',report:'<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',guide:'<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5z"/><path d="M8 7h8"/>',exit:'<path d="M9 21H5V3h4M16 17l5-5-5-5M21 12H9"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',plus:'<path d="M12 5v14M5 12h14"/>',undo:'<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',print:'<path d="M6 9V2h12v7M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="8"/>',alert:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',check:'<path d="M20 6 9 17l-5-5"/>',arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',bag:'<path d="M6 2 3 6v14h18V6l-3-4zM3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'};
const ic=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
/* ---------- Classes (arrays only – no ArrayList / HashMap) ---------- */
const GST=0.05,LOW_LIMIT=10;
class BakeryItemNotFoundException extends Error{constructor(id){super(`Item id ${id} is not on the menu. Pick an id from 101 to 106.`);this.name="BakeryItemNotFoundException"}}
class InsufficientStockException extends Error{constructor(item,want){super(`Only ${item.stock} ${item.name} left, but ${want} requested. Order rejected and stock unchanged.`);this.name="InsufficientStockException"}}
class BakeryItem{constructor(id,name,category,price,stock,emoji,cap){Object.assign(this,{id,name,category,price,stock,emoji,cap})}
 status(){return this.stock<LOW_LIMIT?"LOW":"OK"}}
class Person{constructor(name){this.name=name}}
class Customer extends Person{constructor(name){if(new.target===Customer)throw new Error("abstract");super(name)}getDiscountRate(){throw new Error("abstract")}}
class Regular extends Customer{constructor(n){super(n);this.type="Regular"}getDiscountRate(){return 0}}
class Loyalty extends Customer{constructor(n){super(n);this.type="Loyalty"}getDiscountRate(){return .10}}
class ItemStack{constructor(){this.data=new Array(50);this.top=-1}
 push(x){this.data[++this.top]=x}pop(){return this.top<0?null:this.data[this.top--]}
 toArray(){const a=[];for(let i=0;i<=this.top;i++)a.push(this.data[i]);return a}}
class Order{static counter=0;
 constructor(c,lines,token){this.id="ORD"+(++Order.counter);this.customer=c;this.lines=lines;this.token=token;this.shelf=(token&1)===1?1:2}
 subtotal(i=0){return i>=this.lines.length?0:this.lines[i].item.price*this.lines[i].qty+this.subtotal(i+1)}
 discount(){return this.subtotal()*this.customer.getDiscountRate()}
 gst(){return(this.subtotal()-this.discount())*GST}
 total(){return this.subtotal()-this.discount()+this.gst()}}
/* ---------- State ---------- */
const menu=[new BakeryItem(101,"Black Forest Pastry","Pastry",70,24,"🍰",30),new BakeryItem(102,"Chocolate Cake 500 g","Cake",450,8,"🎂",20),new BakeryItem(103,"Veg Puff","Snack",25,40,"🥟",50),new BakeryItem(104,"Brown Bread","Bread",45,20,"🍞",30),new BakeryItem(105,"Butter Cookies 200 g","Cookies",120,15,"🍪",25),new BakeryItem(106,"Plum Cake 250 g","Cake",180,10,"🧁",20)];
let orders=[],tokenCounter=1,draft={name:"",type:"Regular",stack:new ItemStack()},view="menu",lastBill=null,loaded=false;
const $=s=>document.querySelector(s);
const inr=n=>"₹"+Number(n).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const findItem=id=>{for(let i=0;i<menu.length;i++)if(menu[i].id===id)return menu[i];throw new BakeryItemNotFoundException(id)};
function qtyInStack(id){let q=0;const a=draft.stack.toArray();for(let i=0;i<a.length;i++)if(a[i].item.id===id)q+=a[i].qty;return q}
function validate(id,qty){const it=findItem(id);if(qty!==undefined){const w=qtyInStack(id)+qty;if(w>it.stock)throw new InsufficientStockException(it,w)}return it}
function addToDraft(rawId,rawQty){
 const id=Number(rawId),qty=Number(rawQty);
 if(String(rawId).trim()===""||!Number.isInteger(id))throw new Error("Item id must be a whole number such as 101.");
 if(String(rawQty).trim()===""||!Number.isInteger(qty)||qty<=0)throw new Error("Quantity must be a whole number greater than 0.");
 draft.stack.push({item:validate(id,qty),qty});
}
function finishOrder(){
 const lines=draft.stack.toArray();
 if(!draft.name.trim())throw new Error("Enter the customer name first.");
 if(!lines.length)throw new Error("Add at least one item before finishing.");
 for(let i=0;i<lines.length;i++){const need=qtyInStack(lines[i].item.id);if(need>lines[i].item.stock)throw new InsufficientStockException(lines[i].item,need)}
 for(let i=0;i<lines.length;i++)lines[i].item.stock-=lines[i].qty;
 const c=draft.type==="Loyalty"?new Loyalty(draft.name.trim()):new Regular(draft.name.trim());
 const o=new Order(c,lines,tokenCounter++);orders.push(o);draft={name:"",type:draft.type,stack:new ItemStack()};return o;
}
/* ---------- UI helpers ---------- */
let tt;function toast(t,k){const e=$("#toast");e.innerHTML=ic(k==="err"?"alert":"check")+`<span>${esc(t)}</span>`;e.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>e.classList.remove("on"),3200)}
function inlineErr(t){const e=$("#oe");if(!e)return;e.innerHTML=ic("alert")+`<span>${esc(t)}</span>`;e.classList.add("on")}
function clearErr(){const e=$("#oe");if(e)e.classList.remove("on")}
function countUp(){document.querySelectorAll("[data-c]").forEach(el=>{const to=+el.dataset.c,money=el.dataset.m,t0=performance.now();
 const f=t=>{const p=Math.min(1,(t-t0)/700),v=to*(1-Math.pow(1-p,3));el.textContent=money?inr(v):Math.round(v);if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f)})}
const NAV=[["menu","Menu"],["order","New order"],["bill","View bill"],["report","Sales report"],["guide","Guide"]];
function drawNav(){$("#nav").innerHTML=`<div class="logo"><i>${ic("bag")}</i>CrustCraft</div>`+NAV.map(([v,t])=>`<button class="nv" data-v="${v}" ${v===view?'aria-current="page"':""}>${ic(v)}${t}${v==="order"&&draft.stack.top>=0?`<span class="k">${draft.stack.top+1}</span>`:""}</button>`).join("")+`<div class="sp"></div><button class="nv" id="theme">${ic("sun")}<span>Switch theme</span></button><button class="nv" data-v="exit" ${view==="exit"?'aria-current="page"':""}>${ic("exit")}Exit</button>`;
 document.querySelectorAll("nav [data-v]").forEach(b=>b.onclick=()=>go(b.dataset.v));
 $("#theme").onclick=()=>{const r=document.documentElement,d=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;r.dataset.theme=d?"light":"dark"}}
/* ---------- Views ---------- */
function prodCard(m){const pct=Math.min(100,m.stock/m.cap*100),low=m.status()==="LOW";
 return `<button class="prod" data-add="${m.id}" ${m.stock<1?"disabled":""} aria-label="Add ${esc(m.name)} to order"><span class="add">${ic("plus")}</span><span class="em">${m.emoji}</span><span class="id">#${m.id} · ${m.category}</span><b>${esc(m.name)}</b><span class="pr">${inr(m.price)}</span><div class="meter ${low?"low":""}"><i style="width:${pct}%"></i></div><div class="srow"><span>${m.stock} in stock</span><span class="pill ${low?"low":"ok"}">${m.status()}</span></div></button>`}
function vMenu(){
 if(!loaded)return `<div class="sk" style="height:280px;margin-bottom:20px"></div><div class="stats">${'<div class="sk" style="height:90px"></div>'.repeat(4)}</div><div class="pg">${'<div class="sk" style="height:210px"></div>'.repeat(6)}</div>`;
 const low=menu.filter(m=>m.stock<LOW_LIMIT).length,rev=orders.reduce((s,o)=>s+o.total(),0);
 return `<section class="hero"><span class="tag"><b></b>Counter open · Token #${tokenCounter} is next</span><h1>Billing at the <span class="grad">speed of the counter.</span></h1><p>Ring up orders, apply loyalty discounts and GST, and hand over a token with the right shelf, all in a few taps.</p><div class="btns"><button class="btn p" data-go="order">Start new order ${ic("arrow")}</button><button class="btn" data-go="guide">How it works</button></div></section>
 <div class="stats"><div class="stat"><b data-c="${menu.length}">0</b><span>Items on the menu</span></div><div class="stat"><b data-c="${low}">0</b><span>Running low</span></div><div class="stat"><b data-c="${orders.length}">0</b><span>Orders today</span></div><div class="stat"><b data-c="${rev}" data-m="1">₹0.00</b><span>Revenue today</span></div></div>
 <div class="sec"><h3>Today’s menu</h3><span style="color:var(--mut);font-size:13px">Tap an item to add it · LOW below ${LOW_LIMIT}</span></div><div class="pg">${menu.map(prodCard).join("")}</div>`}
function basketHTML(){const a=draft.stack.toArray();
 if(!a.length)return `<div class="empty"><div class="ic">${ic("bag")}</div><b>Basket is empty</b><br>Tap an item to start the order.</div>`;
 return '<ul class="basket">'+a.map((l,i)=>`<li><span>${l.qty} × ${esc(l.item.name)}${i===a.length-1?"<small>last added</small>":""}</span><b>${inr(l.item.price*l.qty)}</b></li>`).join("")+"</ul>"+sumHTML(a)}
function sumHTML(a){const t=Object.create(Order.prototype);t.lines=a;t.customer=draft.type==="Loyalty"?new Loyalty("x"):new Regular("x");
 return `<div class="sum"><div><span>Subtotal</span><span>${inr(t.subtotal())}</span></div><div><span>Discount (${t.customer.getDiscountRate()*100}%)</span><span>− ${inr(t.discount())}</span></div><div><span>GST 5%</span><span>${inr(t.gst())}</span></div><div class="tot"><span>Total</span><span>${inr(t.total())}</span></div></div>`}
function vOrder(){
 return `<div class="head"><div><h2>New order</h2><p>Tap items, undo mistakes, then finish to print the bill.</p></div></div>
 <div class="g2"><div class="fm"><div class="card fm">
  <div><label class="lbl" for="cn">Customer name</label><input class="in" id="cn" value="${esc(draft.name)}" placeholder="e.g. Asha Verma" autocomplete="off"></div>
  <div><span class="lbl">Customer type</span><div class="seg" role="group" aria-label="Customer type"><button type="button" data-t="Regular" aria-pressed="${draft.type==="Regular"}">Regular · 0% off</button><button type="button" data-t="Loyalty" aria-pressed="${draft.type==="Loyalty"}">Loyalty · 10% off</button></div></div>
  <div class="row"><div style="flex:2"><label class="lbl" for="iid">Item id</label><input class="in" id="iid" inputmode="numeric" placeholder="101" autocomplete="off"></div><div><label class="lbl" for="iq">Qty</label><input class="in" id="iq" inputmode="numeric" value="1" autocomplete="off"></div><button class="btn p" id="add" type="button" style="height:44px">${ic("plus")}Add</button></div>
  <div class="err" id="oe" role="alert"></div></div>
  <div class="pg" id="tiles">${menu.map(prodCard).join("")}</div></div>
 <div class="card side noprint"><h3>Current order</h3><div id="bk">${basketHTML()}</div><div class="btns mt"><button class="btn" id="undo" type="button">${ic("undo")}Undo last</button><button class="btn" id="clear" type="button">${ic("trash")}Clear</button></div><button class="btn p" id="fin" style="width:100%;margin-top:12px" type="button">Finish order &amp; print bill</button></div></div>`}
function receiptHTML(o){
 return `<div class="receipt"><h3>CrustCraft Bakery</h3><div class="sub">${o.id} · ${esc(o.customer.name)} (${o.customer.type})</div>
 <div class="ticket"><div><small>Token</small><b>${o.token}</b></div><div style="text-align:right"><small>Collect from</small><b>Shelf ${o.shelf}</b></div></div>
 ${o.lines.map(l=>`<div class="rl"><span>${l.qty} × ${esc(l.item.name)}</span><span>${inr(l.item.price*l.qty)}</span></div>`).join("")}<hr style="border:0;border-top:1px dashed var(--line);margin:12px 0">
 <div class="rl m"><span>Subtotal</span><span>${inr(o.subtotal())}</span></div><div class="rl m"><span>Discount (${o.customer.getDiscountRate()*100}%)</span><span>− ${inr(o.discount())}</span></div><div class="rl m"><span>GST 5%</span><span>${inr(o.gst())}</span></div>
 <div class="rl" style="font:800 24px 'Bricolage Grotesque';margin-top:8px"><span>Total</span><span>${inr(o.total())}</span></div></div>`}
function vBill(){
 return `<div class="head"><div><h2>View bill</h2><p>Find any bill from today by its order id.</p></div></div>
 <div class="card noprint"><div class="row"><div style="flex:3"><label class="lbl" for="oid">Order id</label><input class="in" id="oid" placeholder="ORD1 or just 1" autocomplete="off"></div><button class="btn p" id="find" type="button">${ic("bill")}Find bill</button>${lastBill?`<button class="btn" id="prt" type="button">${ic("print")}Print</button>`:""}</div><div class="err" id="oe" role="alert"></div></div>
 <div class="mt">${lastBill?receiptHTML(lastBill):`<div class="card empty"><div class="ic">${ic("order")}</div><b>No bill selected</b><br>Finish an order or search an id to see its bill here.</div>`}</div>`}
function vReport(exit){
 let rev=0,best=null,mx=0;const cnt=new Array(menu.length).fill(0);
 orders.forEach(o=>{rev+=o.total();o.lines.forEach(l=>cnt[menu.indexOf(l.item)]+=l.qty)});
 cnt.forEach((c,k)=>{if(c>mx){mx=c;best=menu[k]}});
 const bars=menu.map((m,k)=>`<div class="mt"><div class="rl"><span>${m.emoji} ${esc(m.name)}</span><b>${cnt[k]} sold</b></div><div class="bar"><i style="width:${mx?cnt[k]/mx*100:0}%"></i></div></div>`).join("");
 return `<div class="head"><div><h2>${exit?"Shift closed":"Sales report"}</h2><p>${exit?"Thanks for baking today. Here is the final tally.":"End-of-day summary."}</p></div>${exit?`<button class="btn p" data-go="menu">Reopen counter</button>`:""}</div>
 <div class="stats"><div class="stat"><b data-c="${orders.length}">0</b><span>Total orders</span></div><div class="stat"><b data-c="${rev}" data-m="1">₹0.00</b><span>Total revenue</span></div><div class="stat"><b style="font-size:20px;line-height:1.5">${best?esc(best.name):"–"}</b><span>Most popular${best?` (${mx} sold)`:""}</span></div></div>
 <div class="card"><h3>Units sold per item</h3>${orders.length?bars:`<div class="empty"><div class="ic">${ic("report")}</div><b>No sales yet</b><br>Complete an order to see the report.</div>`}</div>`}
function vGuide(){
 return `<div class="head"><div><h2>Guide</h2><p>How to use CrustCraft at the counter.</p></div></div>
 <div class="card"><h3>Taking an order</h3><ol class="steps"><li><span>Open <b>New order</b>, type the customer’s name and choose Regular or Loyalty.</span></li><li><span>Tap an item, or enter an item id (101–106) and quantity, then press <b>Add</b>.</span></li><li><span>Wrong item? <b>Undo last</b> removes the most recent one (stack: last in, first out).</span></li><li><span><b>Finish order</b> prints the bill. Stock is reduced only after every line passes the stock check.</span></li><li><span>The token picks the shelf: odd tokens go to Shelf 1, even tokens to Shelf 2.</span></li></ol>
 <h3 class="mt">Billing rule</h3><p style="color:var(--mut)">Subtotal, minus discount (Regular 0%, Loyalty 10%), plus 5% GST on the discounted amount.</p></div>
 <div class="card mt"><h3>Try the test cases</h3><p style="color:var(--mut);margin:4px 0 0">Each button fills the order form for you.</p>
 <div class="tests"><button data-test="1"><b>Case 1 · Regular</b><span>2 × Pastry, 1 × Cookies. Expect ₹273.00</span></button><button data-test="2"><b>Case 2 · Loyalty</b><span>3 × Choc Cake, 2 × Plum Cake. Expect ₹1,615.95</span></button><button data-test="3"><b>Case 3 · Low stock</b><span>9 × Choc Cake. Expect stock error</span></button><button data-test="4"><b>Case 4 · Bad id</b><span>Item 999. Expect not-found error</span></button></div></div>`}
/* ---------- Render & events ---------- */
const views={menu:vMenu,order:vOrder,bill:vBill,report:()=>vReport(false),guide:vGuide,exit:()=>vReport(true)};
function go(v){view=v;render();window.scrollTo({top:0,behavior:"smooth"})}
function render(){
 $("#main").innerHTML=`<div class="view">${views[view]()}</div>`;drawNav();
 document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
 document.querySelectorAll("[data-c]").length&&countUp();
 if(view==="menu")document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>{try{addToDraft(b.dataset.add,1);toast(`Added ${findItem(+b.dataset.add).name}`);drawNav()}catch(e){toast(e.message,"err")}});
 if(view==="order")bindOrder();
 if(view==="bill")bindBill();
 if(view==="guide")document.querySelectorAll("[data-test]").forEach(b=>b.onclick=()=>runTest(+b.dataset.test));
}
function refresh(){$("#bk").innerHTML=basketHTML();drawNav()}
function bindOrder(){
 $("#cn").oninput=e=>{draft.name=e.target.value;e.target.classList.remove("bad")};
 document.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{draft.type=b.dataset.t;document.querySelectorAll("[data-t]").forEach(x=>x.setAttribute("aria-pressed",x===b));refresh()});
 const add=(i,q,fromTile)=>{try{addToDraft(i,q);clearErr();if(!fromTile){$("#iid").value="";$("#iq").value="1";$("#iid").focus()}refresh();toast("Added to the order.")}catch(e){inlineErr(e.message);toast(e.message,"err")}};
 $("#add").onclick=()=>add($("#iid").value,$("#iq").value);
 [$("#iid"),$("#iq")].forEach(i=>i.onkeydown=e=>{if(e.key==="Enter")add($("#iid").value,$("#iq").value)});
 document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>add(b.dataset.add,1,true));
 $("#undo").onclick=()=>{const x=draft.stack.pop();x?toast(`Removed ${x.qty} × ${x.item.name}.`):toast("Nothing to undo yet.","err");refresh()};
 $("#clear").onclick=()=>{draft.stack=new ItemStack();clearErr();refresh();toast("Order cleared.")};
 $("#fin").onclick=()=>{try{lastBill=finishOrder();toast("Order billed.");go("bill")}catch(e){if(!draft.name.trim())$("#cn").classList.add("bad");inlineErr(e.message)}};
}
function bindBill(){
 const f=()=>{const raw=$("#oid").value.trim().toUpperCase(),id=/^\d+$/.test(raw)?"ORD"+raw:raw;
  if(!raw){inlineErr("Enter an order id such as ORD1.");return}
  for(let i=0;i<orders.length;i++)if(orders[i].id===id){lastBill=orders[i];render();return}
  inlineErr(`No bill found for ${id}. Check the id and try again.`)};
 $("#find").onclick=f;$("#oid").onkeydown=e=>{if(e.key==="Enter")f()};
 if($("#prt"))$("#prt").onclick=()=>window.print();
}
function runTest(n){
 draft={name:["","Test Regular","Test Loyalty","Test Regular","Test Regular"][n],type:n===2?"Loyalty":"Regular",stack:new ItemStack()};
 const sets=[null,[[101,2],[105,1]],[[102,3],[106,2]],[[102,9]],[[999,1]]];
 view="order";render();
 try{for(const[i,q]of sets[n])addToDraft(i,q);refresh();toast("Test loaded. Press Finish order.")}
 catch(e){refresh();inlineErr(`${e.name}: ${e.message}`)}
}
render();setTimeout(()=>{loaded=true;if(view==="menu")render()},650);
