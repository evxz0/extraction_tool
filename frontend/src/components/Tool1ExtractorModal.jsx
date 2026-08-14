import React, { useState } from 'react';
import api from '../services/api';
import Dropzone from './Dropzone';
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpDown,
  Filter,
  DollarSign,
  Layers
} from 'lucide-react';

export default function Tool1ExtractorModal() {
  const [file, setFile] = useState(null);
  const [targetUserId, setTargetUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleExtract = async () => {
    if (!file) {
      setError('Silakan pilih file data (.txt, .csv, .xlsx) terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (targetUserId.trim()) {
        formData.append('target_user_id', targetUserId.trim());
      }

      const res = await api.post('/tools/extractor/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Gagal mengekstraksi data dari file.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!file) return;
    setExporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (targetUserId.trim()) {
        formData.append('target_user_id', targetUserId.trim());
      }

      const res = await api.post('/tools/extractor/export', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Hasil_Ekstraksi_${file.name.split('.')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      setError('Gagal mengunduh file Excel hasil ekstraksi.');
    } finally {
      setExporting(false);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(number || 0);
  };

  const filteredData = results?.data?.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.user_id?.toLowerCase().includes(q) ||
      item.outlet_name?.toLowerCase().includes(q) ||
      item.transaction_time?.toLowerCase().includes(q) ||
      item.amount?.toString().includes(q)
    );
  }) || [];

  const totalSum = filteredData.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Configuration Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-xl bg-slate-950/60 border border-slate-800">
        
        {/* Dropzone */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            File Sumber (.txt, .csv, .xlsx)
          </label>
          <Dropzone
            onFileSelect={(f) => setFile(f)}
            selectedFile={file}
            onClearFile={() => { setFile(null); setResults(null); }}
            title="Pilih File Data Transaksi"
            subtitle="Mendukung TXT terstruktur/mentah, CSV, dan Excel spreadsheet"
            disabled={loading}
          />
        </div>

        {/* User ID & Action */}
        <div className="flex flex-col justify-between space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Target User ID / Identifier (Opsional)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Contoh: USR1001 atau ID Outlet"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
                disabled={loading}
              />
              <Filter className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Kosongkan untuk mengekstrak seluruh User ID yang ada pada dokumen.
            </p>
          </div>

          <button
            onClick={handleExtract}
            disabled={loading || !file}
            className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all duration-200 ${
              loading || !file
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow-brand'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Mengekstrak Data...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                <span>Mulai Ekstraksi Data</span>
              </>
            )}
          </button>
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

      {/* Results View */}
      {results && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Summary Metric Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Baris Terekstrak</p>
                <p className="text-lg font-bold text-white font-heading">{results.total_extracted} Baris</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Akumulasi Nominal</p>
                <p className="text-lg font-bold text-emerald-400 font-heading">{formatRupiah(totalSum)}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Unduh Spreadsheet</p>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">Format .XLSX Bersih</p>
              </div>
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors shadow-glow-emerald"
              >
                {exporting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Interactive Search & Table Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Cari waktu, nominal, outlet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl glass-input text-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Menampilkan {filteredData.length} dari {results.total_extracted} data
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/80">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800 sticky top-0 z-10 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">No</th>
                    <th className="px-4 py-3">Waktu Transaksi</th>
                    <th className="px-4 py-3">User ID / Ref</th>
                    <th className="px-4 py-3 text-right">Nominal (Rp)</th>
                    <th className="px-4 py-3">Nama Outlet / Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada data yang sesuai dengan kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-2.5 text-center text-slate-400 font-mono">
                          {row.row_index || idx + 1}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-200">
                          {row.transaction_time || '-'}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-indigo-300">
                          {row.user_id || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-400">
                          {formatRupiah(row.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-200">
                          {row.outlet_name || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
