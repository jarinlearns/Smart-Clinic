import React, { useState } from 'react';
import api from '../api';
import './SharedModal.css';

const AddStockModal = ({ medicine, suppliers, onClose, onStockAdded }) => {
  if (!medicine) return null;

  const [quantityAdded, setQuantityAdded] = useState(1);
  const [costPerUnit, setCostPerUnit] = useState(medicine?.procurementCost || 0);
  const [expiryDate, setExpiryDate] = useState('');
  const [supplier, setSupplier] = useState(medicine?.supplier?._id || suppliers[0]?._id || '');
  const [error, setError] = useState('');

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const stockData = {
          quantityAdded: Number(quantityAdded),
          costPerUnit: Number(costPerUnit),
          supplier,expiryDate,
      };
      await api.patch(`/medicines/${medicine._id}/addstock`, stockData, config);
      onStockAdded();
      onClose();
    } catch (err) {
      setError('Failed to add stock.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add Stock for: {medicine.name}</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={submitHandler}>
          <div className="form-group">
            <label>Quantity to Add</label>
            <input type="number" min="1" value={quantityAdded} onChange={(e) => setQuantityAdded(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Cost Per Unit (for this batch)</label>
            <input type="number" step="0.01" value={costPerUnit} onChange={(e) => setCostPerUnit(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Expiry Date</label>
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
          </div>
           <div className="form-group">
            <label>Supplier</label>
            <select value={supplier} onChange={(e) => setSupplier(e.target.value)} required>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="add-button">Log Purchase</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockModal;