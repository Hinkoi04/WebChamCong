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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="relative max-w-xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">{department.name}</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Khởi tạo ngày: <span className="text-zinc-200">{formatDate(department.createdAt)}</span>
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Description */}
          <div className="bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold">Mô tả chức năng nhiệm vụ</div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {department.description || <span className="text-zinc-600 italic">Chưa có mô tả chi tiết cho phòng ban này.</span>}
            </p>
          </div>

          {/* Members Stats Banner */}
          <div className="flex items-center justify-between bg-violet-600/10 border border-violet-500/20 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-violet-300">
              <Users className="w-4 h-4 text-violet-400" />
              <span>Danh sách nhân sự thuộc phòng ({deptMembers.length} thành viên)</span>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {deptMembers.map((s) => {
              const avatar = (s.fullName[0] + (s.fullName.trim().split(' ').pop()[0] || '')).toUpperCase();
              return (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-600/15 flex items-center justify-center text-violet-400 font-mono text-xs font-semibold">
                      {avatar}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">{s.fullName}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                        {s.staffCode} · {s.position || 'Nhân viên'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {s.status === 'ACTIVE' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-500/15">
                        Hoạt động
                      </span>
                    )}
                    {s.status === 'LOCKED' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-400/10 text-red-400 border border-red-500/15">
                        Bị khóa
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {deptMembers.length === 0 && (
              <div className="py-8 text-center text-xs text-zinc-500 font-medium bg-zinc-950/20 rounded-xl border border-dashed border-zinc-800">
                Chưa có nhân viên nào được xếp vào phòng ban này.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              if (onEdit) onEdit(department);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            <span>Sửa phòng ban</span>
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
  );
}
