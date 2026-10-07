import React, { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { staffService } from '../../staff/services/staffService';
import { salaryService } from '../services/salaryService';
import { Download, Play, ChevronLeft, ChevronRight, Search, Loader2, Eye } from 'lucide-react';
import Pagination from '../../../components/Pagination';
import SalaryDetailModal from '../components/SalaryDetailModal';

function fmt(n) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)) + ' đ';
}

export default function OrgSalaryPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [rows, setRows] = useState([]);
  const orgId = localStorage.getItem('orgId');

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [year, setYear] = useState(now.getFullYear());
  const [searchTerm, setSearchTerm] = useState('');

  // Salary Detail Modal state
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadSalaries = React.useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const [staffList, salaryRecords] = await Promise.all([
        staffService.getStaffList(orgId),
        salaryService.getSalariesByMonthYear(orgId, month, year)
      ]);

      const salaryMap = new Map();
      (salaryRecords || []).forEach(record => {
        if (record.staffId) {
          salaryMap.set(record.staffId, record);
        }
      });

      const combined = (staffList || []).map((s) => {
        const record = salaryMap.get(s.id) || null;
        return {
          staffId: s.id,
          staffCode: s.staffCode,
          fullName: s.fullName,
          base: s.baseSalary || 0,
          record: record
        };
      });

      setRows(combined);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải bảng lương', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, month, year, showToast]);

  useEffect(() => { 
    loadSalaries(); 
  }, [loadSalaries]);

  const goPrev = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const goNext = () => {
    const nm = month === 12 ? 1 : month + 1;
    const ny = month === 12 ? year + 1 : year;
    if (ny > now.getFullYear() || (ny === now.getFullYear() && nm > now.getMonth() + 1)) return;
    setMonth(nm); setYear(ny);
  };

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  const handleCalculate = async (staffId, name) => {
    try {
      showToast(`Đang tính lương cho ${name}...`, 'info');
      await salaryService.calculateSalary(orgId, staffId, month, year);
      showToast(`Tính lương thành công cho ${name}`, 'success');
      loadSalaries();
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tính lương. Hãy đảm bảo nhân viên đã chấm công.', 'error');
    }
  };

  const handleCalculateAll = async () => {
    const uncalculated = rows.filter(r => !r.record);
    if (uncalculated.length === 0) {
      showToast('Tất cả nhân viên đã được tính lương tháng này', 'info');
      return;
    }
    try {
      showToast(`Đang tính lương cho ${uncalculated.length} nhân viên...`, 'info');
      await salaryService.calculateAllSalaries(orgId, month, year);
      showToast('Đã tính xong bảng lương thành công!', 'success');
      loadSalaries();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Không thể tính lương hàng loạt', 'error');
    }
  };

  const handleExport = async () => {
    if (!orgId) return;
    try {
      setExporting(true);
      await salaryService.exportSalaryExcel(orgId, month, year);
      showToast(`Đã xuất bảng lương tháng ${month}/${year} thành công!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Không thể xuất file Excel bảng lương', 'error');
    } finally {
      setExporting(false);
    }
  };

  const filteredRows = rows.filter(r => 
    r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.staffCode.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalCalculated = filteredRows.reduce((acc, curr) => acc + (curr.record?.totalSalary || 0), 0);
  const calculatedCount = filteredRows.filter((r) => r.record !== null).length;

  return (
    <div className="space-y-6">
      {/* Formula Note Banner */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-slate-700 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">💡</span>
          <div>
            <span className="font-semibold text-indigo-800">Quy tắc tính lương: </span>
            <span>Ngày làm việc đầy đủ tính đủ 1 ngày công (<code className="text-slate-800 font-mono bg-white px-1 py-0.5 rounded border border-slate-200">LCB / 26</code>). Ngày về sớm được tính theo giờ: </span>
            <span className="font-mono text-emerald-700 font-semibold">LCB / 26 / (Số giờ ca) × Số giờ làm thực tế</span>.
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Bảng lương</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {calculatedCount}/{filteredRows.length} nhân viên đã tính · Tổng chi: {fmt(totalCalculated)}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm nhân viên..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 w-48 transition-colors shadow-xs"
            />
          </div>

          {/* Month/Year Navigator */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-1.5 py-1 shadow-xs">
            <button
              onClick={() => {
                goPrev();
                setCurrentPage(1);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 font-mono px-3 min-w-[90px] text-center">
              Tháng {month}/{year}
            </span>
            <button
              onClick={() => {
                goNext();
                setCurrentPage(1);
              }}
              disabled={isCurrentMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleCalculateAll}
            className="flex items-center gap-2 px-4 py-2 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100/70 text-indigo-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Tính tất cả
          </button>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Download className="w-4 h-4" />}
            {exporting ? 'Đang xuất...' : 'Xuất bảng lương'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500 font-medium">Đang tải dữ liệu tiền lương...</div>
          ) : (
            <table className="w-full text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75">
                  {['Nhân viên', 'Lương cơ bản', 'Ngày chuẩn', 'Ngày thực', 'Thưởng', 'Khấu trừ', 'Thực lĩnh', 'Thao tác'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRows.map((r) => (
                  <tr key={r.staffId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-slate-800">{r.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.staffCode}</div>
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-800">{fmt(r.base)}</td>
                    <td className="px-5 py-4 text-xs font-mono text-slate-500 text-center">
                      {r.record ? r.record.standardDays : '—'}
                    </td>
                    <td className="px-5 py-4 font-mono">
                      {r.record ? (
                        <span className={`text-xs font-bold ${r.record.workingDays < r.record.standardDays ? 'text-amber-600' : 'text-slate-800'}`}>
                          {r.record.workingDays}
                        </span>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-emerald-600">
                      {r.record && r.record.bonus > 0 ? `+${fmt(r.record.bonus)}` : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-rose-600">
                      {r.record && r.record.deduction > 0 ? `-${fmt(r.record.deduction)}` : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {r.record ? (
                        <span className="text-sm font-bold text-indigo-700 font-mono">{fmt(r.record.totalSalary)}</span>
                      ) : (
                        <span className="text-slate-400 text-xs italic font-medium">Chưa tính toán</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedStaff(r);
                            setDetailModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                          title="Xem chi tiết bảng lương từng ngày"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Chi tiết</span>
                        </button>
                        <button
                          onClick={() => handleCalculate(r.staffId, r.fullName)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          {r.record ? 'Tính lại' : 'Tính lương'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-sm text-slate-500 font-medium">Không tìm thấy nhân viên nào phù hợp.</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan={6} className="px-5 py-4 text-xs font-bold text-slate-500 text-right uppercase tracking-wider">
                    Tổng chi thực tế (đã tính)
                  </td>
                  <td colSpan={2} className="px-5 py-4">
                    <span className="text-base font-extrabold text-indigo-700 font-mono">{fmt(totalCalculated)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredRows.length > 0 && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredRows.length}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => setPageSize(s)}
          />
        )}
      </div>

      {/* Salary Detail Modal */}
      {selectedStaff && (
        <SalaryDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedStaff(null);
          }}
          staffData={selectedStaff}
          month={month}
          year={year}
          orgId={orgId}
        />
      )}
    </div>
  );
}
