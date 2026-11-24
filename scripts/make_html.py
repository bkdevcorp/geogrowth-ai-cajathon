from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]
D=R/'data'
for file,inputs in [('GeoGrowth_AI_Dashboard_V3.html',{'__RECORDS__':'territorios_reales.json','__DEPTS__':'departamentos.json','__METRICS__':'metricas_auditoria.json','__SOURCES__':'fuentes_y_transformaciones.json'})]:
 s=(R/'scripts/dashboard_template.html').read_text(encoding='utf-8')
 for tag,path in inputs.items():s=s.replace(tag,(D/path).read_text(encoding='utf-8'))
 (R/file).write_text(s,encoding='utf-8')
 rows=json.loads((D/'territorios_reales.json').read_text(encoding='utf-8'))
 valid=[r for r in rows if r['departamento']=='La Libertad' and r['ambas_fuentes']]
 valid.sort(key=lambda x:x['micro_2015'] or 0,reverse=True)
 campaign={"format":"GeoGrowthCampaignV3","source":"GeoGrowth AI Eje2 V3","departamento":"La Libertad","budget_hipotetico":2400,"peso_empresa_historica":55,"advertencia":"Datos reales multianuales, costos y escenarios ilustrativos.","territorios":[{'ubigeo':x['ubigeo'],'nombre':x['nombre_distrito'] or 'UBIGEO '+x['ubigeo'],'departamento':x['departamento'],'iit':None,'costo_simulado':600,'evidencias':x['evidencia']} for x in valid[:4]]}
 (D/'campana_demo_lalibertad.json').write_text(json.dumps(campaign,ensure_ascii=False,indent=2),encoding='utf-8')
 template=(R/'scripts/campo_template.html').read_text(encoding='utf-8')
 template=template.replace('__DEFAULT_CAMPAIGN__',json.dumps(campaign,ensure_ascii=False,separators=(',',':')))
 (R/'GeoGrowth_AI_Campo_V3.html').write_text(template,encoding='utf-8')
 (R/'index.html').write_text('''<!DOCTYPE html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GeoGrowth AI V3</title><style>body{background:#f3f7fb;color:#142741;font:16px Inter,Arial,sans-serif;max-width:800px;margin:80px auto;padding:20px}h1{font-size:38px}p{line-height:1.6;color:#5b6e85}.a{display:block;background:white;padding:25px;border:1px solid #dce5ee;border-radius:14px;margin:15px 0;color:#1849bd;text-decoration:none;font-weight:800}small{color:#6f8194;display:block;margin-top:7px}</style><h1>GeoGrowth AI · Eje 2</h1><p>Prototipos con fuentes reales de años distintos, auditoría y proceso de prospección demostrativo. No constituye una plataforma operativa de Caja Trujillo.</p><a class="a" href="GeoGrowth_AI_Dashboard_V3.html">Abrir centro de inteligencia territorial <small>Explorar SBS, PRODUCE, Lima y Arequipa; generar briefs y campañas.</small></a><a class="a" href="GeoGrowth_AI_Campo_V3.html">Abrir aplicación móvil de campo <small>Importar campañas, registrar observaciones y exportar resultados.</small></a><p>Instrucciones: README.md · Estado de las fuentes y brechas: EVALUACION_DE_FACTIBILIDAD.md</p></html>''',encoding='utf-8')
 print('Created:',[(p.name,p.stat().st_size) for p in R.glob('*.html')])
