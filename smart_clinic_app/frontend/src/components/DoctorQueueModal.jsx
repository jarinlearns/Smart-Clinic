import React, { useState, useEffect } from 'react';
import api from '../api';
import './DoctorQueueModal.css'; 
const DoctorQueueModal = ({ doctor, onClose }) => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorQueue = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
          params: {
            doctorId: doctor._id,
            status: 'waiting'
          }
        };

        const { data } = await api.get('/patients', config);
        setQueue(data.reverse());
        setLoading(false);
      } catch (error) {
        console.error("Error fetching queue", error);
        setLoading(false);
      }
    };

    if (doctor) {
      fetchDoctorQueue();
    }
  }, [doctor]);

  const handleOverlayClick = (e) => {
    if (e.target.className === 'queue-modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="queue-modal-overlay" onClick={handleOverlayClick}>
      <div className="queue-modal-container">
        
        {/* Header */}
        <div className="queue-modal-header">
          <h2>Queue for Dr. {doctor.name}</h2>
          <button onClick={onClose} className="queue-close-btn">&times;</button>
        </div>
        
        {/* Body */}
        <div className="queue-modal-body">
          {loading ? (
            <div className="empty-queue-msg">Loading patient queue...</div>
          ) : queue.length === 0 ? (
            <div className="empty-queue-msg">
              <p>No patients currently waiting.</p>
            </div>
          ) : (
            <table className="queue-data-table">
              <thead>
                <tr>
                  <th style={{width: '10%'}}>#</th>
                  <th style={{width: '35%'}}>Patient Name</th>
                  <th style={{width: '55%'}}>Symptoms</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((patient, index) => (
                  <tr key={patient._id}>
                    <td className="queue-pos">{index + 1}</td>
                    <td>{patient.name}</td>
                    <td>{patient.symptoms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer */}
        <div className="queue-modal-footer">
          <button onClick={onClose} className="queue-btn-close">Close Queue</button>
        </div>

      </div>
    </div>
  );
};

export default DoctorQueueModal;