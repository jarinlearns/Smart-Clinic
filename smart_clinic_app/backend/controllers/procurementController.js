const Procurement = require('../models/procurementModel.js');
const Invoice = require('../models/invoiceModel.js');
const Medicine = require('../models/medicineModel.js');


const getProcurements = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const filter = {};
        if (startDate || endDate) {
            filter.purchaseDate = {};
            if (startDate) filter.purchaseDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.purchaseDate.$lte = end;
            }
        }
        const procurements = await Procurement.find(filter)
            .sort({ purchaseDate: -1 })
            .populate('medicine', 'name type')
            .populate('supplier', 'name')
            .populate('recordedBy', 'name');

        res.json(procurements);
    } catch (error) {
        console.error("ERROR FETCHING PROCUREMENTS:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};



const getInventoryAnalysisData = async (req, res) => {
    try {
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const salesStats = await Invoice.aggregate([
            { $match: { invoiceDate: { $gte: thirtyDaysAgo }, status: 'Paid' } },
            { $unwind: '$medicines' },
            { $group: { _id: '$medicines.medicine', totalSold: { $sum: '$medicines.quantity' } } }
        ]);

        const salesMap = {};
        salesStats.forEach(stat => { salesMap[stat._id.toString()] = stat.totalSold; });

        
        const medicines = await Medicine.find({}).select('name quantityInStock');

        
        
        const analysisData = medicines.map(med => ({
            name: med.name,
            stock: med.quantityInStock,
            sold: salesMap[med._id.toString()] || 0
        })).filter(item => item.sold > 0 || item.stock < 50); 

        res.json(analysisData);

    } catch (error) {
        console.error("DATA ERROR:", error);
        res.status(500).json({ message: 'Failed to prepare data' });
    }
};

module.exports = { getProcurements, getInventoryAnalysisData };