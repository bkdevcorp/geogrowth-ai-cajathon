"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const d=JSON.parse(read("data/licencias_arequipa_2026_resumen.json"));
const catalog=JSON.parse(read("data/catalogo_fuentes_cajaradar.json"));
assert.equal(d.territorio.ubigeo_inei,"040101");
assert.equal(d.calidad.registros,824);
assert.equal(d.calidad.expedientes_distintos,824);
assert.equal(d.calidad.emitidos_julio_2026,0);
assert.equal(d.resumen.por_mes["2026-07"],0);
assert.equal(Object.values(d.resumen.por_mes).reduce((a,b)=>a+b,0),824);
assert.equal(Object.values(d.resumen.por_tipo).reduce((a,b)=>a+b,0),824);
assert.equal(Object.values(d.resumen.por_estado).reduce((a,b)=>a+b,0),824);
assert.equal(d.resumen.por_tipo["3. LF RIESGO BAJO O MEDIO"],712);
assert.equal(d.resumen.por_estado.ACTIVA,815);
assert.equal(d.resumen.por_estado["INACTIVA CESE"],9);
assert.equal(d.origen.valor_fecha_de_cierre_uniforme,"2026-07-02");
assert.equal(d.origen.sha256,"afa4e36b64fb83dfa37eb74e52231a8ef5ca50f81d8c253ec8e7ca69ac43f775");
assert.equal(catalog.territorios.find(x=>x.ubigeo==="040101")?.estado,"RESUMEN_MPA_2026_INTEGRADO");
const html=read("GeoGrowth_AI_Dashboard_V3.html");
assert.match(html,/geogrowth-licencias-arequipa-v1\.js\?v=1/);
assert.match(html,/geogrowth-google-maps-v1\.js\?v=1/);
const prohibited=new Set(["expediente","resolucion","resolución","ruc","razon_social","razón_social","direccion","dirección","nombre_titular"]);
function scan(x){if(x&&typeof x==="object"){for(const [k,v] of Object.entries(x)){
 assert(!prohibited.has(k.toLowerCase()),"PII prohibida: "+k);
 scan(v);
}}}
scan(d);
let renders=0;
const site={location:{search:"?modo=ampliado"}};
const env={window:site,URLSearchParams,console,
 render(){renders++;},
 fetch:async()=>({ok:true,json:async()=>d})
};
vm.runInNewContext(read("geogrowth-licencias-arequipa-v1.js"),env,{filename:"geogrowth-licencias-arequipa-v1.js"});
assert.equal(site.GeoGrowthMunicipalArequipa2026.status,"cargando");
setImmediate(()=>{
 try{
  assert.equal(site.GeoGrowthMunicipalArequipa2026.status,"disponible");
  assert.equal(site.GeoGrowthMunicipalArequipa2026.forUbigeo("040101").calidad.registros,824);
  assert.equal(site.GeoGrowthMunicipalArequipa2026.forUbigeo("080901"),null,"MPA no debe mezclarse con Santa Ana");
  assert.equal(renders,1);
  console.log("OK: MPA 2026: 824 registros, sin julio, sin datos individualizados, independiente de Santa Ana.");
 }catch(e){console.error(e);process.exitCode=1;}
});
