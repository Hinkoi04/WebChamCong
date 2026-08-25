import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

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
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 p-5">
      <div className="w-full max-w-[440px] bg-zinc-900 border border-zinc-800 rounded-2xl p-10 shadow-2xl">
        <h2 className="font-heading text-3xl font-bold text-center text-zinc-100 mb-2">FaceAttend</h2>
        <p className="text-zinc-400 text-center text-sm mb-8">Hệ thống chấm công đa tổ chức</p>

        {error && (
          <div className="block w-full py-2.5 px-4 mb-5 text-sm font-semibold rounded-lg text-center bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="flex gap-2.5 mb-6">
            <button
              type="button"
              className={`flex-grow py-3 px-4 text-sm font-semibold rounded-xl border transition-all duration-200 cursor-pointer ${
                !isAdmin
                  ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white border-transparent shadow-lg shadow-violet-600/25 hover:opacity-95'
                  : 'bg-zinc-850 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
              onClick={() => { setIsAdmin(false); setError(''); }}
            >
              Doanh Nghiệp
            </button>
            <button
              type="button"
              className={`flex-grow py-3 px-4 text-sm font-semibold rounded-xl border transition-all duration-200 cursor-pointer ${
                isAdmin
                  ? 'bg-gradient-to-r from-violet-600 to-pink-500 text-white border-transparent shadow-lg shadow-violet-600/25 hover:opacity-95'
                  : 'bg-zinc-850 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
              onClick={() => { setIsAdmin(true); setError(''); }}
            >
              Admin Hệ Thống
            </button>
          </div>

          <div className="mb-5 text-left">
            <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">{isAdmin ? 'Tên đăng nhập' : 'Email'}</label>
            <input
              type={isAdmin ? 'text' : 'email'}
              className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-800 rounded-xl text-zinc-100 font-sans text-sm transition-all focus:outline-none focus:bg-zinc-900/60 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
              placeholder={isAdmin ? 'Nhập tên đăng nhập' : 'email@congty.com'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="mb-5 text-left">
            <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Mật khẩu</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-zinc-950/40 border border-zinc-800 rounded-xl text-zinc-100 font-sans text-sm transition-all focus:outline-none focus:bg-zinc-900/60 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full mt-3 py-3 px-6 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow-lg shadow-violet-600/25 hover:opacity-95 transition-all duration-200 cursor-pointer text-center"
          >
            Đăng Nhập
          </button>
        </form>

        {!isAdmin && (
          <p className="mt-6 text-center text-sm text-zinc-400">
            Chưa có tài khoản?{' '}
            <span className="text-violet-400 cursor-pointer font-semibold hover:text-violet-300" onClick={() => navigate('/register')}>
              Đăng ký ngay
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
