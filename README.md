# GeoGrowth AI — COM-01, Eje 2 (prototipo público)

Demo de inteligencia territorial para captación e inclusión financiera, construida con información pública y una aplicación de campo de **uso demostrativo**. No es una solución oficial de Caja Trujillo.

## Sitio web

- `index.html` — portada
- `GeoGrowth_AI_Dashboard_V3.html` — exploración, scoring, fichas de evidencia, campañas y comparación M0/M1/M2
- `GeoGrowth_AI_Campo_V3.html` — importa campañas JSON, registra observaciones y exporta resultados.

## Datos y alcance

- 25 departamentos; 1,879 UBIGEO en la unión SBS/PRODUCE; 1,725 con registros coincidentes.
- SBS 2025: infraestructura financiera georreferenciada.
- PRODUCE 2015: distribución empresarial **histórica** (no padrón vigente).
- Lima: licencias 2024–2026, **solo Cercado de Lima**.
- Arequipa: licencias municipales de un periodo localizado.
- Datos públicos procesados y manifiesto de procedencia: carpeta `data/`.
- **No incorpora prospectos nominales, datos de clientes de Caja Trujillo ni evaluaciones crediticias reales.**

## Uso online

1. Abre el Dashboard y elige *Todo el Perú* o uno de los 25 departamentos.
2. Filtra UBIGEO o distrito, revisa fuentes y limitaciones de la ficha.
3. En *Priorización*, cambia ponderaciones y presupuesto supuesto, compara M0/M1/M2 y exporta JSON.
4. Abre la App de campo, importa JSON, registra observaciones sintéticas y exporta los resultados.
5. En el Dashboard, importa los resultados en *Campañas y retorno*.

No usa Google Maps ni las teselas de OpenStreetMap: el mapa es una vista SVG geográfica esquemática **local**, así que no se producen errores 403 del proveedor de teselas. Los símbolos NO identifican domicilios de negocios.

## Publicar con GitHub Pages

1. Crea el repositorio público `geogrowth-ai-cajathon`.
2. Sube los archivos manteniendo `index.html` en la raíz.
3. En `Settings > Pages`, selecciona `Deploy from a branch`, `main` y `/(root)`.
4. La dirección pública será `https://<usuario>.github.io/geogrowth-ai-cajathon/`.

## Validez de resultados

El índice es exploratorio; las variables cruzadas no son comparables temporalmente. Los costos por territorio son hipotéticos. Los datos no permiten inferir demanda real, probabilidad de captación, elegibilidad crediticia o necesidades de financiamiento individuales. Para producción faltan población adulta comparable, empresas actuales, catálogo oficial de productos y resultados históricos de campañas.

Consulta `EVALUACION_DE_FACTIBILIDAD.md` y `data/fuentes_y_transformaciones.json` para auditoría y limitaciones.
