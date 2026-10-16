<?php
declare(strict_types=1);

require_once __DIR__ . '/../../utils.php';
require_once __DIR__ . '/../../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    reply(405, ['ok' => false, 'error' => 'Método no permitido. Se requiere GET.']);
}

try {
    $pdo = db();

    $where = [];
    $params = [];

    foreach (['desde', 'hasta'] as $campo) {
        if (isset($_GET[$campo]) && $_GET[$campo] !== '') {
            $d = DateTimeImmutable::createFromFormat('!Y-m-d', (string)$_GET[$campo]);
            if (!$d || $d->format('Y-m-d') !== $_GET[$campo]) {
                reply(422, ['ok' => false, 'error' => "Fecha inválida en {$campo}"]);
            }
        }
    }
    if (isset($_GET['mes']) && $_GET['mes'] !== '' && (!ctype_digit((string)$_GET['mes']) || (int)$_GET['mes'] < 1 || (int)$_GET['mes'] > 12)) {
        reply(422, ['ok' => false, 'error' => 'Mes inválido']);
    }

    // Filtro por grupo o materia
    if (!empty($_GET['grupo'])) {
        $where[] = 'grupo = :grupo';
        $params[':grupo'] = trim((string)$_GET['grupo']);
    }

    // Filtro rango de fechas
    if (!empty($_GET['desde'])) {
        $where[] = 'fecha >= :desde';
        $params[':desde'] = trim((string)$_GET['desde']);
    }
    if (!empty($_GET['hasta'])) {
        $where[] = 'fecha <= :hasta';
        $params[':hasta'] = trim((string)$_GET['hasta']);
    }

    // Filtro por año opcional
    if (!empty($_GET['anio']) && is_numeric($_GET['anio'])) {
        $where[] = 'YEAR(fecha) = :anio';
        $params[':anio'] = (int)$_GET['anio'];
    }

    // Filtro por mes opcional (1 a 12)
    if (!empty($_GET['mes']) && is_numeric($_GET['mes'])) {
        $where[] = 'MONTH(fecha) = :mes';
        $params[':mes'] = (int)$_GET['mes'];
    }

    $sql = 'SELECT id, fecha, grupo, inscritos, presentes, CAST(promedio AS DECIMAL(5,2)) as promedio, 
                   actividades_programadas, actividades_entregadas, origen 
            FROM indicadores';

    if (!empty($where)) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }

    $sql .= ' ORDER BY fecha ASC, grupo ASC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Mapeo conforme a CONTRATO_API.md (camelCase)
    $items = array_map(static function (array $r): array {
        return [
            'id' => (int)$r['id'],
            'fecha' => (string)$r['fecha'],
            'grupo' => (string)$r['grupo'],
            'inscritos' => (int)$r['inscritos'],
            'presentes' => (int)$r['presentes'],
            'promedio' => (float)$r['promedio'],
            'actividadesProgramadas' => (int)$r['actividades_programadas'],
            'actividadesEntregadas' => (int)$r['actividades_entregadas'],
            'origen' => (string)$r['origen'],
        ];
    }, $rows);

    reply(200, [
        'ok' => true,
        'total' => count($items),
        'items' => $items
    ]);
} catch (Throwable $e) {
    error_log((string)$e);
    reply(500, ['ok' => false, 'error' => 'Error en consulta de base de datos']);
}
