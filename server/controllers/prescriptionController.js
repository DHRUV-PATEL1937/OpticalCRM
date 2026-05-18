const Prescription = require('../models/Prescription');
const Customer = require('../models/Customer');

// @desc    Get prescriptions for a customer
// @route   GET /api/prescriptions/customer/:customerId
exports.getCustomerPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ customer: req.params.customerId })
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .lean();
    res.json({ success: true, data: prescriptions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
exports.getPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('customer', 'name phone')
      .populate('createdBy', 'name');
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    res.json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
};

// @desc    Create prescription
// @route   POST /api/prescriptions
exports.createPrescription = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;
    req.body.branch = req.user.branch;
    const prescription = await Prescription.create(req.body);
    res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
exports.updatePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    res.json({ success: true, data: prescription });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
exports.deletePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }
    res.json({ success: true, message: 'Prescription deleted' });
  } catch (error) {
    next(error);
  }
};
