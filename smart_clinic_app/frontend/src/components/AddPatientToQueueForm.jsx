import React, { useState } from 'react';
import { addWalkInPatient } from '../services/queueService';
import './AddPatientForm.css';

const AddPatientToQueueForm = ({ onPatientAdded }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const patientData = { name, age: Number(age), symptoms };
      
      const newPatient = await addWalkInPatient(patientData);
      
      setSuccess(`Patient "${name}" added to the queue!`);
      setName('');
      setAge('');
      setSymptoms('');
      

      if (onPatientAdded) {
        onPatientAdded(newPatient);
      }

    } catch (err) {
      setError('Failed to add patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-patient-form-container">
      <h2>Add Walk-in Patient to Queue</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={submitHandler} className="inline-form">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="age">Age</label>
          <input type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
        </div>
        <div className="form-group symptoms-group">
          <label htmlFor="symptoms">Symptoms</label>
          <input type="text" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="e.g., High fever, cough" required />
        </div>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Adding...' : 'Add to Queue'}
        </button>
      </form>
    </div>
  );
};

export default AddPatientToQueueForm;
