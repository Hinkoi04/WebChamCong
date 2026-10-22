import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { attendanceService } from '../services/attendanceService';
import { staffService } from '../../staff/services/staffService';
import {
  Keyboard, LogIn, LogOut, Clock, CheckCircle2, AlertTriangle,
  UserCheck, Search, Building2, User, RefreshCw, Scan, ArrowRight,
  ShieldCheck, FileText, Check, AlertCircle, Sparkles,
  CheckSquare, Square, Users, XCircle, X, ChevronDown, ChevronUp,
  Filter, CheckCheck
} from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';

function playSuccessBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {}
}

function speakGreeting(textToSpeak) {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {}
}

function formatLocalDate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const COMMON_REASONS = [
  'Điểm danh hàng loạt theo danh sách',
  'Quên quét khuôn mặt',
  'Camera nhận diện không nhận',
  'Đi công tác / Ra ngoài theo chỉ đạo',
  'Được quản lý trực tiếp xác nhận',
  'Thiết bị trạm gặp sự cố',
  'Lý do khác'
];

export default function OrgManualAttendancePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const orgId = localStorage.getItem('orgId');

  // Mode: 'CHECK_IN' or 'CHECK_OUT'
  const [actionType, setActionType] = useState('CHECK_IN');

  // Multi-select staff IDs
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);

  // Reason
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  // Data states
  const [staffList, setStaffList] = useState([]);
  const [todayRecords, setTodayRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Results
  const [batchResults, setBatchResults] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Search & filter for staff list panel
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'ELIGIBLE', 'CHECKED'

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch staff list and today's attendance history
  const loadData = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const todayStr = formatLocalDate(new Date());
      const [staffs, history] = await Promise.all([
        staffService.getStaffList(orgId),
        attendanceService.getAttendanceHistory(orgId, null, todayStr, todayStr)
      ]);
      setStaffList(staffs || []);
      setTodayRecords(history || []);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu chấm công thủ công:', err);
      showToast('Không thể tải danh sách nhân sự hoặc lịch sử hôm nay', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab switch
  const handleTabChange = (type) => {
    setActionType(type);
    setBatchResults(null);
    setError('');
  };

  // Map staffId -> today's record
  const recordMap = useMemo(() => {
    const map = new Map();
    todayRecords.forEach((r) => {
      if (r.staffId) map.set(r.staffId, r);
    });
    return map;
  }, [todayRecords]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set();
    staffList.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [staffList]);

  // Check if a staff is eligible for the current actionType
  const isStaffEligible = useCallback((s) => {
    const rec = recordMap.get(s.id);
    if (actionType === 'CHECK_IN') {
      // Eligible if not yet checked in today
      return !rec?.checkInTime;
    } else {
      // Eligible if checked in but not yet checked out
      return !!rec?.checkInTime && !rec?.checkOutTime;
    }
  }, [recordMap, actionType]);

  // Filtered staff list for quick selection
  const filteredStaffList = useMemo(() => {
    return staffList.filter((s) => {
      const matchSearch =
        !searchTerm ||
        (s.fullName && s.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.staffCode && s.staffCode.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchDept = departmentFilter === 'ALL' || s.department === departmentFilter;

      let matchStatus = true;
      if (statusFilter === 'ELIGIBLE') {
        matchStatus = isStaffEligible(s);
      } else if (statusFilter === 'CHECKED') {
        matchStatus = !isStaffEligible(s);
      }

      return matchSearch && matchDept && matchStatus;
    });
  }, [staffList, searchTerm, departmentFilter, statusFilter, isStaffEligible]);

  // Eligible staff among current filtered list
  const eligibleFilteredStaff = useMemo(() => {
    return filteredStaffList.filter(isStaffEligible);
  }, [filteredStaffList, isStaffEligible]);

  // Toggle selection for a single staff ID
  const toggleSelectStaff = (id) => {
    setSelectedStaffIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
    setBatchResults(null);
    setError('');
  };

  // Select all visible matching filter
  const handleSelectAllVisible = () => {
    const visibleIds = filteredStaffList.map((s) => s.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedStaffIds.includes(id));
    if (allSelected) {
      // Deselect visible
      setSelectedStaffIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      // Add all visible
      setSelectedStaffIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
    setBatchResults(null);
    setError('');
  };

  // Select only eligible visible staff
  const handleSelectEligibleVisible = () => {
    const eligibleIds = eligibleFilteredStaff.map((s) => s.id);
    if (eligibleIds.length === 0) {
      showToast(
        actionType === 'CHECK_IN'
          ? 'Tất cả nhân viên hiển thị đều đã check-in vào ca rồi!'
          : 'Không có nhân viên nào đủ điều kiện tan ca trong danh sách hiển thị!',
        'info'
      );
      return;
    }
    setSelectedStaffIds((prev) => Array.from(new Set([...prev, ...eligibleIds])));
    setBatchResults(null);
    setError('');
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedStaffIds([]);
    setBatchResults(null);
    setError('');
  };

  // Selected staff objects list
  const selectedStaffList = useMemo(() => {
    return staffList.filter((s) => selectedStaffIds.includes(s.id));
  }, [staffList, selectedStaffIds]);

  // Handle Manual Attendance Submission (Batch or Single)
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (selectedStaffIds.length === 0) {
      setError('Vui lòng tích chọn ít nhất 1 nhân viên để điểm danh');
      showToast('Vui lòng tích chọn nhân viên', 'error');
      return;
    }

    const noteText = reason === 'Lý do khác' ? customReason.trim() : reason;
    setError('');
    setBatchResults(null);
    setSubmitting(true);
    setProgress({ current: 0, total: selectedStaffIds.length });

    const results = [];
    const chunkSize = 5; // process 5 requests concurrently for fast & reliable execution

    try {
      for (let i = 0; i < selectedStaffIds.length; i += chunkSize) {
        const chunk = selectedStaffIds.slice(i, i + chunkSize);
        const chunkPromises = chunk.map(async (id) => {
          const staffObj = staffList.find((s) => s.id === id);
          const staffName = staffObj?.fullName || `Nhân viên #${id}`;
          try {
            const data = await attendanceService.faceCheckIn(
              parseInt(id),
              'MANUAL_CHECKIN',
              parseInt(orgId),
              actionType
            );
            return {
              staffId: id,
              staffName,
              staffCode: staffObj?.staffCode,
              department: staffObj?.department,
              success: true,
              data
            };
          } catch (err) {
            const msg =
              err.response?.data?.message ||
              err.response?.data?.detail ||
              err.response?.data?.error ||
              'Lỗi khi chấm công';
            return {
              staffId: id,
              staffName,
              staffCode: staffObj?.staffCode,
              department: staffObj?.department,
              success: false,
              error: msg
            };
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
        setProgress({
          current: Math.min(i + chunkSize, selectedStaffIds.length),
          total: selectedStaffIds.length
        });
      }

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;
      const isCheckOut = actionType === 'CHECK_OUT';
      const actionText = isCheckOut ? 'Tan ca (Check-out)' : 'Vào ca (Check-in)';

      setBatchResults({
        total: selectedStaffIds.length,
        successCount,
        failedCount,
        actionType,
        note: noteText,
        details: results
      });

      if (successCount > 0) {
        playSuccessBeep();
        if (selectedStaffIds.length === 1) {
          const s = results[0];
          speakGreeting(isCheckOut ? `Tạm biệt ${s.staffName}` : `Xin chào ${s.staffName}`);
        } else {
          speakGreeting(`Đã hoàn tất điểm danh hàng loạt cho ${successCount} nhân viên`);
        }
      }

      if (failedCount === 0) {
        showToast(
          `Đã chấm công thủ công (${actionText}) thành công cho toàn bộ ${successCount} nhân viên!`,
          'success'
        );
        setSelectedStaffIds([]); // clear selection on full success
      } else if (successCount > 0) {
        showToast(
          `Điểm danh thành công ${successCount}/${selectedStaffIds.length} nhân viên (${failedCount} người bị bỏ qua)`,
          'warning'
        );
        // keep only the failed ones selected so user can inspect or retry
        const failedIds = results.filter((r) => !r.success).map((r) => r.staffId);
        setSelectedStaffIds(failedIds);
      } else {
        showToast(`Không thể điểm danh cho bất kỳ nhân viên nào trong danh sách đã chọn`, 'error');
      }

      // Refresh today's records
      const todayStr = formatLocalDate(new Date());
      attendanceService.getAttendanceHistory(orgId, null, todayStr, todayStr)
        .then(setTodayRecords)
        .catch(console.error);

    } catch (err) {
      console.error(err);
      setError('Đã xảy ra sự cố trong quá trình xử lý hàng loạt');
      showToast('Có lỗi xảy ra khi xử lý điểm danh hàng loạt', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isCheckInTab = actionType === 'CHECK_IN';
  const isAllVisibleSelected =
    filteredStaffList.length > 0 &&
    filteredStaffList.every((s) => selectedStaffIds.includes(s.id));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header with Live Clock & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Chấm công thủ công
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  isCheckInTab
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isCheckInTab ? 'Chế độ Vào Ca' : 'Chế độ Tan Ca'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                  <CheckSquare className="w-3 h-3" />
                  Hỗ trợ tích chọn hàng loạt
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tích chọn 1 hoặc nhiều nhân viên trong danh sách để điểm danh hàng loạt nhanh chóng
              </p>
            </div>
          </div>
        </div>

        {/* Right Action & Clock */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/org/auto-attendance')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Scan className="w-4 h-4 text-indigo-600" />
            <span>Đến Trạm Kiosk AI</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Digital Clock */}
          <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-xs shrink-0">
            <Clock className="w-5 h-5 text-indigo-600" />
            <div className="font-mono text-right">
              <div className="text-sm font-bold text-slate-900">
                {currentTime.toLocaleTimeString('vi-VN', { hour12: false })}
              </div>
              <div className="text-[10px] text-slate-500">
                {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        {/* 2 MAIN TABS: VÀO CA vs TAN CA */}
        <div className="grid grid-cols-2 p-2 bg-slate-50 border-b border-slate-200 gap-2">
          {/* Tab 1: VÀO CA (Check-in) */}
          <button
            type="button"
            onClick={() => handleTabChange('CHECK_IN')}
            className={`py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm transition-all cursor-pointer ${
              isCheckInTab
                ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LogIn className={`w-5 h-5 ${isCheckInTab ? 'text-white' : 'text-emerald-600'}`} />
            <span>VÀO CA (Check-in)</span>
            {isCheckInTab && (
              <span className="text-[10px] px-2 py-0.5 bg-emerald-700 text-white rounded-full uppercase tracking-wider font-semibold">
                Đang chọn
              </span>
            )}
          </button>

          {/* Tab 2: TAN CA (Check-out) */}
          <button
            type="button"
            onClick={() => handleTabChange('CHECK_OUT')}
            className={`py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm transition-all cursor-pointer ${
              !isCheckInTab
                ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LogOut className={`w-5 h-5 ${!isCheckInTab ? 'text-white' : 'text-amber-600'}`} />
            <span>TAN CA (Check-out)</span>
            {!isCheckInTab && (
              <span className="text-[10px] px-2 py-0.5 bg-amber-700 text-white rounded-full uppercase tracking-wider font-semibold">
                Đang chọn
              </span>
            )}
          </button>
        </div>

        {/* Guidance Banner */}
        <div className={`flex items-center gap-3 px-6 py-3 border-b border-slate-200 transition-colors ${
          isCheckInTab ? 'bg-emerald-50/70' : 'bg-amber-50/70'
        }`}>
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
            isCheckInTab ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
          }`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-700 flex-1">
            {isCheckInTab ? (
              <>
                Chế độ <strong className="text-emerald-700">VÀO CA (Check-in)</strong>: Tích chọn các nhân viên đến làm việc hôm nay để điểm danh vào ca hàng loạt cùng một lúc.
              </>
            ) : (
              <>
                Chế độ <strong className="text-amber-700">TAN CA (Check-out)</strong>: Tích chọn các nhân viên chuẩn bị ra về để ghi nhận kết thúc ca làm việc hàng loạt.
              </>
            )}
          </p>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Đã chọn:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
              selectedStaffIds.length > 0
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}>
              {selectedStaffIds.length}
            </span>
          </div>
        </div>

        {/* Main 2-column layout */}
        <div className="p-6 sm:p-8 grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Action / Batch Configuration */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <UserCheck className={`w-4 h-4 ${isCheckInTab ? 'text-emerald-600' : 'text-amber-600'}`} />
                  Xác nhận điểm danh
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {currentTime.toLocaleDateString('vi-VN')}
                </span>
              </div>

              {/* Status Box: Selected Staff Summary */}
              {selectedStaffIds.length === 0 ? (
                <div className="p-5 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">Chưa chọn nhân viên nào</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                    Hãy tích chọn các ô vuông bên cạnh tên nhân viên ở bảng bên phải để điểm danh hàng loạt.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSelectEligibleVisible}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      {isCheckInTab ? 'Chọn tất cả ai chưa vào ca' : 'Chọn tất cả ai chưa tan ca'}
                    </button>
                  </div>
                </div>
              ) : selectedStaffIds.length === 1 ? (
                /* Single selected staff preview */
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Nhân viên đã chọn (1)
                    </span>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                  {(() => {
                    const s = selectedStaffList[0];
                    if (!s) return null;
                    const rec = recordMap.get(s.id);
                    return (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                          {(() => {
                            const name = (s.fullName || '').trim();
                            if (!name) return '??';
                            const parts = name.split(' ').filter(Boolean);
                            return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{s.fullName}</h4>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {s.staffCode ? `Mã: ${s.staffCode}` : `#${s.id}`} • {s.department || 'Chưa xếp'}
                          </div>
                          {rec ? (
                            <div className="mt-1 text-[11px] text-emerald-700 font-mono flex items-center gap-2">
                              <span>Vào: {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                              <span>Ra: {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                            </div>
                          ) : (
                            <div className="mt-1 text-[10px] text-slate-400">Chưa có lượt chấm công hôm nay</div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Multi selected staff batch preview */
                <div className="p-4 bg-white border border-indigo-100 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      Danh sách đã tích chọn ({selectedStaffIds.length} nhân viên)
                    </span>
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 custom-scrollbar">
                    {selectedStaffList.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-800 text-xs font-medium"
                      >
                        <span className="truncate max-w-[120px]">{s.fullName}</span>
                        <button
                          type="button"
                          onClick={() => toggleSelectStaff(s.id)}
                          className="text-indigo-400 hover:text-indigo-700 cursor-pointer"
                          title="Bỏ nhân viên này"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason / Note Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Lý do chấm công thủ công
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer shadow-xs"
                >
                  {COMMON_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                {reason === 'Lý do khác' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Nhập lý do cụ thể..."
                    className="mt-2 w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
                  />
                )}
              </div>

              {/* Progress Bar (during batch submit) */}
              {submitting && progress.total > 0 && (
                <div className="space-y-1.5 p-3 bg-white border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                    <span>Đang xử lý điểm danh...</span>
                    <span className="font-mono text-indigo-600">
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCheckInTab ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{
                        width: `${Math.round((progress.current / progress.total) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Confirm Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || selectedStaffIds.length === 0}
                className={`w-full py-4 rounded-2xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 text-white flex items-center justify-center gap-2 cursor-pointer ${
                  isCheckInTab
                    ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-600/20'
                    : 'bg-amber-600 hover:bg-amber-700 hover:shadow-amber-600/20'
                }`}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Đang xử lý điểm danh ({progress.current}/{progress.total})...</span>
                  </>
                ) : (
                  <>
                    {isCheckInTab ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                    <span>
                      {selectedStaffIds.length > 1
                        ? `XÁC NHẬN ${isCheckInTab ? 'VÀO CA' : 'TAN CA'} HÀNG LOẠT (${selectedStaffIds.length} NHÂN VIÊN)`
                        : selectedStaffIds.length === 1
                        ? `XÁC NHẬN ${isCheckInTab ? 'VÀO CA' : 'TAN CA'} (1 NHÂN VIÊN)`
                        : `VUI LÒNG CHỌN NHÂN VIÊN`}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 animate-in fade-in shadow-xs">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-800">Thông báo từ hệ thống</h4>
                  <p className="text-xs text-rose-700 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Batch Result Report Box */}
            {batchResults && (
              <div className="p-5 rounded-3xl border bg-white border-slate-200 space-y-4 shadow-xs animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Kết quả điểm danh ({batchResults.total} nhân viên)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    {showDetails ? 'Thu gọn chi tiết' : 'Xem chi tiết từng người'}
                    {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Score Stats */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <div className="text-xs text-emerald-700 font-semibold">Thành công</div>
                    <div className="text-xl font-bold text-emerald-800 mt-0.5">
                      {batchResults.successCount}
                    </div>
                  </div>
                  <div className={`p-3 rounded-2xl border ${
                    batchResults.failedCount > 0
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    <div className="text-xs font-semibold">Bỏ qua / Đã chấm</div>
                    <div className="text-xl font-bold mt-0.5">
                      {batchResults.failedCount}
                    </div>
                  </div>
                </div>

                {/* Expandable details list */}
                {showDetails && (
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 custom-scrollbar text-xs">
                    {batchResults.details.map((r) => (
                      <div key={r.staffId} className="py-2 px-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{r.staffName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {r.staffCode ? `Mã: ${r.staffCode}` : `#${r.staffId}`}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          {r.success ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Thành công
                            </span>
                          ) : (
                            <span
                              title={r.error}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold truncate max-w-[160px]"
                            >
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span className="truncate">{r.error}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Multi-select Staff List */}
          <div className="lg:col-span-7 space-y-4">
            {/* List Header & Quick Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Danh sách nhân viên ({staffList.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Tích chọn các ô vuông để chọn nhiều nhân viên cùng lúc
                </p>
              </div>

              {/* Fast Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSelectEligibleVisible}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-all cursor-pointer flex items-center gap-1"
                  title={isCheckInTab ? 'Chỉ chọn những nhân viên chưa vào ca' : 'Chỉ chọn những nhân viên chưa tan ca'}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{isCheckInTab ? 'Chọn ai chưa vào ca' : 'Chọn ai chưa tan ca'}</span>
                </button>

                <button
                  type="button"
                  onClick={loadData}
                  disabled={loading}
                  title="Tải lại danh sách"
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="relative sm:col-span-5">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc mã..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="sm:col-span-4">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
                >
                  <option value="ALL">Tất cả phòng ban</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ELIGIBLE">
                    {isCheckInTab ? 'Chưa vào ca' : 'Chưa tan ca'}
                  </option>
                  <option value="CHECKED">
                    {isCheckInTab ? 'Đã vào ca' : 'Đã tan ca'}
                  </option>
                </select>
              </div>
            </div>

            {/* Master Select All Header Bar */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-slate-100/80 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllVisibleSelected}
                  onChange={handleSelectAllVisible}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span>
                  Chọn tất cả hiển thị ({filteredStaffList.length})
                </span>
              </label>

              <div className="flex items-center gap-3">
                {selectedStaffIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Bỏ chọn ({selectedStaffIds.length})
                  </button>
                )}
                <span className="text-[11px] text-slate-400 font-mono">
                  {selectedStaffIds.length}/{staffList.length} đã chọn
                </span>
              </div>
            </div>

            {/* Staff Cards Multi-Select List */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-2xl max-h-[500px] overflow-y-auto divide-y divide-slate-200/80 p-1.5 custom-scrollbar">
              {loading && staffList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                  Đang tải danh sách nhân sự...
                </div>
              ) : filteredStaffList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Không tìm thấy nhân viên phù hợp với bộ lọc
                </div>
              ) : (
                filteredStaffList.map((s) => {
                  const isChecked = selectedStaffIds.includes(s.id);
                  const rec = recordMap.get(s.id);
                  const hasIn = !!rec?.checkInTime;
                  const hasOut = !!rec?.checkOutTime;
                  const eligible = isStaffEligible(s);

                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleSelectStaff(s.id)}
                      className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all select-none ${
                        isChecked
                          ? 'bg-indigo-50/90 border border-indigo-200 shadow-xs'
                          : 'hover:bg-white hover:shadow-xs border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Custom Checkbox */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectStaff(s.id);
                          }}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-colors border ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-slate-300 text-transparent hover:border-indigo-400'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>

                        {/* Staff Initials Avatar */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isChecked
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-700'
                        }`}>
                          {(() => {
                            const name = (s.fullName || '').trim();
                            if (!name) return '??';
                            const parts = name.split(' ').filter(Boolean);
                            return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
                          })()}
                        </div>

                        {/* Staff Name & Info */}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                            {s.fullName}
                            {eligible && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Sẵn sàng điểm danh" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono truncate">
                            {s.staffCode ? `Mã: ${s.staffCode}` : `#${s.id}`} • {s.department || 'Chưa xếp'}
                          </div>
                        </div>
                      </div>

                      {/* Right Status Badge */}
                      <div className="text-right shrink-0">
                        {hasIn && hasOut ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Đủ 2 lượt
                          </span>
                        ) : hasIn ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                            Đã vào ca
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            Chưa vào
                          </span>
                        )}

                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {hasIn ? new Date(rec.checkInTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          {hasOut ? ` - ${new Date(rec.checkOutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Sticky Bar when staff are selected */}
      {selectedStaffIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-[fadeIn_0.2s_ease_both] border border-slate-700">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold font-mono">
              {selectedStaffIds.length}
            </span>
            <span>nhân viên đã được chọn</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all ${
              isCheckInTab
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            {submitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isCheckInTab ? (
              <LogIn className="w-3.5 h-3.5" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>
              {isCheckInTab ? 'Vào ca ngay' : 'Tan ca ngay'} ({selectedStaffIds.length})
            </span>
          </button>

          <button
            type="button"
            onClick={handleClearSelection}
            className="text-xs text-slate-400 hover:text-white cursor-pointer px-1"
          >
            Hủy
          </button>
        </div>
      )}

      {/* Today's Manual Attendance Feed / Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Nhật ký chấm công hôm nay ({todayRecords.length} lượt)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Danh sách ghi nhận thời gian thực hôm nay ({formatLocalDate(new Date())})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/org/attendance')}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 hover:text-indigo-600 hover:border-indigo-200 font-semibold transition-all cursor-pointer shadow-xs"
            >
              Xem toàn bộ lịch sử
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Nhân viên</th>
                <th className="py-3 px-4">Phòng ban</th>
                <th className="py-3 px-4">Giờ vào (Check-in)</th>
                <th className="py-3 px-4">Giờ ra (Check-out)</th>
                <th className="py-3 px-4">Phương thức</th>
                <th className="py-3 px-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {todayRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Hôm nay chưa có dữ liệu chấm công nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                todayRecords.map((r) => {
                  const isManual = r.checkInMethod === 'MANUAL';
                  return (
                    <tr key={r.id || `${r.staffId}_${r.workDate}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.staffName || `Nhân viên #${r.staffId}`}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{r.staffCode || `#${r.staffId}`}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {r.department || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('vi-VN') : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('vi-VN') : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {isManual ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold text-[11px]">
                            <Keyboard className="w-3 h-3" />
                            Thủ công
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                            <Scan className="w-3 h-3" />
                            Khuôn mặt AI
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {r.status === 'ON_TIME' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">Đúng giờ</span>
                        )}
                        {r.status === 'LATE' && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold text-[10px]">Đi muộn</span>
                        )}
                        {r.status === 'EARLY_LEAVE' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold text-[10px]">Về sớm</span>
                        )}
                        {r.status === 'LATE_AND_EARLY_LEAVE' && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold text-[10px]">Muộn & Về sớm</span>
                        )}
                        {(!r.status || r.status === 'ABSENT') && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">Chưa hoàn tất</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
