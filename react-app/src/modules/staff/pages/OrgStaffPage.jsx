import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { staffService } from '../services/staffService';
import { positionService } from '../services/positionService';
import { departmentService } from '../services/departmentService';
import StaffModal from '../components/StaffModal';
import FaceModal from '../components/FaceModal';
import StaffDetailModal from '../components/StaffDetailModal';
import Pagination from '../../../components/Pagination';
import {
  Search, UserPlus, Lock, Unlock, Trash2,
  AlertTriangle, Scan, Edit, Camera, Eye
} from 'lucide-react';

export default function OrgStaffPage() {
  const { showToast, showConfirm } = useToast();
  const [staffs, setStaffs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('Tất cả');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [selectedFaceStaff, setSelectedFaceStaff] = useState(null);
  const [selectedDetailStaff, setSelectedDetailStaff] = useState(null);

  const [form, setForm] = useState({
    staffCode: '',
    fullName: '',
    email: '',
    phone: '',
    departmentId: '',
    position: '',
    baseSalary: '',
    hiredAt: ''
  });

  const orgId = localStorage.getItem('orgId');

  const loadData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const staffList = await staffService.getStaffList(orgId);
      setStaffs(staffList);
      
      await positionService.getPositionList(orgId); // giữ lại để validate
      const deptList = await departmentService.getDepartmentList(orgId);
      setDepartments(deptList);
    } catch {
      showToast('Không thể tải danh sách dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedStaffId(null);
    setForm({
      staffCode: '',
      fullName: '',
      email: '',
      phone: '',
      departmentId: '',
      position: '',
      baseSalary: '',
      hiredAt: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setIsEditing(true);
    setSelectedStaffId(s.id);
    setForm({
      staffCode: s.staffCode || '',
      fullName: s.fullName || '',
      email: s.email || '',
      phone: s.phone || '',
      departmentId: s.departmentId || '',
      position: s.position || '',
      baseSalary: s.baseSalary || '',
      hiredAt: s.hiredAt || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.staffCode.trim()) {
      showToast('Vui lòng điền họ tên và mã nhân viên', 'error');
      return;
    }

    const payload = {
      staffCode: form.staffCode,
      fullName: form.fullName,
      email: form.email || null,
      phone: form.phone || null,
      departmentId: form.departmentId ? parseInt(form.departmentId) : null,
      position: form.position || null,
      baseSalary: parseFloat(form.baseSalary) || 0,
      hiredAt: form.hiredAt || null
    };

    try {
      if (isEditing) {
        await staffService.updateStaff(orgId, selectedStaffId, { ...payload, status: staffs.find(x => x.id === selectedStaffId)?.status || 'ACTIVE' });
        showToast(`Đã cập nhật nhân viên ${form.fullName}`, 'success');
      } else {
        await staffService.createStaff(orgId, payload);
        showToast(`Đã thêm nhân viên ${form.fullName}`, 'success');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lưu thông tin thất bại', 'error');
    }
  };

  const handleToggleLock = async (id, name, currentStatus) => {
    const targetStatus = currentStatus === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    const s = staffs.find(x => x.id === id);
    if (!s) return;
    
    const payload = {
      staffCode: s.staffCode,
      fullName: s.fullName,
      email: s.email,
      phone: s.phone,
      departmentId: s.departmentId,
      position: s.position,
      baseSalary: s.baseSalary,
      status: targetStatus,
      hiredAt: s.hiredAt
    };

    try {
      await staffService.updateStaff(orgId, id, payload);
      showToast(
        targetStatus === 'LOCKED' ? `Đã khóa tài khoản của ${name}` : `Đã kích hoạt hoạt động cho ${name}`,
        targetStatus === 'LOCKED' ? 'info' : 'success'
      );
      loadData();
    } catch (err) {
      showToast('Không thể thay đổi trạng thái nhân viên', 'error');
    }
  };

  const handleDeleteStaff = (id, name) => {
    showConfirm(
      'Xóa nhân viên',
      `Bạn có chắc chắn muốn xóa nhân viên ${name} (${id})? Thao tác này sẽ chuyển nhân viên vào thùng rác.`,
      async () => {
        try {
          await staffService.deleteStaff(orgId, id);
          showToast(`Đã chuyển nhân viên ${name} vào thùng rác`, 'info');
          loadData();
        } catch (err) {
          showToast('Không thể xóa nhân viên này', 'error');
        }
      }
    );
  };

  const handleAddFace = (staff) => {
    setSelectedFaceStaff(staff);
    setFaceModalOpen(true);
  };

  const handleOpenDetail = (staff) => {
    setSelectedDetailStaff(staff);
    setDetailModalOpen(true);
  };

  const DEPTS = ['Tất cả', ...departments.map(d => d.name)];

  const filtered = staffs.filter(
    (s) =>
      (dept === 'Tất cả' || s.department === dept) &&
      (s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.staffCode.toLowerCase().includes(search.toLowerCase()) ||
        (s.position && s.position.toLowerCase().includes(search.toLowerCase())))
  );

  const paginatedStaffs = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <StaffModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isEditing={isEditing}
        form={form}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        departments={departments}
      />
      
      <FaceModal 
        isOpen={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
        staff={selectedFaceStaff}
        onSuccess={loadData}
      />

      <StaffDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        staff={selectedDetailStaff}
        onEdit={(s) => handleOpenEdit(s)}
        onAddFace={(s) => handleAddFace(s)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Danh sách nhân viên</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {staffs.length} nhân viên · {staffs.filter((s) => !s.faceRegistered).length} chưa đăng ký khuôn mặt ·{' '}
            {staffs.filter((s) => s.status === 'LOCKED').length} bị khóa
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 w-52 sm:w-60 transition-all shadow-xs"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Thêm nhân viên
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-slate-100 border border-slate-200/80 rounded-xl p-1 w-max max-w-full overflow-x-auto shadow-xs">
        {DEPTS.map((item) => (
          <button
            key={item}
            onClick={() => setDept(item)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              dept === item ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400 font-medium">Đang tải danh sách nhân sự...</div>
          ) : (
            <table className="w-full text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500">
                  {['Mã NV', 'Họ tên', 'Phòng ban', 'Chức vụ', 'Trạng thái', 'Khuôn mặt', 'Thao tác'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedStaffs.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 text-xs font-mono text-slate-500 font-medium">{s.staffCode}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-mono text-xs font-semibold shadow-xs">
                          {(s.fullName[0] + (s.fullName.trim().split(' ').pop()[0] || '')).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{s.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{s.email || 'Không có email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 font-medium">{s.department}</td>
                    <td className="px-5 py-4 text-xs text-slate-700 font-medium">{s.position || 'Chưa thiết lập'}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleLock(s.id, s.fullName, s.status)}
                        className="cursor-pointer transition-transform duration-100 active:scale-95 text-left"
                      >
                        {s.status === 'ACTIVE' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Hoạt động
                          </span>
                        )}
                        {s.status === 'LOCKED' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Bị khóa
                          </span>
                        )}
                        {s.status === 'RESIGNED' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            Thôi việc
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      {s.faceRegistered ? (
                        <span className="flex items-center gap-1 text-xs text-indigo-600 font-semibold">
                          <Scan className="w-3.5 h-3.5" />
                          Đã đăng ký
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Chưa có face
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(s)}
                          title="Xem chi tiết hồ sơ"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Sửa hồ sơ"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleLock(s.id, s.fullName, s.status)}
                          title={s.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            s.status === 'LOCKED' 
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                              : 'bg-slate-100 text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                        >
                          {s.status === 'LOCKED' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleAddFace(s)}
                          title="Thêm/Cập nhật khuôn mặt"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(s.id, s.fullName)}
                          title="Xóa nhân viên (chuyển vào Thùng rác)"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400 font-medium">Không tìm thấy nhân viên nào phù hợp.</div>
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
