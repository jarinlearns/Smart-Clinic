const Patient = require('../models/patientModel');
const User = require('../models/userModel');

const calculateTimeBySymptoms = (symptoms) => {
    const lowerCaseSymptoms = symptoms.toLowerCase();
    if (lowerCaseSymptoms.includes('chest pain') || lowerCaseSymptoms.includes('breathing difficulty') || lowerCaseSymptoms.includes('severe bleeding') || lowerCaseSymptoms.includes('fracture')) {
        return 25;
    }
    if (lowerCaseSymptoms.includes('migraine') || lowerCaseSymptoms.includes('abdominal pain') || lowerCaseSymptoms.includes('high fever')) {
        return 20;
    }
    return 15;
};

// @desc    Get the current patient queue (status: 'waiting')
// @route   GET /api/queue
const getPatientQueue = async (req, res) => {
    try {
        const queue = await Patient.find({ status: 'waiting' }).sort({ priority: -1, timeOfArrival: 1 });
        res.status(200).json(queue);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add a new walk-in patient to the queue
// @route   POST /api/queue
const addPatient = async (req, res) => {
    try {
        const { name, age, symptoms, priority } = req.body;

        if (!name || !age || !symptoms) {
            return res.status(400).json({ message: 'Please provide name, age, and symptoms' });
        }


        const patientData = {
            name,
            age,
            symptoms,
        };

        if (priority !== undefined) {
            patientData.priority = priority;
        }

        const patient = await Patient.create(patientData);

        res.status(201).json(patient);
    } catch (error) {
     
        console.error('ERROR ADDING PATIENT:', error); 
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get ALL patients (for the master list page)
// @route   GET /api/queue/all
const getAllPatients = async (req, res) => {
    try {
        const patients = await Patient.find({}).sort({ createdAt: -1 });
        res.status(200).json(patients);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get the estimated wait time for a specific patient
// @route   GET /api/queue/wait-time/:patientId
const getWaitTime = async (req, res) => {
    try {
        const patientId = req.params.patientId;
        const patient = await Patient.findById(patientId);
        if (!patient || patient.status !== 'waiting') {
            return res.status(404).json({ message: 'Patient not found in queue.' });
        }
        const queue = await Patient.find({ status: 'waiting' }).sort({ priority: -1, timeOfArrival: 1 });
        const activeDoctors = await User.countDocuments({ role: 'Doctor', status: 'on-duty' });

        if (activeDoctors === 0) {
            return res.status(200).json({ waitTime: -1, patientsAhead: queue.length - 1, activeDoctors: 0 });
        }

        let totalWaitTime = 0;
        let patientsAheadCount = 0;
        for (const p of queue) {
            if (p._id.toString() === patient._id.toString()) break;
            const baseTime = calculateTimeBySymptoms(p.symptoms);
            const extraTime = p.extraTime || 0;
            totalWaitTime += baseTime + extraTime;
            patientsAheadCount++;
        }

        const estimatedWaitTime = Math.ceil(totalWaitTime / activeDoctors);
        res.status(200).json({ patientId, patientsAhead: patientsAheadCount, activeDoctors, estimatedWaitTime });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a patient's status
// @route   PATCH /api/queue/:id
const updatePatientStatus = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const { status } = req.body;
        if (!status) return res.status(400).json({ message: 'Status is required' });

        patient.status = status;
        await patient.save();
        res.status(200).json(patient);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add extra time to a patient's consultation
// @route   PATCH /api/queue/:id/add-time
const addExtraTime = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const { minutes } = req.body;
        if (!minutes || isNaN(minutes)) {
            return res.status(400).json({ message: 'Valid number of minutes is required' });
        }

        patient.extraTime = (patient.extraTime || 0) + Number(minutes);
        await patient.save();
        res.status(200).json(patient);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getPatientQueue,
    addPatient,
    getAllPatients,
    getWaitTime,
    updatePatientStatus,
    addExtraTime,
};
