import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPrescriptions } from '../services/prescriptionService'; 
import ConsultationDetailsModal from '../components/ConsultationDetailsModal';
import './ConsultationHistoryPage.css'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AllConsultationHistory = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPrescriptions();
      setPrescriptions(data);
    } catch (err) {
      setError('Failed to fetch consultation history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);
  
  const handleViewDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedPrescription(null);
    setIsModalOpen(false);
  };

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return prescriptions;
    return prescriptions.filter(item =>
      item.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.doctor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item._id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [prescriptions, searchTerm]);

  const handleDownloadCSV = () => {
    const headers = ['Date', 'Patient', 'Doctor', 'Prescription ID', 'Diagnosis', 'Status'];
    const rows = filteredHistory.map(item => [
      new Date(item.createdAt).toLocaleDateString(),
      item.patient?.name || 'N/A',
      item.doctor?.name || 'N/A',
      item._id,
      item.diagnosis,
      item.status
    ]);
    let csvContent = [headers, ...rows].map(e => e.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_consultation_history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Consultation History', 14, 18);

    const headers = [
      ['Date', 'Patient', 'Doctor', 'Prescription ID', 'Diagnosis', 'Status']
    ];
    const rows = filteredHistory.map(item => [
      new Date(item.createdAt).toLocaleDateString(),
      item.patient?.name || 'N/A',
      item.doctor?.name || 'N/A',
      item._id,
      item.diagnosis,
      item.status
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 24,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [22, 160, 133], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { left: 14, right: 14 }
    });

    doc.save('all_consultation_history.pdf');
  };

  return (
    <div className="consultation-history-container">
      <div className="list-header">
        <h1>All Consultation History</h1>
        <Link to="/" className="action-button secondary">
          ← Back to Dashboard
        </Link>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button className="action-button" onClick={handleDownloadCSV}>Export CSV</button>
        <button className="action-button" onClick={handleDownloadPDF}>Export PDF</button>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by patient, doctor, prescription ID or diagnosis..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? <p>Loading history...</p> : error ? <p className="error-message">{error}</p> : (
        <div className="table-card">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Prescription ID</th>
                <th>Diagnosis</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item._id}>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>{item.patient?.name || 'N/A'}</td>
                  <td>Dr. {item.doctor?.name || 'N/A'}</td>
                  <td>{item._id}</td>
                  <td>{item.diagnosis}</td>
                  <td>
                    <span className={`status-badge status-${item.status.toLowerCase().replace(' ', '-')}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button className="view-details-btn" onClick={() => handleViewDetails(item)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {isModalOpen && (
        <ConsultationDetailsModal
          prescription={selectedPrescription}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default AllConsultationHistory;