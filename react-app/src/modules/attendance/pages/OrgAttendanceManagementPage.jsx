import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { staffService } from '../../staff/services/staffService';
import { attendanceService } from '../services/attendanceService';
import { useToast } from '../../../contexts/ToastContext';
import {
  CalendarDays, Download, ChevronLeft, ChevronRight, Search,
  Filter, UserCheck, Clock, AlertTriangle, CheckCircle2,
  Calendar, Eye, Edit3, Loader2, Scan, MessageSquare, Plus, FileSpreadsheet
} from 'lucide-react';
import EditAttendanceModal from '../components/EditAttendanceModal';

function calcHours(ci, co) {
  if (!ci || ci === '—' || !co || co === '—') return ci && ci !== '—' ? 'Đang làm' : '—';
  const [ih, im] = ci.split(':').map(Number);
  const [oh, om] = co.split(':').map(Number);
  const t = oh * 60 + om - (ih * 60 + im);
  if (isNaN(t) || t < 0) return '—';
  return `${Math.floor(t / 60)}h${String(t % 60).padStart(2, '0')}m`;
}

function getDaysInMonth(year, month) {
  // month is 1-indexed (1..12)
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year, month, day) {
  const d = new Date(year, month - 1, day);
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return {
    label: days[d.getDay()],
    isWeekend: d.getDay() === 0 || d.getDay() === 6
  };
}

const PRESENT_STATUSES = ['ON_TIME', 'LATE', 'EARLY_LEAVE', 'LATE_AND_EARLY_LEAVE'];

export default function OrgAttendanceManagementPage() {
  const { showToast } = useToast();
  const orgId = localStorage.getItem('orgId');

  // Month navigation: default to current year-month
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1..12

  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'individual'
  const [staffList, setStaffList] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('Tất cả');
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingWorkDate, setEditingWorkDate] = useState('');
  const [previewImg, setPreviewImg] = useState(null);

  const daysInMonth = useMemo(() => getDaysInMonth(currentYear, currentMonth), [currentYear, currentMonth]);

  const startDateStr = useMemo(() => {
    return `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  }, [currentYear, currentMonth]);

  const endDateStr = useMemo(() => {
    return `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  }, [currentYear, currentMonth, daysInMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    const isCurrentOrFuture = currentYear > now.getFullYear() || (currentYear === now.getFullYear() && currentMonth >= now.getMonth() + 1);
    if (isCurrentOrFuture) return;
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleMonthInputChange = (e) => {
    if (!e.target.value) return;
    const [y, m] = e.target.value.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m);
  };

  // Fetch monthly attendance and staff list
  const fetchData = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const [staffData, attData] = await Promise.all([
        staffService.getStaffList(orgId),
        attendanceService.getAttendanceHistory(orgId, null, startDateStr, endDateStr)
      ]);

      setStaffList(staffData || []);
      setAttendances(attData || []);

      if (staffData && staffData.length > 0 && !selectedStaffId) {
        setSelectedStaffId(staffData[0].id);
      }
    } catch (err) {
      console.error('Lỗi khi tải bảng chấm công tháng:', err);
      showToast('Không thể tải dữ liệu chấm công tháng', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, startDateStr, endDateStr, selectedStaffId, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build map: `staffId_YYYY-MM-DD` -> Attendance record
  const attendanceMap = useMemo(() => {
    const map = new Map();
    (attendances || []).forEach((att) => {
      if (att.staffId && att.workDate) {
        map.set(`${att.staffId}_${att.workDate}`, att);
      }
    });
    return map;
  }, [attendances]);

  // Departments
  const departments = useMemo(() => {
    return ['Tất cả', ...new Set(staffList.map((s) => s.department).filter(Boolean))];
  }, [staffList]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchDept = selectedDept === 'Tất cả' || s.department === selectedDept;
      const matchSearch =
        (s.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.staffCode || '').toLowerCase().includes(search.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [staffList, selectedDept, search]);

  // Overall Monthly Stats
  const monthlyStats = useMemo(() => {
    let totalPresent = 0;
    let onTimeCount = 0;
    let lateCount = 0;
    let earlyCount = 0;
    let leaveCount = 0;
    let absentCount = 0;

    attendances.forEach((att) => {
      if (att.status === 'ON_TIME') {
        totalPresent++;
        onTimeCount++;
      } else if (att.status === 'LATE') {
        totalPresent++;
        lateCount++;
      } else if (att.status === 'EARLY_LEAVE') {
        totalPresent++;
        earlyCount++;
      } else if (att.status === 'LATE_AND_EARLY_LEAVE') {
        totalPresent++;
        lateCount++;
        earlyCount++;
      } else if (att.status === 'LEAVE') {
        leaveCount++;
      } else if (att.status === 'ABSENT') {
        absentCount++;
      }
    });

    const onTimeRate = totalPresent > 0 ? Math.round((onTimeCount / totalPresent) * 100) : 0;

    return {
      totalWorkingDays: totalPresent,
      onTimeRate,
      lateEarlyCount: lateCount + earlyCount,
      leaveAbsentCount: leaveCount + absentCount
    };
  }, [attendances]);

  // Export Excel for current month
  const handleExportExcel = async (specificStaffId = null) => {
    if (!orgId) return;
    try {
      setExporting(true);
      await attendanceService.exportAttendanceExcel(orgId, specificStaffId, startDateStr, endDateStr);
      showToast('Đã tải xuống file Excel chấm công tháng thành công!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Không thể xuất file Excel chấm công tháng', 'error');
    } finally {
      setExporting(false);
    }
  };

  // Open Edit Modal for a specific staff and day
  const handleOpenEdit = (staff, dateStr, attRecord = null) => {
    setEditingStaff({
      id: staff.id,
      staffCode: staff.staffCode,
      fullName: staff.fullName,
      department: staff.department,
      avatar: (() => {
        const name = (staff.fullName || '').trim();
        if (!name) return '??';
        const parts = name.split(' ').filter(Boolean);
        return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
      })()
    });

    setEditingWorkDate(dateStr);

    if (attRecord) {
      setEditingRecord({
        rawCheckInTime: attRecord.checkInTime,
        rawCheckOutTime: attRecord.checkOutTime,
        checkin: attRecord.checkInTime ? new Date(attRecord.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—',
        checkout: attRecord.checkOutTime ? new Date(attRecord.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—',
        status: attRecord.status,
        note: attRecord.note || ''
      });
    } else {
      setEditingRecord(null);
    }

    setEditModalOpen(true);
  };

  // Currently selected staff in individual view
  const currentSelectedStaff = useMemo(() => {
    return staffList.find((s) => s.id === selectedStaffId) || staffList[0] || null;
  }, [staffList, selectedStaffId]);

  // Individual days list for currently selected staff
  const individualDays = useMemo(() => {
    if (!currentSelectedStaff) return [];
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const att = attendanceMap.get(`${currentSelectedStaff.id}_${dateStr}`);
      const dow = getDayOfWeek(currentYear, currentMonth, day);

      const hasCheckIn = !!att?.checkInTime;
      const hasCheckOut = !!att?.checkOutTime;
      const checkinFormatted = hasCheckIn ? new Date(att.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
      const checkoutFormatted = hasCheckOut ? new Date(att.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';

      days.push({
        dayNumber: day,
        dateStr,
        dayOfWeek: dow.label,
        isWeekend: dow.isWeekend,
        att,
        status: att?.status || (dow.isWeekend ? 'OFF' : 'ABSENT'),
        checkin: checkinFormatted,
        checkout: checkoutFormatted,
        rawCheckIn: att?.checkInTime,
        rawCheckOut: att?.checkOutTime,
        checkInImage: att?.checkInImage,
        checkInMethod: att?.checkInMethod,
        note: att?.note,
        hours: calcHours(checkinFormatted, checkoutFormatted)
      });
    }
    return days;
  }, [currentSelectedStaff, daysInMonth, currentYear, currentMonth, attendanceMap]);

  // Individual stats summary
  const individualStats = useMemo(() => {
    let presentDays = 0;
    let lateCount = 0;
    let earlyCount = 0;
    let leaveCount = 0;
    let absentCount = 0;

    individualDays.forEach((d) => {
      if (PRESENT_STATUSES.includes(d.status)) {
        presentDays++;
        if (d.status === 'LATE') lateCount++;
        if (d.status === 'EARLY_LEAVE') earlyCount++;
        if (d.status === 'LATE_AND_EARLY_LEAVE') {
          lateCount++;
          earlyCount++;
        }
      } else if (d.status === 'LEAVE') {
        leaveCount++;
      } else if (d.status === 'ABSENT' && !d.isWeekend) {
        absentCount++;
      }
    });

    return {
      presentDays,
      lateCount,
      earlyCount,
      leaveCount,
      absentCount
    };
  }, [individualDays]);

  const isCurrentOrFutureMonth = currentYear > now.getFullYear() || (currentYear === now.getFullYear() && currentMonth >= now.getMonth() + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-violet-400" />
            Quản lý chấm công theo tháng
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Tổng hợp dữ liệu chấm công và bảng công chi tiết tháng {String(currentMonth).padStart(2, '0')}/{currentYear}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Month Navigator */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-1.5 py-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="month"
              value={`${currentYear}-${String(currentMonth).padStart(2, '0')}`}
              onChange={handleMonthInputChange}
              className="bg-transparent border-none text-xs font-bold text-zinc-100 font-mono px-2 focus:outline-none cursor-pointer text-center w-28"
            />
            <button
              onClick={handleNextMonth}
              disabled={isCurrentOrFutureMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Manual Adjustment Button */}
          {staffList.length > 0 && (
            <button
              onClick={() => {
                const s = currentSelectedStaff || staffList[0];
                handleOpenEdit(s, `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(Math.min(now.getDate(), daysInMonth)).padStart(2, '0')}`, null);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-violet-500/30 rounded-xl text-xs font-semibold text-violet-300 bg-violet-600/10 hover:bg-violet-600/20 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Điều chỉnh công</span>
            </button>
          )}

          {/* Export Excel Button */}
          <button
            onClick={() => handleExportExcel(viewMode === 'individual' ? selectedStaffId : null)}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition-colors bg-zinc-900/60 cursor-pointer disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin text-violet-400" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
            {exporting ? 'Đang xuất...' : viewMode === 'individual' ? 'Xuất Excel nhân viên' : 'Xuất Excel tháng'}
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng ngày công toàn cty', value: loading ? '...' : `${monthlyStats.totalWorkingDays} công`, desc: 'Lượt công ghi nhận trong tháng', color: 'text-zinc-100' },
          { label: 'Tỷ lệ đúng giờ', value: loading ? '...' : `${monthlyStats.onTimeRate}%`, desc: 'Đúng giờ theo lịch chuẩn', color: 'text-emerald-400' },
          { label: 'Đi muộn / Về sớm', value: loading ? '...' : `${monthlyStats.lateEarlyCount} lượt`, desc: 'Tổng lượt vi phạm giờ giấc', color: 'text-amber-400' },
          { label: 'Nghỉ phép / Vắng mặt', value: loading ? '...' : `${monthlyStats.leaveAbsentCount} lượt`, desc: 'Tổng ngày nghỉ hoặc vắng', color: 'text-violet-400' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-md">
            <span className="text-xs font-medium text-zinc-400">{kpi.label}</span>
            <div className="my-2">
              <span className={`text-2xl font-bold font-mono ${kpi.color}`}>{kpi.value}</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono truncate">{kpi.desc}</span>
          </div>
        ))}
      </div>

      {/* View Switcher & Global Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-zinc-900/40 border border-zinc-800 p-3 rounded-2xl">
        {/* Switch Tabs */}
        <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'matrix' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Bảng tổng hợp tháng
          </button>
          <button
            onClick={() => setViewMode('individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'individual' ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Chi tiết từng nhân viên
          </button>
        </div>

        {/* View Mode Specific Filters */}
        {viewMode === 'matrix' ? (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Tìm nhân viên, mã NV..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 transition-colors w-48"
              />
            </div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-medium text-zinc-300 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
            >
              {departments.map((d) => (
                <option key={d} value={d} className="bg-zinc-950">{d}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-zinc-400 font-semibold">Chọn nhân viên:</span>
            <select
              value={selectedStaffId || ''}
              onChange={(e) => setSelectedStaffId(Number(e.target.value))}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-semibold text-violet-300 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer min-w-[200px]"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id} className="bg-zinc-950">
                  {s.fullName} ({s.staffCode}) - {s.department || 'Chưa xếp'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ===================== VIEW 1: MATRIX TIMESHEET ===================== */}
      {viewMode === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
            <div className="overflow-x-auto max-h-[650px] relative">
              {loading ? (
                <div className="p-12 text-center text-sm text-zinc-500 font-medium flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                  Đang tải bảng chấm công tháng...
                </div>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 z-20 bg-zinc-950 border-b border-zinc-800">
                    <tr>
                      <th className="sticky left-0 z-30 bg-zinc-950 text-left px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider min-w-[180px] border-r border-zinc-800">
                        Nhân viên
                      </th>
                      <th className="text-left px-3 py-3 font-semibold text-zinc-400 uppercase tracking-wider min-w-[100px] border-r border-zinc-800">
                        Phòng ban
                      </th>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        const dow = getDayOfWeek(currentYear, currentMonth, day);
                        return (
                          <th
                            key={day}
                            className={`px-1.5 py-2 text-center font-mono border-r border-zinc-800/60 min-w-[34px] ${
                              dow.isWeekend ? 'bg-zinc-900/80 text-zinc-500' : 'text-zinc-300'
                            }`}
                          >
                            <div className="text-[10px] text-zinc-500 font-normal">{dow.label}</div>
                            <div className="text-xs font-bold mt-0.5">{day}</div>
                          </th>
                        );
                      })}
                      <th className="px-3 py-3 text-center font-semibold text-zinc-300 uppercase tracking-wider min-w-[70px] border-r border-zinc-800 bg-zinc-950">
                        Số công
                      </th>
                      <th className="px-3 py-3 text-center font-semibold text-zinc-300 uppercase tracking-wider min-w-[70px] border-r border-zinc-800 bg-zinc-950">
                        Muộn/Sớm
                      </th>
                      <th className="px-3 py-3 text-center font-semibold text-zinc-300 uppercase tracking-wider min-w-[80px] bg-zinc-950">
                        Chi tiết
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {filteredStaff.map((staff) => {
                      // Calculate row statistics
                      let staffWorkingDays = 0;
                      let staffLateEarly = 0;

                      for (let d = 1; d <= daysInMonth; d++) {
                        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const att = attendanceMap.get(`${staff.id}_${dateStr}`);
                        if (att && PRESENT_STATUSES.includes(att.status)) {
                          staffWorkingDays++;
                          if (att.status === 'LATE' || att.status === 'EARLY_LEAVE' || att.status === 'LATE_AND_EARLY_LEAVE') {
                            staffLateEarly++;
                          }
                        }
                      }

                      return (
                        <tr key={staff.id} className="hover:bg-zinc-800/20 transition-colors group">
                          {/* Sticky Employee Name */}
                          <td className="sticky left-0 z-10 bg-zinc-900 group-hover:bg-zinc-850 px-4 py-2.5 border-r border-zinc-800">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-violet-400 font-mono text-[10px] font-bold flex-shrink-0">
                                {staff.fullName?.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-zinc-200 truncate max-w-[130px]">{staff.fullName}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">{staff.staffCode}</div>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="px-3 py-2.5 text-zinc-400 font-medium truncate max-w-[100px] border-r border-zinc-800">
                            {staff.department || 'Chưa xếp'}
                          </td>

                          {/* Day Columns */}
                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const att = attendanceMap.get(`${staff.id}_${dateStr}`);
                            const dow = getDayOfWeek(currentYear, currentMonth, day);

                            let badgeContent = '—';
                            let badgeStyle = 'text-zinc-600 hover:bg-zinc-800/60';
                            let tooltipTitle = `${staff.fullName} - Ngày ${day}/${currentMonth}/${currentYear}`;

                            if (att) {
                              const ci = att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
                              const co = att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
                              tooltipTitle += `\nTrạng thái: ${att.status}\nCheck-in: ${ci || '—'}\nCheck-out: ${co || '—'}`;
                              if (att.note) tooltipTitle += `\nGhi chú: ${att.note}`;

                              if (att.status === 'ON_TIME') {
                                badgeContent = '✓';
                                badgeStyle = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold hover:bg-emerald-500/30';
                              } else if (att.status === 'LATE') {
                                badgeContent = 'M';
                                badgeStyle = 'bg-amber-500/15 text-amber-400 border border-amber-500/25 font-bold hover:bg-amber-500/30';
                              } else if (att.status === 'EARLY_LEAVE') {
                                badgeContent = 'S';
                                badgeStyle = 'bg-orange-500/15 text-orange-400 border border-orange-500/25 font-bold hover:bg-orange-500/30';
                              } else if (att.status === 'LATE_AND_EARLY_LEAVE') {
                                badgeContent = 'MS';
                                badgeStyle = 'bg-red-400/15 text-red-300 border border-red-400/25 font-bold hover:bg-red-400/30';
                              } else if (att.status === 'LEAVE') {
                                badgeContent = 'P';
                                badgeStyle = 'bg-blue-500/15 text-blue-400 border border-blue-500/25 font-bold hover:bg-blue-500/30';
                              } else if (att.status === 'ABSENT') {
                                badgeContent = 'V';
                                badgeStyle = 'bg-zinc-700/20 text-zinc-400 border border-zinc-700/30 font-bold hover:bg-zinc-700/40';
                              }
                            } else if (dow.isWeekend) {
                              badgeContent = '·';
                              badgeStyle = 'text-zinc-700 hover:bg-zinc-800/40';
                              tooltipTitle += `\nNgày nghỉ cuối tuần`;
                            } else {
                              tooltipTitle += `\nChưa có dữ liệu chấm công (Bấm để thêm)`;
                            }

                            return (
                              <td
                                key={day}
                                className={`p-1 text-center border-r border-zinc-800/50 ${
                                  dow.isWeekend ? 'bg-zinc-950/40' : ''
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(staff, dateStr, att)}
                                  title={tooltipTitle}
                                  className={`w-6 h-6 mx-auto rounded flex items-center justify-center text-[10px] transition-transform active:scale-90 cursor-pointer ${badgeStyle}`}
                                >
                                  {badgeContent}
                                </button>
                              </td>
                            );
                          })}

                          {/* Summary Columns */}
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-emerald-400 border-r border-zinc-800">
                            {staffWorkingDays}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-amber-400 border-r border-zinc-800">
                            {staffLateEarly}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={() => {
                                setSelectedStaffId(staff.id);
                                setViewMode('individual');
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-violet-400 hover:text-violet-200 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 transition-colors cursor-pointer"
                            >
                              Xem
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {!loading && filteredStaff.length === 0 && (
                <div className="py-12 text-center text-sm text-zinc-500 font-medium">Không tìm thấy nhân viên nào phù hợp.</div>
              )}
            </div>

            {/* Legend / Helper Footer */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between flex-wrap gap-4 text-[11px] text-zinc-400">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-semibold text-zinc-300">Chú thích:</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-[9px]">✓</span> Đúng giờ</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-[9px]">M</span> Đi muộn</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-[9px]">S</span> Về sớm</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-red-400/20 text-red-300 border border-red-400/30 flex items-center justify-center font-bold text-[9px]">MS</span> Muộn & Sớm</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-[9px]">P</span> Nghỉ phép</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-zinc-700/20 text-zinc-400 border border-zinc-700/30 flex items-center justify-center font-bold text-[9px]">V</span> Vắng mặt</span>
              </div>
              <span className="text-zinc-500 font-mono text-[10px]">* Bấm vào bất kỳ ô ngày nào để điều chỉnh công trực tiếp</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW 2: INDIVIDUAL STAFF VIEW ===================== */}
      {viewMode === 'individual' && currentSelectedStaff && (
        <div className="space-y-6">
          {/* Employee Summary Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-mono text-lg font-bold">
                {currentSelectedStaff.fullName?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-zinc-100">{currentSelectedStaff.fullName}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    {currentSelectedStaff.staffCode}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-1">
                  Phòng ban: <span className="text-zinc-200 font-semibold">{currentSelectedStaff.department || 'Chưa xếp'}</span> · Chức vụ: <span className="text-zinc-200 font-semibold">{currentSelectedStaff.position || 'Nhân viên'}</span>
                </p>
              </div>
            </div>

            {/* Individual KPI Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 text-center">
                <div className="text-[10px] text-zinc-500 font-semibold uppercase">Ngày công</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{individualStats.presentDays} công</div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 text-center">
                <div className="text-[10px] text-zinc-500 font-semibold uppercase">Đi muộn</div>
                <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">{individualStats.lateCount} lần</div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 text-center">
                <div className="text-[10px] text-zinc-500 font-semibold uppercase">Về sớm</div>
                <div className="text-lg font-bold font-mono text-orange-400 mt-0.5">{individualStats.earlyCount} lần</div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 text-center">
                <div className="text-[10px] text-zinc-500 font-semibold uppercase">Nghỉ phép / Vắng</div>
                <div className="text-lg font-bold font-mono text-zinc-400 mt-0.5">{individualStats.leaveCount + individualStats.absentCount} ngày</div>
              </div>
            </div>
          </div>

          {/* Detailed Days Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
            <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-400" />
                <h4 className="text-sm font-bold text-zinc-200">Lịch trình chấm công từng ngày trong tháng</h4>
              </div>
              <span className="text-xs text-zinc-500 font-mono">{daysInMonth} ngày</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-zinc-300">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-800/10">
                    {['Ngày làm việc', 'Giờ vào (Check-in)', 'Ảnh Check-in', 'Giờ ra (Check-out)', 'Tổng giờ làm', 'Trạng thái', 'Phương thức', 'Ghi chú / Lý do', 'Thao tác'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {individualDays.map((row) => (
                    <tr
                      key={row.dayNumber}
                      className={`hover:bg-zinc-800/10 transition-colors ${
                        row.isWeekend ? 'bg-zinc-950/20' : ''
                      }`}
                    >
                      {/* Date & Weekday */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                            row.isWeekend ? 'bg-zinc-800 text-zinc-500' : 'bg-violet-600/15 text-violet-300 border border-violet-500/20'
                          }`}>
                            {row.dayOfWeek}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-zinc-200 font-mono">
                              Ngày {String(row.dayNumber).padStart(2, '0')}/{String(currentMonth).padStart(2, '0')}/{currentYear}
                            </div>
                            {row.isWeekend && <span className="text-[10px] text-zinc-500">Cuối tuần</span>}
                          </div>
                        </div>
                      </td>

                      {/* Check-in */}
                      <td className="px-5 py-3.5 text-xs font-mono text-zinc-200">
                        {row.checkin}
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="px-5 py-3.5 text-xs">
                        {row.checkInImage ? (
                          <div
                            className="w-10 h-10 rounded-md overflow-hidden border border-zinc-700 cursor-pointer hover:border-violet-500 transition-colors"
                            onClick={() => setPreviewImg(row.checkInImage)}
                            title="Bấm để xem ảnh phóng to"
                          >
                            <img src={row.checkInImage} alt="check-in" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Check-out */}
                      <td className="px-5 py-3.5 text-xs font-mono text-zinc-200">
                        {row.checkout}
                      </td>

                      {/* Hours */}
                      <td className="px-5 py-3.5 text-xs font-mono text-zinc-300">
                        {row.hours}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {row.status === 'ON_TIME' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-500/15">Đúng giờ</span>
                        ) : row.status === 'LATE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-500/15">Đi muộn</span>
                        ) : row.status === 'EARLY_LEAVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-400/10 text-orange-400 border border-orange-500/15">Về sớm</span>
                        ) : row.status === 'LATE_AND_EARLY_LEAVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-300/10 text-red-300 border border-red-400/15">Muộn & Sớm</span>
                        ) : row.status === 'LEAVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-400/10 text-blue-400 border border-blue-500/15">Nghỉ phép</span>
                        ) : row.status === 'OFF' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-500 border border-zinc-700/50">Nghỉ tuần</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-400/10 text-zinc-400 border border-zinc-500/15">Vắng</span>
                        )}
                      </td>

                      {/* Method */}
                      <td className="px-5 py-3.5">
                        {row.checkInMethod === 'MANUAL' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-mono font-medium">
                            <Edit3 className="w-3 h-3" /> Thủ công
                          </span>
                        ) : row.checkin !== '—' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-violet-400 font-mono font-medium">
                            <Scan className="w-3.5 h-3.5" /> Face ID
                          </span>
                        ) : (
                          <span className="text-zinc-600 font-mono">—</span>
                        )}
                      </td>

                      {/* Note */}
                      <td className="px-5 py-3.5 max-w-[200px]">
                        {row.note ? (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-800/40 border border-zinc-700/50 px-2 py-1 rounded-lg truncate" title={row.note}>
                            <MessageSquare className="w-3 h-3 text-violet-400 flex-shrink-0" />
                            <span className="truncate">{row.note}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Edit Action Button */}
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleOpenEdit(currentSelectedStaff, row.dateStr, row.att)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 hover:text-violet-200 transition-colors cursor-pointer"
                          title="Sửa hoặc thêm dữ liệu chấm công ngày này"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-2xl w-full max-h-[90vh] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="text-sm font-semibold text-zinc-200">Ảnh Check-in thực tế</h3>
              <button onClick={() => setPreviewImg(null)} className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex justify-center">
              <img src={previewImg} alt="Preview" className="max-w-full max-h-[70vh] rounded-lg object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Edit Attendance Modal */}
      <EditAttendanceModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        staff={editingStaff}
        record={editingRecord}
        workDate={editingWorkDate}
        onSuccess={fetchData}
      />
    </div>
  );
}
