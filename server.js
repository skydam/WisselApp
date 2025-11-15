require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQLite database
const db = new Database('wisselapp.db');

// Create/update tables for Clerk
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    clerk_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS team_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clerk_user_id TEXT NOT NULL,
    data TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clerk_user_id) REFERENCES users(clerk_id)
  );
`);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Trust Railway's proxy
app.set('trust proxy', 1);

// Serve static files
app.use(express.static('.'));

// Clerk webhook to sync users
app.post('/api/webhooks/clerk', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  try {
    const evt = JSON.parse(req.body);

    // Handle user.created event
    if (evt.type === 'user.created') {
      const { id, email_addresses } = evt.data;
      const email = email_addresses[0]?.email_address;

      if (email) {
        const stmt = db.prepare('INSERT OR REPLACE INTO users (clerk_id, email, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
        stmt.run(id, email.toLowerCase());
        console.log(`User synced: ${email}`);
      }
    }

    // Handle user.updated event
    if (evt.type === 'user.updated') {
      const { id, email_addresses } = evt.data;
      const email = email_addresses[0]?.email_address;

      if (email) {
        const stmt = db.prepare('UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE clerk_id = ?');
        stmt.run(email.toLowerCase(), id);
      }
    }

    // Handle user.deleted event
    if (evt.type === 'user.deleted') {
      const { id } = evt.data;
      db.prepare('DELETE FROM users WHERE clerk_id = ?').run(id);
      db.prepare('DELETE FROM team_data WHERE clerk_user_id = ?').run(id);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// Save team data - protected by Clerk
app.post('/api/team/save', ClerkExpressRequireAuth(), (req, res) => {
  const { data } = req.body;
  const userId = req.auth.userId; // Clerk provides this

  try {
    // Ensure user exists in our database
    const user = db.prepare('SELECT clerk_id FROM users WHERE clerk_id = ?').get(userId);
    if (!user) {
      // User not synced yet, create entry
      const email = req.auth.sessionClaims?.email || 'unknown@email.com';
      db.prepare('INSERT INTO users (clerk_id, email) VALUES (?, ?)').run(userId, email);
    }

    // Check if team data exists for this user
    const existing = db.prepare('SELECT id FROM team_data WHERE clerk_user_id = ?').get(userId);

    if (existing) {
      db.prepare('UPDATE team_data SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE clerk_user_id = ?')
        .run(JSON.stringify(data), userId);
    } else {
      db.prepare('INSERT INTO team_data (clerk_user_id, data) VALUES (?, ?)')
        .run(userId, JSON.stringify(data));
    }

    res.json({ success: true, message: 'Team data saved' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save team data' });
  }
});

// Load team data - protected by Clerk
app.get('/api/team/load', ClerkExpressRequireAuth(), (req, res) => {
  const userId = req.auth.userId; // Clerk provides this

  try {
    const stmt = db.prepare('SELECT data FROM team_data WHERE clerk_user_id = ?');
    const result = stmt.get(userId);

    if (result) {
      res.json({ success: true, data: JSON.parse(result.data) });
    } else {
      res.json({ success: true, data: null });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load team data' });
  }
});

// Serve main app (Clerk handles auth on frontend)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🏒 Hockey Team Manager server running on port ${PORT}`);
  console.log(`📍 Clerk integration: ${process.env.CLERK_SECRET_KEY ? 'Active' : 'Missing API keys!'}`);
});
