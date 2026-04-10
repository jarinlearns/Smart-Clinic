import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getProcurements } from '../services/procurementService';
import './ProcurementHistoryPage.css';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const useSortableData = (items, config = { key: 'purchaseDate', direction: 'descending' }) => {
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

const ProcurementHistoryPage = () => {
  const [procurements, setProcurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getProcurements(startDate, endDate);
      setProcurements(data);
    } catch (err) {
      setError('Failed to fetch procurement history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    
  }, []);

  const filteredProcurements = useMemo(() => {
    if (!searchTerm) return procurements;
    return procurements.filter(p =>
      p.medicine?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.recordedBy?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p._id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [procurements, searchTerm]);

  const TOP_N = 10; 
  const { items: sortedProcurements, requestSort, sortConfig } = useSortableData(filteredProcurements);
  const chartProcurements = useMemo(() => sortedProcurements.slice(0, TOP_N), [sortedProcurements]);
  const getSortIndicator = (name) => { if (sortConfig?.key !== name) return null; return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'; };
  const totalItemsProcured = useMemo(() => {
    return filteredProcurements.reduce((sum, p) => sum + p.quantityAdded, 0);
  }, [filteredProcurements]);
  const totalProcurementCost = useMemo(() => {
    return filteredProcurements.reduce((sum, p) => sum + p.totalCost, 0);
  }, [filteredProcurements]);

  const barChartData = useMemo(() => ({
    labels: chartProcurements.map(p => p.medicine?.name || 'N/A'),
    datasets: [{
      label: 'Total Cost (BDT)',
      data: chartProcurements.map(p => p.totalCost),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1,
    }],
  }), [chartProcurements]);

  const pieChartData = useMemo(() => ({
    labels: chartProcurements.map(p => p.medicine?.name || 'N/A'),
    datasets: [{
      label: 'Quantity Procured',
      data: chartProcurements.map(p => p.quantityAdded),
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)',
        'rgba(99, 255, 132, 0.6)', 'rgba(235, 54, 162, 0.6)',
        'rgba(86, 255, 206, 0.6)', 'rgba(192, 75, 192, 0.6)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)',
        'rgba(99, 255, 132, 1)', 'rgba(235, 54, 162, 1)',
        'rgba(86, 255, 206, 1)', 'rgba(192, 75, 192, 1)'
      ],
      borderWidth: 1,
    }],
  }), [chartProcurements]);

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Procurement Cost by Medicine (Top 10)', font: { size: 16 } },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Proportion of Quantity Procured (Top 10)', font: { size: 16 } },
    },
  };

  
  const exportCSV = () => {
    const headers = [
      'Date', 'Medicine', 'Batch ID', 'Supplier', 'Quantity', 'Cost/Unit', 'Total Cost', 'Recorded By'
    ];
    const rows = sortedProcurements.map(p => [
      new Date(p.purchaseDate).toLocaleString(),
      `"${p.medicine?.name.replace(/"/g, '""') || 'N/A'}"`,
      p._id,
      `"${p.supplier?.name?.replace(/"/g, '""') || 'N/A'}"`,
      p.quantityAdded,
      p.costPerUnit?.toFixed(2) || '0.00',
      p.totalCost?.toFixed(2) || '0.00',
      `"${p.recordedBy?.name?.replace(/"/g, '""') || 'N/A'}"`
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'Procurement_History.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  
  const exportPDF = async () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(18);
    doc.text('Procurement History', 40, 40);

    doc.setFontSize(12);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 40, 60);

    
    doc.setFontSize(13);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 40, 80);
    doc.text(`Total Procurement Cost: ${totalProcurementCost.toFixed(2)} BDT`, 40, 100);
    doc.text(`Total Items Procured: ${totalItemsProcured.toLocaleString()} Units`, 40, 120);

    
    autoTable(doc, {
      startY: 140,
      head: [['Date', 'Medicine', 'Batch ID', 'Supplier', 'Quantity', 'Cost/Unit', 'Total Cost', 'Recorded By']],
      body: sortedProcurements.map(p => [
        new Date(p.purchaseDate).toLocaleString(),
        p.medicine?.name || 'N/A',
        p._id,
        p.supplier?.name || 'N/A',
        p.quantityAdded,
        p.costPerUnit?.toFixed(2) || '0.00',
        p.totalCost?.toFixed(2) || '0.00',
        p.recordedBy?.name || 'N/A'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [54, 162, 235] },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 75 }, 
        1: { cellWidth: 80 }, 
        2: { cellWidth: 70 }, 
        3: { cellWidth: 75 }, 
        4: { cellWidth: 50 }, 
        5: { cellWidth: 60 }, 
        6: { cellWidth: 70 }, 
        7: { cellWidth: 80 }  
      },
      margin: { left: 40, right: 40 }
    });

    
    async function addChartToPDF(chartId, title) {
      const chartCanvas = document.querySelector(`#${chartId} canvas`);
      if (chartCanvas) {
        const imgData = chartCanvas.toDataURL('image/png', 1.0);
        doc.addPage();
        doc.setFontSize(16);
        doc.text(title, 40, 30);
        doc.addImage(imgData, 'PNG', 40, 50, 500, 300);
      }
    }

    await addChartToPDF('chart-container-1', 'Procurement Cost by Medicine (Top 10)');
    await addChartToPDF('chart-container-2', 'Proportion of Quantity Procured (Top 10)');

    doc.save('Procurement_History.pdf');
  };

  return (
    <div className="procurement-history-container">
      <div className="list-header">
        <h1>Procurement History</h1>
        <div className="header-actions">
          <Link to="/admin/medicines" className="action-button">
            Inventory List
          </Link>
          <button onClick={exportCSV} className="action-button" >Export CSV</button>
          <button onClick={exportPDF} className="action-button" >Export PDF</button>
          <Link to="/" className="action-button secondary" style={{ marginLeft: 'auto' }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
      <div className="filter-controls" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label htmlFor="start-date">Start Date:</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="end-date">End Date:</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          style={{ alignSelf: 'flex-end' }}
        >
          {loading ? 'Filtering...' : 'Filter'}
        </button>
      </div>
      <div className="stats-container-revenue">
        <div className="stat-card-revenue procurement-cost-card">
            <h3>Total Procurement Cost</h3>
            <p>{totalProcurementCost.toFixed(2)} BDT</p>
        </div>
        <div className="stat-card-revenue items-procured-card">
            <h3>Total Items Procured</h3>
            <p>{totalItemsProcured.toLocaleString()} Units</p>
        </div>
      </div>
      <div className="charts-wrapper">
        {chartProcurements.length > 0 ? (
          <>
            <div className="chart-container-1" id="chart-container-1">
              <Bar options={barChartOptions} data={barChartData} />
            </div>
            <div className="chart-container-2" id="chart-container-2">
              <Pie options={pieChartOptions} data={pieChartData} />
            </div>
          </>
        ) : (
          <div className="chart-container full-width">
            <p className="no-data-message">No data available to display charts for the selected period.</p>
          </div>
        )}
      </div>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by medicine, supplier, batchID or recorded by..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? <p>Loading history...</p> : error ? <p className="error-message">{error}</p> : (
        <>
          <div className="table-card">
            <table className="history-table">
              <thead>
                <tr>
                  <th className="sortable-header"><button onClick={() => requestSort('purchaseDate')}>Date{getSortIndicator('purchaseDate')}</button></th>
                  <th className="sortable-header"><button onClick={() => requestSort('medicine.name')}>Medicine{getSortIndicator('medicine.name')}</button></th>
                  <th className="sortable-header"><button onClick={() => requestSort('_id')}>Batch ID{getSortIndicator('_id')}</button></th>
                  <th className="sortable-header"><button onClick={() => requestSort('supplier.name')}>Supplier{getSortIndicator('supplier.name')}</button></th>
                  <th className="sortable-header"><button onClick={() => requestSort('quantityAdded')}>Quantity{getSortIndicator('quantityAdded')}</button></th>
                  <th className="sortable-header"><button onClick={() => requestSort('costPerUnit')}>Cost/Unit{getSortIndicator('costPerUnit')}</button></th>
                  <th className="sortable-header"><button onClick={() => requestSort('totalCost')}>Total Cost{getSortIndicator('totalCost')}</button></th>
                  <th className="sortable-header"><button onClick={() => requestSort('recordedBy.name')}>Recorded By{getSortIndicator('recordedBy.name')}</button></th>
                </tr>
              </thead>
              <tbody>
                {sortedProcurements.map((p) => (
                  <tr key={p._id}>
                    <td>{new Date(p.purchaseDate).toLocaleString()}</td>
                    <td>{p.medicine?.name || 'N/A'}</td>
                    <td>{p._id}</td>
                    <td>{p.supplier?.name || 'N/A'}</td>
                    <td>{p.quantityAdded}</td>
                    <td>{p.costPerUnit.toFixed(2)} BDT</td>
                    <td>{p.totalCost.toFixed(2)} BDT</td>
                    <td>{p.recordedBy?.name || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ProcurementHistoryPage;