/* GeoGrowth AI V7: recorrido REAL usando las fuentes ya integradas. No modifica mapa. */
(function(){
  "use strict";
  const Q={step:0};
  const x=v=>safe(String(v??""));
  const n=v=>v==null?"N/D":fmt(v);
  const row=()=>DATA.find(r=>r.ubigeo===state.selected)||DATA.find(r=>r.ubigeo==="130101")||DATA[0];
  const stat=(value,label)=>'<div class="stat"><b>'+n(value)+'</b><small>'+x(label)+'</small></div>';
  const note=txt=>'<div class="warning">'+txt+'</div>';
  const info=r=>'<p class="note"><b>Evidencias:</b> '+x(r.evidencia||"No disponible")+'</p>';
  const score=r=>getScored().find(a=>a.ubigeo===r.ubigeo);
  const card=(t,content)=>'<div class="card" style="margin-top:14px"><h3>'+t+'</h3><div style="margin-top:13px">'+content+'</div></div>';
  const factGrid=r=>'<div class="stats-grid">'+
    stat(r.empresas_2015,"Empresas registradas · PRODUCE 2015")+
    stat(r.micro_2015,"Microempresas · PRODUCE 2015")+
    stat(r.sbs_puntos_2025,"Puntos financieros · SBS diciembre 2025")+
    stat(r.sbs_oficinas_2025,"Oficinas · SBS 2025")+
    stat(r.sbs_atm_2025,"Cajeros ATM · SBS 2025")+
    stat(r.sbs_pos_2025,"Terminales POS · SBS 2025")+'</div>';
  const license=r=>r.licencias_municipales_ref==null?
    '<p class="note">No tenemos licencias municipales para este UBIGEO. Esto no demuestra ausencia de negocios.</p>':
    '<div class="callout"><b>Licencias municipales:</b> '+n(r.licencias_municipales_ref)+' registros/expedientes de '+x(r.fuente_licencias)+' ('+x(r.anio_licencias)+'). El recuento no representa necesariamente establecimientos únicos y activos.</div>';
  function choose(id){
    const r=DATA.find(a=>a.ubigeo===id);
    if(!r)return;
    state.selected=r.ubigeo;state.dep=r.departamento;state.query="";state.plan=[];Q.step=0;state.view="story";render();
  }
  function controls(r){
    const deps=[...new Set(DATA.map(a=>a.departamento))].sort((a,b)=>a.localeCompare(b,"es"));
    const places=DATA.filter(a=>a.departamento===r.departamento).sort((a,b)=>(a.nombre_distrito||a.ubigeo).localeCompare(b.nombre_distrito||b.ubigeo,"es"));
    return '<div class="card"><div class="controls"><div class="field"><label>Departamento</label><select id="real-dep">'+deps.map(d=>'<option value="'+x(d)+'" '+(d===r.departamento?'selected':'')+'>'+x(d)+'</option>').join('')+'</select></div>'+
      '<div class="field"><label>Distrito / UBIGEO — información real</label><select id="real-ubigeo">'+places.map(a=>'<option value="'+x(a.ubigeo)+'" '+(a.ubigeo===r.ubigeo?'selected':'')+'>'+x(a.nombre_distrito||'Distrito sin nombre')+' · '+x(a.ubigeo)+'</option>').join('')+'</select></div></div></div>';
  }
  function renderStep(r){
    const s=score(r);
    const h='<p class="note"><b>'+x(r.nombre_distrito||r.ubigeo)+' · '+x(r.departamento)+'</b> — UBIGEO '+x(r.ubigeo)+'</p>';
    if(Q.step===0)return card('1. Datos reales del distrito',h+'<p class="note">PRODUCE 2015 y SBS diciembre de 2025. No representan una serie temporal.</p>'+factGrid(r)+license(r)+info(r)+note("Los datos empresariales de 2015 son históricos. El número de puntos SBS de 2025 no demuestra inclusión financiera ni demanda de crédito."));
    if(Q.step===1)return card('2. Investigación de señales observadas',h+
      '<div class="twoequal"><div class="item"><strong>Actividad económica registrada</strong><p>'+n(r.micro_2015)+' microempresas y '+n(r.pequena_2015)+' pequeñas empresas registradas en 2015. Actividad actual pendiente de validar.</p></div>'+
      '<div class="item"><strong>Infraestructura financiera reportada</strong><p>'+n(r.sbs_oficinas_2025)+' oficinas, '+n(r.sbs_atm_2025)+' cajeros y '+n(r.sbs_pos_2025)+' POS en 2025. No deben considerarse equivalentes.</p></div></div>'+
      (s?'<div class="callout">Índice exploratorio del distrito: <b>'+s.score.toFixed(1)+'/100</b>. Calculado mediante normalización dentro del departamento, con '+state.w+'% para microempresas históricas y '+(100-state.w)+'% para menor presencia relativa de oficinas. No predice conversiones.</div>':
        note("El índice no puede calcularse con la información disponible. Se necesita completar el cruce de fuentes."))+license(r)+info(r));
    if(Q.step===2)return card('3. Opportunity Brief con datos observados',h+
      '<div class="item"><strong>HECHOS</strong><p>PRODUCE registró '+n(r.empresas_2015)+' empresas en 2015. SBS reportó '+n(r.sbs_puntos_2025)+' puntos de atención y '+n(r.sbs_oficinas_2025)+' oficinas en 2025.</p></div>'+
      '<div class="item"><strong>HIPÓTESIS — no confirmada</strong><p>Investigar si existen negocios operativos con necesidades de capital de trabajo o inversión. No conocemos clientes, su capacidad de pago ni requisitos individuales.</p></div>'+
      '<div class="item"><strong>ACCIONES PROPUESTAS</strong><p>Verificar establecimientos actuales, entrevistar voluntariamente, contrastar necesidades con el catálogo crediticio vigente de Caja Trujillo y registrar resultados.</p></div>'+license(r)+info(r)+
      '<div class="sheet-actions"><button type="button" class="btn" id="exportBrief">Descargar ficha con evidencias</button><button type="button" class="btn outline" data-view="brief">Ver análisis del distrito</button></div>');
    if(Q.step===3){
      const candidates=benchmark();
      const selected=state.plan.map(id=>getScored().find(a=>a.ubigeo===id)).filter(Boolean);
      return card('4. Plan comercial territorial con datos reales',h+
        '<p class="note">M0 prioriza el volumen histórico, M1 pondera indicadores y M2 optimiza una selección bajo un presupuesto supuesto.</p>'+
        '<div class="stats-grid">'+stat(candidates.m0.length,"Territorios M0")+
          stat(candidates.m1.length,"Territorios M1")+stat(candidates.m2.length,"Territorios M2")+
          stat(selected.length,"Distritos en la campaña actual")+'</div>'+
        (s?'<div class="callout">Distrito analizado: '+s.score.toFixed(1)+'/100. Costos simulados: S/ '+n(s.cost)+'. No representan rentabilidad, captación ni clientes reales.</div>':note('Sin puntaje comparable, se requiere investigación adicional.'))+
        '<div class="sheet-actions"><button type="button" class="btn" data-real-add>Agregar este distrito</button>'+
          '<button type="button" class="btn outline" id="exportPlan">Exportar campaña JSON</button>'+
          '<button type="button" class="btn outline" data-view="rank">Abrir benchmark completo</button></div>');
    }
    const actual=state.feedback.filter(a=>a.tipo_dato!=="SINTETICO"&&!/simulaci[oó]n|ficticio/i.test(a.observaciones||""));
    return card('5. Ejecución y verificación en campo',h+
      '<p class="note">Los datos oficiales no incluyen prospectos actuales ni conversiones. Este paso explica cómo verificar las oportunidades reales mediante visitas o entrevistas.</p>'+
      '<div class="stats-grid">'+stat(actual.length,"Observaciones importadas sin etiqueta de simulación; requieren verificación")+
        stat(state.feedback.length-actual.length,"Registros de simulación")+
        stat(null,"Clientes captados realmente: dato no disponible")+'</div>'+
      '<div class="item"><strong>Por validar</strong><p>Establecimiento activo, sector económico, interés, necesidad declarada, consentimiento para seguimiento y requisitos del producto. Nunca inferir aprobación crediticia desde datos territoriales.</p></div>'+
      '<div class="sheet-actions"><a href="GeoGrowth_AI_Campo_V3.html" class="btn" target="_blank" rel="noopener" style="text-decoration:none">Abrir app de campo</a>'+
      '<button type="button" class="btn outline" data-view="campaign">Importar resultados</button></div>');
  }
  function output(){
    const r=row();
    return pagehead("Demostración con tus datos reales","Cruce verificable por UBIGEO · PRODUCE 2015, SBS 2025 y licencias municipales cuando existen")+
      '<div class="banner"><div><h2>De la información pública a una oportunidad de prospección</h2><p>Selecciona cualquier distrito del Perú. Las cifras provienen del Data Pack que procesamos; la oportunidad y la campaña son hipótesis de trabajo, no conversiones observadas.</p></div><span class="tag">Datos reales · COM-01</span></div>'+
      controls(r)+
      '<div class="controls" style="margin:17px 0">'+["Datos","Señales","Oportunidad","Campaña","Validación"].map((t,i)=>
         '<button type="button" class="btn '+(i===Q.step?'':'outline')+'" data-real-step="'+i+'">'+(i+1)+'. '+t+'</button>').join('')+'</div>'+
      renderStep(r)+
      '<div class="sheet-actions" style="margin-top:15px">'+(Q.step>0?'<button class="btn outline" data-real-back>Anterior</button>':'')+
      (Q.step<4?'<button class="btn" data-real-next>Continuar con este distrito</button>':'<button class="btn" data-real-reset>Reiniciar</button>')+
      '<button class="btn outline" data-real-example="150101">Ejemplo Lima Cercado</button>'+
      '<button class="btn outline" data-real-example="040101">Ejemplo Arequipa</button></div>';
  }
  const oldRender=render;
  render=function(){
    if(state.view==="story"){
      if(activeMap){try{activeMap.remove()}catch(e){} activeMap=null;}
      renderNav();$("content").innerHTML=output();
    } else oldRender();
  };
  const oldHome=renderHome;
  renderHome=function(){
    return '<div class="card" style="margin-bottom:15px"><h3>Demo con las fuentes oficiales que proporcionaste</h3>'+
      '<p class="note">Analiza distritos reales, evidencia y campañas sin depender de ejemplos empresariales ficticios.</p>'+
      '<button type="button" class="btn" data-view="story">Explorar un caso con datos reales</button></div>'+oldHome();
  };
  const nav=NAV.find(a=>a[0]==="story"); if(nav)nav[1]="Demo con datos reales";
  document.addEventListener("change",e=>{
    if(e.target.id==="real-dep"){
      const dep=e.target.value;const r=DATA.find(a=>a.departamento===dep&&a.ambas_fuentes)||DATA.find(a=>a.departamento===dep);
      if(r)choose(r.ubigeo);
    }
    if(e.target.id==="real-ubigeo")choose(e.target.value);
  });
  document.addEventListener("click",e=>{
    const a=e.target.closest("[data-real-step],[data-real-next],[data-real-back],[data-real-reset],[data-real-example],[data-real-add]");
    if(!a)return;
    if(a.dataset.realExample){choose(a.dataset.realExample);return;}
    if(a.hasAttribute("data-real-step"))Q.step=Number(a.dataset.realStep);
    if(a.hasAttribute("data-real-next"))Q.step=Math.min(4,Q.step+1);
    if(a.hasAttribute("data-real-back"))Q.step=Math.max(0,Q.step-1);
    if(a.hasAttribute("data-real-reset"))Q.step=0;
    if(a.hasAttribute("data-real-add")){
      const r=row();
      if(!score(r))toast("Faltan fuentes para priorizar este distrito");
      else if(!state.plan.includes(r.ubigeo))state.plan.push(r.ubigeo);
      toast("Campaña actualizada con el distrito seleccionado");
    }
    if(state.view==="story")render();
  });
  const url=new URLSearchParams(location.search);
  if(url.get("real")==="1")choose(url.get("ubigeo")||"150101");
  else if(state.view==="story")render();
})();