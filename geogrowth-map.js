/* GeoGrowth AI V3.4 — mapa con carga acotada, OpenFreeMap + respaldo.
   SBS 2025: un marcador representa un UBIGEO mediante coordenada promedio;
   no representa dirección de empresa ni límite oficial. */
(()=>{
"use strict";
const N=d=>String(d||"").trim().toLocaleLowerCase("es").includes("todo el per");
const V=r=>r && r.latitud_ref_sbs!==null && r.longitud_ref_sbs!==null &&
 Number.isFinite(Number(r.latitud_ref_sbs)) && Number.isFinite(Number(r.longitud_ref_sbs)) &&
 Number(r.latitud_ref_sbs)>-19 && Number(r.latitud_ref_sbs)<1 &&
 Number(r.longitud_ref_sbs)>-82.5 && Number(r.longitud_ref_sbs)<-68;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const oldMap=mapSvg;
let generation=0;
mapSvg=function(rows){
 const all=Array.isArray(rows)?rows:[];
 const subset=all.filter(V);
 window.__ggMapPoints=subset;
 const base=oldMap(all);
 if(!subset.length)return base;
 const html=base.replace(/<div id="leafletmap"[^>]*><\/div>$/,'');
 return html+'<div id="geogrowth-real-map" aria-label="Mapa cartográfico" class="ggv4"></div>'+
 '<div id="ggv4status" class="ggv4status" role="status">Preparando cartografía…</div>';
};
const style=document.createElement("style");
style.textContent=".ggv4{position:absolute;inset:0;z-index:2;opacity:0;pointer-events:none;transition:opacity .25s;background:#f5f9fc}.ggv4.ok{opacity:1;pointer-events:auto}.ggv4status{position:absolute;left:12px;top:12px;z-index:6;background:#fff;border:1px solid #dbe5f0;border-radius:9px;color:#425a77;font:11px Inter,Arial,sans-serif;padding:8px 11px;box-shadow:0 4px 15px #0c294021;max-width:320px}.ggv4status.ok{top:auto;bottom:10px;left:10px}.ggv4status.warn{background:#fff9e9;color:#785b23;border-color:#eddeb3}.ggv4status a{color:#174fa6}.maplibregl-popup-content{font:12px Inter,Arial,sans-serif;line-height:1.6;border-radius:10px}.maplibregl-popup-content button{border:0;border-radius:7px;background:#265dd2;color:#fff;padding:8px 10px;margin-top:6px;cursor:pointer}";
document.head.appendChild(style);
const streetStyle={
 version:8,name:"World Street Map - respaldo",
 sources:{streets:{type:"raster",tiles:["https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"],tileSize:256,attribution:"Tiles © Esri and its data providers"}},
 layers:[{id:"streets",type:"raster",source:"streets"}]
};
window.initLeaflet=function(){
 const el=document.getElementById("geogrowth-real-map");
 if(!el)return;
 const status=document.getElementById("ggv4status");
 const points=(window.__ggMapPoints||[]).filter(V);
 if(!points.length)return;
 const seq=++generation;
 let index=0,done=false,errors=0,timer=null;
 const providers=[{name:"OpenFreeMap",style:"https://tiles.openfreemap.org/styles/liberty"},{name:"Respaldo cartográfico",style:streetStyle}];
 function statusText(message,cls){if(status){status.textContent=message;status.className="ggv4status "+(cls||"");}}
 function cancelTimer(){if(timer){clearTimeout(timer);timer=null;}}
 function destroy(){cancelTimer();if(activeMap){try{activeMap.remove()}catch(_e){}activeMap=null;}}
 function fail(message){if(seq!==generation)return;destroy();el.classList.remove("ok");el.style.display="none";el.style.pointerEvents="none";const fallback=el.parentElement?.querySelector(".svgmap");if(fallback)fallback.style.display="block";statusText(message+" Se muestra la vista territorial local.","warn");}
 const features=points.map(r=>({type:"Feature",geometry:{type:"Point",coordinates:[+r.longitud_ref_sbs,+r.latitud_ref_sbs]},properties:{
 ubigeo:String(r.ubigeo),distrito:String(r.nombre_distrito||"UBIGEO "+r.ubigeo),departamento:String(r.departamento||""),
 sbs:Number(r.sbs_puntos_2025||0),oficinas:Number(r.sbs_oficinas_2025||0)}}));
 function attempt(){
   if(seq!==generation)return;
   if(index>=providers.length){fail("Los proveedores de calles no respondieron.");return;}
   destroy(); done=false;errors=0;
   const p=providers[index];
   statusText("Conectando "+p.name+"…");
   try{
     const map=new maplibregl.Map({container:el,style:p.style,center:[-75.1,-9.5],
       zoom:N(state.dep)?4.3:8,minZoom:3,maxZoom:17,dragRotate:false,pitchWithRotate:false});
     activeMap=map;
     map.addControl(new maplibregl.NavigationControl({showCompass:false}),"top-right");
     const timeout=()=>{if(done||seq!==generation)return;index++;attempt();};
     timer=setTimeout(timeout,8500);
     map.on("error",e=>{
       if(seq!==generation||done)return;
       errors++;
       if(errors>=3){index++;attempt();}
     });
     map.on("load",()=>{
       if(seq!==generation||done)return;
       try {
         map.addSource("gg-observaciones",{type:"geojson",data:{type:"FeatureCollection",features},
           cluster:true,clusterRadius:44,clusterMaxZoom:11});
         map.addLayer({id:"gg-groups",type:"circle",source:"gg-observaciones",filter:["has","point_count"],
           paint:{"circle-color":"#156f86","circle-radius":["step",["get","point_count"],17,20,22,100,29],
                  "circle-opacity":.86,"circle-stroke-color":"#fff","circle-stroke-width":2}});
         map.addLayer({id:"gg-groupcount",type:"symbol",source:"gg-observaciones",
           filter:["has","point_count"],layout:{"text-field":["get","point_count_abbreviated"],"text-size":12},
           paint:{"text-color":"#fff"}});
         map.addLayer({id:"gg-single",type:"circle",source:"gg-observaciones",filter:["!",["has","point_count"]],
           paint:{"circle-color":["case",["==",["get","ubigeo"],state.selected],"#f59e0b","#2669d9"],
             "circle-radius":6,"circle-stroke-color":"#fff","circle-stroke-width":1.5,"circle-opacity":.88}});
         map.on("click","gg-groups",e=>{
           const f=e.features?.[0];if(!f)return;
           map.easeTo({center:f.geometry.coordinates,zoom:Math.min(map.getZoom()+2,12)});
         });
         map.on("click","gg-single",e=>{
           const f=e.features?.[0];if(!f)return;const x=f.properties;
           new maplibregl.Popup({offset:11}).setLngLat(f.geometry.coordinates).setHTML(
             "<b>"+esc(x.distrito)+" · "+esc(x.departamento)+"</b><br>UBIGEO: "+esc(x.ubigeo)+
             "<br>Puntos SBS 2025: "+Number(x.sbs).toLocaleString("es-PE")+
             "<br><small>Coordenada promedio SBS, no domicilio empresarial.</small>"+
             '<br><button type="button" data-ubigeo="'+esc(x.ubigeo)+'">Abrir ficha</button>'
           ).addTo(map);
         });
         for(const layer of ["gg-groups","gg-single"]){
           map.on("mouseenter",layer,()=>{map.getCanvas().style.cursor="pointer";});
           map.on("mouseleave",layer,()=>{map.getCanvas().style.cursor="";});
         }
         if(N(state.dep) && !state.query)map.fitBounds([[-82.5,-18.9],[-68.5,0.4]],{duration:0,padding:35,maxZoom:6});
         else if(features.length===1)map.jumpTo({center:features[0].geometry.coordinates,zoom:10});
         else{
           const b=new maplibregl.LngLatBounds();features.forEach(f=>b.extend(f.geometry.coordinates));
           map.fitBounds(b,{duration:0,padding:40,maxZoom:11});
         }
         done=true;cancelTimer();
         const fallback=el.parentElement?.querySelector(".svgmap");
         if(fallback)fallback.style.display="none";
         el.style.display="block";el.classList.add("ok");el.style.pointerEvents="auto";
         statusText(p.name+" · "+features.length.toLocaleString("es-PE")+" territorios SBS","ok");
         map.resize();
       }catch(e){index++;attempt();}
     });
   }catch(e){index++;attempt();}
 }
 if(typeof window.maplibregl!=="object"||typeof window.maplibregl.Map!=="function"){
   fail("La librería del mapa no cargó.");return;
 }
 attempt();
};
try{render();}catch(e){console.error("Error al iniciar cartografía:",e);}
})();