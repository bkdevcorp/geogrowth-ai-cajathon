/* GeoGrowth AI V3.2 | Cartografía OpenFreeMap + MapLibre. Coordenadas medias SBS por UBIGEO, no domicilios. */
(() => {
'use strict';
const isNational=d=>/^(todo el per[uú]|per[uú]|nacional)$/i.test(String(d||'').trim());
const valid=r=>r&&r.latitud_ref_sbs!=null&&r.longitud_ref_sbs!=null&&
  Number.isFinite(+r.latitud_ref_sbs)&&Number.isFinite(+r.longitud_ref_sbs)&&
  +r.latitud_ref_sbs>=-19&&+r.latitud_ref_sbs<=1&&+r.longitud_ref_sbs>=-82.5&&+r.longitud_ref_sbs<=-68;
const clean=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const oldScore=getScored;
getScored=function(){ if(isNational(state.dep))state.dep='Todo el Perú';return oldScore(); };
const oldMapSvg=mapSvg;
mapSvg=function(rows){
  if(isNational(state.dep)&&(!rows||!rows.some(valid)))rows=getScored().filter(valid);
  window.__geogrowthMapRecords=(rows||[]).filter(valid);
  const fallback=oldMapSvg(rows||[]);
  if(!window.__geogrowthMapRecords.length)return fallback;
  return fallback.replace(/<div id="leafletmap"[^>]*><\/div>$/,'')+
    '<div id="geogrowth-real-map" class="gg-real" aria-label="Mapa interactivo con calles y puntos SBS"></div>'+
    '<div id="gg-status" class="gg-status" role="status">Cargando cartografía…</div>';
};
const style=document.createElement('style');
style.textContent='.gg-real{position:absolute;inset:0;z-index:2;opacity:0;pointer-events:none;transition:opacity .2s}.gg-real.ready{opacity:1;pointer-events:auto}.gg-status{position:absolute;top:11px;left:11px;z-index:5;background:rgba(255,255,255,.94);border:1px solid #dce6ef;border-radius:9px;padding:8px 11px;max-width:300px;font:11px Inter,Arial,sans-serif;color:#45617c;pointer-events:none;box-shadow:0 3px 15px #10233a1a}.gg-status.ok{top:auto;bottom:10px}.gg-status.warn{background:#fff8e6;border-color:#ead3a7;color:#77521a}.maplibregl-popup-content{font-family:Inter,Arial,sans-serif;border-radius:10px;line-height:1.55}.maplibregl-popup-content button{background:#245ed9;color:white;border:0;border-radius:7px;padding:8px 10px;margin-top:8px;cursor:pointer;font-size:12px}.maplibregl-popup-content small{display:block;color:#6a7c90;font-size:11px}@media(max-width:600px){.gg-status{max-width:200px;font-size:10px}}';
document.head.appendChild(style);
const css=document.createElement('link');css.rel='stylesheet';css.href='https://cdn.jsdelivr.net/npm/maplibre-gl@6.19.0/dist/maplibre-gl.css';document.head.appendChild(css);
window.initLeaflet=function(){
  const el=document.getElementById('geogrowth-real-map');if(!el)return;
  const stat=document.getElementById('gg-status');
  const rows=window.__geogrowthMapRecords||[];
  function fallback(reason){
    if(activeMap){try{activeMap.remove()}catch(e){}activeMap=null}
    el.classList.remove('ready');
    const svg=el.parentElement?.querySelector('.svgmap');if(svg)svg.style.display='block';
    if(stat){stat.textContent=reason;stat.className='gg-status warn'}
  }
  if(!rows.length)return;
  if(!window.maplibregl||!maplibregl.Map){fallback('El mapa externo no está disponible; se muestra la vista local.');return}
  try{
    const map=new maplibregl.Map({container:el,style:'https://tiles.openfreemap.org/styles/liberty',
      center:[-75.1,-9.4],zoom:4.5,minZoom:3,maxZoom:17,dragRotate:false,pitchWithRotate:false});
    activeMap=map;map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
    const features=rows.map(r=>({type:'Feature',geometry:{type:'Point',coordinates:[+r.longitud_ref_sbs,+r.latitud_ref_sbs]},
      properties:{ubigeo:String(r.ubigeo),nombre:String(r.nombre_distrito||''),departamento:String(r.departamento||''),
        sbs:Number(r.sbs_puntos_2025||0),oficinas:Number(r.sbs_oficinas_2025||0)}}));
    const bounds=new maplibregl.LngLatBounds();features.forEach(f=>bounds.extend(f.geometry.coordinates));
    let loaded=false,errors=0;
    map.on('load',()=>{
      loaded=true;
      map.addSource('gg-territorios',{type:'geojson',data:{type:'FeatureCollection',features},cluster:true,clusterRadius:45,clusterMaxZoom:11});
      map.addLayer({id:'gg-clusters',type:'circle',source:'gg-territorios',filter:['has','point_count'],
        paint:{'circle-color':['step',['get','point_count'],'#2865c0',25,'#158d87',120,'#c9802f'],
          'circle-radius':['step',['get','point_count'],17,25,23,120,30],
          'circle-stroke-color':'#fff','circle-stroke-width':2,'circle-opacity':0.88}});
      map.addLayer({id:'gg-cluster-count',type:'symbol',source:'gg-territorios',filter:['has','point_count'],
        layout:{'text-field':['get','point_count_abbreviated'],'text-size':12},paint:{'text-color':'#fff'}});
      map.addLayer({id:'gg-points',type:'circle',source:'gg-territorios',filter:['!',['has','point_count']],
        paint:{'circle-color':'#245fda','circle-stroke-color':'#fff','circle-stroke-width':1.6,'circle-opacity':0.85,
          'circle-radius':['interpolate',['linear'],['sqrt',['max',1,['get','sbs']]],1,5,30,8,150,11]}});
      map.on('click','gg-clusters',e=>{
        const f=e.features?.[0];if(!f)return;
        map.getSource('gg-territorios').getClusterExpansionZoom(f.properties.cluster_id)
          .then(z=>map.easeTo({center:f.geometry.coordinates,zoom:z})).catch(()=>{});
      });
      map.on('click','gg-points',e=>{
        const f=e.features?.[0];if(!f)return;const p=f.properties;
        const popup='<strong>'+clean(p.nombre)+' · '+clean(p.ubigeo)+'</strong><small>'+clean(p.departamento)+
          ' · SBS 2025: '+Number(p.sbs).toLocaleString('es-PE')+' puntos de atención</small>'+
          '<small>Coordenada media de puntos SBS, no dirección empresarial.</small>'+
          '<button type="button" data-ubigeo="'+clean(p.ubigeo)+'">Abrir ficha territorial</button>';
        new maplibregl.Popup({offset:11}).setLngLat(f.geometry.coordinates).setHTML(popup).addTo(map);
      });
      ['gg-clusters','gg-points'].forEach(layer=>{
        map.on('mouseenter',layer,()=>map.getCanvas().style.cursor='pointer');
        map.on('mouseleave',layer,()=>map.getCanvas().style.cursor='');
      });
      if(isNational(state.dep)&&!state.query)map.fitBounds([[-82.3,-19.4],[-68.2,0.5]],{padding:30,maxZoom:5.8,duration:0});
      else if(features.length===1)map.jumpTo({center:features[0].geometry.coordinates,zoom:11});
      else map.fitBounds(bounds,{padding:40,maxZoom:11,duration:0});
      const svg=el.parentElement?.querySelector('.svgmap');if(svg)svg.style.display='none';
      el.classList.add('ready');
      if(stat){stat.textContent='Mapa real · '+features.length.toLocaleString('es-PE')+' distritos SBS · OpenFreeMap';stat.className='gg-status ok'}
      map.resize();
    });
    map.on('error',()=>{errors++;if(!loaded||errors>=5)fallback('Falló la cartografía externa. Disponible mapa local.');});
  }catch(e){fallback('No se pudo iniciar el mapa interactivo. Disponible mapa local.')}
};
try{render()}catch(e){console.warn('GeoGrowth cartographic fallback:',e)}
})();

/* GeoGrowth Google Maps runtime adapter v3.3
   La clave se ingresa en el navegador y NO se guarda en GitHub ni en el almacenamiento local.
   OpenFreeMap sigue siendo el mapa predeterminado para todos los visitantes. */
(()=>{
  "use strict";
  const previousInit=window.initLeaflet;
  if(typeof previousInit!=="function")return;
  let mode="openfree", runtimeKey="", loader=null, seq=0;
  const esc=(v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const css=document.createElement("style");
  css.textContent=".gg-switch{position:absolute;bottom:13px;right:12px;z-index:10;max-width:270px;background:rgba(255,255,255,.96);padding:10px;border:1px solid #dce4f0;border-radius:10px;box-shadow:0 5px 24px #1b304033;color:#24405a;font-size:11px}.gg-switch button{min-height:29px;padding:5px 8px;border-radius:7px;border:1px solid #c6d5e7;background:#fff;color:#244d9e;font-weight:700;cursor:pointer}.gg-switch .chosen{color:#fff;background:#2459c7;border-color:#2459c7}.gg-switch input{min-height:35px;padding:7px;width:100%;margin:7px 0;border:1px solid #cbd5e3;border-radius:6px}.gg-switch small{display:block;margin-top:7px;line-height:1.35;color:#51677d}.gg-switch-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}@media(max-width:600px){.gg-switch{right:6px;bottom:6px;max-width:220px}}";
  document.head.appendChild(css);
  function cleanup(){
    if(activeMap){try{activeMap.remove()}catch(e){} activeMap=null;}
  }
  function status(t,warning){
    const s=document.getElementById("geogrowth-map-state");
    if(s){s.textContent=t;s.className="geogrowth-map-state "+(warning?"warn":"ok");}
  }
  function controls(){
    const host=document.getElementById("geogrowth-real-map")?.parentElement;
    if(!host)return;
    host.querySelector(".gg-switch")?.remove();
    const box=document.createElement("div");box.className="gg-switch";
    box.innerHTML='<b>Mapa territorial</b><div class="gg-switch-row" style="margin-top:7px">'+
      '<button type="button" id="gg-ofm" class="'+(mode==="openfree"?"chosen":"")+'">OpenFreeMap</button>'+
      '<button type="button" id="gg-gm" class="'+(mode==="google"?"chosen":"")+'">Google Maps</button></div>'+
      (mode==="google"&&!runtimeKey?'<label style="display:block;margin-top:7px">Clave API restringida<input type="password" id="gg-key" autocomplete="off" spellcheck="false" placeholder="Clave de Maps JavaScript API"></label><button id="gg-use" type="button">Activar Google Maps</button><small>No se guarda ni se publica. Requiere Maps JavaScript API y facturación.</small>':
       mode==="google"?'<small>Google Maps · clave temporal en esta pestaña.</small>':'<small>Base cartográfica pública. Datos de distritos SBS 2025.</small>')+
      '<small id="gg-message" style="color:#a05d2b" role="status"></small>';
    host.appendChild(box);
    box.querySelector("#gg-ofm").onclick=()=>{mode="openfree";cleanup();window.initLeaflet()};
    box.querySelector("#gg-gm").onclick=()=>{
      if(mode==="google"&&runtimeKey)return;
      mode="google";cleanup();window.initLeaflet();
    };
    const activate=box.querySelector("#gg-use");
    if(activate)activate.onclick=()=>{
      const candidate=box.querySelector("#gg-key")?.value.trim()||"";
      if(!/^AIza[\w-]+$/.test(candidate)){box.querySelector("#gg-message").textContent="Introduce una clave API válida.";return;}
      if(loader&&candidate!==runtimeKey){box.querySelector("#gg-message").textContent="Para cambiar de clave recarga la página.";return;}
      runtimeKey=candidate;cleanup();window.initLeaflet();
    };
  }
  function loadGoogle(){
    if(window.google?.maps?.Map)return Promise.resolve();
    if(loader)return loader;
    loader=new Promise((resolve,reject)=>{
      const cb="__geogrowthGoogleReady";
      window[cb]=()=>{delete window[cb];resolve();};
      window.gm_authFailure=()=>reject(Error("Google rechazó la clave o el dominio."));
      const tag=document.createElement("script");
      tag.async=true;
      tag.src="https://maps.googleapis.com/maps/api/js?key="+encodeURIComponent(runtimeKey)+"&v=weekly&loading=async&language=es&region=PE&callback="+cb;
      tag.onerror=()=>reject(Error("No se pudo cargar Maps JavaScript API."));
      document.head.appendChild(tag);
    }).catch(e=>{loader=null;throw e;});
    return loader;
  }
  const valid=(r)=>r&&Number.isFinite(Number(r.latitud_ref_sbs))&&Number.isFinite(Number(r.longitud_ref_sbs))&&
    r.latitud_ref_sbs!==null&&r.longitud_ref_sbs!==null&&Number(r.latitud_ref_sbs)>-19&&Number(r.latitud_ref_sbs)<1&&Number(r.longitud_ref_sbs)>-82.5&&Number(r.longitud_ref_sbs)<-68;
  function gmInit(){
    const el=document.getElementById("geogrowth-real-map");
    if(!el)return;
    const mySeq=++seq;
    status("Cargando Google Maps…");
    loadGoogle().then(()=>{
      if(mySeq!==seq||mode!=="google"||document.getElementById("geogrowth-real-map")!==el)return;
      const rows=(window.__geogrowthVisibleCoordinates||[]).filter(valid);
      if(!rows.length)throw Error("Sin coordenadas SBS para este filtro.");
      const national=state.dep==="Todo el Perú";
      const map=new google.maps.Map(el,{center:{lat:-9.2,lng:-75.2},zoom:national?5:8,
        mapTypeControl:true,streetViewControl:false,fullscreenControl:true,gestureHandling:"cooperative",clickableIcons:false});
      const infowindow=new google.maps.InfoWindow();
      const bounds=new google.maps.LatLngBounds();
      const pins=[];
      let locs=[];
      if(national){
        const byDept=new Map();
        for(const r of rows){
          const d=r.departamento,w=Math.max(1,Math.sqrt(Number(r.sbs_puntos_2025)||0));
          if(!byDept.has(d))byDept.set(d,{name:d,lat:0,lng:0,w:0,num:0,points:0});
          const a=byDept.get(d);
          a.lat+=Number(r.latitud_ref_sbs)*w;a.lng+=Number(r.longitud_ref_sbs)*w;a.w+=w;a.num++;a.points+=Number(r.sbs_puntos_2025)||0;
        }
        locs=[...byDept.values()].map(a=>({position:{lat:a.lat/a.w,lng:a.lng/a.w},label:a.name,
          info:'<b>'+esc(a.name)+'</b><p>'+a.num+' distritos SBS · '+a.points.toLocaleString("es-PE")+' puntos reportados</p><button data-map-dep="'+esc(a.name)+'" type="button">Explorar departamento</button>'}));
      }else{
        locs=rows.map(r=>({position:{lat:Number(r.latitud_ref_sbs),lng:Number(r.longitud_ref_sbs)},
          label:(r.nombre_distrito||r.ubigeo),info:'<b>'+esc(r.nombre_distrito||r.ubigeo)+' · '+esc(r.ubigeo)+'</b><p>'+esc(r.departamento)+' · '+Number(r.sbs_puntos_2025||0).toLocaleString("es-PE")+' puntos SBS 2025</p><p>Posición media SBS, no dirección del negocio.</p><button data-ubigeo="'+esc(r.ubigeo)+'" type="button">Abrir ficha territorial</button>'}));
      }
      for(const r of locs){
        bounds.extend(r.position);
        const pin=new google.maps.Marker({map,position:r.position,title:r.label,
          icon:{path:google.maps.SymbolPath.CIRCLE,scale:national?11:5.5,fillColor:"#245fd3",fillOpacity:.85,strokeColor:"#fff",strokeWeight:2}});
        pins.push(pin);
        pin.addListener("click",()=>{infowindow.setContent('<div style="font:12px sans-serif">'+r.info+'</div>');infowindow.open({map,anchor:pin})});
      }
      if(locs.length>1)map.fitBounds(bounds,30);else map.setZoom(10);
      el.parentElement.querySelector(".svgmap")?.setAttribute("style","display:none");
      el.classList.add("ready");
      activeMap={remove:()=>{infowindow.close();for(const p of pins)p.setMap(null)}};
      status("Google Maps · "+pins.length+" "+(national?"departamentos":"distritos")+" representados");
      controls();
    }).catch(e=>{
      if(mode!=="google")return;
      mode="openfree";cleanup();previousInit();controls();
      status("Google Maps no disponible: "+e.message+" · se usa OpenFreeMap.",true);
    });
  }
  window.initLeaflet=function(){if(mode==="google"&&runtimeKey)gmInit();else previousInit();controls()};
  cleanup();
  window.initLeaflet();
})();
