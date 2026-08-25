import api from '../../../services/api';

export const positionService = {
  getPositionList: async (orgId) => {
    const res = await api.get(`/api/org/${orgId}/positions`);
    return res.data;
  },
  createPosition: async (orgId, data) => {
    const res = await api.post(`/api/org/${orgId}/positions`, data);
    return res.data;
  },
  updatePosition: async (orgId, posId, data) => {
    const res = await api.put(`/api/org/${orgId}/positions/${posId}`, data);
    return res.data;
  },
  deletePosition: async (orgId, posId) => {
    const res = await api.delete(`/api/org/${orgId}/positions/${posId}`);
    return res.data;
  },
  getPositionById: async (orgId, posId) => {
    const res = await api.get(`/api/org/${orgId}/positions/${posId}`);
    return res.data;
  }
};
