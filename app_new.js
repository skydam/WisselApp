// Main application controller
class App {
    constructor() {
        this.currentSection = 'players';
        this.rotationEngine = null;
        this.selectedPlayersForSwap = []; // Track selected players for position swapping

        this.initializeNavigation();
        this.initializeGameControls();
    }

    initializeNavigation() {
        const playersTab = document.getElementById('players-tab');
        const gameTab = document.getElementById('game-tab');
        const playersSection = document.getElementById('players-section');
        const gameSection = document.getElementById('game-section');

        if (playersTab && gameTab && playersSection && gameSection) {
            playersTab.addEventListener('click', () => {
                this.switchSection('players');
            });

            gameTab.addEventListener('click', () => {
                this.switchSection('game');
            });
        }
    }

    switchSection(section) {
        // Update tabs
        const playersTab = document.getElementById('players-tab');
        const gameTab = document.getElementById('game-tab');
        
        if (playersTab && gameTab) {
            playersTab.classList.toggle('active', section === 'players');
            gameTab.classList.toggle('active', section === 'game');
        }

        // Update sections
        const playersSection = document.getElementById('players-section');
        const gameSection = document.getElementById('game-section');
        
        if (playersSection && gameSection) {
            playersSection.classList.toggle('active', section === 'players');
            gameSection.classList.toggle('active', section === 'game');
        }

        this.currentSection = section;
    }

    initializeGameControls() {
        const generateBtn = document.getElementById('generate-schedule-btn');
        const clearBtn = document.getElementById('clear-schedule-btn');
        const printBtn = document.getElementById('print-schedule-btn');

        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.startScheduleGeneration();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearSchedule();
            });
        }

        if (printBtn) {
            printBtn.addEventListener('click', () => {
                this.printSchedule();
            });
        }
    }

    startScheduleGeneration() {
        try {
            if (!playerManager) {
                throw new Error('Player manager not initialized');
            }

            // Check if we can start a game
            if (!playerManager.canStartGame()) {
                alert('Cannot generate schedule: Need at least 1 goalkeeper and 10 outfield players marked as available.');
                return;
            }

            // Get available players count
            const availablePlayers = playerManager.getAvailablePlayers().length;

            // Show formation moment selector modal
            this.showFormationMomentSelector(availablePlayers);

        } catch (error) {
            console.error('Error starting schedule generation:', error);
            alert('Error: ' + error.message);
        }
    }

    showFormationMomentSelector(availablePlayers) {
        // Get formation options from RotationEngine
        const options = RotationEngine.getFormationOptions(availablePlayers);
        const benchSize = availablePlayers - 11;

        // Create modal HTML
        const modalHTML = `
            <div id="formation-modal" class="modal-overlay">
                <div class="modal-dialog">
                    <div class="modal-header">
                        <h2>Select Formation Moments</h2>
                        <p class="modal-subtitle">You have ${availablePlayers} players (${benchSize} on bench). Choose how many substitution moments you'd like:</p>
                    </div>
                    <div class="modal-content">
                        <div class="formation-options">
                            ${options.map(option => `
                                <div class="formation-option ${option.recommended ? 'recommended' : ''}"
                                     data-subs-per-quarter="${option.substitutionsPerQuarter}">
                                    ${option.recommended ? '<div class="recommended-badge">Recommended</div>' : ''}
                                    <h3>${option.name}</h3>
                                    <div class="option-details">
                                        <div class="detail-item">
                                            <strong>${option.totalMoments}</strong> moments
                                        </div>
                                        <div class="detail-item">
                                            <strong>~${option.intervalMinutes}</strong> min intervals
                                        </div>
                                    </div>
                                    <p class="option-description">${option.description}</p>
                                    <p class="option-best-for">${option.bestFor}</p>
                                    <button class="btn-select-option" data-subs-per-quarter="${option.substitutionsPerQuarter}">
                                        Select ${option.name}
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="modal-cancel" class="btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add event listeners
        const modal = document.getElementById('formation-modal');
        const cancelBtn = document.getElementById('modal-cancel');
        const selectBtns = modal.querySelectorAll('.btn-select-option');

        // Cancel button
        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Selection buttons
        selectBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const subsPerQuarter = parseInt(btn.dataset.subsPerQuarter);
                modal.remove();
                this.generateSchedule(subsPerQuarter);
            });
        });
    }

    generateSchedule(substitutionsPerQuarter = 2) {
        try {
            if (!playerManager) {
                throw new Error('Player manager not initialized');
            }

            // Get settings
            const considerStrength = document.getElementById('consider-strength')?.checked || false;
            const considerFatigue = document.getElementById('consider-fatigue')?.checked || false;
            const swapPositionsAtHalftime = document.getElementById('swap-positions-halftime')?.checked || false;

            // Initialize rotation engine with selected substitutions per quarter and halftime swap setting
            this.rotationEngine = new RotationEngine(playerManager, substitutionsPerQuarter, swapPositionsAtHalftime);

            // Generate schedule
            console.log(`Generating schedule with ${substitutionsPerQuarter} substitutions per quarter...`);
            const schedule = this.rotationEngine.generateSchedule(considerStrength, considerFatigue);
            
            // Update UI
            this.populateSubstitutionMoments(schedule);
            this.populatePlayingTimeDistribution();
            this.populateGanttChart();
            this.populateSubstitutionSchedule(schedule);
            
            // Show/hide buttons
            const clearBtn = document.getElementById('clear-schedule-btn');
            const printBtn = document.getElementById('print-schedule-btn');
            
            if (clearBtn) clearBtn.classList.remove('hidden');
            if (printBtn) printBtn.classList.remove('hidden');

            console.log('Schedule generated successfully!');

        } catch (error) {
            console.error('Error generating schedule:', error);
            alert('Error generating schedule: ' + error.message);
        }
    }

    handlePlayerCardClick(nameCard) {
        console.log('🎯 Player card clicked:', nameCard);

        if (!this.rotationEngine) {
            console.log('❌ No rotation engine');
            return;
        }

        const playerId = nameCard.dataset.playerId;
        const position = nameCard.dataset.position;
        const momentIndex = parseInt(nameCard.dataset.momentIndex);

        console.log(`📋 Player data: ID=${playerId}, Pos=${position}, Moment=${momentIndex}`);
        console.log(`📊 Currently selected:`, this.selectedPlayersForSwap.length, 'players');

        // Check if player is already selected
        const alreadySelected = this.selectedPlayersForSwap.findIndex(p => p.playerId === playerId && p.momentIndex === momentIndex);

        if (alreadySelected !== -1) {
            // Deselect
            console.log('🔴 Deselecting player');
            this.selectedPlayersForSwap.splice(alreadySelected, 1);
            nameCard.classList.remove('selected');
        } else {
            // Select player
            if (this.selectedPlayersForSwap.length >= 2) {
                // Clear previous selections
                console.log('🧹 Clearing previous selections (had 2 already)');
                document.querySelectorAll('.player-namecard.selected').forEach(card => {
                    card.classList.remove('selected');
                });
                this.selectedPlayersForSwap = [];
            }

            console.log('✅ Selecting player');
            this.selectedPlayersForSwap.push({ playerId, position, momentIndex, element: nameCard });
            nameCard.classList.add('selected');

            // If we now have 2 players selected from the same moment, perform swap
            if (this.selectedPlayersForSwap.length === 2) {
                console.log('🎲 Two players selected, checking if same moment...');
                const player1 = this.selectedPlayersForSwap[0];
                const player2 = this.selectedPlayersForSwap[1];

                console.log(`Player 1: ${player1.playerId} at moment ${player1.momentIndex}`);
                console.log(`Player 2: ${player2.playerId} at moment ${player2.momentIndex}`);

                if (player1.momentIndex === player2.momentIndex) {
                    console.log('✅ Same moment! Swapping...');
                    this.swapPlayerPositions(player1, player2);
                } else {
                    console.log('❌ Different moments!');
                    alert('Please select two players from the same moment to swap positions.');
                    // Clear selections
                    document.querySelectorAll('.player-namecard.selected').forEach(card => {
                        card.classList.remove('selected');
                    });
                    this.selectedPlayersForSwap = [];
                }
            }
        }
    }

    swapPlayerPositions(player1, player2) {
        console.log(`Swapping positions: Player ${player1.playerId} (${player1.position}) ↔ Player ${player2.playerId} (${player2.position})`);

        // Call rotation engine to swap positions from this moment forward
        this.rotationEngine.swapPlayerPositions(
            player1.momentIndex,
            player1.playerId,
            player2.playerId
        );

        // Clear selections
        document.querySelectorAll('.player-namecard.selected').forEach(card => {
            card.classList.remove('selected');
        });
        this.selectedPlayersForSwap = [];

        // Re-render all displays
        const schedule = this.rotationEngine.getSchedule();
        this.populateSubstitutionMoments(schedule);
        this.populatePlayingTimeDistribution();
        this.populateGanttChart();
        this.populateSubstitutionSchedule(schedule);

        console.log('Positions swapped and displays updated!');
    }

    populateSubstitutionMoments(schedule) {
        const container = document.getElementById('substitution-moments');
        if (!container) return;

        container.innerHTML = '';

        schedule.forEach((moment, index) => {
            const momentDiv = this.createSubstitutionMoment(moment, index);
            container.appendChild(momentDiv);
        });
    }

    createSubstitutionMoment(moment, index) {
        const div = document.createElement('div');
        div.className = 'substitution-moment';

        // Create field formation with moment index for swapping
        const field = this.createMiniField(moment.lineup, moment.substitutions, index);
        
        // Get bench players (available but not in lineup)
        const availablePlayers = this.rotationEngine ? this.rotationEngine.playerManager.getAvailablePlayers() : [];
        const onFieldIds = moment.lineup.map(p => p.player.id);
        const benchPlayers = availablePlayers.filter(p => !onFieldIds.includes(p.id) && !p.isGoalkeeper);
        
        div.innerHTML = `
            <div class="moment-header">
                <div class="moment-title">Moment ${moment.moment}</div>
                <div class="moment-time">Q${moment.quarter} - ${moment.displayTime}</div>
            </div>
        `;
        
        div.appendChild(field);
        
        // Add bench display
        if (benchPlayers.length > 0) {
            const benchDiv = document.createElement('div');
            benchDiv.className = 'bench-players';
            benchDiv.innerHTML = `
                <div class="bench-label">Bench:</div>
                <div class="bench-list">
                    ${benchPlayers.map(player => `<span class="bench-player">${player.name}</span>`).join('')}
                </div>
            `;
            div.appendChild(benchDiv);
        }
        
        return div;
    }

    createMiniField(lineup, substitutions = [], momentIndex = 0) {
        const field = document.createElement('div');
        field.className = 'mini-field';

        // Group players by position type for 3-3-3-1-1 formation
        const goalkeeper = lineup.find(p => p.position === 'G');
        const forwards = lineup.filter(p => p.position.startsWith('F')).sort((a, b) => a.position.localeCompare(b.position)); // F1, F2, F3
        const midfield = lineup.filter(p => p.position.startsWith('M')).sort((a, b) => a.position.localeCompare(b.position)); // M1, M2, M3
        const defenders = lineup.filter(p => p.position.startsWith('D')).sort((a, b) => a.position.localeCompare(b.position)); // D1, D2, D3
        const sweeper = lineup.filter(p => p.position === 'S1'); // S1

        // Create layers in proper order (top to bottom: forwards, midfield, defenders, sweeper, goalkeeper)
        const layers = [
            { name: 'forwards', players: forwards },
            { name: 'midfield', players: midfield },
            { name: 'defenders', players: defenders },
            { name: 'sweeper', players: sweeper },
            { name: 'goalkeeper', players: goalkeeper ? [goalkeeper] : [] }
        ];

        layers.forEach(layer => {
            if (layer.players.length > 0) {
                const layerDiv = document.createElement('div');
                layerDiv.className = `field-layer ${layer.name}`;

                layer.players.forEach(playerPos => {
                    const nameCard = document.createElement('div');
                    let cardClass = 'player-namecard';

                    // Add substitution styling
                    const isOut = substitutions.some(sub =>
                        sub.type === 'out' && sub.player.id === playerPos.player.id
                    );
                    const isIn = substitutions.some(sub =>
                        sub.type === 'in' && sub.player.id === playerPos.player.id
                    );

                    if (isOut) cardClass += ' player-out';
                    if (isIn) cardClass += ' player-in';
                    if (playerPos.position === 'G') cardClass += ' goalkeeper';

                    nameCard.className = cardClass;
                    nameCard.textContent = playerPos.player.name;

                    // Add click handler for position swapping (skip goalkeeper)
                    if (playerPos.position !== 'G') {
                        nameCard.dataset.playerId = playerPos.player.id;
                        nameCard.dataset.position = playerPos.position;
                        nameCard.dataset.momentIndex = momentIndex;

                        nameCard.addEventListener('click', (e) => {
                            this.handlePlayerCardClick(e.currentTarget);
                        });
                    }

                    layerDiv.appendChild(nameCard);
                });

                field.appendChild(layerDiv);
            }
        });

        return field;
    }

    populatePlayingTimeDistribution() {
        const container = document.getElementById('playing-time-overview');
        if (!container || !this.rotationEngine) return;

        const distribution = this.rotationEngine.getPlayingTimeDistribution();
        
        let html = `
            <table>
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Skill</th>
                        <th>Position</th>
                        <th>Playing Time</th>
                        <th>Intervals</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        distribution.forEach(player => {
            html += `
                <tr>
                    <td><strong>${player.name}</strong></td>
                    <td>${'★'.repeat(player.skill)}${'☆'.repeat(5-player.skill)} (${player.skill}/5)</td>
                    <td>${player.isGoalkeeper ? 'Goalkeeper' : 'Outfield'}</td>
                    <td>${player.playingTime.toFixed(1)} min</td>
                    <td>${player.intervalsPlayed}/8</td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    }

    populateGanttChart() {
        const container = document.getElementById('player-gantt-chart');
        if (!container || !this.rotationEngine) return;

        const schedule = this.rotationEngine.getSchedule();
        const distribution = this.rotationEngine.getPlayingTimeDistribution();
        
        let html = `
            <div class="gantt-timeline">
                <div class="gantt-header">
                    <div class="gantt-player-name">Player</div>
                    <div class="gantt-intervals">
        `;
        
        schedule.forEach(moment => {
            html += `<div class="gantt-interval">Q${moment.quarter}-${moment.subInQuarter}<br>${moment.displayTime}</div>`;
        });
        
        html += `
                    </div>
                </div>
        `;
        
        distribution.forEach(player => {
            html += `
                <div class="gantt-row">
                    <div class="gantt-player-name">
                        <strong>${player.name}</strong><br>
                        <small>${player.isGoalkeeper ? 'GK' : 'Outfield'} • ${player.skill}/5</small>
                    </div>
                    <div class="gantt-bars">
            `;
            
            schedule.forEach(moment => {
                const isPlaying = moment.lineup.some(lineupPlayer => 
                    lineupPlayer.player.id === player.id
                );
                
                html += `
                    <div class="gantt-bar ${isPlaying ? 'playing' : 'resting'}">
                        ${isPlaying ? '●' : '○'}
                    </div>
                `;
            });
            
            html += '</div></div>';
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    populateSubstitutionSchedule(schedule) {
        const container = document.getElementById('substitution-schedule');
        if (!container) return;

        let html = '<div class="schedule-timeline">';
        
        schedule.forEach(moment => {
            if (moment.substitutions.length > 0) {
                html += `
                    <div class="substitution-event">
                        <div class="substitution-time">
                            <strong>Q${moment.quarter} - ${moment.displayTime}</strong>
                        </div>
                        <div class="substitution-changes">
                `;
                
                const outPlayers = moment.substitutions.filter(s => s.type === 'out');
                const inPlayers = moment.substitutions.filter(s => s.type === 'in');
                
                for (let i = 0; i < outPlayers.length; i++) {
                    const outPlayer = outPlayers[i];
                    const inPlayer = inPlayers[i];
                    
                    html += `
                        <div class="substitution-pair">
                            <span class="player-out">OUT: ${outPlayer.player.name} (${outPlayer.position})</span>
                            <span class="substitution-arrow">→</span>
                            <span class="player-in">IN: ${inPlayer.player.name} (${inPlayer.position})</span>
                        </div>
                    `;
                }
                
                html += '</div></div>';
            }
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    clearSchedule() {
        if (confirm('Are you sure you want to clear the current schedule?')) {
            // Clear all schedule displays
            const containers = [
                'substitution-moments',
                'playing-time-overview', 
                'player-gantt-chart',
                'substitution-schedule'
            ];
            
            containers.forEach(id => {
                const container = document.getElementById(id);
                if (container) {
                    container.innerHTML = '<p class="schedule-placeholder">Generate a game schedule to see content</p>';
                }
            });
            
            // Clear player states
            if (this.rotationEngine && playerManager) {
                const availablePlayers = playerManager.getAvailablePlayers();
                availablePlayers.forEach(player => {
                    player.playingTime = 0;
                    player.isOnField = false;
                    player.fieldPosition = null;
                    player.assignedPosition = null;
                    player.consecutiveIntervals = 0;
                });
            }
            
            // Hide buttons
            const clearBtn = document.getElementById('clear-schedule-btn');
            const printBtn = document.getElementById('print-schedule-btn');
            
            if (clearBtn) clearBtn.classList.add('hidden');
            if (printBtn) printBtn.classList.add('hidden');
            
            this.rotationEngine = null;
            console.log('Schedule cleared - all player states reset');
        }
    }

    printSchedule() {
        window.print();
    }
}

// Initialize immediately (scripts are loaded after DOM is ready)
window.app = new App();