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
async function run(){
 await open('index.html','#ggV11Dep');check(doc().querySelector('h1').textContent==='Nuevos negocios','Título nuevos negocios');
 await until(()=>doc().querySelector('button[data-lead]'),'licencias disponibles');
 click('button[data-lead]');await until(()=>doc().querySelector('button[data-pick]'),'Opportunity Brief');
 click('button[data-pick]');click('button[data-nav="micanpana"]');await until(()=>doc().querySelector('button[data-create-lead-campaign]'),'Mi campaña');
 click('button[data-create-lead-campaign]');await until(()=>doc().querySelector('button[data-export-campaign]'),'Campaña guardada');
 click('button[data-nav="campo"]');await until(()=>doc().querySelector('#localCampaign'),'Campo integrado');
 click('#localCampaign');await until(()=>doc().querySelector('#visitform'),'Campaña recuperada');check(doc().querySelector('#simulate').checked,'Simulación por defecto');doc().querySelector('#outcome').value='Interesado';doc().querySelector('#visitform button[type="submit"]').click();await until(()=>doc().querySelector('.field-history-item'),'Observación');
 click('button[data-nav="seguimiento"]');await until(()=>doc().querySelector('#feedbackFile'),'Seguimiento');
 await open('expansion-comercial.html','#ex-search');click('#ex-search');await until(()=>doc().querySelector('#ex-results'),'Expansión y filtros');
 await open('mercados-desatendidos.html','#md-dep');check(doc().querySelector('h1').textContent.includes('Mercados desatendidos'),'Mercados');
 await open('campanas-estacionales.html','#seSearch');click('#seSearch');await until(()=>doc().querySelector('#seNotice').textContent.includes('registros compatibles'),'Temporadas');check(doc().querySelector('#seRule').options.length===5,'Cinco temporadas');
 await open('configuracion.html','#configForm');check(doc().querySelector('#mapsKey').type==='password','Clave protegida visualmente');click('#toggleKey');check(doc().querySelector('#mapsKey').type==='text','Mostrar clave');click('#toggleKey');
 doc().querySelector('#mapsKey').value='AIza'+'X'.repeat(35);doc().querySelector('#configForm').requestSubmit();check(f.contentWindow.sessionStorage.getItem('geogrowth.maps.config.v1'),'Clave de prueba guardada en sesión');await open('mercados-desatendidos.html','#md-dep');await open('configuracion.html','#configForm');check(doc().querySelector('#mapsKey').value.length===39,'Configuración compartida');f.contentWindow.sessionStorage.removeItem('geogrowth.maps.config.v1');
 for(const p of ['index.html','expansion-comercial.html','mercados-desatendidos.html','campanas-estacionales.html','configuracion.html']){f.style.width='375px';await open(p,p==='index.html'?'#ggV11Dep':p.includes('expansion')?'#ex-search':p.includes('mercados')?'#md-dep':p.includes('estacionales')?'#seSearch':'#configForm');await wait(100);check(doc().documentElement.scrollWidth<=doc().documentElement.clientWidth+3,'Desbordamiento móvil '+p+' '+doc().documentElement.scrollWidth);}
 out.textContent='RESULTADO_V12_OK';
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
        print('OK: cuatro módulos, cinco páginas, brief, campaña, campo, seguimiento, sesión y ancho móvil 375px')
finally:
    server.shutdown();driver.unlink(missing_ok=True)
