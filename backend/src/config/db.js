// src/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Initialize the Postgres connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Supabase connections over SSL are required
    ssl: {
        rejectUnauthorized: false
    }
});

// Helper function to query the database
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};