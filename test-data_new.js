// Test data functionality
function loadTestData() {
    if (!playerManager) {
        alert('Player manager not initialized');
        return;
    }

    if (confirm('This will clear existing players and load test data. Continue?')) {
        // Clear existing players
        playerManager.players = [];
        playerManager.nextId = 1;

        // Test players with varied skills
        const testPlayers = [
            { name: 'Alex Johnson', skill: 5 },
            { name: 'Jordan Smith', skill: 4 },
            { name: 'Taylor Brown', skill: 3 },
            { name: 'Casey Williams', skill: 4 },
            { name: 'Morgan Davis', skill: 2 },
            { name: 'Riley Miller', skill: 5 },
            { name: 'Avery Wilson', skill: 3 },
            { name: 'Quinn Moore', skill: 4 },
            { name: 'Sage Taylor', skill: 3 },
            { name: 'River Anderson', skill: 2 },
            { name: 'Skyler Thomas', skill: 5 },
            { name: 'Cameron Jackson', skill: 4 },
            { name: 'Drew White', skill: 3 },
            { name: 'Emery Harris', skill: 2 },
            { name: 'Phoenix Martin', skill: 4 }
        ];

        // Add all test players
        testPlayers.forEach(playerData => {
            try {
                playerManager.addPlayer(playerData.name, playerData.skill);
            } catch (error) {
                console.error(`Error adding player ${playerData.name}:`, error);
            }
        });

        // Set first player as goalkeeper
        if (playerManager.players.length > 0) {
            playerManager.setGoalkeeper(playerManager.players[0].id);
        }

        // Set all players as available
        playerManager.players.forEach(player => {
            playerManager.setPlayerAvailability(player.id, true);
        });

        console.log(`Loaded ${testPlayers.length} test players`);
    }
}