import api from '../api';

const getToken = () => JSON.parse(localStorage.getItem('userInfo'))?.token;

export const getMedicines = async () => {
    const token = getToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const { data } = await api.get('/medicines', config);
    return data;
};