<?php

define('DB_HOST', 'localhost');
define('DB_NAME', 'asset_tracker');
define('DB_USER', 'asset');
define('DB_PASS', '9nisd8!gjMbs8!v3');


define('ADMIN_PASSWORD', 'Indonesiaemas2045');


define('USER_PASSWORD', 'staff123');


define('ADMIN_SECRET', 'd6ead09dce1c813e7d908e167b7d579921793f568da12e8e6dcfc2311f359cc');

function getDbConnection(): PDO
{
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Koneksi database gagal: ' . $e->getMessage()]);
        exit;
    }
}
