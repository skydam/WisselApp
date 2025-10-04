class Database {
    constructor() {
        // For now, use enhanced localStorage with export/import for persistence
        // Future: can be upgraded to Supabase/Firebase
        this.storageKey = 'hockey-persistent-data';
        this.isOnline = navigator.onLine;
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncLocalToRemote();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    async savePlayers(players) {
        try {
            // Enhanced localStorage with timestamp and backup
            const data = {
                players: players,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            
            // Save to multiple localStorage keys for redundancy
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            localStorage.setItem(this.storageKey + '-backup', JSON.stringify(data));
            
            // Auto-export to file for manual backup
            this.autoExportToFile(data);
            
            console.log(`Saved ${players.length} players with timestamp: ${data.timestamp}`);
            return true;
        } catch (error) {
            console.error('Database save error:', error);
            return false;
        }
    }

    async loadPlayers() {
        try {
            // Try primary storage first
            let stored = localStorage.getItem(this.storageKey);
            
            // If primary fails, try backup
            if (!stored) {
                stored = localStorage.getItem(this.storageKey + '-backup');
                console.log('Using backup storage');
            }
            
            if (stored) {
                const data = JSON.parse(stored);
                console.log(`Loaded ${data.players?.length || 0} players from ${data.timestamp || 'unknown time'}`);
                return data.players || [];
            }
            
            // Try legacy storage format
            const legacy = localStorage.getItem('hockey-players');
            if (legacy) {
                const players = JSON.parse(legacy);
                console.log('Migrated from legacy storage');
                // Save in new format
                await this.savePlayers(players);
                return players;
            }
            
            console.log('No stored players found');
            return [];

        } catch (error) {
            console.error('Database load error:', error);
            return [];
        }
    }

    autoExportToFile(data) {
        try {
            // Only export once per session to avoid spam
            if (this.hasExportedThisSession) return;
            
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // Create invisible download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `hockey-team-backup-${new Date().toISOString().slice(0, 10)}.json`;
            link.style.display = 'none';
            
            // Auto-download as backup
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.hasExportedThisSession = true;
            console.log('Auto-exported backup file');
        } catch (error) {
            console.log('Auto-export failed (this is OK):', error.message);
        }
    }

    // Get backup status
    getBackupInfo() {
        try {
            const primary = localStorage.getItem(this.storageKey);
            const backup = localStorage.getItem(this.storageKey + '-backup');
            
            return {
                hasPrimary: !!primary,
                hasBackup: !!backup,
                lastSaved: primary ? JSON.parse(primary).timestamp : null,
                playerCount: primary ? JSON.parse(primary).players.length : 0
            };
        } catch (error) {
            return { hasPrimary: false, hasBackup: false, lastSaved: null, playerCount: 0 };
        }
    }
}

// For now, use a demo/fallback mode that just uses localStorage
// Users can upgrade to full database later
window.database = new Database();

// Show setup instructions on first load
if (localStorage.getItem('hockey-db-setup-shown') !== 'true') {
    Database.setup();
    localStorage.setItem('hockey-db-setup-shown', 'true');
}