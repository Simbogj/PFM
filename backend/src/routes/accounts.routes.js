const express = require('express');
const router = express.Router();
const { getAccounts, getAccount, createAccount, updateAccount, deleteAccount, getAccountTransactions, reconcileAccount } = require('../controllers/accounts.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getAccounts);
router.post('/', createAccount);
router.get('/:id', getAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);
router.get('/:id/transactions', getAccountTransactions);
router.post('/:id/reconcile', reconcileAccount);

module.exports = router;
