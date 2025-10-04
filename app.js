class HockeyApp {
    constructor() {
        this.gameTimer = null;
        this.updateInterval = 1000;
        this.currentSection = 'players';
        
        this.initialize();
    }

    initialize() {
        document.addEventListener('DOMContentLoaded', () => {
            playerManager = new PlayerManager();
            rotationEngine = new RotationEngine();
            
            this.initializeEventListeners();
            this.initializeUI();
        });
    }

    initializeEventListeners() {
        const playersTab = document.getElementById('players-tab');
        const gameTab = document.getElementById('game-tab');
        const generateScheduleBtn = document.getElementById('generate-schedule-btn');
        const clearScheduleBtn = document.getElementById('clear-schedule-btn');
        const printScheduleBtn = document.getElementById('print-schedule-btn');

        if (playersTab) {
            playersTab.addEventListener('click', () => this.switchSection('players'));
        }

        if (gameTab) {
            gameTab.addEventListener('click', () => this.switchSection('game'));
        }

        if (generateScheduleBtn) {
            generateScheduleBtn.addEventListener('click', () => this.generateSchedule());
        }

        if (clearScheduleBtn) {
            clearScheduleBtn.addEventListener('click', () => this.clearSchedule());
        }

        if (printScheduleBtn) {
            printScheduleBtn.addEventListener('click', () => this.printSchedule());
        }
    }

    initializeUI() {
        this.switchSection('players');
        this.updateGameUI();
    }

    switchSection(section) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

        const sectionElement = document.getElementById(`${section}-section`);
        const tabElement = document.getElementById(`${section}-tab`);

        if (sectionElement) sectionElement.classList.add('active');
        if (tabElement) tabElement.classList.add('active');

        this.currentSection = section;

        if (section === 'game') {
            this.updateScheduleButton();
        }
    }

    generateSchedule() {
        try {
            const players = playerManager.getAllPlayers();
            
            if (!playerManager.canStartGame()) {
                alert('You need at least 1 goalkeeper and 10 outfield players to generate a schedule.');
                return;
            }
            
            const considerStrength = document.getElementById('consider-strength').checked;
            const considerFatigue = document.getElementById('consider-fatigue').checked;
            const schedule = rotationEngine.generateGameSchedule(players, considerStrength, considerFatigue);
            
            this.displaySubstitutionMoments(schedule.momentLineups);
            this.displayPlayingTimeOverview(schedule.playingTimeDistribution);
            this.displayPlayerGanttChart(schedule.momentLineups, players);
            this.displaySubstitutionSchedule(schedule.substitutionSchedule);
            
            document.getElementById('generate-schedule-btn').classList.add('hidden');
            document.getElementById('clear-schedule-btn').classList.remove('hidden');
            document.getElementById('print-schedule-btn').classList.remove('hidden');
            
            console.log('Game schedule generated:', schedule);
            
        } catch (error) {
            alert('Error generating schedule: ' + error.message);
        }
    }

    clearSchedule() {
        if (confirm('Are you sure you want to clear the game schedule?')) {
            rotationEngine.clearGameSchedule();
            
            this.clearSubstitutionMoments();
            this.clearPlayingTimeOverview();
            this.clearPlayerGanttChart();
            this.clearSubstitutionSchedule();
            
            document.getElementById('generate-schedule-btn').classList.remove('hidden');
            document.getElementById('clear-schedule-btn').classList.add('hidden');
            document.getElementById('print-schedule-btn').classList.add('hidden');
        }
    }

    updateScheduleButton() {
        const generateBtn = document.getElementById('generate-schedule-btn');
        if (generateBtn) {
            generateBtn.disabled = !playerManager.canStartGame();
        }
    }

    displaySubstitutionMoments(momentLineups) {
        const momentsContainer = document.getElementById('substitution-moments');
        if (!momentsContainer) return;
        
        momentsContainer.innerHTML = '';
        
        momentLineups.forEach((moment, index) => {
            const momentCard = document.createElement('div');
            momentCard.className = `moment-card ${moment.hasSubstitution ? 'has-substitution' : ''}`;
            
            let titleText = `${moment.timeText}`;
            if (moment.isQuarterStart && moment.time > 0) {
                titleText += ` (Q${Math.ceil(moment.time / 17.5)} Start)`;
            } else if (moment.time === 0) {
                titleText += ' (Kickoff)';
            }
            
            momentCard.innerHTML = `
                <h3>${titleText}</h3>
                <div class="mini-field" id="moment${index}-field">
                    <div class="field-formation">
                        <!-- New formation layout with name cards -->
                    </div>
                </div>
                <div class="moment-details">
                    ${this.generateMomentDetails(moment)}
                </div>
            `;
            
            momentsContainer.appendChild(momentCard);
            
            // Populate the field after adding to DOM
            const fieldElement = momentCard.querySelector('.mini-field');
            this.populateMomentField(fieldElement, moment.lineup, moment.playersOut, moment.playersIn);
        });
    }

    populateMomentField(fieldElement, lineup, playersOut, playersIn) {
        const formationContainer = fieldElement.querySelector('.field-formation');
        if (!formationContainer) {
            console.error('Formation container not found!', fieldElement);
            return;
        }
        
        console.log('Populating field with new namecard system');
        console.log('Lineup data:', lineup);
        formationContainer.innerHTML = ''; // Clear existing content
        
        // Create formation layout - 3-3-4 formation (F-M-D-GK)
        const formationLayers = [
            { positions: ['f1', 'f2', 'f3'], className: 'forward-line' },
            { positions: ['m1', 'm2', 'm3'], className: 'midfield-line' },
            { positions: ['d1', 'd2', 'd3', 'd4'], className: 'defense-line' },
            { positions: ['gk'], className: 'goalkeeper-line' }
        ];
        
        formationLayers.forEach(layer => {
            const layerDiv = document.createElement('div');
            layerDiv.className = `formation-line ${layer.className}`;
            
            layer.positions.forEach(pos => {
                const player = lineup[pos];
                console.log(`Position ${pos}:`, player);
                if (player) {
                    const nameCard = document.createElement('div');
                    nameCard.className = 'player-namecard';
                    
                    // Determine card type and styling
                    if (player.type === 'goalkeeper') {
                        nameCard.classList.add('goalkeeper-card');
                    } else if (playersOut.find(p => p.id === player.id)) {
                        nameCard.classList.add('player-out-card');
                    } else if (playersIn.find(p => p.id === player.id)) {
                        nameCard.classList.add('player-in-card');
                    } else {
                        nameCard.classList.add('player-normal-card');
                    }
                    
                    nameCard.textContent = player.name.split(' ')[0]; // First name only
                    nameCard.title = `${player.name} (${player.skill}/5) - ${player.assignedPosition}`;
                    
                    layerDiv.appendChild(nameCard);
                }
            });
            
            formationContainer.appendChild(layerDiv);
        });
    }

    generateMomentDetails(moment) {
        let detailsHTML = '';
        
        // Show substitutions if any
        if (moment.hasSubstitution) {
            detailsHTML += '<div class="moment-substitutions">';
            
            if (moment.playersOut.length > 0) {
                const outNames = moment.playersOut.map(p => `${p.name} (${p.assignedPosition})`).join(', ');
                detailsHTML += `<div class="sub-change"><span class="sub-out-text">OUT:</span> ${outNames}</div>`;
            }
            
            if (moment.playersIn.length > 0) {
                const inNames = moment.playersIn.map(p => p.name).join(', ');
                detailsHTML += `<div class="sub-change"><span class="sub-in-text">IN:</span> ${inNames}</div>`;
            }
            
            detailsHTML += '</div>';
        }
        
        // Show bench
        if (moment.bench.length > 0) {
            detailsHTML += '<div class="moment-bench">';
            detailsHTML += `<h4>Bench (${moment.bench.length})</h4>`;
            
            moment.bench.forEach(player => {
                detailsHTML += `<span class="bench-player-mini" title="${player.name} (${player.skill}/5)">${player.name.split(' ')[0]}</span>`;
            });
            
            detailsHTML += '</div>';
        }
        
        return detailsHTML;
    }

    displayPlayingTimeOverview(playingTimeDistribution) {
        const overviewElement = document.getElementById('playing-time-overview');
        if (!overviewElement) return;
        
        overviewElement.innerHTML = '';
        
        if (playingTimeDistribution.length === 0) {
            overviewElement.innerHTML = '<p class="schedule-placeholder">No playing time data available</p>';
            return;
        }
        
        // Calculate target time (ideal equal distribution)
        const totalGameTime = 70;
        const totalFieldTime = totalGameTime * 10; // 10 outfield positions
        const targetTime = totalFieldTime / playingTimeDistribution.length;
        
        let tableHTML = `
            <table class="time-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Skill</th>
                        <th>Q1</th>
                        <th>Q2</th>
                        <th>Q3</th>
                        <th>Q4</th>
                        <th>Total</th>
                        <th>Target</th>
                        <th>Diff</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        playingTimeDistribution.forEach(player => {
            const diff = player.totalTime - targetTime;
            const diffClass = Math.abs(diff) < 1 ? 'equal-time' : 
                            diff < 0 ? 'under-time' : '';
            
            tableHTML += `
                <tr>
                    <td class="player-name-cell">${player.name}</td>
                    <td class="time-cell">${player.skill}/5</td>
                    <td class="time-cell">${player.q1Time}</td>
                    <td class="time-cell">${player.q2Time}</td>
                    <td class="time-cell">${player.q3Time}</td>
                    <td class="time-cell">${player.q4Time}</td>
                    <td class="time-cell total-time">${player.totalTime}</td>
                    <td class="time-cell">${targetTime.toFixed(1)}</td>
                    <td class="time-cell ${diffClass}">${diff > 0 ? '+' : ''}${diff.toFixed(1)}</td>
                </tr>
            `;
        });
        
        tableHTML += '</tbody></table>';
        overviewElement.innerHTML = tableHTML;
    }
    
    displaySubstitutionSchedule(substitutionSchedule) {
        const scheduleElement = document.getElementById('substitution-schedule');
        if (!scheduleElement) return;
        
        scheduleElement.innerHTML = '';
        
        if (substitutionSchedule.length === 0) {
            scheduleElement.innerHTML = '<p class="schedule-placeholder">No substitutions needed - perfect squad size!</p>';
            return;
        }
        
        substitutionSchedule.forEach(sub => {
            const eventElement = document.createElement('div');
            eventElement.className = 'substitution-event';
            
            const outPlayersText = sub.out.length > 0 ? 
                sub.out.map(p => `${p.name} (${p.position})`).join(', ') : 'None';
            const inPlayersText = sub.in.length > 0 ? 
                sub.in.join(', ') : 'None';
            
            eventElement.innerHTML = `
                <div class="substitution-time">${rotationEngine.formatTime(sub.time)}</div>
                <div class="substitution-details">
                    <div class="substitution-swap">
                        <div class="player-out">
                            <strong>OUT:</strong> ${outPlayersText}
                        </div>
                        <div class="swap-arrow">→</div>
                        <div class="player-in">
                            <strong>IN:</strong> ${inPlayersText}
                        </div>
                    </div>
                    <div class="substitution-reason">${sub.reason}</div>
                </div>
            `;
            
            scheduleElement.appendChild(eventElement);
        });
    }

    clearSubstitutionMoments() {
        const momentsContainer = document.getElementById('substitution-moments');
        if (momentsContainer) {
            momentsContainer.innerHTML = '<p class="schedule-placeholder">Generate a game schedule to see substitution moments</p>';
        }
    }

    clearPlayingTimeOverview() {
        const overviewElement = document.getElementById('playing-time-overview');
        if (overviewElement) {
            overviewElement.innerHTML = '<p class="schedule-placeholder">Generate a game schedule to see playing time distribution</p>';
        }
    }
    
    displayPlayerGanttChart(momentLineups, players) {
        const ganttElement = document.getElementById('player-gantt-chart');
        if (!ganttElement) return;
        
        ganttElement.innerHTML = '';
        
        if (momentLineups.length === 0) {
            ganttElement.innerHTML = '<p class="schedule-placeholder">No timeline data available</p>';
            return;
        }

        // Create legend
        const legend = document.createElement('div');
        legend.className = 'gantt-legend';
        legend.innerHTML = `
            <div class="gantt-legend-item">
                <div class="gantt-legend-box field"></div>
                <span>On Field</span>
            </div>
            <div class="gantt-legend-item">
                <div class="gantt-legend-box bench"></div>
                <span>On Bench</span>
            </div>
            <div class="gantt-legend-item">
                <div class="gantt-legend-box goalkeeper"></div>
                <span>Goalkeeper</span>
            </div>
        `;
        ganttElement.appendChild(legend);

        // Create table
        const table = document.createElement('table');
        table.className = 'gantt-table';

        // Create header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Player name header
        const playerHeader = document.createElement('th');
        playerHeader.textContent = 'Player';
        playerHeader.className = 'player-name';
        headerRow.appendChild(playerHeader);

        // Time headers
        momentLineups.forEach(moment => {
            const timeHeader = document.createElement('th');
            timeHeader.textContent = moment.timeText;
            timeHeader.className = 'gantt-timeline-header';
            headerRow.appendChild(timeHeader);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create tbody
        const tbody = document.createElement('tbody');
        
        // Get all outfield players and goalkeeper
        const allPlayers = players.filter(p => p.type === 'outfield');
        const goalkeeper = players.find(p => p.type === 'goalkeeper');
        
        // Add goalkeeper row first
        if (goalkeeper) {
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            nameCell.textContent = `${goalkeeper.name} (GK)`;
            nameCell.className = 'player-name';
            row.appendChild(nameCell);

            momentLineups.forEach(moment => {
                const cell = document.createElement('td');
                cell.className = 'gantt-timeline-cell goalkeeper';
                cell.title = `${moment.timeText}: On Field (Goalkeeper)`;
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        }

        // Add outfield player rows
        allPlayers.forEach(player => {
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            nameCell.textContent = player.name;
            nameCell.className = 'player-name';
            row.appendChild(nameCell);

            momentLineups.forEach(moment => {
                const cell = document.createElement('td');
                cell.className = 'gantt-timeline-cell';
                
                // Check if player is on field at this moment
                const playerOnField = Object.values(moment.lineup).find(p => p && p.id === player.id);
                
                if (playerOnField) {
                    cell.classList.add('on-field');
                    cell.title = `${moment.timeText}: Playing as ${playerOnField.assignedPosition}`;
                } else {
                    cell.classList.add('on-bench');
                    cell.title = `${moment.timeText}: On Bench`;
                }
                
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        ganttElement.appendChild(table);
    }

    clearPlayerGanttChart() {
        const ganttElement = document.getElementById('player-gantt-chart');
        if (ganttElement) {
            ganttElement.innerHTML = '<p class="schedule-placeholder">Generate a game schedule to see player timeline</p>';
        }
    }

    clearSubstitutionSchedule() {
        const scheduleElement = document.getElementById('substitution-schedule');
        if (scheduleElement) {
            scheduleElement.innerHTML = '<p class="schedule-placeholder">Generate a game schedule to see substitution timeline</p>';
        }
    }

    updateGameUI() {
        // Legacy method - now just updates the schedule button
        this.updateScheduleButton();
    }

    clearGameUI() {
        // Clear any existing displays
        this.clearSubstitutionMoments();
        this.clearPlayingTimeOverview();
        this.clearPlayerGanttChart();
        this.clearSubstitutionSchedule();
    }

    initializeUI() {
        this.switchSection('players');
        this.updateScheduleButton();
    }


    exportGameData() {
        const data = {
            players: playerManager.getAllPlayers(),
            gameData: rotationEngine.exportGameData(),
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `hockey-game-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    importGameData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.players) {
                    playerManager.players = data.players;
                    playerManager.savePlayers();
                    playerManager.updateUI();
                }
                
                if (data.gameData) {
                    rotationEngine.importGameData(data.gameData);
                }
                
                alert('Game data imported successfully!');
                this.updateGameUI();
                
            } catch (error) {
                alert('Error importing game data: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    printSchedule() {
        // Add print-specific class to body
        document.body.classList.add('print-mode');
        
        // Print the page
        window.print();
        
        // Remove print class after printing
        setTimeout(() => {
            document.body.classList.remove('print-mode');
        }, 1000);
    }
}

const app = new HockeyApp();