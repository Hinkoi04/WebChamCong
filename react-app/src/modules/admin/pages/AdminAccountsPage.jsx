import React, { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { adminService } from '../services/adminService';
import { UserPlus, Lock, Unlock, ShieldCheck, Shield } from 'lucide-react';

export default function AdminAccountsPage() {
  const { showToast } = useToast();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAdmins();
      setAdmins(data);
    } catch (err) {
      showToast('Không thể tải danh sách quản trị viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdmins(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Quản trị viên hệ thống</h2>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            {admins.length} tài khoản · {admins.filter((a) => a.status !== 'LOCKED').length} đang hoạt động
          </p>
        </div>
        <button
          onClick={() => showToast('Tính năng thêm tài khoản quản trị đang phát triển', 'info')}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-600/15 w-max cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Thêm admin
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500 font-medium">Đang tải danh sách quản trị viên...</div>
          ) : (
            <table className="w-full text-sm text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/10">
                  {['Tài khoản', 'Vai trò', 'Ngày tạo', 'Thao tác'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {admins.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-800/10 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-600/15 flex items-center justify-center text-violet-400 font-mono text-xs font-semibold">
                          {(a.fullName || a.username || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-zinc-200">{a.fullName || a.username}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">@{a.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.role === 'SUPER_ADMIN'
                          ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {a.role === 'SUPER_ADMIN' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        {a.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-zinc-400">
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => showToast('Tính năng khóa/mở khóa admin đang phát triển', 'info')}
                        className="flex items-center gap-1 px-3 py-1.5 border border-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-colors cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        Khóa/Mở khóa
                      </button>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && !loading && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-sm text-zinc-500 font-medium">Không có quản trị viên nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
