
import { getDoctorStats, getDoctorIncomeStats } from '../services/userService';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getPatients,updatePatient,cancelPatient  } from '../services/patientService';
import './DoctorDashboard.css';

const sortQueue = (arr = []) =>
  [...arr].sort((a, b) => {
    const ap = a.priority ?? 999999;
    const bp = b.priority ?? 999999;
    if (ap !== bp) return ap - bp; 
    const ad = new Date(a.timeOfArrival || a.createdAt || 0);
    const bd = new Date(b.timeOfArrival || b.createdAt || 0);
    return ad - bd;
  });

const DoctorDashboard = () => {
  const [myQueue, setMyQueue] = useState([]);
  const [completedToday, setCompletedToday] = useState([]);
  const [stats, setStats] = useState({ averageTime: 0, commonDiagnoses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [incomeStats, setIncomeStats] = useState({ totalEarnings: 0 });

  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async (doctorInfo) => {
    if (!doctorInfo) return;
    try {
      setLoading(true);

      const [waitingQueue, inConsultationQueue, allMyDonePatients, doctorStats, incomeData] = await Promise.all([
        getPatients({ doctorId: doctorInfo._id, status: 'waiting' }),
        getPatients({ doctorId: doctorInfo._id, status: 'in-consultation' }),
        getPatients({ doctorId: doctorInfo._id, status: 'done' }),
        getDoctorStats(doctorInfo._id),
        getDoctorIncomeStats(doctorInfo._id),
      ]);

      const combinedQueue = [...waitingQueue, ...inConsultationQueue];
      setMyQueue(sortQueue(combinedQueue || []));
      setStats(doctorStats || {});
      setIncomeStats(incomeData || {});

      const today = new Date().toISOString().slice(0, 10);
      const todayPatients = (allMyDonePatients || []).filter(p => (p.updatedAt || '').slice(0, 10) === today);
      setCompletedToday(todayPatients);
      setError('');
    } catch {
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (storedUserInfo) {
      setUserInfo(storedUserInfo);
      fetchDashboardData(storedUserInfo);
      const interval = setInterval(() => fetchDashboardData(storedUserInfo), 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
      setError('Could not find user information.');
    }
  }, [fetchDashboardData]);

const handleStartConsultation = async (patientId) => {
    try {
      const selectedPatient = myQueue.find((p) => p._id === patientId);
      if (!selectedPatient) return;

      await updatePatient(patientId, {
        status: 'in-consultation',
        timeOfArrival: new Date().toISOString()
      });

      navigate(`/doctor/consultation/${patientId}`);
    } catch (err) {
      console.error('Error in handleStartConsultation:', err);
    }
  };
    const handleRemovePatient = async (patientId) => {
    if (window.confirm('Are you sure you want to remove this patient from your queue?')) {
      try {
        await cancelPatient(patientId);
        setMyQueue(prevQueue => prevQueue.filter(p => p._id !== patientId));
      } catch (err) {
        alert('Failed to remove patient.');
      }
    }
  };
  return (
    <div className="doctor-dashboard">
      <h1>Welcome back, Dr. {userInfo?.name}</h1>
      <div className="quick-actions">
        <Link to="/doctor/history" className="action-button">
          View Consultation History
        </Link>

      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <h3 className="card-title">Patients in My Queue</h3>
          <p className="card-number">{loading ? '...' : myQueue.length}</p>
        </div>
        <div className="stat-card">
          <h3 className="card-title">Patients Seen Today</h3>
          <p className="card-number">{loading ? '...' : completedToday.length}</p>
        </div>
        <div className="stat-card">
          <h3 className="card-title">Avg. Consult Time</h3>
          <p className="card-number">{loading ? '...' : `${(stats.averageTime || 0).toFixed(1)} min`}</p>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h2>My Queue — Up Next</h2>
          {loading ? <p>Loading queue...</p> : (
            <ul className="item-list">
              {myQueue.length > 0 ? (
                myQueue.map((patient) => (
                  <li key={patient._id}>
                    <span className="item-name">{patient.name}</span>
                    <span className="item-symptoms">
                      {patient.symptoms}
                    </span>
                    <button className="start-consult-btn" onClick={() => handleStartConsultation(patient._id)}>
                      Start Consultation
                    </button>
                    <button className="remove-btn" onClick={() => handleRemovePatient(patient._id)}>
                        Remove
                      </button>
                  </li>
                ))
              ) : (
                <p>Your queue is empty.</p>
              )}
            </ul>
          )}
        </div>

        <div className="dashboard-panel">
          <h2>Most Common Diagnoses (Today)</h2>
          {loading ? <p>Loading stats...</p> : (
            <ul className="item-list">
              {(stats.commonDiagnoses || []).length > 0 ? (
                stats.commonDiagnoses.map(diag => (
                  <li key={diag._id}>
                    <span className="item-name">{diag._id}</span>
                    <span className="item-count">{diag.count} case(s)</span>
                  </li>
                ))
              ) : (
                <p>No diagnoses recorded yet today.</p>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
