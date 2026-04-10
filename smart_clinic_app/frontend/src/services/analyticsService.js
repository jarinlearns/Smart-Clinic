import api from '../api';

const getToken = () => JSON.parse(localStorage.getItem('userInfo'))?.token;

export const getPharmacyAnalytics = async (startDate, endDate) => {
    const token = getToken();
    const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate },
    };
    const { data } = await api.get('/analytics/pharmacy', config);
    return data;
};