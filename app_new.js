// Main application controller
class App {
    constructor() {
        this.currentSection = 'players';
        this.rotationEngine = null;
        
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

            // Initialize rotation engine with selected substitutions per quarter
            this.rotationEngine = new RotationEngine(playerManager, substitutionsPerQuarter);

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
        
        // Create field formation
        const field = this.createMiniField(moment.lineup, moment.substitutions);
        
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

    createMiniField(lineup, substitutions = []) {
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
                    nameCard.textContent = playerPos.player.name; // Remove position code
                    
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new App();
});