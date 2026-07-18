// src/controllers/sessionController.js
const db = require('../config/db');

// @route   POST /v1/sessions/log
// @desc    Synchronize an encrypted session log to the cloud
// @access  Protected
exports.logSession = async (req, res) => {
    const { encrypted_payload, logged_date, logged_month_year } = req.body;

    // Validate request inputs
    if (!encrypted_payload || !logged_date || !logged_month_year) {
        return res.status(400).json({ error: 'Missing required session logging fields.' });
    }

    try {
        // Insert into secure_activity_logs (user_id attached by authMiddleware)
        await db.query(
            `INSERT INTO secure_activity_logs (user_id, encrypted_payload, logged_date, logged_month_year)
       VALUES ($1, $2, $3, $4)`,
            [req.user.id, encrypted_payload, logged_date, logged_month_year]
        );

        res.status(201).json({ message: 'Session activity securely synchronized to your cloud sync.' });
    } catch (err) {
        console.error('Session Logging Error:', err.message);
        res.status(500).json({ error: 'Server error saving secure session log.' });
    }
};