# Registro de uso de IA (equipo 06)

| Estudiante | Responsabilidad | Prompt IA usado | Validación manual |
| ---------- | --------------- | --------------- | ----------------- |

---

## Explicación de los Criterios Técnicos

### 1. ¿De dónde sale cada estadístico?

- **Asistencia ponderada (%)**:
  $$\text{Asistencia Ponderada} = 100 \times \frac{\sum \text{presentes}}{\sum \text{inscritos}}$$
  Se calcula sumando el total de alumnos presentes dividido entre la suma total de inscritos del conjunto de registros filtrados (cuando $\sum \text{inscritos} > 0$). Esto garantiza que grupos con mayor matrícula tengan el peso correspondiente y no se distorsione el indicador promediando porcentajes aislados. Si no hay registros o denominador, muestra 0% o «Sin datos».
- **Promedio de calificación**:
  $$\text{Promedio Global} = \frac{\sum \text{promedio}}{N}$$
  Media aritmética de las calificaciones registradas para los $N$ registros en la vista activa.
- **Tasa de entregas (%)**:
  $$\text{Tasa de Entregas} = 100 \times \frac{\sum \text{actividadesEntregadas}}{\sum \text{actividadesProgramadas}}$$
  Permite monitorear el porcentaje de cumplimiento en tareas escolares.
- **Dona presentes vs ausentes**:
  Compara la proporción de $\sum \text{presentes}$ frente a $\sum (\text{inscritos} - \text{presentes})$.

### 2. ¿Cómo se validan CSV y registros duplicados?

- **En el Frontend (Papa Parse + `CsvService`)**:
  - Al cargar el archivo con `Papa.parse(file, { header: true, skipEmptyLines: true })`, se valida cada fila:
    - Fecha con formato ISO `YYYY-MM-DD`.
    - Grupo/Materia con texto válido ($\le 20$ caracteres).
    - Inscritos $> 0$.
    - Presentes $\le$ Inscritos: si $\text{presentes} > \text{inscritos}$, la fila se rechaza y se reporta en una lista de errores con alerta visual sin provocar fallo en la aplicación.
    - Promedio en rango de 0 a 100.
    - Actividades entregadas $\le$ programadas.
  - Los duplicados en memoria se previenen verificando si ya existe un registro con la misma clave `fecha + grupo`.
- **En el Backend (PHP + MySQL PDO)**:
  - En la base de datos se definió `UNIQUE KEY uq_fecha_grupo (fecha, grupo)`.
  - El endpoint de importación (`import.php`) evalúa cada fila individualmente y registra duplicados o errores en un arreglo `errores: []`, insertando las filas válidas sin perder el lote completo.

### 3. ¿Cómo se liberaron las instancias ECharts al navegar?

- **Liberación de recursos (`chart.dispose()`)**:
  En el hook `ngOnDestroy()` de `tab1.page.ts`, se invoca `this.barChart?.dispose()`, `this.pieChart?.dispose()` y `this.lineChart?.dispose()`. Esto destruye los lienzos canvas y cancela listeners en el DOM para evitar fugas de memoria (_memory leaks_) en el dispositivo móvil al cambiar de pestaña.
- **Redimensionamiento adaptativo (`chart.resize()`)**:
  En cada navegación hacia la vista (`ionViewDidEnter()`) y ante cambios de tamaño o giro de pantalla (`@HostListener('window:resize')`), se llama automáticamente a `chart.resize()` para que las 3 gráficas mantengan su diseño responsivo.
