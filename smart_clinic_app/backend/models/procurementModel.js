const mongoose = require('mongoose');

const procurementSchema = new mongoose.Schema({
    medicine: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Medicine',
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
    },
    quantityAdded: {
        type: Number,
        required: true,
    },
    costPerUnit: {
        type: Number,
        required: true,
    },
    totalCost: {
        type: Number,
        required: true,
    },
    purchaseDate: {
        type: Date,
        default: Date.now,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['Available', 'Quarantined'], 
        default: 'Available',
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    }
}, {
    timestamps: true,
});

const Procurement = mongoose.model('Procurement', procurementSchema);

module.exports = Procurement;