/* Shared Google Maps configuration and source-only geolocation for V11. */
(function(){
"use strict";
const KEY="geogrowth.maps.config.v1",INDEX="geogrowth.v11.located.v1";
const read=(storage,k,f)=>{try{return JSON.parse(storage.getItem(k)||"null")??f}catch(_){return f}};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function config(){return read(sessionStorage,KEY,{})}
function save(key,id){sessionStorage.setItem(KEY,JSON.stringify({GOOGLE_MAPS_API_KEY:key,GOOGLE_MAPS_MAP_ID:id||"DEMO_MAP_ID"}))}
let pending=null;
function load(){
 if(window.google?.maps?.importLibrary)return Promise.resolve(window.google.maps);
 if(pending)return pending;
 const key=config().GOOGLE_MAPS_API_KEY;if(!key)return Promise.reject(Error("Configura Google Maps en Configuración."));
 pending=new Promise((resolve,reject)=>{const s=document.createElement("script"),cb="__ggV11Ready";window[cb]=()=>{delete window[cb];resolve(window.google.maps)};s.onerror=()=>{pending=null;s.remove();reject(Error("No se pudo cargar Google Maps."))};s.src="https://maps.googleapis.com/maps/api/js?loading=async&v=weekly&key="+encodeURIComponent(key)+"&callback="+cb;s.async=true;document.head.append(s)});return pending;
}
function openConfig(){location.assign('configuracion.html');}
function header(){}
function normalized(s){return String(s||"").normalize("NFD").replace(/\p{M}/gu,"").toUpperCase().replace(/\b(AVENIDA|AV|CALLE|CL|JIRON|JR|NRO|NUMERO|NO)\b/g," ").replace(/[^A-Z0-9]+/g," ").trim()}
function located(u){return read(localStorage,INDEX,[]).includes(String(u))}
function remember(u){try{localStorage.setItem(INDEX,JSON.stringify([...new Set([...read(localStorage,INDEX,[]),String(u)])]))}catch(_){}}
async function geocodeRecord(x,territory){
 if(!x.direccion)return null;
 const maps=await load(),{Geocoder}=await maps.importLibrary("geocoding");
 const address=x.direccion.replace(/\s*[-–]\s*REF\.?.*$/i,"");
 const {results}=await new Geocoder().geocode({address:address+", "+territory+", Perú",componentRestrictions:{country:"PE"}});
 const r=results?.[0];if(!r||r.partial_match||!["ROOFTOP","RANGE_INTERPOLATED"].includes(r.geometry?.location_type))return null;
 const source=normalized(address),returned=normalized(r.formatted_address);
 const m=source.match(/^(.+?)\s+(\d+)(?=\s|$)/);if(!m||!returned.includes(m[1].trim())||!returned.split(" ").includes(m[2]))return null;
 return {position:r.geometry.location,address:r.formatted_address,label:"Dirección municipal geocodificada; identidad comercial no confirmada",matched:false,received:1,geocoded:true};
}
const types=[["nuevos","Nuevos negocios (licencias)"]];
let filter={type:"nuevos",province:"all",district:"",custom:""};
function panel(app){
 const deps=[...new Set(app.territories.map(r=>r.departamento))].sort((a,b)=>Number(app.territories.some(r=>r.departamento===b&&located(r.ubigeo)))-Number(app.territories.some(r=>r.departamento===a&&located(r.ubigeo)))||a.localeCompare(b,"es"));
 return '<section class="card"><div class="card-header"><div><h2>Seleccionar territorio para análisis</h2><p>Datos municipales → Google Maps. Los marcadores solo corresponden a direcciones del dataset.</p></div></div><div class="form-grid"><div class="field"><label>Departamento</label><select id="ggV11Dep">'+deps.map(d=>'<option '+(app.dept===d?'selected':'')+'>'+esc(d)+'</option>').join("")+'</select></div><div class="field"><label>Provincia</label><select id="ggV11Prov"></select></div><div class="field"><label>Distrito</label><select id="ggV11District"></select></div><div class="field"><label>Tipo de oportunidad</label><select id="ggV11Type">'+types.map(([v,n])=>'<option value="'+v+'" '+(filter.type===v?'selected':'')+'>'+esc(n)+'</option>').join("")+'</select></div></div><div class="field" id="ggV11Other" hidden><label>Sector o actividad presente en la fuente</label><input id="ggV11Custom" value="'+esc(filter.custom)+'"></div><div class="actions-row"><button class="btn primary" id="ggV11Search">Buscar oportunidades</button><button class="btn" id="ggV11Prepare">Preparar demo (30 direcciones máx.)</button></div><p class="muted" id="ggV11Status">Selecciona un territorio.</p></section><section class="card"><div class="card-header"><h2>Mapa comercial · Google Maps</h2><span class="badge">Direcciones oficiales</span></div><div class="grid-2" style="grid-template-columns:minmax(0,1.6fr) minmax(230px,1fr)"><div id="ggV11Map" style="height:420px;border-radius:12px;background:#edf3f8"></div><div id="ggV11Results" style="max-height:420px;overflow:auto"></div></div></section>';
}
async function mount(app,actions){
 header();const $=id=>document.getElementById(id),host=$("ggV11Map");if(!host)return;
 let map=null,seq=0,pins=[],provinceNames={};
 try{const p=await fetch("data/provincias_ubigeo_ref.json").then(r=>r.json());provinceNames=p.provincias||{}}catch(_){}
 if(!host.isConnected)return;
 const rows=()=>app.territories.filter(r=>r.departamento===$("ggV11Dep").value);
 function opts(el,items,all){el.innerHTML='<option value="">'+all+'</option>'+items.map(([v,n])=>'<option value="'+esc(v)+'">'+esc(n)+'</option>').join("")}
 function districts(){const p=$("ggV11Prov").value;const list=rows().filter(r=>!p||r.ubigeo.startsWith(p)).sort((a,b)=>Number(located(b.ubigeo))-Number(located(a.ubigeo))||String(a.nombre_distrito).localeCompare(String(b.nombre_distrito),"es"));opts($("ggV11District"),list.map(r=>[r.ubigeo,(r.nombre_distrito||r.ubigeo)+(located(r.ubigeo)?" · localizada":"")]),"Todos los distritos");$("ggV11District").value=filter.district||app.licenseUbigeo||""}
 function provinces(){const codes=[...new Set(rows().map(r=>r.ubigeo.slice(0,4)))].sort((a,b)=>Number(rows().some(r=>r.ubigeo.startsWith(b)&&located(r.ubigeo)))-Number(rows().some(r=>r.ubigeo.startsWith(a)&&located(r.ubigeo)))||String(provinceNames[a]||a).localeCompare(String(provinceNames[b]||b),"es"));opts($("ggV11Prov"),codes.map(p=>[p,provinceNames[p]||p]),"Todas las provincias");$("ggV11Prov").value=filter.province==="all"?"":filter.province;districts()}
 provinces();$("ggV11Other").hidden=filter.type!=="otros";
 $("ggV11Dep").onchange=()=>{filter.province="all";filter.district="";provinces()};$("ggV11Prov").onchange=()=>{filter.province=$("ggV11Prov").value||"all";filter.district="";districts()};$("ggV11Type").onchange=()=>{$("ggV11Other").hidden=$("ggV11Type").value!=="otros"};
 async function ensureMap(){if(map)return map;const maps=await load(),{Map}=await maps.importLibrary("maps");if(!host.isConnected)throw Error("Vista cerrada");map=new Map(host,{center:{lat:-9.19,lng:-75.02},zoom:5,mapId:config().GOOGLE_MAPS_MAP_ID||"DEMO_MAP_ID"});return map}
 if(config().GOOGLE_MAPS_API_KEY)ensureMap().catch(e=>{$("ggV11Status").textContent=e.message});else host.textContent="Configura Google Maps desde el menú Configuración. Los registros siguen disponibles sin mapa.";
 async function search(limit){
 const token=++seq,dep=$("ggV11Dep").value,prov=$("ggV11Prov").value,u=$("ggV11District").value,type=$("ggV11Type").value,q=$("ggV11Custom").value.trim().toLowerCase();filter={type,province:prov||"all",district:u,custom:q};
 if(type==="expansion"){actions.expansion();return}
 if(["desatendidos","estacionales"].includes(type)){$("ggV11Status").textContent="No hay establecimientos individualmente demostrados para esta categoría. Consulta el contexto territorial y las fuentes.";return}
 const records=app.licencias.filter(x=>(app.year==="Todos"||String(x.fecha||"").startsWith(app.year))&&(app.sector==="Todos"||x.sector===app.sector)&&(app.status!=="Vigentes"||["ACTIVA","VIGENTE"].includes(x.estado))&&x.departamento===dep&&(!prov||x.ubigeo.startsWith(prov))&&(!u||x.ubigeo===u)&&(!q||type!=="otros"||[x.nombre,x.direccion,x.sector,x.giro].join(" ").toLowerCase().includes(q)));
 if(type==="otros"&&!q){$("ggV11Status").textContent="Introduce una actividad o nombre.";return}
 const candidates=records.filter(x=>x.direccion),out=$("ggV11Results");out.innerHTML="";pins.forEach(p=>p.map=null);pins=[];
 const apply=document.createElement("button");apply.className="btn small";apply.textContent="Ver "+records.length+" registros del territorio";apply.onclick=()=>actions.scope(dep,u,prov);out.append(apply);
 if(!candidates.length){$("ggV11Status").textContent=records.length+" registros; sin direcciones individuales disponibles.";return}
 if(!config().GOOGLE_MAPS_API_KEY){$("ggV11Status").textContent=records.length+" registros oficiales; "+candidates.length+" con dirección. Configura la API si deseas localizarlos.";return}
 try{const m=await ensureMap(),maps=await load(),{AdvancedMarkerElement}=await maps.importLibrary("marker"),{LatLngBounds}=await maps.importLibrary("core");const bounds=new LatLngBounds();let count=0,errors=0;
 const center=app.territories.find(r=>r.ubigeo===u);if(center?.latitud_ref_sbs!=null&&center?.longitud_ref_sbs!=null){m.setCenter({lat:Number(center.latitud_ref_sbs),lng:Number(center.longitud_ref_sbs)});m.setZoom(12)}
 const list=candidates.slice(0,limit);for(const x of list){if(token!==seq||!host.isConnected)return;try{const district=app.territories.find(r=>r.ubigeo===x.ubigeo);const hit=await geocodeRecord(x,[district?.nombre_distrito,provinceNames[x.ubigeo.slice(0,4)],dep].filter(Boolean).join(", "));if(token!==seq||!host.isConnected)return;if(!hit)continue;count++;remember(x.ubigeo);bounds.extend(hit.position);pins.push(new AdvancedMarkerElement({map:m,position:hit.position,title:x.nombre||x.id}));const card=document.createElement("div");card.className="signal";card.innerHTML="<b>"+esc(x.nombre||x.id)+"</b><p>"+esc(x.direccion)+"</p><small>Dirección geocodificada; identidad por verificar</small><div class='actions-row'><button class='btn small' data-lead='"+esc(x.id)+"'>Opportunity Brief</button></div>";out.append(card);if(count>=5&&limit===30)break;}catch(e){errors++;$("ggV11Status").textContent=String(e.message||e);if(/quota|RESOURCE_EXHAUSTED|OVER_QUERY_LIMIT|DENIED/i.test(String(e.message||e)))break}}
 if(count)m.fitBounds(bounds,40);$("ggV11Status").textContent=records.length+" registros oficiales · "+count+" direcciones localizadas · "+errors+" errores. Identidad y vigencia pendientes.";if(!count)out.textContent="No se obtuvieron direcciones con precisión suficiente.";else{const next=document.createElement("button");next.className="btn small";next.textContent="Aplicar territorio a bandeja";next.onclick=()=>actions.scope(dep,u,prov);out.prepend(next)}
 }catch(e){$("ggV11Status").textContent=e.message}
 }
 $("ggV11Search").onclick=()=>search(10);$("ggV11Prepare").onclick=()=>search(30);
}
window.GeoGrowthGoogleV11={config,save,load,openConfig,header,panel,mount,geocodeRecord,located};
})();
