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
assert.equal(page.GeoGrowthAgentDemo.samples.length,4);
function scenario(ubigeo){
 const r=DATA.find(x=>x.ubigeo===ubigeo);
 assert(r,"Falta distrito "+ubigeo);
 const members=licenses.filter(x=>String(x.ubigeo)===ubigeo);
 const sectorRows=members.filter(x=>x.sector&&x.sector!=="Actividad por verificar"&&x.nombre);
 const count=new Map();
 sectorRows.forEach(x=>count.set(x.sector,(count.get(x.sector)||0)+1));
 const sectores=[...count].sort((a,b)=>b[1]-a[1]).map(([sector,registros])=>({sector,registros}));
 const comparable=DATA.filter(x=>x.departamento===r.departamento&&x.ambas_fuentes);
 const result=create(r,{puntuacion:55,puesto:10,total:comparable.length,peso:55,categoria:"observacion",
   investigacion:{licencias_individuales:members.length,licencias_con_sector_y_nombre:sectorRows.length,sectores}});
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
assert.match(trujillo.hipotesis_territorial,/Trujillo/);
assert.match(lima.hipotesis_territorial,/Lima Cercado/);
assert.match(arequipa.hipotesis_territorial,/Arequipa Cercado/);
assert.match(cajamarca.hipotesis_territorial,/Cajamarca/);
assert.equal(arequipa.fuentes.licencias,"individualizada");
assert.match(arequipa.segmento_demo,/Comercio/);
assert.equal(lima.fuentes.licencias,"expedientes_sin_identificacion");
assert.match(lima.especialista[0].conclusion,/sin nombre comercial, giro ni dirección/);
assert.match(lima.segmento_demo,/no un padrón comercial/);
assert.equal(trujillo.fuentes.licencias,"sin_cobertura");
assert.equal(cajamarca.fuentes.licencias,"sin_cobertura");
assert(!trujillo.segmento_demo.includes("expedientes de Comercio"));
assert(!cajamarca.segmento_demo.includes("expedientes de Comercio"));
const signatures=[trujillo,lima,arequipa,cajamarca].map(x=>x.hipotesis_territorial);
assert.equal(new Set(signatures).size,4,"Los cuatro escenarios deben tener recomendaciones distintas");
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
assert.match(html,/geogrowth-agent-demo-v1\.js\?v=1/);
assert.match(html,/geogrowth-opportunity-brief-v2\.js\?v=1/);
console.log("OK: 4 casos distintos, 25 departamentos, licencias agregadas/individuales/ausentes y casos sin IIT.");
