<?php
declare(strict_types=1);
function db(): PDO {
    $path = __DIR__ . '/config.php';
    if (!is_file($path)) { throw new RuntimeException('Falta backend_starter/config.php'); }
    $c = require $path;
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
      $c['host'], $c['port'], $c['database']);
    return new PDO($dsn, $c['username'], $c['password'], [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}
