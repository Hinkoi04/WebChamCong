import React from 'react';
import { X, User, Building2, Briefcase, DollarSign, Calendar, Mail, Phone, Scan, CheckCircle2, AlertTriangle, Edit, Camera, Shield } from 'lucide-react';

function fmtVND(n) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)) + ' đ';
}

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function StaffDetailModal({ isOpen, onClose, staff, onEdit, onAddFace }) {
  if (!isOpen || !staff) return null;

  const avatarText = (staff.fullName?.[0] + (staff.fullName?.trim().split(' ').pop()?.[0] || '')).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="relative max-w-lg w-full bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Chi tiết hồ sơ nhân sự</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Mã NV: <span className="text-indigo-600 font-semibold">{staff.staffCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main Card */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-mono text-xl font-bold flex-shrink-0 shadow-xs">
              {avatarText}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-bold text-slate-900">{staff.fullName}</h4>
                {staff.status === 'ACTIVE' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Đang hoạt động
                  </span>
                )}
                {staff.status === 'LOCKED' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    Bị khóa
                  </span>
                )}
                {staff.status === 'RESIGNED' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    Đã thôi việc
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                {staff.department || 'Chưa xếp phòng ban'} · {staff.position || 'Chưa thiết lập chức vụ'}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50/70 border border-slate-200/80 p-3 rounded-xl flex items-center gap-3">
              <Building2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Phòng ban</div>
                <div className="text-xs font-semibold text-slate-800 truncate mt-0.5">{staff.department || 'Chưa xếp'}</div>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 p-3 rounded-xl flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Chức vụ</div>
                <div className="text-xs font-semibold text-slate-800 truncate mt-0.5">{staff.position || 'Nhân viên'}</div>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 p-3 rounded-xl flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Lương cơ bản</div>
                <div className="text-xs font-bold font-mono text-emerald-600 mt-0.5">{fmtVND(staff.baseSalary)}</div>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 p-3 rounded-xl flex items-center gap-3">
              <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Ngày vào làm</div>
                <div className="text-xs font-mono text-slate-800 mt-0.5">{formatDate(staff.hiredAt)}</div>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 p-3 rounded-xl flex items-center gap-3">
              <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Email</div>
                <div className="text-xs text-slate-800 truncate mt-0.5 font-mono">{staff.email || '—'}</div>
              </div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 p-3 rounded-xl flex items-center gap-3">
              <Phone className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Số điện thoại</div>
                <div className="text-xs text-slate-800 font-mono mt-0.5">{staff.phone || '—'}</div>
              </div>
            </div>
          </div>

          {/* Face ID Status Section */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-indigo-600" />
                <h5 className="text-xs font-bold text-slate-800">Dữ liệu nhận diện khuôn mặt (Face ID)</h5>
              </div>
              {staff.faceRegistered ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã đăng ký
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" /> Chưa đăng ký
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {staff.faceRegistered
                ? 'Nhân viên đã được huấn luyện dữ liệu khuôn mặt và có thể thực hiện chấm công tự động qua camera kiosk AI.'
                : 'Nhân viên chưa có mẫu khuôn mặt. Vui lòng bấm nút thêm khuôn mặt bên dưới để đăng ký.'}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              if (onAddFace) onAddFace(staff);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer shadow-xs"
          >
            <Camera className="w-4 h-4" />
            <span>Khuôn mặt</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onEdit) onEdit(staff);
              }}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Edit className="w-4 h-4" />
              <span>Sửa hồ sơ</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
