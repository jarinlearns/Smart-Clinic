import api from '../api';

const getToken = () => JSON.parse(localStorage.getItem('userInfo'))?.token;

export const getDoctorStats = async (doctorId) => {
  const token = getToken();
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };
  const { data } = await api.get(`/users/${doctorId}/stats`, config);
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


export const getUserProfile = async () => {
  const token = getToken();
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await api.get('/users/profile', config);
  return data;
};

export const updateUserProfile = async (userData) => {
  const token = getToken();
  const config = {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  };
  const { data } = await api.put('/users/profile', userData, config);
  
  localStorage.setItem('userInfo', JSON.stringify(data));
  return data;
};

export const updateUserPassword = async (passwordData) => {
  const token = getToken();
  const config = {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  };
  const { data } = await api.put('/users/profile/password', passwordData, config);
  return data;
};

export const getDoctors = async () => {
  const { data } = await api.get('/users/doctors');
  return data;
};
export const getAllUsers = async () => {
  const token = getToken();
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };
  
  const { data } = await api.get('/users', config);
  return data;
};
export const getDoctorIncomeStats = async (doctorId) => {
  const token = getToken();
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const { data } = await api.get(`/users/${doctorId}/income`, config);
  return data;
};
export const updateUser = async (userId, userData) => {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  const { data } = await api.patch(`/users/${userId}`, userData, config);
  return data;
};