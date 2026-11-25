/* GeoGrowth AI: Google Maps JavaScript API — proveedor cartográfico único V9.
 * Bibliotecas reales: maps, core, marker y geometry; places y routes solo bajo demanda.
 * Nunca se almacena ni se registra la API key. Sin respaldo cartográfico en la etapa 01.
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
let key=privateLaunch.key,mapId=privateLaunch.mapId,mode=key?"google":"v5",loading=null,active=null,seq=0;
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
let lastSearch=null,searchEpoch=0;
const plans={
 todas:{terms:["restaurantes","tiendas","ferreterías"],missing:"Validar necesidad financiera y actividad real."},
 nuevos:{terms:["negocios","tiendas"],missing:"Places no acredita fecha de apertura; faltan altas SUNAT o licencias vinculadas."},
 expansion:{terms:["comercios","ferreterías","distribuidores"],missing:"Faltan series de ventas, sucursales y evidencia histórica de crecimiento."},
 desatendidos:{terms:["mercados","comercios","bancos","cajas municipales"],missing:"Faltan cobertura SBS individual, cartera propia y datos de acceso financiero."},
 estacionales:{terms:()=>{const m=new Date().getMonth()+1;return m>=10?["jugueterías","tiendas de regalos","ropa"]:m<=3?["librerías","útiles escolares","uniformes"]:["restaurantes","hoteles","comercio"];},missing:"Calendario y demanda estacional aún no validados."}
};
function scope(){
 const f=window.GeoGrowthTerritoryFilters,dep=document.getElementById("go-dep")?.value||state.dep;
 const p=f?.province||"all",district=document.getElementById("go-ubigeo")?.value;
 const row=DATA.find(r=>String(r.ubigeo)===String(district));
 const name=row&&row.departamento===dep&&(p==="all"||String(row.ubigeo).slice(0,4)===p)&&row.nombre_distrito&&!/^UBIGEO|^Distrito UBIGEO/i.test(row.nombre_distrito)?row.nombre_distrito:"";
 return {dep,province:p==="all"?"":f.provinceName(p),district:name,type:f?.type||"todas",custom:f?.custom||""};
}
function status(t){const el=document.getElementById("gg-maps-status");if(el)el.textContent=t;}
function clearDynamic(){for(const m of placesMarkers)m.map=null;placesMarkers=[];active=null;}
function address(s){return [...new Set([s.district,s.province,s.dep,"Perú"].filter(Boolean))].join(", ");}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function display(results,plan){
 if(!active)return;
 for(const m of placesMarkers)m.map=null;placesMarkers=[];
 const panel=document.getElementById("gg-google-places-results");
 panel.innerHTML="<h4>Establecimientos en Google Places</h4><p>"+results.length+" resultados de la consulta, no un censo ni oportunidades crediticias confirmadas.</p>";
 const bounds=new active.core.LatLngBounds();
 for(const p of results){
  const div=document.createElement("div");div.className="v9-extra-license";
  const title=document.createElement("b");title.textContent=p.displayName||"Establecimiento";div.append(title);
  const detail=document.createElement("small");detail.textContent=[p.formattedAddress,p.businessStatus,p.rating==null?"":("Calificación "+p.rating+" · "+(p.userRatingCount??"N/D")+" reseñas")].filter(Boolean).join(" · ");div.append(detail);
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
 panel.innerHTML='<div id="gg-google-places-results"><h4>Establecimientos encontrados</h4><p>Ejecuta una búsqueda para mostrar negocios publicados en Google Maps.</p></div>';
 if(!key){status("Configura una clave de Google Maps para iniciar.");return;}
 try{
 await loader(key);
 const [{Map,InfoWindow},{LatLngBounds},{AdvancedMarkerElement},{Geocoder}]=await Promise.all(["maps","core","marker","geocoding"].map(x=>google.maps.importLibrary(x)));
 if(my!==seq||!host.isConnected)return;
 const map=new Map(host.firstElementChild,{center:{lat:-9.19,lng:-75.02},zoom:5,mapId,streetViewControl:true,gestureHandling:"greedy"});
 active={map,info:new InfoWindow(),core:{LatLngBounds},mark:AdvancedMarkerElement,geocoder:new Geocoder()};
 const sc=scope();
 const geo=await active.geocoder.geocode({address:address(sc),componentRestrictions:{country:"PE"}});
 if(my!==seq||!host.isConnected)return;
 const g=geo.results[0]?.geometry;if(g?.viewport)map.fitBounds(g.viewport);else if(g?.location){map.setCenter(g.location);map.setZoom(12);}
 if(lastSearch&&same(lastSearch.scope,sc)){display(lastSearch.results,lastSearch.plan);status("Resultados de esta sesión.");}
 else status("Selecciona el tipo de oportunidad y busca establecimientos.");
 }catch(e){if(my===seq)status("Google Maps no disponible: "+e.message);}
}
async function searchPlaces(){
 if(!active)return status("Google Maps aún no está disponible.");
 const sc=scope();if(sc.type==="otros"&&!sc.custom.trim())return status("Describe la oportunidad antes de buscar.");
 const token=++searchEpoch,my=seq;
 const plan=sc.type==="otros"?{terms:[sc.custom.trim().slice(0,300)],missing:"Consulta personalizada literal; falta conectar un LLM para interpretar y planificar búsquedas."}:plans[sc.type]||plans.todas;
 const terms=typeof plan.terms==="function"?plan.terms():plan.terms;
 status("Consultando Google Places…");
 try{
 const {Place}=await google.maps.importLibrary("places");
 const found=new Map();
 for(const term of terms){
 const response=await Place.searchByText({textQuery:term+" en "+address(sc),fields:["id","displayName","location","formattedAddress","googleMapsURI","businessStatus","rating","userRatingCount"],maxResultCount:20,region:"pe",language:"es"});
 if(token!==searchEpoch||my!==seq)return;
 for(const p of response.places||[])if(p.id&&p.location)found.set(p.id,p);
 }
 const results=[...found.values()];lastSearch={scope:sc,results,plan};display(results,plan);
 status(results.length+" establecimientos encontrados. La búsqueda no demuestra necesidad de crédito.");
 }catch(e){if(token===searchEpoch&&my===seq)status("No se completó la consulta Places: "+e.message);}
}
function toolbox(){
 return '<div id="gg-google-toolbar" style="margin-top:12px">'+
 (!key?'<label>Clave Google Maps (solo esta sesión)<input id="gg-google-api-key" type="password" autocomplete="off"></label> <button type="button" data-gm-google>Activar Google Maps</button>':'')+
 '<button type="button" class="go-primary" data-gm-places>Buscar oportunidades</button><p id="gg-maps-status" class="gg-maps-disclaimer" role="status"></p></div>';
}
const style=document.createElement("style");
style.textContent=".gg-maps-toolbar{border:1px solid #cadfed;border-radius:12px;background:#f3f9fe;padding:12px;margin:0 0 13px;display:grid;gap:9px}.gg-maps-toolbar b{color:#244e71;font-size:12px}.gg-maps-toolbar small{font-size:10px;color:#617d95}.gg-maps-tools{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.gg-maps-tools button{background:white;border:1px solid #bcd1e5;color:#255b8b;padding:7px 11px;border-radius:8px;font-size:11px;cursor:pointer;font-weight:700}.gg-maps-tools button[aria-pressed=true]{background:#1f5b92;color:#fff}.gg-maps-tools select{padding:6px;border:1px solid #c5d8e8;border-radius:7px;font-size:11px}.gg-maps-key{font-size:11px;color:#456d8c;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.gg-maps-key input{padding:7px;border:1px solid #bdd4e5;border-radius:7px;font-size:11px;min-width:170px}.gg-maps-disclaimer{font-size:11px;color:#476d8b;line-height:1.6;margin:0}.gg-google-map-canvas{height:330px;min-height:290px;width:100%;border-radius:11px}.gg-google-map-note{font-size:10px;line-height:1.6;color:#5f7690;margin-top:7px}.gg-maps-toolbar ol{margin:7px 0 0;padding-left:21px;font-size:11px;color:#4c6680}.gg-maps-toolbar li{margin:7px 0}.gg-maps-toolbar a{color:#2965a3}";
document.head.appendChild(style);
const prev=render;
render=function(){
 prev();if(state.view!=="work")return;
 const shell=document.getElementById("v9-safe-map");if(!shell)return;
 document.querySelector(".go-pick")?.insertAdjacentHTML("beforeend",toolbox());
 void mount();
};
document.addEventListener("click",event=>{
 const b=event.target.closest("[data-gm-google],[data-gm-places]");if(!b)return;
 event.preventDefault();event.stopImmediatePropagation();
 if(b.hasAttribute("data-gm-google")){const supplied=document.getElementById("gg-google-api-key")?.value?.trim();if(!supplied)return status("Ingresa la clave.");key=supplied;render();}
 else void searchPlaces();
},true);
window.GeoGrowthGoogleMaps={libraries:{initial:["maps","core","marker","geocoding"],onDemand:["places"]},get mode(){return "google";},get enabled(){return Boolean(key);},activateForTest(apiKey,configuredMapId="DEMO_MAP_ID"){key=apiKey;mapId=configuredMapId;render();}};
render();
})();
