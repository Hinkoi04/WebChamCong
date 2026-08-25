import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function FaceScanner() {
  const state = 'scanning';

  const cfg = {
    scanning: { color: '#8b5cf6', label: 'Đang chờ quét...', sub: 'Hướng mặt vào camera' }
  }[state];

  const corners = [
    'top-2 left-2 border-t-2 border-l-2',
    'top-2 right-2 border-t-2 border-r-2',
    'bottom-2 left-2 border-b-2 border-l-2',
    'bottom-2 right-2 border-b-2 border-r-2'
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-44 h-44 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-inner">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(${cfg.color} 1px, transparent 1px), linear-gradient(90deg, ${cfg.color} 1px, transparent 1px)`,
            backgroundSize: '18px 18px'
          }}
        />
        {corners.map((c, i) => (
          <div key={i} className={`absolute w-5 h-5 ${c} transition-colors duration-500`} style={{ borderColor: cfg.color }} />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-20 h-28 rounded-full border-2 transition-all duration-500"
            style={{
              borderColor: cfg.color,
              boxShadow: state === 'verified' ? `0 0 20px ${cfg.color}35` : 'none'
            }}
          />
        </div>
        {state !== 'verified' && (
          <div
            className="absolute left-0 right-0 h-px top-0 opacity-70"
            style={{
              background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
              animation: 'scanLine 2.4s linear infinite'
            }}
          />
        )}
        {state === 'verified' && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/5 animate-[fadeInScale_0.3s_ease_forwards]">
            <div className="w-11 h-11 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/25">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        )}
      </div>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: cfg.color, boxShadow: `0 0 5px ${cfg.color}` }} />
          <span className="text-xs font-mono font-bold transition-colors duration-300" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5">{cfg.sub}</p>
      </div>
    </div>
  );
}
