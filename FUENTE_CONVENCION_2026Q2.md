# Nueva fuente municipal: Santa Ana (La Convención), 2026-T2

## Origen y cobertura

El usuario entregó dos CSV llamados `Licencias de Funcionamiento Segundo Trimestre 2026.csv` (con y sin sufijo `(1)`). Son copias **exactamente idénticas** con SHA-256 `b15742ef8c3b135ffb83365ccae12ba1f307b8ece8d77473f8ccf6e0b372de15`. Se procesó una sola vez.

- **Emisor:** Municipalidad Provincial de La Convención, código de entidad `300748`.
- **Distrito:** Santa Ana (Quillabamba), provincia La Convención, departamento Cusco.
- **Homologación territorial:** el archivo contiene `070901` bajo el encabezado «Código UBIGEO INEI», pero ese es el código de Santa Ana usado por RENIEC. El Data Pack de GeoGrowth utiliza **UBIGEO INEI `080901`**; se conserva la doble referencia y el municipio `300748` para trazabilidad. Esta equivalencia no es una corrección indiscriminada aplicable a otros códigos.
- **Referencia de publicación:** [Licencias de funcionamiento de Municipalidad Provincial La Convención, segundo trimestre de 2026](https://www.datosabiertos.gob.pe/dataset/licencias-de-funcionamiento-de-municipalidad-provincial-la-convenci%C3%B3n/resource/bce103e8-e3ae).

## Calidad y conteos

| Métrica | Valor |
|---|---:|
| Filas originales | 57 |
| Filas con emisión abril-junio de 2026 | 56 |
| Filas fuera del periodo principal (febrero de 2024) | 1 |
| Abril 2026 | 20 |
| Mayo 2026 | 18 |
| Junio 2026 | 18 |
| Códigos de giro diferentes en T2 | 27 |
| GIRO 5610 | 12 |
| GIRO 5630 | 6 |
| GIRO 5510 | 3 |
| GIRO 4721 | 3 |

**No confundir:** son registros de licencias en el archivo, no 56 empresas nuevas, activas o elegibles para crédito. El archivo carece de dirección comercial y estado actual de operación verificable. El significado preciso de los códigos de giro debe comprobarse con el diccionario municipal antes de una etiqueta sectorial definitiva.

## Privacidad y minimización

El CSV original incluye **RUC y razón social**, además de un identificador por registro. No se ha publicado, copiado ni versionado el CSV fuente en el repositorio público; el archivo `data/licencias_convencion_2026q2_resumen.json` contiene **solo conteos agregados**, periodos, códigos de giro y procedencia sin nombres, RUC o direcciones.

`scripts/aggregate_licencias_convencion.py` permite repetir el procesamiento de forma local, con validación de entidad, código territorial y mes. Un CSV original privado no debe añadirse a Git.

## Uso en la demo V9

1. **Seleccionar territorio:** Cusco → La Convención → Santa Ana (080901) permite ver 56 licencias integradas y sus giros codificados.
2. **Tipo de oportunidad – Nuevos negocios:** se muestra como **licencias para verificar**, no como empresas creadas en 2026.
3. **Opportunity Brief:** el motor IIT sigue usando PRODUCE 2015 y SBS 2025, sin cambiar de fórmula; las licencias 2026 son señal complementaria. Se registran 56 licencias T2, 1 histórica, 27 giros y los principales códigos.
4. **Mesa de agentes simulados:** incorpora Santa Ana como quinto caso, explica el origen de las licencias y propone investigación de negocios vigentes sin identificar ni contactar personas automáticamente.
5. **Campañas:** continúan siendo ejercicios con costos supuestos; ningún registro de licencia constituye una solicitud, un prospecto contactable o un préstamo preaprobado.

## Garantía de restauración

- Respaldo previo a esta incorporación: [`backup/v9-2026-11-24-pre-convencion-q2`](https://github.com/bkdevcorp/geogrowth-ai-cajathon/tree/backup/v9-2026-11-24-pre-convencion-q2), commit `0ba5aefbb9643682111ad0911cb6637aa0b645f9`.
- Respaldo previo a los filtros: `backup/v9-2026-11-24-antes-filtros`.
- No se modifica `geogrowth-map.js`, `geogrowth-operacion-v9.js`, `GeoGrowth_AI_Campo_V3.html` ni las fuentes base de IIT.
- Los tests de CI protegen la integridad del mapa V5, el motor V9, la aplicación Campo y la exportación de datos.

## Pruebas

```bash
python -m unittest scripts/test_aggregate_convencion.py
node scripts/test_licencias_convencion.cjs
node scripts/test_opportunity_brief.cjs
node scripts/test_agent_demo.cjs
node scripts/test_filters_v9.cjs
python scripts/test_browser_v9.py
```

En la última prueba de navegador se comprueba que Santa Ana se localiza con su provincia y el filtro «Nuevos negocios» y que el Opportunity Brief y su JSON preservan los totales correctos y el cruce RENIEC-INEI.
