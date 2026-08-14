import { useEffect, useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { Card, Input, Label, Button, Badge } from '../components/ui';
import { createBarang, updateBarang, deleteBarang, getBarangList } from '../lib/api';
import type { Barang } from '../types';

const KATEGORI_OPTIONS = ['PC', 'Laptop', 'Monitor', 'Cable', 'Accessories', 'Printer', 'Network', 'Other'];

function todayLocalISODate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const EMPTY_FORM = {
  kode_barang: '',
  nama_barang: '',
  kategori: KATEGORI_OPTIONS[0],
  satuan: 'unit',
  nama_supplier: '',
  kondisi: 'Baru',
  stok: '',
  tanggal_masuk: todayLocalISODate(),
};

export default function InputBarang() {
  const [list, setList] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadList = async () => {
    try {
      setList(await getBarangList());
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleChange = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const startEdit = (b: Barang) => {
    setEditingId(b.id);
    setForm({
      kode_barang: b.kode_barang,
      nama_barang: b.nama_barang,
      kategori: b.kategori,
      satuan: b.satuan,
      nama_supplier: b.nama_supplier ?? '',
      kondisi: b.kondisi,
      stok: String(b.stok),
      tanggal_masuk: b.tanggal_masuk,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.kode_barang || !form.nama_barang || !form.stok) {
      setError('Item code, item name, and stock are required.');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, stok: Number(form.stok) } as never;
      if (editingId) {
        await updateBarang(editingId, payload);
      } else {
        await createBarang(payload);
      }
      cancelEdit();
      await loadList();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (b: Barang) => {
    if (!confirm(`Delete "${b.nama_barang}"? This can't be undone.`)) return;
    try {
      await deleteBarang(b.id);
      await loadList();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">{editingId ? 'Edit Item' : 'Add Item'}</h2>
          {editingId && (
            <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <Label>Item Code (scan or type)</Label>
            <Input
              value={form.kode_barang}
              onChange={(e) => handleChange('kode_barang', e.target.value)}
              placeholder="BRG001"
              autoFocus
            />
          </div>
          <div>
            <Label>Item Name</Label>
            <Input
              value={form.nama_barang}
              onChange={(e) => handleChange('nama_barang', e.target.value)}
              placeholder="e.g. Lenovo ThinkPad Laptop"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <select
                className="w-full h-11 px-3 rounded-lg border border-gray-300"
                value={form.kategori}
                onChange={(e) => handleChange('kategori', e.target.value)}
              >
                {KATEGORI_OPTIONS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Unit</Label>
              <Input value={form.satuan} onChange={(e) => handleChange('satuan', e.target.value)} placeholder="unit / pcs / meter" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Condition</Label>
              <select
                className="w-full h-11 px-3 rounded-lg border border-gray-300"
                value={form.kondisi}
                onChange={(e) => handleChange('kondisi', e.target.value)}
              >
                <option value="Baru">New</option>
                <option value="Bekas">Used</option>
                <option value="Rusak">Damaged</option>
              </select>
            </div>
            <div>
              <Label>{editingId ? 'Stock' : 'Initial Stock'}</Label>
              <Input type="number" value={form.stok} onChange={(e) => handleChange('stok', e.target.value)} placeholder="0" />
            </div>
          </div>
          <div>
            <Label>Supplier Name</Label>
            <Input value={form.nama_supplier} onChange={(e) => handleChange('nama_supplier', e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label>Date In</Label>
            <Input type="date" value={form.tanggal_masuk} onChange={(e) => handleChange('tanggal_masuk', e.target.value)} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Item' : 'Save Item'}
            </Button>
            {editingId && (
              <Button variant="secondary" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Item List ({list.length})</h3>
        <div className="space-y-2">
          {list.map((b) => (
            <Card key={b.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-sm text-gray-900">{b.nama_barang}</p>
                <p className="text-xs text-gray-500">{b.kode_barang} &middot; {b.kategori}</p>
              </div>
              <div className="flex items-center gap-1">
                <Badge color={b.stok > 0 ? 'green' : 'red'}>{b.stok} {b.satuan}</Badge>
                <button onClick={() => startEdit(b)} className="p-2 text-gray-400 hover:text-primary" title="Edit">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(b)} className="p-2 text-gray-400 hover:text-red-600" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
