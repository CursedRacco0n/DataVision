# Proyecto 6 · DataVision: Sistema de Visualización Interactiva de Indicadores Académicos

Aplicación móvil híbrida desarrollada con **Ionic Framework (Angular Standalone)**, **Apache ECharts**, **Papa Parse**, **Axios** y backend en **PHP / MySQL**.

---

## 📁 Código del Proyecto
Todo el código fuente se encuentra en la carpeta [`06_DataVision/`](./06_DataVision/):
- **Frontend Ionic:** [`06_DataVision/datavision/`](./06_DataVision/datavision/)
- **Backend PHP y Endpoints:** [`06_DataVision/backend_starter/`](./06_DataVision/backend_starter/) y [`06_DataVision/api_indicadores.php`](./06_DataVision/api_indicadores.php)
- **Base de Datos:** [`06_DataVision/schema.sql`](./06_DataVision/schema.sql)
- **Bitácora de IA:** [`06_DataVision/IA_USADA.md`](./06_DataVision/IA_USADA.md)

---

## 🌐 Trabajo Colaborativo en Equipo (Sin mover puertos de XAMPP)

### 1. Autodetección de Puertos MySQL
El backend PHP incluye sondeo automático de puertos (`3306`, `3304`, `3307`). No importa qué puerto use la máquina de cada integrante, el backend se conecta de forma transparente.

### 2. Compartir la Base de Datos con Ngrok (Recomendado)
Para que un solo compañero mantenga encendida la base de datos MySQL y todos los demás se conecten desde sus computadoras o celulares sin instalar nada adicional:

1. **Host (quien tiene MySQL en XAMPP):**
   ```bash
   cd 06_DataVision
   php -S 0.0.0.0:8000 api_indicadores.php
   ```
2. **Crear el túnel:**
   ```bash
   npx ngrok http 8000
   ```
   Ngrok mostrará una URL pública como: `https://xxxx-xxxx.ngrok-free.app`
3. **Conexión en la App:**
   Cada compañero abre su app Ionic (`ionic serve`), va a la **Pestaña 4 ("Datos / MySQL")**, pega la URL de ngrok:
   ```text
   https://xxxx-xxxx.ngrok-free.app/api_indicadores.php
   ```
   Presiona **"Guardar URL"** y **"Probar Conexión"**. Todos estarán sincronizando la misma base de datos en tiempo real.

---

## 🚀 Inicio Rápido Local

### 1. Backend PHP
```bash
cd 06_DataVision
php -S 0.0.0.0:8000 api_indicadores.php
```

### 2. Frontend Ionic
```bash
cd 06_DataVision/datavision
npm install
npm start
```
