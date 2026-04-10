import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicOnlyRoute = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));

  return userInfo ? <Navigate to="/" /> : <Outlet />;
};

export default PublicOnlyRoute;