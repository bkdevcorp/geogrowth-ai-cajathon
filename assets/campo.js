/* GeoGrowth Campo V10 — registra observaciones locales y exporta JSON.
   No envía mensajes, no valida créditos ni sincroniza con servidores.
*/
(()=>{'use strict';
const NS='gg_v10_',fmt=n=>Number(n||0).toLocaleString('es-PE'), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=()=>('VIS-'+Date.now()+'-'+Math.floor(Math.random()*1e5));
const parse=(n,def)=>{try{return JSON.parse(localStorage.getItem(NS+n))||def}catch{return def}};
const store=(n,v)=>{try{localStorage.setItem(NS+n,JSON.stringify(v))}catch{}};
const $=id=>document.getElementById(id);
let S={campaign:parse('campoCampaign',null),selected:null,results:parse('campoResults',[]),leadMap:{},pending:false};
function toast(t){const el=$('toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,3600);}
function download(name,obj){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);}
function options(){const c=S.campaign;if(!c)return [];
 const leads=(c.prospectos||[]).map(x=>({id:x.id,ubigeo:x.ubigeo,nombre:x.nombre,fecha:x.fecha_licencia,direccion:x.direccion,sector:x.sector,fuente:x.fuente,tipo:'Licencia para verificar'}));
 const territories=(c.territorios||[]).map(x=>({id:'T-'+x.ubigeo,ubigeo:x.ubigeo,nombre:x.nombre,sector:'No verificado',fuente:x.evidencias,tipo:'Territorio'}));
 return [...leads,...territories];
}
function outcomeCounts(){return {total:S.results.length,sim:S.results.filter(x=>x.tipo_dato==='SINTETICO').length,interested:S.results.filter(x=>x.resultado==='Interesado').length}}
function render(){const c=S.campaign,all=options(),x=all.find(x=>x.id===S.selected)||all[0];if(x)S.selected=x.id;
 const stats=outcomeCounts();
 $('fieldApp').innerHTML=`<div class="grid-2" style="margin-bottom:16px"><section class="card"><div class="card-header"><div><h2>Campaña recibida</h2><p>${c?esc(c.campana_id||c.source):'Sin campaña cargada'}</p></div><span class="badge">${c?all.length+' elementos':'Pendiente'}</span></div><div class="actions-row"><label class="btn primary">Importar campaña JSON<input id="importCampaign" type="file" accept=".json,application/json" hidden></label><button class="btn" id="localCampaign">Usar campaña del navegador</button></div><div class="callout warn">El archivo contiene territorios y registros municipales. No incluye calificaciones crediticias ni información de contacto verificada.</div></section><section class="card"><h2>Resultados almacenados localmente</h2><div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)"><div class="kpi"><b>${stats.total}</b><small>Registros</small></div><div class="kpi"><b>${stats.sim}</b><small>Pruebas</small></div><div class="kpi"><b>${stats.interested}</b><small>Interés declarado</small></div></div><button class="btn teal" id="exportVisits" ${!stats.total?'disabled':''}>Exportar resultados JSON</button><p class="muted" style="margin-top:11px">Después abre Seguimiento → Importar resultados JSON.</p></section></div>`+
 (!c?`<div class="blank">No hay campaña cargada. Desde un módulo selecciona licencias → Prepara campaña → Descarga JSON → Impórtalo aquí. También puedes recuperar la campaña guardada en este navegador.</div>`:
 `<div class="field-grid"><section class="card"><div class="card-header"><div><h2>Casos a verificar</h2><p>Las licencias no son negocios confirmados en operación actual.</p></div></div><div class="field-list">${all.map(y=>`<div class="field-visit ${y.id===S.selected?'active':''}" data-select="${esc(y.id)}"><b>${esc(y.nombre)}</b><span class="badge" style="float:right">${esc(y.tipo)}</span><p>${esc(y.ubigeo)} · ${esc(y.sector||'No identificado')} ${y.fecha?'· Licencia '+esc(y.fecha):''}</p>${y.direccion?`<p>Dirección publicada: ${esc(y.direccion)}</p>`:''}</div>`).join('')||'<div class="blank">La campaña está vacía.</div>'}</div></section>`+
 `<section class="card field-form"><h2>Registrar observación</h2><p class="muted" style="margin:6px 0 14px">${x?esc(x.nombre)+' · UBIGEO '+esc(x.ubigeo):'Selecciona primero un territorio'}</p>${x?`<form id="visitform"><div class="field"><label>Resultado de la validación</label><select id="outcome" required><option value="">Seleccionar...</option><option>Pendiente</option><option>Informativo</option><option>Interesado</option><option>Sin interés</option><option>No verificable</option></select></div><div class="field"><label>Actividad observada</label><select id="sector"><option>No verificado</option>${['Comercio','Servicios','Alimentos y gastronomía','Manufactura y talleres','Agropecuario','Educación','Otro'].map(a=>`<option ${a===x.sector?'selected':''}>${a}</option>`).join('')}</select></div><div class="field"><label>Necesidad declarada (no inferida)</label><select id="need"><option>No verificada</option><option>Capital de trabajo</option><option>Activo fijo / equipamiento</option><option>Otra necesidad</option><option>Sin necesidad declarada</option></select></div><div class="field"><label>Próxima acción</label><select id="next"><option>Verificar actividad</option><option>Seguimiento autorizado</option><option>Remitir a evaluación humana</option><option>No contactar</option></select></div><div class="field"><label>Observaciones (sin datos personales)</label><textarea id="obs" placeholder="Ej.: se verificó la existencia del local / requiere nueva visita. No registres teléfonos ni información sensible."></textarea></div><label class="field-check"><input type="checkbox" id="consent">El interesado autorizó seguimiento (solo marcar si fue confirmado)</label><label class="field-check"><input type="checkbox" id="simulate" checked>Registro de prueba / simulación (por defecto)</label><button type="submit" class="btn primary">Guardar observación</button></form>`:'<div class="blank">Sin casos disponibles.</div>'}</section></div>`)+
 `<section class="card field-history"><div class="card-header"><div><h2>Historial de observaciones</h2><p>Registros guardados solo en este navegador</p></div><button class="btn small" id="clearResults" ${!S.results.length?'disabled':''}>Limpiar pruebas</button></div>${S.results.slice().reverse().slice(0,15).map(r=>`<div class="field-history-item"><b>${esc(r.resultado)} · ${esc(r.lead_id||r.territory_ubigeo)}</b><p>${esc(r.fecha)} · ${esc(r.siguiente_accion)} · ${r.tipo_dato==='REAL'?'Declarado real':'Simulación'}</p></div>`).join('')||'<div class="blank">Aún no hay observaciones. Registra una y exporta el JSON.</div>'}</section>`;
}
async function importCampaign(f){const x=JSON.parse(await f.text());validate(x);S.campaign=x;S.selected=null;store('campoCampaign',x);render();toast('Campaña importada con '+(x.territorios?.length||0)+' territorios y '+(x.prospectos?.length||0)+' licencias.');}
function validate(c){if(c.format!=='GeoGrowthCampaignV3'||!Array.isArray(c.territorios)||c.territorios.length>200||!Array.isArray(c.prospectos||[]))throw Error('Archivo de campaña incompatible.');
 if(c.territorios.some(x=>!/^\d{6}$/.test(String(x.ubigeo)))||(c.prospectos||[]).some(x=>!/^\d{6}$/.test(String(x.ubigeo))))throw Error('UBIGEO inválido.');
 if((c.prospectos||[]).length>2000)throw Error('Demasiadas licencias para la app.');}
function saveVisit(){const c=S.campaign;const x=options().find(x=>x.id===S.selected);if(!c||!x)return;
 const outcome=$('outcome').value;if(!outcome){toast('Selecciona un resultado.');return;}
 const simulate=$('simulate').checked;
 if(!simulate&&!confirm('¿Esta observación corresponde a una validación efectivamente realizada? No marques REAL para datos inventados.'))return;
 const r={visita_id:id(),campaign_id:c.campana_id||'',territory_ubigeo:x.ubigeo,lead_id:x.tipo==='Territorio'?'':x.id,
 fecha:new Date().toISOString().slice(0,10),resultado:outcome,sector:$('sector').value,necesidad:$('need').value,
 siguiente_accion:$('next').value,consentimiento_simulado:$('consent').checked,observaciones:$('obs').value.trim().slice(0,1200),tipo_dato:simulate?'SINTETICO':'REAL'};
 S.results.push(r);store('campoResults',S.results);render();toast('Observación guardada. Exporta el JSON para visualizarla en el dashboard.');
}
document.addEventListener('change',async e=>{if(e.target.id!=='importCampaign')return;try{const f=e.target.files?.[0];if(f)await importCampaign(f);}catch(error){toast('Error de importación: '+error.message);}});
document.addEventListener('click',e=>{const target=e.target.closest('[data-select],#localCampaign,#exportVisits,#clearResults');if(!target)return;
 if(target.dataset.select){S.selected=target.dataset.select;render();return;}
 if(target.id==='localCampaign'){const c=parse('campaign',null);if(!c){toast('No hay campaña guardada en este navegador. Importa un archivo JSON.');return;}try{validate(c);S.campaign=c;S.selected=null;store('campoCampaign',c);render();toast('Campaña recuperada.');}catch(error){toast(error.message);}return;}
 if(target.id==='exportVisits'){
   if(!S.results.length){toast('Primero registra observaciones.');return;}
   download('geogrowth_resultados_campo_'+new Date().toISOString().slice(0,10)+'.json',{format:'GeoGrowthFieldResultsV3',version:10,origen:'GeoGrowth Campo V10',visitas:S.results});return;
 }
 if(target.id==='clearResults'&&confirm('¿Eliminar los registros guardados localmente?')){S.results=[];store('campoResults',S.results);render();}
});
document.addEventListener('submit',e=>{if(e.target.id==='visitform'){e.preventDefault();saveVisit();}});
window.GeoGrowthCampo={mount(){S.campaign=parse('campoCampaign',null);S.results=parse('campoResults',[]);render();}};
})();