import React, { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../../attendance/services/attendanceService';
import {
  X, Calendar, DollarSign, Clock, CheckCircle2, AlertTriangle,
  User, Building2, Briefcase, Award, TrendingDown, ArrowRight, Loader2, Sparkles
} from 'lucide-react';

function fmt(n) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)) + ' đ';
}

function getDayOfWeekVN(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return days[d.getDay()];
}

export default function SalaryDetailModal({ isOpen, onClose, staffData, month, year, orgId }) {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState([]);
  const [summary, setSummary] = useState({
    totalEarned: 0,
    workingDays: 0,
    standardDays: 26,
    bonus: 0,
    deduction: 0,
    totalSalary: 0
  });

  const loadDailySalaryBreakdown = useCallback(async () => {
    if (!isOpen || !staffData || !orgId) return;

    setLoading(true);
    try {
      const daysInMonth = new Date(year, month, 0).getDate();
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      // Fetch attendances in this month for this staff
      const attendances = await attendanceService.getAttendanceHistory(
        orgId,
        staffData.staffId,
        startDate,
        endDate
      );

      const attMap = {};
      (attendances || []).forEach((att) => {
        const dateKey = att.workDate || (att.checkInTime ? att.checkInTime.split('T')[0] : null);
        if (dateKey) {
          attMap[dateKey] = att;
        }
      });

      const baseSalary = staffData.base || staffData.baseSalary || 0;
      const standardDays = staffData.record?.standardDays || 26;
      const shiftHours = 8.0; // standard shift duration (hours)

      const dailyRate = standardDays > 0 ? baseSalary / standardDays : 0;
      const hourlyRate = dailyRate / shiftHours;

      let totalEarned = 0;
      let workingDaysCount = 0;
      const daysList = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = getDayOfWeekVN(dayStr);
        const isWeekend = dayOfWeek === 'Chủ Nhật';
        const att = attMap[dayStr];

        let checkIn = '—';
        let checkOut = '—';
        let status = 'ABSENT';
        let workedHours = 0;
        let dayUnits = 0;
        let daySalary = 0;
        let note = '';

        if (att) {
          status = att.status || 'ABSENT';
          if (att.checkInTime) {
            checkIn = new Date(att.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          }
          if (att.checkOutTime) {
            checkOut = new Date(att.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          }

          // Calculate worked hours
          if (att.checkInTime && att.checkOutTime) {
            const inTime = new Date(att.checkInTime);
            const outTime = new Date(att.checkOutTime);
            const diffMin = Math.max(0, (outTime - inTime) / (1000 * 60));
            workedHours = Math.min(shiftHours, diffMin / 60);
          } else if (att.checkInTime && status !== 'ABSENT') {
            workedHours = shiftHours;
          }

          if (status === 'ON_TIME' || status === 'LATE') {
            dayUnits = 1.0;
            daySalary = dailyRate;
            workingDaysCount += 1;
            totalEarned += daySalary;
            note = status === 'LATE' ? 'Đi muộn (Tính đủ ngày công)' : 'Đúng giờ (Đủ 1 công)';
          } else if (status === 'EARLY_LEAVE' || status === 'LATE_AND_EARLY_LEAVE') {
            // Formula: LCB / 26 / (Số giờ ca) * số giờ làm
            const actualHours = workedHours > 0 ? workedHours : 4.0; // fallback if no checkout
            dayUnits = actualHours / shiftHours;
            daySalary = hourlyRate * actualHours;
            workingDaysCount += 1;
            totalEarned += daySalary;
            note = `Về sớm (Tính ${actualHours.toFixed(1)}h / ${shiftHours}h ca)`;
          } else if (status === 'LEAVE') {
            dayUnits = 0;
            daySalary = 0;
            note = 'Nghỉ phép';
          } else if (status === 'LOCKED') {
            dayUnits = 0;
            daySalary = 0;
            note = 'Dữ liệu bị khóa';
          }
        } else {
          note = isWeekend ? 'Nghỉ cuối tuần' : 'Không có dữ liệu chấm công';
        }

        daysList.push({
          day,
          dayStr,
          dayOfWeek,
          isWeekend,
          checkIn,
          checkOut,
          status,
          workedHours,
          dayUnits,
          daySalary,
          note,
          hasRecord: !!att
        });
      }

      setDailyData(daysList);

      const bonus = staffData.record?.bonus || 0;
      const deduction = staffData.record?.deduction || 0;
      const totalSalary = staffData.record ? staffData.record.totalSalary : Math.max(0, totalEarned + bonus - deduction);

      setSummary({
        totalEarned: Math.round(totalEarned),
        workingDays: staffData.record?.workingDays ?? workingDaysCount,
        standardDays,
        bonus,
        deduction,
        totalSalary: Math.round(totalSalary)
      });
    } catch (err) {
      console.error('Error loading daily salary breakdown', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, staffData, month, year, orgId]);

  useEffect(() => {
    loadDailySalaryBreakdown();
  }, [loadDailySalaryBreakdown]);

  if (!isOpen || !staffData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-base font-mono">
              {(staffData.fullName?.[0] || 'NV').toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-zinc-100">{staffData.fullName}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                  {staffData.staffCode}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Bảng phân tích lương chi tiết từng ngày · <span className="text-violet-400 font-semibold font-mono">Tháng {month}/{year}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div className="p-6 bg-zinc-950/40 border-b border-zinc-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-zinc-400 block">Lương cơ bản</span>
            <span className="text-sm font-bold text-zinc-100 font-mono mt-1 block">{fmt(staffData.base)}</span>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-zinc-400 block">Ngày công tính</span>
            <span className="text-sm font-bold text-amber-400 font-mono mt-1 block">
              {summary.workingDays} / {summary.standardDays} công
            </span>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-zinc-400 block">Lương theo ngày</span>
            <span className="text-sm font-bold text-emerald-400 font-mono mt-1 block">{fmt(summary.totalEarned)}</span>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-zinc-400 block">Thưởng thêm (+)</span>
            <span className="text-sm font-bold text-blue-400 font-mono mt-1 block">{fmt(summary.bonus)}</span>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3.5 shadow-sm">
            <span className="text-[11px] font-semibold text-zinc-400 block">Khấu trừ (-)</span>
            <span className="text-sm font-bold text-red-400 font-mono mt-1 block">{fmt(summary.deduction)}</span>
          </div>

          <div className="bg-violet-950/40 border border-violet-500/30 rounded-2xl p-3.5 shadow-sm">
            <span className="text-[11px] font-bold text-violet-300 block uppercase">Thực lĩnh</span>
            <span className="text-sm font-extrabold text-violet-300 font-mono mt-1 block">{fmt(summary.totalSalary)}</span>
          </div>
        </div>

        {/* Day-by-Day Table Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
              <p className="text-xs font-medium">Đang tính toán và tải dữ liệu lương từng ngày...</p>
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/40">
              <table className="w-full text-xs text-zinc-300">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 text-left">Ngày</th>
                    <th className="py-3 px-4 text-left">Thứ</th>
                    <th className="py-3 px-4 text-center">Giờ vào</th>
                    <th className="py-3 px-4 text-center">Giờ ra</th>
                    <th className="py-3 px-4 text-center">Thời gian làm</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-center">Công tính</th>
                    <th className="py-3 px-4 text-right">Lương ngày</th>
                    <th className="py-3 px-4 text-left">Diễn giải</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40 font-mono">
                  {dailyData.map((row) => (
                    <tr
                      key={row.day}
                      className={`hover:bg-zinc-800/20 transition-colors ${
                        row.isWeekend ? 'bg-zinc-900/20 opacity-75' : ''
                      } ${row.daySalary > 0 ? 'bg-violet-950/[0.04]' : ''}`}
                    >
                      <td className="py-3 px-4 font-bold text-zinc-200">
                        {String(row.day).padStart(2, '0')}/{String(month).padStart(2, '0')}
                      </td>
                      <td className={`py-3 px-4 ${row.isWeekend ? 'text-amber-400/80 font-bold' : 'text-zinc-400'}`}>
                        {row.dayOfWeek}
                      </td>
                      <td className="py-3 px-4 text-center text-zinc-300">{row.checkIn}</td>
                      <td className="py-3 px-4 text-center text-zinc-300">{row.checkOut}</td>
                      <td className="py-3 px-4 text-center text-zinc-400">
                        {row.workedHours > 0 ? `${row.workedHours.toFixed(1)}h` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.status === 'ON_TIME' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-500/20">
                            Đúng giờ
                          </span>
                        ) : row.status === 'LATE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-500/20">
                            Đi muộn
                          </span>
                        ) : row.status === 'EARLY_LEAVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-400/10 text-orange-400 border border-orange-500/20">
                            Về sớm
                          </span>
                        ) : row.status === 'LATE_AND_EARLY_LEAVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-400/10 text-red-300 border border-red-400/20">
                            Muộn & Sớm
                          </span>
                        ) : row.status === 'LEAVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-400/10 text-blue-400 border border-blue-500/20">
                            Nghỉ phép
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        {row.dayUnits > 0 ? (
                          <span className={row.dayUnits < 1 ? 'text-amber-400' : 'text-zinc-200'}>
                            {row.dayUnits.toFixed(2)} công
                          </span>
                        ) : (
                          <span className="text-zinc-600">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">
                        {row.daySalary > 0 ? fmt(row.daySalary) : <span className="text-zinc-600 font-normal">0 đ</span>}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-sans text-[11px] truncate max-w-[200px]">
                        {row.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-zinc-950 border-t-2 border-zinc-800 font-bold">
                    <td colSpan={6} className="py-4 px-4 text-right uppercase text-zinc-400 text-xs">
                      Tổng cộng ngày công & tiền lương:
                    </td>
                    <td className="py-4 px-4 text-center text-amber-400 text-xs font-mono">
                      {dailyData.reduce((acc, curr) => acc + curr.dayUnits, 0).toFixed(2)} công
                    </td>
                    <td className="py-4 px-4 text-right text-emerald-400 text-sm font-mono font-extrabold">
                      {fmt(summary.totalEarned)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500">
            * Công thức: Ngày đủ công = <code className="text-zinc-300">LCB / 26</code>. Ngày về sớm = <code className="text-emerald-400">LCB / 26 / 8h × Số giờ làm</code>.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
