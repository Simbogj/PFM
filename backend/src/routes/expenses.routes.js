const express = require('express');
const router = express.Router();
const { getExpenses, getExpensesByCategory, createExpense, deleteExpense } = require('../controllers/expenses.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getExpenses);
router.get('/by-category', getExpensesByCategory);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
