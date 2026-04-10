import api from '../api';

const getToken = () => JSON.parse(localStorage.getItem('userInfo'))?.token;

export const getProcurements = async (startDate, endDate) => {
  const token = getToken();
  const config = {
    headers: { Authorization: `Bearer ${token}` },
    params: {},
  };
  if (startDate) config.params.startDate = startDate;
  if (endDate) config.params.endDate = endDate;
  const { data } = await api.get('/procurements', config);
  return data;
};