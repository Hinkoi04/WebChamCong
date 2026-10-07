import React, { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { adminService } from '../services/adminService';
import { UserPlus, Unlock, ShieldCheck, Shield } from 'lucide-react';
import Pagination from '../../../components/Pagination';

export default function AdminAccountsPage() {
  const { showToast } = useToast();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadAdmins = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getAdmins();
      setAdmins(data);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải danh sách quản trị viên', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { 
    loadAdmins(); 
  }, [loadAdmins]);

  const paginatedAdmins = admins.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Quản trị viên hệ thống</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {admins.length} tài khoản · {admins.filter((a) => a.status !== 'LOCKED').length} đang hoạt động
          </p>
        </div>
        <button
          onClick={() => showToast('Tính năng thêm tài khoản quản trị đang phát triển', 'info')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs w-max cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Thêm admin
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400 font-medium">Đang tải danh sách quản trị viên...</div>
          ) : (
            <table className="w-full text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75">
                  {['Tài khoản', 'Vai trò', 'Ngày tạo', 'Thao tác'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAdmins.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-mono text-xs font-semibold">
                          {(a.fullName || a.username || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{a.fullName || a.username}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">@{a.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        a.role === 'SUPER_ADMIN'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {a.role === 'SUPER_ADMIN' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                        {a.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-500">
                      {a.createdAt ? new Date(a.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => showToast('Tính năng khóa/mở khóa admin đang phát triển', 'info')}
                        className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        Khóa/Mở khóa
                      </button>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && !loading && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-sm text-slate-400 font-medium">Không có quản trị viên nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && admins.length > 0 && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={admins.length}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => setPageSize(s)}
          />
        )}
      </div>
    </div>
  );
}
