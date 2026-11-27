> Documento histórico anterior a V12. Para navegación y ejecución actuales consulta README.md. Los datos y limitaciones históricas se conservan.

# GeoGrowth AI V9 — Flujo operativo por secciones

El flujo se divide en cinco secciones independientes; al seleccionar un distrito, las demás reutilizan ese mismo UBIGEO. La cartografía V5, los CSV y los datos públicos no se modificaron.

## 1. Seleccionar territorio
Elegir departamento y distrito en **01 · Seleccionar territorio** o usar Trujillo (130101), Lima Cercado (150101), Arequipa (040101) o Cajamarca (060101). Revisar indicadores y fuentes disponibles. Pulsar **Continuar: 02 · Scoring IIT**.

## 2. Scoring IIT
Explicar el índice: IIT = 100 × (w × E + (1 − w) × B).
- E: log(1 + microempresas PRODUCE 2015) / máximo logarítmico de microempresas del departamento.
- B: 1 − log(1 + oficinas SBS 2025) / máximo logarítmico de oficinas del departamento.
- w: peso elegido, 55 % por defecto; complemento de 45 % para B.

El sistema presenta contribuciones y fórmula con los datos reales del distrito. Es una **prioridad de investigación exploratoria**, no una tasa de captación ni una medición validada de inclusión financiera.

## 3. Opportunity Brief
Presenta una decisión preliminar y **qué realizaría el asesor**: hechos verificados, segmentos que podrían investigarse, productos candidatos sujetos a validación, próxima acción y datos faltantes. El informe puede exportarse con evidencias.

## 4. Diseño de campaña
Comparar M0 (mayor volumen histórico), M1 (mayor IIT), M2 (selección matemática bajo presupuesto supuesto). Cambiar presupuesto, pulsar **Usar M0/M1/M2** y revisar la lista seleccionada. Exportar el JSON de campaña.

## 5. Ejecución y resultados
Abrir **GeoGrowth Campo** con el distrito o importar el JSON de campaña si contiene varios territorios. Registrar una visita **solo cuando se haya realizado**; exportar las observaciones en JSON y devolverlas mediante **Importar resultados JSON** en esta sección.

No hay CRM conectado ni clientes, necesidades, conversiones o desembolsos reales en las fuentes. Los indicadores vienen de PRODUCE 2015 y SBS 2025; las licencias municipales son parciales. No confundir el resultado de una prueba de interfaz con captación comprobada.

## Acceso
Dashboard: https://bkdevcorp.github.io/geogrowth-ai-cajathon/GeoGrowth_AI_Dashboard_V3.html?v=90
Aplicación móvil: https://bkdevcorp.github.io/geogrowth-ai-cajathon/GeoGrowth_AI_Campo_V3.html?v=80
