# Proyecto 6 · DataVision Académico: Sistema de Visualización Interactiva

Aplicación móvil híbrida de alto rendimiento desarrollada con **Ionic 9** y **Angular Standalone Components**, diseñada para la coordinación académica con el prototipo móvil **"Progress Analytics"**.

---

## 🚀 Arquitectura Técnica y Tecnologías
- **Framework Móvil:** Ionic 9 + Angular 19/20 Standalone + Ionicons.
- **Gráficas Interactivas:** Apache ECharts (`echarts`) con degradados visuales, tooltips dinámicos, redimensionamiento adaptativo (`chart.resize()`) y liberación de recursos (`chart.dispose()`).
- **Motor CSV:** Papa Parse (`papaparse`) para carga de archivos, análisis sintáctico en el cliente, validación fila a fila y exportación.
- **Cliente HTTP:** Axios configurado en `ApiService` con timeouts y verificación de salud (`health.php`).
- **Backend:** PHP 8+ con PDO parametrizado y autodetección de puertos.
- **Base de Datos:** MySQL (`datavision_academico`) con restricciones CHECK y claves únicas (`uq_fecha_grupo`).

---

## 📁 Estructura del Proyecto

```text
06_DataVision/
├── backend_starter/
│   ├── api/
│   │   ├── health.php                # Salud de la API y verificación de conexión MySQL
│   │   └── indicadores/
│   │       ├── list.php              # GET con filtros por fecha, grupo, año y mes
│   │       ├── create.php            # POST inserción individual con validación
│   │       └── import.php            # POST importación masiva por lote con control de errores
│   ├── config.php                    # Credenciales base de MySQL
│   ├── db.php                        # PDO inteligente con sondeo automático de puertos (3306, 3304, 3307)
│   └── utils.php                     # CORS, JSON helper y respuestas HTTP
├── api_indicadores.php               # Endpoint PHP unificado con router integrado
├── schema.sql                        # Script DDL de tabla indicadores y 12 registros de prueba
├── datos_ejemplo.csv                 # Dataset de prueba válido
├── datos_con_errores.csv             # Dataset con errores para probar validaciones (presentes > inscritos)
├── IA_USADA.md                       # Bitácora técnica y justificación de rúbrica
├── datavision/                       # Aplicación Móvil Ionic Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── models/
│   │   │   │   └── indicador.model.ts  # Interfaces y modelos de datos
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts      # Cliente HTTP Axios
│   │   │   │   ├── csv.service.ts      # Parser y validador Papa Parse
│   │   │   │   └── data.service.ts     # Estado reactivo global (RxJS) y cálculo matemático de KPIs
│   │   │   ├── tab1/                   # Dashboard "Analytics" (3 gráficas ECharts y KPIs)
│   │   │   ├── tab2/                   # "Importar CSV" (Carga y validación en vivo)
│   │   │   ├── tab3/                   # "Nuevo Registro" (Formulario manual e ion-range)
│   │   │   ├── tab4/                   # "Datos / MySQL" (Búsqueda, Health Check y Exportar)
│   │   │   └── tabs/                   # Barra de navegación inferior
│   │   ├── theme/
│   │   │   └── variables.scss          # Paleta visual Teal (#0d9488) y colores armónicos
│   │   └── global.scss                 # Estilos globales y tarjetas con bordes de 16px
│   └── package.json
```

---

## 🌐 Trabajo en Equipo en Diferentes Computadoras (Sin mover puertos de XAMPP)

Para que todos los integrantes del equipo puedan trabajar simultáneamente sin conflictos de puertos en XAMPP (`3306` vs `3304`) ni conflictos de Git:

### 1. Autodetección de Puertos MySQL (Automático)
El conector [`backend_starter/db.php`](backend_starter/db.php) y [`api_indicadores.php`](api_indicadores.php) sondean en orden los puertos `3306`, `3304`, `3307` y `3308`. Si tu MySQL corre en un puerto diferente al de tu compañero, **ambos se conectan automáticamente sin modificar ningún archivo**.

### 2. Ejecutar el Backend con el Servidor Embebido de PHP
No es necesario mover archivos a la carpeta `htdocs` de XAMPP. Desde la carpeta `06_DataVision`, ejecuta:
```bash
php -S 0.0.0.0:8000 api_indicadores.php
```
*(Al usar `0.0.0.0`, el backend escucha tanto en tu PC como en cualquier dispositivo conectado a la misma red WiFi).*

---

### 🚀 Compartir una sola Base de Datos con Ngrok (Recomendado para el equipo)

Si una persona del equipo mantiene la base de datos MySQL encendida y quieren que los demás integrantes se conecten sin tener que instalar o configurar MySQL en sus computadoras:

#### Paso 1: La persona Host levanta el backend PHP
Asegúrate de tener MySQL encendido en XAMPP y ejecuta:
```bash
php -S 0.0.0.0:8000 api_indicadores.php
```

#### Paso 2: Crear el túnel público con Ngrok
En otra terminal, corre:
```bash
npx ngrok http 8000
```
Ngrok generará una URL pública segura accesible desde cualquier red de internet, por ejemplo:
```text
Forwarding  https://abcd-123-45.ngrok-free.app -> http://localhost:8000
```

#### Paso 3: Conectar la App Móvil
Cualquier compañero en su propia computadora, celular o tablet:
1. Abre la aplicación Ionic (`ionic serve` o en el dispositivo).
2. Entra a la **Pestaña 4: "Datos / MySQL"**.
3. En el campo **"URL del Backend"**, pega la URL de ngrok:
   ```text
   https://abcd-123-45.ngrok-free.app/api_indicadores.php
   ```
4. Presiona **"Guardar URL"** y luego **"Probar Conexión (Health)"**.
5. ¡Listo! La píldora cambiará a **Online** en verde y todo el equipo estará consultando e insertando registros en la misma base de datos en tiempo real.

*(Nota: Esta URL se guarda en el `localStorage` de cada dispositivo, por lo que nunca interferirá con los cambios de Git de tus compañeros).*

---

## 🛠️ Guía Rápida de Instalación Local

### 1. Iniciar Base de Datos Local
1. Abre XAMPP y activa **MySQL**.
2. Importa el archivo `schema.sql`:
   ```bash
   mysql -u root -p < schema.sql
   ```

### 2. Iniciar la Aplicación Móvil Ionic
```bash
cd datavision

# Instalar dependencias
npm install

# Compilar producción
npm run build

# Iniciar servidor de desarrollo en navegador móvil
npm start
# O con Ionic CLI:
ionic serve
```

---

## 📱 Pantallas de la Aplicación

1. **Analytics (Dashboard "Progress Analytics"):**
   - Barra superior de filtros: Año (`2024`, `2025`, `2026`), Mes (`Enero` a `Diciembre`) y Materia/Grupo (`Maths`, `English`, `Physics`, `Chemistry`, `Biology`, `2A`, `2B`, `2C`).
   - 4 Tarjetas KPI: Asistencia ponderada (%), Promedio general (0-100), Total de registros y Tasa de entregas (%).
   - **Tarjeta 1 ("Monthly Progress"):** Gráfica de barras agrupadas ECharts (`Attendance` #38bdf8 vs `Progress Test` #8b5cf6).
   - **Tarjeta 2 ("Subject Time Per Token"):** Gráfica de pastel/dona ECharts con toggle de Materias vs Asistencia (Presentes vs Ausentes).
   - **Tarjeta 3 ("Evolución y Tendencia Académica"):** Gráfica de líneas suavizadas (`smooth: true`) con degradados de área.
   - Auto-redimensionamiento reactivo (`chart.resize()`) al rotar pantalla o navegar entre tabs.

2. **Importar CSV:**
   - Selector táctil de archivos `.csv`.
   - Botón **"Cargar Ejemplo Válido"** (`datos_ejemplo.csv`).
   - Botón **"Probar CSV con Errores"** (`datos_con_errores.csv`), demostrando la detección de filas con `presentes > inscritos` o notas $> 100$.
   - Previsualización en pestañas (Válidas / Con Errores) y botón **"Sincronizar con MySQL"** que actualiza las 3 gráficas al instante.

3. **Nuevo Registro:**
   - Formulario reactivo para capturar fecha, grupo/materia, inscritos y presentes.
   - Control deslizante `ion-range` con pin en tiempo real para el promedio escolar.
   - Cálculo automático de % de asistencia y % de cumplimiento de tareas.
   - Validación preventiva: bloquea el guardado si `presentes > inscritos`.

4. **Datos / MySQL:**
   - Monitor de estado del servidor PHP con Health Check interactivo (`health.php`).
   - Buscador en tiempo real por materia, fecha o grupo.
   - Filtros por chips (*Todos*, *Manual*, *CSV*).
   - Botón para **Exportar a CSV** descargable generado con `Papa.unparse`.
