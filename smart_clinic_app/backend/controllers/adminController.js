const Invoice = require('../models/invoiceModel.js');
const Procurement = require('../models/procurementModel.js');
const Expense = require('../models/expenseModel.js');
const Prescription = require('../models/prescriptionModel.js');




const getDashboardStats = async (req, res) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'User is not authorized to access this data.' });
    }
    try {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const revenueData = await Invoice.aggregate([
            { $match: { status: 'Paid', invoiceDate: { $gte: thirtyDaysAgo } }},
            { $group: { _id: null, total: { $sum: '$totalAmount' }}}
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
        const procurementData = await Procurement.aggregate([
            { $match: { purchaseDate: { $gte: thirtyDaysAgo } }},
            { $group: { _id: null, total: { $sum: '$totalCost' }}}
        ]);
        const totalProcurementExpenses = procurementData.length > 0 ? procurementData[0].total : 0;
        const totalExpenses = totalProcurementExpenses;
        const netProfit = totalRevenue - totalExpenses;
        res.json({ totalRevenue, totalExpenses, netProfit });
    } catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};




const getOperationalAnalytics = async (req, res) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'User is not authorized to access this data.' });
    }
    try {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        const symptomFrequency = await Prescription.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }}},
            { $group: { _id: '$diagnosis', count: { $sum: 1 }}},
            { $sort: { count: -1 }},
            { $limit: 7 },
            { $project: { _id: 0, symptom: '$_id', count: 1 }}
        ]);
        
const patientVolume = await Invoice.aggregate([
    
    { $match: { invoiceDate: { $gte: sevenDaysAgo }}},

    
    
    { $group: {
        _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" } },
            patient: "$patient" 
        }
    }},

    
    { $group: {
        _id: "$_id.day",
        uniquePatients: { $sum: 1 } 
    }},

    
    { $sort: { _id: 1 }}, 
    { $project: { _id: 0, date: '$_id', count: '$uniquePatients' }}
]);
        
        res.json({ symptomFrequency, patientVolume });

    } catch (error) {
        console.error("Error fetching operational analytics:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};


module.exports = { getDashboardStats, getOperationalAnalytics };