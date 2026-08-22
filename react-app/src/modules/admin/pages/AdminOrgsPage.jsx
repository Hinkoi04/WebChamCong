import React, { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { adminService } from '../services/adminService';
import { Building2, UserPlus, Eye, Lock, Unlock } from 'lucide-react';


export default function AdminOrgsPage() {
  const { showToast } = useToast();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Tất cả');

  const loadOrgs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getOrganizations();
      setOrgs(data);
    } catch (err) {
      showToast('Không thể tải danh sách tổ chức', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const handleStatusChange = async (id, newStatus, name) => {
    try {
      await adminService.updateOrganizationStatus(id, newStatus);
      showToast(
        newStatus === 'ACTIVE' ? `Đã kích hoạt hoạt động cho ${name}` : `Đã khóa tổ chức ${name}`,
        newStatus === 'ACTIVE' ? 'success' : 'info'
      );
      loadOrgs();
    } catch (err) {
      showToast('Không thể cập nhật trạng thái tổ chức', 'error');
    }
  };

  const counts = {
    pro: orgs.filter((o) => o.plan === 'PRO').length,
    basic: orgs.filter((o) => o.plan === 'BASIC').length,
    free: orgs.filter((o) => o.plan === 'FREE').length
  };

  const shown = orgs.filter((o) => filter === 'Tất cả' || o.status === filter || o.plan === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Quản lý tổ chức (Dữ liệu thật)</h2>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            {orgs.length} tổ chức đăng ký · {orgs.filter((o) => o.status === 'PENDING').length} chờ duyệt ·{' '}
            {orgs.filter((o) => o.status === 'LOCKED').length} bị khóa
          </p>
        </div>
        <button
          onClick={() => showToast('Tính năng tạo tổ chức trực tiếp đang được phát triển', 'info')}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-600/15 w-max"
        >
          <UserPlus className="w-4 h-4" />
          Tạo tổ chức mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Tài khoản PRO', value: counts.pro, c: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/15' },
          { label: 'Tài khoản BASIC', value: counts.basic, c: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/15' },
          { label: 'Tài khoản FREE', value: counts.free, c: 'text-zinc-400', bg: 'bg-zinc-800/20 border-zinc-800' }
        ].map((x) => (
          <div key={x.label} className={`rounded-2xl border p-4 flex items-center justify-between shadow-md ${x.bg}`}>
            <span className="text-xs font-semibold text-zinc-400">{x.label}</span>
            <span className={`text-2xl font-bold font-mono ${x.c}`}>{x.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-1 w-max max-w-full overflow-x-auto">
        {['Tất cả', 'ACTIVE', 'PENDING', 'LOCKED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filter === tab ? 'bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700/30' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab === 'ACTIVE' ? 'Hoạt động' : tab === 'PENDING' ? 'Chờ duyệt' : tab === 'LOCKED' ? 'Bị khóa' : 'Tất cả'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500 font-medium">Đang tải danh sách tổ chức...</div>
          ) : (
            <table className="w-full text-sm text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/10">
                  {['Tổ chức', 'Email', 'Gói', 'Trạng thái', 'Ngày tạo', 'Hành động'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {shown.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-800/10 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-600/15 flex items-center justify-center border border-violet-500/10">
                          <Building2 className="w-5 h-5 text-violet-400" />
                        </div>
                        <span className="text-sm font-semibold text-zinc-200">{o.orgName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-zinc-400">{o.email}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                          o.plan === 'PRO'
                            ? 'bg-violet-500/10 text-violet-400 border-violet-500/15'
                            : o.plan === 'BASIC'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/15'
                            : 'bg-zinc-800 text-zinc-500 border-zinc-800'
                        }`}
                      >
                        {o.plan}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {o.status === 'ACTIVE' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-500/15">
                          Hoạt động
                        </span>
                      )}
                      {o.status === 'PENDING' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-500/15">
                          Chờ duyệt
                        </span>
                      )}
                      {o.status === 'LOCKED' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-400/10 text-red-400 border border-red-500/15">
                          Bị khóa
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-zinc-500">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {o.status === 'PENDING' && (
                          <button
                            onClick={() => handleStatusChange(o.id, 'ACTIVE', o.orgName)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-400/10 text-emerald-400 rounded-lg text-xs hover:bg-emerald-400/20 transition-all font-semibold border border-emerald-500/15 active:scale-95 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Duyệt
                          </button>
                        )}
                        {o.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleStatusChange(o.id, 'LOCKED', o.orgName)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-400/10 text-red-400 rounded-lg text-xs hover:bg-red-400/20 transition-all font-semibold border border-red-500/15 active:scale-95 cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Khóa
                          </button>
                        )}
                        {o.status === 'LOCKED' && (
                          <button
                            onClick={() => handleStatusChange(o.id, 'ACTIVE', o.orgName)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-400/10 text-emerald-400 rounded-lg text-xs hover:bg-emerald-400/20 transition-all font-semibold border border-emerald-500/15 active:scale-95 cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            Mở khóa
                          </button>
                        )}
                        <button className="flex items-center gap-1 px-3 py-1.5 border border-zinc-800 text-zinc-400 rounded-lg text-xs hover:text-zinc-100 hover:border-zinc-700 transition-all active:scale-95 cursor-pointer">
                          <Eye className="w-3.5 h-3.5" />
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-sm text-zinc-500 font-medium">Không tìm thấy tổ chức nào.</td>
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
