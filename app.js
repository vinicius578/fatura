const KEY_V1 = "controle-familiar-faturas-v1";
const KEY = "controle-familiar-faturas-v2";
const KEY_UNDO = "controle-familiar-faturas-undo";
const DEFAULT_CARDS = [
  {id:"dm_beatriz", name:"DM Card", owner:"Beatriz"},
  {id:"bb", name:"Banco do Brasil", owner:"Cartão da família"},
  {id:"nubank_vanvan", name:"Nubank", owner:"Vanvan"},
  {id:"bmg_vanvan", name:"BMG", owner:"Vanvan"}
];
const DEFAULT_PEOPLE = ["Beatriz","Bianca","Vanvan","Giovana","Vinícius"];
const $ = id => document.getElementById(id);
const money = c => (c/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function parseMoney(v){
  let s = v.trim().replace(/R\$/gi,"").replace(/\s/g,"");
  if (s.includes(",")) s = s.replace(/\./g,"").replace(",",".");
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n*100) : null;
}
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function nowMonth(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"); }
function validEntries(d){ return Array.isArray(d) && d.every(e=>e && e.id && e.month && e.card_id && e.person && Number.isInteger(e.amount_cents)); }

function load(){
  try {
    const v2 = localStorage.getItem(KEY);
    if (v2) { const d = JSON.parse(v2); if (d && Array.isArray(d.cards) && Array.isArray(d.people) && Array.isArray(d.entries)) return d; }
    const v1 = JSON.parse(localStorage.getItem(KEY_V1)||"[]");
    return {cards:DEFAULT_CARDS.slice(), people:DEFAULT_PEOPLE.slice(), entries:Array.isArray(v1)?v1:[]};
  } catch(e){ return {cards:DEFAULT_CARDS.slice(), people:DEFAULT_PEOPLE.slice(), entries:[]}; }
}
let db = load();
function save(){ localStorage.setItem(KEY, JSON.stringify(db)); }
let currentCard = db.cards[0] ? db.cards[0].id : null;
const month = () => $("month").value || nowMonth();

function fillPeople(){
  const opts = db.people.map(p=>`<option>${esc(p)}</option>`).join("");
  const a=$("person").value, b=$("editPerson").value;
  $("person").innerHTML = opts; $("editPerson").innerHTML = opts;
  if (db.people.includes(a)) $("person").value=a;
  if (db.people.includes(b)) $("editPerson").value=b;
}
function renderCards(){
  if (!db.cards.some(c=>c.id===currentCard)) currentCard = db.cards[0] ? db.cards[0].id : null;
  $("cardGrid").innerHTML = db.cards.map(c=>`<button type="button" class="card-choice ${c.id===currentCard?"active":""}" data-card="${esc(c.id)}">${esc(c.name)}<small>${esc(c.owner||"")}</small></button>`).join("");
  document.querySelectorAll("[data-card]").forEach(b=>b.onclick=()=>{currentCard=b.dataset.card;renderCards();render();});
}
function renderManage(){
  $("cardList").innerHTML = db.cards.map(c=>`<div class="manage-row"><span>${esc(c.name)}<small>${esc(c.owner||"")}</small></span><button type="button" title="Remover" data-rmcard="${esc(c.id)}">×</button></div>`).join("");
  $("personList").innerHTML = db.people.map(p=>`<div class="manage-row"><span>${esc(p)}</span><button type="button" title="Remover" data-rmperson="${esc(p)}">×</button></div>`).join("");
  document.querySelectorAll("[data-rmcard]").forEach(b=>b.onclick=()=>removeCard(b.dataset.rmcard));
  document.querySelectorAll("[data-rmperson]").forEach(b=>b.onclick=()=>removePerson(b.dataset.rmperson));
}
function render(){
  const m = month();
  const card = db.cards.find(c=>c.id===currentCard);
  const monthEntries = db.entries.filter(e=>e.month===m);
  const entries = monthEntries.filter(e=>e.card_id===currentCard).sort((a,b)=>a.created_at-b.created_at);
  $("selectedCardTitle").textContent = card ? card.name : "Resumo do cartão";
  $("cardTotal").textContent = money(entries.reduce((s,e)=>s+e.amount_cents,0));
  $("personTotals").innerHTML = db.people.map(p=>`<div class="person-row"><span>${esc(p)}</span><strong>${money(entries.filter(e=>e.person===p).reduce((s,e)=>s+e.amount_cents,0))}</strong></div>`).join("");
  $("entryCount").textContent = `${entries.length} ${entries.length===1?"item":"itens"}`;
  $("entriesList").innerHTML = entries.length ? entries.map(e=>`
    <div class="entry-item">
      <div class="entry-main"><strong>${esc(e.person)}</strong><small>${esc(e.description||"Sem descrição")} · ${new Date(e.created_at).toLocaleDateString("pt-BR")}</small></div>
      <span class="entry-value">${money(e.amount_cents)}</span>
      <button class="icon-btn" title="Editar" data-edit="${esc(e.id)}">✎</button>
      <button class="icon-btn delete" title="Excluir" data-delete="${esc(e.id)}">×</button>
    </div>`).join("") : '<p class="empty">Nenhum lançamento neste cartão.</p>';
  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>del(b.dataset.delete));
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>openEdit(b.dataset.edit));
  const totals = Object.fromEntries(db.cards.map(c=>[c.id,0]));
  monthEntries.forEach(e=>{ if(e.card_id in totals) totals[e.card_id]+=e.amount_cents; });
  $("allCardsSummary").innerHTML = db.cards.map(c=>`<div class="summary-row"><span>${esc(c.name)}</span><strong>${money(totals[c.id])}</strong></div>`).join("");
  $("grandTotal").textContent = money(Object.values(totals).reduce((a,b)=>a+b,0));
  $("undoBtn").classList.toggle("hidden", !localStorage.getItem(KEY_UNDO));
  updateNewLabel();
}
function refreshAll(){ fillPeople(); renderCards(); renderManage(); render(); }

function add(ev){
  ev.preventDefault();
  if(!currentCard){ $("entryError").textContent="Cadastre um cartão primeiro."; return; }
  const amount = parseMoney($("amount").value);
  if(!amount){ $("entryError").textContent="Digite um valor válido maior que zero."; return; }
  $("entryError").textContent="";
  db.entries.push({id:uid(),month:month(),card_id:currentCard,person:$("person").value,amount_cents:amount,description:$("description").value.trim(),created_at:Date.now()});
  save(); $("amount").value=""; $("description").value=""; render();
}
function del(id){
  const e = db.entries.find(x=>x.id===id); if(!e) return;
  if(!confirm(`Excluir ${money(e.amount_cents)} de ${e.person}?`)) return;
  db.entries = db.entries.filter(x=>x.id!==id); save(); render();
}
function openEdit(id){
  const e = db.entries.find(x=>x.id===id); if(!e) return;
  $("editId").value=e.id; $("editPerson").value=e.person;
  $("editAmount").value=(e.amount_cents/100).toFixed(2).replace(".",",");
  $("editDescription").value=e.description||"";
  $("editDialog").showModal();
}
function saveEdit(ev){
  ev.preventDefault();
  const amount = parseMoney($("editAmount").value);
  if(!amount){ alert("Digite um valor válido."); return; }
  const e = db.entries.find(x=>x.id===$("editId").value); if(!e) return;
  e.person=$("editPerson").value; e.amount_cents=amount; e.description=$("editDescription").value.trim();
  save(); $("editDialog").close(); render();
}

/* Novo: zera só os lançamentos do mês + cartão + pessoa selecionados */
function monthLabel(m){ const [y,mo]=m.split("-"); return mo+"/"+y; }
function newTarget(){
  const m=month(), person=$("person").value, card=db.cards.find(c=>c.id===currentCard);
  return {m, person, card, list: card ? db.entries.filter(e=>e.month===m && e.card_id===card.id && e.person===person) : []};
}
function updateNewLabel(){
  const t=newTarget();
  $("newBtn").textContent = t.card ? `Novo: zerar ${t.person} em ${t.card.name}` : "Novo (zerar)";
}
function newAll(){
  const t=newTarget();
  if(!t.card){ alert("Escolha um cartão."); return; }
  if(!t.list.length){ alert(`Não há lançamentos de ${t.person} em ${t.card.name} (${monthLabel(t.m)}).`); return; }
  if(!confirm(`Zerar os ${t.list.length} lançamentos de ${t.person} no cartão ${t.card.name} em ${monthLabel(t.m)}?\n\nOutros nomes, cartões e meses não mudam. Você poderá desfazer logo em seguida.`)) return;
  localStorage.setItem(KEY_UNDO, JSON.stringify(t.list));
  const ids=new Set(t.list.map(e=>e.id));
  db.entries = db.entries.filter(e=>!ids.has(e.id)); save(); render();
}
function undoNew(){
  try {
    const old = JSON.parse(localStorage.getItem(KEY_UNDO)||"null");
    if(!validEntries(old)) throw 0;
    
    db.entries = old.concat(db.entries); localStorage.removeItem(KEY_UNDO); save(); render();
  } catch(e){ alert("Não há nada para desfazer."); localStorage.removeItem(KEY_UNDO); render(); }
}

/* Cadastros */
function manageMsg(t){ $("manageMsg").textContent=t||""; }
function addCard(ev){
  ev.preventDefault();
  const name=$("newCardName").value.trim(), owner=$("newCardOwner").value.trim();
  if(!name){ manageMsg("Digite o nome do cartão."); return; }
  if(db.cards.some(c=>c.name.toLowerCase()===name.toLowerCase() && (c.owner||"").toLowerCase()===owner.toLowerCase())){ manageMsg("Esse cartão já existe."); return; }
  const c={id:"c_"+uid(),name,owner}; db.cards.push(c); currentCard=c.id; save();
  $("newCardName").value=""; $("newCardOwner").value=""; manageMsg(""); refreshAll();
}
function addPerson(ev){
  ev.preventDefault();
  const name=$("newPersonName").value.trim();
  if(!name){ manageMsg("Digite o nome da pessoa."); return; }
  if(db.people.some(p=>p.toLowerCase()===name.toLowerCase())){ manageMsg("Essa pessoa já existe."); return; }
  db.people.push(name); save(); $("newPersonName").value=""; manageMsg(""); refreshAll();
  $("person").value=name;
}
function removeCard(id){
  const c=db.cards.find(x=>x.id===id); if(!c) return;
  if(db.entries.some(e=>e.card_id===id)){ manageMsg(`"${c.name}" tem lançamentos. Exclua os lançamentos (ou use Novo) antes de remover o cartão.`); return; }
  if(!confirm(`Remover o cartão ${c.name}?`)) return;
  db.cards=db.cards.filter(x=>x.id!==id); save(); manageMsg(""); refreshAll();
}
function removePerson(name){
  if(db.entries.some(e=>e.person===name)){ manageMsg(`${name} tem lançamentos. Exclua os lançamentos (ou use Novo) antes de remover.`); return; }
  if(db.people.length<=1){ manageMsg("É preciso manter pelo menos uma pessoa."); return; }
  if(!confirm(`Remover ${name}?`)) return;
  db.people=db.people.filter(p=>p!==name); save(); manageMsg(""); refreshAll();
}

/* Backup */
async function copyBackup(){
  const text = JSON.stringify(db);
  $("backupText").value = text;
  try { await navigator.clipboard.writeText(text); $("backupMsg").textContent="Backup copiado. Cole em um lugar seguro (ex.: WhatsApp, notas)."; }
  catch(e){ $("backupText").select(); $("backupMsg").textContent="Selecione o texto acima e copie manualmente."; }
}
function restoreBackup(){
  try {
    let d = JSON.parse($("backupText").value);
    if (Array.isArray(d)) d = {cards:DEFAULT_CARDS.slice(), people:DEFAULT_PEOPLE.slice(), entries:d}; // backup antigo
    if(!d || !Array.isArray(d.cards) || !Array.isArray(d.people) || !validEntries(d.entries)) throw 0;
    if(!confirm("Isso substitui os dados atuais deste celular. Continuar?")) return;
    db = d; save(); refreshAll(); $("backupMsg").textContent="Backup restaurado.";
  } catch(e){ $("backupMsg").textContent="Backup inválido. Cole o texto completo."; }
}

$("month").value = nowMonth();
$("month").addEventListener("change",render);
$("entryForm").addEventListener("submit",add);
$("editForm").addEventListener("submit",saveEdit);
$("cancelEdit").onclick=()=>$("editDialog").close();
$("newBtn").onclick=newAll;
$("person").addEventListener("change",updateNewLabel);
$("undoBtn").onclick=undoNew;
$("cardForm").addEventListener("submit",addCard);
$("personForm").addEventListener("submit",addPerson);
$("copyBackup").onclick=copyBackup;
$("restoreBackup").onclick=restoreBackup;
refreshAll();
