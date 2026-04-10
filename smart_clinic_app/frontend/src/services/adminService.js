import api from '../api';

const getToken = () => JSON.parse(localStorage.getItem('userInfo'))?.token;

export const getDashboardStats = async () => {
    const token = getToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const { data } = await api.get('/admin/dashboard-stats', config);
    return data;
};

export const getOperationalAnalytics = async () => {
    const token = getToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const { data } = await api.get('/admin/operational-analytics', config);
    return data;
};