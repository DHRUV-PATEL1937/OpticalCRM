const express = require('express');
const router = express.Router();
const { getPublicProducts, checkoutOrder, getOrders, updateOrderStatus } = require('../controllers/shopController');
const { protect } = require('../middleware/auth');

// Public routes (No authentication required)
router.get('/products', getPublicProducts);
router.post('/checkout', checkoutOrder);

// Protected routes (Admin only)
router.use(protect);
router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);

module.exports = router;
