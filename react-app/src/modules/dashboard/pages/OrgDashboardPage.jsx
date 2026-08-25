import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffService } from '../../staff/services/staffService';
import { attendanceService } from '../../attendance/services/attendanceService';
import AttendanceBarChart from '../components/AttendanceBarChart';
import Pagination from '../../../components/Pagination';
import {
  Users, UserCheck, Clock, AlertTriangle, CheckCircle2,
  ChevronRight, ChevronLeft, Calendar, Filter, Search,
  ArrowUpRight, PieChart, Building2, UserX, CalendarDays,
  Sparkles, RefreshCw, Loader2
} from 'lucide-react';

const PRESENT_STATUSES = ['ON_TIME', 'LATE', 'EARLY_LEAVE', 'LATE_AND_EARLY_LEAVE'];

function fmtDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toLocalDateVN(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function getStartAndEndOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  // Monday is day 1, Sunday is 0
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diffToMonday));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: fmtDate(monday),
    end: fmtDate(sunday)
  };
}

export default function OrgDashboardPage() {
  const navigate = useNavigate();
  const orgId = localStorage.getItem('orgId');

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => fmtDate(new Date()), []);

  // Filter Mode: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM'
  const [periodMode, setPeriodMode] = useState('DAY');

  // Selected date parameters
  const [selectedDay, setSelectedDay] = useState(todayStr);
  const [selectedWeekDate, setSelectedWeekDate] = useState(todayStr);
  const [selectedMonthYear, setSelectedMonthYear] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear()
  });
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [customRange, setCustomRange] = useState({
    start: todayStr,
    end: todayStr
  });

  // Table filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  // Pagination state for staff table
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data states
  const [staffs, setStaffs] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Compute effective date range based on periodMode
  const { startDate, endDate, periodLabel } = useMemo(() => {
    if (periodMode === 'DAY') {
      return {
        startDate: selectedDay,
        endDate: selectedDay,
        periodLabel: `Ngày ${toLocalDateVN(selectedDay)}`
      };
    }

    if (periodMode === 'WEEK') {
      const { start, end } = getStartAndEndOfWeek(selectedWeekDate);
      return {
        startDate: start,
        endDate: end,
        periodLabel: `Tuần (${toLocalDateVN(start)} – ${toLocalDateVN(end)})`
      };
    }

    if (periodMode === 'MONTH') {
      const { month, year } = selectedMonthYear;
      const lastDay = new Date(year, month, 0).getDate();
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return {
        startDate: start,
        endDate: end,
        periodLabel: `Tháng ${String(month).padStart(2, '0')}/${year}`
      };
    }

    if (periodMode === 'YEAR') {
      const start = `${selectedYear}-01-01`;
      const end = `${selectedYear}-12-31`;
      return {
        startDate: start,
        endDate: end,
        periodLabel: `Năm ${selectedYear}`
      };
    }

    // CUSTOM
    return {
      startDate: customRange.start,
      endDate: customRange.end,
      periodLabel: `Từ ${toLocalDateVN(customRange.start)} đến ${toLocalDateVN(customRange.end)}`
    };
  }, [periodMode, selectedDay, selectedWeekDate, selectedMonthYear, selectedYear, customRange]);

  // Fetch staff and attendance data
  const fetchData = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const [staffList, history] = await Promise.all([
        staffService.getStaffList(orgId),
        attendanceService.getAttendanceHistory(orgId, null, startDate, endDate)
      ]);

      setStaffs(staffList || []);
      setAttendances(history || []);
    } catch (err) {
      console.error('Không thể tải dữ liệu Dashboard', err);
    } finally {
      setLoading(false);
    }
  }, [orgId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Overall KPIs Calculation
  const totalStaff = staffs.length;
  const faceRegisteredCount = staffs.filter((s) => s.faceRegistered).length;

  const stats = useMemo(() => {
    let presentCount = 0;
    let onTimeCount = 0;
    let lateCount = 0;
    let earlyCount = 0;
    let lateAndEarlyCount = 0;
    let leaveCount = 0;
    let absentCount = 0;

    attendances.forEach((att) => {
      if (att.status === 'ON_TIME') {
        presentCount++;
        onTimeCount++;
      } else if (att.status === 'LATE') {
        presentCount++;
        lateCount++;
      } else if (att.status === 'EARLY_LEAVE') {
        presentCount++;
        earlyCount++;
      } else if (att.status === 'LATE_AND_EARLY_LEAVE') {
        presentCount++;
        lateAndEarlyCount++;
        lateCount++;
        earlyCount++;
      } else if (att.status === 'LEAVE') {
        leaveCount++;
      } else if (att.status === 'ABSENT') {
        absentCount++;
      }
    });

    // In DAY mode, calculate absent as staff who didn't check in
    if (periodMode === 'DAY') {
      const checkedInStaffIds = new Set(attendances.map((a) => a.staffId));
      const notCheckedIn = Math.max(0, totalStaff - checkedInStaffIds.size);
      absentCount = notCheckedIn;
    }

    const attendanceRate = totalStaff > 0 && periodMode === 'DAY'
      ? Math.round((presentCount / totalStaff) * 100)
      : (presentCount + absentCount > 0 ? Math.round((presentCount / (presentCount + absentCount)) * 100) : 0);

    const onTimeRate = presentCount > 0 ? Math.round((onTimeCount / presentCount) * 100) : 0;

    return {
      presentCount,
      onTimeCount,
      lateCount,
      earlyCount,
      leaveCount,
      absentCount,
      attendanceRate,
      onTimeRate
    };
  }, [attendances, totalStaff, periodMode]);

  // Chart Data Preparation based on periodMode
  const chartData = useMemo(() => {
    if (periodMode === 'DAY') {
      // Hourly distribution for the day (06:00 to 18:00)
      const hours = ['06h', '07h', '08h', '09h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h'];
      const counts = hours.map((h) => ({
        label: h,
        day: h,
        present: 0,
        absent: 0,
        onTime: 0,
        late: 0
      }));

      attendances.forEach((att) => {
        if (att.checkInTime) {
          const hour = new Date(att.checkInTime).getHours();
          const idx = hour - 6;
          if (idx >= 0 && idx < counts.length) {
            counts[idx].present += 1;
            if (att.status === 'ON_TIME') counts[idx].onTime += 1;
            if (att.status === 'LATE' || att.status === 'LATE_AND_EARLY_LEAVE') counts[idx].late += 1;
          }
        }
      });
      return counts;
    }

    if (periodMode === 'WEEK') {
      const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
      const { start } = getStartAndEndOfWeek(selectedWeekDate);
      const startD = new Date(start);

      return days.map((dayLabel, i) => {
        const d = new Date(startD);
        d.setDate(startD.getDate() + i);
        const dateStr = fmtDate(d);

        const dayAtts = attendances.filter((a) => a.workDate === dateStr);
        const present = dayAtts.filter((a) => PRESENT_STATUSES.includes(a.status)).length;
        const onTime = dayAtts.filter((a) => a.status === 'ON_TIME').length;
        const late = dayAtts.filter((a) => a.status === 'LATE' || a.status === 'LATE_AND_EARLY_LEAVE').length;
        const absent = Math.max(0, totalStaff - present);

        return {
          label: dayLabel,
          day: dayLabel,
          dateStr: toLocalDateVN(dateStr),
          present,
          onTime,
          late,
          absent
        };
      });
    }

    if (periodMode === 'MONTH') {
      const { month, year } = selectedMonthYear;
      const lastDay = new Date(year, month, 0).getDate();

      const result = [];
      for (let day = 1; day <= lastDay; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayAtts = attendances.filter((a) => a.workDate === dateStr);
        const present = dayAtts.filter((a) => PRESENT_STATUSES.includes(a.status)).length;
        const onTime = dayAtts.filter((a) => a.status === 'ON_TIME').length;
        const late = dayAtts.filter((a) => a.status === 'LATE' || a.status === 'LATE_AND_EARLY_LEAVE').length;
        const absent = Math.max(0, totalStaff - present);

        result.push({
          label: `${day}`,
          day: `N.${day}`,
          dateStr: `${day}/${month}/${year}`,
          present,
          onTime,
          late,
          absent
        });
      }
      return result;
    }

    if (periodMode === 'YEAR') {
      const months = Array.from({ length: 12 }, (_, i) => i + 1);
      return months.map((m) => {
        const monthPrefix = `${selectedYear}-${String(m).padStart(2, '0')}`;
        const mAtts = attendances.filter((a) => a.workDate && a.workDate.startsWith(monthPrefix));
        const present = mAtts.filter((a) => PRESENT_STATUSES.includes(a.status)).length;
        const onTime = mAtts.filter((a) => a.status === 'ON_TIME').length;
        const late = mAtts.filter((a) => a.status === 'LATE' || a.status === 'LATE_AND_EARLY_LEAVE').length;
        const absent = mAtts.filter((a) => a.status === 'ABSENT').length;

        return {
          label: `T${m}`,
          day: `Tháng ${m}`,
          dateStr: `Tháng ${m}/${selectedYear}`,
          present,
          onTime,
          late,
          absent
        };
      });
    }

    // CUSTOM: group by days in range
    const startD = new Date(customRange.start);
    const endD = new Date(customRange.end);
    const diffDays = Math.min(60, Math.max(1, Math.round((endD - startD) / (1000 * 60 * 60 * 24)) + 1));

    const result = [];
    for (let i = 0; i < diffDays; i++) {
      const cur = new Date(startD);
      cur.setDate(startD.getDate() + i);
      const dateStr = fmtDate(cur);
      const dayAtts = attendances.filter((a) => a.workDate === dateStr);
      const present = dayAtts.filter((a) => PRESENT_STATUSES.includes(a.status)).length;
      const onTime = dayAtts.filter((a) => a.status === 'ON_TIME').length;
      const late = dayAtts.filter((a) => a.status === 'LATE' || a.status === 'LATE_AND_EARLY_LEAVE').length;
      const absent = Math.max(0, totalStaff - present);

      result.push({
        label: `${cur.getDate()}/${cur.getMonth() + 1}`,
        day: `${cur.getDate()}/${cur.getMonth() + 1}`,
        dateStr: toLocalDateVN(dateStr),
        present,
        onTime,
        late,
        absent
      });
    }
    return result;
  }, [periodMode, selectedDay, selectedWeekDate, selectedMonthYear, selectedYear, customRange, attendances, totalStaff]);

  // Department Breakdown Stats
  const departmentStats = useMemo(() => {
    const map = new Map();
    staffs.forEach((s) => {
      const dept = s.department || 'Chưa xếp phòng';
      if (!map.has(dept)) {
        map.set(dept, { total: 0, present: 0, late: 0, staffIds: new Set() });
      }
      const d = map.get(dept);
      d.total += 1;
      d.staffIds.add(s.id);
    });

    attendances.forEach((att) => {
      for (const [dept, d] of map.entries()) {
        if (d.staffIds.has(att.staffId)) {
          if (PRESENT_STATUSES.includes(att.status)) d.present += 1;
          if (att.status === 'LATE' || att.status === 'LATE_AND_EARLY_LEAVE') d.late += 1;
        }
      }
    });

    return Array.from(map.entries()).map(([dept, data]) => ({
      dept,
      total: data.total,
      present: data.present,
      rate: data.total > 0 && periodMode === 'DAY' ? Math.round((data.present / data.total) * 100) : 100
    }));
  }, [staffs, attendances, periodMode]);

  // Navigation handlers
  const handleNavPrev = () => {
    if (periodMode === 'DAY') {
      const d = new Date(selectedDay);
      d.setDate(d.getDate() - 1);
      setSelectedDay(fmtDate(d));
    } else if (periodMode === 'WEEK') {
      const d = new Date(selectedWeekDate);
      d.setDate(d.getDate() - 7);
      setSelectedWeekDate(fmtDate(d));
    } else if (periodMode === 'MONTH') {
      setSelectedMonthYear((prev) => {
        if (prev.month === 1) return { month: 12, year: prev.year - 1 };
        return { ...prev, month: prev.month - 1 };
      });
    } else if (periodMode === 'YEAR') {
      setSelectedYear((y) => y - 1);
    }
  };

  const handleNavNext = () => {
    if (periodMode === 'DAY') {
      const d = new Date(selectedDay);
      d.setDate(d.getDate() + 1);
      if (d > today) return;
      setSelectedDay(fmtDate(d));
    } else if (periodMode === 'WEEK') {
      const d = new Date(selectedWeekDate);
      d.setDate(d.getDate() + 7);
      setSelectedWeekDate(fmtDate(d));
    } else if (periodMode === 'MONTH') {
      setSelectedMonthYear((prev) => {
        if (prev.month === 12) return { month: 1, year: prev.year + 1 };
        return { ...prev, month: prev.month + 1 };
      });
    } else if (periodMode === 'YEAR') {
      if (selectedYear >= today.getFullYear()) return;
      setSelectedYear((y) => y + 1);
    }
  };

  // Activity list for display in table
  const displayedActivities = useMemo(() => {
    // Map staff list with attendance
    return staffs
      .map((s) => {
        const att = attendances.find((a) => a.staffId === s.id && (periodMode === 'DAY' ? a.workDate === selectedDay : true));
        return {
          id: s.id,
          staffCode: s.staffCode,
          fullName: s.fullName,
          department: s.department || 'Chưa xếp',
          avatar: (s.fullName[0] + (s.fullName.trim().split(' ').pop()[0] || '')).toUpperCase(),
          faceRegistered: s.faceRegistered,
          checkin: att?.checkInTime ? new Date(att.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—',
          checkout: att?.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—',
          status: att?.status || (periodMode === 'DAY' ? 'ABSENT' : '—'),
          note: att?.note || ''
        };
      })
      .filter((s) => {
        const matchSearch =
          s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.staffCode.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus =
          statusFilter === 'Tất cả' ||
          (statusFilter === 'Có mặt' && PRESENT_STATUSES.includes(s.status)) ||
          (statusFilter === 'Vắng' && (s.status === 'ABSENT' || s.status === '—'));
        return matchSearch && matchStatus;
      });
  }, [staffs, attendances, periodMode, selectedDay, searchTerm, statusFilter]);

  const paginatedActivities = displayedActivities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header & Period Control Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Tổng quan hệ thống
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Báo cáo thống kê: <span className="text-violet-300 font-semibold">{periodLabel}</span>
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Mode Switcher */}
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-xl shadow-sm">
            {[
              { id: 'DAY', label: 'Ngày' },
              { id: 'WEEK', label: 'Tuần' },
              { id: 'MONTH', label: 'Tháng' },
              { id: 'YEAR', label: 'Năm' },
              { id: 'CUSTOM', label: 'Tùy chọn' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setPeriodMode(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  periodMode === tab.id
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dynamic Date Controls */}
          {periodMode === 'DAY' && (
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-1.5 py-1">
              <button
                onClick={() => {
                  handleNavPrev();
                  setCurrentPage(1);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Ngày trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDay}
                max={todayStr}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDay(e.target.value);
                    setCurrentPage(1);
                  }
                }}
                className="bg-transparent border-none text-xs font-bold text-zinc-100 font-mono px-2 focus:outline-none cursor-pointer w-28 text-center"
              />
              <button
                onClick={() => {
                  handleNavNext();
                  setCurrentPage(1);
                }}
                disabled={selectedDay >= todayStr}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Ngày sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {periodMode === 'WEEK' && (
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-1.5 py-1">
              <button
                onClick={() => {
                  handleNavPrev();
                  setCurrentPage(1);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Tuần trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-zinc-100 font-mono px-3 text-center">
                {periodLabel.replace('Tuần (', '').replace(')', '')}
              </span>
              <button
                onClick={() => {
                  handleNavNext();
                  setCurrentPage(1);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Tuần sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {periodMode === 'MONTH' && (
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-1.5 py-1">
              <button
                onClick={() => {
                  handleNavPrev();
                  setCurrentPage(1);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Tháng trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="month"
                value={`${selectedMonthYear.year}-${String(selectedMonthYear.month).padStart(2, '0')}`}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [y, m] = e.target.value.split('-').map(Number);
                  setSelectedMonthYear({ year: y, month: m });
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-xs font-bold text-zinc-100 font-mono px-2 focus:outline-none cursor-pointer w-28 text-center"
              />
              <button
                onClick={() => {
                  handleNavNext();
                  setCurrentPage(1);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Tháng sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {periodMode === 'YEAR' && (
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-1.5 py-1">
              <button
                onClick={() => {
                  handleNavPrev();
                  setCurrentPage(1);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Năm trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-zinc-100 font-mono px-3 text-center">
                Năm {selectedYear}
              </span>
              <button
                onClick={() => {
                  handleNavNext();
                  setCurrentPage(1);
                }}
                disabled={selectedYear >= today.getFullYear()}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title="Năm sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {periodMode === 'CUSTOM' && (
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
              <input
                type="date"
                value={customRange.start}
                onChange={(e) => {
                  setCustomRange({ ...customRange, start: e.target.value });
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-xs font-mono text-zinc-100 focus:outline-none cursor-pointer"
              />
              <span className="text-zinc-500 text-xs">đến</span>
              <input
                type="date"
                value={customRange.end}
                onChange={(e) => {
                  setCustomRange({ ...customRange, end: e.target.value });
                  setCurrentPage(1);
                }}
                className="bg-transparent border-none text-xs font-mono text-zinc-100 focus:outline-none cursor-pointer"
              />
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={() => {
              fetchData();
              setCurrentPage(1);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors cursor-pointer"
            title="Tải lại dữ liệu"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-violet-400" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Tổng nhân viên',
            value: loading ? '...' : totalStaff,
            sub: `${faceRegisteredCount}/${totalStaff} đã có Face ID`,
            icon: Users,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10'
          },
          {
            label: periodMode === 'DAY' ? 'Có mặt trong ngày' : 'Tổng lượt có mặt',
            value: loading ? '...' : `${stats.presentCount} lượt`,
            sub: `${stats.attendanceRate}% tỷ lệ chuyên cần`,
            icon: UserCheck,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10'
          },
          {
            label: 'Đi làm đúng giờ',
            value: loading ? '...' : `${stats.onTimeCount} lượt`,
            sub: `${stats.onTimeRate}% tỷ lệ đúng giờ`,
            icon: CheckCircle2,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10'
          },
          {
            label: 'Đi muộn / Về sớm',
            value: loading ? '...' : `${stats.lateCount + stats.earlyCount} lượt`,
            sub: `${stats.lateCount} muộn · ${stats.earlyCount} về sớm`,
            icon: Clock,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10'
          }
        ].map((k, i) => (
          <div
            key={i}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 hover:border-violet-500/30 transition-all shadow-md group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs text-zinc-400 font-medium">{k.label}</div>
                <div className="text-2xl font-bold text-zinc-100 mt-2 tracking-tight font-mono">{k.value}</div>
                <div className="text-[11px] text-zinc-500 mt-1 font-mono truncate">{k.sub}</div>
              </div>
              <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0 border border-white/[0.03]`}>
                <k.icon className={`w-5 h-5 ${k.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart (Span 2) */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-violet-400" />
                Diễn biến chấm công ({periodMode === 'DAY' ? 'Theo khung giờ' : periodMode === 'WEEK' ? 'Theo ngày trong tuần' : periodMode === 'MONTH' ? 'Theo ngày trong tháng' : 'Theo các tháng'})
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">{periodLabel}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> Có mặt
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Vắng mặt
              </span>
            </div>
          </div>

          <div className="mt-4 flex-1 flex items-center">
            {loading ? (
              <div className="w-full h-48 flex items-center justify-center text-xs text-zinc-500">
                <Loader2 className="w-5 h-5 animate-spin text-violet-400 mr-2" />
                Đang tải dữ liệu biểu đồ...
              </div>
            ) : (
              <AttendanceBarChart data={chartData} height={230} />
            )}
          </div>
        </div>

        {/* Status Distribution & Department Progress */}
        <div className="space-y-6">
          {/* Status Breakdown Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-violet-400" />
              Cơ cấu trạng thái công
            </h3>

            <div className="space-y-2.5">
              {[
                { label: 'Đúng giờ', count: stats.onTimeCount, color: 'bg-emerald-400', text: 'text-emerald-400' },
                { label: 'Đi muộn', count: stats.lateCount, color: 'bg-amber-400', text: 'text-amber-400' },
                { label: 'Về sớm', count: stats.earlyCount, color: 'bg-orange-400', text: 'text-orange-400' },
                { label: 'Nghỉ phép', count: stats.leaveCount, color: 'bg-blue-400', text: 'text-blue-400' },
                { label: 'Vắng mặt', count: stats.absentCount, color: 'bg-red-400', text: 'text-red-400' }
              ].map((item, idx) => {
                const total = Math.max(1, stats.presentCount + stats.absentCount + stats.leaveCount);
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-medium">{item.label}</span>
                      <span className={`font-mono font-bold ${item.text}`}>
                        {item.count} <span className="text-zinc-500 font-normal text-[10px]">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department Breakdown Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-md space-y-3">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-400" />
              Thống kê theo phòng ban
            </h3>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {departmentStats.map((dept, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-xs">
                  <div>
                    <div className="font-semibold text-zinc-200">{dept.dept}</div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{dept.total} nhân sự</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-emerald-400">{dept.present} lượt</span>
                    {periodMode === 'DAY' && (
                      <div className="text-[10px] text-zinc-400 font-mono">{dept.rate}% có mặt</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Table in Selected Period */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/40 gap-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Chi tiết nhân sự ({periodLabel})</h3>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">{displayedActivities.length} kết quả</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm nhân viên..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-violet-500 w-44"
              />
            </div>

            {/* Quick Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Có mặt">Có mặt</option>
              <option value="Vắng">Vắng mặt</option>
            </select>

            <button
              onClick={() => navigate('/org/attendance')}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
            >
              Lịch sử chi tiết <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500 font-medium">Đang tải danh sách nhân sự...</div>
          ) : (
            <table className="w-full text-sm text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/10">
                  {['Nhân viên', 'Phòng ban', 'Check-in', 'Check-out', 'Trạng thái', 'Face ID'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {paginatedActivities.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/10 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-600/15 flex items-center justify-center text-violet-400 font-mono text-xs font-semibold">
                          {s.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-zinc-200">{s.fullName}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{s.staffCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-400 font-medium">{s.department}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-zinc-200">{s.checkin}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-zinc-200">{s.checkout}</td>
                    <td className="px-5 py-3.5">
                      {s.status === 'ON_TIME' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-500/15">
                          Đúng giờ
                        </span>
                      ) : s.status === 'LATE' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-500/15">
                          Đi muộn
                        </span>
                      ) : s.status === 'EARLY_LEAVE' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-400/10 text-orange-400 border border-orange-500/15">
                          Về sớm
                        </span>
                      ) : s.status === 'LATE_AND_EARLY_LEAVE' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-400/10 text-red-300 border border-red-400/15">
                          Muộn & Sớm
                        </span>
                      ) : s.status === 'LEAVE' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-400/10 text-blue-400 border border-blue-500/15">
                          Nghỉ phép
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-400/10 text-zinc-400 border border-zinc-500/15">
                          Vắng
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.faceRegistered ? (
                        <span className="flex items-center gap-1 text-xs text-violet-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã đăng ký
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Chưa đăng ký
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {displayedActivities.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-sm text-zinc-500 font-medium">
                      Không tìm thấy nhân viên nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && displayedActivities.length > 0 && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={displayedActivities.length}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => setPageSize(s)}
          />
        )}
      </div>
    </div>
  );
}
