import React, { useState, useEffect } from 'react';
import api from '../api';

const EditMedicineModal = ({ medicineId, onClose, onMedicineUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    category: '',
    quantityInStock: 0,
    supplier: '',
  });
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

        const { data: medicineData } = await api.get(`/medicines/${medicineId}`, config);
        setFormData({
          name: medicineData.name,
          type: medicineData.type,
          category: medicineData.category,
          quantityInStock: medicineData.quantityInStock,
          supplier: medicineData.supplier._id,
        });
        
        const tempSupplier = { _id: "68927b58e0f0f00c0959e4b1", name: "Pharma Inc."};
        setSuppliers([tempSupplier, { _id: 'another_id', name: 'Another Supplier' }]); 
        

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data.');
        setLoading(false);
      }
    };
    fetchData();
  }, [medicineId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` } };
      
      await axios.put(`http://localhost:5000/api/medicines/${medicineId}`, formData, config);
      
      onMedicineUpdated(); 
      onClose(); 
    } catch (err) {
      setError('Failed to update medicine.');
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h2>Edit Medicine</h2>
        {loading ? <p>Loading...</p> : error ? <p style={{color: 'red'}}>{error}</p> : (
          <form onSubmit={submitHandler}>
            <div>
              <label>Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div>
              <label>Type</label>
              <input type="text" name="type" value={formData.type} onChange={handleChange} required />
            </div>
            <div>
              <label>Category</label>
              <input type="text" name="category" value={formData.category} onChange={handleChange} required />
            </div>
            <div>
              <label>Quantity</label>
              <input type="number" name="quantityInStock" value={formData.quantityInStock} onChange={handleChange} required />
            </div>
            <div>
              <label>Supplier</label>
              <select name="supplier" value={formData.supplier} onChange={handleChange} required>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <button type="submit">Update Medicine</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </form>
        )}
      </div>
    </div>
  );
};



export default EditMedicineModal;