function loadTestData() {
    if (!playerManager) {
        console.error('PlayerManager not initialized');
        return;
    }

    const testPlayers = [
        { name: 'John Smith', type: 'goalkeeper', skill: 4 },
        { name: 'Mike Johnson', type: 'outfield', skill: 4 },
        { name: 'Sarah Wilson', type: 'outfield', skill: 3 },
        { name: 'Tom Brown', type: 'outfield', skill: 5 },
        { name: 'Lisa Davis', type: 'outfield', skill: 4 },
        { name: 'Chris Taylor', type: 'outfield', skill: 3 },
        { name: 'Emma Miller', type: 'outfield', skill: 5 },
        { name: 'David Lee', type: 'outfield', skill: 4 },
        { name: 'Anna Garcia', type: 'outfield', skill: 3 },
        { name: 'Jake Martinez', type: 'outfield', skill: 4 },
        { name: 'Sophie Anderson', type: 'outfield', skill: 5 },
        { name: 'Ryan Clark', type: 'outfield', skill: 4 },
        { name: 'Maya Rodriguez', type: 'outfield', skill: 3 },
        { name: 'Alex Turner', type: 'outfield', skill: 4 },
        { name: 'Jordan White', type: 'outfield', skill: 3 }
    ];

    playerManager.players = [];
    
    try {
        testPlayers.forEach(player => {
            playerManager.addPlayer(player.name, player.type, player.skill);
        });
        
        console.log('Test data loaded successfully!');
        console.log(`Added ${testPlayers.length} players:`);
        console.log(`- Goalkeepers: ${playerManager.getPositionCount('goalkeeper')}`);
        console.log(`- Outfield players: ${playerManager.getPositionCount('outfield')}`);
        console.log(`Can start game: ${playerManager.canStartGame()}`);
        
        return true;
    } catch (error) {
        console.error('Error loading test data:', error);
        return false;
    }
}

function testRotationEngine() {
    if (!rotationEngine || !playerManager) {
        console.error('Engines not initialized');
        return false;
    }

    const players = playerManager.getAllPlayers();
    
    try {
        console.log('Testing rotation engine...');
        
        const lineup = rotationEngine.initializeGame(players);
        console.log('Initial lineup created successfully');
        console.log('Players on field:', Object.keys(lineup).length);
        
        rotationEngine.updateGameTime(6.1);
        const recommendation = rotationEngine.getSubstitutionRecommendation(players);
        
        if (recommendation) {
            console.log('Substitution recommendation generated:');
            console.log(`- Players out: ${recommendation.out.map(p => p.name).join(', ')}`);
            console.log(`- Players in: ${recommendation.in.map(p => p.name).join(', ')}`);
            console.log(`- Reason: ${recommendation.reason}`);
        } else {
            console.log('No substitution recommendation (expected for initial test)');
        }
        
        const stats = rotationEngine.getGameStats(players);
        console.log('Game stats:', stats);
        
        return true;
    } catch (error) {
        console.error('Error testing rotation engine:', error);
        return false;
    }
}

function runAllTests() {
    console.log('=== Hockey Team Manager Tests ===');
    
    const testResults = {
        dataLoad: false,
        rotationEngine: false
    };
    
    testResults.dataLoad = loadTestData();
    
    if (testResults.dataLoad) {
        testResults.rotationEngine = testRotationEngine();
    }
    
    console.log('\n=== Test Results ===');
    console.log(`Data Loading: ${testResults.dataLoad ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Rotation Engine: ${testResults.rotationEngine ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = Object.values(testResults).every(result => result);
    console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    return allPassed;
}