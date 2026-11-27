const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),os=require('node:os'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'evidencia',process.env.GEOGROWTH_AUDIT_MODE==='real'?'auditoria-ui':'auditoria-visitas','despues');
const chrome=process.env.GEOGROWTH_CHROME||(process.platform==='win32'?'D:\\GeoGrowth-ChromeHeadless\\chrome-headless-shell-win64\\chrome-headless-shell.exe':'google-chrome');
const python=process.env.GEOGROWTH_PYTHON||(process.platform==='win32'?'D:\\GeoGrowth-Python\\python.exe':'python3');
const port=18763,debug=18764,profile=fs.mkdtempSync(path.join(os.tmpdir(),'gg-audit-'));
fs.mkdirSync(out,{recursive:true});
const server=cp.spawn(python,['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
const browser=cp.spawn(chrome,['--headless','--no-sandbox','--disable-gpu','--remote-debugging-port='+debug,'--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let socket,seq=0,pending=new Map(),errors=[];
async function send(method,params={}){let id=++seq;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error(method+' timeout'));}},12000).unref();});}
async function evaljs(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function until(expression){for(let i=0;i<100;i++){if(await evaljs(expression).catch(()=>false))return;await sleep(100)}throw Error('Timeout '+expression)}
async function shot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(r.data,'base64'));}
async function run(){
 let target;for(let i=0;i<100;i++){try{target=(await (await fetch('http://127.0.0.1:'+debug+'/json/list')).json()).find(x=>x.type==='page');if(target)break}catch{}await sleep(100)}
 assert(target,'Chrome CDP unavailable');
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j});socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text+' '+(m.params.exceptionDetails.exception?.description||''));};
 await send('Page.enable');await send('Runtime.enable');
 const pages=['index.html','expansion-comercial.html','mercados-desatendidos.html','campanas-estacionales.html'],names=['01-nuevos','02-expansion','03-mercados','04-estacionales'];
 let report=[];
 for(let i=0;i<pages.length;i++){
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1700,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:'http://127.0.0.1:'+port+'/'+pages[i]});await until('!!document.querySelector("#u-rows [data-u-detail]")');if(process.env.GEOGROWTH_AUDIT_MODE==='real'){await evaljs('document.querySelector("#u-mode").value="real";document.querySelector("#u-mode").dispatchEvent(new Event("change"));true');await until('!!document.querySelector("#u-rows [data-u-detail]")');}await evaljs('document.fonts.ready.then(()=>true)');await sleep(200);
  await shot(names[i]+'-pantalla');
  if(i===0){await evaljs('document.querySelector("#u-ai").scrollIntoView({block:"start"});true');await sleep(200);await shot('01-nuevos-perfil-individual');await evaljs('document.querySelector(".ai-visit-plan").scrollIntoView({block:"start"});true');await sleep(200);await shot('01-orden-visitas');}
  if(i===0){await evaljs('document.querySelector(".u-map-card").scrollIntoView({block:"start"});true');await sleep(200);await shot('01-nuevos-mapa-estados');}
  await evaljs('document.querySelector("#u-results").scrollIntoView({block:"start"});true');await sleep(200);await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await evaljs('document.querySelector("#u-results").scrollIntoView({block:"start"});true');await sleep(200);await shot(names[i]+'-tabla');
  await evaljs('document.querySelector("#u-case").click();true');await until('!document.querySelector("#u-detail").hidden');await evaljs('document.querySelector("#u-detail").scrollIntoView({block:"start"});true');await sleep(200);await shot(names[i]+'-ficha');if(i===0){await evaljs('document.querySelector(".individual-profile").scrollIntoView({block:"start"});true');await sleep(200);await shot('01-detalle-fuentes');}
  const record=await evaljs('({title:document.querySelector("h1").textContent,summary:document.querySelector("#u-summary").textContent,kpis:[...document.querySelectorAll(".u-kpis .kpi")].map(x=>x.innerText),tableHeaders:[...document.querySelectorAll(".u-table th")].map(x=>x.textContent),detail:document.querySelector("#u-detail").innerText,map:document.querySelector("#u-map-badge").textContent,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+3})');
  assert.equal(record.overflow,false);assert.equal(record.tableHeaders.length,6);report.push(record);
  await evaljs('document.querySelector("#u-close").click();true');
  await send('Emulation.setDeviceMetricsOverride',{width:375,height:844,deviceScaleFactor:1,mobile:true});await evaljs('window.scrollTo(0,0);true');await sleep(200);await shot(names[i]+'-movil');assert.equal(await evaljs('document.documentElement.scrollWidth>document.documentElement.clientWidth+3'),false,'Mobile overflow '+pages[i]);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:'http://127.0.0.1:'+port+'/configuracion.html'});await until('!!document.querySelector("#configForm")');await sleep(200);await shot('05-configuracion');
 const config=await evaljs('({sections:document.querySelectorAll("#content > section").length,hasKey:!!document.querySelector("#mapsKey").value})');assert.equal(config.sections,2);assert.equal(config.hasKey,false);
 fs.writeFileSync(path.join(out,'resultados.json'),JSON.stringify({mode:'Chromium sin API key. '+(process.env.GEOGROWTH_AUDIT_MODE==='real'?'Datos públicos originales.':'Datos y coordenadas sintéticas; mapa esquemático local, no Google Maps.'),pages:report,config,uncaught:errors},null,2));
 assert.deepEqual(errors,[],'Errores JavaScript sin manejar');console.log(JSON.stringify(report.map(x=>({title:x.title,summary:x.summary,kpis:x.kpis,overflow:x.overflow})),null,2));console.log('OK: 17 capturas y resultados JSON; sin excepciones JavaScript');
}
run().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{socket?.close();browser.kill();server.kill();setTimeout(()=>{try{fs.rmSync(profile,{recursive:true,force:true})}catch{}},500).unref();});