/* GeoGrowth AI V5: cartografia nacional real y autonomoma. Sin CDN ni claves. */
(()=>{
"use strict";
const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]+/g," ").trim();
const clean=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const number=n=>Number(n||0).toLocaleString("es-PE");
const national=()=>["TODO EL PERU","PERU","NACIONAL"].includes(norm(state.dep));
const valid=r=>r&&r.latitud_ref_sbs!=null&&r.longitud_ref_sbs!=null&&Number.isFinite(+r.latitud_ref_sbs)&&Number.isFinite(+r.longitud_ref_sbs)&&+r.latitud_ref_sbs>-19.5&&+r.latitud_ref_sbs<1&&+r.longitud_ref_sbs>-82.5&&+r.longitud_ref_sbs< -67.5;
const merc=p=>[+p[0],Math.log(Math.tan(Math.PI/4+Number(p[1])*Math.PI/360))*180/Math.PI];
const name=f=>f.properties.NOMBDEP||"";
const W=1050,H=540; let geo=null,promise=null,cycle=0;
const style=document.createElement("style");style.textContent=
".ggv5{height:100%;width:100%;position:relative;background:#eaf3f9;overflow:hidden;border-radius:11px}.ggv5 svg{height:100%;width:100%;display:block;touch-action:none;cursor:grab}.ggv5 svg.dragging{cursor:grabbing}.ggv5-head,.ggv5-menu,.ggv5-note{position:absolute;z-index:3;background:#fffffff0;border:1px solid #dce6f1;border-radius:10px;padding:9px 11px;color:#234765;box-shadow:0 3px 15px #183b5b1c}.ggv5-head{top:12px;left:12px}.ggv5-head b{display:block;font-size:12px}.ggv5-head small{font-size:10px;color:#698399}.ggv5-menu{top:12px;right:58px;width:190px;max-height:230px;overflow:auto}.ggv5-menu strong{font-size:11px}.ggv5-menu button{width:100%;display:flex;justify-content:space-between;text-align:left;border:0;border-bottom:1px solid #edf3f8;background:transparent;cursor:pointer;font-size:10px;color:#36536b;padding:6px 2px}.ggv5-menu button:hover{background:#e5f0fa}.ggv5-menu small{color:#73869d}.ggv5-note{bottom:10px;left:10px;font-size:10px;color:#5e7990;max-width:90%}.ggv5-ctrl{position:absolute;right:12px;top:12px;z-index:4;display:grid;gap:5px}.ggv5-ctrl button{width:36px;height:36px;border-radius:8px;border:1px solid #d3e0eb;background:white;color:#284e70;cursor:pointer;font-size:18px;font-weight:bold}.ggv5 path.gg-dept{stroke:white;stroke-width:1.3;stroke-linejoin:round;vector-effect:non-scaling-stroke;cursor:pointer}.ggv5 path.gg-dept:hover{fill:#8fbae2}.ggv5 path.gg-dept.selected{stroke:#195d6b;stroke-width:2.8}.ggv5 .gg-point{fill:#2766c6;fill-opacity:.88;stroke:#fff;stroke-width:1.5;cursor:pointer}.ggv5 .gg-point:hover{fill:#f09c39;stroke:#244258;stroke-width:2.5}.ggv5 .gg-label{font-size:10px;fill:#17466e;paint-order:stroke;stroke:#fff;stroke-width:3px;pointer-events:none}.ggv5 .gg-error{height:100%;display:grid;place-items:center;color:#6d8397;padding:30px;font-size:13px}";
document.head.appendChild(style);
window.mapSvg=()=>'<div class="ggv5" id="ggv5"><div class="gg-error">Preparando mapa real del Perú…</div></div>';
function polys(g){return g.type==="Polygon"?[g.coordinates]:g.type==="MultiPolygon"?g.coordinates:[]}
function forEachCoord(g,cb){for(const p of polys(g))for(const ring of p)for(const pt of ring)cb(pt)}
function geometryPath(g,P){
 let result="";for(const p of polys(g))for(const ring of p)if(ring.length)
 result+="M"+ring.map(pt=>{let a=P(merc(pt));return a[0].toFixed(2)+","+a[1].toFixed(2)}).join("L")+"Z";
 return result;
}
function load(){
 if(geo)return Promise.resolve(geo);
 if(!promise)promise=fetch("data/peru_departamentos.geojson",{cache:"force-cache"}).then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(g=>{
   if(g.features?.length!==25)throw Error("Se requieren 25 departamentos");geo=g;return g;
 }).catch(e=>{promise=null;throw e});
 return promise;
}
window.initLeaflet=function(){
 const host=document.getElementById("ggv5");if(!host)return;
 const id=++cycle;
 load().then(g=>{if(id===cycle&&host.isConnected)draw(host,g)}).catch(e=>{if(id===cycle){host.innerHTML='<div class="gg-error">No se pudo cargar el mapa departamental local.</div>';console.error(e)}});
};
function draw(host,g){
 const country=national(),all=g.features,focus=all.find(f=>norm(name(f))===norm(state.dep));
 const shapes=!country&&focus?[focus]:all,coords=[];
 shapes.forEach(f=>forEachCoord(f.geometry,p=>coords.push(merc(p))));
 const xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]);
 let minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const padX=.15+(maxX-minX)*.10,padY=.15+(maxY-minY)*.12;
 minX-=padX;maxX+=padX;minY-=padY;maxY+=padY;
 const scale=Math.min((W-50)/(maxX-minX),(H-55)/(maxY-minY));
 const dx=(W-(maxX-minX)*scale)/2,dy=(H-(maxY-minY)*scale)/2;
 const P=([x,y])=>[dx+(x-minX)*scale,H-(dy+(y-minY)*scale)];
 const groups=new Map();
 DATA.forEach(r=>{const k=norm(r.departamento),o=groups.get(k)||{sbs:0,n:0,lat:0,lon:0,w:0};
   o.n++;o.sbs+=Number(r.sbs_puntos_2025||0);
   if(valid(r)){const w=Math.max(1,Math.sqrt(Number(r.sbs_puntos_2025||0)));o.lat+=w*(+r.latitud_ref_sbs);o.lon+=w*(+r.longitud_ref_sbs);o.w+=w;}
   groups.set(k,o);
 });
 const max=Math.max(1,...[...groups.values()].map(v=>v.sbs));
 let regions="";
 for(const f of all){const nm=name(f),o=groups.get(norm(nm))||{sbs:0},selected=!country&&norm(nm)===norm(state.dep);
   const light=Math.round(92-38*Math.sqrt(o.sbs/max));
   const fill=selected?"#abd8cc":"hsl(197 43% "+light+"%)";
   regions+='<path class="gg-dept '+(selected?'selected':'')+'" data-map-dep="'+clean(nm)+'" fill="'+fill+'" d="'+geometryPath(f.geometry,P)+'"><title>'+clean(nm)+" · "+number(o.sbs)+' puntos SBS 2025</title></path>';
 }
 const q=String(state.query||"").trim().toLowerCase();
 const rows=DATA.filter(r=>country||norm(r.departamento)===norm(state.dep));
 const points=rows.filter(valid).filter(r=>!q||(String(r.ubigeo)+" "+String(r.nombre_distrito)).toLowerCase().includes(q));
 let markers="";
 if(country){
   for(const f of all){const nm=name(f),o=groups.get(norm(nm));if(!o?.w)continue;
     const [x,y]=P(merc([o.lon/o.w,o.lat/o.w])),radius=Math.max(6,Math.min(17,5+Math.log1p(o.sbs)*1.2));
     markers+='<circle class="gg-point" data-map-dep="'+clean(nm)+'" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+radius.toFixed(1)+'"><title>'+clean(nm)+' · '+number(o.sbs)+' puntos SBS</title></circle>';
     if(["LIMA","LA LIBERTAD","PIURA","AREQUIPA","LORETO","PUNO","CUSCO","CAJAMARCA"].includes(norm(nm)))markers+='<text class="gg-label" x="'+(x+radius+4).toFixed(1)+'" y="'+(y+3).toFixed(1)+'">'+clean(nm)+'</text>';
   }
 }else{
   const top=new Set([...points].sort((a,b)=>(b.sbs_puntos_2025||0)-(a.sbs_puntos_2025||0)).slice(0,5).map(r=>String(r.ubigeo)));
   for(const r of points){const [x,y]=P(merc([r.longitud_ref_sbs,r.latitud_ref_sbs])),radius=Math.max(3.5,Math.min(12,3.5+Math.sqrt(Number(r.sbs_puntos_2025||0))/5));
     markers+='<circle class="gg-point" data-ubigeo="'+clean(r.ubigeo)+'" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+radius.toFixed(1)+'"><title>'+clean(r.nombre_distrito)+' · '+number(r.sbs_puntos_2025)+' puntos SBS. Clic para ficha</title></circle>';
     if(top.has(String(r.ubigeo)))markers+='<text class="gg-label" x="'+(x+radius+3).toFixed(1)+'" y="'+(y+3).toFixed(1)+'">'+clean(r.nombre_distrito)+'</text>';
   }
 }
 const list=country?'<div class="ggv5-menu"><strong>Departamentos</strong>'+all.slice().sort((a,b)=>name(a).localeCompare(name(b),"es")).map(f=>{
   const n=name(f),a=groups.get(norm(n))||{sbs:0};
   return '<button type="button" data-map-dep="'+clean(n)+'"><span>'+clean(n)+'</span><small>'+number(a.sbs)+'</small></button>';
 }).join("")+'</div>':"";
 host.innerHTML='<div class="ggv5-head"><b>'+(country?'Todo el Perú · 25 departamentos':clean(state.dep))+'</b><small>'+number(points.length)+' distritos con coordenadas SBS</small></div>'+
  '<svg id="ggv5svg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mapa con límites reales del Perú"><rect x="0" y="0" width="'+W+'" height="'+H+'" fill="#eaf3f9"/><g>'+regions+'</g><g>'+markers+'</g></svg>'+
  list+'<div class="ggv5-ctrl"><button data-ggzoom="in">+</button><button data-ggzoom="out">−</button><button data-ggzoom="reset">⤢</button></div>'+
  '<div class="ggv5-note">Límites geográficos reales · Coordenadas promedio SBS 2025, no domicilios de negocios.<br>Fuente: juaneladio/peru-geojson (MPL-2.0)</div>';
 const svg=host.querySelector("#ggv5svg");let cam=[0,0,W,H],drag=null;
 const apply=()=>svg.setAttribute("viewBox",cam.join(" "));
 const zoom=(k,x=.5,y=.5)=>{const w=Math.max(45,Math.min(2*W,cam[2]*k)),h=Math.max(25,Math.min(2*H,cam[3]*k));cam=[cam[0]+(cam[2]-w)*x,cam[1]+(cam[3]-h)*y,w,h];apply();};
 host.querySelectorAll("[data-ggzoom]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();const v=b.dataset.ggzoom;if(v==="reset"){cam=[0,0,W,H];apply();}else zoom(v==="in"?.72:1.36);}));
 svg.addEventListener("wheel",e=>{e.preventDefault();const r=svg.getBoundingClientRect();zoom(e.deltaY<0?.84:1.2,Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)));},{passive:false});
 svg.addEventListener("pointerdown",e=>{if(e.target.closest("[data-map-dep],[data-ubigeo]"))return;drag={x:e.clientX,y:e.clientY,c:[...cam]};svg.classList.add("dragging");try{svg.setPointerCapture(e.pointerId)}catch(error){}});
 svg.addEventListener("pointermove",e=>{if(!drag)return;const r=svg.getBoundingClientRect();cam[0]=drag.c[0]-(e.clientX-drag.x)*cam[2]/r.width;cam[1]=drag.c[1]-(e.clientY-drag.y)*cam[3]/r.height;apply();});
 ["pointerup","pointercancel","pointerleave"].forEach(n=>svg.addEventListener(n,()=>{drag=null;svg.classList.remove("dragging")}));
}
if(typeof render==="function")render();
})();