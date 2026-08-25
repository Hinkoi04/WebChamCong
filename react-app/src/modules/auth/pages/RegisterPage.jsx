import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../../../contexts/ToastContext';

export default function RegisterPage() {
  const { showToast } = useToast();
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      await authService.registerOrg({ orgName, email, password, phone, address, taxCode });
      setSuccess(true);
      showToast('Đăng ký thành công! Tài khoản của bạn đang chờ Admin duyệt.', 'success');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      showToast(err.response?.data?.message || 'Đăng ký tổ chức thất bại.', 'error');
      setError(err.response?.data?.message || 'Đăng ký tổ chức thất bại. Vui lòng kiểm tra lại');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 p-5">
      <div className="w-full max-w-[500px] bg-zinc-900 border border-zinc-800 rounded-2xl p-10 shadow-2xl">
        <h2 className="font-heading text-3xl font-bold text-zinc-100 text-center mb-2">Đăng Ký Tổ Chức</h2>
        <p className="text-zinc-400 text-center text-sm mb-8">Tham gia nền tảng chấm công nhận diện khuôn mặt</p>

        {error && (
          <div className="block w-full py-2.5 px-4 mb-5 text-sm font-semibold rounded-lg text-center bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {success && (
          <div className="block w-full py-2.5 px-4 mb-5 text-sm font-semibold rounded-lg text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Đăng ký thành công! Đang chuyển hướng...
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="mb-5 text-left">
            <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Tên tổ chức / Doanh nghiệp</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-800 rounded-xl text-zinc-100 font-sans text-sm transition-all focus:outline-none focus:bg-zinc-900/60 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
              placeholder="Ví dụ: Công ty TNHH Hinkoi"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>

          <div className="mb-5 text-left">
            <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Email quản trị</label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-800 rounded-xl text-zinc-100 font-sans text-sm transition-all focus:outline-none focus:bg-zinc-900/60 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
              placeholder="admin@hinkoi.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-5 text-left">
            <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Mật khẩu</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-800 rounded-xl text-zinc-100 font-sans text-sm transition-all focus:outline-none focus:bg-zinc-900/60 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="mb-5 text-left">
              <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Số điện thoại</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-800 rounded-xl text-zinc-100 font-sans text-sm transition-all focus:outline-none focus:bg-zinc-900/60 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                placeholder="09XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="mb-5 text-left">
              <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Mã số thuế</label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-800 rounded-xl text-zinc-100 font-sans text-sm transition-all focus:outline-none focus:bg-zinc-900/60 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                placeholder="MST doanh nghiệp"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-5 text-left">
            <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Địa chỉ trụ sở</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-800 rounded-xl text-zinc-100 font-sans text-sm transition-all focus:outline-none focus:bg-zinc-900/60 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
              placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/TP"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full mt-3 py-3 px-6 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow-lg shadow-violet-600/25 hover:opacity-95 transition-all duration-200 cursor-pointer text-center"
          >
            Đăng Ký Tài Khoản
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Đã có tài khoản?{' '}
          <span className="text-violet-400 cursor-pointer font-semibold hover:text-violet-300" onClick={() => navigate('/login')}>
            Đăng nhập
          </span>
        </p>
      </div>
    </div>
  );
}
