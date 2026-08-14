<?php
// =====================================================
// API Transaksi Keluar
// GET  /api/transaksi_keluar.php   -> daftar transaksi (terbaru dulu)
// POST /api/transaksi_keluar.php   -> simpan transaksi baru + kurangi stok
//
// Body POST yang diharapkan dari frontend:
// {
//   "kode_barang": "BRG001",
//   "kode_karyawan": "EMP1001",
//   "nama_karyawan": "Budi Santoso",   // hasil lookup atau input manual
//   "divisi": "Infrastruktur",
//   "jumlah": 1,
//   "keterangan": "opsional"
// }
// =====================================================

require __DIR__ . '/cors.php';
require __DIR__ . '/../config/database.php';
require __DIR__ . '/middleware.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    requireRole(['admin', 'user']);
    $stmt = $pdo->query('SELECT * FROM transaksi_keluar ORDER BY tanggal DESC, id DESC LIMIT 200');
    respond($stmt->fetchAll());
}

if ($method === 'POST') {
    requireRole(['admin', 'user']);
    $input = jsonInput();

    foreach (['kode_barang', 'kode_karyawan', 'nama_karyawan', 'divisi', 'jumlah'] as $field) {
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

        // ambil & kunci baris barang, cek stok cukup
        $stmt = $pdo->prepare('SELECT stok FROM barang WHERE kode_barang = ? FOR UPDATE');
        $stmt->execute([$input['kode_barang']]);
        $barang = $stmt->fetch();

        if (!$barang) {
            $pdo->rollBack();
            respond(['error' => 'Kode barang tidak ditemukan'], 404);
        }
        if ($barang['stok'] < $jumlah) {
            $pdo->rollBack();
            respond(['error' => 'Stok tidak mencukupi. Sisa stok: ' . $barang['stok']], 400);
        }

        // upsert karyawan (jaga-jaga kalau frontend belum sempat panggil api/karyawan.php)
        $stmt = $pdo->prepare(
            'INSERT INTO karyawan (kode_barcode, nama_karyawan, divisi) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE nama_karyawan = VALUES(nama_karyawan), divisi = VALUES(divisi)'
        );
        $stmt->execute([$input['kode_karyawan'], $input['nama_karyawan'], $input['divisi']]);

        // catat transaksi keluar
        $stmt = $pdo->prepare(
            'INSERT INTO transaksi_keluar (kode_barang, kode_karyawan, nama_karyawan, divisi, jumlah, tanggal, keterangan)
             VALUES (?, ?, ?, ?, ?, CURDATE(), ?)'
        );
        $stmt->execute([
            $input['kode_barang'],
            $input['kode_karyawan'],
            $input['nama_karyawan'],
            $input['divisi'],
            $jumlah,
            $input['keterangan'] ?? null,
        ]);

        // kurangi stok
        $stmt = $pdo->prepare('UPDATE barang SET stok = stok - ? WHERE kode_barang = ?');
        $stmt->execute([$jumlah, $input['kode_barang']]);

        $pdo->commit();
        respond(['success' => true, 'id' => $pdo->lastInsertId()], 201);
    } catch (PDOException $e) {
        $pdo->rollBack();
        respond(['error' => $e->getMessage()], 500);
    }
}

respond(['error' => 'Method tidak didukung'], 405);
