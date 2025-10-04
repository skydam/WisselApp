class Storage {
    constructor() {
        this.STORAGE_KEYS = {
            PLAYERS: 'hockey_team_players',
            GAME_STATE: 'hockey_game_state',
            SETTINGS: 'hockey_team_settings'
        };
    }

    async savePlayers(players) {
        try {
            // Use the new database system if available
            if (window.database) {
                return await window.database.savePlayers(players);
            }
            
            // Fallback to localStorage
            localStorage.setItem(this.STORAGE_KEYS.PLAYERS, JSON.stringify(players));
            return true;
        } catch (error) {
            console.error('Error saving players:', error);
            return false;
        }
    }

    async loadPlayers() {
        try {
            // Use the new database system if available
            if (window.database) {
                return await window.database.loadPlayers();
            }
            
            // Fallback to localStorage
            const players = localStorage.getItem(this.STORAGE_KEYS.PLAYERS);
            return players ? JSON.parse(players) : [];
        } catch (error) {
            console.error('Error loading players:', error);
            return [];
        }
    }

    saveGameState(gameState) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.GAME_STATE, JSON.stringify(gameState));
            return true;
        } catch (error) {
            console.error('Error saving game state:', error);
            return false;
        }
    }

    loadGameState() {
        try {
            const gameState = localStorage.getItem(this.STORAGE_KEYS.GAME_STATE);
            return gameState ? JSON.parse(gameState) : null;
        } catch (error) {
            console.error('Error loading game state:', error);
            return null;
        }
    }

    clearGameState() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.GAME_STATE);
            return true;
        } catch (error) {
            console.error('Error clearing game state:', error);
            return false;
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    loadSettings() {
        try {
            const settings = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            return settings ? JSON.parse(settings) : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            return this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            gameDuration: 70,
            substitutionInterval: 6,
            halfTimeDuration: 35,
            quarterDuration: 17.5
        };
    }

    exportData() {
        try {
            const data = {
                players: this.loadPlayers(),
                settings: this.loadSettings(),
                exportDate: new Date().toISOString()
            };
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.players && Array.isArray(data.players)) {
                this.savePlayers(data.players);
            }
            
            if (data.settings && typeof data.settings === 'object') {
                this.saveSettings(data.settings);
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    clearAllData() {
        try {
            Object.values(this.STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing all data:', error);
            return false;
        }
    }

    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    getStorageInfo() {
        try {
            let totalSize = 0;
            Object.values(this.STORAGE_KEYS).forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    totalSize += item.length;
                }
            });
            
            return {
                available: this.isStorageAvailable(),
                totalSize: totalSize,
                playerCount: this.loadPlayers().length,
                hasGameState: !!this.loadGameState()
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return {
                available: false,
                totalSize: 0,
                playerCount: 0,
                hasGameState: false
            };
        }
    }
}

const storage = new Storage();