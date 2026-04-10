import { useEffect, useState } from 'react';
import { addPatient, getPatients, getUsers, updatePatient, deletePatient  } from '../services/patientService';
import api from '../api';
import { useLocation, useNavigate, Link } from 'react-router-dom';

import './AddPatientPage.css';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const extractJSONArray = (text = "") => {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch { }
  }
  try { return JSON.parse(text); } catch { }
  return [];
};

const AddPatientPage = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [assignedDoctor, setAssignedDoctor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const location = useLocation();
  const pendingPatient = location.state?.pendingPatient;
  const navigate = useNavigate();
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const doctorsData = await getUsers('Doctor');
        setDoctors(doctorsData || []);
      if (!pendingPatient && (doctorsData || []).length > 0) {
          setAssignedDoctor(doctorsData[0]._id);
        }
      } catch {
        setError('Could not fetch the list of doctors.');
      }
    };
    fetchDoctors();
  }, []);
    useEffect(() => {
    if (pendingPatient) {
      setName(pendingPatient.name || '');
      setAge(pendingPatient.age || '');
      setSymptoms(pendingPatient.symptoms || '');
      setPhone(pendingPatient.contact?.phone || '');
      setEmail(pendingPatient.contact?.email || '');
      if (pendingPatient.assignedDoctor) {
        setAssignedDoctor(pendingPatient.assignedDoctor._id);
      }
    }
  }, [pendingPatient]);


  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const currentQueue = await getPatients({ doctorId: assignedDoctor, status: "waiting" });

      const patientToAdd = {
        _id: 'temp_' + Date.now(),
        name,
        age: Number(age),
        symptoms,
        phone,
        email,
        assignedDoctor,
        priority: 0,
        createdAt: new Date().toISOString()
      };

      const queueForAnalysis = [...currentQueue, patientToAdd];

      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text:
 `You are a Smart Clinic assistant responsible for triaging patients. Reorder the provided patient queue based on the severity of their symptoms using the following strict priority levels.

Priority Guidelines:
1.  **Life-threatening:** (e.g., chest pain, difficulty breathing, severe bleeding, stroke symptoms) - HIGHEST PRIORITY.
2.  **Severe:** (e.g., suspected fractures, severe abdominal pain, high fever) - HIGH PRIORITY.
3.  **Moderate:** (e.g., sprains, non-severe infections, persistent migraines) - MEDIUM PRIORITY.
4.  **Minor:** (e.g., common cold, minor cuts, slight pain, minor bump) - LOW PRIORITY.
5.  **Non-medical / Trivial:** Any entry that does not describe a real medical symptom (e.g., "nothing", "none", "just a checkup", "ate spicy food", "feeling fine") MUST be given the **ABSOLUTE LOWEST PRIORITY** and placed at the very end of the queue.

Your primary task is to correctly rank based on these guidelines. Patients with non-symptoms must always be last.

Return ONLY a pure JSON array of the SAME patient objects you receive, reordered by urgency. Do NOT add or remove fields. Do NOT wrap in markdown.
Queue:
${JSON.stringify(queueForAnalysis.map(p => ({
                    _id: p._id,
                    name: p.name,
                    age: p.age,
                    symptoms: p.symptoms,
                    priority: p.priority,
                    createdAt: p.createdAt,
                    timeOfArrival: p.timeOfArrival
                  })))}
`
              }]
            }]
          }),
        }
      );

      const data = await aiRes.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      let reorderedQueue = extractJSONArray(raw);



      
      if (!Array.isArray(reorderedQueue) || reorderedQueue.length !== queueForAnalysis.length) {
        throw new Error("AI failed to return a valid reordered queue. Please try again.");
      }
      
      const updatePromises = reorderedQueue.map((patientInQueue, index) => {
        const priority = index + 1;

        if (patientInQueue._id === patientToAdd._id) {
          return addPatient({
            name,
            age: Number(age),
            symptoms,
            phone,
            email,
            assignedDoctor,
            priority, 
          });
        } 
        else {
          return updatePatient(patientInQueue._id, { priority });
        }
      });
      
      await Promise.all(updatePromises);
      if (pendingPatient) {
        await deletePatient(pendingPatient._id);
      }
      setSuccess(`Patient "${name}" added and queue reordered by urgency.`);
      setName('');
      setAge('');
      setSymptoms('');
      setPhone('');
      setEmail('');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to add & reorder.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <div className="add-patient-container">


      <div className="form-card">
        <div className="list-header">
        <h1>Add Walk-in Patient
          </h1>
                  <Link to="/" className="action-button secondary">
          ← Back to Dashboard
        </Link>
        </div>


        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <form onSubmit={submitHandler}>
          <div className="form-group">
            <label htmlFor="name">Patient Name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="age">Age</label>
            <input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="doctor">Assign to Doctor</label>
            <select id="doctor" value={assignedDoctor} onChange={(e) => setAssignedDoctor(e.target.value)} required>
              {doctors.length > 0 ? (
                doctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    Dr. {doc.name} ({doc.specialty})
                  </option>
                ))
              ) : (
                <option disabled>Loading doctors...</option>
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone (optional)</label>
            <input id="phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email (optional)</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="form-group">
            <label htmlFor="symptoms">Symptoms</label>
            <textarea id="symptoms" rows="4" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} required />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Reordering…' : 'Add Patient to Queue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPatientPage;

