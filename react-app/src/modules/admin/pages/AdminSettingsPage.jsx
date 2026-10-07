import React, { useState } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import { Save, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { adminService } from '../services/adminService';

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('notif');
  const [notifs, setNotifs] = useState({
    maintenance: true,
    weeklyReport: false,
    newRegister: true
  });

  const [pwForm, setPwForm] = useState({ old: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);

  const handleToggleNotif = (key, label) => {
    const nextVal = !notifs[key];
    setNotifs((n) => ({ ...n, [key]: nextVal }));
    showToast(`${nextVal ? 'Đã bật' : 'Đã tắt'} thông báo: ${label}`, 'info');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwForm.old || !pwForm.newPw || !pwForm.confirm) {
      showToast('Vui lòng nhập đầy đủ thông tin', 'error');
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      showToast('Mật khẩu mới và mật khẩu xác nhận không khớp', 'error');
      return;
    }
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      if (!adminInfo.id) {
        showToast('Không tìm thấy thông tin admin, vui lòng đăng nhập lại', 'error');
        return;
      }
      await adminService.changePassword(adminInfo.id, {
        currentPassword: pwForm.old,
        newPassword: pwForm.newPw
      });
      showToast('Đã thay đổi mật khẩu quản trị thành công', 'success');
      setPwForm({ old: '', newPw: '', confirm: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Lỗi khi đổi mật khẩu', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Cài đặt hệ thống (Admin)</h2>
        <p className="text-xs text-slate-500 mt-1">Cấu hình các tùy chọn quản trị và tài khoản Super Admin</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-slate-100 border border-slate-200/80 rounded-xl p-1 w-max max-w-full">
        {[
          { id: 'notif', label: 'Thông báo' },
          { id: 'security', label: 'Bảo mật' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === item.id ? 'bg-white text-slate-800 shadow-xs border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Notifications Tab */}
      {tab === 'notif' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800">Cài đặt thông báo hệ thống</h3>
          <div className="divide-y divide-slate-100">
            {[
              { key: 'newRegister', label: 'Thông báo đăng ký mới', desc: 'Nhận cảnh báo khi có tổ chức/doanh nghiệp mới đăng ký tài khoản trên hệ thống' },
              { key: 'maintenance', label: 'Cập nhật bảo trì định kỳ', desc: 'Nhận thông báo tự động từ dịch vụ hạ tầng đám mây về tình trạng hệ thống' },
              { key: 'weeklyReport', label: 'Báo cáo hiệu suất hệ thống', desc: 'Gửi báo cáo tổng hợp dung lượng và số lượt check-in toàn hệ thống hàng tuần' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="pr-4">
                  <div className="text-sm font-semibold text-slate-800">{item.label}</div>
                  <div className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</div>
                </div>
                <button
                  onClick={() => handleToggleNotif(item.key, item.label)}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center flex-shrink-0 cursor-pointer ${
                    notifs[item.key] ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform mx-0.5 ${
                      notifs[item.key] ? 'translate-x-4.5' : ''
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Password Tab */}
      {tab === 'security' && (
        <form onSubmit={handlePasswordChange} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800">Đổi mật khẩu Super Admin</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Mật khẩu hiện tại</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={pwForm.old}
                  onChange={(e) => setPwForm((f) => ({ ...f, old: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 pr-10 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-xs transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Mật khẩu mới</label>
              <input
                type="password"
                required
                value={pwForm.newPw}
                onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-xs transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                required
                value={pwForm.confirm}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-xs transition-colors"
              />
            </div>
          </div>
          {pwForm.newPw && pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
            <p className="text-xs text-rose-600 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-4 h-4" />
              Mật khẩu mới và mật khẩu xác nhận không khớp
            </p>
          )}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Cập nhật mật khẩu
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
