import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMedicines } from '../services/medicineService';
import { getPatientById, updatePatient } from '../services/patientService';
import { addPrescription } from '../services/prescriptionService';
import './ConsultationPage.css';

const ConsultationPage = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();

  const [diagnosis, setDiagnosis] = useState('');
  const [startTime, setStartTime] = useState(null);

  const [patient, setPatient] = useState(null);
  const [allMedicines, setAllMedicines] = useState([]);
  const [notes, setNotes] = useState('');
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [dosage, setDosage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setStartTime(new Date());

    const fetchData = async () => {
      try {
        setLoading(true);
        const [patientData, medicinesData] = await Promise.all([
          getPatientById(patientId),
          getMedicines()
        ]);
        setPatient(patientData);
        setAllMedicines(medicinesData);
        if (medicinesData.length > 0) {
          setSelectedMedicine(medicinesData[0]._id);
        }
      } catch (err) {
        setError('Failed to load consultation data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId]);

  const handleSubmitConsultation = async () => {
    if (!diagnosis) {
      return alert('Please enter a diagnosis before finishing the consultation.');
    }
    if (window.confirm('Are you sure you want to finish this consultation?')) {
      try {
        const prescriptionData = {
          patient: patientId,
          notes,
          diagnosis,
          consultationStartTime: startTime,
          medicines: prescriptionItems.map(item => ({
            medicine: item.medicineId,
            dosage: item.dosage,
            quantity: item.quantity,
          })),
        };
        await addPrescription(prescriptionData);
        alert('Consultation saved successfully!');
        navigate('/');
      } catch (err) {
        setError('Failed to save consultation. Please try again.');
      }
    }
  };

  const handleCancelConsultation = async () => {
    if (window.confirm('Are you sure you want to cancel and return this patient to the queue?')) {
      try {
        await updatePatient(patientId, { status: 'waiting' });
        navigate(-1);
      } catch (err) {
        setError('Failed to return patient to queue. Please try again.');
      }
    }
  };

  const handleAddMedicine = (e) => {
    e.preventDefault();
    if (!selectedMedicine || !dosage) {
      alert('Please select a medicine and provide dosage instructions.');
      return;
    }
    const medicineToAdd = allMedicines.find(m => m._id === selectedMedicine);
    setPrescriptionItems([
      ...prescriptionItems,
      { ...medicineToAdd, medicineId: medicineToAdd._id, dosage, quantity }
    ]);
    setDosage('');
    setQuantity(1);
  };

  const handleRemoveMedicine = (indexToRemove) => {
    setPrescriptionItems(prescriptionItems.filter((_, index) => index !== indexToRemove));
  };


  if (loading) return <p>Loading Consultation...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="consultation-container">
      <div className="patient-banner">
        <h2>Consultation for: {patient?.name}</h2>
        <p><strong>Age:</strong> {patient?.age}</p>
        <p><strong>Symptoms:</strong> {patient?.symptoms}</p>
      </div>

      <div className="consultation-grid">
        <div className="consultation-panel">
          <h3>Diagnosis</h3>
          <input
            type="text"
            className="diagnosis-input"
            placeholder="e.g., Common Cold, Viral Fever"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            required
          />
          <h3 style={{ marginTop: '1.5rem' }}>Consultation Notes</h3>
          <textarea
            className="notes-textarea"
            rows="15"
            placeholder="Write your consultation notes here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          ></textarea>
        </div>

        <div className="consultation-panel">
          <h3>Create Prescription</h3>
          <form className="prescription-form" onSubmit={handleAddMedicine}>
            <div className="form-group">
              <label>Medicine</label>
              <select value={selectedMedicine} onChange={(e) => setSelectedMedicine(e.target.value)}>
                {allMedicines.map(med => (
                  <option key={med._id} value={med._id}>{med.name} ({med.type})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
            <div className="form-group full-width">
              <label>Dosage Instructions</label>
              <input type="text" placeholder="e.g., 1 tablet, 3 times a day for 7 days" value={dosage} onChange={(e) => setDosage(e.target.value)} required />
            </div>
            <button type="submit" className="action-button primary">+ Add to Prescription</button>
          </form>

          <h4>Prescribed Medicines</h4>
          <table className="prescription-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Qty</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {prescriptionItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.dosage}</td>
                  <td>{item.quantity}</td>
                  <td><button className="remove-btn-small" onClick={() => handleRemoveMedicine(index)}>X</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="actions-bar">
        <button className="cancel-consult-button" onClick={handleCancelConsultation}>
          Cancel & Return to Queue
        </button>
        <button className="finish-button" onClick={handleSubmitConsultation}>
          Save & Finish Consultation
        </button>
      </div>
    </div>
  );
};

export default ConsultationPage;
