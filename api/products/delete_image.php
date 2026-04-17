<?php
require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../auth/check_permissions.php';

session_start();

requirePermission('products', 'edit');

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request body']);
    exit;
}

$productId = trim((string) ($data['productId'] ?? ''));
$imageUrl = trim((string) ($data['imageUrl'] ?? ''));

if (empty($productId) || empty($imageUrl)) {
    http_response_code(400);
    echo json_encode(['error' => 'Product ID and image URL are required']);
    exit;
}

try {
    $pdo = Database::getInstance();

    // Get current images
    $stmt = $pdo->prepare('SELECT images FROM products WHERE id = ?');
    $stmt->execute([$productId]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found']);
        exit;
    }

    $currentImages = json_decode($product['images'] ?? '[]', true);
    if (!is_array($currentImages)) {
        $currentImages = [];
    }

    // Find and remove the image
    $imageIndex = array_search($imageUrl, $currentImages);
    if ($imageIndex === false) {
        http_response_code(404);
        echo json_encode(['error' => 'Image not found in product']);
        exit;
    }

    // Remove from array
    array_splice($currentImages, $imageIndex, 1);

    // Delete physical file if it exists
    $filePath = __DIR__ . '/../../' . ltrim($imageUrl, '/');
    if (file_exists($filePath)) {
        unlink($filePath);
    }

    // Update product
    $stmt = $pdo->prepare('UPDATE products SET images = ? WHERE id = ?');
    $stmt->execute([json_encode($currentImages), $productId]);

    echo json_encode([
        'success' => true,
        'remaining' => count($currentImages),
        'images' => $currentImages
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>