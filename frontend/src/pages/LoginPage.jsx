import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, Lock, User, AlertCircle, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function LoginPage({ onNavigateReset }) {
  const { login, sessionError } = useAuth();
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conflictDevice, setConflictDevice] = useState(false);

  const handleSubmit = async (e, force = false) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(identifier, password, force);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        setConflictDevice(true);
        setError(err.response?.data?.detail || 'Akun Anda sedang aktif di perangkat lain.');
      } else {
        setError(err.response?.data?.detail || 'Gagal login. Periksa username dan password Anda.');
        setConflictDevice(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-glow-brand items-center justify-center mb-2">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Layers className="w-7 h-7 text-indigo-400" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
            Extraction<span className="text-indigo-400">Hub</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Sistem ekstraksi data multi-format, subset matcher, dan rekapitulasi lembur cerdas.
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          
          {/* Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Session Expired / Device Conflict Alerts */}
          {(sessionError || error) && (
            <div className={`mb-5 p-4 rounded-xl border flex items-start space-x-3 text-xs ${
              conflictDevice
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              {conflictDevice ? (
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-2">
                <p className="font-semibold">{conflictDevice ? 'Pencegahan Multi-Perangkat Aktif' : 'Pemberitahuan Sesi'}</p>
                <p className="opacity-90">{error || sessionError}</p>

                {/* Force Login Button */}
                {conflictDevice && (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={loading}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-sm"
                  >
                    <span>Paksa Login di Perangkat Ini</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
            
            {/* Username / Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Username / Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin atau user@perusahaan.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onNavigateReset}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Lupa Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
                loading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-glow-brand'
              }`}
            >
              {loading ? (
                <span>Memverifikasi Sesi...</span>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Quick Demo Credentials helper */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-400 mb-2">Akun Demo Standar:</p>
            <div className="inline-flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
              <span>Username: <strong className="text-indigo-400">admin</strong></span>
              <span className="text-slate-600">|</span>
              <span>Pass: <strong className="text-indigo-400">admin123</strong></span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
