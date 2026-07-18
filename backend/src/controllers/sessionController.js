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

// @route   GET /v1/sessions
// @desc    Retrieve all encrypted session logs for the authenticated user
// @access  Protected
exports.getSessions = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT log_id, encrypted_payload, logged_date, logged_month_year, created_at 
       FROM secure_activity_logs 
       WHERE user_id = $1 
       ORDER BY logged_date DESC`,
      [req.user.id]
    );

    res.status(200).json({ count: result.rows.length, logs: result.rows });
  } catch (err) {
    console.error('Retrieve Sessions Error:', err.message);
    res.status(500).json({ error: 'Server error retrieving session logs.' });
  }
};