<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require 'db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($method) {

    case 'GET':
        if ($id) {
            $stmt = $pdo->prepare('SELECT * FROM blog_posts WHERE id = ?');
            $stmt->execute([$id]);
            $post = $stmt->fetch();
            if (!$post) {
                http_response_code(404);
                echo json_encode(['error' => 'Post not found.']);
            } else {
                echo json_encode($post);
            }
        } else {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $stmt  = $pdo->prepare('SELECT * FROM blog_posts ORDER BY created_at DESC LIMIT ?');
            $stmt->execute([$limit]);
            echo json_encode($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data    = json_decode(file_get_contents('php://input'), true) ?? [];
        $title   = trim($data['title']   ?? '');
        $content = trim($data['content'] ?? '');
        $image   = trim($data['image']   ?? '');

        if (!$title || !$content) {
            http_response_code(400);
            echo json_encode(['error' => 'Title and content are required.']);
            exit;
        }

        $stmt = $pdo->prepare('INSERT INTO blog_posts (title, content, image) VALUES (?, ?, ?)');
        $stmt->execute([$title, $content, $image]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id.']); exit; }
        $data    = json_decode(file_get_contents('php://input'), true) ?? [];
        $title   = trim($data['title']   ?? '');
        $content = trim($data['content'] ?? '');
        $image   = trim($data['image']   ?? '');

        $stmt = $pdo->prepare('UPDATE blog_posts SET title=?, content=?, image=? WHERE id=?');
        $stmt->execute([$title, $content, $image, $id]);
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id.']); exit; }
        $stmt = $pdo->prepare('DELETE FROM blog_posts WHERE id = ?');
        $stmt->execute([$id]);
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed.']);
}