CREATE DATABASE IF NOT EXISTS datavision_academico
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE datavision_academico;

CREATE TABLE indicadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  grupo VARCHAR(20) NOT NULL,
  inscritos SMALLINT UNSIGNED NOT NULL,
  presentes SMALLINT UNSIGNED NOT NULL,
  promedio DECIMAL(5,2) NOT NULL,
  actividades_programadas SMALLINT UNSIGNED NOT NULL,
  actividades_entregadas SMALLINT UNSIGNED NOT NULL,
  origen ENUM('manual','csv') NOT NULL DEFAULT 'manual',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fecha_grupo (fecha, grupo),
  INDEX ix_grupo_fecha (grupo, fecha),
  CONSTRAINT ck_asistencia CHECK (presentes <= inscritos),
  CONSTRAINT ck_promedio CHECK (promedio >= 0 AND promedio <= 100),
  CONSTRAINT ck_actividades CHECK (actividades_entregadas <= actividades_programadas)
);
-- Datos de prueba: fechas y grupos ficticios, únicamente para arrancar la interfaz.
-- El estudiante debe generar y recuperar un registro NUEVO desde PHP.
INSERT INTO indicadores
 (fecha, grupo, inscritos, presentes, promedio, actividades_programadas, actividades_entregadas, origen) VALUES
 ('2026-09-01','2A',30,27,86.5,30,24,'manual'),
 ('2026-09-02','2A',30,25,84.0,30,23,'manual'),
 ('2026-09-03','2A',30,28,89.0,30,26,'manual'),
 ('2026-09-04','2A',30,29,90.0,30,28,'manual'),
 ('2026-09-01','2B',28,23,78.0,28,20,'manual'),
 ('2026-09-02','2B',28,24,79.0,28,22,'manual'),
 ('2026-09-03','2B',28,22,76.0,28,19,'manual'),
 ('2026-09-04','2B',28,25,81.0,28,22,'manual'),
 ('2026-09-01','2C',26,24,92.0,26,25,'manual'),
 ('2026-09-02','2C',26,25,93.0,26,24,'manual'),
 ('2026-09-03','2C',26,23,90.0,26,22,'manual'),
 ('2026-09-04','2C',26,24,91.0,26,25,'manual');
