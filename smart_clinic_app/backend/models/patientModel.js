const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    userAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    assignedDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, 
    },
    name: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
    symptoms: {
        type: String,
        required: true,
    },
    contact: {
        phone: {
            type: String,
            required: false, 
        },
        email: {
            type: String,
            required: false,
        }
    },
    timeOfArrival: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending-approval', 'waiting', 'in-consultation', 'done', 'cancelled'],
        default: 'waiting',
    },
    priority: {
        type: Number,
        default: 0,
    },
    extraTime: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;