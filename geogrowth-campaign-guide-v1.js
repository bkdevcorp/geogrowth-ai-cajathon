/* GeoGrowth V9: campaña de investigación territorial explicable.
   Activa solo en ?modo=ampliado. No modifica el motor M0/M1/M2 ni Campo. */
(function(){
"use strict";
if(new URLSearchParams(window.location.search).get("modo")!=="ampliado")return;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>n==null?"N/D":Number(n).toLocaleString("es-PE");
const dec=n=>Number(n||0).toLocaleString("es-PE",{minimumFractionDigits:1,maximumFractionDigits:1});
const name=r=>(r.nombre_distrito||"UBIGEO "+r.ubigeo)+" · "+r.ubigeo;
let activeMethod=null;
const css=document.createElement("style");
css.textContent=".gc-wrap{background:white;padding:21px;border:1px solid #dce7f2;border-radius:16px;margin-bottom:15px}.gc-intro{padding:20px;border-radius:12px;background:linear-gradient(110deg,#123459,#1d5579);color:white}.gc-intro h3{font-size:20px!important;color:white!important;margin:0 0 8px!important}.gc-intro p{font-size:12px;color:#d5e5f4;line-height:1.7}.gc-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:13px 0}.gc-kpi{padding:13px;border-radius:10px;background:#f5f9fc;border:1px solid #dce7f1}.gc-kpi b{color:#1b416a;font-size:20px;display:block}.gc-kpi small{font-size:10px;color:#59728c}.gc-explain{padding:14px;margin:13px 0;background:#edf5fc;border-left:3px solid #2e73a0;border-radius:5px;color:#244c70;font-size:12px;line-height:1.7}.gc-table{width:100%;border-collapse:collapse}.gc-table th,.gc-table td{border-bottom:1px solid #e2eaf2;padding:12px 9px;text-align:left;font-size:11px;vertical-align:top}.gc-table th{background:#f4f8fd;color:#426380}.gc-table b{color:#18446f}.gc-desc{display:block;margin-top:5px;color:#58758e;line-height:1.55}.gc-btn{border:1px solid #bdcee2;color:#26578e;background:white;cursor:pointer;border-radius:8px;padding:9px 11px;font-size:11px;font-weight:750}.gc-btn.primary{background:#245fbf;color:white;border-color:#245fbf}.gc-section{padding:19px 0;border-bottom:1px solid #e2eaf3}.gc-section h3{color:#173e66;font-size:16px;margin:0 0 9px}.gc-section p,.gc-section li{font-size:12px;color:#567087;line-height:1.75;margin:6px 0}.gc-current{background:#f7fbff;border:1px solid #dce8f4;border-radius:11px;padding:14px;margin:12px 0}.gc-current h4{font-size:13px;color:#1b436a;margin:0 0 6px}.gc-tags{display:flex;gap:6px;flex-wrap:wrap;margin:11px 0}.gc-tag{font-size:11px;color:#29587d;background:#eff6fb;padding:7px 9px;border-radius:8px;border:1px solid #d7e5f1}.gc-tablewrap{max-width:100%;overflow:auto}.gc-tablewrap .gc-table{min-width:570px}.gc-budget{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:14px 0}.gc-budget label{font-size:12px;font-weight:750;color:#365b7a}.gc-budget input{width:140px;min-width:120px}.gc-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:15px}.gc-actions button{font-size:12px;border-radius:9px;padding:10px 13px;cursor:pointer;background:#245fc0;border:1px solid #245fc0;color:white;font-weight:750}.gc-actions button.secondary{background:white;color:#285992;border-color:#c9d9ea}.gc-actions button:disabled{opacity:.45;cursor:not-allowed}.gc-small{font-size:11px!important;color:#637a91!important}.gc-detail summary{cursor:pointer;color:#285c93;font-size:11px;font-weight:750;padding:10px 0}.gc-detail{margin:5px 0}.gc-section ol{padding-left:22px}@media(max-width:800px){.gc-kpis{grid-template-columns:1fr}.gc-tablewrap{overflow:auto}.gc-wrap{padding:13px}}";
document.head.appendChild(css);
function models(territory,budget){
 const old=state.dep;let region;
 try{state.dep=territory.departamento;region=getScored();}
 finally{state.dep=old;}
 // La provincia y el tipo de oportunidad delimitan los candidatos sin alterar el motor M0/M1/M2.
 region=window.GeoGrowthTerritoryFilters?.scopeRows(territory,region)||region;
 const methods=[
  {id:"M0",title:"Volumen histórico",desc:"Comenzar por los distritos con más microempresas registradas en PRODUCE 2015.",rows:greedy([...region].sort((a,b)=>(b.micro_2015||0)-(a.micro_2015||0)),budget)},
  {id:"M1",title:"Prioridad IIT",desc:"Recorrer distritos del IIT más alto al más bajo e incluirlos mientras alcance el presupuesto simulado.",rows:greedy(region,budget)},
  {id:"M2",title:"Combinación bajo presupuesto",desc:"Entre los 30 primeros del IIT, combinar distritos completos para maximizar la suma de puntuaciones sin superar el presupuesto. Regla binaria 0/1.",rows:simulatePlan(region,budget)}
 ];
 return methods.map(m=>({...m,count:m.rows.length,cost:m.rows.reduce((a,x)=>a+x.cost,0),
   sum:m.rows.reduce((a,x)=>a+x.score,0)}));
}
function campaignHtml(info){
 const {r,budget,methods,selected}=info;
 const selectedCost=selected.reduce((sum,x)=>sum+x.cost,0);
 const selectedScore=selected.reduce((sum,x)=>sum+x.score,0);
 const m1=methods[1],m2=methods[2];
 const explanation="Con S/ "+fmt(budget)+" hipotéticos, M1 incluye "+m1.count+" distritos (suma IIT "+dec(m1.sum)+
 "), mientras M2 incluye "+m2.count+" (suma IIT "+dec(m2.sum)+")."+
 " Esta comparación solo evalúa un puntaje técnico agregado: no son clientes, dinero recuperado ni una conversión estimada.";
 const rowNames=m=>m.rows.map(x=>name(x)).join(", ");
 const rows=methods.map(m=>
   '<tr><td><b>'+m.id+' · '+esc(m.title)+'</b><span class="gc-desc">'+esc(m.desc)+'</span>'+
   '<details class="gc-detail"><summary>Ver los '+m.count+' distritos propuestos</summary><div class="gc-tags">'+m.rows.map(x=>
     '<span class="gc-tag">'+esc(name(x))+' · IIT '+dec(x.score)+'</span>').join("")+'</div></details></td>'+
   '<td>'+m.count+'</td><td>S/ '+fmt(m.cost)+'</td><td>'+dec(m.sum)+'</td>'+
   '<td><button class="gc-btn" type="button" data-go-model="'+m.id+'">Elegir '+m.id+'</button></td></tr>'
 ).join("");
 const taken=selected.length
  ?'<div class="gc-tablewrap"><table class="gc-table"><thead><tr><th>Distrito seleccionado</th><th>IIT</th><th>Costo supuesto</th><th>Microempresas históricas</th></tr></thead><tbody>'+
   selected.map(x=>'<tr><td><b>'+esc(name(x))+'</b></td><td>'+dec(x.score)+'</td><td>S/ '+fmt(x.cost)+'</td><td>'+fmt(x.micro_2015)+'</td></tr>').join("")+
   '</tbody></table></div>'
  :'<p>La selección está vacía. Elige M0, M1 o M2 para crear una propuesta.</p>';
 return '<article class="gc-wrap" id="gg-campaign-guide">'+
 '<header class="gc-intro"><h3>Diseña una campaña de validación comercial, no una campaña de créditos preaprobados</h3>'+
 '<p>Una campaña aquí significa seleccionar distritos, asignar asesores, visitar establecimientos vigentes y registrar señales reales de interés. GeoGrowth no envía mensajes ni aprueba operaciones automáticamente.</p></header>'+
 '<section class="gc-section"><h3>1. Define el recurso disponible para un ejercicio</h3>'+
 '<div class="gc-budget"><label for="go-budget">Presupuesto simulado (S/)</label><input id="go-budget" type="number" min="500" max="25000" step="100" value="'+budget+'">'+
 '<span class="gc-small">Cambiarlo recalcula M0, M1 y M2. No son costos operativos validados de la Caja.</span></div>'+
 '<div class="gc-kpis"><div class="gc-kpi"><b>S/ '+fmt(budget)+'</b><small>Techo de costo supuesto</small></div>'+
 '<div class="gc-kpi"><b>3 métodos</b><small>Criterios de selección</small></div>'+
 '<div class="gc-kpi"><b>'+esc(r.departamento)+'</b><small>Departamento comparado</small></div></div>'+
 '<p class="gc-small">Para esta simulación el costo por distrito se fija artificialmente en S/ 450, 600, 750 o 900 según su UBIGEO. No procede de rutas, asesores, transporte ni tarifas reales.</p></section>'+
 '<section class="gc-section"><h3>2. Compara tres estrategias de selección</h3>'+
 '<div class="gc-tablewrap"><table class="gc-table"><thead><tr><th>Método y criterio</th><th>Distritos</th><th>Costo supuesto</th><th>Suma IIT</th><th>Seleccionar</th></tr></thead><tbody>'+
 rows+'</tbody></table></div>'+
 '<div class="gc-explain"><b>¿Qué significa M2 (optimización 0/1)?</b> Cada distrito es una decisión binaria: se incluye (1) o no (0). Se ensayan combinaciones entre los 30 distritos de mayor IIT para lograr la suma IIT más alta dentro del presupuesto simulado. No optimiza conversiones, ingresos o cercanía geográfica.</div>'+
 '<p>'+esc(explanation)+'</p></section>'+
 '<section class="gc-section"><h3>3. Revisa la propuesta que llevarás a campo</h3>'+
 '<div class="gc-current"><h4>Selección actual: '+((window.GeoGrowthTerritoryFilters?.selectedMethod||activeMethod)?"Método "+esc(window.GeoGrowthTerritoryFilters?.selectedMethod||activeMethod):"Selección inicial o manual")+'</h4>'+
 '<div class="gc-kpis"><div class="gc-kpi"><b>'+selected.length+'</b><small>Distritos en el plan</small></div>'+
 '<div class="gc-kpi"><b>S/ '+fmt(selectedCost)+'</b><small>Costo simulado total</small></div>'+
 '<div class="gc-kpi"><b>'+dec(selectedScore)+'</b><small>Suma IIT (no conversiones)</small></div></div>'+
 (selectedCost>budget?'<p class="gc-small"><b>Advertencia:</b> esta selección supera el presupuesto; vuelve a elegir un método.</p>':
 '<p class="gc-small">Saldo simulado: S/ '+fmt(budget-selectedCost)+'. El presupuesto no se reserva ni se gasta realmente.</p>')+
 taken+'</div></section>'+
 '<section class="gc-section"><h3>4. ¿Qué ejecutaría el equipo comercial?</h3><ol>'+
 '<li>Elegir M0, M1 o M2 y aprobar la lista de distritos para una validación exploratoria.</li>'+
 '<li>Exportar el JSON de campaña; contiene UBIGEO, IIT y evidencias, no personas ni clientes prospectados.</li>'+
 '<li>Importarlo en GeoGrowth Campo, asignar el recorrido y verificar establecimientos activos antes de acercarse.</li>'+
 '<li>Registrar visitas, necesidades expresadas, interés y siguientes acciones; devolver el JSON de resultados para evaluar el piloto.</li>'+
 '</ol><div class="gc-actions"><button type="button" data-go-campaign-export="1"'+(selected.length&&selectedCost<=budget?'':' disabled')+'>Descargar campaña para asesores (JSON)</button>'+
 '<button class="secondary" type="button" data-go-section="execution">Ir a ejecución y resultados</button></div>'+
 '<p class="gc-small">La puntuación IIT acumulada es un indicador del ejercicio matemático, no una métrica de ventas. Solo el registro de campo permitiría empezar a medir respuesta real.</p></section></article>';
}
const original=render;
render=function(){
 original();
 if(state.view!=="plan")return;
 const content=document.getElementById("content"),existing=content?.querySelector(".go-block");
 if(!existing)return;
 const r=DATA.find(x=>String(x.ubigeo)===String(state.selected));if(!r)return;
 const budget=Math.max(500,Math.min(25000,Number(document.getElementById("go-budget")?.value||state.budget||2400)));
 const methods=models(r,budget);
 const region=methods[1].rows; // We compute a fresh score set independent of selected model.
 const prev=state.dep;let scored;
 try{state.dep=r.departamento;scored=getScored();}finally{state.dep=prev;}
 const selected=state.plan.map(u=>scored.find(x=>String(x.ubigeo)===String(u))).filter(Boolean);
 existing.outerHTML=campaignHtml({r,budget,methods,selected});
};
document.addEventListener("click",event=>{
 const t=event.target.closest("#gg-campaign-guide [data-go-model]");
 if(t)activeMethod=t.dataset.goModel;
},true);
document.addEventListener("change",event=>{
 if(event.target.id==="go-budget")activeMethod=null;
},true);
window.GeoGrowthCampaignGuide={models};
render();
})();