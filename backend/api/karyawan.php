<?php

require __DIR__ . '/cors.php';
require __DIR__ . '/../config/database.php';
require __DIR__ . '/middleware.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!empty($_GET['kode'])) {
        requireRole(['admin', 'user']); 

        $stmt = $pdo->prepare('SELECT * FROM karyawan WHERE kode_barcode = ?');
        $stmt->execute([$_GET['kode']]);
        $karyawan = $stmt->fetch();

        if (!$karyawan) {
            respond(['found' => false], 200);
        }
        respond(['found' => true] + $karyawan);
    }

    requireRole(['admin']); 
    $stmt = $pdo->query('SELECT * FROM karyawan ORDER BY nama_karyawan ASC');
    respond($stmt->fetchAll());
}

if ($method === 'POST') {
    requireRole(['admin']); 

    $input = jsonInput();

    foreach (['kode_barcode', 'nama_karyawan', 'divisi'] as $field) {
        if (empty($input[$field])) {
            respond(['error' => "Field '$field' wajib diisi"], 400);
        }
    }

    $stmt = $pdo->prepare(
        'INSERT INTO karyawan (kode_barcode, nama_karyawan, divisi) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE nama_karyawan = VALUES(nama_karyawan), divisi = VALUES(divisi)'
    );
    $stmt->execute([$input['kode_barcode'], $input['nama_karyawan'], $input['divisi']]);

    respond(['success' => true]);
}

if ($method === 'PUT') {
    requireRole(['admin']);

    $input = jsonInput();
    foreach (['id', 'kode_barcode', 'nama_karyawan', 'divisi'] as $field) {
        if (empty($input[$field]) && $input[$field] !== 0) {
            respond(['error' => "Field '$field' wajib diisi"], 400);
        }
    }

    try {
        $stmt = $pdo->prepare(
            'UPDATE karyawan SET kode_barcode = ?, nama_karyawan = ?, divisi = ? WHERE id = ?'
        );
        $stmt->execute([$input['kode_barcode'], $input['nama_karyawan'], $input['divisi'], $input['id']]);
        respond(['success' => true]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            respond(['error' => 'Kode barcode sudah dipakai karyawan lain'], 409);
        }
        respond(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'DELETE') {
    requireRole(['admin']);

    if (empty($_GET['id'])) {
        respond(['error' => "Parameter 'id' wajib diisi"], 400);
    }

    try {
        $stmt = $pdo->prepare('DELETE FROM karyawan WHERE id = ?');
        $stmt->execute([$_GET['id']]);
        respond(['success' => true]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            respond(['error' => 'Karyawan ini punya histori transaksi, tidak bisa dihapus. Hapus dulu transaksinya, atau biarkan datanya tetap ada.'], 409);
        }
        respond(['error' => $e->getMessage()], 500);
    }
}

respond(['error' => 'Method tidak didukung'], 405);
