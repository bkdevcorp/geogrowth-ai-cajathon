/* GeoGrowth Campo V6 — restitución de 442 escenarios sintéticos para enseñar el flujo. */
(()=>{
'use strict';
const D={cases:[],chosen:null,loaded:false};
const css=document.createElement('style');
css.textContent='.gf-demo{border:1px solid #c2d5ed;border-radius:13px;background:#f2f7fe;padding:14px;margin:14px 0}.gf-demo h3{font-size:14px;color:#174166;margin:0 0 6px}.gf-demo p{font-size:11px;color:#52718d;line-height:1.6;margin:4px 0}.gf-cases{display:grid;gap:9px;margin-top:12px}.gf-case{border:1px solid #deebf6;background:#fff;border-radius:11px;padding:12px}.gf-case b{display:block;font-size:12px}.gf-case p{font-size:11px;margin:6px 0}.gf-case .btn{min-height:32px;padding:7px 10px;font-size:11px}.gf-warn{background:#fff5e7;border:1px solid #e6d7b6;border-radius:10px;padding:10px;color:#745726;font-size:11px;line-height:1.55;margin:10px 0}';
document.head.appendChild(css);
function samplesFor(t){return D.cases.filter(c=>c.zona.toLocaleLowerCase('es')===String(t?.nombre||'').toLocaleLowerCase('es')&&c.departamento===t?.departamento);}
function sampleId(id){return D.cases.find(c=>c.id===id);}
const prevCampaign=renderCampaign;
renderCampaign=function(){const base=prevCampaign();const t=(S.campaign.territorios||[]).find(r=>r.ubigeo===S.selected);const matches=samplesFor(t);return base+`<div class="gf-demo"><h3>Escenarios para ensayar la captación</h3><p>Se recuperaron ${fmt(D.cases.length)} negocios <b>totalmente ficticios</b> del prototipo V2, distribuidos en 18 zonas. No son empresas identificadas mediante datos SBS o PRODUCE.</p><div class="gf-warn">Primero investigamos el territorio con fuentes oficiales; luego utilizamos estos casos simulados para practicar una visita y comprobar qué datos comerciales faltan.</div><p><b>Zona actual:</b> ${esc(t?.nombre||'Selecciona un territorio')} · ${matches.length} casos ficticios</p><div class="gf-cases">${matches.slice(0,4).map(c=>`<div class="gf-case"><b>${esc(c.nombre)}</b><p>${esc(c.sector)} · Señal simulada: ${esc(c.senal_simulada)}<br>Necesidad hipotética: ${esc(c.necesidad_hipotetica)}</p><button class="btn secondary" data-gf-pick="${esc(c.id)}">Simular atención</button></div>`).join('')||'<p>Este territorio no cuenta con casos ficticios predefinidos. Puedes registrar una visita manual o importar otro plan.</p>'}</div></div>`;};
const prevForm=form;
form=function(){let base=prevForm();const c=D.chosen;
if(!c)return base.replace('<form id="visitform">','<div class="gf-warn">Registra únicamente información no sensible. Si necesitas un ejemplo completo, vuelve a Campaña y selecciona “Simular atención” en un negocio ficticio.</div><form id="visitform">');
const insert=`<div class="gf-demo"><h3>Caso de entrenamiento · ${esc(c.id)}</h3><p><b>${esc(c.nombre)}</b> — ${esc(c.sector)}</p><p><b>Hipótesis de necesidad:</b> ${esc(c.necesidad_hipotetica)}<br><b>Producto candidato:</b> ${esc(c.producto_candidato)} (sujeto a requisitos por verificar)</p><div class="gf-warn">Caso 100% sintético: no representa una visita, contacto ni elegibilidad real. Registra el resultado de la simulación y expórtalo al dashboard.</div></div>`;
return base.replace('<form id="visitform">',insert+'<form id="visitform">');};
const oldResults=results;
results=function(){return oldResults()+`<div class="gf-demo"><h3>Demostrar el ciclo sin visitas reales</h3><p>Puedes cargar cuatro observaciones ficticias para ver cómo las recibe el dashboard. La cifra de “interesados” solo describe la simulación.</p><button class="btn secondary full" data-gf-samples="1">Cargar cuatro resultados ficticios</button></div>`;};
document.addEventListener('click',e=>{const b=e.target.closest('[data-gf-pick],[data-gf-samples]');if(!b)return;
 if(b.hasAttribute('data-gf-samples')){
 S.visitas=[{territory_ubigeo:'130101',fecha:'2026-11-23',resultado:'Informativo',sector:'Comercio',necesidad:'No verificada',siguiente_accion:'Continuar investigación',consentimiento_simulado:false,observaciones:'SIMULACIÓN; no es una visita real.',tipo_dato:'SINTETICO'},
 {territory_ubigeo:'130105',fecha:'2026-11-23',resultado:'Interesado',sector:'Servicios',necesidad:'Capital de trabajo',siguiente_accion:'Seguimiento con autorización',consentimiento_simulado:true,observaciones:'SIMULACIÓN; cliente ficticio, no es elegibilidad.',tipo_dato:'SINTETICO'},
 {territory_ubigeo:'130104',fecha:'2026-11-23',resultado:'Sin interés',sector:'Comercio',necesidad:'No verificada',siguiente_accion:'No contactar',consentimiento_simulado:false,observaciones:'SIMULACIÓN.',tipo_dato:'SINTETICO'},
 {territory_ubigeo:'130111',fecha:'2026-11-23',resultado:'No verificable',sector:'Servicios',necesidad:'No verificada',siguiente_accion:'Continuar investigación',consentimiento_simulado:false,observaciones:'SIMULACIÓN.',tipo_dato:'SINTETICO'}];
 S.tab='results';render();notify('Cargados resultados de entrenamiento. Exporta JSON para el dashboard.');return;
 }
 const c=sampleId(b.dataset.gfPick);if(!c)return;D.chosen=c;S.tab='visit';render();
 const sector=document.getElementById('sector');if(sector&&[...sector.options].some(o=>o.value===c.sector))sector.value=c.sector;
 const need=document.getElementById('need');if(need&&[...need.options].some(o=>o.value===c.producto_candidato))need.value=c.producto_candidato;
 const obs=document.getElementById('obs');if(obs)obs.value='SIMULACIÓN '+c.id+': '+c.senal_simulada+'. Necesidad no confirmada; evaluar en campo antes de ofrecer productos.';
 notify('Caso ficticio seleccionado. Completa el resultado.');
});
document.addEventListener('submit',e=>{if(e.target.id!=='visitform'||!D.chosen)return;
 const last=S.visitas[S.visitas.length-1];if(last){last.caso_demo_id=D.chosen.id;last.tipo_dato='SINTETICO';last.observaciones='CASO FICTICIO '+D.chosen.id+'. '+last.observaciones;}D.chosen=null;
});
fetch('./data/negocios_demo_sinteticos.json').then(r=>{if(!r.ok)throw Error('Sin datos demo');return r.json()}).then(x=>{D.cases=Array.isArray(x.casos)?x.casos:[];D.loaded=true;if(S.tab==='campaign')render();}).catch(()=>{});
})();
