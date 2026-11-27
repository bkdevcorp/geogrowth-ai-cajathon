> Documento histórico anterior a V12. Para navegación y ejecución actuales consulta README.md. Los datos y limitaciones históricas se conservan.

# GeoGrowth AI V3 — Evaluación de viabilidad y brechas para desarrollo real
**Reto COM-01 / Eje 2 — Caja Trujillo**  
**Fecha de análisis:** 23 de noviembre de 2026  
**Estado:** prototipo funcional de exploración e investigación; **no** modelo productivo de captación.

## 1. Decisión ejecutiva

Con los archivos reunidos **sí es viable** construir y demostrar un ETL trazable (Bronze/Silver/Gold), explorador distrital nacional, mapa de infraestructura SBS, historial de concentración empresarial, ficha de investigación con fuentes, ranking técnico experimental, planificador de campañas y captura de observaciones desde campo. **No es viable todavía** afirmar que se han identificado las zonas con mayor inclusión desatendida, prospectos actuales ni probabilidades de captación; no hay denominadores actuales, registros de clientes nuevos ni resultados comerciales etiquetados.

La prioridad de V3 es **seleccionar territorios para investigar**, no conceder crédito, inferir necesidad de cada empresa o construir una lista automatizada de personas a contactar.

## 2. Inventario de fuentes integrado

| Fuente | Periodo | Nivel | Evidencia procesada | Limitación crítica |
|---|---|---|---|---|
| PRODUCE — `Empresas.csv` | 2015 | registro de empresa georreferenciada, agrupado por UBIGEO | **1,683,610** registros; **1,799** UBIGEO en los agregados históricos | Desactualizada para actividad empresarial vigente en 2026. No asumir empresas activas. |
| SBS — `CIIF-0002-di2025.xls` | Diciembre 2025 | puntos de atención, agrupados por UBIGEO | **100,514** puntos reportados en **1,805** UBIGEO; 74,135 filas de origen según auditoría anterior | Puntos reportados no son personas bancarizadas; un POS no sustituye una oficina. |
| Municipalidad Metropolitana de Lima — `DATOS ABIERTOS LICENCIAS...csv` | 2024 a abril 2026 | expedientes de licencia **solo de Cercado de Lima** | **5,613** filas; **4,613** claves únicas año+expediente; **1,000** repeticiones entre cortes; 4,438 claves con estado final VIGENTE | Solo UBIGEO **150101**. No incluye giro CIIU, dirección ni coordenadas. Se deduplicó por clave técnica provisional. |
| Municipalidad Provincial de Arequipa | Julio–diciembre 2025 | registros de licencias, agrupados | **894** licencias; **887** con estado ACTIVA | Cobertura local, no regional ni nacional. Requiere validación de campos UBIGEO irregulares. |
| INEI `Datos_Muestra_2026.csv` | 2026 | muestra de municipalidades | **199** municipalidades de Amazonas y Áncash | No es padrón nacional ni población adulta por distrito. |

**Integración SBS + PRODUCE:** 1,879 UBIGEO en unión, **1,725** UBIGEO presentes en ambas. **No calcular cocientes de empresas 2015 / puntos 2025 como medida vigente de penetración financiera**. En el tablero los dos valores aparecen por separado.

## 3. Problemas de calidad tratados

- Lima: preservación del CSV de origen, identificación de cortes repetidos, deduplicación provisional por `(ANIO_EXPEDIENTE, EXPEDIENTE)`, conteos agregados; no se exportan RUC ni detalles de expediente.
- SBS: agrupar por `N°` de puntos, no solo por filas; distinguir oficinas, cajeros ATM, POS y EOB.
- Geografía: homogeneización de UBIGEO a 6 dígitos, unión externa de los agregados de ambos años; coordenadas medias SBS **no son centroides oficiales del distrito ni ubicaciones de empresas**.
- Arequipa: uso exclusivo de agregados previamente auditados y etiquetados como cobertura municipal.
- Registros sin correspondencia: mostrar ausencia de fuente como **sin dato**, jamás como cero cobertura.

## 4. Qué se demuestra vs. qué requiere datos nuevos

| Función | V3 | Falta para producción |
|---|---|---|
| Datos oficiales + linaje y auditoría | Implementado sobre archivos proporcionados y agregados anteriores | Automatizar actualizaciones, contratos de datos y control de versiones. |
| Mapa por departamento/UBIGEO | Implementado; OSM/Leaflet en línea, respaldo SVG sin internet | Polígonos oficiales, geocodificación autorizada de establecimientos, rutas reales. |
| Investigación territorial y brief | Implementado con **reglas deterministas** y evidencias | Agente LangGraph con consultas a fuentes, evaluación de factualidad y permisos. |
| Priorización M0/M1/M2 | Implementada como benchmark **matemático ilustrativo** | Actualizar empresas, población y uso financiero; calibrar con datos de prospectación. |
| Costos y campañas | Costos **simulados** y exportación JSON funcional | Presupuesto real, tiempos de desplazamiento, carga de analistas, agencias y radios. |
| Campo y feedback | Formularios y exportación/importación JSON funcionales | CRM, identidades, auditoría segura, controles legales y sincronización. |
| Recomendación de productos | Solo categoría **hipotética**; no dictamen | Catálogo vigente, reglas comerciales y validación de necesidades reales. |
| Predicción de conversión/captación | **No disponible** | Campañas históricas, visitas, contactabilidad, alta de clientes, fechas y etiqueta objetivo. |
| Métrica de inclusión financiera | **No validada** | Población adulta y uso/acceso, redes de Caja, distancia por viaje y contexto territorial actual. |

## 5. Datos adicionales: prioridad real

**P0 — imprescindibles para el núcleo comercial serio**

1. **Población adulta por UBIGEO actualizada** (INEI Censos 2025 / EstaDist, con fecha y denominador). Permite normalizar infraestructura por población.
2. **Empresas actuales por distrito y actividad económica** (INEI Directorio Central, PRODUCE u otras fuentes públicas con granularidad comparable y licencia de uso). Sustituye 2015 como señal vigente.
3. **Inventario geográfico de agencias y cobertura de Caja Trujillo**, al menos público, y capacidad operativa por agencia si se consigue con el PO. La SBS refleja todo el sistema, no específicamente la Caja.
4. **Resultados comerciales históricos** de campañas: territorio, fecha, leads verificados, contactados, interesados, altas, productos contratados, costo, visitas. Sin esto no hay ML de conversión ni ROI validado.

**P1 — necesarios para prospectar establecimientos concretos**

5. Licencias municipales vigentes **de otros distritos de Lima y del norte**, con razón social/actividad/dirección solo cuando la publicación y finalidad permitan su tratamiento. Integrar como insumos de verificación, no enviar campañas masivas a RUC.
6. Catálogo y requisitos verificables de Caja Trujillo por producto/segmento; no asumir elegibilidad individual usando datos abiertos.
7. Capas de distancia y tiempos de viaje y red vial; costos reales de visita.

**P2 — incrementan calidad**

8. Señales digitales públicas bajo términos de uso permitidos, con fecha y verificación; actividad sectorial reciente, ferias/mercados, campañas estacionales. No usar señales personales sensibles.
9. Resultados de entrevistas con analistas, comercios y jefaturas; prueba de adopción en campo.

## 6. Cómo medir el éxito sin sobreafirmar

- **Ahora, con datos disponibles:** porcentaje de UBIGEO con fuentes válidas; exactitud de agregación; trazabilidad del brief; consistencia del algoritmo de selección; presupuesto simulado respetado; importación/exportación; pruebas de no inventar prospectos.
- **Con resultados observados:** costo por oportunidad *verificada*, rendimiento por visita, clientes nuevos por campaña, conversión, tiempos de gestión, distribución de visitas en áreas poco atendidas, valor de cartera bajo políticas de la Caja.
- **Sin datos observados:** no atribuir incremento de captación, mejora de inclusión ni reducción de costo real a modelos M0/M1/M2.

## 7. Diseño de benchmarking

- **M0:** elegir territorios por cantidad de microempresas históricas, respetando presupuesto simulado.
- **M1:** elegir territorios por IIT exploratorio — variables históricas y presencia física SBS, normalizadas **dentro de un departamento**, con pesos ajustables.
- **M2:** optimización exacta de mochila 0/1 sobre máximo 30 territorios candidatos, con costos supuestos. No implica optimización de rutas reales.

La utilidad del benchmark es demostrar integración y decisión **reproducible**, no probar que el modelo identifica clientes verdaderamente bancarizables. Con información contemporánea y etiquetas reales podrá sustituirse IIT por estimaciones predictivas y evaluar resultados con validación fuera de muestra.

## 8. Plan para evolucionar a solución real

| Etapa | Trabajo | Entregable / criterio de aceptación |
|---|---|---|
| 1. Data Pack confiable | Incorporar población, empresas 2025/2026 y agencias Caja; QA por UBIGEO/fecha | Reporte de calidad, cobertura y diccionario; ninguna cifra cruzada sin fecha. |
| 2. Inteligencia reproducible | ETL incremental, indicadores territoriales y criterios de priorización | 100% de hechos con identificador de fuente; tests de agregación y consistencia. |
| 3. Agente real | Herramientas de recuperación/consulta permitidas, evidencia, auditor | No puede citar datos inexistentes ni inventar clientes o elegibilidad. |
| 4. Operación comercial | CRM, rutas, permisos, campañas y feedback | Auditoría de cada cambio; aceptación de asesores; sin PII sin autorización. |
| 5. Piloto y experimentos | Estrategia tradicional vs GeoGrowth con territorios comparables | Conversión y costo medidos con datos observados; monitoreo de sesgos territoriales. |

## 9. Preguntas concretas al Product Owner (sin pedir que entregue datasets)

1. ¿Qué salida tendrá más valor en COM-01: zona a prospectar, establecimientos validados, leads confirmados o nuevos clientes efectivos?
2. ¿Hay zonas objetivo o una distancia máxima desde las agencias existentes que debamos respetar?
3. ¿Qué líneas de producto y segmentos comerciales deben priorizarse, y cuáles son los requisitos oficiales para un acercamiento comercial responsable?
4. ¿Cómo se puntuará la demostración con datos públicos, si la conversión histórica real no está disponible?
5. ¿La aplicación de campo puede registrar observaciones sobre zonas y establecimientos sin información personal, o se esperan prospectos nominales?

## 10. Fuentes para obtener los faltantes

- SBS — Mapa de Oportunidades: https://www.sbs.gob.pe/inclusion-financiera-principal/cifras-de-inclusion-financiera/mapa-de-oportunidades
- INEI — Resultados Censos 2025, cuadros distritales: https://censos2025.inei.gob.pe/resultados/descarga-de-datos/cuadros-estadisticos/cuadros-interactivos
- INEI — Sistema de información distrital: https://www.gob.pe/institucion/inei/pages/27392-consultar-datos-en-el-sistema-de-informacion-distrital-del-inei
- INEI — Demografía Empresarial: https://www.inei.gob.pe/biblioteca-virtual/boletines/demografia-empresarial-8237/1/
- MML — dataset licencias: https://www.datosabiertos.gob.pe/dataset/licencias-de-funcionamiento-otorgadas-2020-2025

**Cierre:** GeoGrowth V3 ya es un laboratorio funcional con información pública integrada, pero el motor de decisión sigue siendo **exploratorio**. El principal paso de valor es actualizar población, actividad económica y resultados de prospección antes de entrenar modelos o afirmar que una zona merece inversión comercial real.
