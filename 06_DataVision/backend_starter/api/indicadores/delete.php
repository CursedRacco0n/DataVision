<?php
declare(strict_types=1);
require_once __DIR__ . '/../../utils.php';
require_once __DIR__ . '/../../db.php';
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    header('Allow: DELETE, OPTIONS');
    reply(405, ['ok' => false, 'error' => 'Se requiere DELETE']);
}
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
if (!$id) reply(422, ['ok' => false, 'error' => 'ID inválido']);
try {
    $stmt = db()->prepare('DELETE FROM indicadores WHERE id = :id');
    $stmt->execute([':id' => $id]);
    if (!$stmt->rowCount()) reply(404, ['ok' => false, 'error' => 'Registro no encontrado']);
    reply(200, ['ok' => true, 'eliminados' => 1]);
} catch (Throwable $e) {
    error_log((string)$e);
    reply(500, ['ok' => false, 'error' => 'Error al eliminar el registro']);
}
