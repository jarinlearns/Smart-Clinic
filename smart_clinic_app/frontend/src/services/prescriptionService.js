import api from '../api';

const getToken = () => JSON.parse(localStorage.getItem('userInfo'))?.token;

export const addPrescription = async (prescriptionData) => {
    const token = getToken();
    const config = {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    };
    const { data } = await api.post('/prescriptions', prescriptionData, config);
    return data;
};



export const getPrescriptions = async (params = {}) => {
  const token = getToken();
  const config = {
    headers: { Authorization: `Bearer ${token}` },
    params, 
  };
  const { data } = await api.get('/prescriptions', config);
  return data;
};


export const updatePrescriptionStatus = async (prescriptionId, status) => {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await api.patch(`/prescriptions/${prescriptionId}`, { status }, config);
  return data;
};

export const fillPrescription = async (prescriptionId, medicines) => {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await api.post(`/prescriptions/${prescriptionId}/fill`, { medicines }, config);
  return data;
};

export const getMyPrescriptionHistory = async () => {
  const token = getToken();
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };
  const { data } = await api.get('/prescriptions/my-history', config);
  return data;
};