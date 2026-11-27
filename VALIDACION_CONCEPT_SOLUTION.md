# Validación funcional — Concept Solution COM-01, revisión 4 (26/11/2026)

Fuente de requisitos: https://www.figma.com/board/UCzJJnz0wKz1owjJuX65YF/GeoGrowth-AI-%7C-Concept-Solution-%C2%B7-COM-01?node-id=0-1

## Resultados de demostración

| Módulo | Salida | Evidencia y límites |
|---|---|---|
| Nuevos negocios | Ficha de posible apertura, fecha de licencia, dirección y acción ADN; filtros de año, sector y territorio. | Licencias municipales incorporadas; no se confirma apertura, operación actual ni cliente nuevo. |
| Expansión comercial | Caso Huellitas de amor, Moyobamba: registro 2023-08-08 en Santa clotilde MZ E-LTE 06 y 2026-05-18 en Jr. Alonso de Alvarado N° 1335. | Coincidencia nominal e historial publicado; sucursal, identidad y traslado por verificar. 45 candidatos en el archivo municipal. |
| Mercados desatendidos | Ficha de zona por investigar, conteos por fuente, presencia de oficinas/puntos y referencia SBS. | PRODUCE 2015 y SBS dic. 2025 tienen fechas distintas; sin cociente ni puntaje territorial; ausencia de dato N/D. |
| Campañas estacionales | Ficha de negocio, actividad, temporada, calendario y ventana sugerida. | MINEDU: 16/03/2026; ventana histórica propuesta 02/02–02/03/2026. Navidad 2026: referencia PRODUCE 2025 y ventana propuesta noviembre. Verano, festividades y calendario agrícola localizado siguen pendientes. |

## Pruebas
Prueba de navegador local: menú de cuatro opciones, resultados de los cuatro módulos, filtros, fichas, no coincidencias, flujo de campaña/campo y configuración de sesión, ancho 375 px. Pruebas de auditoría de datos, mapa, geocodificación y Places simuladas aprobadas.

## Pendientes explícitos
- Comprobar Google Maps y Places con una credencial real y cuotas configuradas. Las búsquedas externas no constituyen contraste verificado.
- Mercados: actualizar denominadores y periodos, incorporar fuentes comparables; mapa territorial SVG complementado con enlace Google Maps.
- Completar cobertura por sector, periodo y territorio según fuentes. MIDAGRI localizado, SUNAT y fuentes adicionales no integradas como datos efectivos en esta actualización.
- IA semántica y síntesis asistida con evaluación humana: todavía no implementadas; reglas deterministas no son IA generativa.
- La mejora relativa de 10% de captación es una meta del piloto, no un resultado del prototipo.
- No se dispone de datos internos de Caja ni de confirmación de clientes nuevos.
