const express = require('express');
const router = express.Router();
const { scanAndQuarantineExpiredStock, getMostDispensedMedicines } = require('../controllers/inventoryController.js');
const { protect } = require('../middleware/authMiddleware.js');

router.route('/quarantine-expired').post(protect, scanAndQuarantineExpiredStock);

router.route('/analytics/most-dispensed').get(protect, getMostDispensedMedicines);

module.exports = router;