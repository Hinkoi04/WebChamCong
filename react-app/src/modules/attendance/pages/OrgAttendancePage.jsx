import React, { useState, useEffect, useCallback } from 'react';
import { staffService } from '../../staff/services/staffService';
import { attendanceService } from '../services/attendanceService';
import { useToast } from '../../../contexts/ToastContext';
import { Download, AlertTriangle, Scan, ChevronLeft, ChevronRight, Loader2, Edit3, MessageSquare, ShieldCheck, UserCheck } from 'lucide-react';
import EditAttendanceModal from '../components/EditAttendanceModal';
import Pagination from '../../../components/Pagination';

const PRESENT_STATUSES = ['ON_TIME', 'LATE', 'EARLY_LEAVE', 'LATE_AND_EARLY_LEAVE'];

function calcHours(ci, co) {
  if (!ci || ci === '—' || !co || co === '—') return ci && ci !== '—' ? 'Đang làm' : '—';
  const [ih, im] = ci.split(':').map(Number);
  const [oh, om] = co.split(':').map(Number);
  const t = oh * 60 + om - (ih * 60 + im);
  if (isNaN(t) || t < 0) return '—';
  return `${Math.floor(t / 60)}h${String(t % 60).padStart(2, '0')}m`;
}

function formatLocalDate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toLocalDate(d) {
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function OrgAttendancePage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [records, setRecords] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [deptFilter, setDeptFilter] = useState('Tất cả');
  const [previewImg, setPreviewImg] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const orgId = localStorage.getItem('orgId');

  // Date filter — default to today (Local Timezone)
  const todayStr = formatLocalDate(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const DEPTS = ['Tất cả', ...new Set(records.map(r => r.department).filter(Boolean))];

  const goDay = (offset) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + offset);
    
    const newDateStr = formatLocalDate(dateObj);
    const nowLocal = formatLocalDate(new Date());
    if (newDateStr > nowLocal) return; // can't go to future
    setSelectedDate(newDateStr);
  };

  const isToday = selectedDate === formatLocalDate(new Date());

  const fetchAttendance = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const [staffList, history] = await Promise.all([
        staffService.getStaffList(orgId),
        attendanceService.getAttendanceHistory(orgId, null, selectedDate, selectedDate)
      ]);

      const historyMap = new Map();
      (history || []).forEach((att) => {
        if (att.staffId) {
          historyMap.set(att.staffId, att);
        }
      });

      const combined = staffList.map((s) => {
        const dayRecord = historyMap.get(s.id);
        const hasCheckIn = !!dayRecord?.checkInTime;
        const hasCheckOut = !!dayRecord?.checkOutTime;

        return {
          id: s.id,
          staffId: s.id,
          staffCode: s.staffCode,
          fullName: s.fullName,
          department: s.department || 'Chưa xếp',
          avatar: (() => {
            const name = (s.fullName || '').trim();
            if (!name) return '??';
            const parts = name.split(' ').filter(Boolean);
            return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
          })(),
          rawCheckInTime: dayRecord?.checkInTime || null,
          rawCheckOutTime: dayRecord?.checkOutTime || null,
          checkin: hasCheckIn
            ? new Date(dayRecord.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            : '—',
          checkInImage: dayRecord?.checkInImage || null,
          checkout: hasCheckOut
            ? new Date(dayRecord.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            : '—',
          checkInMethod: dayRecord?.checkInMethod || null,
          faceRegistered: s.faceRegistered,
          status: s.status === 'LOCKED' ? 'LOCKED' : (dayRecord ? dayRecord.status : 'ABSENT'),
          note: dayRecord?.note || '',
          attendanceId: dayRecord?.id || null
        };
      });

      setRecords(combined);
    } catch (err) {
      console.error('Không thể tải lịch sử chấm công', err);
      showToast('Không thể tải lịch sử chấm công', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, selectedDate, showToast]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleExportExcel = async () => {
    if (!orgId) return;
    try {
      setExporting(true);
      const d = new Date(selectedDate);
      const startOfMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      await attendanceService.exportAttendanceExcel(orgId, null, startOfMonth, selectedDate);
      showToast('Đã tải xuống file Excel chấm công thành công!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Không thể xuất file Excel chấm công', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleOpenEdit = (s) => {
    setSelectedStaff({
      id: s.id,
      staffCode: s.staffCode,
      fullName: s.fullName,
      department: s.department,
      avatar: s.avatar
    });
    setSelectedRecord({
      rawCheckInTime: s.rawCheckInTime,
      rawCheckOutTime: s.rawCheckOutTime,
      checkin: s.checkin,
      checkout: s.checkout,
      status: s.status,
      note: s.note
    });
    setEditModalOpen(true);
  };

  const filtered = records.filter((s) => {
    const byDept = deptFilter === 'Tất cả' || s.department === deptFilter;
    const isPresent = PRESENT_STATUSES.includes(s.status);
    const byStatus =
      statusFilter === 'Tất cả' ||
      (statusFilter === 'Có mặt' && isPresent) ||
      (statusFilter === 'Vắng' && !isPresent && s.status !== 'LOCKED' && s.status !== 'LEAVE') ||
      (statusFilter === 'Nghỉ phép' && s.status === 'LEAVE') ||
      (statusFilter === 'Bị khóa' && s.status === 'LOCKED');
    return byDept && byStatus;
  });

  const paginatedRecords = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const counts = {
    present: records.filter((s) => PRESENT_STATUSES.includes(s.status)).length,
    absent: records.filter((s) => !PRESENT_STATUSES.includes(s.status) && s.status !== 'LOCKED' && s.status !== 'LEAVE').length,
    leave: records.filter((s) => s.status === 'LEAVE').length,
    locked: records.filter((s) => s.status === 'LOCKED').length
  };

  const displayDate = new Date(selectedDate + 'T00:00:00');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">Bảng chấm công chi tiết theo ngày</h2>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            {isToday ? 'Hôm nay · ' : ''}{toLocalDate(displayDate)}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Date Navigator */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl px-1 py-1">
            <button
              onClick={() => {
                goDay(-1);
                setCurrentPage(1);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Ngày trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                max={todayStr}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                    setCurrentPage(1);
                  }
                }}
                className="bg-transparent border-none text-xs font-bold text-zinc-100 font-mono px-2 focus:outline-none cursor-pointer w-32 text-center"
              />
            </div>
            <button
              onClick={() => {
                goDay(1);
                setCurrentPage(1);
              }}
              disabled={isToday}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Ngày sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition-colors bg-zinc-900/60 cursor-pointer disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin text-violet-400" /> : <Download className="w-4 h-4" />}
            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng nhân viên', value: loading ? '...' : records.length, c: 'text-zinc-100' },
          { label: 'Có mặt', value: loading ? '...' : counts.present, c: 'text-emerald-400' },
          { label: 'Vắng mặt', value: loading ? '...' : counts.absent, c: 'text-amber-400' },
          { label: 'Nghỉ phép', value: loading ? '...' : counts.leave, c: 'text-blue-400' }
        ].map(({ label, value, c }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between shadow-md">
            <span className="text-xs font-medium text-zinc-400">{label}</span>
            <span className={`text-2xl font-bold font-mono ${c}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/20 border border-zinc-800 p-3 rounded-2xl">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 bg-zinc-850/50 p-1 rounded-xl border border-zinc-800/40">
            {['Tất cả', 'Có mặt', 'Vắng', 'Nghỉ phép', 'Bị khóa'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setStatusFilter(tab);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === tab ? 'bg-zinc-800 text-zinc-100 shadow-md' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-violet-500/50 transition-all outline-none cursor-pointer"
          >
            {DEPTS.map((d) => (
              <option key={d} value={d} className="bg-zinc-950">{d}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-zinc-500 font-mono font-semibold">{filtered.length} nhân sự</span>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500 font-medium">Đang tải dữ liệu chấm công...</div>
          ) : (
            <table className="w-full text-sm text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-800/10">
                  {['Nhân viên', 'Phòng ban', 'Check-in', 'Ảnh', 'Check-out', 'Tổng giờ', 'Trạng thái', 'Phương thức', 'Ghi chú / Điều chỉnh', 'Thao tác'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {paginatedRecords.map((s) => (
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
                    <td className="px-5 py-3.5 text-xs">
                      {s.checkInImage ? (
                        <div 
                          className="w-10 h-10 rounded-md overflow-hidden border border-zinc-700 cursor-pointer hover:border-violet-500 transition-colors"
                          onClick={() => setPreviewImg(s.checkInImage)}
                          title="Bấm để phóng to ảnh"
                        >
                          <img src={s.checkInImage} alt="check-in" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-zinc-200">{s.checkout}</td>
                    <td className="px-5 py-3.5 text-xs font-mono text-zinc-200">{calcHours(s.checkin, s.checkout)}</td>
                    <td className="px-5 py-3.5">
                      {s.status === 'LOCKED' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-400/10 text-red-400 border border-red-500/15">Bị khóa</span>
                      ) : s.status === 'ON_TIME' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-500/15">Đúng giờ</span>
                      ) : s.status === 'LATE' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-500/15">Đi muộn</span>
                      ) : s.status === 'EARLY_LEAVE' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-400/10 text-orange-400 border border-orange-500/15">Về sớm</span>
                      ) : s.status === 'LATE_AND_EARLY_LEAVE' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-300/10 text-red-300 border border-red-400/15">Muộn & Sớm</span>
                      ) : s.status === 'LEAVE' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-400/10 text-blue-400 border border-blue-500/15">Nghỉ phép</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-400/10 text-zinc-400 border border-zinc-500/15">Vắng</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.checkInMethod === 'MANUAL' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-mono font-medium">
                          <Edit3 className="w-3 h-3" /> Thủ công
                        </span>
                      ) : s.faceRegistered && s.checkin !== '—' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-violet-400 font-mono font-medium">
                          <Scan className="w-3.5 h-3.5" /> Face ID
                        </span>
                      ) : !s.faceRegistered ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400/80 font-mono font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> Chưa đ/k
                        </span>
                      ) : (
                        <span className="text-zinc-600 font-mono">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 max-w-[180px]">
                      {s.note ? (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-800/40 border border-zinc-700/50 px-2 py-1 rounded-lg truncate" title={s.note}>
                          <MessageSquare className="w-3 h-3 text-violet-400 flex-shrink-0" />
                          <span className="truncate">{s.note}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        disabled={s.status === 'LOCKED'}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 hover:text-violet-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Chỉnh sửa thông tin chấm công"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-zinc-500 font-medium">Không có dữ liệu chấm công.</div>
          )}
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => setPageSize(s)}
          />
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewImg(null)}>
          <div className="relative max-w-2xl w-full max-h-[90vh] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="text-sm font-semibold text-zinc-200">Ảnh Check-in</h3>
              <button onClick={() => setPreviewImg(null)} className="text-zinc-500 hover:text-zinc-300">
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
        staff={selectedStaff}
        record={selectedRecord}
        workDate={selectedDate}
        onSuccess={fetchAttendance}
      />
    </div>
  );
}
