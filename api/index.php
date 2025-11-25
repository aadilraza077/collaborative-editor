<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// HOSTINGER DATABASE CONFIGURATION
$host = "localhost"; 
$user = "u545958349_aadil"; // REPLACE WITH YOUR DB USER
$pass = "Sonushaik@2002"; // REPLACE WITH YOUR DB PASS
$dbname = "u545958349_collab_db";  // REPLACE WITH YOUR DB NAME

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed"]));
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// 1. LOGIN
if ($method === 'POST' && isset($input['action']) && $input['action'] === 'login') {
    $u = $conn->real_escape_string($input['username']);
    $p = $input['password']; // In prod, use password_verify()
    
    $result = $conn->query("SELECT * FROM users WHERE username='$u' AND password='$p'");
    
    if ($result->num_rows > 0) {
        echo json_encode(["success" => true, "user" => $u]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid credentials"]);
    }
    exit;
}

// 2. GET DOCUMENT
if ($method === 'GET') {
    $result = $conn->query("SELECT content FROM documents WHERE id=1");
    $row = $result->fetch_assoc();
    echo json_encode(["content" => $row['content']]);
    exit;
}

// 3. SAVE DOCUMENT
if ($method === 'POST' && isset($input['content'])) {
    $content = $conn->real_escape_string($input['content']);
    $conn->query("UPDATE documents SET content='$content' WHERE id=1");
    echo json_encode(["success" => true]);
    exit;
}

$conn->close();
?>