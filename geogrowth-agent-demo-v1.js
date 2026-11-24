/* Simulacion visible de una mesa de agentes para GeoGrowth V9.
 * No conecta LLM ni afirma clientes o conversiones reales. Ejecuta reglas sobre el Data Pack.
 * Funciona en cualquier UBIGEO existente; los cuatro casos son accesos de prueba.
 */
(function(){
"use strict";
if(new URLSearchParams(window.location.search).get("modo")!=="ampliado")return;
const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const number=v=>v==null?"N/D":Number(v).toLocaleString("es-PE");
const dec=v=>v==null?"N/D":Number(v).toLocaleString("es-PE",{minimumFractionDigits:1,maximumFractionDigits:1});
const samples=[
 ["130101","Trujillo"],["150101","Lima Cercado"],["040101","Arequipa Cercado"],["060101","Cajamarca"]
];
function create(r,context){
 const meta=context.investigacion||{};
 const cohort=DATA.filter(x=>x.departamento===r.departamento&&x.ambas_fuentes);
 const total=cohort.length||1;
 const micro=Number(r.micro_2015||0);
 const offices=Number(r.sbs_oficinas_2025||0);
 const microPct=Math.round(100*cohort.filter(x=>Number(x.micro_2015||0)<=micro).length/total);
 const officePct=Math.round(100*cohort.filter(x=>Number(x.sbs_oficinas_2025||0)<=offices).length/total);
 const hasMicro=r.micro_2015!=null;
 const hasOffices=r.sbs_oficinas_2025!=null;
 const municipality=meta.licencias_con_sector_y_nombre>0?"individualizada":
   meta.licencias_individuales>0?"expedientes_sin_identificacion":
   r.licencias_municipales_ref!=null?"agregada":"sin_cobertura";
 const top=meta.sectores?.[0]||null;
 const sourceNote=municipality==="individualizada"
  ?"Hay "+number(meta.licencias_individuales)+" licencias municipales individualizadas con cobertura parcial; los registros no confirman operación actual."
  :municipality==="expedientes_sin_identificacion"
  ?"Se publican "+number(meta.licencias_individuales)+" expedientes en la bandeja del distrito, pero sin nombre comercial, giro ni dirección pública individual. El total histórico municipal de "+number(r.licencias_municipales_ref)+" no constituye una lista de prospectos."
  :municipality==="agregada"
  ?"Hay "+number(r.licencias_municipales_ref)+" expedientes administrativos sin segmentación comercial individualizada verificable en esta fuente."
  :"No hay registros municipales individualizados publicados para este UBIGEO en el paquete; no significa que no haya empresas ni licencias.";
 const lens=hasMicro&&hasOffices
  ?"El distrito se sitúa aproximadamente en el percentil "+microPct+" de microempresas históricas y en el percentil "+officePct+" de oficinas SBS entre los distritos comparables de "+r.departamento+". Son posiciones sobre datos de distintos años."
  :"Al menos una fuente no permite un posicionamiento comparable de microempresas y oficinas.";
 const special={
  "130101":{
   angle:"Trujillo: contrastar si la elevada presencia empresarial histórica coincide con necesidades de servicio que no se resuelven con la infraestructura financiera existente.",
   interview:"¿Cuál es la principal dificultad actual del negocio al financiar compras, cobrar o renovar equipos?"
  },
  "150101":{
   angle:"Lima Cercado: los expedientes administrativos agregados permiten diseñar una búsqueda de fuentes, pero no seleccionar comercios por giro ni producir una lista de contactos.",
   interview:"¿El negocio opera actualmente y su actividad puede contrastarse con una fuente vigente y autorizada?"
  },
  "040101":{
   angle:"Arequipa Cercado: usar los giros municipales publicados como pista para validar comercios y servicios concretos, nunca como clientes identificados automáticamente.",
   interview:"¿La actividad declarada en la licencia sigue vigente y cuál es su necesidad comercial hoy?"
  },
  "060101":{
   angle:"Cajamarca: al faltar licencias municipales individuales en este paquete, abrir una investigación transversal de negocios operativos antes de focalizar por sector.",
   interview:"¿Qué tipo de establecimiento está activo y qué necesidad financiera manifiesta, si alguna?"
  }
 }[String(r.ubigeo)];
 const sectorFocus=top
  ?"La señal municipal más frecuente publicada es "+top.sector+" ("+number(top.registros)+" expedientes de "+number(meta.licencias_individuales)+"). Evaluar primero vigencia y necesidades de ese giro, sin extrapolarlo a todo el distrito."
  :municipality==="agregada"||municipality==="expedientes_sin_identificacion"
  ?"La información municipal es documental, no un padrón comercial por actividad. La siguiente etapa debe recuperar clasificación sectorial vigente antes de elegir rubros."
  :hasMicro&&microPct>=75&&officePct>=75
  ?"Se observa concentración empresarial histórica y de oficinas comparativamente alta. Hipótesis demo: investigar diferenciación de atención, calidad y necesidades insatisfechas, no una ausencia de servicios."
  :hasMicro&&microPct>=75&&officePct<50
  ?"Existe una señal empresarial relativamente elevada frente a la concentración de oficinas. Hipótesis demo: contrastar accesibilidad y cobertura, sin equiparar pocos canales con exclusión financiera."
  :hasMicro&&microPct<50&&officePct>=75
  ?"La infraestructura financiera es relativamente elevada respecto a la señal histórica de microempresas. Hipótesis demo: explorar intensidad de competencia antes de asignar recursos."
  :"No existe evidencia sectorial individualizada para recomendar un giro específico. El primer paso es validar empresas actuales y realizar entrevistas de descubrimiento.";
 const classification=context.categoria;
 const pilot=classification==="sin_iit"
  ?{fichas:0,jornadas:0,asesores:0,texto:"Primero auditar y completar fuentes; no asignar jornadas de prospección desde un IIT incompleto."}
  :classification==="prioridad_exploratoria"
  ?{fichas:12,jornadas:3,asesores:1,texto:"Piloto demostrativo de descubrimiento: 12 fichas a verificar, un asesor y tres jornadas. Son parámetros ilustrativos, no metas ni costos aprobados."}
  :classification==="investigacion_focalizada"
  ?{fichas:8,jornadas:2,asesores:1,texto:"Piloto demostrativo reducido: ocho fichas a verificar, un asesor y dos jornadas; ampliar solo tras registrar evidencia en Campo."}
  :{fichas:5,jornadas:1,asesores:1,texto:"Validación puntual demostrativa: cinco fichas a verificar, un asesor y una jornada. No justificar una campaña masiva por IIT."};
 const sectorQuestion=top
  ?"¿Qué operaciones, inventarios, equipos o inversiones requieren los establecimientos actuales de "+top.sector+"?"
  :special?.interview||"¿Qué negocio está operando actualmente y qué necesidad manifiesta sin que el asesor la presuponga?";
 const roles=[
  {id:"evidencia",name:"Agente de datos",type:"Hecho / cobertura",
   conclusion:(hasMicro?number(micro)+" microempresas PRODUCE (2015). ":"Sin cifra microempresarial comparable. ")+
    (hasOffices?number(offices)+" oficinas SBS (2025). ":"Sin oficinas SBS comparables. ")+sourceNote,
   next:"Contrastar ambas series con registros más recientes y conservar su periodo de origen.",
   sources:[hasMicro?"PRODUCE-2015:"+r.ubigeo:null,hasOffices?"SBS-2025:"+r.ubigeo:null].filter(Boolean)},
  {id:"mercado",name:"Agente de oportunidades",type:"Hipótesis",
   conclusion:special?.angle||sectorFocus,
   next:sectorQuestion,sources:municipality==="individualizada"?["LIC-MPA:"+r.ubigeo]:[]},
  {id:"campo",name:"Agente de campo",type:"Propuesta simulada",
   conclusion:pilot.texto,
   next:"Registrar negocio vigente, interés voluntario, necesidad expresada, evidencia y siguiente acción en GeoGrowth Campo.",sources:[]},
  {id:"control",name:"Agente de control",type:"Validación / límites",
   conclusion:"La decisión IIT "+(context.puntuacion==null?"no comparable":dec(context.puntuacion)+"/100")+
    " (puesto "+(context.puesto??"N/D")+" de "+context.total+") es relativa, no una probabilidad de crédito o conversión. "+lens,
   next:"No registrar contactos inventados, atribuir giros sin fuente ni recomendar un producto sin necesidad declarada.",sources:[]}
 ];
 return {
  tipo:"GeoGrowthMultiAgentDemoV1",modalidad:"Simulación determinista de roles sin LLM",
  ubigeo:String(r.ubigeo),departamento:r.departamento,distrito:r.nombre_distrito||null,
  iit:{puntuacion:context.puntuacion,puesto:context.puesto,total:context.total,peso_empresarial_pct:context.peso},
  fuentes:{produce_2015:r.micro_2015??null,sbs_2025:r.sbs_oficinas_2025??null,licencias:municipality},
  posicion_relativa:{percentil_microempresas_historicas:hasMicro?microPct:null,percentil_oficinas_2025:hasOffices?officePct:null},
  segmento_demo:sectorFocus,hipotesis_territorial:special?.angle||sectorFocus,
  piloto_demo:pilot,pregunta_clave:sectorQuestion,
  especialista:roles,
  nota:"La simulación reproduce el flujo de especialistas, no un análisis generado por un LLM. Las recomendaciones de productos, sectores sin padrón y metas de campo son hipótesis o supuestos expresamente indicados."
 };
}
window.GeoGrowthAgentDemo={create,samples};
const style=document.createElement("style");
style.textContent=".gg-team{background:#fff;border:1px solid #d5e4f2;border-radius:15px;padding:18px;margin:14px 0 19px}.gg-team-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}.gg-team-head h3{font-size:17px!important;color:#164063!important;margin:0 0 7px!important}.gg-team-head p{font-size:11px;color:#59718b;line-height:1.65;margin:0}.gg-team-label{background:#eaf3fa;border:1px solid #cde1f1;border-radius:8px;color:#285980;font-size:10px;font-weight:750;padding:6px 9px}.gg-team-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.gg-team-card{background:#f8fbff;border:1px solid #dfe9f4;border-radius:11px;padding:14px;min-width:0}.gg-team-card b{font-size:12px;color:#173d66}.gg-team-card small{display:block;font-size:10px;color:#50809f;margin:5px 0 7px}.gg-team-card p{font-size:11px;color:#536c83;line-height:1.7;margin:8px 0}.gg-team-card strong{color:#274d6c}.gg-team-foot{border-top:1px solid #e2ecf4;margin-top:14px;padding-top:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}.gg-team-foot button{border:1px solid #c6d9e8;border-radius:8px;background:#fff;color:#25578b;cursor:pointer;font-size:11px;font-weight:750;padding:8px 10px}.gg-team-foot button[data-gg-case-active=true]{background:#214e7c;color:#fff}.gg-team-note{font-size:10px;color:#6b8193;line-height:1.6;margin:7px 0 0}.gg-campaign-agent{background:#f0f7fd;border:1px solid #cadeef;border-radius:11px;padding:16px;margin:13px 0}.gg-campaign-agent h4{font-size:14px;color:#1a4c73;margin:0 0 8px}.gg-campaign-agent p,.gg-campaign-agent li{font-size:11px;line-height:1.7;color:#506c84;margin:7px 0}.gg-campaign-agent ol{padding-left:22px}@media(max-width:830px){.gg-team-grid{grid-template-columns:1fr}.gg-team{padding:13px}}";
document.head.appendChild(style);
const teamHtml=out=>'<section class="gg-team" id="gg-agent-simulation">'+
 '<div class="gg-team-head"><div><h3>Mesa de especialistas · simulación de agentes</h3>'+
 '<p>Cuatro roles revisan el mismo territorio, ponderación IIT y evidencias disponibles; sus conclusiones son reproducibles y están separadas por nivel de certeza.</p></div>'+
 '<span class="gg-team-label">DEMO · sin LLM conectado</span></div>'+
 '<div class="gg-team-grid">'+out.especialista.map(x=>'<div class="gg-team-card"><b>'+safe(x.name)+'</b><small>'+safe(x.type)+'</small>'+
 '<p>'+safe(x.conclusion)+'</p><p><strong>Acción / pregunta:</strong> '+safe(x.next)+'</p>'+
 (x.sources.length?'<small>Fuente: '+x.sources.map(safe).join(" · ")+'</small>':'')+'</div>').join("")+'</div>'+
 '<div class="gg-team-foot"><b style="font-size:11px;color:#315c7f">Comparar casos:</b>'+
 samples.map(([id,label])=>'<button type="button" data-gg-case="'+id+'" data-gg-case-active="'+(id===out.ubigeo)+'">'+safe(label)+'</button>').join("")+'</div>'+
 '<p class="gg-team-note">Los cuatro casos son accesos rápidos de prueba, no un límite del motor. Puedes seleccionar otros departamentos y distritos desde la etapa 01.</p>'+
 '</section>';
function campaignAgent(out){
 const short=out.hipotesis_territorial;
 return '<section class="gg-campaign-agent" id="gg-campaign-agent"><h4>Coordinación comercial propuesta · '+safe(out.departamento)+'</h4>'+
 '<p><strong>Hipótesis para decidir si investigar:</strong> '+safe(short)+'</p>'+
 '<p><strong>Piloto de demostración:</strong> '+safe(out.piloto_demo.texto)+'</p>'+
 '<ol><li>Confirmar territorio y evidencias del IIT; cada distrito del plan tiene una ficha distinta.</li>'+
 '<li>Elegir M0, M1 o M2 según el objetivo técnico de selección y aprobar manualmente los distritos.</li>'+
 '<li>Verificar establecimientos actuales y designar asesor; registrar resultados reales en Campo.</li>'+
 '<li>Revisar interés declarado antes de escalar. No existe una previsión de créditos aprobados.</li></ol>'+
 '<p>La suma IIT de M2 es una meta matemática de priorización, no una meta comercial. El piloto no consume automáticamente el presupuesto simulado.</p></section>';
}
const originalRender=render;
render=function(){
 originalRender();
 if(state.view!=="opportunity"&&state.view!=="plan")return;
 const r=DATA.find(x=>String(x.ubigeo)===String(state.selected));
 if(!r)return;
 const brief=window.GeoGrowthOpportunityBriefV2?.build(r,state.w);
 const analysis=brief?.agentes_demo;
 if(!analysis)return;
 if(state.view==="opportunity"){
   const host=document.getElementById("gg-opportunity-brief");
   if(host&&!document.getElementById("gg-agent-simulation"))
      host.querySelector(".gg-brief-header")?.insertAdjacentHTML("afterend",teamHtml(analysis));
 }else{
   const host=document.getElementById("gg-campaign-guide");
   if(host&&!document.getElementById("gg-campaign-agent"))
      host.querySelector(".gc-intro")?.insertAdjacentHTML("afterend",campaignAgent(analysis));
 }
};
document.addEventListener("click",event=>{
 const action=event.target.closest("[data-gg-case]");
 if(!action)return;
 const ubigeo=action.dataset.ggCase;
 if(!samples.some(([u])=>u===ubigeo))return;
 event.preventDefault();event.stopImmediatePropagation();
 // Reutiliza los selectores y eventos existentes. No toca el mapa V5.
 state.view="work";render();
 const button=document.querySelector('[data-go-example="'+ubigeo+'"]');
 if(button){button.click();state.view="opportunity";render();}
},true);
render();
})();