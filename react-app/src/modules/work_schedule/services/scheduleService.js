import api from '../../../services/api';

export const scheduleService = {
  getSchedules: async (orgId) => {
    const res = await api.get(`/api/org/${orgId}/work-schedules`);
    return res.data;
  },
  createSchedule: async (orgId, scheduleData) => {
    const res = await api.post(`/api/org/${orgId}/work-schedules`, scheduleData);
    return res.data;
  },
  updateSchedule: async (orgId, scheduleId, scheduleData) => {
    const res = await api.put(`/api/org/${orgId}/work-schedules/${scheduleId}`, scheduleData);
    return res.data;
  },
};
