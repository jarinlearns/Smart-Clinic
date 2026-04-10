import React, { useState, useEffect, useMemo } from 'react';
import { fillPrescription } from '../services/prescriptionService';
import './SharedModal.css';

const PrescriptionDetailsModal = ({ prescription, onClose, onSuccess }) => {
  const [itemsToSell, setItemsToSell] = useState([]);
  const [isFilling, setIsFilling] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(false);
    if (prescription && prescription.medicines) {
      const initialItems = prescription.medicines
        .map(item => {
          if (!item.medicine) return null;
          
          const remaining = item.quantity - (item.quantityDispensed || 0);
          return {
            medicineId: item.medicine._id,
            name: item.medicine.name,
            salePrice: item.medicine.salePrice,
            prescribed: item.quantity,
            dispensed: item.quantityDispensed || 0,
            remaining: remaining,
            quantityToDispense: Math.max(0, remaining),
            selected: remaining > 0,
          };
        })
        .filter(item => item && item.remaining > 0);
      
      setItemsToSell(initialItems);
    } else {
      setItemsToSell([]);
    }
    setIsInitialized(true);
  }, [prescription]);

  const handleQuantityChange = (medicineId, newQuantity) => {
    setItemsToSell(itemsToSell.map(item => {
      if (item.medicineId === medicineId) {
        const qty = Math.max(0, Math.min(item.remaining, Number(newQuantity) || 0));
        return { ...item, quantityToDispense: qty };
      }
      return item;
    }));
  };

  const handleSelectionChange = (medicineId) => {
    setItemsToSell(itemsToSell.map(item => 
      item.medicineId === medicineId ? { ...item, selected: !item.selected } : item
    ));
  };

  const totalBill = useMemo(() => {
    return itemsToSell.reduce((total, item) => {
      if (item.selected) {
        return total + (item.salePrice * item.quantityToDispense);
      }
      return total;
    }, 0);
  }, [itemsToSell]);

  const handleFillPrescription = async () => {
    const payload = itemsToSell
      .filter(item => item.selected && item.quantityToDispense > 0)
      .map(({ medicineId, salePrice, quantityToDispense }) => ({
        medicineId,
        salePrice,
        quantityToDispense,
      }));

    if (payload.length === 0) {
      alert('No items selected to dispense.');
      return;
    }

    setIsFilling(true);
    try {
      const updatedPrescription = await fillPrescription(prescription._id, payload);
      alert('Transaction successful and invoice created.');
      onSuccess(updatedPrescription); 
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process transaction.');
    } finally {
      setIsFilling(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content prescription-modal large">
        {!prescription || !isInitialized ? (
          <p>Loading prescription details...</p>
        ) : (
          <>
            <div className="modal-header">
              <h2>Dispense Prescription (Status: {prescription.status})</h2>
              <button onClick={onClose} className="close-button">&times;</button>
            </div>
            <div className="prescription-section">
              <h4>Medicines to Dispense:</h4>
              <table className="medicines-prescribed-table interactive">
                <thead>
                  <tr>
                    <th>Dispense</th>
                    <th>Medicine</th>
                    <th>Prescribed</th>
                    <th>Dispensed</th>
                    <th>Remaining</th>
                    <th>Quantity to Sell</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsToSell.length > 0 ? (
                    itemsToSell.map(item => (
                      <tr key={item.medicineId}>
                        <td><input type="checkbox" checked={item.selected} onChange={() => handleSelectionChange(item.medicineId)}/></td>
                        <td>{item.name}</td>
                        <td>{item.prescribed}</td>
                        <td>{item.dispensed}</td>
                        <td>{item.remaining}</td>
                        <td><input type="number" className="quantity-input" value={item.quantityToDispense} onChange={(e) => handleQuantityChange(item.medicineId, e.target.value)} max={item.remaining} min="0"/></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6">All prescribed items have been dispensed.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <div className="total-bill"><strong>Total for this transaction:</strong> {totalBill.toFixed(2)} BDT</div>
              <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
              <button type="button" className="fill-button" onClick={handleFillPrescription} disabled={isFilling || totalBill === 0 || itemsToSell.length === 0}>
                {isFilling ? 'Processing...' : `Sell Selected (${totalBill.toFixed(2)} BDT)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PrescriptionDetailsModal;