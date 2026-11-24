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
 await until(()=>doc?.querySelector('#v9-safe-map #ggv5 svg')&&doc.querySelector('.v9-extra-license'),'mapa y licencias');
 check(doc.querySelectorAll('#v9-safe-map #ggv5 svg path.gg-dept').length===25,'no hay 25 departamentos V5');
 check(doc.querySelector('.v9-stages button'),'faltan cinco etapas');
 check(doc.querySelectorAll('.v9-stages button').length===5,'flujo V9 alterado');
 const stages=['work','score','opportunity','plan','execution'];
 const nav=(id)=>[...doc.querySelectorAll(id+' [data-view]')].map(el=>el.dataset.view);
 const same=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
 check(same(nav('#sidenav'),stages),'Analista: sidebar debe contener solo cinco etapas');
 check(same(nav('#mobilemenu'),stages),'Analista: menú móvil debe contener solo cinco etapas');
 doc.querySelector('[data-v9-role="admin"]').click();
 check(doc.querySelector('.v9-extra-panel')?.textContent.includes('Administrador'),'vista Admin ausente');
 for(const id of ['home','explore','sources','readiness']){
   check(nav('#sidenav').includes(id),'Administrador debe conservar '+id);
   check(nav('#mobilemenu').includes(id),'Administrador móvil debe conservar '+id);
 }
 doc.querySelector('[data-v9-role="analista"]').click();
 check(same(nav('#sidenav'),stages),'Al regresar a Analista deben ocultarse las otras vistas');
 check(same(nav('#mobilemenu'),stages),'Al regresar a Analista móvil deben ocultarse las otras vistas');
 await until(()=>doc.querySelector('.v9-extra-license'),'licencias del analista');
 const district=doc.querySelector('.v9-extra-license [data-v9-district]');
 check(district,'no hay acción de investigación');
 district.click();
 await until(()=>doc.querySelector('#go-ubigeo')?.value==='040101','distrito de licencia no seleccionado');
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
 check(exported.data.agentes_demo?.especialista?.length===4,'JSON no contiene los cuatro agentes simulados');
 check(doc.querySelectorAll('#gg-agent-simulation .gg-team-card').length===4,'No aparecen los especialistas de la demo');
 check(doc.querySelector('#gg-agent-simulation').textContent.includes('DEMO · sin LLM conectado'),'Falta el estado de simulación');
 // Verificar navegación real a los otros casos sin sustituir V9 ni inventar licencias.
 for(const [ubigeo,departamento,sourceState] of [
   ['130101','La Libertad','sin_cobertura'],
   ['150101','Lima','agregada'],
   ['060101','Cajamarca','sin_cobertura'],
   ['040101','Arequipa','individualizada']
 ]){
   const btn=doc.querySelector('#gg-agent-simulation [data-gg-case="'+ubigeo+'"]');
   check(btn,'Falta acceso de demostración '+ubigeo);
   btn.click();
   await until(()=>doc.querySelector('#gg-agent-simulation [data-gg-case="'+ubigeo+'"][data-gg-case-active="true"]'), 'Cambiar a '+ubigeo);
   check(doc.querySelector('#gg-opportunity-brief').textContent.includes(departamento),'El territorio no cambió '+ubigeo);
   const curr=frame.contentWindow.GeoGrowthOpportunityBriefV2.build(
     frame.contentWindow.DATA.find(x=>x.ubigeo===ubigeo),70);
   check(curr?.agentes_demo?.fuentes?.licencias===sourceState,'Atribución incorrecta de licencias '+ubigeo);
   check(curr?.agentes_demo?.especialista?.length===4,'No hay análisis de agentes para '+ubigeo);
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
 await until(()=>doc.querySelector('#v9-safe-map #ggv5 svg'),'restauración de mapa en Seleccionar territorio');
 status.textContent='RESULTADO_BROWSER_V9_OK: mapa, roles, licencias, selección, scoring, brief, modelos, campo';
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
