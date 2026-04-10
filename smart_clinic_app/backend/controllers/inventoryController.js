const Medicine = require('../models/medicineModel.js');
const Procurement = require('../models/procurementModel.js');
const Expense = require('../models/expenseModel.js');
const Invoice = require('../models/invoiceModel.js');
const mongoose = require('mongoose'); 

// @desc    Scan for and quarantine expired stock
// @route   POST /api/inventory/quarantine-expired
// @access  Private (Admin/Pharmacist)
const scanAndQuarantineExpiredStock = async (req, res) => {
    try {
        const today = new Date();
        const expiredBatches = await Procurement.find({
            status: 'Available',
            expiryDate: { $lte: today }
        });

        if (expiredBatches.length === 0) {
            return res.json({ message: 'No expired stock found to quarantine.' });
        }

        let totalLoss = 0;

        for (const batch of expiredBatches) {
            const medicine = await Medicine.findById(batch.medicine);
            if (medicine) {
                medicine.quantityInStock -= batch.quantityAdded;
                await medicine.save();
                const lossForThisBatch = batch.quantityAdded * medicine.averageCost;
                totalLoss += lossForThisBatch;
            }
            batch.status = 'Quarantined';
            await batch.save();
        }

        if (totalLoss > 0) {
            await Expense.create({
                type: 'Loss (Expired Stock)',
                amount: totalLoss,
                description: `Loss from ${expiredBatches.length} expired medicine batches.`,
                recordedBy: req.user.id,
            });
        }

        res.json({
            message: `${expiredBatches.length} batches quarantined successfully.`,
            totalLoss: totalLoss.toFixed(2),
        });

    } catch (error) {
        console.error("ERROR DURING QUARANTINE PROCESS:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get most dispensed medicines within a date range
// @route   GET /api/inventory/analytics/most-dispensed
// @access  Private
const getMostDispensedMedicines = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Please provide both start and end dates.' });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const mostDispensed = await Invoice.aggregate([
            { $match: { invoiceDate: { $gte: start, $lte: end } } },
            { $unwind: '$medicines' },
            {
                $group: {
                    _id: '$medicines.medicine',
                    totalQuantityDispensed: { $sum: '$medicines.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$medicines.quantity', '$medicines.priceAtSale'] } }
                }
            },
            {
                $lookup: {
                    from: 'medicines',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'medicineInfo'
                }
            },
            { $unwind: '$medicineInfo' },
            {
                $project: {
                    _id: 0,
                    medicineId: '$_id',
                    medicineName: '$medicineInfo.name',
                    totalQuantityDispensed: '$totalQuantityDispensed',
                    totalRevenue: '$totalRevenue'
                }
            },
            { $sort: { totalRevenue: -1 } },
        ]);
        
        res.json(mostDispensed);

    } catch (error) {
        console.error('Error fetching dispensing analytics:', error);
        res.status(500).json({ message: 'Server error while fetching analytics.' });
    }
};

module.exports = {
    scanAndQuarantineExpiredStock,
    getMostDispensedMedicines,
};