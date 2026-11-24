(function embeddedBridge(){
  "use strict";
  const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fmt=x=>Number(x||0).toLocaleString("es-PE");
  function panel(app,role){
    const deps=["Todo el Perú",...[...new Set(app.territories.map(r=>r.departamento))].sort((a,b)=>a.localeCompare(b,"es"))];
    const dept=app.mapDep||(role==="admin"?"Todo el Perú":"Arequipa");
    const rows=dept==="Todo el Perú"?app.territories:app.territories.filter(r=>r.departamento===dept);
    const current=app.mapUbigeo?app.territories.find(r=>r.ubigeo===app.mapUbigeo):null;
    const licenses=app.licencias.filter(l=>(dept==="Todo el Perú"||l.departamento===dept)&&(!app.mapUbigeo||l.ubigeo===app.mapUbigeo)).length;
    const facts=current?
      `<div class="stat-line"><span>Distrito / UBIGEO</span><b>${esc(current.nombre_distrito||current.ubigeo)} · ${esc(current.ubigeo)}</b></div>
       <div class="stat-line"><span>Microempresas · PRODUCE 2015</span><b>${current.micro_2015==null?"N/D":fmt(current.micro_2015)}</b></div>
       <div class="stat-line"><span>Puntos SBS 2025</span><b>${current.sbs_puntos_2025==null?"N/D":fmt(current.sbs_puntos_2025)}</b></div>`:
      `<div class="stat-line"><span>Territorios en esta vista</span><b>${fmt(rows.length)}</b></div>
       <div class="stat-line"><span>Con coordenadas SBS</span><b>${fmt(rows.filter(r=>r.latitud_ref_sbs!=null&&r.longitud_ref_sbs!=null).length)}</b></div>`;
    const action=current&&(role==="admin"?
      `<button class="btn primary" data-nav="modelo">Explicar IIT del distrito</button>`:
      `<button class="btn primary" data-map-follow="1">Ver licencias del distrito</button>`)||"";
    return `<section class="card gg-map-card">
      <div class="card-header"><div><h2>Mapa territorial integrado al análisis</h2>
      <p>Vista geográfica y decisiones en un mismo lugar. Límites reales; las coordenadas SBS no son domicilios de negocios.</p>
      </div><span class="badge">Cartografía V5</span></div>
      <div class="ggmap-grid">
        <div id="gg-embedded-map" class="gg-embedded-map" aria-label="Mapa de departamentos y marcadores SBS"><div class="gg-map-placeholder">Preparando mapa real del Perú…</div></div>
        <aside class="ggmap-side">
          <div class="field"><label for="ggMapDepartment">Departamento mostrado</label>
          <select id="ggMapDepartment">${deps.map(d=>`<option value="${esc(d)}" ${d===dept?"selected":""}>${esc(d)}</option>`).join("")}</select></div>
          <p class="ggmap-help">Selecciona un departamento o un marcador distrital. Puedes acercar, alejar y arrastrar el mapa.</p>
          ${facts}
          <div class="stat-line"><span>Licencias individuales disponibles</span><b>${fmt(licenses)}</b></div>
          <p class="ggmap-help">${role==="analista"?"Las licencias con información individual cubren Lima Cercado y Arequipa Cercado; para el resto sigue disponible el análisis territorial.":"Al seleccionar un distrito podrás revisar su IIT. La cobertura municipal por registro es parcial."}</p>
          <div class="actions-row">
            <button type="button" class="btn small" data-map-national="1">Todo el Perú</button>
            ${app.mapUbigeo?'<button type="button" class="btn small" data-map-clear="1">Quitar filtro distrital</button>':""}
            ${action}
          </div>
        </aside>
      </div>
    </section>`;
  }
  function mount(app){
    const el=document.getElementById("gg-embedded-map");
    if(el&&window.GeoGrowthEmbeddedMap)window.GeoGrowthEmbeddedMap.mount({
      element:el,data:app.territories,department:app.mapDep,selectedUbigeo:app.mapUbigeo
    });
  }
  function chooseDep(app,role,render,dept){
    if(dept!=="Todo el Perú"&&!app.territories.some(x=>x.departamento===dept))return;
    app.mapDep=dept;app.mapUbigeo=null;app.licenseUbigeo=null;app.page=0;
    if(role==="analista")app.dept=dept;
    else if(dept!=="Todo el Perú"){app.dept=dept;app.modelUbigeo=null;}
    render();
  }
  function chooseDistrict(app,role,render,ubigeo){
    const r=app.territories.find(x=>x.ubigeo===String(ubigeo));if(!r)return;
    app.mapDep=r.departamento;app.dept=r.departamento;app.mapUbigeo=r.ubigeo;app.modelUbigeo=r.ubigeo;
    app.licenseUbigeo=role==="analista"?r.ubigeo:null;app.page=0;render();
  }
  function click(event,app,role,render){
    const d=event.target.closest("[data-gg-map-dep]");
    if(d){chooseDep(app,role,render,d.dataset.ggMapDep);return true;}
    const u=event.target.closest("[data-gg-map-pick]");
    if(u){chooseDistrict(app,role,render,u.dataset.ggMapPick);return true;}
    if(event.target.closest("[data-map-national]")){chooseDep(app,role,render,"Todo el Perú");return true;}
    if(event.target.closest("[data-map-clear]")){app.mapUbigeo=null;app.licenseUbigeo=null;render();return true;}
    if(event.target.closest("[data-map-follow]")){document.getElementById("leadDept")?.scrollIntoView({behavior:"smooth",block:"center"});return true;}
    return false;
  }
  window.GeoGrowthMapView={panel,mount,chooseDep,chooseDistrict,click};
})();