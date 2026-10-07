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
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-indigo-600" />
            Quản lý chấm công theo tháng
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Tổng hợp dữ liệu chấm công và bảng công chi tiết tháng {String(currentMonth).padStart(2, '0')}/{currentYear}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Month Navigator */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-1.5 py-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="month"
              value={`${currentYear}-${String(currentMonth).padStart(2, '0')}`}
              onChange={handleMonthInputChange}
              className="bg-transparent border-none text-xs font-bold text-slate-800 font-mono px-2 focus:outline-none cursor-pointer text-center w-28"
            />
            <button
              onClick={handleNextMonth}
              disabled={isCurrentOrFutureMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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
              className="flex items-center gap-1.5 px-3.5 py-2 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Điều chỉnh công</span>
            </button>
          )}

          {/* Export Excel Button */}
          <button
            onClick={() => handleExportExcel(viewMode === 'individual' ? selectedStaffId : null)}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors bg-white cursor-pointer shadow-xs disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            {exporting ? 'Đang xuất...' : viewMode === 'individual' ? 'Xuất Excel nhân viên' : 'Xuất Excel tháng'}
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng ngày công toàn cty', value: loading ? '...' : `${monthlyStats.totalWorkingDays} công`, desc: 'Lượt công ghi nhận trong tháng', color: 'text-slate-900' },
          { label: 'Tỷ lệ đúng giờ', value: loading ? '...' : `${monthlyStats.onTimeRate}%`, desc: 'Đúng giờ theo lịch chuẩn', color: 'text-emerald-600' },
          { label: 'Đi muộn / Về sớm', value: loading ? '...' : `${monthlyStats.lateEarlyCount} lượt`, desc: 'Tổng lượt vi phạm giờ giấc', color: 'text-amber-600' },
          { label: 'Nghỉ phép / Vắng mặt', value: loading ? '...' : `${monthlyStats.leaveAbsentCount} lượt`, desc: 'Tổng ngày nghỉ hoặc vắng', color: 'text-indigo-600' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
            <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
            <div className="my-2">
              <span className={`text-2xl font-bold font-mono ${kpi.color}`}>{kpi.value}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono truncate">{kpi.desc}</span>
          </div>
        ))}
      </div>

      {/* View Switcher & Global Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-100/70 border border-slate-200 p-3 rounded-2xl">
        {/* Switch Tabs */}
        <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'matrix' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Bảng tổng hợp tháng
          </button>
          <button
            onClick={() => setViewMode('individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'individual' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nhân viên, mã NV..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors w-48 shadow-xs"
              />
            </div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors cursor-pointer shadow-xs"
            >
              {departments.map((d) => (
                <option key={d} value={d} className="bg-white text-slate-800">{d}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-slate-500 font-semibold">Chọn nhân viên:</span>
            <select
              value={selectedStaffId || ''}
              onChange={(e) => setSelectedStaffId(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-indigo-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors cursor-pointer min-w-[200px] shadow-xs"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id} className="bg-white text-slate-800">
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
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-[650px] relative">
              {loading ? (
                <div className="p-12 text-center text-sm text-slate-500 font-medium flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  Đang tải bảng chấm công tháng...
                </div>
              ) : (
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="sticky left-0 z-30 bg-slate-50 text-left px-4 py-3 font-semibold text-slate-600 uppercase tracking-wider min-w-[180px] border-r border-slate-200">
                        Nhân viên
                      </th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600 uppercase tracking-wider min-w-[100px] border-r border-slate-200">
                        Phòng ban
                      </th>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        const dow = getDayOfWeek(currentYear, currentMonth, day);
                        return (
                          <th
                            key={day}
                            className={`px-1.5 py-2 text-center font-mono border-r border-slate-200 min-w-[34px] ${
                              dow.isWeekend ? 'bg-slate-100/70 text-slate-400' : 'text-slate-700'
                            }`}
                          >
                            <div className="text-[10px] text-slate-400 font-normal">{dow.label}</div>
                            <div className="text-xs font-bold mt-0.5">{day}</div>
                          </th>
                        );
                      })}
                      <th className="px-3 py-3 text-center font-semibold text-slate-700 uppercase tracking-wider min-w-[70px] border-r border-slate-200 bg-slate-50">
                        Số công
                      </th>
                      <th className="px-3 py-3 text-center font-semibold text-slate-700 uppercase tracking-wider min-w-[70px] border-r border-slate-200 bg-slate-50">
                        Muộn/Sớm
                      </th>
                      <th className="px-3 py-3 text-center font-semibold text-slate-700 uppercase tracking-wider min-w-[80px] bg-slate-50">
                        Chi tiết
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
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
                        <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Sticky Employee Name */}
                          <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-4 py-2.5 border-r border-slate-200">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-mono text-[10px] font-bold flex-shrink-0">
                                {staff.fullName?.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">{staff.fullName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{staff.staffCode}</div>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="px-3 py-2.5 text-slate-600 font-medium truncate max-w-[100px] border-r border-slate-200">
                            {staff.department || 'Chưa xếp'}
                          </td>

                          {/* Day Columns */}
                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                            const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const att = attendanceMap.get(`${staff.id}_${dateStr}`);
                            const dow = getDayOfWeek(currentYear, currentMonth, day);

                            let badgeContent = '—';
                            let badgeStyle = 'text-slate-300 hover:bg-slate-100';
                            let tooltipTitle = `${staff.fullName} - Ngày ${day}/${currentMonth}/${currentYear}`;

                            if (att) {
                              const ci = att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
                              const co = att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
                              tooltipTitle += `\nTrạng thái: ${att.status}\nCheck-in: ${ci || '—'}\nCheck-out: ${co || '—'}`;
                              if (att.note) tooltipTitle += `\nGhi chú: ${att.note}`;

                              if (att.status === 'ON_TIME') {
                                badgeContent = '✓';
                                badgeStyle = 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold hover:bg-emerald-100 shadow-xs';
                              } else if (att.status === 'LATE') {
                                badgeContent = 'M';
                                badgeStyle = 'bg-amber-50 text-amber-700 border border-amber-200 font-bold hover:bg-amber-100 shadow-xs';
                              } else if (att.status === 'EARLY_LEAVE') {
                                badgeContent = 'S';
                                badgeStyle = 'bg-orange-50 text-orange-700 border border-orange-200 font-bold hover:bg-orange-100 shadow-xs';
                              } else if (att.status === 'LATE_AND_EARLY_LEAVE') {
                                badgeContent = 'MS';
                                badgeStyle = 'bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100 shadow-xs';
                              } else if (att.status === 'LEAVE') {
                                badgeContent = 'P';
                                badgeStyle = 'bg-blue-50 text-blue-700 border border-blue-200 font-bold hover:bg-blue-100 shadow-xs';
                              } else if (att.status === 'ABSENT') {
                                badgeContent = 'V';
                                badgeStyle = 'bg-slate-100 text-slate-600 border border-slate-200 font-bold hover:bg-slate-200 shadow-xs';
                              }
                            } else if (dow.isWeekend) {
                              badgeContent = '·';
                              badgeStyle = 'text-slate-300 hover:bg-slate-100';
                              tooltipTitle += `\nNgày nghỉ cuối tuần`;
                            } else {
                              tooltipTitle += `\nChưa có dữ liệu chấm công (Bấm để thêm)`;
                            }

                            return (
                              <td
                                key={day}
                                className={`p-1 text-center border-r border-slate-200 ${
                                  dow.isWeekend ? 'bg-slate-50/60' : ''
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
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-emerald-600 border-r border-slate-200">
                            {staffWorkingDays}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-amber-600 border-r border-slate-200">
                            {staffLateEarly}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={() => {
                                setSelectedStaffId(staff.id);
                                setViewMode('individual');
                              }}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200 transition-colors cursor-pointer shadow-xs"
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
                <div className="py-12 text-center text-sm text-slate-500 font-medium">Không tìm thấy nhân viên nào phù hợp.</div>
              )}
            </div>

            {/* Legend / Helper Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-4 text-[11px] text-slate-600">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-semibold text-slate-800">Chú thích:</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-[9px]">✓</span> Đúng giờ</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold text-[9px]">M</span> Đi muộn</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-orange-50 text-orange-700 border border-orange-200 flex items-center justify-center font-bold text-[9px]">S</span> Về sớm</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-bold text-[9px]">MS</span> Muộn & Sớm</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-[9px]">P</span> Nghỉ phép</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-[9px]">V</span> Vắng mặt</span>
              </div>
              <span className="text-slate-400 font-mono text-[10px]">* Bấm vào bất kỳ ô ngày nào để điều chỉnh công trực tiếp</span>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW 2: INDIVIDUAL STAFF VIEW ===================== */}
      {viewMode === 'individual' && currentSelectedStaff && (
        <div className="space-y-6">
          {/* Employee Summary Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-mono text-lg font-bold">
                {currentSelectedStaff.fullName?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">{currentSelectedStaff.fullName}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {currentSelectedStaff.staffCode}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  Phòng ban: <span className="text-slate-800 font-semibold">{currentSelectedStaff.department || 'Chưa xếp'}</span> · Chức vụ: <span className="text-slate-800 font-semibold">{currentSelectedStaff.position || 'Nhân viên'}</span>
                </p>
              </div>
            </div>

            {/* Individual KPI Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Ngày công</div>
                <div className="text-lg font-bold font-mono text-emerald-600 mt-0.5">{individualStats.presentDays} công</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Đi muộn</div>
                <div className="text-lg font-bold font-mono text-amber-600 mt-0.5">{individualStats.lateCount} lần</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Về sớm</div>
                <div className="text-lg font-bold font-mono text-orange-600 mt-0.5">{individualStats.earlyCount} lần</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Nghỉ phép / Vắng</div>
                <div className="text-lg font-bold font-mono text-slate-600 mt-0.5">{individualStats.leaveCount + individualStats.absentCount} ngày</div>
              </div>
            </div>
          </div>

          {/* Detailed Days Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/75 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-800">Lịch trình chấm công từng ngày trong tháng</h4>
              </div>
              <span className="text-xs text-slate-500 font-mono">{daysInMonth} ngày</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    {['Ngày làm việc', 'Giờ vào (Check-in)', 'Ảnh Check-in', 'Giờ ra (Check-out)', 'Tổng giờ làm', 'Trạng thái', 'Phương thức', 'Ghi chú / Lý do', 'Thao tác'].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {individualDays.map((row) => (
                    <tr
                      key={row.dayNumber}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        row.isWeekend ? 'bg-slate-50/40' : ''
                      }`}
                    >
                      {/* Date & Weekday */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                            row.isWeekend ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {row.dayOfWeek}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-800 font-mono">
                              Ngày {String(row.dayNumber).padStart(2, '0')}/{String(currentMonth).padStart(2, '0')}/{currentYear}
                            </div>
                            {row.isWeekend && <span className="text-[10px] text-slate-400">Cuối tuần</span>}
                          </div>
                        </div>
                      </td>

                      {/* Check-in */}
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-800">
                        {row.checkin}
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="px-5 py-3.5 text-xs">
                        {row.checkInImage ? (
                          <div
                            className="w-10 h-10 rounded-md overflow-hidden border border-slate-200 cursor-pointer hover:border-indigo-500 transition-colors shadow-xs"
                            onClick={() => setPreviewImg(row.checkInImage)}
                            title="Bấm để xem ảnh phóng to"
                          >
                            <img src={row.checkInImage} alt="check-in" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Check-out */}
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-800">
                        {row.checkout}
                      </td>

                      {/* Hours */}
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-800">
                        {row.hours}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {row.status === 'ON_TIME' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Đúng giờ</span>
                        ) : row.status === 'LATE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Đi muộn</span>
                        ) : row.status === 'EARLY_LEAVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">Về sớm</span>
                        ) : row.status === 'LATE_AND_EARLY_LEAVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Muộn & Sớm</span>
                        ) : row.status === 'LEAVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Nghỉ phép</span>
                        ) : row.status === 'OFF' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">Nghỉ tuần</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Vắng</span>
                        )}
                      </td>

                      {/* Method */}
                      <td className="px-5 py-3.5">
                        {row.checkInMethod === 'MANUAL' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-mono font-medium">
                            <Edit3 className="w-3 h-3" /> Thủ công
                          </span>
                        ) : row.checkin !== '—' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-indigo-700 font-mono font-medium">
                            <Scan className="w-3.5 h-3.5" /> Face ID
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>

                      {/* Note */}
                      <td className="px-5 py-3.5 max-w-[200px]">
                        {row.note ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg truncate shadow-xs" title={row.note}>
                            <MessageSquare className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                            <span className="truncate">{row.note}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Edit Action Button */}
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleOpenEdit(currentSelectedStaff, row.dateStr, row.att)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100/70 transition-colors cursor-pointer shadow-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-2xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
              <h3 className="text-sm font-semibold text-slate-800">Ảnh Check-in thực tế</h3>
              <button onClick={() => setPreviewImg(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex justify-center bg-slate-50/30">
              <img src={previewImg} alt="Preview" className="max-w-full max-h-[70vh] rounded-lg object-contain shadow-xs" />
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
