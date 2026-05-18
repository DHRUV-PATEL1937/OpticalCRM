const express = require('express');
const router = express.Router();
const { createSale, getSales, getSale, processReturn, getDailySummary, dispatchSaleReceipt, getPublicSale } = require('../controllers/salesController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Public route (no auth needed)
router.get('/public/:id', getPublicSale);

router.use(protect);
router.get('/daily-summary', getDailySummary);
router.route('/').get(getSales).post(createSale);
router.route('/:id').get(getSale);
router.put('/:id/return', processReturn);
router.post('/:id/dispatch', upload.single('invoicePdf'), dispatchSaleReceipt);

module.exports = router;
