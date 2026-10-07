import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { departmentService } from '../services/departmentService';
import { staffService } from '../services/staffService';
import DepartmentDetailModal from '../components/DepartmentDetailModal';
import Pagination from '../../../components/Pagination';
import { Building2, Plus, Search, Trash2, X, Edit, Eye, Users } from 'lucide-react';

export default function OrgDepartmentsPage() {
  const { showToast, showConfirm } = useToast();
  const [departments, setDepartments] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const orgId = localStorage.getItem('orgId');

  // Modal / Form State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailDept, setSelectedDetailDept] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [deptList, staffList] = await Promise.all([
        departmentService.getDepartmentList(orgId),
        staffService.getStaffList(orgId)
      ]);
      setDepartments(deptList || []);
      setStaffs(staffList || []);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải danh sách phòng ban', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedDeptId(null);
    setName('');
    setDescription('');
    setShowModal(true);
  };

  const handleOpenEdit = (dept) => {
    setIsEditing(true);
    setSelectedDeptId(dept.id);
    setName(dept.name || '');
    setDescription(dept.description || '');
    setShowModal(true);
  };

  const handleOpenDetail = (dept) => {
    setSelectedDetailDept(dept);
    setDetailModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Tên phòng ban không được để trống', 'error');
      return;
    }

    try {
      if (isEditing) {
        await departmentService.updateDepartment(orgId, selectedDeptId, {
          name: name.trim(),
          description: description.trim()
        });
        showToast(`Đã cập nhật phòng ban ${name}`, 'success');
      } else {
        await departmentService.createDepartment(orgId, {
          name: name.trim(),
          description: description.trim()
        });
        showToast(`Đã thêm phòng ban ${name}`, 'success');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lưu thông tin thất bại', 'error');
    }
  };

  const handleDelete = (id, deptName) => {
    showConfirm(
      'Xóa phòng ban',
      `Bạn có chắc chắn muốn xóa phòng ban "${deptName}"? Thao tác này sẽ đặt phòng ban của tất cả nhân viên thuộc phòng ban này thành Chưa xếp.`,
      async () => {
        try {
          await departmentService.deleteDepartment(orgId, id);
          showToast(`Đã xóa phòng ban ${deptName}`, 'success');
          loadData();
        } catch (err) {
          showToast(err.response?.data?.message || 'Không thể xóa phòng ban', 'error');
        }
      }
    );
  };

  const filtered = useMemo(() => {
    return departments.filter((d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
    );
  }, [departments, search]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Detail Modal */}
      <DepartmentDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        department={selectedDetailDept}
        staffList={staffs}
        onEdit={(dept) => handleOpenEdit(dept)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Danh sách phòng ban</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {departments.length} phòng ban · {staffs.length} tổng nhân sự
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm phòng ban..."
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 w-52 sm:w-60 transition-all shadow-xs"
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm phòng ban
          </button>
        </div>
      </div>

      {/* Add / Edit Department Popup Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-[fadeInScale_0.2s_ease_both]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isEditing ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {isEditing ? 'Cập nhật tên và mô tả phòng ban' : 'Điền tên phòng ban và mô tả chi tiết'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Tên phòng ban *</label>
                <input
                  required
                  placeholder="Ví dụ: Kỹ thuật, Kế toán, Kinh doanh..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Mô tả chi tiết</label>
                <textarea
                  placeholder="Nhập mô tả về nhiệm vụ, chức năng phòng ban..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isEditing ? 'Lưu thay đổi' : 'Tạo phòng ban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400 font-medium">Đang tải danh sách phòng ban...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Tên phòng ban</th>
                  <th className="px-6 py-4 font-semibold">Mô tả chi tiết</th>
                  <th className="px-6 py-4 font-semibold">Nhân sự</th>
                  <th className="px-6 py-4 font-semibold">Ngày khởi tạo</th>
                  <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.map((d) => {
                  const memberCount = staffs.filter((s) => s.departmentId === d.id || s.department === d.name).length;
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-xs">
                            <Building2 className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="text-sm font-semibold text-slate-900">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {d.description || <span className="text-slate-400 italic">Chưa có mô tả</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          {memberCount} nhân viên
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                        {new Date(d.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(d)}
                            title="Xem chi tiết phòng ban"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(d)}
                            title="Sửa phòng ban"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id, d.name)}
                            title="Xóa phòng ban"
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400 font-medium">Không tìm thấy phòng ban nào.</div>
          )}
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={(size) => setPageSize(size)}
          />
        )}
      </div>
    </div>
  );
}
