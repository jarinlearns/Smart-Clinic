const Invoice = require('../models/invoiceModel.js');
const Medicine = require('../models/medicineModel.js');

// @desc    Get pharmacy analytics (trends and categories)
// @route   GET /api/analytics/pharmacy
// @access  Private (Admin/Pharmacist)
const getPharmacyAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start and end dates are required.' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const dispensingTrend = await Invoice.aggregate([
            { $match: { invoiceDate: { $gte: start, $lte: end } } },
            { $unwind: '$medicines' },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$invoiceDate" } },
                    totalUnitsSold: { $sum: '$medicines.quantity' }
                }
            },
            { $sort: { _id: 1 } }, 
            { $project: { _id: 0, date: '$_id', totalUnitsSold: '$totalUnitsSold' } }
        ]);

        const dispensingByCategory = await Invoice.aggregate([
            { $match: { invoiceDate: { $gte: start, $lte: end } } },
            { $unwind: '$medicines' },
            {
                $lookup: {
                    from: 'medicines',
                    localField: 'medicines.medicine',
                    foreignField: '_id',
                    as: 'medicineInfo'
                }
            },
            { $unwind: '$medicineInfo' },
            {
                $group: {
                    _id: '$medicineInfo.category',
                    totalUnitsSold: { $sum: '$medicines.quantity' }
                }
            },
            { $sort: { totalUnitsSold: -1 } },
            { $project: { _id: 0, category: '$_id', totalUnitsSold: '$totalUnitsSold' } }
        ]);

        res.json({ dispensingTrend, dispensingByCategory });

    } catch (error) {
        console.error("Error fetching pharmacy analytics:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
// @desc    Get total revenue for the current day
// @route   GET /api/analytics/daily-revenue
// @access  Private (Admin/Pharmacist)
// @desc    Get total revenue for the current day (Paid invoices only)
// @route   GET /api/analytics/daily-revenue
// @access  Private (Admin/Pharmacist)
const getDailyRevenue = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

        const revenueStats = await Invoice.aggregate([
            { 
                $match: { 
                    // 1. Filter by Date (Today)
                    invoiceDate: { $gte: today, $lt: tomorrow },
                    // 2. Filter by Status (MUST be Paid)
                    status: 'Paid' 
                } 
            },
            {
                $group: {
                    _id: null,
                    // 3. Sum the 'totalAmount' field directly
                    totalDailyRevenue: { $sum: '$totalAmount' } 
                }
            }
        ]);

        const dailyRevenue = revenueStats.length > 0 ? revenueStats[0].totalDailyRevenue : 0;

        res.json({ dailyRevenue });

    } catch (error) {
        console.error("Error calculating daily revenue:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
module.exports = { getPharmacyAnalytics,getDailyRevenue };