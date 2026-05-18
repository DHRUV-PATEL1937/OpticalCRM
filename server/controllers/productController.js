const Product = require('../models/Product');

// @desc    Get all products (paginated, searchable)
// @route   GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      brand,
      gender,
      sort = '-createdAt',
      active,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;
    if (brand) query.brand = { $regex: brand, $options: 'i' };
    if (gender) query.gender = gender;
    if (active !== undefined) query.isActive = active === 'true';
    else query.isActive = true;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: products,
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

// @desc    Get single product
// @route   GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product
// @route   POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;
    req.body.branch = req.user.branch;
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (soft delete)
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deactivated' });
  } catch (error) {
    next(error);
  }
};

// @desc    Quick search products
// @route   GET /api/products/search
exports.searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ success: true, data: [] });
    }

    // First try exact barcode match (for scanner speed)
    const exactMatch = await Product.findOne({ isActive: true, barcode: q })
      .select('name sku category brand sellingPrice stockQuantity images barcode')
      .lean();

    if (exactMatch) {
      return res.json({ success: true, data: [exactMatch], exactMatch: true });
    }

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
      ],
    })
      .select('name sku category brand sellingPrice stockQuantity images barcode')
      .limit(10)
      .lean();

    res.json({ success: true, data: products, exactMatch: false });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
exports.getLowStock = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
    })
      .select('name sku category brand stockQuantity lowStockThreshold')
      .sort('stockQuantity')
      .limit(50)
      .lean();

    res.json({ success: true, data: products, count: products.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all unique brands
// @route   GET /api/products/brands
exports.getBrands = async (req, res, next) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true, brand: { $ne: '' } });
    res.json({ success: true, data: brands.sort() });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload product image
// @route   POST /api/products/upload
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    
    // Create URL path for the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    next(error);
  }
};
