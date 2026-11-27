(()=>{'use strict';
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=v=>String(v??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const fmt=v=>v==null?'N/D':Number(v).toLocaleString('es-PE');
const meta={
 bandeja:['01','Nuevos negocios','¿Quién está empezando?','Posible apertura','Confirmar operación, relación con Caja y necesidad real.','Licencias municipales fechadas; no prueban una apertura.','Arequipa'],
 expansion:['02','Expansión comercial','¿Quién podría estar creciendo?','Posible local adicional','Verificar si es una sucursal, traslado o duplicado.','Historial municipal de direcciones; no confirma sucursales.','San Martín'],
 desatendidos:['03','Mercados desatendidos','¿Dónde debemos investigar?','Zona por investigar','Validar actividad comercial, acceso financiero y presencia de Caja.','PRODUCE 2015 y SBS 2025: cortes distintos, no una tasa actual.','La Libertad'],
 estacionales:['04','Campañas estacionales','¿Cuándo debemos llegar?','Ventana de prospección anticipada','Verificar actividad y necesidad real antes de la temporada.','Actividad publicada vinculada a una regla de calendario.','Arequipa']
};
const option=(value,label)=>'<option value="'+E(value)+'">'+E(label)+'</option>';
const mapsLink=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
const stateByPage={};
function base(app,id){
 const ts=new Map(app.territories.map(t=>[t.ubigeo,t]));
 const district=u=>ts.get(u)?.nombre_distrito||u;
 const records=app.licencias.map(x=>({...x,label:x.nombre||x.id,dep:x.departamento,dist:district(x.ubigeo),period:String(x.fecha||x.anio||'').slice(0,4),date:x.fecha||x.anio||'N/D',source:x.fuente,signal:'Registro municipal fechado',lead:x.id,kind:'business'}));
 if(id==='expansion'){
  return (app.expansionPack?.distritos||[]).flatMap(d=>(d.candidatos||[]).map(x=>({...x,label:x.nombre||x.id,dep:'San Martín',dist:d.distrito,ubigeo:d.ubigeo,period:String(x.fecha_nueva||'').slice(0,4),date:x.fecha_nueva,source:d.fuente,url:d.url,signal:'Dirección adicional observada',lead:x.licencia_id,kind:'business',history:d.registros.filter(y=>x.nombre&&y.nombre&&N(y.nombre)===N(x.nombre)&&y.direccion&&y.fecha<x.fecha_nueva).sort((a,b)=>b.fecha.localeCompare(a.fecha))})));
 }
 if(id==='desatendidos')return app.territories.map(t=>({...t,id:t.ubigeo,label:t.nombre_distrito||'UBIGEO '+t.ubigeo,dep:t.departamento,dist:district(t.ubigeo),sector:'',period:'2015 / 2025',date:'2015 / dic. 2025',source:'PRODUCE 2015 · SBS 2025',signal:t.empresas_2015==null||t.sbs_puntos_2025==null?'Información parcial':t.sbs_oficinas_2025===0?'Sin oficinas reportadas':'Con oficinas reportadas',kind:'territory'}));
 return records;
}
function mount(app,id){
 const host=document.getElementById('content'),m=meta[id],all=base(app,id),G=window.GeoGrowthGoogleV11,season=window.GeoGrowthSeasonal;
 const s=stateByPage[id]||(stateByPage[id]={dep:m[6],prov:'',dist:'',sector:'',period:'',query:'',extra:id==='estacionales'?'navidad':id==='desatendidos'?'sin_oficinas':'',page:0});
 let rows=[],selected=null,seq=0,map=null,pins=[],provinceNames={},loadedKey='',selectedStatus=new Map(),mapPromise=null,geocoderDenied=false,mapGeneration=0;
 const $=x=>host.querySelector('#'+x),get=x=>$(x).value;
 const field=(id,label,opts,disabled=false)=>'<div class="field"><label for="'+id+'">'+E(label)+'</label><select id="'+id+'" '+(disabled?'disabled':'')+'>'+opts+'</select></div>';
 host.innerHTML='<div class="page-head"><div><span class="eyebrow">'+m[0]+' · '+E(m[2])+'</span><h1>'+E(m[1])+'</h1><p class="subtitle">'+E(m[5])+'</p></div><span class="badge">Prototipo comercial</span></div><div class="unified-workspace"><section class="card" id="u-filters"><div class="card-header"><div><h2>Buscar oportunidades</h2><p>Selecciona los filtros según la cobertura de las fuentes.</p></div></div><form id="u-form"><div class="u-filter-grid">'+field('u-dep','Departamento','')+field('u-prov','Provincia','')+field('u-dist','Distrito','')+field('u-sector','Sector','',id==='desatendidos')+field('u-period','Periodo','',id==='desatendidos')+field('u-extra',id==='estacionales'?'Temporada':id==='desatendidos'?'Presencia financiera':'Tipo de registro','')+'<div class="field u-query"><label for="u-query">Buscar nombre, dirección o UBIGEO</label><input id="u-query" type="search" placeholder="Escribe para filtrar"></div></div><div class="actions-row"><button class="btn primary" id="u-search" type="submit">Buscar oportunidades</button><button class="btn" type="button" id="u-reset">Limpiar filtros</button></div><p class="muted" id="u-coverage"></p></form></section><section class="card u-outcome" id="expected-result"><div><span class="eyebrow">Resultado esperado · '+m[0]+'</span><h2>'+E(m[3])+'</h2><p id="u-summary" role="status" aria-live="polite"></p><p class="muted" id="u-calendar"></p><p><b>Acción ADN:</b> '+E(m[4])+'</p></div><button class="btn primary" id="u-case">Ver caso sustentado</button></section><div class="u-kpis" id="u-kpis"></div><section class="card u-map-card"><div class="card-header"><div><h2>Mapa comercial · Google Maps</h2><p>Ubicaciones de la fuente, no clientes confirmados.</p></div><span class="badge" id="u-map-badge">Pendiente</span></div><div class="u-map-layout"><div id="u-map" class="u-map" aria-label="Mapa de oportunidades"></div><div class="u-map-info"><h3>Ubicación y contraste</h3><p id="u-map-status" role="status" aria-live="polite"></p><div class="u-map-actions"><button class="btn primary" id="u-locate">Localizar resultados (máx. 10)</button><a class="btn" id="u-open-map" target="_blank" rel="noopener noreferrer">Abrir en Google Maps</a><a class="btn" href="configuracion.html" id="u-config-map">Configurar API key</a></div><p class="muted">Las coordenadas territoriales SBS son referencias; nunca se usan como domicilios comerciales.</p></div></div></section><section class="card" id="u-results"><div class="card-header"><div><h2>Resultados de búsqueda</h2><p id="u-count" role="status"></p></div><button class="btn" id="u-export">Exportar resultados JSON</button></div><div class="tablewrap"><table class="u-table"><thead><tr><th>Negocio / territorio</th><th>Ubicación</th><th>Señal comercial</th><th>Periodo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="u-rows"></tbody></table></div><div class="actions-row"><button class="btn small" id="u-prev">Anterior</button><span class="muted" id="u-page"></span><button class="btn small" id="u-next">Siguiente</button></div></section><section class="card u-detail" id="u-detail" tabindex="-1" hidden></section></div>';
 function setOptions(el,items,value){el.innerHTML=items.map(x=>option(...x)).join('');el.value=items.some(x=>x[0]===value)?value:items[0]?.[0]||'';}
 const unique=(a)=>[...new Set(a.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
 const nameProv=p=>provinceNames[p]||p;
 function dependent(){
  const d=all.filter(r=>!get('u-dep')||r.dep===get('u-dep'));
  setOptions($('u-prov'),[['','Todas las provincias'],...unique(d.map(x=>x.ubigeo.slice(0,4))).map(x=>[x,nameProv(x)])],s.prov);
  const p=get('u-prov'),a=d.filter(x=>!p||x.ubigeo.startsWith(p));
  setOptions($('u-dist'),[['','Todos los distritos'],...Array.from(new Map(a.map(x=>[x.ubigeo,x.dist])).entries()).sort((a,b)=>a[1].localeCompare(b[1],'es')).map(([u,n])=>[u,n+' · '+u])],s.dist);
  const b=a.filter(x=>!get('u-dist')||x.ubigeo===get('u-dist'));
  setOptions($('u-sector'),id==='desatendidos'?[['','No aplica al corte territorial']]:[['','Todos los sectores'],...unique(b.map(x=>x.sector)).map(x=>[x,x])],s.sector);
  setOptions($('u-period'),id==='desatendidos'?[['','PRODUCE 2015 / SBS 2025']]:[['','Todos los periodos'],...unique(b.map(x=>x.period)).reverse().map(x=>[x,x])],s.period);
 }
 const deps=unique(all.map(x=>x.dep));
 setOptions($('u-dep'),[['','Todo el ámbito disponible'],...deps.map(d=>[d,d])],s.dep);
 setOptions($('u-extra'),id==='estacionales'?season.rules.map(r=>[r.id,r.name]):id==='desatendidos'?[['','Todas las presencias'],['sin_oficinas','Sin oficinas reportadas (≥20 empresas)'],['con_oficinas','Con oficinas reportadas'],['parcial','Datos parciales']]:id==='bandeja'?[['','Todos los registros'],['vigentes','Vigentes según fuente'],['direccion','Con dirección publicada']]:[['','Posible expansión histórica'],['historial','Con dos direcciones publicadas']],s.extra);
 $('u-query').value=s.query;dependent();
 $('u-coverage').textContent=id==='expansion'?'Cobertura de expansión: Moyobamba. Juanjuí no tiene historial suficiente para detectar expansión.':id==='desatendidos'?'Cobertura territorial: solo datos disponibles; N/D no equivale a cero. El sector no es comparable entre fuentes.':'Solo territorios con registros individuales incorporados. Las fechas no prueban actividad actual.';
 function persist(){Object.assign(s,{dep:get('u-dep'),prov:get('u-prov'),dist:get('u-dist'),sector:get('u-sector'),period:get('u-period'),extra:get('u-extra'),query:get('u-query')});}
 function search(){
  persist();s.page=0;selected=null;selectedStatus.clear();seq++;pins.forEach(p=>p.map=null);pins=[];map=null;mapPromise=null;mapGeneration++;loadedKey='';$('u-detail').hidden=true;
  const rule=id==='estacionales'?season.rules.find(r=>r.id===s.extra):null,q=N(s.query);
  rows=all.filter(x=>(!s.dep||x.dep===s.dep)&&(!s.prov||x.ubigeo.startsWith(s.prov))&&(!s.dist||x.ubigeo===s.dist)&&(!s.sector||x.sector===s.sector)&&(!s.period||x.period===s.period)&&(!q||N([x.label,x.direccion,x.dist,x.ubigeo,x.giro,x.sector,x.id].join(' ')).includes(q))&&
  (id!=='estacionales'||rule.pattern.test([x.sector,x.giro,x.label].map(v=>String(v??'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase()).join(' ')))&&
  (id!=='bandeja'||s.extra!=='vigentes'||['VIGENTE','ACTIVA'].includes(x.estado))&&(id!=='bandeja'||s.extra!=='direccion'||x.direccion)&&
  (id!=='expansion'||s.extra!=='historial'||x.direccion&&x.history.some(y=>N(y.direccion)!==N(x.direccion)))&&
  (id!=='desatendidos'||!s.extra||s.extra==='sin_oficinas'&&x.empresas_2015>=20&&x.sbs_puntos_2025!=null&&x.sbs_oficinas_2025===0||s.extra==='con_oficinas'&&x.sbs_oficinas_2025>0||s.extra==='parcial'&&(x.empresas_2015==null||x.sbs_puntos_2025==null)));
  rows.sort((a,b)=>id==='desatendidos'?(b.empresas_2015??-1)-(a.empresas_2015??-1):String(b.date).localeCompare(String(a.date))||Number(!!b.direccion)-Number(!!a.direccion));
  const c=id==='estacionales'?season.calendar[s.extra]:null;
  $('u-summary').textContent=fmt(rows.length)+' coincidencias · '+m[3]+'. '+(rows.length?'Selecciona una ficha para investigar.':'No se encontraron datos con estos filtros.');
  $('u-calendar').innerHTML=c?E(c.date+' · Ventana: '+c.window+' · '+c.reason)+(c.url?' · <a href="'+E(c.url)+'" target="_blank" rel="noopener noreferrer">Fuente del calendario</a>':''):'';
  const loc=rows.filter(hasLocation).length;
  $('u-kpis').innerHTML=[[rows.length,'Coincidencias'],[loc,id==='desatendidos'?'Con referencia SBS':'Con dirección publicada'],[new Set(rows.map(x=>x.ubigeo)).size,'Distritos'],[new Set(rows.flatMap(x=>x.kind==='territory'?[...(x.empresas_2015==null?[]:['PRODUCE']),...(x.sbs_puntos_2025==null?[]:['SBS'])]:[x.source])).size,'Fuentes']].map(([n,label])=>'<div class="kpi"><b>'+fmt(n)+'</b><small>'+E(label)+'</small></div>').join('');
  $('u-case').disabled=!rows.length;$('u-locate').disabled=!loc;$('u-export').disabled=!rows.length;
  $('u-open-map').href=mapsLink([s.dist?all.find(x=>x.ubigeo===s.dist)?.dist:'',s.prov?nameProv(s.prov):'',s.dep,'Perú'].filter(Boolean).join(', '));
  resetMap();draw();if(G.config().GOOGLE_MAPS_API_KEY)void initialize();
 }
 function hasLocation(r){return r.kind==='territory'?r.latitud_ref_sbs!=null&&r.longitud_ref_sbs!=null:!!r.direccion;}
 function resetMap(){const key=G.config().GOOGLE_MAPS_API_KEY;$('u-map-badge').textContent=key?'Por localizar':'Sin API key';$('u-map-status').textContent=key?'Pulsa Localizar resultados para consultar Google Maps. No hay consumo automático de geocodificación.':'Configura tu Demo Key una sola vez. Puedes revisar las fichas y abrir Google Maps sin clave.';$('u-map').innerHTML='<div class="u-map-empty"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><b>'+(key?'Mapa listo para localizar':'Google Maps sin configurar')+'</b><span>Los resultados están disponibles abajo.</span></div>';$('u-config-map').hidden=!!key;}
 function draw(){
  const page=rows.slice(s.page*10,(s.page+1)*10);
  $('u-count').textContent=fmt(rows.length)+' resultados · '+(rows.length?'Selecciona Ver evidencia para revisar el motivo.':'Prueba otro filtro.');
  $('u-rows').innerHTML=page.map(x=>'<tr><td><strong>'+E(x.label)+'</strong><small>'+E(x.sector||x.id)+'</small></td><td>'+E(x.dist)+'<small>'+E(x.dep)+' · '+E(x.ubigeo)+'</small></td><td>'+E(x.signal)+'</td><td>'+E(x.date)+'</td><td><span class="tag '+(['Referencia SBS','Dirección localizada','Nombre y dirección coinciden'].includes(selectedStatus.get(x.id))?'green':'warn')+'">'+E(selectedStatus.get(x.id)||(hasLocation(x)?'Por verificar':'Sin ubicación'))+'</span></td><td><div class="u-row-actions"><button class="btn small" data-u-detail="'+E(x.id)+'">Ver evidencia</button><button class="btn small" data-u-map="'+E(x.id)+'" '+(!hasLocation(x)?'disabled':'')+'>Localizar</button></div></td></tr>').join('')||'<tr><td colspan="6" class="empty-row">Sin resultados para estos filtros.</td></tr>';
  $('u-page').textContent='Página '+(s.page+1)+' de '+Math.max(1,Math.ceil(rows.length/10));$('u-prev').disabled=s.page===0;$('u-next').disabled=(s.page+1)*10>=rows.length;
 }
 function example(){return id==='expansion'?rows.find(x=>N(x.label)==='huellitas de amor'&&x.history.length)||rows.find(x=>x.history.length&&x.direccion)||rows[0]:id==='desatendidos'?rows.find(x=>x.nombre_distrito&&hasLocation(x))||rows[0]:rows.find(x=>x.direccion&&x.giro)||rows[0];}
 function queryFor(x){if(x.kind==='territory'&&hasLocation(x))return Number(x.latitud_ref_sbs)+','+Number(x.longitud_ref_sbs);return [x.label,x.direccion,x.dist,x.dep,'Perú'].filter(Boolean).join(', ');}
 function detail(x,scroll=true){
  selected=x;const c=id==='estacionales'?season.calendar[s.extra]:null;
  const fields=[['Fuente',x.source],['Fecha / periodo',x.date],['Territorio',x.dist+' · '+x.dep+' · '+x.ubigeo],['Motivo de detección',x.signal],['Ubicación',x.kind==='territory'?'Referencia SBS; no domicilio comercial':x.direccion||'N/D'],['Estado de contraste',selectedStatus.get(x.id)||'Pendiente de verificación']];
  if(id==='expansion')fields.push(['Última fecha anterior',x.fecha_anterior],['Direcciones anteriores publicables',x.history.map(y=>y.fecha+' · '+y.direccion).join(' | ')||'N/D'],['Nueva dirección',x.direccion||'N/D'],['Conteos de ubicaciones',x.direcciones_anteriores+' anteriores · '+x.direcciones_nuevas+' nuevas']);
  if(id==='desatendidos')fields.push(['Empresas · PRODUCE 2015',fmt(x.empresas_2015)],['MYPE · PRODUCE 2015',x.micro_2015==null||x.pequena_2015==null?'N/D':fmt(x.micro_2015+x.pequena_2015)],['Puntos financieros · SBS dic. 2025',fmt(x.sbs_puntos_2025)],['Oficinas / agentes / cajeros',[x.sbs_oficinas_2025,x.sbs_pos_2025,x.sbs_atm_2025].map(fmt).join(' / ')]);
  if(c)fields.push(['Temporada',c.date],['Ventana propuesta',c.window],['Fuente de calendario',c.source||'Pendiente de incorporar'],['Criterio de anticipación',c.reason]);
  if(x.kind==='business')fields.push(['Actividad publicada',x.giro||x.sector||'N/D']);
  $('u-detail').hidden=false;$('u-detail').innerHTML='<div class="card-header"><div><span class="eyebrow">Ficha de evidencia · '+m[0]+'</span><h2>'+E(x.label)+'</h2><p>'+E(m[3])+'</p></div><button class="btn" id="u-close">Cerrar</button></div><div class="brief-grid">'+fields.map(([a,b])=>'<div class="brief-box"><small>'+E(a)+'</small><b>'+E(b??'N/D')+'</b></div>').join('')+'</div><p class="u-next-action"><b>Acción ADN:</b> '+E(m[4])+' '+E(m[5])+'</p><div class="actions-row"><button class="btn" data-u-map="'+E(x.id)+'" '+(!hasLocation(x)?'disabled':'')+'>Localizar</button><a class="btn" href="'+E(mapsLink(queryFor(x)))+'" target="_blank" rel="noopener noreferrer">Contrastar en Google Maps</a>'+(x.url?'<a class="btn" href="'+E(x.url)+'" target="_blank" rel="noopener noreferrer">Fuente oficial</a>':'')+(c?.url?'<a class="btn" href="'+E(c.url)+'" target="_blank" rel="noopener noreferrer">Fuente del calendario</a>':'')+(x.lead&&app.licencias.some(l=>l.id===x.lead)?'<button class="btn primary" data-lead="'+E(x.lead)+'">Preparar Opportunity Brief</button>':'')+''+(x.kind==='business'&&x.direccion&&x.nombre?'<button class="btn" id="u-contrast">Contrastar con Places</button>':'')+'<button class="btn" id="u-export-detail">Exportar ficha</button></div>';
  $('u-close').onclick=()=>{$('u-detail').hidden=true;selected=null};$('u-export-detail').onclick=()=>download('ficha_'+x.id+'.json',{module:id,record:x,calendar:c,action:m[4],verification:selectedStatus.get(x.id)||'Pendiente'});
  if($('u-contrast'))$('u-contrast').onclick=()=>contrast(x);
  if(scroll){$('u-detail').focus();$('u-detail').scrollIntoView({block:'start'});}
 }
 async function contrast(x){
  const button=$('u-contrast');if(!G.config().GOOGLE_MAPS_API_KEY){selectedStatus.set(x.id,'Configura tu API key para consultar Places');detail(x,false);return;}
  button.disabled=true;$('u-locate').disabled=!rows.some(hasLocation);const token=++seq;const workspace=host.querySelector('.unified-workspace');let status='Consulta no disponible';
  try{
   const maps=await Promise.race([G.load(),new Promise((_,r)=>setTimeout(()=>r(Error('Tiempo agotado')),12000))]),{Place}=await maps.importLibrary('places');
   const response=await Place.searchByText({textQuery:queryFor(x),fields:['displayName','formattedAddress','location'],maxResultCount:3,language:'es',region:'pe'});
   const street=N(x.direccion).replace(/\b(av|avenida|jr|jiron|calle|cl|nro|numero|no)\b/g,' ').replace(/\s+/g,' ').trim();
   const number=street.match(/\b\d+\b/)?.[0],name=N(x.nombre);
   const matches=(response.places||[]).filter(p=>N(p.displayName)===name&&number&&N(p.formattedAddress).split(' ').includes(number)&&N(p.formattedAddress).includes(N(x.dist))&&street.split(' ').filter(t=>t.length>3&&!/^\d+$/.test(t)).slice(0,2).every(t=>N(p.formattedAddress).includes(t)));
   status=matches.length===1?'Nombre y dirección coinciden':response.places?.length?'Coincidencia no concluyente':'Sin coincidencia';
  }catch(e){status='Places no disponible con esta clave';}
  if(!workspace.isConnected||token!==seq)return;selectedStatus.set(x.id,status);draw();detail(x,false);
 }
 function download(name,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}
 function centerFor(){
  const refs=app.territories.filter(t=>(!s.dep||t.departamento===s.dep)&&(!s.prov||t.ubigeo.startsWith(s.prov))&&(!s.dist||t.ubigeo===s.dist)&&t.latitud_ref_sbs!=null&&t.longitud_ref_sbs!=null&&Number.isFinite(Number(t.latitud_ref_sbs))&&Number.isFinite(Number(t.longitud_ref_sbs)));
  const codes=new Set(rows.map(r=>r.ubigeo)),specific=refs.filter(t=>codes.has(t.ubigeo)),list=specific.length?specific:refs;
  if(!s.dep||!list.length)return {center:{lat:-9.19,lng:-75.02},zoom:5};
  return {center:{lat:list.reduce((a,t)=>a+Number(t.latitud_ref_sbs),0)/list.length,lng:list.reduce((a,t)=>a+Number(t.longitud_ref_sbs),0)/list.length},zoom:list.length===1?12:s.prov?10:8};
 }
 function errorCode(e){const raw=[e?.code,e?.status,e?.message].filter(Boolean).join(' ');if(/OVER_QUERY_LIMIT|RESOURCE_EXHAUSTED|quota|429/i.test(raw))return 'Cuota agotada';if(/REQUEST_DENIED|PERMISSION_DENIED|denied|403|not authorized|API_NOT_ACTIVATED/i.test(raw))return 'Servicio no autorizado';if(/timeout|agotado/i.test(raw))return 'Tiempo de conexión agotado';return 'Servicio no disponible';}
 async function ensureMap(){
  if(map)return map;if(mapPromise)return mapPromise;
  const workspace=host.querySelector('.unified-workspace'),canvasHost=$('u-map'),key=G.config().GOOGLE_MAPS_API_KEY;const initVersion=mapGeneration;
  const valid=()=>workspace?.isConnected&&canvasHost.isConnected&&$('u-map')===canvasHost&&mapGeneration===initVersion;
  let denied=false;
  window.gm_authFailure=()=>{denied=true;if(valid()){$('u-map-status').textContent='Google rechazó la clave. Revisa Configuración.';$('u-map-badge').textContent='API rechazada';}};
  const task=(async()=>{const maps=await Promise.race([G.load(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Tiempo de conexión agotado')),12000))]);const {Map:GM}=await maps.importLibrary('maps');if(!valid()||denied)throw Error('Mapa no disponible');canvasHost.replaceChildren();const canvas=document.createElement('div');canvas.className='u-map-canvas';canvasHost.append(canvas);return new GM(canvas,{...centerFor(),mapId:G.config().GOOGLE_MAPS_MAP_ID||'DEMO_MAP_ID',gestureHandling:'cooperative'});})();
  mapPromise=task;
  try{const result=await task;if(mapPromise!==task||!valid())throw Error('Vista actualizada');map=result;loadedKey=key;return map;}finally{if(mapPromise===task)mapPromise=null;}
 }
 async function initialize(){
  const token=seq,workspace=host.querySelector('.unified-workspace');const valid=()=>workspace?.isConnected&&token===seq;
  $('u-map-badge').textContent='Cargando mapa';$('u-map-status').textContent='Inicializando Google Maps en el territorio seleccionado…';
  try{await ensureMap();if(!valid())return;$('u-map-badge').textContent='Mapa listo';$('u-map-status').textContent='Mapa centrado en el territorio. Pulsa Localizar resultados para consultar direcciones.';if(id==='desatendidos'&&rows.some(hasLocation))await locate(rows.filter(hasLocation).slice(0,10));}
  catch(e){if(valid()&&$('u-map-badge').textContent!=='API rechazada'){$('u-map-badge').textContent='Mapa no disponible';$('u-map-status').textContent=errorCode(e)+'. Los resultados siguen disponibles.';}}
 }
 async function locate(list){
  const token=++seq,key=G.config().GOOGLE_MAPS_API_KEY;if(!key){$('u-map-status').textContent='No hay API key. Configúrala o utiliza Abrir en Google Maps.';return;}
  list=list.filter(hasLocation).slice(0,10);if(!list.length){$('u-map-status').textContent='Sin ubicaciones publicables en esta selección.';return;}
  const workspace=host.querySelector('.unified-workspace');const valid=()=>workspace?.isConnected&&$('u-map')&&token===seq;
  $('u-locate').disabled=true;$('u-map-badge').textContent='Consultando';$('u-map-status').textContent='Localizando registros…';
  try{
   await ensureMap();const maps=await G.load(),{AdvancedMarkerElement}=await maps.importLibrary('marker'),{LatLngBounds}=await maps.importLibrary('core');if(!valid())return;
   pins.forEach(p=>p.map=null);pins=[];const bounds=new LatLngBounds();let found=0,errors=0,attempted=0,lastError='',usedPlaces=false;
   for(const x of list){if(!valid())return;attempted++;try{let hit;if(x.kind==='territory'){hit={position:{lat:Number(x.latitud_ref_sbs),lng:Number(x.longitud_ref_sbs)}};}else{const territory=[x.dist,x.dep].join(', ');if(!geocoderDenied){try{hit=await G.geocodeRecord(x,territory)}catch(e){if(errorCode(e)==='Servicio no autorizado'){geocoderDenied=true;}else throw e;}}if(!hit){usedPlaces=true;hit=await G.placeAddressRecord(x,territory);}}if(!valid())return;if(!hit?.position){selectedStatus.set(x.id,'Sin coincidencia');continue;}
    const pin=new AdvancedMarkerElement({map,position:hit.position,title:x.label});pin.addListener?.('click',()=>detail(x));pins.push(pin);bounds.extend(hit.position);found++;selectedStatus.set(x.id,x.kind==='territory'?'Referencia SBS':'Dirección localizada');
   }catch(e){errors++;lastError=errorCode(e);selectedStatus.set(x.id,lastError);if(lastError==='Cuota agotada'||lastError==='Servicio no autorizado')break}}
   if(!valid())return;if(found===1){map.setCenter(pins[0].position);map.setZoom(list[0]?.kind==='territory'?12:16)}else if(found)map.fitBounds(bounds,40);
   $('u-map-badge').textContent=found+(found===1?' ubicación':' ubicaciones');$('u-map-status').textContent=found+' localizadas · '+attempted+' de '+list.length+' consultadas · '+errors+(errors===1?' error':' errores')+(lastError?' ('+lastError+')':'')+(usedPlaces?' · Alternativa Places utilizada.':'')+'. '+(found?'Identidad y actividad comercial no confirmadas.':'Sin coincidencias verificables; el mapa sigue centrado en el territorio.');draw();if(selected)detail(selected,false);
  }catch(e){if(valid()&&$('u-map-badge').textContent!=='API rechazada'){$('u-map-badge').textContent='No disponible';$('u-map-status').textContent=errorCode(e)+'. Revisa clave, API y cuota; los resultados siguen disponibles.'}}
  finally{if(valid())$('u-locate').disabled=!rows.some(hasLocation);}
 }
 $('u-dep').onchange=()=>{s.prov='';s.dist='';s.sector='';s.period='';dependent();search()};$('u-prov').onchange=()=>{s.prov=get('u-prov');s.dist='';s.sector='';s.period='';dependent();search()};$('u-dist').onchange=()=>{s.dist=get('u-dist');s.sector='';s.period='';dependent();search()};
 for(const n of ['u-sector','u-period','u-extra'])$(n).onchange=search;
 $('u-form').onsubmit=e=>{e.preventDefault();search()};$('u-reset').onclick=()=>{s.prov=s.dist=s.sector=s.period=s.query='';$('u-dep').value=m[6];$('u-query').value='';$('u-extra').value=id==='estacionales'?'navidad':id==='desatendidos'?'sin_oficinas':'';dependent();search()};
 $('u-case').onclick=()=>{const x=example();if(x)detail(x)};$('u-prev').onclick=()=>{if(s.page){s.page--;draw()}};$('u-next').onclick=()=>{if((s.page+1)*10<rows.length){s.page++;draw()}};
 $('u-export').onclick=()=>download('oportunidades_'+id+'.json',{module:id,filters:s,records:rows,action:m[4]});$('u-locate').onclick=()=>locate(rows.slice(s.page*10,(s.page+1)*10).filter(hasLocation).length?rows.slice(s.page*10,(s.page+1)*10):rows.filter(hasLocation).slice(0,10));
 host.querySelector('.unified-workspace').addEventListener('click',e=>{const b=e.target.closest('[data-u-detail],[data-u-map]');if(!b)return;const x=rows.find(r=>r.id===(b.dataset.uDetail||b.dataset.uMap));if(!x)return;if(b.dataset.uDetail)detail(x);else{selected=x;$('u-open-map').href=mapsLink(queryFor(x));locate([x]);$('u-map').scrollIntoView({block:'center'})}});
 const workspaceRef=host.querySelector('.unified-workspace');search();fetch('data/provincias_ubigeo_ref.json').then(r=>r.json()).then(p=>{provinceNames=p.provincias||{};if(host.querySelector('.unified-workspace')===workspaceRef){persist();dependent()}}).catch(()=>{});
}
window.GeoGrowthUnified={mount,base,meta};
})();