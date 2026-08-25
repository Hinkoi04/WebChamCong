import api from '../../../services/api';

export const staffService = {
  getStaffList: async (orgId) => {
    const res = await api.get(`/api/org/${orgId}/staffs`);
    return res.data;
  },
  createStaff: async (orgId, staffData) => {
    const res = await api.post(`/api/org/${orgId}/staffs`, staffData);
    return res.data;
  },
  updateStaff: async (orgId, staffId, staffData) => {
    const res = await api.put(`/api/org/${orgId}/staffs/${staffId}`, staffData);
    return res.data;
  },
  deleteStaff: async (orgId, staffId) => {
    const res = await api.delete(`/api/org/${orgId}/staffs/${staffId}`);
    return res.data;
  },
  registerFace: async (orgId, faceData) => {
    const res = await api.post(`/api/org/${orgId}/staffs/face`, faceData);
    return res.data;
  },
  uploadFace: async (orgId, staffId, file, replace = false) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/api/org/${orgId}/staffs/${staffId}/face-upload?replace=${replace}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // Trash APIs
  getTrashStaff: async (orgId) => {
    const res = await api.get(`/api/org/${orgId}/staffs/trash`);
    return res.data;
  },
  restoreStaff: async (orgId, staffId) => {
    const res = await api.put(`/api/org/${orgId}/staffs/${staffId}/restore`);
    return res.data;
  },
  permanentDeleteStaff: async (orgId, staffId) => {
    const res = await api.delete(`/api/org/${orgId}/staffs/${staffId}/permanent`);
    return res.data;
  },
  restoreAllTrash: async (orgId) => {
    const res = await api.post(`/api/org/${orgId}/staffs/trash/restore-all`);
    return res.data;
  },
  emptyTrash: async (orgId) => {
    const res = await api.delete(`/api/org/${orgId}/staffs/trash/empty`);
    return res.data;
  },
};
