# Arequipa 2026 y Google Maps JavaScript API — V9 ampliada

## Respaldo verificable antes de modificar

- Rama: [`backup/v9-pre-maps-arequipa-2026`](https://github.com/bkdevcorp/geogrowth-ai-cajathon/tree/backup/v9-pre-maps-arequipa-2026)
- SHA de partida: `82894d58996f174a5f0008777727ce7f8e52395c`
- También permanecen disponibles `backup/v9-2026-11-24-pre-convencion-q2` y `backup/v9-2026-11-24-antes-filtros`.
- Los archivos originales `geogrowth-map.js`, `geogrowth-operacion-v9.js`, `GeoGrowth_AI_Campo_V3.html` y los datos de SBS/PRODUCE se conservan intactos.

## Nueva fuente independiente: Arequipa Cercado

El XLSX entregado es **una tercera entrega distinta** de las licencias de Santa Ana (Cusco) Q2 2026 y del Data Pack de licencias MPA julio–diciembre 2025.

- Archivo del usuario: `Listado de Licencias de Funcionamiento Registrados en la Municipalidad Provincial de Arequipa de Enero - Julio 2026 - (MPA).xlsx`.
- SHA-256: `afa4e36b64fb83dfa37eb74e52231a8ef5ca50f81d8c253ec8e7ca69ac43f775`.
- Hoja `LICENCIAS`, rango `A1:M825`, 824 filas.
- Departamento/provincia/distrito: **Arequipa / Arequipa / Arequipa Cercado**, INEI `040101`. El texto original contiene `40101` sin cero inicial.
- El archivo se titula **enero–julio**, pero las 824 emisiones observadas están fechadas **enero–junio**: enero 130, febrero 151, marzo 141, abril 125, mayo 106 y junio 171. **Julio no registra emisiones**.
- Categorías administrativas: `3. LF RIESGO BAJO O MEDIO` 712; `5. LF RIESGO MUY ALTO` 35; `6. CESIONARIO RIESGO BAJO O MEDIO` 34; `2. DUPLICADO` 14; `12.CAMBIO DE DENOMINACION` 13; `4. LF RIESGO ALTO` 12; `9. TRANSFERENCIA` 3; `15. CORPORATIVA` 1.
- Estado documental: `ACTIVA` 815; `INACTIVA CESE` 9. No verificar por ello que un negocio siga abierto en noviembre de 2026.
- El campo «Fecha de cierre» contiene el mismo valor **2026-07-02** para todas las filas: no interpretarlo como 824 cierres comerciales.
- `Expediente` tiene 824 valores diferentes, pero eso **no demuestra 824 empresas distintas o recién creadas**.
- No hay campos de latitud, longitud ni domicilio individual.

El repositorio **no contiene el XLSX original**: solo `data/licencias_arequipa_2026_resumen.json` con estadísticas agregadas, hash del original y fuente. No se publican números de expediente, resolución ni identificadores individuales. Se mantienen **ambos periodos MPA separados** (2025 jul–dic y 2026 ene–jun), y también separados de Santa Ana 2026.

## Google Maps JavaScript API: bibliotecas empleadas

`geogrowth-google-maps-v1.js` usa la API oficial mediante `google.maps.importLibrary()`:

| Biblioteca | Uso real en la demo | Cuándo se carga |
|---|---|---|
| `maps` | Mapa interactivo 2D con capas GeoJSON de los 25 departamentos y fichas de infraestructura | Al activar Google Maps |
| `core` | `LatLng` y `LatLngBounds` para centrado y encuadre territorial | Al activar Google Maps |
| `marker` | `AdvancedMarkerElement` para ubicaciones **referenciales SBS 2025** por distrito | Al activar Google Maps |
| `geometry` | `spherical.computeDistanceBetween()` entre coordenadas SBS (distancia lineal, no desplazamiento real) | Al activar Google Maps |
| `places` | `Place.searchNearby()` para explorar lugares publicados por Google, sin incorporarlos a licencias ni calificarlos como clientes | Solo al pulsar «Explorar lugares» |
| `routes` | `Route.computeRoutes()` para trazar una ruta **referencial** entre dos coordenadas SBS | Solo al pulsar «Ruta entre puntos SBS» |

Las bibliotecas `maps3d`, `streetView`, `geocoding`, `addressValidation`, `elevation`, `visualization`, `airQuality` y `journeySharing` no se cargan porque la demo no ejecuta operaciones que las requieran. **No se importa `drawing`**: `DrawingManager` no está disponible en Maps JS v3.65 y posteriores (2026).

### Activación en la página

1. Abrir `GeoGrowth_AI_Dashboard_V3.html?modo=ampliado&perfil=analista`.
2. En **01 · Seleccionar territorio**, elegir región/provincia/distrito.
3. En la tarjeta **Cartografía para investigación**, proporcionar una clave de navegador Google Maps con restricción de HTTP referrers y habilitar `Maps JavaScript API`. Para Advanced Markers se requiere un `Map ID` (la demo ofrece `DEMO_MAP_ID`; crear uno propio para producción).
4. Pulsar **Google Maps**. La clave se conserva solo en memoria de esa pestaña y **nunca se escribe en GitHub ni se almacena en localStorage**. Al refrescar se requerirá nuevamente.
5. Para «Explorar lugares», habilitar además **Places API (New)**. Para «Ruta», habilitar además **Routes API**.

**Cuenta y costos:** Google Cloud requiere proyecto con facturación habilitada, clave HTTP referrer restringida al dominio y restricción por APIs; las cargas de mapas y las consultas de Places/Routes pueden generar cargos. Los botones Places y Routes nunca consultan automáticamente.

**Sin clave / error de Google:** se mantiene automáticamente el mapa **V5 local**, que no necesita servicios externos. El requisito Google Maps queda **implementado** pero **no puede estar operativamente habilitado para todos los visitantes** hasta configurar una API key y facturación válidas.

## Relación con la investigación comercial

- Los puntos representados son **coordenadas promedio de infraestructura SBS**: no hay geocodificación de las 824 licencias de Arequipa 2026 ni de las licencias de Santa Ana 2026.
- Google Places devuelve lugares según su base, **no prueba que tengan licencia municipal o requieran crédito**.
- Routes calcula trayectos aproximados entre referencias SBS, no la ruta verificada de un asesor hacia comercios.
- La información municipal 2026 complementa el Opportunity Brief y la simulación de agentes; no afecta las ponderaciones IIT (PRODUCE 2015 / SBS 2025), modelos M0/M1/M2, presupuestos o scoring individuales.

## Pruebas de regresión

```bash
node scripts/test_arequipa_2026.cjs
node scripts/test_google_maps_adapter.cjs
node scripts/test_opportunity_brief.cjs
node scripts/test_agent_demo.cjs
node scripts/test_filters_v9.cjs
python scripts/test_browser_v9.py
```

La prueba de navegador usa dobles de prueba de Google Maps para **no realizar consultas facturables** en CI; verifica carga de las bibliotecas y retorno a V5. Una comprobación con Google real requerirá una clave habilitada por el propietario del proyecto.

Documentación oficial: https://developers.google.com/maps/documentation/javascript/libraries y https://developers.google.com/maps/documentation/javascript/advanced-markers/start.
