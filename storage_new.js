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

            // Try to load from backend API if user is authenticated
            if (window.useBackendStorage) {
                try {
                    const response = await fetch('/api/team/load', {
                        credentials: 'same-origin'
                    });

                    if (response.ok) {
                        const result = await response.json();
                        players = result.data?.players || [];
                        console.log(`📦 Loaded ${players.length} players from SERVER (user-specific)`);

                        // IMPORTANT: When using backend storage, ALWAYS return server data
                        // Even if empty - don't fall back to localStorage (which has other users' data)
                        return players;
                    } else if (response.status === 401) {
                        console.warn('⚠️ Not authenticated - redirecting to login');
                        window.location.href = '/login.html';
                        return [];
                    }
                } catch (backendError) {
                    console.warn('⚠️ Backend unavailable, using localStorage:', backendError);
                    // Only fall back to localStorage if backend is completely unavailable (network error)
                }
            }

            // Only use localStorage if backend storage is disabled (local development)
            players = await database.load('players');
            console.log(`📦 Loaded ${players.length} players from localStorage (offline mode)`);
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