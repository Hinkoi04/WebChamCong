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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="relative max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Chi tiết hồ sơ nhân sự</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Mã NV: <span className="text-violet-400 font-semibold">{staff.staffCode}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Main Card */}
          <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800/80 p-4 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-mono text-xl font-bold flex-shrink-0">
              {avatarText}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-bold text-zinc-100">{staff.fullName}</h4>
                {staff.status === 'ACTIVE' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-500/15">
                    Đang hoạt động
                  </span>
                )}
                {staff.status === 'LOCKED' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-400/10 text-red-400 border border-red-500/15">
                    Bị khóa
                  </span>
                )}
                {staff.status === 'RESIGNED' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Đã thôi việc
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                {staff.department || 'Chưa xếp phòng ban'} · {staff.position || 'Chưa thiết lập chức vụ'}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
              <Building2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">Phòng ban</div>
                <div className="text-xs font-semibold text-zinc-200 truncate mt-0.5">{staff.department || 'Chưa xếp'}</div>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">Chức vụ</div>
                <div className="text-xs font-semibold text-zinc-200 truncate mt-0.5">{staff.position || 'Nhân viên'}</div>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
              <DollarSign className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">Lương cơ bản</div>
                <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">{fmtVND(staff.baseSalary)}</div>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
              <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">Ngày vào làm</div>
                <div className="text-xs font-mono text-zinc-200 mt-0.5">{formatDate(staff.hiredAt)}</div>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
              <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">Email</div>
                <div className="text-xs text-zinc-200 truncate mt-0.5 font-mono">{staff.email || '—'}</div>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
              <Phone className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">Số điện thoại</div>
                <div className="text-xs text-zinc-200 font-mono mt-0.5">{staff.phone || '—'}</div>
              </div>
            </div>
          </div>

          {/* Face ID Status Section */}
          <div className="bg-zinc-950 border border-zinc-800/80 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-violet-400" />
                <h5 className="text-xs font-bold text-zinc-200">Dữ liệu nhận diện khuôn mặt (Face ID)</h5>
              </div>
              {staff.faceRegistered ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã đăng ký
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" /> Chưa đăng ký
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {staff.faceRegistered
                ? 'Nhân viên đã được huấn luyện dữ liệu khuôn mặt và có thể thực hiện chấm công tự động qua camera kiosk AI.'
                : 'Nhân viên chưa có mẫu khuôn mặt. Vui lòng bấm nút thêm khuôn mặt bên dưới để đăng ký.'}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              if (onAddFace) onAddFace(staff);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-violet-500/30 rounded-xl text-xs font-semibold text-violet-300 bg-violet-600/10 hover:bg-violet-600/20 transition-colors cursor-pointer"
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
              className="flex items-center gap-2 px-4 py-2 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Sửa hồ sơ</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
