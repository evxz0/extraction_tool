import React, { useState } from 'react';
import api from '../services/api';
import { 
  Calculator, 
  Plus, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  ArrowRight,
  ListPlus,
  Coins
} from 'lucide-react';

export default function Tool2MatcherModal() {
  const [targetAmount, setTargetAmount] = useState('1000000');
  const [items, setItems] = useState([
    { id: 1, amount: 200000, label: 'Tx Pecahan #1' },
    { id: 2, amount: 300000, label: 'Tx Pecahan #2' },
    { id: 3, amount: 500000, label: 'Tx Pecahan #3' },
    { id: 4, amount: 150000, label: 'Tx Pecahan #4' },
    { id: 5, amount: 450000, label: 'Tx Pecahan #5' },
    { id: 6, amount: 350000, label: 'Tx Pecahan #6' }
  ]);
  const [newAmount, setNewAmount] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [solution, setSolution] = useState(null);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(number || 0);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    const parsed = parseFloat(newAmount.replace(/[^\d.-]/g, ''));
    if (!parsed || parsed <= 0) return;

    setItems([
      ...items,
      {
        id: Date.now(),
        amount: parsed,
        label: newLabel.trim() || `Tx #${items.length + 1}`
      }
    ]);
    setNewAmount('');
    setNewLabel('');
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleBulkAdd = () => {
    if (!bulkInput.trim()) return;
    const lines = bulkInput.split(/[\n,;]+/);
    const newItemsList = [];
    lines.forEach((line, idx) => {
      const clean = line.trim();
      const num = parseFloat(clean.replace(/[^\d.-]/g, ''));
      if (num && num > 0) {
        newItemsList.push({
          id: Date.now() + idx,
          amount: num,
          label: `Item #${items.length + newItemsList.length + 1}`
        });
      }
    });

    if (newItemsList.length > 0) {
      setItems([...items, ...newItemsList]);
      setBulkInput('');
      setShowBulk(false);
    }
  };

  const handleSolve = async () => {
    const target = parseFloat(targetAmount.toString().replace(/[^\d.-]/g, ''));
    if (!target || target <= 0) {
      setError('Masukkan target nominal penarikan yang valid.');
      return;
    }

    if (items.length === 0) {
      setError('Daftar transaksi pecahan tidak boleh kosong.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/tools/matcher/solve', {
        target_amount: target,
        items: items.map((i) => ({ id: i.id, amount: i.amount, label: i.label })),
        max_combinations: 10
      });
      setSolution(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Gagal memproses algoritma matching.');
    } finally {
      setLoading(false);
    }
  };

  const totalPool = items.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Configuration Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 rounded-xl bg-slate-950/60 border border-slate-800">
        
        {/* Left 2 Cols: Target Amount & Items */}
        <div className="md:col-span-2 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Target Nominal Penarikan (Rp)
            </label>
            <div className="relative">
              <input
                type="text"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Contoh: 1.000.000"
                className="w-full px-4 py-2.5 rounded-xl glass-input text-base font-semibold font-mono text-emerald-400"
                disabled={loading}
              />
              <Coins className="w-5 h-5 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              {[500000, 1000000, 1500000, 2000000, 5000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTargetAmount(amt.toString())}
                  className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Add item Form */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Tambah Transaksi Pecahan</span>
              <button
                type="button"
                onClick={() => setShowBulk(!showBulk)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>{showBulk ? 'Tutup Input Massal' : 'Input Massal (Paste)'}</span>
              </button>
            </div>

            {showBulk ? (
              <div className="space-y-2 pt-1">
                <textarea
                  rows={3}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="Paste daftar nominal disini (pisahkan dengan koma atau baris baru), contoh:&#10;200000&#10;300000&#10;500000"
                  className="w-full p-2.5 rounded-lg glass-input text-xs font-mono"
                />
                <button
                  onClick={handleBulkAdd}
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
                >
                  Tambahkan ke Pool
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddItem} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nominal (mis: 250000)"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-1/2 px-3 py-1.5 rounded-lg glass-input text-xs font-mono"
                />
                <input
                  type="text"
                  placeholder="Keterangan / Label (opsional)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-1/2 px-3 py-1.5 rounded-lg glass-input text-xs"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 font-medium text-xs flex items-center space-x-1 shrink-0 border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Col: Pool Stats & Trigger */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Pool Pecahan</p>
            <div className="mt-2 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Item:</span>
                <span className="font-semibold text-slate-200">{items.length} transaksi</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Akumulasi:</span>
                <span className="font-semibold text-emerald-400 font-mono">{formatRupiah(totalPool)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => { setItems([]); setSolution(null); }}
                className="w-full py-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-xs font-medium border border-slate-700/60 transition-colors"
              >
                Kosongkan Daftar ({items.length})
              </button>
            )}

            <button
              onClick={handleSolve}
              disabled={loading || items.length === 0}
              className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all duration-200 ${
                loading || items.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-brand'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menghitung Kombinasi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Cari Kombinasi (Subset Sum)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Terjadi Kesalahan</p>
            <p className="text-xs text-red-300/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Pool Items List Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Daftar Pecahan Tersedia ({items.length})
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto p-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col justify-between group transition-colors"
            >
              <div className="truncate">
                <p className="text-[11px] text-slate-400 truncate">{item.label}</p>
                <p className="text-xs font-semibold text-emerald-400 font-mono mt-0.5">
                  {formatRupiah(item.amount)}
                </p>
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="mt-2 text-[10px] text-slate-400 hover:text-red-400 self-end transition-colors flex items-center space-x-0.5"
                title="Hapus"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Solution Results */}
      {solution && (
        <div className="space-y-4 pt-4 border-t border-slate-800 animate-fade-in">
          
          {/* Solution Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            solution.found_exact
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <div className="flex items-center space-x-3">
              {solution.found_exact ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {solution.found_exact
                    ? `Ditemukan ${solution.match_count} Kombinasi Tepat (Exact Match)`
                    : 'Tidak Ditemukan Kombinasi Tepat'}
                </p>
                <p className="text-xs opacity-90">
                  Target: <span className="font-mono font-semibold">{formatRupiah(solution.target_amount)}</span>
                  {!solution.found_exact && solution.closest_match && (
                    <span> — Menampilkan kombinasi terdekat (Selisih: {formatRupiah(Math.abs(solution.closest_match.difference))})</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Combinations Cards */}
          <div className="space-y-3">
            {solution.found_exact ? (
              solution.exact_matches.map((match, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        Kombinasi {match.item_count} Transaksi
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400">Total Akurat:</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {formatRupiah(match.total_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Items Chips */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {match.items.map((itm, iIdx) => (
                      <div
                        key={iIdx}
                        className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-2"
                      >
                        <span className="text-xs text-slate-300">{itm.label}:</span>
                        <span className="text-xs font-semibold text-emerald-400 font-mono">
                          {formatRupiah(itm.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : solution.closest_match ? (
              <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400">
                    Kombinasi Terdekat ({solution.closest_match.item_count} Transaksi)
                  </span>
                  <span className="text-sm font-bold text-amber-300 font-mono">
                    Total: {formatRupiah(solution.closest_match.total_amount)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {solution.closest_match.items.map((itm, iIdx) => (
                    <div
                      key={iIdx}
                      className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-2"
                    >
                      <span className="text-xs text-slate-300">{itm.label}:</span>
                      <span className="text-xs font-semibold text-emerald-400 font-mono">
                        {formatRupiah(itm.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

        </div>
      )}

    </div>
  );
}
