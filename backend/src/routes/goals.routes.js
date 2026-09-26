const express = require('express');
const router = express.Router();
const { getGoals, getGoal, createGoal, updateGoal, deleteGoal } = require('../controllers/goals.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getGoals);
router.post('/', createGoal);
router.get('/:id', getGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);

module.exports = router;
