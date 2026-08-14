import type { Barang, Karyawan, KaryawanRecord, TransaksiKeluar, TransaksiMasuk, StokSummaryRow, DetailPengambilanRow } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'auth_token';
const ROLE_KEY = 'auth_role';

export type Role = 'admin' | 'user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getRole = () => localStorage.getItem(ROLE_KEY) as Role | null;
export const isLoggedIn = (allow?: Role[]) => {
  const role = getRole();
  if (!getToken() || !role) return false;
  if (!allow) return true;
  return allow.includes(role);
};
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
};

async function request<T>(path: string, options?: RequestInit & { auth?: boolean }): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options?.auth) {
    const token = getToken();
    if (token) headers['X-Auth-Token'] = token;
  }

  const res = await fetch(`${BASE_URL}/${path}`, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Terjadi kesalahan pada server');
  }
  return data as T;
}

// ---------- Login (Admin & Staff, endpoint sama) ----------
export const login = async (password: string) => {
  const res = await request<{ success: boolean; token: string; role: Role }>('auth.php', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  localStorage.setItem(TOKEN_KEY, res.token);
  localStorage.setItem(ROLE_KEY, res.role);
  return res;
};

// ---------- Barang (lookup: admin & staff, sisanya admin only) ----------
export const getBarangList = () => request<Barang[]>('barang.php', { auth: true });

export const getBarangByKode = (kode: string) =>
  request<Barang>(`barang.php?kode=${encodeURIComponent(kode)}`, { auth: true });

export const createBarang = (payload: Omit<Barang, 'id'>) =>
  request<{ success: boolean; id: number }>('barang.php', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });

export const updateBarang = (id: number, payload: Omit<Barang, 'id'>) =>
  request<{ success: boolean }>('barang.php', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify({ id, ...payload }),
  });

export const deleteBarang = (id: number) =>
  request<{ success: boolean }>(`barang.php?id=${id}`, { method: 'DELETE', auth: true });

// ---------- Karyawan (lookup: admin & staff, sisanya admin only) ----------
export const getKaryawanByKode = (kode: string) =>
  request<Karyawan>(`karyawan.php?kode=${encodeURIComponent(kode)}`, { auth: true });

export const getKaryawanList = () => request<KaryawanRecord[]>('karyawan.php', { auth: true });

export const upsertKaryawan = (kode_barcode: string, nama_karyawan: string, divisi: string) =>
  request<{ success: boolean }>('karyawan.php', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ kode_barcode, nama_karyawan, divisi }),
  });

export const updateKaryawan = (id: number, kode_barcode: string, nama_karyawan: string, divisi: string) =>
  request<{ success: boolean }>('karyawan.php', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify({ id, kode_barcode, nama_karyawan, divisi }),
  });

export const deleteKaryawan = (id: number) =>
  request<{ success: boolean }>(`karyawan.php?id=${id}`, { method: 'DELETE', auth: true });

// ---------- Transaksi Keluar (admin & staff) ----------
export const getTransaksiKeluar = () => request<TransaksiKeluar[]>('transaksi_keluar.php', { auth: true });

export const createTransaksiKeluar = (payload: {
  kode_barang: string;
  kode_karyawan: string;
  nama_karyawan: string;
  divisi: string;
  jumlah: number;
  keterangan?: string;
}) =>
  request<{ success: boolean; id: number }>('transaksi_keluar.php', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });

// ---------- Transaksi Masuk / Restock (admin only) ----------
export const getTransaksiMasuk = () => request<TransaksiMasuk[]>('transaksi_masuk.php', { auth: true });

export const createTransaksiMasuk = (payload: { kode_barang: string; jumlah: number; nama_supplier?: string; keterangan?: string }) =>
  request<{ success: boolean; id: number }>('transaksi_masuk.php', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });

// ---------- Laporan (admin only) ----------
// kodeBarang opsional: kosong / 'all' = semua barang (default), atau isi kode
// barang spesifik buat lihat laporan 1 barang aja (mis. laptop dari tgl X-Y).
export const getLaporan = (start: string, end: string, kodeBarang?: string) => {
  const itemQuery = kodeBarang && kodeBarang !== 'all' ? `&kode_barang=${encodeURIComponent(kodeBarang)}` : '';
  return request<{
    periode: { start: string; end: string };
    kode_barang: string | null;
    summary: StokSummaryRow[];
    detail: DetailPengambilanRow[];
  }>(`report.php?start=${start}&end=${end}${itemQuery}&format=json`, { auth: true });
};

export const downloadLaporan = (start: string, end: string, format: 'excel' | 'pdf', kodeBarang?: string) => {
  const token = getToken();
  const itemQuery = kodeBarang && kodeBarang !== 'all' ? `&kode_barang=${encodeURIComponent(kodeBarang)}` : '';
  window.open(
    `${BASE_URL}/report.php?start=${start}&end=${end}${itemQuery}&format=${format}&auth_token=${token}`,
    '_blank'
  );
};
