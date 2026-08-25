import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Nếu có token nhưng sai role, văng về login (hoặc dashboard tương ứng)
    if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'USER') return <Navigate to="/org/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
