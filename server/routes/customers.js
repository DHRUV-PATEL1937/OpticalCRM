const express = require('express');
const router = express.Router();
const { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, searchCustomers, getUpcomingBirthdays } = require('../controllers/customerController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/search', searchCustomers);
router.get('/birthdays', getUpcomingBirthdays);
router.route('/').get(getCustomers).post(createCustomer);
router.route('/:id').get(getCustomer).put(updateCustomer).delete(deleteCustomer);

module.exports = router;
