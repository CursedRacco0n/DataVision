# Proyecto 06 · DataVision Académico

**Reto:** Dashboard móvil de asistencia, calificaciones y actividades entregadas.
**Participantes:** 5 estudiantes · **Duración:** 3 horas · **IA:** permitida con verificación.
**Stack:** Ionic + Angular + Axios + PHP + MySQL · **Librerías:** `echarts`, `papaparse`.

## Problema real
La coordinación académica necesita estudiar tendencias de asistencia y desempeño por grupo. Los datos deben provenir de MySQL vía PHP; las gráficas no pueden ser arreglos estáticos de ejemplo.

## Pantallas mínimas
1. **Origen/API:** URL de servidor y salud de la conexión.
2. **Registro/CSV:** formulario con fecha, grupo, inscritos, presentes, promedio, actividades programadas y entregadas; o importar CSV.
3. **Dashboard:** tres gráficas, filtros y tarjetas de indicadores.

## Obligatorio (MVP)
- [ ] Crear por Axios un registro de indicador válido con `POST` JSON a PHP.
- [ ] Importar CSV local usando **Papa Parse** con encabezados, validaciones y reporte de filas incorrectas.
- [ ] Insertar mediante API PHP en MySQL registros nuevos (sin duplicar fecha + grupo).
- [ ] Consultar registros desde PHP con `GET` filtrable por grupo y fechas.
- [ ] Utilizar **Apache ECharts** para **barras** (promedio por grupo), **líneas** (% asistencia por fecha) y **dona/pastel** (presentes vs ausentes en filtro actual).
- [ ] Mostrar tarjetas: número de registros, asistencia acumulada (%), promedio de calificaciones.
- [ ] Actualizar las gráficas al guardar registro, importar CSV y modificar filtros.

## Demostración ante el docente
1. Ver tres gráficas provenientes de los 12 registros iniciales de MySQL.
2. Agregar un registro válido en la aplicación y verificar su nueva fila en MySQL.
3. Importar un CSV con al menos 4 filas y mostrar resultados (aceptadas/rechazadas).
4. Cambiar grupo/rango; demostrar que tanto gráficas como KPI cambian.
5. Manejar CSV malformado o `presentes > inscritos` sin crashear.

## Extras (si termina antes)
- [ ] Exportar datos filtrados a CSV con Papa Parse.
- [ ] Columna de comparación entre grupos, gráfico apilado o tabla de detalle.
- [ ] Zoom o interacción detallada de punto en ECharts.

## Definiciones matemáticas
- Asistencia ponderada (%) = `100 * SUM(presentes) / SUM(inscritos)` para los registros filtrados, si el denominador > 0.
- Promedio de calificación = `AVG(promedio)` de registros filtrados (misma ponderación por registro); mostrar N.
- Dona presentes/ausentes: `SUM(presentes)` vs `SUM(inscritos - presentes)`.
- Nunca presentar porcentajes cuando no hay denominador: mostrar «Sin datos».

## Entregables
Proyecto Ionic sin `node_modules`, endpoints PHP, SQL, CSV importado, `README.md`, prueba en Android o navegador móvil y `IA_USADA.md`.
