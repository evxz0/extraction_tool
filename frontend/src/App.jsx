import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ToolsHub from './pages/ToolsHub';
import { RefreshCw } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'reset-password'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Memuat Sistem Extraction Hub...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="grow">
        {isAuthenticated ? (
          <ToolsHub />
        ) : (
          <>
            {currentView === 'login' ? (
              <LoginPage onNavigateReset={() => setCurrentView('reset-password')} />
            ) : (
              <ResetPasswordPage onNavigateLogin={() => setCurrentView('login')} />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Extraction Hub. All rights reserved.</p>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>FastAPI Backend (Render)</span>
            <span>•</span>
            <span>React + Vite (Vercel)</span>
            <span>•</span>
            <span>Supabase + Redis Lock</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
