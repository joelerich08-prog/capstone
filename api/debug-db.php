<?php
require_once __DIR__ . '/../middleware/cors.php';

header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../../config/db.php';
    $pdo = Database::getInstance();
    echo json_encode([
        'status' => 'success',
        'message' => 'Database connected successfully',
        'db_host' => getenv('DB_HOST') ?: 'localhost',
        'db_name' => getenv('DB_NAME') ?: 'capstone_project',
        'db_user' => getenv('DB_USER') ?: 'root',
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed',
        'error' => $e->getMessage(),
        'db_host' => getenv('DB_HOST') ?: 'localhost',
        'db_name' => getenv('DB_NAME') ?: 'capstone_project',
        'db_user' => getenv('DB_USER') ?: 'root',
    ]);
}
?>
