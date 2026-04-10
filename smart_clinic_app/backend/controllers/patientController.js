const Patient = require('../models/patientModel.js');
const User = require('../models/userModel.js');

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
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('assignedDoctor', 'name specialty');
    if (patient) {
      res.json(patient);
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
const cancelPatientFromQueue = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (patient) {
      if (patient.status === 'done' || patient.status === 'cancelled') {
        return res.status(400).json({ message: `Patient is already ${patient.status} and cannot be cancelled.` });
      }

      patient.status = 'cancelled';
      const updatedPatient = await patient.save();
      res.json(updatedPatient);
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  } catch (error) {
    console.error("ERROR CANCELLING PATIENT:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};
// @desc    Fetch all patients (powerful version with search, filter, sort)
// @route   GET /api/patients
const getPatients = async (req, res) => {
  try {
    const keyword = req.query.keyword ? {
      $or: [
        { name: { $regex: req.query.keyword, $options: 'i' } },
        { symptoms: { $regex: req.query.keyword, $options: 'i' } },
        { 'contact.email': { $regex: req.query.keyword, $options: 'i' } },
        { 'contact.phone': { $regex: req.query.keyword, $options: 'i' } },
      ],
    } : {};
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.doctorId) {
      filter.assignedDoctor = req.query.doctorId;
    }
    const { sort, order } = req.query;
    const sortOptions = {};
    if (sort) {
      sortOptions[sort] = order === 'asc' ? 1 : -1;
    } else {
      sortOptions.priority = -1;
      sortOptions.timeOfArrival = 1;
    }
    const patients = await Patient.find({ ...filter, ...keyword }).sort(sortOptions).populate('assignedDoctor', 'name specialty');
    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a new patient
// @route   POST /api/patients
const addPatient = async (req, res) => {
  try {
    const { name, age, symptoms, phone, email,priority, assignedDoctor } = req.body;
    const patient = new Patient({
      name,
      age,
      symptoms,
      contact: { phone, email },
      assignedDoctor,
      priority,
    });
    const createdPatient = await patient.save();
    res.status(201).json(createdPatient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a patient record
// @route   PUT /api/patients/:id
// const updatePatient = async (req, res) => {
//   const { name, age, symptoms, phone, email, assignedDoctor, status, priority, extraTime } = req.body;
//   try {
//     const patient = await Patient.findById(req.params.id);
//     if (patient) {
//       patient.name = name || patient.name;
//       patient.age = age || patient.age;
//       patient.symptoms = symptoms || patient.symptoms;
//       patient.contact.phone = phone || patient.contact.phone;
//       patient.contact.email = email || patient.contact.email;
//       patient.status = status || patient.status;
//       patient.assignedDoctor = assignedDoctor || patient.assignedDoctor;
//       patient.priority = priority ?? patient.priority;
//       patient.extraTime = extraTime ?? patient.extraTime;

//       const updatedPatient = await patient.save();
//       res.json(updatedPatient);
//     } else {
//       res.status(404).json({ message: 'Patient not found' });
//     }
//   } catch (error) {
//     res.status(500).json({ message: 'Server Error' });
//   }
// };

const updatePatient = async (req, res) => {
  const {
    name,
    age,
    symptoms,
    phone,
    email,
    assignedDoctor,
    status,
    priority,
    extraTime,
    timeOfArrival
  } = req.body;

  try {
    const patient = await Patient.findById(req.params.id);

    if (patient) {
      patient.name = name || patient.name;
      patient.age = age || patient.age;
      patient.symptoms = symptoms || patient.symptoms;
      patient.contact.phone = phone || patient.contact.phone;
      patient.contact.email = email || patient.contact.email;
      patient.status = status || patient.status;
      patient.assignedDoctor = assignedDoctor || patient.assignedDoctor;
      patient.priority = priority ?? patient.priority;
      patient.extraTime = extraTime ?? patient.extraTime;

      if (timeOfArrival) {
        patient.timeOfArrival = timeOfArrival;
      }

      const updatedPatient = await patient.save();
      res.json(updatedPatient);
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Delete a patient record
// @route   DELETE /api/patients/:id
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (patient) {
      await patient.deleteOne();
      res.json({ message: 'Patient removed' });
    } else {
      res.status(404).json({ message: 'Patient not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Get the estimated wait time for a specific patient
// @route   GET /api/patients/wait-time/:patientId
const getWaitTime = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const patient = await Patient.findById(patientId);

    if (!patient || patient.status !== 'waiting') {
      return res.status(404).json({ message: 'Patient not found in queue.' });
    }

    const queue = await Patient.find({
      status: 'waiting',
      assignedDoctor: patient.assignedDoctor
    }).sort({ priority: -1, timeOfArrival: 1 });

    let totalWaitTime = 0;
    let patientsAheadCount = 0;
    for (const p of queue) {
      if (p._id.toString() === patient._id.toString()) break;
      totalWaitTime += calculateTimeBySymptoms(p.symptoms) + (p.extraTime || 0);
      patientsAheadCount++;
    }

    res.status(200).json({ patientId, patientsAhead: patientsAheadCount, estimatedWaitTime: totalWaitTime });

  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const selfEnrollInQueue = async (req, res) => {
  try {
    const { assignedDoctor, symptoms } = req.body;
    const user = await User.findById(req.user.id);

    if (!assignedDoctor || !symptoms) {
      return res.status(400).json({ message: 'Doctor and symptoms are required.' });
    }
    
    const patient = await Patient.create({
      name: user.name,
      age: user.age || 0,
      symptoms,
      assignedDoctor,
      userAccount: user._id,
      status: 'pending-approval', 
      priority: 99, 
    });

    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const approvePatientRequest = async (req, res) => {
    try {
        const patientToApprove = await Patient.findById(req.params.id);
        if (!patientToApprove) {
            return res.status(404).json({ message: 'Patient request not found.' });
        }
        
        patientToApprove.symptoms = req.body.symptoms || patientToApprove.symptoms;
        patientToApprove.assignedDoctor = req.body.assignedDoctor || patientToApprove.assignedDoctor;

        const currentQueue = await Patient.find({ 
            assignedDoctor: patientToApprove.assignedDoctor, 
            status: "waiting" 
        });

        const allPatientsForSort = [...currentQueue, patientToApprove];

        const aiDeterminedPriority = 1;
        
        patientToApprove.status = 'waiting';
        patientToApprove.priority = aiDeterminedPriority;
        await patientToApprove.save();

        for (let i = 0; i < currentQueue.length; i++) {
            const patient = currentQueue[i];
            patient.priority = i + 2;
            await patient.save();
        }

        res.json({ message: `${patientToApprove.name} has been approved and added to the queue.` });

    } catch (error) {
        console.error("ERROR APPROVING PATIENT:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
  getPatients,
  addPatient,
  updatePatient,
  deletePatient,
  getWaitTime,
  getPatientById,
  cancelPatientFromQueue,
  selfEnrollInQueue,
  approvePatientRequest
};