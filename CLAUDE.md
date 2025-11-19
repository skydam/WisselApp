# Hockey Team Manager - Claude Development Notes

## Project Overview
A comprehensive hockey team management web application for coaches to manage players, generate fair rotations, and track playing time distribution during 70-minute games.

## Current Status: ✅ FULLY FUNCTIONAL

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Fonts**: Geist Sans & Geist Mono (Next.js standard fonts)
- **Icons**: Lucide icons via CDN
- **Styling**: Custom OKLCH color system, shadcn/ui inspired design
- **Data Storage**: Enhanced localStorage with backup redundancy
- **Server**: Python HTTP server for development

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
- ✅ Enhanced localStorage with backup redundancy
- ✅ Auto-export functionality for external backups
- ✅ Version tracking and timestamped saves
- ✅ Multiple backup layers to prevent data loss

### Current File Structure
```
WisselApp/
├── index_new.html           # Main HTML (current version)
├── styles_shadcn.css        # OKLCH color system + shadcn/ui styling
├── player-manager_new.js    # Player roster management
├── rotation-engine_new.js   # Game rotation algorithm
├── app_new.js              # Navigation & game UI controller
├── database_new.js         # Enhanced localStorage system
├── storage_new.js          # Data persistence interface
├── test-data_new.js        # Sample player data
└── CLAUDE.md              # This file
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

2. **Team Strength Balance** (Weight: Moderate) 
   - Only considered when playing times are similar (±0.5 min)
   - Balances skill levels to prevent all strong/weak players together
   - Uses weighted average team skill calculation

3. **Position Variety** (Weight: Minimal)
   - Framework ready for position rotation
   - Currently maintains consistent positions during subs

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