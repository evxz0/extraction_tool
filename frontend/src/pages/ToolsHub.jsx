import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ToolCard from '../components/ToolCard';
import ModalDrawer from '../components/ModalDrawer';
import Tool1ExtractorModal from '../components/Tool1ExtractorModal';
import Tool2MatcherModal from '../components/Tool2MatcherModal';
import Tool3RecapModal from '../components/Tool3RecapModal';
import { 
  FileSpreadsheet, 
  Calculator, 
  Table2, 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  Zap,
  CheckCircle,
  FileCode
} from 'lucide-react';

export default function ToolsHub() {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState(null); // 'tool1', 'tool2', 'tool3', or null

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl glass-card p-6 sm:p-10 border border-slate-800/80 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>High-Performance Data Tools Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Selamat Datang, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-cyan-300">{user?.full_name || user?.username || 'User'}</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Pusat utilitas ekstraksi data cerdas, algoritma pencocokan pecahan transaksi nominal (Subset Sum), dan generator matriks rekapitulasi biaya lembur multi-tahun.
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>In-Memory Streaming Engine</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Strict 1-Device Session Locking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of 3 Main Tool Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white font-heading">
              Tools Hub Directory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pilih modul workspace di bawah untuk mulai memproses data Anda.
            </p>
          </div>
          <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            3 Tools Tersedia
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* TOOL 1 CARD */}
          <ToolCard
            id="tool1"
            title="Multi-Format Data Extractor"
            subtitle="Tool #1 • Parsing Fleksibel"
            description="Ekstraksi terstruktur waktu transaksi, nominal nominal rupiah, dan nama merchant/outlet berdasarkan User ID dari file .txt mentah, .csv, atau spreadsheet .xlsx."
            icon={FileSpreadsheet}
            badge="Multi-Format"
            badgeColor="indigo"
            tags={['.TXT / .CSV / .XLSX', 'Regex Extractor', 'Export Excel']}
            onClick={() => setActiveModal('tool1')}
            actionText="Buka Data Extractor"
          />

          {/* TOOL 2 CARD */}
          <ToolCard
            id="tool2"
            title="Simsem Account Matcher"
            subtitle="Tool #2 • Subset Sum Algorithm"
            description="Algoritma pencocokan subset sum pintar untuk mengidentifikasi kombinasi pecahan transaksi return/withdrawal yang tepat menghasilkan target nominal yang ditentukan."
            icon={Calculator}
            badge="Algorithm Solver"
            badgeColor="emerald"
            tags={['Subset Sum Problem', 'Dynamic Programming', 'Backtracking']}
            onClick={() => setActiveModal('tool2')}
            actionText="Buka Account Matcher"
          />

          {/* TOOL 3 CARD */}
          <ToolCard
            id="tool3"
            title="Overtime Matrix & Dual-Sheet Recap"
            subtitle="Tool #3 • Multi-Year Recap"
            description="Parsing log mutasi rekening lembur bank, pemetaan nomor rekening ke nama karyawan, dan pembuatan file Excel Dual-Sheet otomatis dengan formula =SUM() dan format sub-baris identik."
            icon={Table2}
            badge="Dual-Sheet Excel"
            badgeColor="amber"
            tags={['36 PEMINDAHAN Log', 'Account Mapping', 'Dual-Sheet .XLSX']}
            onClick={() => setActiveModal('tool3')}
            actionText="Buka Recap Generator"
          />

        </div>
      </div>

      {/* WORKSPACE MODALS / DRAWERS */}

      {/* Tool 1 Modal */}
      <ModalDrawer
        isOpen={activeModal === 'tool1'}
        onClose={() => setActiveModal(null)}
        title="Tool 1: Multi-Format Specific Data Extractor"
        subtitle="Ekstraksi Waktu, Nominal, dan Merchant berdasarkan User ID dari dokumen .txt, .csv, .xlsx"
        icon={FileSpreadsheet}
        badge="Tool 1"
      >
        <Tool1ExtractorModal />
      </ModalDrawer>

      {/* Tool 2 Modal */}
      <ModalDrawer
        isOpen={activeModal === 'tool2'}
        onClose={() => setActiveModal(null)}
        title="Tool 2: Simsem Account Matcher (Subset Sum)"
        subtitle="Algoritma pencarian kombinasi pecahan transaksi yang presisi sesuai target nominal penarikan"
        icon={Calculator}
        badge="Tool 2"
      >
        <Tool2MatcherModal />
      </ModalDrawer>

      {/* Tool 3 Modal */}
      <ModalDrawer
        isOpen={activeModal === 'tool3'}
        onClose={() => setActiveModal(null)}
        title="Tool 3: Overtime Expense Matrix & Multi-Year Recap Generator"
        subtitle="Parsing log transaksi lembur, pemetaan nama karyawan, dan generate Dual-Sheet Excel (.xlsx)"
        icon={Table2}
        badge="Tool 3"
      >
        <Tool3RecapModal />
      </ModalDrawer>

    </main>
  );
}
