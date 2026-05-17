<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require 'db.php';

$action = $_GET['action'] ?? '';
$data   = json_decode(file_get_contents('php://input'), true) ?? [];

function requireLogin() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'You must be logged in.']);
        exit;
    }
}

switch ($action) {

    case 'place':
        requireLogin();
        $items = $data['items'] ?? [];

        if (empty($items)) {
            http_response_code(400);
            echo json_encode(['error' => 'Cart is empty.']);
            exit;
        }

        $total = 0;
        $rows  = [];
        foreach ($items as $item) {
            $pid = (int)($item['product_id'] ?? 0);
            $qty = (int)($item['quantity']   ?? 1);
            if ($pid <= 0 || $qty <= 0) continue;

            $stmt = $pdo->prepare('SELECT id, price, stock FROM products WHERE id = ?');
            $stmt->execute([$pid]);
            $product = $stmt->fetch();

            if (!$product) {
                http_response_code(404);
                echo json_encode(['error' => "Product #$pid not found."]);
                exit;
            }
            if ($product['stock'] < $qty) {
                http_response_code(409);
                echo json_encode(['error' => "Not enough stock for product #$pid."]);
                exit;
            }

            $total  += $product['price'] * $qty;
            $rows[]  = ['product_id' => $pid, 'quantity' => $qty, 'price' => $product['price']];
        }

        $stmt = $pdo->prepare('INSERT INTO orders (user_id, total) VALUES (?, ?)');
        $stmt->execute([$_SESSION['user_id'], $total]);
        $orderId = $pdo->lastInsertId();

        foreach ($rows as $row) {
            $stmt = $pdo->prepare(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)'
            );
            $stmt->execute([$orderId, $row['product_id'], $row['quantity'], $row['price']]);

            $stmt = $pdo->prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
            $stmt->execute([$row['quantity'], $row['product_id']]);
        }

        echo json_encode([
            'success'  => true,
            'order_id' => $orderId,
            'total'    => $total,
            'message'  => 'Order placed successfully.'
        ]);
        break;

    case 'my_orders':
        requireLogin();
        $stmt = $pdo->prepare(
            'SELECT o.id, o.total, o.status, o.created_at FROM orders o
             WHERE o.user_id = ? ORDER BY o.created_at DESC'
        );
        $stmt->execute([$_SESSION['user_id']]);
        $orders = $stmt->fetchAll();

        foreach ($orders as &$order) {
            $stmt = $pdo->prepare(
                'SELECT oi.quantity, oi.price, p.name, p.image
                 FROM order_items oi
                 JOIN products p ON p.id = oi.product_id
                 WHERE oi.order_id = ?'
            );
            $stmt->execute([$order['id']]);
            $order['items'] = $stmt->fetchAll();
        }

        echo json_encode($orders);
        break;

    case 'order':
        requireLogin();
        $orderId = (int)($_GET['id'] ?? 0);
        $stmt    = $pdo->prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?');
        $stmt->execute([$orderId, $_SESSION['user_id']]);
        $order   = $stmt->fetch();

        if (!$order) {
            http_response_code(404);
            echo json_encode(['error' => 'Order not found.']);
            exit;
        }

        $stmt = $pdo->prepare(
            'SELECT oi.quantity, oi.price, p.name, p.image
             FROM order_items oi
             JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?'
        );
        $stmt->execute([$orderId]);
        $order['items'] = $stmt->fetchAll();
        echo json_encode($order);
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Unknown action. Use: place, my_orders, order']);
}