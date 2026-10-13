# Contrato PHP/JSON · DataVision

Base Android ejemplo: `http://192.168.1.151:80/datavision/api`.

### GET `health.php`
**200:** `{"ok":true,"service":"api","database":"connected"}`.

### GET `indicadores/list.php?grupo=2A&desde=2026-09-01&hasta=2026-09-30`
Filtros opcionales. Devuelve **200**:
`{"ok":true,"items":[{"id":1,"fecha":"2026-09-01","grupo":"2A","inscritos":30,"presentes":27,"promedio":86.5,"actividadesProgramadas":30,"actividadesEntregadas":24}]}`.

### POST `indicadores/create.php`
`Content-Type: application/json`, ejemplo:
`{"fecha":"2026-10-13","grupo":"2A","inscritos":30,"presentes":27,"promedio":85.2,"actividadesProgramadas":30,"actividadesEntregadas":26,"origen":"manual"}`.
**201:** `{"ok":true,"id":20}`. **409:** fecha + grupo duplicados. **422:** fila inválida.

### POST `indicadores/import.php`
`Content-Type: application/json`, ejemplo:
`{"items":[{"fecha":"2026-10-14","grupo":"2B","inscritos":28,"presentes":24,"promedio":81.5,"actividadesProgramadas":28,"actividadesEntregadas":22,"origen":"csv"}]}`.
**200:** `{"ok":true,"insertados":1,"rechazados":0,"errores":[]}`.
La API debe validar cada fila, operar con transacciones o proceso controlado y reportar duplicados sin perder todas las filas válidas.

## Validación obligatoria
`fecha` ISO `YYYY-MM-DD`, `grupo` 1–20 caracteres, `inscritos > 0`, `0 ≤ presentes ≤ inscritos`, `0 ≤ promedio ≤ 100`, `0 ≤ actividadesEntregadas ≤ actividadesProgramadas`.
Emplear PDO parametrizado; nunca SQL concatenado.
