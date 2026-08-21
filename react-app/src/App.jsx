import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import LoginPage from './modules/auth/pages/LoginPage';
import RegisterPage from './modules/auth/pages/RegisterPage';

// Tenant/Org Pages
import OrgDashboardPage from './modules/dashboard/pages/OrgDashboardPage';
import OrgStaffPage from './modules/staff/pages/OrgStaffPage';
import OrgDepartmentsPage from './modules/staff/pages/OrgDepartmentsPage';
import OrgAttendancePage from './modules/attendance/pages/OrgAttendancePage';
import OrgAutoAttendancePage from './modules/attendance/pages/OrgAutoAttendancePage';
import OrgSalaryPage from './modules/salary/pages/OrgSalaryPage';
import OrgSettingsPage from './modules/settings/pages/OrgSettingsPage';
import SchedulePage from './modules/work_schedule/pages/SchedulePage';

// Admin Pages
import AdminDashboardPage from './modules/admin/pages/AdminDashboardPage';
import AdminOrgsPage from './modules/admin/pages/AdminOrgsPage';
import AdminAccountsPage from './modules/admin/pages/AdminAccountsPage';
import AdminLogsPage from './modules/admin/pages/AdminLogsPage';
import AdminSettingsPage from './modules/admin/pages/AdminSettingsPage';

// Other Pages
import CheckpointPage from './modules/attendance/pages/CheckpointPage';

function App() {
  return (
    <ToastProvider>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/checkpoint" element={<CheckpointPage />} />

        {/* Dashboard layouts */}
        <Route element={<DashboardLayout />}>
          {/* Org Dashboard routes */}
          <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
            <Route path="/org/dashboard" element={<OrgDashboardPage />} />
            <Route path="/org/staff" element={<OrgStaffPage />} />
            <Route path="/org/departments" element={<OrgDepartmentsPage />} />
            <Route path="/org/schedule" element={<SchedulePage />} />
            <Route path="/org/attendance" element={<OrgAttendancePage />} />
            <Route path="/org/auto-attendance" element={<OrgAutoAttendancePage />} />
            <Route path="/org/salary" element={<OrgSalaryPage />} />
            <Route path="/org/settings" element={<OrgSettingsPage />} />
          </Route>

          {/* Admin Dashboard routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/organizations" element={<AdminOrgsPage />} />
            <Route path="/admin/accounts" element={<AdminAccountsPage />} />
            <Route path="/admin/logs" element={<AdminLogsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        {/* Default fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
