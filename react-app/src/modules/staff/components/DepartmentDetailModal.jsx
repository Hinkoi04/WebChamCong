import React from 'react';
import { X, Building2, Users, Calendar, Edit, Shield, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';

function formatDate(str) {
  if (!str) return '—';
  const d = new Date(str);
  if (isNaN(d.getTime())) return str;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function DepartmentDetailModal({ isOpen, onClose, department, staffList = [], onEdit }) {
  if (!isOpen || !department) return null;

  const deptMembers = staffList.filter((s) => s.departmentId === department.id || s.department === department.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="relative max-w-xl w-full bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{department.name}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Khởi tạo ngày: <span className="text-slate-700">{formatDate(department.createdAt)}</span>
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
          {/* Description */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Mô tả chức năng nhiệm vụ</div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {department.description || <span className="text-slate-400 italic">Chưa có mô tả chi tiết cho phòng ban này.</span>}
            </p>
          </div>

          {/* Members Stats Banner */}
          <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-200/80 px-4 py-3 rounded-2xl">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-indigo-800">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Danh sách nhân sự thuộc phòng ({deptMembers.length} thành viên)</span>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {deptMembers.map((s) => {
              const avatar = (s.fullName[0] + (s.fullName.trim().split(' ').pop()[0] || '')).toUpperCase();
              return (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 border border-slate-200/80 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-mono text-xs font-semibold shadow-xs">
                      {avatar}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{s.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {s.staffCode} · {s.position || 'Nhân viên'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
                  </div>
                </div>
              );
            })}

            {deptMembers.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                Chưa có nhân viên nào được xếp vào phòng ban này.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              if (onEdit) onEdit(department);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Edit className="w-4 h-4" />
            <span>Sửa phòng ban</span>
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
  );
}
