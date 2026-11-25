/* Independent expansion screen; does not change the existing map or campaign state. */
(function(){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>Number(n||0).toLocaleString("es-PE");
const date=s=>s?String(s).split("-").reverse().join("/"):"—";
let dataPromise=null, googleLoad=null, map=null, apiKey="";
const ref={lat:-6.024149,lng:-76.984401};
function data(){return dataPromise||(dataPromise=fetch("data/expansion_moyobamba.json?v=1").then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()}).catch(e=>{dataPromise=null;throw e}));}
function loadGoogle(key){
 if(window.google?.maps?.importLibrary)return Promise.resolve(window.google.maps);
 if(googleLoad)return googleLoad;
 googleLoad=new Promise((resolve,reject)=>{
  const s=document.createElement("script"),cb="__ggExpansionMapsReady";
  const fail=()=>{delete window[cb];s.remove();googleLoad=null;reject(Error("No se pudo cargar Google Maps. Revisa la clave, restricciones y facturación."))};
  window[cb]=()=>{delete window[cb];resolve(window.google.maps)};
  s.src="https://maps.googleapis.com/maps/api/js?loading=async&v=weekly&key="+encodeURIComponent(key)+"&callback="+cb;
  s.async=true;s.onerror=fail;document.head.appendChild(s);
 });return googleLoad;
}
function shell(){return '<div class="page-head"><div><span class="eyebrow">Prospección · Señales de crecimiento</span><h1>Expansión comercial</h1><p class="subtitle">Identifica posibles nuevos locales por RUC, dirección y fecha de licencia. Verifica la actividad antes de contactar.</p></div><span class="badge">Piloto Moyobamba</span></div><section id="gg-expansion" aria-live="polite"><div class="card">Cargando evidencia municipal…</div></section>';}
function mount(){
 const host=document.getElementById("gg-expansion");if(!host)return;
 data().then(d=>{if(!host.isConnected)return;show(host,d)}).catch(e=>{if(host.isConnected)host.innerHTML='<div class="card">No se pudo cargar la fuente de expansión: '+esc(e.message)+'</div>'});
}
function show(host,d){
 host.innerHTML=`<section class="card"><div class="card-header"><div><h2>Buscar expansiones</h2><p>Cobertura disponible: un distrito con evidencia individual procesada.</p></div></div>
 <form id="gg-expansion-form"><div class="form-grid">
 <div class="field"><label for="ex-region">Región</label><select id="ex-region"><option>San Martín</option></select></div>
 <div class="field"><label for="ex-province">Provincia</label><select id="ex-province"><option>Moyobamba</option></select></div>
 <div class="field"><label for="ex-district">Distrito</label><select id="ex-district"><option value="220101">Moyobamba · 220101</option></select></div>
 <div class="field"><label for="ex-type">Tipo de expansión</label><select id="ex-type"><option>Posible nueva sucursal / dirección</option></select></div>
 <div class="field"><label for="ex-from">Desde</label><input id="ex-from" type="date" value="2026-01-01" min="2026-01-01" max="${esc(d.corte)}" required></div>
 <div class="field"><label for="ex-to">Hasta</label><input id="ex-to" type="date" value="${esc(d.corte)}" min="2026-01-01" max="${esc(d.corte)}" required></div>
 <div class="field"><label for="ex-sector">Sector</label><select id="ex-sector"><option value="">Todos</option>${[...new Set(d.candidatos.map(x=>x.sector))].sort().map(s=>'<option>'+esc(s)+'</option>').join("")}</select></div>
 </div><div class="actions-row"><button class="btn primary" type="submit">Buscar expansiones comerciales</button></div><p id="ex-error" class="muted" role="status"></p></form></section>
 <div id="ex-kpi" class="kpi-grid"></div>
 <section class="card"><div class="card-header"><div><h2>Mapa de referencia territorial</h2><p>UBIGEO 220101 · coordenada promedio SBS 2025. No representa un local comercial.</p></div><span class="badge">Sin coordenadas individuales</span></div>
 <div id="ex-map" style="min-height:360px;border:1px solid #dce6ee;border-radius:12px;overflow:hidden"><iframe title="Mapa base de Moyobamba" width="100%" height="360" style="border:0;display:block" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=-77.0244%2C-6.06415%2C-76.9444%2C-5.98415&amp;layer=mapnik"></iframe></div>
 <div class="actions-row"><a class="btn" href="https://www.google.com/maps/search/?api=1&amp;query=Moyobamba%2C%20San%20Mart%C3%ADn%2C%20Per%C3%BA" target="_blank" rel="noopener noreferrer">Ver en Google Maps</a><label class="field" style="flex:1"><span>Clave Google Maps (opcional, solo sesión)</span><input id="ex-key" type="password" autocomplete="off" placeholder="Maps Demo Key o clave restringida"></label><button id="ex-google" type="button" class="btn">Activar Google Maps</button></div><p class="muted" id="ex-map-status">Cartografía de respaldo: OpenStreetMap. No se generan ubicaciones ficticias ni se envían direcciones a Google.</p></section>
 <section class="card"><div class="card-header"><div><h2>Candidatos identificados</h2><p>Identificadores anónimos; los datos no acreditan una sucursal activa.</p></div><button class="btn small" type="button" id="ex-export">Exportar evidencia JSON</button></div><div id="ex-results"></div><div id="ex-detail" tabindex="-1"></div></section>
 <section class="card"><h2>Fuente y metodología</h2><p>${esc(d.metodo)}</p><p class="muted">Cobertura: ${date(d.inicio)} – ${date(d.corte)}. Normalizar direcciones no elimina todas las variantes; podría tratarse de una mudanza, renovación o error. Cruce SUNAT y validación de campo pendientes.</p><a class="btn" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">Consultar fuente oficial</a></section>`;
 const $=id=>host.querySelector("#"+id);
 let filtered=[];
 const kpi=(v,l)=>'<div class="kpi"><b>'+fmt(v)+'</b><small>'+esc(l)+'</small></div>';
 function run(e){e?.preventDefault();const from=$("ex-from").value,to=$("ex-to").value,sector=$("ex-sector").value;if(!from||!to||from>to||from<"2026-01-01"||to>d.corte){$("ex-error").textContent="Selecciona un rango válido dentro del corte disponible.";return;}
  $("ex-error").textContent="";filtered=d.candidatos.filter(x=>x.fecha_nueva>=from&&x.fecha_nueva<=to&&(!sector||x.sector===sector));
  $("ex-kpi").innerHTML=kpi(filtered.length,"Candidatos en el filtro")+kpi(d.ruc_multidireccion,"RUC multidirección · histórico")+kpi(d.ruc_analizados,"RUC analizados · histórico")+kpi(d.licencias,"Licencias · histórico");
  $("ex-detail").innerHTML="";
  $("ex-results").innerHTML='<div class="tablewrap"><table><thead><tr><th>Candidato</th><th>Sector</th><th>Fecha nueva observada</th><th>Direcciones anteriores + nuevas</th><th>Acción</th></tr></thead><tbody>'+filtered.map(x=>'<tr><td><strong>'+esc(x.id)+'</strong></td><td>'+esc(x.sector)+'</td><td>'+date(x.fecha_nueva)+'</td><td>'+fmt(x.direcciones_anteriores)+' + '+fmt(x.direcciones_nuevas)+'</td><td><button class="btn small" type="button" data-ex-detail="'+esc(x.id)+'">Ver evidencia</button></td></tr>').join("")+'</tbody></table></div>'+(!filtered.length?'<div class="blank">Sin candidatos para los filtros seleccionados.</div>':"");
  $("ex-export").disabled=!filtered.length;
 }
 host.querySelector("form").addEventListener("submit",run);
 host.addEventListener("click",e=>{const b=e.target.closest("[data-ex-detail]");if(!b)return;const x=filtered.find(r=>r.id===b.dataset.exDetail);if(!x)return;
  $("ex-detail").innerHTML='<div class="signal" style="margin-top:16px"><h3>'+esc(x.id)+' · Evidencia de expansión</h3><p>Última licencia anterior al 2026: '+date(x.fecha_anterior)+' · Primera dirección nueva observada: '+date(x.fecha_nueva)+'.</p><p>Direcciones anteriores: '+fmt(x.direcciones_anteriores)+' · Nuevas: '+fmt(x.direcciones_nuevas)+'.</p><p><b>Próxima acción:</b> verificar si las direcciones corresponden a locales distintos que siguen operando y confirmar interés con consentimiento. Sin inferencia de necesidad crediticia.</p></div>';$("ex-detail").focus();
 });
 $("ex-export").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({schema:d.schema,ubigeo:d.ubigeo,fuente:d.url,corte:d.corte,metodo:d.metodo,candidatos:filtered},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="expansion_moyobamba.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)});
 $("ex-google").addEventListener("click",async()=>{
  const key=$("ex-key").value.trim()||apiKey;if(!key){$("ex-map-status").textContent="Introduce una clave válida de Google Maps.";return;}
  $("ex-key").value="";$("ex-google").disabled=true;
  try{const maps=await loadGoogle(key);const {Map}=await maps.importLibrary("maps");if(!host.isConnected)return;apiKey=key;const canvas=document.createElement("div");canvas.style.height="360px";$("ex-map").replaceChildren(canvas);map=new Map(canvas,{center:ref,zoom:13,mapTypeId:"roadmap",mapTypeControl:true,streetViewControl:false});$("ex-map-status").textContent="Google Maps · referencia territorial. Sin marcadores de negocios: no hay coordenadas individuales."}
  catch(e){$("ex-map-status").textContent="No se pudo activar Google Maps; utiliza el mapa de respaldo. Comprueba la clave y restricciones."}
  finally{if(host.isConnected)$("ex-google").disabled=false;}
 });
 run();
}
window.GeoGrowthExpansion={shell,mount};
})();
