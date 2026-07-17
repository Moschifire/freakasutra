// src/app.js
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// Basic Health Check Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Freakasutra server is running.' });
});

// Test Database Connection
const testDbConnection = async () => {
    try {
        const res = await db.query('SELECT NOW()');
        console.log('Successfully connected to Supabase Database!');
        console.log('Database Server Time:', res.rows[0].now);
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1); // Stop the server if database connection fails
    }
};

// Start Server
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await testDbConnection();
});