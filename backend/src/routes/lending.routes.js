const express = require('express');
const router = express.Router();
const { getLendings, getLending, createLending, recordLendingPayment, updateLending } = require('../controllers/lending.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getLendings);
router.post('/', createLending);
router.get('/:id', getLending);
router.put('/:id', updateLending);
router.post('/:id/payment', recordLendingPayment);

module.exports = router;
