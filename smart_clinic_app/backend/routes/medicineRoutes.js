const express = require('express');
const router = express.Router();
const { 
  getMedicines, 
  getMedicineById,
  addMedicine, 
  updateMedicine, 
  deleteMedicine,
  addStockToMedicine,
} = require('../controllers/medicineController.js'); 
const { protect } = require('../middleware/authMiddleware.js');


router.route('/:id/addstock')
    .patch(protect, addStockToMedicine);
router.route('/')

  .get(protect, getMedicines)
  .post(protect, addMedicine);

router.route('/:id')
  .get(protect, getMedicineById)
  .put(protect, updateMedicine)
  .delete(protect, deleteMedicine);

module.exports = router;