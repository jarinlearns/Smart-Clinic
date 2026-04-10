const Invoice = require('../models/invoiceModel.js');

// @desc    Fetch all invoices
// @route   GET /api/invoices
// @access  Private (Admin/Pharmacist)
const getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({})
            .sort({ invoiceDate: -1 })
            .populate('patient', 'name')
            .populate('doctor', 'name');

        res.json(invoices);
    } catch (error) {
        console.error("ERROR FETCHING INVOICES:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update an invoice's status
// @route   PATCH /api/invoices/:id
// @access  Private (Admin/Pharmacist)
const updateInvoiceStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const invoice = await Invoice.findById(req.params.id);

        if (invoice) {
            invoice.status = status || invoice.status;
            const updatedInvoice = await invoice.save();
            res.json(updatedInvoice);
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    } catch (error) {
        console.error("ERROR UPDATING INVOICE:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};


module.exports = {
    getInvoices,
    updateInvoiceStatus,
};
