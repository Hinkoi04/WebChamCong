import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Scan } from 'lucide-react';

export default function LoginPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isAdmin) {
        const data = await authService.loginAdmin(identifier, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', 'ADMIN');
        localStorage.setItem('adminInfo', JSON.stringify(data));
        navigate('/admin/dashboard');
      } else {
        const data = await authService.loginOrg(identifier, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', 'USER');
        localStorage.setItem('orgInfo', JSON.stringify(data));
        localStorage.setItem('orgId', data.id);
        navigate('/org/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Thông tin đăng nhập không chính xác');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4 sm:p-6 font-sans">
      <div className="w-full max-w-[440px] bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50">
        {/* Brand Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Scan className="w-6 h-6" />
          </div>
        </div>

        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-center text-slate-900 tracking-tight mb-1">
          FaceTrack
        </h2>
        <p className="text-slate-500 text-center text-xs sm:text-sm mb-6 sm:mb-8">
          Hệ thống chấm công AI đa tổ chức
        </p>

        {error && (
          <div className="block w-full py-2.5 px-4 mb-5 text-sm font-semibold rounded-xl text-center bg-rose-50 text-rose-600 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Role switcher tab */}
          <div className="flex p-1 bg-slate-100 border border-slate-200/80 rounded-2xl mb-6">
            <button
              type="button"
              className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                !isAdmin
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              onClick={() => { setIsAdmin(false); setError(''); }}
            >
              Doanh Nghiệp
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                isAdmin
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              onClick={() => { setIsAdmin(true); setError(''); }}
            >
              Admin Hệ Thống
            </button>
          </div>

          <div className="mb-4 text-left">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              {isAdmin ? 'Tên đăng nhập' : 'Email công ty'}
            </label>
            <input
              type={isAdmin ? 'text' : 'email'}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
              placeholder={isAdmin ? 'Nhập tên đăng nhập' : 'email@congty.com'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="mb-6 text-left">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
              Mật khẩu
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm transition-all focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-6 text-sm font-semibold rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all duration-200 cursor-pointer text-center"
          >
            Đăng Nhập
          </button>
        </form>

        {!isAdmin && (
          <p className="mt-6 text-center text-sm text-slate-500">
            Chưa có tài khoản?{' '}
            <span
              className="text-indigo-600 cursor-pointer font-semibold hover:text-indigo-700 hover:underline"
              onClick={() => navigate('/register')}
            >
              Đăng ký ngay
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
