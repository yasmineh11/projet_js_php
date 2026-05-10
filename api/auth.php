<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require 'db.php';

$action = $_GET['action'] ?? '';
$data   = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {

    case 'register':
        $name     = trim($data['name']     ?? '');
        $email    = trim($data['email']    ?? '');
        $password =      $data['password'] ?? '';

        if (!$name || !$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'All fields are required.']);
            exit;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid email address.']);
            exit;
        }
        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 6 characters.']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already registered.']);
            exit;
        }

        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $stmt   = $pdo->prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
        $stmt->execute([$name, $email, $hashed]);

        $userId = $pdo->lastInsertId();
        $_SESSION['user_id']   = $userId;
        $_SESSION['user_name'] = $name;

        echo json_encode([
            'success' => true,
            'message' => 'Registration successful.',
            'user'    => ['id' => $userId, 'name' => $name, 'email' => $email]
        ]);
        break;

    case 'login':
        $email    = trim($data['email']    ?? '');
        $password =      $data['password'] ?? '';

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(['error' => 'Email and password are required.']);
            exit;
        }

        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid email or password.']);
            exit;
        }

        $_SESSION['user_id']   = $user['id'];
        $_SESSION['user_name'] = $user['name'];

        echo json_encode([
            'success' => true,
            'message' => 'Login successful.',
            'user'    => ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email']]
        ]);
        break;

    case 'logout':
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Logged out.']);
        break;

    case 'me':
        if (isset($_SESSION['user_id'])) {
            $stmt = $pdo->prepare('SELECT id, name, email, created_at FROM users WHERE id = ?');
            $stmt->execute([$_SESSION['user_id']]);
            $user = $stmt->fetch();
            echo json_encode(['logged_in' => true, 'user' => $user]);
        } else {
            echo json_encode(['logged_in' => false]);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Unknown action.']);
}