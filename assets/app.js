/* GeoGrowth AI V10 — Portales Administrador y Analista. Solo datos públicos y validación comercial.
   No realiza acciones crediticias, contactos, acceso a sistemas privados ni predicción de conversión.
*/
(()=>{'use strict';
const ROLE=document.body.dataset.role||'analista';
const NS='gg_v10_';
const fmt=n=>Number(n||0).toLocaleString('es-PE');
const cash=n=>'S/ '+fmt(n);
const pct=n=>(Number(n||0)*100).toFixed(1)+'%';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const str=s=>String(s??'');
const uuid=()=>('GG-'+Date.now()+'-'+Math.floor(Math.random()*1e5));
const $=id=>document.getElementById(id);
const tryJSON=(key,def)=>{try{return JSON.parse(localStorage.getItem(NS+key))??def}catch{return def}};
const store=(key,val)=>{try{localStorage.setItem(NS+key,JSON.stringify(val))}catch(e){toast('Almacenamiento local lleno; exporta archivos para conservar los cambios.')}};
const dload=(name,value,mime='application/json')=>{
 const blob=new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type:mime});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},600);
};
const warning='<div class="callout warn"><b>Alcance de la evidencia.</b> Las licencias son registros administrativos históricos; no prueban que la empresa se constituyó ese día, que continúe operando, que necesite un crédito ni que cumpla requisitos. Los contactos y conversiones no se generan con estos datos.</div>';
let app={territories:[],licencias:[],summary:{},sources:[],nav:ROLE==='admin'?'resumen':'bandeja',dept:ROLE==='admin'?'La Libertad':'Arequipa',mapDep:ROLE==='admin'?'Todo el Perú':'Arequipa',mapUbigeo:null,licenseUbigeo:null,
 leadId:null,query:'',sector:'Todos',status:'Vigentes',page:0,budget:2400,maxZones:4,
 prefs:tryJSON('prefs',{w:55}),campaign:tryJSON('campaign',null),picks:tryJSON('picks',[]),feedback:tryJSON('feedback',[]),
 imported:tryJSON('imported',[]),plan:[],viewMode:'m2',runCount:0};
function toast(message){const t=$('toast');t.textContent=message;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,4200);}
function leadById(id){return app.licencias.find(r=>r.id===id)}
function depRows(dep){return app.territories.filter(r=>r.departamento===dep)}
function valid(r){return r&&r.ambas_fuentes&&r.micro_2015!=null&&r.sbs_oficinas_2025!=null}
function scored(dep,w=app.prefs.w){
 const rows=depRows(dep).filter(valid);
 if(!rows.length)return [];
 const maxE=Math.max(1e-9,...rows.map(r=>Math.log1p(Math.max(0,Number(r.micro_2015)||0))));
 const maxO=Math.max(1e-9,...rows.map(r=>Math.log1p(Math.max(0,Number(r.sbs_oficinas_2025)||0))));
 return rows.map(r=>{
   const E=Math.log1p(Math.max(0,Number(r.micro_2015)||0))/maxE;
   const B=1-Math.log1p(Math.max(0,Number(r.sbs_oficinas_2025)||0))/maxO;
   const compE=w*E;const compB=(100-w)*B;
   const cost=450+(Number(r.ubigeo.slice(-2))%4)*150;
   return {...r,E,B,compE,compB,score:Math.round((compE+compB)*10)/10,cost};
 }).sort((a,b)=>b.score-a.score);
}
function optimize(rows,budget,maxZones){
 // 0/1 knapsack with an additional territory limit; values are IIT scores, not real revenue.
 const cap=Math.floor(budget/50),slots=Math.max(1,maxZones),items=rows.slice(0,30);
 let dp=Array.from({length:slots+1},()=>Array(cap+1).fill(null));dp[0][0]={value:0,indices:[]};
 items.forEach((r,i)=>{
   const c=Math.ceil(r.cost/50);
   for(let k=slots;k>=1;k--)for(let b=cap;b>=c;b--){
     const prev=dp[k-1][b-c];if(!prev)continue;
     const score=prev.value+r.score,old=dp[k][b];
     if(!old||score>old.value+1e-9)dp[k][b]={value:score,indices:[...prev.indices,i]};
   }
 });
 let best=dp[0][0];for(const v of dp)for(const x of v)if(x&&x.value>best.value)best=x;
 return best.indices.map(i=>items[i]);
}
function greedy(rows,budget,maxZones){let picked=[],used=0;for(const r of rows){if(picked.length>=maxZones)break;if(used+r.cost<=budget){picked.push(r);used+=r.cost}}return picked}
function modelComparison(dep=app.dept){
 const s=scored(dep),m0=greedy([...s].sort((a,b)=>b.micro_2015-a.micro_2015),app.budget,app.maxZones);
 const m1=greedy(s,app.budget,app.maxZones),m2=optimize(s,app.budget,app.maxZones);
 return {m0,m1,m2};
}
function topLeads(dep,limit=8){return app.licencias.filter(r=>r.departamento===dep&&['VIGENTE','ACTIVA'].includes(r.estado)).sort((a,b)=>b.puntaje-a.puntaje).slice(0,limit)}
function resultStats(){const a=app.feedback,real=a.filter(v=>v.tipo_dato==='REAL'),demo=a.filter(v=>v.tipo_dato==='SINTETICO'),
 inspected=a.filter(v=>v.resultado!=='Pendiente'),interested=a.filter(v=>v.resultado==='Interesado');
 return {total:a.length,real:real.length,demo:demo.length,inspected:inspected.length,interested:interested.length,follow:a.filter(v=>v.siguiente_accion==='Seguimiento autorizado').length};}
function summaryCard(n,caption){return `<div class="kpi"><b>${esc(n)}</b><small>${esc(caption)}</small></div>`}
function pagehead(k,title,subtitle){return `<div class="page-head"><div><span class="eyebrow">${esc(k)}</span><h1>${esc(title)}</h1><p class="subtitle">${esc(subtitle)}</p></div><span class="badge">${ROLE==='admin'?'Vista de administración':'Vista de analista'}</span></div>`}
function fieldSelect(id,label,options,val){return `<div class="field"><label for="${id}">${esc(label)}</label><select id="${id}">${options.map(v=>`<option value="${esc(v)}" ${v===val?'selected':''}>${esc(v)}</option>`).join('')}</select></div>`}
function formatDate(s){if(!s)return 'Sin fecha';const a=s.split('-');return `${a[2]}/${a[1]}/${a[0]}`}
function badgeStatus(s){const cls=['ACTIVA','VIGENTE'].includes(s)?'green':'warn';return `<span class="tag ${cls}">${esc(s)}</span>`}
function roleNav(){
 const navAdmin=[['resumen','Mapa y resumen'],['fuentes','Datos y nuevos registros'],['modelo','Fórmula IIT'],['campanas','Diseño de campañas'],['resultados','Resultados y embudo']];
 const navAnalyst=[['bandeja','Mapa y oportunidades'],['brief','Opportunity Brief'],['micanpana','Mi campaña'],['seguimiento','Seguimiento comercial']];
 const set=ROLE==='admin'?navAdmin:navAnalyst;
 $('nav').innerHTML=set.map(([id,name],i)=>`<button type="button" data-nav="${id}" class="${id===app.nav?'active':''}"><span class="number">${String(i+1).padStart(2,'0')}</span>${esc(name)}</button>`).join('');
 $('roleSwitch').innerHTML=ROLE==='admin'?`<a href="GeoGrowth_Analista.html" class="btn small">Abrir vista del analista</a>`:`<a href="GeoGrowth_Admin.html" class="btn small">Vista administrador</a>`;
 $('breadcrumb').textContent=(ROLE==='admin'?'Administrador':'Analista')+' / '+(set.find(x=>x[0]===app.nav)?.[1]||'GeoGrowth');
}
function render(){roleNav();
 const pages=ROLE==='admin'?{resumen:adminHome,fuentes:adminSources,modelo:adminModel,campanas:adminCampaign,resultados:adminResults}:
 {bandeja:analystInbox,brief:analystBrief,micanpana:analystCampaign,seguimiento:analystFollowup};
 $('content').innerHTML=(pages[app.nav]||Object.values(pages)[0])();
 window.GeoGrowthMapView?.mount(app);
}
function adminHome(){const st=resultStats();const hot=topLeads('Arequipa',4);const national=app.territories.length;
 return pagehead('Panel de control','Inteligencia comercial territorial','Monitorea fuentes, oportunidades investigables, campañas y resultados. Sin afirmar captación crediticia observada.')+
 `<div class="role-banner"><div><strong>GeoGrowth AI · Eje 2 de Caja Trujillo</strong><p>Transformamos registros públicos en señales para orientar la prospección. El analista valida cada oportunidad antes de ofrecer productos.</p></div><button class="btn teal" data-nav="fuentes">Revisar licencias detectadas</button></div>`+
 window.GeoGrowthMapView.panel(app,ROLE)+
 `<div class="kpi-grid">${summaryCard(fmt(national),'UBIGEO integrados (unión de fuentes)')}${summaryCard('1,725','UBIGEO con cruce SBS 2025 / PRODUCE 2015')}${summaryCard(fmt(app.summary.total||5507),'Expedientes/licencias municipales deduplicados')}${summaryCard(fmt(st.real),'Observaciones reales importadas')}</div>`+
 `<div class="stepflow">${['Fuentes públicas','Señales territoriales','Priorización y brief','Campaña operativa','Validación y retorno'].map((x,i)=>`<div class="step"><small>${String(i+1).padStart(2,'0')}</small><b>${esc(x)}</b></div>`).join('')}</div>`+
 `<div class="grid-2"><section class="card"><div class="card-header"><div><h2>Últimas licencias con datos nominativos</h2><p>Arequipa 2025 · Verificación pendiente</p></div><button class="btn small" data-go-analyst="1">Investigar oportunidades</button></div>${hot.map(r=>`<div class="stat-line"><span><b>${esc(r.nombre)}</b><small style="display:block">${formatDate(r.fecha)} · ${esc(r.sector)}</small></span><span class="badge">${r.puntaje}/100</span></div>`).join('')}<p class="muted" style="margin-top:12px">La fecha corresponde al otorgamiento de licencia; no indica apertura reciente ni garantiza operación actual.</p></section>`+
 `<section class="card"><div class="card-header"><div><h2>Retroalimentación recibida</h2><p>Separación de pruebas y observaciones reales</p></div></div><div class="kpi-grid" style="grid-template-columns:repeat(2,1fr)">${summaryCard(st.total,'Total registros')}${summaryCard(st.interested,'Interés declarado')}${summaryCard(st.demo,'Simulaciones')}${summaryCard(st.real,'Observaciones reales')}</div><button class="btn primary" data-nav="resultados">Abrir dashboard de resultados</button></section></div>`+warning;
}
function adminSources(){
 const last=app.summary;const years=last.anios_lima||{};const extras=app.imported||[];
 return pagehead('Calidad y procedencia','Datos públicos y nuevos registros','Verifica cobertura, año de cada archivo y señales de licencias que podrían requerir prospección prioritaria.')+
 `<div class="kpi-grid">${summaryCard(fmt(last.lima||4613),'Lima Cercado · licencias depuradas')}${summaryCard(fmt(last.arequipa||894),'Arequipa Cercado · licencias procesadas')}${summaryCard(fmt(years['2026']||695),'Licencias Lima con fecha 2026')}${summaryCard(fmt(extras.length),'Registros nuevos importados en esta sesión/navegador')}</div>`+
 `<div class="grid-2"><section class="card"><h2>Inventario verificable de fuentes</h2><div class="stat-line"><span>PRODUCE — padrón georreferenciado</span><b>2015</b></div><div class="stat-line"><span>SBS — puntos de atención</span><b>Dic. 2025</b></div><div class="stat-line"><span>Lima — expedientes de licencia</span><b>2024–2026</b></div><div class="stat-line"><span>Arequipa — licencias con nombre y giro</span><b>Jul.–dic. 2025</b></div><p class="muted" style="margin-top:12px">La cobertura municipal individual no es nacional. Los expedientes de Lima no incluyen nombre y domicilio comercial utilizables.</p><div class="actions-row"><a class="btn" target="_blank" href="data/fuentes_y_transformaciones.json">Ver manifiesto de datos</a><a class="btn" target="_blank" href="data/fuentes_licencias.json">Auditoría de licencias</a></div></section>`+
 `<section class="card"><h2>Detección de nuevos registros en cortes futuros</h2><p class="muted" style="margin:8px 0 12px">Al importar un nuevo corte normalizado, se comparan sus identificadores con los registros ya integrados. Se muestra “nuevo en el corte”, no “nueva empresa constituida”.</p><div class="callout">CSV admitido: <code>id,fecha,ubigeo,nombre,direccion,giro,estado</code>. No cargar RUC ni datos personales. Los resultados quedan en este navegador hasta que exportes un archivo.</div><div class="actions-row"><button class="btn small" data-template="licencias">Descargar plantilla CSV</button><label class="btn small">Importar corte CSV<input type="file" id="newLicenseFile" accept=".csv,text/csv" hidden></label></div><div class="callout warn">No existe una conexión automática en tiempo real con las municipalidades. La importación es manual y requiere validar procedencia y calidad de cada nuevo archivo.</div></section></div>`+
 `<section class="card"><div class="card-header"><div><h2>Registros nuevos detectados en el corte importado</h2><p>No estaban en el inventario cargado; no implica empresas nuevas ni procedencia municipal validada.</p></div><span class="badge amber">${extras.length} por auditar</span></div>${extras.length?leadRows(extras.slice().reverse().slice(0,20),true):'<div class="blank">No hay un nuevo corte importado. El sistema compara identificadores cuando se proporciona un CSV normalizado.</div>'}</section>`+
 `<section class="card"><div class="card-header"><div><h2>Señales para investigar</h2><p>Registros municipales publicados, ordenados por prioridad exploratoria</p></div></div>${leadRows(topLeads('Arequipa',6),true)}</section>`;
}
function modelSelect(){const deps=[...new Set(app.territories.map(x=>x.departamento))].sort((a,b)=>a.localeCompare(b,'es'));return fieldSelect('modelDep','Departamento de comparación',deps,app.dept)}
function modelExplain(r){if(!r)return `<div class="blank">Selecciona un distrito que disponga de información PRODUCE y SBS.</div>`;
 return `<div class="formula">IIT = (${app.prefs.w}% × E) + (${100-app.prefs.w}% × B) <small>Suma ponderada multicriterio · normalización logarítmica · escala 0–100</small></div>`+
 `<div class="grid-2" style="margin-top:14px"><div class="signal"><b>E — actividad empresarial histórica</b><p>E = ln(1 + microempresas) / máximo de ln(1 + microempresas) entre distritos comparables del departamento.</p><div class="stat-line"><span>Microempresas · PRODUCE 2015</span><b>${fmt(r.micro_2015)}</b></div><div class="stat-line"><span>E normalizado</span><b>${r.E.toFixed(3)}</b></div><div class="stat-line"><span>Aporte IIT</span><b>${r.compE.toFixed(1)} puntos</b></div></div>`+
 `<div class="signal"><b>B — menor presencia relativa de oficinas</b><p>B = 1 − ln(1 + oficinas SBS) / máximo de ln(1 + oficinas SBS) entre distritos comparables del departamento.</p><div class="stat-line"><span>Oficinas · SBS 2025</span><b>${fmt(r.sbs_oficinas_2025)}</b></div><div class="stat-line"><span>B normalizado</span><b>${r.B.toFixed(3)}</b></div><div class="stat-line"><span>Aporte IIT</span><b>${r.compB.toFixed(1)} puntos</b></div></div></div>`+
 `<div class="notice"><b>Resultado: ${r.score.toFixed(1)} de 100.</b> El puntaje solo compara distritos del mismo departamento. No es probabilidad de conversión ni mide inclusión financiera por habitante. El indicador B es una aproximación, no una medición directa de brecha financiera.</div>`;
}
function adminModel(){const rows=scored(app.dept);let key=app.modelUbigeo;if(!rows.some(x=>x.ubigeo===key))key=rows[0]?.ubigeo;const chosen=rows.find(x=>x.ubigeo===key);
 return pagehead('Metodología cuantitativa','Cómo se calcula el IIT','Índice de Investigación Territorial (IIT): método multicriterio de suma ponderada o Weighted Sum Model (WSM).')+
 `<div class="card"><div class="form-grid">${modelSelect()}${fieldSelect('modelUbigeo','Distrito a explicar',rows.map(x=>x.ubigeo),key).replace('</select>','</select><small>Ordenados por IIT (ver nombre debajo)</small>')}<div class="field"><label>Peso de actividad empresarial: <b>${app.prefs.w}%</b></label><input type="range" min="0" max="100" step="5" id="weight" value="${app.prefs.w}"><small>El peso de menor presencia de oficinas es ${100-app.prefs.w}%.</small></div></div><p class="muted" style="margin:10px 0">${chosen?esc(chosen.nombre_distrito||'UBIGEO '+chosen.ubigeo)+' — '+esc(chosen.ubigeo):'Sin coincidencia para explicar'}</p>${modelExplain(chosen)}</div>`+
 `<section class="card"><div class="card-header"><div><h2>Ranking territorial del departamento</h2><p>Solo distritos donde coexisten PRODUCE 2015 y SBS 2025</p></div><span class="badge">${rows.length} comparables</span></div>${rankRows(rows.slice(0,12))}</section>`+
 `<section class="card"><h2>¿Qué método matemático selecciona campañas?</h2><div class="grid-2"><div class="signal"><b>WSM — Modelo multicriterio</b><p>Convierte variables diferentes a una escala comparable y suma sus aportes según pesos definidos por el equipo. Produce un orden de investigación, no un pronóstico.</p></div><div class="signal"><b>Mochila 0/1 — Programación dinámica</b><p>Elige un conjunto de distritos para maximizar la suma de puntajes IIT respetando un presupuesto y un máximo de zonas. Un distrito entra o no entra (decisión binaria).</p></div></div><div class="formula" style="font-size:17px">Máx. Σ IIT<sub>z</sub> × x<sub>z</sub> <small>sujeto a Σ C<sub>z</sub> × x<sub>z</sub> ≤ presupuesto · x<sub>z</sub> ∈ {0,1} · Σx<sub>z</sub> ≤ zonas máximas</small></div><div class="callout warn">C<sub>z</sub> es un costo hipotético del prototipo. Sin datos históricos de prospección, no podemos concluir que el método genere más clientes.</div></section>`;
}
function rankRows(rows){return `<div class="tablewrap"><table><thead><tr><th>Distrito</th><th>UBIGEO</th><th class="num">Microempresas 2015</th><th class="num">Oficinas 2025</th><th class="num">IIT</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${esc(r.nombre_distrito||'Distrito '+r.ubigeo)}</strong></td><td>${esc(r.ubigeo)}</td><td class="num">${fmt(r.micro_2015)}</td><td class="num">${fmt(r.sbs_oficinas_2025)}</td><td class="num"><strong>${r.score.toFixed(1)}</strong></td></tr>`).join('')}</tbody></table></div>`}
function leadRows(leads,admin=false){return `<div class="tablewrap"><table><thead><tr><th>Licencia / negocio</th><th>Fecha de otorgamiento</th><th>Sector identificado</th><th>Prioridad</th><th>Acción</th></tr></thead><tbody>${leads.map(r=>`<tr><td><strong>${esc(r.nombre)}</strong><small style="display:block">${esc(r.departamento)} · ${esc(r.id)}</small></td><td>${formatDate(r.fecha)}</td><td>${esc(r.sector)}</td><td><span class="tag ${r.puntaje>=65?'green':'warn'}">${r.puntaje.toFixed(1)} / 100</span></td><td>${admin?`<a class="btn small" href="GeoGrowth_Analista.html?lead=${encodeURIComponent(r.id)}">Investigar</a>`:`<button class="btn small" data-lead="${esc(r.id)}">Ver ficha</button>`}</td></tr>`).join('')||'<tr><td colspan="5" class="empty-row">No se encontraron registros con estos filtros.</td></tr>'}</tbody></table></div>`}
function campaignStruct(territories,leads=[]){
 const ts=territories.map(r=>({ubigeo:r.ubigeo,nombre:r.nombre_distrito||'UBIGEO '+r.ubigeo,departamento:r.departamento,iit:r.score??null,costo_simulado:r.cost??0,evidencias:r.evidencia||''}));
 return {format:'GeoGrowthCampaignV3',version:10,campana_id:uuid(),fecha_creacion:new Date().toISOString(),
 source:'GeoGrowth AI — Eje 2 · COM-01',departamento:app.dept,budget_hipotetico:app.budget,
 peso_empresa_historica:app.prefs.w,criterio:'Investigación comercial exploratoria; ningún negocio está precalificado',
 advertencia:'Datos públicos históricos, costos hipotéticos y licencias pendientes de verificación. No constituye oferta de crédito.',
 territorios:ts,prospectos:leads.map(r=>({id:r.id,ubigeo:r.ubigeo,nombre:r.nombre,fecha_licencia:r.fecha,sector:r.sector,direccion:r.direccion||null,
    puntaje_preliminar:r.puntaje,estado_fuente:r.estado,fuente:r.fuente,necesidad_hipotesis:r.producto}))};
}
function campaignSave(c){app.campaign=c;store('campaign',c);toast('Campaña guardada en este navegador. Exporta JSON para usarla en otro dispositivo.');}
function selectedRegion(){return app.plan.map(u=>scored(app.dept).find(r=>r.ubigeo===u)).filter(Boolean)}
function campaignSummary(c){if(!c)return '<div class="blank">Todavía no se ha preparado una campaña.</div>';
 return `<div class="signal"><b>Campaña ${esc(c.campana_id)}</b><p>${c.territorios.length} territorios · ${c.prospectos?.length||0} registros de licencias por verificar · Presupuesto ilustrativo ${cash(c.budget_hipotetico)}</p><div class="actions-row"><button class="btn teal" data-export-campaign="1">Descargar JSON para aplicación móvil</button><a class="btn" href="GeoGrowth_Campo.html" target="_blank">Abrir GeoGrowth Campo</a></div><p class="muted">La campaña se almacena solo en el navegador. Para transferirla a otro equipo se utiliza el archivo JSON descargado.</p></div>`;
}
function adminCampaign(){const deps=[...new Set(app.territories.map(x=>x.departamento))].sort((a,b)=>a.localeCompare(b,'es'));
 const set=modelComparison(),chosen=set[app.viewMode]||set.m2;
 const metrics=key=>({count:set[key].length,cost:set[key].reduce((a,r)=>a+r.cost,0),value:set[key].reduce((a,r)=>a+r.score,0)});
 const picked=selectedRegion();
 return pagehead('Planeamiento comercial','Diseño de campañas','Compara estrategias y define una ruta de investigación territorial, con costos ilustrativos y resultados exportables.')+
 `<section class="card"><div class="card-header"><div><h2>1. Configurar capacidad de prospección</h2><p>Los parámetros no representan cifras operativas reales de Caja Trujillo.</p></div></div><div class="form-grid">${fieldSelect('campaignDep','Departamento',deps,app.dept)}<div class="field"><label for="budget">Presupuesto hipotético de visitas (S/)</label><input type="number" min="500" max="25000" step="50" id="budget" value="${app.budget}"></div><div class="field"><label for="maxZones">Máximo de distritos a visitar</label><input type="number" min="1" max="12" id="maxZones" value="${app.maxZones}"></div></div><div class="actions-row"><button class="btn primary" data-recalculate="1">Recalcular escenarios</button><span class="muted">Costo ilustrativo por distrito: entre S/ 450 y S/ 900, calculado con regla fija reproducible.</span></div></section>`+
 `<section class="card"><div class="card-header"><div><h2>2. Comparar estrategias M0 / M1 / M2</h2><p>¿Qué distritos investigaríamos con recursos limitados?</p></div></div><div class="grid-3">${[['m0','M0 · Volumen','Mayor cantidad histórica de microempresas'],['m1','M1 · Scoring IIT','Prioriza puntaje combinado'],['m2','M2 · Optimización','Maximiza IIT acumulado según presupuesto']].map(([k,name,desc])=>{const a=metrics(k);return `<div class="signal"><b>${esc(name)}</b><p>${esc(desc)}</p><div class="stat-line"><span>Distritos</span><b>${a.count}</b></div><div class="stat-line"><span>Costo ilustrativo</span><b>${cash(a.cost)}</b></div><div class="stat-line"><span>IIT acumulado</span><b>${a.value.toFixed(1)}</b></div><button class="btn small ${app.viewMode===k?'primary':''}" data-model="${k}">Ver selección</button></div>`}).join('')}</div><p class="callout">El M2 implementa <b>programación dinámica para la mochila 0/1</b>. Optimiza la suma IIT bajo las restricciones configuradas; no mide aumento de ingresos o conversión.</p><h3 style="margin:16px 0 8px">Distritos propuestos por ${app.viewMode.toUpperCase()}</h3>${rankRows(chosen)}<div class="actions-row"><button class="btn teal" data-apply-model="1">Aplicar estos distritos a la campaña</button></div></section>`+
 `<section class="card"><div class="card-header"><div><h2>3. Preparar el envío al asesor</h2><p>Selecciona distritos y, si existen, incorpora licencias para verificación individual.</p></div><span class="badge">${picked.length} distritos preparados</span></div>`+
 (picked.length?rankRows(picked):'<div class="blank">Pulsa «Aplicar estos distritos a la campaña» para preparar la selección.</div>')+
 `<div class="actions-row"><label class="field" style="display:flex;align-items:center;gap:9px;font-size:11px"><input id="includeLeads" type="checkbox" ${app.includeLeads?'checked':''}> Incluir hasta 8 licencias por distrito con registros disponibles</label></div><div class="actions-row"><button class="btn primary" data-save-campaign="1" ${!picked.length?'disabled':''}>Crear y guardar campaña</button></div>${campaignSummary(app.campaign)}</section>`;
}
function adminResults(){const st=resultStats();const records=app.feedback;
 const statuses=['Pendiente','Informativo','Interesado','Sin interés','No verificable'];const m=Math.max(1,...statuses.map(s=>records.filter(x=>x.resultado===s).length));
 const byRegion=Object.entries(records.reduce((o,x)=>{const t=app.territories.find(r=>r.ubigeo===x.territory_ubigeo);const label=t?.departamento||'Sin identificar';o[label]=(o[label]||0)+1;return o},{})).sort((a,b)=>b[1]-a[1]);
 return pagehead('Medición de campañas','Resultados y retorno comercial','Importa el JSON generado en GeoGrowth Campo y observa el embudo, el estado de las visitas y las próximas acciones.')+
 `<div class="kpi-grid">${summaryCard(st.total,'Registros recibidos')}${summaryCard(st.real,'Observaciones marcadas reales')}${summaryCard(st.demo,'Observaciones simuladas')}${summaryCard(st.interested,'Interés declarado (no conversión)')}</div>`+
 `<div class="role-banner"><div><b>Importar resultados desde el asesor</b><p>En la app móvil: «Exportar resultados JSON». Aquí: «Importar resultados JSON». Se actualizan las métricas localmente.</p></div><label class="btn primary">Importar resultados JSON<input id="feedbackFile" type="file" accept=".json,application/json" hidden></label></div>`+
 `<div class="grid-2"><section class="card"><div class="card-header"><div><h2>Distribución de estados</h2><p>Observaciones recibidas, sin inferir créditos otorgados</p></div></div><div class="minichart">${statuses.map((s,i)=>{const n=records.filter(x=>x.resultado===s).length;return `<div class="col"><span class="value">${n}</span><div class="bar ${i>2?'m0':i===2?'m1':''}" style="height:${Math.max(3,Math.round(n/m*120))}px"></div><span class="caption">${esc(s)}</span></div>`}).join('')}</div><div class="stat-line"><span>Seguimiento autorizado indicado</span><b>${st.follow}</b></div><div class="stat-line"><span>Observaciones no pendientes</span><b>${st.inspected}</b></div></section>`+
 `<section class="card"><h2>Actividad por departamento</h2>${byRegion.length?byRegion.map(([n,k])=>`<div class="stat-line"><span>${esc(n)}</span><b>${k}</b></div>`).join(''):'<div class="blank">Aún no se han importado visitas.</div>'}<div class="callout warn">Un registro marcado «REAL» es una declaración del asesor al ingresarlo; el prototipo no puede verificar por sí solo que hubo visita, contacto o consentimiento.</div><div class="actions-row"><button class="btn" data-export-feedback="1">Exportar consolidado JSON</button><button class="btn small" data-clear-feedback="1">Limpiar resultados locales</button></div></section></div>`+
 `<section class="card"><div class="card-header"><div><h2>Registro de visitas y próximos pasos</h2><p>Traza cada resultado hasta la licencia o el distrito de la campaña</p></div><span class="badge">${st.total} observaciones</span></div><div class="tablewrap"><table><thead><tr><th>Fecha / ID</th><th>Registro territorial o licencia</th><th>Resultado</th><th>Necesidad declarada</th><th>Próxima acción</th><th>Tipo</th></tr></thead><tbody>${records.slice().reverse().slice(0,50).map(x=>{const lead=leadById(x.lead_id);return `<tr><td>${esc(x.fecha)}<small style="display:block">${esc(x.visita_id||'')}</small></td><td><b>${esc(lead?.nombre||x.territory_ubigeo||'Sin territorio')}</b><small style="display:block">${esc(x.lead_id||x.territory_ubigeo)}</small></td><td>${esc(x.resultado)}</td><td>${esc(x.necesidad||'No verificada')}</td><td>${esc(x.siguiente_accion||'Pendiente')}</td><td>${x.tipo_dato==='REAL'?'<span class="tag green">Declarado real</span>':'<span class="tag warn">Simulación</span>'}</td></tr>`}).join('')||'<tr><td colspan="6" class="empty-row">Importa el JSON de la app de campo para visualizar resultados.</td></tr>'}</tbody></table></div></section>`;
}
function analystInbox(){const results=app.licencias.filter(r=>(app.dept==='Todo el Perú'||r.departamento===app.dept)&&
 (!app.licenseUbigeo||r.ubigeo===app.licenseUbigeo)&&
 (!app.query||[r.nombre,r.id,r.direccion,r.giro,r.sector].join(' ').toLocaleLowerCase('es').includes(app.query.toLocaleLowerCase('es')))&&
 (app.sector==='Todos'||r.sector===app.sector)&&
 (app.status!=='Vigentes'||['ACTIVA','VIGENTE'].includes(r.estado)));
 const pageRows=results.slice(app.page*20,(app.page+1)*20);
 const sectors=['Todos',...new Set(app.licencias.map(x=>x.sector))].sort((a,b)=>a.localeCompare(b,'es'));
 const deps=['Todo el Perú',...[...new Set(app.territories.map(r=>r.departamento))].sort((a,b)=>a.localeCompare(b,'es'))];
 return pagehead('Prospección','Oportunidades detectadas','Licencias municipales que pueden justificar una verificación temprana. No son clientes nuevos confirmados ni leads precalificados.')+
 `<div class="role-banner"><div><b>Señales detectadas en cortes municipales</b><p>Lima: licencias con fecha 2026, sin nombre comercial. Arequipa: licencias 2025 con nombre, giro y dirección disponibles. Elige una para investigar.</p></div><span class="badge amber">Datos públicos históricos</span></div>`+
 window.GeoGrowthMapView.panel(app,ROLE)+
 `<div class="kpi-grid">${summaryCard(fmt(app.summary.total),'Licencias deduplicadas en las fuentes')}${summaryCard(fmt(app.licencias.length),'Registros incluidos en bandeja')}${summaryCard(fmt(results.length),'Coinciden con filtros')}${summaryCard(fmt(app.picks.length),'Licencias seleccionadas')}</div>`+
 `<div class="card"><div class="card-header"><div><h2>Priorizar señales por licencia</h2><p>IPLV (0–100) = 50% fecha + 30% datos disponibles + 20% giro identificado. No predice conversión.</p></div></div><div class="form-grid">${fieldSelect('leadDept','Ubicación',deps,app.dept)}${fieldSelect('sector','Actividad',sectors,app.sector)}${fieldSelect('status','Estado según fuente',['Vigentes','Todos'],app.status)}</div><div class="form-grid two" style="margin-top:12px"><div class="field"><label for="leadSearch">Buscar negocio / giro / licencia</label><input id="leadSearch" placeholder="Ej. ferretería, taller, nombre comercial" value="${esc(app.query)}"></div><div class="field"><label>Orden</label><input readonly value="Prioridad para verificación (IPLV)" /></div></div><p class="muted" style="margin:12px 0">${fmt(results.length)} registros${app.licenseUbigeo?' en el UBIGEO '+esc(app.licenseUbigeo):''}. “Vigente/activa” refleja el estado publicado en su corte; debe verificarse nuevamente antes de una acción comercial.</p>${results.length===0?'<div class="callout warn">No existen licencias individuales cargadas para este territorio. El mapa mantiene disponibles las estadísticas SBS–PRODUCE.</div>':''}${leadRows(pageRows)}<div class="actions-row"><button class="btn small" data-lead-page="-1" ${app.page<=0?'disabled':''}>Anterior</button><span class="muted">Página ${app.page+1} de ${Math.max(1,Math.ceil(results.length/20))}</span><button class="btn small" data-lead-page="1" ${(app.page+1)*20>=results.length?'disabled':''}>Siguiente</button></div></div>`+warning;
}
function chosenLead(){return leadById(app.leadId)||app.licencias.find(x=>x.departamento==='Arequipa'&&x.estado==='ACTIVA')||app.licencias[0]}
function analystBrief(){const x=chosenLead();if(!x)return `<div class="blank">No hay registro de licencia seleccionado.</div>`;
 const complete=x.direccion&&x.giro;
 const intent=complete?'Validar actividad, necesidad declarada y consentimiento para contacto comercial.':'Completar identificación comercial del establecimiento antes de cualquier contacto.';
 return pagehead('Investigación individual','Opportunity Brief — una oportunidad concreta','No es un reporte estadístico genérico: convierte un registro de licencia en una hipótesis de captación y una tarea verificable.')+
 `<div class="brief-head"><span class="badge">Prioridad IPLV ${Number(x.puntaje).toFixed(1)} / 100</span><h2>${esc(x.nombre)}</h2><p>Licencia otorgada ${formatDate(x.fecha)} · ${esc(x.departamento)} · ${esc(x.estado)} según fuente histórica. No demuestra constitución ni funcionamiento actual.</p></div>`+
 `<div class="grid-main"><div><div class="card"><div class="card-header"><div><h2>1. Qué sabemos — evidencia municipal</h2><p>Hechos directamente atribuibles al registro publicado</p></div><span class="tag">${esc(x.ref)}</span></div><div class="brief-grid">${[['Ubicación municipal',x.departamento+' · '+x.ubigeo],['Fecha de licencia',formatDate(x.fecha)],['Giro publicado',x.giro||'No publicado en el CSV'],['Domicilio comercial',x.direccion||'No publicado en el CSV'],['Sector de prospección',x.sector],['Estado registrado',x.estado]].map(([a,b])=>`<div class="brief-box"><small>${esc(a)}</small><b>${esc(b)}</b></div>`).join('')}</div><div class="callout warn">Fuente: ${esc(x.fuente)}. La fecha y el estado corresponden al archivo histórico, no a una consulta actual al negocio.</div></div>`+
 `<div class="card"><h2>2. Por qué aparece priorizado</h2><div class="formula">IPLV = 50% R + 30% C + 20% S<small>Índice de Priorización de Licencias para Verificación, regla heurística transparente.</small></div><div class="grid-3" style="margin-top:14px">${[['Recencia en el corte',x.aportes.recencia,50],['Completitud publicada',x.aportes.completitud,30],['Actividad identificada',x.aportes.actividad,20]].map(([t,n,max])=>`<div class="signal"><b>${esc(t)}</b><p>${Number(n).toFixed(1)} de ${max} puntos</p><div class="meter"><span style="width:${n/max*100}%"></span></div></div>`).join('')}</div><p class="muted">La recencia se calcula respecto a la ventana 2024–abril 2026, no respecto de la fecha actual. Este índice ordena revisión documental y no estima probabilidad de captar un cliente.</p></div>`+
 `<div class="card"><h2>3. Qué debemos investigar antes de contactar</h2><div class="list">${[
 ['Verificación de vigencia','Confirmar que el negocio sigue operando y que el establecimiento corresponde al registro municipal.'],
 ['Necesidad financiera — hipótesis',complete?'Investigar si el negocio tiene necesidades de inventario, equipos o liquidez. No asumir demanda de crédito.':'La fuente no tiene giro o dirección. Obtener datos comerciales públicos y validar la actividad antes de inferir una necesidad.'],
 ['Producto candidato, no oferta',x.producto],
 ['Siguiente acción',intent]
 ].map(([a,b],i)=>`<div class="list-item"><strong>${i+1}. ${esc(a)}</strong><p>${esc(b)}</p></div>`).join('')}</div></div></div>`+
 `<div><section class="card"><h2>Acción comercial sugerida</h2><div class="signal"><b>${complete?'Verificación prioritaria en campo':'Investigación documental adicional'}</b><p>${esc(intent)}</p></div><div class="actions-row"><button class="btn teal" data-pick="${esc(x.id)}" ${app.picks.includes(x.id)?'disabled':''}>${app.picks.includes(x.id)?'Incluido en mi campaña':'Agregar a mi campaña'}</button><button class="btn" data-export-brief="1">Exportar brief JSON</button></div><p class="muted">No se envían comunicaciones desde el prototipo.</p></section><section class="card"><h2>Información que todavía falta</h2>${['Datos de operación actual','Consentimiento para contacto','Necesidad declarada por el negocio','Catálogo vigente y requisitos de Caja Trujillo','Evaluación humana de elegibilidad'].map(x=>`<div class="stat-line"><span>${esc(x)}</span><b>Por verificar</b></div>`).join('')}</section></div></div>`;
}
function analystCampaign(){const chosen=app.picks.map(leadById).filter(Boolean);const c=app.campaign;
 return pagehead('Prospección operativa','Mi campaña y envío a campo','Selecciona licencias verificables, genera el JSON y ábrelo en la aplicación móvil. El retorno se importa como un segundo JSON.')+
 `<div class="role-banner"><div><b>Transferencia entre aplicaciones</b><p>1. Preparar campaña → 2. Exportar JSON → 3. Importarlo en GeoGrowth Campo → 4. Registrar observaciones → 5. Exportar resultados JSON → 6. Importarlos en Administrador.</p></div><a class="btn teal" href="GeoGrowth_Campo.html" target="_blank">Abrir GeoGrowth Campo</a></div>`+
 `<section class="card"><div class="card-header"><div><h2>Licencias seleccionadas para verificar</h2><p>El asesor selecciona registros públicos de la bandeja; no son clientes confirmados.</p></div><span class="badge">${chosen.length} registros</span></div>${chosen.length?leadRows(chosen):'<div class="blank">Abre «Oportunidades detectadas» o el Opportunity Brief y agrega una licencia para comenzar.</div>'}<div class="actions-row"><button class="btn primary" data-create-lead-campaign="1" ${!chosen.length?'disabled':''}>Preparar campaña con selección</button><button class="btn" data-clear-picks="1">Limpiar selección</button></div></section>`+
 `<section class="card"><h2>Campaña guardada para el equipo</h2>${campaignSummary(c)}<div class="callout">Si creaste la campaña desde Administrador, podrás verla aquí cuando utilices el mismo navegador. Para usar otro equipo, importa el JSON en la aplicación móvil.</div></section>`;
}
function analystFollowup(){const c=app.campaign;const r=resultStats();return pagehead('Retroalimentación','Seguimiento comercial','Revisa las observaciones recibidas, los registros pendientes y las acciones verificadas por el asesor.')+
 `<div class="kpi-grid">${summaryCard(c?.territorios?.length||0,'Distritos en campaña')}${summaryCard(c?.prospectos?.length||0,'Licencias por verificar')}${summaryCard(r.total,'Observaciones importadas')}${summaryCard(r.interested,'Intereses declarados')}</div>`+
 `<div class="card"><h2>¿Qué significa cerrar el circuito?</h2><div class="stepflow">${['Enviar JSON al móvil','Verificar actividad comercial','Registrar respuesta','Exportar resultados','Importar y medir'].map((x,i)=>`<div class="step"><small>0${i+1}</small><b>${esc(x)}</b></div>`).join('')}</div><div class="actions-row"><a class="btn primary" href="GeoGrowth_Campo.html" target="_blank">Ir a la app de campo</a><label class="btn">Importar resultados JSON<input type="file" id="feedbackFile" accept=".json,application/json" hidden></label><button class="btn" data-nav="micanpana">Volver a mi campaña</button></div></div>`+
 `<section class="card"><h2>Resultados asociados a la selección</h2><div class="tablewrap"><table><thead><tr><th>Licencia / territorio</th><th>Resultado</th><th>Próxima acción</th><th>Tipo</th></tr></thead><tbody>${app.feedback.slice().reverse().slice(0,35).map(x=>`<tr><td>${esc(leadById(x.lead_id)?.nombre||x.territory_ubigeo)}</td><td>${esc(x.resultado)}</td><td>${esc(x.siguiente_accion)}</td><td>${x.tipo_dato==='REAL'?'Declarado real':'Simulación'}</td></tr>`).join('')||'<tr><td colspan="4" class="empty-row">Todavía no hay resultados importados.</td></tr>'}</tbody></table></div></section>`;
}
function csvTemplate(){const lines='id,fecha,ubigeo,nombre,direccion,giro,estado\nLIC-EXEMPLO-0001,2026-11-01,040101,EJEMPLO FICTICIO,AVENIDA EJEMPLO 100,Comercio,VIGENTE\n';dload('plantilla_corte_licencias_DEMO.csv','\ufeff'+lines,'text/csv;charset=utf-8')}
function parseCSV(text){
 const lines=text.replace(/^\ufeff/,'').split(/\r?\n/).filter(l=>l.trim());if(!lines.length)return [];
 function line(s){let a=[],value='',quoted=false;for(let i=0;i<s.length;i++){let c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){a.push(value);value='';}else value+=c;}a.push(value);return a;}
 const headers=line(lines.shift()).map(x=>x.trim().toLowerCase());for(const must of ['id','fecha','ubigeo','nombre','giro','estado'])if(!headers.includes(must))throw Error('Falta columna: '+must);
 return lines.slice(0,1000).map(s=>{const vals=line(s),o={};headers.forEach((k,i)=>o[k]=(vals[i]||'').trim());return o;});
}
function importLicencias(text){const source=parseCSV(text),seen=new Set([...app.licencias,...app.imported].map(r=>r.id));let added=0;
 for(const x of source){if(!/^[a-z0-9_-]{5,90}$/i.test(x.id)||!/^\d{4}-\d{2}-\d{2}$/.test(x.fecha)||!/^[0-9]{6}$/.test(x.ubigeo))continue;
 if(seen.has(x.id))continue;const dep=app.territories.find(r=>r.ubigeo===x.ubigeo)?.departamento||'Sin identificar';
 const recent=Math.max(0,Math.min(1,(Date.parse(x.fecha)-Date.parse('2024-01-01'))/(Date.parse('2026-04-01')-Date.parse('2024-01-01'))));
 const completeness=([x.nombre,x.direccion,x.giro].filter(Boolean).length/3);
 const sector= x.giro?'Actividad declarada en corte':'Actividad por verificar';const aportes={recencia:Math.round(50*recent*10)/10,completitud:Math.round(30*completeness*10)/10,actividad:x.giro?20:0};
 const row={id:x.id,nombre:x.nombre||'Sin nombre',ubigeo:x.ubigeo,departamento:dep,direccion:x.direccion||null,giro:x.giro||null,sector,fecha:x.fecha,estado:x.estado.toUpperCase(),
 fuente:'Corte CSV importado por usuario (origen pendiente de comprobar)',ref:'IMPORTADO-MANUAL:'+x.ubigeo,puntaje:Math.round((aportes.recencia+aportes.completitud+aportes.actividad)*10)/10,
 aportes,producto:'Por definir después de validar giro y necesidad',corte_importado:true};
 app.imported.push(row);app.licencias.push(row);seen.add(x.id);added++;
 }
 store('imported',app.imported);app.licencias.sort((a,b)=>b.puntaje-a.puntaje);toast('Nuevos registros respecto al corte integrado: '+added+'. Procedencia pendiente de verificación.');render();
}
async function importFeedback(file){const data=JSON.parse(await file.text());if(!Array.isArray(data.visitas)||!['GeoGrowthFieldResultsV3','GeoGrowthFieldResultsV10'].includes(data.format))throw Error('No es JSON de resultados de GeoGrowth Campo.');
 if(data.visitas.length>10000)throw Error('Archivo demasiado grande para la demo.');let count=0;
 const keys=new Set(app.feedback.map(x=>x.visita_id||[x.territory_ubigeo,x.lead_id,x.fecha,x.resultado,x.observaciones].join('|')));
 for(const raw of data.visitas){if(!/^\d{6}$/.test(str(raw.territory_ubigeo)))continue;const rec={
 visita_id:str(raw.visita_id||''),campaign_id:str(raw.campaign_id||data.campana_id||''),lead_id:str(raw.lead_id||''),territory_ubigeo:str(raw.territory_ubigeo),
 fecha:str(raw.fecha||'').slice(0,10),resultado:str(raw.resultado||'Pendiente'),sector:str(raw.sector||'No verificado'),
 necesidad:str(raw.necesidad||'No verificada'),siguiente_accion:str(raw.siguiente_accion||'Pendiente'),
 consentimiento_simulado:!!raw.consentimiento_simulado,observaciones:str(raw.observaciones||'').slice(0,1500),
 tipo_dato:raw.tipo_dato==='REAL'?'REAL':'SINTETICO'};
 const k=rec.visita_id||[rec.territory_ubigeo,rec.lead_id,rec.fecha,rec.resultado,rec.observaciones].join('|');if(keys.has(k))continue;
 keys.add(k);app.feedback.push(rec);count++;
 }
 store('feedback',app.feedback);render();toast(count+' resultados importados al dashboard. Registros repetidos omitidos.');
}
function exportBrief(){const x=chosenLead();if(!x)return;
 dload('opportunity_brief_'+x.id+'.json',{tipo:'GeoGrowthOpportunityBriefV10',id:x.id,fuente:x.fuente,referencia:x.ref,fecha_licencia:x.fecha,
 hechos:{nombre_comercial:x.nombre,giro:x.giro,direccion:x.direccion,estado_al_corte:x.estado},
 indice_heuristico:{nombre:'IPLV',puntaje:x.puntaje,aportes:x.aportes},hipotesis:'Posible necesidad comercial por confirmar en campo',
 producto_candidato:x.producto,accion:'Verificar vigencia, actividad, consentimiento e interés antes de ofrecer un producto.',
 limitaciones:['Licencia no implica negocio nuevo ni actualmente activo','No se conoce historial crediticio o interés','No se ha aprobado ni preaprobado crédito']});
}
function exportCampaignFile(){if(!app.campaign){toast('No hay campaña creada.');return;}dload('geogrowth_campana_'+app.campaign.campana_id+'.json',app.campaign);}
function addLead(id){if(!leadById(id))return;if(!app.picks.includes(id))app.picks.push(id);store('picks',app.picks);toast('Licencia agregada a la campaña para verificación.');render();}
async function handleFile(e){const target=e.target;
 try{if(target.id==='feedbackFile'&&target.files?.[0])await importFeedback(target.files[0]);
 else if(target.id==='newLicenseFile'&&target.files?.[0])importLicencias(await target.files[0].text());}catch(error){toast('No se pudo importar: '+error.message);}
}
document.addEventListener('change',e=>{const t=e.target;
 if(t.id==='ggMapDepartment'){window.GeoGrowthMapView.chooseDep(app,ROLE,render,t.value);return;}
 if(['feedbackFile','newLicenseFile'].includes(t.id)){handleFile(e);return;}
 if(['modelDep','campaignDep','leadDept'].includes(t.id)){app.dept=t.value;app.mapDep=t.value;app.mapUbigeo=null;app.licenseUbigeo=null;app.page=0;app.plan=[];if(t.id==='modelDep')app.modelUbigeo=null;render();return;}
 if(t.id==='modelUbigeo'){app.modelUbigeo=t.value;render();return;}
 if(t.id==='weight'){app.prefs.w=Number(t.value);store('prefs',app.prefs);render();return;}
 if(t.id==='leadSearch'){app.query=t.value;app.page=0;render();return;}
 if(t.id==='sector'){app.sector=t.value;app.page=0;render();return;}
 if(t.id==='status'){app.status=t.value;app.page=0;render();return;}
 if(t.id==='budget'){app.budget=Math.max(500,Math.min(25000,Number(t.value)||2400));render();return;}
 if(t.id==='maxZones'){app.maxZones=Math.max(1,Math.min(12,Math.round(Number(t.value)||4)));render();return;}
 if(t.id==='includeLeads'){app.includeLeads=t.checked;return;}
});
document.addEventListener('click',e=>{if(window.GeoGrowthMapView.click(e,app,ROLE,render))return;
 const t=e.target.closest('button[data-nav],button[data-lead],button[data-lead-page],button[data-model],button[data-pick],button[data-template],button[data-recalculate],button[data-apply-model],button[data-save-campaign],button[data-export-campaign],button[data-create-lead-campaign],button[data-clear-picks],button[data-export-brief],button[data-export-feedback],button[data-clear-feedback],button[data-go-analyst]');
 if(!t)return;
 if(t.dataset.nav){app.nav=t.dataset.nav;render();return;}
 if(t.dataset.lead){app.leadId=t.dataset.lead;app.nav='brief';render();window.scrollTo(0,0);return;}
 if(t.dataset.leadPage){app.page=Math.max(0,app.page+Number(t.dataset.leadPage));render();return;}
 if(t.dataset.model){app.viewMode=t.dataset.model;render();return;}
 if(t.dataset.pick){addLead(t.dataset.pick);return;}
 if(t.dataset.template){csvTemplate();return;}
 if(t.hasAttribute('data-recalculate')){render();toast('Escenarios recalculados.');return;}
 if(t.hasAttribute('data-apply-model')){app.plan=modelComparison()[app.viewMode].map(x=>x.ubigeo);render();toast('Distritos seleccionados para preparar campaña.');return;}
 if(t.hasAttribute('data-save-campaign')){
   const terr=selectedRegion();if(!terr.length){toast('Selecciona distritos antes de crear la campaña.');return;}
   let leads=app.picks.map(leadById).filter(Boolean);
   if(app.includeLeads){const seen=new Set(leads.map(x=>x.id));for(const t2 of terr){for(const l of topLeads(t2.departamento,20).filter(x=>x.ubigeo===t2.ubigeo).slice(0,8)){if(!seen.has(l.id)){leads.push(l);seen.add(l.id);}}}}
   campaignSave(campaignStruct(terr,leads));render();return;
 }
 if(t.hasAttribute('data-export-campaign')){exportCampaignFile();return;}
 if(t.hasAttribute('data-create-lead-campaign')){
   const leads=app.picks.map(leadById).filter(Boolean);if(!leads.length){toast('Primero selecciona licencias.');return;}
   const u=[...new Set(leads.map(x=>x.ubigeo))];const terr=u.map(id=>app.territories.find(r=>r.ubigeo===id)).filter(Boolean);
   const s=terr.map(r=>scored(r.departamento).find(x=>x.ubigeo===r.ubigeo)||r);
   const c=campaignStruct(s,leads);c.departamento=leads[0].departamento;campaignSave(c);render();return;
 }
 if(t.hasAttribute('data-clear-picks')){app.picks=[];store('picks',app.picks);render();return;}
 if(t.hasAttribute('data-export-brief')){exportBrief();return;}
 if(t.hasAttribute('data-export-feedback')){dload('geogrowth_resultados_consolidados.json',{format:'GeoGrowthFieldResultsV10',visitas:app.feedback});return;}
 if(t.hasAttribute('data-clear-feedback')){if(confirm('¿Borrar los resultados guardados localmente en este navegador?')){app.feedback=[];store('feedback',app.feedback);render();}return;}
 if(t.hasAttribute('data-go-analyst')){location.href='GeoGrowth_Analista.html';return;}
});
async function boot(){try{
 const [terr,lead,source]=await Promise.all([
  fetch('data/territorios_reales.json').then(r=>{if(!r.ok)throw Error('No se pudo cargar territorios');return r.json()}),
  fetch('data/licencias_prospeccion.json').then(r=>{if(!r.ok)throw Error('No se pudo cargar licencias');return r.json()}),
  fetch('data/fuentes_y_transformaciones.json').then(r=>r.ok?r.json():[])
 ]);
 app.territories=terr;app.summary=lead.metadata||{};app.sources=source;
 app.licencias=[...lead.registros,...app.imported].sort((a,b)=>b.puntaje-a.puntaje);
 const qs=new URLSearchParams(location.search);
 if(qs.has('lead')&&leadById(qs.get('lead'))){app.leadId=qs.get('lead');app.nav='brief';app.dept=leadById(app.leadId).departamento;app.mapDep=app.dept;}
 if(qs.has('section')&&ROLE==='admin')app.nav=qs.get('section');
 render();
}catch(err){$('content').innerHTML=`<div class="card"><h2>No se pudo cargar el Data Pack</h2><p class="muted">${esc(err.message)}</p><div class="callout">Abre esta web desde GitHub Pages o inicia un servidor HTTP local; las páginas abiertas como file:// pueden bloquear fetch.</div></div>`;}}
boot();
})();