const express = require('express');
const router = express.Router();
const { 
  getPatients, 
  addPatient, 
  updatePatient, 
  deletePatient,
  getWaitTime,
  getPatientById,
  cancelPatientFromQueue,
  selfEnrollInQueue,
  approvePatientRequest
} = require('../controllers/patientController.js');
const { protect } = require('../middleware/authMiddleware.js');

router.route('/')
  .get(protect, getPatients) 
  .post(protect, addPatient);

router.route('/:id/wait-time')
    .get(protect, getWaitTime);
router.route('/:id/cancel')
    .patch(protect, cancelPatientFromQueue);
router.route('/:id')
.get(protect, getPatientById)
  .put(protect, updatePatient)
  .delete(protect, deletePatient);
router.route('/self-enroll').post(protect, selfEnrollInQueue);

router.route('/:id/approve').patch(protect, approvePatientRequest);
module.exports = router;