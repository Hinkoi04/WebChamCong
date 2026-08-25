import api from '../../../services/api';

export const salaryService = {
  calculateSalary: async (orgId, staffId, month, year) => {
    const res = await api.post(`/api/org/${orgId}/salaries/calculate/${staffId}`, { month, year });
    return res.data;
  },
  calculateAllSalaries: async (orgId, month, year) => {
    const res = await api.post(`/api/org/${orgId}/salaries/calculate-all`, { month, year });
    return res.data;
  },
  updateSalary: async (orgId, salaryId, updateData) => {
    const res = await api.put(`/api/org/${orgId}/salaries/${salaryId}`, updateData);
    return res.data;
  },
  getSalaryHistory: async (orgId, staffId) => {
    const res = await api.get(`/api/org/${orgId}/salaries/staff/${staffId}`);
    return res.data;
  },
  getSalariesByMonthYear: async (orgId, month, year) => {
    const res = await api.get(`/api/org/${orgId}/salaries`, {
      params: { month, year }
    });
    return res.data;
  },
  exportSalaryExcel: async (orgId, month, year) => {
    const res = await api.get(`/api/org/${orgId}/salaries/export-excel`, {
      params: { month, year },
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_Luong_T${String(month).padStart(2, '0')}_${year}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
