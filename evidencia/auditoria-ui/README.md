# Auditoría funcional y visual — GeoGrowth AI

## Alcance
Se ejecutó Chromium en una sesión aislada sin API key real. Se revisaron las capturas anteriores de los cuatro módulos y las nuevas capturas representativas de escritorio, tabla, ficha, móvil y configuración. La prueba E2E usa servicios Google simulados para verificar interacción, marcadores, errores y persistencia sin generar cargos.

## Hallazgos y correcciones
- Antes: cuatro implementaciones de búsqueda, mapas y tablas; Mercados tenía un mapa SVG diferente.
- Después: `assets/unified.js` comparte filtros, indicadores, mapa Google Maps, tabla de seis columnas, paginación, ficha y acciones. Los filtros cambian según cobertura y la lógica comercial conserva su significado.
- El mapa no consulta automáticamente servicios facturables: se utiliza Localizar (máximo 10 registros) y Contrastar para Places. Sin clave hay un estado explícito y acceso externo a Google Maps. No se inventan ubicaciones.
- Las referencias SBS son territoriales, no domicilios de negocios. Cuando no existe nombre de distrito se muestra UBIGEO. Expansión se delimita a Moyobamba; Juanjuí carece del historial necesario. Mercados compara PRODUCE 2015 y SBS 2025 sin inferir una tasa actual.
- Los controles particulares de versiones anteriores (comparador, modo de todas las licencias de expansión y rango exacto de fechas) no se presentan en la nueva interfaz común. Se conserva la lógica de evidencia y las fuentes.

## Resultados de la ejecución
| Módulo | Filtro inicial | Coincidencias | Ubicación publicada/referencia |
|---|---|---:|---:|
| Nuevos negocios | Arequipa | 894 | 894 |
| Expansión comercial | Moyobamba | 45 | 25 |
| Mercados desatendidos | La Libertad | 29 | 29 |
| Campañas estacionales | Arequipa / Navidad | 640 | 640 |

Son registros o señales para investigar, no clientes confirmados. Pruebas de navegador, integridad de datos, sintaxis JavaScript y adaptadores simulados aprobadas. Auditoría de capturas: 17 PNG, 0 excepciones JavaScript y sin desbordamiento horizontal en los módulos comprobados. No se verificó la descarga real de los archivos exportados ni una consulta real a Google con credencial válida.

## Evidencia antes y después
[Antes](antes/) (5 capturas): 01 Nuevos, 02 Expansión, 03 Mercados, 04 Estacionales, 05 Configuración.

| Módulo | Pantalla | Tabla | Ficha | Móvil |
|---|---|---|---|---|
| Nuevos negocios | [Ver](despues/01-nuevos-pantalla.png) | [Ver](despues/01-nuevos-tabla.png) | [Ver](despues/01-nuevos-ficha.png) | [Ver](despues/01-nuevos-movil.png) |
| Expansión | [Ver](despues/02-expansion-pantalla.png) | [Ver](despues/02-expansion-tabla.png) | [Ver](despues/02-expansion-ficha.png) | [Ver](despues/02-expansion-movil.png) |
| Mercados | [Ver](despues/03-mercados-pantalla.png) | [Ver](despues/03-mercados-tabla.png) | [Ver](despues/03-mercados-ficha.png) | [Ver](despues/03-mercados-movil.png) |
| Estacionales | [Ver](despues/04-estacionales-pantalla.png) | [Ver](despues/04-estacionales-tabla.png) | [Ver](despues/04-estacionales-ficha.png) | [Ver](despues/04-estacionales-movil.png) |

[Configuración](despues/05-configuracion.png) · [Resultados de auditoría JSON](despues/resultados.json).

## Reproducción
Ejecutar `scripts/test_browser_v12.py` y `node scripts/capture_audit.cjs` con Chromium. El script permite configurar rutas mediante GEOGROWTH_CHROME y GEOGROWTH_PYTHON. Las capturas son evidencia de la interfaz y datos locales, no de un Google Maps autenticado.
