"use strict";
/* Regression guard: real UBIGEO hierarchy, opportunity lenses, no fictitious sources. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const load=p=>fs.readFileSync(path.join(root,p),"utf8");
const DATA=JSON.parse(load("data/territorios_reales.json"));
const provinces=JSON.parse(load("data/provincias_ubigeo_ref.json"));
const catalog=JSON.parse(load("data/catalogo_fuentes_cajaradar.json"));
const unique=[...new Set(DATA.map(x=>x.ubigeo.slice(0,4)))];
assert.equal(Object.keys(provinces.provincias).length,196,"Must include the 196 province codes");
assert.equal(unique.length,196,"Must cover all provinces represented in GeoGrowth");
assert.equal(unique.filter(x=>!provinces.provincias[x]).length,0);
assert.equal(DATA.length,1879);
assert.equal(catalog.territorios.length,7);
const mpa=catalog.territorios.find(x=>x.ubigeo==="040101");
assert.equal(mpa.estado,"RESUMEN_MPA_2026_INTEGRADO");
assert.equal(mpa.registros_2026,824);
const santa=catalog.territorios.find(x=>x.ubigeo==="080901");
assert.equal(santa.estado,"RESUMEN_MUNICIPAL_AGREGADO_INTEGRADO");
assert.equal(santa.registros_integrados_q2,56);
for(const item of catalog.territorios)assert(DATA.some(x=>x.ubigeo===item.ubigeo),"External reference missing in DATA: "+item.ubigeo);
assert.equal(catalog.territorios.filter(x=>x.estado==="PORTAL_GENERAL_SIN_DATASET_VERIFICADO").length,1);
const html=load("GeoGrowth_AI_Dashboard_V3.html");
assert.match(html,/geogrowth-filtros-v1\.js\?v=\d+/);
assert.match(html,/geogrowth-operacion-v9\.js\?v=90/);
const events={},outs=[];
const field={value:"",innerHTML:"",dispatchEvent(){}};
const sandbox={
 DATA,URLSearchParams,console,
 Event:class{constructor(type,options){this.type=type;this.bubbles=options?.bubbles;}},
 window:{location:{search:"?modo=ampliado"}},
 state:{view:"work",selected:"200501",dep:"Piura",w:55,budget:2400,plan:[]},
 render(){},
 download(...args){outs.push(args);},
 getScored(){
  return DATA.filter(x=>x.departamento===sandbox.state.dep&&x.ambas_fuentes)
   .map(x=>({...x,score:Number(x.micro_2015||0),cost:450})).sort((a,b)=>b.score-a.score);
 },
 document:{
   createElement(){return {textContent:"",innerHTML:""};},
   head:{appendChild(){}},
   getElementById(id){return id==="go-dep"?{value:"Piura"}:id==="go-ubigeo"?field:null;},
   querySelector(){return null;},
   addEventListener(t,fn){(events[t]??=[]).push(fn);}
 },
 fetch:async uri=>({ok:true,json:async()=>JSON.parse(load(uri))})
};
vm.runInNewContext(load("geogrowth-filtros-v1.js"),sandbox,{filename:"geogrowth-filtros-v1.js"});
const api=sandbox.window.GeoGrowthTerritoryFilters;
assert(api,"Missing public filter interface");
const trigger=(id,value)=>{for(const fn of events.change)fn({target:{id,value}})};
const scoped=()=>api.scopeRows(DATA.find(x=>x.ubigeo==="200501"),sandbox.getScored());
setImmediate(()=>{
 try {
  assert.equal(Object.keys(api.provinces).length,196);
  assert.equal(api.catalog.length,7);
  assert.equal(api.getSource("200501").distrito,"Paita");
  assert.equal(api.provinceName("2005"),"Paita");
  assert.equal(api.getSource("220601").estado,"PORTAL_GENERAL_SIN_DATASET_VERIFICADO");
  assert.equal(api.getSource("080901").estado,"RESUMEN_MUNICIPAL_AGREGADO_INTEGRADO");
  assert.equal(api.getSource("040101").estado,"RESUMEN_MPA_2026_INTEGRADO");
  assert.equal(api.describe(DATA.find(x=>x.ubigeo==="040101")).fuente_municipal_externa,null);
  assert.equal(api.describe(DATA.find(x=>x.ubigeo==="080901")).fuente_municipal_externa,null);
  trigger("gg-filter-province","2005");
  assert.equal(api.province,"2005");
  assert(scoped().every(x=>x.ubigeo.startsWith("2005")),"Province selection leaks other provinces");
  trigger("gg-filter-type","nuevos");
  assert.equal(api.type,"nuevos");
  assert(scoped().every(x=>x.ubigeo==="200501"),"Paita license research scope must not fabricate districts");
  trigger("gg-filter-province","all");
  assert(scoped().some(x=>x.ubigeo==="200104"),"Castilla external dataset should be discoverable");
  trigger("gg-filter-type","estacionales");
  assert.equal(scoped().length,0,"No data to support seasonality classification");
  assert.equal(api.candidates("Piura").length,0,"Must not invent seasonal businesses");
  trigger("gg-filter-type","expansion");
  assert(api.candidates("Piura").length>0);
  assert(api.candidates("Piura").every(x=>x.micro_2015>0));
  trigger("gg-filter-type","desatendidos");
  assert(api.candidates("Piura").every(x=>x.ambas_fuentes===true));
  trigger("gg-filter-type","todas");
  assert(api.candidates("Piura").length>api.candidates("Piura").filter(x=>x.score==null).length);
  const described=api.describe(DATA.find(x=>x.ubigeo==="200501"));
  assert.equal(described.provincia_codigo,"2005");
  assert.equal(described.tipo_oportunidad,"todas");
  sandbox.download("campaign.json",{format:"GeoGrowthCampaignV3",territorios:[]});
  assert.equal(outs.length,1);
  assert.equal(outs[0][1].format,"GeoGrowthCampaignV3");
  assert.equal(outs[0][1].filtros_busqueda.provincia,"Paita");
  assert.equal(outs[0][1].territorios.length,0);
  console.log("OK: 196 provincias, 7 fuentes externas sin ingesta, 4 lentes de investigación, estacionalidad sin datos, alcance y exportación JSON");
 }catch(error){console.error(error);process.exitCode=1;}
});
