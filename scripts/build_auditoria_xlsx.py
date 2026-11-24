"""Create auditable concise workbook using artifact_tool."""
from pathlib import Path
import csv,json
from artifact_tool import Workbook, SpreadsheetFile
R=Path(__file__).resolve().parents[1];D=R/'data'
def rows(name):
 with open(D/name,encoding='utf-8-sig',newline='') as f:return list(csv.DictReader(f))
M=json.loads((D/'metricas_auditoria.json').read_text()); deps=rows('departamentos_comparativo.csv');lima=rows('lima_licencias_por_anio.csv');sources=rows('fuentes_y_transformaciones.csv')
wb=Workbook.create()
style={'fill':'#16365C','font':{'bold':True,'color':'#FFFFFF'},'row_height':27,'vertical_alignment':'center'}
def base(name,title,sub):
 s=wb.worksheets.add(name);s.merge_cells('A1:H1');s.get_range('A1').values=[[title]];s.get_range('A1:H1').format={'fill':'#0C2544','font':{'bold':True,'size':17,'color':'#FFFFFF'},'row_height':34};s.merge_cells('A2:H2');s.get_range('A2').values=[[sub]];s.get_range('A2:H2').format={'font':{'color':'#5E7186','size':10},'row_height':25};return s
def table(s,start,headers,data,widths=None):
 n=len(headers);end=start+len(data);fromcol=lambda i: chr(65+i);last=fromcol(n-1);s.get_range(f'A{start}:{last}{start}').values=[headers];s.get_range(f'A{start}:{last}{start}').format=style
 if data:s.get_range(f'A{start+1}:{last}{end}').values=data
 for i,w in enumerate(widths or [18]*n):s.get_range(f'{fromcol(i)}:{fromcol(i)}').format.column_width=w
 s.freeze_panes.freeze_rows(start)
 return end
s=base('Resumen','GeoGrowth AI | Auditoría de fuentes','Cifras reales agregadas; los años de origen difieren. No inferir penetración financiera actual.')
table(s,4,['Métrica','Resultado','Unidad','Periodo','Interpretación'],[
 ['Empresas georreferenciadas',M['empresas_registros_2015'],'registros','2015','PRODUCE, actividad histórica'],
 ['Puntos SBS reportados',M['sbs_puntos_reportados'],'puntos','2025-12','No equivalen a clientes bancarizados'],
 ['Distritos SBS',M['sbs_distritos'],'UBIGEO','2025-12','Puntos presentes en registro'],
 ['Distritos empresas',M['empresa_ubigeos'],'UBIGEO','2015','Empresas históricas'],
 ['UBIGEO en intersección',M['interseccion_ubigeos'],'UBIGEO','2015+2025','No comparable temporalmente'],
 ['Filas Lima MML',M['lima_rows_total'],'filas','2024-2026','Un distrito: 150101'],
 ['Expedientes distintos Lima',M['lima_unique_expediente_year'],'claves','2024-2026','Clave año + expediente'],
 ['Repeticiones Lima',M['lima_duplicate_expediente_rows'],'filas','2024-2026','No inflar conteos'],
 ['Licencias Arequipa',M['arequipa_license_total'],'registros','2025 jul-dic','Municipalidad provincial'],
 ],[32,20,19,17,60])
s.get_range('B4:B13').format.number_format='#,##0'
ss=base('Departamentos','Resumen departamental de datos heterogéneos','PRODUCE 2015 vs SBS 2025: cifras separadas, sin cocientes interanuales de inclusión financiera.')
fields=['departamento','empresas_2015','micro_2015','sbs_puntos_2025','sbs_oficinas_2025','sbs_atm_2025','ubigeos_companies','ubigeos_sbs']
headers=['Departamento','Empresas 2015','Micro 2015','Puntos SBS 2025','Oficinas 2025','ATM 2025','UBIGEO PRODUCE','UBIGEO SBS']
data=[[r['departamento']]+[int(r[x]) for x in fields[1:]] for r in deps]
table(ss,4,headers,data,[25,18,16,20,18,16,20,18]);ss.get_range('B5:H29').format.number_format='#,##0'
ll=base('Lima','Cercado de Lima | licencias 2024–2026','No cubre toda Lima Metropolitana. Se deduplicó por (ANIO_EXPEDIENTE, EXPEDIENTE).')
table(ll,4,['Año','Filas originales','Expedientes distintos','Diferencia','UBIGEO','Cobertura'],[[int(r['ANIO']),int(r['FILAS_ORIGINALES']),int(r['EXPEDIENTES_DISTINTOS']),int(r['FILAS_ORIGINALES'])-int(r['EXPEDIENTES_DISTINTOS']),r['UBIGEO'],'Solo Cercado de Lima'] for r in lima],[16,22,23,18,17,40]);ll.get_range('A9').values=[['Total']];ll.get_range('B9').formulas=[['=SUM(B5:B7)']];ll.get_range('C9').formulas=[['=SUM(C5:C7)']];ll.get_range('D9').formulas=[['=B9-C9']];ll.get_range('A9:D9').format={'fill':'#E9F2FF','font':{'bold':True}}
ff=base('Fuentes','Manifiesto de procedencia y transformación','SHA-256 calculado a partir de originales disponibles en la sesión; no incluye RUC individuales.')
table(ff,4,['Clave','Entidad / fuente','Periodo','Nivel','Uso','Limitación','URL oficial','SHA-256'],[[r['clave'],r['fuente'],r['periodo'],r['nivel'],r['utilidad'],r['limitacion'],r['url'],r['sha256'] or 'no disponible'] for r in sources],[13,36,17,35,36,55,45,70])
g=base('Brechas','¿Qué nos falta para un sistema real?','Prioridad P0/P1/P2 y consecuencias sobre el modelo de negocio.')
b=[
 ['P0','Población adulta por UBIGEO','No disponible','No calcular puntos por adulto','INEI Censos 2025'],
 ['P0','Empresas vigentes por distrito/sector','Solo 2015','No inferir actuales ni prospectos','INEI/PRODUCE'],
 ['P0','Red de agencias Caja Trujillo','No integrada','No optimizar proximidad real','Caja / fuente institucional'],
 ['P0','Resultados históricos de captación','No disponibles','No entrenar conversión ni medir ROI','CRM/campañas'],
 ['P1','Licencias de otros distritos Lima','Solo 150101','Sin cobertura municipal metropolitana','Municipalidades'],
 ['P1','Catálogo y requisitos vigentes','No validado','No inferir elegibilidad','Caja Trujillo'],
 ['P1','Costos/rutas reales','Simulado','No estimar presupuesto real','Logística/OSM'],
 ['P2','Señales digitales verificables','No integradas','No adjudicar demanda por redes','Fuentes públicas permitidas'],
 ['P2','Agentes LLM ejecutándose','Brief determinista','No vender como multiagente real','LangGraph / tool calling']]
table(g,4,['Prioridad','Dato','Estado','Efecto','Fuente propuesta'],b,[15,36,22,51,34])
out=R/'GeoGrowth_Auditoria_DataPack_V3.xlsx'
SpreadsheetFile.export_xlsx(wb).save(str(out))
print('EXPORTADO',out,out.stat().st_size)
print(wb.inspect({'kind':'table','range':'Lima!A4:D9','include':'values,formulas','table_max_rows':6,'table_max_cols':4}).ndjson[:1600])
