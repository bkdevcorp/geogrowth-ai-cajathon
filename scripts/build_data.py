#!/usr/bin/env python3
"""GeoGrowth AI V3 - reproducible integration of published aggregates and Lima municipal CSV.
No personal/RUC-level records are exported. Python stdlib only.
Usage: python scripts/build_data.py (run in project copy placed beside original /mnt/data sources)
"""
from __future__ import annotations
from collections import Counter,defaultdict
from pathlib import Path
import csv,json,hashlib,re,statistics,datetime
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'; DATA.mkdir(exist_ok=True)
MNT=Path('/mnt/data')
PREV=MNT/'GeoGrowth_AI_Datos_Reales_v2'
PRIOR=MNT/'GeoGrowth_AI_Datos_Reales_v1'
LIMA=MNT/'DATOS ABIERTOS LICENCIAS 01012024 AL 0104.2026 (1).csv'
def read_csv(p,delimiter=','):
 with open(p,encoding='utf-8-sig',newline='') as f: return list(csv.DictReader(f,delimiter=delimiter))
def write_csv(path,rows,fields):
 with open(path,'w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');w.writeheader();w.writerows(rows)
def num(x):
 try:return int(float(str(x).strip().replace(',','')))
 except:return 0
def floating(x):
 try:return float(str(x).strip())
 except:return None
companies=read_csv(PREV/'Empresas_2015_por_ubigeo.csv')
sbs=read_csv(PREV/'SBS_2025_puntos_por_ubigeo.csv')
areq=read_csv(PRIOR/'Arequipa_2025_licencias_agrupadas.csv')
lima=read_csv(LIMA,';')
unique={}; revisions=Counter(); duplicate_keys=Counter()
for r in lima:
 key=(r['ANIO_EXPEDIENTE'],r['EXPEDIENTE'])
 duplicate_keys[key]+=1
 # last record of each expediente in sequence to emulate latest administrative extract
 unique[key]=r
for r in lima: revisions[r['ANIO_EXPEDIENTE']]+=1
byyear=Counter(r['ANIO_EXPEDIENTE'] for r in unique.values())
status=Counter(r['ESTADO_VIGENCIA'] for r in unique.values())
risks=Counter(r['RIESGODDCC'] for r in unique.values())
limits={
 'lima_rows_total':len(lima),
 'lima_unique_expediente_year':len(unique),
 'lima_duplicate_expediente_rows':len(lima)-len(unique),
 'lima_unique_ruc':len(set(r['RUC'] for r in lima if r['RUC'] not in ('','0'))),
 'lima_year_rows':dict(revisions),
 'lima_year_unique':dict(byyear),
 'lima_status_unique':dict(status),
 'lima_risk_unique':dict(risks),
 'lima_only_ubigeo':list(set(r['UBIGEO'] for r in lima)),
 'lima_no_address_or_giro':True,
 'arequipa_license_total':sum(num(r['REGISTROS']) for r in areq if r['AGRUPACION']=='ESTADO'),
 'arequipa_active':sum(num(r['REGISTROS']) for r in areq if r['AGRUPACION']=='ESTADO' and r['VALOR']=='ACTIVA'),
}
# license groups only, no RUC, no name, no address to avoid PII or speculative contact
lima_annual=[{'ANIO':year,'FILAS_ORIGINALES':revisions[year],'EXPEDIENTES_DISTINTOS':byyear[year], 'FUENTE':'MML 2024-2026', 'UBIGEO':'150101'} for year in sorted(byyear)]
write_csv(DATA/'lima_licencias_por_anio.csv',lima_annual,list(lima_annual[0]))
lima_status=[{'ESTADO':k,'EXPEDIENTES_DISTINTOS':v,'UBIGEO':'150101'} for k,v in status.most_common()]
write_csv(DATA/'lima_licencias_estado.csv',lima_status,list(lima_status[0]))
# labels for the 43 districts in province of Lima (INEI standard UBIGEO enumeration)
lima_names=['Lima','Ancón','Ate','Barranco','Breña','Carabayllo','Chaclacayo','Chorrillos','Cieneguilla','Comas','El Agustino','Independencia','Jesús María','La Molina','La Victoria','Lince','Los Olivos','Lurigancho','Lurín','Magdalena del Mar','Pueblo Libre','Miraflores','Pachacámac','Pucusana','Puente Piedra','Punta Hermosa','Punta Negra','Rímac','San Bartolo','San Borja','San Isidro','San Juan de Lurigancho','San Juan de Miraflores','San Luis','San Martín de Porres','San Miguel','Santa Anita','Santa María del Mar','Santa Rosa','Santiago de Surco','Surquillo','Villa El Salvador','Villa María del Triunfo']
labels={f'1501{i:02d}':n for i,n in enumerate(lima_names,1)}
labels.update({'130101':'Trujillo','040101':'Arequipa (Cercado)','200101':'Piura','060101':'Cajamarca','140101':'Chiclayo','021801':'Chimbote','130104':'Huanchaco','130105':'La Esperanza','130107':'Moche','130111':'Víctor Larco Herrera','040102':'Alto Selva Alegre','040103':'Cayma','040104':'Cerro Colorado','040108':'Jacobo Hunter','040110':'Mariano Melgar','040112':'Miraflores (Arequipa)','040113':'Paucarpata','040129':'José Luis Bustamante y Rivero','070101':'Callao'})
# official names for INEI sample (2 departments) from previous intermediate
sample_path=PREV/'INEI_2026_muestra_ubicaciones.csv'
if sample_path.exists():
 sample=read_csv(sample_path)
 if sample:
  print('INEI sampled cols:',list(sample[0]))
  for r in sample:
   u=(r.get('UBIGEO') or r.get('ubigeo') or '').zfill(6)
   district=(r.get('DISTRITO') or r.get('distrito') or '')
   if len(u)==6 and district:labels.setdefault(u,district.title())
by_sbs={r['UBIGEO']:r for r in sbs}
by_co={r['UBIGEO']:r for r in companies}
all_codes=sorted(set(by_sbs)|set(by_co))
rows=[]
for u in all_codes:
 a=by_co.get(u);b=by_sbs.get(u)
 dep=(b or a)['DEPARTAMENTO']
 micro=num((a or {}).get('MICRO_2015')); small=num((a or {}).get('PEQUENA_2015'))
 points=num((b or {}).get('PUNTOS_SBS_TOTAL'))
 lat=floating((b or {}).get('LAT_MEDIA_SBS'))
 lon=floating((b or {}).get('LON_MEDIA_SBS'))
 if lat is not None and not(-19<lat<-0.001 and -82<lon<-68):lat=lon=None
 municipal=("MML 2024-2026" if u=='150101' else "MPA 2025" if u=='040101' else "")
 n_lic=(limits['lima_unique_expediente_year'] if u=='150101' else limits['arequipa_license_total'] if u=='040101' else None)
 row={
  'ubigeo':u, 'departamento':dep,'nombre_distrito':labels.get(u,''),
  'micro_2015':micro if a else None,'pequena_2015':small if a else None,
  'empresas_2015':num(a['EMPRESAS_2015']) if a else None,
  'ciiu2_2015':(a or {}).get('CIIU2_PREDOMINANTE',''),
  'sbs_puntos_2025':points if b else None,
  'sbs_oficinas_2025':num(b['PUNTOS_OFICINA']) if b else None,
  'sbs_atm_2025':num(b['PUNTOS_ATM']) if b else None,
  'sbs_pos_2025':num(b['PUNTOS_POS']) if b else None,
  'sbs_eob_2025':num(b['PUNTOS_EOB']) if b else None,
  'latitud_ref_sbs':lat,'longitud_ref_sbs':lon,
  'fuente_licencias':municipal, 'licencias_municipales_ref':n_lic,
  'anio_licencias':('2024-2026' if u=='150101' else '2025 (jul-dic)' if u=='040101' else ''),
  'evidencia':'|'.join([f'PRODUCE-2015:{u}' if a else '',f'SBS-2025:{u}' if b else '',f'LIC-MML:{u}' if u=='150101' else f'LIC-MPA:{u}' if u=='040101' else '']).strip('|').replace('||','|'),
  'ambas_fuentes':bool(a and b),
 }
 rows.append(row)
fields=list(rows[0])
write_csv(DATA/'territorios_reales_ubigeo.csv',rows,fields)
# departments summaries preserve different years
agg=defaultdict(lambda:dict(departamento='',empresas_2015=0,micro_2015=0,sbs_puntos_2025=0,sbs_oficinas_2025=0,sbs_atm_2025=0,ubigeos_companies=0,ubigeos_sbs=0,ubigeos_ambas=0))
for row in rows:
 a=agg[row['departamento']]; a['departamento']=row['departamento']
 for k in ('empresas_2015','micro_2015','sbs_puntos_2025','sbs_oficinas_2025','sbs_atm_2025'): a[k]+=row[k] or 0
 if row['empresas_2015'] is not None:a['ubigeos_companies']+=1
 if row['sbs_puntos_2025'] is not None:a['ubigeos_sbs']+=1
 if row['ambas_fuentes']:a['ubigeos_ambas']+=1
deps=sorted(agg.values(),key=lambda x:x['departamento'])
write_csv(DATA/'departamentos_comparativo.csv',deps,list(deps[0]))
limits.update({
 'sbs_registros_georeferenciados_informado_en_fase_anterior':74135,
 'sbs_puntos_reportados':sum(num(r['PUNTOS_SBS_TOTAL']) for r in sbs),
 'sbs_distritos':len(sbs),
 'empresas_registros_2015':sum(num(r['EMPRESAS_2015']) for r in companies),
 'empresa_ubigeos':len(companies),
 'union_ubigeos':len(rows),
 'interseccion_ubigeos':sum(r['ambas_fuentes'] for r in rows),
 'muni_districts':2,
 'full_coverage_municipal':False,
 'individual_leads_possible':False,
 'validated_conversion_model':False
})
assert limits['sbs_puntos_reportados']==100514
assert limits['empresas_registros_2015']==1683610
assert limits['lima_rows_total']==5613
assert len(rows)==limits['union_ubigeos']
for name,data in [('territorios_reales.json',rows),('departamentos.json',deps),('metricas_auditoria.json',limits)]:
 (DATA/name).write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
# source manifest incl file size and SHA and limitation
sources=[
 {'clave':'PRODUCE15','fuente':'PRODUCE - empresas georreferenciadas por tamaño','archivo':str(MNT/'Empresas.csv'),'periodo':'2015','nivel':'establecimiento (agregado a UBIGEO)','utilidad':'actividad empresarial histórica','limitacion':'No implica negocios activos en 2026; decenio de diferencia con SBS','url':'https://transparencia.produce.gob.pe/index.php/52-portal-de-datos-abiertos'},
 {'clave':'SBS25','fuente':'SBS - puntos de atención financiera CIIF-0002','archivo':str(MNT/'CIIF-0002-di2025.xls'),'periodo':'2025-12','nivel':'punto / UBIGEO (agregado)','utilidad':'presencia de infraestructura financiera','limitacion':'POS no equivale a oficina; no determina acceso, uso ni inclusión por habitante','url':'https://www.sbs.gob.pe/inclusion-financiera-principal/cifras-de-inclusion-financiera/mapa-de-oportunidades'},
 {'clave':'MML26','fuente':'Municipalidad Metropolitana de Lima - licencias','archivo':str(LIMA),'periodo':'2024-01 a 2026-04','nivel':'expediente en Cercado de Lima (UBIGEO 150101)','utilidad':'actividad administrativa reciente; no sector ni localización puntual','limitacion':'Únicamente un distrito; múltiples cortes con duplicados; RUC no exportado','url':'https://www.datosabiertos.gob.pe/dataset/licencias-de-funcionamiento-otorgadas-2020-2025'},
 {'clave':'MPA25','fuente':'Municipalidad Provincial de Arequipa - licencias','archivo':str(MNT/'Registro de licencias de funcionamiento JUL25 a DIC25 (1).xlsx'),'periodo':'2025-07 a 2025-12','nivel':'licencias municipales','utilidad':'señal local de actividad administrativa','limitacion':'Solo municipalidad provincial; agregación previa; campos UBIGEO inconsistentes','url':'https://www.datosabiertos.gob.pe/'},
 {'clave':'INEI26','fuente':'INEI - Datos_Muestra_2026','archivo':str(MNT/'Datos_Muestra_2026.csv'),'periodo':'2026','nivel':'muestra de 199 municipalidades','utilidad':'referencia local parcial','limitacion':'Solo Amazonas y Áncash; no es censo nacional ni denominador de población','url':'https://www.datosabiertos.gob.pe/'},
]
for s in sources:
 p=Path(s['archivo'])
 if p.exists():
  h=hashlib.sha256()
  with open(p,'rb') as f:
   for b in iter(lambda:f.read(4_194_304),b''):h.update(b)
  s['bytes']=p.stat().st_size;s['sha256']=h.hexdigest()
 else:s['bytes']=None;s['sha256']=None
(DATA/'fuentes_y_transformaciones.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2),encoding='utf-8')
write_csv(DATA/'fuentes_y_transformaciones.csv',sources,list(sources[0]))
print('AUDITORIA:',json.dumps(limits,ensure_ascii=False,indent=2))
print('DEPARTAMENTOS:',len(deps),'UBIGEOS:',len(rows))
