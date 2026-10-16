<?php
/**
 * Configuración de conexión automática a MySQL (XAMPP / Laragon / Docker / MariaDB)
 * Detecta dinámicamente el host y el puerto activo en el equipo de cada integrante del equipo.
 */

// 1. Soporte para archivo de configuración local independiente (si existe, tiene prioridad)
$localConfig = __DIR__ . '/config.local.php';
if (is_file($localConfig)) {
    $custom = require $localConfig;
    if (is_array($custom)) {
        return $custom;
    }
}

// 2. Detección automática del Host
$host = getenv('DB_HOST') ?: (getenv('MYSQL_HOST') ?: '127.0.0.1');
$database = getenv('DB_NAME') ?: (getenv('MYSQL_DATABASE') ?: 'datavision_academico');
$username = getenv('DB_USER') ?: (getenv('MYSQL_USER') ?: 'root');
$password = getenv('DB_PASS') !== false ? (string)getenv('DB_PASS') : (getenv('MYSQL_PASSWORD') !== false ? (string)getenv('MYSQL_PASSWORD') : '');

// 3. Detección automática del Puerto MySQL
$detectPort = function(string $host, string $user, string $pass, string $db): int {
    // Si se definió explícitamente por variable de entorno, respetarlo
    $envPort = getenv('DB_PORT') ?: (getenv('MYSQL_PORT') ?: null);
    if ($envPort && is_numeric($envPort)) {
        return (int)$envPort;
    }

    // Puertos habituales de MySQL / MariaDB en XAMPP, Laragon, Docker y Workbench
    $candidatePorts = [3306, 3307, 3304, 3308, 3309];

    // Fase 1: Probar conexión directa con la base de datos del proyecto
    foreach ($candidatePorts as $p) {
        $sock = @fsockopen($host, $p, $errno, $errstr, 0.05);
        if (!$sock) {
            continue;
        }
        fclose($sock);

        try {
            $dsn = "mysql:host={$host};port={$p};dbname={$db};charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 1,
            ]);
            return $p;
        } catch (Throwable $e) {
            continue;
        }
    }

    // Fase 2: Probar conexión al motor MySQL (por si la BD aún no ha sido importada)
    foreach ($candidatePorts as $p) {
        $sock = @fsockopen($host, $p, $errno, $errstr, 0.05);
        if (!$sock) {
            continue;
        }
        fclose($sock);

        try {
            $dsn = "mysql:host={$host};port={$p};charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 1,
            ]);
            return $p;
        } catch (Throwable $e) {
            continue;
        }
    }

    // Puerto por defecto si no responde ninguna instancia
    return 3306;
};

$port = $detectPort($host, $username, $password, $database);

return [
    'host' => $host,
    'port' => $port,
    'database' => $database,
    'username' => $username,
    'password' => $password,
];

