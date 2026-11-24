/* GeoGrowth V9 - Opportunity Brief territorial (solo modo ampliado).
   Analisis determinista y auditable, sin LLM conectado ni predicciones. */
(function(){
"use strict";
if(new URLSearchParams(window.location.search).get("modo")!=="ampliado")return;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=v=>v==null?"N/D":Number(v).toLocaleString("es-PE");
const dec=v=>v==null?"N/D":Number(v).toLocaleString("es-PE",{minimumFractionDigits:1,maximumFractionDigits:1});
const has=v=>v!=null&&Number.isFinite(Number(v));
const round=v=>Math.round(v*10)/10;
function build(r,weight){
 if(!r || !/^\d{6}$/.test(String(r.ubigeo||"")))return null;
 const w=Math.max(0,Math.min(100,Number(weight)||0));
 const prev=state.dep,prevWeight=state.w;
 let cohort=[];
 try{state.dep=r.departamento;state.w=w;cohort=getScored();}finally{state.dep=prev;state.w=prevWeight;}
 const complete=r.ambas_fuentes===true&&has(r.micro_2015)&&has(r.sbs_oficinas_2025);
 const entry=complete?cohort.find(x=>x.ubigeo===r.ubigeo):null;
 const rank=entry?cohort.findIndex(x=>x.ubigeo===r.ubigeo)+1:null;
 const n=cohort.length;
 const mxE=Math.max(1,...cohort.map(x=>Math.log1p(Math.max(0,Number(x.micro_2015)||0))));
 const mxO=Math.max(1,...cohort.map(x=>Math.log1p(Math.max(0,Number(x.sbs_oficinas_2025)||0))));
 const E=entry?Math.log1p(Math.max(0,Number(r.micro_2015)))/mxE:null;
 const B=entry?1-Math.log1p(Math.max(0,Number(r.sbs_oficinas_2025)))/mxO:null;
 const aporteE=E==null?null:round(w*E);
 const aporteB=B==null?null:round((100-w)*B);
 const categoria=!entry?"sin_iit":rank<=Math.ceil(n*.25)?"prioridad_exploratoria":rank<=Math.ceil(n*.5)?"investigacion_focalizada":"observacion";
 const recomendacion={
  sin_iit:"No clasificar este distrito por IIT: falta información comparable de PRODUCE o SBS. Primero completar y contrastar las fuentes.",
  prioridad_exploratoria:"Priorizar una validación de campo acotada: el distrito está en el primer cuartil del ranking IIT de su departamento. Antes de asignar una campaña, confirmar actividad y necesidades actuales.",
  investigacion_focalizada:"Desarrollar investigación focalizada y comparar con distritos de mayor IIT. Escalar solo cuando existan negocios operativos verificados, interés declarado y condiciones logísticas.",
  observacion:"No lanzar una campaña amplia basándose solo en el IIT. Mantener el distrito en observación o realizar una validación puntual cuando exista evidencia comercial reciente y verificable."
 }[categoria];
 const licenses=has(r.licencias_municipales_ref)
  ?fmt(r.licencias_municipales_ref)+" expedientes o registros municipales ("+(r.anio_licencias||"periodo no detallado")+"). No equivalen necesariamente a negocios activos únicos."
  :"No hay registros municipales individuales disponibles en este Data Pack para el distrito; ello no demuestra ausencia de licencias.";
 const hipotesis=[
  {titulo:"Negocios vigentes y necesidades operativas",
   hecho:has(r.micro_2015)?fmt(r.micro_2015)+" microempresas registradas por PRODUCE en 2015.":"No hay conteo histórico comparable.",
   hipotesis:"Una parte podría seguir operando y manifestar necesidades de financiamiento. El dato de 2015 no permite afirmar cuántos negocios están vigentes.",
   validacion:"Contrastar registros recientes, verificar giro y operación actual; entrevistar responsables mediante contactos autorizados."},
  {titulo:"Acceso financiero y competencia",
   hecho:has(r.sbs_oficinas_2025)?fmt(r.sbs_oficinas_2025)+" oficinas y "+fmt(r.sbs_puntos_2025)+" puntos de atención SBS en 2025.":"Sin cobertura SBS comparable.",
   hipotesis:"La distribución de canales podría hacer relevante estudiar fricciones de acceso, pero no prueba exclusión financiera ni baja competencia.",
   validacion:"Revisar canales existentes y presencia propia de Caja Trujillo; recoger necesidades y preferencias declaradas por los negocios."}
 ];
 const productos=[
  {nombre:"Capital de trabajo",condicion:"Evaluar solo si una empresa activa confirma necesidades de inventario, insumos o continuidad operativa."},
  {nombre:"Activo fijo",condicion:"Evaluar solo si el establecimiento expresa intención de invertir en maquinaria, equipamiento o infraestructura."}
 ];
 const acciones=[
  "Validar actividad empresarial vigente, giro y domicilio con fuentes públicas recientes y comprobación autorizada.",
  "Seleccionar una muestra de prospección verificable y asignar asesor, ruta y objetivo de contacto.",
  "Registrar en GeoGrowth Campo visitas, interés declarado, necesidades, consentimiento cuando aplique y siguiente acción.",
  "Contrastar resultados con distritos alternativos y decidir si ampliar, ajustar o detener el esfuerzo."
 ];
 const criterios=[
  "Avanzar si hay establecimientos vigentes, contacto autorizado e interés o necesidad expresamente declarados.",
  "Conducir cualquier evaluación de producto bajo políticas y requisitos actuales de Caja Trujillo; no hay precalificación.",
  "No asignar expansión comercial por una puntuación aislada; documentar resultados y revisar prioridades."
 ];
 const faltantes=[
  "Negocios activos, rubros y establecimientos actualizados a 2026.",
  "Población adulta y denominadores actuales para tasas territoriales.",
  "Cobertura propia de Caja Trujillo y datos de competidores desagregados.",
  "Resultados reales de prospección, demanda, costos, contactos consentidos y conversiones observadas."
 ];

 // 3 especialistas analíticos: señales, propuesta comercial y control de evidencia.
 // Son reglas trazables; ningún LLM está conectado al sitio estático.
 const published=Array.isArray(window.GeoGrowthPublicLicenses?.registros)?window.GeoGrowthPublicLicenses.registros:[];
 const registros=published.filter(x=>String(x.ubigeo)===String(r.ubigeo));
 const sectorRows=registros.filter(x=>x.sector&&x.sector!=="Actividad por verificar"&&x.nombre);
 const sectorCounts=new Map();
 for(const x of sectorRows)sectorCounts.set(x.sector,(sectorCounts.get(x.sector)||0)+1);
 const sectores=[...sectorCounts].sort((a,b)=>b[1]-a[1]).slice(0,4)
   .map(([sector,n])=>({sector,registros:n,porcion:registros.length?round(n*100/registros.length):null}));
 const ejemplos=sectorRows.slice(0,3).map(x=>({nombre:x.nombre,giro:x.giro||null,fecha_licencia:x.fecha||null,sector:x.sector}));
 const topSector=sectores[0]?.sector||null;
 const foco=topSector==="Comercio"
   ?"Investigar establecimientos comerciales vigentes y contrastar rotación de inventarios, reposición de mercadería y medios de cobro. La necesidad debe ser expresada por el negocio."
   :topSector==="Alimentos y gastronomía"
   ?"Investigar negocios gastronómicos actuales y contrastar compra de insumos, equipamiento y estacionalidad; no inferir demanda de crédito por una licencia."
   :topSector==="Servicios"
   ?"Investigar prestadores de servicios operativos y contrastar necesidades de equipamiento o liquidez estacional."
   :topSector
   ?"Investigar establecimientos de "+topSector+" únicamente tras verificar su actividad vigente y necesidades expresadas."
   :"Sin actividades municipales individuales suficientes para focalizar un giro. Empezar validando fuentes vigentes y segmentación real antes de asignar productos.";
 const lecturaOficinas=entry&&B===0
   ?"La contribución B es cero porque las oficinas del distrito alcanzan el máximo departamental usado para normalizar. No significa que no haya oportunidad comercial."
   :entry&&B!==null
   ?"La contribución B interpreta únicamente la presencia relativa de oficinas SBS; no prueba bancarización, atención de Caja Trujillo ni necesidades no cubiertas."
   :"No hay evidencia comparable para estimar el componente B.";
 const lecturaPesos=w===100
   ?"Se asignó 100 % de peso a microempresas históricas; la infraestructura financiera no interviene en este resultado."
   :w===0
   ?"Se asignó 100 % de peso a menor presencia relativa de oficinas; el volumen empresarial no interviene en este resultado."
   :"Se usan los pesos definidos en Scoring IIT (E "+w+" %, B "+(100-w)+" %).";
 const alternativas=cohort.filter(x=>x.ubigeo!==r.ubigeo).slice(0,3)
   .map(x=>({ubigeo:x.ubigeo,distrito:x.nombre_distrito||null,iit:x.score,micro_2015:x.micro_2015,oficinas_2025:x.sbs_oficinas_2025}));
 const sensibilidad=[];
 for(const alternateW of [...new Set([Math.max(0,w-20),w,Math.min(100,w+20)])]){
   const oldD=state.dep,oldW=state.w;let seq;
   try{state.dep=r.departamento;state.w=alternateW;seq=getScored();}
   finally{state.dep=oldD;state.w=oldW;}
   const ind=seq.findIndex(x=>x.ubigeo===r.ubigeo);
   sensibilidad.push({peso_empresarial_pct:alternateW,puesto:ind<0?null:ind+1,puntuacion:ind<0?null:seq[ind].score});
 }
 const investigacion={
   estado_evidencia:registros.length?"Licencias publicadas para el distrito, no confirmación de empresas vigentes.":"No hay licencias individuales vinculables al distrito en la bandeja publicada.",
   licencias_individuales:registros.length,licencias_con_sector_y_nombre:sectorRows.length,
   sectores,ejemplos_publicados:ejemplos,foco_comercial:foco,
   diagnostico:"IIT "+(entry?dec(entry.score):"no comparable")+", posición "+(rank||"N/D")+
     " de "+n+". "+lecturaPesos+" "+lecturaOficinas,
   alternativas_departamentales:alternativas,sensibilidad,
   preguntas_asesor:[
     "¿Qué actividad desarrolla actualmente el establecimiento y desde cuándo opera?",
     "¿Tiene hoy alguna necesidad específica de capital de trabajo o inversión? ¿Cuál y para cuándo?",
     "¿Qué canales financieros utiliza y qué barreras identifica, si las hubiera?",
     "¿Autoriza que un asesor lo contacte para evaluar alternativas sin compromiso?"
   ],
   criterio_aprobacion:"Recomendar piloto solo con negocios actuales, autorización de contacto e interés declarado. El IIT no sustituye una evaluación comercial.",
   limite:"Los sectores proceden de licencias municipales individuales cuando están disponibles; no representan la estructura empresarial vigente ni tasas de captación."
 };
 return {
  formato:"GeoGrowthTerritoryOpportunityBriefV2",version:"2.0",generado_en:new Date().toISOString(),
  generador:"Motor de reglas territoriales auditables, sin LLM conectado",
  territorio:{ubigeo:String(r.ubigeo),distrito:r.nombre_distrito||null,departamento:r.departamento},
  iit:{puntuacion:entry?entry.score:null,puesto_departamental:rank,distritos_comparables:n,
       peso_empresas_pct:w,peso_menor_presencia_oficinas_pct:100-w,
       indice_empresarial:E==null?null:round(E),indice_oficinas:B==null?null:round(B),
       aporte_empresarial:aporteE,aporte_oficinas:aporteB,
       dimension_dominante:entry?(aporteE>=aporteB?"concentracion_empresarial_historica":"menor_presencia_relativa_de_oficinas"):null,
       alcance:"Ranking exploratorio relativo, no predicción de captación ni de inclusión."},
  decision:{categoria,recomendacion},
  evidencia:{produce_2015:{micro:r.micro_2015??null,pequenas:r.pequena_2015??null,empresas:r.empresas_2015??null},
    sbs_2025:{oficinas:r.sbs_oficinas_2025??null,puntos:r.sbs_puntos_2025??null,atm:r.sbs_atm_2025??null,pos:r.sbs_pos_2025??null},
    licencias:licenses,ids:String(r.evidencia||"").split("|").filter(Boolean)},
  hipotesis,productos,acciones,criterios,faltantes,investigacion,
  agentes_demo:window.GeoGrowthAgentDemo?.create(r,{
    puntuacion:entry?.score??null,puesto:rank,total:n,peso:w,categoria,investigacion
  })||null,
  limitacion:"PRODUCE 2015 y SBS 2025 son fuentes de años distintos. No indican negocios activos, demanda ni elegibilidad crediticia."
 };
}
const css=document.createElement("style");
css.textContent=".gg-brief{padding:22px;background:white;border:1px solid #dce6f1;border-radius:16px;margin-bottom:16px}"+
".gg-brief-header{padding:23px;border-radius:13px;background:linear-gradient(110deg,#112b4b,#1d557d);color:white}"+
".gg-brief-header h3{font-size:23px!important;color:#fff!important;margin:8px 0!important}"+
".gg-brief-header p{color:#daebf8;font-size:12px;line-height:1.8;margin-top:8px}"+
".gg-brief-label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;color:#9adce4}"+
".gg-brief-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}"+
".gg-brief-tags span{background:#ffffff19;border:1px solid #6b9cb6;border-radius:7px;padding:7px 10px;font-size:11px}"+
".gg-brief-section{padding:19px 0;border-bottom:1px solid #e1eaf2}.gg-brief-section h4{color:#1d4269;font-size:16px;margin:0 0 11px}"+
".gg-brief-section p,.gg-brief-section li{font-size:12px;line-height:1.8;color:#4e6780;margin:5px 0}"+
".gg-brief-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:14px 0}"+
".gg-brief-metric{background:#f4f8fd;border:1px solid #dde8f3;padding:12px;border-radius:10px}"+
".gg-brief-metric b{display:block;font-size:21px;color:#163f66}.gg-brief-metric small{font-size:10px;color:#637b90}"+
".gg-brief-callout{background:#eff6fb;padding:15px;border-left:4px solid #317aa6;border-radius:5px;color:#254f72;font-size:13px;line-height:1.8}"+
".gg-brief-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}"+
".gg-brief-card{background:#fbfdff;padding:15px;border:1px solid #dce7f1;border-radius:11px}"+
".gg-brief-card b{color:#214b73;font-size:12px}.gg-brief-card p{margin:7px 0}"+
".gg-brief-list{padding-left:21px}.gg-brief-footer{display:flex;gap:9px;flex-wrap:wrap;margin-top:20px}"+
".gg-brief-footer button{border:1px solid #265fb5;background:#265fb5;color:white;border-radius:9px;padding:11px 14px;cursor:pointer;font-weight:750;font-size:12px}"+
".gg-brief-footer button.outline{background:white;color:#25599c;border-color:#c9d8e9}"+
".gg-brief-fine{font-size:11px!important;color:#6a8095!important}"+
"@media(max-width:850px){.gg-brief-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.gg-brief-grid{grid-template-columns:1fr}.gg-brief{padding:12px}}";
document.head.appendChild(css);
const sec=(title,body)=>'<section class="gg-brief-section"><h4>'+esc(title)+'</h4>'+body+'</section>';
const ol=items=>'<ol class="gg-brief-list">'+items.map(i=>'<li>'+esc(i)+'</li>').join("")+'</ol>';
const stat=(v,label)=>'<div class="gg-brief-metric"><b>'+esc(v)+'</b><small>'+esc(label)+'</small></div>';
function html(b){
 const t=b.territorio,i=b.iit,e=b.evidencia;
 const score=i.puntuacion==null?"No comparable":dec(i.puntuacion)+"/100";
 const place=i.puesto_departamental==null?"N/D":i.puesto_departamental+" de "+i.distritos_comparables;
 return '<article id="gg-opportunity-brief" class="gg-brief">'+
 '<header class="gg-brief-header"><div class="gg-brief-label">GeoGrowth AI · Territory Opportunity Brief</div>'+
 '<h3>'+esc(t.distrito||"Territorio")+' · '+esc(t.departamento)+' · '+esc(t.ubigeo)+'</h3>'+
 '<p>Informe territorial automatizado con evidencias, lectura del IIT elegido y recomendación comercial condicionada a validación.</p>'+
 '<div class="gg-brief-tags"><span>IIT: '+esc(score)+'</span><span>Posición: '+esc(place)+'</span>'+
 '<span>Peso E: '+i.peso_empresas_pct+'%</span><span>Peso B: '+i.peso_menor_presencia_oficinas_pct+'%</span></div></header>'+
 sec("1. Recomendación ejecutiva",'<div class="gg-brief-callout"><strong>'+esc(b.decision.recomendacion)+'</strong></div>'+
 '<p>La decisión depende de la posición IIT del distrito frente a otros de '+esc(t.departamento)+'. No implica oportunidades de crédito confirmadas ni proyección de rentabilidad.</p>')+
 sec("2. Explicación del IIT seleccionado",'<p>'+(
 i.puntuacion==null?"Faltan variables comparables para calcular un IIT territorial válido.":
 'IIT '+esc(dec(i.puntuacion))+'/100, puesto '+esc(place)+'. La señal de microempresas históricas aporta '+
 esc(dec(i.aporte_empresarial))+' puntos; la de menor presencia relativa de oficinas aporta '+esc(dec(i.aporte_oficinas))+
 ' puntos. Dimensión de mayor contribución: '+esc(i.dimension_dominante.replaceAll("_"," "))+'.'
 )+'</p><div class="gg-brief-metrics">'+stat(score,"Índice IIT")+stat(place,"Ranking departamental")+
 stat(dec(i.aporte_empresarial),"Aporte E (empresas)")+stat(dec(i.aporte_oficinas),"Aporte B (oficinas)")+
 '</div><p class="gg-brief-fine">IIT = 100 × [w × E + (1 − w) × B]. Variables normalizadas con log(1+n) por departamento. No mide inclusión financiera ni probabilidad de conversión.</p>')+
 sec("3. Evidencia territorial",'<div class="gg-brief-metrics">'+
 stat(fmt(e.produce_2015.micro),"Microempresas · PRODUCE 2015")+
 stat(fmt(e.produce_2015.pequenas),"Pequeñas empresas · PRODUCE 2015")+
 stat(fmt(e.sbs_2025.oficinas),"Oficinas SBS · 2025")+
 stat(fmt(e.sbs_2025.puntos),"Puntos financieros SBS · 2025")+
 '</div><p><b>Licencias:</b> '+esc(e.licencias)+'</p>')+
 sec("4. Hipótesis comerciales para investigar",'<div class="gg-brief-grid">'+b.hipotesis.map(h=>
 '<div class="gg-brief-card"><b>'+esc(h.titulo)+'</b><p><strong>Evidencia:</strong> '+esc(h.hecho)+
 '</p><p><strong>Hipótesis:</strong> '+esc(h.hipotesis)+'</p><p><strong>Cómo validarla:</strong> '+esc(h.validacion)+'</p></div>').join("")+'</div>')+
 sec("5. Productos candidatos, no ofertas preaprobadas",'<div class="gg-brief-grid">'+b.productos.map(p=>
 '<div class="gg-brief-card"><b>'+esc(p.nombre)+'</b><p>'+esc(p.condicion)+'</p></div>').join("")+
 '</div><p class="gg-brief-fine">Sujetos al catálogo y criterios vigentes de Caja Trujillo; requieren necesidad real y evaluación individual.</p>')+
 sec("6. Plan de validación en campo",ol(b.acciones))+
 sec("7. Criterios de avance o descarte",ol(b.criterios))+
 sec("8. Brechas y evidencia auditable",ol(b.faltantes)+
 '<p><strong>Identificadores:</strong> '+(e.ids.length?e.ids.map(id=>'<code>'+esc(id)+'</code>').join(" · "):"N/D")+
 '</p><p class="gg-brief-fine">'+esc(b.limitacion)+'</p>')+
 '<div class="gg-brief-footer"><button type="button" data-gg-export-brief>Exportar Opportunity Brief JSON</button>'+
 '<button type="button" class="outline" data-go-section="plan">Continuar a campaña</button></div></article>';
}

const focused=document.createElement("style");
focused.textContent=".gg-ai-lead{font-size:12px;line-height:1.85;color:#375978;margin:14px 0}.gg-ai-chip{display:inline-block;background:#eaf4fc;color:#285a86;border:1px solid #cbdfee;border-radius:8px;font-size:10px;padding:6px 9px;margin:5px 6px 5px 0}.gg-ai-compare{width:100%;border-collapse:collapse;margin-top:12px}.gg-ai-compare th,.gg-ai-compare td{border-bottom:1px solid #e1e9f2;text-align:left;font-size:11px;padding:10px}.gg-ai-compare th{background:#f5f9fd;color:#355c81}.gg-ai-strong{font-weight:700;color:#153e69}.gg-ai-details{padding:14px;background:#f6f9fc;border-radius:9px;margin-top:12px}.gg-ai-details summary{cursor:pointer;font-size:12px;font-weight:800;color:#215287}.gg-ai-insight{padding:13px;border:1px solid #cfe0ed;border-radius:10px;background:#eff7fc;margin:12px 0}.gg-ai-insight b{font-size:12px;color:#204c72}.gg-ai-insight p{font-size:12px;color:#496780;line-height:1.7;margin-top:6px}.gg-ai-questions{padding-left:22px}.gg-ai-questions li{font-size:12px;color:#4b6881;line-height:1.8;margin:8px 0}";
document.head.appendChild(focused);
function agentHtml(b){
 const t=b.territorio,i=b.iit,e=b.evidencia,a=b.investigacion;
 const shown=t.distrito||"UBIGEO "+t.ubigeo;
 const score=i.puntuacion==null?"No comparable":dec(i.puntuacion)+"/100";
 const rank=i.puesto_departamental==null?"Sin ranking":i.puesto_departamental+" de "+i.distritos_comparables;
 const importance=i.puesto_departamental==null?"Sin clasificación":
   b.decision.categoria==="prioridad_exploratoria"?"Validación prioritaria":
   b.decision.categoria==="investigacion_focalizada"?"Investigación selectiva":"Observación con verificación puntual";
 const sectorText=a.sectores.length
   ?"En los "+fmt(a.licencias_individuales)+" registros municipales individualizados disponibles, los giros con mayor frecuencia publicada son "+
     a.sectores.slice(0,3).map(x=>x.sector+" ("+fmt(x.registros)+" expedientes, "+dec(x.porcion)+" %)").join("; ")+
     ". Esta distribución describe expedientes disponibles, no empresas operativas ni demanda de crédito."
   :"No hay giros municipales individualizados suficientes en este distrito para inferir un segmento comercial con la fuente publicada.";
 const sectorHtml=a.sectores.length
  ?'<div class="gg-brief-metrics">'+a.sectores.slice(0,4).map(x=>stat(fmt(x.registros),x.sector+" · expedientes")).join("")+'</div>'
  :'<div class="gg-ai-insight"><p>'+esc(a.estado_evidencia)+'</p></div>';
 const examples=a.ejemplos_publicados.length
  ?'<details class="gg-ai-details"><summary>Ver ejemplos de registros municipales publicados (no clientes validados)</summary>'+
    '<div class="gg-brief-grid">'+a.ejemplos_publicados.map(x=>
      '<div class="gg-brief-card"><b>'+esc(x.nombre)+'</b><p>'+esc(x.sector)+" · Licencia: "+esc(x.fecha_licencia||"N/D")+'</p>'+
      (x.giro?'<p>'+esc(x.giro)+'</p>':"")+'</div>').join("")+'</div></details>'
  :"";
 const alt=a.alternativas_departamentales.length
  ?'<table class="gg-ai-compare"><thead><tr><th>Comparación territorial</th><th>IIT</th><th>Microempresas 2015</th><th>Oficinas SBS 2025</th></tr></thead><tbody>'+
   a.alternativas_departamentales.map(x=>'<tr><td>'+esc(x.distrito||"UBIGEO "+x.ubigeo)+' · '+esc(x.ubigeo)+'</td><td>'+esc(dec(x.iit))+
   '</td><td>'+esc(fmt(x.micro_2015))+'</td><td>'+esc(fmt(x.oficinas_2025))+'</td></tr>').join("")+'</tbody></table>'
  :'<p>No hay distritos comparables adicionales.</p>';
 const sensitivity=a.sensibilidad.map(x=>'<span class="gg-ai-chip">Peso E '+x.peso_empresarial_pct+'%: IIT '+esc(dec(x.puntuacion))+
   ', puesto '+esc(x.puesto??"N/D")+'</span>').join("");
 return '<article id="gg-opportunity-brief" class="gg-brief">'+
  '<header class="gg-brief-header"><div class="gg-brief-label">GeoGrowth · Informe de oportunidad territorial</div>'+
  '<h3>'+esc(shown)+' · '+esc(t.departamento)+'</h3>'+
  '<p>Análisis de señales, hipótesis y decisión comercial verificable. Generación mediante reglas y datos trazables; este entorno no tiene un LLM conectado.</p>'+
  '<div class="gg-brief-tags"><span>IIT '+esc(score)+'</span><span>Ranking '+esc(rank)+'</span><span>Decisión: '+esc(importance)+'</span></div></header>'+
  sec("1. Qué recomienda el análisis",'<div class="gg-brief-callout"><strong>'+esc(b.decision.recomendacion)+'</strong></div>'+
    '<p class="gg-ai-lead"><b>Por qué:</b> '+esc(a.diagnostico)+'</p>'+
    '<div class="gg-brief-metrics">'+stat(score,"IIT seleccionado")+stat(rank,"Posición departamental")+
    stat(dec(i.aporte_empresarial),"Aporte empresas E")+stat(dec(i.aporte_oficinas),"Aporte oficinas B")+'</div>')+
  sec("2. Evidencia territorial y segmentos observables",'<p>'+esc(sectorText)+'</p>'+sectorHtml+
    '<div class="gg-ai-insight"><b>Foco comercial para contrastar</b><p>'+esc(b.agentes_demo?.hipotesis_territorial||a.foco_comercial)+'</p></div>'+
    '<p class="gg-brief-fine">PRODUCE 2015: '+esc(fmt(e.produce_2015.micro))+' microempresas. SBS 2025: '+esc(fmt(e.sbs_2025.oficinas))+
    ' oficinas y '+esc(fmt(e.sbs_2025.puntos))+' puntos. Licencias: '+esc(e.licencias)+'</p>'+examples)+
  sec("3. Hipótesis que el asesor debe investigar",'<div class="gg-brief-grid">'+b.hipotesis.map(h=>
    '<div class="gg-brief-card"><b>'+esc(h.titulo)+'</b><p><strong>Señal:</strong> '+esc(h.hecho)+'</p>'+
    '<p><strong>Posible oportunidad:</strong> '+esc(h.hipotesis)+'</p><p><strong>Prueba:</strong> '+esc(h.validacion)+'</p></div>').join("")+'</div>'+
    '<div class="gg-ai-insight"><b>Alternativas de producto solo si existe necesidad declarada</b><p>'+
    esc(b.productos.map(x=>x.nombre+" — "+x.condicion).join(" "))+'</p></div>')+
  sec("4. Guía concreta para la visita de campo",'<p>Esta investigación se convierte en campaña solo al asignar territorios y responsables. En campo deben verificarse los hechos pendientes, no asumir clientes desde el ranking.</p>'+
    ol(b.acciones)+'<h4>Preguntas que debe resolver el asesor</h4>'+
    '<ul class="gg-ai-questions">'+a.preguntas_asesor.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>'+
    '<div class="gg-ai-insight"><b>Condición para avanzar</b><p>'+esc(a.criterio_aprobacion)+'</p></div>')+
  sec("5. Alternativas del departamento y sensibilidad del IIT",'<p>Antes de seleccionar este territorio para una campaña, comparar con distritos mejor ubicados bajo la misma ponderación. Estos son referentes técnicos, no mejores conversiones demostradas.</p>'+
    alt+'<p><strong>Prueba de ponderaciones:</strong></p><div>'+sensitivity+'</div>'+
    '<p class="gg-brief-fine">Los pesos cambian el orden de investigación; no convierten el IIT en una probabilidad.</p>')+
  sec("6. Fuentes y condiciones de uso",'<details class="gg-ai-details"><summary>Ver metodología, datos faltantes y trazabilidad</summary>'+
    ol(b.faltantes)+'<p><strong>IDs de fuentes:</strong> '+(e.ids.length?e.ids.map(x=>'<code>'+esc(x)+'</code>').join(" · "):"N/D")+'</p>'+
    '<p>'+esc(b.limitacion)+'</p><p>'+esc(a.limite)+'</p>'+
    '<p>IIT = 100 × [w × E + (1−w) × B]; E es concentración relativa de microempresas históricas y B menor presencia relativa de oficinas SBS. Ponderación seleccionada: E '+i.peso_empresas_pct+' %, B '+i.peso_menor_presencia_oficinas_pct+' %.</p></details>')+
  '<div class="gg-brief-footer"><button type="button" data-gg-export-brief>Exportar análisis con evidencias JSON</button>'+
  '<button type="button" class="outline" data-go-section="plan">Diseñar campaña a partir de este territorio</button></div></article>';
}

function current(){
 const r=DATA.find(x=>String(x.ubigeo)===String(state.selected));
 return r?build(r,state.w):null;
}
const oldRender=render;
render=function(){
 oldRender();
 if(state.view!=="opportunity")return;
 const legacy=document.getElementById("content")?.querySelector(".go-block");
 const b=current();
 if(legacy&&b)legacy.outerHTML=agentHtml(b);
};
document.addEventListener("click",event=>{
 const btn=event.target.closest("[data-gg-export-brief],[data-go-brief],#exportBrief");
 if(!btn||state.view!=="opportunity")return;
 const b=current();if(!b)return;
 event.preventDefault();event.stopImmediatePropagation();
 if(typeof download==="function")download("geogrowth_opportunity_brief_"+b.territorio.ubigeo+".json",b);
},true);
window.GeoGrowthOpportunityBriefV2={build};
render();
})();