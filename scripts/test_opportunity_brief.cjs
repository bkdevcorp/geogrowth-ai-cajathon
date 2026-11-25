"use strict";
/* Opportunity Brief: deterministic regression on original public Data Pack. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"GeoGrowth_AI_Dashboard_V3.html"),"utf8");
const p=html.indexOf("const DATA=")+"const DATA=".length;
const q=html.indexOf(";\nconst ",p);
assert(p>11&&q>p,"Data Pack embedded in original dashboard");
const DATA=JSON.parse(html.slice(p,q));
const script=fs.readFileSync(path.join(root,"geogrowth-opportunity-brief-v2.js"),"utf8");
const logs={renders:0,click:null,exported:[],html:""};
const legacy={set outerHTML(v){logs.html=v;}};
const content={querySelector(s){return s===".go-block"?legacy:null;}};
const state={view:"opportunity",selected:"040520",dep:"Arequipa",w:55};
const w={location:{search:"?modo=ampliado"}};
const sandbox={
 window:w,URLSearchParams,
 document:{
  createElement(){return {textContent:""};},
  head:{appendChild(){}},
  getElementById(id){return id==="content"?content:null;},
  addEventListener(type,handler,capture){if(type==="click"&&capture)logs.click=handler;}
 },
 DATA,state,
 render(){logs.renders++;},
 getScored(){
  const rows=DATA.filter(x=>x.departamento===state.dep&&x.ambas_fuentes);
  const maxE=Math.max(1,...rows.map(x=>Math.log1p(x.micro_2015||0)));
  const maxO=Math.max(1,...rows.map(x=>Math.log1p(x.sbs_oficinas_2025||0)));
  return rows.map(r=>({...r,score:Math.round(100*(state.w/100*Math.log1p(r.micro_2015||0)/maxE+(1-state.w/100)*(1-Math.log1p(r.sbs_oficinas_2025||0)/maxO))*10)/10}))
      .sort((a,b)=>b.score-a.score);
 },
 download(...a){logs.exported.push(a);},
 console,Date
};
vm.runInNewContext(script,sandbox,{filename:"geogrowth-opportunity-brief-v2.js"});
const target=DATA.find(r=>r.ubigeo==="040520");
assert(target&&target.micro_2015===2811&&target.sbs_oficinas_2025===18);
const brief=w.GeoGrowthOpportunityBriefV2.build(target,55);
assert.equal(brief.iit.puntuacion,53.9);
assert.equal(brief.iit.puesto_departamental,89);
assert.equal(brief.iit.distritos_comparables,101);
assert.equal(brief.decision.categoria,"observacion");
assert.match(brief.decision.recomendacion,/No lanzar una campaña amplia/);
assert.equal(brief.evidencia.produce_2015.micro,2811);
assert.equal(brief.evidencia.sbs_2025.puntos,343);
assert.match(logs.html,/gg-opportunity-brief/);
assert.match(logs.html,/53[.,]9/);
assert.match(logs.html,/89 de 101/);
assert.match(logs.html,/Evidencia territorial/);
assert.equal(logs.renders,1);
w.GeoGrowthPublicLicenses={registros:[
 {ubigeo:"040520",nombre:"Negocio publicado A",sector:"Comercio",giro:"Venta al por menor",fecha:"2025-12-31"},
 {ubigeo:"040520",nombre:"Negocio publicado B",sector:"Comercio",giro:"Ropa",fecha:"2025-10-01"},
 {ubigeo:"040520",nombre:"Negocio publicado C",sector:"Alimentos y gastronomía",fecha:"2025-11-01"},
 {ubigeo:"040101",nombre:"Otro distrito",sector:"Servicios",fecha:"2025-12-01"}
]};
const withLicenses=w.GeoGrowthOpportunityBriefV2.build(target,55);
assert.equal(withLicenses.investigacion.licencias_individuales,3);
assert.equal(withLicenses.investigacion.sectores[0].sector,"Comercio");
assert.equal(withLicenses.investigacion.sectores[0].registros,2);
assert.equal(withLicenses.investigacion.sectores[1].registros,1);
assert.match(withLicenses.investigacion.foco_comercial,/inventarios/);
assert.equal(withLicenses.investigacion.alternativas_departamentales.length,3);
assert(withLicenses.investigacion.sensibilidad.length>=2);
assert.equal(withLicenses.investigacion.ejemplos_publicados.length,3);
const santa=JSON.parse(read("data/licencias_convencion_2026q2_resumen.json"));
w.GeoGrowthMunicipalAdditional={forUbigeo:ubigeo=>ubigeo==="080901"?santa:null};
const territory=DATA.find(x=>x.ubigeo==="080901");
const with2026=w.GeoGrowthOpportunityBriefV2.build(territory,55);
assert.equal(with2026.investigacion.licencias_adicionales.emitidas_q2_2026,56);
assert.equal(with2026.investigacion.licencias_adicionales.fuera_de_periodo,1);
assert.equal(with2026.investigacion.licencias_adicionales.ubigeo_csv,"070901");
assert.equal(with2026.investigacion.licencias_adicionales.ubigeo_inei,"080901");
assert.equal(with2026.investigacion.licencias_adicionales.por_codigo_giro["5610"],12);
assert.match(with2026.evidencia.licencias,/56 licencias/);
assert(with2026.evidencia.ids.includes("LIC-MPLC-2026Q2:080901"));
assert.equal(with2026.investigacion.ejemplos_publicados.length,0,"No exponer negocios individuales de Santa Ana");
const w70=w.GeoGrowthOpportunityBriefV2.build(target,70);
assert.notEqual(w70.iit.puntuacion,brief.iit.puntuacion);
assert.equal(w70.iit.peso_empresas_pct,70);
assert.equal(w70.iit.peso_menor_presencia_oficinas_pct,30);
assert.equal(state.dep,"Arequipa","Restores selected department");
const unavailable=DATA.find(x=>!x.ambas_fuentes);
assert(unavailable,"Need an UBIGEO with incomplete sources");
const missing=w.GeoGrowthOpportunityBriefV2.build(unavailable,55);
assert.equal(missing.iit.puntuacion,null,"Must not invent IIT when sources missing");
assert.equal(missing.decision.categoria,"sin_iit");
let prevented=0;
logs.click({
 target:{closest(q){return q.includes("data-gg-export-brief")?{}:null;}},
 preventDefault(){prevented++;},
 stopImmediatePropagation(){prevented++;}
});
assert.equal(prevented,2);
assert.equal(logs.exported.length,1);
assert.equal(logs.exported[0][0],"geogrowth_opportunity_brief_040520.json");
assert.equal(logs.exported[0][1].iit.puntuacion,53.9);
assert.equal(logs.exported[0][1].formato,"GeoGrowthTerritoryOpportunityBriefV2");
console.log("OK: Brief por territorio; IIT/puesto reales; decisiones diferenciadas; pesos; datos faltantes; exportación coherente.");
