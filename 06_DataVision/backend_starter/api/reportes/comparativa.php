<?php
declare(strict_types=1);

/**
 * DataVision - Nuevo endpoint independiente y de solo lectura.
 * GET /api/reportes/comparativa.php?grupo=2A&desde=2026-09-01&hasta=2026-09-30
 * No modifica la tabla, los endpoints existentes ni el frontend Ionic.
 */
require_once __DIR__ . '/../../utils.php';
require_once __DIR__ . '/../../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET, OPTIONS');
    reply(405, ['ok' => false, 'error' => 'Este reporte solo admite GET']);
}

// Limitar tipos de parámetros y validar completamente las fechas.
foreach (['grupo', 'desde', 'hasta'] as $clave) {
    if (isset($_GET[$clave]) && !is_string($_GET[$clave])) {
        reply(422, ['ok' => false, 'error' => "El parámetro {$clave} debe ser texto"]);
    }
}

$grupo = trim($_GET['grupo'] ?? '');
$desde = trim($_GET['desde'] ?? '');
$hasta = trim($_GET['hasta'] ?? '');

if ($grupo !== '' && (strlen($grupo) > 80 || count(preg_split('//u', $grupo, -1, PREG_SPLIT_NO_EMPTY) ?: []) > 20)) {
    reply(422, ['ok' => false, 'error' => 'El grupo excede el máximo de 20 caracteres']);
}
foreach (['desde' => $desde, 'hasta' => $hasta] as $clave => $fecha) {
    if ($fecha === '') continue;
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $fecha);
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha) || !$d || $d->format('Y-m-d') !== $fecha) {
        reply(422, ['ok' => false, 'error' => "Fecha {$clave} inválida. Usa YYYY-MM-DD"]);
    }
}
if ($desde !== '' && $hasta !== '' && $desde > $hasta) {
    reply(422, ['ok' => false, 'error' => 'La fecha inicial no puede ser posterior a la final']);
}

$where = [];
$parametros = [];
if ($grupo !== '') {
    $where[] = 'grupo = :grupo';
    $parametros[':grupo'] = $grupo;
}
if ($desde !== '') {
    $where[] = 'fecha >= :desde';
    $parametros[':desde'] = $desde;
}
if ($hasta !== '') {
    $where[] = 'fecha <= :hasta';
    $parametros[':hasta'] = $hasta;
}

$sql = 'SELECT grupo, COUNT(*) AS registros,
               SUM(inscritos) AS inscritos,
               SUM(presentes) AS presentes,
               AVG(promedio) AS promedio,
               SUM(actividades_programadas) AS programadas,
               SUM(actividades_entregadas) AS entregadas
        FROM indicadores';
if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
$sql .= ' GROUP BY grupo ORDER BY grupo ASC';

try {
    $stmt = db()->prepare($sql);
    $stmt->execute($parametros);
    $rows = $stmt->fetchAll();

    $resumen = [
        'registros' => 0,
        'inscritos' => 0,
        'presentes' => 0,
        'ausentes' => 0,
        'actividadesProgramadas' => 0,
        'actividadesEntregadas' => 0,
        'asistenciaPonderada' => null,
        'promedioGeneral' => null,
        'tasaEntregas' => null,
    ];
    $acumuladoPromedios = 0.0;
    $grupos = [];
    foreach ($rows as $r) {
        $n = (int)$r['registros'];
        $inscritos = (int)$r['inscritos'];
        $presentes = (int)$r['presentes'];
        $programadas = (int)$r['programadas'];
        $entregadas = (int)$r['entregadas'];
        $promedio = (float)$r['promedio'];
        $acumuladoPromedios += $promedio * $n;

        $resumen['registros'] += $n;
        $resumen['inscritos'] += $inscritos;
        $resumen['presentes'] += $presentes;
        $resumen['ausentes'] += $inscritos - $presentes;
        $resumen['actividadesProgramadas'] += $programadas;
        $resumen['actividadesEntregadas'] += $entregadas;

        $grupos[] = [
            'grupo' => (string)$r['grupo'],
            'registros' => $n,
            'inscritos' => $inscritos,
            'presentes' => $presentes,
            'ausentes' => $inscritos - $presentes,
            'promedio' => round($promedio, 2),
            'asistenciaPonderada' => $inscritos > 0 ? round(100 * $presentes / $inscritos, 2) : null,
            'tasaEntregas' => $programadas > 0 ? round(100 * $entregadas / $programadas, 2) : null,
        ];
    }

    if ($resumen['inscritos'] > 0) {
        $resumen['asistenciaPonderada'] = round(100 * $resumen['presentes'] / $resumen['inscritos'], 2);
    }
    if ($resumen['registros'] > 0) {
        // AVG por registro, en concordancia con ENUNCIADO.md.
        $resumen['promedioGeneral'] = round($acumuladoPromedios / $resumen['registros'], 2);
    }
    if ($resumen['actividadesProgramadas'] > 0) {
        $resumen['tasaEntregas'] = round(100 * $resumen['actividadesEntregadas'] / $resumen['actividadesProgramadas'], 2);
    }

    reply(200, [
        'ok' => true,
        'filtros' => ['grupo' => $grupo ?: null, 'desde' => $desde ?: null, 'hasta' => $hasta ?: null],
        'resumen' => $resumen,
        'grupos' => $grupos,
    ]);
} catch (Throwable $e) {
    error_log('DataVision comparativa: ' . (string)$e);
    reply(500, ['ok' => false, 'error' => 'No se pudo generar el reporte. Verifica la conexión MySQL.']);
}
