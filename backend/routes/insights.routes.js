const { Router } = require('express');
const asyncHandler = require('../utils/async-handler');
const { createWeeklyInsight, getWeeklyInsights } = require('../controllers/insights.controller');

const router = Router();

router.post('/weekly', asyncHandler(createWeeklyInsight));
router.get('/weekly', asyncHandler(getWeeklyInsights));

module.exports = router;
