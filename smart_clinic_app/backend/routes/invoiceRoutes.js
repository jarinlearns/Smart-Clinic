const express = require('express');
const router = express.Router();
const { getInvoices, updateInvoiceStatus } = require('../controllers/invoiceController.js');
const { protect } = require('../middleware/authMiddleware.js');

router.route('/').get(protect, getInvoices);

router.route('/:id').patch(protect, updateInvoiceStatus);

module.exports = router;
