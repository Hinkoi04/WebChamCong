import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import {
  Building2, TrendingUp, Activity,
  Download, ArrowUpRight, Clock
} from 'lucide-react';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [orgData, logData, statData] = await Promise.all([
          adminService.getOrganizations(),
          adminService.getAuditLogs(),
          adminService.getWeeklyAttendanceStats().catch(() => [])
        ]);
        setOrgs(orgData || []);
        setRecentLogs((logData || []).slice(0, 5));
        setWeeklyStats(statData || []);
      } catch (err) {
        console.error('Không thể tải dữ liệu dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pendingCount = orgs.filter(o => o.status === 'PENDING').length;
  const proCount = orgs.filter(o => o.plan === 'PRO').length;

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng tổ chức (Tenant)', value: loading ? '...' : orgs.length, sub: loading ? '' : `${pendingCount} đang chờ duyệt`, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Gói PRO đang hoạt động', value: loading ? '...' : proCount, sub: loading ? '' : `${orgs.length > 0 ? Math.round(proCount / orgs.length * 100) : 0}% trên tổng tổ chức`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Nhật ký hệ thống', value: loading ? '...' : recentLogs.length > 0 ? recentLogs.length + '+' : '0', sub: 'Sự kiện gần nhất', icon: Activity, color: 'text-violet-400', bg: 'bg-violet-500/10' }
        ].map((k, i) => (
          <div
            key={i}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-violet-500/30 transition-all shadow-md group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs text-zinc-400 font-medium">{k.label}</div>
                <div className="text-3xl font-bold text-zinc-100 mt-2 tracking-tight">{k.value}</div>
                <div className="text-[11px] text-zinc-500 mt-1 font-mono">{k.sub}</div>
              </div>
              <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0 border border-white/[0.03]`}>
                <k.icon className={`w-5 h-5 ${k.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & System Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Lượt chấm công toàn hệ thống</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">Thống kê tuần này (Thứ 2 – Chủ Nhật)</p>
            </div>
          </div>
          <AdminAttendanceChart data={weeklyStats} />
          <div className="flex gap-5 mt-4">
            {[{ c: 'bg-emerald-400', l: 'Điểm danh thành công' }, { c: 'bg-red-400', l: 'Vắng / Chưa quét' }].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-2 text-xs text-zinc-400">
                <div className={`w-3 h-3 rounded-md ${c}`} />
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Recent logs */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-md flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-100">Nhật ký hoạt động</h3>
            <button
              onClick={() => navigate('/admin/logs')}
              className="text-[11px] font-semibold text-violet-400 hover:underline flex items-center gap-0.5"
            >
              Xem tất cả <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto">
            {loading ? (
              <p className="text-xs text-zinc-500 text-center py-4">Đang tải...</p>
            ) : recentLogs.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">Chưa có nhật ký nào.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs border-b border-zinc-800/40 pb-3 last:border-0 last:pb-0">
                  <div className="mt-0.5 p-1 rounded bg-zinc-800">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-200 font-semibold truncate">
                      {log.actorType} #{log.actorId}
                    </p>
                    <p className="text-zinc-400 mt-0.5">
                      {log.action}: <span className="text-zinc-300 font-medium">{log.targetTable} #{log.targetId}</span>
                    </p>
                  </div>
                  <span className="font-mono text-zinc-500 text-[10px] mt-0.5">
                    {log.createdAt ? new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminAttendanceChart({ data = [] }) {
  const [tip, setTip] = useState(null);
  const chartData = data && data.length > 0 ? data : [
    { day: 'T2', present: 0, absent: 0 },
    { day: 'T3', present: 0, absent: 0 },
    { day: 'T4', present: 0, absent: 0 },
    { day: 'T5', present: 0, absent: 0 },
    { day: 'T6', present: 0, absent: 0 },
    { day: 'T7', present: 0, absent: 0 },
    { day: 'CN', present: 0, absent: 0 }
  ];

  const W = 100, H = 170, pL = 28, pB = 24, pT = 8, pR = 8;
  const iW = W - pL - pR, iH = H - pB - pT;
  const maxValues = chartData.map(d => (d.present || 0) + (d.absent || 0));
  const highest = Math.max(...maxValues, 10);
  const max = Math.ceil(highest / 10) * 10 || 50;
  const grids = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];
  const gW = iW / chartData.length, bW = gW * 0.28, gap = gW * 0.05;

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
        {chartData.map((d, i) => {
          const cx = pL + i * gW + gW / 2;
          const ph = ((d.present || 0) / max) * iH;
          const ah = ((d.absent || 0) / max) * iH;
          const px = cx - gap / 2 - bW;
          const ax = cx + gap / 2;
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
          <div className="font-bold text-zinc-100 border-b border-zinc-800 pb-1 mb-1.5">{tip.d.day} ({tip.d.date || ''})</div>
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" /> Quét mặt: <b>{tip.d.present} lượt</b>
          </div>
          <div className="flex items-center gap-2 text-red-400 mt-1">
            <span className="w-2 h-2 rounded-sm bg-red-400 inline-block" /> Chưa quét: <b>{tip.d.absent} lượt</b>
          </div>
        </div>
      )}
    </div>
  );
}
