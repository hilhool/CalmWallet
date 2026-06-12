const { Router } = require('express');
const asyncHandler = require('../utils/async-handler');
const { register, login, refresh, logout } = require('../controllers/auth.controller');

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/refresh', asyncHandler(refresh));
router.post('/logout', asyncHandler(logout));

module.exports = router;
