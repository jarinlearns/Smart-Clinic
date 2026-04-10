import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const RoleBasedRoute = ({ allowedRoles }) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));


  return userInfo && allowedRoles?.includes(userInfo.role) ? (
    <Outlet />
  ) : userInfo ? (
    <Navigate to="/" replace /> 
  ) : (
    <Navigate to="/login" replace />
  );
};

export default RoleBasedRoute;