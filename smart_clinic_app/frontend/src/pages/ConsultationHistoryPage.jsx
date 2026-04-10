import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyPrescriptionHistory } from '../services/prescriptionService';
import './ConsultationHistoryPage.css'; 
import ConsultationDetailsModal from '../components/ConsultationDetailsModal'; 

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ConsultationHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyPrescriptionHistory();
      setHistory(data);
    } catch (err) {
      setError('Failed to fetch consultation history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredHistory = useMemo(() => {
    if (!searchTerm) return history;
    return history.filter(item =>
      item.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);
  const handleViewDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedPrescription(null);
    setIsModalOpen(false);
  };

  
  const exportCSV = () => {
    const headers = ['Date', 'Patient', 'Diagnosis', 'Status'];
    const rows = filteredHistory.map(item => [
      new Date(item.createdAt).toLocaleDateString(),
      `"${(item.patient?.name || 'N/A').replace(/"/g, '""')}"`,
      `"${item.diagnosis.replace(/"/g, '""')}"`,
      item.status
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'Consultation_History.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  
  const exportPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(18);
    doc.text('My Consultation History', 40, 40);

    doc.setFontSize(12);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 40, 60);

    autoTable(doc, {
      startY: 80,
      head: [['Date', 'Patient', 'Diagnosis', 'Status']],
      body: filteredHistory.map(item => [
        new Date(item.createdAt).toLocaleDateString(),
        item.patient?.name || 'N/A',
        item.diagnosis,
        item.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [54, 162, 235] },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 120 },
        2: { cellWidth: 200 },
        3: { cellWidth: 60 }
      },
      margin: { left: 40, right: 40 }
    });

    doc.save('Consultation_History.pdf');
  };

  return (
    <div className="consultation-history-container">
      <div className="list-header">
        <h1>My Consultation History</h1>
        <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
          <button onClick={exportCSV} className="action-button">Export CSV</button>
          <button onClick={exportPDF} className="action-button">Export PDF</button>
                  <Link to="/" className="action-button secondary">
          ← Back to Dashboard
        </Link>
        </div>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by patient name or diagnosis..."
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

export default ConsultationHistoryPage;