import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import AddMedicineModal from '../components/AddMedicineModal';
import AddStockModal from '../components/AddStockModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './MedicineListPage.css';
import '../components/AiProcurementModal.css';


const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;


const useSortableData = (items, config = { key: 'name', direction: 'ascending' }) => {
  const [sortConfig, setSortConfig] = useState(config);
  const sortedItems = useMemo(() => {
    if (!items) return [];
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = sortConfig.key.split('.').reduce((o, i) => o?.[i], a);
        const bValue = sortConfig.key.split('.').reduce((o, i) => o?.[i], b);
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  return { items: sortedItems, requestSort, sortConfig };
};

const MedicineListPage = () => {
  
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);

  
  const filteredMedicines = useMemo(() => {
    if (!searchTerm) return medicines; 
    return medicines.filter(med => 
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.salePrice?.toString().includes(searchTerm)
    );
  }, [medicines, searchTerm]);

  const { items: sortedMedicines, requestSort, sortConfig } = useSortableData(filteredMedicines);

  const getSortIndicator = (name) => {
    if (!sortConfig || sortConfig.key !== name) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };
  
  
  const fetchMedicines = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await api.get('/medicines', config);
      setMedicines(data);
    } catch (err) {
      setError('Failed to fetch medicines.');
    } finally {
        setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await api.get('/suppliers', config);
      setSuppliers(data);
    } catch (err) {
      console.error('Could not fetch suppliers.', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMedicines();
    fetchSuppliers();
  }, []);

  
const handleAiAnalysis = async () => {
    setAiLoading(true);
    try {
        
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data: inventoryData } = await api.get('/procurements/analysis-data', config);

        if (!inventoryData || inventoryData.length === 0) {
            setAiSuggestions([]);
            setShowAiModal(true);
            setAiLoading(false);
            return;
        }

        const criticalItems = inventoryData.filter(item => {
            const isStockLow = item.stock < 20;            
            const isDemandHigh = item.stock < item.sold;   
            return isStockLow || isDemandHigh;
        });

        
        if (criticalItems.length === 0) {
            setAiSuggestions([]); 
            setShowAiModal(true);
            setAiLoading(false);
            return;
        }

        
        let dataString = "Item Name, Current Stock, Sold (30d)\n";
        criticalItems.forEach(item => {
            dataString += `${item.name}, ${item.stock}, ${item.sold}\n`;
        });

        const prompt = `
            You are a pharmacy procurement expert. I have identified the following items as CRITICALLY LOW based on sales data.
            
            PROBLEM DATA:
            ${dataString}

            YOUR TASK:
            For each item in this list, suggest a specific restock quantity.
            
            RULES:
            1. Recommended Qty should be: (Sold - Current Stock) + units buffer that you will decide based on demand.
            2. Reason: Explain clearly why (e.g., "Stock is below 30-day demand").
            3. Return ONLY a JSON array. Format: [{"medicine": "Name", "suggestedQty": Suggested Quantity, "reason": "Reason text"}]
        `;

        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            }
        );

        if (!response.ok) throw new Error(response.statusText);

        const aiData = await response.json();
        const candidateText = aiData.candidates[0].content.parts[0].text;
        const cleanText = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
        const suggestions = JSON.parse(cleanText);

        setAiSuggestions(suggestions);
        setShowAiModal(true);

    } catch (error) {
        console.error("AI Analysis Failed:", error);
        alert("AI Analysis failed. Please try again.");
    } finally {
        setAiLoading(false);
    }
  };

  
  const handleEditClick = (medicine) => {
    setEditingId(medicine._id);
    setEditFormData({ 
      ...medicine, 
      supplier: medicine.supplier._id,
      procurementCost: medicine.procurementCost || 0,
      salePrice: medicine.salePrice || 0,
    });
  };
  const handleCancelClick = () => setEditingId(null);
  const handleFormChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

  const handleSaveClick = async (id) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` } };
      await api.put(`/medicines/${id}`, editFormData, config);
      setEditingId(null);
      fetchMedicines(); 
    } catch (err) {
      setError('Failed to update medicine.');
    }
  };

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await api.delete(`/medicines/${id}`, config);
        fetchMedicines();
      } catch (err) {
        setError('Could not delete medicine.');
      }
    }
  };

  const handleOpenAddStockModal = (medicine) => {
    setSelectedMedicine(medicine);
    setIsAddStockModalOpen(true);
  };
  const handleCloseAddStockModal = () => {
    setIsAddStockModalOpen(false);
    setSelectedMedicine(null);
  };

  
  const exportCSV = () => {
    const headers = ['Name', 'Type', 'Category', 'Quantity', 'Avg. Cost Price', 'Sale Price', 'Supplier'];
    const rows = sortedMedicines.map(med => [
      `"${med.name.replace(/"/g, '""')}"`,
      `"${med.type.replace(/"/g, '""')}"`,
      `"${med.category.replace(/"/g, '""')}"`,
      med.quantityInStock,
      med.averageCost?.toFixed(2) || '0.00',
      med.salePrice?.toFixed(2) || '0.00',
      `"${med.supplier?.name?.replace(/"/g, '""') || 'N/A'}"`
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'Medicine_Catalog.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(18);
    doc.text('Medicine Catalog', 40, 40);
    doc.setFontSize(12);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 40, 60);
    autoTable(doc, {
      startY: 80,
      head: [['Name', 'Type', 'Category', 'Quantity', 'Avg. Cost Price', 'Sale Price', 'Supplier']],
      body: sortedMedicines.map(med => [
        med.name,
        med.type,
        med.category,
        med.quantityInStock,
        med.averageCost?.toFixed(2) || '0.00',
        med.salePrice?.toFixed(2) || '0.00',
        med.supplier?.name || 'N/A'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [54, 162, 235] },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 60 }, 2: { cellWidth: 70 }, 3: { cellWidth: 50 }, 4: { cellWidth: 70 }, 5: { cellWidth: 70 }, 6: { cellWidth: 80 } },
      margin: { left: 40, right: 40 }
    });
    doc.save('Medicine_Catalog.pdf');
  };

  return (
    <div className="medicine-list-container">
      <div className="list-header">
        <h1>Medicine Catalog</h1>
        <div className="search-bar-container">
          <input
            type="text"
            placeholder="Search by name, type, category..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="header-actions">
           
           <button 
              onClick={handleAiAnalysis} 
              className="action-button" 
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none' }}
              disabled={aiLoading}
          >
              {aiLoading ? 'Analyzing...' : 'AI Restock Suggestions'}
          </button>

          <button onClick={() => setIsAddModalOpen(true)} className="action-button">
            + Add Medicine
          </button>
          <button onClick={exportCSV} className="action-button" >Export CSV</button>
          <button onClick={exportPDF} className="action-button" >Export PDF</button>
          <button onClick={() => navigate('/')} className="action-button secondary" style={{ marginLeft: 'auto' }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {isAddModalOpen && (
        <AddMedicineModal onClose={() => setIsAddModalOpen(false)} onMedicineAdded={fetchMedicines} suppliers={suppliers} />
      )}
      
      {isAddStockModalOpen && (
        <AddStockModal 
            medicine={selectedMedicine}
            suppliers={suppliers}
            onClose={handleCloseAddStockModal}
            onStockAdded={fetchMedicines}
        />
      )}

      
      {showAiModal && (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '700px' }}>
                <div className="modal-header">
                    <h2>AI Procurement Suggestions</h2>
                    <button onClick={() => setShowAiModal(false)} className="close-button">&times;</button>
                </div>
                
                <div className="modal-body">
                    <p style={{marginBottom: '1rem', color: '#666'}}>
                        Based on your sales trends (last 30 days) vs. current stock levels.
                    </p>
                    
                    <table className="medicines-table" style={{marginTop: 0}}> 
                        <thead>
                            <tr>
                                <th>Medicine</th>
                                <th>Suggestion</th>
                                <th>Reasoning</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aiSuggestions && aiSuggestions.map((item, index) => (
                                <tr key={index}>
                                    <td style={{fontWeight: 'bold'}}>{item.medicine}</td>
                                    <td style={{color: '#2f855a', fontWeight: 'bold'}}>
                                        +{item.suggestedQty} units
                                    </td>
                                    <td style={{fontSize: '0.9rem', color: '#4a5568'}}>
                                        {item.reason}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {(!aiSuggestions || aiSuggestions.length === 0) && (
                        <p style={{textAlign: 'center', padding: '30px', color: '#718096'}}>
                            No urgent restocks needed! Your inventory is healthy.
                        </p>
                    )}
                </div>
                
                <div className="modal-footer">
                    <button onClick={() => setShowAiModal(false)} className="action-button secondary">Close</button>
                </div>
            </div>
        </div>
      )}

      {loading ? <p>Loading...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
        <form>
          <table className="medicines-table">
            <thead>
              <tr>
                <th className="sortable-header"><button type="button" onClick={() => requestSort('name')}>Name{getSortIndicator('name')}</button></th>
                <th className="sortable-header"><button type="button" onClick={() => requestSort('type')}>Type{getSortIndicator('type')}</button></th>
                <th className="sortable-header"><button type="button" onClick={() => requestSort('category')}>Category{getSortIndicator('category')}</button></th>
                <th className="th-quantity sortable-header"><button type="button" onClick={() => requestSort('quantityInStock')}>Quantity{getSortIndicator('quantityInStock')}</button></th>
                <th className="sortable-header"><button type="button" onClick={() => requestSort('procurementCost')}>Avg. Cost Price{getSortIndicator('procurementCost')}</button></th>
                <th className="sortable-header"><button type="button" onClick={() => requestSort('salePrice')}>Sale Price{getSortIndicator('salePrice')}</button></th>
                <th className="th-supplier sortable-header"><button type="button" onClick={() => requestSort('supplier.name')}>Supplier{getSortIndicator('supplier.name')}</button></th>
                <th className="th-actions ">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedMedicines.map((med) => (
                <tr key={med._id}>
                  {editingId === med._id ? (
                     <>
                      <td><input type="text" name="name" value={editFormData.name} onChange={handleFormChange} className="inline-edit-input" /></td>
                      <td><input type="text" name="type" value={editFormData.type} onChange={handleFormChange} className="inline-edit-input" /></td>
                      <td><input type="text" name="category" value={editFormData.category} onChange={handleFormChange} className="inline-edit-input" /></td>
                      <td>{med.quantityInStock}</td>
                      <td>{med.averageCost?.toFixed(2)}</td>
                       <td><input type="number" name="salePrice" value={editFormData.salePrice} onChange={handleFormChange} className="inline-edit-input" step="0.01" /></td>
                      <td>
                        <select name="supplier" value={editFormData.supplier} onChange={handleFormChange} className="inline-edit-select">
                          {suppliers.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button type="button" onClick={() => handleSaveClick(med._id)} className="table-action-button save-button">Save</button>
                        <button type="button" onClick={handleCancelClick} className="table-action-button cancel-button">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{med.name}</td>
                      <td>{med.type}</td>
                      <td>{med.category}</td>
                      <td>{med.quantityInStock}</td>
                      <td>{med.averageCost?.toFixed(2) || '0.00'} BDT</td>
                      <td>{med.salePrice?.toFixed(2) || '0.00'} BDT</td>
                      <td>{med.supplier?.name || 'N/A'}</td>
                      <td className="actions-cell">
                        <button type="button" onClick={() => handleOpenAddStockModal(med)} className="table-action-button add-stock-button">Add Stock</button>
                        <button type="button" onClick={() => handleEditClick(med)} className="table-action-button edit-button">Edit</button>
                        <button type="button" onClick={() => deleteHandler(med._id)} className="table-action-button delete-button">Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </form>
      )}
    </div>
  );
};

export default MedicineListPage;