import React, { useState } from 'react';
import api from '../services/api';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ResetPasswordPage({ onNavigateLogin }) {
  const [step, setStep] = useState(1); // 1: Request, 2: Confirm
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [tokenPreview, setTokenPreview] = useState(null);

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/reset-password/request', { email });
      setSuccessMsg(res.data.message);
      if (res.data.token_preview) {
        setTokenPreview(res.data.token_preview);
        setToken(res.data.token_preview);
      }
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Gagal memproses permintaan reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/reset-password/confirm', {
        token,
        new_password: newPassword,
      });
      setSuccessMsg(res.data.message);
      setStep(3);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Gagal memperbarui password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        
        {/* Top return link */}
        <button
          onClick={onNavigateLogin}
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Login</span>
        </button>

        {/* Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white font-heading">
              Reset Password
            </h3>
            <p className="text-xs text-slate-400">
              {step === 1
                ? 'Masukkan email Anda untuk menerima token pemulihan sandi.'
                : step === 2
                ? 'Masukkan token verifikasi dan buat kata sandi baru.'
                : 'Kata sandi Anda berhasil diperbarui.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: REQUEST TOKEN */}
          {step === 1 && (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Alamat Email Terdaftar
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@extractiontools.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-glow-brand flex items-center justify-center space-x-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Kirim Token Reset</span>}
              </button>
            </form>
          )}

          {/* STEP 2: CONFIRM NEW PASSWORD */}
          {step === 2 && (
            <form onSubmit={handleConfirm} className="space-y-4">
              {tokenPreview && (
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
                  <p className="font-semibold">Token Simulasi (Testing):</p>
                  <p className="font-mono text-[11px] break-all select-all mt-1">{tokenPreview}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Token Reset Password
                </label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste token disini"
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Password Baru (Min. 6 Karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors shadow-glow-emerald flex items-center justify-center space-x-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Simpan Password Baru</span>}
              </button>
            </form>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-200">{successMsg}</p>
              <button
                onClick={onNavigateLogin}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
              >
                Kembali ke Login Sekarang
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
