import api from '../api';

const getToken = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  return userInfo ? userInfo.token : null;
};


export const getLiveQueue = async () => {
  const token = getToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await api.get('/queue', config);
  return data;
};
export const updatePatientStatus = async (patientId, newStatus) => {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await api.patch(`/queue/${patientId}`, { status: newStatus }, config);
  return data;
};

export const addExtraTime = async (patientId, minutes) => {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await api.patch(`/queue/${patientId}/add-time`, { minutes }, config);
  return data;
};
export const fetchWaitTime = async (patientId) => {
  const token = getToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await api.get(`/queue/wait-time/${patientId}`, config);
  return data.estimatedWaitTime;
};

export const addWalkInPatient = async (patientData) => {
    const token = getToken();
    const config = {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    };
    const { data } = await api.post('/queue', patientData, config);
    return data;
};