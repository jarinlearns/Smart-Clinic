import React from 'react'; 
import './SharedModal.css'; 


const ConsultationDetailsModal = ({ prescription, onClose }) => {
  if (!prescription) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content prescription-modal">
        <div className="modal-header">
          <h2>Consultation Details</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        
        <div className="prescription-details-grid">
          <div><strong>Patient:</strong> {prescription.patient?.name} (Age: {prescription.patient?.age})</div>
          <div><strong>Date:</strong> {new Date(prescription.createdAt).toLocaleString()}</div>
        </div>

        <div className="prescription-section">
          <h4>Diagnosis:</h4>
          <p className="notes-box">{prescription.diagnosis || 'No diagnosis provided.'}</p>
        </div>

        <div className="prescription-section">
          <h4>Consultation Notes:</h4>
          <p className="notes-box">{prescription.notes || 'No notes provided.'}</p>
        </div>

        <div className="prescription-section">
            <h4>Medicines Prescribed:</h4>
            <table className="medicines-prescribed-table">
                <thead>
                    <tr>
                        <th>Medicine</th>
                        <th>Quantity</th>
                        <th>Dosage</th>
                    </tr>
                </thead>
                <tbody>
                    {prescription.medicines.map((item, index) => (
                        <tr key={index}>
                            <td>{item.medicine?.name || 'N/A'}</td>
                            <td>{item.quantity}</td>
                            <td>{item.dosage}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="cancel-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ConsultationDetailsModal;