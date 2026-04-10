const express = require('express');
const router = express.Router();
const { getProcurements, getInventoryAnalysisData } = require('../controllers/procurementController.js'); 
const { protect } = require('../middleware/authMiddleware.js');

router.route('/').get(protect, getProcurements);


router.route('/analysis-data').get(protect, getInventoryAnalysisData);

module.exports = router;