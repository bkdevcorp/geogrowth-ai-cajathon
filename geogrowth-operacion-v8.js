/* GeoGrowth AI V8 — análisis operativo sobre el Data Pack real.
   NO modifica geogrowth-map.js V5. Sin pasos guiados ni empresas ficticias.
   Fuentes: PRODUCE 2015, SBS 2025, licencias parciales 2024-2026.
*/
(function(){
'use strict';
const I={chosen:null,lastRun:null,department:'La Libertad',budget:2400,version:'8.0'};
const htmlSafe=v=>safe(String(v??''));
const number=v=>v==null?'N/D':fmt(v);
const money=v=>'S/ '+fmt(v);
const byUbigeo=u=>DATA.find(d=>d.ubigeo===String(u));
const hasP=r=>r.empresas_2015!=null;
const hasS=r=>r.sbs_puntos_2025!=null;
const verified=r=>hasP(r)&&hasS(r);
const regionOf=r=>DATA.filter(x=>x.departamento===r.departamento&&verified(x));
const query=(id)=>document.getElementById(id);
const sourceLinks={
  p:'https://transparencia.produce.gob.pe/index.php/52-portal-de-datos-abiertos',
  s:'https://www.sbs.gob.pe/app/stats_net/stats/EstadisticaSistemaFinancieroResultados.aspx?c=CIIF-0002',
  m:'https://www.datosabiertos.gob.pe/'
};
const css=document.createElement('style');
css.textContent=`
.go-intro{background:linear-gradient(120deg,#112d52,#1b5b85);border-radius:16px;padding:23px 24px;color:white;margin-bottom:16px;display:flex;justify-content:space-between;gap:20px;align-items:center}
.go-intro h2{font-size:24px;line-height:1.15;margin:6px 0 10px;color:white}.go-intro p{color:#cbdff5;font-size:12px;max-width:770px;line-height:1.7}
.go-intro .go-sticker{font-size:10px;white-space:nowrap;border:1px solid #7aa8c4;background:#24567866;border-radius:30px;padding:9px 12px;align-self:flex-start}
.go-pick{background:white;border:1px solid #dfe9f3;border-radius:14px;padding:19px;margin-bottom:16px;box-shadow:0 5px 20px #102e4210}
.go-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:15px}.go-head h3{font-size:15px;color:#16365b}
.go-options{display:grid;grid-template-columns:1fr 1.15fr 170px;gap:12px;align-items:end}
.go-options label{display:block;font-weight:750;font-size:11px;color:#46617f;margin-bottom:6px}
.go-options select,.go-options input{width:100%;border:1px solid #cbd8e8;border-radius:10px;padding:12px;background:white;color:#123455;min-height:43px;font-size:13px}
.go-quick{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin-top:14px}.go-quick strong{color:#647c96;font-size:11px;margin-right:4px}
.go-quick button{font-size:11px;color:#26588b;border:1px solid #d2e1f1;border-radius:20px;padding:7px 11px;background:#f3f8fd;cursor:pointer}
.go-quick button:hover{background:#e5f1ff}.go-layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(270px,.8fr);gap:15px}
.go-block{border:1px solid #dde8f3;border-radius:14px;background:#fff;padding:19px;margin-bottom:15px}
.go-block h3{font-size:14px;color:#17375c;margin:0 0 5px}.go-block .go-kicker{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.09em;color:#2b71a8;margin-bottom:5px}
.go-muted{color:#64758b;font-size:11px;line-height:1.65}.go-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
.go-metric{background:#f4f8fd;padding:14px;border:1px solid #e6edf5;border-radius:11px;min-width:0}.go-metric strong{display:block;font-size:22px;letter-spacing:-.04em;color:#163c66;font-variant-numeric:tabular-nums}
.go-metric small{font-size:10px;color:#58738d;display:block;line-height:1.5;margin-top:4px}
.go-pipeline{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:15px}.go-stage{background:#eff7f4;border:1px solid #cce8db;border-radius:11px;padding:10px;min-width:0}
.go-stage strong{font-size:11px;color:#165547;display:block}.go-stage small{font-size:10px;color:#4b8676;display:block;margin-top:4px}
.go-line{border-top:1px solid #e4ebf3;margin:15px 0}.go-smallcaps{font-size:10px;color:#6683a4;text-transform:uppercase;letter-spacing:.08em;font-weight:800}
.go-row{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid #edf2f8;font-size:12px}.go-row:last-child{border-bottom:none}.go-row span{color:#516a85}.go-row b{color:#13385e}
.go-signal{padding:11px 13px;border:1px solid #dfeaf6;background:#f9fbfe;border-radius:10px;margin-top:9px}.go-signal strong{font-size:11px;color:#244f79}.go-signal p{font-size:11px;color:#5d7187;line-height:1.6;margin-top:5px}
.go-qualification{border-radius:11px;background:#fff7e7;border:1px solid #f0dcaf;padding:12px;margin-top:14px;font-size:11px;line-height:1.6;color:#765522}
.go-actionbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.go-actionbar button,.go-actionbar a{font:700 11px Inter,Arial,sans-serif;padding:10px 12px;min-height:39px;border:1px solid #bfcfe3;border-radius:9px;color:#275187;background:#fff;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
.go-actionbar .go-primary{background:#235fcb;border-color:#235fcb;color:white}.go-actionbar button:hover,.go-actionbar a:hover{filter:brightness(.97)}
.go-evidence{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.go-evidence span{font-size:10px;background:#edf4fc;border:1px solid #d5e5f5;color:#34628e;padding:5px 8px;border-radius:6px}
.go-score{display:flex;align-items:center;gap:14px;margin-top:12px}.go-score strong{font-size:30px;color:#173e68;line-height:1}.go-score .go-scorebar{height:8px;border-radius:20px;background:#e1ebf4;flex:1;overflow:hidden}.go-scorebar i{height:100%;background:#2186a0;display:block}
.go-compare{width:100%;border-collapse:collapse;margin-top:9px;font-size:11px}.go-compare th{text-align:left;color:#607992;font-weight:700;border-bottom:1px solid #dde8f3;padding:10px 6px}.go-compare td{padding:10px 6px;border-bottom:1px solid #e9eff6;color:#345577}.go-compare td b{color:#1b416d}
.go-empty{margin-top:15px;border:1px dashed #c4d6e8;background:#f6faff;padding:25px 20px;border-radius:12px;text-align:center;color:#5e758e;font-size:12px;line-height:1.7}
.go-subtle{font-size:10px;color:#67819a;line-height:1.55}.go-link{color:#225ec1;text-decoration:underline;cursor:pointer}.go-declare{padding:12px;border-left:3px solid #2e8a9b;background:#f1f9fb;font-size:11px;line-height:1.65;color:#335a6b;border-radius:0 7px 7px 0}
@media(max-width:950px){.go-layout{grid-template-columns:1fr}.go-options{grid-template-columns:1fr 1fr}.go-options>div:last-child{grid-column:1/-1}.go-pipeline{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:580px){.go-options,.go-metrics{grid-template-columns:1fr 1fr}.go-options>div{grid-column:1/-1}.go-pipeline{grid-template-columns:1fr 1fr}.go-intro{padding:18px}.go-intro .go-sticker{display:none}.go-metric strong{font-size:19px}}
`;
document.head.appendChild(css);
const availableDeps=[...new Set(DATA.map(x=>x.departamento))].sort((a,b)=>a.localeCompare(b,'es'));
function rankedInRegion(r){
 const prev=state.dep;
 state.dep=r.departamento;
 const scored=getScored();
 state.dep=prev;
 return scored;
}
function compute(r){
 const region=rankedInRegion(r);
 const record=region.find(x=>x.ubigeo===r.ubigeo)||null;
 const regionalRank=record?region.findIndex(x=>x.ubigeo===r.ubigeo)+1:null;
 const coverage={produce:hasP(r),sbs:hasS(r),municipal:r.licencias_municipales_ref!=null};
 const first=region[0]||null;
 const regionCount=region.length;
 const need=[
   'Confirmar actividad económica y establecimientos actualmente operativos',
   'Validar necesidades declaradas mediante contacto consentido',
   'Contrastar productos y requisitos vigentes de Caja Trujillo',
   'Obtener población adulta y datos empresariales más recientes para medir cobertura'
 ];
 const evidence=String(r.evidencia||'').split('|').filter(Boolean);
 const counts={micro:Number(r.micro_2015||0),small:Number(r.pequena_2015||0),total:Number(r.empresas_2015||0),sbs:Number(r.sbs_puntos_2025||0),offices:Number(r.sbs_oficinas_2025||0),atm:Number(r.sbs_atm_2025||0),pos:Number(r.sbs_pos_2025||0),eob:Number(r.sbs_eob_2025||0)};
 const hypotheses=[];
 if(coverage.produce) hypotheses.push('La presencia empresarial histórica justifica estudiar la vigencia y el giro de los negocios; no prueba demanda actual.');
 if(coverage.sbs) hypotheses.push('La infraestructura de atención SBS permite estudiar accesibilidad territorial; no mide bancarización efectiva.');
 if(coverage.municipal) hypotheses.push('Existen registros administrativos de licencias locales para contrastar actividad registrada en el municipio.');
 return {r,record,regionalRank,regionCount,coverage,first,need,evidence,counts,hypotheses,timestamp:new Date().toISOString()};
}
function select(r){
 if(!r)return;
 state.dep=r.departamento;
 state.query='';state.selected=r.ubigeo;
 I.department=r.departamento;I.chosen=r.ubigeo; I.lastRun=compute(r);
 // Campaña de investigación: solo distritos con ambas fuentes. No afirma elegibilidad.
 state.plan=I.lastRun.record?[r.ubigeo]:[];
 state.view='work';
 render();
}
function metric(v,label){return '<div class="go-metric"><strong>'+number(v)+'</strong><small>'+htmlSafe(label)+'</small></div>';}
function picker(){
 const current=I.chosen?byUbigeo(I.chosen):null;
 const currentDep=current?.departamento||I.department;
 const pool=DATA.filter(r=>r.departamento===currentDep).sort((a,b)=>(a.nombre_distrito||'').localeCompare(b.nombre_distrito||'', 'es'));
 return '<div class="go-pick"><div class="go-head"><h3>Seleccionar territorio para análisis</h3><span class="go-subtle">Datos reales agregados por UBIGEO · cobertura nacional</span></div>'+
  '<div class="go-options"><div><label for="go-dep">Departamento</label><select id="go-dep">'+availableDeps.map(d=>'<option value="'+htmlSafe(d)+'" '+(d===currentDep?'selected':'')+'>'+htmlSafe(d)+'</option>').join('')+'</select></div>'+
  '<div><label for="go-ubigeo">Distrito</label><select id="go-ubigeo"><option value="">Seleccione un distrito para ejecutar el análisis</option>'+pool.map(r=>'<option value="'+htmlSafe(r.ubigeo)+'" '+(I.chosen===r.ubigeo?'selected':'')+'>'+htmlSafe(r.nombre_distrito||'UBIGEO '+r.ubigeo)+' · '+htmlSafe(r.ubigeo)+'</option>').join('')+'</select></div>'+
  '<div><label for="go-budget">Presupuesto de campaña (supuesto)</label><input id="go-budget" type="number" min="500" max="25000" step="100" value="'+I.budget+'" /></div></div>'+
  '<div class="go-quick"><strong>Analizar directamente:</strong>'+
  [['130101','Trujillo'],['150101','Lima Cercado'],['040101','Arequipa'],['060101','Cajamarca']].map(([u,t])=>'<button type="button" data-go-example="'+u+'">'+t+'</button>').join('')+'</div></div>';
}
function facts(d){const r=d.r;
 return '<div class="go-block"><div class="go-kicker">01 · Ingesta e integración</div><h3>Información disponible en '+htmlSafe(r.nombre_distrito||r.ubigeo)+'</h3><p class="go-muted">Datos aportados y procesados previamente, cruzados por UBIGEO '+htmlSafe(r.ubigeo)+'. Se respetan los periodos originales.</p>'+
 '<div class="go-metrics">'+metric(d.coverage.produce?r.empresas_2015:null,'Empresas · PRODUCE 2015')+metric(d.coverage.produce?r.micro_2015:null,'Microempresas · 2015')+metric(d.coverage.produce?r.pequena_2015:null,'Pequeñas empresas · 2015')+
 metric(d.coverage.sbs?r.sbs_puntos_2025:null,'Puntos de atención · SBS 2025')+metric(d.coverage.sbs?r.sbs_oficinas_2025:null,'Oficinas SBS 2025')+metric(d.coverage.sbs?r.sbs_atm_2025:null,'Cajeros ATM · 2025')+'</div>'+
 '<div class="go-line"></div><div class="go-smallcaps">Calidad de fuentes</div><div class="go-row"><span>PRODUCE · Registro empresarial histórico</span><b>'+(d.coverage.produce?'Disponible · 2015':'No disponible')+'</b></div><div class="go-row"><span>SBS · Infraestructura financiera</span><b>'+(d.coverage.sbs?'Disponible · dic. 2025':'No disponible')+'</b></div><div class="go-row"><span>Licencias municipales</span><b>'+(d.coverage.municipal?number(r.licencias_municipales_ref)+' · '+htmlSafe(r.anio_licencias):'No disponibles para este distrito')+'</b></div>'+
 (d.coverage.municipal?'<p class="go-muted" style="margin-top:10px">Fuente: '+htmlSafe(r.fuente_licencias)+'. Son registros o expedientes administrativos; no representan necesariamente negocios activos únicos.</p>':'')+
 '<div class="go-evidence">'+(d.evidence.length?d.evidence.map(s=>'<span>'+htmlSafe(s)+'</span>').join(''):'<span>Sin referencias de fuente</span>')+'</div></div>';
}
function analyse(d){const c=d.counts;
 return '<div class="go-block"><div class="go-kicker">02 · Análisis y priorización</div><h3>Señales territoriales calculadas</h3>'+
 '<div class="go-signal"><strong>Concentración empresarial histórica</strong><p>'+number(c.micro)+' microempresas y '+number(c.small)+' pequeñas empresas registradas por PRODUCE (2015). Requiere actualizar la actividad actual.</p></div>'+
 '<div class="go-signal"><strong>Oferta financiera observable</strong><p>'+number(d.coverage.sbs?c.offices:null)+' oficinas, '+number(d.coverage.sbs?c.atm:null)+' cajeros y '+number(d.coverage.sbs?c.pos:null)+' terminales POS reportados por SBS (2025). No son canales equivalentes.</p></div>'+
 (d.record?'<div class="go-score"><strong>'+d.record.score.toFixed(1)+'/100</strong><div class="go-scorebar"><i style="width:'+d.record.score+'%"></i></div></div><p class="go-muted">Índice territorial exploratorio (IIT), no probabilidad de captar clientes. Posición '+number(d.regionalRank)+' de '+number(d.regionCount)+' distritos con ambas fuentes en '+htmlSafe(d.r.departamento)+'. Pesos ilustrativos: '+state.w+'% microempresas históricas y '+(100-state.w)+'% menor presencia relativa de oficinas.</p>':
 '<div class="go-qualification">El puntaje está deshabilitado: para este distrito faltan variables de alguna de las dos fuentes. Se puede investigar, pero no incluirlo en una clasificación comparable.</div>')+'</div>';
}
function decision(d){const r=d.r;
 let hypothesis = 'Investigar si existen negocios actualmente operativos con necesidades de financiamiento aún no atendidas.';
 if(d.coverage.municipal) hypothesis='Contrastar las licencias del municipio con la actividad actual para identificar sectores cuya demanda merezca evaluación.';
 return '<div class="go-block"><div class="go-kicker">03 · Informe de oportunidad</div><h3>Territory Opportunity Brief</h3>'+ 
 '<div class="go-signal"><strong>Hechos observados</strong><p>La base PRODUCE registró '+number(d.coverage.produce?r.empresas_2015:null)+' empresas en 2015; la SBS reportó '+number(d.coverage.sbs?r.sbs_puntos_2025:null)+' puntos de atención en 2025.</p></div>'+
 '<div class="go-signal"><strong>Hipótesis comercial por validar</strong><p>'+htmlSafe(hypothesis)+'</p></div>'+
 '<div class="go-signal"><strong>Producto candidato para investigar</strong><p>Financiamiento empresarial para capital de trabajo o inversión, únicamente si el negocio confirma una necesidad y el producto figura en el catálogo vigente de Caja Trujillo. No existe precalificación.</p></div>'+
 '<div class="go-signal"><strong>Próxima acción sugerida</strong><p>Realizar prospección exploratoria con el asesor, verificar actividad, registrar interés y confirmar consentimiento para contacto o seguimiento.</p></div>'+
 '<div class="go-qualification">Este análisis se basa en datos territoriales de años distintos. No acredita clientes actuales, brechas de inclusión financiera ni elegibilidad crediticia.</div>'+
 '<div class="go-actionbar"><button type="button" data-go-brief class="go-primary">Exportar informe con evidencias</button><button type="button" data-view="sources">Consultar auditoría de fuentes</button></div></div>';
}
function benchmarkCard(d){
 const region=rankedInRegion(d.r);
 const m0=[...region].sort((a,b)=>(b.micro_2015||0)-(a.micro_2015||0));
 const m1=region;
 const calc=(arr)=>{let selected=[],cost=0;for(const a of arr){if(cost+a.cost<=I.budget){selected.push(a);cost+=a.cost;}}return {rows:selected,cost};};
 const b0=calc(m0),b1=calc(m1);
 // Optimización 0/1: top 30 candidatos del índice, idéntica a la implementación principal.
 const oldBudget=state.budget;
 const oldDep=state.dep;
 state.dep=d.r.departamento;state.budget=I.budget;
 const b2=simulatePlan(region,I.budget);
 state.budget=oldBudget;state.dep=oldDep;
 const items=[['M0 · Volumen histórico',b0.rows,b0.cost],['M1 · IIT multicriterio',b1.rows,b1.cost],['M2 · Optimizador',b2,b2.reduce((a,r)=>a+r.cost,0)]];
 const aPlan=state.plan.map(u=>region.find(r=>r.ubigeo===u)).filter(Boolean);
 return '<div class="go-block"><div class="go-kicker">04 · Diseño de campaña</div><h3>Comparación de selección territorial</h3><p class="go-muted">Presupuesto supuesto: '+money(I.budget)+'. Los costos no provienen de Caja Trujillo; sirven únicamente para ensayar el optimizador.</p>'+
 '<table class="go-compare"><thead><tr><th>Modelo</th><th>Distritos</th><th>Costo supuesto</th><th>Suma IIT</th></tr></thead><tbody>'+items.map(([name,arr,cost])=>'<tr><td><b>'+htmlSafe(name)+'</b></td><td>'+number(arr.length)+'</td><td>'+money(cost)+'</td><td>'+arr.reduce((v,r)=>v+r.score,0).toFixed(1)+'</td></tr>').join('')+'</tbody></table>'+
 '<div class="go-row"><span>Carpeta de campaña actual</span><b>'+number(aPlan.length)+' distrito(s)</b></div>'+
 '<div class="go-actionbar"><button type="button" class="go-primary" data-go-add>Incluir '+htmlSafe(d.r.nombre_distrito||d.r.ubigeo)+'</button><button type="button" data-go-optimize>Usar selección M2</button><button type="button" data-go-export>Exportar campaña JSON</button></div>'+
 '<p class="go-subtle" style="margin-top:10px">La campaña exportada contiene distritos reales y evidencia por UBIGEO, pero no empresas ni contactos individualizados.</p></div>';
}
function followUp(d){
 const current=state.feedback.filter(f=>String(f.territory_ubigeo)===d.r.ubigeo);
 const hypothetical=current.filter(f=>f.tipo_dato==='SINTETICO'||/fictici|simulac/i.test(String(f.observaciones||'')));
 return '<div class="go-block"><div class="go-kicker">05 · Ejecución y medición</div><h3>Validación del territorio en campo</h3><p class="go-muted">Después de exportar la campaña, el asesor registra hallazgos en GeoGrowth Campo. No hay visitas reales en las fuentes públicas; se mostrarán únicamente si se importan resultados.</p>'+
 '<div class="go-metrics" style="grid-template-columns:repeat(2,minmax(0,1fr))">'+metric(current.length,'Registros recibidos del territorio')+metric(hypothetical.length,'Registros señalados como simulación')+'</div>'+
 '<div class="go-actionbar"><a href="GeoGrowth_AI_Campo_V3.html?ubigeo='+encodeURIComponent(d.r.ubigeo)+'" target="_blank" rel="noopener" class="go-primary">Abrir app del asesor</a><button type="button" data-view="campaign">Importar resultados de campo</button></div>'+
 '<p class="go-subtle" style="margin-top:10px">La captura de una necesidad y la aceptación comercial deben verificarse, y no equivalen a otorgamiento de crédito.</p></div>';
}
function renderWorkflow(){
 const d=I.lastRun;
 return pagehead('Inteligencia territorial en operación','Elige un distrito y se ejecuta un análisis sobre el Data Pack público ya integrado')+
 '<div class="go-intro"><div><span class="go-smallcaps" style="color:#80d6da">CAJA TRUJILLO · EJE 2 · COM-01</span><h2>¿Dónde investigar nuevas oportunidades comerciales?</h2><p>Selecciona un territorio real. GeoGrowth AI cruza las fuentes disponibles, calcula señales, prepara una propuesta de prospección y permite exportar una campaña para validarla en campo.</p></div><div class="go-sticker">Análisis territorial reproducible</div></div>'+
 picker()+
 (!d?'<div class="go-empty"><strong>Selecciona un distrito para ejecutar el análisis.</strong><p style="margin-top:8px">Puedes elegir Trujillo, Lima Cercado, Arequipa o Cajamarca, o cualquier otro UBIGEO del Data Pack. Los resultados se calculan automáticamente sin una demostración guiada.</p></div>':
 '<div class="go-pipeline"><div class="go-stage"><strong>Integración</strong><small>'+ (d.coverage.produce?'PRODUCE 2015':'Sin PRODUCE')+' · '+(d.coverage.sbs?'SBS 2025':'Sin SBS')+'</small></div><div class="go-stage"><strong>Scoring territorial</strong><small>'+(d.record?d.record.score.toFixed(1)+'/100 · IIT exploratorio':'No comparable')+'</small></div><div class="go-stage"><strong>Investigación</strong><small>Informe con evidencia y límites</small></div><div class="go-stage"><strong>Acción comercial</strong><small>Campaña de validación por UBIGEO</small></div></div>'+
 '<div class="go-head" style="margin-bottom:12px"><h3>Resultado · '+htmlSafe(d.r.nombre_distrito||d.r.ubigeo)+', '+htmlSafe(d.r.departamento)+' ('+htmlSafe(d.r.ubigeo)+')</h3><span class="go-subtle">Consultado al Data Pack local · sin APIs crediticias</span></div>'+
 '<div class="go-layout"><div>'+facts(d)+analyse(d)+decision(d)+'</div><div>'+benchmarkCard(d)+followUp(d)+'</div></div>');
}
const mapNav=NAV.find(n=>n[0]==='story');
if(mapNav){const i=NAV.indexOf(mapNav);NAV.splice(i,1);}
if(!NAV.some(n=>n[0]==='work'))NAV.splice(1,0,['work','Analizar territorio','▦']);
const oldRender=render;
render=function(){
 if(state.view==='work'){
   if(activeMap){try{activeMap.remove();}catch(e){}activeMap=null;}
   renderNav();query('content').innerHTML=renderWorkflow();
   return;
 }
 oldRender();
};
const oldHome=renderHome;
renderHome=function(){return '<div class="go-pick" style="margin-bottom:17px"><div class="go-head"><h3>Ejecutar análisis territorial con datos públicos</h3><span class="go-subtle">PRODUCE · SBS · Licencias municipales parciales</span></div><p class="go-muted">No necesitas casos empresariales ficticios. Selecciona un distrito real y el sistema produce el análisis y la campaña en una única pantalla.</p><div class="go-actionbar"><button type="button" data-view="work" class="go-primary">Analizar un territorio</button><button type="button" data-go-example="130101">Analizar Trujillo</button></div></div>'+oldHome();};
// Interacciones del espacio operativo; no modifica la cartografía.
document.addEventListener('change',e=>{
 const t=e.target;
 if(t.id==='go-dep'){
   const list=DATA.filter(a=>a.departamento===t.value).sort((a,b)=>(a.nombre_distrito||a.ubigeo).localeCompare(b.nombre_distrito||b.ubigeo,'es'));
   const selectEl=query('go-ubigeo');
   I.department=t.value;I.chosen=null;I.lastRun=null;state.plan=[];
   if(selectEl)selectEl.innerHTML='<option value="">Seleccione un distrito para ejecutar el análisis</option>'+list.map(r=>'<option value="'+htmlSafe(r.ubigeo)+'">'+htmlSafe(r.nombre_distrito||'UBIGEO '+r.ubigeo)+' · '+r.ubigeo+'</option>').join('');
   // Preservar el departamento elegido y limpiar cualquier análisis anterior.
   render();
 }else if(t.id==='go-ubigeo'){
   if(t.value)select(byUbigeo(t.value));
 }else if(t.id==='go-budget'){
   I.budget=Math.max(500,Math.min(25000,Number(t.value||2400)));
   if(I.chosen){I.lastRun=compute(byUbigeo(I.chosen));render();}
 }
});
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-go-example],[data-go-add],[data-go-optimize],[data-go-export],[data-go-brief]');if(!t)return;
 if(t.dataset.goExample){select(byUbigeo(t.dataset.goExample));return;}
 const d=I.lastRun;if(!d)return;
 if(t.hasAttribute('data-go-add')){
   if(!d.record){toast('Este distrito carece del cruce SBS–PRODUCE necesario para el ranking.');return;}
   if(!state.plan.includes(d.r.ubigeo)){state.plan.push(d.r.ubigeo);toast('Distrito incorporado a la campaña');}
   else toast('El distrito ya está en la campaña');
   render();
 }
 if(t.hasAttribute('data-go-optimize')){
   const oldB=state.budget,oldD=state.dep;
   state.budget=I.budget;state.dep=d.r.departamento;
   state.plan=simulatePlan(getScored(),state.budget).map(x=>x.ubigeo);
   state.budget=oldB;state.dep=oldD;
   render();toast('Selección M2 aplicada con el presupuesto supuesto.');
 }
 if(t.hasAttribute('data-go-export')){
   if(!state.plan.length){toast('Agrega al menos un distrito antes de exportar.');return;}
   const old=state.budget;state.budget=I.budget;exportPlan();state.budget=old;
 }
 if(t.hasAttribute('data-go-brief'))exportBrief();
});
if(new URLSearchParams(window.location.search).get('map')==='1')state.view='explore';
else state.view='work';
render();
})();
