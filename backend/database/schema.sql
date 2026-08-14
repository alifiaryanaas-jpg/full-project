
CREATE DATABASE IF NOT EXISTS asset_tracker
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE asset_tracker;

-- ---------------------------------------------------
-- Tabel: barang
-- Master data barang/aset. Diisi sekali saat barang
-- jenis/unit baru pertama kali masuk ke sistem.
-- ---------------------------------------------------
CREATE TABLE barang (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  kode_barang     VARCHAR(50)  NOT NULL UNIQUE,   -- isi barcode
  nama_barang     VARCHAR(150) NOT NULL,
  kategori        VARCHAR(100) NOT NULL,           -- PC, Laptop, Monitor, Kabel, dll
  satuan          VARCHAR(30)  NOT NULL DEFAULT 'unit',
  nama_supplier   VARCHAR(150) NULL,
  kondisi         ENUM('Baru', 'Bekas', 'Rusak') NOT NULL DEFAULT 'Baru',
  stok            INT NOT NULL DEFAULT 0,
  foto_url        VARCHAR(255) NULL,
  tanggal_masuk   DATE NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_kode_barang (kode_barang),
  INDEX idx_kategori (kategori)
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Tabel: karyawan
-- Terisi otomatis (upsert) dari scan kartu karyawan
-- saat transaksi pengambilan barang. Kode barcode sama
-- dengan kartu absensi, tapi datanya berdiri sendiri
-- di sistem ini (tidak bergantung sistem absen).
-- ---------------------------------------------------
CREATE TABLE karyawan (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  kode_barcode    VARCHAR(50)  NOT NULL UNIQUE,
  nama_karyawan   VARCHAR(150) NOT NULL,
  divisi          VARCHAR(100) NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_kode_barcode (kode_barcode)
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Tabel: transaksi_masuk
-- Barang masuk dari supplier (menambah stok).
-- ---------------------------------------------------
CREATE TABLE transaksi_masuk (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  kode_barang     VARCHAR(50) NOT NULL,
  jumlah          INT NOT NULL,
  nama_supplier   VARCHAR(150) NULL,
  tanggal         DATE NOT NULL,
  keterangan      VARCHAR(255) NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (kode_barang) REFERENCES barang(kode_barang)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_tanggal (tanggal)
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Tabel: transaksi_keluar
-- Barang keluar/dipinjam oleh karyawan (mengurangi stok).
-- nama_karyawan & divisi disimpan langsung (denormalized)
-- supaya histori laporan tidak berubah walau data di
-- tabel karyawan diperbarui di kemudian hari.
-- ---------------------------------------------------
CREATE TABLE transaksi_keluar (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  kode_barang     VARCHAR(50) NOT NULL,
  kode_karyawan   VARCHAR(50) NOT NULL,
  nama_karyawan   VARCHAR(150) NOT NULL,
  divisi          VARCHAR(100) NOT NULL,
  jumlah          INT NOT NULL,
  tanggal         DATE NOT NULL,
  keterangan      VARCHAR(255) NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (kode_barang) REFERENCES barang(kode_barang)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (kode_karyawan) REFERENCES karyawan(kode_barcode)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_tanggal (tanggal),
  INDEX idx_kode_barang (kode_barang)
) ENGINE=InnoDB;

-- ---------------------------------------------------
-- Data contoh (opsional, boleh dihapus)
-- ---------------------------------------------------
INSERT INTO barang (kode_barang, nama_barang, kategori, satuan, nama_supplier, kondisi, stok, tanggal_masuk) VALUES
('BRG001', 'Laptop Lenovo ThinkPad', 'Laptop', 'unit', 'CV Sinar Komputer', 'Baru', 12, CURDATE()),
('BRG002', 'Monitor LG 24 inch', 'Monitor', 'unit', 'CV Sinar Komputer', 'Baru', 8, CURDATE()),
('BRG003', 'Mouse Wireless Logitech', 'Aksesoris', 'pcs', 'Toko ABC Elektronik', 'Baru', 25, CURDATE());

INSERT INTO karyawan (kode_barcode, nama_karyawan, divisi) VALUES
('EMP1001', 'Budi Santoso', 'Infrastruktur'),
('EMP1002', 'Siti Aminah', 'Keamanan Data');
