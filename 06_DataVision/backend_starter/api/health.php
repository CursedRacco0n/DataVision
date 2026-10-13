<?php
require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../db.php';
try {
    $pdo = db();
    $pdo->query('SELECT 1');
    reply(200, ['ok' => true, 'service' => 'api', 'database' => 'connected']);
} catch (Throwable $e) {
    // No se devuelven contraseñas, DSN o detalles internos al cliente.
    error_log((string)$e);
    reply(500, ['ok' => false, 'error' => 'No se pudo conectar a la base de datos']);
}
