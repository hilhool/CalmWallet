const { Router } = require('express');
const asyncHandler = require('../utils/async-handler');
const { createCheckin, getCheckins } = require('../controllers/checkins.controller');

const router = Router();

router.post('/', asyncHandler(createCheckin));
router.get('/', asyncHandler(getCheckins));

module.exports = router;
