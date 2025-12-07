# Hockey Team Manager - Claude Development Notes

## Project Overview
A comprehensive hockey team management web application for coaches to manage players, generate fair rotations, and track playing time distribution during 70-minute games.

## Current Status: ✅ FULLY FUNCTIONAL

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Fonts**: Geist Sans & Geist Mono (Next.js standard fonts)
- **Icons**: Lucide icons via CDN
- **Styling**: Custom OKLCH color system, shadcn/ui inspired design
- **Data Storage**: Supabase PostgreSQL (persistent cloud database)
- **Backend**: Node.js + Express with custom authentication
- **Local Development**: Python HTTP server for frontend-only testing
- **Deployment**: Railway (auto-deploy from GitHub)

### Key Features Implemented

#### 1. Team Roster Management
- ✅ Add/edit/delete players with skill ratings (1-5)
- ✅ Goalkeeper selection via radio buttons (only one)
- ✅ Match availability toggles via checkboxes
- ✅ Real-time skill adjustment with sliders
- ✅ Compact horizontal layout (3 controls per player)
- ✅ Professional Lucide icons (trash-2, edit-3)

#### 2. Game Schedule Generation  
- ✅ 70-minute games divided into 4 quarters
- ✅ 2 substitutions per quarter at 5:50 intervals (8 total moments)
- ✅ Quarter-based timer display (resets each quarter: 5:50, 11:40, etc.)
- ✅ Advanced rotation algorithm with proper priorities:
  - **Priority 1**: Equal playing time (±1-2 minutes)
  - **Priority 2**: Team strength balance
  - **Priority 3**: Position variety

#### 3. Visual Game Management
- ✅ Field formations in 3×4 grid layout (3 per row, 4 rows)
- ✅ Mini hockey fields with player positioning
- ✅ Color-coded player cards (continuing/going out/coming in)
- ✅ Clean player names (no position codes)
- ✅ Gantt chart timeline showing play/rest intervals
- ✅ Playing time distribution table
- ✅ Substitution schedule with player transitions

#### 4. Data Persistence
- ✅ Supabase PostgreSQL backend (persistent cloud storage)
- ✅ User-specific data isolation (each user sees only their data)
- ✅ Data survives all Railway deployments
- ✅ localStorage backup for offline capability
- ✅ Auto-sync between backend and localStorage

### Current File Structure
```
WisselApp/
├── index.html              # Main application page
├── login.html              # Login/signup page
├── admin.html              # Admin panel
├── admin-reset.html        # Emergency password reset
├── styles_shadcn.css       # OKLCH color system + shadcn/ui styling
├── server.js               # Node.js backend (PostgreSQL + Express)
├── package.json            # Node dependencies
├── .env                    # Environment variables (DATABASE_URL)
├── .env.example            # Environment variables template
├── supabase-setup.sql      # Database schema for Supabase
├── SUPABASE_SETUP.md       # Complete Supabase setup guide
├── player-manager_new.js   # Player roster management
├── rotation-engine_new.js  # Game rotation algorithm
├── app_new.js             # Navigation & game UI controller
├── database_new.js        # localStorage wrapper
├── storage_new.js         # Data persistence interface (backend + localStorage)
├── test-data_new.js       # Sample player data
└── CLAUDE.md             # This file (development notes)
```

### Design System
- **Colors**: Custom OKLCH monochromatic theme (black/white/gray)
- **Typography**: Geist Sans (UI) + Geist Mono (technical data)
- **Layout**: CSS Grid + Flexbox, responsive design
- **Icons**: Lucide icon library
- **Components**: shadcn/ui inspired cards, buttons, forms

### Algorithm Details

#### Rotation Engine Priorities
1. **Equal Playing Time** (Weight: Highest)
   - Tracks incremental playing time per interval
   - Prioritizes players with least accumulated time
   - Typical variance: ±1-2 minutes across all players

2. **Position Score Balancing** (Weight: High)
   - Tracks cumulative position scores: Forward = +1, Midfield = 0, Defender/Sweeper = -1 per interval
   - Players with low/negative scores (played more defense) prioritized for forward positions
   - Players with high/positive scores (played more forward) prioritized for defensive positions
   - Ensures fair distribution of attacking and defensive playing time across all players
   - Displayed in Playing Time Distribution table

3. **Team Strength Balance** (Weight: Moderate)
   - Only considered when playing times are similar (±0.5 min)
   - Balances skill levels to prevent all strong/weak players together
   - Uses weighted average team skill calculation

4. **Position Variety** (Weight: Minimal)
   - Positions inherited from departing players during substitutions
   - Position score balancing naturally creates position variety over time

### Development Commands
```bash
# Start local server
cd "/path/to/WisselApp"
python3 -m http.server 8001

# Access application
open http://localhost:8001/index_new.html
```

### Testing Workflow
1. Load test data (15 players with varied skills)
2. Select goalkeeper via radio button
3. Mark players as available for match
4. Generate game schedule
5. Review field formations, Gantt chart, and playing time distribution
6. Use print function for coaching during games

### Recent Major Updates
- ✅ Replaced halftime swap with position score balancing system (December 2025)
- ✅ Implemented position score tracking: Forward +1, Midfield 0, Defender -1 per interval
- ✅ Added position score column to Playing Time Distribution table
- ✅ Fixed rotation algorithm for true equal playing time
- ✅ Implemented 3×4 grid layout for field formations
- ✅ Added quarter-based timer display
- ✅ Removed position codes from player names
- ✅ Applied strict OKLCH color adherence
- ✅ Updated to Geist font family
- ✅ Fixed Add Player button functionality
- ✅ Added comprehensive debugging

### Known Working Features
- All player management functions
- Game schedule generation
- Visual field formations
- Playing time calculations
- Data persistence
- Print functionality
- Responsive design

### Next Potential Enhancements
- Position rotation tracking (Priority 3 enhancement)
- Dark mode toggle
- Export schedules to PDF
- Multiple team management
- Season tracking
- Statistics dashboard

---

## IMPORTANT: Recent Session Notes (November 15, 2025)

### PC Session Summary
**Location**: Windows PC (`C:\Users\PCJeroen\OneDrive\WisselApp`)
**Issue Discovered**: Player data missing on PC

### What We Found
1. **Database Status**:
   - `wisselapp.db` exists but `team_data` table is empty (0 records)
   - User likely created/managed players on Mac, not PC

2. **Backend Server Issue**:
   - Node.js backend (`server.js`) won't start on PC
   - `better-sqlite3` module has compilation error with Node.js v24.6.0
   - Error: "C++20 or later required" - version mismatch between Node v24 and better-sqlite3
   - Needs `npm rebuild better-sqlite3` but fails on Windows with current toolchain

3. **Workaround Applied**:
   - App designed to work with localStorage even without backend
   - Started Python HTTP server instead: `python -m http.server 8001`
   - Access via: `http://localhost:8001/index.html`

### Data Storage Architecture
The app has **dual storage** system:
- **Primary**: Browser localStorage (always works, per-browser/per-machine)
- **Secondary**: SQLite database via Node.js backend (syncs across browsers when logged in)

**Important**: localStorage is browser-specific and machine-specific!

### Changes Made This Session
1. ✅ Updated `.gitignore` to exclude `.claude/` directory
2. ✅ Fixed file permissions (removed executable bits from scripts)
3. ✅ Pushed to GitHub: `https://github.com/skydam/WisselApp.git`
4. ✅ Commit: "Update file permissions and add Claude Code to gitignore" (a8d043e)

### ✅ RESOLVED ON MAC (November 15, 2025)

**Status**: Player data confirmed in localStorage!

**Issue Found**: `restore-localStorage.html` was checking wrong keys
- Was checking: `players_primary`, `players_backup1`, `players_backup2` ❌
- Should check: `hockey_team_players`, `hockey_team_players_backup1`, `hockey_team_players_backup2` ✅
- **Fixed**: Updated restore page to use correct keys (restore-localStorage.html:86)

**Data Location**: Players ARE stored in Mac localStorage under correct keys

### Backend Server Status on Mac

1. **Node.js backend**: Still won't compile (same better-sqlite3 issue as PC)
   - Node.js v23.10.0 too new for better-sqlite3
   - Requires C++20, compilation fails
   - **Not needed**: App works perfectly with localStorage alone

2. **Python server**: ✅ Working perfectly
   ```bash
   python3 -m http.server 8001
   # Access: http://localhost:8001/index.html
   ```

### Database Status on Mac

**Database file**: `wisselapp.db` exists but is mostly empty:
- **Users table**: 1 user (jvharten@gmail.com, created Oct 4, 2025)
- **Team_data table**: 0 records (empty)

**Conclusion**: All player data lives in localStorage, not in the database. This is fine - the app is designed to work this way!

### File Name Discrepancy Note
- Documentation mentions `index_new.html` but actual file is `index.html`
- All `_new.js` files exist as documented
- This is correct - just the HTML was renamed at some point

### Useful Tools
- ✅ `restore-localStorage.html` - Now fixed to check correct localStorage keys
- `restore-data.html` - Additional restore options
- `check-storage.html` - Storage diagnostics
- Test data button in main app loads 15 sample players
- Auto-export feature saves timestamped backups in localStorage

### How to Access on Mac
```bash
# Start Python server (recommended)
python3 -m http.server 8001

# Open in browser
open http://localhost:8001/index.html

# To check localStorage
open http://localhost:8001/restore-localStorage.html
```

### Optional: Fixing Node.js Backend (if needed for cross-machine sync)
The backend isn't necessary for single-machine use, but if you want it:
1. Downgrade Node.js to v20.x or earlier, OR
2. Wait for better-sqlite3 to support Node v23, OR
3. Use a different database library

## Railway Deployment Setup

### Authentication System
**Migrated to Clerk** (November 15, 2025)
- Professional OAuth 2.0 authentication
- Password recovery via email
- Open signup (anyone can create account)
- Free tier: up to 10,000 users
- Backend: `server.js` (formerly `server-clerk.js`)
- Old custom auth backed up as: `server-custom-auth.js`

### Required Environment Variables (Railway Dashboard)
```bash
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx...
CLERK_SECRET_KEY=sk_live_xxxxx...
NODE_ENV=production
# PORT is set automatically by Railway
```

### Clerk Setup Instructions
1. Create account at https://clerk.com
2. Create new application
3. Enable Email/Password authentication
4. Copy API keys from Dashboard → API Keys
5. Add keys to Railway environment variables

### Railway Configuration
- **File**: `railway.json`
- **Builder**: NIXPACKS (auto-detects Node.js)
- **Start command**: `node server.js`
- **Node version**: 20.x (specified in package.json)
- **Database**: SQLite (wisselapp.db created on first run)
- **Restart policy**: ON_FAILURE (max 10 retries)

### Deployment Steps
1. **GitHub**: Code already pushed to `https://github.com/skydam/WisselApp.git`
2. **Railway Project**:
   - Connect GitHub repo: `skydam/WisselApp`
   - Branch: `master`
   - Auto-deploy: enabled
3. **Environment Variables**: Set Clerk keys in Railway dashboard
4. **Deploy**: Railway auto-deploys on push
5. **Domain**: Railway provides default: `*.up.railway.app`

### Key Changes from Local Development
- **Authentication**: Custom auth → Clerk
- **Signup**: Email whitelist → Open signup
- **Node version**: v23 → v20 (better-sqlite3 compatibility)
- **Database**: Starts fresh on Railway (not migrated from local)

### Testing Checklist
- [ ] App loads at Railway URL
- [ ] User signup works
- [ ] User login works
- [ ] Password recovery works
- [ ] Player management functions
- [ ] Data persists to database
- [ ] Game schedule generation works

### Clerk Authentication Troubleshooting (November 16, 2025)

#### Issues Encountered & Fixes Applied

**Issue 1: Clerk.load() Hanging (FIXED)**
- **Error**: Promise never resolved, stuck on "Calling Clerk.load()..."
- **Cause**: Script tag has `async` attribute, Clerk object not immediately available
- **Fix**: Added polling loop to wait for `window.Clerk` to exist before calling load()
- **Commit**: 022d555

**Issue 2: Missing clerkPublishableKey Variable (FIXED)**
- **Error**: "Can't find variable: clerkPublishableKey" on Railway
- **Cause**: Variable declaration removed during refactoring
- **Fix**: Re-added `const clerkPublishableKey = 'pk_test_...'` at start of initializeClerk()
- **Commit**: c7bc458

**Issue 3: Allowed Origins Not Configured (FIXED)**
- **Error**: Clerk loaded but API calls failed due to CORS
- **Fix**: Updated Clerk instance via API to allow Railway URL
- **Command**: `curl -X PATCH https://api.clerk.com/v1/instance` with allowed_origins
- **Status**: HTTP 204 - Successfully updated

**Issue 4: Deprecated Virtual Routing (FIXED)**
- **Error**: "NotFoundError: The object can not be found here" in Clerk framework code
- **Root Cause**: Using `routing: 'virtual'` in mountSignIn() - this option is **deprecated** in Clerk and marked for removal from public API (internal-only)
- **Investigation**:
  - Compared with working IR document analyzer implementation
  - Searched Clerk documentation and found virtual routing is being phased out
  - Clerk's official JavaScript quickstart doesn't specify routing options at all
- **Fix**:
  - Removed `routing: 'virtual'` from mountSignIn() configuration
  - Let Clerk use default routing behavior (hash-based, handled internally)
  - Kept only appearance customization options
- **Commits**: 47feffa (attempted virtual), 082254c (removed virtual)
- **Status**: ✅ FIXED - Using default Clerk routing

#### Current Implementation

**Frontend (index.html)**:
```html
<script async crossorigin="anonymous"
  data-clerk-publishable-key="pk_test_ZW5nYWdlZC10ZXJyYXBpbi0xNi5jbGVyay5hY2NvdW50cy5kZXYk"
  src="https://engaged-terrapin-16.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js"
></script>
<script src="clerk-auth.js"></script>
```

**clerk-auth.js**:
- Polls for `window.Clerk` existence (max 10 seconds)
- Checks if `Clerk.loaded` before calling `Clerk.load()`
- Calls `Clerk.load()` with explicit publishableKey
- Uses default Clerk routing (no routing option specified)
- Auto-reload on successful sign-in with sessionStorage flag

**Backend (server.js)**:
- Uses Clerk backend SDK for token verification
- Automatic database migration from old schema
- Clerk user ID stored instead of password hashes

#### Working Reference Implementation

**IR Document Analyzer** (successful Clerk integration):
- Uses **React** with `@clerk/clerk-react`
- Uses `<ClerkProvider>`, `<SignIn />`, `<SignUp />` **components**
- Uses `routing="virtual"` in SignIn component
- No manual mounting or hash routing
- **Key difference**: React components vs vanilla JavaScript SDK

#### Resolution Summary (November 16, 2025)

**Root Cause Identified**: The `routing: 'virtual'` option in `mountSignIn()` was causing NotFoundError because:
- Virtual routing is **deprecated** in Clerk's public API
- It's marked for removal and only intended for internal use
- Clerk's official JavaScript quickstart doesn't use routing options

**Fix Applied** (Commit 082254c):
- Removed `routing: 'virtual'` configuration
- Using Clerk's default routing behavior instead
- Kept appearance customization only

**Status**: ✅ Fix deployed to Railway - awaiting test confirmation

#### Testing Required

Railway deployment should now work. Test checklist:
- [ ] App loads at https://wisselapp-production-cac6.up.railway.app/
- [ ] Clerk sign-in form appears properly
- [ ] User signup works
- [ ] User login works
- [ ] No NotFoundError in browser console
- [ ] App shows after authentication
- [ ] Player management functions work
- [ ] Data persists to backend database

#### Railway Deployment URLs

- **Production**: https://wisselapp-production-cac6.up.railway.app/
- **Local**: http://localhost:3000
- **Clerk Dashboard**: https://dashboard.clerk.com → engaged-terrapin-16

#### Clerk API Keys

- **Publishable Key** (client-safe): `pk_test_ZW5nYWdlZC10ZXJyYXBpbi0xNi5jbGVyay5hY2NvdW50cy5kZXYk`
- **Secret Key** (server-only): Stored in Railway environment variables
- **Frontend API**: `engaged-terrapin-16.clerk.accounts.dev`

---

## CRITICAL UPDATE: November 18, 2025 - User Data Isolation Fix

### Authentication System Change
**Reverted from Clerk to Custom Auth** (November 18, 2025)
- Clerk authentication had persistent issues (NotFoundError, virtual routing deprecated)
- Reverted to custom email/password authentication with bcrypt
- Backend: `server.js` (custom auth)
- Clerk version backed up as: `server-clerk-backup.js`
- Email whitelist: DISABLED (anyone can sign up)

### New Features Implemented

#### 1. Minimal Luxury UI Redesign
- Complete visual overhaul with "Elite Coaching Suite" aesthetic
- **Typography**: Playfair Display (headings), Inter (body), JetBrains Mono (code)
- **Colors**: Warm ivory background, deep charcoal text, sophisticated bronze-gold accents
- **Shadows**: Multi-layer shadow system for depth
- **Animations**: Staggered fade-in animations with elegant transitions
- **File**: `styles_shadcn.css` (completely rewritten, 1420 lines)

#### 2. Interactive Player Position Swapping
- Click two players in same formation moment to swap their positions
- Visual feedback: Selected players highlighted with gold gradient
- Swap persists through all subsequent formations
- Smart logic: Only swaps when both players are on field together
- **Files Modified**:
  - `app_new.js`: UI selection logic and click handlers
  - `rotation-engine_new.js`: `swapPlayerPositions()` method
- **Commits**: dc2b615 (initial), a719ae3 (fix click handler), ac7247b (fix swap logic)

#### 3. Admin Password Reset System
- Emergency password reset page for locked-out users
- Admin secret authentication (default: "reset-my-password-please")
- **File Created**: `admin-reset.html`
- **Endpoints Added**: `/api/admin/reset-password`, `/api/admin/debug-users`
- **Commits**: 85249cc, e264e46

### CRITICAL BUG FIXED: User Data Isolation

**Problem**: Different users were seeing the same team data
- Deleting players in one account deleted them in all accounts
- Root cause: `window.useBackendStorage` was never set to `true`
- All users were unknowingly sharing browser localStorage

**Solution** (Commit d92f1c8 - READY BUT NOT PUSHED):
1. **Authentication Check** (`index.html`):
   - Added `checkAuth()` function that runs on page load
   - Sets `window.useBackendStorage = true` when authenticated
   - Redirects to login if not authenticated

2. **Storage Priority** (`storage_new.js`):
   - ALWAYS returns server data when `useBackendStorage` is true
   - Never falls back to localStorage for authenticated users
   - Only uses localStorage in offline/development mode

3. **Database Schema** (`server.js`):
   - Added UNIQUE constraint on `team_data.user_id`
   - Automatic migration code for existing databases
   - Prevents duplicate data rows per user

4. **Extensive Debugging** (`server.js`):
   - `[LOGIN]` logs: Which user ID logs in
   - `[SAVE]` logs: Which user saves data and player count
   - `[LOAD]` logs: Which user loads data and what they receive
   - Helps diagnose data sharing issues via Railway logs

**Files Modified in d92f1c8**:
- `server.js`: Database schema, migration, debugging logs
- `index.html`: Authentication check and `useBackendStorage` setup
- `storage_new.js`: Backend storage priority logic

### ✅ DEPLOYED: November 18, 2025 - Database Schema & Logging

**Commits**:
- d92f1c8: Database UNIQUE constraint, authentication check, debugging logs
- 0581b23: Documentation update

**What Was Fixed**:
1. Database schema updated with UNIQUE constraint on `team_data.user_id`
2. Authentication check added to `index.html`
3. Extensive debugging logs in `server.js` for [LOGIN], [SAVE], [LOAD]

---

## CRITICAL FIX: November 19, 2025 - Race Condition Bug

### The Problem: User Data Still Being Shared

**User Report**: After deploying d92f1c8, users with different email accounts were still seeing the same player data. Creating players in one account would overwrite data in another account.

### Root Cause Analysis

**Race Condition in index.html**:
```javascript
// OLD CODE (BROKEN):
checkAuth();  // Async function, doesn't wait
<script src="player-manager_new.js"></script>  // Loads immediately!

// EXECUTION ORDER:
1. checkAuth() starts (async, returns immediately)
2. Scripts load and execute
3. PlayerManager constructor runs
4. storage.loadPlayers() checks window.useBackendStorage → UNDEFINED!
5. Falls back to localStorage (shared across all users) ❌
6. checkAuth() finishes, sets window.useBackendStorage = true (too late!)
```

**Result**: Every user was unknowingly using **shared browser localStorage** instead of the user-specific backend database!

### The Fix (Commit c1584e9)

**Dynamic Script Loading After Auth Check**:
```javascript
// NEW CODE (FIXED):
(async function initializeApp() {
    const authenticated = await checkAuth();  // WAIT for completion
    if (authenticated) {
        loadAppScripts();  // Load scripts AFTER flag is set
    }
})();

// EXECUTION ORDER:
1. checkAuth() starts and COMPLETES
2. window.useBackendStorage = true is set ✅
3. THEN scripts load dynamically
4. PlayerManager runs with correct flag
5. storage.loadPlayers() uses backend API (user-specific) ✅
```

**Changes Made** (`index.html:157-228`):
- Wrapped initialization in async IIFE
- Await `checkAuth()` completion before proceeding
- Created `loadAppScripts()` to dynamically inject script tags
- Scripts only load after `window.useBackendStorage` is guaranteed to be set

### Expected Console Output After Fix

```
🔐 Checking authentication...
✅ User authenticated, enabling backend storage
📦 Loading application scripts...
✅ All scripts loaded, app ready
📂 Loading players from storage...
📦 Loaded X players from SERVER (user-specific)
💾 Saving X players to storage...
✅ Saved to server + localStorage
```

### Testing Instructions

**IMPORTANT**: Clear browser localStorage before testing!
1. Go to: https://wisselapp-production-cac6.up.railway.app/
2. Open DevTools → Console
3. Sign up with `user1@example.com`, add boys names
4. Check console for "SERVER (user-specific)" messages
5. Logout, sign up with `user2@example.com`, add girls names
6. Logout, login with `user1@example.com` → Should see **boys names**
7. Logout, login with `user2@example.com` → Should see **girls names**

### Deployment Status

- ✅ Fix committed locally (c1584e9)
- ✅ Pushed to GitHub successfully
- ✅ Railway auto-deployment in progress
- ⏳ Awaiting user testing confirmation

**Railway URL**: https://wisselapp-production-cac6.up.railway.app/

---
**Last Updated**: November 19, 2025
**Status**: ✅ Race condition fix deployed - awaiting production testing

---

## MAJOR MIGRATION: December 6-7, 2025 - Supabase PostgreSQL

### The Problem: Ephemeral Storage on Railway

**User Complaint**: "I hate the fact that every time i fix something in the app and the railway deployment i need to sign up again and i need to enter all the team players again."

**Root Cause**: Railway containers have ephemeral filesystems
- SQLite database (`wisselapp.db`) stored in container filesystem
- Every deployment wipes the container and creates a fresh one
- All user accounts and team data lost on each deployment

### The Solution: Cloud PostgreSQL Database

**Migrated from SQLite to Supabase PostgreSQL** (December 6-7, 2025)
- **Database**: Supabase PostgreSQL (free tier: 500MB storage)
- **Persistence**: Data survives all Railway deployments indefinitely
- **Connection**: Session Mode pooler (IPv4-compatible for Railway)
- **Cost**: $0 (both Supabase and Railway free tiers)

### Migration Work Completed

#### 1. New Files Created
- **`supabase-setup.sql`**: Database schema (users, team_data tables)
- **`SUPABASE_SETUP.md`**: Complete setup guide with troubleshooting
- **`.env.example`**: Updated with DATABASE_URL template

#### 2. Backend Migration (`server.js`)
**Replaced better-sqlite3 with pg (PostgreSQL client)**:
```javascript
// Added dotenv for environment variables
require('dotenv').config();
const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000
});
```

**Updated all queries from SQLite to PostgreSQL syntax**:
- `?` placeholders → `$1, $2, $3` placeholders
- `.run()` → `pool.query()`
- `result.lastInsertRowid` → `result.rows[0].id`
- `result.changes` → `result.rowCount`
- Error code `SQLITE_CONSTRAINT` → `'23505'` (PostgreSQL unique violation)

**Example query migration**:
```javascript
// OLD (SQLite):
const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hashedPassword);
req.session.userId = result.lastInsertRowid;

// NEW (PostgreSQL):
const result = await pool.query(
  'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
  [email, hashedPassword]
);
req.session.userId = result.rows[0].id;
```

#### 3. Script Loading Fix (`index.html`)
**Changed from parallel to sequential script loading** to prevent race conditions:
```javascript
async function loadAppScripts() {
    const scripts = [
        'database_new.js',
        'storage_new.js',        // Must load BEFORE player-manager
        'player-manager_new.js',  // Depends on storage
        'rotation-engine_new.js',
        'app_new.js',
        'test-data_new.js'
    ];

    // Load one at a time (sequential)
    for (const src of scripts) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log(`✅ Loaded: ${src}`);
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.body.appendChild(script);
        });
    }
}
```

#### 4. Dependencies Updated (`package.json`)
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "body-parser": "^1.20.2",
    "dotenv": "^17.2.3",      // NEW: Load environment variables
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "pg": "^8.16.3"            // NEW: PostgreSQL client (replaced better-sqlite3)
  }
}
```

### Issues Encountered & Resolved

#### Issue 1: Add Player Button Not Working
**Problem**: Dynamic script loading broke DOMContentLoaded listeners
**Fix**: Removed DOMContentLoaded listeners, scripts now initialize immediately
**Files**: `player-manager_new.js`, `app_new.js`
**Commit**: 46431a0

#### Issue 2: IPv6 Connection Failure
**Problem**: Railway only supports IPv4, Supabase direct connection uses IPv6
**Error**: `ENETUNREACH` trying to connect to `db.xhomocydqgbrwkybtgjf.supabase.co`
**Solution**: Switched to Supabase Session Mode pooler (IPv4-compatible)
**Connection String**:
```
postgresql://postgres.xhomocydqgbrwkybtgjf:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
```

#### Issue 3: Script Loading Race Condition
**Problem**: `player-manager_new.js` executed before `storage_new.js` loaded
**Error**: `ReferenceError: Can't find variable: storage`
**Symptom**: Players saved successfully but not loaded after redeployment
**Fix**: Sequential script loading with async/await (see code above)
**Commit**: 2c02221

### Supabase Setup Instructions

#### 1. Create Supabase Account
- Go to https://supabase.com
- Sign up for free account
- Create new project (choose region: EU West)

#### 2. Create Database Tables
- Go to **SQL Editor** in Supabase dashboard
- Run `supabase-setup.sql` script
- Verify tables created: `users`, `team_data`

#### 3. Get Connection String
- Go to **Project Settings** → **Database** → **Connection String**
- Select **Session pooler** mode (not Direct connection)
- Copy connection string (URI format)
- Replace `[YOUR-PASSWORD]` with your actual database password

#### 4. Configure Railway
- Go to Railway dashboard → Your project
- **Variables** tab
- Add `DATABASE_URL` with Supabase connection string
- Railway auto-redeploys with new environment variable

### Current Environment Variables (Railway)

```bash
DATABASE_URL=postgresql://postgres.xhomocydqgbrwkybtgjf:aafjes24@aws-1-eu-west-1.pooler.supabase.com:5432/postgres
SESSION_SECRET=hockey-team-secret-key-change-in-production
ADMIN_PASSWORD=admin123
ADMIN_SECRET=reset-my-password-please
NODE_ENV=production
PORT=3000  # Set automatically by Railway
```

### Testing Results

✅ **All tests passed**:
1. User signup works and persists across deployments
2. User login works with correct credentials
3. Players added by one user are NOT visible to other users
4. Player data persists after Railway redeployments
5. Password reset via `admin-reset.html` works
6. All game features work (schedule generation, formations, etc.)

**User Feedback**: "Yes! it works now. Perfect!"

### Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team data table (one row per user)
CREATE TABLE team_data (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,  -- Stores players array and game settings
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_team_data_user_id ON team_data(user_id);
CREATE INDEX idx_users_email ON users(email);
```

### Updated Technology Stack

#### Current Architecture (December 2025)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom OKLCH color system, shadcn/ui inspired design
- **Fonts**: Geist Sans & Geist Mono (via CDN)
- **Icons**: Lucide icons (via CDN)
- **Backend**: Node.js + Express
- **Authentication**: Custom email/password with bcrypt
- **Database**: Supabase PostgreSQL (cloud-hosted, persistent)
- **Deployment**: Railway (auto-deploy from GitHub)
- **Local Development**: Python HTTP server for frontend testing

#### Data Flow
1. User signs up/logs in → Express session created
2. User adds/edits players → Saved to PostgreSQL via `/api/team/save`
3. User loads app → Data fetched from PostgreSQL via `/api/team/load`
4. User logs out → Session destroyed
5. User logs back in → Same data loaded from PostgreSQL ✅

### Migration Timeline

- **December 6, 2025 21:00**: User reported data loss problem
- **December 6, 2025 21:30**: Researched alternatives (Supabase, Turso, Neon)
- **December 6, 2025 22:00**: Chose Supabase PostgreSQL
- **December 6, 2025 22:30**: Created database schema and setup guide
- **December 6, 2025 23:00**: Migrated all server.js queries
- **December 7, 2025 00:00**: Fixed IPv6 connection issue
- **December 7, 2025 01:00**: Fixed script loading race condition
- **December 7, 2025 01:30**: Testing complete, migration successful

### Files Modified in Migration

| File | Changes |
|------|---------|
| `server.js` | Complete PostgreSQL migration, dotenv setup |
| `package.json` | Added `pg` and `dotenv` dependencies |
| `index.html` | Sequential script loading |
| `player-manager_new.js` | Removed DOMContentLoaded listener |
| `app_new.js` | Removed DOMContentLoaded listener |
| `admin.html` | Fixed duplicate endpoint name |
| `.env.example` | Added DATABASE_URL |
| `supabase-setup.sql` | NEW - Database schema |
| `SUPABASE_SETUP.md` | NEW - Complete setup guide |
| `CLAUDE.md` | This documentation update |

### Key Commits

- **7c56252**: Initial PostgreSQL migration
- **46431a0**: Fix Add Player button (remove DOMContentLoaded)
- **2c02221**: Sequential script loading to prevent race conditions
- **[current]**: Documentation update

### Deployment Status

- ✅ Code pushed to GitHub: `https://github.com/skydam/WisselApp.git`
- ✅ Railway auto-deployed with PostgreSQL
- ✅ Supabase database configured and running
- ✅ All functionality tested and working
- ✅ Data persists across deployments

**Production URL**: https://wisselapp-production-cac6.up.railway.app/

---
**Last Updated**: December 7, 2025
**Status**: ✅ Supabase PostgreSQL migration complete and deployed