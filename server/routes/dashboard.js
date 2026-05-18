const express = require('express');
const router = express.Router();
const { getStats, getSalesChart, getTopProducts, getRecentSales, getAlerts } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/stats', getStats);
router.get('/sales-chart', getSalesChart);
router.get('/top-products', getTopProducts);
router.get('/recent-sales', getRecentSales);
router.get('/alerts', getAlerts);

module.exports = router;
