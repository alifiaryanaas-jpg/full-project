import { useEffect, useState } from 'react';
import { Card, Button } from '../components/ui';
import { getLaporan, downloadLaporan, getBarangList } from '../lib/api';
import type { StokSummaryRow, DetailPengambilanRow, Barang } from '../types';

type Mode = 'monthly' | 'yearly' | 'range';

// Format tanggal ke YYYY-MM-DD pakai waktu LOKAL, bukan UTC.
// (.toISOString() convert ke UTC dulu, yang bisa geser mundur 1 hari
// buat timezone di depan UTC kayak Indonesia -- ini bug yang sempat kejadian)
function toLocalISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function firstDayOfMonth(d: Date) {
  return toLocalISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}
function lastDayOfMonth(d: Date) {
  return toLocalISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}
function formatDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Warna baris Stok Akhir -- samain sama aturan di backend (report.php: warnaStok())
function stokAkhirColor(qty: number) {
  if (qty <= 15) return 'bg-red-100 text-red-700';
  if (qty <= 35) return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
}

export default function Report() {
  const today = new Date();
  const [mode, setMode] = useState<Mode>('monthly');
  const [start, setStart] = useState(firstDayOfMonth(today));
  const [end, setEnd] = useState(lastDayOfMonth(today));
  const [items, setItems] = useState<Barang[]>([]);
  const [kodeBarang, setKodeBarang] = useState<string>('all');
  const [summary, setSummary] = useState<StokSummaryRow[]>([]);
  const [detail, setDetail] = useState<DetailPengambilanRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Ambil daftar barang sekali di awal buat isi dropdown "Item" -- ini yang
  // bikin bisa lihat laporan 1 barang aja (mis. laptop dari tgl X-Y), bukan
  // cuma semua barang sekaligus.
  useEffect(() => {
    getBarangList().then(setItems).catch(() => {});
  }, []);

  const applyMode = (m: Mode) => {
    setMode(m);
    if (m === 'monthly') {
      setStart(firstDayOfMonth(today));
      setEnd(lastDayOfMonth(today));
    } else if (m === 'yearly') {
      setStart(`${today.getFullYear()}-01-01`);
      setEnd(`${today.getFullYear()}-12-31`);
    }
    // 'range' mode: let the user pick their own dates
  };

  const handleLihat = async () => {
    setLoading(true); setError('');
    try {
      const res = await getLaporan(start, end, kodeBarang);
      setSummary(res.summary);
      setDetail(res.detail);
      setLoaded(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const selectedItemName = kodeBarang !== 'all' ? items.find((b) => b.kode_barang === kodeBarang)?.nama_barang : null;

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-semibold text-gray-900 mb-3">Stock Report</h2>

        <div className="flex gap-2 mb-3">
          {(['monthly', 'yearly', 'range'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => applyMode(m)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-colors ${
                mode === m ? 'bg-ink text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">From date</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full h-10 px-2 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">To date</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full h-10 px-2 rounded-lg border border-gray-300 text-sm" />
          </div>
        </div>

        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1">Item</label>
          <select
            value={kodeBarang}
            onChange={(e) => setKodeBarang(e.target.value)}
            className="w-full h-10 px-2 rounded-lg border border-gray-300 text-sm bg-white"
          >
            <option value="all">All items</option>
            {items.map((b) => (
              <option key={b.kode_barang} value={b.kode_barang}>
                {b.nama_barang} ({b.kode_barang})
              </option>
            ))}
          </select>
        </div>

        <Button className="w-full mb-2" onClick={handleLihat} disabled={loading}>
          {loading ? 'Loading...' : 'View Report'}
        </Button>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => downloadLaporan(start, end, 'excel', kodeBarang)}>
            Download Excel
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => downloadLaporan(start, end, 'pdf', kodeBarang)}>
            Download PDF
          </Button>
        </div>

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </Card>

      {loaded && (
        <Card className="overflow-x-auto">
          <div className="text-center mb-4">
            <h3 className="font-bold text-gray-900">STOCK REPORT{selectedItemName ? ` — ${selectedItemName}` : ''}</h3>
            <p className="text-sm font-semibold text-gray-700">PT ECCO Indonesia - IT Division</p>
            <p className="text-xs text-gray-500 italic">
              Period: {formatDateLabel(start)} to {formatDateLabel(end)}
            </p>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-center text-xs text-gray-600 bg-gray-100">
                <th className="py-2 px-2">Item Code</th>
                <th className="py-2 px-2 text-left">Item Name</th>
                <th className="py-2 px-2">Starting Stock</th>
                <th className="py-2 px-2">Stock In</th>
                <th className="py-2 px-2">Stock Out</th>
                <th className="py-2 px-2">Ending Stock</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr key={row.kode_barang} className="border-b border-gray-100 last:border-0 text-center">
                  <td className="py-2 px-2 font-medium">{row.kode_barang}</td>
                  <td className="py-2 px-2 text-left">{row.nama_barang}</td>
                  <td className="py-2 px-2 tabular-nums">{row.stok_awal}</td>
                  <td className="py-2 px-2 tabular-nums">{row.barang_masuk}</td>
                  <td className="py-2 px-2 tabular-nums">{row.barang_keluar}</td>
                  <td className="py-2 px-2">
                    <span className={`inline-block min-w-[2.5rem] rounded font-semibold px-2 py-0.5 tabular-nums ${stokAkhirColor(row.stok_akhir)}`}>
                      {row.stok_akhir}
                    </span>
                  </td>
                </tr>
              ))}
              {summary.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-gray-400">No items found.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {loaded && detail.length > 0 && (
        <Card className="overflow-x-auto">
          <h3 className="text-center font-semibold text-gray-900 mb-3">ITEM CHECKOUT DETAIL</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="pb-2 pr-2">Date</th>
                <th className="pb-2 pr-2">Item</th>
                <th className="pb-2 pr-2">Qty</th>
                <th className="pb-2 pr-2">Taken By</th>
                <th className="pb-2 pr-2">Division</th>
                <th className="pb-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {detail.map((r, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-2 whitespace-nowrap">{r.tanggal}</td>
                  <td className="py-2 pr-2">{r.nama_barang}</td>
                  <td className="py-2 pr-2">{r.jumlah}</td>
                  <td className="py-2 pr-2">{r.nama_karyawan}</td>
                  <td className="py-2 pr-2">{r.divisi}</td>
                  <td className="py-2 text-gray-500 italic">{r.keterangan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
