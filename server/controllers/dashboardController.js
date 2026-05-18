const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

exports.getStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);

    const [todaySales, pendingOrders, lowStockCount, totalCustomers] = await Promise.all([
      Sale.aggregate([
        { $match: { createdAt: { $gte: startOfDay, $lt: endOfDay }, status: { $in: ['completed', 'pending'] } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      Sale.countDocuments({ status: 'pending' }),
      Product.countDocuments({ isActive: true, $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] } }),
      Customer.countDocuments({ isActive: true }),
    ]);

    res.json({
      success: true,
      data: {
        todaySales: todaySales[0]?.total || 0,
        todayOrders: todaySales[0]?.count || 0,
        pendingOrders,
        lowStockCount,
        totalCustomers,
      },
    });
  } catch (error) { next(error); }
};

exports.getSalesChart = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const salesData = await Sale.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $in: ['completed', 'pending'] } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days with zero
    const result = [];
    const current = new Date(startDate);
    const now = new Date();
    while (current <= now) {
      const dateStr = current.toISOString().split('T')[0];
      const found = salesData.find((d) => d._id === dateStr);
      result.push({ date: dateStr, total: found?.total || 0, count: found?.count || 0 });
      current.setDate(current.getDate() + 1);
    }

    res.json({ success: true, data: result });
  } catch (error) { next(error); }
};

exports.getTopProducts = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topProducts = await Sale.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $in: ['completed', 'pending'] } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.productName' }, totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: '$items.total' } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    res.json({ success: true, data: topProducts });
  } catch (error) { next(error); }
};

exports.getRecentSales = async (req, res, next) => {
  try {
    const sales = await Sale.find()
      .populate('customer', 'name phone')
      .sort('-createdAt')
      .limit(10)
      .select('invoiceNumber customerName grandTotal status createdAt paymentMethod')
      .lean();
    res.json({ success: true, data: sales });
  } catch (error) { next(error); }
};

exports.getAlerts = async (req, res, next) => {
  try {
    const [lowStock, pendingSales, upcomingBirthdays] = await Promise.all([
      Product.find({ isActive: true, $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] } })
        .select('name sku stockQuantity').limit(5).lean(),
      Sale.find({ status: 'pending' }).select('invoiceNumber customerName grandTotal balanceDue').limit(5).lean(),
      (async () => {
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 86400000);
        const customers = await Customer.find({ isActive: true, dateOfBirth: { $exists: true, $ne: null } }).select('name phone dateOfBirth').lean();
        return customers.filter((c) => {
          const dob = new Date(c.dateOfBirth);
          const bday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          return bday >= today && bday <= nextWeek;
        }).slice(0, 5);
      })(),
    ]);

    res.json({
      success: true,
      data: {
        lowStock,
        pendingSales,
        upcomingBirthdays,
      },
    });
  } catch (error) { next(error); }
};
