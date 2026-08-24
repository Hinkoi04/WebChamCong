import api from '../../../services/api';

export const authService = {
  loginOrg: async (email, password) => {
    const res = await api.post('/api/users/login', { email, password });
    return res.data;
  },
  registerOrg: async (orgData) => {
    const res = await api.post('/api/users/register', orgData);
    return res.data;
  },
  loginAdmin: async (username, password) => {
    const res = await api.post('/api/admin/login', { username, password });
    return res.data;
  },
};
