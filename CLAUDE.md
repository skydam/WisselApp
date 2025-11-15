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

### ACTION REQUIRED ON MAC

**When resuming on Mac, check these:**

1. **Check localStorage for player data**:
   - Open: `http://localhost:8001/restore-localStorage.html`
   - Click "Check localStorage" button
   - See if players are stored there

2. **Backend server test**:
   ```bash
   cd /path/to/WisselApp
   node server.js
   # Should start on port 3000
   # Check http://localhost:3000
   ```

3. **Check database on Mac**:
   ```bash
   sqlite3 wisselapp.db "SELECT COUNT(*) FROM team_data;"
   sqlite3 wisselapp.db "SELECT * FROM team_data;"
   ```

4. **If data found on Mac**:
   - Use restore tools to migrate/backup
   - Consider exporting players via the export function
   - May need to sync database across machines

### File Name Discrepancy Note
- Documentation mentions `index_new.html` but actual file is `index.html`
- All `_new.js` files exist as documented
- This is correct - just the HTML was renamed at some point

### Useful Recovery Tools
- `restore-localStorage.html` - Check/restore from browser localStorage
- `restore-data.html` - Additional restore options
- `check-storage.html` - Storage diagnostics
- Test data button in main app loads 15 sample players

### Next Steps
1. Run on Mac to locate actual player data
2. Consider fixing Node.js compatibility (downgrade Node or update better-sqlite3)
3. Set up proper data sync between machines if needed
4. Export player data as backup JSON files for safety

---
**Last Updated**: November 15, 2025
**Status**: Production Ready ✅ (with localStorage fallback on PC)