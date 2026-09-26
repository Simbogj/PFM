const express = require('express');
const router = express.Router();
const { getBorrowings, getBorrowing, createBorrowing, recordRepayment, updateBorrowing } = require('../controllers/borrowing.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getBorrowings);
router.post('/', createBorrowing);
router.get('/:id', getBorrowing);
router.put('/:id', updateBorrowing);
router.post('/:id/repay', recordRepayment);

module.exports = router;
