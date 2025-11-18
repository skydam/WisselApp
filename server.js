const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Email whitelist - only these emails can sign up
const ALLOWED_EMAILS = [
  'jvharten@gmail.com'
  // Add more emails here as needed
];

// Initialize SQLite database
const db = new Database('wisselapp.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS team_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Trust Railway's proxy
app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || 'hockey-team-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// API Routes

// Sign up
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Check if email is whitelisted
  if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
    return res.status(403).json({ error: 'This email is not authorized to create an account. Contact the administrator for access.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    const result = stmt.run(email.toLowerCase(), hashedPassword);

    req.session.userId = result.lastInsertRowid;
    res.json({ success: true, message: 'Account created successfully' });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Email already registered' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId = user.id;
    res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Admin debug endpoint - check users in database
app.get('/api/admin/debug-users', (req, res) => {
  const { secret } = req.query;
  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'reset-my-password-please';

  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Invalid admin secret' });
  }

  try {
    const users = db.prepare('SELECT id, email, created_at FROM users').all();
    res.json({
      success: true,
      userCount: users.length,
      users: users
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

// Admin password reset endpoint (for emergencies)
app.post('/api/admin/reset-password', async (req, res) => {
  const { email, newPassword, adminSecret } = req.body;

  // Simple secret check
  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'reset-my-password-please';

  if (adminSecret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Invalid admin secret' });
  }

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const stmt = db.prepare('UPDATE users SET password = ? WHERE email = ?');
    const result = stmt.run(hashedPassword, email.toLowerCase());

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Check auth status
app.get('/api/auth/status', (req, res) => {
  if (req.session.userId) {
    const stmt = db.prepare('SELECT id, email FROM users WHERE id = ?');
    const user = stmt.get(req.session.userId);
    res.json({ authenticated: true, user });
  } else {
    res.json({ authenticated: false });
  }
});

// Save team data
app.post('/api/team/save', requireAuth, (req, res) => {
  const { data } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO team_data (user_id, data, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET data = ?, updated_at = CURRENT_TIMESTAMP
    `);

    // SQLite doesn't support ON CONFLICT with user_id directly, so we check first
    const existing = db.prepare('SELECT id FROM team_data WHERE user_id = ?').get(req.session.userId);

    if (existing) {
      db.prepare('UPDATE team_data SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
        .run(JSON.stringify(data), req.session.userId);
    } else {
      db.prepare('INSERT INTO team_data (user_id, data) VALUES (?, ?)')
        .run(req.session.userId, JSON.stringify(data));
    }

    res.json({ success: true, message: 'Team data saved' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save team data' });
  }
});

// Load team data
app.get('/api/team/load', requireAuth, (req, res) => {
  try {
    const stmt = db.prepare('SELECT data FROM team_data WHERE user_id = ?');
    const result = stmt.get(req.session.userId);

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

// Admin Panel Routes
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Change in production!

// Verify admin password
app.post('/api/admin/verify', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid admin password' });
  }
});

// List all users (admin only)
app.get('/api/admin/users', (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const stmt = db.prepare('SELECT id, email, created_at FROM users ORDER BY created_at DESC');
    const users = stmt.all();
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Reset user password (admin only)
app.post('/api/admin/reset-password', async (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const stmt = db.prepare('UPDATE users SET password = ? WHERE email = ?');
    const result = stmt.run(hashedPassword, email.toLowerCase());

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  req.session.isAdmin = false;
  res.json({ success: true });
});

// Serve login page for root
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, 'login.html'));
  }
});

// Redirect /admin to /admin.html for convenience
app.get('/admin', (req, res) => {
  res.redirect('/admin.html');
});

// Serve static files AFTER auth routes so auth check happens first
app.use(express.static('.'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin panel available at: http://localhost:${PORT}/admin.html`);
  console.log(`Default admin password: ${ADMIN_PASSWORD} (change via ADMIN_PASSWORD env var)`);
});
