import { useEffect, useState } from 'react';
import { Card, Input, Label, Button, Badge } from '../components/ui';
import { getBarangByKode, createTransaksiMasuk, getTransaksiMasuk, getBarangList } from '../lib/api';
import type { Barang, TransaksiMasuk } from '../types';

export default function AdminRestock() {
  const [kodeBarang, setKodeBarang] = useState('');
  const [barang, setBarang] = useState<Barang | null>(null);
  const [errBarang, setErrBarang] = useState('');

  const [jumlah, setJumlah] = useState('');
  const [namaSupplier, setNamaSupplier] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState<TransaksiMasuk[]>([]);
  const [itemNames, setItemNames] = useState<Record<string, string>>({});

  const loadHistory = async () => {
    try {
      const [trx, items] = await Promise.all([getTransaksiMasuk(), getBarangList()]);
      setHistory(trx);
      const map: Record<string, string> = {};
      items.forEach((i) => { map[i.kode_barang] = i.nama_barang; });
      setItemNames(map);
    } catch {
      // silent -- history is not critical to the main flow
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const lookupBarang = async () => {
    if (!kodeBarang.trim()) return;
    setErrBarang(''); setBarang(null); setSuccess('');
    try {
      const found = await getBarangByKode(kodeBarang.trim());
      setBarang(found);
      setNamaSupplier(found.nama_supplier ?? '');
    } catch (e) {
      setErrBarang((e as Error).message);
    }
  };

  const handleSave = async () => {
    setError(''); setSuccess('');
    if (!barang) { setError('Search for the item first.'); return; }
    const qty = Number(jumlah);
    if (qty <= 0) { setError('Quantity must be greater than 0.'); return; }

    setSaving(true);
    try {
      await createTransaksiMasuk({
        kode_barang: barang.kode_barang,
        jumlah: qty,
        nama_supplier: namaSupplier.trim() || undefined,
        keterangan: keterangan.trim() || undefined,
      });
      setSuccess(`Stock for "${barang.nama_barang}" increased by ${qty} ${barang.satuan}.`);
      setKodeBarang(''); setBarang(null); setJumlah(''); setKeterangan('');
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
        <h2 className="font-semibold text-gray-900 mb-1">Restock Item</h2>
        <p className="text-xs text-gray-500 mb-3">
          Add more stock to an item that's already registered. This creates an incoming
          stock record (Stock In), unlike Add Item which only sets the starting number.
        </p>
        <div className="space-y-3">
          <div>
            <Label>Item Code</Label>
            <div className="flex gap-2">
              <Input
                value={kodeBarang}
                onChange={(e) => setKodeBarang(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && lookupBarang()}
                placeholder="e.g. BRG001"
                autoFocus
              />
              <Button variant="secondary" onClick={lookupBarang}>Search</Button>
            </div>
            {errBarang && <p className="text-xs text-red-600 mt-1">{errBarang}</p>}
            {barang && (
              <div className="mt-2 bg-primary-light rounded-lg p-2.5">
                <p className="text-sm font-medium text-gray-900">{barang.nama_barang}</p>
                <p className="text-xs text-gray-600">current stock: {barang.stok} {barang.satuan}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity In</Label>
              <Input type="number" min={1} value={jumlah} onChange={(e) => setJumlah(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Supplier Name</Label>
              <Input value={namaSupplier} onChange={(e) => setNamaSupplier(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Optional" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Restock'}
          </Button>
        </div>
      </Card>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Restock History</h3>
        <div className="space-y-2">
          {history.map((h) => (
            <Card key={h.id} className="py-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {itemNames[h.kode_barang] ?? h.kode_barang} &middot; +{h.jumlah}
                  </p>
                  {h.nama_supplier && <p className="text-xs text-gray-500">from {h.nama_supplier}</p>}
                  {h.keterangan && <p className="text-xs text-gray-400 italic">{h.keterangan}</p>}
                </div>
                <Badge color="green">{h.tanggal}</Badge>
              </div>
            </Card>
          ))}
          {history.length === 0 && <p className="text-sm text-gray-400">No restock history yet.</p>}
        </div>
      </div>
    </div>
  );
}
