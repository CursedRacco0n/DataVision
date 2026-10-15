<?php
declare(strict_types=1);

require_once __DIR__ . '/../../utils.php';
require_once __DIR__ . '/../../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    reply(405, ['ok' => false, 'error' => 'Método no permitido. Se requiere POST.']);
}

$body = json_body();
$items = $body['items'] ?? null;

if (!is_array($items) || empty($items)) {
    reply(422, ['ok' => false, 'error' => 'El cuerpo debe contener un arreglo no vacío de "items".']);
}

try {
    $pdo = db();

    $insertados = 0;
    $rechazados = 0;
    $errores = [];

    // Preparar sentencias reutilizables
    $checkStmt = $pdo->prepare('SELECT id FROM indicadores WHERE fecha = :fecha AND grupo = :grupo LIMIT 1');
    $insertStmt = $pdo->prepare('INSERT INTO indicadores 
        (fecha, grupo, inscritos, presentes, promedio, actividades_programadas, actividades_entregadas, origen) 
        VALUES (:fecha, :grupo, :inscritos, :presentes, :promedio, :act_prog, :act_ent, :origen)');

    foreach ($items as $idx => $row) {
        $numFila = $idx + 1;
        if (!is_array($row)) {
            $rechazados++;
            $errores[] = "Fila #{$numFila}: estructura inválida.";
            continue;
        }

        $fecha = trim((string)($row['fecha'] ?? ''));
        $grupo = trim((string)($row['grupo'] ?? ''));
        $inscritos = isset($row['inscritos']) ? (int)$row['inscritos'] : null;
        $presentes = isset($row['presentes']) ? (int)$row['presentes'] : null;
        $promedio = isset($row['promedio']) ? (float)$row['promedio'] : null;
        $actProg = isset($row['actividadesProgramadas']) 
            ? (int)$row['actividadesProgramadas'] 
            : (isset($row['actividades_programadas']) ? (int)$row['actividades_programadas'] : null);
        $actEnt = isset($row['actividadesEntregadas']) 
            ? (int)$row['actividadesEntregadas'] 
            : (isset($row['actividades_entregadas']) ? (int)$row['actividades_entregadas'] : null);
        $origen = 'csv';

        // Validaciones individuales
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha) || !strtotime($fecha)) {
            $rechazados++;
            $errores[] = "Fila #{$numFila} ({$grupo}): Fecha inválida '{$fecha}'.";
            continue;
        }
        if ($grupo === '' || mb_strlen($grupo) > 20) {
            $rechazados++;
            $errores[] = "Fila #{$numFila}: Grupo inválido o excede 20 caracteres.";
            continue;
        }
        if ($inscritos === null || $inscritos <= 0) {
            $rechazados++;
            $errores[] = "Fila #{$numFila} ({$fecha} {$grupo}): Inscritos debe ser > 0.";
            continue;
        }
        if ($presentes === null || $presentes < 0 || $presentes > $inscritos) {
            $rechazados++;
            $errores[] = "Fila #{$numFila} ({$fecha} {$grupo}): Presentes ({$presentes}) no puede superar a inscritos ({$inscritos}).";
            continue;
        }
        if ($promedio === null || $promedio < 0 || $promedio > 100) {
            $rechazados++;
            $errores[] = "Fila #{$numFila} ({$fecha} {$grupo}): Promedio ({$promedio}) fuera de rango (0-100).";
            continue;
        }
        if ($actProg === null || $actProg < 0) {
            $rechazados++;
            $errores[] = "Fila #{$numFila} ({$fecha} {$grupo}): Actividades programadas inválidas.";
            continue;
        }
        if ($actEnt === null || $actEnt < 0 || $actEnt > $actProg) {
            $rechazados++;
            $errores[] = "Fila #{$numFila} ({$fecha} {$grupo}): Actividades entregadas ({$actEnt}) supera programadas ({$actProg}).";
            continue;
        }

        // Checar duplicado
        $checkStmt->execute([':fecha' => $fecha, ':grupo' => $grupo]);
        if ($checkStmt->fetch()) {
            $rechazados++;
            $errores[] = "Fila #{$numFila} ({$fecha} {$grupo}): Duplicado (ya existe en BD).";
            continue;
        }

        // Inserción
        try {
            $insertStmt->execute([
                ':fecha' => $fecha,
                ':grupo' => $grupo,
                ':inscritos' => $inscritos,
                ':presentes' => $presentes,
                ':promedio' => $promedio,
                ':act_prog' => $actProg,
                ':act_ent' => $actEnt,
                ':origen' => $origen,
            ]);
            $insertados++;
        } catch (PDOException $ex) {
            $rechazados++;
            $errores[] = "Fila #{$numFila}: Error BD ({$ex->getCode()}).";
        }
    }

    reply(200, [
        'ok' => true,
        'insertados' => $insertados,
        'rechazados' => $rechazados,
        'errores' => $errores,
        'totalProcesados' => count($items)
    ]);

} catch (Throwable $e) {
    error_log((string)$e);
    reply(500, ['ok' => false, 'error' => 'Error durante la importación: ' . $e->getMessage()]);
}
