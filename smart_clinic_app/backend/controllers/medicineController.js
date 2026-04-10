const Medicine = require('../models/medicineModel');
const Supplier = require('../models/supplierModel');
const Procurement = require('../models/procurementModel.js');

// @desc    Fetch all medicines
// @route   GET /api/medicines
// @access  Private
const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({}).populate('supplier', 'name');
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
// @desc    Fetch single medicine
// @route   GET /api/medicines/:id
// @access  Private
const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id).populate('supplier', 'name');

    if (medicine) {
      res.json(medicine);
    } else {
      res.status(404).json({ message: 'Medicine not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
// @desc    Add a new medicine AND log the initial procurement
// @route   POST /api/medicines
// @access  Private
const addMedicine = async (req, res) => {
  try {
    const { name, type, category, quantityInStock, supplier, salePrice, procurementCost, expiryDate } = req.body;
    
    const medicine = new Medicine({
      name, type, category, quantityInStock, supplier, salePrice,
      procurementCost,
      averageCost: procurementCost,
    });
    const createdMedicine = await medicine.save();

    if (createdMedicine && quantityInStock > 0) {
        await Procurement.create({
            medicine: createdMedicine._id,
            supplier,
            quantityAdded: quantityInStock,
            costPerUnit: procurementCost,
            totalCost: procurementCost * quantityInStock,
            recordedBy: req.user.id,
            expiryDate,
        });
    }
    res.status(201).json(createdMedicine);
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

const addStockToMedicine = async (req, res) => {
    const { quantityAdded, costPerUnit, supplier, expiryDate } = req.body;
    
    try {
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine) { return res.status(404).json({ message: 'Medicine not found' }); }

        const oldStock = medicine.quantityInStock;
        const oldAvgCost = medicine.averageCost;
        const oldTotalValue = oldStock * oldAvgCost;
        const newStockPurchaseValue = Number(quantityAdded) * Number(costPerUnit);
        const newTotalStock = oldStock + Number(quantityAdded);
        const newTotalValue = oldTotalValue + newStockPurchaseValue;
        const newAverageCost = newTotalStock > 0 ? newTotalValue / newTotalStock : 0;

        await Procurement.create({
            medicine: medicine._id,
            supplier,
            quantityAdded,
            costPerUnit,
            totalCost: newStockPurchaseValue,
            recordedBy: req.user.id,
            expiryDate,
        });

        medicine.quantityInStock = newTotalStock;
        medicine.averageCost = newAverageCost;
        medicine.procurementCost = costPerUnit;
        medicine.supplier = supplier;
        
        const updatedMedicine = await medicine.save();
        res.json(updatedMedicine);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

const updateMedicine = async (req, res) => {
  const { name, type, category, supplier, salePrice } = req.body;
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (medicine) {
      medicine.name = name || medicine.name;
      medicine.type = type || medicine.type;
      medicine.category = category || medicine.category;
      medicine.supplier = supplier || medicine.supplier;
      medicine.salePrice = salePrice ?? medicine.salePrice;
      const updatedMedicine = await medicine.save();
      res.json(updatedMedicine);
    } else { res.status(404).json({ message: 'Medicine not found' }); }
  } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// @desc    Delete a medicine
// @route   DELETE /api/medicines/:id
// @access  Private
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (medicine) {
      await medicine.deleteOne(); 
      res.json({ message: 'Medicine removed' });
    } else {
      res.status(404).json({ message: 'Medicine not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getMedicines, getMedicineById, addMedicine, updateMedicine, deleteMedicine, addStockToMedicine };