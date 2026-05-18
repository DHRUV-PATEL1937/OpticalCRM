const express = require('express');
const router = express.Router();
const { getCustomerPrescriptions, getPrescription, createPrescription, updatePrescription, deletePrescription } = require('../controllers/prescriptionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/customer/:customerId', getCustomerPrescriptions);
router.route('/').post(createPrescription);
router.route('/:id').get(getPrescription).put(updatePrescription).delete(deletePrescription);

module.exports = router;
