// src/routes/sessionRoutes.js
const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authMiddleware = require('../middleware/authMiddleware');

// All session logging routes are protected
router.use(authMiddleware);

router.post('/log', sessionController.logSession);

module.exports = router;