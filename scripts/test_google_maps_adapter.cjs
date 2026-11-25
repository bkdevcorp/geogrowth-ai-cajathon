"use strict";
/* Google Maps JS adapter: no external API calls or billed requests from CI. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const src=fs.readFileSync(path.join(root,"geogrowth-google-maps-v1.js"),"utf8");
const html=fs.readFileSync(path.join(root,"GeoGrowth_AI_Dashboard_V3.html"),"utf8");
assert.match(html,/geogrowth-google-maps-v1\.js\?v=\d+/);
assert(!/api_key\s*[:=]\s*['"]AIza/i.test(src),"Do not ship an API key");
assert.match(src,/maps\.googleapis\.com\/maps\/api\/js/);
assert.match(src,/google\.maps\.importLibrary/);
assert(!/importLibrary\(["']drawing["']\)/.test(src),"DrawingManager removed from modern Maps JS API");
const noop=()=>{};
const window={location:{search:"?modo=ampliado"}};
const doc={
 createElement(){return {textContent:""};},
 head:{appendChild:noop},
 getElementById(){return null;},
 querySelector(){return null;},
 addEventListener:noop
};
const env={window,document:doc,DATA:[],state:{view:"work",selected:"040101",dep:"Arequipa"},
 URLSearchParams,console,render:noop};
vm.runInNewContext(src,env,{filename:"geogrowth-google-maps-v1.js"});
const api=window.GeoGrowthGoogleMaps;
assert(api,"Google Maps adapter not exposed");
assert.equal(api.mode,"google","Google Maps is the sole commercial map provider");
assert.equal(api.enabled,false);
assert.deepEqual(Array.from(api.libraries.initial),["maps","core","marker","geocoding"]);
assert.deepEqual(Array.from(api.libraries.onDemand),["places"]);

/* No real credentials are used in this regression. */
const generated="AIza"+"A".repeat(35);
let cleared=null;
const privateWindow={
 location:{search:"?modo=ampliado",pathname:"/geogrowth/index.html",
   hash:"#ggmaps="+generated+"&map_id=DEMO_MAP_ID"},
 history:{replaceState(...args){cleared=args;}}
};
vm.runInNewContext(src,{...env,window:privateWindow},{filename:"geogrowth-google-maps-v1.js"});
assert.equal(privateWindow.GeoGrowthGoogleMaps.enabled,true,"Valid private key must auto-enable Google Maps");
assert.equal(privateWindow.GeoGrowthGoogleMaps.mode,"google");
assert.deepEqual(Array.from(cleared),[null,"","/geogrowth/index.html?modo=ampliado"],"URL fragment must be scrubbed");
const invalidWindow={
 location:{search:"?modo=ampliado",pathname:"/geogrowth/index.html",hash:"#ggmaps=INVALID"},
 history:{replaceState(){}}
};
vm.runInNewContext(src,{...env,window:invalidWindow},{filename:"geogrowth-google-maps-v1.js"});
assert.equal(invalidWindow.GeoGrowthGoogleMaps.mode,"google");
assert.equal(invalidWindow.GeoGrowthGoogleMaps.enabled,false);
api.activateForTest("FAKE_KEY");
assert.equal(api.enabled,true,"Google Maps mode must be selectable with injected browser test key");
assert.equal(api.matchLicense([{nombre:"Tienda ABC",direccion:"Calle Lima 123",id:"L1"}],{displayName:"Tienda ABC",formattedAddress:"Calle Lima 123, Perú"}).id,"L1");
assert.equal(api.matchLicense([{nombre:"Tienda ABC",direccion:"Calle Lima 123"}],{displayName:"Tienda ABC",formattedAddress:"Calle Lima 456"}),null);
console.log("OK: Google-only map, session setup, and conservative license matching.");
