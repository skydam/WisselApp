-- WisselApp Database Schema for Supabase PostgreSQL
-- Run this in Supabase SQL Editor to create tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team data table (stores player data as JSON)
CREATE TABLE IF NOT EXISTS team_data (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_data_user_id ON team_data(user_id);

-- Create index on email for faster login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Display table info
SELECT 'Tables created successfully!' AS status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('users', 'team_data');
