import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import api from '../api';
import { getPendingApprovals } from '../services/patientService';
import DoctorQueueModal from '../components/DoctorQueueModal'; 
import './ReceptionistDashboard.css'; 

const ReceptionistDashboard = () => { 
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [walkInsToday, setWalkInsToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  
  useEffect(() => {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (storedUserInfo) {
      setUserName(storedUserInfo.name);
    }

    const fetchData = async () => {
      try {
        
        
        
        
        const config = {
            headers: { Authorization: `Bearer ${storedUserInfo.token}` },
        };

        const pendingApprovals = await getPendingApprovals();
        setPendingCount(pendingApprovals.length);

        const { data: patientsData } = await api.get('/patients', config);
        setPatients(patientsData);

        const { data: doctorsData } = await api.get('/users/doctors', config);
        setDoctors(doctorsData);

        const today = new Date();
        const todaysPatients = patientsData.filter(patient => {
          const patientDate = new Date(patient.createdAt);
          return patientDate.getFullYear() === today.getFullYear() &&
                 patientDate.getMonth() === today.getMonth() &&
                 patientDate.getDate() === today.getDate();
        });
        setWalkInsToday(todaysPatients.length);

      } catch (err) {
        console.error(err);
        setError('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    
    fetchData();

    
    const interval = setInterval(fetchData, 30000);

    
    return () => clearInterval(interval);
  }, []);

  const availableDoctors = doctors.filter(doc => doc.isAvailable);
  const inConsultationPatients = patients.filter(p => p.status === 'in-consultation');
  const queueCount = patients.filter(p => p.status === 'waiting').length;
  
  const completedToday = patients.filter(p => {
      if (p.status !== 'done') return false;
      const doneDate = new Date(p.updatedAt); 
      const today = new Date();
      return doneDate.getDate() === today.getDate() &&
             doneDate.getMonth() === today.getMonth() &&
             doneDate.getFullYear() === today.getFullYear();
  }).length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
            <h1>Welcome back, {userName}!</h1>
            <p className="welcome-message">Here is a summary of the clinic's activity today.</p>
        </div>
      </div>
      
      <div className="quick-actions">
          <Link to="/reception/approvals" className="action-button">Pending Approvals {pendingCount > 0 && <span className="notification-badge">{pendingCount}</span>}</Link>
          <Link to="/reception/add-patient" className="action-button">Add Patient</Link>
          <Link to="/reception/patient-list" className="action-button">Patient List</Link>
          <Link to="/reception/live-queue" className="action-button">Live Queue</Link>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3 className="card-title">Current Queue</h3>
          <p className="card-number" style={{ color: '#dd6b20' }}>{loading ? '...' : queueCount}</p>
        </div>

        <div className="stat-card">
            <h3 className="card-title">Completed Today</h3>
            <p className="card-number" style={{ color: '#38a169' }}>{loading ? '...' : completedToday}</p>
        </div>

        <div className="stat-card">
          <h3 className="card-title">Walk-ins Today</h3>
          <p className="card-number">{loading ? '...' : walkInsToday}</p>
        </div>
        
        <div className="stat-card">
            <h3 className="card-title">Doctors Available</h3>
            <p className="card-number" style={{color: '#3182ce'}}>{loading ? '...' : availableDoctors.length}</p>
        </div>
      </div>

      <div className="dashboard-lists-container">
        <div className="list-section">
            <div className="section-header">
                <h2>In Consultation</h2>
            </div>
            <div className="list-card-container">
                {loading ? <p>Loading...</p> : inConsultationPatients.length === 0 ? (
                    <p className="empty-state">No consultations in progress.</p>
                ) : (
                    inConsultationPatients.map((patient) => (
                        <div key={patient._id} className="info-row">
                            <div className="info-main">
                                <span className="info-name">{patient.name}</span>
                                <span className="info-sub">{patient.age} yrs • {patient.symptoms.substring(0, 20)}...</span>
                                {patient.assignedDoctor && (
                                    <span style={{ fontSize: '0.8rem', color: '#718096', marginTop: '2px' }}>
                                        With <strong>Dr. {patient.assignedDoctor.name}</strong>
                                    </span>
                                )}
                            </div>
                            <span className="status-badge busy">In Session</span>
                        </div>
                    ))
                )}
            </div>
        </div>

        <div className="list-section">
            <div className="section-header">
                <h2>Available Doctors</h2>
            </div>
            <div className="list-card-container">
                {loading ? <p>Loading...</p> : availableDoctors.length === 0 ? (
                    <p className="empty-state">No doctors currently available.</p>
                ) : (
                    availableDoctors.map((doc) => (
                        <div 
                            key={doc._id} 
                            className="info-row clickable"
                            onClick={() => setSelectedDoctor(doc)}
                        >
                            <div className="info-main">
                                <span className="info-name">Dr. {doc.name}</span>
                                <span className="info-sub">{doc.specialty}</span>
                            </div>
                            <span className="status-badge available">Available</span>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
      
      {selectedDoctor && (
        <DoctorQueueModal 
          doctor={selectedDoctor} 
          onClose={() => setSelectedDoctor(null)} 
        />
      )}
    </div>
  );
};

export default ReceptionistDashboard;