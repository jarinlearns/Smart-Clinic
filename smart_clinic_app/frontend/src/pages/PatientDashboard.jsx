import React, { useState, useEffect, useMemo } from 'react';
import { getDoctors } from '../services/userService';
import EnrollmentModal from '../components/EnrollmentModal';
import './PatientDashboard.css';
import { useNavigate, Link } from 'react-router-dom';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const PatientDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [aiSymptoms, setAiSymptoms] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [isRecommending, setIsRecommending] = useState(false);
  useEffect(() => {
    const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (storedUserInfo) {
      setUserInfo(storedUserInfo);
    }

    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const data = await getDoctors();
        setDoctors(data);
      } catch (err) {
        setError('Failed to fetch doctor list.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const filteredDoctors = useMemo(() => {
    if (!searchTerm) return doctors;
    return doctors.filter(doc =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [doctors, searchTerm]);
  
  const handleOpenModal = (doctor) => {
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedDoctor(null);
    setIsModalOpen(false);
  };

  const handleEnrollSuccess = () => {
    setSuccessMessage(`Your request has been submitted! A receptionist will review and add you to the queue shortly.`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleRecommendation = async () => {
    if (!aiSymptoms) return;
    setIsRecommending(true);
    setAiRecommendation('');

    const doctorsInfo = doctors.map(doc => ({
      name: doc.name,
      specialty: doc.specialty,
    }));

    const prompt = `You are a helpful clinic assistant. A patient has the following symptoms: "${aiSymptoms}".
    Based on these symptoms, which doctor from the following list would be the most appropriate?
    List of available doctors: ${JSON.stringify(doctorsInfo)}.
    Analyze the symptoms and the doctors' specialties.
    Respond with a single, concise sentence starting with "Based on your symptoms, we recommend Dr. ..." followed by the doctor's name and specialty.
    If no specialty is a clear match, suggest the patient let the receptionist decide. Do not invent a new specialty.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const data = await response.json();
      const recommendationText = data.candidates[0].content.parts[0].text;
      setAiRecommendation(recommendationText);
    } catch (err) {
      setAiRecommendation('Sorry, the AI assistant is currently unavailable. Please choose a doctor from the list.');
    } finally {
      setIsRecommending(false);
    }
  };



  return (
    <div className="patient-dashboard-container">
      <h1>Welcome, {userInfo?.name}</h1>
      <p>Find a doctor and request a consultation.</p>
      
      
      {successMessage && <p className="success-message">{successMessage}</p>}
      <div className="ai-recommender-card">
        <h3>AI Assistant</h3>
        <p>Not sure which doctor to see? Describe your symptoms below.</p>
        <div className="ai-form">
          <textarea
            rows="3"
            placeholder="e.g., I have a persistent cough and a high fever..."
            value={aiSymptoms}
            onChange={(e) => setAiSymptoms(e.target.value)}
          />
          <button className="action-button secondary"
          onClick={handleRecommendation} disabled={isRecommending}>
            {isRecommending ? 'Thinking...' : 'Get Recommendation'}
          </button>
        </div>
        {aiRecommendation && (
          <div className="ai-recommendation">
            <p>{aiRecommendation}</p>
          </div>
        )}
      </div>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by doctor's name or specialty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <h2>Our Doctors</h2>
      {loading ? <p>Loading doctors...</p> : error ? <p className="error-message">{error}</p> : (
        <div className="doctors-grid">
          {filteredDoctors.map(doctor => (
              <div key={doctor._id} className="doctor-card">
                <h3>Dr. {doctor.name}</h3>
                <p className="doctor-specialty">{doctor.specialty}</p>
                <div className="doctor-fee">
                  <span>Consultation Fee:</span>
                  <strong>{doctor.consultationFee?.toFixed(2) || 'N/A'} BDT</strong>
                </div>
                <button className="request-consult-btn" onClick={() => handleOpenModal(doctor)}>
                  Request Consultation
                </button>
              </div>
            ))}
        </div>
      )}

      {isModalOpen && (
        <EnrollmentModal 
          doctor={selectedDoctor}
          onClose={handleCloseModal}
          onSuccess={handleEnrollSuccess}
        />
      )}
    </div>
  );
};

export default PatientDashboard;