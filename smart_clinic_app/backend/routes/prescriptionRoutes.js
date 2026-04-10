const express = require('express');
const router = express.Router();
const { addPrescription, getPrescriptions, updatePrescriptionStatus, fillPrescriptionAndCreateInvoice, getMyPrescriptions } = require('../controllers/prescriptionController.js');
const { protect } = require('../middleware/authMiddleware.js');

router.route('/')
  .get(protect, getPrescriptions)
  .post(protect, addPrescription);
router.route('/my-history').get(protect, getMyPrescriptions);
router.route('/:id/fill')
    .post(protect, fillPrescriptionAndCreateInvoice);

router.route('/:id')
    .patch(protect, updatePrescriptionStatus); 

module.exports = router;