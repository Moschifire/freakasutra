// src/routes/cardRoutes.js
const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const consentController = require('../controllers/consentController');
const authMiddleware = require('../middleware/authMiddleware');

// All gameplay and consent endpoints require valid user tokens
router.use(authMiddleware);

// Card Directory endpoint
router.get('/', cardController.getCards);

// Consent/Boundaries endpoints
router.put('/consent', consentController.upsertConsent);
router.get('/consent', consentController.getConsent);

module.exports = router;