const express = require('express');
const router = express.Router();
const { getPharmacyAnalytics,getDailyRevenue } = require('../controllers/analyticsController.js');
const { protect } = require('../middleware/authMiddleware.js');

router.route('/pharmacy').get(protect, getPharmacyAnalytics);
router.get('/daily-revenue', protect, getDailyRevenue);
module.exports = router;