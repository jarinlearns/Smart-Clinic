const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: { 
    type: String,
    required: true,
  },
  category: { 
    type: String,
    required: true,
  },
    averageCost: {
    type: Number,
    required: true,
    default: 0,
  },
  procurementCost: {
    type: Number,
    required: true,
    default: 0,
  },
  salePrice: {
    type: Number,
    required: true,
    default: 0,
  },
  quantityInStock: {
    type: Number,
    required: true,
    default: 0,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  },
}, {
  timestamps: true,
});

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine;