// Enhanced database system with backup redundancy
class Database {
    constructor() {
        this.storageKeys = {
            players: 'hockey_team_players',
            backup1: 'hockey_team_players_backup1',
            backup2: 'hockey_team_players_backup2',
            lastSave: 'hockey_team_last_save'
        };
        this.autoBackupEnabled = true;
        this.maxBackups = 3;
    }

    async save(data, key = 'players') {
        try {
            const timestamp = new Date().toISOString();
            const dataWithMeta = {
                data: data,
                timestamp: timestamp,
                version: '2.0',
                checksum: this.generateChecksum(JSON.stringify(data))
            };

            const serialized = JSON.stringify(dataWithMeta);
            
            // Primary save
            localStorage.setItem(this.storageKeys[key], serialized);
            
            // Backup saves
            if (this.autoBackupEnabled) {
                localStorage.setItem(this.storageKeys.backup1, serialized);
                localStorage.setItem(this.storageKeys.backup2, localStorage.getItem(this.storageKeys.backup1) || serialized);
            }
            
            // Update last save timestamp
            localStorage.setItem(this.storageKeys.lastSave, timestamp);
            
            // Auto-export for external backup
            if (data && data.length > 0) {
                this.autoExport(data, timestamp);
            }
            
            console.log(`✅ Database save successful at ${timestamp}`);
            return true;
            
        } catch (error) {
            console.error('❌ Database save failed:', error);
            return false;
        }
    }

    async load(key = 'players') {
        try {
            // Try primary storage first
            let stored = localStorage.getItem(this.storageKeys[key]);
            
            if (!stored) {
                console.log('Primary storage empty, trying backup1...');
                stored = localStorage.getItem(this.storageKeys.backup1);
            }
            
            if (!stored) {
                console.log('Backup1 empty, trying backup2...');
                stored = localStorage.getItem(this.storageKeys.backup2);
            }
            
            if (!stored) {
                console.log('All storage empty, returning empty array');
                return [];
            }

            const parsed = JSON.parse(stored);
            
            // Handle legacy data format
            if (Array.isArray(parsed)) {
                console.log('📦 Loading legacy format data');
                return parsed;
            }
            
            // Handle new format with metadata
            if (parsed.data) {
                console.log(`📦 Loading data from ${parsed.timestamp || 'unknown time'}`);
                
                // Verify checksum if available
                if (parsed.checksum) {
                    const currentChecksum = this.generateChecksum(JSON.stringify(parsed.data));
                    if (currentChecksum !== parsed.checksum) {
                        console.warn('⚠️ Data checksum mismatch, data may be corrupted');
                    }
                }
                
                return parsed.data || [];
            }
            
            return [];
            
        } catch (error) {
            console.error('❌ Database load failed:', error);
            return [];
        }
    }

    generateChecksum(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    autoExport(data, timestamp) {
        try {
            const exportData = {
                exportedAt: timestamp,
                version: '2.0',
                playerCount: data.length,
                players: data
            };
            
            const exportJson = JSON.stringify(exportData, null, 2);
            const exportKey = `hockey_export_${timestamp.replace(/[:.]/g, '-')}`;
            
            // Store in localStorage as backup
            localStorage.setItem(exportKey, exportJson);
            
            // Clean up old exports (keep only last 5)
            this.cleanupOldExports();
            
            console.log(`💾 Auto-export completed: ${exportKey}`);
            
        } catch (error) {
            console.error('❌ Auto-export failed:', error);
        }
    }

    cleanupOldExports() {
        try {
            const exportKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('hockey_export_')) {
                    exportKeys.push(key);
                }
            }
            
            // Sort by timestamp (newest first)
            exportKeys.sort((a, b) => b.localeCompare(a));
            
            // Remove old exports (keep only 5 most recent)
            for (let i = 5; i < exportKeys.length; i++) {
                localStorage.removeItem(exportKeys[i]);
                console.log(`🗑️ Cleaned up old export: ${exportKeys[i]}`);
            }
            
        } catch (error) {
            console.error('❌ Export cleanup failed:', error);
        }
    }

    getStorageInfo() {
        const info = {
            primarySize: this.getItemSize(this.storageKeys.players),
            backup1Size: this.getItemSize(this.storageKeys.backup1),
            backup2Size: this.getItemSize(this.storageKeys.backup2),
            lastSave: localStorage.getItem(this.storageKeys.lastSave),
            totalUsage: 0
        };
        
        // Calculate total localStorage usage
        for (let key in localStorage) {
            info.totalUsage += localStorage[key].length;
        }
        
        return info;
    }

    getItemSize(key) {
        const item = localStorage.getItem(key);
        return item ? item.length : 0;
    }

    clearAll() {
        Object.values(this.storageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
        console.log('🗑️ All database storage cleared');
    }
}

// Create global database instance
const database = new Database();