const express = require('express');
const router = express.Router();
const { getPayments, createPayment, updatePayment, markAsPaid, deletePayment } = require('../controllers/payments.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getPayments);
router.post('/', createPayment);
router.put('/:id', updatePayment);
router.post('/:id/pay', markAsPaid);
router.delete('/:id', deletePayment);

module.exports = router;
