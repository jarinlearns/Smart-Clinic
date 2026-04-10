import React, { useState } from 'react';
import { selfEnroll } from '../services/patientService';
import './SharedModal.css';

const EnrollmentModal = ({ doctor, onClose, onSuccess }) => {
  const [symptoms, setSymptoms] =useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!doctor) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await selfEnroll({
        symptoms,
        assignedDoctor: doctor._id,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request consultation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Request Consultation with Dr. {doctor.name}</h2>
          
        </div>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}
          <div className="form-group">
            <h1></h1>
            <textarea
            
              id="symptoms"
              rows="5"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Please describe your symptoms. e.g., Fever, headache, and a sore throat for the last 2 days."
              required
            />
          </div>
          <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="fill-button" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrollmentModal;