import React, { useState, useEffect } from 'react';

import LandingPage from './LandingPage';
import ReceptionistDashboard from './ReceptionistDashboard';
import DoctorDashboard from './DoctorDashboard';
import PharmacistDashboard from './PharmacistDashboard'; 
import PatientDashboard from './PatientDashboard';      
import AdminDashboard from './AdminDashboard';        

const WorkInProgressPage = ({ role }) => (
  <div style={{ padding: '2rem' }}>
    <h1>{role} Dashboard</h1>
    <p>This dashboard is currently under construction. Please check back later!</p>
  </div>
);

const HomePage = () => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userInfoString = localStorage.getItem('userInfo');
      if (userInfoString) {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo && userInfo.role) {
          setUserRole(userInfo.role);
        }
      }
    } catch (error) {
      console.error("Failed to parse userInfo from localStorage", error);
      setUserRole(null);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  switch (userRole) {
    case 'Receptionist':
      return <ReceptionistDashboard />;
    case 'Doctor':
      return <DoctorDashboard />;
    case 'Pharmacist':
      return <PharmacistDashboard />;
    case 'Patient':
      return <PatientDashboard />;
    case 'Admin':
      return <AdminDashboard />;
    default:
     
      return <LandingPage />;
  }
};

export default HomePage;
