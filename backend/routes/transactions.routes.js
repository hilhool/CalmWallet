const { Router } = require('express');
const asyncHandler = require('../utils/async-handler');
const { createTransaction, getTransactions, deleteTransaction } = require('../controllers/transactions.controller');

const router = Router();

router.post('/', asyncHandler(createTransaction));
router.get('/', asyncHandler(getTransactions));
router.delete('/:id', asyncHandler(deleteTransaction));

module.exports = router;
