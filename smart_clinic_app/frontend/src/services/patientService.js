import api from '../api';

const getToken = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  return userInfo ? userInfo.token : null;
};


export const getPatients = async (params = {}) => {
  const token = getToken();
  const config = {
    headers: { Authorization: `Bearer ${token}` },
    params,
  };
  const { data } = await api.get('/patients', config);
  return data;
};

export const updatePatient = async (patientId, updateData) => {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await api.put(`/patients/${patientId}`, updateData, config);
  return data;
};
export const deletePatient = async (patientId) => {
  const token = getToken();
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await api.delete(`/patients/${patientId}`, config);
  return data;
};

export const fetchWaitTime = async (patientId) => {
  const token = getToken();
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await api.get(`/patients/${patientId}/wait-time`, config);
  return data.estimatedWaitTime;
};

export const addPatient = async (patientData) => {
    const token = getToken();
    const config = {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    };
    const { data } = await api.post('/patients', patientData, config);
    return data;
};
export const selfEnroll = async (enrollmentData) => {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await api.post('/patients/self-enroll', enrollmentData, config);
  return data;
};

export const getPendingApprovals = async () => {
  const token = getToken();
  const config = { 
    headers: { Authorization: `Bearer ${token}` },
    params: { status: 'pending-approval' }
  };
  const { data } = await api.get('/patients', config);
  return data;
};

export const approvePatient = async (patientId, updatedData) => {
  const token = getToken();
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await api.patch(`/patients/${patientId}/approve`, updatedData, config);
  return data;
};

export const getUsers = async (role) => {
    const token = getToken();
    const config = {
        headers: { Authorization: `Bearer ${token}` },
        params: { role }, 
    };
    const { data } = await api.get('/users', config);
    return data;
};

export const getPatientById = async (patientId) => {
  const token = getToken();
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await api.get(`/patients/${patientId}`, config);
  return data;
};




export const cancelPatient = async (patientId) => {
  const token = getToken(); 
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await api.patch(`/patients/${patientId}/cancel`, {}, config);
  return data;
};


