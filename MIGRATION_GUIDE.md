# WisselApp Clerk Migration Guide

## 🚀 Quick Start: Reset Your Password NOW

If you're locked out and need immediate access:

```bash
# 1. Make sure server is stopped
pkill -f "node server.js"

# 2. Rebuild better-sqlite3 (if needed)
npm rebuild better-sqlite3

# 3. Run password reset script
node reset-password.js
```

Follow the prompts:
- Enter email: `jvharten@gmail.com`
- Enter new password: (choose a new password)
- Confirm password: (same password)

✅ You can now log in with your new password!

---

## 📋 Part 1: Test Current System (Optional)

Before migrating, verify everything works with your new password:

```bash
# Start server
node server.js

# Open browser
open http://localhost:3000
```

Log in with your new password and verify:
- ✅ Players load correctly
- ✅ Can add/edit players
- ✅ Can generate game schedules
- ✅ Data persists after refresh

---

## 🎯 Part 2: Migrate to Clerk

### Step 1: Create Clerk Account

1. Go to https://clerk.com
2. Click "Start Building for Free"
3. Sign up with `jvharten@gmail.com`
4. Verify your email
5. Create application: "Hockey Team Manager"
6. Enable "Email" authentication method
7. **Copy your API keys:**
   ```
   Publishable Key: pk_test_...
   Secret Key: sk_test_...
   ```

### Step 2: Configure Clerk (Optional but Recommended)

**Enable Allowlist (Restricted Access):**
1. In Clerk Dashboard → "User & Authentication" → "Restrictions"
2. Toggle "Allowlist" ON
3. Add email: `jvharten@gmail.com`
4. This maintains your current whitelist behavior

**Customize Appearance:**
1. Go to "Customization" → "Theme"
2. Match WisselApp's black/white design
3. Upload logo (optional)

**Configure Password Recovery:**
1. Go to "Email & SMS"
2. Password reset email is enabled by default
3. Customize template (optional)

### Step 3: Create .env File

Create `.env` in your project root:

```bash
# Copy from .env.example
cp .env.example .env
```

Edit `.env` and add your Clerk keys:

```
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
SESSION_SECRET=your-secret-key
NODE_ENV=development
PORT=3000
```

### Step 4: Update index.html

Add Clerk script to `index.html` **before** `</head>`:

```html
<!-- Clerk Authentication -->
<script
  async
  crossorigin="anonymous"
  data-clerk-publishable-key="pk_test_YOUR_KEY_HERE"
  src="https://YOUR_CLERK_DOMAIN.clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"
  type="text/javascript"
></script>
```

Replace the auth check script (lines 157-203) with:

```html
<script src="clerk-auth.js"></script>
```

Update `clerk-auth.js` line 9 with your publishable key:

```javascript
const clerkPublishableKey = 'pk_test_YOUR_KEY_HERE';
```

### Step 5: Switch to New Server

Rename files to activate Clerk:

```bash
# Backup old server
mv server.js server-old.js

# Activate Clerk server
mv server-clerk.js server.js
```

### Step 6: Test Locally

```bash
# Start new Clerk-integrated server
npm start

# Open browser
open http://localhost:3000
```

**First Time:**
- You'll see Clerk's sign-in screen
- Click "Sign up" (even though you have an account)
- Use your `jvharten@gmail.com` email
- Set a NEW password (Clerk manages this now)
- Verify email if prompted

**After Sign In:**
- ✅ Your team data should load (if it doesn't, add players again)
- ✅ Test forgot password: Sign out → "Forgot password?" → Check email
- ✅ Test all app features

### Step 7: Migrate Data (If Needed)

If your team data didn't load automatically:

1. Sign in to old system (using `server-old.js`)
2. Export data from localStorage:
   ```javascript
   // In browser console:
   localStorage.getItem('players_primary')
   ```
3. Copy the JSON
4. Sign in to new Clerk system
5. Import in console:
   ```javascript
   // Paste the data and save
   await playerManager.loadPlayers()
   ```

Or use the restore tool:
```bash
open http://localhost:3000/restore-localStorage.html
```

---

## 🚀 Part 3: Deploy to Railway

### Step 1: Update Environment Variables

In Railway dashboard:

1. Go to your WisselApp project
2. Click "Variables"
3. Add new variables:
   ```
   CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```
4. Remove old `SESSION_SECRET` (optional, Clerk doesn't use it)

### Step 2: Configure Clerk Webhook (Optional)

For user sync:

1. In Clerk Dashboard → "Webhooks"
2. Add endpoint: `https://your-app.railway.app/api/webhooks/clerk`
3. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy signing secret
5. Add to Railway:
   ```
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

### Step 3: Deploy

```bash
# Commit changes
git add .
git commit -m "Migrate to Clerk authentication with password recovery"

# Push to GitHub (triggers Railway deploy)
git push origin master
```

### Step 4: Test Production

1. Wait for Railway deploy to complete
2. Visit your app URL
3. Sign in with Clerk account
4. Test password recovery:
   - Click "Forgot password?"
   - Check email
   - Reset password
   - Sign in with new password
5. ✅ Verify all features work

---

## 🔄 Rollback Plan (If Needed)

If something goes wrong:

```bash
# Switch back to old server
mv server.js server-clerk.js
mv server-old.js server.js

# Restart
npm start
```

Your old authentication will work again.

---

## 📊 What Changed

### Removed:
❌ Custom signup/login/logout endpoints
❌ Password hashing with bcrypt
❌ Session management with express-session
❌ Custom auth check middleware
❌ login.html custom form

### Added:
✅ Clerk SDK for authentication
✅ Clerk UI components
✅ Built-in password recovery
✅ Email verification
✅ Secure session management
✅ User profile management
✅ Webhook for user sync

### Unchanged:
✅ Team data storage (SQLite)
✅ Player management features
✅ Game rotation engine
✅ All app functionality

---

## 🎉 Benefits

**Security:**
- Industry-standard OAuth 2.0
- Automatic password resets
- Email verification
- Session management
- XSS/CSRF protection

**User Experience:**
- Professional login UI
- **Password recovery** (the original problem!)
- Remember me
- Social login ready (Google, GitHub, etc.)

**Developer Experience:**
- Less code to maintain
- Automatic security updates
- Built-in analytics
- No more password management

**Cost:**
- Free tier: 10,000 MAU
- Your usage: ~1-10 users
- Cost: **$0/month**

---

## 🆘 Troubleshooting

**Problem:** Can't sign in after migration
**Solution:** Make sure you created a NEW account in Clerk (even with same email)

**Problem:** Data is missing
**Solution:** Use restore tool at `/restore-localStorage.html`

**Problem:** Clerk script not loading
**Solution:** Check your publishable key is correct in both places (index.html + clerk-auth.js)

**Problem:** API calls failing
**Solution:** Check CLERK_SECRET_KEY is set in Railway env vars

**Problem:** Webhook errors
**Solution:** Add CLERK_WEBHOOK_SECRET to Railway (optional for basic functionality)

---

## 📞 Support

- **Clerk Documentation**: https://clerk.com/docs
- **Clerk Community**: https://clerk.com/discord
- **Your Original Issue**: Password recovery ✅ SOLVED with Clerk

---

## ✅ Checklist

- [ ] Reset password with `reset-password.js` (immediate access)
- [ ] Create Clerk account at clerk.com
- [ ] Copy API keys (publishable + secret)
- [ ] Create `.env` file with Clerk keys
- [ ] Update `index.html` with Clerk script
- [ ] Update `clerk-auth.js` with publishable key
- [ ] Switch to `server-clerk.js`
- [ ] Test locally
- [ ] Sign up in Clerk
- [ ] Test password recovery feature
- [ ] Update Railway environment variables
- [ ] Deploy to production
- [ ] Test production app
- [ ] ✅ Never forget password again!

---

**Ready to proceed?** Start with the password reset script, then follow the migration steps when you're ready to upgrade to Clerk!
