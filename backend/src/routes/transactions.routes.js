const express = require('express');
const router = express.Router();
const { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction, getCategories, createCategory } = require('../controllers/transactions.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.get('/', getTransactions);
router.post('/', createTransaction);
router.get('/:id', getTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
