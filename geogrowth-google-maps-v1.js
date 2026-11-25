/* GeoGrowth AI: Google Maps JavaScript API — modo cartografico optativo V9.
 * Bibliotecas reales: maps, core, marker y geometry; places y routes solo bajo demanda.
 * Nunca se almacena ni se registra la API key. El V5 original sigue siendo respaldo.
 * No usar drawing (DrawingManager no disponible en Maps JS 3.65+).
 */
(function(){
"use strict";
if(new URLSearchParams(window.location.search).get("modo")!=="ampliado")return;
let key="",mapId="DEMO_MAP_ID",mode="v5",loading=null,active=null,seq=0;
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
function rows(){
 const province=window.GeoGrowthTerritoryFilters?.province||"all";
 return DATA.filter(r=>coord(r)&&
   (!state.dep||state.dep==="Todo el Perú"||r.departamento===state.dep)&&
   (province==="all"||r.ubigeo.slice(0,4)===province));
}
function alertMessage(text){
 const status=document.getElementById("gg-maps-status");if(status)status.textContent=text;
}
function setTarget(r,info,marker,geometry,core){
 target=r;
 const c=coord(r),start=coord(DATA.find(x=>x.ubigeo===String(state.selected)));
 const distance=start&&c?geometry.spherical.computeDistanceBetween(new core.LatLng(start),new core.LatLng(c)):null;
 const msg=(r.nombre_distrito||"UBIGEO "+r.ubigeo)+" · "+r.ubigeo+
  " | "+fmt(r.sbs_puntos_2025)+" puntos de infraestructura SBS 2025"+
  (distance==null?"":" | Distancia lineal entre coordenadas referenciales: "+(distance/1000).toFixed(1)+" km");
 alertMessage(msg+". No es un domicilio comercial ni una ruta de visita.");
 info.setContent('<div style="max-width:240px;font:12px sans-serif"><b>'+safe(r.nombre_distrito||"Distrito")+'</b>'+
   '<p>UBIGEO '+safe(r.ubigeo)+' · '+fmt(r.sbs_puntos_2025)+' puntos SBS (2025).</p>'+
   '<p>Coordenada promedio SBS, no ubicación de un negocio.</p>'+
   '<small>Usa «Analizar distrito» para incorporarlo al flujo.</small></div>');
 info.open({map:active.map,anchor:marker});
}
function clearDynamic(){
 for(const m of placesMarkers) m.map=null; placesMarkers=[];
 for(const l of routeLines) l.setMap(null); routeLines=[];
 target=null;active=null;
}
async function mount(){
 const host=document.querySelector("#v9-safe-map .v9-extra-map");
 if(!host||!key||mode!=="google")return;
 const mySeq=++seq;
 clearDynamic();
 host.innerHTML='<div class="gg-google-map-canvas" id="gg-google-map-canvas" role="region" aria-label="Google Maps territorial"></div>'+
 '<div class="gg-google-map-note">Google Maps · límites reales GeoJSON · marcadores: coordenadas medias SBS 2025, no licencias comerciales. Clic en un distrito para consultar su ficha.</div>';
 const canvas=document.getElementById("gg-google-map-canvas");
 const label=document.querySelector("#v9-safe-map .v9-extended-title .v9-extra-label");
 if(label)label.textContent="Google Maps JavaScript API · mapas y marcadores reales";
 alertMessage("Cargando bibliotecas de Google Maps…");
 try{
  await loader(key);
  const [{Map,InfoWindow},{LatLng,LatLngBounds},{AdvancedMarkerElement},geometry]=await Promise.all(
    libraryPlan.initial.map(x=>window.google.maps.importLibrary(x))
  );
  if(mySeq!==seq||!canvas.isConnected)return;
  const shown=rows().slice().sort((a,b)=>(b.sbs_puntos_2025||0)-(a.sbs_puntos_2025||0)).slice(0,320);
  const selected=DATA.find(x=>x.ubigeo===String(state.selected));
  const selectedPoint=coord(selected);
  const center=selectedPoint||coord(shown[0])||{lat:-9.19,lng:-75.02};
  const map=new Map(canvas,{center,zoom:selectedPoint?10:5,mapId:mapId||"DEMO_MAP_ID",
    mapTypeControl:true,streetViewControl:false,fullscreenControl:true,gestureHandling:"greedy"});
  const info=new InfoWindow();
  active={map,info,geometry,core:{LatLng,LatLngBounds},mark:AdvancedMarkerElement};
  const response=await fetch("data/peru_departamentos.geojson",{cache:"force-cache"});
  if(response.ok){
    const geo=await response.json();
    if(mySeq!==seq||!canvas.isConnected)return;
    map.data.addGeoJson(geo);
    map.data.setStyle(feature=>({
     fillColor:String(feature.getProperty("NOMBDEP")||"").toLowerCase()===String(state.dep||"").toLowerCase()?"#6db8b6":"#7babc8",
     fillOpacity:.12,strokeColor:"#326d91",strokeWeight:1,clickable:true
    }));
    map.data.addListener("click",event=>{
      const value=String(event.feature.getProperty("NOMBDEP")||"").toLowerCase();
      const found=[...new Set(DATA.map(r=>r.departamento))].find(d=>d.toLowerCase()===value);
      if(found){
       const dept=document.getElementById("go-dep");if(dept){dept.value=found;dept.dispatchEvent(new Event("change",{bubbles:true}));}
      }
    });
  }
  const bounds=new LatLngBounds();
  for(const r of shown){
    const location=coord(r);bounds.extend(location);
    const marker=new AdvancedMarkerElement({map,position:location,title:(r.nombre_distrito||r.ubigeo)+" · SBS 2025"});
    marker.addListener("click",()=>setTarget(r,info,marker,geometry,{LatLng}));
  }
  if(shown.length>1&&!selectedPoint)map.fitBounds(bounds,25);
  alertMessage("Google Maps activo: "+shown.length+" distritos con coordenadas SBS referenciales. Selecciona un marcador para analizar o explorar.");
 }catch(e){
  if(mySeq!==seq)return;
  console.error("No se pudo activar Google Maps (sin registrar la clave):",e.message);
  alertMessage(e.message+". El mapa V5 permanece disponible.");
  mode="v5";render();
 }
}
function toolbox(){
 return '<div class="gg-maps-toolbar" id="gg-google-toolbar">'+
 '<div><b>Cartografía para investigación</b><small> Google Maps JS cuando se configure; V5 disponible como respaldo</small></div>'+
 '<div class="gg-maps-tools"><button type="button" data-gm-v5 aria-pressed="'+(mode==="v5")+'">Mapa V5</button>'+
 '<button type="button" data-gm-google aria-pressed="'+(mode==="google")+'">Google Maps</button></div>'+
 (!key?'<label class="gg-maps-key">Clave Google Maps restringida al sitio <input id="gg-google-api-key" type="password" autocomplete="off" placeholder="API key (solo esta sesión)"/></label>'+
 '<label class="gg-maps-key">Map ID <input id="gg-google-map-id" value="DEMO_MAP_ID" autocomplete="off" placeholder="Map ID"/></label>':'')+
 (mode==="google"?'<div class="gg-maps-tools"><button type="button" data-gm-inspect>Analizar distrito</button>'+
 '<select id="gg-place-type" aria-label="Tipo de establecimiento"><option value="restaurant">Restaurantes</option><option value="store">Tiendas</option></select>'+
 '<button type="button" data-gm-places>Explorar lugares (Places)</button>'+
 '<button type="button" data-gm-route>Ruta entre puntos SBS</button></div>':'')+
 '<p class="gg-maps-disclaimer" id="gg-maps-status">'+
 (key?"Google Maps configurado. Consultas Places y Routes solo se ejecutan al pulsar sus botones.":"Para activar Google Maps debes ingresar una clave con Maps JavaScript API habilitada, facturación y restricciones HTTP referrer.")+
 '</p><div id="gg-google-places-results" aria-live="polite"></div></div>';
}
async function searchPlaces(){
 if(!active)return alertMessage("Activa Google Maps antes de consultar lugares.");
 const selected=coord(DATA.find(x=>x.ubigeo===String(state.selected)));
 if(!selected)return alertMessage("Selecciona un distrito con coordenada SBS referencial.");
 alertMessage("Consultando Places API (New), bajo demanda. Esta consulta puede generar cargos.");
 try{
  const {Place,SearchNearbyRankPreference}=await window.google.maps.importLibrary("places");
  const type=document.getElementById("gg-place-type")?.value||"restaurant";
  const {places=[]}=await Place.searchNearby({
   fields:["displayName","location","formattedAddress","googleMapsURI"],
   locationRestriction:{center:selected,radius:1600},
   includedPrimaryTypes:[type],maxResultCount:5,
   rankPreference:SearchNearbyRankPreference.POPULARITY
  });
  for(const m of placesMarkers)m.map=null;placesMarkers=[];
  const root=document.getElementById("gg-google-places-results");
  if(root)root.innerHTML='<strong>Google Places — resultados actuales por proximidad</strong><p>Son lugares publicados en Google, no licencias municipales ni clientes identificados de Caja Trujillo.</p>'+
   (places.length?'<ol>'+places.map(p=>'<li>'+safe(p.displayName||"Establecimiento")+
     (p.googleMapsURI? ' · <a href="'+safe(p.googleMapsURI)+'" target="_blank" rel="noopener noreferrer">Ver en Google Maps</a>':"")+
     '</li>').join("")+'</ol>':'<p>Sin resultados para la búsqueda seleccionada.</p>');
  for(const p of places){
   if(p.location)placesMarkers.push(new active.mark({map:active.map,position:p.location,title:p.displayName||"Lugar Google Places"}));
  }
  alertMessage(places.length+" lugares obtenidos bajo demanda con Places. Verificar cada negocio antes de considerar cualquier campaña.");
 }catch(e){alertMessage("Places no disponible. Verifica Places API (New) y facturación: "+e.message);}
}
async function route(){
 if(!active)return alertMessage("Activa Google Maps antes de calcular una ruta.");
 const start=coord(DATA.find(x=>x.ubigeo===String(state.selected))),end=coord(target);
 if(!start||!end||String(state.selected)===String(target?.ubigeo))
  return alertMessage("Selecciona un distrito de origen y después otro marcador SBS de destino.");
 alertMessage("Consultando Routes API bajo demanda. La ruta es entre coordenadas medias SBS, no entre negocios.");
 try{
  const {Route}=await window.google.maps.importLibrary("routes");
  const {routes=[]}=await Route.computeRoutes({origin:start,destination:end,travelMode:"DRIVING",fields:["path"]});
  for(const l of routeLines)l.setMap(null);
  routeLines=routes[0]?.createPolylines()||[];
  routeLines.forEach(line=>line.setMap(active.map));
  alertMessage(routes.length?"Ruta referencial calculada con Routes. No equivale a una ruta real de visitas a negocios.":"No hay ruta disponible entre estas coordenadas.");
 }catch(e){alertMessage("Routes no disponible. Verifica Routes API y facturación: "+e.message);}
}
const style=document.createElement("style");
style.textContent=".gg-maps-toolbar{border:1px solid #cadfed;border-radius:12px;background:#f3f9fe;padding:12px;margin:0 0 13px;display:grid;gap:9px}.gg-maps-toolbar b{color:#244e71;font-size:12px}.gg-maps-toolbar small{font-size:10px;color:#617d95}.gg-maps-tools{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.gg-maps-tools button{background:white;border:1px solid #bcd1e5;color:#255b8b;padding:7px 11px;border-radius:8px;font-size:11px;cursor:pointer;font-weight:700}.gg-maps-tools button[aria-pressed=true]{background:#1f5b92;color:#fff}.gg-maps-tools select{padding:6px;border:1px solid #c5d8e8;border-radius:7px;font-size:11px}.gg-maps-key{font-size:11px;color:#456d8c;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.gg-maps-key input{padding:7px;border:1px solid #bdd4e5;border-radius:7px;font-size:11px;min-width:170px}.gg-maps-disclaimer{font-size:11px;color:#476d8b;line-height:1.6;margin:0}.gg-google-map-canvas{height:330px;min-height:290px;width:100%;border-radius:11px}.gg-google-map-note{font-size:10px;line-height:1.6;color:#5f7690;margin-top:7px}.gg-maps-toolbar ol{margin:7px 0 0;padding-left:21px;font-size:11px;color:#4c6680}.gg-maps-toolbar li{margin:7px 0}.gg-maps-toolbar a{color:#2965a3}";
document.head.appendChild(style);
const prev=render;
render=function(){
 prev();
 if(state.view!=="work")return;
 const shell=document.getElementById("v9-safe-map");
 if(!shell)return;
 const grid=shell.querySelector(".v9-extra-grid");
 if(grid)grid.insertAdjacentHTML("beforebegin",toolbox());
 if(mode==="google"&&key)void mount();
};
document.addEventListener("click",event=>{
 const button=event.target.closest("[data-gm-google],[data-gm-v5],[data-gm-inspect],[data-gm-places],[data-gm-route]");
 if(!button)return;
 event.preventDefault();event.stopImmediatePropagation();
 if(button.hasAttribute("data-gm-v5")){
   mode="v5";++seq;clearDynamic();render();return;
 }
 if(button.hasAttribute("data-gm-google")){
   if(!key){const provided=document.getElementById("gg-google-api-key")?.value?.trim();
     if(!provided)return alertMessage("Introduce una API key de Maps JS restringida a este dominio; no se guarda.");
     key=provided;mapId=document.getElementById("gg-google-map-id")?.value?.trim()||"DEMO_MAP_ID";
   }
   mode="google";render();return;
 }
 if(button.hasAttribute("data-gm-inspect")){
  if(target)selectDistrict(target.ubigeo);else alertMessage("Haz clic en un marcador de Google Maps para elegir distrito.");
 }
 if(button.hasAttribute("data-gm-places"))void searchPlaces();
 if(button.hasAttribute("data-gm-route"))void route();
},true);
window.GeoGrowthGoogleMaps={
 libraries:libraryPlan,
 get mode(){return mode;},
 get enabled(){return Boolean(key)&&mode==="google";},
 validCoordinate:coord,
 // Modo de configuración de prueba: nunca publica la clave en el repositorio.
 activateForTest(apiKey,configuredMapId="DEMO_MAP_ID"){key=apiKey;mapId=configuredMapId;mode="google";render();}
};
render();
})();
