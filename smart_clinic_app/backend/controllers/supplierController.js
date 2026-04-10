const Supplier = require('../models/supplierModel');

// @desc    Fetch all suppliers
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({}).sort({ name: 1 }); 
    res.status(200).json(suppliers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
// @desc    Update a supplier
// @route   PUT /api/suppliers/:id
// @access  Private
const updateSupplier = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const supplier = await Supplier.findById(req.params.id);

    if (supplier) {
      supplier.name = name || supplier.name;
      supplier.contact.phone = phone || supplier.contact.phone;
      supplier.contact.email = email || supplier.contact.email;

      const updatedSupplier = await supplier.save();
      res.json(updatedSupplier);
    } else {
      res.status(404).json({ message: 'Supplier not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
// @desc    Add a new supplier
// @route   POST /api/suppliers
// @access  Private
const addSupplier = async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Supplier name is required.' });
    }

    const supplierExists = await Supplier.findOne({ name });
    if (supplierExists) {
      return res.status(400).json({ message: 'A supplier with this name already exists.' });
    }

    const supplier = await Supplier.create({
      name,
      contact: { phone, email },
    });

    res.status(201).json(supplier);

  } catch (error) {
    console.error('ERROR ADDING SUPPLIER:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a supplier
// @route   DELETE /api/suppliers/:id
// @access  Private
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (supplier) {
      await supplier.deleteOne();
      res.json({ message: 'Supplier removed' });
    } else {
      res.status(404).json({ message: 'Supplier not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getSuppliers,
  addSupplier,
  deleteSupplier,
updateSupplier,
};