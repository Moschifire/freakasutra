// src/controllers/consentController.js
const db = require('../config/db');

// @route   PUT /v1/user/consent
// @desc    Upsert user's encrypted Yes/Maybe/No consent boundaries
// @access  Protected
exports.upsertConsent = async (req, res) => {
    const { encrypted_boundaries } = req.body;

    if (!encrypted_boundaries) {
        return res.status(400).json({ error: 'Payload missing encrypted boundaries.' });
    }

    try {
        // SQL Upsert: Insert or Update if the user_id record already exists
        await db.query(
            `INSERT INTO user_consents (user_id, encrypted_boundaries, updated_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) 
       DO UPDATE SET encrypted_boundaries = EXCLUDED.encrypted_boundaries, updated_at = CURRENT_TIMESTAMP`,
            [req.user.id, encrypted_boundaries]
        );

        res.status(200).json({ message: 'Consent boundaries successfully synced to the cloud.' });
    } catch (err) {
        console.error('Consent Sync Error:', err.message);
        res.status(500).json({ error: 'Server error saving consent profile.' });
    }
};

// @route   GET /v1/user/consent
// @desc    Retrieve user's encrypted consent boundaries for local decryption
// @access  Protected
exports.getConsent = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT encrypted_boundaries FROM user_consents WHERE user_id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            // If no boundaries are set yet, return an empty profile state
            return res.status(200).json({ encrypted_boundaries: null });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Retrieve Consent Error:', err.message);
        res.status(500).json({ error: 'Server error retrieving consent profile.' });
    }
};