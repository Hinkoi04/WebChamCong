import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Clock, DollarSign, Settings,
  Bell, Search, CheckCircle2, Building2, LogOut, Shield,
  ChevronDown, Scan, AlertTriangle, CalendarDays, Fingerprint, CalendarCheck,
  Trash2, Menu, X, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen
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

  // Responsive & Collapse states
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('faceTrack_sidebar_collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('faceTrack_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Auth routing check
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

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard shortcut (Ctrl/Cmd + B) to toggle sidebar on desktop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const nav = role === 'admin' ? adminNav : orgNav;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden antialiased font-sans">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity duration-300 animate-[fadeIn_0.2s_ease_both]"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col h-full border-r border-zinc-800 bg-zinc-900/95 lg:bg-zinc-900/60 backdrop-blur-xl transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none lg:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[72px] w-64' : 'w-64'}`}
      >
        {/* Sidebar Header / Brand */}
        <div className={`py-4 border-b border-zinc-800 flex items-center justify-between transition-all duration-300 ${
          isCollapsed ? 'lg:px-3 px-5' : 'px-5'
        }`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/25 flex-shrink-0 shadow-lg shadow-violet-600/10">
              <Scan className="w-5 h-5 text-violet-400" />
            </div>
            <div className={`transition-all duration-200 min-w-0 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <div className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-1.5 truncate">
                FaceTrack
                <span className="text-[10px] px-1.5 py-0.2 bg-violet-500/10 text-violet-400 rounded-md border border-violet-500/20 font-mono">
                  v2.4
                </span>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono truncate">AI Chấm công & Quản lý</div>
            </div>
          </div>

          {/* Desktop collapse button & Mobile close button */}
          <div className="flex items-center">
            {/* Desktop collapse button */}
            <button
              onClick={toggleCollapse}
              title={isCollapsed ? 'Mở rộng thanh bên (Ctrl+B)' : 'Thu gọn thanh bên (Ctrl+B)'}
              className={`hidden lg:flex items-center justify-center p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors cursor-pointer ${
                isCollapsed ? 'mx-auto' : ''
              }`}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors cursor-pointer"
              aria-label="Đóng menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Org/Unit Info Banner */}
        {role === 'org' && (
          <div className={`py-3 border-b border-zinc-800 transition-all duration-300 ${
            isCollapsed ? 'lg:px-2 lg:py-2 px-5' : 'px-5'
          }`}>
            <div className={`flex items-center justify-between ${isCollapsed ? 'lg:justify-center' : ''}`}>
              <div className={`min-w-0 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Đơn vị</div>
                <div className="text-xs font-bold text-zinc-200 mt-0.5 truncate max-w-[150px]">
                  {orgInfo.orgName || 'ABC Tech'}
                </div>
              </div>
              <span
                title={isCollapsed ? `Đơn vị: ${orgInfo.orgName || 'ABC Tech'} (PRO)` : undefined}
                className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-[10px] font-mono font-bold rounded-md border border-violet-500/20 uppercase shadow-sm"
              >
                {orgInfo.plan || 'PRO'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Menu Links */}
        <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {nav.map(({ id, icon: Icon, label, path }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => {
                  navigate(path);
                  setMobileOpen(false);
                }}
                title={isCollapsed ? label : undefined}
                className={`w-full flex items-center rounded-xl text-sm transition-all text-left group relative cursor-pointer ${
                  isCollapsed ? 'lg:justify-center lg:px-2 py-2.5 px-3.5 gap-3' : 'px-3.5 py-2.5 gap-3'
                } ${
                  isActive
                    ? 'bg-violet-600/15 text-violet-300 font-semibold border border-violet-500/25 shadow-sm shadow-violet-600/10'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4.5 h-4.5 flex-shrink-0 transition-transform duration-200 ${
                    isActive ? 'text-violet-400 scale-105' : 'group-hover:text-zinc-200 group-hover:scale-105'
                  }`}
                />
                <span className={`truncate text-xs sm:text-sm ${isCollapsed ? 'lg:hidden' : 'block flex-1'}`}>
                  {label}
                </span>

                {/* Active Indicator Bar */}
                {isActive && (
                  <div
                    className={`rounded-full bg-violet-500 ${
                      isCollapsed ? 'lg:hidden w-1.5 h-4' : 'w-1.5 h-4 ml-auto'
                    }`}
                  />
                )}

                {/* Floating tooltip on collapsed desktop hover */}
                {isCollapsed && (
                  <div className="hidden lg:group-hover:block absolute left-full ml-3 px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-zinc-100 text-xs rounded-lg whitespace-nowrap shadow-xl z-50 pointer-events-none animate-[fadeIn_0.15s_ease_both]">
                    {label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className={`p-3 border-t border-zinc-800 bg-zinc-900/40 transition-all duration-300 ${
          isCollapsed ? 'lg:p-2' : 'p-3'
        }`}>
          {isCollapsed ? (
            <div className="hidden lg:flex flex-col items-center gap-2">
              <div
                title={`${role === 'admin' ? (adminInfo.fullName || 'Super Admin') : 'Quản trị viên'} (${role === 'admin' ? (adminInfo.username || 'admin') : (orgInfo.email || 'admin@abctech.vn')})`}
                className="w-9 h-9 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-violet-400 font-mono text-xs font-bold cursor-pointer"
              >
                {role === 'admin' ? 'SA' : 'QT'}
              </div>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : null}

          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:hidden' : 'flex'}`}>
            <div className="w-8 h-8 rounded-full bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-violet-400 font-mono text-xs font-semibold flex-shrink-0">
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
              title="Đăng xuất"
              className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors p-1.5 rounded-lg cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800 flex items-center px-4 sm:px-6 gap-3 sm:gap-4 flex-shrink-0 bg-zinc-900/40 backdrop-blur-md z-30">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors cursor-pointer flex-shrink-0"
            aria-label="Mở menu"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>

          {/* Page Title & Subtitle */}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-zinc-100 truncate">
              {pageTitles[activeTab] ?? activeTab}
            </h1>
            <p className="hidden sm:block text-[11px] text-zinc-500 font-mono mt-0.5 truncate">
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Search bar on larger screens */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              placeholder="Tìm kiếm..."
              className="bg-zinc-900/60 border border-zinc-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 w-44 lg:w-56 transition-all"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative text-zinc-400 hover:text-zinc-100 transition-colors p-2 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer"
              aria-label="Thông báo"
            >
              <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              {unread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-11 z-50 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-72 sm:w-80 max-w-[calc(100vw-32px)] overflow-hidden animate-[fadeInScale_0.15s_ease_both]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                    <span className="text-sm font-semibold text-zinc-100">Thông báo</span>
                    <button
                      onClick={() => setRead(new Set(notifItems.map((n) => n.id)))}
                      className="text-xs text-violet-400 hover:underline font-medium cursor-pointer"
                    >
                      Đọc tất cả
                    </button>
                  </div>
                  <div className="divide-y divide-zinc-800 max-h-[300px] overflow-y-auto">
                    {notifItems.length === 0 ? (
                      <div className="p-6 text-center text-xs text-zinc-500 font-medium">
                        Không có thông báo mới nào
                      </div>
                    ) : (
                      notifItems.map((n) => (
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
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <div
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-2 pl-3 sm:pl-4 border-l border-zinc-800 cursor-pointer group select-none"
            >
              <div className="w-8 h-8 rounded-full bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-violet-400 font-mono text-xs font-semibold">
                {role === 'admin' ? 'SA' : 'QT'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-zinc-200 truncate max-w-[110px] lg:max-w-[140px]">
                  {role === 'admin' ? (adminInfo.fullName || 'Super Admin') : 'Quản trị viên'}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-[110px] lg:max-w-[140px]">
                  {role === 'admin' ? 'Hệ thống' : (orgInfo.orgName || 'Tổ chức')}
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-200 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </div>

            {profileMenuOpen && (
              <div className="absolute right-0 top-11 z-50 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-48 py-1.5 overflow-hidden animate-[fadeInScale_0.15s_ease_both]">
                <div className="px-3 py-2 border-b border-zinc-800/80 sm:hidden">
                  <div className="text-xs font-semibold text-zinc-200 truncate">
                    {role === 'admin' ? (adminInfo.fullName || 'Super Admin') : 'Quản trị viên'}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
                    {role === 'admin' ? (adminInfo.username || 'admin') : (orgInfo.email || 'admin@abctech.vn')}
                  </div>
                </div>

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
        <main className="flex-grow overflow-y-auto p-3.5 sm:p-5 md:p-6 bg-zinc-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
