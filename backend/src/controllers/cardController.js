// src/controllers/cardController.js
const db = require('../config/db');

// @route   GET /v1/cards
// @desc    Get all eligible cards based on the user's subscription tier
// @access  Protected (Requires Valid JWT)
exports.getCards = async (req, res) => {
    try {
        // 1. Fetch user's subscription status from their profile
        const profileResult = await db.query(
            'SELECT subscription_status FROM user_profiles WHERE user_id = $1',
            [req.user.id]
        );

        if (profileResult.rows.length === 0) {
            return res.status(404).json({ error: 'User profile not found.' });
        }

        const { subscription_status } = profileResult.rows[0];

        // 2. Query cards. If user is free, filter out premium cards.
        let cardsResult;
        if (subscription_status === 'free') {
            cardsResult = await db.query('SELECT * FROM cards WHERE is_premium = FALSE');
        } else {
            // Premium users (monthly, quarterly, annual) get all cards
            cardsResult = await db.query('SELECT * FROM cards');
        }

        res.status(200).json({
            subscription_status,
            count: cardsResult.rows.length,
            cards: cardsResult.rows
        });

    } catch (err) {
        console.error('Fetch Cards Error:', err.message);
        res.status(500).json({ error: 'Server error retrieving card database.' });
    }
};