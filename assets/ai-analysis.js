(()=>{'use strict';
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('es-PE');
const local=()=>['localhost','127.0.0.1'].includes(location.hostname);
const shell=()=>'<section class="card ai-panel" id="u-ai" aria-labelledby="u-ai-title"><div class="card-header"><div><span class="eyebrow">Inteligencia comercial</span><h2 id="u-ai-title">Análisis con GPT</h2><p>Resumen de la búsqueda. Consulta Ver detalle en cada fila para conocer el perfil individual.</p></div><span class="badge" id="ai-origin">Ejemplo local · sin IA</span></div><div class="ai-layout"><div><div id="ai-context" class="muted"></div><div id="ai-answer" aria-live="polite"></div></div><aside class="ai-controls"><h3>Consultar al asistente</h3><label for="ai-question">Pregunta sobre los resultados</label><textarea id="ai-question" maxlength="300" rows="3">¿Qué oportunidades comerciales muestra esta selección?</textarea><div class="actions-row"><button class="btn primary" id="ai-run">Analizar con GPT</button><button class="btn" id="ai-example">Ver ejemplo</button></div><p class="muted" id="ai-help"></p><p id="ai-status" role="status" aria-live="polite"></p></aside></div></section>';
// Cross public territorial aggregates by exact UBIGEO, once per territory.
function crossSources(rows,territories,mode){
 const ids=[...new Set(rows.map(r=>String(r.ubigeo||'')).filter(Boolean))],index=new Map(territories.map(t=>[String(t.ubigeo),t]));
 const matched=ids.map(u=>index.get(u)).filter(Boolean);
 const aggregate=(keys,source,period,limit)=>{
   const covered=matched.filter(t=>keys.some(k=>t[k]!=null));
   return {source,period,status:covered.length?'integrado':'sin cobertura',matched:covered.length,totalTerritories:ids.length,metrics:Object.fromEntries(keys.map(k=>{const vals=covered.filter(t=>t[k]!=null);return [k,{value:vals.length?vals.reduce((a,t)=>a+Number(t[k]),0):null,coverage:vals.length}]})),limit};
 };
 const sbs=aggregate(['sbs_puntos_2025','sbs_oficinas_2025','sbs_atm_2025','sbs_pos_2025','sbs_eob_2025'],'SBS','diciembre 2025','Infraestructura de todas las entidades; no identifica clientes de Caja ni mide inclusión efectiva.');
 const produce=aggregate(['empresas_2015','micro_2015','pequena_2015'],'PRODUCE','2015','Conteos históricos; no equivalen a negocios activos en 2026 ni son comparables como tasa con SBS 2025.');
 const inei={source:'INEI',period:'2026',status:'no integrado al cruce',limit:'La fuente catalogada es una muestra de 199 municipalidades de Amazonas y Áncash. No hay población o indicador demográfico validado para los UBIGEO de esta selección.'};
 const midagri={source:'MIDAGRI',period:'sin corte integrado',status:'pendiente',limit:'Falta incorporar datos por cultivo, territorio y temporada. No se puede inferir una campaña agrícola con esta fuente.'};
 return {join:'UBIGEO exacto; agregados territoriales deduplicados, no cruce individual por negocio',mode,territories:ids,matchedTerritories:matched.length,sbs,produce,inei,midagri};
}
const money=v=>v==null?'N/D':'S/ '+fmt(v);
const relation={client:'Cliente actual (verde)',nonclient:'No cliente verificado (plomo)',pending:'Nuevo por consultar (rojo)'};
const category=v=>v==null?'Sin historial simulado':['Normal (0)','Problemas potenciales (1)','Deficiente (2)','Dudoso (3)','Pérdida (4)'][v]||'N/D';
function individual(r,mode){
 if(!r)return null;
 return {id:String(r.id).slice(0,80),...(mode==='demo'?{name:r.label,profile:r.profile,cajaStatus:r.cajaStatus,cajaEvidence:r.cajaEvidence,needToExplore:r.need}:{}),activity:r.giro||'N/D',sector:r.sector||'N/D',date:r.date||'N/D',district:r.dist||'N/D',ubigeo:r.ubigeo||null,hasAddress:!!r.direccion};
}
function individualBlocks(x,mode){
 if(!x)return [];
 if(mode!=='demo'||!x.profile)return [['Perfil del comercio','Registro '+x.id+' · '+x.activity+' · '+x.date+' · '+x.district+'. La licencia es una señal, no confirma apertura. No se dispone de consulta individual SUNAT, SBS, estados de cuenta ni cartera autorizada. SUNARP: sin consulta registral individual. INEI y MIDAGRI: solo contexto territorial o sectorial cuando exista evidencia.'],['Acción ADN','Validar identidad, operación y relación con Caja mediante canales autorizados. No se puede inferir su situación financiera.']];
 const p=x.profile,b=p.sbs,f=p.finance;
 const action=x.cajaStatus==='client'?'Confirmar necesidades del cliente actual; no contarlo como captación nueva.':x.cajaStatus==='nonclient'?'Consultar interés en un acercamiento comercial; ya figura como no cliente en el escenario.':'Consultar primero si trabaja con Caja Trujillo; todavía no se sabe.';
 return [['Negocio seleccionado · '+x.name,x.activity+' · '+x.district+'. Primera licencia simulada: '+x.date+'.'],
 ['Identidad comercial · SUNAT (simulado)','Actividad: '+p.sunat.activity+'. Estado '+p.sunat.status+', condición '+p.sunat.condition+'. Identificador ficticio: '+p.joinId+' (no es RUC).'],
 ['Registro empresarial · SUNARP (simulado)',(p.sunarp?.status||'Sin dato simulado')+'. '+(p.sunarp?.note||'No se dispone de verificación registral.')],
 ['Historial crediticio · SBS (simulado)',b.subject+' · '+b.period+'. '+category(b.category)+(b.months?', '+b.months+' meses de historial, deuda '+money(b.debt)+', '+b.lenders+' entidades acreedoras.':' · sin datos de deuda ni acreedores; no equivale a deuda cero.')+' No constituye una evaluación crediticia.'],
 ['Actividad financiera · fuente autorizada simulada','Ventas mensuales proyectadas: '+money(f.sales)+'. Flujo neto proyectado: '+money(f.net)+'. Son cifras ficticias de operación futura, no transferencias ni datos obtenidos de SBS.'],
 ['Relación con Caja Trujillo',relation[x.cajaStatus]+' · '+x.cajaEvidence+'.'],
 ['INEI / MIDAGRI · contexto aplicable',p.inei.status+'. '+p.midagri.relevance+' '+p.midagri.status+'. No son fuentes de historial individual.'],
 ['Interpretación comercial y próxima acción','Por su giro, conviene explorar '+x.needToExplore+'. '+action+' Validar cifras y operación con consentimiento; no ofrecer ni aprobar crédito basándose en esta simulación.']];
}
function snapshot(rows,mode,filters,processed=rows.length,territories=[]){
 const counts={};for(const r of rows){const k=r.sector||'No clasificado';counts[k]=(counts[k]||0)+1;}
 return {module:'Nuevos negocios',mode,filters:{department:filters.dep,province:filters.prov,district:filters.dist,sector:filters.sector,year:filters.period,type:filters.extra},total:rows.length,sourceCross:crossSources(rows,territories,mode),cajaRelationship:mode==='demo'?Object.fromEntries(['client','nonclient','pending'].map(k=>[k,rows.filter(r=>r.cajaStatus===k).length])):null,processed,notNew:mode==='demo'?processed-rows.length:null,criteria:mode==='demo'?'Primer registro entre 28/10 y 26/11/2026 sin antecedente simulado':null,withAddress:rows.filter(r=>!!r.direccion).length,withActivity:rows.filter(r=>!!r.giro).length,sectors:Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([sector,count])=>({sector,count}))};
}
function mount(host){const root=host.querySelector('#u-ai');if(!root)return null;const $=id=>root.querySelector('#'+id);let data=null,serial=0,controller=null,records=[];
 $('ai-help').textContent=local()?'GPT real requiere iniciar el servidor local con OPENAI_API_KEY. Se envían conteos, filtros, contexto territorial agregado; no se envían fichas, nombres ni datos individuales.':'La web pública ofrece un ejemplo calculado. Para GPT real, utiliza el servidor local del repositorio; la clave secreta nunca se almacena en el navegador.';
 function example(){if(!data)return;serial++;controller?.abort();$('ai-run').disabled=!data.total||!local();$('ai-example').disabled=false;$('ai-origin').textContent='Ejemplo local · sin IA';$('ai-status').textContent='';const a=$('ai-answer'),top=data.sectors[0];
 const blocks=data.total?[['Hallazgo principal',(data.mode==='demo'?'Se procesaron '+fmt(data.processed)+' comercios sintéticos. Se identificaron '+fmt(data.total)+' posibles negocios nuevos; '+fmt(data.notNew)+' registros no cumplen el criterio de apertura reciente. ':'Se revisaron '+fmt(data.total)+' registros públicos en la selección. ')+(top?'Entre los detectados, un sector con mayor presencia es '+top.sector+' ('+fmt(top.count)+').':'')],['Oportunidad comercial',fmt(data.withAddress)+' registros cuentan con '+(data.mode==='demo'?'ubicación ilustrativa':'dirección publicada')+'. '+fmt(data.withActivity)+' tienen actividad identificada. Investigar primero los registros con fecha reciente, dirección y giro disponibles.'],...(data.mode==='demo'?[['Relación con Caja (simulada)',data.cajaRelationship.client+' clientes actuales (verde); '+data.cajaRelationship.nonclient+' no clientes verificados (plomo); '+data.cajaRelationship.pending+' nuevos por consultar (rojo). Los rojos requieren consulta antes de clasificarse como clientes o no clientes.'],['Oportunidades de prospección','Consultar los '+fmt(data.cajaRelationship.pending)+' negocios pendientes para confirmar su relación. Evaluar acercamientos a los '+fmt(data.cajaRelationship.nonclient)+' no clientes verificados y atender las necesidades de los '+fmt(data.cajaRelationship.client)+' clientes actuales. Consulta Ver detalle para revisar un negocio concreto.']]:[]),['Próxima acción ADN','Confirmar que el negocio opera, verificar su relación con Caja Trujillo y conocer su necesidad con consentimiento.'],['Límites',data.mode==='demo'?'Ejemplo ficticio: no representa clientes ni establecimientos reales.':'Una licencia no acredita apertura, actividad actual ni condición de cliente nuevo.']]:[['Sin resultados','Cambia los filtros antes de solicitar un análisis.']];
 a.innerHTML=blocks.map(([h,t])=>'<div class="ai-block"><h3>'+E(h)+'</h3><p>'+E(t)+'</p></div>').join('');}
 function update(rows,mode,filters,processed,territories){records=rows;data=snapshot(rows,mode,filters,processed,territories);$('ai-context').textContent='Contexto actual: '+(mode==='demo'?fmt(data.processed)+' procesados / '+fmt(data.total)+' detectados':fmt(data.total)+' registros')+' · '+(mode==='demo'?'datos sintéticos':'fuentes públicas')+' · '+(filters.dep||'todo el ámbito');example();}
 $('ai-example').onclick=example;
 $('ai-run').onclick=async()=>{if(!data?.total||!local())return;const token=++serial;controller?.abort();controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);$('ai-run').disabled=true;$('ai-status').textContent='Consultando OpenAI…';$('ai-origin').textContent='Consultando GPT';try{const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data,question:$('ai-question').value.trim()}),signal:controller.signal});const json=await response.json();if(!response.ok||!json.text)throw Error(json.error||'No se obtuvo una respuesta');if(token!==serial||!root.isConnected)return;$('ai-answer').replaceChildren();const result=document.createElement('div');result.className='ai-block ai-live';result.textContent=json.text;$('ai-answer').append(result);$('ai-origin').textContent='GPT · '+String(json.model||'OpenAI');$('ai-status').textContent='Análisis generado; requiere revisión humana.';}catch(e){if(token!==serial||!root.isConnected)return;example();$('ai-status').textContent='GPT no disponible: '+(e.name==='AbortError'?'tiempo de conexión agotado':e.message)+'. Se conserva el ejemplo local.';}finally{clearTimeout(timer);if(token===serial&&root.isConnected)$('ai-run').disabled=!data.total||!local();}};
 return {update,attachDetail:(element,record)=>attachDetail(element,record,data)};
}
// Independent per-business view. It never replaces the general summary.
function attachDetail(root,record,context){
 if(!root||!context)return;
 const focus=individual(record,context.mode),blocks=individualBlocks(focus,context.mode),isDemo=context.mode==='demo';
 const sections=blocks.map(([h,t])=>'<div class="ai-block"><h3>'+E(h)+'</h3><p>'+E(t)+'</p></div>').join('');
 root.innerHTML='<section class="individual-analysis" aria-label="Perfil individual"><div class="card-header"><div><span class="eyebrow">Cruce de fuentes por negocio</span><h2>Perfil individual</h2><p>'+(isDemo?'Datos sintéticos · no corresponden a una persona o empresa real.':'Datos públicos disponibles; sin acceso a información financiera individual.')+'</p></div></div><div class="individual-source-grid">'+sections+'</div></section>';

}
window.GeoGrowthAI={shell,mount,snapshot,crossSources,individual,individualBlocks};
})();