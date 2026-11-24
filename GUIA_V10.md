# GeoGrowth AI V10 — Cómo demostrar el circuito completo

## Acceso
- Entrada: `index.html`
- Administrador: `GeoGrowth_Admin.html`
- Analista: `GeoGrowth_Analista.html`
- Campo: `GeoGrowth_Campo.html`
- Mapa V5 (sin modificaciones): `GeoGrowth_AI_Dashboard_V3.html?map=1&v=50`

## Recorrido de presentación (6–8 minutos)
1. **Administrador → Resumen.** Muestra las fuentes y cantidades nacionales: PRODUCE 2015 + SBS 2025 para 1.879 UBIGEO en la unión, 1.725 con ambas fuentes, y 5.507 licencias deduplicadas (Lima Cercado / Arequipa Cercado). Evita confundir 5.507 licencias con clientes nuevos.
2. **Administrador → Datos y nuevos registros.** Observa licencias ordenadas. Lima contiene licencias otorgadas hasta marzo de 2026, pero sin nombre de negocio ni dirección; Arequipa sí posee nombres y giros de 2025. El archivo admite un nuevo corte normalizado para marcar registros no presentes en el anterior (no significa empresas constituidas recientemente).
3. **Administrador → Fórmula IIT.** El Índice de Investigación Territorial es una **suma ponderada multicriterio (Weighted Sum Model)** con normalización logarítmica. E = ln(1 + microempresas) / máximo departamental; B = 1 - ln(1 + oficinas) / máximo departamental. Puntaje IIT = 100 × [w × E + (1 - w) × B], donde w = 0,55 por defecto. Se compara **dentro** de cada departamento; no calcula probabilidad de clientes ni mide inclusión efectiva.
4. **Analista → Oportunidades detectadas.** Selecciona **Arequipa** y una licencia con nombre, giro y dirección publicados. La ficha explica la fecha (licencia, no creación de empresa) y el índice IPLV = 100 × [0,50 × recencia del corte + 0,30 × completitud + 0,20 × giro identificado]. No es un modelo predictivo.
5. **Analista → Opportunity Brief.** Explica hechos y limitaciones, qué es hipótesis, producto a validar con catálogo de Caja Trujillo, próxima acción con consentimiento. Pulsa *Agregar a mi campaña*.
6. **Analista → Mi campaña.** Pulsa *Preparar campaña con selección* y luego *Descargar JSON para aplicación móvil*. Si deseas comparar estrategias de distritos, ve a **Administrador → Diseño de campañas**: M0 volumen, M1 índice IIT, M2 optimización 0/1 bajo presupuesto **supuesto**. El modelo M2 usa programación dinámica (mochila 0/1), no estima rentabilidad.
7. **GeoGrowth Campo.** Importa JSON (o recupera el guardado en el mismo navegador), selecciona la licencia, marca *Simulación* si no se visitó realmente, registra resultado y exporta el JSON de resultados.
8. **Administrador → Resultados y embudo.** Importa el JSON, muestra volumen de visitas observadas, interés declarado, resultados simulados frente a reales y acciones pendientes. El interés comercial no equivale a conversión bancaria.

## Datos reales frente a hipótesis
- **Real / observado en archivo:** número de empresas 2015, puntos SBS 2025, licencia otorgada con nombre/giro/dirección cuando está disponible, fecha y estado al corte.
- **Heurística:** IIT y IPLV, pesos, ubicación priorizada, posibles productos y acciones sugeridas.
- **Simulación:** presupuestos, costos por distrito, visitas no realizadas en campo.
- **Pendiente para operación real:** actualización periódica automatizada de licencias, fuentes empresariales recientes, cobertura de Caja Trujillo, resultados comerciales históricos, consentimiento, autenticación y backend compartido.

## Limitación de sincronización
La web se aloja en GitHub Pages, sin API ni base de datos multiusuario. La campaña puede compartirse por descarga/importación JSON; los resultados se regresan con un segundo JSON. El navegador conserva los datos localmente, pero no sincroniza automáticamente entre dispositivos.

## Procedencia y privacidad
- Licencias de Lima: archivo original municipal 2024–abril 2026, deduplicado por año y expediente. No se publican RUC, razón social ni datos personales en la web. Los expedientes se muestran mediante identificadores derivados.
- Licencias de Arequipa: archivo municipal julio–diciembre 2025; se utilizan campos públicos de nombre comercial, dirección comercial, giro y fecha. El campo UBIGEO original está mal formado y el conjunto se asocia a Arequipa Cercado por el contexto de la fuente.
- Los archivos de licencias se procesaron antes de la publicación. La importación de nuevos cortes normalizados desde Administrador es manual y no verifica automáticamente la autoridad emisora.