import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './SupplierPage.css';

const useSortableData = (items, config = { key: 'name', direction: 'ascending' }) => {
  const [sortConfig, setSortConfig] = useState(config);

  const sortedItems = useMemo(() => {
    if (!items) return [];
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = sortConfig.key.split('.').reduce((o, i) => o?.[i], a);
        const bValue = sortConfig.key.split('.').reduce((o, i) => o?.[i], b);

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};


const SupplierPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', email: '' });
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = useMemo(() => {
    if (!searchTerm) {
      return suppliers;
    }
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contact?.email && supplier.contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [suppliers, searchTerm]);
  const { items: sortedSuppliers, requestSort, sortConfig } = useSortableData(filteredSuppliers);

  const getSortIndicator = (name) => {
    if (!sortConfig || sortConfig.key !== name) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  const fetchSuppliers = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await api.get('/suppliers', config);
      setSuppliers(data);
    } catch (err) {
      setError('Failed to fetch suppliers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!name) {
      return alert('Supplier name is required.');
    }
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await api.post('/suppliers', { name, phone, email }, config);
      setName('');
      setPhone('');
      setEmail('');
      fetchSuppliers(); 
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add supplier.');
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await api.delete(`/suppliers/${id}`, config);
        fetchSuppliers();
      } catch (err) {
        setError('Could not delete supplier. They may be linked to existing medicines.');
      }
    }
  };

  const handleEditClick = (supplier) => {
    setEditingId(supplier._id);
    setEditFormData({
      name: supplier.name,
      phone: supplier.contact?.phone || '',
      email: supplier.contact?.email || '',
    });
  };

  const handleCancelClick = () => {
    setEditingId(null);
  };

  const handleFormChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSaveClick = async (id) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await api.put(`/suppliers/${id}`, editFormData, config);
      setEditingId(null);
      fetchSuppliers();
    } catch (err) {
      setError('Failed to update supplier.');
    }
  };

  return (
    <div className="supplier-container">
      <div className="list-header">
        <h1>Manage Suppliers</h1>
        <button onClick={() => navigate('/')} className="action-button secondary">
          ← Back to Dashboard
        </button>
      </div>

      <div className="card">
        <h3>Add a New Supplier</h3>
        <form className="add-supplier-form" onSubmit={handleAddSupplier}>
          <div className="form-row">
            <input type="text" placeholder="Supplier Name*" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="tel" placeholder="Contact Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input type="email" placeholder="Contact Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="action-button">+ Add Supplier</button>
        </form>
      </div>

      <h3>Current Suppliers</h3>
      
      <div className="search-bar-container supplier-search">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? <p>Loading suppliers...</p> : error ? <p className="error-message">{error}</p> : (
        <table className="supplier-table">
          <thead>
            <tr>
              <th className="sortable-header"><button type="button" onClick={() => requestSort('name')}>Name{getSortIndicator('name')}</button></th>
              <th className="sortable-header"><button type="button" onClick={() => requestSort('contact.phone')}>Phone{getSortIndicator('contact.phone')}</button></th>
              <th className="sortable-header"><button type="button" onClick={() => requestSort('contact.email')}>Email{getSortIndicator('contact.email')}</button></th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedSuppliers.map((supplier) => (
              <tr key={supplier._id}>
                {editingId === supplier._id ? (
                  <>
                    <td><input type="text" name="name" value={editFormData.name} onChange={handleFormChange} className="inline-edit-input" /></td>
                    <td><input type="tel" name="phone" value={editFormData.phone} onChange={handleFormChange} className="inline-edit-input" /></td>
                    <td><input type="email" name="email" value={editFormData.email} onChange={handleFormChange} className="inline-edit-input" /></td>
                    <td className="td-actions">
                      <button onClick={() => handleSaveClick(supplier._id)} className="table-action-button save-button">Save</button>
                      <button onClick={handleCancelClick} className="table-action-button cancel-button">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{supplier.name}</td>
                    <td>{supplier.contact?.phone || 'N/A'}</td>
                    <td>{supplier.contact?.email || 'N/A'}</td>
                    <td className="td-actions">
                      <button onClick={() => handleEditClick(supplier)} className="table-action-button edit-button">Edit</button>
                      <button onClick={() => handleDeleteSupplier(supplier._id)} className="table-action-button delete-button">Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SupplierPage;