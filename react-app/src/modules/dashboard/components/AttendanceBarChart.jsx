import React, { useState } from 'react';

export default function AttendanceBarChart({ data }) {
  const [tip, setTip] = useState(null);
  const W = 400, H = 170, pL = 28, pB = 24, pT = 8, pR = 8;
  const iW = W - pL - pR, iH = H - pB - pT;
  const max = Math.ceil(Math.max(...data.map((d) => d.present + d.absent), 1) / 10) * 10;
  const grids = [0, 10, 20, 30, 40, 50].filter((v) => v <= max);
  const gW = iW / data.length, bW = gW * 0.28, gap = gW * 0.05;

  return (
    <div className="relative select-none">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} onMouseLeave={() => setTip(null)}>
        {grids.map((v) => {
          const y = pT + iH - (v / max) * iH;
          return (
            <g key={v}>
              <line x1={pL} x2={W - pR} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
              <text x={pL - 4} y={y + 1} textAnchor="end" fontSize={5} fill="#71717a" dominantBaseline="middle" className="font-mono">
                {v}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const cx = pL + i * gW + gW / 2, ph = (d.present / max) * iH, ah = (d.absent / max) * iH;
          const px = cx - gap / 2 - bW, ax = cx + gap / 2;
          return (
            <g
              key={i}
              onMouseMove={(e) => {
                const r = e.currentTarget.closest('svg').getBoundingClientRect();
                setTip({ x: e.clientX - r.left, y: e.clientY - r.top, d });
              }}
              className="cursor-pointer"
            >
              <rect x={pL + i * gW} y={pT} width={gW} height={iH} fill="transparent" />
              <rect x={px} y={pT + iH - ph} width={bW} height={ph > 0 ? ph : 0} fill="#10B981" rx={1} />
              <rect x={ax} y={pT + iH - ah} width={bW} height={ah > 0 ? ah : 0} fill="#EF4444" rx={1} opacity={0.75} />
              <text x={cx} y={H - pB + 8} textAnchor="middle" fontSize={5.5} fill="#a1a1aa" className="font-medium">
                {d.day}
              </text>
            </g>
          );
        })}
      </svg>
      {tip && (
        <div
          className="pointer-events-none absolute z-10 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs shadow-2xl animate-[fadeInScale_0.15s_ease_both]"
          style={{ left: tip.x + 12, top: Math.max(4, tip.y - 64) }}
        >
          <div className="font-bold text-zinc-100 border-b border-zinc-800 pb-1 mb-1.5">{tip.d.day}</div>
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" /> Có mặt: <b>{tip.d.present}</b>
          </div>
          <div className="flex items-center gap-2 text-red-400 mt-1">
            <span className="w-2 h-2 rounded-sm bg-red-400 inline-block" /> Vắng mặt: <b>{tip.d.absent}</b>
          </div>
        </div>
      )}
    </div>
  );
}
