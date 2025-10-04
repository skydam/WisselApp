// Storage interface for player data
const storage = {
    async savePlayers(players) {
        try {
            console.log(`💾 Saving ${players.length} players to storage...`);
            return await database.save(players, 'players');
        } catch (error) {
            console.error('❌ Storage save failed:', error);
            return false;
        }
    },

    async loadPlayers() {
        try {
            console.log('📂 Loading players from storage...');
            const players = await database.load('players');
            console.log(`📦 Loaded ${players.length} players from storage`);
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