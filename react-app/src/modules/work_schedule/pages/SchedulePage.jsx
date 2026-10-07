import React, { useEffect, useState } from 'react';
import { scheduleService } from '../services/scheduleService';
import { useToast } from '../../../contexts/ToastContext';
import { Plus, Clock, CalendarDays, Edit2, Check, X } from 'lucide-react';

const DEFAULT_FORM = {
  name: '',
  startTime: '08:00',
  endTime: '17:00',
  lateGraceMinutes: '15',
  standardDaysPerMonth: '26',
  isDefault: false,
};

export default function SchedulePage() {
  const { showToast } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const orgId = localStorage.getItem('orgId');

  const loadSchedules = React.useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const data = await scheduleService.getSchedules(orgId);
      setSchedules(data);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải danh sách ca làm việc', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, showToast]);

  useEffect(() => { 
    loadSchedules(); 
  }, [loadSchedules]);

  const openAdd = () => {
    setIsEditing(false);
    setSelectedId(null);
    setForm(DEFAULT_FORM);
    setShowModal(true);
  };

  const openEdit = (s) => {
    setIsEditing(true);
    setSelectedId(s.id);
    setForm({
      name: s.name,
      startTime: s.startTime.substring(0, 5),
      endTime: s.endTime.substring(0, 5),
      lateGraceMinutes: String(s.lateGraceMinutes),
      standardDaysPerMonth: String(s.standardDaysPerMonth),
      isDefault: s.isDefault,
    });
    setShowModal(true);
  };

  const handleChange = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast('Tên ca không được để trống', 'error'); return; }
    const payload = {
      name: form.name.trim(),
      startTime: form.startTime + ':00',
      endTime: form.endTime + ':00',
      lateGraceMinutes: parseInt(form.lateGraceMinutes),
      standardDaysPerMonth: parseInt(form.standardDaysPerMonth),
      isDefault: form.isDefault,
    };
    try {
      setSaving(true);
      if (isEditing) {
        await scheduleService.updateSchedule(orgId, selectedId, payload);
        showToast('Đã cập nhật ca làm việc', 'success');
      } else {
        await scheduleService.createSchedule(orgId, payload);
        showToast('Đã thêm ca làm việc mới', 'success');
      }
      setShowModal(false);
      loadSchedules();
    } catch (err) {
      showToast(err.response?.data?.message || 'Lưu thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Ca làm việc</h2>
          <p className="text-xs text-slate-500 mt-1">
            Cấu hình giờ vào – ra, thời gian đi muộn và số ngày công chuẩn
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer w-max"
        >
          <Plus className="w-4 h-4" />
          Thêm ca mới
        </button>
      </div>

      {/* Schedule Cards */}
      {loading ? (
        <div className="p-8 text-center text-sm text-slate-500">Đang tải ca làm việc...</div>
      ) : schedules.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Chưa có ca làm việc nào được thiết lập.</p>
          <button
            onClick={openAdd}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm ca đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {schedules.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col gap-4"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center flex-shrink-0 text-indigo-600">
                    <Clock className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{s.name}</h3>
                    {s.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-0.5">
                        <Check className="w-3 h-3" /> Mặc định
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => openEdit(s)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors flex-shrink-0 cursor-pointer shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Info rows */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {[
                  { label: 'Giờ làm việc', value: `${s.startTime.substring(0,5)} → ${s.endTime.substring(0,5)}`, bold: true },
                  { label: 'Đi muộn tối đa', value: `${s.lateGraceMinutes} phút` },
                  { label: 'Ngày công chuẩn', value: `${s.standardDaysPerMonth} ngày / tháng` },
                ].map(({ label, value, bold }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{label}</span>
                    <span className={bold ? 'text-slate-900 font-bold font-mono' : 'text-slate-700 font-mono'}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl animate-[fadeInScale_0.2s_ease_both]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-900">
                {isEditing ? 'Cập nhật ca làm việc' : 'Thêm ca làm việc mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Tên ca</label>
                <input
                  value={form.name}
                  onChange={handleChange('name')}
                  placeholder="Ví dụ: Ca Hành Chính"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors shadow-xs"
                />
              </div>

              {/* Start / End time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={handleChange('startTime')}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors shadow-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={handleChange('endTime')}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors shadow-xs"
                  />
                </div>
              </div>

              {/* Grace / Standard days */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Đi muộn (phút)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.lateGraceMinutes}
                    onChange={handleChange('lateGraceMinutes')}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors shadow-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1.5 uppercase tracking-wider">Ngày công chuẩn</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.standardDaysPerMonth}
                    onChange={handleChange('standardDaysPerMonth')}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors shadow-xs"
                  />
                </div>
              </div>

              {/* isDefault toggle */}
              <label className="flex items-center gap-3 cursor-pointer group pt-1">
                <div
                  onClick={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center flex-shrink-0 ${form.isDefault ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform mx-1 ${form.isDefault ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors">Đặt làm ca mặc định của tổ chức</span>
              </label>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Thêm ca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
