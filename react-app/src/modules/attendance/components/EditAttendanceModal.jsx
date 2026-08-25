import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, AlertCircle, Save, Loader2, Lock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { scheduleService } from '../../work_schedule/services/scheduleService';
import { useToast } from '../../../contexts/ToastContext';

export default function EditAttendanceModal({ isOpen, onClose, staff, record, workDate, onSuccess }) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [defaultSchedule, setDefaultSchedule] = useState(null);

  const [formData, setFormData] = useState({
    checkInTime: '',
    checkOutTime: '',
    isLeave: false,
    isAbsent: false,
    note: ''
  });

  const orgId = localStorage.getItem('orgId');

  // Load default work schedule
  useEffect(() => {
    if (!isOpen || !orgId) return;
    const loadSchedule = async () => {
      try {
        const list = await scheduleService.getSchedules(orgId);
        const def = list.find((s) => s.isDefault) || list[0] || null;
        setDefaultSchedule(def);
      } catch (e) {
        console.error('Không thể tải ca làm việc', e);
      }
    };
    loadSchedule();
  }, [isOpen, orgId]);

  useEffect(() => {
    if (isOpen && record) {
      let initialCheckIn = '';
      let initialCheckOut = '';

      if (record.rawCheckInTime) {
        const d = new Date(record.rawCheckInTime);
        if (!isNaN(d.getTime())) {
          initialCheckIn = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      } else if (record.checkin && record.checkin !== '—') {
        initialCheckIn = record.checkin.trim();
      }

      if (record.rawCheckOutTime) {
        const d = new Date(record.rawCheckOutTime);
        if (!isNaN(d.getTime())) {
          initialCheckOut = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
      } else if (record.checkout && record.checkout !== '—') {
        initialCheckOut = record.checkout.trim();
      }

      const isLeave = record.status === 'LEAVE';
      const isAbsent = record.status === 'ABSENT' || (!initialCheckIn && !initialCheckOut && !isLeave);

      setFormData({
        checkInTime: initialCheckIn,
        checkOutTime: initialCheckOut,
        isLeave: isLeave,
        isAbsent: isAbsent && !isLeave,
        note: record.note || ''
      });
    } else if (isOpen) {
      setFormData({
        checkInTime: '08:00',
        checkOutTime: '17:00',
        isLeave: false,
        isAbsent: false,
        note: ''
      });
    }
  }, [isOpen, record]);

  // Compute status automatically based on checkInTime & checkOutTime
  const computedStatusInfo = useMemo(() => {
    if (formData.isLeave) {
      return {
        status: 'LEAVE',
        label: 'Nghỉ phép (LEAVE)',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        desc: 'Được tính là nghỉ phép theo quy định'
      };
    }

    if (formData.isAbsent || (!formData.checkInTime && !formData.checkOutTime)) {
      return {
        status: 'ABSENT',
        label: 'Vắng mặt (ABSENT)',
        color: 'text-zinc-400 bg-zinc-800 border-zinc-700',
        desc: 'Không có dữ liệu check-in và check-out'
      };
    }

    const startTime = defaultSchedule?.startTime ? defaultSchedule.startTime.slice(0, 5) : '08:00';
    const endTime = defaultSchedule?.endTime ? defaultSchedule.endTime.slice(0, 5) : '17:00';
    const lateGraceMinutes = defaultSchedule?.lateGraceMinutes ?? 5;

    // Parse minutes from "HH:mm"
    const parseMins = (tStr) => {
      if (!tStr) return null;
      const [h, m] = tStr.split(':').map(Number);
      return h * 60 + m;
    };

    const startMins = parseMins(startTime);
    const endMins = parseMins(endTime);
    const lateThresholdMins = startMins + lateGraceMinutes;

    const inMins = parseMins(formData.checkInTime);
    const outMins = parseMins(formData.checkOutTime);

    let isLate = false;
    if (inMins !== null && startMins !== null) {
      isLate = inMins > lateThresholdMins;
    }

    let isEarly = false;
    if (outMins !== null && endMins !== null) {
      isEarly = outMins < endMins;
    }

    if (isLate && isEarly) {
      return {
        status: 'LATE_AND_EARLY_LEAVE',
        label: 'Muộn & Về sớm (LATE_AND_EARLY_LEAVE)',
        color: 'text-red-300 bg-red-400/10 border-red-400/30',
        desc: `Check-in sau ${startTime} (+${lateGraceMinutes}p) & Check-out trước ${endTime}`
      };
    } else if (isLate) {
      return {
        status: 'LATE',
        label: 'Đi muộn (LATE)',
        color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
        desc: `Check-in sau giờ cho phép (${startTime} + ${lateGraceMinutes}p)`
      };
    } else if (isEarly) {
      return {
        status: 'EARLY_LEAVE',
        label: 'Về sớm (EARLY_LEAVE)',
        color: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
        desc: `Check-out trước giờ tan ca chuẩn (${endTime})`
      };
    } else {
      return {
        status: 'ON_TIME',
        label: 'Đúng giờ (ON_TIME)',
        color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
        desc: `Check-in và check-out đúng quy định ca (${startTime} - ${endTime})`
      };
    }
  }, [formData.checkInTime, formData.checkOutTime, formData.isLeave, formData.isAbsent, defaultSchedule]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgId) {
      showToast('Không tìm thấy thông tin tổ chức', 'error');
      return;
    }

    if (!formData.note.trim()) {
      showToast('Vui lòng nhập lý do điều chỉnh chấm công', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const isNonWorking = formData.isLeave || formData.isAbsent || (!formData.checkInTime && !formData.checkOutTime);

      let checkInISO = null;
      if (!isNonWorking && formData.checkInTime) {
        checkInISO = `${workDate}T${formData.checkInTime.length === 5 ? formData.checkInTime + ':00' : formData.checkInTime}`;
      }

      let checkOutISO = null;
      if (!isNonWorking && formData.checkOutTime) {
        checkOutISO = `${workDate}T${formData.checkOutTime.length === 5 ? formData.checkOutTime + ':00' : formData.checkOutTime}`;
      }

      const payload = {
        staffId: staff.id,
        workDate: workDate,
        checkInTime: checkInISO,
        checkOutTime: checkOutISO,
        status: computedStatusInfo.status,
        note: formData.note.trim()
      };

      await attendanceService.manualAttendance(orgId, payload);
      showToast(`Đã cập nhật chấm công ngày ${workDate} cho ${staff.fullName}`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin chấm công';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isNonWorking = formData.isLeave || formData.isAbsent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Điều chỉnh chấm công</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Ngày: <span className="text-violet-400 font-semibold">{workDate}</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Staff Info Card */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-violet-400 font-mono text-xs font-bold flex-shrink-0">
              {staff?.avatar || staff?.fullName?.slice(0, 2)?.toUpperCase() || 'NV'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-zinc-100 truncate">{staff?.fullName}</div>
              <div className="text-xs text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                <span>{staff?.staffCode}</span>
                <span>•</span>
                <span className="text-zinc-300">{staff?.department || 'Chưa xếp phòng ban'}</span>
              </div>
            </div>
          </div>

          {/* Time pickers (Check-in / Check-out) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Giờ vào (Check-in)
              </label>
              <input
                type="time"
                disabled={isNonWorking}
                value={formData.checkInTime}
                onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value, isAbsent: false, isLeave: false })}
                className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors ${
                  isNonWorking ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Giờ ra (Check-out)
              </label>
              <input
                type="time"
                disabled={isNonWorking}
                value={formData.checkOutTime}
                onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value, isAbsent: false, isLeave: false })}
                className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-violet-500 transition-colors ${
                  isNonWorking ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              />
            </div>
          </div>

          {/* Special Day Status Checkboxes */}
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isLeave}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData({
                    ...formData,
                    isLeave: checked,
                    isAbsent: false,
                    checkInTime: checked ? '' : (formData.checkInTime || '08:00'),
                    checkOutTime: checked ? '' : (formData.checkOutTime || '17:00')
                  });
                }}
                className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-violet-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span>Nghỉ phép (LEAVE)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isAbsent}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData({
                    ...formData,
                    isAbsent: checked,
                    isLeave: false,
                    checkInTime: checked ? '' : (formData.checkInTime || '08:00'),
                    checkOutTime: checked ? '' : (formData.checkOutTime || '17:00')
                  });
                }}
                className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-violet-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span>Vắng mặt (ABSENT)</span>
            </label>
          </div>

          {/* LOCKED Status Display (Auto-computed) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Trạng thái chấm công (Tự động khóa)
              </label>
              <span className="text-[10px] text-zinc-500 font-mono">Tự động tính theo giờ vào/ra</span>
            </div>

            {/* Readonly Status Card */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${computedStatusInfo.color}`}>
              <div>
                <div className="text-xs font-bold font-mono flex items-center gap-2">
                  {computedStatusInfo.label}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5 font-sans">
                  {computedStatusInfo.desc}
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 flex-shrink-0 opacity-80" />
            </div>

            {defaultSchedule && (
              <p className="text-[10px] text-zinc-500 font-mono">
                * Ca làm việc chuẩn: {defaultSchedule.startTime?.slice(0, 5)} - {defaultSchedule.endTime?.slice(0, 5)} (Ân hạn đi muộn: {defaultSchedule.lateGraceMinutes} phút)
              </p>
            )}
          </div>

          {/* Reason / Note */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Lý do / Ghi chú điều chỉnh <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="VD: Nhân viên xin về sớm lúc 16:00, điều chỉnh theo đơn duyệt..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl hover:bg-zinc-800/40 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-all shadow-lg shadow-violet-600/20 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
