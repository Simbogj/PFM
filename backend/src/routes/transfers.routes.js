const express = require('express');
const router = express.Router();
const { getTransfers, createTransfer, deleteTransfer } = require('../controllers/transfers.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getTransfers);
router.post('/', createTransfer);
router.delete('/:id', deleteTransfer);

module.exports = router;
