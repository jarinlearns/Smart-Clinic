import React, { useState, useEffect } from 'react';
import api from '../api';
import './SharedModal.css';

const AddMedicineModal = ({ onClose, onMedicineAdded }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [quantityInStock, setQuantityInStock] = useState(0);
  const [supplier, setSupplier] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [procurementCost, setProcurementCost] = useState(0);
  const [salePrice, setSalePrice] = useState(0);


  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        };
        const { data } = await api.get('/suppliers', config);
        setSuppliers(data);
        setSupplier(data[0]._id);
      } catch (err) {
        setError('Could not fetch suppliers.');
      }
    };
    fetchSuppliers();
  }, []);

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
      
      const medicineData = { 
          name, type, category, quantityInStock, supplier, 
          procurementCost, salePrice, expiryDate
      };
      const { data } = await api.post('/medicines', medicineData, config);
      onMedicineAdded(data);
      onClose();
    } catch (err) {
      setError('Failed to create medicine.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New Medicine</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={submitHandler}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Type</label>
            <input type="text" value={type} onChange={(e) => setType(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input type="number" value={quantityInStock} onChange={(e) => setQuantityInStock(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Procurement Cost (per unit)</label>
            <input type="number" step="0.01" value={procurementCost} onChange={(e) => setProcurementCost(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Sale Price (per unit)</label>
            <input type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required />
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
            <button type="submit" className="add-button">Add Medicine</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicineModal;