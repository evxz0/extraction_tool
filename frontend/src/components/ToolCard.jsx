import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function ToolCard({
  id,
  title,
  subtitle,
  description,
  icon: Icon,
  badge,
  badgeColor = "indigo",
  tags = [],
  onClick,
  actionText = "Buka Workspace"
}) {
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col justify-between rounded-2xl glass-card p-6 cursor-pointer glass-card-hover border border-slate-800/80 hover:border-indigo-500/40"
    >
      {/* Top ambient glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-300 pointer-events-none" />

      <div>
        {/* Header with Icon & Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 group-hover:scale-105 group-hover:border-indigo-500/40 transition-all duration-200 shadow-inner">
            <Icon className="w-6 h-6" />
          </div>

          {badge && (
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              badgeColor === 'emerald'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : badgeColor === 'amber'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}>
              {badge}
            </span>
          )}
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-xl font-bold text-white font-heading group-hover:text-indigo-300 transition-colors">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs font-medium text-indigo-400/90 mt-0.5 mb-2">{subtitle}</p>
        )}
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
          {description}
        </p>

        {/* Feature Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {tags.map((t, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-[11px] font-medium bg-slate-800/80 text-slate-300 rounded-md border border-slate-700/50"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-400 transition-colors">
          {actionText}
        </span>
        <div className="w-8 h-8 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all duration-200">
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}
