import { useEffect, useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import { Card, Input, Label, Button } from '../components/ui';
import { getKaryawanList, upsertKaryawan, updateKaryawan, deleteKaryawan } from '../lib/api';
import type { KaryawanRecord } from '../types';

const EMPTY_FORM = { kode_barcode: '', nama_karyawan: '', divisi: '' };

export default function AdminEmployees() {
  const [list, setList] = useState<KaryawanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadList = async () => {
    try {
      setList(await getKaryawanList());
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const startEdit = (k: KaryawanRecord) => {
    setEditingId(k.id);
    setForm({ kode_barcode: k.kode_barcode, nama_karyawan: k.nama_karyawan, divisi: k.divisi });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.kode_barcode || !form.nama_karyawan || !form.divisi) {
      setError('Barcode code, name, and division are all required.');
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await updateKaryawan(editingId, form.kode_barcode.trim(), form.nama_karyawan.trim(), form.divisi.trim());
      } else {
        await upsertKaryawan(form.kode_barcode.trim(), form.nama_karyawan.trim(), form.divisi.trim());
      }
      cancelEdit();
      await loadList();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (k: KaryawanRecord) => {
    if (!confirm(`Delete ${k.nama_karyawan}? This can't be undone.`)) return;
    try {
      await deleteKaryawan(k.id);
      await loadList();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-gray-900">{editingId ? 'Edit Employee' : 'Register Employee'}</h2>
          {editingId && (
            <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-3">
          {editingId
            ? 'Update this employee\'s details below.'
            : "Pre-register the barcode already printed on each employee's ID card, so it auto-fills instantly the first time they scan at Check Out."}
        </p>
        <div className="space-y-3">
          <div>
            <Label>Employee Barcode Code</Label>
            <Input
              value={form.kode_barcode}
              onChange={(e) => setForm((f) => ({ ...f, kode_barcode: e.target.value }))}
              placeholder="Scan the ID card here, or type it"
              autoFocus
            />
          </div>
          <div>
            <Label>Employee Name</Label>
            <Input
              value={form.nama_karyawan}
              onChange={(e) => setForm((f) => ({ ...f, nama_karyawan: e.target.value }))}
              placeholder="e.g. Budi Santoso"
            />
          </div>
          <div>
            <Label>Division</Label>
            <Input
              value={form.divisi}
              onChange={(e) => setForm((f) => ({ ...f, divisi: e.target.value }))}
              placeholder="e.g. Infrastructure"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Employee' : 'Save Employee'}
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
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Registered Employees ({list.length})</h3>
        <div className="space-y-2">
          {list.map((k) => (
            <Card key={k.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-gray-900">{k.nama_karyawan}</p>
                <p className="text-xs text-gray-500">{k.kode_barcode} &middot; {k.divisi}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(k)} className="p-2 text-gray-400 hover:text-primary" title="Edit">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(k)} className="p-2 text-gray-400 hover:text-red-600" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
          {list.length === 0 && <p className="text-sm text-gray-400">No employees registered yet.</p>}
        </div>
      </div>
    </div>
  );
}
