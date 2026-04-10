const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['Patient', 'Receptionist', 'Doctor', 'Pharmacist', 'Admin'],
    default: 'Patient',
  },
  specialty: {
    type: String,
    required: false, 
  },
  consultationFee: {
      type: Number,
      required: false,
  },
  isAvailable: {
      type: Boolean,
      default: false, 
      required: false,
  }
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;