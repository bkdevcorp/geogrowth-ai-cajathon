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
