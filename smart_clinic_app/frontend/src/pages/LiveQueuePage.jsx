import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPatients, getUsers, updatePatient, cancelPatient  } from '../services/patientService';
import './LiveQueuePage.css';

const LiveQueuePage = () => {
  const [doctors, setDoctors] = useState([]);
  const [doctorQueues, setDoctorQueues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    setUserInfo(storedUserInfo);
  }, []);

  const DEFAULT_CONSULTATION_MINUTES = 20;

  
  const formatElapsedTime = (startTime) => {
    if (!startTime) return '0:00';
    const diffMs = new Date() - new Date(startTime);
    const seconds = Math.floor((diffMs / 1000) % 60);
    const minutes = Math.floor((diffMs / 1000 / 60) % 60);
    const hours = Math.floor(diffMs / 1000 / 3600);
    const pad = (n) => String(n).padStart(2, '0');
    return `${hours > 0 ? hours + ':' : ''}${pad(minutes)}:${pad(seconds)}`;
  };

  
  const formatWaitTime = (minutes) => {
    const m = Math.floor(minutes);
    const s = Math.round((minutes - m) * 60);
    return `${m}m${s > 0 ? ` ${s}s` : ''}`;
  };

  
  const getElapsedMinutes = (startTime) => {
    if (!startTime) return 0;
    const diffMs = new Date() - new Date(startTime);
    return diffMs / 1000 / 60;
  };


  const fetchAllQueues = useCallback(async () => {
    try {
      
      const doctorsData = await getUsers('Doctor');
      setDoctors(doctorsData);

      if (doctorsData.length > 0) {
        const queuePromises = doctorsData.map((doctor) =>
          Promise.all([
            getPatients({ doctorId: doctor._id, status: 'waiting' }),
            getPatients({ doctorId: doctor._id, status: 'in-consultation' }),
          ])
        );
        const queuesData = await Promise.all(queuePromises);

        const queuesMap = {};
        doctorsData.forEach((doctor, index) => {
          const combined = [
            ...queuesData[index][0],
            ...queuesData[index][1],
          ];

          
          combined.sort((a, b) => {
            
            if (a.status === 'in-consultation' && b.status !== 'in-consultation') return -1;
            if (b.status === 'in-consultation' && a.status !== 'in-consultation') return 1;
            
            const ap = a.priority ?? 999999;
            const bp = b.priority ?? 999999;
            if (ap !== bp) return ap - bp;
            const ad = new Date(a.timeOfArrival || a.createdAt || 0);
            const bd = new Date(b.timeOfArrival || b.createdAt || 0);
            return ad - bd;
          });

          queuesMap[doctor._id] = combined;
        });

        setDoctorQueues(queuesMap);
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch patient queues. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllQueues();
    const interval = setInterval(fetchAllQueues, 30000);
    return () => clearInterval(interval);
  }, [fetchAllQueues]);

  
  useEffect(() => {
    const interval = setInterval(() => {
      setDoctorQueues((prev) => ({ ...prev }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  
  const renderStatusLabel = (patient) => {
    if (patient.status === 'in-consultation') {
      return (
        <span className="status-label status-in-consultation">
          In-Consultation ({formatElapsedTime(patient.timeOfArrival)})
        </span>
      );
    }
    if (patient.status === 'waiting') {
      return <span className="status-label status-waiting">Waiting</span>;
    }
    return <span className="status-label">{patient.status}</span>;
  };

  const handleSeePatient = (patientId) => {
    updatePatient(patientId, { status: 'in-consultation', timeOfArrival: new Date() })
      .then(() => {
        navigate(`/doctor/consultation/${patientId}`);
      })
      .catch(() => {
        alert('Failed to update patient status before starting consultation.');
      });
  };


  const hasExceeded10Minutes = (timeOfArrival) => {
    if (!timeOfArrival) return false;
    const diffMs = new Date() - new Date(timeOfArrival);
    return diffMs > 10 * 60 * 1000; 
  };
    const handleRemovePatient = async (patientId) => {
    if (window.confirm('Are you sure you want to remove this patient from the queue?')) {
      try {
        await cancelPatient(patientId);
        fetchAllQueues(); 
      } catch (err) {
        alert('Failed to remove patient.');
      }
    }
  };



  return (
    <div className="live-queue-container">
      <div className="list-header">
        
        <h1>Live Doctor Queues</h1>
        {userInfo && (userInfo.role === 'Receptionist' || userInfo.role === 'Admin') && (
          <Link to="/reception/add-patient" className="action-button"style={{ marginLeft: 'auto' }}>
            + Add Patient to Queue
          </Link>
        )}
          <Link to="/" className="action-button secondary" >
            ← Back to Dashboard
          </Link>
        
        
        
      </div>

      {loading && <p>Loading all queues...</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="doctor-queues-grid">
        {!loading &&
          doctors.map((doctor) => (
            <div key={doctor._id} className="doctor-queue-card">
              <div className="doctor-header">
                <h3>Dr. {doctor.name}</h3>
                <span className="doctor-specialty">
                  {doctor.specialty}
                </span>
              </div>
              <table className="patients-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Symptoms</th>
                    <th>Status</th>
                    
                    <th>Estimated Wait</th>
                    {(userInfo?.role === 'Receptionist' || userInfo?.role === 'Admin') && (
                       <th>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {doctorQueues[doctor._id] && doctorQueues[doctor._id].length > 0 ? (
                    doctorQueues[doctor._id].map((patient, index, arr) => {
                      let estimatedWaitMin = 0;
                      let overtimeMinutes = null;
                      if (patient.status === 'waiting') {
                        for (let i = 0; i < index; ++i) {
                          if (arr[i].status === 'in-consultation') {
                            const elapsed = getElapsedMinutes(arr[i].timeOfArrival);
                            if (elapsed > DEFAULT_CONSULTATION_MINUTES) {
                              
                              overtimeMinutes = elapsed - DEFAULT_CONSULTATION_MINUTES;
                            } else {
                              estimatedWaitMin += DEFAULT_CONSULTATION_MINUTES - elapsed;
                            }
                          } else if (arr[i].status === 'waiting') {
                            estimatedWaitMin += DEFAULT_CONSULTATION_MINUTES;
                          }
                        }
                        if (estimatedWaitMin === 0 && !overtimeMinutes) estimatedWaitMin = DEFAULT_CONSULTATION_MINUTES;
                      }
                      const isOver10Min =
                        patient.status === 'in-consultation' &&
                        hasExceeded10Minutes(patient.timeOfArrival);

                      return (
                        <tr
                          key={patient._id}
                          className={isOver10Min ? 'overdue-patient' : ''}
                        >
                          <td>{index + 1}</td>
                          <td>{patient.name}</td>
                          <td>{patient.symptoms}</td>
                          
                          <td>{renderStatusLabel(patient)}</td>
                          
                          
                          
                          <td>
                            {patient.status === 'in-consultation'
                              ? 'Now'
                              : overtimeMinutes
                                ? `OVERTIME (${formatWaitTime(overtimeMinutes)})`
                                : formatWaitTime(estimatedWaitMin)}
                          </td>
                          {(userInfo?.role === 'Receptionist' || userInfo?.role === 'Admin') && (
                            <td>
                              <button className="remove-btn" onClick={() => handleRemovePatient(patient._id)}>
                                Remove
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={userInfo?.role === 'Doctor' ? 5 : 6} 
                        className="empty-queue-message"
                      >
                        No patients waiting.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </div>
  );
};

export default LiveQueuePage;