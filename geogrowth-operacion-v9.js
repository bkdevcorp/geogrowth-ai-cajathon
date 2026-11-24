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

/* V9: secciones independientes sin tocar mapas ni datos */
const STAGES=[['work','01 · Seleccionar territorio'],['score','02 · Scoring IIT'],['opportunity','03 · Opportunity Brief'],['plan','04 · Diseño de campaña'],['execution','05 · Ejecución y resultados']];
const stageLabels={work:'Seleccionar territorio',score:'Scoring territorial',opportunity:'Oportunidad investigable',plan:'Diseñar campaña',execution:'Ejecución y resultados'};
const stagedStyle=document.createElement('style');
stagedStyle.textContent='.v9-stages{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:0 0 18px}.v9-stages button{background:#fff;border:1px solid #d9e5f2;border-radius:10px;text-align:left;color:#244b75;font-size:11px;font-weight:800;padding:12px;min-height:58px;cursor:pointer}.v9-stages button.active{background:#e9f3ff;border-color:#2d70d6;color:#164b9d}.v9-tip{border:1px solid #cddfec;background:#f1f8fd;border-radius:10px;padding:15px;color:#355c7b;line-height:1.65;font-size:12px;margin:12px 0}.v9-warning{border:1px solid #ecd6b3;background:#fff7e9;border-radius:10px;padding:14px;color:#7a5a28;font-size:12px;line-height:1.65;margin:12px 0}.v9-formula{padding:16px;margin:14px 0;border-radius:11px;background:#ecf4fe;text-align:center;font-size:21px;color:#1b4c84;font-weight:800}.v9-stack{display:grid;gap:10px}.v9-step{padding:13px;background:#f6faff;border:1px solid #d9e9f5;border-radius:10px}.v9-step b{font-size:12px;color:#183e66}.v9-step p{font-size:11px;color:#5a738a;line-height:1.65;margin-top:5px}.v9-pill{display:inline-block;border:1px solid #cddfed;background:#f0f7ff;border-radius:7px;padding:5px 9px;font-size:10px;margin:5px 5px 0 0}.v9-resultrow{display:flex;gap:12px;flex-wrap:wrap;margin:13px 0}.v9-resultrow span{background:#f1f7fe;padding:12px 15px;border-radius:10px;border:1px solid #d9e7f5;font-size:12px;color:#315879}.v9-resultrow b{display:block;font-size:20px;color:#184477}.v9-btn{background:#235fcb;border:1px solid #235fcb;border-radius:9px;color:white;padding:10px 13px;cursor:pointer;font-weight:800;font-size:12px}.v9-btn.alt{background:white;color:#285c9e;border-color:#cadbec}.v9-tbl{width:100%;border-collapse:collapse;font-size:11px;margin:12px 0}.v9-tbl th,.v9-tbl td{padding:11px;border-bottom:1px solid #e5edf5;text-align:left}.v9-tbl th{background:#f3f8fd;color:#416789}@media(max-width:840px){.v9-stages{grid-template-columns:repeat(2,minmax(0,1fr))}}';
document.head.appendChild(stagedStyle);
function fmtV9(v,d=2){return Number(v||0).toLocaleString('es-PE',{minimumFractionDigits:d,maximumFractionDigits:d})}
function v9Navigator(stage){return '<div class="v9-stages">'+STAGES.map(([id,label])=>'<button type="button" data-go-section="'+id+'" class="'+(stage===id?'active':'')+'">'+label+'</button>').join('')+'</div>'}
function v9Next(stage){const i=STAGES.findIndex(([k])=>k===stage);return i<STAGES.length-1?'<div class="go-actionbar"><button class="v9-btn" data-go-section="'+STAGES[i+1][0]+'">Continuar: '+STAGES[i+1][1]+' →</button></div>':''}
function scoreInfo(d){
 const region=rankedInRegion(d.r), r=d.r;
 if(!d.record)return '<div class="v9-warning">No hay registros comparables de PRODUCE y SBS para calcular IIT en este distrito.</div>';
 const mxE=Math.max(1,...region.map(t=>Math.log1p(t.micro_2015||0)));
 const mxO=Math.max(1,...region.map(t=>Math.log1p(t.sbs_oficinas_2025||0)));
 const E=Math.log1p(r.micro_2015||0)/mxE, B=1-Math.log1p(r.sbs_oficinas_2025||0)/mxO;
 const w=state.w/100, cE=100*w*E,cB=100*(1-w)*B;
 return '<div class="go-block"><h3>¿De dónde sale el puntaje '+fmtV9(cE+cB,1)+'/100?</h3><div class="v9-formula">IIT = 100 × ('+fmtV9(w)+' × E + '+fmtV9(1-w)+' × B)</div>'+
 '<div class="v9-stack"><div class="v9-step"><b>E = '+fmtV9(E,3)+' · Concentración relativa de microempresas</b><p>Se utiliza PRODUCE 2015: '+number(r.micro_2015)+' microempresas, transformadas con log(1+n) y divididas por el máximo departamental. Aporta <b>'+fmtV9(cE,1)+' puntos</b>.</p></div>'+
 '<div class="v9-step"><b>B = '+fmtV9(B,3)+' · Menor presencia relativa de oficinas</b><p>Se utiliza SBS 2025: '+number(r.sbs_oficinas_2025)+' oficinas. B = 1 − log(1+oficinas)/máximo departamental. Aporta <b>'+fmtV9(cB,1)+' puntos</b>.</p></div></div>'+
 '<div class="go-actionbar"><label>Peso E (%) <input type="number" id="go-score-weight" min="0" max="100" step="5" value="'+state.w+'" style="width:85px;margin-left:7px;padding:8px"></label><span style="font-size:12px">Peso B: '+(100-state.w)+'%</span></div>'+
 '<div class="v9-warning"><b>Interpretación:</b> no es una tasa de captación ni una medición de inclusión real. La comparación se calcula solo dentro de '+htmlSafe(r.departamento)+'.</div></div>';
}
function decisionInfo(d){
 const r=d.r,priority=d.regionalRank==null?'No comparable':d.regionalRank<=Math.ceil(d.regionCount*.25)?'Prioridad exploratoria alta':'Investigar según recursos disponibles';
 const licenses=d.coverage.municipal?'Se cuenta con '+number(r.licencias_municipales_ref)+' registros administrativos de '+htmlSafe(r.anio_licencias)+'.':'No hay licencias municipales disponibles para este distrito.';
 return '<div class="go-block"><h3>Decisión que proponemos: '+priority+'</h3>'+
 '<div class="v9-stack"><div class="v9-step"><b>1. Evidencia concreta</b><p>PRODUCE 2015: '+number(r.micro_2015)+' microempresas; SBS 2025: '+number(r.sbs_oficinas_2025)+' oficinas y '+number(r.sbs_puntos_2025)+' puntos financieros. '+licenses+'</p></div>'+
 '<div class="v9-step"><b>2. Segmento que vale la pena investigar</b><p>Micro y pequeñas empresas que operen hoy en el distrito. Esto es una hipótesis comercial, no una lista de clientes identificados.</p></div>'+
 '<div class="v9-step"><b>3. Oferta que podríamos evaluar</b><p>Capital de trabajo o financiamiento de activos fijos solo si el negocio confirma la necesidad y cumple los requisitos vigentes de Caja Trujillo.</p></div>'+
 '<div class="v9-step"><b>4. Siguiente acción operativa</b><p>Verificar negocios activos, seleccionar establecimientos con fuente autorizada, asignar asesor y registrar visitas/interés/necesidad confirmada.</p></div>'+
 '<div class="v9-step"><b>5. Lo que aún no sabemos</b><p>Empresas activas en 2026, contactos válidos, demanda real de crédito, población adulta, cobertura propia de la Caja y resultados históricos de campañas.</p></div></div>'+
 '<div class="v9-tip"><b>Producto de la investigación:</b> una oportunidad de prospección sustentada para validar en campo, no un crédito preaprobado ni una predicción de conversión.</div><div class="go-actionbar"><button class="v9-btn alt" data-go-brief="1">Exportar informe con evidencias</button><button class="v9-btn alt" data-view="sources">Consultar fuentes</button></div></div>';
}
function campaignInfo(d){
 const region=rankedInRegion(d.r);
 const m0=greedy([...region].sort((a,b)=>(b.micro_2015||0)-(a.micro_2015||0)),I.budget);
 const m1=greedy(region,I.budget),m2=simulatePlan(region,I.budget);
 const selections=[['M0','Mayor volumen histórico',m0],['M1','Mayor IIT',m1],['M2','Optimización 0/1',m2]];
 const plan=state.plan.map(u=>region.find(t=>t.ubigeo===u)).filter(Boolean);
 return '<div class="go-block"><h3>¿Qué decisión tomará Caja Trujillo?</h3><p class="go-muted">Comparar tres maneras de elegir territorios según el mismo presupuesto <b>supuesto</b>. La regla M2 busca el máximo IIT acumulado sin superar el costo de campaña. No optimiza conversiones observadas.</p>'+
 '<table class="v9-tbl"><thead><tr><th>Método</th><th>Enfoque</th><th>Distritos</th><th>Costo</th><th>IIT acumulado</th><th></th></tr></thead><tbody>'+selections.map(([id,label,rs])=>'<tr><td><b>'+id+'</b></td><td>'+label+'</td><td>'+rs.length+'</td><td>S/ '+number(rs.reduce((v,t)=>v+t.cost,0))+'</td><td>'+fmtV9(rs.reduce((v,t)=>v+t.score,0),1)+'</td><td><button class="v9-btn alt" data-go-model="'+id+'">Usar '+id+'</button></td></tr>').join('')+'</tbody></table>'+
 '<div class="v9-tip"><label for="go-budget"><b>Presupuesto supuesto (S/):</b></label> <input id="go-budget" type="number" value="'+I.budget+'" min="500" max="25000" step="100" style="width:150px;margin-left:10px;padding:9px;border-radius:8px;border:1px solid #ccdbe6"> Cambia el presupuesto para recalcular los tres modelos.</div><div class="v9-tip">Selecciona M0, M1 o M2 para cargar una propuesta. Después exporta el JSON para la aplicación del asesor.</div><h3>Territorios incluidos ('+plan.length+')</h3>'+
 (plan.length?'<div class="v9-stack">'+plan.map(t=>'<div class="v9-step"><b>'+htmlSafe(t.nombre_distrito||t.ubigeo)+' · '+t.ubigeo+'</b><p>IIT: '+fmtV9(t.score,1)+' | Costo supuesto: S/ '+number(t.cost)+' | Fuente: '+htmlSafe(t.evidencia)+'</p></div>').join('')+'</div>':'<p class="v9-warning">No hay territorios seleccionados. Pulsa «Usar M2» para comenzar.</p>')+
 '<div class="go-actionbar"><button type="button" class="v9-btn" data-go-campaign-export="'+1+'" '+(plan.length?'':'disabled')+'>Exportar campaña JSON</button><button type="button" class="v9-btn alt" data-go-section="execution">Ver ejecución</button></div></div>';
}
function executionInfo(d){
 const items=state.feedback.filter(r=>String(r.territory_ubigeo)===d.r.ubigeo);
 const sims=items.filter(r=>r.tipo_dato==='SINTETICO'||/SIMULACI[ÓO]N|FICTICI/i.test(String(r.observaciones||''))).length;
 return '<div class="go-block"><h3>¿Qué hace el asesor y qué vuelve al dashboard?</h3><div class="v9-stack">'+
 ['Exportar campaña desde la sección 04. Contiene territorios y evidencias, no clientes individuales.','Importar el JSON en GeoGrowth Campo, o abrir directamente el distrito desde el botón de abajo.','Validar negocios vigentes, registrar interés declarado, necesidad, siguiente acción y observaciones.','Exportar desde Campo los resultados JSON e importarlos aquí para revisar la respuesta comercial.'].map((s,i)=>'<div class="v9-step"><b>'+(i+1)+'. '+['Asignar','Recibir','Visitar','Retroalimentar'][i]+'</b><p>'+s+'</p></div>').join('')+
 '</div><div class="go-actionbar"><a href="GeoGrowth_AI_Campo_V3.html?ubigeo='+encodeURIComponent(d.r.ubigeo)+'" target="_blank" rel="noopener" class="v9-btn">Abrir asesor con '+htmlSafe(d.r.nombre_distrito||d.r.ubigeo)+'</a><label class="v9-btn alt">Importar resultados JSON<input type="file" id="go-import-results" accept=".json,application/json" hidden></label></div>'+
 '<div class="v9-resultrow"><span><b>'+items.length+'</b>Observaciones recibidas</span><span><b>'+items.filter(r=>r.resultado==='Interesado').length+'</b>Casos con interés declarado</span><span><b>'+sims+'</b>Simulaciones declaradas</span></div>'+
 (items.length?'<table class="v9-tbl"><thead><tr><th>Resultado</th><th>Necesidad</th><th>Acción</th><th>Estado</th></tr></thead><tbody>'+items.slice(0,30).map(r=>'<tr><td>'+htmlSafe(r.resultado)+'</td><td>'+htmlSafe(r.necesidad)+'</td><td>'+htmlSafe(r.siguiente_accion)+'</td><td>'+((r.tipo_dato==='SINTETICO')?'Simulado':'Reportado, por verificar')+'</td></tr>').join('')+'</tbody></table>':'<div class="v9-warning">Todavía no hay resultados de campo para este distrito. Las fuentes públicas no incluyen visitas ni conversiones.</div>')+
 '<div class="v9-tip">Los resultados importados permiten evaluar interés y cobertura de la prospección, pero no equivalen a desembolsos o clientes captados.</div></div>';
}
function renderWorkflow(){
 const stage=STAGES.some(a=>a[0]===state.view)?state.view:'work';
 const d=I.lastRun;
 if(d)I.lastRun=compute(d.r);
 const curr=I.lastRun;
 const body=stage==='work'?picker()+(curr?facts(curr):'<div class="go-empty">Selecciona departamento y distrito, o un acceso rápido, para iniciar.</div>'):
 !curr?'<div class="go-empty">Primero selecciona un distrito en «01 · Seleccionar territorio».</div>':
 stage==='score'?analyse(curr)+scoreInfo(curr):
 stage==='opportunity'?decisionInfo(curr):
 stage==='plan'?campaignInfo(curr):
 executionInfo(curr);
 return pagehead(stageLabels[stage],'GeoGrowth AI · Data Pack oficial por UBIGEO · '+(curr?curr.r.nombre_distrito+' · '+curr.r.ubigeo:'Selecciona un territorio'))+
 v9Navigator(stage)+body+(curr?v9Next(stage):'');
}
for(let j=NAV.length-1;j>=0;j--)if(['story','rank','brief','campaign','work'].includes(NAV[j][0]))NAV.splice(j,1);
const startIdx=NAV.findIndex(n=>n[0]==='home')+1;
STAGES.forEach((step,i)=>NAV.splice(startIdx+i,0,[step[0],step[1],'▦']));
const oldRender=render;
render=function(){
 if(STAGES.some(a=>a[0]===state.view)){
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

document.addEventListener('click',e=>{
 const t=e.target.closest('[data-go-section],[data-go-model],[data-go-campaign-export]');if(!t)return;
 if(t.dataset.goSection){state.view=t.dataset.goSection;render();window.scrollTo(0,0);return;}
 const d=I.lastRun;if(!d)return;
 if(t.dataset.goModel){
  const region=rankedInRegion(d.r);
  const mode=t.dataset.goModel;
  const rows=mode==='M0'?greedy([...region].sort((a,b)=>(b.micro_2015||0)-(a.micro_2015||0)),I.budget):
             mode==='M1'?greedy(region,I.budget):simulatePlan(region,I.budget);
  state.plan=rows.map(r=>r.ubigeo);render();toast('Modelo '+mode+' aplicado con datos del departamento.');return;
 }
 if(t.hasAttribute('data-go-campaign-export')){const previous=state.budget;state.budget=I.budget;exportPlan();state.budget=previous;}
});
document.addEventListener('change',async e=>{
 if(e.target.id==='go-score-weight'){
  state.w=Math.max(0,Math.min(100,Number(e.target.value)||0));if(I.lastRun)I.lastRun=compute(I.lastRun.r);state.plan=[];render();
 }
 if(e.target.id==='go-import-results'){
  const file=e.target.files?.[0];if(!file)return;
  try{const d=JSON.parse(await file.text());if(d.format!=='GeoGrowthFieldResultsV3'||!Array.isArray(d.visitas))throw Error('Formato incorrecto');
      state.feedback=d.visitas.filter(v=>v&&/^\d{6}$/.test(String(v.territory_ubigeo||''))).slice(0,1000);render();toast('Resultados importados: '+state.feedback.length);}
  catch(err){toast('No se pudo importar: '+err.message)}
 }
});

if(new URLSearchParams(window.location.search).get('map')==='1')state.view='explore';
else state.view='work';
render();
})();
