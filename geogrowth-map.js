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