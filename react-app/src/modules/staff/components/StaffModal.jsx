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
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-[fadeInScale_0.2s_ease_both]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              {isEditing ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Vui lòng điền đầy đủ các thông tin cần thiết</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Mã nhân viên *</label>
              <input
                required
                disabled={isEditing}
                placeholder="NV001"
                value={form.staffCode}
                onChange={handleChange('staffCode')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Họ và tên *</label>
              <input
                required
                placeholder="Nguyễn Văn A"
                value={form.fullName}
                onChange={handleChange('fullName')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                placeholder="nhanvien@cty.vn"
                value={form.email}
                onChange={handleChange('email')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Số điện thoại</label>
              <input
                placeholder="09xxxxxxxx"
                value={form.phone}
                onChange={handleChange('phone')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Phòng ban</label>
              <select
                value={form.departmentId}
                onChange={handleChange('departmentId')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors outline-none"
              >
                <option value="" className="bg-zinc-950">-- Chọn Phòng Ban --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id} className="bg-zinc-950">{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Chức vụ</label>
              <input
                placeholder="Ví dụ: Giám đốc, Nhân viên..."
                value={form.position || ''}
                onChange={handleChange('position')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Lương cơ bản (đ)</label>
              <input
                type="number"
                placeholder="10000000"
                value={form.baseSalary}
                onChange={handleChange('baseSalary')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Ngày vào làm</label>
              <input
                type="date"
                value={form.hiredAt}
                onChange={handleChange('hiredAt')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-zinc-800 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-600/15 cursor-pointer"
            >
              {isEditing ? 'Lưu lại' : 'Thêm nhân viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
