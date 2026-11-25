/* GeoGrowth V9: filtros territoriales y lentes de oportunidad.
 * Integracion aislada (solo modo ampliado). No altera mapa V5 ni calculo IIT.
 * Provincias por prefijo UBIGEO 4 digitos; fuentes externas = catalogo, no datos ingeridos.
 */
(function(){
"use strict";
if(new URLSearchParams(window.location.search).get("modo")!=="ampliado")return;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=v=>v==null?"N/D":Number(v).toLocaleString("es-PE");
const dec=v=>v==null?"N/D":Number(v).toLocaleString("es-PE",{minimumFractionDigits:1,maximumFractionDigits:1});
const TYPES=[
 ["todas","Todas las oportunidades"],
 ["nuevos","Nuevos negocios · licencias por verificar"],
 ["expansion","Expansión comercial · señal histórica"],
 ["desatendidos","Mercados por investigar · canales SBS"],
 ["estacionales","Campañas estacionales · sin series disponibles"]
];
let provinces={},catalog=[],ready=false,observer=null;
const focus={province:"all",type:"todas",department:null};
const markerColor={todas:"Análisis territorial general",nuevos:"Verificar expedientes de licencias",expansion:"Explorar empresas históricas",desatendidos:"Evaluar accesibilidad financiera",estacionales:"Investigar estacionalidad sin datos suficientes"};
const sortText=(a,b)=>String(a).localeCompare(String(b),"es");
const key=r=>String(r?.ubigeo||"").slice(0,4);
const provinceName=k=>provinces[k]||("Provincia UBIGEO "+k);
const refOf=u=>catalog.find(x=>String(x.ubigeo)===String(u))||null;
const provs=department=>[...new Set(DATA.filter(x=>x.departamento===department).map(key))].sort((a,b)=>sortText(provinceName(a),provinceName(b)));
const lensEligible=r=>{
 if(focus.type==="estacionales")return false; // Ningun dataset demuestra estacionalidad.
 if(focus.type==="nuevos")return (r.licencias_municipales_ref!=null&&Number(r.licencias_municipales_ref)>0)||refOf(r.ubigeo)?.estado==="FUENTE_EXTERNA_NO_INTEGRADA";
 if(focus.type==="expansion")return r.ambas_fuentes===true&&Number(r.micro_2015||0)>0;
 if(focus.type==="desatendidos")return r.ambas_fuentes===true&&Number(r.micro_2015||0)>0;
 return true;
};
function scopeRows(territory,scored){
 const province=focus.province;
 const out=scored.filter(x=>(province==="all"||key(x)===province)&&lensEligible(x));
 if(focus.type==="expansion")return out.sort((a,b)=>(b.micro_2015||0)-(a.micro_2015||0));
 if(focus.type==="desatendidos")return out.sort((a,b)=>{
   const va=(Number(a.micro_2015||0)+1)/(Number(a.sbs_oficinas_2025||0)+1);
   const vb=(Number(b.micro_2015||0)+1)/(Number(b.sbs_oficinas_2025||0)+1);
   return vb-va;
 });
 return out;
}
function scoredDepartment(department){
 const old=state.dep;
 try{state.dep=department;return getScored();}
 finally{state.dep=old;}
}
function candidates(department){
 const all=DATA.filter(x=>x.departamento===department&&(focus.province==="all"||key(x)===focus.province)&&lensEligible(x));
 const ranking=new Map(scoredDepartment(department).map(r=>[r.ubigeo,r]));
 const out=all.map(r=>ranking.get(r.ubigeo)||({...r,score:null,cost:null}));
 if(focus.type==="expansion")out.sort((a,b)=>(b.micro_2015||0)-(a.micro_2015||0));
 else if(focus.type==="desatendidos")out.sort((a,b)=>{
  const av=(Number(a.micro_2015||0)+1)/(Number(a.sbs_oficinas_2025||0)+1);
  const bv=(Number(b.micro_2015||0)+1)/(Number(b.sbs_oficinas_2025||0)+1);
  return bv-av;
 });
 else out.sort((a,b)=>(b.score??-1)-(a.score??-1));
 return out;
}
function description(r){
 const external=refOf(r?.ubigeo);
 const province=key(r||{ubigeo:""});
 return {
  departamento:r?.departamento||focus.department,
  provincia_codigo:province||null,
  provincia:province?provinceName(province):null,
  distrito_ubigeo:r?.ubigeo||null,
  provincia_filtro:focus.province==="all"?"Todas":provinceName(focus.province),
  tipo_oportunidad:focus.type,
  tipo_descripcion:TYPES.find(x=>x[0]===focus.type)?.[1]||"Todas",
  naturaleza:"Lente de investigación, no resultado de detección de clientes o demanda",
  fuente_municipal_externa:external?{url:external.referencia,estado:external.estado,periodo_referido:external.periodo_indicado}:null,
  limita_estacionalidad:focus.type==="estacionales"
    ?"No existe una serie de actividad estacional que permita clasificar territorios. No se presentan oportunidades priorizadas.":null
 };
}
const style=document.createElement("style");
style.textContent=".gg-filter-ext{margin-top:11px}.go-options.gg-filter-options{grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}.go-options.gg-filter-options>div{min-width:0}.gg-filter-box{background:#fff;border:1px solid #dae6f2;border-radius:13px;margin:0 0 14px;padding:16px}.gg-filter-header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.gg-filter-header h4{font-size:13px;color:#18436c;margin:0}.gg-filter-header p{font-size:11px;color:#59718a;margin:4px 0}.gg-filter-tags{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.gg-filter-tags span{background:#eff7fc;color:#29587b;border-radius:8px;padding:7px 9px;font-size:10px;border:1px solid #d3e5f0}.gg-filter-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:10px}.gg-filter-item{border:1px solid #dce7f0;border-radius:10px;padding:11px;background:#fbfdff;display:flex;justify-content:space-between;gap:12px;align-items:center}.gg-filter-item b{font-size:12px;color:#1d476d}.gg-filter-item small{display:block;font-size:10px;color:#698097;line-height:1.6;margin-top:4px}.gg-filter-item button{border:1px solid #bed4e9;background:#fff;color:#285b92;border-radius:8px;padding:8px 10px;cursor:pointer;font-size:11px;font-weight:750;white-space:nowrap}.gg-filter-empty{font-size:12px;color:#6d5a34;background:#fff7e8;border:1px solid #eddbb6;border-radius:9px;padding:13px;line-height:1.7;margin:11px 0}.gg-filter-sources{border-top:1px solid #e1eaf2;margin-top:12px;padding-top:11px}.gg-filter-sources p{font-size:11px;line-height:1.7;color:#576f87}.gg-filter-sources a{color:#235aa1}.gg-filter-scope{border:1px solid #dce7f0;background:#f5faff;color:#3d6583;border-radius:9px;font-size:11px;padding:10px 13px;margin:0 0 15px;line-height:1.65}.gg-filter-scope button{border:0;background:transparent;color:#245db2;font-weight:750;cursor:pointer;margin-left:7px}.gg-filter-insight{background:#eef6fc;border:1px solid #d2e5f2;border-radius:10px;padding:13px 16px;margin:11px 0;font-size:12px;color:#375976;line-height:1.8}.gg-filter-insight strong{color:#1a4368}.gg-filter-subtitle{font-size:11px;color:#6b8095;margin:9px 0}.gg-filter-note{font-size:11px;color:#637b90;line-height:1.6;margin:10px 0}@media(max-width:1100px){.go-options.gg-filter-options{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:760px){.gg-filter-list{grid-template-columns:1fr}}@media(max-width:460px){.go-options.gg-filter-options{grid-template-columns:1fr}}";
document.head.appendChild(style);
function sources(department,province){
 return catalog.filter(x=>x.departamento===department&&(province==="all"||String(x.ubigeo).slice(0,4)===province));
}
function labelFor(r){
 const ref=refOf(r.ubigeo);
 const origin=r.licencias_municipales_ref!=null?" · licencia agregada integrada":
   ref?" · fuente municipal externa por incorporar":"";
 return (r.nombre_distrito||"UBIGEO "+r.ubigeo)+" · "+r.ubigeo+origin;
}
function sourceLabel(r){
 if(r.licencias_municipales_ref!=null)return "Licencias integradas: "+fmt(r.licencias_municipales_ref)+" registros agregados";
 const ref=refOf(r.ubigeo);
 return ref?"Fuente externa localizada; sin registros incorporados":"Sin cobertura municipal en el Data Pack";
}
function filterSummary(department){
 const pool=candidates(department),withIit=pool.filter(x=>x.score!=null).length;
 const foundSources=sources(department,focus.province);
 const verifiedLinks=foundSources.filter(x=>x.estado==="FUENTE_EXTERNA_NO_INTEGRADA").length;
 return '<section class="gg-filter-box" id="gg-filter-results">'+
 '<div class="gg-filter-header"><div><h4>Territorios que cumplen los filtros de investigación</h4>'+
 '<p>Esta búsqueda utiliza el Data Pack territorial, no un padrón de clientes. Selecciona un resultado para generar su IIT y Opportunity Brief.</p></div>'+
 '<span style="font-size:12px;color:#285c8d;font-weight:800">'+pool.length+' distritos</span></div>'+
 '<div class="gg-filter-tags"><span>'+pool.length+' distritos en la selección</span><span>'+withIit+' con IIT comparable</span>'+
 '<span>'+verifiedLinks+' fuentes externas identificadas</span><span>'+esc(TYPES.find(x=>x[0]===focus.type)?.[1])+'</span></div>'+
 (focus.type==="estacionales"?'<div class="gg-filter-empty">No hay series de estacionalidad en el Data Pack. El filtro funciona como necesidad de investigación, pero no puede clasificar campañas estacionales sin inventar evidencia.</div>':
 focus.type==="nuevos"?'<p class="gg-filter-note">«Nuevos negocios» muestra territorios con licencias municipales integradas o una fuente externa identificada. Una fecha de licencia no demuestra creación reciente, operación vigente ni contacto válido.</p>':
 focus.type==="desatendidos"?'<p class="gg-filter-note">«Mercados por investigar» ordena una razón exploratoria entre empresas históricas y oficinas SBS. No identifica población no bancarizada ni demuestra una brecha de acceso.</p>':
 '<p class="gg-filter-note">El filtro de oportunidad indica qué hipótesis revisar; no predice captación, ingresos ni elegibilidad crediticia.</p>')+
 (pool.length?'<div class="gg-filter-list">'+pool.slice(0,8).map(r=>
  '<div class="gg-filter-item"><div><b>'+esc(r.nombre_distrito||"Distrito UBIGEO "+r.ubigeo)+'</b>'+
  '<small>'+esc(provinceName(key(r)))+' · '+esc(r.ubigeo)+' · IIT '+esc(dec(r.score))+'</small>'+
  '<small>'+esc(sourceLabel(r))+'</small></div><button type="button" data-gg-filter-pick="'+esc(r.ubigeo)+'">Analizar</button></div>'
 ).join("")+'</div>':
 '<div class="gg-filter-empty">No hay distritos que cumplan este filtro dentro del ámbito seleccionado. Amplía provincia o cambia el tipo de oportunidad. No se generaron candidatos ficticios.</div>')+
 (foundSources.length?'<div class="gg-filter-sources"><p><b>Fuentes municipales por integrar al ETL</b> (referencias aportadas por CajaRadar AI; no se usan para calcular IIT ni como negocios detectados):</p>'+
  foundSources.slice(0,7).map(x=>'<p><b>'+esc(x.distrito||x.ubigeo)+'</b> · '+esc(x.periodo_indicado)+
   ' · <a href="'+esc(x.referencia)+'" target="_blank" rel="noopener noreferrer">'+(x.estado==='FUENTE_EXTERNA_NO_INTEGRADA'?'Consultar dataset':'Buscar en portal')+'</a> · '+(x.estado==='FUENTE_EXTERNA_NO_INTEGRADA'?'No integrada':'Dataset concreto no identificado')+'</p>').join("")+'</div>':'')+
 '</section>';
}
function enhancePicker(){
 const container=document.querySelector(".go-pick");
 if(!container)return;
 const opts=container.querySelector(".go-options");
 if(!opts)return;
 const dept=document.getElementById("go-dep");if(!dept)return;
 if(focus.department!==dept.value){focus.department=dept.value;focus.province="all";api.selectedMethod=null;}
 const choices=provs(dept.value);
 if(focus.province!=="all"&&!choices.includes(focus.province))focus.province="all";
 opts.classList.add("gg-filter-options");
 const p=document.createElement("div");
 p.innerHTML='<label for="gg-filter-province">Provincia</label><select id="gg-filter-province">'+
 '<option value="all">Todas las provincias</option>'+choices.map(code=>
 '<option value="'+esc(code)+'"'+(focus.province===code?' selected':'')+'>'+esc(provinceName(code))+' · '+code+'</option>').join("")+'</select>';
 const t=document.createElement("div");
 t.innerHTML='<label for="gg-filter-type">Tipo de oportunidad que deseas investigar</label><select id="gg-filter-type">'+
 TYPES.map(([id,name])=>'<option value="'+id+'"'+(focus.type===id?' selected':'')+'>'+esc(name)+'</option>').join("")+'</select>';
 const distr=opts.querySelector("#go-ubigeo")?.parentElement;
 if(distr)opts.insertBefore(p,distr);
 else opts.appendChild(p);
 const budget=opts.querySelector("#go-budget")?.parentElement;
 if(budget)opts.insertBefore(t,budget);
 else opts.appendChild(t);
 const select=opts.querySelector("#go-ubigeo");
 if(select&&focus.province!=="all"){
  Array.from(select.options).filter(x=>x.value&&String(x.value).slice(0,4)!==focus.province).forEach(x=>x.remove());
 }
 const existing=document.getElementById("gg-filter-results");if(existing)existing.remove();
 container.insertAdjacentHTML("afterend",filterSummary(dept.value));
}
function updateMap(){
 const map=document.getElementById("ggv5");
 if(!map)return;
 const apply=()=>{
  const markers=map.querySelectorAll("circle.gg-point[data-ubigeo]");
  markers.forEach(x=>{
   const included=focus.province==="all"||x.dataset.ubigeo?.slice(0,4)===focus.province;
   x.style.opacity=included?"":"0.08";
   x.style.pointerEvents=included?"":"none";
  });
 };
 apply();
 if(observer){observer.disconnect();observer=null;}
 if(typeof MutationObserver!=="undefined"){observer=new MutationObserver(apply);observer.observe(map,{childList:true,subtree:true});}
}
function scopeBadge(){
 const selected=DATA.find(x=>String(x.ubigeo)===String(state.selected));
 const province=focus.province==="all"?"Todas las provincias":provinceName(focus.province);
 const ref=selected?refOf(selected.ubigeo):null;
 return '<div class="gg-filter-scope" id="gg-filter-scope">Ámbito: <b>'+esc(focus.department||selected?.departamento||"Nacional")+'</b> / '+
 esc(province)+' · Lente: <b>'+esc(TYPES.find(x=>x[0]===focus.type)?.[1]||"Todas")+'</b>'+
 (ref?' · <a href="'+esc(ref.referencia)+'" target="_blank" rel="noopener noreferrer">Fuente externa por incorporar</a>':'')+
 '<button type="button" data-gg-edit-filters>Editar filtros</button></div>';
}
function opportunityNote(){
 const r=DATA.find(x=>String(x.ubigeo)===String(state.selected));
 const host=document.getElementById("gg-opportunity-brief");
 if(!r||!host)return;
 const ref=refOf(r.ubigeo);
 const type=focus.type;
 const details={
  todas:"Se muestra el panorama general, sin restringir el análisis a una hipótesis específica.",
  nuevos:r.licencias_municipales_ref!=null
   ?"Existen expedientes municipales integrados en el Data Pack. Antes de usar el término «negocio nuevo» hay que verificar fecha de alta, operación actual, giro y procedencia."
   :ref?"Existe una referencia municipal externa para investigar; todavía no se han importado sus registros a GeoGrowth."
   :"No hay datos municipales suficientes para clasificar nuevos negocios en este distrito.",
  expansion:"Se prioriza la investigación del tejido microempresarial histórico (PRODUCE 2015). Esto no demuestra apertura, expansión ni necesidad financiera actual.",
  desatendidos:"Se examina la distribución relativa de oficinas SBS y actividad empresarial histórica. Sin población adulta, uso real de servicios y cobertura de Caja, no se concluye que un mercado esté desatendido.",
  estacionales:"No hay series mensuales o estacionales verificables en el Data Pack; el informe solo sugiere recopilar datos antes de diseñar una campaña por temporada."
 }[type];
 host.querySelector(".gg-brief-header")?.insertAdjacentHTML("afterend",
 '<div class="gg-filter-insight" id="gg-opportunity-lens"><strong>Enfoque de búsqueda: '+esc(TYPES.find(x=>x[0]===type)?.[1])+'</strong>'+
 '<div>'+esc(details)+'</div></div>');
}
function campaignNote(){
 const r=DATA.find(x=>String(x.ubigeo)===String(state.selected));
 const el=document.getElementById("gg-campaign-guide");if(!r||!el)return;
 const region=scoredDepartment(r.departamento),n=scopeRows(r,region).length;
 const t=focus.type;
 const note=t==="estacionales"?"No se generan distritos elegibles hasta disponer de datos temporales sobre estacionalidad.":
 'Los modelos M0/M1/M2 comparan únicamente '+n+' distritos del alcance filtrado ('+
 (focus.province==="all"?r.departamento:provinceName(focus.province))+'). El filtro de oportunidad cambia los candidatos, no las fórmulas originales ni el presupuesto.';
 el.querySelector(".gc-intro")?.insertAdjacentHTML("afterend",
 '<div class="gg-filter-insight" id="gg-campaign-lens"><strong>Campaña filtrada · '+esc(TYPES.find(x=>x[0]===t)?.[1])+'</strong><div>'+esc(note)+'</div></div>');
}
const api={
 get type(){return focus.type;},
 get province(){return focus.province;},
 get selectedMethod(){return this._selectedMethod||null;},
 set selectedMethod(v){this._selectedMethod=v;},
 provinceName,
 getSource:refOf,
 scopeRows,
 describe:description,
 candidates,
 get catalog(){return catalog;},
 get provinces(){return provinces;}
};
window.GeoGrowthTerritoryFilters=api;
const originalRender=render;
render=function(){
 if(observer){observer.disconnect();observer=null;}
 originalRender();
 if(state.view==="work"){enhancePicker();updateMap();return;}
 if(!["score","opportunity","plan","execution"].includes(state.view))return;
 const nav=document.querySelector("#content .v9-stages");
 if(nav)nav.insertAdjacentHTML("afterend",scopeBadge());
 if(state.view==="opportunity")opportunityNote();
 if(state.view==="plan")campaignNote();
};
function choose(ubigeo){
 const r=DATA.find(x=>x.ubigeo===ubigeo);
 if(!r)return;
 const dep=document.getElementById("go-dep");
 if(dep&&dep.value!==r.departamento){dep.value=r.departamento;dep.dispatchEvent(new Event("change",{bubbles:true}));}
 const dist=document.getElementById("go-ubigeo");
 if(!dist)return;
 if(!Array.from(dist.options).some(x=>x.value===ubigeo)){
  const candidate=document.createElement("option");candidate.value=ubigeo;candidate.textContent=(r.nombre_distrito||ubigeo)+" · "+ubigeo;dist.appendChild(candidate);
 }
 dist.value=ubigeo;
 dist.dispatchEvent(new Event("change",{bubbles:true}));
}
document.addEventListener("change",e=>{
 const t=e.target;
 if(t.id==="gg-filter-province"){
  focus.province=t.value;
  state.plan=[];api.selectedMethod=null;
  const dept=document.getElementById("go-dep")?.value;
  const first=DATA.find(x=>x.departamento===dept&&(focus.province==="all"||key(x)===focus.province));
  if(first){
   const district=document.getElementById("go-ubigeo");
   district.innerHTML='<option value="'+esc(first.ubigeo)+'">'+esc(first.nombre_distrito||first.ubigeo)+'</option>';
   district.value=first.ubigeo;
   district.dispatchEvent(new Event("change",{bubbles:true}));
  } else render();
 }else if(t.id==="gg-filter-type"){
  focus.type=t.value;
  api.selectedMethod=null;
  state.plan=[];render();
 }
});
document.addEventListener("click",e=>{
 const action=e.target.closest("[data-gg-filter-pick],[data-gg-edit-filters],[data-go-model]");
 if(!action)return;
 if(action.hasAttribute("data-gg-edit-filters")){
  e.preventDefault();e.stopImmediatePropagation();state.view="work";render();window.scrollTo?.(0,0);return;
 }
 if(action.hasAttribute("data-gg-filter-pick")){
  e.preventDefault();e.stopImmediatePropagation();choose(action.dataset.ggFilterPick);return;
 }
 if(action.hasAttribute("data-go-model")&&(focus.province!=="all"||focus.type!=="todas")){
  const chosen=DATA.find(x=>String(x.ubigeo)===String(state.selected));
  if(!chosen)return;
  e.preventDefault();e.stopImmediatePropagation();
  const list=window.GeoGrowthCampaignGuide?.models(chosen,Number(document.getElementById("go-budget")?.value||state.budget||2400))||[];
  const method=list.find(x=>x.id===action.dataset.goModel);
  if(!method)return;
  state.plan=method.rows.map(x=>x.ubigeo);
  api.selectedMethod=method.id;
  render();
 }
},true);
// Conserva el contrato GeoGrowthCampaignV3 sin agregar prospectos inventados.
if(typeof download==="function"){
 const originalDownload=download;
 download=function(filename,payload){
  if(payload?.format==="GeoGrowthCampaignV3"){
   const chosen=DATA.find(x=>String(x.ubigeo)===String(state.selected));
   payload={...payload,filtros_busqueda:description(chosen),nota_filtros:"Los filtros son hipótesis territoriales; las fuentes municipales externas no han sido incorporadas al ETL."};
  }
  return originalDownload(filename,payload);
 };
}
Promise.all([
 fetch("data/provincias_ubigeo_ref.json").then(r=>{if(!r.ok)throw Error("Provincias HTTP "+r.status);return r.json();}),
 fetch("data/catalogo_fuentes_cajaradar.json").then(r=>{if(!r.ok)throw Error("Catálogo HTTP "+r.status);return r.json();})
]).then(([p,c])=>{
 provinces=p.provincias||{};
 catalog=Array.isArray(c.territorios)?c.territorios:[];
 ready=true;render();
}).catch(err=>{
 console.error("GeoGrowth filtros: cargando sin catálogo completo",err);
 ready=false;render();
});
render();
})();