import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; 
import { getPendingApprovals, cancelPatient } from '../services/patientService'; 
import './PendingApprovalsPage.css';

const PendingApprovalsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPendingApprovals();
      setRequests(data);
    } catch (err) {
      setError('Failed to fetch pending requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

    const handleRemoveRequest = async (patientId) => {
    if (window.confirm('Are you sure you want to remove this consultation request?')) {
      try {
        await cancelPatient(patientId);
        setRequests(prevRequests => prevRequests.filter(req => req._id !== patientId));
      } catch (err) {
        alert('Failed to remove the request.');
      }
    }
  };

  return (
    <div className="billing-container">
      <div className="list-header">
        <h1>Pending Consultation Requests</h1>
        <Link to="/" className="action-button secondary">
          ← Back to Dashboard
        </Link>
      </div>
      
      {loading ? <p>Loading...</p> : error ? <p className="error-message">{error}</p> : (
        <div className="table-card">
          <table className="billing-table">
            <thead>
              <tr>
                <th>Request Time</th>
                <th>Patient Name</th>
                <th>Symptoms</th>
                <th>Requested Doctor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map(req => (
                  <tr key={req._id}>
                    <td>{new Date(req.createdAt).toLocaleString()}</td>
                    <td>{req.name}</td>
                    <td>{req.symptoms}</td>
                    <td>Dr. {req.assignedDoctor?.name || 'Any'}</td>
                    <td className="actions-cell"> 
                      <Link
                        to="/reception/add-patient"
                        state={{ pendingPatient: req }}
                        className="action-link approve"
                      >
                        Review & Add to Queue
                      </Link>
                      <button
                        className="action-link remove"
                        onClick={() => handleRemoveRequest(req._id)}
                      >
                        Remove
                      </button>     
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5">No pending requests.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PendingApprovalsPage;