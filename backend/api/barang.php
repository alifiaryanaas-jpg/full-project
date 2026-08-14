<?php
// =====================================================
// API Barang
// GET    /api/barang.php?kode=BRG001  -> cari 1 barang by kode (buat scan,
//                                        ADMIN atau USER/staff)
// GET    /api/barang.php              -> daftar semua barang (ADMIN ONLY)
// POST   /api/barang.php              -> tambah barang baru (ADMIN ONLY)
// PUT    /api/barang.php              -> update barang by id (ADMIN ONLY)
// DELETE /api/barang.php?id=5         -> hapus barang by id (ADMIN ONLY)
// =====================================================

require __DIR__ . '/cors.php';
require __DIR__ . '/../config/database.php';
require __DIR__ . '/middleware.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!empty($_GET['kode'])) {
        requireRole(['admin', 'user']); // dipakai staff pas scan di Check Out

        $stmt = $pdo->prepare('SELECT * FROM barang WHERE kode_barang = ?');
        $stmt->execute([$_GET['kode']]);
        $barang = $stmt->fetch();

        if (!$barang) {
            respond(['error' => 'Barang tidak ditemukan'], 404);
        }
        respond($barang);
    }

    requireRole(['admin']); // daftar semua barang cuma buat halaman Admin
    $stmt = $pdo->query('SELECT * FROM barang ORDER BY created_at DESC');
    respond($stmt->fetchAll());
}

if ($method === 'POST') {
    requireRole(['admin']); // hanya admin yang boleh nambah master barang

    $input = jsonInput();

    $required = ['kode_barang', 'nama_barang', 'kategori', 'satuan', 'stok', 'tanggal_masuk'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || $input[$field] === '') {
            respond(['error' => "Field '$field' wajib diisi"], 400);
        }
    }

    $stmt = $pdo->prepare(
        'INSERT INTO barang (kode_barang, nama_barang, kategori, satuan, nama_supplier, kondisi, stok, foto_url, tanggal_masuk)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    try {
        $stmt->execute([
            $input['kode_barang'],
            $input['nama_barang'],
            $input['kategori'],
            $input['satuan'],
            $input['nama_supplier'] ?? null,
            $input['kondisi'] ?? 'Baru',
            (int) $input['stok'],
            $input['foto_url'] ?? null,
            $input['tanggal_masuk'],
        ]);
        respond(['success' => true, 'id' => $pdo->lastInsertId()], 201);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            respond(['error' => 'Kode barang sudah terdaftar'], 409);
        }
        respond(['error' => $e->getMessage()], 500);
    }
}

if ($method === 'PUT') {
    requireRole(['admin']);

    $input = jsonInput();
    $required = ['id', 'kode_barang', 'nama_barang', 'kategori', 'satuan', 'stok', 'tanggal_masuk'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || $input[$field] === '') {
            respond(['error' => "Field '$field' wajib diisi"], 400);
        }
    }

    try {
        $stmt = $pdo->prepare(
            'UPDATE barang SET kode_barang = ?, nama_barang = ?, kategori = ?, satuan = ?,
                nama_supplier = ?, kondisi = ?, stok = ?, tanggal_masuk = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $input['kode_barang'],
            $input['nama_barang'],
            $input['kategori'],
            $input['satuan'],
            $input['nama_supplier'] ?? null,
            $input['kondisi'] ?? 'Baru',
            (int) $input['stok'],
            $input['tanggal_masuk'],
            $input['id'],
        ]);
        respond(['success' => true]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            respond(['error' => 'Kode barang sudah dipakai barang lain'], 409);
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
        $stmt = $pdo->prepare('DELETE FROM barang WHERE id = ?');
        $stmt->execute([$_GET['id']]);
        respond(['success' => true]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            respond(['error' => 'Barang ini punya histori transaksi masuk/keluar, tidak bisa dihapus.'], 409);
        }
        respond(['error' => $e->getMessage()], 500);
    }
}

respond(['error' => 'Method tidak didukung'], 405);
