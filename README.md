# Asset Tracker — Divisi IT PT ECCO Indonesia

Website pencatatan aset keluar/masuk. Terinspirasi dari struktur & UI
kasirgratisan (FreeKasir), tapi database-nya PHP + MySQL (bukan Dexie/IndexedDB)
supaya datanya terpusat dan bisa dipakai banyak staff sekaligus.

## Struktur folder

```
asset-tracker/
├── backend/            -> PHP API + koneksi MySQL
│   ├── config/database.php     (ganti kredensial DB di sini)
│   ├── database/schema.sql     (import ini ke MySQL dulu)
│   └── api/
│       ├── barang.php
│       ├── karyawan.php
│       ├── transaksi_masuk.php
│       ├── transaksi_keluar.php
│       └── report.php
└── frontend/           -> React + Vite + Tailwind
    └── src/
        ├── pages/InputBarang.tsx   (form tambah barang)
        ├── pages/ScanKeluar.tsx    (2x scan: barang + karyawan)
        ├── pages/ScanMasuk.tsx     (barang masuk dari supplier)
        ├── pages/Report.tsx        (filter bulanan/tahunan/range + export)
        ├── pages/Karyawan.tsx      (placeholder, belum dipakai, lihat TODO di file)
        └── lib/api.ts              (semua fungsi fetch ke backend)
```

## Cara jalanin (development)

### 1. Database
- Buka MySQL (XAMPP/Laragon/dll), lalu import `backend/database/schema.sql`
  (bisa lewat phpMyAdmin: Import, atau `mysql -u root -p < backend/database/schema.sql`)
- Ini otomatis bikin database `asset_tracker` + tabel + 3 data contoh barang & 2 karyawan

### 2. Backend
```bash
cd backend
composer install          # install PhpSpreadsheet & Dompdf (buat export)
php -S localhost:8000     # jalanin PHP built-in server
```
Kalau kredensial MySQL kamu beda dari default (root, tanpa password),
edit dulu `backend/config/database.php`.

**Ganti juga password admin & staff default** di file yang sama:
```php
define('ADMIN_PASSWORD', 'admin123');   // <- ganti ini
define('USER_PASSWORD', 'staff123');    // <- ganti ini juga
define('ADMIN_SECRET', '...');          // <- ganti ke string acak panjang
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Buka `http://localhost:8080`

## Struktur akses: Staff vs Admin

Sekarang **semua orang wajib login dulu** di `/login` — 1 halaman yang sama buat Admin
maupun Staff. Backend yang otomatis nentuin role berdasarkan password mana yang cocok:
- Masukin `ADMIN_PASSWORD` → masuk sebagai **Admin**, diarahkan ke `/admin/employees`
- Masukin `USER_PASSWORD` → masuk sebagai **Staff**, diarahkan ke `/` (Check Out)

**Staff** (setelah login):
- Cuma ada 1 layar: **Check Out** — scan atau ketik manual kode barang & kartu karyawan,
  simpan. Ada tombol Search di sebelah tiap kolom kalau scanner error / mau ketik manual
- Tanggal transaksi (hari ini) ditampilin otomatis di form

**Admin** (setelah login):
- **Employees** — pre-register ~10 karyawan (kode barcode kartu absen + nama + divisi),
  bisa juga edit/hapus data yang udah ada. Biar pas staff scan kartunya langsung
  auto-fill nama & divisi tanpa perlu isi manual
- **Add Item** — tambah master data barang baru, bisa edit/hapus juga
- **Report** — lihat & download laporan stok (Excel/PDF)

Staff yang belum familiar sistem tetap bisa jalan normal walau belum di-pre-register
di Admin — pas scan kartu yang belum terdaftar, field nama/divisi otomatis muncul
buat diisi manual sekali, lalu tersimpan otomatis untuk scan berikutnya.

Tombol Logout ada di pojok kanan atas tiap layar (icon panah keluar buat Staff,
tulisan "Logout" buat Admin).


## Yang masih perlu kamu tambah/sesuaikan

1. **`pages/Karyawan.tsx`** — masih kosong (placeholder). Opsional, buat halaman
   lihat/edit karyawan yang udah tercatat kalau nanti perlu.
2. **Autentikasi/login** — belum ada sama sekali. Kalau perlu login staff,
   ini yang perlu ditambah duluan sebelum dipakai beneran.
3. **Deploy ke server kantor** — instruksi di atas buat development di
   laptop kamu. Kalau mau taruh di server Diskominfo, backend PHP tinggal
   di-upload ke Apache/Nginx yang ada PHP + MySQL, dan `BASE_URL` di
   `frontend/src/lib/api.ts` diganti sesuai alamat server itu.
4. **Foto barang** — kolom `foto_url` di database udah disiapkan, tapi
   upload file-nya belum diimplementasi di form `InputBarang.tsx`.
