const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const StockAdjustment = require('../models/StockAdjustment');

// --- Suppliers ---

exports.getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort('name');
    res.json({ success: true, data: suppliers });
  } catch (error) { next(error); }
};

exports.createSupplier = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) { next(error); }
};

// --- Purchase Orders ---

exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const pos = await PurchaseOrder.find()
      .populate('supplier', 'name')
      .populate('createdBy', 'name')
      .sort('-createdAt');
    res.json({ success: true, data: pos });
  } catch (error) { next(error); }
};

exports.createPurchaseOrder = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;
    req.body.branch = req.user.branch;
    const po = await PurchaseOrder.create(req.body);
    res.status(201).json({ success: true, data: po });
  } catch (error) { next(error); }
};

exports.receivePurchaseOrder = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
    if (po.status === 'received') return res.status(400).json({ success: false, message: 'Already fully received' });

    const { itemsToReceive } = req.body; // [{ productId, qty }]
    
    let allFullyReceived = true;

    for (const item of itemsToReceive) {
      const poItem = po.items.find(i => i.product.toString() === item.productId);
      if (poItem) {
        poItem.receivedQty += item.qty;
        // Increase actual product stock
        await Product.findByIdAndUpdate(item.productId, { $inc: { stockQuantity: item.qty } });
        
        // Log as stock adjustment automatically
        const product = await Product.findById(item.productId);
        await StockAdjustment.create({
          product: product._id,
          type: 'add',
          quantity: item.qty,
          previousStock: product.stockQuantity - item.qty,
          newStock: product.stockQuantity,
          reason: 'other',
          notes: `Received from PO: ${po.poNumber}`,
          createdBy: req.user._id
        });

        if (poItem.receivedQty < poItem.requestedQty) allFullyReceived = false;
      }
    }

    po.status = allFullyReceived ? 'received' : 'partially_received';
    await po.save();

    res.json({ success: true, data: po });
  } catch (error) { next(error); }
};

// --- Stock Adjustments (Audits) ---

exports.adjustStock = async (req, res, next) => {
  try {
    const { productId, type, quantity, reason, notes } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    let previousStock = product.stockQuantity;
    let newStock = previousStock;

    if (type === 'add') newStock += quantity;
    else if (type === 'subtract') newStock -= quantity;
    else if (type === 'set') newStock = quantity;

    if (newStock < 0) return res.status(400).json({ success: false, message: 'Stock cannot be negative' });

    product.stockQuantity = newStock;
    await product.save();

    const adjustment = await StockAdjustment.create({
      product: productId,
      type,
      quantity,
      previousStock,
      newStock,
      reason,
      notes,
      createdBy: req.user._id,
      branch: req.user.branch
    });

    res.json({ success: true, data: adjustment });
  } catch (error) { next(error); }
};

exports.getAdjustments = async (req, res, next) => {
  try {
    const adjustments = await StockAdjustment.find()
      .populate('product', 'name sku')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .limit(50);
    res.json({ success: true, data: adjustments });
  } catch (error) { next(error); }
};
