export interface Barang {
  id: number;
  kode_barang: string;
  nama_barang: string;
  kategori: string;
  satuan: string;
  nama_supplier: string | null;
  kondisi: 'Baru' | 'Bekas' | 'Rusak';
  stok: number;
  foto_url: string | null;
  tanggal_masuk: string;
}

export interface Karyawan {
  found: boolean;
  kode_barcode?: string;
  nama_karyawan?: string;
  divisi?: string;
}

export interface KaryawanRecord {
  id: number;
  kode_barcode: string;
  nama_karyawan: string;
  divisi: string;
}

export interface TransaksiKeluar {
  id: number;
  kode_barang: string;
  kode_karyawan: string;
  nama_karyawan: string;
  divisi: string;
  jumlah: number;
  tanggal: string;
  keterangan: string | null;
}

export interface TransaksiMasuk {
  id: number;
  kode_barang: string;
  jumlah: number;
  nama_supplier: string | null;
  tanggal: string;
  keterangan: string | null;
}

export interface LaporanRow {
  tanggal: string;
  nama_barang: string;
  kategori: string;
  jumlah: number;
  nama_karyawan: string;
  divisi: string;
  keterangan: string | null;
}

export interface StokSummaryRow {
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  stok_awal: number;
  barang_masuk: number;
  barang_keluar: number;
  stok_akhir: number;
}

export interface DetailPengambilanRow {
  tanggal: string;
  kode_barang: string;
  nama_barang: string;
  jumlah: number;
  nama_karyawan: string;
  divisi: string;
  keterangan: string | null;
}
