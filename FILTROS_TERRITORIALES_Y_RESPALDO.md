# Filtros territoriales de GeoGrowth — V9 ampliada

## Respaldo antes de intervenir

- **Rama restaurable:** `backup/v9-2026-11-24-antes-filtros`
- **Commit íntegro:** `b9d56c7eb9d14ff248ebbf57165c65d37ab0f7fc`
- Es una referencia completa del árbol de Git del proyecto anterior a incorporar los filtros. No se modifica ni fusiona desde la rama de trabajo.
- Para recuperar la V9 anterior, comparar `main` con esa rama y revertir el Pull Request de filtros, o restablecer las diferencias mediante un PR de recuperación; no se eliminan las funcionalidades previas ni se hace `force push`.

## Archivo de referencia

`CajaRadar-AI-filtros-v3.html`, aportado por el usuario: cuatro filtros (Departamento/Región, Provincia, Distrito, Tipo de oportunidad), siete referencias municipales y un evento de prototipo `cajaradar:search`. El archivo **no contenía un motor de búsqueda conectado** ni datos de licencias para esos siete lugares; solo proponía criterios y enlaces.

## Implementación funcional

1. **Departamento:** territorios de `data/territorios_reales.json`; 25 departamentos.
2. **Provincia:** se deriva del prefijo de 4 dígitos del UBIGEO; los 196 nombres provienen de `data/provincias_ubigeo_ref.json`, referencia pública CC0 basada en `RitchieRD/ubigeos-peru-data`. Se conservan los códigos INEI; cualquier discrepancia entre catálogos debe revisarse al actualizar la fuente.
3. **Distrito:** código UBIGEO de 6 dígitos (1.879 territorios combinados SBS/PRODUCE) y nombre si existe en el Data Pack. El selector nativo se conserva.
4. **Tipo de oportunidad:** lente de investigación, **no etiqueta real de clientes**:
   - **Todas:** orden exploratorio IIT cuando hay datos.
   - **Nuevos negocios:** solo territorios con expedientes municipales integrados o una referencia concreta identificada. Se debe verificar si el negocio realmente es nuevo, opera actualmente y permite contacto.
   - **Expansión comercial:** orden por microempresas históricas PRODUCE 2015, sin inferir expansión reciente.
   - **Mercados por investigar:** relación exploratoria `(microempresas_2015+1)/(oficinas_SBS_2025+1)` para ordenar la investigación; no mide población no bancarizada ni cobertura propia.
   - **Campañas estacionales:** **sin candidatos seleccionables** al no existir series temporales o estacionales de actividad comercial.

El mapa V5 original permanece íntegro. En modo ampliado, se atenúan visualmente los marcadores de otras provincias y se mantiene la cartografía geográfica y los eventos del mapa.

## Transmisión a las cinco etapas

- **01 Seleccionar territorio:** 4 filtros, resultados limitados a evidencia disponible, fuentes externas identificadas y selección de UBIGEO.
- **02 Scoring IIT:** muestra el alcance elegido y conserva las ponderaciones y fórmula originales.
- **03 Opportunity Brief:** muestra el enfoque y su límite; exporta `filtros_busqueda` junto a los resultados de agentes simulados y evidencias.
- **04 Diseño de campaña:** M0, M1 y M2 evalúan únicamente distritos elegibles del área y enfoque seleccionados. No se modifican los algoritmos ni los costos demostrativos. Exporta `filtros_busqueda` como metadatos adicionales de `GeoGrowthCampaignV3`, sin cambiar el contenido `territorios` que consume Campo.
- **05 Ejecución:** muestra el contexto de filtros; los reportes de campo siguen importándose por JSON.

**Al cambiar provincia o enfoque se limpia la selección anterior de distritos de campaña**, evitando mezclar territorios que ya no forman parte del ámbito elegido.

## Fuentes municipales y procedencia

`data/catalogo_fuentes_cajaradar.json` reúne siete referencias del prototipo: Paita, Moyobamba, Arequipa, Castilla, Santa Ana/Quillabamba, Barranca y Juanjuí. Estas referencias **no se han importado al Data Pack**; solo facilitan la investigación de futuras fuentes. La referencia a Juanjuí es un portal genérico, no un dataset concreto verificado.

- Arequipa Cercado cuenta además con licencias publicadas ya integradas en la demo, con sus propios cortes y límites.
- Lima Cercado tiene expedientes municipales integrados sin identificación comercial completa para prospectar.
- La existencia de una URL municipal externa no confirma registros, cobertura, actualidad, integridad o nuevos clientes.
- Los segmentos, piloto de agentes y resultados de campaña deben seguir etiquetándose como hipótesis/simulación.

## Validaciones

`node scripts/test_filters_v9.cjs` prueba las 196 provincias, los siete enlaces, los estados de procedencia, el comportamiento de los lentes, el bloqueo de estacionalidad y los metadatos JSON.

`python scripts/test_browser_v9.py` comprueba con Chromium el filtro provincial en el mapa V5, la selección de distrito, la exportación del Opportunity Brief y la selección territorial M2. Los tests originales de V5, motor V9, Campo y datos siguen ejecutándose en GitHub Actions.

## Pendientes para producción

Ingesta reproducible y actualización de fuentes (Issue #2), denominadores y cobertura de Caja Trujillo (Issue #3), calibración comercial y pilotos observados (Issue #4). Incorporar series estacionales y consentimiento verificable antes de usarlos para automatización comercial o decisiones de crédito.
