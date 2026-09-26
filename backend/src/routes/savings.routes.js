const express = require('express');
const router = express.Router();
const { getSavingsGoals, getSavingsGoal, createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, depositToGoal, withdrawFromGoal, getSavingsTransactions } = require('../controllers/savings.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getSavingsGoals);
router.post('/', createSavingsGoal);
router.get('/:id', getSavingsGoal);
router.put('/:id', updateSavingsGoal);
router.delete('/:id', deleteSavingsGoal);
router.post('/:id/deposit', depositToGoal);
router.post('/:id/withdraw', withdrawFromGoal);
router.get('/:id/transactions', getSavingsTransactions);

module.exports = router;
