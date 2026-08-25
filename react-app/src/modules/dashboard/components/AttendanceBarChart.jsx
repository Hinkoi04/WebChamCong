import React, { useState } from 'react';

export default function AttendanceBarChart({ data = [], height = 220 }) {
  const [tip, setTip] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-zinc-500 font-medium">
        Không có dữ liệu biểu đồ trong khoảng thời gian này
      </div>
    );
  }

  const W = 600;
  const H = height;
  const pL = 34;
  const pB = 28;
  const pT = 12;
  const pR = 12;
  const iW = W - pL - pR;
  const iH = H - pB - pT;

  const maxVal = Math.max(
    ...data.map((d) => (d.present || 0) + (d.absent || 0)),
    ...data.map((d) => (d.onTime || 0) + (d.late || 0) + (d.early || 0) + (d.absent || 0)),
    1
  );

  const roundedMax = Math.max(5, Math.ceil(maxVal / 5) * 5);
  const gridSteps = 4;
  const grids = Array.from({ length: gridSteps + 1 }, (_, i) => Math.round((roundedMax / gridSteps) * i));

  const gW = iW / data.length;
  // Adaptive bar width based on number of items
  const bW = Math.max(2, Math.min(18, gW * 0.4));
  const gap = Math.max(1, gW * 0.08);

  return (
    <div className="relative select-none w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible" onMouseLeave={() => setTip(null)}>
        {/* Grid lines */}
        {grids.map((v) => {
          const y = pT + iH - (v / roundedMax) * iH;
          return (
            <g key={v}>
              <line x1={pL} x2={W - pR} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" strokeWidth={0.7} />
              <text x={pL - 6} y={y + 1} textAnchor="end" fontSize={8} fill="#71717a" dominantBaseline="middle" className="font-mono">
                {v}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const cx = pL + i * gW + gW / 2;

          const presentCount = d.present ?? ((d.onTime || 0) + (d.late || 0) + (d.early || 0));
          const absentCount = d.absent || 0;
          const lateCount = d.late || 0;
          const onTimeCount = d.onTime ?? Math.max(0, presentCount - lateCount);

          const ph = (presentCount / roundedMax) * iH;
          const ah = (absentCount / roundedMax) * iH;

          const px = cx - gap / 2 - bW;
          const ax = cx + gap / 2;

          // Skip every nth label if too many bars
          const showLabel =
            data.length <= 15 ||
            i === 0 ||
            i === data.length - 1 ||
            (data.length <= 31 && i % 2 === 0) ||
            i % 3 === 0;

          return (
            <g
              key={i}
              onMouseMove={(e) => {
                const r = e.currentTarget.closest('svg').getBoundingClientRect();
                setTip({
                  x: e.clientX - r.left,
                  y: e.clientY - r.top,
                  d: {
                    ...d,
                    present: presentCount,
                    absent: absentCount,
                    onTime: onTimeCount,
                    late: lateCount
                  }
                });
              }}
              className="cursor-pointer group"
            >
              {/* Invisible full height hover capture */}
              <rect x={pL + i * gW} y={pT} width={gW} height={iH} fill="transparent" className="hover:fill-white/[0.02]" />

              {/* Present Bar (Emerald) */}
              <rect
                x={px}
                y={pT + iH - Math.max(0, ph)}
                width={bW}
                height={Math.max(0, ph)}
                fill="#10B981"
                rx={Math.min(2, bW / 2)}
                className="transition-all duration-150 group-hover:brightness-125"
              />

              {/* Absent Bar (Red) */}
              <rect
                x={ax}
                y={pT + iH - Math.max(0, ah)}
                width={bW}
                height={Math.max(0, ah)}
                fill="#EF4444"
                opacity={0.8}
                rx={Math.min(2, bW / 2)}
                className="transition-all duration-150 group-hover:brightness-125 group-hover:opacity-100"
              />

              {/* X Axis Label */}
              {showLabel && (
                <text
                  x={cx}
                  y={H - pB + 14}
                  textAnchor="middle"
                  fontSize={Math.max(7, Math.min(9, 140 / data.length))}
                  fill="#a1a1aa"
                  className="font-medium"
                >
                  {d.label || d.day}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {tip && (
        <div
          className="pointer-events-none absolute z-20 bg-zinc-900/95 backdrop-blur-md border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs shadow-2xl animate-[fadeInScale_0.15s_ease_both]"
          style={{
            left: Math.min(Math.max(10, tip.x - 60), 450),
            top: Math.max(0, tip.y - 85)
          }}
        >
          <div className="font-bold text-zinc-100 border-b border-zinc-800 pb-1 mb-1.5 flex items-center justify-between gap-3">
            <span>{tip.d.label || tip.d.day}</span>
            {tip.d.dateStr && <span className="text-[10px] text-zinc-400 font-mono">{tip.d.dateStr}</span>}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" /> Có mặt
              </span>
              <span className="font-bold font-mono">{tip.d.present}</span>
            </div>
            {tip.d.onTime !== undefined && (
              <div className="flex items-center justify-between gap-4 text-zinc-400 text-[11px] pl-3.5">
                <span>• Đúng giờ:</span>
                <span className="font-mono">{tip.d.onTime}</span>
              </div>
            )}
            {tip.d.late > 0 && (
              <div className="flex items-center justify-between gap-4 text-amber-400 text-[11px] pl-3.5">
                <span>• Đi muộn:</span>
                <span className="font-mono">{tip.d.late}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 text-red-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-red-400 inline-block" /> Vắng mặt
              </span>
              <span className="font-bold font-mono">{tip.d.absent}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
