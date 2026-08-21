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
        <h2 className="text-lg font-bold text-zinc-100">Cài đặt hệ thống (Admin)</h2>
        <p className="text-xs text-zinc-500 mt-1">Cấu hình các tùy chọn quản trị và tài khoản Super Admin</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-1 w-max max-w-full">
        {[
          { id: 'notif', label: 'Thông báo' },
          { id: 'security', label: 'Bảo mật' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === item.id ? 'bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700/30' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Notifications Tab */}
      {tab === 'notif' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-md">
          <h3 className="text-sm font-semibold text-zinc-100">Cài đặt thông báo hệ thống</h3>
          <div className="divide-y divide-zinc-800/60">
            {[
              { key: 'newRegister', label: 'Thông báo đăng ký mới', desc: 'Nhận cảnh báo khi có tổ chức/doanh nghiệp mới đăng ký tài khoản trên hệ thống' },
              { key: 'maintenance', label: 'Cập nhật bảo trì định kỳ', desc: 'Nhận thông báo tự động từ dịch vụ hạ tầng đám mây về tình trạng hệ thống' },
              { key: 'weeklyReport', label: 'Báo cáo hiệu suất hệ thống', desc: 'Gửi báo cáo tổng hợp dung lượng và số lượt check-in toàn hệ thống hàng tuần' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="pr-4">
                  <div className="text-sm font-semibold text-zinc-200">{item.label}</div>
                  <div className="text-xs text-zinc-500 mt-1 leading-relaxed">{item.desc}</div>
                </div>
                <button
                  onClick={() => handleToggleNotif(item.key, item.label)}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center flex-shrink-0 cursor-pointer ${
                    notifs[item.key] ? 'bg-violet-600' : 'bg-zinc-850 border border-zinc-800'
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transition-transform mx-0.5 ${
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
        <form onSubmit={handlePasswordChange} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-md">
          <h3 className="text-sm font-semibold text-zinc-100">Đổi mật khẩu Super Admin</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Mật khẩu hiện tại</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={pwForm.old}
                  onChange={(e) => setPwForm((f) => ({ ...f, old: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 pr-10 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Mật khẩu mới</label>
              <input
                type="password"
                required
                value={pwForm.newPw}
                onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                required
                value={pwForm.confirm}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>
          {pwForm.newPw && pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-4 h-4" />
              Mật khẩu mới và mật khẩu xác nhận không khớp
            </p>
          )}
          <div className="pt-4 border-t border-zinc-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-600/15"
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
