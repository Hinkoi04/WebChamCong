import api from '../../../services/api';

export const adminService = {
  getOrganizations: async () => {
    const res = await api.get('/api/admin/organizations');
    return res.data;
  },
  updateOrganizationStatus: async (orgId, status) => {
    const res = await api.put(`/api/admin/organizations/${orgId}/status?status=${status}`);
    return res.data;
  },
  getAdmins: async () => {
    const res = await api.get('/api/admin/admins');
    return res.data;
  },
  getAuditLogs: async () => {
    const res = await api.get('/api/audit-logs');
    return res.data;
  },
  changePassword: async (adminId, passwords) => {
    const res = await api.patch(`/api/admin/${adminId}/password`, passwords);
    return res.data;
  }
};
