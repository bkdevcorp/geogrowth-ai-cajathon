/* Independent expansion screen; existing map and campaign state remain unchanged. */
(function(){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>n==null?"N/D":Number(n).toLocaleString("es-PE");
const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||"")?s.split("-").reverse().join("/"):s||"Sin fecha";
const searchUrl=q=>"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q);
let promise=null,googleLoad=null,apiKey="",authFailed=false;
function data(){return promise||(promise=fetch("data/licencias_san_martin.json?v=2").then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).catch(e=>{promise=null;throw e}));}
function loadGoogle(key){
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
 </div><div class="actions-row"><button class="btn primary" id="ex-search" type="submit">Buscar oportunidades</button></div><p class="muted">Con Google Maps activo, Buscar realiza hasta 10 consultas de Geocoding / Places por solicitud (pueden consumir cuota). Los registros sin ubicación siguen en la tabla.</p><p id="ex-error" class="muted" role="status"></p><div id="ex-search-feedback" role="status" aria-live="polite" style="display:none;margin-top:12px;padding:12px 14px;background:#edf8f4;border:1px solid #cdece2;border-radius:10px;color:#225b50"></div></form></section>
 <div id="ex-kpi" class="kpi-grid"></div>
 <section class="card" id="ex-map-card"><div class="card-header"><div><h2>Mapa comercial</h2><p id="ex-map-caption">Referencia territorial; selecciona Localizar en un registro.</p></div><span class="badge" id="ex-map-badge">Sin coordenadas precargadas</span></div>
 <div id="ex-map" style="min-height:360px;border:1px solid #dce6ee;border-radius:12px;overflow:hidden"></div>
 <div class="actions-row"><a class="btn" id="ex-open" target="_blank" rel="noopener noreferrer">Abrir en Google Maps</a><label class="field" style="flex:1;min-width:220px"><span>Clave Google Maps (opcional, solo sesión)</span><input id="ex-key" type="password" autocomplete="off" placeholder="Maps Demo Key o clave restringida"></label><button id="ex-google" type="button" class="btn">Activar Google Maps</button></div><p class="muted" id="ex-map-status"></p></section>
 <section class="card" id="ex-results-card" tabindex="-1"><div class="card-header"><div><h2 id="ex-title">Resultados</h2><p id="ex-count"></p></div><button class="btn small" type="button" id="ex-export">Exportar resultados JSON</button></div><div id="ex-results"></div><div class="actions-row"><button class="btn small" id="ex-prev" type="button">Anterior</button><span id="ex-page"></span><button class="btn small" id="ex-next" type="button">Siguiente</button></div><div id="ex-detail" tabindex="-1"></div></section>
 <section class="card"><h2>Fuente y metodología</h2><p>${esc(pack.metodo)}</p><p class="muted" id="ex-source-info"></p><a id="ex-source" class="btn" target="_blank" rel="noopener noreferrer">Consultar fuente oficial</a></section>`;
 function territoryQuery(){return d.distrito+", "+d.provincia+", San Martín, Perú";}
 function iframe(src,title){const f=document.createElement("iframe");f.title=title;f.width="100%";f.height="360";f.style.cssText="border:0;display:block";f.src=src;$("ex-map").replaceChildren(f);}
 function resetMap(){seq++;selected=null;clearSearchPins();marker?.setMap(null);marker=null;info?.close();info=null;
  $("ex-open").href=searchUrl(territoryQuery());$("ex-map-caption").textContent=d.distrito+" · referencia territorial SBS; no es un domicilio comercial.";$("ex-map-badge").textContent="Sin coordenadas precargadas";
  if(map&&!authFailed){map.setCenter(d.ref);map.setZoom(13);$("ex-map-status").textContent="Google Maps activo. Selecciona un negocio para buscar su dirección.";}
  else{const {lat,lng}=d.ref;iframe("https://www.openstreetmap.org/export/embed.html?bbox="+encodeURIComponent([lng-.04,lat-.04,lng+.04,lat+.04].join(","))+"&layer=mapnik","Mapa territorial de "+d.distrito);$("ex-map-status").textContent="Mapa de respaldo OpenStreetMap. Localizar abre una búsqueda comercial en el mapa.";}
 }
 function clearSearchPins(){for(const p of searchPins)p.setMap(null);searchPins=[];}
 function normalizeName(s){return String(s||"").normalize("NFD").replace(/\p{M}/gu,"").toUpperCase().replace(/[^A-Z0-9]+/g," ").trim();}
 async function mapResults(rows){
  const token=++seq;selected=null;clearSearchPins();marker?.setMap(null);marker=null;info?.close();info=null;
  const current=map,territory=territoryQuery(),districtName=normalizeName(d.distrito),ref=d.ref;
  const available=rows.filter(x=>x.nombre||x.direccion), unique=[...new Map(available.map(x=>[normalizeName(x.direccion||x.nombre),x])).values()], batch=unique.slice(0,10);
  $("ex-map-caption").textContent=d.distrito+" · "+fmt(rows.length)+" registros filtrados";
  $("ex-open").href=searchUrl(territory);
  if(!current||authFailed){$("ex-map-status").textContent=fmt(available.length)+" registros con información comercial buscable. Activa Google Maps para colocar marcadores, o pulsa Localizar.";return;}
  current.setCenter(ref);current.setZoom(13);
  $("ex-map-badge").textContent="Buscando ubicaciones…";
  $("ex-map-status").textContent="Consultando Google: "+batch.length+" búsquedas como máximo. "+(rows.length-available.length)+" registros sin datos comerciales publicables.";
  if(!batch.length){$("ex-map-badge").textContent="0 ubicaciones";$("ex-map-status").textContent="No hay nombre ni dirección comercial publicable en los resultados. No se pueden dibujar marcadores.";return;}
  let found=0,failed=0,apiErrors=0;
  try{
   const {Marker}=await google.maps.importLibrary("marker"),{InfoWindow}=await google.maps.importLibrary("maps"),{LatLngBounds}=await google.maps.importLibrary("core");const bounds=new LatLngBounds();
   for(const x of batch){
    if(token!==seq||!host.isConnected||authFailed)return;
    let position=null,label="",address="";
    try{
     if(x.direccion){
      const {Geocoder}=await google.maps.importLibrary("geocoding"),response=await new Geocoder().geocode({address:x.direccion+", "+territory,region:"pe",componentRestrictions:{country:"PE"}});
      const hit=response.results[0];if(hit&&!hit.partial_match&&["ROOFTOP","RANGE_INTERPOLATED"].includes(hit.geometry.location_type)&&/(street_address|premise|subpremise|establishment)/.test(hit.types.join("|"))&&normalizeName(hit.formatted_address).includes(districtName)){position=hit.geometry.location;address=hit.formatted_address;label="Dirección geocodificada";}
     }else{
      const {Place}=await google.maps.importLibrary("places");const r=await Place.searchByText({textQuery:x.nombre+", "+territory,fields:["displayName","formattedAddress","location"],locationBias:{center:ref,radius:10000},maxResultCount:3,language:"es",region:"pe"});
      const expected=normalizeName(x.nombre);
      const matches=(r.places||[]).filter(p=>p.location&&normalizeName(p.displayName)===expected&&normalizeName(p.formattedAddress).includes(districtName));
      if(matches.length===1){position=matches[0].location;address=matches[0].formattedAddress;label="Coincidencia por nombre en Google Places";}
     }
    }catch(err){apiErrors++;}
    if(token!==seq||!host.isConnected||authFailed)return;
    if(!position){failed++;continue;}
    const pin=new Marker({map:current,position,title:x.nombre||x.id});searchPins.push(pin);bounds.extend(position);found++;
    pin.addListener("click",()=>{info?.close();info=new InfoWindow({content:"<b>"+esc(x.nombre||x.id)+"</b><p>"+esc(address)+"</p><small>"+esc(label)+"; vigencia y actividad por verificar.</small>"});info.open({map:current,anchor:pin});});
   }
   if(found===1){current.setCenter(searchPins[0].getPosition());current.setZoom(16);}else if(found>1)current.fitBounds(bounds,60);
  }catch(err){apiErrors++;}
  if(token!==seq||!host.isConnected||authFailed)return;
  $("ex-map-badge").textContent=found+" ubicaciones encontradas";
  $("ex-map-status").textContent=found+" marcadores de "+batch.length+" consultas; "+failed+" sin coincidencia suficientemente precisa. "+(apiErrors?"Google rechazó "+apiErrors+" consultas o no están habilitadas Geocoding / Places API (New). ":"")+(unique.length>10?"Límite de 10 por búsqueda; usa Localizar para los demás. ":"")+(rows.length-available.length)+" registros sin datos comerciales publicables. Los marcadores no confirman actividad.";
 }
 function query(x){return [x.nombre,x.direccion,territoryQuery()].filter(Boolean).join(", ");}
 function fallback(x,message){clearSearchPins();map=null;marker=null;info=null;const q=query(x);
  iframe("https://maps.google.com/maps?q="+encodeURIComponent(q)+"&output=embed","Búsqueda en Google Maps: "+(x.nombre||x.id));
  $("ex-map-badge").textContent="Búsqueda, no ubicación verificada";$("ex-map-status").textContent=message+" Si la vista integrada no carga, pulsa «Abrir en Google Maps».";
 }
 async function locate(x){clearSearchPins();const token=++seq;selected=x;const q=query(x);
  $("ex-map-card").scrollIntoView({behavior:"smooth",block:"start"});$("ex-open").href=searchUrl(q);$("ex-map-caption").textContent=(x.nombre||x.id)+(x.direccion?" · "+x.direccion:"")+" · "+d.distrito;
  if(!x.nombre&&!x.direccion){$("ex-map-status").textContent="No hay nombre o dirección comercial publicable para este registro.";return;}
  if(!map||authFailed||!x.direccion){fallback(x,"Búsqueda por nombre o dirección comercial publicada. El resultado debe verificarse.");return;}
  $("ex-map-status").textContent="Buscando dirección comercial en Google Maps…";marker?.setMap(null);marker=null;info?.close();
  try{const {Geocoder}=await google.maps.importLibrary("geocoding");const g=new Geocoder();const response=await g.geocode({address:x.direccion+", "+territoryQuery(),region:"pe",componentRestrictions:{country:"PE"}});
   if(token!==seq||!host.isConnected)return;const hit=response.results[0];const precise=hit&&!hit.partial_match&&["ROOFTOP","RANGE_INTERPOLATED"].includes(hit.geometry.location_type)&&/(street_address|premise|subpremise|establishment)/.test(hit.types.join("|"));
   if(!precise){fallback(x,"Google no devolvió una dirección suficientemente precisa; se muestra la búsqueda sin confirmar.");return;}
   const {Marker}=await google.maps.importLibrary("marker");const {InfoWindow}=await google.maps.importLibrary("maps");if(token!==seq||!host.isConnected)return;
   map.setCenter(hit.geometry.location);map.setZoom(17);marker=new Marker({map,position:hit.geometry.location,title:x.nombre||x.id});info=new InfoWindow({content:"<b>"+esc(x.nombre||x.id)+"</b><p>"+esc(x.direccion)+"</p><small>Dirección geocodificada; negocio y vigencia por verificar.</small>"});info.open({map,anchor:marker});$("ex-map-badge").textContent="Dirección geocodificada";$("ex-map-status").textContent="Ubicación devuelta por Google: "+hit.formatted_address+". No confirma actividad ni presencia actual.";
  }catch(e){if(token===seq&&host.isConnected)fallback(x,"No se pudo geocodificar la dirección con la clave disponible.");}
 }
 function fields(){const list=mode==="expansion"?d.candidatos:d.registros;const years=[...new Set(list.map(x=>x.anio||x.fecha_nueva?.slice(0,4)).filter(Boolean))].sort().reverse();
  $("ex-year").innerHTML='<option value="">Todos los años</option>'+options(years);$("ex-sector").innerHTML='<option value="">Todos</option>'+options([...new Set(list.map(x=>x.sector))].sort());
  const exact=d.expansion_disponible;$("ex-from").disabled=!exact;$("ex-to").disabled=!exact;$("ex-from").value=mode==="expansion"?"2026-01-01":"";$("ex-to").value=mode==="expansion"?d.corte:"";$("ex-query").value="";
  $("ex-source").href=d.url;$("ex-source-info").textContent=d.fuente+" · "+d.inicio+" a "+d.corte+". "+(!exact?"Directorio de restaurantes y hospedajes; año de emisión sin fecha exacta, sin historial suficiente para medir expansión.":"Licencias de funcionamiento; una dirección nueva es señal, no prueba de apertura.");
 }
 function draw(){const start=page*25,rows=filtered.slice(start,start+25);
  $("ex-title").textContent=mode==="expansion"?"Candidatos identificados":"Registros municipales";$("ex-count").textContent=fmt(filtered.length)+" resultados · "+d.distrito+" · nombres y direcciones sujetos a disponibilidad y minimización de datos.";
  $("ex-results").innerHTML='<div class="tablewrap"><table><thead><tr><th>Negocio / registro</th><th>Sector</th><th>Fecha o año</th><th>'+ (mode==="expansion"?"Direcciones anteriores + nuevas":"Dirección comercial")+'</th><th>Acciones</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><strong>'+esc(x.nombre||x.id)+'</strong><small style="display:block">'+esc(x.id)+'</small></td><td>'+esc(x.sector)+'</td><td>'+esc(date(x.fecha_nueva||x.fecha||x.anio))+'</td><td>'+esc(mode==="expansion"?x.direcciones_anteriores+" + "+x.direcciones_nuevas:x.direccion||"No disponible")+'</td><td><div class="actions-row" style="margin:0"><button class="btn small" type="button" data-ex-detail="'+esc(x.id)+'">Ver evidencia</button><button class="btn small" type="button" data-ex-locate="'+esc(x.id)+'" '+(x.nombre||x.direccion?'':'disabled title="Sin ubicación comercial publicable"')+'>Localizar</button></div></td></tr>').join("")+'</tbody></table></div>'+(!rows.length?'<div class="blank">Sin resultados para estos filtros.</div>':"");
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
  $("ex-detail").innerHTML='<div class="signal" style="margin-top:16px"><h3>'+esc(x.nombre||x.id)+' · Evidencia municipal</h3><p>'+esc(x.direccion||"Dirección no disponible para publicación.")+'</p><p>'+esc(mode==="expansion"?"Última licencia anterior: "+date(x.fecha_anterior)+" · Nueva dirección observada: "+date(x.fecha_nueva)+". Direcciones anteriores: "+x.direcciones_anteriores+"; nuevas: "+x.direcciones_nuevas+".":"Fecha o año de emisión: "+date(x.fecha||x.anio)+" · "+x.tipo)+'</p><p><b>Fuente:</b> '+esc(d.fuente)+'</p><p><b>Próxima acción:</b> verificar actividad, vigencia y necesidad comercial; no constituye precalificación.</p></div>';$("ex-detail").focus();
 });
 $("ex-export").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({schema:pack.schema,ubigeo:d.ubigeo,fuente:d.url,corte:d.corte,tipo:mode,registros:filtered},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="licencias_"+d.ubigeo+".json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)});
 $("ex-google").addEventListener("click",async()=>{const key=$("ex-key").value.trim()||apiKey||shared().GOOGLE_MAPS_API_KEY;if(!key){$("ex-map-status").textContent="Introduce una clave válida de Google Maps.";return;}$("ex-key").value="";$("ex-google").disabled=true;authFailed=false;
  window.gm_authFailure=()=>{authFailed=true;if(!host.isConnected)return;const prior=selected;map=null;apiKey="";if(prior)fallback(prior,"Google rechazó la clave o su autorización.");else{resetMap();$("ex-map-status").textContent="Google rechazó la clave o su autorización. Revisa la consola y recarga antes de probar otra clave.";}};
  try{const maps=await loadGoogle(key);const {Map}=await maps.importLibrary("maps");if(!host.isConnected||authFailed)return;apiKey=key;try{sessionStorage.setItem("geogrowth.maps.config.v1",JSON.stringify({...shared(),GOOGLE_MAPS_API_KEY:key}));}catch(_){}const canvas=document.createElement("div");canvas.style.height="360px";$("ex-map").replaceChildren(canvas);map=new Map(canvas,{center:d.ref,zoom:13,mapTypeId:"roadmap",mapTypeControl:true,streetViewControl:false});$("ex-map-status").textContent="Solicitando Google Maps; si la autenticación falla se restaura el mapa de respaldo.";if(selected)locate(selected);}
  catch(e){map=null;const prior=selected;if(prior)fallback(prior,"No se pudo activar Google Maps.");else{resetMap();$("ex-map-status").textContent="No se pudo activar Google Maps; comprueba la clave y restricciones.";}}
  finally{if(host.isConnected)$("ex-google").disabled=false;}
 });
 district();
}
window.GeoGrowthExpansion={shell,mount};
})();
