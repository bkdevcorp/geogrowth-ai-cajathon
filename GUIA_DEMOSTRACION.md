# GeoGrowth AI — Flujo operativo con datos territoriales reales (V8)

## Propósito
Resolver el reto COM-01 del Eje 2 de Caja Trujillo: investigar y priorizar territorios de captación con datos verificables.

El **mapa V5 se conserva sin modificaciones**. Se retiró del menú la demostración guiada. La vista inicial ahora es **Analizar territorio**.

## Uso
1. Abrir [GeoGrowth AI](https://bkdevcorp.github.io/geogrowth-ai-cajathon/GeoGrowth_AI_Dashboard_V3.html?v=80).
2. Elegir un departamento y un distrito/UBIGEO, o un acceso directo (Trujillo, Lima Cercado, Arequipa, Cajamarca).
3. La interfaz ejecuta el análisis del distrito sin botones de paso a paso:
   - Cruce con el Data Pack PRODUCE 2015 + SBS 2025 y, donde existe, licencias municipales.
   - Diagnóstico de cobertura y calidad.
   - IIT exploratorio, cuando ambas fuentes están disponibles.
   - Opportunity Brief con hechos, hipótesis, producto candidato por verificar y próximas acciones.
   - Comparación M0/M1/M2 y selección de campaña según presupuesto **hipotético**.
4. Exportar la campaña JSON, o abrir directamente la app de campo con el UBIGEO seleccionado.
5. Registrar solo visitas **efectivamente realizadas** en la app de campo. Exportar resultados JSON e importarlos en Campañas y retorno.

## Datos y limitaciones
- PRODUCE 2015: registro empresarial histórico, no padrón actual de negocios.
- SBS diciembre 2025: infraestructura financiera por UBIGEO; no equivale a inclusión financiera real.
- Licencias municipales: solo Cercado de Lima (expedientes 2024–2026) y Arequipa Cercado (registros 2025), no cobertura nacional.
- El índice IIT no es predicción de captación, riesgo ni elegibilidad crediticia.
- M0, M1 y M2 emplean costos de campaña **ilustrativos**; no se han medido desembolsos ni conversiones.
- Se preserva el consentimiento y la revisión humana para cualquier contacto comercial.

## Ejemplos con información real
- Trujillo, La Libertad: UBIGEO 130101.
- Lima Cercado, Lima: UBIGEO 150101.
- Arequipa Cercado, Arequipa: UBIGEO 040101.
- Cajamarca, Cajamarca: UBIGEO 060101.

## Componentes principales
- `GeoGrowth_AI_Dashboard_V3.html` + `geogrowth-operacion-v8.js`: proceso analítico.
- `geogrowth-map.js`: mapa aprobado V5, **intacto**.
- `GeoGrowth_AI_Campo_V3.html` + `geogrowth-campo-operacion-v8.js`: observaciones de campo.
- `data/territorios_reales.json`: datos territoriales agregados.
- `data/fuentes_y_transformaciones.json`: manifiesto de procedencia y transformaciones.
