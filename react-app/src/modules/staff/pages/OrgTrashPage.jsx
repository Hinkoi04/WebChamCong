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
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Quay lại danh sách nhân viên"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-500" />
              Thùng rác nhân sự
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono pl-8">
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
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors cursor-pointer shadow-xs"
            title="Tải lại"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <RefreshCw className="w-4 h-4" />}
          </button>

          {trashStaffs.length > 0 && (
            <>
              <button
                onClick={handleRestoreAll}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/70 text-emerald-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Khôi phục tất cả
              </button>

              <button
                onClick={handleEmptyTrash}
                className="flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100/70 text-rose-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Dọn sạch thùng rác
              </button>
            </>
          )}
        </div>
      </div>

      {/* Warning Notice Banner */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-amber-800">Lưu ý về Thùng rác:</span> Nhân viên khi xóa tại danh sách nhân sự sẽ được chuyển tạm vào đây và ngưng hoạt động. Bạn có thể <span className="text-emerald-700 font-semibold">Khôi phục</span> lại bất cứ lúc nào hoặc <span className="text-rose-700 font-semibold">Xóa vĩnh viễn</span> để loại bỏ hoàn toàn dữ liệu.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-1.5 bg-slate-100/80 border border-slate-200 rounded-xl p-1 w-max max-w-full overflow-x-auto">
          {departments.map((item) => (
            <button
              key={item}
              onClick={() => {
                setDeptFilter(item);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                deptFilter === item
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm kiếm theo mã, tên..."
            className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 w-60 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Trash Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500 font-medium">Đang tải danh sách thùng rác...</div>
          ) : (
            <table className="w-full text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75">
                  {['Mã NV', 'Họ tên', 'Phòng ban', 'Chức vụ', 'Lương cơ bản', 'Trạng thái', 'Thao tác'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTrash.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 text-xs font-mono text-slate-500">{s.staffCode}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-mono text-xs font-semibold">
                          {(s.fullName[0] + (s.fullName.trim().split(' ').pop()[0] || '')).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-700 line-through opacity-80">{s.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{s.email || 'Không có email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 font-medium">{s.department || '—'}</td>
                    <td className="px-5 py-4 text-xs text-slate-700 font-medium">{s.position || 'Nhân viên'}</td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-600">{fmtVND(s.baseSalary)}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Đã xóa
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestore(s.id, s.fullName)}
                          title="Khôi phục nhân viên"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100/70 transition-colors cursor-pointer text-xs font-semibold shadow-xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Khôi phục</span>
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(s.id, s.fullName)}
                          title="Xóa vĩnh viễn"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100/70 transition-colors cursor-pointer text-xs font-semibold shadow-xs"
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
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">Thùng rác trống</p>
              <p className="text-xs text-slate-500 font-mono mt-1">Không có nhân viên nào trong thùng rác</p>
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
