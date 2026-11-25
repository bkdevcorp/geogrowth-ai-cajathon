/* Fuente adicional MPA 2026: solo agregados, independiente de Santa Ana y MPA 2025. */
(function(){
"use strict";
if(new URLSearchParams(window.location.search).get("modo")!=="ampliado")return;
let data=null;
const api={
 status:"cargando",
 forUbigeo(ubigeo){return data?.territorio?.ubigeo_inei===String(ubigeo)?data:null;},
 get period(){return data?.origen?.periodo_fechas_observado||null;}
};
window.GeoGrowthMunicipalArequipa2026=api;
fetch("data/licencias_arequipa_2026_resumen.json",{cache:"force-cache"})
 .then(r=>{if(!r.ok)throw Error("MPA 2026 HTTP "+r.status);return r.json();})
 .then(r=>{
   if(r.territorio?.ubigeo_inei!=="040101"||
      r.calidad?.registros!==824||
      r.calidad?.emitidos_julio_2026!==0||
      Object.values(r.resumen?.por_mes||{}).reduce((s,n)=>s+Number(n),0)!==824||
      Object.values(r.resumen?.por_tipo||{}).reduce((s,n)=>s+Number(n),0)!==824)
     throw Error("Las cifras MPA 2026 no son coherentes");
   data=r;
   api.status="disponible";
   if(typeof render==="function")render();
 }).catch(e=>{api.status="no_disponible";console.error("MPA 2026:",e);});
})();
