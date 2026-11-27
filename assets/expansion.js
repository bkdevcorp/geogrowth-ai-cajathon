/* Independent expansion screen; existing map and campaign state remain unchanged. */
(function(){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>n==null?"N/D":Number(n).toLocaleString("es-PE");
const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||"")?s.split("-").reverse().join("/"):s||"Sin fecha";
const searchUrl=q=>"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q);
let promise=null,googleLoad=null,apiKey="",authFailed=false;
function shared(){return window.GeoGrowthGoogleV11?.config()||{};}
function data(){return promise||(promise=fetch("data/licencias_san_martin.json?v=2").then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).catch(e=>{promise=null;throw e}));}
function loadGoogle(key){
 if(window.GeoGrowthGoogleV11)return window.GeoGrowthGoogleV11.load();
 if(window.google?.maps?.importLibrary)return Promise.resolve(window.google.maps);
 if(googleLoad)return googleLoad;
 googleLoad=new Promise((resolve,reject)=>{
  const s=document.createElement("script"),cb="__ggExpansionMapsReady";
  const fail=()=>{delete window[cb];s.remove();googleLoad=null;reject(Error("No se pudo cargar Google Maps."))};
  window[cb]=()=>{delete window[cb];resolve(window.google.maps)};
  s.src="https://maps.googleapis.com/maps/api/js?loading=async&v=weekly&key="+encodeURIComponent(key)+"&callback="+cb;
  s.async=true;s.onerror=fail;document.head.appendChild(s);
 });return googleLoad;
}
function shell(){return '<div class="page-head"><div><span class="eyebrow">Prospección · Señales de crecimiento</span><h1>Expansión comercial</h1><p class="subtitle">Consulta licencias reales e identifica posibles nuevos locales. Verifica la actividad antes de contactar.</p></div><span class="badge">Piloto San Martín</span></div><section id="gg-expansion" aria-live="polite"><div class="card">Cargando evidencia municipal…</div></section>';}
function mount(){const host=document.getElementById("gg-expansion");if(!host)return;data().then(d=>{if(host.isConnected)show(host,d)}).catch(e=>{if(host.isConnected)host.innerHTML='<div class="card">No se pudo cargar la fuente: '+esc(e.message)+'</div>'});}
function show(host,pack){
 const districts=pack.distritos;let d=districts[0],filtered=[],page=0,mode="expansion",map=null,marker=null,info=null,seq=0,selected=null,searchPins=[];
 const $=id=>host.querySelector("#"+id);
 const options=a=>a.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join("");
 const kpi=(v,l)=>'<div class="kpi"><b>'+fmt(v)+'</b><small>'+esc(l)+'</small></div>';
 host.innerHTML=`<section class="card"><div class="card-header"><div><h2>Buscar oportunidades y licencias</h2><p>Dos fuentes municipales reales de San Martín; cobertura y fechas según cada archivo.</p></div></div>
 <form id="gg-expansion-form"><div class="form-grid">
 <div class="field"><label for="ex-region">Región</label><select id="ex-region"><option>San Martín</option></select></div>
 <div class="field"><label for="ex-province">Provincia</label><select id="ex-province">${options(districts.map(x=>x.provincia))}</select></div>
 <div class="field"><label for="ex-district">Distrito</label><select id="ex-district"></select></div>
 <div class="field"><label for="ex-type">Tipo de consulta</label><select id="ex-type"><option value="expansion">Posible expansión comercial</option><option value="licenses">Todas las licencias / registros</option></select></div>
 <div class="field"><label for="ex-year">Año de licencia</label><select id="ex-year"></select></div>
 <div class="field"><label for="ex-from">Desde (fecha exacta)</label><input id="ex-from" type="date"></div>
 <div class="field"><label for="ex-to">Hasta (fecha exacta)</label><input id="ex-to" type="date"></div>
 <div class="field"><label for="ex-sector">Sector</label><select id="ex-sector"></select></div>
 <div class="field"><label for="ex-query">Buscar nombre o dirección comercial</label><input id="ex-query" type="search" placeholder="Nombre, dirección o código"></div>
 </div><div class="actions-row"><button class="btn primary" id="ex-search" type="submit">Buscar oportunidades</button></div><p class="muted">Con Google Maps activo, Buscar geocodifica hasta 10 direcciones municipales por solicitud (pueden consumir cuota). Los registros sin ubicación siguen en la tabla.</p><p id="ex-error" class="muted" role="status"></p><div id="ex-search-feedback" role="status" aria-live="polite" style="display:none;margin-top:12px;padding:12px 14px;background:#edf8f4;border:1px solid #cdece2;border-radius:10px;color:#225b50"></div></form></section>
 <section class="card" id="expected-result"><span class="eyebrow">Resultado esperado · 02</span><h2>Posible local adicional</h2><p id="ex-outcome" role="status"></p><p class="muted">Acción ADN: verificar si ambas ubicaciones son del mismo negocio y si el local anterior sigue activo; distinguir traslado, sucursal o duplicado.</p><div class="actions-row"><button type="button" class="btn primary" id="ex-case">Ver caso sustentado</button></div></section><div id="ex-kpi" class="kpi-grid"></div>
 <section class="card" id="ex-map-card"><div class="card-header"><div><h2>Mapa comercial</h2><p id="ex-map-caption">Referencia territorial; selecciona Localizar en un registro.</p></div><span class="badge" id="ex-map-badge">Sin coordenadas precargadas</span></div>
 <div id="ex-diagnostic" role="status" style="margin:0 0 12px;padding:10px 12px;background:#f4f7fb;border:1px solid #dce6ee;border-radius:8px;font-size:13px">Pulsa Buscar para consultar los registros filtrados.</div><div id="ex-map" style="min-height:360px;border:1px solid #dce6ee;border-radius:12px;overflow:hidden"></div>
 <div class="actions-row"><a class="btn" id="ex-open" target="_blank" rel="noopener noreferrer">Abrir en Google Maps</a><input id="ex-key" type="hidden"><button type="button" class="btn" id="ex-config">Configuración API</button><button id="ex-google" type="button" class="btn">Activar Google Maps</button></div><p class="muted" id="ex-map-status"></p></section>
 <section class="card" id="ex-results-card" tabindex="-1"><div class="card-header"><div><h2 id="ex-title">Resultados</h2><p id="ex-count"></p></div><button class="btn small" type="button" id="ex-export">Exportar resultados JSON</button></div><div id="ex-results"></div><div class="actions-row"><button class="btn small" id="ex-prev" type="button">Anterior</button><span id="ex-page"></span><button class="btn small" id="ex-next" type="button">Siguiente</button></div><div id="ex-detail" tabindex="-1"></div></section>
 <section class="card"><h2>Fuente y metodología</h2><p>${esc(pack.metodo)}</p><p class="muted" id="ex-source-info"></p><a id="ex-source" class="btn" target="_blank" rel="noopener noreferrer">Consultar fuente oficial</a></section>`;
 function territoryQuery(){return d.distrito+", "+d.provincia+", San Martín, Perú";}
 function iframe(src,title){const f=document.createElement("iframe");f.title=title;f.width="100%";f.height="360";f.style.cssText="border:0;display:block";f.src=src;$("ex-map").replaceChildren(f);}
 function resetMap(){seq++;selected=null;clearSearchPins();$("ex-diagnostic").textContent="Pulsa Buscar para consultar los registros filtrados.";marker?.setMap(null);marker=null;info?.close();info=null;
  $("ex-open").href=searchUrl(territoryQuery());$("ex-map-caption").textContent=d.distrito+" · referencia territorial SBS; no es un domicilio comercial.";$("ex-map-badge").textContent="Sin coordenadas precargadas";
  if(map&&!authFailed){map.setCenter(d.ref);map.setZoom(13);$("ex-map-status").textContent="Google Maps activo. Pulsa Buscar para geocodificar direcciones.";}
  else{$("ex-map").textContent="Configura Google Maps en la cabecera para mostrar el territorio.";$("ex-map-status").textContent="Google Maps es la única cartografía comercial."}
 }
 function clearSearchPins(){for(const p of searchPins)p.setMap(null);searchPins=[];}
 function normalizeName(s){return String(s||"").normalize("NFD").replace(/\p{M}/gu,"").toUpperCase().replace(/[^A-Z0-9]+/g," ").trim();}
 function nameKey(s){return normalizeName(s).replace(/\b(S A C|S A|S R L|E I R L|SAC|SA|SRL|EIRL)\b/g,"").replace(/\s+/g," ").trim();}
 function streetKey(s){return normalizeName(s).replace(/\b(AVENIDA|AV)\b/g,"AV").replace(/\b(JIRON|JR)\b/g,"JR").replace(/\b(CALLE|CL)\b/g,"CL").replace(/\b(NUMERO|NRO|NO|N)\b/g,"").replace(/\s+/g," ").trim();}
 function addressMatch(a,b){const x=streetKey(String(a||"").split(" - ")[0]),y=streetKey(b);return x.length>5&&(" "+y+" ").includes(" "+x+" ");}
 function nameRelated(a,b){const x=nameKey(a),y=nameKey(b);return !!x&&!!y&&(x===y||(x.length>=8&&(" "+y+" ").includes(" "+x+" ")));}
 function safeError(e){const raw=[e?.code,e?.status,e?.message,e?.name].filter(Boolean).join(" ");const codes=raw.match(/\b(PERMISSION_DENIED|REQUEST_DENIED|RESOURCE_EXHAUSTED|OVER_QUERY_LIMIT|INVALID_ARGUMENT|API_KEY_SERVICE_BLOCKED|API_KEY_INVALID|SERVICE_DISABLED|UNAUTHENTICATED|ZERO_RESULTS|NOT_FOUND|DEADLINE_EXCEEDED|UNKNOWN_ERROR|INTERNAL|UNAVAILABLE|429|403|400)\b/gi);if(codes)return [...new Set(codes.map(x=>x.toUpperCase()))].join(" / ");if(/quota|rate limit/i.test(raw))return "CUOTA_AGOTADA";if(/denied|not authorized|not enabled|blocked/i.test(raw))return "AUTORIZACION_DENEGADA";if(/not a constructor|not a function/i.test(raw))return "FUNCION_NO_DISPONIBLE";return e?.name==="TypeError"?"TYPE_ERROR":"ERROR_API";}
 async function resolveBusiness(x,territory,districtName,ref){
  if(x.direccion&&window.GeoGrowthGoogleV11){const hit=await window.GeoGrowthGoogleV11.geocodeRecord(x,territory.replace(/, Perú$/,""));return hit||{received:0,reason:"Dirección municipal sin geocodificación suficientemente precisa"};}
  if(window.GeoGrowthGoogleV11)return {received:0,reason:"Sin dirección individual; Places queda pendiente"};
  const {Place}=await google.maps.importLibrary("places");
  // Short text query avoids duplicating municipality, neighbourhood and legal suffixes.
  const textQuery=[x.nombre||x.direccion,territory].filter(Boolean).join(", ");
  const response=await Place.searchByText({textQuery,fields:["displayName","formattedAddress","location"],maxResultCount:5,language:"es",region:"pe",locationBias:ref});
  const places=response.places||[];
  const local=places.filter(p=>p.location&&normalizeName(p.formattedAddress).includes(districtName));
  const named=x.nombre?local.filter(p=>nameRelated(x.nombre,p.displayName)):[];
  const exact=named.filter(p=>addressMatch(x.direccion,p.formattedAddress));
  if(exact.length===1)return {position:exact[0].location,address:exact[0].formattedAddress,label:"Coincidencia de nombre y dirección en Google Places",matched:true,received:places.length};
  if(!x.nombre){const matches=local.filter(p=>addressMatch(x.direccion,p.formattedAddress));if(matches.length===1)return {position:matches[0].location,address:matches[0].formattedAddress,label:"Coincidencia de dirección; identidad del local por verificar",matched:false,received:places.length};}
  if(named.length===1)return {position:named[0].location,address:named[0].formattedAddress,label:x.direccion?"Coincidencia por nombre; dirección de la licencia NO confirmada":"Coincidencia por nombre; sin dirección municipal publicable",matched:false,received:places.length};
  return {received:places.length,local:local.length,reason:places.length?"Sin coincidencia identificable en el distrito":"Google no devolvió establecimientos"};
 }
 async function mapResults(rows){
  const token=++seq;selected=null;clearSearchPins();marker?.setMap(null);marker=null;info?.close();info=null;
  const current=map,territory=territoryQuery(),districtName=normalizeName(d.distrito),ref=d.ref;
  const available=rows.filter(x=>x.nombre||x.direccion), unique=[...new Map(available.map(x=>[normalizeName(x.direccion||x.nombre),x])).values()], batch=unique.slice(0,10);
  $("ex-map-caption").textContent=d.distrito+" · "+fmt(rows.length)+" registros filtrados";
  $("ex-open").href=searchUrl(territory);
  if(!current||authFailed){$("ex-diagnostic").textContent="Activa Google Maps para localizar establecimientos.";$("ex-map-status").textContent=fmt(available.length)+" registros con información comercial buscable. Activa Google Maps para colocar marcadores, o pulsa Localizar.";return;}
  current.setCenter(ref);current.setZoom(13);
  $("ex-map-badge").textContent="Buscando ubicaciones…";$("ex-diagnostic").textContent="Geocodificando direcciones municipales…";
  $("ex-map-status").textContent="Consultando Google: "+batch.length+" búsquedas como máximo. "+(rows.length-available.length)+" registros sin datos comerciales publicables.";
  if(!batch.length){$("ex-diagnostic").textContent="No hay registros con datos comerciales publicables.";$("ex-map-badge").textContent="0 ubicaciones";$("ex-map-status").textContent="No hay nombre ni dirección comercial publicable en los resultados. No se pueden dibujar marcadores.";return;}
  let found=0,failed=0,apiErrors=0,attempted=0,confirmed=0,received=0;const errors=new Set(),details=[];
  try{
   const markerLib=await google.maps.importLibrary("marker"),mapsLib=await google.maps.importLibrary("maps");const Marker=markerLib.Marker||google.maps.Marker,InfoWindow=mapsLib.InfoWindow||google.maps.InfoWindow;const bounds=new google.maps.LatLngBounds();
   for(const x of batch){
    if(token!==seq||!host.isConnected||authFailed)return;
    let result=null;attempted++;
    try{result=await resolveBusiness(x,territory,districtName,ref);received+=result.received||0;details.push([x.nombre||x.id,result.position?result.label:result.reason+" ("+result.received+" resultados de Google)"]);}
    catch(err){apiErrors++;const code=safeError(err);errors.add(code);details.push([x.nombre||x.id,code]);if(/PERMISSION_DENIED|REQUEST_DENIED|SERVICE_DISABLED|API_KEY|RESOURCE_EXHAUSTED|OVER_QUERY_LIMIT|UNAUTHENTICATED|403|429/.test(code))break;}
    const {position,address,label,matched}=result||{};
    if(token!==seq||!host.isConnected||authFailed)return;
    if(!position){failed++;continue;}
    const pin=new Marker({map:current,position,title:(x.nombre||x.id)+(matched?"":" · por verificar"),label:matched?undefined:"?"});searchPins.push(pin);bounds.extend(position);found++;if(matched)confirmed++;
    pin.addListener("click",()=>{info?.close();info=new InfoWindow({content:"<b>"+esc(x.nombre||x.id)+"</b><p>"+esc(address)+"</p><small>"+esc(label)+"; vigencia y actividad por verificar.</small>"});info.open({map:current,anchor:pin});});
   }
   if(found===1){current.setCenter(searchPins[0].getPosition());current.setZoom(16);}else if(found>1)current.fitBounds(bounds,60);
  }catch(err){apiErrors++;errors.add(safeError(err));}
  if(token!==seq||!host.isConnected||authFailed)return;
  $("ex-map-badge").textContent=found+" ubicaciones encontradas";$("ex-diagnostic").innerHTML="<b>"+found+" marcadores · "+attempted+" solicitudes · "+received+" resultados devueltos por Google · "+apiErrors+" errores</b>"+(apiErrors?"<p>Diagnóstico: "+esc([...errors].join(", "))+"</p>":"")+(details.length?"<details open><summary>Ver resultado por negocio</summary>"+details.map(([n,v])=>"<div>"+esc(n)+" — "+esc(v)+"</div>").join("")+"</details>":"");
  $("ex-map-status").textContent=found+" marcadores ("+confirmed+" con nombre y dirección coincidentes; "+(found-confirmed)+" por verificar) de "+attempted+" consultas de geocodificación; "+failed+" sin coincidencia. "+(apiErrors?"Errores: "+[...errors].join(", ")+". Revisa Places API (New), autorización y cuota. ":"")+(unique.length>10?"Límite de 10 por búsqueda; usa Localizar para los demás. ":"")+(rows.length-available.length)+" registros sin datos comerciales publicables. Los marcadores no confirman actividad ni apertura.";
 }
 function query(x){return [x.nombre,x.direccion,territoryQuery()].filter(Boolean).join(", ");}
 function fallback(x,message){clearSearchPins();map=null;marker=null;info=null;const q=query(x);
  iframe("https://maps.google.com/maps?q="+encodeURIComponent(q)+"&output=embed","Búsqueda en Google Maps: "+(x.nombre||x.id));
  $("ex-map-badge").textContent="Búsqueda, no ubicación verificada";$("ex-map-status").textContent=message+" Si la vista integrada no carga, pulsa «Abrir en Google Maps».";
 }
 async function locate(x){clearSearchPins();const token=++seq;selected=x;const q=query(x);
  $("ex-map-card").scrollIntoView({behavior:"smooth",block:"start"});$("ex-open").href=searchUrl(q);$("ex-map-caption").textContent=(x.nombre||x.id)+(x.direccion?" · "+x.direccion:"")+" · "+d.distrito;
  if(!x.nombre&&!x.direccion){$("ex-map-status").textContent="No hay nombre o dirección comercial publicable para este registro.";return;}
  if(!map||authFailed){fallback(x,"Búsqueda por nombre o dirección comercial publicada. El resultado debe verificarse.");return;}
  $("ex-map-status").textContent="Geocodificando dirección municipal…";marker?.setMap(null);marker=null;info?.close();
  try{const hit=await resolveBusiness(x,territoryQuery(),normalizeName(d.distrito),d.ref);
   if(token!==seq||!host.isConnected)return;
   if(!hit?.position){$("ex-map-badge").textContent="Sin coincidencia";$("ex-map-status").textContent="Google Places no devolvió una coincidencia suficientemente identificable. Usa Abrir en Google Maps para verificar manualmente.";return;}
   const {Marker}=await google.maps.importLibrary("marker");const {InfoWindow}=await google.maps.importLibrary("maps");if(token!==seq||!host.isConnected)return;
   map.setCenter(hit.position);map.setZoom(17);marker=new Marker({map,position:hit.position,title:x.nombre||x.id,label:hit.matched?undefined:"?"});info=new InfoWindow({content:"<b>"+esc(x.nombre||x.id)+"</b><p>"+esc(hit.address)+"</p><small>"+esc(hit.label)+"; negocio y vigencia por verificar.</small>"});info.open({map,anchor:marker});$("ex-map-badge").textContent=hit.matched?"Nombre y dirección coincidentes":"Ubicación por verificar";$("ex-map-status").textContent=hit.label+": "+hit.address+". No confirma actividad ni presencia actual.";
  }catch(e){if(token===seq&&host.isConnected){$("ex-map-badge").textContent="Error de consulta";$("ex-map-status").textContent="Google Maps: "+safeError(e)+". Revisa autorización y cuota, o pulsa Abrir en Google Maps.";}}
 }
 function fields(){const list=mode==="expansion"?d.candidatos:d.registros;const years=[...new Set(list.map(x=>x.anio||x.fecha_nueva?.slice(0,4)).filter(Boolean))].sort().reverse();
  $("ex-year").innerHTML='<option value="">Todos los años</option>'+options(years);$("ex-sector").innerHTML='<option value="">Todos</option>'+options([...new Set(list.map(x=>x.sector))].sort());
  const exact=d.expansion_disponible;$("ex-from").disabled=!exact;$("ex-to").disabled=!exact;$("ex-from").value=mode==="expansion"?"2026-01-01":"";$("ex-to").value=mode==="expansion"?d.corte:"";$("ex-query").value="";
  $("ex-source").href=d.url;$("ex-source-info").textContent=d.fuente+" · "+d.inicio+" a "+d.corte+". "+(!exact?"Directorio de restaurantes y hospedajes; año de emisión sin fecha exacta, sin historial suficiente para medir expansión.":"Licencias de funcionamiento; una dirección nueva es señal, no prueba de apertura.");
 }
 function history(x){return d.registros.filter(y=>x.nombre&&y.nombre&&nameKey(y.nombre)===nameKey(x.nombre)&&y.direccion&&y.fecha&&y.fecha<x.fecha_nueva).sort((a,b)=>b.fecha.localeCompare(a.fecha));}
 function draw(){const start=page*25,rows=filtered.slice(start,start+25);const example=filtered.find(x=>nameKey(x.nombre)==="HUELLITAS DE AMOR"&&history(x).length)||filtered.find(x=>x.direccion&&history(x).some(y=>streetKey(y.direccion)!==streetKey(x.direccion)))||filtered[0];
 $("ex-outcome").textContent=mode==="expansion"?fmt(filtered.length)+" posibles expansiones en "+d.distrito+"; evidencia histórica por fecha y direcciones. No son sucursales confirmadas.":fmt(filtered.length)+" registros; esta fuente no acredita historial de expansión.";
 $("ex-case").disabled=!example;$("ex-case").onclick=()=>{page=Math.floor(filtered.indexOf(example)/25);draw();host.querySelector('[data-ex-detail="'+example.id+'"]')?.click();$("ex-detail").scrollIntoView({block:"center"});};
  $("ex-title").textContent=mode==="expansion"?"Candidatos identificados":"Registros municipales";$("ex-count").textContent=fmt(filtered.length)+" resultados · "+d.distrito+" · nombres y direcciones sujetos a disponibilidad y minimización de datos.";
  $("ex-results").innerHTML='<div class="tablewrap"><table><thead><tr><th>Negocio / registro</th><th>Sector</th><th>Fecha o año</th><th>'+ (mode==="expansion"?"Direcciones anteriores + nuevas":"Dirección comercial")+'</th><th>Acciones</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><strong>'+esc(x.nombre||x.id)+'</strong><small style="display:block">'+esc(x.id)+'</small></td><td>'+esc(x.sector)+'</td><td>'+esc(date(x.fecha_nueva||x.fecha||x.anio))+'</td><td>'+esc(mode==="expansion"?x.direcciones_anteriores+" + "+x.direcciones_nuevas:x.direccion||"No disponible")+'</td><td><div class="actions-row" style="margin:0"><button class="btn small" type="button" data-ex-detail="'+esc(x.id)+'">Ver evidencia</button><button class="btn small" type="button" data-lead="'+esc(x.licencia_id||x.id)+'">Opportunity Brief</button><button class="btn small" type="button" data-ex-locate="'+esc(x.id)+'" '+(x.nombre||x.direccion?'':'disabled title="Sin ubicación comercial publicable"')+'>Localizar</button></div></td></tr>').join("")+'</tbody></table></div>'+(!rows.length?'<div class="blank">Sin resultados para estos filtros.</div>':"");
  $("ex-page").textContent=fmt(filtered.length?start+1:0)+"–"+fmt(Math.min(start+25,filtered.length))+" de "+fmt(filtered.length);$("ex-prev").disabled=!page;$("ex-next").disabled=start+25>=filtered.length;$("ex-export").disabled=!filtered.length;
 }
 function run(e){e?.preventDefault();$("ex-search-feedback").style.display="none";const from=$("ex-from").value,to=$("ex-to").value,year=$("ex-year").value,sector=$("ex-sector").value,q=$("ex-query").value.trim().toLowerCase();if(from&&to&&from>to){$("ex-error").textContent="Selecciona un rango válido.";return;}
  $("ex-error").textContent=(!d.expansion_disponible?"Fuente sectorial: sin historial para calcular expansión.":"");const list=mode==="expansion"?d.candidatos:d.registros;
  filtered=list.filter(x=>{const f=x.fecha_nueva||x.fecha;return (!year||(x.anio||f?.slice(0,4))===year)&&(!from||f&&f>=from)&&(!to||f&&f<=to)&&(!sector||x.sector===sector)&&(!q||[x.nombre,x.direccion,x.id].filter(Boolean).join(" ").toLowerCase().includes(q));});
  $("ex-kpi").innerHTML=kpi(filtered.length,mode==="expansion"?"Candidatos en el filtro":"Registros en el filtro")+kpi(d.expansion_disponible?d.ruc_multidireccion:null,"RUC multidirección · histórico")+kpi(d.expansion_disponible?d.ruc_analizados:null,"RUC analizados · histórico")+kpi(d.licencias,"Registros de la fuente");page=0;$("ex-detail").innerHTML="";draw();const feedback=$("ex-search-feedback");feedback.style.display="block";feedback.textContent=(filtered.length?fmt(filtered.length)+" resultados encontrados":"No se encontraron resultados")+" en "+d.distrito+" con los filtros seleccionados." ;if(e){const target=map&&!authFailed?$("ex-map-card"):$("ex-results-card");target.scrollIntoView({behavior:"smooth",block:"start"});mapResults(filtered);}else{resetMap();}
 }
 function district(){d=districts.find(x=>x.provincia===$("ex-province").value)||districts[0];$("ex-district").innerHTML='<option value="'+esc(d.ubigeo)+'">'+esc(d.distrito)+" · "+esc(d.ubigeo)+'</option>';
  $("ex-type").options[0].disabled=!d.expansion_disponible;if(!d.expansion_disponible)mode="licenses";$("ex-type").value=mode;fields();resetMap();run();}
 $("ex-province").addEventListener("change",district);$("ex-type").addEventListener("change",()=>{mode=$("ex-type").value;fields();run()});
 host.querySelector("form").addEventListener("submit",run);for(const id of ["ex-year","ex-sector","ex-from","ex-to"]){$(id).addEventListener("change",()=>run());}$("ex-prev").addEventListener("click",()=>{if(page){page--;draw()}});$("ex-next").addEventListener("click",()=>{if((page+1)*25<filtered.length){page++;draw()}});
 host.addEventListener("click",e=>{const b=e.target.closest("[data-ex-detail],[data-ex-locate]");if(!b)return;const x=filtered.find(r=>r.id===(b.dataset.exDetail||b.dataset.exLocate));if(!x)return;if(b.dataset.exLocate){locate(x);return;}
  $("ex-detail").innerHTML='<div class="signal" style="margin-top:16px"><h3>'+esc(x.nombre||x.id)+' · Evidencia municipal</h3><p>'+esc(x.direccion||"Dirección no disponible para publicación.")+'</p><p>'+esc(mode==="expansion"?"Última licencia anterior: "+date(x.fecha_anterior)+" · Nueva dirección observada: "+date(x.fecha_nueva)+". Direcciones anteriores: "+x.direcciones_anteriores+"; nuevas: "+x.direcciones_nuevas+".":"Fecha o año de emisión: "+date(x.fecha||x.anio)+" · "+x.tipo)+'</p><h4>Historial de direcciones publicables</h4>'+(mode==="expansion"?(history(x).length?history(x).map(y=>'<p>'+esc(date(y.fecha))+' · '+esc(y.direccion)+'</p>').join(""):'<p>Dirección anterior no publicable o no vinculable por nombre.</p>')+'<p><b>Nueva dirección:</b> '+esc(x.direccion||"No disponible")+'</p><p class="muted">Coincidencia de nombre en registros públicos, no prueba de identidad ni sucursal. Ubicación pendiente de contraste.</p>':"")+'<p><b>Fuente:</b> '+esc(d.fuente)+'</p><p><b>Próxima acción:</b> verificar actividad, vigencia y necesidad comercial; no constituye precalificación.</p></div>';$("ex-detail").focus();
 });
 $("ex-export").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({schema:pack.schema,ubigeo:d.ubigeo,fuente:d.url,corte:d.corte,tipo:mode,registros:filtered},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="licencias_"+d.ubigeo+".json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)});
 $("ex-google").addEventListener("click",async()=>{const key=shared().GOOGLE_MAPS_API_KEY||apiKey;if(!key){window.GeoGrowthGoogleV11?.openConfig();return;}$("ex-key").value="";$("ex-google").disabled=true;authFailed=false;
  window.gm_authFailure=()=>{authFailed=true;if(!host.isConnected)return;const prior=selected;map=null;apiKey="";if(prior)fallback(prior,"Google rechazó la clave o su autorización.");else{resetMap();$("ex-map-status").textContent="Google rechazó la clave o su autorización. Revisa la consola y recarga antes de probar otra clave.";}};
  try{const maps=await loadGoogle(key);const {Map}=await maps.importLibrary("maps");if(!host.isConnected||authFailed)return;apiKey=key;try{sessionStorage.setItem("geogrowth.maps.config.v1",JSON.stringify({...shared(),GOOGLE_MAPS_API_KEY:key}));}catch(_){}const canvas=document.createElement("div");canvas.style.height="360px";$("ex-map").replaceChildren(canvas);map=new Map(canvas,{center:d.ref,zoom:13,mapTypeId:"roadmap",mapTypeControl:true,streetViewControl:false});$("ex-map-status").textContent="Solicitando Google Maps; si la autenticación falla se restaura el mapa de respaldo.";if(selected)locate(selected);}
  catch(e){map=null;const prior=selected;if(prior)fallback(prior,"No se pudo activar Google Maps.");else{resetMap();$("ex-map-status").textContent="No se pudo activar Google Maps; comprueba la clave y restricciones.";}}
  finally{if(host.isConnected)$("ex-google").disabled=false;}
 });
 $("ex-config").onclick=()=>window.GeoGrowthGoogleV11?.openConfig();
 district();
 if(shared().GOOGLE_MAPS_API_KEY)$("ex-google").click();
}
window.GeoGrowthExpansion={shell,mount};
})();
