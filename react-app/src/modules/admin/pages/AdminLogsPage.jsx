import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Search, RefreshCw } from 'lucide-react';
import Pagination from '../../../components/Pagination';

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const actionColors = {
  CREATE: 'text-emerald-400',
  UPDATE: 'text-amber-400',
  DELETE: 'text-red-400',
  LOGIN: 'text-blue-400',
  LOGOUT: 'text-zinc-400',
  LOCK: 'text-red-400',
  UNLOCK: 'text-emerald-400',
  APPROVE: 'text-violet-400',
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const loadLogs = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getAuditLogs();
      setLogs(data || []);
    } catch (err) {
      console.error('Không thể tải nhật ký hệ thống', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    loadLogs(); 
  }, [loadLogs]);

  const shown = logs.filter(
    (l) =>
      (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.actorType || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.targetTable || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.ipAddress || '').toLowerCase().includes(search.toLowerCase())
  );

  const paginatedLogs = shown.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Nhật ký hệ thống</h2>
          <p className="text-xs text-zinc-500 mt-1 font-mono">{logs.length} sự kiện được ghi nhận</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo hành động, loại actor..."
              className="bg-zinc-900/60 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 w-64 transition-all"
            />
          </div>
          <button
            onClick={() => {
              loadLogs();
              setCurrentPage(1);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors bg-zinc-900/60 cursor-pointer"
            title="Tải lại"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500 font-medium">Đang tải nhật ký hệ thống...</div>
          ) : (
            <table className="w-full text-sm text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/10">
                  {['Loại actor', 'Actor ID', 'Hành động', 'Bảng dữ liệu', 'Mục tiêu ID', 'IP Address', 'Thời gian'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {paginatedLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-zinc-800/10 transition-colors">
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold font-mono ${l.actorType === 'ADMIN' ? 'text-violet-400' : 'text-blue-400'}`}>
                        {l.actorType || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-zinc-400">{l.actorId || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold font-mono ${actionColors[l.action] || 'text-zinc-300'}`}>
                        {l.action || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-zinc-400 font-mono">{l.targetTable || '—'}</td>
                    <td className="px-5 py-4 text-xs text-zinc-500 font-mono">{l.targetId || '—'}</td>
                    <td className="px-5 py-4 text-xs text-zinc-500 font-mono">{l.ipAddress || '—'}</td>
                    <td className="px-5 py-4 text-xs text-zinc-400 font-mono whitespace-nowrap">{fmtDate(l.createdAt)}</td>
                  </tr>
                ))}
                {shown.length === 0 && !loading && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-sm text-zinc-500 font-medium">
                      {search ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có nhật ký nào trong hệ thống.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && shown.length > 0 && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={shown.length}
            pageSizeOptions={[15, 30, 50, 100]}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => setPageSize(s)}
          />
        )}
      </div>
    </div>
  );
}
