<?php
/**
 * CORS Test Endpoint
 * Simple endpoint to test if CORS headers are working
 */

// Get allowed origins from environment variable or use defaults
$defaultOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'https://kakai-kutkutin.vercel.app',
    'https://kakai-kutkutin.onrender.com',
];

$envOrigins = getenv('CORS_ALLOWED_ORIGINS');
if ($envOrigins) {
    $allowedOrigins = array_map('trim', explode(',', $envOrigins));
} else {
    $allowedOrigins = $defaultOrigins;
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Cache-Bust');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');

// Test response
echo json_encode([
    'status' => 'success',
    'message' => 'CORS is working!',
    'allowed_origins' => $allowedOrigins,
    'request_origin' => $origin,
    'timestamp' => date('Y-m-d H:i:s')
]);
