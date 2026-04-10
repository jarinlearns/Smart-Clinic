import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { getPrescriptions, updatePrescriptionStatus } from '../services/prescriptionService';
import { getProcurements } from '../services/procurementService';
import PrescriptionDetailsModal from '../components/PrescriptionDetailsModal';
import { scanAndQuarantine } from '../services/inventoryService';

import './PharmacistDashboard.css';

const PharmacistDashboard = () => {
  const [medicines, setMedicines] = useState([]);
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [isQuarantining, setIsQuarantining] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alertFilter, setAlertFilter] = useState('all');

  const LOW_STOCK_THRESHOLD = 100;

    const handleQuarantineClick = async () => {
    if (window.confirm('This will scan for all expired items, move them to quarantine, and deduct them from stock. Are you sure you want to proceed?')) {
        setIsQuarantining(true);
        try {
            const data = await scanAndQuarantine();
            alert(data.message); 
            fetchAllData(); 
        } catch (err) {
            alert(err.response?.data?.message || 'An error occurred during the quarantine process.');
        } finally {
            setIsQuarantining(false);
        }
    }
  };

  const fetchAllData = useCallback(async () => {
    try {
      
      
      if (medicines.length === 0) setLoading(true);

      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      const presData = await getPrescriptions({ status: 'Pending' });
      const presData1 = await getPrescriptions({ status: 'Partially Filled' });
      const sortedPrescriptions = [...presData, ...presData1].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const [medData, procData] = await Promise.all([
          api.get('/medicines', config),
          getProcurements()
      ]);

      setMedicines(medData.data);
      setPendingPrescriptions(sortedPrescriptions);
      setProcurements(procData);
      setError(''); 

    } catch (err) {
      setError('Could not load all dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []); 

  
  useEffect(() => {
    
    fetchAllData();
    
    
    const interval = setInterval(fetchAllData, 60000);
    
    
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const expiringSoonItems = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return procurements.filter(p => {
        if (!p.expiryDate) return false; 
        const expiryDate = new Date(p.expiryDate);
        return p.status === 'Available' && expiryDate > today && expiryDate <= thirtyDaysFromNow;
    });
  }, [procurements]);

  const lowStockItems = medicines.filter((med) => med.quantityInStock < LOW_STOCK_THRESHOLD);
  const totalStock = medicines.reduce((acc, med) => acc + med.quantityInStock, 0);

  const handleViewDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPrescription(null);
  };

  const handleMarkAsFilled = async (prescriptionId) => {
    try {
        await updatePrescriptionStatus(prescriptionId, 'Filled');
        handleCloseModal();
        fetchAllData(); 
    } catch (err) {
        alert('Failed to update prescription status.');
    }
  };
  const expiredItems = useMemo(() => {
    const today = new Date();
    return procurements.filter(p => {
        return p.status === 'Available' && new Date(p.expiryDate) <= today;
    });
  }, [procurements]);


    const getAlertTitle = () => {
    switch (alertFilter) {
        case 'low-stock': return 'Alerts: Low Stock';
        case 'expiring-soon': return 'Alerts: Expiring Soon';
        case 'expired': return 'Alerts: Expired Items';
        default: return 'All Inventory Alerts';
    }
  };


  const handleFillSuccess = (updatedPrescription) => {
    if (updatedPrescription.status === 'Filled') {
      setPendingPrescriptions(prevPrescriptions =>
        prevPrescriptions.filter(p => p._id !== updatedPrescription._id)
      );
    } else {
      setPendingPrescriptions(prevPrescriptions =>
        prevPrescriptions.map(p =>
          p._id === updatedPrescription._id ? updatedPrescription : p
        )
      );
    }
  };


  
  return (
    <div className="pharmacist-dashboard">
      <h1>Pharmacist's Dashboard</h1>
      <div className="quick-actions">
        <Link to="/admin/medicines" className="action-button">View Full Inventory</Link>
        <Link to="/pharmacist/suppliers" className="action-button">Manage Suppliers</Link>
        <Link to="/pharmacist/procurements" className="action-button">Procurement History</Link>
        <Link to="/admin/revenue" className="action-button">Revenue Report</Link>
        <Link to="/reports/dispensing-analytics" className="action-button">Dispensing Analytics</Link>
        <button 
            className="action-button quarantine-btn" 
            onClick={handleQuarantineClick} 
            disabled={isQuarantining}
        >
            {isQuarantining ? 'Scanning...' : 'Scan & Quarantine Expired'}
        </button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3 className="card-title">Prescriptions to Fill</h3>
          <p className="card-number">{loading ? '...' : pendingPrescriptions.length}</p>
        </div>
        <div className="stat-card">
          <h3 className="card-title">Total Items in Stock</h3>
            <p className="card-number">{loading ? '...' : totalStock.toLocaleString()}</p>
        </div>

        <div 
          className={`stat-card low-stock ${alertFilter === 'low-stock' ? 'active' : ''}`}
          onClick={() => setAlertFilter('low-stock')}
        >
          <h3 className="card-title">Items Below Threshold</h3>
          <p className="card-number">{loading ? '...' : lowStockItems.length}</p>
        </div>
        <div 
          className={`stat-card expiring-soon ${alertFilter === 'expiring-soon' ? 'active' : ''}`}
          onClick={() => setAlertFilter('expiring-soon')}
        >
          <h3 className="card-title">Expiring Soon (30d)</h3>
          <p className="card-number">{loading ? '...' : expiringSoonItems.length}</p>
        </div>
        <div 
          className={`stat-card expired ${alertFilter === 'expired' ? 'active' : ''}`}
          onClick={() => setAlertFilter('expired')}
        >
          <h3 className="card-title">Expired Items</h3>
          <p className="card-number">{loading ? '...' : expiredItems.length}</p>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}
      
      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h2>Pending Prescriptions</h2>
          {loading ? <p>Loading prescriptions...</p> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPrescriptions.length > 0 ? (
                  pendingPrescriptions.map((p) => (
                    <tr key={p._id}>
                      <td>{new Date(p.createdAt).toLocaleString()}</td>
                        <td>{p.patient?.name ?? "N/A"}</td>
                        <td>Dr. {p.doctor?.name ?? "N/A"}</td>
                      <td>
                        <button className="view-details-btn" onClick={() => handleViewDetails(p)}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4">No pending prescriptions.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
       <div className="dashboard-panel">
            <div className="panel-header">
                <h2>{getAlertTitle()}</h2>
                {alertFilter !== 'all' && (
                    <button className="show-all-btn" onClick={() => setAlertFilter('all')}>Show All</button>
                )}
            </div>
            {loading ? <p>Loading alerts...</p> : (
                <ul className="item-list">
                     {(alertFilter === 'all' || alertFilter === 'expired') && expiredItems.map(item => (
                        item.medicine && (
                        <li key={item._id}>
                            <span className="item-name">{item.medicine?.name} ({item.quantityAdded} units)<br />BatchID: ({item._id})</span>
                            <span className="alert-expired">EXPIRED: {new Date(item.expiryDate).toLocaleDateString()}</span>
                        </li>
                        )
                    ))}
                    {(alertFilter === 'all' || alertFilter === 'expiring-soon') && expiringSoonItems.map(item => (
                        item.medicine && (
                        <li key={item._id}>
                            <span className="item-name">{item.medicine?.name} ({item.quantityAdded} units)<br />BatchID: ({item._id})</span>
                            <span className="alert-expiring-soon">Expires: {new Date(item.expiryDate).toLocaleDateString()}</span>
                        </li>
                        )
                    ))}
                    {(alertFilter === 'all' || alertFilter === 'low-stock') && lowStockItems.map((item) => (
                        <li key={item._id}>
                            <span className="item-name">{item.name}<br />BatchID: ({item._id})</span>
                            <span className="alert-low-stock">Low Stock ({item.quantityInStock})</span>
                        </li>
                    ))}
                {lowStockItems.length === 0 && expiringSoonItems.length === 0 && expiredItems.length === 0 && (
                    <p>No inventory alerts.</p>
                )}
                </ul>
            )}
        </div>
      </div>
      
      {isModalOpen && (
<PrescriptionDetailsModal 
    prescription={selectedPrescription}
    onClose={handleCloseModal}
    onSuccess={handleFillSuccess}
/>
      )}
    </div>
  );
};

export default PharmacistDashboard;