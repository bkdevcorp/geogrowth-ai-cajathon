#!/usr/bin/env python3
"""Browser-level regression: approved V9 plus optional integrated admin/analyst extension.
Requires a locally installed Chromium/Chrome (GitHub Actions ubuntu-latest).
Uses Python stdlib; does not touch the original code/data.
"""
from __future__ import annotations
import functools
import http.server
import pathlib
import shutil
import subprocess
import threading

ROOT=pathlib.Path(__file__).resolve().parents[1]
CHROME=next((shutil.which(exe) for exe in ("google-chrome","google-chrome-stable","chromium","chromium-browser") if shutil.which(exe)),None)
if not CHROME:
    raise SystemExit("FALLO: Chrome/Chromium no disponible para validación visual")

DRIVER="""<!doctype html><html lang="es"><meta charset="utf-8"><title>Prueba V9</title>
<iframe id="app" src="GeoGrowth_AI_Dashboard_V3.html?modo=ampliado&amp;perfil=analista" style="width:1200px;height:850px"></iframe>
<pre id="result">RUNNING</pre>
<script>
const status=document.getElementById('result');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const check=(v,msg)=>{if(!v)throw Error(msg)};
async function until(fn,msg){
 for(let i=0;i<100;i++){if(fn())return;await delay(65)}
 throw Error("Tiempo agotado: "+msg);
}
async function test(){
 const frame=document.getElementById('app'),doc=frame.contentDocument;
 await until(()=>doc?.querySelector('#gg-google-map-canvas')&&doc.querySelector('#gg-official-evidence')?.textContent.includes('824 trámites'),'Google Maps y evidencia municipal');
 check(doc.querySelectorAll('.v9-stages button').length===5,'flujo V9 alterado');
 check(!doc.querySelector('#v9-safe-map #ggv5'),'No debe existir mapa V5 en el buscador');
 doc.querySelector('[data-gm-config]').click();
 check(doc.querySelector('#gg-config-dialog[open] #gg-config-key'),'Configuración API ausente');
 doc.querySelector('[data-gm-close]').click();
 const stages=['work','score','opportunity','plan','execution'];
 const nav=(id)=>[...doc.querySelectorAll(id+' [data-view]')].map(el=>el.dataset.view);
 const same=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
 check(same(nav('#sidenav'),stages),'Analista: sidebar debe contener solo cinco etapas');
 check(same(nav('#mobilemenu'),stages),'Analista: menú móvil debe contener solo cinco etapas');
 doc.querySelector('[data-v9-role="admin"]').click();
 check(doc.querySelector('[data-v9-role="admin"][aria-pressed="true"]'),'vista Admin ausente');
 for(const id of ['home','explore','sources','readiness']){
   check(nav('#sidenav').includes(id),'Administrador debe conservar '+id);
   check(nav('#mobilemenu').includes(id),'Administrador móvil debe conservar '+id);
 }
 doc.querySelector('[data-v9-role="analista"]').click();
 check(same(nav('#sidenav'),stages),'Al regresar a Analista deben ocultarse las otras vistas');
 check(same(nav('#mobilemenu'),stages),'Al regresar a Analista móvil deben ocultarse las otras vistas');
 const district=doc.querySelector('#go-ubigeo');district.value='040101';district.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));
 await until(()=>doc.querySelector('#go-ubigeo')?.value==='040101','distrito seleccionado');
 doc.querySelector('[data-go-section="score"]').click();
 await until(()=>doc.querySelector('.v9-formula'),'fórmula IIT');
 check(same(nav('#sidenav'),stages),'Analista debe conservar su menú de cinco etapas en Scoring');
 check(!doc.querySelector('#v9-safe-map'),'El mapa no debe aparecer en Scoring IIT');
 // Ajustar ponderación IIT debe modificar también la recomendación y exportación del brief.
 const weight=doc.querySelector('#go-score-weight');
 check(weight,'Control de peso E ausente');
 weight.value='70';
 weight.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));
 doc.querySelector('[data-go-section="opportunity"]').click();
 await until(()=>doc.querySelector('#gg-opportunity-brief'),'Opportunity Brief territorial');
 check(doc.querySelector('#gg-opportunity-brief')?.textContent.includes('Peso E: 70%'),'Brief no refleja IIT seleccionado');
 check(doc.querySelector('#gg-opportunity-brief .gg-brief-callout')?.textContent.length>50,'No hay recomendación ejecutiva');
 check(doc.querySelectorAll('#gg-opportunity-brief .gg-brief-section').length===6,'El brief debe presentar seis apartados decisionales, no el bloque genérico');
 check(doc.querySelector('#gg-opportunity-brief').textContent.includes('422 expedientes'),'Falta señal municipal real de comercio para Arequipa');
 check(doc.querySelector('#gg-opportunity-brief').textContent.includes('MPA 2026'),'Falta fuente independiente MPA 2026');
 check(doc.querySelector('#gg-opportunity-brief').textContent.includes('824 registros'),'Faltan 824 trámites de MPA 2026');
 check(doc.querySelector('#gg-opportunity-brief').textContent.includes('Julio: 0'),'El título julio no debe inventar emisiones');
 check(doc.querySelector('#gg-opportunity-brief').textContent.includes('197 expedientes'),'Falta señal real de gastronomía');
 check(doc.querySelector('#gg-opportunity-brief').textContent.includes('Preguntas que debe resolver el asesor'),'Falta guía operativa');
 check(doc.querySelector('#gg-opportunity-brief').textContent.includes('Alternativas del departamento'),'Falta comparación territorial');
 let exported=null;
 frame.contentWindow.download=(filename,data)=>{exported={filename,data}};
 doc.querySelector('[data-gg-export-brief]').click();
 check(exported?.data?.formato==='GeoGrowthTerritoryOpportunityBriefV2','No exporta brief estructurado');
 check(exported.data.iit.peso_empresas_pct===70,'Exportación no refleja peso IIT');
 check(exported.data.territorio.ubigeo==='040101','Exportación no refleja distrito seleccionado');
 check(exported.data.investigacion.sectores.some(x=>x.sector==='Comercio'&&x.registros===422),'El JSON pierde evidencia municipal');
 check(exported.data.investigacion.licencias_arequipa_2026?.registros===824,'El JSON pierde trámites MPA 2026');
 check(exported.data.investigacion.licencias_arequipa_2026?.emitidos_julio_2026===0,'El JSON inventa julio');
 check(exported.data.evidencia.ids.includes('LIC-MPA-2026-ENE-JUN:040101'),'El JSON no tiene trazabilidad de MPA 2026');
 check(exported.data.agentes_demo?.especialista?.length===4,'JSON no contiene los cuatro agentes simulados');
 check(doc.querySelectorAll('#gg-agent-simulation .gg-team-card').length===4,'No aparecen los especialistas de la demo');
 check(doc.querySelector('#gg-agent-simulation').textContent.includes('DEMO · sin LLM conectado'),'Falta el estado de simulación');
 // Verificar navegación real a los otros casos sin sustituir V9 ni inventar licencias.
 for(const [ubigeo,departamento,sourceState] of [
   ['130101','La Libertad','sin_cobertura'],
   ['150101','Lima','expedientes_sin_identificacion'],
   ['060101','Cajamarca','sin_cobertura'],
   ['080901','Cusco','agregada_2026q2'],
   ['040101','Arequipa','individualizada']
 ]){
   const btn=doc.querySelector('#gg-agent-simulation [data-gg-case="'+ubigeo+'"]');
   check(btn,'Falta acceso de demostración '+ubigeo);
   btn.click();
   await until(()=>doc.querySelector('#gg-agent-simulation [data-gg-case="'+ubigeo+'"][data-gg-case-active="true"]'), 'Cambiar a '+ubigeo);
   check(doc.querySelector('#gg-opportunity-brief').textContent.includes(departamento),'El territorio no cambió '+ubigeo);
   doc.querySelector('[data-gg-export-brief]').click();
   check(exported?.data?.territorio?.ubigeo===ubigeo,'La exportación del brief no coincide con '+ubigeo);
   check(exported.data.agentes_demo?.fuentes?.licencias===sourceState,'Atribución incorrecta de licencias '+ubigeo);
   check(exported.data.agentes_demo?.especialista?.length===4,'No hay análisis de agentes para '+ubigeo);
   if(ubigeo==='080901'){
     const extra=exported.data.investigacion?.licencias_adicionales;
     check(extra?.emitidas_q2_2026===56,'Santa Ana: faltan 56 licencias de abril a junio 2026');
     check(extra?.fuera_de_periodo===1,'Santa Ana: no se separó el registro 2024');
     check(extra?.por_codigo_giro?.['5610']===12,'Santa Ana: agrupación GIRO 5610 incorrecta');
     check(extra?.ubigeo_csv==='070901'&&extra?.ubigeo_inei==='080901','Homologación RENIEC→INEI incorrecta');
     check(doc.querySelector('#gg-opportunity-brief').textContent.includes('licencias emitidas'),'Brief sin evidencia reciente 2026');
     check(!Object.keys(extra).some(k=>/ruc|nombre_comercial|razon_social/i.test(k)),'No exponer RUC ni nombres');
   }
 }
 check(doc.querySelector('#gg-agent-simulation [data-gg-case="040101"][data-gg-case-active="true"]'),'No regresó a Arequipa');
 check(!doc.querySelector('#v9-safe-map'),'El mapa no debe aparecer en Opportunity Brief');
 doc.querySelector('[data-go-section="plan"]').click();
 await until(()=>doc.querySelector('#gg-campaign-guide [data-go-model="M0"]')&&doc.querySelector('#gg-campaign-guide [data-go-model="M1"]')&&doc.querySelector('#gg-campaign-guide [data-go-model="M2"]'),'benchmark M0/M1/M2');
 check(doc.querySelector('#gg-campaign-guide').textContent.includes('Cada distrito es una decisión binaria'),'No se explica la optimización 0/1');
 check(doc.querySelector('#gg-campaign-guide').textContent.includes('Para esta simulación el costo'),'No se declaran los costos simulados');
 check(doc.querySelector('#gg-campaign-agent'),'Falta coordinación comercial de los agentes en campaña');
 check(doc.querySelector('#gg-campaign-agent').textContent.includes('Arequipa'),'Campaña sin contexto territorial');
 check(!doc.querySelector('#v9-safe-map'),'El mapa no debe aparecer en Campañas');
 doc.querySelector('[data-go-model="M2"]').click();
 await until(()=>doc.querySelector('#gg-campaign-guide [data-go-campaign-export]'),'JSON de campaña');
 check(doc.querySelector('#gg-campaign-guide .gc-current').textContent.includes('Método M2'),'El método seleccionado no se refleja en la campaña');
 check(doc.querySelector('#gg-campaign-guide .gc-current table tbody tr'),'La propuesta M2 no muestra los distritos elegidos');
 doc.querySelector('[data-go-section="execution"]').click();
 await until(()=>doc.querySelector('#go-import-results'),'importar resultados JSON');
 check(!doc.querySelector('#v9-safe-map'),'El mapa no debe aparecer en Ejecución y resultados');
 doc.querySelector('[data-go-section="work"]').click();
 await until(()=>doc.querySelector('#gg-google-map-canvas'),'restauración de mapa en Seleccionar territorio');
 // V3 CajaRadar: filtros reales sobre Data Pack y provincias INEI, sin romper la V9.
 await until(()=>doc.querySelector('#gg-filter-province option[value="0402"]'),'carga de 196 provincias');
 check(doc.querySelector('#gg-filter-type option[value="nuevos"]'),'Falta tipo nuevos negocios');
 check(doc.querySelector('#gg-filter-type option[value="estacionales"]'),'Falta estacionalidad sin datos');
 check(doc.querySelector('#gg-official-evidence'),'Falta evidencia territorial');
 const dep=doc.querySelector('#go-dep');
 dep.value='Piura';
 dep.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));
 await until(()=>doc.querySelector('#gg-filter-province option[value="2005"]'),'provincia Paita');
 let province=doc.querySelector('#gg-filter-province');
 province.value='2005';
 province.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));
 await until(()=>doc.querySelector('#go-ubigeo')?.value==='200501','selección de distrito Paita');
 let type=doc.querySelector('#gg-filter-type');
 type.value='nuevos';
 type.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));
 await until(()=>doc.querySelector('#gg-official-evidence')?.textContent.includes('Sin evidencia oficial específica'),'Paita sin datos integrados');
 check(!doc.querySelector('#v9-safe-map #ggv5'),'No debe haber mapa alternativo');
 doc.querySelector('[data-go-section="opportunity"]').click();
 await until(()=>doc.querySelector('#gg-opportunity-lens'),'lente de oportunidad en brief');
 check(doc.querySelector('#gg-opportunity-lens').textContent.includes('no se han importado'),'El agente debe distinguir fuente sin ETL');
 doc.querySelector('[data-gg-export-brief]').click();
 check(exported?.data?.territorio?.ubigeo==='200501','El brief filtrado no corresponde a Paita');
 check(exported.data.filtros_busqueda?.tipo_oportunidad==='nuevos','No se exportó el tipo de oportunidad');
 check(exported.data.filtros_busqueda?.provincia_codigo==='2005','No se exportó la provincia');
 doc.querySelector('[data-go-section="plan"]').click();
 await until(()=>doc.querySelector('#gg-campaign-lens'),'campaña filtrada');
 check(doc.querySelector('#gg-campaign-lens').textContent.includes('1 distritos'),'La campaña no respeta la provincia');
 doc.querySelector('#gg-campaign-guide [data-go-model="M2"]').click();
 await until(()=>doc.querySelector('.gc-current'),'propuesta M2 filtrada');
 check(doc.querySelector('.gc-current').textContent.includes('Paita'),'M2 debe seleccionar Paita, no otros distritos');
 doc.querySelector('[data-go-section="work"]').click();
 await until(()=>doc.querySelector('#gg-filter-type'),'regresar a filtros');
 type=doc.querySelector('#gg-filter-type');
 type.value='estacionales';
 type.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));
 await until(()=>doc.querySelector('#gg-official-evidence')?.textContent.includes('Sin series de ventas'),'advertencia estacional');
 doc.querySelector('[data-go-section="plan"]').click();
 await until(()=>doc.querySelector('#gg-campaign-lens'),'campaña estacional bloqueada');
 check(doc.querySelector('#gg-campaign-lens').textContent.includes('No se generan distritos elegibles'),'No hay datos temporales para priorizar');
 check(!doc.querySelector('#gg-campaign-guide .gc-current tbody tr'),'No inventar distritos de una campaña estacional');
 doc.querySelector('[data-go-section="work"]').click();
 await until(()=>doc.querySelector('#go-dep'),'regresar a búsqueda');
 const depCusco=doc.querySelector('#go-dep');depCusco.value='Cusco';
 depCusco.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));
 await until(()=>doc.querySelector('#gg-filter-province option[value="0809"]'),'provincia La Convención');
 const provCusco=doc.querySelector('#gg-filter-province');provCusco.value='0809';
 provCusco.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));
 await until(()=>doc.querySelector('#go-ubigeo')?.value==='080901','selección Santa Ana por provincia');
 const typeCusco=doc.querySelector('#gg-filter-type');typeCusco.value='nuevos';
 typeCusco.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));
 await until(()=>doc.querySelector('#gg-official-evidence')?.textContent.includes('56 licencias'),'Santa Ana integrada');
 doc.querySelector('[data-go-section="opportunity"]').click();
 await until(()=>doc.querySelector('#gg-opportunity-brief'),'brief Santa Ana');
 doc.querySelector('[data-gg-export-brief]').click();
 check(exported?.data?.territorio?.ubigeo==='080901','Santa Ana no seleccionado');
 check(exported.data.filtros_busqueda?.tipo_oportunidad==='nuevos','Filtro municipal no propagado');
 check(exported.data.investigacion?.licencias_adicionales?.emitidas_q2_2026===56,'Fuente de Santa Ana no propagada');
 // Mapas Google JS: mock sin clave real ni cargos, bibliotecas oficiales bajo demanda.
 doc.querySelector('[data-go-section="work"]').click();
 await until(()=>doc.querySelector('#gg-google-toolbar'),'Google Maps toolbar');
 const invoked=[];
 const FakeMap=class{
  constructor(el,options){
    check(options.mapId==='DEMO_MAP_ID','Google Maps avanzado necesita Map ID');
    this.data={addGeoJson(){},setStyle(){},addListener(){}};
  }
  fitBounds(){}
 };
 const FakeInfoWindow=class{setContent(){}open(){}};
 const FakeMarker=class{constructor(opts){this.map=opts.map;}addListener(){}};
 const lib={
   maps:{Map:FakeMap,InfoWindow:FakeInfoWindow},
   core:{LatLng:class{constructor(o){Object.assign(this,o);}},LatLngBounds:class{extend(){}}},
   marker:{AdvancedMarkerElement:FakeMarker},
   geocoding:{Geocoder:class{async geocode(){return {results:[{geometry:{viewport:{}}}]};}}},places:{Place:{async searchByText(){return {places:[{id:"TEST_PLACE",displayName:"Negocio simulado CI",formattedAddress:"Calle de prueba",location:{lat:-12,lng:-77}}]};}}}
 };
 frame.contentWindow.google={maps:{importLibrary:async name=>{
   invoked.push(name);
   if(!lib[name])throw Error('Biblioteca inesperada: '+name);
   return lib[name];
 }}};
 frame.contentWindow.GeoGrowthGoogleMaps.activateForTest('FAKE_TEST_ONLY');
 await until(()=>doc.querySelector('#gg-google-map-canvas')&&doc.querySelector('#gg-maps-status')?.textContent.includes('valida registros oficiales'),'Google Maps con bibliotecas simuladas');
 for(const x of ['maps','core','marker','geocoding'])check(invoked.includes(x),'No se importó biblioteca Google '+x);
 check(!invoked.includes('drawing'),'Drawing no debe cargarse');
 doc.querySelector('[data-gm-places]').click();
 await until(()=>doc.querySelector('#gg-maps-status')?.textContent.includes('No se realizó ninguna consulta Places'),'Santa Ana no tiene registros identificables');
 check(!invoked.includes('places'),'No consultar Places sin registros identificables');
 const depA=doc.querySelector('#go-dep');depA.value='Arequipa';depA.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));
 await until(()=>doc.querySelector('#go-ubigeo option[value="040101"]'),'Arequipa disponible');
 const distA=doc.querySelector('#go-ubigeo');distA.value='040101';distA.dispatchEvent(new frame.contentWindow.Event('change',{bubbles:true}));
 await until(()=>doc.querySelector('#gg-maps-status')?.textContent.includes('valida registros oficiales'),'mapa Arequipa');
 doc.querySelector('[data-gm-places]').click();
 await until(()=>doc.querySelector('#gg-google-places-results')?.textContent.includes('10 consultados'),'lote oficial procesado');
 check(invoked.includes('places'),'Places no importado');
 check(!doc.querySelector('#gg-google-places-results').textContent.includes('Negocio simulado CI'),'Rechazar resultados que no coinciden con la fuente');
 check(doc.querySelector('[data-gm-next]'),'Debe permitir consultar el siguiente lote');
 check(!doc.querySelector('#v9-safe-map #ggv5'),'No volver al mapa V5');
  status.textContent='RESULTADO_BROWSER_V9_OK: mapa, agentes, 5 etapas, 196 provincias, filtrado y campaña explicables';
}
window.addEventListener('load',()=>test().catch(e=>{status.textContent='RESULTADO_BROWSER_V9_FALLO: '+e.message}));
</script></html>"""

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

driver=ROOT/"__v9_browser_smoke__.html"
driver.write_text(DRIVER,encoding="utf-8")
server=http.server.ThreadingHTTPServer(("127.0.0.1",0),functools.partial(Quiet,directory=str(ROOT)))
thread=threading.Thread(target=server.serve_forever,daemon=True)
thread.start()
url=f"http://127.0.0.1:{server.server_port}/{driver.name}"
try:
    cmd=[
        CHROME,"--headless=new","--no-sandbox","--disable-gpu",
        "--disable-dev-shm-usage","--disable-background-networking",
        "--disable-background-timer-throttling","--virtual-time-budget=16000",
        "--hide-scrollbars","--dump-dom",url
    ]
    result=subprocess.run(cmd,capture_output=True,text=True,timeout=55,check=False)
    output=result.stdout
    if "RESULTADO_BROWSER_V9_OK:" not in output:
        msg=output.split("RESULTADO_BROWSER_V9_FALLO:",1)
        if len(msg)>1:
            raise RuntimeError("Fallo funcional: "+msg[1].split("<",1)[0])
        raise RuntimeError("Chrome no completó la validación. salida="+repr(output[-800:])+" stderr="+repr(result.stderr[-800:]))
    print("OK: prueba E2E V9 (25 departamentos, roles, licencias, distrito, scoring, brief, M0/M1/M2, campo)")
finally:
    server.shutdown()
    driver.unlink(missing_ok=True)
