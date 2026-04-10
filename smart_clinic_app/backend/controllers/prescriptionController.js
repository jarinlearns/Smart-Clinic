const Prescription = require('../models/prescriptionModel.js');
const Patient = require('../models/patientModel.js');
const Medicine = require('../models/medicineModel.js');
const Invoice = require('../models/invoiceModel.js');
// @desc    Create a new prescription
// @route   POST /api/prescriptions
// @access  Private (Doctors only)
const addPrescription = async (req, res) => {
  try {
    const { patient, notes, medicines, diagnosis, consultationStartTime } = req.body;
    const doctor = req.user.id; 
    
    if (!patient || !medicines || !diagnosis || !consultationStartTime) {
      return res.status(400).json({ message: 'Patient, medicines, diagnosis, and start time are required.' });
    }

    const prescription = await Prescription.create({
      patient,
      doctor,
      notes,
      medicines,
      diagnosis,
      consultationStartTime,
    });

    await Patient.findByIdAndUpdate(patient, { status: 'done' });
    res.status(201).json(prescription);

  } catch (error) {
    console.error('ERROR CREATING PRESCRIPTION:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
const getMyPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctor: req.user.id })
      .sort({ createdAt: -1 })
      .populate('patient', 'name age') 
      .populate('medicines.medicine', 'name');
    res.json(prescriptions);
  } catch (error) {
    console.error('ERROR FETCHING DOCTOR PRESCRIPTIONS:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
const getPrescriptions = async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) {
            filter.status = { $in: Array.isArray(req.query.status) ? req.query.status : [req.query.status] };
        }
        const prescriptions = await Prescription.find(filter) 
            .sort({ createdAt: -1 })
            .populate('patient', 'name age')
            .populate('doctor', 'name')
            .populate('medicines.medicine', 'name salePrice');
        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const updatePrescriptionStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const prescription = await Prescription.findById(req.params.id)
            .populate('patient')
            .populate('doctor')
            .populate('medicines.medicine', 'name quantityInStock salePrice');
        if (prescription) {
            if (status === 'Filled' && prescription.status !== 'Filled') {
                for (const item of prescription.medicines) {
                    const medicineInStock = item.medicine;
                    if (medicineInStock.quantityInStock < item.quantity) {
                        return res.status(400).json({ 
                            message: `Insufficient stock for ${medicineInStock.name}. Only ${medicineInStock.quantityInStock} available.` 
                        });
                    }
                }
                for (const item of prescription.medicines) {
                    await Medicine.findByIdAndUpdate(item.medicine._id, {
                        $inc: { quantityInStock: -item.quantity } 
                    });
                }
                let totalAmount = 0;
                prescription.medicines.forEach(item => {
                    totalAmount += (item.medicine.salePrice || 0) * item.quantity;
                });

                if (totalAmount >= 0) {
                    await Invoice.create({
                        prescription: prescription._id,
                        patient: prescription.patient._id,
                        doctor: prescription.doctor._id,
                        totalAmount: totalAmount,
                    });
                }
            }
            prescription.status = status || prescription.status;
            const updatedPrescription = await prescription.save();
            res.json(updatedPrescription);
        } else {
            res.status(404).json({ message: 'Prescription not found' });
        }
    } catch (error) {
        console.error("ERROR UPDATING PRESCRIPTION:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
// @desc    Fill a prescription, create a detailed invoice, and update stock
// @route   POST /api/prescriptions/:id/fill
// @access  Private (Pharmacist)

const fillPrescriptionAndCreateInvoice = async (req, res) => {
    try {
        const { medicines: itemsToDispense } = req.body;
        
        if (!itemsToDispense || !Array.isArray(itemsToDispense) || itemsToDispense.length === 0) {
            return res.status(400).json({ message: 'No medicines were selected for dispensing.' });
        }

        const prescription = await Prescription.findById(req.params.id)
            .populate('medicines.medicine', 'name quantityInStock');

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }
        if (prescription.status === 'Filled') {
            return res.status(400).json({ message: 'This prescription has already been completely filled.' });
        }
        for (const itemToDispense of itemsToDispense) {
            const prescribedItem = prescription.medicines.find(p => p.medicine && p.medicine._id.toString() === itemToDispense.medicineId);
            if (!prescribedItem) {
                return res.status(400).json({ message: `A selected medicine was not found in the original prescription.` });
            }
            const remainingToDispense = prescribedItem.quantity - (prescribedItem.quantityDispensed || 0);
            if (itemToDispense.quantityToDispense > remainingToDispense) {
                return res.status(400).json({ message: `Cannot dispense ${itemToDispense.quantityToDispense} units of ${prescribedItem.medicine.name}. Only ${remainingToDispense} remaining.` });
            }
            if (prescribedItem.medicine.quantityInStock < itemToDispense.quantityToDispense) {
                return res.status(400).json({ message: `Insufficient stock for ${prescribedItem.medicine.name}.` });
            }
        }

        for (const itemToDispense of itemsToDispense) {
            await Medicine.findByIdAndUpdate(itemToDispense.medicineId, {
                $inc: { quantityInStock: -itemToDispense.quantityToDispense }
            });
        }
        
        const invoiceMedicines = itemsToDispense.map(item => ({
            medicine: item.medicineId,
            quantity: item.quantityToDispense,
            priceAtSale: item.salePrice,
        }));
        
        const totalAmount = invoiceMedicines.reduce((acc, item) => acc + (item.priceAtSale * item.quantity), 0);

        await Invoice.create({
            prescription: prescription._id,
            patient: prescription.patient,
            doctor: prescription.doctor,
            medicines: invoiceMedicines,
            totalAmount: totalAmount,
        });

        for (const itemToDispense of itemsToDispense) {
            await Prescription.updateOne(
                { "_id": prescription._id, "medicines.medicine": itemToDispense.medicineId },
                { "$inc": { "medicines.$.quantityDispensed": itemToDispense.quantityToDispense } }
            );
        }
        const updatedPrescriptionForStatusCheck = await Prescription.findById(req.params.id);
        let allItemsFilled = true;
        for (const item of updatedPrescriptionForStatusCheck.medicines) {
            if (item.quantityDispensed < item.quantity) {
                allItemsFilled = false;
                break;
            }
        }
        
        updatedPrescriptionForStatusCheck.status = allItemsFilled ? 'Filled' : 'Partially Filled';
        await updatedPrescriptionForStatusCheck.save();
        const populatedPrescription = await Prescription.findById(updatedPrescriptionForStatusCheck._id)
            .populate('patient', 'name age')
            .populate('doctor', 'name')
            .populate('medicines.medicine', 'name salePrice');

        res.json(populatedPrescription);

    } catch (error) {
        console.error("ERROR IN FILL PRESCRIPTION PROCESS:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};
module.exports = {
  addPrescription,
  getPrescriptions,
  updatePrescriptionStatus,
  fillPrescriptionAndCreateInvoice,
  getMyPrescriptions
};
