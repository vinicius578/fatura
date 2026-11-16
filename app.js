const CARDS = [
  {id:"dm_beatriz", name:"DM Card", owner:"Beatriz"},
  {id:"bb", name:"Banco do Brasil", owner:"Cartão da família"},
  {id:"nubank_vanvan", name:"Nubank", owner:"Vanvan"},
  {id:"bmg_vanvan", name:"BMG", owner:"Vanvan"}
];
const PEOPLE = ["Beatriz","Bianca","Vanvan","Giovana","Vinícius"];
const KEY = "controle-familiar-faturas-v1";
const $ = id => document.getElementById(id);
const money = c => (c/100).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function parseMoney(v){
  let s = v.trim().replace(/R\$/gi,"").replace(/\s/g,"");
  if (s.includes(",")) s = s.replace(/\./g,"").replace(",",".");
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n*100) : null;
}
function load(){ try { const d = JSON.parse(localStorage.getItem(KEY)||"[]"); return Array.isArray(d)?d:[]; } catch(e){ return []; } }
function save(){ localStorage.setItem(KEY, JSON.stringify(all)); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }
function nowMonth(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"); }

let all = load(), currentCard = CARDS[0].id;
const month = () => $("month").value || nowMonth();

function renderCards(){
  $("cardGrid").innerHTML = CARDS.map(c=>`<button type="button" class="card-choice ${c.id===currentCard?"active":""}" data-card="${c.id}">${c.name}<small>${c.owner}</small></button>`).join("");
  document.querySelectorAll("[data-card]").forEach(b=>b.onclick=()=>{currentCard=b.dataset.card;renderCards();render();});
}
function render(){
  const m = month();
  const monthEntries = all.filter(e=>e.month===m);
  const entries = monthEntries.filter(e=>e.card_id===currentCard).sort((a,b)=>a.created_at-b.created_at);
  $("selectedCardTitle").textContent = CARDS.find(c=>c.id===currentCard).name;
  $("cardTotal").textContent = money(entries.reduce((s,e)=>s+e.amount_cents,0));
  $("personTotals").innerHTML = PEOPLE.map(p=>`<div class="person-row"><span>${p}</span><strong>${money(entries.filter(e=>e.person===p).reduce((s,e)=>s+e.amount_cents,0))}</strong></div>`).join("");
  $("entryCount").textContent = `${entries.length} ${entries.length===1?"item":"itens"}`;
  $("entriesList").innerHTML = entries.length ? entries.map(e=>`
    <div class="entry-item">
      <div class="entry-main"><strong>${esc(e.person)}</strong><small>${esc(e.description||"Sem descrição")} · ${new Date(e.created_at).toLocaleDateString("pt-BR")}</small></div>
      <span class="entry-value">${money(e.amount_cents)}</span>
      <button class="icon-btn" title="Editar" data-edit="${e.id}">✎</button>
      <button class="icon-btn delete" title="Excluir" data-delete="${e.id}">×</button>
    </div>`).join("") : '<p class="empty">Nenhum lançamento neste cartão.</p>';
  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>del(b.dataset.delete));
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>openEdit(b.dataset.edit));
  const totals = Object.fromEntries(CARDS.map(c=>[c.id,0]));
  monthEntries.forEach(e=>{ if(e.card_id in totals) totals[e.card_id]+=e.amount_cents; });
  $("allCardsSummary").innerHTML = CARDS.map(c=>`<div class="summary-row"><span>${c.name}</span><strong>${money(totals[c.id])}</strong></div>`).join("");
  $("grandTotal").textContent = money(Object.values(totals).reduce((a,b)=>a+b,0));
}
function add(ev){
  ev.preventDefault();
  const amount = parseMoney($("amount").value);
  if(!amount){ $("entryError").textContent="Digite um valor válido maior que zero."; return; }
  $("entryError").textContent="";
  all.push({id:uid(),month:month(),card_id:currentCard,person:$("person").value,amount_cents:amount,description:$("description").value.trim(),created_at:Date.now()});
  save(); $("amount").value=""; $("description").value=""; render();
}
function del(id){
  const e = all.find(x=>x.id===id); if(!e) return;
  if(!confirm(`Excluir ${money(e.amount_cents)} de ${e.person}?`)) return;
  all = all.filter(x=>x.id!==id); save(); render();
}
function openEdit(id){
  const e = all.find(x=>x.id===id); if(!e) return;
  $("editId").value=e.id; $("editPerson").value=e.person;
  $("editAmount").value=(e.amount_cents/100).toFixed(2).replace(".",",");
  $("editDescription").value=e.description||"";
  $("editDialog").showModal();
}
function saveEdit(ev){
  ev.preventDefault();
  const amount = parseMoney($("editAmount").value);
  if(!amount){ alert("Digite um valor válido."); return; }
  const e = all.find(x=>x.id===$("editId").value); if(!e) return;
  e.person=$("editPerson").value; e.amount_cents=amount; e.description=$("editDescription").value.trim();
  save(); $("editDialog").close(); render();
}
async function copyBackup(){
  const text = JSON.stringify(all);
  $("backupText").value = text;
  try { await navigator.clipboard.writeText(text); $("backupMsg").textContent="Backup copiado. Cole em um lugar seguro (ex.: WhatsApp, notas)."; }
  catch(e){ $("backupText").select(); $("backupMsg").textContent="Selecione o texto acima e copie manualmente."; }
}
function restoreBackup(){
  try {
    const d = JSON.parse($("backupText").value);
    if(!Array.isArray(d) || !d.every(e=>e && e.id && e.month && e.card_id && e.person && Number.isInteger(e.amount_cents))) throw 0;
    if(!confirm("Isso substitui os lançamentos atuais deste celular. Continuar?")) return;
    all = d; save(); render(); $("backupMsg").textContent="Backup restaurado.";
  } catch(e){ $("backupMsg").textContent="Backup inválido. Cole o texto completo."; }
}
const opts = PEOPLE.map(p=>`<option>${p}</option>`).join("");
$("person").innerHTML = opts; $("editPerson").innerHTML = opts;
$("month").value = nowMonth();
$("month").addEventListener("change",render);
$("entryForm").addEventListener("submit",add);
$("editForm").addEventListener("submit",saveEdit);
$("cancelEdit").onclick=()=>$("editDialog").close();
$("copyBackup").onclick=copyBackup;
$("restoreBackup").onclick=restoreBackup;
renderCards(); render();
