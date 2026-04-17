<?php
require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../auth/check_permissions.php';

session_start();

requirePermission('products', 'edit');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$productId = $_POST['productId'] ?? '';
if (empty($productId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Product ID is required']);
    exit;
}

try {
    $pdo = Database::getInstance();

    // Verify product exists
    $stmt = $pdo->prepare('SELECT id, images FROM products WHERE id = ?');
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

    $uploadedImages = [];

    // Handle file uploads
    if (!empty($_FILES['images'])) {
        $uploadDir = __DIR__ . '/../../uploads/products/';

        // Create upload directory if it doesn't exist
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        foreach ($_FILES['images']['tmp_name'] as $index => $tmpName) {
            if ($_FILES['images']['error'][$index] !== UPLOAD_ERR_OK) {
                continue; // Skip failed uploads
            }

            $originalName = $_FILES['images']['name'][$index];
            $fileExtension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

            // Validate file type
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (!in_array($fileExtension, $allowedExtensions)) {
                continue; // Skip invalid file types
            }

            // Validate file size (max 5MB)
            if ($_FILES['images']['size'][$index] > 5 * 1024 * 1024) {
                continue; // Skip files that are too large
            }

            // Generate unique filename
            $uniqueName = bin2hex(random_bytes(16)) . '.' . $fileExtension;
            $filePath = $uploadDir . $uniqueName;

            if (move_uploaded_file($tmpName, $filePath)) {
                $uploadedImages[] = '/uploads/products/' . $uniqueName;
            }
        }
    }

    // Combine current images with uploaded images
    $allImages = array_merge($currentImages, $uploadedImages);

    // Update product with new images
    $stmt = $pdo->prepare('UPDATE products SET images = ? WHERE id = ?');
    $stmt->execute([json_encode($allImages), $productId]);

    echo json_encode([
        'success' => true,
        'uploaded' => count($uploadedImages),
        'total' => count($allImages),
        'images' => $allImages
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>