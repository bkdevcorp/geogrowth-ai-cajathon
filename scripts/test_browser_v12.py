import functools,http.server,pathlib,shutil,subprocess,threading,tempfile,os
ROOT=pathlib.Path(__file__).resolve().parents[1]
CHROME=os.environ.get("GEOGROWTH_CHROME") or next((shutil.which(n) for n in ('google-chrome','google-chrome-stable','chromium','chromium-browser','msedge') if shutil.which(n)),None)
if not CHROME:
    for p in (r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',r'C:\Program Files\Google\Chrome\Application\chrome.exe'):
        if pathlib.Path(p).is_file(): CHROME=p;break
if not CHROME:raise SystemExit('Chrome/Chromium/Edge no disponible')
DRIVER=r"""<!doctype html><html lang="es"><meta charset="utf-8"><iframe id="app" style="width:1440px;height:900px"></iframe><pre id="result">RUNNING</pre><script>
const f=document.querySelector('#app'),out=document.querySelector('#result'),wait=ms=>new Promise(r=>setTimeout(r,ms));
const check=(x,m)=>{if(!x)throw Error(m)};
const until=async(fn,msg)=>{for(let i=0;i<160;i++){try{if(fn())return}catch(e){}await wait(75)}throw Error('Timeout: '+msg)};
const doc=()=>f.contentDocument;
const click=s=>{const e=doc().querySelector(s);check(e,'Elemento '+s);e.click()};
async function open(p,s){f.src=p;await until(()=>doc().location.pathname.endsWith('/'+p)&&doc().querySelector(s),p);check(doc().querySelectorAll('#nav a').length===4,'Menú de cuatro opciones: '+p);check(doc().querySelector('#settingsLink a[href="configuracion.html"]'),'Configuración ausente');check(doc().querySelector('link[href*="pro-max.css"]'),'CSS UX ausente');}
const pages=['index.html','expansion-comercial.html','mercados-desatendidos.html','campanas-estacionales.html'];
const expected=['Posible apertura','Posible local adicional','Zona por investigar','Ventana de prospección anticipada'];
const set=(id,val)=>{const el=doc().querySelector('#'+id);el.value=val;el.dispatchEvent(new f.contentWindow.Event('change',{bubbles:true}));};
const assertions=[];
async function common(p,i){
 await open(p,'#u-form');check(doc().querySelectorAll('#nav a.active').length===1,'Menú activo '+p);
 check(doc().querySelector('#expected-result').textContent.includes(expected[i]),'Resultado esperado '+p);
 check(doc().querySelectorAll('.u-table th').length===6,'6 columnas '+p);
 check(doc().querySelectorAll('.u-kpis .kpi').length===4,'4 indicadores '+p);
 check(doc().querySelector('.u-map-card h2').textContent==='Mapa comercial · Google Maps','Mapa compartido '+p);
 check(doc().querySelector('#u-rows [data-u-detail]'),'Hay filas '+p);
 check(doc().querySelector('#u-map-badge').textContent==='Sin API key','Estado sin API '+p);
 click('#u-locate');check(doc().querySelector('#u-map-status').textContent.includes('No hay API key'),'Sin clave no rompe búsqueda '+p);
 click('#u-case');check(!doc().querySelector('#u-detail').hidden,'Ficha de evidencia '+p);
 const t=doc().querySelector('#u-detail').textContent;for(const x of ['Fuente','Fecha / periodo','Motivo de detección','Estado de contraste','Acción ADN'])check(t.includes(x),x+' '+p);
 if(i===1)check(t.includes('Huellitas de amor')&&t.includes('Santa clotilde')&&t.includes('1335'),'Historial anterior y nuevo');
 if(i===2)check(t.includes('PRODUCE 2015')&&t.includes('SBS dic. 2025')&&!t.includes('Puntaje'),'Mercados sin índice');
 if(i===3){set('u-extra','escolar');check(doc().querySelector('#u-calendar').textContent.includes('16/03/2026'),'Calendario escolar');click('#u-case');check(doc().querySelector('#u-detail').textContent.includes('02/02/2026'),'Ventana en ficha');}
 if(!doc().querySelector('#u-detail').hidden)click('#u-close');
 const first=doc().querySelector('#u-rows tr').textContent;const next=doc().querySelector('#u-next');if(!next.disabled){click('#u-next');check(doc().querySelector('#u-page').textContent.includes('Página 2'),'Paginación '+p);check(doc().querySelector('#u-rows tr').textContent!==first,'Filas cambian '+p);click('#u-prev');}
 doc().querySelector('#u-query').value='ZZZ_NO_EXISTE_123';click('#u-search');check(doc().querySelector('#u-case').disabled&&doc().querySelector('#u-export').disabled&&doc().querySelector('#u-rows').textContent.includes('Sin resultados'),'Sin coincidencias '+p);click('#u-reset');check(doc().querySelector('#u-rows [data-u-detail]'),'Restaurar filtros '+p);
 const prov=doc().querySelector('#u-prov');if(prov.options.length>1){set('u-prov',prov.options[1].value);check(doc().querySelector('#u-dist').options.length>1,'Filtro distrito dependiente '+p);set('u-dist',doc().querySelector('#u-dist').options[1].value);check(doc().querySelector('#u-rows [data-u-detail]')||doc().querySelector('#u-case').disabled,'Filtro territorial coherente '+p);click('#u-reset');}
 // Controlled Google Maps test: no real key or network calls. Mock marker/map and geocode service.
 const w=f.contentWindow;let markerCount=0;const fake='AIza'+'X'.repeat(35);
 const G=w.GeoGrowthGoogleV11;G.save(fake,'DEMO_MAP_ID');
 class FakeMap{constructor(el){el.textContent='MAPA SIMULADO DE PRUEBA';}setCenter(){}setZoom(){}fitBounds(){}}
 class FakeMarker{constructor(o){Object.assign(this,o);markerCount++;}addListener(){}}
 class FakeBounds{extend(){}}
 w.google={maps:{importLibrary:async n=>({maps:{Map:FakeMap},marker:{AdvancedMarkerElement:FakeMarker},core:{LatLngBounds:FakeBounds},places:{Place:{searchByText:async()=>({places:[]})}}}[n]||{})}};
 G.geocodeRecord=async()=>({position:{lat:-8.1,lng:-79.0},geocoded:true});
 click('#u-locate');await until(()=>doc().querySelector('#u-map-badge').textContent.includes('ubicaciones'),'Mapa simulado '+p);check(markerCount>0&&markerCount<=10,'Marcadores acotados '+p);check(doc().querySelector('#u-map-status').textContent.includes('localizadas'),'Diagnóstico '+p);
 if(i!==2){const button=doc().querySelector('#u-rows [data-u-map]:not(:disabled)');if(button){button.click();await until(()=>doc().querySelector('#u-map-badge').textContent==='1 ubicación','Localizar una fila '+p);}}
 if(i!==2){click('#u-case');const contrast=doc().querySelector('#u-contrast');if(contrast){contrast.click();await until(()=>doc().querySelector('#u-detail').textContent.includes('Sin coincidencia'),'Places sin coincidencia '+p);}}
 // Test unavailable service without spending quota: browser rejects geocoder.
 if(i!==2){G.geocodeRecord=async()=>{throw Error('REQUEST_DENIED')};click('#u-locate');await until(()=>doc().querySelector('#u-map-status').textContent.includes('1 errores'),'Fallo de servicio controlado '+p);check(doc().querySelector('#u-rows [data-u-detail]'),'Resultados conservados tras fallo '+p);}
 G.clear();click('#u-reset');check(doc().querySelector('#u-map-badge').textContent==='Sin API key','Limpiar mapa '+p);
 assertions.push({page:p,status:'OK',result:doc().querySelector('#u-summary').textContent});
}
async function run(){
 for(let i=0;i<pages.length;i++)await common(pages[i],i);
 for(const p of pages){click('#nav a[href="'+p+'"]');await until(()=>doc().location.pathname.endsWith('/'+p)&&doc().querySelector('#u-form'),'Click de navegación '+p);}
 await open('index.html','#u-form');click('#u-case');click('#u-detail button[data-lead]');await until(()=>doc().querySelector('button[data-pick]'),'Opportunity Brief');
 click('button[data-pick]');click('button[data-nav="micanpana"]');await until(()=>doc().querySelector('button[data-create-lead-campaign]'),'Mi campaña');
 click('button[data-create-lead-campaign]');await until(()=>doc().querySelector('button[data-export-campaign]'),'Campaña guardada');
 click('button[data-nav="campo"]');await until(()=>doc().querySelector('#localCampaign'),'Campo integrado');
 click('#localCampaign');await until(()=>doc().querySelector('#visitform'),'Campaña recuperada');check(doc().querySelector('#simulate').checked,'Simulación por defecto');doc().querySelector('#outcome').value='Interesado';doc().querySelector('#visitform button[type="submit"]').click();await until(()=>doc().querySelector('.field-history-item'),'Observación');
 click('button[data-nav="seguimiento"]');await until(()=>doc().querySelector('#feedbackFile'),'Seguimiento');
 await open('configuracion.html','#configForm');check(doc().querySelector('#keyGuide'),'Guía de obtención de claves');check(doc().querySelector('a[href*="maps-hosted/tos"]'),'Enlace Demo Key');check(!doc().querySelector('a[href*="maps-apis/credentials"]'),'Sin opción de clave estándar');check(doc().querySelector('#mapsKey').type==='password','Clave protegida visualmente');click('#toggleKey');check(doc().querySelector('#mapsKey').type==='text','Mostrar clave');click('#toggleKey');
 doc().querySelector('#mapsKey').value='AIza'+'X'.repeat(35);doc().querySelector('#configForm').requestSubmit();check(f.contentWindow.localStorage.getItem('geogrowth.maps.config.v1'),'Clave persistente');f.contentWindow.sessionStorage.removeItem('geogrowth.maps.config.v1');await open('mercados-desatendidos.html','#u-form');await open('configuracion.html','#configForm');check(doc().querySelector('#mapsKey').value.length===39,'Configuración compartida sin sesión');f.contentWindow.location.reload();await until(()=>doc().querySelector('#mapsKey')?.value.length===39,'Clave tras recarga');check(doc().querySelectorAll('#content > section').length===2,'Dos bloques de configuración');click('#clearKey');await until(()=>doc().querySelector('#mapsKey')?.value===''&&!f.contentWindow.localStorage.getItem('geogrowth.maps.config.v1'),'Eliminar clave persistente');
 for(const p of ['index.html','expansion-comercial.html','mercados-desatendidos.html','campanas-estacionales.html','configuracion.html']){f.style.width='375px';await open(p,p==='configuracion.html'?'#configForm':'#u-form');await wait(100);check(doc().documentElement.scrollWidth<=doc().documentElement.clientWidth+3,'Desbordamiento móvil '+p+' '+doc().documentElement.scrollWidth);}
 out.textContent='RESULTADO_V12_OK';document.body.dataset.results=JSON.stringify(assertions);
}
run().catch(e=>out.textContent='RESULTADO_V12_FALLO: '+e.message);
</script></html>"""
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
driver=ROOT/'__v12_browser_smoke__.html';driver.write_text(DRIVER,encoding='utf-8')
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
    with tempfile.TemporaryDirectory() as profile:
        args=[CHROME,'--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--disable-background-timer-throttling','--virtual-time-budget=45000','--user-data-dir='+profile,'--dump-dom',f'http://127.0.0.1:{server.server_port}/{driver.name}']
        p=subprocess.run(args,capture_output=True,encoding='utf-8',errors='replace',timeout=100)
        import re
        status=re.search(r'<pre id="result">([^<]+)</pre>',p.stdout)
        assert status and status.group(1)=='RESULTADO_V12_OK',(status.group(1) if status else ('return='+str(p.returncode)+' stdout='+repr(p.stdout[-1200:])+' stderr='+repr(p.stderr[-1200:])))
        print('OK: cuatro módulos homogéneos; filtros, filas, paginación, fichas, sin resultados, mapas simulados, campaña, persistencia y móvil 375px')
finally:
    server.shutdown();driver.unlink(missing_ok=True)
