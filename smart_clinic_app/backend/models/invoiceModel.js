const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    prescription: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Prescription',
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Patient',
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    medicines: [{
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Medicine',
        },
        quantity: {
            type: Number,
            required: true,
        },
        priceAtSale: { 
            type: Number,
            required: true,
        }
    }],
    totalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['Unpaid', 'Paid'],
        default: 'Unpaid',
    },
    invoiceDate: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;