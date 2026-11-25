"use strict";
/* Prueba multi-departamento de la simulación de agentes, sin red ni claves LLM. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("GeoGrowth_AI_Dashboard_V3.html");
const start=html.indexOf("const DATA=")+"const DATA=".length,end=html.indexOf(";\nconst ",start);
assert(start>10&&end>start,"La página V9 debe conservar el Data Pack");
const DATA=JSON.parse(html.slice(start,end));
const licenses=JSON.parse(read("data/licencias_prospeccion.json")).registros;
const newLicenses=JSON.parse(read("data/licencias_convencion_2026q2_resumen.json"));
const mpa26=JSON.parse(read("data/licencias_arequipa_2026_resumen.json"));
const page={location:{search:"?modo=ampliado"}};
const env={
 window:page,URLSearchParams,DATA,state:{view:"work",selected:"040101",dep:"Arequipa",w:55},
 render(){},
 document:{
  createElement(){return {textContent:""};},
  head:{appendChild(){}},
  addEventListener(){},
  getElementById(){return null;}
 }
};
vm.runInNewContext(read("geogrowth-agent-demo-v1.js"),env,{filename:"geogrowth-agent-demo-v1.js"});
const create=page.GeoGrowthAgentDemo.create;
assert.equal(typeof create,"function");
assert.equal(page.GeoGrowthAgentDemo.samples.length,5);
function scenario(ubigeo){
 const r=DATA.find(x=>x.ubigeo===ubigeo);
 assert(r,"Falta distrito "+ubigeo);
 const members=licenses.filter(x=>String(x.ubigeo)===ubigeo);
 const sectorRows=members.filter(x=>x.sector&&x.sector!=="Actividad por verificar"&&x.nombre);
 const count=new Map();
 sectorRows.forEach(x=>count.set(x.sector,(count.get(x.sector)||0)+1));
 const sectores=[...count].sort((a,b)=>b[1]-a[1]).map(([sector,registros])=>({sector,registros}));
 const comparable=DATA.filter(x=>x.departamento===r.departamento&&x.ambas_fuentes);
 const additional=ubigeo==="080901"?{emitidas_q2_2026:newLicenses.calidad.registros_q2_2026,fuera_de_periodo:newLicenses.calidad.registros_fuera_de_periodo,por_codigo_giro:newLicenses.q2_2026.por_codigo_giro}:null;
 const currentMPA=ubigeo==="040101"?{registros:mpa26.calidad.registros,
    por_tipo:mpa26.resumen.por_tipo,por_estado:mpa26.resumen.por_estado}:null;
 const result=create(r,{puntuacion:55,puesto:10,total:comparable.length,peso:55,categoria:"observacion",
   investigacion:{licencias_individuales:members.length,licencias_con_sector_y_nombre:sectorRows.length,sectores,
     licencias_adicionales:additional,licencias_arequipa_2026:currentMPA}});
 assert.equal(result.ubigeo,ubigeo);
 assert.equal(result.departamento,r.departamento);
 assert.equal(result.especialista.length,4);
 assert(result.especialista.every(x=>x.conclusion&&x.next));
 assert.equal(result.modalidad,"Simulación determinista de roles sin LLM");
 assert(result.piloto_demo.fichas>0);
 assert.equal(result.iit.peso_empresarial_pct,55);
 return result;
}
const trujillo=scenario("130101");
const lima=scenario("150101");
const arequipa=scenario("040101");
const cajamarca=scenario("060101");
const santaAna=scenario("080901");
assert.match(trujillo.hipotesis_territorial,/Trujillo/);
assert.match(lima.hipotesis_territorial,/Lima Cercado/);
assert.match(arequipa.hipotesis_territorial,/Arequipa Cercado/);
assert.match(cajamarca.hipotesis_territorial,/Cajamarca/);
assert.match(santaAna.hipotesis_territorial,/Santa Ana/);
assert.equal(arequipa.fuentes.licencias,"individualizada");
assert.match(arequipa.segmento_demo,/Comercio/);
assert.match(arequipa.especialista[0].conclusion,/824 trámites/);
assert.equal(arequipa.fuentes.licencias_mpa_2026,824);
assert.equal(lima.fuentes.licencias,"expedientes_sin_identificacion");
assert.match(lima.especialista[0].conclusion,/sin nombre comercial, giro ni dirección/);
assert.match(lima.segmento_demo,/no un padrón comercial/);
assert.equal(trujillo.fuentes.licencias,"sin_cobertura");
assert.equal(cajamarca.fuentes.licencias,"sin_cobertura");
assert.equal(santaAna.fuentes.licencias,"agregada_2026q2");
assert.match(santaAna.especialista[0].conclusion,/56 licencias/);
assert.match(santaAna.segmento_demo,/5610/);
assert(!trujillo.segmento_demo.includes("expedientes de Comercio"));
assert(!cajamarca.segmento_demo.includes("expedientes de Comercio"));
const signatures=[trujillo,lima,arequipa,cajamarca,santaAna].map(x=>x.hipotesis_territorial);
assert.equal(new Set(signatures).size,5,"Los cinco escenarios deben tener recomendaciones distintas");
const deps=[...new Set(DATA.map(x=>x.departamento))];
assert.equal(deps.length,25);
for(const dep of deps){
 const r=DATA.find(x=>x.departamento===dep&&x.ambas_fuentes)||DATA.find(x=>x.departamento===dep);
 const result=create(r,{puntuacion:40,puesto:10,total:100,peso:55,categoria:"investigacion_focalizada",
   investigacion:{licencias_individuales:0,sectores:[]}});
 assert(result.especialista[0].conclusion.length>20,"Agente sin lectura en "+dep);
 assert(result.especialista[1].next.length>20,"Agente sin pregunta en "+dep);
 assert(result.piloto_demo.jornadas>0,"Sin piloto de demo en "+dep);
}
const missing=DATA.find(r=>!r.ambas_fuentes);
if(missing){
 const result=create(missing,{puntuacion:null,puesto:null,total:0,peso:55,categoria:"sin_iit",
   investigacion:{licencias_individuales:0,sectores:[]}});
 assert.equal(result.piloto_demo.fichas,0);
 assert.match(result.especialista[3].conclusion,/no comparable/);
}
assert.match(html,/geogrowth-agent-demo-v1\.js\?v=3/);
assert.match(html,/geogrowth-opportunity-brief-v2\.js\?v=\d+/);
console.log("OK: 5 casos distintos, 25 departamentos, fuente Santa Ana 2026-Q2, datos agregados y casos sin IIT.");
