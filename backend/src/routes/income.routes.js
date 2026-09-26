const express = require('express');
const router = express.Router();
const { getIncome, createIncome, createSalary, getSalaryRecords } = require('../controllers/income.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getIncome);
router.post('/', createIncome);
router.post('/salary', createSalary);
router.get('/salary', getSalaryRecords);

module.exports = router;
