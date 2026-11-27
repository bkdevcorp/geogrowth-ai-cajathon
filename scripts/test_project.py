import csv,json,re
from pathlib import Path
R=Path(__file__).resolve().parents[1];D=R/'data'
r=json.loads((D/'territorios_reales.json').read_text(encoding='utf-8'))
m=json.loads((D/'metricas_auditoria.json').read_text(encoding='utf-8'))
checks={
 'Empresas 2015 total':m['empresas_registros_2015']==1683610,
 'SBS 2025 total':m['sbs_puntos_reportados']==100514,
 'Lima solo Cercado':m['lima_only_ubigeo']==['150101'],
 'Lima deduplicada':m['lima_rows_total']-m['lima_unique_expediente_year']==m['lima_duplicate_expediente_rows']==1000,
 'Join union':len(r)==1879,
 'Join intersection':sum(x['ambas_fuentes'] for x in r)==1725,
 'Lima licencia solo Lima Cercado':sum(x['fuente_licencias']=='MML 2024-2026' for x in r)==1,
 'Arequipa solo una licencia territorial':sum(x['fuente_licencias']=='MPA 2025' for x in r)==1,
 'No exportan RUC':all('ruc' not in x for x in r),
 'Cinco HTML vigentes':{p.name for p in R.glob('*.html') if not p.name.startswith('__')}=={'index.html','expansion-comercial.html','mercados-desatendidos.html','campanas-estacionales.html','configuracion.html'},
 'Mobile import JSON': 'GeoGrowthCampaignV3' in (R/'assets/campo.js').read_text(encoding='utf-8'),
}
for name,success in checks.items():print(('OK' if success else 'ERROR'),name)
assert all(checks.values())
