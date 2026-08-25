import api from '../../../services/api';

export const attendanceService = {
  // orgId: truyền explicit từ URL param (CheckpointPage) hoặc localStorage (OrgAutoAttendancePage)
  faceCheckIn: async (staffId, checkInImage, orgId, action = 'CHECK_IN') => {
    const resolvedOrgId = orgId ?? (localStorage.getItem('orgId') ? parseInt(localStorage.getItem('orgId')) : null);
    const res = await api.post('/api/attendances/face', { staffId, orgId: resolvedOrgId, checkInImage, action });
    return res.data;
  },
  faceScan: async (checkInImage, orgId, action = 'CHECK_IN') => {
    const resolvedOrgId = orgId ?? (localStorage.getItem('orgId') ? parseInt(localStorage.getItem('orgId')) : null);
    const res = await api.post(`/api/org/${resolvedOrgId}/attendances/face-scan`, { orgId: resolvedOrgId, checkInImage, action });
    return res.data;
  },

  manualAttendance: async (orgId, manualData) => {
    const res = await api.post(`/api/org/${orgId}/attendances/manual`, manualData);
    return res.data;
  },
  getAttendanceHistory: async (orgId, staffId, startDate, endDate) => {
    const params = { startDate, endDate };
    if (staffId) {
      params.staffId = staffId;
    }
    const res = await api.get(`/api/org/${orgId}/attendances/history`, {
      params
    });
    return res.data;
  },

  exportAttendanceExcel: async (orgId, staffId, startDate, endDate) => {
    const params = { startDate, endDate };
    if (staffId) {
      params.staffId = staffId;
    }
    const res = await api.get(`/api/org/${orgId}/attendances/export-excel`, {
      params,
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_Cham_Cong_${startDate}_${endDate}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
