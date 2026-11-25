"use strict";
/* Regression guard for the user's approved V9 workflow.
 * No packages: node scripts/test_v9_extension.cjs
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const cp=require("node:child_process");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const hash=p=>cp.execFileSync("git",["hash-object",p],{cwd:root,encoding:"utf8"}).trim();
assert.equal(hash("geogrowth-map.js"),"86a37e0c2ed29726fb9302e59c5a1612ce4cf28a","Approved V5 map must not change");
assert.equal(hash("geogrowth-operacion-v9.js"),"77240cab6fe61e085fec5408c794eb8ae7483619","Original V9 staged workflow must not change");
assert.equal(hash("GeoGrowth_AI_Campo_V3.html"),"1286bfe49223444dbb6adea8f134734dad8ec023","Original field app must not change");
const html=read("GeoGrowth_AI_Dashboard_V3.html");
assert.match(html,/<script src="geogrowth-map\.js\?v=50"><\/script>/);
assert.match(html,/<script src="geogrowth-operacion-v9\.js\?v=90"><\/script>/);
assert.match(html,/<script defer src="geogrowth-v9-extensiones\.js\?v=3"><\/script>/);
assert.match(read("index.html"),/href="GeoGrowth_AI_Dashboard_V3\.html"/,"Stable link must be preserved");
const code=read("geogrowth-v9-extensiones.js");

function environment(search){
  const logs={renders:0,mapRenders:0,requests:0,click:null,lastShell:null,roleButtons:"",navItems:[]};
  const menu=["home","work","score","opportunity","plan","execution","explore","sources","readiness"];
  const resetNav=()=>{logs.navItems=[...menu,...menu].map(view=>({
    dataset:{view},removed:false,remove(){this.removed=true;}
  }));};
  const visibleNav=()=>logs.navItems.filter(item=>!item.removed).map(item=>item.dataset.view);
  const nav={insertAdjacentElement(where,el){assert.equal(where,"afterend");logs.lastShell=el;}};
  const content={querySelector(s){return s===".v9-stages"?nav:null;}};
  const top={parentNode:{insertBefore(el){logs.roleButtons=el;}}};
  const elements={content};
  const document={
    head:{appendChild(){}},
    createElement(){return {className:"",id:"",innerHTML:"",style:{}};},
    querySelector(s){return s===".top .date"?top:null;},
    querySelectorAll(s){assert.equal(s,"#sidenav [data-view],#mobilemenu [data-view]");return logs.navItems;},
    getElementById(id){return elements[id]||null;},
    addEventListener(type,handler,capture){if(type==="click"&&capture)logs.click=handler;}
  };
  const sandbox={
    window:{location:{search},mapSvg:()=>'<div id="ggv5">V5 original</div>',initLeaflet(){logs.mapRenders++;}},
    document,
    state:{view:"work",selected:"040101",dep:"Arequipa"},
    DATA:[{ubigeo:"040101",departamento:"Arequipa",nombre_distrito:"Arequipa Cercado",micro_2015:1500,sbs_oficinas_2025:12,licencias_municipales_ref:894}],
    URLSearchParams,
    Event:class{constructor(type,args){this.type=type;this.bubbles=args.bubbles;}},
    render(){logs.renders++;resetNav();},
    fetch:async ()=>{logs.requests++;return {ok:true,json:async()=>({metadata:{total:1},registros:[{
      id:"LIC-AQP-1",nombre:"Comercio publicado",departamento:"Arequipa",ubigeo:"040101",
      fecha:"2025-12-31",giro:"Comercio",estado:"ACTIVA",fuente:"Municipalidad provincial",puntaje:91
    }]})};},
    console
  };
  vm.runInNewContext(code,sandbox,{filename:"geogrowth-v9-extensiones.js"});
  return {logs,sandbox,visibleNav};
}
const stable=environment("");
assert.equal(stable.logs.renders,0,"Optional extension must do nothing in stable mode");
assert.equal(stable.logs.requests,0,"Stable mode must not load municipal records");
assert.equal(stable.logs.lastShell,null,"Stable UI must not be modified");

const extended=environment("?modo=ampliado&perfil=analista");
assert.equal(extended.logs.renders,1);
assert.match(extended.logs.lastShell.innerHTML,/id="ggv5"/,"V5 map must appear in workflow");
assert.equal(extended.logs.mapRenders,1,"Original V5 initializer must be invoked");
assert.equal(extended.logs.requests,1);
assert.equal(typeof extended.logs.click,"function");
assert.match(extended.logs.roleButtons.innerHTML,/Administrador/);
assert.deepEqual([...new Set(extended.visibleNav())].sort(),
  ["work","score","opportunity","plan","execution"].sort(),
  "Analista solo muestra el flujo de cinco etapas en escritorio y móvil");
assert.equal(extended.visibleNav().length,10,"Cinco etapas por menú: lateral y móvil");

const evt={
  target:{closest(selector){return selector==="[data-v9-role]"?{dataset:{v9Role:"admin"}}:null;}},
  preventDefault(){},stopPropagation(){}
};
extended.logs.click(evt);
assert.match(extended.logs.lastShell.innerHTML,/Administrador · fuentes y decisiones/);
assert.equal(extended.logs.renders,2);
assert.equal(extended.logs.mapRenders,2);
assert.deepEqual([...new Set(extended.visibleNav())].sort(),
  ["home","work","score","opportunity","plan","execution","explore","sources","readiness"].sort(),
  "Administrador conserva el menú completo");
const evtAnalyst={
  target:{closest(selector){return selector==="[data-v9-role]"?{dataset:{v9Role:"analista"}}:null;}},
  preventDefault(){},stopPropagation(){}
};
extended.logs.click(evtAnalyst);
assert.equal(extended.visibleNav().length,10,"Volver al perfil Analista oculta el resto de menús");
extended.sandbox.state.view="explore";
extended.sandbox.render();
assert.equal(extended.sandbox.state.view,"work","Un enlace externo no abre secciones fuera del flujo Analista");
assert.equal(extended.visibleNav().length,10,"El filtrado se conserva tras navegar");
extended.logs.click(evt);
// El mapa ampliado se monta únicamente en la etapa 01; las demás preservan sus vistas.
const mapCountBeforeStages=extended.logs.mapRenders;
for (const stage of ["score","opportunity","plan","execution"]) {
  extended.sandbox.state.view=stage;
  extended.sandbox.render();
  assert.equal(extended.logs.mapRenders,mapCountBeforeStages,"No se debe montar mapa en "+stage);
}
extended.sandbox.state.view="work";
extended.sandbox.render();
assert.equal(extended.logs.mapRenders,mapCountBeforeStages+1,"El mapa vuelve a montarse solo en territorio");
Promise.resolve().then(()=>new Promise(resolve=>setImmediate(resolve))).then(()=>{
  assert.match(extended.logs.lastShell.innerHTML,/Administrador/);
  console.log("OK: V5/V9/Campo unchanged; analyst menu only five stages; admin menu intact; map only in territory");
}).catch(err=>{console.error(err);process.exitCode=1;});
