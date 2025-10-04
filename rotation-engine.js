class RotationEngine {
    constructor() {
        this.gameSettings = {
            totalGameTime: 70,
            substitutionInterval: 5 + 50/60, // 5:50 in exact decimal minutes
            quarterDuration: 17.5,
            quarters: 4
        };
        this.fieldPositions = {
            goalkeeper: ['gk'],
            defense: ['d1', 'd2', 'd3', 'd4'],
            midfield: ['m1', 'm2', 'm3'],
            forward: ['f1', 'f2', 'f3']
        };
        this.positionNames = {
            'gk': 'Goalkeeper',
            'd1': 'Left Back', 'd2': 'Center Back', 'd3': 'Right Back', 'd4': 'Sweeper',
            'm1': 'Left Mid', 'm2': 'Center Mid', 'm3': 'Right Mid',
            'f1': 'Left Forward', 'f2': 'Center Forward', 'f3': 'Right Forward'
        };
        this.gameSchedule = null;
        this.considerStrength = true;
    }

    generateGameSchedule(players, considerStrength = true, considerFatigue = false) {
        if (!this.validatePlayersForGame(players)) {
            throw new Error('Need at least 1 goalkeeper and 10 outfield players to generate schedule');
        }

        this.considerStrength = considerStrength;
        this.considerFatigue = considerFatigue;
        const goalkeeper = players.find(p => p.type === 'goalkeeper');
        const outfieldPlayers = players.filter(p => p.type === 'outfield');

        // Generate the complete game plan
        const gamePlan = this.generateCompletePlan(goalkeeper, outfieldPlayers);
        
        // Extract quarter lineups from the game plan
        const quarterLineups = this.extractQuarterLineups(gamePlan, goalkeeper);
        
        // Generate substitution schedule
        const substitutionSchedule = this.generateSubstitutionSchedule(gamePlan);

        // Calculate playing time distribution
        const playingTimeDistribution = this.calculatePlayingTimeDistribution(gamePlan, outfieldPlayers);

        this.gameSchedule = {
            momentLineups: this.generateMomentLineups(gamePlan),
            quarterLineups,
            substitutionSchedule,
            playingTimeDistribution,
            considerStrength: this.considerStrength,
            considerFatigue: this.considerFatigue,
            createdAt: new Date().toISOString()
        };

        return this.gameSchedule;
    }

    validatePlayersForGame(players) {
        const goalkeepers = players.filter(p => p.type === 'goalkeeper').length;
        const outfieldPlayers = players.filter(p => p.type === 'outfield').length;
        return goalkeepers >= 1 && outfieldPlayers >= 10;
    }

    generateCompletePlan(goalkeeper, outfieldPlayers) {
        // Calculate substitution times: 0, 5:50, 11:40, 17:30 (quarter start), 23:20, 29:10, 35:00 (quarter start), 40:50, 46:40, 52:30 (quarter start), 58:20, 64:10
        const substitutionTimes = [];
        
        // Generate times every 5:50 (5.83 minutes)
        for (let time = 0; time < 70; time += this.gameSettings.substitutionInterval) {
            substitutionTimes.push(Math.round(time * 100) / 100); // Round to 2 decimal places
        }

        console.log('Substitution times:', substitutionTimes.map(t => this.formatTime(t)));

        const gamePlan = [];
        const playingTimeTracker = {};
        const positionAssignments = {}; // Track which player is in which position
        const consecutivePlayTracker = {}; // Track consecutive intervals played

        // Initialize tracking
        outfieldPlayers.forEach(player => {
            playingTimeTracker[player.id] = 0;
            consecutivePlayTracker[player.id] = 0;
        });

        // Generate lineup for each time segment
        for (let i = 0; i < substitutionTimes.length; i++) {
            const startTime = substitutionTimes[i];
            const endTime = i < substitutionTimes.length - 1 ? substitutionTimes[i + 1] : 70;
            const segmentDuration = endTime - startTime;

            const lineup = this.createSegmentLineup(goalkeeper, outfieldPlayers, playingTimeTracker, startTime, positionAssignments, consecutivePlayTracker, i === 0);
            
            gamePlan.push({
                startTime: startTime,
                endTime: endTime,
                duration: segmentDuration,
                lineup: lineup,
                bench: outfieldPlayers.filter(p => !Object.values(lineup).find(lp => lp && lp.id === p.id))
            });

            // Update playing time tracker
            Object.values(lineup).forEach(player => {
                if (player && player.type === 'outfield') {
                    playingTimeTracker[player.id] += segmentDuration;
                }
            });
        }

        return gamePlan;
    }

    createSegmentLineup(goalkeeper, outfieldPlayers, playingTimeTracker, currentTime, positionAssignments, consecutivePlayTracker, isFirstSegment) {
        const lineup = {};
        
        // Always place goalkeeper
        lineup['gk'] = goalkeeper;

        if (isFirstSegment) {
            // First segment - assign players to positions randomly
            let selectedPlayers;
            
            if (this.considerStrength) {
                // When considering strength, use weighted random selection
                // Give stronger players higher probability but still allow weaker players to start
                const playersWithWeight = outfieldPlayers.map(p => ({
                    ...p,
                    weight: Math.pow(p.skill, 2) * Math.random() // Skill-squared times random factor
                }));
                const sortedByWeight = playersWithWeight.sort((a, b) => b.weight - a.weight);
                selectedPlayers = sortedByWeight.slice(0, 10);
            } else {
                // Pure random selection - ensure it's truly random every time
                const shuffledPlayers = [...outfieldPlayers];
                // Fisher-Yates shuffle with timestamp seed influence
                for (let i = shuffledPlayers.length - 1; i > 0; i--) {
                    const j = Math.floor((Math.random() + Date.now() % 1000 / 10000) * (i + 1)) % (i + 1);
                    [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
                }
                selectedPlayers = shuffledPlayers.slice(0, 10);
            }
            const outfieldPositions = [
                ...this.fieldPositions.defense,
                ...this.fieldPositions.midfield, 
                ...this.fieldPositions.forward
            ];
            const shuffledPositions = this.shuffleArray([...outfieldPositions]);

            selectedPlayers.forEach((player, index) => {
                const position = shuffledPositions[index];
                positionAssignments[position] = player.id; // Track position assignment
                consecutivePlayTracker[player.id] = 1; // First interval
                lineup[position] = {
                    ...player,
                    assignedPosition: this.positionNames[position]
                };
            });
            
            // Reset consecutive count for bench players
            outfieldPlayers.forEach(player => {
                if (!selectedPlayers.find(p => p.id === player.id)) {
                    consecutivePlayTracker[player.id] = 0;
                }
            });
        } else {
            // Subsequent segments - keep players in same positions, only substitute
            
            // First, keep all continuing players in their existing positions
            Object.entries(positionAssignments).forEach(([position, playerId]) => {
                const player = outfieldPlayers.find(p => p.id === playerId);
                if (player) {
                    lineup[position] = {
                        ...player,
                        assignedPosition: this.positionNames[position]
                    };
                    // Increment consecutive play counter for continuing players
                    consecutivePlayTracker[player.id]++;
                }
            });

            // Get current field and bench status
            const playersOnField = Object.values(lineup).filter(p => p && p.type === 'outfield');
            const playersOnBench = outfieldPlayers.filter(p => !playersOnField.find(pf => pf.id === p.id));

            // Determine substitutions needed (limit to 2-4 players per substitution)
            const maxSubstitutions = Math.min(4, Math.floor(playersOnBench.length / 2));
            
            if (maxSubstitutions > 0 && playersOnBench.length >= 2) {
                // Sort field players by playing time and fatigue
                const playersToConsiderOut = playersOnField.sort((a, b) => {
                    // Apply fatigue penalty if enabled (highest priority)
                    if (this.considerFatigue) {
                        const fatigueA = Math.max(0, consecutivePlayTracker[a.id] - 3) * 0.1;
                        const fatigueB = Math.max(0, consecutivePlayTracker[b.id] - 3) * 0.1;
                        
                        // Players with higher fatigue (more consecutive intervals) should go out first
                        if (Math.abs(fatigueA - fatigueB) > 0.05) {
                            return fatigueB - fatigueA;
                        }
                    }
                    
                    const timeDiff = playingTimeTracker[b.id] - playingTimeTracker[a.id];
                    
                    if (this.considerStrength) {
                        // Combine playing time and skill with small random factor
                        const randomFactorA = (Math.random() - 0.5) * 1; // ±0.5 minutes random
                        const randomFactorB = (Math.random() - 0.5) * 1;
                        const scoreA = playingTimeTracker[a.id] - (a.skill * 3) + randomFactorA;
                        const scoreB = playingTimeTracker[b.id] - (b.skill * 3) + randomFactorB;
                        return scoreB - scoreA;
                    }
                    // Add small random factor even when not considering strength
                    const randomFactorA = (Math.random() - 0.5) * 0.5; // ±0.25 minutes random
                    const randomFactorB = (Math.random() - 0.5) * 0.5;
                    return (timeDiff) + (randomFactorB - randomFactorA);
                });

                // Sort bench players by playing time (least played first for substitution in)
                const playersToConsiderIn = playersOnBench.sort((a, b) => {
                    const timeDiff = playingTimeTracker[a.id] - playingTimeTracker[b.id];
                    
                    if (this.considerStrength) {
                        // Combine playing time and skill with small random factor
                        const randomFactorA = (Math.random() - 0.5) * 1; // ±0.5 minutes random
                        const randomFactorB = (Math.random() - 0.5) * 1;
                        const scoreA = playingTimeTracker[a.id] - (a.skill * 3) + randomFactorA;
                        const scoreB = playingTimeTracker[b.id] - (b.skill * 3) + randomFactorB;
                        return scoreA - scoreB;
                    }
                    // Add small random factor even when not considering strength
                    const randomFactorA = (Math.random() - 0.5) * 0.5; // ±0.25 minutes random
                    const randomFactorB = (Math.random() - 0.5) * 0.5;
                    return (timeDiff) + (randomFactorB - randomFactorA);
                });

                // Make substitutions (2 players for balance)
                const numberOfSubs = Math.min(2, playersToConsiderOut.length, playersToConsiderIn.length);
                
                for (let i = 0; i < numberOfSubs; i++) {
                    const playerOut = playersToConsiderOut[i];
                    const playerIn = playersToConsiderIn[i];
                    
                    // Find the position of the player going out
                    const positionOfPlayerOut = Object.entries(lineup).find(([pos, player]) => 
                        player && player.id === playerOut.id
                    );
                    
                    if (positionOfPlayerOut) {
                        const [position] = positionOfPlayerOut;
                        
                        // Substitute: player in takes exact same position as player out
                        positionAssignments[position] = playerIn.id;
                        lineup[position] = {
                            ...playerIn,
                            assignedPosition: this.positionNames[position]
                        };
                        
                        // Update consecutive tracking for substitution
                        consecutivePlayTracker[playerOut.id] = 0; // Reset for player going out
                        consecutivePlayTracker[playerIn.id] = 1; // Start counting for player coming in
                    }
                }
            }
        }

        return lineup;
    }

    extractQuarterLineups(gamePlan, goalkeeper) {
        const quarterLineups = [];
        
        for (let quarter = 1; quarter <= 4; quarter++) {
            const quarterStart = (quarter - 1) * 17.5;
            
            // Find the segment that starts at or just before the quarter start
            const quarterSegment = gamePlan.find(segment => 
                segment.startTime <= quarterStart && segment.endTime > quarterStart
            ) || gamePlan.find(segment => Math.abs(segment.startTime - quarterStart) < 0.1);

            if (quarterSegment) {
                quarterLineups.push({
                    quarter: quarter,
                    timeRange: `${quarterStart.toFixed(1)}-${(quarterStart + 17.5).toFixed(1)} min`,
                    lineup: quarterSegment.lineup,
                    bench: quarterSegment.bench
                });
            }
        }

        return quarterLineups;
    }

    generateSubstitutionSchedule(gamePlan) {
        const substitutions = [];

        for (let i = 1; i < gamePlan.length; i++) {
            const previousSegment = gamePlan[i - 1];
            const currentSegment = gamePlan[i];
            
            // Find players going out and coming in
            const previousPlayers = Object.values(previousSegment.lineup).filter(p => p && p.type === 'outfield');
            const currentPlayers = Object.values(currentSegment.lineup).filter(p => p && p.type === 'outfield');
            
            const playersOut = previousPlayers.filter(p => 
                !currentPlayers.find(cp => cp.id === p.id)
            );
            
            const playersIn = currentPlayers.filter(p => 
                !previousPlayers.find(pp => pp.id === p.id)
            );

            if (playersOut.length > 0 || playersIn.length > 0) {
                const substitution = {
                    time: currentSegment.startTime,
                    quarter: Math.ceil(currentSegment.startTime / 17.5),
                    out: playersOut.map(p => ({
                        name: p.name,
                        position: p.assignedPosition
                    })),
                    in: playersIn.map(p => p.name),
                    reason: this.considerFatigue ? 
                        'Balance playing time, maintain team strength, and prevent fatigue' : 
                        this.considerStrength ? 
                            'Balance playing time and maintain team strength' : 
                            'Ensure equal playing time for all players'
                };

                substitutions.push(substitution);
            }
        }

        return substitutions;
    }

    calculatePlayingTimeDistribution(gamePlan, outfieldPlayers) {
        const distribution = {};

        // Initialize distribution tracking
        outfieldPlayers.forEach(player => {
            distribution[player.id] = {
                name: player.name,
                skill: player.skill,
                q1Time: 0,
                q2Time: 0,
                q3Time: 0,
                q4Time: 0,
                totalTime: 0
            };
        });

        // Calculate playing time per quarter and total
        gamePlan.forEach(segment => {
            const quarter = Math.ceil(segment.startTime / 17.5);
            
            Object.values(segment.lineup).forEach(player => {
                if (player && player.type === 'outfield' && distribution[player.id]) {
                    const quarterKey = `q${quarter}Time`;
                    distribution[player.id][quarterKey] += segment.duration;
                    distribution[player.id].totalTime += segment.duration;
                }
            });
        });

        // Round all times to 1 decimal place
        Object.values(distribution).forEach(player => {
            player.q1Time = Math.round(player.q1Time * 10) / 10;
            player.q2Time = Math.round(player.q2Time * 10) / 10;
            player.q3Time = Math.round(player.q3Time * 10) / 10;
            player.q4Time = Math.round(player.q4Time * 10) / 10;
            player.totalTime = Math.round(player.totalTime * 10) / 10;
        });

        return Object.values(distribution).sort((a, b) => b.totalTime - a.totalTime);
    }

    generateMomentLineups(gamePlan) {
        const momentLineups = [];

        for (let i = 0; i < gamePlan.length; i++) {
            const segment = gamePlan[i];
            const previousSegment = i > 0 ? gamePlan[i - 1] : null;
            
            // Determine which players are being substituted
            let playersOut = [];
            let playersIn = [];
            
            if (previousSegment) {
                const previousPlayers = Object.values(previousSegment.lineup).filter(p => p && p.type === 'outfield');
                const currentPlayers = Object.values(segment.lineup).filter(p => p && p.type === 'outfield');
                
                playersOut = previousPlayers.filter(p => 
                    !currentPlayers.find(cp => cp.id === p.id)
                );
                
                playersIn = currentPlayers.filter(p => 
                    !previousPlayers.find(pp => pp.id === p.id)
                );
            }

            momentLineups.push({
                time: segment.startTime,
                timeText: this.formatTime(segment.startTime),
                endTime: segment.endTime,
                duration: segment.duration,
                lineup: segment.lineup,
                bench: segment.bench,
                playersOut: playersOut,
                playersIn: playersIn,
                hasSubstitution: playersOut.length > 0 || playersIn.length > 0,
                isQuarterStart: segment.startTime === 0 || segment.startTime === 17.5 || segment.startTime === 35 || segment.startTime === 52.5
            });
        }

        return momentLineups;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getGameSchedule() {
        return this.gameSchedule;
    }

    clearGameSchedule() {
        this.gameSchedule = null;
    }

    formatTime(minutes) {
        const mins = Math.floor(minutes);
        const secs = Math.round((minutes - mins) * 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    exportSchedule() {
        if (!this.gameSchedule) {
            throw new Error('No game schedule to export');
        }

        return {
            ...this.gameSchedule,
            exportedAt: new Date().toISOString()
        };
    }
}

let rotationEngine;