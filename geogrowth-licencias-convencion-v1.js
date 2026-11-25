/* GeoGrowth: fuente municipal agregada 2026-T2 de Santa Ana (La Convención).
   No contiene nombres, RUC, domicilios ni prospectos individuales. */
(function(){
 "use strict";
 if(new URLSearchParams(window.location.search).get("modo")!=="ampliado")return;
 let record=null;
 const api={
  status:"cargando",
  forUbigeo(id){return record?.ubicacion?.ubigeo_inei===String(id)?record:null;},
  totalIntegrado(){return record?record.calidad.registros_q2_2026:0;}
 };
 window.GeoGrowthMunicipalAdditional=api;
 fetch("data/licencias_convencion_2026q2_resumen.json",{cache:"force-cache"})
  .then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json();})
  .then(data=>{
    if(data.ubicacion?.ubigeo_inei!=="080901"||
       data.codigo_entidad!=="300748"||
       data.calidad?.registros_q2_2026!==56||
       Object.values(data.q2_2026?.por_codigo_giro||{}).reduce((a,n)=>a+Number(n),0)!==56)
      throw Error("Agregación 2026-T2 inválida o sin correspondencia territorial");
    record=data;
    api.status="disponible";
    if(typeof render==="function")render();
  })
  .catch(err=>{
    api.status="no_disponible";
    console.error("No se pudo cargar fuente municipal agregada de Santa Ana:",err);
  });
})();
