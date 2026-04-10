import api from '../api';

const getToken = () => JSON.parse(localStorage.getItem('userInfo'))?.token;

export const scanAndQuarantine = async () => {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await api.post('/inventory/quarantine-expired', {}, config);
  return data;
};

export const getMostDispensed = async (startDate, endDate) => {
    const token = getToken();
    const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate, endDate }, 
    };
    const { data } = await api.get('/inventory/analytics/most-dispensed', config);
    return data;
};