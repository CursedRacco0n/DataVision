<?php
declare(strict_types=1);

/**
 * DataVision - Endpoint unificado / router PHP para desarrollo rápido
 * Permite ejecutar: php -S 0.0.0.0:8000 api_indicadores.php
 * O consumir mediante: http://localhost:8000/api_indicadores.php?action=list
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function send_json(int $code, array $payload): void {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Configuración de BD
$dbConfig = [
    'host' => '127.0.0.1',
    'port' => 3306,
    'database' => 'datavision_academico',
    'username' => 'root',
    'password' => ''
];

// Si existe backend_starter/config.php, usarlo
if (file_exists(__DIR__ . '/backend_starter/config.php')) {
    $custom = require __DIR__ . '/backend_starter/config.php';
    if (is_array($custom)) $dbConfig = array_merge($dbConfig, $custom);
}

function get_pdo(array $cfg): PDO {
    $host = $cfg['host'] ?? '127.0.0.1';
    $database = $cfg['database'] ?? 'datavision_academico';
    $username = $cfg['username'] ?? 'root';
    $password = $cfg['password'] ?? '';
    $configuredPort = (int)($cfg['port'] ?? 3306);
    $ports = array_unique([$configuredPort, 3306, 3304, 3307, 3308]);

    $lastError = null;
    foreach ($ports as $port) {
        try {
            $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, $port, $database);
            return new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => 2,
            ]);
        } catch (Throwable $e) {
            $lastError = $e;
        }
    }
    throw new RuntimeException("MySQL no disponible en puertos (" . implode(', ', $ports) . "). Detalle: " . ($lastError ? $lastError->getMessage() : ''));
}

$action = $_GET['action'] ?? '';
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '';

if ($action === 'health' || str_ends_with($uri, 'health.php') || $action === '') {
    if ($action === '' && $_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['grupo']) && !isset($_GET['desde'])) {
        try {
            $pdo = get_pdo($dbConfig);
            $pdo->query('SELECT 1');
            send_json(200, ['ok' => true, 'service' => 'api', 'database' => 'connected', 'info' => 'DataVision Academic API']);
        } catch (Throwable $e) {
            send_json(200, ['ok' => false, 'service' => 'api', 'database' => 'disconnected', 'error' => $e->getMessage()]);
        }
    }
}

// GET list
if ($action === 'list' || str_ends_with($uri, 'list.php') || ($_SERVER['REQUEST_METHOD'] === 'GET' && ($action === 'list' || isset($_GET['grupo']) || isset($_GET['desde']) || isset($_GET['anio'])))) {
    try {
        $pdo = get_pdo($dbConfig);
        $where = [];
        $params = [];

        if (!empty($_GET['grupo'])) {
            $where[] = 'grupo = :grupo';
            $params[':grupo'] = trim((string)$_GET['grupo']);
        }
        if (!empty($_GET['desde'])) {
            $where[] = 'fecha >= :desde';
            $params[':desde'] = trim((string)$_GET['desde']);
        }
        if (!empty($_GET['hasta'])) {
            $where[] = 'fecha <= :hasta';
            $params[':hasta'] = trim((string)$_GET['hasta']);
        }
        if (!empty($_GET['anio']) && is_numeric($_GET['anio'])) {
            $where[] = 'YEAR(fecha) = :anio';
            $params[':anio'] = (int)$_GET['anio'];
        }

        $sql = 'SELECT id, fecha, grupo, inscritos, presentes, CAST(promedio AS DECIMAL(5,2)) as promedio, 
                       actividades_programadas, actividades_entregadas, origen FROM indicadores';
        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY fecha ASC, grupo ASC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $items = array_map(static function ($r) {
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
        }, $stmt->fetchAll());

        send_json(200, ['ok' => true, 'total' => count($items), 'items' => $items]);
    } catch (Throwable $e) {
        send_json(500, ['ok' => false, 'error' => $e->getMessage()]);
    }
}

// POST create or import
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw ?: '', true);
    if (!is_array($body)) {
        send_json(400, ['ok' => false, 'error' => 'JSON inválido']);
    }

    try {
        $pdo = get_pdo($dbConfig);

        // Importación de arreglo
        if (isset($body['items']) && is_array($body['items'])) {
            $insertados = 0;
            $rechazados = 0;
            $errores = [];

            $checkStmt = $pdo->prepare('SELECT id FROM indicadores WHERE fecha = :fecha AND grupo = :grupo LIMIT 1');
            $insertStmt = $pdo->prepare('INSERT INTO indicadores 
                (fecha, grupo, inscritos, presentes, promedio, actividades_programadas, actividades_entregadas, origen) 
                VALUES (:fecha, :grupo, :inscritos, :presentes, :promedio, :act_prog, :act_ent, :origen)');

            foreach ($body['items'] as $idx => $r) {
                $fila = $idx + 1;
                $f = trim((string)($r['fecha'] ?? ''));
                $g = trim((string)($r['grupo'] ?? ''));
                $ins = (int)($r['inscritos'] ?? 0);
                $pres = (int)($r['presentes'] ?? 0);
                $prom = (float)($r['promedio'] ?? 0);
                $ap = (int)($r['actividadesProgramadas'] ?? $r['actividades_programadas'] ?? 0);
                $ae = (int)($r['actividadesEntregadas'] ?? $r['actividades_entregadas'] ?? 0);

                if (!$f || !$g || $ins <= 0 || $pres < 0 || $pres > $ins || $prom < 0 || $prom > 100 || $ae > $ap) {
                    $rechazados++;
                    $errores[] = "Fila #{$fila}: Datos no válidos (verifique inscritos, presentes o promedio).";
                    continue;
                }

                $checkStmt->execute([':fecha' => $f, ':grupo' => $g]);
                if ($checkStmt->fetch()) {
                    $rechazados++;
                    $errores[] = "Fila #{$fila}: Duplicado ({$f} - {$g}).";
                    continue;
                }

                $insertStmt->execute([
                    ':fecha' => $f, ':grupo' => $g, ':inscritos' => $ins, ':presentes' => $pres,
                    ':promedio' => $prom, ':act_prog' => $ap, ':act_ent' => $ae, ':origen' => 'csv'
                ]);
                $insertados++;
            }

            send_json(200, ['ok' => true, 'insertados' => $insertados, 'rechazados' => $rechazados, 'errores' => $errores]);
        }

        // Creación individual
        $fecha = trim((string)($body['fecha'] ?? ''));
        $grupo = trim((string)($body['grupo'] ?? ''));
        $inscritos = (int)($body['inscritos'] ?? 0);
        $presentes = (int)($body['presentes'] ?? 0);
        $promedio = (float)($body['promedio'] ?? 0);
        $ap = (int)($body['actividadesProgramadas'] ?? $body['actividades_programadas'] ?? 0);
        $ae = (int)($body['actividadesEntregadas'] ?? $body['actividades_entregadas'] ?? 0);
        $origen = $body['origen'] ?? 'manual';

        if (!$fecha || !$grupo || $inscritos <= 0 || $presentes > $inscritos || $promedio < 0 || $promedio > 100 || $ae > $ap) {
            send_json(422, ['ok' => false, 'error' => 'Datos inválidos. Verifique que presentes <= inscritos y promedio entre 0 y 100.']);
        }

        $checkStmt = $pdo->prepare('SELECT id FROM indicadores WHERE fecha = :fecha AND grupo = :grupo LIMIT 1');
        $checkStmt->execute([':fecha' => $fecha, ':grupo' => $grupo]);
        if ($checkStmt->fetch()) {
            send_json(409, ['ok' => false, 'error' => "Ya existe registro para la fecha {$fecha} y grupo {$grupo}."]);
        }

        $insertStmt = $pdo->prepare('INSERT INTO indicadores 
            (fecha, grupo, inscritos, presentes, promedio, actividades_programadas, actividades_entregadas, origen) 
            VALUES (:fecha, :grupo, :inscritos, :presentes, :promedio, :act_prog, :act_ent, :origen)');
        $insertStmt->execute([
            ':fecha' => $fecha, ':grupo' => $grupo, ':inscritos' => $inscritos, ':presentes' => $presentes,
            ':promedio' => $promedio, ':act_prog' => $ap, ':act_ent' => $ae, ':origen' => $origen
        ]);

        send_json(201, ['ok' => true, 'id' => (int)$pdo->lastInsertId(), 'mensaje' => 'Registro insertado correctamente']);
    } catch (Throwable $e) {
        send_json(500, ['ok' => false, 'error' => $e->getMessage()]);
    }
}

send_json(404, ['ok' => false, 'error' => 'Endpoint o acción no encontrada']);
