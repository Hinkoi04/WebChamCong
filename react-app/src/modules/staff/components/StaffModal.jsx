import React from 'react';
import { X } from 'lucide-react';

export default function StaffModal({
  isOpen,
  onClose,
  isEditing,
  form,
  handleChange,
  handleSubmit,
  departments
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-[fadeInScale_0.2s_ease_both]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEditing ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">Vui lòng điền đầy đủ các thông tin cần thiết</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Mã nhân viên *</label>
              <input
                required
                disabled={isEditing}
                placeholder="NV001"
                value={form.staffCode}
                onChange={handleChange('staffCode')}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Họ và tên *</label>
              <input
                required
                placeholder="Nguyễn Văn A"
                value={form.fullName}
                onChange={handleChange('fullName')}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                placeholder="nhanvien@cty.vn"
                value={form.email}
                onChange={handleChange('email')}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Số điện thoại</label>
              <input
                placeholder="09xxxxxxxx"
                value={form.phone}
                onChange={handleChange('phone')}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Phòng ban</label>
              <select
                value={form.departmentId}
                onChange={handleChange('departmentId')}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none cursor-pointer"
              >
                <option value="">-- Chọn Phòng Ban --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Chức vụ</label>
              <input
                placeholder="Ví dụ: Giám đốc, Nhân viên..."
                value={form.position || ''}
                onChange={handleChange('position')}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Lương cơ bản (đ)</label>
              <input
                type="number"
                placeholder="10000000"
                value={form.baseSalary}
                onChange={handleChange('baseSalary')}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Ngày vào làm</label>
              <input
                type="date"
                value={form.hiredAt}
                onChange={handleChange('hiredAt')}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              {isEditing ? 'Lưu lại' : 'Thêm nhân viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
