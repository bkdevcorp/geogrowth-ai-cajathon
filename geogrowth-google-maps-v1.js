/* GeoGrowth AI: Google Maps JavaScript API — proveedor cartográfico único V9.
 * Bibliotecas reales: maps, core, marker y geometry; places y routes solo bajo demanda.
 * La clave de usuario se conserva en sessionStorage, nunca en el repositorio. Sin respaldo cartográfico en la etapa 01.
 * No usar drawing (DrawingManager no disponible en Maps JS 3.65+).
 */
(function(){
"use strict";
if(new URLSearchParams(window.location.search).get("modo")!=="ampliado")return;
// Lanzamiento de sesión: la clave viaja solo en el fragmento (#) del navegador,
// que no se envía al servidor. Se elimina de la URL inmediatamente y nunca se persiste.
function takePrivateKey(){
 const fragment=String(window.location.hash||"");
 if(!fragment.startsWith("#"))return {key:"",mapId:"DEMO_MAP_ID"};
 const search=new URLSearchParams(fragment.slice(1));
 if(!search.has("ggmaps"))return {key:"",mapId:"DEMO_MAP_ID"};
 const supplied=String(search.get("ggmaps")||"").trim();
 const suppliedId=String(search.get("map_id")||"DEMO_MAP_ID").trim();
 try{
  window.history?.replaceState?.(null,"",window.location.pathname+window.location.search);
 }catch(_){}
 // Una clave inválida nunca activa el proveedor ni queda visible.
 if(!/^AIza[0-9A-Za-z_-]{30,60}$/.test(supplied))return {key:"",mapId:"DEMO_MAP_ID"};
 return {key:supplied,mapId:/^[0-9A-Za-z_-]{4,100}$/.test(suppliedId)?suppliedId:"DEMO_MAP_ID"};
}
const privateLaunch=takePrivateKey();
const config=window.GEOGROWTH_CONFIG||{};
const sessionName="geogrowth.maps.config.v1";
function readSession(){try{return JSON.parse(sessionStorage.getItem(sessionName)||"{}")||{};}catch(_){return {};}}
const saved=readSession();
let key=privateLaunch.key||(saved.GOOGLE_MAPS_API_KEY??config.GOOGLE_MAPS_API_KEY??""),mapId=(privateLaunch.key?privateLaunch.mapId:saved.GOOGLE_MAPS_MAP_ID||config.GOOGLE_MAPS_MAP_ID)||"DEMO_MAP_ID",mode="google",loading=null,active=null,seq=0;
function saveSession(){try{sessionStorage.setItem(sessionName,JSON.stringify({GOOGLE_MAPS_API_KEY:key,GOOGLE_MAPS_MAP_ID:mapId}));}catch(_){}}
if(privateLaunch.key)saveSession();
let authFailed=false;
window.gm_authFailure=()=>{authFailed=true;active=null;status("Google Maps rechazó la clave. Revisa restricciones, APIs y facturación.");updateConfigButton();};
function updateConfigButton(){const b=document.querySelector("[data-gm-config]");if(b)b.textContent="Configuración API · "+(authFailed?"Revisar":key?"Configurada":"Pendiente");}
function configButton(){const host=document.getElementById("v9-role-switch")||document.querySelector(".top");if(!host)return;let b=host.querySelector("[data-gm-config]");if(!b){b=document.createElement("button");b.type="button";b.dataset.gmConfig="1";host.append(b);}updateConfigButton();}
function openConfig(){
 let dialog=document.getElementById("gg-config-dialog");
 if(!dialog){dialog=document.createElement("dialog");dialog.id="gg-config-dialog";dialog.innerHTML='<form id="gg-config-form"><h3>Configuración de Google Maps</h3><p>La clave se conserva solo en esta pestaña durante la sesión. No se envía al repositorio. Usa restricciones HTTP referrer.</p><label for="gg-config-key">GOOGLE_MAPS_API_KEY</label><input id="gg-config-key" type="password" autocomplete="off" required><label for="gg-config-mapid">GOOGLE_MAPS_MAP_ID (opcional)</label><input id="gg-config-mapid" autocomplete="off" placeholder="DEMO_MAP_ID"><p class="gg-config-note">Habilita Maps JavaScript API, Places API (New) y Geocoding API, con facturación activa.</p><div class="gg-config-actions"><button type="button" data-gm-clear>Eliminar clave</button><button type="button" data-gm-close>Cancelar</button><button type="submit" class="go-primary">Guardar y conectar</button></div></form>';document.body.append(dialog);}
 dialog.querySelector("#gg-config-key").value=key;
 dialog.querySelector("#gg-config-mapid").value=mapId;
 if(!dialog.open)dialog.showModal();
}
document.addEventListener("submit",e=>{
 if(e.target.id!=="gg-config-form")return;e.preventDefault();
 const next=document.getElementById("gg-config-key").value.trim();
 const nextId=document.getElementById("gg-config-mapid").value.trim()||"DEMO_MAP_ID";
 if(!/^AIza[0-9A-Za-z_-]{30,60}$/.test(next)){document.getElementById("gg-config-key").setCustomValidity("Introduce una clave de Google Maps válida.");document.getElementById("gg-config-key").reportValidity();return;}
 const reload=Boolean(window.google?.maps)||Boolean(loading)||authFailed;
 key=next;mapId=nextId;saveSession();authFailed=false;lastSearch=null;
 document.getElementById("gg-config-dialog").close();if(reload){location.reload();return;}render();
});
document.addEventListener("input",e=>{if(e.target.id==="gg-config-key")e.target.setCustomValidity("");});
let target=null,origin=null,placesMarkers=[],routeLines=[];
const libraryPlan={initial:["maps","core","marker","geometry"],onDemand:["places","routes"],deprecatedExcluded:["drawing"]};
const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=v=>Number(v||0).toLocaleString("es-PE");
const coord=r=>r&&Number.isFinite(Number(r.latitud_ref_sbs))&&Number.isFinite(Number(r.longitud_ref_sbs))
 &&Number(r.latitud_ref_sbs)>-19.5&&Number(r.latitud_ref_sbs)<1
 &&Number(r.longitud_ref_sbs)>-82.5&&Number(r.longitud_ref_sbs)<-67.5
 ?{lat:Number(r.latitud_ref_sbs),lng:Number(r.longitud_ref_sbs)}:null;
function selectDistrict(ubigeo){
 const r=DATA.find(x=>String(x.ubigeo)===String(ubigeo));if(!r)return;
 const dep=document.getElementById("go-dep");
 if(dep&&dep.value!==r.departamento){dep.value=r.departamento;dep.dispatchEvent(new Event("change",{bubbles:true}));}
 const dist=document.getElementById("go-ubigeo");
 if(!dist)return;
 if(![...dist.options].some(x=>x.value===String(r.ubigeo))){
   const o=document.createElement("option");o.value=r.ubigeo;o.textContent=(r.nombre_distrito||r.ubigeo)+" · "+r.ubigeo;dist.appendChild(o);
 }
 dist.value=r.ubigeo;dist.dispatchEvent(new Event("change",{bubbles:true}));
}
function loader(apiKey){
 if(window.google?.maps?.importLibrary)return Promise.resolve(window.google.maps);
 if(loading)return loading;
 // Una carga aislada, compatible con la API oficial y importLibrary, sin introducir credenciales en la URL del repo.
 loading=new Promise((resolve,reject)=>{
  const cb="__geogrowthGoogleMapsReady";
  const script=document.createElement("script");
  const fail=reason=>{delete window[cb];script.remove();loading=null;reject(reason);};
  window[cb]=()=>{delete window[cb];resolve(window.google.maps);};
  script.async=true;
  script.src="https://maps.googleapis.com/maps/api/js?loading=async&v=weekly&key="+encodeURIComponent(apiKey)+"&callback="+cb;
  script.onerror=()=>fail(new Error("No se cargó la API de Google Maps. Comprueba clave, referrer y facturación."));
  document.head.appendChild(script);
 });
 return loading;
}
// Store only permitted Place IDs and our own source record IDs, not Google content.
const demoStorage="geogrowth.demo.placeids.v1";
function readDemo(){try{const x=JSON.parse(localStorage.getItem(demoStorage)||"[]");return Array.isArray(x)?x.filter(v=>v&&typeof v.recordId==="string"&&typeof v.placeId==="string"&&/^\d{6}$/.test(v.ubigeo)):[];}catch(_){return [];}}
let demoIndex=readDemo();
const validatedDistricts=new Set(demoIndex.map(x=>x.ubigeo));
function rememberValidated(results){
 for(const p of results)if(p.id&&p.location&&p.officialLicense?.ubigeo){
 const ref={recordId:p.officialLicense.id,placeId:p.id,ubigeo:String(p.officialLicense.ubigeo)};
 demoIndex=demoIndex.filter(x=>x.recordId!==ref.recordId);demoIndex.push(ref);validatedDistricts.add(ref.ubigeo);
 }
 try{localStorage.setItem(demoStorage,JSON.stringify(demoIndex));}catch(_){}
 if(results.length)window.dispatchEvent(new Event("geogrowth:validated"));
}
async function restoreDemo(sc,candidates){
 const byId=new Map(candidates.map(l=>[l.id,l]));
 const refs=demoIndex.filter(x=>byId.has(x.recordId));
 if(!refs.length)return [];
 const {Place}=await google.maps.importLibrary("places");
 const out=[];
 for(const ref of refs.slice(0,30)){
 try{const p=new Place({id:ref.placeId});await p.fetchFields({fields:["id","displayName","location","formattedAddress","googleMapsURI","businessStatus","rating","userRatingCount"]});
 const l=byId.get(ref.recordId);
 if(selectMatch(l,[p]))out.push({...placeResult(p,l)});
 }catch(_){}
 }
 return out;
}
function placeResult(p,l){return {id:p.id,displayName:p.displayName,location:p.location,formattedAddress:p.formattedAddress,googleMapsURI:p.googleMapsURI,businessStatus:p.businessStatus,rating:p.rating,userRatingCount:p.userRatingCount,officialLicense:l};}
let lastSearch=null,searchEpoch=0;
function scope(){
 const f=window.GeoGrowthTerritoryFilters,dep=document.getElementById("go-dep")?.value||state.dep;
 const p=f?.province||"all",district=document.getElementById("go-ubigeo")?.value;
 const row=DATA.find(r=>String(r.ubigeo)===String(district));
 const name=row&&row.departamento===dep&&(p==="all"||String(row.ubigeo).slice(0,4)===p)&&row.nombre_distrito&&!/^UBIGEO|^Distrito UBIGEO/i.test(row.nombre_distrito)?row.nombre_distrito:"";
 return {dep,provinceCode:p,ubigeo:name?String(district):null,province:p==="all"?"":f.provinceName(p),district:name,type:f?.type||"todas",custom:f?.custom||""};
}
function status(t){const el=document.getElementById("gg-maps-status");if(el)el.textContent=t;}
function clearDynamic(){for(const m of placesMarkers)m.map=null;placesMarkers=[];active=null;}
function address(s){return [...new Set([s.district,s.province,s.dep,"Perú"].filter(Boolean))].join(", ");}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
// Official evidence is scoped by UBIGEO and never assigned to unrelated Places markers.
let evidenceCache=null;
function officialEvidence(){
 if(!evidenceCache)evidenceCache=Promise.allSettled(["licencias_prospeccion","licencias_arequipa_2026_resumen","licencias_convencion_2026q2_resumen","expansion_moyobamba"].map(n=>fetch("data/"+n+".json").then(r=>{if(!r.ok)throw Error(n+" HTTP "+r.status);return r.json();}))).then(items=>items.map(i=>i.status==="fulfilled"?i.value:null));
 return evidenceCache;
}
function inScope(r,sc){
 return r.departamento===sc.dep&&(sc.provinceCode==="all"||String(r.ubigeo).slice(0,4)===sc.provinceCode)&&(!sc.ubigeo||String(r.ubigeo)===sc.ubigeo);
}
function norm(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9 ]/g," ").replace(/\s+/g," ").trim();}
function matchLicense(licenses,p){
 const n=norm(p.displayName),a=norm(p.formattedAddress);
 if(n.length<4||!a)return null;
 const matches=licenses.filter(l=>l.direccion&&norm(l.nombre)===n&&norm(l.direccion).length>=8&&a.includes(norm(l.direccion)));
 return matches.length===1?matches[0]:null;
}
async function renderEvidence(sc,results=[]){
 const host=document.getElementById("gg-official-evidence");if(!host)return;
 const [licenses,aq,cv,moy]=await officialEvidence();if(!host.isConnected||!same(sc,scope()))return;
 const rows=DATA.filter(r=>inScope(r,sc));
 const selected=(licenses?.registros||[]).filter(l=>inScope(l,sc));
 const cards=[];
 const card=(title,body)=>'<div class="v9-extra-license"><b>'+safe(title)+'</b>'+body+'</div>';
 const line=t=>'<small>'+safe(t)+'</small>';
 if(["todas","nuevos","otros"].includes(sc.type)){
 if(selected.length)cards.push(card("Licencias municipales · registros disponibles",line(selected.length+" registros de bandeja; no prueban apertura ni operación vigente.")+line("Periodo y cobertura según fuente. Lima 2026 sin identificación comercial; Arequipa 2025 con direcciones cuando disponibles.")));
 if(aq&&rows.some(r=>r.ubigeo==="040101"))cards.push(card("Arequipa · enero–junio 2026",line(aq.calidad.registros+" trámites; julio: 0. Sin domicilios individuales.")));
 if(cv&&rows.some(r=>r.ubigeo==="080901"))cards.push(card("Santa Ana · segundo trimestre 2026",line(cv.calidad.registros_q2_2026+" licencias; 1 registro histórico excluido. Sin ubicación individual.")));
 }
 if(["todas","expansion","otros"].includes(sc.type)&&moy&&rows.some(r=>r.ubigeo===moy.ubigeo)){
 const counts={};for(const c of moy.candidatos)counts[c.sector]=(counts[c.sector]||0)+1;
 cards.push(card("Moyobamba · metodología de expansión",line(moy.candidatos.length+" candidatos anonimizados · "+moy.licencias+" licencias históricas · "+moy.ruc_multidireccion+" RUC multidirección.")+line(Object.entries(counts).map(([k,v])=>k+": "+v).join(" · "))+line("Corte "+moy.corte+". Sin nombre, RUC ni dirección publicados: no se pueden vincular a Places.")+'<details><summary>Ver candidatos</summary>'+moy.candidatos.map(c=>line(c.id+" · "+c.sector+" · "+c.fecha_nueva+" · "+c.direcciones_anteriores+" anteriores / "+c.direcciones_nuevas+" nuevas")).join("")+'</details>'));
 }
 if(["todas","desatendidos","otros"].includes(sc.type)){
 const comparable=rows.filter(r=>r.ambas_fuentes);
 if(comparable.length)cards.push(card("Contexto territorial · SBS 2025 / PRODUCE 2015",line(comparable.length+" distritos con ambas fuentes; "+fmt(comparable.reduce((n,r)=>n+Number(r.sbs_oficinas_2025||0),0))+" oficinas SBS; "+fmt(comparable.reduce((n,r)=>n+Number(r.micro_2015||0),0))+" microempresas históricas.")+line("No demuestra brecha financiera actual.")));
 }
 if(sc.type==="estacionales")cards.push(card("Campañas estacionales",line("Sin series de ventas ni calendario sectorial validado. No hay candidatos oficiales individualizados para consultar Places.")));
 const matches=results.map(p=>({p,l:p.officialLicense||matchLicense(selected,p)})).filter(x=>x.l);
 if(results.length)cards.push(card("Cruce individual con licencias",line(matches.length+" coincidencias exactas de nombre y dirección; requieren confirmación.")+line("No se asignan licencias por cercanía ni se inventan coincidencias.")+matches.map(({p,l})=>line(p.displayName+" · "+l.id+" · "+l.fecha)).join("")));
 const unavailable=[licenses,aq,cv,moy].filter(x=>!x).length;
 host.innerHTML='<h4>Evidencia oficial del territorio</h4><p>Fuentes independientes de Google Places; no representan pines de negocios.</p>'+cards.join("")+(!cards.length?'<p>Sin evidencia oficial específica integrada para este filtro.</p>':"")+(unavailable?'<p>'+unavailable+' archivos no disponibles; no se interpretan como cero registros.</p>':"");
}
function display(results,plan){
 if(!active)return;
 for(const m of placesMarkers)m.map=null;placesMarkers=[];
 const panel=document.getElementById("gg-google-places-results");
 void renderEvidence(scope(),results);
 panel.innerHTML="<h4>Registros oficiales localizados en Google Maps</h4><p>"+results.length+" coincidencias únicas de los datos cargados. No se incluyen resultados externos.</p>";
 const bounds=new active.core.LatLngBounds();
 for(const p of results){
  const div=document.createElement("div");div.className="v9-extra-license";
  const title=document.createElement("b");title.textContent=p.displayName||"Establecimiento";div.append(title);
  const detail=document.createElement("small");detail.textContent=[p.officialLicense?"Registro oficial "+p.officialLicense.id+" · "+p.officialLicense.fecha:"",p.formattedAddress,p.businessStatus,p.rating==null?"":("Calificación "+p.rating+" · "+(p.userRatingCount??"N/D")+" reseñas")].filter(Boolean).join(" · ");div.append(detail);
  if(p.googleMapsURI){const a=document.createElement("a");a.href=p.googleMapsURI;a.target="_blank";a.rel="noopener noreferrer";a.textContent="Ver en Google Maps";div.append(a);}
  panel.append(div);
  if(p.location){bounds.extend(p.location);const marker=new active.mark({map:active.map,position:p.location,title:p.displayName||"Establecimiento"});placesMarkers.push(marker);marker.addListener("click",()=>{const node=document.createElement("div");node.textContent=(p.displayName||"Establecimiento")+" — "+(p.formattedAddress||"");active.info.setContent(node);active.info.open({map:active.map,anchor:marker});div.scrollIntoView({block:"nearest"});});}
 }
 if(results.some(p=>p.location))active.map.fitBounds(bounds,40);
 const missing=document.createElement("p");missing.textContent="Información pendiente: "+plan.missing;panel.append(missing);
}
async function mount(){
 const shell=document.getElementById("v9-safe-map");if(!shell)return;
 const my=++seq;clearDynamic();
 const host=shell.querySelector(".v9-extra-map"),panel=shell.querySelector(".v9-extra-panel");
 shell.querySelector(".v9-extra-label").textContent="Google Maps · Google Places";
 shell.querySelector(":scope > .v9-extra-note")?.remove();
 host.innerHTML='<div id="gg-google-map-canvas" class="gg-google-map-canvas" aria-label="Google Maps"></div>';
 panel.innerHTML='<div id="gg-google-places-results"><h4>Establecimientos encontrados</h4><p>Ejecuta una búsqueda para localizar exclusivamente registros identificados en las fuentes oficiales.</p></div><div id="gg-official-evidence" style="border-top:1px solid #dce6ef;margin-top:14px;padding-top:12px"></div>';
 void renderEvidence(scope());
 if(!key){host.firstElementChild.innerHTML='<div class="gg-map-empty"><strong>Conecta Google Maps</strong><p>Configura tu API para visualizar el territorio y buscar establecimientos.</p><button type="button" data-gm-config class="go-primary">Configurar API</button></div>';status("Configuración API pendiente.");return;}
 try{
 await loader(key);
 const [{Map,InfoWindow},{LatLngBounds},{AdvancedMarkerElement},{Geocoder}]=await Promise.all(["maps","core","marker","geocoding"].map(x=>google.maps.importLibrary(x)));
 if(my!==seq||!host.isConnected)return;
 const map=new Map(host.firstElementChild,{center:{lat:-9.19,lng:-75.02},zoom:5,mapId,streetViewControl:true,gestureHandling:"greedy"});
 active={map,info:new InfoWindow(),core:{LatLngBounds},mark:AdvancedMarkerElement,geocoder:new Geocoder()};
 const sc=scope();
 const geo=await active.geocoder.geocode({address:address(sc),componentRestrictions:{country:"PE"}});
 if(my!==seq||!host.isConnected||authFailed)return;
 const g=geo.results[0]?.geometry;if(g?.viewport)map.fitBounds(g.viewport);else if(g?.location){map.setCenter(g.location);map.setZoom(12);}
 if(lastSearch&&same(lastSearch.scope,sc)){display(lastSearch.results,lastSearch.plan);datasetSummary(sc,lastSearch.unmatched||[],lastSearch.records,lastSearch.results,lastSearch.failed,lastSearch.checked?.length||0,lastSearch.total,lastSearch.errors);status("Resultados de esta sesión.");}
 else {
 status("Selecciona el tipo de oportunidad y valida registros oficiales.");
 if(demoIndex.length&&same(sc,scope())){
 const [licenses]=await officialEvidence();
 if(my!==seq||!same(sc,scope()))return;
 const cached=await restoreDemo(sc,sourceCandidates(licenses,sc));
 if(my!==seq||!same(sc,scope()))return;
 if(cached.length){display(cached,{missing:"Ubicaciones recuperadas mediante Place ID; no prueban apertura ni elegibilidad."});status(cached.length+" establecimientos del catálogo demo recuperados.");}
 }
 }
 }catch(e){if(my===seq)status("Google Maps no disponible: "+e.message);}
}
// Dataset-first: only identifiable records in the selected source can produce a Places lookup.
const PAGE_SIZE=10;
let lookupPage=0,lookupScope=null;
function sourceCandidates(data,sc){
 if(!["todas","nuevos","otros"].includes(sc.type))return [];
 const terms=sc.type==="otros"?norm(sc.custom).split(" ").filter(t=>t.length>=4&&!["PARA","BUSCAR","IDENTIFICAR","NEGOCIOS","COMERCIALES","OPORTUNIDADES"].includes(t)):[];
 if(sc.type==="otros"&&!terms.length)return [];
 return (data?.registros||[]).filter(l=>inScope(l,sc)&&l.nombre&&l.direccion&&norm(l.nombre).length>=4&&norm(l.direccion).length>=8&&(!terms.length||terms.some(t=>norm([l.nombre,l.giro,l.sector,l.direccion].join(" ")).includes(t))));
}
function lookupQuery(l){return [l.nombre,l.direccion,l.departamento,"Perú"].filter(Boolean).join(", ");}
function exactAddress(l,p){
 const a=norm(l.direccion),b=norm(p.formattedAddress);
 if(!a||!b)return false;
 if((" "+b+" ").includes(" "+a+" "))return true;
 // Standardize only documented street abbreviations and require matching street number.
 const simplify=v=>norm(v).replace(/\b(AVENIDA|AV)\b/g,"AV").replace(/\b(CALLE|CL)\b/g,"CL").replace(/\b(JIRON|JR)\b/g,"JR").replace(/\b(NRO|NUMERO|NO|N)\b/g,"").replace(/\s+/g," ").trim();
 const x=simplify(a),y=simplify(b);
 return /\b\d+\b/.test(x)&&(" "+y+" ").includes(" "+x+" ");
}
function selectMatch(l,places){
 const matches=(places||[]).filter(p=>p.id&&p.location&&norm(p.displayName)===norm(l.nombre)&&exactAddress(l,p));
 return matches.length===1?matches[0]:null;
}
function datasetSummary(sc,candidates,records,results,failed,processed,total,errors=0){
 const el=document.getElementById("gg-google-places-results");if(!el)return;
 const box=document.createElement("div");box.className="v9-extra-license";
 const h=document.createElement("b");h.textContent="Cruce de registros oficiales con Google Places";box.append(h);
 const line=document.createElement("small");line.textContent=total+" registros identificables · "+processed+" consultados · "+results.length+" coincidencias únicas · "+failed+" sin coincidencia verificable · "+errors+" errores de consulta.";box.append(line);
 if(!total){const note=document.createElement("small");note.textContent=records?"La fuente disponible no contiene registros identificables compatibles con este tipo de oportunidad. No se buscarán negocios ajenos a la data.":"No hay registros individuales compatibles en el ámbito seleccionado. Consulta la evidencia oficial inferior.";box.append(note);}
 if(failed){const details=document.createElement("details"),summary=document.createElement("summary");summary.textContent="Registros consultados sin coincidencia";details.append(summary);const matched=new Set(results.map(p=>p.officialLicense?.id));for(const l of candidates.filter(l=>!matched.has(l.id))){const row=document.createElement("small");row.textContent=l.id+" · "+l.nombre+" · "+l.direccion;details.append(row);}box.append(details);}
 if(processed<total){const button=document.createElement("button");button.type="button";button.className="go-primary";button.dataset.gmNext="1";button.textContent="Consultar siguientes "+Math.min(PAGE_SIZE,total-processed);box.append(button);}
 el.prepend(box);
}
async function searchPlaces(next=false){
 const sc=scope();if(sc.type==="otros"&&!sc.custom.trim())return status("Describe el sector, negocio o actividad presente en tus datos.");
 const token=++searchEpoch,my=seq;
 status("Filtrando registros oficiales…");
 const [licenses,aq,cv,moy]=await officialEvidence();
 if(token!==searchEpoch||my!==seq)return;
 const candidates=sourceCandidates(licenses,sc);
 const records=(licenses?.registros||[]).filter(l=>inScope(l,sc)).length;
 if(!candidates.length){
  lastSearch=null;lookupPage=0;lookupScope=null;
  if(active)display([],{missing:"Sin registros identificables para consultar Google Places."});
  else{const host=document.getElementById("gg-google-places-results");if(host)host.innerHTML="";}
  datasetSummary(sc,[],records,[],0,0,0);
  void renderEvidence(sc,[]);
  return status("No se realizó ninguna consulta Places: faltan registros oficiales identificables para este filtro.");
 }
 if(!key){openConfig();return;}
 if(!active||authFailed)return status("Google Maps aún no está disponible. Revisa la configuración.");
 if(!next||!lookupScope||!same(lookupScope,sc)){lookupPage=0;lookupScope=sc;lastSearch=null;}
 const batch=candidates.slice(lookupPage*PAGE_SIZE,(lookupPage+1)*PAGE_SIZE);
 if(!batch.length)return;
 const plan={missing:"Coincidencias de nombre y dirección sujetas a validación. No confirman apertura, actividad actual ni elegibilidad crediticia."};
 const prior=lastSearch&&same(lastSearch.scope,sc)?lastSearch:null;
 const found=new globalThis.Map((prior?.results||[]).map(p=>[p.id,p]));
 let failed=prior?.failed||0,errors=prior?.errors||0;
 const checked=[...(prior?.checked||[])],unmatched=[...(prior?.unmatched||[])];
 status("Validando "+batch.length+" registros oficiales en Google Places…");
 try{
 const {Place}=await google.maps.importLibrary("places");
 for(const l of batch){
  if(token!==searchEpoch||my!==seq||!same(sc,scope()))return;
  try{
   const response=await Place.searchByText({textQuery:lookupQuery(l),fields:["id","displayName","location","formattedAddress","googleMapsURI","businessStatus","rating","userRatingCount"],maxResultCount:5,region:"pe",language:"es"});
   if(token!==searchEpoch||my!==seq||!same(sc,scope()))return;
   const p=selectMatch(l,response.places);
   if(p){if(!found.has(p.id))found.set(p.id,{id:p.id,displayName:p.displayName,location:p.location,formattedAddress:p.formattedAddress,googleMapsURI:p.googleMapsURI,businessStatus:p.businessStatus,rating:p.rating,userRatingCount:p.userRatingCount,officialLicense:l});}
   else{failed++;unmatched.push(l);}
  }catch(e){errors++;}
  checked.push(l);
 }
 const results=[...found.values()];lookupPage++;
 rememberValidated(results);
 lastSearch={scope:sc,results,plan,failed,errors,checked,unmatched,total:candidates.length,records};
 display(results,plan);
 datasetSummary(sc,unmatched,records,results,failed,checked.length,candidates.length,errors);
 status(results.length+" coincidencias verificables de "+checked.length+" registros consultados. No se muestran negocios externos a la fuente.");
 }catch(e){if(token===searchEpoch&&my===seq)status("No se completó la consulta Places: "+e.message);}
}
// Explicitly initiated, bounded, source-first preparation for the live demo.
let preparing=false;
async function prepareDemo(){
 if(preparing)return;
 if(!key){openConfig();return;}
 if(!active||authFailed)return status("Conecta Google Maps antes de preparar la demo.");
 const sc=scope(),token=++searchEpoch,my=seq;
 const [licenses]=await officialEvidence();
 if(token!==searchEpoch||my!==seq)return;
 const candidates=sourceCandidates(licenses,{...sc,type:"todas"});
 if(!candidates.length)return status("Este territorio no tiene registros con nombre y dirección. Selecciona Arequipa Cercado.");
 preparing=true;
 const button=document.querySelector("[data-gm-prepare]");if(button)button.disabled=true;
 const results=new Map();let processed=0,errors=0;
 try{
 const {Place}=await google.maps.importLibrary("places");
 const refs=new Set(demoIndex.map(x=>x.recordId));
 const queue=candidates.filter(l=>!refs.has(l.id));
 const limit=Number(document.getElementById("gg-demo-limit")?.value||30);
 for(const l of queue.slice(0,limit)){
 if(token!==searchEpoch||my!==seq||!same(sc,scope()))break;
 if(results.size>=5||errors>=3)break;
 processed++;
 status("Preparando demo: "+processed+" consultas · "+results.size+" coincidencias.");
 try{
 const response=await Place.searchByText({textQuery:lookupQuery(l),fields:["id","displayName","location","formattedAddress","googleMapsURI","businessStatus","rating","userRatingCount"],maxResultCount:5,region:"pe",language:"es"});
 if(token!==searchEpoch||my!==seq||!same(sc,scope()))break;
 const p=selectMatch(l,response.places);
 if(p){const item=placeResult(p,l);results.set(p.id,item);rememberValidated([item]);}
 }catch(_){errors++;}
 }
 if(token!==searchEpoch||my!==seq)return;
 const list=[...results.values()];
 if(list.length)display(list,{missing:"Coincidencias de la fuente verificadas por nombre y dirección; sin inferencia de crédito."});
 status("Preparación: "+list.length+" nuevos lugares validados, "+processed+" registros consultados, "+errors+" errores. "+(list.length?"Referencias guardadas en este navegador.":"No se encontraron coincidencias nuevas; no se inventarán ubicaciones."));
 }catch(e){status("No se pudo preparar la demo: "+e.message);}
 finally{preparing=false;if(button?.isConnected)button.disabled=false;}
}
function toolbox(){
 return '<div id="gg-google-toolbar" class="gg-search-actions"><button type="button" class="go-primary" data-gm-places>Buscar oportunidades</button><label for="gg-demo-limit" style="font-size:11px">Límite de consultas</label><select id="gg-demo-limit"><option value="30">30</option><option value="60">60</option><option value="100">100</option></select><button type="button" data-gm-prepare>Preparar demo (hasta 5 coincidencias)</button><p id="gg-maps-status" class="gg-maps-disclaimer" role="status"></p></div>';
}
const style=document.createElement("style");
style.textContent=`.gg-search-actions{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:14px}.gg-search-actions button,.gg-map-empty button,#gg-config-dialog button{border:1px solid #cbdbe9;border-radius:8px;padding:9px 14px;font-size:12px;font-weight:700;cursor:pointer;background:#fff;color:#245792}.gg-search-actions .go-primary,.gg-map-empty .go-primary,#gg-config-dialog .go-primary{background:#205b92;color:#fff;border-color:#205b92}.gg-maps-disclaimer{margin:0;font-size:11px;color:#526982;line-height:1.5}.gg-google-map-canvas{height:440px;width:100%;border-radius:11px;overflow:hidden;background:#f0f5fa}.gg-map-empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:25px;text-align:center;color:#244e71}.gg-map-empty p{font-size:12px;color:#617d95;max-width:280px}.v9-extra-panel{max-height:440px!important}.v9-extra-license a{font-size:11px;color:#235aa1}#gg-config-dialog{border:1px solid #dce7f3;border-radius:14px;padding:24px;width:min(460px,calc(100% - 32px));color:#193d63;box-shadow:0 16px 50px #132b4940}#gg-config-dialog::backdrop{background:#132b4966}#gg-config-dialog h3{margin:0 0 12px;font-size:17px}#gg-config-dialog p{font-size:12px;line-height:1.6;color:#526982}#gg-config-dialog label{display:block;font-size:12px;font-weight:700;margin:14px 0 6px}#gg-config-dialog input{box-sizing:border-box;width:100%;padding:11px;border:1px solid #c5d8e8;border-radius:8px;font:inherit;font-size:13px}#gg-config-dialog .gg-config-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;margin-top:16px}@media(max-width:760px){.gg-google-map-canvas{height:340px}.v9-extra-panel{max-height:340px!important}}`;
document.head.appendChild(style);
const prev=render;
render=function(){
 prev();configButton();if(state.view!=="work")return;
 const shell=document.getElementById("v9-safe-map");if(!shell)return;
 document.querySelectorAll("#content .go-block").forEach(el=>el.remove());
 const subtitle=document.querySelector(".go-pick .go-subtle");if(subtitle)subtitle.textContent="Datos oficiales · Validación Google Places";
 document.querySelector(".go-pick")?.insertAdjacentHTML("beforeend",toolbox());
 void mount();
};
document.addEventListener("click",event=>{
 const b=event.target.closest("[data-gm-config],[data-gm-close],[data-gm-clear],[data-gm-places],[data-gm-next],[data-gm-prepare]");if(!b)return;
 event.preventDefault();event.stopImmediatePropagation();
 if(b.hasAttribute("data-gm-config"))openConfig();
 else if(b.hasAttribute("data-gm-close"))document.getElementById("gg-config-dialog")?.close();
 else if(b.hasAttribute("data-gm-clear")){key="";mapId="DEMO_MAP_ID";saveSession();lastSearch=null;location.reload();}
 else if(b.hasAttribute("data-gm-prepare"))void prepareDemo();
 else void searchPlaces(b.hasAttribute("data-gm-next"));
},true);
window.GeoGrowthGoogleMaps={libraries:{initial:["maps","core","marker","geocoding"],onDemand:["places"]},get mode(){return "google";},matchLicense,sourceCandidates,selectMatch,lookupQuery,hasValidated:u=>validatedDistricts.has(String(u)),get enabled(){return Boolean(key);},activateForTest(apiKey,configuredMapId="DEMO_MAP_ID"){key=apiKey;mapId=configuredMapId;render();}};
render();
 if(demoIndex.length)window.dispatchEvent(new Event("geogrowth:validated"));
})();
