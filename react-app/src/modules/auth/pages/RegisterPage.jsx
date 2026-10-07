import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useToast } from '../../../contexts/ToastContext';
import { Scan } from 'lucide-react';

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
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[500px] bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50">
        {/* Brand Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Scan className="w-6 h-6" />
          </div>
        </div>

        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-1 tracking-tight">
          Đăng Ký Tổ Chức
        </h2>
        <p className="text-slate-500 text-center text-xs sm:text-sm mb-6 sm:mb-8">
          Tham gia nền tảng chấm công nhận diện khuôn mặt AI
        </p>

        {error && (
          <div className="block w-full py-2.5 px-4 mb-5 text-sm font-semibold rounded-xl text-center bg-rose-50 text-rose-600 border border-rose-200">
            {error}
          </div>
        )}

        {success && (
          <div className="block w-full py-2.5 px-4 mb-5 text-sm font-semibold rounded-xl text-center bg-emerald-50 text-emerald-600 border border-emerald-200">
            Đăng ký thành công! Đang chuyển hướng...
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Tên tổ chức / Doanh nghiệp *
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
              placeholder="Ví dụ: Công ty TNHH Hinkoi"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>

          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Email quản trị *
            </label>
            <input
              type="email"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
              placeholder="admin@hinkoi.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Mật khẩu *
            </label>
            <input
              type="password"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="text-left">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Số điện thoại
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
                placeholder="09XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="text-left">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Mã số thuế
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
                placeholder="MST doanh nghiệp"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
              />
            </div>
          </div>

          <div className="text-left">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Địa chỉ trụ sở
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
              placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/TP"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 px-6 text-sm font-semibold rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all duration-200 cursor-pointer text-center"
          >
            Đăng Ký Tài Khoản
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Đã có tài khoản?{' '}
          <span
            className="text-indigo-600 cursor-pointer font-semibold hover:text-indigo-700 hover:underline"
            onClick={() => navigate('/login')}
          >
            Đăng nhập
          </span>
        </p>
      </div>
    </div>
  );
}
