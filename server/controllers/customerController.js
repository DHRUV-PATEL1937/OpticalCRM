const Customer = require('../models/Customer');

// @desc    Get all customers (paginated, searchable)
// @route   GET /api/customers
exports.getCustomers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      sort = '-createdAt',
    } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single customer with purchase history
// @route   GET /api/customers/:id
exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Get recent purchases
    const Sale = require('../models/Sale');
    const purchases = await Sale.find({ customer: customer._id })
      .sort('-createdAt')
      .limit(20)
      .lean();

    res.json({ success: true, data: { ...customer.toObject(), purchases } });
  } catch (error) {
    next(error);
  }
};

// @desc    Create customer
// @route   POST /api/customers
exports.createCustomer = async (req, res, next) => {
  try {
    req.body.branch = req.user.branch;

    // Check if a soft-deleted customer with the same phone exists
    if (req.body.phone) {
      const existing = await Customer.findOne({ phone: req.body.phone, isActive: false });
      if (existing) {
        // Reactivate the soft-deleted customer with the new data
        Object.assign(existing, req.body, { isActive: true, totalPurchases: existing.totalPurchases, totalSpent: existing.totalSpent });
        await existing.save();
        return res.status(201).json({ success: true, data: existing });
      }
    }

    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
exports.updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete customer (soft delete)
// @route   DELETE /api/customers/:id
exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, message: 'Customer removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick search customers
// @route   GET /api/customers/search
exports.searchCustomers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });

    const customers = await Customer.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ],
    })
      .select('name phone email category totalSpent')
      .limit(10)
      .lean();

    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming birthdays
// @route   GET /api/customers/birthdays
exports.getUpcomingBirthdays = async (req, res, next) => {
  try {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const customers = await Customer.find({
      isActive: true,
      dateOfBirth: { $exists: true, $ne: null },
    })
      .select('name phone dateOfBirth')
      .lean();

    // Filter by month/day for upcoming birthdays
    const upcoming = customers.filter((c) => {
      const dob = new Date(c.dateOfBirth);
      const thisYearBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      return thisYearBday >= today && thisYearBday <= nextWeek;
    });

    res.json({ success: true, data: upcoming });
  } catch (error) {
    next(error);
  }
};
