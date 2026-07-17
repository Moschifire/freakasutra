// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Get token from the header
    const authHeader = req.header('Authorization');

    // Check if the Authorization header exists and has the correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
    }

    // 2. Extract the actual token from the "Bearer <token>" string
    const token = authHeader.split(' ')[1];

    try {
        // 3. Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach decoded payload (user ID) to the request object
        req.user = decoded; // e.g., req.user.id is now accessible in controllers
        next(); // Pass control to the next function/controller
    } catch (err) {
        console.error('JWT Verification Error:', err.message);
        res.status(401).json({ error: 'Authentication failed. Token is invalid or expired.' });
    }
};