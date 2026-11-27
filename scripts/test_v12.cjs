const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=['index.html','expansion-comercial.html','mercados-desatendidos.html','campanas-estacionales.html','configuracion.html'];
assert.deepEqual(fs.readdirSync(root).filter(x=>x.endsWith('.html')&&!x.startsWith('__')).sort(),pages.slice().sort());
for(const p of pages){const html=read(p);assert(html.includes('assets/pro-max.css'));assert(html.includes('assets/shell.js'));for(const m of html.matchAll(/(?:src|href)="(assets\/[^"?]+)(?:\?[^"]*)?"/g))assert(fs.existsSync(path.join(root,m[1])),p+' '+m[1]);}
assert(read('design-system/geogrowth-ai/MASTER.md').includes('#0F766E'));
const context={window:{},console};vm.createContext(context);vm.runInContext(read('assets/seasonal.js'),context);
const S=context.window.GeoGrowthSeasonal;assert.equal(S.rules.length,5);
const list=[{id:1,sector:'Librería',departamento:'Lima',ubigeo:'150101',fecha:'2026-01-01'},{id:2,sector:'Agricultura',departamento:'Lima',ubigeo:'150101',fecha:'2026-01-01'},{id:3,sector:'Librería',departamento:'Arequipa',ubigeo:'040101',fecha:'2025-01-01'}];
assert.equal(S.candidates(list,S.rules.find(r=>r.id==='escolar'),{dep:'Lima',prov:'1501',u:'150101',year:'2026'}).length,1);
assert.equal(S.candidates(list,S.rules.find(r=>r.id==='agro'),{dep:'Lima',year:'2025'}).length,0);
assert.equal(S.candidates(list,S.rules.find(r=>r.id==='agro'),{dep:'Lima',year:'2026'}).length,1);
let response={results:[]};const storage=new Map();const fake={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
const g={window:{google:{maps:{importLibrary:async()=>({Geocoder:class{async geocode(){return response}}})}}},sessionStorage:fake,localStorage:fake,console};
vm.createContext(g);vm.runInContext(read('assets/google-v11.js'),g);
const G=g.window.GeoGrowthGoogleV11;G.save('TEST_ONLY','DEMO_MAP_ID');assert.equal(G.config().GOOGLE_MAPS_API_KEY,'TEST_ONLY');
(async()=>{const src={direccion:'Av. Ejemplo 100'};response={results:[{formatted_address:'Avenida Ejemplo 100, Lima, Perú',geometry:{location_type:'ROOFTOP',location:{lat:-12,lng:-77}}}]};assert((await G.geocodeRecord(src,'Lima')).geocoded);response.results[0].formatted_address='Avenida Otra 200, Lima';assert.equal(await G.geocodeRecord(src,'Lima'),null);response.results[0].formatted_address='Avenida Ejemplo 100, Lima';response.results[0].partial_match=true;assert.equal(await G.geocodeRecord(src,'Lima'),null);console.log('OK: five pages, asset references, official design, seasonal filters, shared session and mocked geocoding');})().catch(e=>{console.error(e);process.exitCode=1});