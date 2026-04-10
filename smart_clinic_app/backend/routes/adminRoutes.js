const express = require('express');
const router = express.Router();
const { getDashboardStats, getOperationalAnalytics } = require('../controllers/adminController.js');
const { protect } = require('../middleware/authMiddleware.js');

router.route('/dashboard-stats').get(protect, getDashboardStats);

router.route('/operational-analytics').get(protect, getOperationalAnalytics);

module.exports = router;