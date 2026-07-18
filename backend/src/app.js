// src/app.js
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const cardRoutes = require('./routes/cardRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/v1/auth', authRoutes);
app.use('/v1/cards', cardRoutes); // Mount card and consent routes cleanly
app.use('/v1/sessions', sessionRoutes);

// Basic Health Check Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Freakasutra server is running.' });
});

// Test Database Connection
const testDbConnection = async () => {
    try {
        await db.query('SELECT NOW()');
        console.log('Successfully connected to Supabase Database!');
    } catch (err) {
        console.error('Database connection failed! Full error details:');
        console.error(err);
        process.exit(1);
    }
};

// Start Server
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await testDbConnection();
});