<?php
declare(strict_types=1);

require_once __DIR__ . '/../../utils.php';
require_once __DIR__ . '/../../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    reply(405, ['ok' => false, 'error' => 'Método no permitido. Se requiere POST.']);
}

$body = json_body();

// Normalización de campos (soporta camelCase o snake_case)
$fecha = trim((string)($body['fecha'] ?? ''));
$grupo = trim((string)($body['grupo'] ?? ''));
$inscritos = isset($body['inscritos']) ? (int)$body['inscritos'] : null;
$presentes = isset($body['presentes']) ? (int)$body['presentes'] : null;
$promedio = isset($body['promedio']) ? (float)$body['promedio'] : null;
$actProgramadas = isset($body['actividadesProgramadas']) 
    ? (int)$body['actividadesProgramadas'] 
    : (isset($body['actividades_programadas']) ? (int)$body['actividades_programadas'] : null);
$actEntregadas = isset($body['actividadesEntregadas']) 
    ? (int)$body['actividadesEntregadas'] 
    : (isset($body['actividades_entregadas']) ? (int)$body['actividades_entregadas'] : null);
$origen = in_array($body['origen'] ?? '', ['manual', 'csv'], true) ? $body['origen'] : 'manual';

// Validaciones obligatorias
$errores = [];

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha) || !strtotime($fecha)) {
    $errores[] = 'Formato de fecha inválido. Debe ser YYYY-MM-DD.';
}
if ($grupo === '' || mb_strlen($grupo) > 20) {
    $errores[] = 'El grupo/materia debe tener entre 1 y 20 caracteres.';
}
if ($inscritos === null || $inscritos <= 0) {
    $errores[] = 'Los alumnos inscritos deben ser mayores a 0.';
}
if ($presentes === null || $presentes < 0 || ($inscritos !== null && $presentes > $inscritos)) {
    $errores[] = 'Los alumnos presentes deben estar entre 0 y el total de inscritos.';
}
if ($promedio === null || $promedio < 0 || $promedio > 100) {
    $errores[] = 'El promedio debe estar en el rango de 0 a 100.';
}
if ($actProgramadas === null || $actProgramadas < 0) {
    $errores[] = 'Las actividades programadas deben ser 0 o mayores.';
}
if ($actEntregadas === null || $actEntregadas < 0 || ($actProgramadas !== null && $actEntregadas > $actProgramadas)) {
    $errores[] = 'Las actividades entregadas deben estar entre 0 y las programadas.';
}

if (!empty($errores)) {
    reply(422, ['ok' => false, 'error' => implode(' | ', $errores), 'detalles' => $errores]);
}

try {
    $pdo = db();

    // Verificación de duplicado (fecha + grupo)
    $checkStmt = $pdo->prepare('SELECT id FROM indicadores WHERE fecha = :fecha AND grupo = :grupo LIMIT 1');
    $checkStmt->execute([':fecha' => $fecha, ':grupo' => $grupo]);
    if ($checkStmt->fetch()) {
        reply(409, ['ok' => false, 'error' => "Ya existe un registro para la fecha {$fecha} y el grupo {$grupo}."]);
    }

    $insertSql = 'INSERT INTO indicadores 
        (fecha, grupo, inscritos, presentes, promedio, actividades_programadas, actividades_entregadas, origen) 
        VALUES (:fecha, :grupo, :inscritos, :presentes, :promedio, :act_prog, :act_ent, :origen)';

    $stmt = $pdo->prepare($insertSql);
    $stmt->execute([
        ':fecha' => $fecha,
        ':grupo' => $grupo,
        ':inscritos' => $inscritos,
        ':presentes' => $presentes,
        ':promedio' => $promedio,
        ':act_prog' => $actProgramadas,
        ':act_ent' => $actEntregadas,
        ':origen' => $origen,
    ]);

    $newId = (int)$pdo->lastInsertId();

    reply(201, [
        'ok' => true,
        'id' => $newId,
        'mensaje' => 'Registro creado exitosamente'
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        reply(409, ['ok' => false, 'error' => 'Registro duplicado para fecha y grupo.']);
    }
    error_log((string)$e);
    reply(500, ['ok' => false, 'error' => 'Error al guardar en la base de datos: ' . $e->getMessage()]);
}
