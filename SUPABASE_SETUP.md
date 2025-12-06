# Supabase PostgreSQL Setup Guide

This guide will help you migrate WisselApp from ephemeral SQLite to persistent Supabase PostgreSQL.

## Why Supabase?

- ✅ **Free tier**: 500 MB database, never expires
- ✅ **Persistent storage**: Data survives all Railway deployments
- ✅ **No credit card required**
- ✅ **Production-ready** PostgreSQL database
- ✅ **Global distribution** with low latency

---

## Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

---

## Step 2: Create New Project

1. Click "New Project" in Supabase dashboard
2. Fill in project details:
   - **Name**: WisselApp (or your preferred name)
   - **Database Password**: Generate a strong password (SAVE THIS!)
   - **Region**: Choose closest to you (e.g., Europe West for Netherlands)
   - **Pricing Plan**: Free
3. Click "Create new project"
4. Wait 2-3 minutes for project initialization

---

## Step 3: Create Database Tables

1. In Supabase dashboard, click "SQL Editor" in left sidebar
2. Click "New query"
3. Copy the entire contents of `supabase-setup.sql` file
4. Paste into the SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see "Tables created successfully!" message

---

## Step 4: Get Database Connection String

1. In Supabase dashboard, click "Project Settings" (gear icon)
2. Click "Database" in left sidebar
3. Scroll down to "Connection string" section
4. Select "URI" tab
5. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
6. **Replace** `[YOUR-PASSWORD]` with your actual database password from Step 2

---

## Step 5: Local Development Setup

1. Create a `.env` file in project root (if it doesn't exist):
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and update `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://postgres:your-actual-password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```

3. Test local connection:
   ```bash
   npm start
   ```

4. You should see in console:
   ```
   ✅ Database connected successfully at: [timestamp]
   Server running on port 3000
   ```

5. Open http://localhost:3000 and test:
   - Sign up with new account
   - Add players
   - Logout/login → players should persist

---

## Step 6: Railway Deployment

1. Go to Railway dashboard: https://railway.app
2. Select your WisselApp project
3. Click on your service
4. Go to "Variables" tab
5. Add/update environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Supabase connection string from Step 4
6. Click "Add"
7. Railway will automatically redeploy

---

## Step 7: Verify Production Deployment

1. Wait for Railway deployment to complete
2. Visit your Railway URL: `https://wisselapp-production-cac6.up.railway.app/`
3. Sign up with new account
4. Add test players
5. Logout and login → players should persist
6. Redeploy your app (make any small change and push to GitHub)
7. After redeployment, login again → **players should STILL be there!** ✅

---

## Troubleshooting

### Error: "Database connection failed"

**Check:**
- DATABASE_URL format is correct
- Password has no special characters that need URL encoding
- Supabase project is active (not paused)
- Check Supabase dashboard for any warnings

**Fix for special characters in password:**
```javascript
// If password is: p@ss!word
// URL encode it as: p%40ss%21word
```

### Error: "relation users does not exist"

**Cause**: Tables weren't created

**Fix**:
1. Go to Supabase SQL Editor
2. Run `supabase-setup.sql` again
3. Verify tables exist: Run `SELECT * FROM users;`

### Error: "connect ECONNREFUSED"

**Cause**: DATABASE_URL not set or incorrect

**Fix**:
1. Check .env file locally
2. Check Railway environment variables in production
3. Restart server after changing env vars

### Data not persisting after Railway deploy

**Check:**
1. Railway has `DATABASE_URL` environment variable set
2. Check Railway logs: `npm logs` command
3. Look for "Database connected successfully" message
4. If missing, DATABASE_URL is not configured

---

## Migration from SQLite (Optional)

If you have existing player data in local SQLite database:

### Export from SQLite:
```bash
sqlite3 wisselapp.db "SELECT email, password FROM users;" > users_export.csv
sqlite3 wisselapp.db "SELECT user_id, data FROM team_data;" > team_export.csv
```

### Import to Supabase:
1. Manually copy users via signup (passwords need to be reset anyway)
2. Team data can be re-entered (usually faster than migration for small datasets)

---

## Database Schema Reference

### `users` table
- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR UNIQUE NOT NULL)
- `password` (VARCHAR NOT NULL) - bcrypt hashed
- `created_at` (TIMESTAMP)

### `team_data` table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER UNIQUE REFERENCES users.id)
- `data` (JSONB) - stores player array
- `updated_at` (TIMESTAMP)

---

## Cost Estimate

**Free tier includes:**
- 500 MB database storage
- Unlimited API requests
- 1 GB file storage
- 5 GB bandwidth
- No credit card required
- Never expires

**Your estimated usage:**
- ~10 users × 10 KB each = 100 KB
- ~10 teams × 50 KB each = 500 KB
- **Total: ~600 KB (~0.1% of free tier)**

You can safely use WisselApp for years without hitting free tier limits!

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **WisselApp Issues**: https://github.com/skydam/WisselApp/issues
