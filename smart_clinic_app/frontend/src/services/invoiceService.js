import api from '../api';

const getToken = () => JSON.parse(localStorage.getItem('userInfo'))?.token;

export const getInvoices = async () => {
  const token = getToken();
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };
  const { data } = await api.get('/invoices', config);
  return data;
};

export const updateInvoiceStatus = async (invoiceId, status) => {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await api.patch(`/invoices/${invoiceId}`, { status }, config);
  return data;
};
