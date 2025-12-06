// WisselApp Backend Server - v1.1.0 (Persistent Storage Edition)
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Email whitelist - only these emails can sign up
const ALLOWED_EMAILS = [
  'jvharten@gmail.com'
  // Add more emails here as needed
];

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

// Note: Tables should be created in Supabase SQL Editor using supabase-setup.sql
// This ensures proper permissions and constraints are set

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

  // Email whitelist disabled - anyone can sign up
  // If you want to re-enable whitelist, uncomment below:
  // if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
  //   return res.status(403).json({ error: 'This email is not authorized to create an account.' });
  // }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
      [email.toLowerCase(), hashedPassword]
    );

    req.session.userId = result.rows[0].id;
    res.json({ success: true, message: 'Account created successfully' });
  } catch (error) {
    if (error.code === '23505') { // PostgreSQL unique violation
      res.status(400).json({ error: 'Email already registered' });
    } else {
      console.error('Signup error:', error);
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
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = result.rows[0];

    if (!user) {
      console.log(`🔒 [LOGIN] Failed - user not found: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log(`🔒 [LOGIN] Failed - invalid password for: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId = user.id;
    console.log(`✅ [LOGIN] Success - User ${user.id} (${email}) logged in`);
    res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error(`❌ [LOGIN] Error:`, error);
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
app.get('/api/admin/debug-users', async (req, res) => {
  const { secret } = req.query;
  const ADMIN_SECRET = process.env.ADMIN_SECRET || 'reset-my-password-please';

  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Invalid admin secret' });
  }

  try {
    const result = await pool.query('SELECT id, email, created_at FROM users');
    res.json({
      success: true,
      userCount: result.rows.length,
      users: result.rows
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
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, email.toLowerCase()]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Check auth status
app.get('/api/auth/status', async (req, res) => {
  if (req.session.userId) {
    try {
      const result = await pool.query('SELECT id, email FROM users WHERE id = $1', [req.session.userId]);
      const user = result.rows[0];
      res.json({ authenticated: true, user });
    } catch (error) {
      console.error('Auth status error:', error);
      res.json({ authenticated: false });
    }
  } else {
    res.json({ authenticated: false });
  }
});

// Save team data
app.post('/api/team/save', requireAuth, async (req, res) => {
  const { data } = req.body;
  const userId = req.session.userId;

  console.log(`💾 [SAVE] User ${userId} saving team data with ${data?.players?.length || 0} players`);

  try {
    // Check if data exists for this user
    const checkResult = await pool.query('SELECT id FROM team_data WHERE user_id = $1', [userId]);

    if (checkResult.rows.length > 0) {
      console.log(`  └─ Updating existing data for user ${userId}`);
      await pool.query(
        'UPDATE team_data SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
        [JSON.stringify(data), userId]
      );
    } else {
      console.log(`  └─ Inserting new data for user ${userId}`);
      await pool.query(
        'INSERT INTO team_data (user_id, data) VALUES ($1, $2)',
        [userId, JSON.stringify(data)]
      );
    }

    console.log(`✅ [SAVE] Data saved successfully for user ${userId}`);
    res.json({ success: true, message: 'Team data saved' });
  } catch (error) {
    console.error(`❌ [SAVE] Error for user ${userId}:`, error);
    res.status(500).json({ error: 'Failed to save team data' });
  }
});

// Load team data
app.get('/api/team/load', requireAuth, async (req, res) => {
  const userId = req.session.userId;

  console.log(`📂 [LOAD] User ${userId} loading team data`);

  try {
    const result = await pool.query('SELECT data FROM team_data WHERE user_id = $1', [userId]);

    if (result.rows.length > 0) {
      const parsedData = JSON.parse(result.rows[0].data);
      const playerCount = parsedData?.players?.length || 0;
      console.log(`✅ [LOAD] Found data for user ${userId} with ${playerCount} players`);
      res.json({ success: true, data: parsedData });
    } else {
      console.log(`📭 [LOAD] No data found for user ${userId} (empty/new account)`);
      res.json({ success: true, data: null });
    }
  } catch (error) {
    console.error(`❌ [LOAD] Error for user ${userId}:`, error);
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
app.get('/api/admin/users', async (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await pool.query('SELECT id, email, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, users: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Reset user password (admin panel - requires admin session)
app.post('/api/admin/reset-user-password', async (req, res) => {
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
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, email.toLowerCase()]
    );

    if (result.rowCount === 0) {
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
