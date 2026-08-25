import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, DollarSign, Settings,
  Bell, Search, CheckCircle2, Building2, LogOut, Shield,
  ChevronDown, Scan, AlertTriangle, CalendarDays, Fingerprint, CalendarCheck,
  Trash2
} from 'lucide-react';


const orgNav = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan', path: '/org/dashboard' },
  { id: 'staff', icon: Users, label: 'Nhân viên', path: '/org/staff' },
  { id: 'departments', icon: Building2, label: 'Phòng ban', path: '/org/departments' },
  { id: 'schedule', icon: CalendarDays, label: 'Ca làm việc', path: '/org/schedule' },
  { id: 'auto-attendance', icon: Scan, label: 'Chấm công tự động', path: '/org/auto-attendance' },
  { id: 'attendance-management', icon: CalendarCheck, label: 'Quản lý chấm công', path: '/org/attendance-management' },
  { id: 'attendance', icon: Fingerprint, label: 'Lịch sử chấm công', path: '/org/attendance' },
  { id: 'salary', icon: DollarSign, label: 'Tiền lương', path: '/org/salary' },
  { id: 'settings', icon: Settings, label: 'Cài đặt', path: '/org/settings' },
  { id: 'trash', icon: Trash2, label: 'Thùng rác', path: '/org/trash' }
];

const adminNav = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan', path: '/admin/dashboard' },
  { id: 'organizations', icon: Building2, label: 'Tổ chức', path: '/admin/organizations' },
  { id: 'accounts', icon: Shield, label: 'Quản trị viên', path: '/admin/accounts' },
  { id: 'logs', icon: Clock, label: 'Nhật ký hệ thống', path: '/admin/logs' },
  { id: 'settings', icon: Settings, label: 'Cài đặt', path: '/admin/settings' }
];

const pageTitles = {
  dashboard: 'Tổng quan',
  staff: 'Nhân viên',
  departments: 'Quản lý phòng ban',
  schedule: 'Ca làm việc',
  'auto-attendance': 'Chấm công tự động',
  'attendance-management': 'Quản lý chấm công theo tháng',
  attendance: 'Lịch sử chấm công',
  salary: 'Tiền lương',
  organizations: 'Tổ chức',
  accounts: 'Quản trị viên',
  logs: 'Nhật ký hệ thống',
  settings: 'Cài đặt',
  trash: 'Thùng rác nhân sự'
};

const notifItems = [];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role'); // 'USER' or 'ADMIN'
  const role = userRole === 'ADMIN' ? 'admin' : 'org';
  const activeTab = location.pathname.split('/').pop() || 'dashboard';

  const [notifOpen, setNotifOpen] = useState(false);
  const [read, setRead] = useState(new Set());
  const unread = notifItems.filter((n) => !read.has(n.id)).length;
  const notifIcons = {
    warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    info: <Bell className="w-3.5 h-3.5 text-blue-400" />,
    success: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
  };

  const orgInfo = userRole === 'USER' ? JSON.parse(localStorage.getItem('orgInfo') || '{}') : {};
  const adminInfo = userRole === 'ADMIN' ? JSON.parse(localStorage.getItem('adminInfo') || '{}') : {};

  const profileMenuRef = useRef(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (!userRole) {
      navigate('/login');
      return;
    }
    if (userRole === 'USER' && location.pathname.startsWith('/admin')) {
      navigate('/org/dashboard');
    } else if (userRole === 'ADMIN' && location.pathname.startsWith('/org')) {
      navigate('/admin/dashboard');
    }
  }, [userRole, location.pathname, navigate]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const nav = role === 'admin' ? adminNav : orgNav;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden antialiased font-sans">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col h-full border-r border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
        <div className="px-6 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/25">
              <Scan className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-100 tracking-tight">FaceTrack</div>
              <div className="text-[10px] text-zinc-400 font-mono">v2.4.1 · SaaS</div>
            </div>
          </div>
        </div>

        {role === 'org' && (
          <div className="px-6 py-4 border-b border-zinc-800">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">Đơn vị</div>
            <div className="text-sm font-semibold text-zinc-200 mt-0.5">{orgInfo.orgName || 'ABC Tech'}</div>
            <span className="inline-block mt-1 px-1.5 py-0.5 bg-violet-500/10 text-violet-400 text-[10px] font-mono rounded-md border border-violet-500/15 uppercase">
              {orgInfo.plan || 'PRO'}
            </span>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(({ id, icon: Icon, label, path }) => (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                activeTab === id
                  ? 'bg-violet-500/10 text-violet-400 font-medium border border-violet-500/15'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/30'
              }`}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {activeTab === id && <div className="w-1.5 h-4.5 rounded-full bg-violet-500" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-600/15 flex items-center justify-center text-violet-400 font-mono text-xs font-semibold">
              {role === 'admin' ? 'SA' : 'QT'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-semibold text-zinc-200 truncate">
                {role === 'admin' ? (adminInfo.fullName || 'Super Admin') : 'Quản trị viên'}
              </div>
              <div className="text-[10px] text-zinc-500 truncate font-mono">
                {role === 'admin' ? (adminInfo.username || 'admin') : (orgInfo.email || 'admin@abctech.vn')}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center px-6 gap-4 flex-shrink-0 bg-zinc-900/30 backdrop-blur-md">
          <div className="flex-1">
            <h1 className="text-base font-bold text-zinc-100">{pageTitles[activeTab] ?? activeTab}</h1>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="relative max-md:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              placeholder="Tìm kiếm..."
              className="bg-zinc-900/60 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 w-56 transition-all"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative text-zinc-400 hover:text-zinc-100 transition-colors p-2 bg-zinc-900/60 border border-zinc-800 rounded-xl"
            >
              <Bell className="w-4.5 h-4.5" />
              {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-11 z-50 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-80 overflow-hidden animate-[fadeInScale_0.15s_ease_both]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                    <span className="text-sm font-semibold text-zinc-100">Thông báo</span>
                    <button
                      onClick={() => setRead(new Set(notifItems.map((n) => n.id)))}
                      className="text-xs text-violet-400 hover:underline font-medium"
                    >
                      Đọc tất cả
                    </button>
                  </div>
                  <div className="divide-y divide-zinc-800 max-h-[300px] overflow-y-auto">
                    {notifItems.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => setRead((r) => new Set([...r, n.id]))}
                        className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800/30 transition-colors ${
                          !read.has(n.id) ? 'bg-violet-600/[0.03]' : ''
                        }`}
                      >
                        <div className="mt-0.5">{notifIcons[n.type]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
                            {n.title}
                            {!read.has(n.id) && <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{n.desc}</div>
                          <div className="text-[10px] text-zinc-500 mt-1.5 font-mono">{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative" ref={profileMenuRef}>
            <div
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2.5 pl-4 border-l border-zinc-800 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-violet-600/15 flex items-center justify-center text-violet-400 font-mono text-xs font-semibold animate-pulse-slow">
                {role === 'admin' ? 'SA' : 'QT'}
              </div>
              <div className="max-sm:hidden text-left">
                <div className="text-xs font-semibold text-zinc-200 truncate max-w-[120px]">
                  {role === 'admin' ? (adminInfo.fullName || 'Super Admin') : 'Quản trị viên'}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-[120px]">
                  {role === 'admin' ? 'Hệ thống' : (orgInfo.orgName || 'Tổ chức')}
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-zinc-500 group-hover:text-zinc-200 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </div>

            {profileMenuOpen && (
              <div className="absolute right-0 top-11 z-30 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-44 py-1.5 overflow-hidden animate-[fadeInScale_0.15s_ease_both]">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate(role === 'admin' ? '/admin/settings' : '/org/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800/40 transition-colors text-left cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-500" />
                  Cài đặt tài khoản
                </button>
                <div className="my-1 border-t border-zinc-800" />
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors font-medium text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content body */}
        <main className="flex-grow overflow-y-auto p-6 bg-zinc-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
