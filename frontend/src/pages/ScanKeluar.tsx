import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Card, Input, Label, Button, Badge } from '../components/ui';
import { getBarangByKode, getKaryawanByKode, createTransaksiKeluar, getTransaksiKeluar } from '../lib/api';
import type { Barang, TransaksiKeluar } from '../types';

const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export default function ScanKeluar() {
  const [kodeBarang, setKodeBarang] = useState('');
  const [barang, setBarang] = useState<Barang | null>(null);
  const [errBarang, setErrBarang] = useState('');

  const [kodeKaryawan, setKodeKaryawan] = useState('');
  const [karyawanFound, setKaryawanFound] = useState<boolean | null>(null);
  const [namaKaryawan, setNamaKaryawan] = useState('');
  const [divisi, setDivisi] = useState('');

  const [jumlah, setJumlah] = useState('1');
  const [keterangan, setKeterangan] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<TransaksiKeluar[]>([]);

  const loadHistory = async () => {
    try {
      setHistory(await getTransaksiKeluar());
    } catch {
      // silent -- history is not critical to the main flow
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // --- Scan / lookup 1: item ---
  const lookupBarang = async () => {
    if (!kodeBarang.trim()) return;
    setErrBarang('');
    setBarang(null);
    try {
      const found = await getBarangByKode(kodeBarang.trim());
      setBarang(found);
    } catch (e) {
      setErrBarang((e as Error).message);
    }
  };

  // --- Scan / lookup 2: employee ---
  const lookupKaryawan = async () => {
    const kode = kodeKaryawan.trim();
    if (!kode) return;
    const result = await getKaryawanByKode(kode);
    setKaryawanFound(result.found);
    if (result.found) {
      setNamaKaryawan(result.nama_karyawan ?? '');
      setDivisi(result.divisi ?? '');
    } else {
      setNamaKaryawan('');
      setDivisi('');
    }
  };

  const resetForm = () => {
    setKodeBarang(''); setBarang(null); setErrBarang('');
    setKodeKaryawan(''); setKaryawanFound(null); setNamaKaryawan(''); setDivisi('');
    setJumlah('1'); setKeterangan('');
  };

  const handleSave = async () => {
    setError('');
    if (!barang) { setError('Please scan or enter the item code first.'); return; }
    if (!kodeKaryawan.trim()) { setError('Please scan or enter the employee code first.'); return; }
    if (!namaKaryawan.trim() || !divisi.trim()) { setError('Employee name and division are required.'); return; }
    const qty = Number(jumlah);
    if (qty <= 0 || qty > barang.stok) { setError('Invalid quantity or exceeds available stock.'); return; }

    setSaving(true);
    try {
      await createTransaksiKeluar({
        kode_barang: barang.kode_barang,
        kode_karyawan: kodeKaryawan.trim(),
        nama_karyawan: namaKaryawan.trim(),
        divisi: divisi.trim(),
        jumlah: qty,
        keterangan: keterangan.trim() || undefined,
      });
      resetForm();
      await loadHistory();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Check Out Item</h2>
          <span className="text-xs text-gray-500">Date: {todayLabel}</span>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Scan 1 — Item Barcode</Label>
            <p className="text-xs text-gray-400 mb-1.5">Scan with the scanner, or type the code and press Enter / tap Search.</p>
            <div className="flex gap-2">
              <Input
                value={kodeBarang}
                onChange={(e) => setKodeBarang(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && lookupBarang()}
                placeholder="e.g. BRG001"
                autoFocus
              />
              <Button variant="secondary" onClick={lookupBarang} title="Search">
                <Search size={18} />
              </Button>
            </div>
            {errBarang && <p className="text-xs text-red-600 mt-1">{errBarang}</p>}
            {barang && (
              <div className="mt-2 bg-primary-light rounded-lg p-2.5">
                <p className="text-sm font-medium text-gray-900">{barang.nama_barang}</p>
                <p className="text-xs text-gray-600">{barang.kategori} &middot; available stock: {barang.stok} {barang.satuan}</p>
              </div>
            )}
          </div>

          <div>
            <Label>Scan 2 — Employee Card</Label>
            <p className="text-xs text-gray-400 mb-1.5">Scan the card, or type the code and press Enter / tap Search.</p>
            <div className="flex gap-2">
              <Input
                value={kodeKaryawan}
                onChange={(e) => setKodeKaryawan(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && lookupKaryawan()}
                placeholder="e.g. EMP1001"
              />
              <Button variant="secondary" onClick={lookupKaryawan} title="Search">
                <Search size={18} />
              </Button>
            </div>
            {karyawanFound === true && (
              <div className="mt-2 bg-primary-light rounded-lg p-2.5">
                <p className="text-sm font-medium text-gray-900">{namaKaryawan}</p>
                <p className="text-xs text-gray-600">{divisi}</p>
              </div>
            )}
            {karyawanFound === false && (
              <div className="mt-2 bg-amber-50 rounded-lg p-2.5 space-y-2">
                <p className="text-xs text-amber-700">Code not registered yet. Fill in once, it will be saved automatically for next time.</p>
                <Input value={namaKaryawan} onChange={(e) => setNamaKaryawan(e.target.value)} placeholder="Employee name" />
                <Input value={divisi} onChange={(e) => setDivisi(e.target.value)} placeholder="Division" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity</Label>
              <Input type="number" min={1} value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Checkout'}
          </Button>
        </div>
      </Card>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent History</h3>
        <div className="space-y-2">
          {history.map((h) => (
            <Card key={h.id} className="py-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{h.kode_barang} &times;{h.jumlah}</p>
                  <p className="text-xs text-gray-500">taken by {h.nama_karyawan} &middot; {h.divisi}</p>
                  {h.keterangan && <p className="text-xs text-gray-400 italic">{h.keterangan}</p>}
                </div>
                <Badge>{h.tanggal}</Badge>
              </div>
            </Card>
          ))}
          {history.length === 0 && <p className="text-sm text-gray-400">No transactions yet.</p>}
        </div>
      </div>
    </div>
  );
}
