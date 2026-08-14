import React, { useState } from 'react';
import api from '../services/api';
import Dropzone from './Dropzone';
import { 
  FileSpreadsheet, 
  Users, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Edit3
} from 'lucide-react';

export default function Tool3RecapModal() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map Accounts, 3: Export/Done
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  // Parsed API Data
  const [parsedData, setParsedData] = useState(null);
  // Account mapping state: { "123456": "Budi Santoso", "987654": "Siti Rahma" }
  const [accountMapping, setAccountMapping] = useState({});
  const [selectedYears, setSelectedYears] = useState([2024, 2025, 2026]);

  const handleParseLog = async () => {
    if (!file) {
      setError('Silakan pilih file log lembur (.txt) terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/tools/recap/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setParsedData(res.data);
      
      // Initialize default account mapping
      const initialMap = {};
      const savedMap = JSON.parse(localStorage.getItem('saved_account_mapping') || '{}');
      res.data.unique_accounts.forEach((acc, idx) => {
        initialMap[acc] = savedMap[acc] || `Karyawan ${idx + 1}`;
      });
      setAccountMapping(initialMap);

      if (res.data.years_detected && res.data.years_detected.length > 0) {
        // Merge detected years with defaults [2024, 2025, 2026]
        const allYears = Array.from(new Set([...res.data.years_detected, 2024, 2025, 2026])).sort();
        setSelectedYears(allYears);
      }

      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Gagal memproses dan mem-parsing log lembur.');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (accNo, name) => {
    setAccountMapping((prev) => ({
      ...prev,
      [accNo]: name
    }));
  };

  const handleGenerateExcel = async () => {
    if (!file) return;

    setGenerating(true);
    setError(null);
    try {
      // Save mapping to localStorage for user convenience
      localStorage.setItem('saved_account_mapping', JSON.stringify(accountMapping));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping_json', JSON.stringify(accountMapping));
      formData.append('years_json', JSON.stringify(selectedYears));

      const res = await api.post('/tools/recap/generate-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rekap_Lembur_DualSheet_${file.name.split('.')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setStep(3);
    } catch (err) {
      console.error(err);
      setError('Gagal membuat file Excel Dual-Sheet.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleYear = (y) => {
    if (selectedYears.includes(y)) {
      if (selectedYears.length > 1) {
        setSelectedYears(selectedYears.filter((item) => item !== y));
      }
    } else {
      setSelectedYears([...selectedYears, y].sort());
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Wizard Progress Steps */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/70 border border-slate-800">
        <div className={`flex items-center space-x-2.5 ${step >= 1 ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
            step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            1
          </div>
          <span className="text-xs sm:text-sm">Upload Log File (.txt)</span>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-600" />

        <div className={`flex items-center space-x-2.5 ${step >= 2 ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
            step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            2
          </div>
          <span className="text-xs sm:text-sm">Pemetaan Nama Karyawan</span>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-600" />

        <div className={`flex items-center space-x-2.5 ${step === 3 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
            step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            3
          </div>
          <span className="text-xs sm:text-sm">Download Dual-Sheet .xlsx</span>
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

      {/* STEP 1: UPLOAD LOG */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white font-heading">
                Upload File Log Mentah Rekening Koran Lembur
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Sistem akan memecah blok log (36 PEMINDAHAN), mengekstrak nomor rekening, tanggal transaksi, dan nominal tanpa menggabungkan baris transaksi identik.
              </p>
            </div>

            <Dropzone
              onFileSelect={(f) => setFile(f)}
              selectedFile={file}
              onClearFile={() => setFile(null)}
              accept=".txt,.log"
              title="Upload File Log Lembur (.txt)"
              subtitle="Format log teks transaksi pemindahan bank"
              disabled={loading}
            />

            <button
              onClick={handleParseLog}
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
                  <span>Mem-parsing Struktur Log...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Lanjut ke Pemetaan Nama (Step 2)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: MAPPING NAMA KARYAWAN */}
      {step === 2 && parsedData && (
        <div className="space-y-5 animate-fade-in">
          
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Rekening Terdeteksi</p>
                <p className="text-base font-bold text-white font-heading">{parsedData.unique_accounts.length} Orang</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Total Transaksi Lembur</p>
                <p className="text-base font-bold text-emerald-400 font-heading">{parsedData.total_transactions} Baris</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Tahun Transaksi</p>
                <p className="text-base font-bold text-cyan-400 font-heading">{parsedData.years_detected.join(', ')}</p>
              </div>
            </div>
          </div>

          {/* Mapping Table */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-white font-heading">
                  Pemetaan Nomor Rekening ke Nama Karyawan
                </h4>
                <p className="text-xs text-slate-400">
                  Nama yang dimasukkan akan menjadi header kolom pada Sheet 1 dan nama baris pada Sheet 2.
                </p>
              </div>

              {/* Target Years selection */}
              <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400 px-2">Tahun Recap:</span>
                {[2024, 2025, 2026, 2027].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => toggleYear(y)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                      selectedYears.includes(y)
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Mapping Form Grid */}
            <div className="rounded-xl border border-slate-800 overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800 sticky top-0 z-10 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5 w-16 text-center">No</th>
                    <th className="px-4 py-2.5 w-48">Nomor Rekening</th>
                    <th className="px-4 py-2.5">Nama Karyawan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
                  {parsedData.unique_accounts.map((acc, idx) => (
                    <tr key={acc} className="hover:bg-slate-900/40">
                      <td className="px-4 py-2.5 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-indigo-300">
                        {acc}
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="relative">
                          <input
                            type="text"
                            value={accountMapping[acc] || ''}
                            onChange={(e) => handleNameChange(acc, e.target.value)}
                            placeholder={`Masukkan nama untuk rekening ${acc}`}
                            className="w-full px-3 py-1.5 rounded-lg glass-input text-xs"
                          />
                          <Edit3 className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800"
              >
                Kembali ke Upload
              </button>

              <button
                onClick={handleGenerateExcel}
                disabled={generating}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-glow-emerald transition-colors"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Membangun Dual-Sheet .XLSX...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Generate & Download Excel (.xlsx)</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* STEP 3: SUCCESS & COMPLETED */}
      {step === 3 && (
        <div className="p-8 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-center space-y-4 animate-fade-in">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-emerald">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white font-heading">
              File Rekap Lembur Berhasil Dibuat!
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              File Excel dual-sheet telah otomatis diunduh. Sheet 1 berisi matriks transaksi harian (dengan pemisahan sub-baris identik), dan Sheet 2 berisi rekapan bulanan multi-tahun (2024, 2025, 2026) lengkap dengan formula =SUM().
            </p>
          </div>

          <div className="flex justify-center space-x-3 pt-3">
            <button
              type="button"
              onClick={handleGenerateExcel}
              disabled={generating}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Ulang Excel</span>
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setFile(null); setParsedData(null); }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Proses File Log Lain
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
