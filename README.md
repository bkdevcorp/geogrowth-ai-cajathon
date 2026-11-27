# GeoGrowth AI — CAJATHON 2026 · COM-01

**Prototipo del equipo Glitch.** Inteligencia geoespacial para investigar oportunidades de captación. No es una solución oficial o productiva de Caja Trujillo.

## Navegación V12

| Módulo | Página |
|---|---|
| 01. Nuevos negocios | [index.html](index.html) |
| 02. Expansión comercial | [expansion-comercial.html](expansion-comercial.html) |
| 03. Mercados desatendidos | [mercados-desatendidos.html](mercados-desatendidos.html) |
| 04. Campañas estacionales | [campanas-estacionales.html](campanas-estacionales.html) |
| Configuración | [configuracion.html](configuracion.html) |

Opportunity Brief, Mi campaña, Seguimiento y registro de campo son herramientas auxiliares, no opciones adicionales del menú. La campaña y resultados se transfieren por JSON o almacenamiento local del navegador. No existe sincronización multiusuario.

## Ejecutar

Desde la raíz: python -m http.server 8000, luego abrir http://localhost:8000/. Publicación estática en GitHub Pages.

En Configuración introduce una **clave de navegador restringida por HTTP referrer** (dominio GitHub Pages y localhost solo si corresponde), Map ID de demostración automático, límites de cuota y facturación. La clave se conserva en localStorage de este navegador hasta eliminarla o borrar los datos del sitio. No se publica en Git. Usa únicamente una clave de navegador y un dispositivo de confianza. Maps y Geocoding pueden probarse desde la configuración. No se ha comprobado una clave real en CI. El módulo estacional y el buscador usan direcciones de los registros; no inventan ubicaciones.

Para evaluadores: [obtener Maps Demo Key sin facturación](https://developers.google.com/maps/documentation/javascript/demo-key). La pantalla Configuración incluye este acceso y las instrucciones. La clave demo tiene restricciones y no se ha verificado con el Geocoder JavaScript del prototipo.

## Diseño

Sistema oficial generado con UI UX Pro Max Skill (nextlevelbuilder/ui-ux-pro-max-skill): design-system/geogrowth-ai/MASTER.md. Data-Dense Dashboard, Fira Sans/Fira Code, teal y naranja, navegación consistente, foco visible y movimiento reducido.

## Datos y limitaciones

25 departamentos incluido Callao; 1,879 UBIGEO en la unión SBS 2025/PRODUCE 2015 y 1,725 en ambas fuentes. Registros municipales con cobertura parcial; San Martín incluye Moyobamba y Juanjuí. Consultar data/ y los documentos de fuentes. La licencia no prueba apertura, actividad actual ni interés de crédito. Mercados desatendidos utiliza una comparación histórica de empresas y puntos financieros, no una brecha validada. Campañas estacionales aplica reglas explícitas de actividad y temporada, no predice demanda. No hay IIT operativo en el menú, scoring crediticio, productos recomendados, CRM, autenticación ni backend productivo.

## Pruebas

- python scripts/test_project.py
- python -m unittest scripts/test_aggregate_convencion.py
- node scripts/test_map.cjs
- node scripts/test_expansion_places.cjs
- node scripts/test_v12.cjs
- python scripts/test_browser_v12.py (Chrome/Chromium/Edge)

El histórico V3/V9/V10/V11 está disponible en Git (base bb3178f5). Las pruebas de esas interfaces fueron sustituidas por validaciones de la nueva navegación. Los issues de reproducibilidad, denominadores y piloto permanecen pendientes.

## Auditoría de interfaz homogénea

Los cuatro módulos utilizan assets/unified.js: filtros, resultados, mapa Google Maps, tabla paginada y ficha de evidencia compartidos. Localizar y contrastar son acciones explícitas para limitar consultas; sin clave los registros siguen disponibles. Consulta [evidencia y resultados](evidencia/auditoria-ui/README.md). Las capturas se generan con scripts/capture_audit.cjs (Node 22, Chromium, Python; variables GEOGROWTH_CHROME y GEOGROWTH_PYTHON).

### Google Maps: arranque y Demo Key

Con una clave guardada, el mapa se inicializa automáticamente y se centra en las referencias del territorio filtrado. Mercados desatendidos muestra hasta 10 referencias SBS al iniciar; los domicilios comerciales se consultan explícitamente para limitar cuotas. Si Geocoder JavaScript no está autorizado, se intenta Place.searchByText (compatible con Demo Key según https://developers.google.com/maps/documentation/javascript/demo-key). Solo se aceptan coincidencias únicas de calle, número y localidad. Los errores de cuota y permisos se distinguen de una búsqueda sin coincidencias. Pruebas con adaptadores simulados; no se verificó una credencial real.

## Modo demostración del hackathon

El modo predeterminado muestra escenarios sintéticos separados de los registros públicos. El selector de fuente se comparte entre los cuatro módulos y se guarda en localStorage. Los datos ficticios se identifican en pantalla, fichas y JSON; no se transfieren a campañas reales. Expansión incluye marcadores de local anterior y nuevo. Sin clave se muestra un mapa esquemático interactivo; con clave se intenta Google Maps con coordenadas precargadas, sin geocodificar negocios ficticios. El modo real permanece disponible. Evidencias: evidencia/auditoria-demo/despues. Las ubicaciones y métricas demo no son verificaciones ni deben utilizarse para visitas.

## Piloto de análisis GPT · Nuevos negocios

La primera opción muestra un panel de interpretación que utiliza los conteos, sectores y una muestra de hasta 12 registros de los filtros activos. En GitHub Pages se muestra un ejemplo calculado localmente, identificado como tal. Para probar una respuesta real de GPT, ejecutar desde la raíz en PowerShell:

```powershell
$env:OPENAI_API_KEY = Read-Host 'Clave API de OpenAI' -MaskInput
python scripts/serve_ai.py
```

Abrir http://127.0.0.1:8765/ y pulsar Analizar con GPT. El modelo predeterminado es gpt-4.1-mini y puede cambiarse mediante OPENAI_MODEL. El servidor usa Responses API y escucha solo en loopback; no es un servicio para exposición pública. Se envían datos resumidos, no nombres ni direcciones de registros reales. No se guarda la clave en el navegador ni en Git. La consulta real puede generar cargos. La API todavía no se ha probado con una credencial real.
