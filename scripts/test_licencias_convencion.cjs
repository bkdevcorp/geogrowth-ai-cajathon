"use strict";
/* Validación de procedencia, UBIGEO y minimización de datos personales. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));
const summary=load("data/licencias_convencion_2026q2_resumen.json");
const data=load("data/territorios_reales.json");
const catalog=load("data/catalogo_fuentes_cajaradar.json");
assert.equal(summary.codigo_entidad,"300748");
assert.equal(summary.ubicacion.ubigeo_original_csv,"070901");
assert.equal(summary.ubicacion.ubigeo_inei,"080901");
const santa=data.find(x=>x.ubigeo==="080901");
assert(santa&&santa.departamento==="Cusco","Santa Ana debe estar en Cusco");
assert.equal(summary.calidad.registros_originales,57);
assert.equal(summary.calidad.registros_q2_2026,56);
assert.equal(summary.calidad.registros_fuera_de_periodo,1);
assert.equal(summary.calidad.giros_distintos_q2,27);
assert.equal(Object.values(summary.q2_2026.por_mes).reduce((a,b)=>a+b,0),56);
assert.equal(Object.values(summary.q2_2026.por_codigo_giro).reduce((a,b)=>a+b,0),56);
assert.equal(summary.q2_2026.por_codigo_giro["5610"],12);
assert.equal(summary.q2_2026.por_codigo_giro["5630"],6);
assert.equal(summary.origen.sha256,"b15742ef8c3b135ffb83365ccae12ba1f307b8ece8d77473f8ccf6e0b372de15");
const forbidden=new Set(["ruc","razon_social","nombre_comercial","direccion","contacto","representante"]);
function scanKeys(obj){
 for(const [name,value] of Object.entries(obj||{})){
  assert(!forbidden.has(name.toLowerCase()),"No divulgar datos comerciales/personales bajo la clave "+name);
  if(value&&typeof value==="object")scanKeys(value);
 }
}
scanKeys(summary);
assert.equal(catalog.territorios.find(x=>x.ubigeo==="080901")?.estado,"RESUMEN_MUNICIPAL_AGREGADO_INTEGRADO");
const html=fs.readFileSync(path.join(root,"GeoGrowth_AI_Dashboard_V3.html"),"utf8");
assert.match(html,/geogrowth-licencias-convencion-v1\.js\?v=1/);
assert.match(html,/geogrowth-agent-demo-v1\.js\?v=2/);
assert.match(html,/geogrowth-filtros-v1\.js\?v=2/);
assert.match(html,/geogrowth-v9-extensiones\.js\?v=3/);
let renderCount=0;
const page={location:{search:"?modo=ampliado"}};
const environment={
 window:page,URLSearchParams,console,
 render(){renderCount++;},
 fetch:async()=>({ok:true,json:async()=>summary})
};
vm.runInNewContext(fs.readFileSync(path.join(root,"geogrowth-licencias-convencion-v1.js"),"utf8"),environment);
assert.equal(page.GeoGrowthMunicipalAdditional.status,"cargando");
setImmediate(()=>{
 try {
  assert.equal(page.GeoGrowthMunicipalAdditional.status,"disponible");
  assert.equal(page.GeoGrowthMunicipalAdditional.forUbigeo("080901").calidad.registros_q2_2026,56);
  assert.equal(page.GeoGrowthMunicipalAdditional.forUbigeo("070901"),null,"No unir con el UBIGEO RENIEC sin homologar");
  assert.equal(page.GeoGrowthMunicipalAdditional.forUbigeo("040101"),null,"No mezclar fuentes de Arequipa");
  assert.equal(renderCount,1,"Actualizar las vistas cuando termina la carga");
  console.log("OK: 57/56 licencias, código original 070901 a INEI 080901, metadatos sin PII, carga opcional");
 }catch(e){console.error(e);process.exitCode=1;}
});
