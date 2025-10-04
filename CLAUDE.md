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
**Last Updated**: September 2025  
**Status**: Production Ready ✅