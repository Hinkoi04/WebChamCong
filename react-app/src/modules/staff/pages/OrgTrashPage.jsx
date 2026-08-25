import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { staffService } from '../services/staffService';
import {
  Trash2, RotateCcw, Search, AlertTriangle, Building2,
  RefreshCw, CheckCircle2, ShieldAlert, ArrowLeft, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../../components/Pagination';

function fmtVND(n) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)) + ' đ';
}

export default function OrgTrashPage() {
  const navigate = useNavigate();
  const { showToast, showConfirm } = useToast();
  const orgId = localStorage.getItem('orgId');

  const [trashStaffs, setTrashStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('Tất cả');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadTrash = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await staffService.getTrashStaff(orgId);
      setTrashStaffs(data || []);
    } catch {
      showToast('Không thể tải danh sách thùng rác', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, showToast]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  // Restore single staff
  const handleRestore = (id, name) => {
    showConfirm(
      'Khôi phục nhân viên',
      `Bạn có chắc muốn khôi phục nhân viên "${name}" trở lại danh sách hoạt động?`,
      async () => {
        try {
          await staffService.restoreStaff(orgId, id);
          showToast(`Đã khôi phục thành công nhân viên "${name}"`, 'success');
          loadTrash();
        } catch (err) {
          showToast(err.response?.data?.message || 'Không thể khôi phục nhân viên', 'error');
        }
      }
    );
  };

  // Permanently delete single staff
  const handlePermanentDelete = (id, name) => {
    showConfirm(
      'Xóa vĩnh viễn nhân viên',
      `CẢNH BÁO: Nhân viên "${name}" và toàn bộ dữ liệu khuôn mặt, chấm công liên quan sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu. Thao tác này KHÔNG THỂ HOÀN TÁC!`,
      async () => {
        try {
          await staffService.permanentDeleteStaff(orgId, id);
          showToast(`Đã xóa vĩnh viễn nhân viên "${name}"`, 'error');
          loadTrash();
        } catch (err) {
          showToast(err.response?.data?.message || 'Không thể xóa vĩnh viễn nhân viên', 'error');
        }
      }
    );
  };

  // Restore all
  const handleRestoreAll = () => {
    if (trashStaffs.length === 0) return;
    showConfirm(
      'Khôi phục tất cả',
      `Bạn có chắc muốn khôi phục toàn bộ ${trashStaffs.length} nhân viên trong thùng rác?`,
      async () => {
        try {
          await staffService.restoreAllTrash(orgId);
          showToast(`Đã khôi phục toàn bộ ${trashStaffs.length} nhân viên`, 'success');
          loadTrash();
        } catch {
          showToast('Không thể khôi phục tất cả nhân viên', 'error');
        }
      }
    );
  };

  // Empty trash
  const handleEmptyTrash = () => {
    if (trashStaffs.length === 0) return;
    showConfirm(
      'Dọn sạch thùng rác',
      `CẢNH BÁO NGUY HIỂM: Tất cả ${trashStaffs.length} nhân viên trong thùng rác sẽ bị XÓA VĨNH VIỄN cùng toàn bộ dữ liệu khuôn mặt và chấm công. Bạn có chắc chắn muốn thực hiện?`,
      async () => {
        try {
          await staffService.emptyTrash(orgId);
          showToast('Đã dọn sạch thùng rác', 'error');
          loadTrash();
        } catch {
          showToast('Không thể dọn sạch thùng rác', 'error');
        }
      }
    );
  };

  // Unique departments for filtering
  const departments = ['Tất cả', ...Array.from(new Set(trashStaffs.map((s) => s.department).filter(Boolean)))];

  const filtered = trashStaffs.filter((s) => {
    const matchDept = deptFilter === 'Tất cả' || s.department === deptFilter;
    const matchSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.staffCode.toLowerCase().includes(search.toLowerCase()) ||
      (s.position && s.position.toLowerCase().includes(search.toLowerCase()));
    return matchDept && matchSearch;
  });

  const paginatedTrash = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/org/staff')}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Quay lại danh sách nhân viên"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Thùng rác nhân sự
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-mono pl-8">
            {trashStaffs.length} nhân viên đang nằm trong thùng rác
          </p>
        </div>

        {/* Global Trash Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              loadTrash();
              setCurrentPage(1);
            }}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors cursor-pointer"
            title="Tải lại"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-violet-400" /> : <RefreshCw className="w-4 h-4" />}
          </button>

          {trashStaffs.length > 0 && (
            <>
              <button
                onClick={handleRestoreAll}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600/15 border border-emerald-500/30 hover:bg-emerald-600/25 text-emerald-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Khôi phục tất cả
              </button>

              <button
                onClick={handleEmptyTrash}
                className="flex items-center gap-2 px-3.5 py-2 bg-red-600/15 border border-red-500/30 hover:bg-red-600/25 text-red-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Dọn sạch thùng rác
              </button>
            </>
          )}
        </div>
      </div>

      {/* Warning Notice Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-300 leading-relaxed">
          <span className="font-bold text-amber-300">Lưu ý về Thùng rác:</span> Nhân viên khi xóa tại danh sách nhân sự sẽ được chuyển tạm vào đây và ngưng hoạt động. Bạn có thể <span className="text-emerald-400 font-semibold">Khôi phục</span> lại bất cứ lúc nào hoặc <span className="text-red-400 font-semibold">Xóa vĩnh viễn</span> để loại bỏ hoàn toàn dữ liệu.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-1.5 bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-1 w-max max-w-full overflow-x-auto">
          {departments.map((item) => (
            <button
              key={item}
              onClick={() => {
                setDeptFilter(item);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                deptFilter === item
                  ? 'bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm kiếm theo mã, tên..."
            className="bg-zinc-900/60 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 w-60 transition-all"
          />
        </div>
      </div>

      {/* Trash Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500 font-medium">Đang tải danh sách thùng rác...</div>
          ) : (
            <table className="w-full text-sm text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/10">
                  {['Mã NV', 'Họ tên', 'Phòng ban', 'Chức vụ', 'Lương cơ bản', 'Trạng thái', 'Thao tác'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {paginatedTrash.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/10 transition-colors">
                    <td className="px-5 py-4 text-xs font-mono text-zinc-500">{s.staffCode}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-600/15 flex items-center justify-center text-red-400 font-mono text-xs font-semibold">
                          {(s.fullName[0] + (s.fullName.trim().split(' ').pop()[0] || '')).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-zinc-200 line-through opacity-80">{s.fullName}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{s.email || 'Không có email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-zinc-400 font-medium">{s.department || '—'}</td>
                    <td className="px-5 py-4 text-xs text-zinc-300 font-medium">{s.position || 'Nhân viên'}</td>
                    <td className="px-5 py-4 text-xs font-mono text-zinc-400">{fmtVND(s.baseSalary)}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        Đã xóa
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestore(s.id, s.fullName)}
                          title="Khôi phục nhân viên"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer text-xs font-semibold"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Khôi phục</span>
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(s.id, s.fullName)}
                          title="Xóa vĩnh viễn"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer text-xs font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa vĩnh viễn</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-500 mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-300">Thùng rác trống</p>
              <p className="text-xs text-zinc-500 font-mono mt-1">Không có nhân viên nào trong thùng rác</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => setPageSize(s)}
          />
        )}
      </div>
    </div>
  );
}
