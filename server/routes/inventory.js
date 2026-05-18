const express = require('express');
const router = express.Router();
const { 
  getSuppliers, createSupplier, 
  getPurchaseOrders, createPurchaseOrder, receivePurchaseOrder,
  adjustStock, getAdjustments
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Suppliers
router.route('/suppliers').get(getSuppliers).post(createSupplier);

// Purchase Orders
router.route('/po').get(getPurchaseOrders).post(createPurchaseOrder);
router.route('/po/:id/receive').post(receivePurchaseOrder);

// Stock Adjustments
router.route('/adjust').post(adjustStock).get(getAdjustments);

module.exports = router;
