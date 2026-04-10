import React, { useState, useEffect, useMemo, useCallback } from 'react'; 
import { Link } from 'react-router-dom';
import { getInvoices, updateInvoiceStatus } from '../services/invoiceService';
import './RevenueReportPage.css'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const useSortableData = (items, config = { key: 'invoiceDate', direction: 'descending' }) => {
  const [sortConfig, setSortConfig] = useState(config);
  const sortedItems = useMemo(() => {
    if (!items) return [];
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = sortConfig.key.split('.').reduce((o, i) => o?.[i], a);
        const bValue = sortConfig.key.split('.').reduce((o, i) => o?.[i], b);
        if (aValue < bValue) { return sortConfig.direction === 'ascending' ? -1 : 1; }
        if (aValue > bValue) { return sortConfig.direction === 'ascending' ? 1 : -1; }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig?.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  return { items: sortedItems, requestSort, sortConfig };
};

const RevenueReportPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getInvoices();
      setInvoices(data);
    } catch (err) {
      setError('Failed to fetch revenue data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleMarkAsPaid = async (invoiceId) => {
      if (window.confirm('Are you sure you want to mark this invoice as paid?')) {
          try {
              await updateInvoiceStatus(invoiceId, 'Paid');
              fetchInvoices();
          } catch (err) {
              alert('Failed to update invoice status.');
          }
      }
  };

  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    return invoices.filter(i =>
      i.patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.doctor?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const { items: sortedInvoices, requestSort, sortConfig } = useSortableData(filteredInvoices);
  const getSortIndicator = (name) => { if (sortConfig?.key !== name) return null; return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'; };

  const totalRevenue = useMemo(() => {
      return filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  }, [filteredInvoices]);
  const totalPaidRevenue = useMemo(() => {
      return filteredInvoices
          .filter(inv => inv.status === 'Paid')
          .reduce((sum, inv) => sum + inv.totalAmount, 0);
  }, [filteredInvoices]);

  
  const exportCSV = () => {
    const headers = [
      'Date', 'Patient', 'Doctor', 'Amount', 'Payment Status'
    ];
    const rows = sortedInvoices.map(inv => [
      new Date(inv.invoiceDate).toLocaleString(),
      `"${inv.patient?.name.replace(/"/g, '""') || 'N/A'}"`,
      `"${inv.doctor?.name.replace(/"/g, '""') || 'N/A'}"`,
      inv.totalAmount?.toFixed(2) || '0.00',
      inv.status
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'Revenue_Report.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  
  const exportPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(18);
    doc.text('Revenue Report', 40, 40);

    doc.setFontSize(12);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 40, 60);

    
    doc.setFontSize(13);
    doc.text(`Total Billed Revenue: ${totalRevenue.toFixed(2)} BDT`, 40, 80);
    doc.text(`Total Paid Revenue: ${totalPaidRevenue.toFixed(2)} BDT`, 40, 100);

    
    autoTable(doc, {
      startY: 120,
      head: [['Date', 'Patient', 'Doctor', 'Amount (BDT)', 'Payment Status']],
      body: sortedInvoices.map(inv => [
        new Date(inv.invoiceDate).toLocaleString(),
        inv.patient?.name || 'N/A',
        inv.doctor?.name || 'N/A',
        inv.totalAmount?.toFixed(2) || '0.00',
        inv.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [54, 162, 235] },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 90 }, 
        1: { cellWidth: 85 }, 
        2: { cellWidth: 85 }, 
        3: { cellWidth: 60 }, 
        4: { cellWidth: 80 }  
      },
      margin: { left: 40, right: 40 }
    });

    doc.save('Revenue_Report.pdf');
  };

  return (
    <div className="revenue-report-container">
      <div className="list-header">
        <h1>Revenue Report</h1>
        <div className="header-actions">
            <button onClick={exportCSV} className="action-button" >Export CSV</button>
            <button onClick={exportPDF} className="action-button" >Export PDF</button>
            <Link to="/" className="action-button secondary"style={{ marginLeft: 'auto' }}>
                ← Back to Dashboard
            </Link>
        </div>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by patient or doctor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="stats-container-revenue">
        <div className="stat-card-revenue total-revenue-card">
            <h3>Total Billed Revenue</h3>
            <p>{totalRevenue.toFixed(2)} BDT</p>
        </div>
        <div className="stat-card-revenue paid-revenue-card">
            <h3>Total Paid Revenue</h3>
            <p>{totalPaidRevenue.toFixed(2)} BDT</p>
        </div>
      </div>

      {loading ? <p>Loading report...</p> : error ? <p className="error-message">{error}</p> : (
        <div className="table-card">
          <table className="revenue-table">
            <thead>
              <tr>
                <th className="sortable-header"><button onClick={() => requestSort('invoiceDate')}>Date{getSortIndicator('invoiceDate')}</button></th>
                <th className="sortable-header"><button onClick={() => requestSort('patient.name')}>Patient{getSortIndicator('patient.name')}</button></th>
                <th className="sortable-header"><button onClick={() => requestSort('doctor.name')}>Doctor{getSortIndicator('doctor.name')}</button></th>
                <th className="sortable-header"><button onClick={() => requestSort('totalAmount')}>Amount{getSortIndicator('totalAmount')}</button></th>
                <th className="sortable-header"><button onClick={() => requestSort('status')}>Payment Status{getSortIndicator('status')}</button></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvoices.map((inv) => (
                <tr key={inv._id}>
                  <td>{new Date(inv.invoiceDate).toLocaleString()}</td>
                  <td>{inv.patient?.name || 'N/A'}</td>
                  <td>Dr. {inv.doctor?.name || 'N/A'}</td>
                  <td>{inv.totalAmount.toFixed(2)} BDT</td>
                  <td>
                    <span className={`status-badge status-${inv.status.toLowerCase()}`}>
                        {inv.status}
                    </span>
                  </td>
                  <td>
                    {inv.status === 'Unpaid' && (
                        <button className="mark-paid-btn" onClick={() => handleMarkAsPaid(inv._id)}>
                            Mark as Paid
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RevenueReportPage;