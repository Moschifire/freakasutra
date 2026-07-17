-- schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. AUTHENTICATION TABLE (Strictly isolated)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash of email
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email_hash ON users(email_hash);

-- 2. DECOUPLED PROFILE & PREFERENCES
CREATE TABLE IF NOT EXISTS user_profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    display_name VARCHAR(50) DEFAULT 'User',
    timezone VARCHAR(50) DEFAULT 'UTC',
    subscription_status VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON user_profiles(user_id);

-- 3. CONSENT & BOUNDARIES TABLE
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    encrypted_boundaries TEXT NOT NULL, -- AES-256 encrypted JSON string
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CARDS DIRECTORY
CREATE TABLE IF NOT EXISTS cards (
    card_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    media_url VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    suggested_duration_seconds INTEGER DEFAULT 300,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cards_category ON cards(category);

-- 5. SECURE ACTIVITY LOGS (Encrypted for Freak Wrapped)
CREATE TABLE IF NOT EXISTS secure_activity_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    encrypted_payload TEXT NOT NULL, -- AES-256 encrypted JSON blob
    logged_date DATE NOT NULL,
    logged_month_year VARCHAR(7) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON secure_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_month_year ON secure_activity_logs(user_id, logged_month_year);