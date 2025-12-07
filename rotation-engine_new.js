class RotationEngine {
    constructor(playerManager, substitutionsPerQuarter = 2) {
        this.playerManager = playerManager;
        this.schedule = [];
        this.gameLength = 70; // minutes
        this.quartersCount = 4;
        this.quarterLength = this.gameLength / this.quartersCount; // 17.5 minutes
        this.substitutionsPerQuarter = substitutionsPerQuarter;
        // Calculate interval based on number of substitutions per quarter
        this.substitutionInterval = this.quarterLength / (this.substitutionsPerQuarter + 1);
        this.fieldPositions = [
            'F1', 'F2', 'F3', // 3 Forwards
            'M1', 'M2', 'M3', // 3 Midfield
            'D1', 'D2', 'D3', // 3 Defenders
            'S1' // 1 Sweeper (last defender)
        ];
        this.allPositions = ['G', ...this.fieldPositions]; // G = Goalkeeper
    }

    // Get position score value: Forward=+1, Midfield=0, Defender/Sweeper=-1
    getPositionScore(position) {
        if (position.startsWith('F')) return 1;   // Forward
        if (position.startsWith('M')) return 0;   // Midfield
        if (position.startsWith('D') || position === 'S1') return -1; // Defender/Sweeper
        return 0; // Default (shouldn't happen)
    }

    // Update player's cumulative position score
    updatePositionScore(player, position) {
        const score = this.getPositionScore(position);
        player.positionScore = (player.positionScore || 0) + score;
    }

    // Static method to calculate formation moment options based on roster size
    static getFormationOptions(availablePlayers) {
        const benchSize = availablePlayers - 11; // 11 = 10 outfield + 1 goalkeeper

        // Calculate optimal subs per quarter for equal playing time
        // More bench players = need more frequent subs for fairness
        let optimalSubsPerQuarter;
        if (benchSize <= 1) {
            optimalSubsPerQuarter = 1; // Small bench: 1 sub per quarter (8.75 min max)
        } else if (benchSize <= 3) {
            optimalSubsPerQuarter = 1; // Medium bench: 1 sub per quarter
        } else {
            optimalSubsPerQuarter = 2; // Large bench: 2 subs per quarter for fairness
        }

        const options = [
            {
                name: 'Optimal',
                substitutionsPerQuarter: optimalSubsPerQuarter,
                totalMoments: 4 + (optimalSubsPerQuarter * 4),
                intervalMinutes: 17.5 / (optimalSubsPerQuarter + 1),
                description: 'Best for equal playing time',
                bestFor: `${availablePlayers} players (${benchSize} bench)`,
                recommended: true // Always recommend optimal
            },
            {
                name: 'Quick',
                substitutionsPerQuarter: 1,
                totalMoments: 8,
                intervalMinutes: 8.75,
                description: '1 substitution per quarter',
                bestFor: 'Faster games, less disruption',
                recommended: false
            },
            {
                name: 'Detailed',
                substitutionsPerQuarter: 2,
                totalMoments: 12,
                intervalMinutes: 5.83,
                description: '2 substitutions per quarter',
                bestFor: 'Maximum rotation for large benches',
                recommended: false
            }
        ];

        return options;
    }

    generateSchedule(considerStrength = true, considerFatigue = false) {
        console.log('🏒 Starting schedule generation...');
        
        // Get available players (those marked as available for match)
        const availablePlayers = this.playerManager.getAvailablePlayers();
        console.log(`Available players: ${availablePlayers.length}`, availablePlayers.map(p => p.name));
        
        // Verify we have enough players
        const goalkeeper = availablePlayers.find(p => p.isGoalkeeper);
        const outfieldPlayers = availablePlayers.filter(p => !p.isGoalkeeper);
        
        if (!goalkeeper) {
            throw new Error('No goalkeeper available for the match');
        }
        
        if (outfieldPlayers.length < 10) {
            throw new Error(`Need at least 10 outfield players, but only ${outfieldPlayers.length} are available`);
        }

        console.log(`✅ Roster check passed: 1 goalkeeper (${goalkeeper.name}) + ${outfieldPlayers.length} outfield players`);

        // Reset all player states
        availablePlayers.forEach(player => {
            player.playingTime = 0;
            player.isOnField = false;
            player.fieldPosition = null;
            player.assignedPosition = null;
            player.consecutiveIntervals = 0;
        });

        this.schedule = [];
        
        // Calculate moments: opening formation + substitutions (total 9 moments)
        const moments = [];
        
        for (let quarter = 1; quarter <= this.quartersCount; quarter++) {
            // Add quarter start (0:00) for each quarter
            moments.push({
                quarter,
                subInQuarter: 0,
                timeInGame: (quarter - 1) * this.quarterLength,
                displayTime: '0:00'
            });
            
            // Add substitution moments within each quarter
            for (let subInQuarter = 1; subInQuarter <= this.substitutionsPerQuarter; subInQuarter++) {
                const timeInGame = ((quarter - 1) * this.quarterLength) + (subInQuarter * this.substitutionInterval);
                const timeInQuarter = subInQuarter * this.substitutionInterval;
                moments.push({
                    quarter,
                    subInQuarter,
                    timeInGame: Math.round(timeInGame * 100) / 100,
                    displayTime: this.formatTime(timeInQuarter)
                });
            }
        }

        console.log('⏰ Substitution moments:', moments.map(m => `Q${m.quarter}-${m.subInQuarter}: ${m.displayTime}`));

        // Generate lineups for each moment
        for (let i = 0; i < moments.length; i++) {
            const moment = moments[i];
            console.log(`\n🔄 Generating lineup for moment ${i + 1}: Q${moment.quarter}-${moment.subInQuarter} (${moment.displayTime})`);
            
            const lineup = this.generateMomentLineup(i, availablePlayers, considerStrength, considerFatigue, moments);
            
            this.schedule.push({
                moment: i + 1,
                quarter: moment.quarter,
                subInQuarter: moment.subInQuarter,
                timeInGame: moment.timeInGame,
                displayTime: moment.displayTime,
                lineup: lineup,
                substitutions: i > 0 ? this.calculateSubstitutions(this.schedule[i-1].lineup, lineup) : []
            });
        }

        // Add playing time for the final interval (from last moment to game end)
        const finalInterval = this.schedule[this.schedule.length - 1];
        if (finalInterval) {
            const finalDuration = this.gameLength - finalInterval.timeInGame;
            finalInterval.lineup.forEach(lineupPlayer => {
                lineupPlayer.player.playingTime += finalDuration;
            });
        }
        
        console.log('✅ Schedule generation complete!');
        console.log('📊 Final playing time distribution:', 
            availablePlayers.map(p => `${p.name}: ${p.playingTime.toFixed(1)}min`)
        );
        
        return this.schedule;
    }

    generateMomentLineup(momentIndex, availablePlayers, considerStrength, considerFatigue, moments) {
        const goalkeeper = availablePlayers.find(p => p.isGoalkeeper);
        const outfieldPlayers = availablePlayers.filter(p => !p.isGoalkeeper);
        
        // Goalkeeper is always playing
        const lineup = [{
            player: goalkeeper,
            position: 'G',
            isSubstitution: false
        }];
        
        // Calculate interval duration based on the moment type
        let intervalDuration = this.substitutionInterval;
        if (momentIndex > 0) {
            const prevMoment = moments[momentIndex - 1];
            const currMoment = moments[momentIndex];
            intervalDuration = currMoment.timeInGame - prevMoment.timeInGame;

            // Add time and position scores for players who were on field in previous interval
            outfieldPlayers.forEach(player => {
                if (player.isOnField && player.fieldPosition) {
                    player.playingTime += intervalDuration;
                    // Update position score based on position played
                    this.updatePositionScore(player, player.fieldPosition);
                }
            });
            goalkeeper.playingTime += intervalDuration;
        }

        // For first moment, select players with equal time priority
        if (momentIndex === 0) {
            // Sort by playing time (ascending), then by skill for balance
            const sortedPlayers = [...outfieldPlayers].sort((a, b) => {
                const timeDiff = a.playingTime - b.playingTime;
                if (Math.abs(timeDiff) < 0.1) { // If equal time, consider skill
                    return considerStrength ? a.skill - b.skill : Math.random() - 0.5;
                }
                return timeDiff;
            });

            const selectedPlayers = sortedPlayers.slice(0, 10);

            // Assign positions randomly for first moment
            const shuffledPositions = [...this.fieldPositions].sort(() => Math.random() - 0.5);

            selectedPlayers.forEach((player, index) => {
                const position = shuffledPositions[index];

                player.isOnField = true;
                player.fieldPosition = position;
                player.assignedPosition = position;
                player.consecutiveIntervals = 1;

                lineup.push({
                    player: player,
                    position: position,
                    isSubstitution: false
                });
            });

            console.log(`Initial lineup: ${selectedPlayers.map(p => `${p.name}(${p.fieldPosition})`).join(', ')}`);
            return lineup;
        }

        // For subsequent moments: EQUAL TIME is PRIORITY #1
        const currentOnField = outfieldPlayers.filter(p => p.isOnField);
        const currentOffField = outfieldPlayers.filter(p => !p.isOnField);
        
        console.log(`Currently on field: ${currentOnField.map(p => `${p.name}(${p.playingTime.toFixed(1)}min)`).join(', ')}`);
        console.log(`Currently off field: ${currentOffField.map(p => `${p.name}(${p.playingTime.toFixed(1)}min)`).join(', ')}`);

        // Calculate optimal number of substitutions for equal time
        const avgPlayingTime = outfieldPlayers.reduce((sum, p) => sum + p.playingTime, 0) / outfieldPlayers.length;
        const maxTimeDifference = Math.max(...outfieldPlayers.map(p => p.playingTime)) - Math.min(...outfieldPlayers.map(p => p.playingTime));
        
        console.log(`Average playing time: ${avgPlayingTime.toFixed(1)}min, Max difference: ${maxTimeDifference.toFixed(1)}min`);
        
        // Calculate how many players need to be rotated for better balance
        const overplayedOnField = currentOnField.filter(p => p.playingTime > avgPlayingTime + 1.0);
        const underplayedOffField = currentOffField.filter(p => p.playingTime < avgPlayingTime - 1.0);
        
        // Determine substitutions needed (minimum 2, maximum based on imbalance)
        const numSubstitutions = Math.min(
            Math.max(2, Math.min(overplayedOnField.length, underplayedOffField.length)),
            Math.min(5, currentOffField.length) // Never more than 5 subs, and never more than available
        );
        
        console.log(`Making ${numSubstitutions} substitutions for equal time`);

        // Priority 1: Equal playing time - select players to sub out (most playing time from on-field)
        const playersToSubOut = currentOnField
            .sort((a, b) => {
                const timeDiff = b.playingTime - a.playingTime; // Most time first
                if (Math.abs(timeDiff) < 0.5) {
                    // If similar time, consider fatigue
                    if (considerFatigue) {
                        return b.consecutiveIntervals - a.consecutiveIntervals;
                    }
                    return Math.random() - 0.5;
                }
                return timeDiff;
            })
            .slice(0, numSubstitutions);

        // Priority 1: Equal playing time - select players to sub in (least playing time from off-field)
        let playersToSubIn = currentOffField
            .sort((a, b) => {
                const timeDiff = a.playingTime - b.playingTime; // Least time first
                if (Math.abs(timeDiff) < 0.5 && considerStrength) {
                    // Priority 2: Team strength balance - mix skill levels
                    const currentFieldSkill = currentOnField.reduce((sum, p) => sum + p.skill, 0) / currentOnField.length;
                    const aSkillDiff = Math.abs(a.skill - currentFieldSkill);
                    const bSkillDiff = Math.abs(b.skill - currentFieldSkill);
                    return aSkillDiff - bSkillDiff; // Prefer players that balance team skill
                }
                return timeDiff;
            })
            .slice(0, numSubstitutions);

        console.log(`Subbing out: ${playersToSubOut.map(p => `${p.name}(${p.playingTime.toFixed(1)}min)`).join(', ')}`);
        console.log(`Subbing in: ${playersToSubIn.map(p => `${p.name}(${p.playingTime.toFixed(1)}min)`).join(', ')}`);

        // Update player states
        outfieldPlayers.forEach(player => {
            if (playersToSubOut.includes(player)) {
                player.isOnField = false;
                player.consecutiveIntervals = 0;
                player.fieldPosition = null;
            } else if (playersToSubIn.includes(player)) {
                player.isOnField = true;
                player.consecutiveIntervals = 1;
            } else if (player.isOnField) {
                player.consecutiveIntervals++;
            }
        });

        // Priority 2: Position score balancing - assign positions to balance cumulative scores
        // Collect available positions from outgoing players
        const availablePositions = playersToSubOut.map(p => p.fieldPosition || p.assignedPosition);

        // Sort positions by score value (forward=+1 first, then midfield=0, then defense=-1)
        availablePositions.sort((a, b) => this.getPositionScore(b) - this.getPositionScore(a));

        // Sort incoming players by their cumulative position score (lowest first)
        // Players with low/negative scores (played more defense) get forward positions first
        const sortedIncomingPlayers = [...playersToSubIn].sort((a, b) => {
            const scoreA = a.positionScore || 0;
            const scoreB = b.positionScore || 0;
            return scoreA - scoreB; // Lowest score first
        });

        // Assign positions: lowest-score player gets highest-value position (forward)
        sortedIncomingPlayers.forEach((player, index) => {
            const position = availablePositions[index];
            player.fieldPosition = position;
            player.assignedPosition = position;
        });

        console.log(`Position assignments (score balancing): ${sortedIncomingPlayers.map(p => `${p.name}(score:${p.positionScore || 0})→${p.fieldPosition}`).join(', ')}`);

        // Build final lineup
        const finalOnField = outfieldPlayers.filter(p => p.isOnField);
        finalOnField.forEach(player => {
            lineup.push({
                player: player,
                position: player.fieldPosition,
                isSubstitution: playersToSubIn.includes(player)
            });
        });

        console.log(`Final lineup (Q${currentQuarter}): ${finalOnField.map(p => `${p.name}(${p.fieldPosition})`).join(', ')}`);
        return lineup;
    }

    calculateSubstitutions(previousLineup, currentLineup) {
        const substitutions = [];
        
        // Find players who were on field but are now off
        const previousPlayers = previousLineup.map(p => p.player.id);
        const currentPlayers = currentLineup.map(p => p.player.id);
        
        // Players going out
        previousLineup.forEach(prevPlayer => {
            if (!currentPlayers.includes(prevPlayer.player.id)) {
                substitutions.push({
                    type: 'out',
                    player: prevPlayer.player,
                    position: prevPlayer.position
                });
            }
        });
        
        // Players coming in
        currentLineup.forEach(currPlayer => {
            if (!previousPlayers.includes(currPlayer.player.id)) {
                substitutions.push({
                    type: 'in',
                    player: currPlayer.player,
                    position: currPlayer.position
                });
            }
        });
        
        return substitutions;
    }

    // Playing time is now calculated incrementally during lineup generation

    formatTime(minutes) {
        const mins = Math.floor(minutes);
        const secs = Math.round((minutes - mins) * 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    getSchedule() {
        return this.schedule;
    }

    getPlayingTimeDistribution() {
        if (this.schedule.length === 0) return [];
        
        const availablePlayers = this.playerManager.getAvailablePlayers();
        return availablePlayers.map(player => ({
            id: player.id,
            name: player.name,
            skill: player.skill,
            isGoalkeeper: player.isGoalkeeper,
            playingTime: player.playingTime || 0,
            intervalsPlayed: this.schedule.filter(moment => 
                moment.lineup.some(lineupPlayer => lineupPlayer.player.id === player.id)
            ).length
        })).sort((a, b) => b.playingTime - a.playingTime);
    }

    getMomentLineup(momentIndex) {
        if (momentIndex >= 0 && momentIndex < this.schedule.length) {
            return this.schedule[momentIndex];
        }
        return null;
    }

    swapPlayerPositions(momentIndex, playerId1, playerId2) {
        console.log(`🔄 Swapping players ${playerId1} and ${playerId2} from moment ${momentIndex + 1}`);

        if (!this.schedule || momentIndex >= this.schedule.length) {
            console.error('Invalid moment index');
            return;
        }

        const moment = this.schedule[momentIndex];
        const lineup = moment.lineup;

        // Convert to numbers to handle string/number mismatch from dataset
        const id1 = parseInt(playerId1);
        const id2 = parseInt(playerId2);

        // Find the two players in the current lineup
        const player1Lineup = lineup.find(p => p.player.id === id1);
        const player2Lineup = lineup.find(p => p.player.id === id2);

        if (!player1Lineup || !player2Lineup) {
            console.error('One or both players not found in lineup');
            console.error(`Looking for player IDs: ${id1} and ${id2}`);
            console.error('Available players in lineup:', lineup.map(p => `${p.player.name}(${p.player.id})`));
            return;
        }

        // Store the positions we're swapping
        const position1 = player1Lineup.position;
        const position2 = player2Lineup.position;

        console.log(`Swapping: ${player1Lineup.player.name} at ${position1} ↔ ${player2Lineup.player.name} at ${position2}`);

        // Swap positions in current moment
        player1Lineup.position = position2;
        player2Lineup.position = position1;

        // Update player objects
        player1Lineup.player.fieldPosition = position2;
        player2Lineup.player.fieldPosition = position1;
        player1Lineup.player.assignedPosition = position2;
        player2Lineup.player.assignedPosition = position1;

        // For all subsequent moments where BOTH players are playing, swap their positions
        for (let i = momentIndex + 1; i < this.schedule.length; i++) {
            const futureMoment = this.schedule[i];
            const futureLineup = futureMoment.lineup;

            // Find both players in this future lineup
            const futurePlayer1 = futureLineup.find(p => p.player.id === id1);
            const futurePlayer2 = futureLineup.find(p => p.player.id === id2);

            // Only swap if BOTH players are playing in this moment
            if (futurePlayer1 && futurePlayer2) {
                // Swap their positions
                const tempPos = futurePlayer1.position;
                futurePlayer1.position = futurePlayer2.position;
                futurePlayer2.position = tempPos;

                // Update player objects
                futurePlayer1.player.fieldPosition = futurePlayer1.position;
                futurePlayer2.player.fieldPosition = futurePlayer2.position;
                futurePlayer1.player.assignedPosition = futurePlayer1.position;
                futurePlayer2.player.assignedPosition = futurePlayer2.position;

                console.log(`  Moment ${i + 1}: ${futurePlayer1.player.name} now at ${futurePlayer1.position}, ${futurePlayer2.player.name} now at ${futurePlayer2.position}`);
            } else {
                // If only one player is playing, they keep whatever position they were assigned
                console.log(`  Moment ${i + 1}: Only one player playing, no swap needed`);
            }
        }

        // Recalculate substitutions for all moments (to update in/out indicators)
        for (let i = 1; i < this.schedule.length; i++) {
            this.schedule[i].substitutions = this.calculateSubstitutions(
                this.schedule[i - 1].lineup,
                this.schedule[i].lineup
            );
        }

        console.log('✅ Player swap complete for all subsequent moments');
    }
}