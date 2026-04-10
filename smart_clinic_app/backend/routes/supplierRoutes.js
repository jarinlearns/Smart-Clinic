const express = require('express');
const router = express.Router();

const {
  getSuppliers,
  addSupplier,
  deleteSupplier,
  updateSupplier,
} = require('../controllers/supplierController.js');

const { protect } = require('../middleware/authMiddleware.js');

router.route('/').get(protect, getSuppliers).post(protect, addSupplier);

router
  .route('/:id')
  .delete(protect, deleteSupplier)
  .put(protect, updateSupplier);


module.exports = router;