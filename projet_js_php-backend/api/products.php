<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($method) {

    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ?');
            $stmt->execute([$id]);
            $product = $stmt->fetch();
            if (!$product) {
                http_response_code(404);
                echo json_encode(['error' => 'Product not found.']);
            } else {
                echo json_encode($product);
            }
        } elseif (isset($_GET['search'])) {
            $q    = '%' . $_GET['search'] . '%';
            $stmt = $pdo->prepare('SELECT * FROM products WHERE name LIKE ? OR description LIKE ? ORDER BY id DESC');
            $stmt->execute([$q, $q]);
            echo json_encode($stmt->fetchAll());
        } else {
         $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
$stmt  = $pdo->prepare("SELECT * FROM products ORDER BY id DESC LIMIT $limit");
$stmt->execute();
            echo json_encode($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data  = json_decode(file_get_contents('php://input'), true) ?? [];
        $name  = trim($data['name']        ?? '');
        $desc  = trim($data['description'] ?? '');
        $price = (float)($data['price']    ?? 0);
        $image = trim($data['image']       ?? '');
        $stock = (int)($data['stock']      ?? 0);

        if (!$name || $price <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Name and a valid price are required.']);
            exit;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO products (name, description, price, image, stock) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$name, $desc, $price, $image, $stock]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id.']); exit; }
        $data  = json_decode(file_get_contents('php://input'), true) ?? [];
        $name  = trim($data['name']        ?? '');
        $desc  = trim($data['description'] ?? '');
        $price = (float)($data['price']    ?? 0);
        $image = trim($data['image']       ?? '');
        $stock = (int)($data['stock']      ?? 0);

        $stmt = $pdo->prepare(
            'UPDATE products SET name=?, description=?, price=?, image=?, stock=? WHERE id=?'
        );
        $stmt->execute([$name, $desc, $price, $image, $stock, $id]);
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id.']); exit; }
        $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed.']);
}