const express = require('express');
const router = express.Router();
const { getCashFlow, getNetWorth, getMonthlySummary, getAccountStatement, getCalendarEvents } = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/cash-flow', getCashFlow);
router.get('/net-worth', getNetWorth);
router.get('/monthly-summary', getMonthlySummary);
router.get('/account-statement', getAccountStatement);
router.get('/calendar-events', getCalendarEvents);

module.exports = router;
