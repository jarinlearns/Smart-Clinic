import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api';
import './PatientListPage.css';
import { useNavigate, Link } from 'react-router-dom';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PatientListPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', age: '', symptoms: '', phone: '', email: '' });

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true); 
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      const { data } = await api.get(
        `/patients?sort=${sortConfig.key}&order=${sortConfig.direction === 'ascending' ? 'asc' : 'desc'}`, 
        config
      );
      
      setPatients(data);
      setError(''); 
    } catch (err) {
      setError('Failed to fetch patients. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [sortConfig]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]); 

  const filteredPatients = useMemo(() => {
    if (!searchTerm) {
      return patients;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return patients.filter(p => 
      p.name.toLowerCase().includes(lowercasedTerm) ||
      p.symptoms.toLowerCase().includes(lowercasedTerm) ||
      (p.contact?.phone && p.contact.phone.includes(searchTerm)) ||
      (p.contact?.email && p.contact.email.toLowerCase().includes(lowercasedTerm))
    );
  }, [patients, searchTerm]);
  
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient record?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await api.delete(`/patients/${id}`, config);
        fetchPatients();
      } catch (err) {
        setError('Could not delete patient.');
      }
    }
  };
  
  const handleSaveClick = async (id) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` } };
      const { name, age, symptoms, phone, email } = editFormData;
      await api.put(`/patients/${id}`, { name, age, symptoms, phone, email }, config);
      setEditingId(null);
      fetchPatients();
    } catch (err)      {
      setError('Failed to update patient.');
    }
  };

  const getSortIndicator = (name) => { if (sortConfig.key !== name) return null; return sortConfig.direction === 'ascending' ? '▲' : '▼'; };
  const handleEditClick = (patient) => { setEditingId(patient._id); setEditFormData({ name: patient.name, age: patient.age, symptoms: patient.symptoms, phone: patient.contact?.phone || '', email: patient.contact?.email || ''}); };
  const handleCancelClick = () => { setEditingId(null); };
  const handleFormChange = (e) => { setEditFormData({ ...editFormData, [e.target.name]: e.target.value }); };

  
  const exportCSV = () => {
    const headers = [
      'Name', 'Age', 'Phone', 'Email', 'Symptoms', 'Arrival Time'
    ];
    const rows = filteredPatients.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.age,
      `"${p.contact?.phone?.replace(/"/g, '""') || ''}"`,
      `"${p.contact?.email?.replace(/"/g, '""') || ''}"`,
      `"${p.symptoms.replace(/"/g, '""')}"`,
      new Date(p.createdAt).toLocaleString()
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'Patient_List.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  
  const exportPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(18);
    doc.text('Patient List', 40, 40);

    doc.setFontSize(12);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 40, 60);

    autoTable(doc, {
      startY: 80,
      head: [['Name', 'Age', 'Phone', 'Email', 'Symptoms', 'Arrival Time']],
      body: filteredPatients.map(p => [
        p.name,
        p.age,
        p.contact?.phone || '',
        p.contact?.email || '',
        p.symptoms,
        new Date(p.createdAt).toLocaleString()
      ]),
      theme: 'grid',
      headStyles: { fillColor: [54, 162, 235] },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 80 }, 
        1: { cellWidth: 40 }, 
        2: { cellWidth: 70 }, 
        3: { cellWidth: 100 }, 
        4: { cellWidth: 120 }, 
        5: { cellWidth: 90 }  
      },
      margin: { left: 40, right: 40 }
    });

    doc.save('Patient_List.pdf');
  };

  return (
    <div className="queue-container1">
      <div className="queue-card">
        <div className="list-header">
         <h1>Patient List</h1>
          <div className="search-container1">
            <input 
              type="text"
              className="search-input"
              placeholder="Search by name, symptoms, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
            <button onClick={exportCSV} className="action-button">Export CSV</button>
            <button onClick={exportPDF} className="action-button">Export PDF</button>
          <Link to="/" className="action-button secondary">
            ← Back to Dashboard
          </Link>
          </div>
        </div>

        {loading ? <p>Loading...</p> : error ? <p style={{color: 'red'}}>{error}</p> : (
          <table className="patients-table">
            <thead>
              <tr>
                <th className="sortable-header" onClick={() => requestSort('name')}>Name <span className="sort-indicator">{getSortIndicator('name')}</span></th>
                <th className="sortable-header" onClick={() => requestSort('age')}>Age <span className="sort-indicator">{getSortIndicator('age')}</span></th>
                <th>Contact Info</th>
                <th className="sortable-header" onClick={() => requestSort('symptoms')}>Symptoms <span className="sort-indicator">{getSortIndicator('symptoms')}</span></th>
                <th className="sortable-header" onClick={() => requestSort('createdAt')}>Arrival Time <span className="sort-indicator">{getSortIndicator('createdAt')}</span></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient._id}>
                  {editingId === patient._id ? (
                     <>
                      <td><input type="text" name="name" value={editFormData.name} onChange={handleFormChange} className="inline-edit-input" /></td>
                      <td><input type="number" name="age" value={editFormData.age} onChange={handleFormChange} className="inline-edit-input age-input" /></td>
                      <td>
                        <input type="text" name="phone" value={editFormData.phone} onChange={handleFormChange} placeholder="Phone" className="inline-edit-input contact-input" style={{ marginBottom: '5px' }} />
                        <input type="email" name="email" value={editFormData.email} onChange={handleFormChange} placeholder="Email" className="inline-edit-input contact-input" />
                      </td>
                      <td><input type="text" name="symptoms" value={editFormData.symptoms} onChange={handleFormChange} className="inline-edit-input" /></td>
                      <td>{new Date(patient.createdAt).toLocaleString()}</td>
                      <td>
                        <button onClick={() => handleSaveClick(patient._id)} className="save-button">Save</button>
                        <button onClick={handleCancelClick} className="delete-button">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{patient.name}</td>
                      <td>{patient.age}</td>
                      <td>
                        {patient.contact?.phone && <div>{patient.contact.phone}</div>}
                        {patient.contact?.email && <div>{patient.contact.email}</div>}
                      </td>
                      <td>{patient.symptoms}</td>
                      <td>{new Date(patient.createdAt).toLocaleString()}</td>
                      <td>
                        <button onClick={() => handleEditClick(patient)} className="edit-button">Edit</button>
                        <button onClick={() => handleDeleteClick(patient._id)} className="delete-button">Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PatientListPage;