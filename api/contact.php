<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data    = json_decode(file_get_contents('php://input'), true) ?? [];
    $name    = trim($data['name']    ?? '');
    $email   = trim($data['email']   ?? '');
    $message = trim($data['message'] ?? '');

    if (!$name || !$email || !$message) {
        http_response_code(400);
        echo json_encode(['error' => 'All fields (name, email, message) are required.']);
        exit;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email address.']);
        exit;
    }

    $stmt = $pdo->prepare('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)');
    $stmt->execute([$name, $email, $message]);

    echo json_encode([
        'success' => true,
        'message' => 'Your message has been sent. We will get back to you soon!'
    ]);

} elseif ($method === 'GET') {
    $stmt = $pdo->query('SELECT * FROM contacts ORDER BY sent_at DESC');
    echo json_encode($stmt->fetchAll());

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
}