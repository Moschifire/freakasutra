// src/controllers/authController.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Helper function to hash email with SHA-256
const hashEmail = (email) => {
    return crypto
        .createHash('sha256')
        .update(email.toLowerCase().trim())
        .digest('hex');
};

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Tokens valid for 30 days
    });
};

// @route   POST /v1/auth/register
// @desc    Register a new user (Discreet Cloud Sync account)
exports.register = async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide an email and password.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const client = await db.pool.connect();

    try {
        // Start database transaction
        await client.query('BEGIN');

        // 1. Hash the email immediately
        const emailHash = hashEmail(email);

        // 2. Check if the hashed email already exists
        const userExists = await client.query('SELECT id FROM users WHERE email_hash = $1', [emailHash]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'An account with these sync credentials already exists.' });
        }

        // 3. Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 4. Insert into the isolated Users table
        const userResult = await client.query(
            'INSERT INTO users (email_hash, password_hash) VALUES ($1, $2) RETURNING id',
            [emailHash, passwordHash]
        );
        const userId = userResult.rows[0].id;

        // 5. Create default decoupled User Profile
        await client.query(
            'INSERT INTO user_profiles (user_id, display_name, subscription_status) VALUES ($1, $2, $3)',
            [userId, 'User', 'free']
        );

        // Commit transaction
        await client.query('COMMIT');

        // 6. Generate Token and Respond
        const token = generateToken(userId);
        res.status(201).json({
            message: 'Cloud sync account successfully created.',
            token,
            profile: {
                display_name: 'User',
                subscription_status: 'free',
            },
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Registration Error:', err.message);
        res.status(500).json({ error: 'Server error during registration.' });
    } finally {
        client.release();
    }
};

// @route   POST /v1/auth/login
// @desc    Authenticate user and get token (Sync Gateway Access)
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide an email and password.' });
    }

    try {
        // 1. Hash incoming email to find database match
        const emailHash = hashEmail(email);

        // 2. Retrieve user
        const userResult = await db.query('SELECT * FROM users WHERE email_hash = $1', [emailHash]);
        if (userResult.rows.length === 0) {
            // Use generic error message for security (prevents account enumeration)
            return res.status(401).json({ error: 'Invalid sync credentials.' });
        }

        const user = userResult.rows[0];

        // 3. Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid sync credentials.' });
        }

        // 4. Retrieve decoupled user profile info
        const profileResult = await db.query('SELECT display_name, subscription_status FROM user_profiles WHERE user_id = $1', [user.id]);
        const profile = profileResult.rows[0];

        // 5. Respond with Token
        const token = generateToken(user.id);
        res.status(200).json({
            message: 'Sync connection successful.',
            token,
            profile: {
                display_name: profile.display_name,
                subscription_status: profile.subscription_status,
            },
        });

    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ error: 'Server error during login.' });
    }
};