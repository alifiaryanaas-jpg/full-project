<?php

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    file_put_contents(__DIR__ . '/debug_log.txt', "[$errno] $errstr in $errfile on line $errline\n", FILE_APPEND);
});

register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null) {
        file_put_contents(__DIR__ . '/debug_log.txt', "FATAL: " . print_r($error, true) . "\n", FILE_APPEND);
    }
});

require __DIR__ . '/cors.php';
require __DIR__ . '/../config/database.php';
require __DIR__ . '/middleware.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method tidak didukung'], 405);
}

$input = jsonInput();

if (empty($input['password'])) {
    respond(['error' => 'Password wajib diisi'], 400);
}

if (hash_equals(ADMIN_PASSWORD, $input['password'])) {
    respond(['success' => true, 'token' => generateAuthToken('admin'), 'role' => 'admin']);
}

if (hash_equals(USER_PASSWORD, $input['password'])) {
    respond(['success' => true, 'token' => generateAuthToken('user'), 'role' => 'user']);
}

respond(['error' => 'Password salah'], 401);