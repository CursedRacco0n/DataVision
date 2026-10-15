<?php
declare(strict_types=1);

/**
 * Conexión PDO inteligente con autodetección de puertos MySQL (3306, 3304, 3307)
 * Permite que el proyecto funcione en cualquier computadora sin reconfigurar XAMPP.
 */
function db(): PDO {
    // 1. Soporte para archivo de configuración local independiente (opcional)
    $localConfig = __DIR__ . '/config.local.php';
    $baseConfig = __DIR__ . '/config.php';

    if (is_file($localConfig)) {
        $c = require $localConfig;
    } elseif (is_file($baseConfig)) {
        $c = require $baseConfig;
    } else {
        throw new RuntimeException('Falta backend_starter/config.php');
    }

    $host = $c['host'] ?? '127.0.0.1';
    $database = $c['database'] ?? 'datavision_academico';
    $username = $c['username'] ?? 'root';
    $password = $c['password'] ?? '';

    // Lista de puertos a intentar: el configurado primero, luego los puertos comunes de XAMPP / MariaDB
    $puertoConfigurado = (int)($c['port'] ?? 3306);
    $puertosAIntentar = array_unique([$puertoConfigurado, 3306, 3304, 3307, 3308]);

    $pdoOptions = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_TIMEOUT => 2, // Timeout rápido para probar el siguiente puerto si no responde
    ];

    $ultimoError = null;
    foreach ($puertosAIntentar as $puerto) {
        try {
            $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, $puerto, $database);
            $pdo = new PDO($dsn, $username, $password, $pdoOptions);
            // Si la conexión es exitosa, retornar inmediatamente
            return $pdo;
        } catch (Throwable $e) {
            $ultimoError = $e;
            continue;
        }
    }

    // Si fallaron todos los puertos, lanzar excepción informativa
    throw new RuntimeException(
        "No se pudo conectar a MySQL en los puertos (" . implode(', ', $puertosAIntentar) . 
        "). Verifique que MySQL esté iniciado en XAMPP. Detalle: " . ($ultimoError ? $ultimoError->getMessage() : '')
    );
}
