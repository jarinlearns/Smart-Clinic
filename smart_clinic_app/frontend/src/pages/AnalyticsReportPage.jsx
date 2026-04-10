import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom'; 
import { getMostDispensed } from '../services/inventoryService';
import { getPharmacyAnalytics } from '../services/analyticsService';
import './AnalyticsReportPage.css';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
ChartJS.register( CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend );
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';





const toYYYYMMDD = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const AnalyticsReportPage = () => {
    const [reportData, setReportData] = useState([]);
    const [pharmacyAnalytics, setPharmacyAnalytics] = useState(null);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return toYYYYMMDD(date);
    });
    const [endDate, setEndDate] = useState(toYYYYMMDD(new Date()));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'totalRevenue', direction: 'descending' });

    const fetchReportData = useCallback(async () => {
        if (!startDate || !endDate) {
            setError('Please select both a start and end date.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const [topDispensed, pharmacyData] = await Promise.all([
                getMostDispensed(startDate, endDate),
                getPharmacyAnalytics(startDate, endDate)
            ]);
            setReportData(topDispensed);
            setPharmacyAnalytics(pharmacyData);
        } catch (err) {
            setError('Failed to load the analytics report. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    
    const processedData = useMemo(() => {
        let filteredData = [...reportData];

        
        if (searchTerm) {
            filteredData = filteredData.filter(item =>
                item.medicineName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        
        if (sortConfig.key !== null) {
            filteredData.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return filteredData;
    }, [reportData, searchTerm, sortConfig]);

    
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    
    const getSortIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    const totalRevenue = processedData.reduce((acc, item) => acc + item.totalRevenue, 0);
    const totalItemsDispensed = processedData.reduce((acc, item) => acc + item.totalQuantityDispensed, 0);
const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `Top Dispensed Medicines by Revenue (BDT)`,
                font: { size: 16 }
            },
        },
    };
const barChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `Top Dispensed Medicines by Revenue (BDT)`, font: { size: 16 } },
        },
    };

    const barChartData = {
        labels: processedData.map(item => item.medicineName),
        datasets: [{
            label: 'Total Revenue (BDT)',
            data: processedData.map(item => item.totalRevenue),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
        }],
    };

    const pieChartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `Proportion of Units Sold`, font: { size: 16 } },
        },
    };

    const pieChartData = {
        labels: processedData.map(item => item.medicineName),
        datasets: [{
            label: '# of Units Sold',
            data: processedData.map(item => item.totalQuantityDispensed),
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
    };
    const chartData = {
        labels: processedData.map(item => item.medicineName),
        datasets: [
            {
                label: 'Total Revenue (BDT)',
                data: processedData.map(item => item.totalRevenue),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

        const trendChartData = {
        labels: pharmacyAnalytics?.dispensingTrend.map(d => new Date(d.date).toLocaleDateString()) || [],
        datasets: [{
            label: 'Units Dispensed Per Day',
            data: pharmacyAnalytics?.dispensingTrend.map(d => d.totalUnitsSold) || [],
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    const exportCSV = () => {
    const headers = ['Rank', 'Medicine Name', 'Quantity Dispensed', 'Total Revenue'];
    const rows = processedData.map((item, index) => [
        index + 1,
        `"${item.medicineName.replace(/"/g, '""')}"`,
        item.totalQuantityDispensed,
        item.totalRevenue.toFixed(2)
    ]);
    let csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Dispensing_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
const exportPDF = async () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    const marginLeft = 40;
    let y = 40;

    doc.setFontSize(22);
    doc.text('Dispensing Analytics Report', marginLeft, y);
    y += 24;
    doc.setFontSize(11);
    doc.text(`Period: ${startDate} to ${endDate}`, marginLeft, y);
    y += 24;

    doc.setFontSize(12);
    doc.text(`Total Revenue: BDT ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, marginLeft, y);
    y += 16;
    doc.text(`Total Units Dispensed: ${totalItemsDispensed.toLocaleString()}`, marginLeft, y);
    y += 16;
    doc.text(`Medicines Found: ${processedData.length}`, marginLeft, y);
    y += 24;

    autoTable(doc, {
        startY: y,
        head: [['Rank', 'Medicine Name', 'Quantity Dispensed', 'Total Revenue']],
        body: processedData.map((item, idx) => [
            idx + 1,
            item.medicineName,
            item.totalQuantityDispensed.toLocaleString(),
            `BDT ${item.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [54, 162, 235] },
        styles: { fontSize: 10 },
    });

    async function addChartToPDF(chartId, title) {
        const chartCanvas = document.querySelector(`#${chartId} canvas`);
        if (chartCanvas) {
            const imgData = chartCanvas.toDataURL('image/png', 1.0);
            doc.addPage();
            doc.setFontSize(16);
            doc.text(title, marginLeft, 30);
            doc.addImage(imgData, 'PNG', marginLeft, 50, 500, 300);
        }
    }

    await addChartToPDF('chart-container-1', 'Top Dispensed Medicines by Revenue (Bar)');
    await addChartToPDF('chart-container-2', 'Proportion of Units Sold (Pie)');
    await addChartToPDF('chart-container-3', 'Dispensing Trend (Line)');
    await addChartToPDF('chart-container-4', 'Dispensing by Category (Doughnut)');

    doc.save(`Dispensing_Report_${startDate}_to_${endDate}.pdf`);
};
    const categoryChartData = {
        labels: pharmacyAnalytics?.dispensingByCategory.map(d => d.category) || [],
        datasets: [{
            label: 'Units Sold by Category',
            data: pharmacyAnalytics?.dispensingByCategory.map(d => d.totalUnitsSold) || [],
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
            ],
        }]
    };
    return (
        <div className="analytics-page">
            <header className="analytics-header">
                <Link to="/" className="back-to-dashboard-btn" style={{ marginLeft: 'auto' }}>← Back to Dashboard</Link>
                <h1>Dispensing Analytics Report</h1>
                <p>Analyze top-performing medicines based on revenue and quantity.</p>
            </header>

            <div className="analytics-controls">
                            <button onClick={exportCSV} style={{marginLeft: '10px'}}>Export CSV</button>
            <button onClick={exportPDF} style={{marginLeft: '10px'}}>Export PDF</button>
                <div className="control-group search-bar">
                    <input
                        type="text"
                        placeholder="Search by medicine name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="control-group">
                    <label htmlFor="start-date">Start Date:</label>
                    <input
                        type="date"
                        id="start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="control-group">
                    <label htmlFor="end-date">End Date:</label>
                    <input
                        type="date"
                        id="end-date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <button onClick={fetchReportData} disabled={loading}>
                    {loading ? 'Generating...' : 'Generate Report'}
                </button>
            </div>

            <div className="stats-grid analytics-summary">
                 <div className="stat-card">
                    <h3 className="card-title">Total Revenue</h3>
                    <p className="card-number">BDT {totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="stat-card">
                    <h3 className="card-title">Total Units Dispensed</h3>
                    <p className="card-number">{totalItemsDispensed.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                    <h3 className="card-title">Medicines Found</h3>
                    <p className="card-number">{processedData.length}</p>
                </div>
            </div>
            
            <div className="report-table-container">
                {error && <p className="error-message">{error}</p>}
                {loading && <p>Loading report...</p>}
                {!loading && !error && (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                
                                <th className="sortable-header" onClick={() => requestSort('medicineName')}>
                                    Medicine Name{getSortIndicator('medicineName')}
                                </th>
                                <th className="sortable-header" onClick={() => requestSort('totalQuantityDispensed')}>
                                    Quantity Dispensed{getSortIndicator('totalQuantityDispensed')}
                                </th>
                                <th className="sortable-header" onClick={() => requestSort('totalRevenue')}>
                                    Total Revenue{getSortIndicator('totalRevenue')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            
                            {processedData.length > 0 ? (
                                processedData.map((item, index) => (
                                    <tr key={item.medicineId}>
                                        <td>{index + 1}</td>
                                        <td>{item.medicineName}</td>
                                        <td>{item.totalQuantityDispensed.toLocaleString()} units</td>
                                        <td>BDT {item.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4">No dispensing data found for the selected period or filter.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
         <div className="charts-wrapper">
                {processedData.length > 0 ? (
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
                     <div className="charts-wrapper">
                {processedData.length > 0 ? (
                    <>
                        <div className="chart-container-3" id="chart-container-3">
                            <h3>Dispensing Trend</h3>
                            {pharmacyAnalytics?.dispensingTrend.length > 0 ? <Line data={trendChartData} /> : <p className="no-data-message">No trend data available.</p>}
                        </div>
                        <div className="chart-container-4" id="chart-container-4">
                            <h3>Dispensing by Category</h3>
                            {pharmacyAnalytics?.dispensingByCategory.length > 0 ? <Doughnut data={categoryChartData} /> : <p className="no-data-message">No category data available.</p>}
                        </div>
                    </>
                ) : (
                    
                    <div className="chart-container full-width">
                        <p className="no-data-message">No data available to display charts for the selected period.</p>
                    </div>
                )}
            </div>   
            
        </div>
    );
};

export default AnalyticsReportPage;