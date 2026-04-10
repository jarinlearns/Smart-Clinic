const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
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
    diagnosis: {
        type: String,
        required: true,
        default: 'Not specified',
    },
    consultationStartTime: {
        type: Date,
        required: true,
    },
    consultationEndTime: {
        type: Date,
        default: Date.now, 
    },
    notes: {
        type: String,
        required: false,
    },
    medicines: [{
        medicine: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Medicine',
        },
        dosage: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        quantityDispensed: {
            type: Number,
            required: true,
            default: 0,
        }
    }],
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Partially Filled', 'Filled', 'Cancelled'],
        default: 'Pending',
    },
}, {
    timestamps: true,
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);

module.exports = Prescription;
