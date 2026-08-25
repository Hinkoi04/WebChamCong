import React, { useState, useEffect } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../services/api';
import { Mail, Phone, MapPin, Hash, Save, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function OrgSettingsPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState('org');
  const orgId = localStorage.getItem('orgId');

  const [orgForm, setOrgForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    tax: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!orgId) return;
      try {
        const res = await api.get(`/api/users/${orgId}`);
        const data = res.data;
        setOrgForm({
          name: data.orgName || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          tax: data.taxCode || ''
        });
      } catch (err) {
        console.error(err);
        showToast('Không thể tải thông tin tổ chức', 'error');
      }
    };
    loadProfile();
  }, [orgId, showToast]);

  const [notifs, setNotifs] = useState({
    lateClock: true,
    absent: true,
    maintenance: false,
    weeklyReport: true
  });

  const [pwForm, setPwForm] = useState({ old: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleOrgChange = (k) => (e) => setOrgForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSaveOrg = async (e) => {
    e.preventDefault();
    if (!orgForm.name.trim() || !orgForm.email.trim()) {
      showToast('Tên tổ chức và email không được để trống', 'error');
      return;
    }
    try {
      const res = await api.put(`/api/users/${orgId}`, {
        orgName: orgForm.name.trim(),
        email: orgForm.email.trim(),
        phone: orgForm.phone ? orgForm.phone.trim() : null,
        address: orgForm.address ? orgForm.address.trim() : null,
        taxCode: orgForm.tax ? orgForm.tax.trim() : null
      });
      // Sync localStorage orgInfo so sidebar updates immediately
      const orgInfo = JSON.parse(localStorage.getItem('orgInfo') || '{}');
      orgInfo.orgName = res.data.orgName;
      orgInfo.email = res.data.email;
      localStorage.setItem('orgInfo', JSON.stringify(orgInfo));

      showToast('Đã lưu thông tin tổ chức thành công', 'success');
      
      // Dispatch storage event to trigger reactive rendering across components if applicable,
      // and refresh layout header/footer.
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể lưu thông tin tổ chức', 'error');
    }
  };

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
    if (pwForm.newPw.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
      return;
    }
    try {
      setSavingPw(true);
      await api.patch(`/api/users/${orgId}/password`, {
        currentPassword: pwForm.old,
        newPassword: pwForm.newPw
      });
      showToast('Đã thay đổi mật khẩu thành công', 'success');
      setPwForm({ old: '', newPw: '', confirm: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Mật khẩu hiện tại không đúng hoặc lỗi hệ thống', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Cài đặt hệ thống</h2>
        <p className="text-xs text-zinc-500 mt-1">Quản lý thông tin tổ chức và tùy chỉnh cấu hình tài khoản</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-1 w-max max-w-full">
        {[
          { id: 'org', label: 'Thông tin tổ chức' },
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

      {/* Org Profile Tab */}
      {tab === 'org' && (
        <form onSubmit={handleSaveOrg} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-md">
          <h3 className="text-sm font-semibold text-zinc-100">Thông tin tổ chức</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Tên tổ chức</label>
              <input
                required
                value={orgForm.name}
                onChange={handleOrgChange('name')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={orgForm.email}
                    onChange={handleOrgChange('email')}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    required
                    value={orgForm.phone}
                    onChange={handleOrgChange('phone')}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Địa chỉ</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  required
                  value={orgForm.address}
                  onChange={handleOrgChange('address')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 block mb-1.5 uppercase tracking-wider">Mã số thuế</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  required
                  value={orgForm.tax}
                  onChange={handleOrgChange('tax')}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-zinc-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-600/15"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
          </div>
        </form>
      )}

      {/* Notifications Tab */}
      {tab === 'notif' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-md">
          <h3 className="text-sm font-semibold text-zinc-100">Cài đặt thông báo</h3>
          <div className="divide-y divide-zinc-800/60">
            {[
              { key: 'lateClock', label: 'Thông báo chấm công muộn', desc: 'Gửi cảnh báo thời gian thực khi nhân viên check-in sau 08:30 sáng' },
              { key: 'absent', label: 'Báo cáo nhân sự vắng mặt', desc: 'Gửi danh sách tổng hợp nhân sự vắng mặt hàng ngày lúc 09:00 sáng' },
              { key: 'maintenance', label: 'Cập nhật bảo trì hệ thống', desc: 'Nhận thông báo trước về lịch nâng cấp hoặc bảo trì kỹ thuật từ hệ thống' },
              { key: 'weeklyReport', label: 'Báo cáo chấm công tuần', desc: 'Tự động gửi email thống kê hiệu suất chấm công vào sáng thứ Hai' }
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
          <h3 className="text-sm font-semibold text-zinc-100">Đổi mật khẩu</h3>
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
              disabled={savingPw}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-600/15 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingPw ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
