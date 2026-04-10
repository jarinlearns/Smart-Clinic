import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getOperationalAnalytics } from '../services/adminService'; 
import { Bar, Pie } from 'react-chartjs-2';
import api from '../api';
import 'chart.js/auto';
import './AdminDashboard.css'; 

const AdminDashboard = () => {
  const [openPanels, setOpenPanels] = useState({
    receptionist: false,
    doctor: false,
    pharmacist: false,
    management: false, 
  });
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  
  useEffect(() => {
    const fetchAllAdminData = async () => {
      try {
        
        if (!stats) setLoading(true);
        
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

        const [statsData, analyticsData, dailyRevenueRes] = await Promise.all([
          getDashboardStats(),
          getOperationalAnalytics(),
          api.get('/analytics/daily-revenue', config)
        ]);

        setStats(statsData);
        setAnalytics(analyticsData);
        setDailyRevenue(dailyRevenueRes.data.dailyRevenue);

      } catch (err) {
        console.error(err);
        setError('Could not load all dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    
    
    fetchAllAdminData();

    
    const interval = setInterval(fetchAllAdminData, 30000);

    
    return () => clearInterval(interval);
  }, []); 

  const togglePanel = (panel) => {
    setOpenPanels(prev => ({
      ...prev,
      [panel]: !prev[panel],
    }));
  };
  
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return '0.00 BDT';
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT`;
  };
  
  const patientVolumeChartData = {
    labels: analytics?.patientVolume.map(d => new Date(d.date).toLocaleDateString()) || [],
    datasets: [{
      label: 'Patients per Day (Last 7 Days)',
      data: analytics?.patientVolume.map(d => d.count) || [],
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
    }],
  };
  
  const symptomFrequencyChartData = {
    labels: analytics?.symptomFrequency.map(d => d.symptom) || [],
    datasets: [{
      label: 'Symptom Frequency (Last 7 Days)',
      data: analytics?.symptomFrequency.map(d => d.count) || [],
      backgroundColor: [
          'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
      ],
    }],
  };

  return (
    <div className="admin-dashboard">
      <h1>Administrator's Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '5px solid #005acd' }}>
          <h3 className="card-title">Revenue (Today)</h3>
          <p className="card-number" style={{ color: '#005acd' }}>
            {loading ? '...' : formatCurrency(dailyRevenue)}
          </p>
        </div>
        <div className="stat-card revenue">
          <h3 className="card-title">Total Revenue (30d)</h3>
          <p className="card-number">{loading ? '...' : formatCurrency(stats?.totalRevenue)}</p>
        </div>
        <div className="stat-card expenses">
          <h3 className="card-title">Total Expenses (30d)</h3>
          <p className="card-number">{loading ? '...' : formatCurrency(stats?.totalExpenses)}</p>
        </div>
        <div className={`stat-card profit ${stats?.netProfit < 0 ? 'loss' : ''}`}>
          <h3 className="card-title">Net Profit (30d)</h3>
          <p className="card-number">{loading ? '...' : formatCurrency(stats?.netProfit)}</p>
        </div>
      </div>
      
      {error && <p className="error-message">{error}</p>}

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <h2>Patient Volume</h2>
          {loading ? <p>Loading chart...</p> : analytics && <Bar data={patientVolumeChartData} />}
        </div>
        <div className="dashboard-panel">
          <h2>Common Symptoms</h2>
          {loading ? <p>Loading chart...</p> : analytics && <Pie data={symptomFrequencyChartData} />}
        </div>
      </div>

      <div className="action-panels-container">
        
        <div className="collapsible-section">
          <button className="collapsible-button" onClick={() => togglePanel('management')}>
            User Management
            <span className="toggle-icon">{openPanels.management ? '▲' : '▼'}</span>
          </button>
          {openPanels.management && (
            <div className="actions-panel">
              <Link to="/admin/add-user" className="action-button">Add New User</Link>
              <Link to="/admin/users" className="action-button">View All Users</Link>
            </div>
          )}
        </div>

        <div className="collapsible-section">
          <button className="collapsible-button" onClick={() => togglePanel('receptionist')}>
            Receptionist Actions
            <span className="toggle-icon">{openPanels.receptionist ? '▲' : '▼'}</span>
          </button>
          {openPanels.receptionist && (
            <div className="actions-panel">
              <Link to="/reception/add-patient" className="action-button">Add Patient</Link>
              <Link to="/reception/patient-list" className="action-button">Patient List</Link>
              <Link to="/reception/live-queue" className="action-button">Live Queue</Link>
              
            </div>
          )}
        </div>

        <div className="collapsible-section">
          <button className="collapsible-button" onClick={() => togglePanel('doctor')}>
            Doctor Actions
            <span className="toggle-icon">{openPanels.doctor ? '▲' : '▼'}</span>
          </button>
          {openPanels.doctor && (
            <div className="actions-panel">
              <Link to="/admin/consultation-history" className="action-button">Consultation History</Link>
            </div>
          )}
        </div>

        <div className="collapsible-section">
          <button className="collapsible-button" onClick={() => togglePanel('pharmacist')}>
            Pharmacist Actions
            <span className="toggle-icon">{openPanels.pharmacist ? '▲' : '▼'}</span>
          </button>
          {openPanels.pharmacist && (
            <div className="actions-panel">
              <Link to="/admin/medicines" className="action-button">View Full Inventory</Link>
              <Link to="/pharmacist/suppliers" className="action-button">Manage Suppliers</Link>
              <Link to="/pharmacist/procurements" className="action-button">Procurement History</Link>
              <Link to="/admin/revenue" className="action-button">Revenue Report</Link>
              <Link to="/reports/dispensing-analytics" className="action-button">Dispensing Analytics</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;