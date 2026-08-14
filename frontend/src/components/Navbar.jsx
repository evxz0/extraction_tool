import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, LogOut, User, ShieldCheck, Activity } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-glow-brand flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white font-heading">
                  Extraction<span className="text-indigo-400 font-extrabold">Hub</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                High-Performance Data & Extraction Tools
              </p>
            </div>
          </div>

          {/* User profile & Controls */}
          {user && (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>1 Device Lock Active</span>
              </div>

              <div className="flex items-center space-x-3 pl-2 sm:border-l sm:border-slate-800">
                <div className="flex items-center space-x-2 text-right">
                  <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold text-xs">
                    {user.username ? user.username.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div className="hidden md:block text-left text-xs">
                    <p className="font-semibold text-slate-200">{user.full_name || user.username}</p>
                    <p className="text-slate-400 text-[10px]">{user.email || user.username}</p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Logout"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors text-xs font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
