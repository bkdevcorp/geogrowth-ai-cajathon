/* GeoGrowth Campo V8 — entrega directa de un territorio real desde el dashboard.
   Sin cargar empresas ficticias de forma predeterminada.
*/
(()=>{
'use strict';
const params=new URLSearchParams(window.location.search);
const ubigeo=params.get('ubigeo');
if(!ubigeo||!/^[0-9]{6}$/.test(ubigeo))return;
const banner=document.createElement('style');
banner.textContent='.gco-prompt{padding:12px;border-radius:10px;background:#e7f4ff;border:1px solid #c8e1f9;color:#224f77;font-size:12px;margin:12px 0;line-height:1.6}';
document.head.appendChild(banner);
fetch('./data/territorios_reales.json').then(r=>{if(!r.ok)throw Error('No se pudo consultar el Data Pack');return r.json();}).then(rows=>{
 const t=rows.find(r=>r.ubigeo===ubigeo);
 if(!t)throw Error('UBIGEO no encontrado');
 S.campaign={format:'GeoGrowthCampaignV3',source:'GeoGrowth AI — selección de territorio real',departamento:t.departamento,
  budget_hipotetico:0,peso_empresa_historica:55,
  advertencia:'Datos históricos agregados; visita y elegibilidad pendientes de confirmación',
  territorios:[{ubigeo:t.ubigeo,nombre:t.nombre_distrito||'UBIGEO '+t.ubigeo,departamento:t.departamento,iit:null,costo_simulado:0,evidencias:t.evidencia||''}]};
 S.selected=t.ubigeo;S.tab='campaign';S.visitas=[];
 const prev=renderCampaign;
 renderCampaign=function(){return '<div class="gco-prompt"><b>Campaña recibida de GeoGrowth AI</b> — '+esc(t.nombre_distrito||t.ubigeo)+', '+esc(t.departamento)+'. Los datos son territoriales; registra los resultados únicamente después de realizar verificaciones.</div>'+prev();};
 render();notify('Territorio importado directamente desde el dashboard.');
}).catch(e=>{notify('No se pudo abrir el territorio: '+e.message)});
})();
