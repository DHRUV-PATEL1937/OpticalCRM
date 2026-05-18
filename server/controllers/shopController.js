const Product = require('../models/Product');
const OnlineOrder = require('../models/OnlineOrder');

// @desc    Get all active products for the public shop
// @route   GET /api/shop/products
exports.getPublicProducts = async (req, res, next) => {
  try {
    const { category, brand, search, page = 1, limit = 24 } = req.query;

    const query = { isActive: true, stockQuantity: { $gt: 0 } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;
    if (brand) query.brand = brand;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .select('name category brand sellingPrice mrp images stockQuantity color size description')
      .sort('-createdAt')
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

// @desc    Submit a new online order
// @route   POST /api/shop/checkout
exports.checkoutOrder = async (req, res, next) => {
  try {
    const { customerName, customerPhone, customerEmail, shippingAddress, items, totalAmount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Validate stock and prepare order items
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || product.stockQuantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${item.productName}` });
      }
      
      // Deduct stock immediately
      product.stockQuantity -= item.quantity;
      await product.save();

      orderItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice * item.quantity,
      });
    }

    const order = await OnlineOrder.create({
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      items: orderItems,
      totalAmount,
    });

    res.status(201).json({ success: true, data: order, message: 'Order placed successfully!' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all online orders (Protected for Admin)
// @route   GET /api/shop/orders
exports.getOrders = async (req, res, next) => {
  try {
    const orders = await OnlineOrder.find().sort('-createdAt');
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Protected for Admin)
// @route   PUT /api/shop/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await OnlineOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
