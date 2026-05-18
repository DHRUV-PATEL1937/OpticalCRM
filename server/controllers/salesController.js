const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');
const whatsappService = require('../services/whatsappService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

exports.createSale = async (req, res, next) => {
  try {
    const { customer, customerName, customerPhone, items, subtotal, totalDiscount, totalTax, grandTotal, paymentMethod, paymentDetails, amountPaid, notes } = req.body;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error(`Product not found: ${item.productName}`);
      if (product.stockQuantity < item.quantity) throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`);
      product.stockQuantity -= item.quantity;
      await product.save();
    }

    let finalCustomerId = customer || undefined;
    if (!finalCustomerId && customerPhone) {
      let existingCustomer = await Customer.findOne({ phone: customerPhone });
      if (existingCustomer) {
        finalCustomerId = existingCustomer._id;
      } else {
        const newCustomer = new Customer({
          name: customerName || 'Walk-in Customer',
          phone: customerPhone,
        });
        await newCustomer.save();
        finalCustomerId = newCustomer._id;
      }
    }

    const saleData = {
      customer: finalCustomerId,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      items, subtotal,
      totalDiscount: totalDiscount || 0,
      totalTax: totalTax || 0,
      grandTotal,
      paymentMethod: paymentMethod || 'cash',
      paymentDetails: paymentDetails || [],
      amountPaid: amountPaid || grandTotal,
      balanceDue: Math.max(0, grandTotal - (amountPaid || grandTotal)),
      status: (amountPaid || grandTotal) >= grandTotal ? 'completed' : 'pending',
      notes: notes || '',
      branch: req.user.branch,
      createdBy: req.user._id,
    };

    const sale = new Sale(saleData);
    await sale.save();

    if (finalCustomerId) {
      await Customer.findByIdAndUpdate(finalCustomerId, {
        $inc: { totalPurchases: 1, totalSpent: grandTotal },
        lastVisit: new Date(),
      });
    }

    // Try sending WhatsApp invoice automatically in the background
    if (customerPhone) {
      whatsappService.sendInvoice(customerPhone, customerName || 'Valued Customer', sale.invoiceNumber, grandTotal)
        .catch(err => console.error('Failed to send WA message', err));
    }

    const populated = await Sale.findById(sale._id).populate('customer', 'name phone');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

exports.getSales = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, startDate, endDate, sort = '-createdAt' } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    const total = await Sale.countDocuments(query);
    const sales = await Sale.find(query).populate('customer', 'name phone').sort(sort).skip((page - 1) * limit).limit(parseInt(limit)).lean();
    res.json({ success: true, data: sales, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

exports.getSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('customer', 'name phone email address').populate('createdBy', 'name');
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (error) { next(error); }
};

exports.processReturn = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) throw new Error('Sale not found');
    const { returnItems } = req.body;
    let refundTotal = 0;
    for (const ri of returnItems) {
      const item = sale.items[ri.itemIndex];
      if (!item) throw new Error(`Invalid item index: ${ri.itemIndex}`);
      const returnQty = Math.min(ri.quantity, item.quantity);
      refundTotal += (item.total / item.quantity) * returnQty;
      await Product.findByIdAndUpdate(item.product, { $inc: { stockQuantity: returnQty } });
    }
    sale.status = 'returned';
    sale.notes += `\nReturn on ${new Date().toISOString()}. Refund: ₹${refundTotal}`;
    await sale.save();
    if (sale.customer) {
      await Customer.findByIdAndUpdate(sale.customer, { $inc: { totalSpent: -refundTotal } });
    }
    res.json({ success: true, data: sale, refundTotal });
  } catch (error) {
    next(error);
  }
};

exports.getDailySummary = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);
    const summary = await Sale.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lt: endOfDay }, status: { $in: ['completed', 'pending'] } } },
      { $group: { _id: null, totalSales: { $sum: '$grandTotal' }, totalOrders: { $sum: 1 }, totalDiscount: { $sum: '$totalDiscount' }, avgOrderValue: { $avg: '$grandTotal' }, pendingAmount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$balanceDue', 0] } }, pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } } } },
    ]);
    res.json({ success: true, data: summary[0] || { totalSales: 0, totalOrders: 0, totalDiscount: 0, avgOrderValue: 0, pendingAmount: 0, pendingOrders: 0 } });
  } catch (error) { next(error); }
};

exports.dispatchSaleReceipt = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('customer');
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    
    const { email, phone, customerName } = req.body;
    const finalEmail = email || sale.customer?.email;
    const finalPhone = phone || sale.customerPhone || sale.customer?.phone;
    const finalName = customerName || sale.customerName || sale.customer?.name || 'Customer';

    const pdfBuffer = req.file ? req.file.buffer : null;

    if (!pdfBuffer) {
      return res.status(400).json({ success: false, message: 'PDF file is required' });
    }

    const promises = [];

    if (finalEmail) {
      promises.push(emailService.sendInvoiceEmail(finalEmail, finalName, sale.invoiceNumber, sale.grandTotal, pdfBuffer));
    }

    if (finalPhone) {
      promises.push(whatsappService.sendInvoice(finalPhone, finalName, sale.invoiceNumber, sale.grandTotal, pdfBuffer));
      promises.push(smsService.sendInvoiceSMS(finalPhone, finalName, sale.invoiceNumber, sale.grandTotal));
    }

    await Promise.all(promises);

    res.json({ success: true, message: 'Receipt dispatched successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getPublicSale = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer', 'name phone email')
      .lean();
    if (!sale) return res.status(404).json({ success: false, message: 'Invoice not found' });

    // Also fetch settings for rendering
    const Setting = require('../models/Setting');
    const settingsDocs = await Setting.find({}).lean();
    const settings = {};
    settingsDocs.forEach(s => {
      if (!settings[s.category]) settings[s.category] = {};
      settings[s.category][s.key] = s.value;
    });

    res.json({ success: true, data: { sale, settings } });
  } catch (error) {
    next(error);
  }
};
