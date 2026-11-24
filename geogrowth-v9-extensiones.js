/* GeoGrowth V9: ampliación optativa, aislada de la lógica y cartografía originales.
   Solo se activa con ?modo=ampliado. No modifica geogrowth-map.js V5 ni geogrowth-operacion-v9.js. */
(function(){
  "use strict";
  const query=new URLSearchParams(window.location.search);
  if(query.get("modo")!=="ampliado")return;
  const STAGES=new Set(["work","score","opportunity","plan","execution"]);
  let role=query.get("perfil")==="admin"?"admin":"analista";
  let licenses=[],loading=true,error="",meta=null;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fmt=v=>v==null?"Sin dato":Number(v).toLocaleString("es-PE");
  const style=document.createElement("style");
  style.textContent=
    ".v9-role-switch{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:11px}.v9-role-switch button{border:1px solid #d3dfec;background:#fff;color:#25476d;border-radius:8px;padding:8px 11px;cursor:pointer;font-weight:700}.v9-role-switch button[aria-pressed=true]{background:#173c68;color:#fff;border-color:#173c68}.v9-sidecar{margin:12px 0 19px;border:1px solid #dce7f3;background:#fff;border-radius:15px;padding:17px}.v9-extended-title{display:flex;justify-content:space-between;flex-wrap:wrap;gap:7px;align-items:center;margin-bottom:12px}.v9-extended-title h3{font-size:15px;margin:0;color:#193d63}.v9-extra-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(285px,.92fr);gap:15px;align-items:stretch}.v9-extra-map{min-height:380px;min-width:0}.v9-extra-map .ggv5{min-height:370px}.v9-extra-map .ggv5-menu{max-height:170px}.v9-extra-panel{background:#f7faff;border:1px solid #e0eaf5;border-radius:12px;padding:13px;min-width:0;overflow:auto;max-height:450px}.v9-extra-panel h4{font-size:13px;color:#183b61;margin:0 0 7px}.v9-extra-panel p{font-size:11px;line-height:1.6;color:#526982;margin:5px 0 10px}.v9-extra-row{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #e0eaf1;padding:9px 0;font-size:11px;color:#4c6680}.v9-extra-row strong{color:#17395d;text-align:right}.v9-extra-license{border:1px solid #dce6ef;background:#fff;border-radius:10px;padding:11px;margin:9px 0}.v9-extra-license b{font-size:12px;color:#204165}.v9-extra-license small{display:block;font-size:10px;color:#667e95;margin:5px 0;overflow-wrap:anywhere}.v9-extra-license button,.v9-extra-links button{background:#fff;color:#245792;border:1px solid #cbdbe9;border-radius:8px;padding:8px 9px;cursor:pointer;font-size:11px;font-weight:700;margin-top:5px}.v9-extra-links{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.v9-extra-note{font-size:10px;color:#637b90;line-height:1.6;margin-top:8px}.v9-extra-label{font-size:10px;color:#446c8e;font-weight:800;letter-spacing:.06em;text-transform:uppercase}@media(max-width:1050px){.v9-extra-grid{grid-template-columns:1fr}.v9-extra-map{min-height:320px}.v9-extra-map .ggv5{min-height:310px}.v9-extra-panel{max-height:none}}";
  document.head.appendChild(style);

  function territory(){
    const chooser=document.getElementById("go-ubigeo");
    if(chooser && !chooser.value)return null;
    return DATA.find(r=>r.ubigeo===String(state.selected))||null;
  }
  function sourcePanel(r){
    const scoped=r?r.departamento:state.dep;
    const rows=[
      ["Área de trabajo",scoped||"Todo el Perú"],
      ["Distrito seleccionado",r?(r.nombre_distrito||r.ubigeo)+" · "+r.ubigeo:"Pendiente de seleccionar"],
      ["Empresas registradas, PRODUCE 2015",r?fmt(r.empresas_2015):"Elegir distrito"],
      ["Oficinas, SBS diciembre 2025",r?fmt(r.sbs_oficinas_2025):"Elegir distrito"],
      ["Licencias municipales",r?(r.licencias_municipales_ref==null?"Sin cobertura municipal":fmt(r.licencias_municipales_ref)):"Cobertura parcial"]
    ];
    return '<h4>Administrador · fuentes y decisiones</h4><p>Conservamos el cálculo IIT y los escenarios M0/M1/M2 originales de V9. Estos datos no equivalen a negocios captados.</p>'+
      rows.map(([a,b])=>'<div class="v9-extra-row"><span>'+esc(a)+'</span><strong>'+esc(b)+'</strong></div>').join("")+
      '<p class="v9-extra-note">IIT = 100 × [w × E + (1−w) × B], calculado dentro de cada departamento. E usa microempresas PRODUCE 2015 y B oficinas SBS 2025. Presupuestos y costos de campañas son supuestos.</p>'+
      '<div class="v9-extra-links"><button type="button" data-go-section="score">Explicación IIT</button><button type="button" data-go-section="plan">Comparar campañas</button><button type="button" data-go-section="execution">Ver resultados</button></div>';
  }
  function licensesPanel(r){
    if(loading)return '<h4>Analista · licencias municipales</h4><p>Cargando registros publicados para priorizar verificaciones.</p>';
    if(error)return '<h4>Analista · licencias municipales</h4><p>No fue posible cargar las licencias: '+esc(error)+'. El resto del dashboard sigue disponible.</p>';
    const dep=r?r.departamento:state.dep;
    const rows=licenses.filter(l=>
      r?String(l.ubigeo)===String(r.ubigeo):
      dep==="Todo el Perú" || !dep || l.departamento===dep
    ).slice(0,6);
    const title=r?(r.nombre_distrito||r.ubigeo):dep;
    const count=licenses.filter(l=>
      r?String(l.ubigeo)===String(r.ubigeo):
      dep==="Todo el Perú" || !dep || l.departamento===dep
    ).length;
    return '<h4>Analista · señales administrativas verificables</h4>'+
      '<p><b>'+esc(fmt(count))+'</b> registros en esta vista ('+esc(title)+'). Son <b>fechas de licencia</b>, no fechas de creación ni confirmación de operación del negocio.</p>'+
      (rows.length?rows.map(l=>
        '<div class="v9-extra-license"><b>'+esc(l.nombre||"Expediente municipal "+l.id)+'</b>'+
        '<small>'+esc(l.fecha||"Fecha sin dato")+' · '+esc(l.estado||"Estado sin dato")+' · '+esc(l.departamento||"")+' · '+esc(l.ubigeo||"")+'</small>'+
        (l.giro?'<small>Actividad publicada: '+esc(l.giro)+'</small>':"")+
        (l.direccion?'<small>Dirección comercial publicada: '+esc(l.direccion)+'</small>':"")+
        '<small>IPLV orientativo: '+esc(l.puntaje??"N/D")+'/100 · Fuente: '+esc(l.fuente||"Municipal")+'</small>'+
        '<button type="button" data-v9-district="'+esc(l.ubigeo)+'">Investigar territorio en V9</button></div>'
      ).join(""):'<p>Sin licencias individuales disponibles aquí. La cobertura municipal individual está limitada a Lima Cercado y Arequipa Cercado.</p>')+
      '<p class="v9-extra-note">IPLV: 50 % recencia del corte, 30 % completitud, 20 % identificación de giro. Es una heurística, no predicción comercial. Antes de contactar, verificar negocio, procedencia, finalidad y consentimiento cuando corresponda.</p>'+
      '<div class="v9-extra-links"><button type="button" data-go-section="opportunity">Opportunity Brief</button><button type="button" data-go-section="plan">Preparar campaña JSON</button></div>';
  }
  function roles(){
    const header=document.querySelector(".top .date")||document.querySelector(".top");
    if(!header)return;
    let el=document.getElementById("v9-role-switch");
    if(!el){el=document.createElement("div");el.id="v9-role-switch";el.className="v9-role-switch";header.parentNode.insertBefore(el,header);}
    el.innerHTML='<span class="v9-extra-label">Perfil demostrativo</span> '+
      '<button type="button" data-v9-role="analista" aria-pressed="'+(role==="analista")+'">Analista</button>'+
      '<button type="button" data-v9-role="admin" aria-pressed="'+(role==="admin")+'">Administrador</button>';
  }
  const originalRender=render;
  render=function(){
    // El perfil Analista tiene como espacio de trabajo únicamente las cinco etapas V9.
    // Administrador conserva todas las opciones del dashboard original.
    if(role==="analista" && !STAGES.has(state.view))state.view="work";
    originalRender();
    if(role==="analista"){
      document.querySelectorAll("#sidenav [data-view],#mobilemenu [data-view]").forEach(item=>{
        if(!STAGES.has(item.dataset.view))item.remove();
      });
    }
    roles();
    // Solo la etapa 01 muestra el mapa ampliado. El Explorador original mantiene el suyo.
    // Las etapas 02-05 no deben duplicar cartografía ni paneles de selección.
    if(state.view!=="work")return;
    const root=document.getElementById("content"),nav=root?.querySelector(".v9-stages");
    if(!nav)return;
    const chooser=document.getElementById("go-dep");
    if(chooser && !document.getElementById("go-ubigeo")?.value && chooser.value && state.dep!==chooser.value)state.dep=chooser.value;
    const r=territory();
    const region=state.dep||"Todo el Perú";
    const shell=document.createElement("section");
    shell.id="v9-safe-map";
    shell.className="v9-sidecar";
    shell.innerHTML=
      '<div class="v9-extended-title"><h3>Mapa territorial integrado · '+esc(region)+'</h3>'+
      '<span class="v9-extra-label">Cartografía V5 original · no representa domicilios comerciales</span></div>'+
      '<div class="v9-extra-grid"><div class="v9-extra-map">'+
        (typeof window.mapSvg==="function"?window.mapSvg():'<p>Mapa V5 no disponible. Continúa el análisis desde los controles existentes.</p>')+
      '</div><aside class="v9-extra-panel">'+(role==="admin"?sourcePanel(r):licensesPanel(r))+'</aside></div>'+
      '<p class="v9-extra-note">Los marcadores representan coordenadas medias de infraestructura SBS 2025. Para seleccionar un distrito, pulsa su marcador; las funciones de scoring, brief y campaña siguen utilizando el motor V9.</p>';
    nav.insertAdjacentElement("afterend",shell);
    if(typeof window.initLeaflet==="function" && typeof window.mapSvg==="function")window.initLeaflet();
  };
  function openDistrict(ubigeo){
    const r=DATA.find(x=>String(x.ubigeo)===String(ubigeo));
    if(!r)return;
    state.view="work";
    render();
    const dep=document.getElementById("go-dep");
    if(dep && dep.value!==r.departamento){
      dep.value=r.departamento;
      dep.dispatchEvent(new Event("change",{bubbles:true}));
    }
    const district=document.getElementById("go-ubigeo");
    if(district){
      district.value=r.ubigeo;
      district.dispatchEvent(new Event("change",{bubbles:true}));
    }
  }
  document.addEventListener("click",event=>{
    const roleButton=event.target.closest("[data-v9-role]");
    if(roleButton){event.preventDefault();event.stopPropagation();role=roleButton.dataset.v9Role;render();return;}
    const mapTarget=event.target.closest("#v9-safe-map [data-map-dep],#v9-safe-map [data-ubigeo]");
    if(mapTarget){
      event.preventDefault();event.stopPropagation();
      if(mapTarget.hasAttribute("data-ubigeo"))openDistrict(mapTarget.dataset.ubigeo);
      else{
        state.view="work";render();
        const dep=document.getElementById("go-dep");
        if(dep){
          dep.value=mapTarget.dataset.mapDep;
          dep.dispatchEvent(new Event("change",{bubbles:true}));
        }
      }
      return;
    }
    const licenseButton=event.target.closest("#v9-safe-map [data-v9-district]");
    if(licenseButton){event.preventDefault();event.stopPropagation();openDistrict(licenseButton.dataset.v9District);}
  },true);

  // Solo lectura. El Data Pack publicado es parcial; no se consultan servicios de captación reales.
  fetch("data/licencias_prospeccion.json",{cache:"no-cache"})
    .then(response=>{if(!response.ok)throw Error("HTTP "+response.status);return response.json();})
    .then(data=>{
      if(!Array.isArray(data?.registros))throw Error("formato de licencias inválido");
      licenses=data.registros.slice().sort((a,b)=>String(b.fecha||"").localeCompare(String(a.fecha||"")));
      meta=data.metadata||null;
      loading=false;
      if(STAGES.has(state.view))render();
    })
    .catch(err=>{error=String(err.message||err);loading=false;if(STAGES.has(state.view))render();});
  // El analista abre un distrito con registros municipales verificables; la V9 normal no cambia.
  if(role==="analista" && !query.has("departamento"))openDistrict("040101");
  else render();
})();
