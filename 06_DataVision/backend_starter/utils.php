<?php
declare(strict_types=1);
// CORS permisivo para desarrollo híbrido móvil (Capacitor / Ionic / Ngrok / LAN)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: {$origin}");
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With, ngrok-skip-browser-warning');
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
function reply(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function json_body(): array {
    $raw = file_get_contents('php://input') ?: '';
    $raw = preg_replace('/^\xEF\xBB\xBF/', '', trim($raw));
    $data = json_decode($raw, true);
    if (!is_array($data)) reply(400, ['ok' => false, 'error' => 'JSON no válido']);
    return $data;
}
