import api from '../../../services/api';

export const departmentService = {
  getDepartmentList: async (orgId) => {
    const res = await api.get(`/api/org/${orgId}/departments`);
    return res.data;
  },
  createDepartment: async (orgId, data) => {
    const res = await api.post(`/api/org/${orgId}/departments`, data);
    return res.data;
  },
  updateDepartment: async (orgId, deptId, data) => {
    const res = await api.put(`/api/org/${orgId}/departments/${deptId}`, data);
    return res.data;
  },
  deleteDepartment: async (orgId, deptId) => {
    const res = await api.delete(`/api/org/${orgId}/departments/${deptId}`);
    return res.data;
  },
  getDepartmentById: async (orgId, deptId) => {
    const res = await api.get(`/api/org/${orgId}/departments/${deptId}`);
    return res.data;
  }
};
