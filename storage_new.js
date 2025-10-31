// Storage interface for player data
const storage = {
    async savePlayers(players) {
        try {
            console.log(`💾 Saving ${players.length} players to storage...`);

            // ALWAYS save to localStorage as backup
            const localSaveSuccess = await database.save(players, 'players');
            console.log(`📦 localStorage backup: ${localSaveSuccess ? 'SUCCESS' : 'FAILED'}`);

            // Save to backend API if available
            if (window.useBackendStorage) {
                try {
                    const response = await fetch('/api/team/save', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({ data: { players } })
                    });

                    if (!response.ok) {
                        console.warn('⚠️ Backend save failed, using localStorage only');
                        return localSaveSuccess;
                    }

                    console.log('✅ Saved to server + localStorage');
                    return true;
                } catch (backendError) {
                    console.warn('⚠️ Backend unavailable, using localStorage only:', backendError);
                    return localSaveSuccess;
                }
            }

            // Just localStorage
            return localSaveSuccess;
        } catch (error) {
            console.error('❌ Storage save failed:', error);
            return false;
        }
    },

    async loadPlayers() {
        try {
            console.log('📂 Loading players from storage...');

            let players = [];

            // Try to load from backend API if available
            if (window.useBackendStorage) {
                try {
                    const response = await fetch('/api/team/load', {
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        players = result.data?.players || [];
                        console.log(`📦 Loaded ${players.length} players from server`);

                        // If server has data, return it
                        if (players.length > 0) {
                            return players;
                        }
                    }
                } catch (backendError) {
                    console.warn('⚠️ Backend unavailable, trying localStorage:', backendError);
                }
            }

            // Fallback to localStorage (or if backend was empty)
            players = await database.load('players');
            console.log(`📦 Loaded ${players.length} players from localStorage`);
            return players || [];
        } catch (error) {
            console.error('❌ Storage load failed:', error);
            return [];
        }
    },

    async clearPlayers() {
        try {
            console.log('🗑️ Clearing all player storage...');
            return await database.save([], 'players');
        } catch (error) {
            console.error('❌ Storage clear failed:', error);
            return false;
        }
    },

    getStorageInfo() {
        return database.getStorageInfo();
    },

    exportPlayers() {
        try {
            const players = database.load('players');
            const exportData = {
                exportedAt: new Date().toISOString(),
                version: '2.0',
                playerCount: players.length,
                players: players
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `hockey-team-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            console.log('📥 Players exported successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Export failed:', error);
            return false;
        }
    }
};