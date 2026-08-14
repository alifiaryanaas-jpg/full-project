<?php
// =====================================================
// API Laporan Stok Barang
//
// GET /api/report.php?start=2026-01-01&end=2026-01-31&format=json
// GET /api/report.php?start=2026-01-01&end=2026-01-31&format=excel  -> download .xlsx
// GET /api/report.php?start=2026-01-01&end=2026-01-31&format=pdf    -> download .pdf
//
// Isi laporan ada 2 bagian:
//  - summary : ringkasan per barang (Stok Awal / Masuk / Keluar / Stok Akhir)
//  - detail  : daftar tiap transaksi keluar (siapa yang ambil + keterangan)
//
// Kalau start/end kosong, otomatis pakai bulan berjalan.
// Butuh: composer require phpoffice/phpspreadsheet dompdf/dompdf
// =====================================================

require __DIR__ . '/../config/database.php';

// cors.php set header JSON secara default; untuk file download kita override belakangan,
// jadi require cors.php lebih dulu supaya header CORS tetap kepasang.
require __DIR__ . '/cors.php';
require __DIR__ . '/middleware.php';

requireRole(['admin']); // seluruh laporan cuma boleh diakses admin yang sudah login

require __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Dompdf\Dompdf;

$pdo = getDbConnection();

$start = $_GET['start'] ?? date('Y-m-01');
$end = $_GET['end'] ?? date('Y-m-t');
$format = $_GET['format'] ?? 'json';

// Filter opsional per barang. Kosong / '' / 'all' artinya semua barang (perilaku lama).
$kodeBarang = trim($_GET['kode_barang'] ?? '');
$filterByItem = $kodeBarang !== '' && $kodeBarang !== 'all';

// ---------------------------------------------------
// 1. Ringkasan stok per barang
//
// Logika hitung Stok Awal (di tanggal `start`):
//   stok sekarang (b.stok) itu HASIL AKHIR setelah semua transaksi s.d hari ini.
//   Jadi buat tau stok di awal periode, tinggal "mundurin" transaksi yang
//   terjadi SEJAK tanggal start sampai sekarang dari stok sekarang:
//     stok_awal = stok_sekarang - (masuk sejak start) + (keluar sejak start)
//   Baru dari situ maju lagi sesuai transaksi DI DALAM periode buat dapet stok akhir.
//
// Kalau kode_barang diisi, laporan cuma nampilin 1 barang itu -- berguna buat
// pertanyaan kayak "laptop dari tanggal sekian sampe sekian" tanpa perlu
// scroll ringkasan semua barang.
// ---------------------------------------------------
$summarySql = "
    SELECT
        b.kode_barang,
        b.nama_barang,
        b.satuan,
        b.stok
            - COALESCE((SELECT SUM(jumlah) FROM transaksi_masuk WHERE kode_barang = b.kode_barang AND tanggal >= ?), 0)
            + COALESCE((SELECT SUM(jumlah) FROM transaksi_keluar WHERE kode_barang = b.kode_barang AND tanggal >= ?), 0)
            AS stok_awal,
        COALESCE((SELECT SUM(jumlah) FROM transaksi_masuk WHERE kode_barang = b.kode_barang AND tanggal BETWEEN ? AND ?), 0)
            AS barang_masuk,
        COALESCE((SELECT SUM(jumlah) FROM transaksi_keluar WHERE kode_barang = b.kode_barang AND tanggal BETWEEN ? AND ?), 0)
            AS barang_keluar
    FROM barang b
    " . ($filterByItem ? "WHERE b.kode_barang = ?" : "") . "
    ORDER BY b.kode_barang ASC
";
$summaryParams = [$start, $start, $start, $end, $start, $end];
if ($filterByItem) {
    $summaryParams[] = $kodeBarang;
}
$stmt = $pdo->prepare($summarySql);
$stmt->execute($summaryParams);
$summary = $stmt->fetchAll();

foreach ($summary as &$row) {
    $row['stok_akhir'] = $row['stok_awal'] + $row['barang_masuk'] - $row['barang_keluar'];
}
unset($row);

// ---------------------------------------------------
// 2. Detail transaksi keluar (tetap ada, buat lihat siapa yang ambil)
// ---------------------------------------------------
$detailSql = 'SELECT tk.tanggal, b.kode_barang, b.nama_barang, tk.jumlah, tk.nama_karyawan, tk.divisi, tk.keterangan
     FROM transaksi_keluar tk
     JOIN barang b ON b.kode_barang = tk.kode_barang
     WHERE tk.tanggal BETWEEN ? AND ?'
    . ($filterByItem ? ' AND tk.kode_barang = ?' : '')
    . ' ORDER BY tk.tanggal ASC';
$detailParams = [$start, $end];
if ($filterByItem) {
    $detailParams[] = $kodeBarang;
}
$stmt = $pdo->prepare($detailSql);
$stmt->execute($detailParams);
$detail = $stmt->fetchAll();

$judulUtama = 'LAPORAN STOK BARANG';
$namaPerusahaan = 'PT ECCO INDONESIA - DIVISI IT';
$itemLabel = $filterByItem && count($summary) > 0 ? ' — ' . $summary[0]['nama_barang'] : '';
$periodeLabel = 'Periode: ' . date('d M Y', strtotime($start)) . ' s.d. ' . date('d M Y', strtotime($end)) . $itemLabel;

if ($format === 'json') {
    header('Content-Type: application/json; charset=utf-8');
    respond([
        'periode' => ['start' => $start, 'end' => $end],
        'kode_barang' => $filterByItem ? $kodeBarang : null,
        'summary' => $summary,
        'detail' => $detail,
    ]);
}

// Warna sel Stok Akhir: merah kalau menipis, kuning sedang, hijau aman
function warnaStok(int $jumlah): string
{
    if ($jumlah <= 15) return 'FFC7CE';   // merah muda
    if ($jumlah <= 35) return 'FFEB9C';   // kuning muda
    return 'C6EFCE';                       // hijau muda
}

if ($format === 'excel') {
    $spreadsheet = new Spreadsheet();

    // ---------- Sheet 1: Ringkasan Stok ----------
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle('Ringkasan Stok');

    $sheet->setCellValue('A1', $judulUtama);
    $sheet->mergeCells('A1:F1');
    $sheet->setCellValue('A2', $namaPerusahaan);
    $sheet->mergeCells('A2:F2');
    $sheet->setCellValue('A3', $periodeLabel);
    $sheet->mergeCells('A3:F3');

    foreach (['A1', 'A2', 'A3'] as $cell) {
        $sheet->getStyle($cell)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    }
    $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
    $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(11);
    $sheet->getStyle('A3')->getFont()->setItalic(true)->setSize(10);

    $header = ['Kode Barang', 'Nama Barang', 'Stok Awal', 'Barang Masuk', 'Barang Keluar', 'Stok Akhir'];
    $sheet->fromArray($header, null, 'A5');
    $sheet->getStyle('A5:F5')->getFont()->setBold(true);
    $sheet->getStyle('A5:F5')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('D9D9D9');
    $sheet->getStyle('A5:F5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

    $r = 6;
    foreach ($summary as $row) {
        $sheet->setCellValue('A' . $r, $row['kode_barang']);
        $sheet->setCellValue('B' . $r, $row['nama_barang']);
        $sheet->setCellValue('C' . $r, $row['stok_awal']);
        $sheet->setCellValue('D' . $r, $row['barang_masuk']);
        $sheet->setCellValue('E' . $r, $row['barang_keluar']);
        $sheet->setCellValue('F' . $r, $row['stok_akhir']);

        $sheet->getStyle('C' . $r . ':F' . $r)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('F' . $r)
            ->getFill()->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB(warnaStok((int) $row['stok_akhir']));

        $r++;
    }
    foreach (range('A', 'F') as $col) {
        $sheet->getColumnDimension($col)->setAutoSize(true);
    }

    // ---------- Sheet 2: Detail Pengambilan ----------
    $detailSheet = $spreadsheet->createSheet();
    $detailSheet->setTitle('Detail Pengambilan');

    $detailSheet->setCellValue('A1', 'DETAIL PENGAMBILAN BARANG');
    $detailSheet->mergeCells('A1:F1');
    $detailSheet->getStyle('A1')->getFont()->setBold(true)->setSize(13);
    $detailSheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    $detailSheet->setCellValue('A2', $periodeLabel);
    $detailSheet->mergeCells('A2:F2');
    $detailSheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

    $detailHeader = ['Tanggal', 'Kode Barang', 'Nama Barang', 'Jumlah', 'Diambil Oleh', 'Divisi', 'Keterangan'];
    $detailSheet->fromArray($detailHeader, null, 'A4');
    $detailSheet->getStyle('A4:G4')->getFont()->setBold(true);
    $detailSheet->getStyle('A4:G4')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('D9D9D9');

    $r = 5;
    foreach ($detail as $row) {
        $detailSheet->setCellValue('A' . $r, $row['tanggal']);
        $detailSheet->setCellValue('B' . $r, $row['kode_barang']);
        $detailSheet->setCellValue('C' . $r, $row['nama_barang']);
        $detailSheet->setCellValue('D' . $r, $row['jumlah']);
        $detailSheet->setCellValue('E' . $r, $row['nama_karyawan']);
        $detailSheet->setCellValue('F' . $r, $row['divisi']);
        $detailSheet->setCellValue('G' . $r, $row['keterangan']);
        $r++;
    }
    foreach (range('A', 'G') as $col) {
        $detailSheet->getColumnDimension($col)->setAutoSize(true);
    }

    $spreadsheet->setActiveSheetIndex(0);

    $fileSuffix = $filterByItem ? '-' . $kodeBarang : '';
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="laporan-stok' . $fileSuffix . '-' . $start . '_' . $end . '.xlsx"');
    header('Cache-Control: max-age=0');

    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');
    exit;
}

if ($format === 'pdf') {
    $html = '<div style="text-align:center;margin-bottom:16px">'
        . '<h2 style="margin:0">' . htmlspecialchars($judulUtama) . '</h2>'
        . '<p style="margin:2px 0;font-weight:bold">' . htmlspecialchars($namaPerusahaan) . '</p>'
        . '<p style="margin:0;font-style:italic;font-size:11px">' . htmlspecialchars($periodeLabel) . '</p>'
        . '</div>';

    $html .= '<table border="1" cellpadding="5" cellspacing="0" width="100%" style="font-size:11px;border-collapse:collapse;margin-bottom:24px">';
    $html .= '<thead><tr style="background:#D9D9D9">'
        . '<th>Kode Barang</th><th>Nama Barang</th><th>Stok Awal</th><th>Barang Masuk</th><th>Barang Keluar</th><th>Stok Akhir</th>'
        . '</tr></thead><tbody>';
    foreach ($summary as $row) {
        $warna = '#' . warnaStok((int) $row['stok_akhir']);
        $html .= '<tr>'
            . '<td>' . htmlspecialchars($row['kode_barang']) . '</td>'
            . '<td>' . htmlspecialchars($row['nama_barang']) . '</td>'
            . '<td align="center">' . htmlspecialchars($row['stok_awal']) . '</td>'
            . '<td align="center">' . htmlspecialchars($row['barang_masuk']) . '</td>'
            . '<td align="center">' . htmlspecialchars($row['barang_keluar']) . '</td>'
            . '<td align="center" style="background:' . $warna . ';font-weight:bold">' . htmlspecialchars($row['stok_akhir']) . '</td>'
            . '</tr>';
    }
    $html .= '</tbody></table>';

    $html .= '<h3 style="text-align:center">DETAIL PENGAMBILAN BARANG</h3>';
    $html .= '<table border="1" cellpadding="4" cellspacing="0" width="100%" style="font-size:10px;border-collapse:collapse">';
    $html .= '<thead><tr style="background:#D9D9D9">'
        . '<th>Tanggal</th><th>Kode Barang</th><th>Nama Barang</th><th>Jumlah</th><th>Diambil Oleh</th><th>Divisi</th><th>Keterangan</th>'
        . '</tr></thead><tbody>';
    foreach ($detail as $row) {
        $html .= '<tr>'
            . '<td>' . htmlspecialchars($row['tanggal']) . '</td>'
            . '<td>' . htmlspecialchars($row['kode_barang']) . '</td>'
            . '<td>' . htmlspecialchars($row['nama_barang']) . '</td>'
            . '<td align="center">' . htmlspecialchars($row['jumlah']) . '</td>'
            . '<td>' . htmlspecialchars($row['nama_karyawan']) . '</td>'
            . '<td>' . htmlspecialchars($row['divisi']) . '</td>'
            . '<td>' . htmlspecialchars($row['keterangan'] ?? '-') . '</td>'
            . '</tr>';
    }
    $html .= '</tbody></table>';

    $dompdf = new Dompdf();
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A4', 'landscape');
    $dompdf->render();
    $fileSuffix = $filterByItem ? '-' . $kodeBarang : '';
    $dompdf->stream('laporan-stok' . $fileSuffix . '-' . $start . '_' . $end . '.pdf', ['Attachment' => true]);
    exit;
}

respond(['error' => "format harus salah satu dari: json, excel, pdf"], 400);
