// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // Import middleware
const db = require('../config/db');

// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected Route: Get Profile Info (Requires Valid JWT)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        // req.user.id is populated by the authMiddleware
        const result = await db.query(
            'SELECT display_name, subscription_status, created_at FROM user_profiles WHERE user_id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Fetch Profile Error:', err.message);
        res.status(500).json({ error: 'Server error retrieving profile.' });
    }
});

router.post('/upgrade', authMiddleware, authController.upgradeAccount);

module.exports = router;