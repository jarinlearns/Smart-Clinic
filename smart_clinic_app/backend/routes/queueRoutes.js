const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getPatientQueue, 
    addPatient,
    getAllPatients, 
    getWaitTime, 
    updatePatientStatus,
    addExtraTime,
} = require('../controllers/queueController');

router.route('/').post(protect, addPatient);
router.route('/').get(protect, getPatientQueue);
router.route('/all').get(protect, getAllPatients);
router.route('/wait-time/:patientId').get(protect, getWaitTime);
router.route('/:id').patch(protect, updatePatientStatus);
router.route('/:id/add-time').patch(protect, addExtraTime);

module.exports = router;
