<?php
// =====================================================
// API Transaksi Masuk / Restock (ADMIN ONLY)
// GET  /api/transaksi_masuk.php  -> daftar transaksi masuk
// POST /api/transaksi_masuk.php  -> simpan transaksi + tambah stok barang
//      yang SUDAH ADA (kalau kode_barang belum terdaftar, ditolak --
//      barang baru harus didaftarin dulu lewat halaman Add Item)
// =====================================================

require __DIR__ . '/cors.php';
require __DIR__ . '/../config/database.php';
require __DIR__ . '/middleware.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireRole(['admin']);
    $stmt = $pdo->query('SELECT * FROM transaksi_masuk ORDER BY tanggal DESC, id DESC LIMIT 200');
    respond($stmt->fetchAll());
}

if ($method === 'POST') {
    requireRole(['admin']);
    $input = jsonInput();

    foreach (['kode_barang', 'jumlah'] as $field) {
        if (empty($input[$field]) && $input[$field] !== 0) {
            respond(['error' => "Field '$field' wajib diisi"], 400);
        }
    }

    $jumlah = (int) $input['jumlah'];
    if ($jumlah <= 0) {
        respond(['error' => 'Jumlah harus lebih dari 0'], 400);
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare('SELECT id, nama_supplier FROM barang WHERE kode_barang = ? FOR UPDATE');
        $stmt->execute([$input['kode_barang']]);
        $barang = $stmt->fetch();

        if (!$barang) {
            $pdo->rollBack();
            respond(['error' => 'Kode barang tidak ditemukan. Tambahkan dulu di master barang.'], 404);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO transaksi_masuk (kode_barang, jumlah, nama_supplier, tanggal, keterangan)
             VALUES (?, ?, ?, CURDATE(), ?)'
        );
        $stmt->execute([
            $input['kode_barang'],
            $jumlah,
            $input['nama_supplier'] ?? $barang['nama_supplier'],
            $input['keterangan'] ?? null,
        ]);

        $stmt = $pdo->prepare('UPDATE barang SET stok = stok + ? WHERE kode_barang = ?');
        $stmt->execute([$jumlah, $input['kode_barang']]);

        $pdo->commit();
        respond(['success' => true, 'id' => $pdo->lastInsertId()], 201);
    } catch (PDOException $e) {
        $pdo->rollBack();
        respond(['error' => $e->getMessage()], 500);
    }
}

respond(['error' => 'Method tidak didukung'], 405);
