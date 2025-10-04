class PlayerManager {
    constructor() {
        this.players = [];
        this.nextId = 1;
        this.positionLimits = {
            goalkeeper: 1,
            outfield: 10
        };
        this.positionNames = {
            goalkeeper: 'Goalkeeper',
            outfield: 'Outfield Player'
        };
        
        this.loadPlayers();
        this.initializeEventListeners();
    }

    async loadPlayers() {
        this.players = await storage.loadPlayers();
        console.log(`Loaded ${this.players.length} players from storage:`, this.players);
        if (this.players.length > 0) {
            this.nextId = Math.max(...this.players.map(p => p.id)) + 1;
        }
        this.updateUI();
    }

    async savePlayers() {
        const success = await storage.savePlayers(this.players);
        console.log(`Saved ${this.players.length} players to storage:`, success ? 'SUCCESS' : 'FAILED');
        return success;
    }

    addPlayer(name, type, skill) {
        if (!name || !type || !skill) {
            throw new Error('All fields are required');
        }

        if (skill < 1 || skill > 5) {
            throw new Error('Skill rating must be between 1 and 5');
        }

        const typeCount = this.getPositionCount(type);
        if (type === 'goalkeeper' && typeCount >= this.positionLimits[type]) {
            throw new Error('Only one goalkeeper is allowed. You already have a goalkeeper on your team.');
        }

        if (this.players.length >= 15) {
            throw new Error('Maximum 15 players allowed');
        }

        const player = {
            id: this.nextId++,
            name: name.trim(),
            type: type,
            skill: parseInt(skill),
            playingTime: 0,
            isOnField: false,
            fieldPosition: null,
            assignedPosition: null,
            createdAt: new Date().toISOString()
        };

        this.players.push(player);
        this.savePlayers();
        this.updateUI();
        
        return player;
    }

    removePlayer(playerId) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) {
            throw new Error('Player not found');
        }

        const player = this.players[playerIndex];
        if (player.isOnField) {
            throw new Error('Cannot remove player who is currently on the field');
        }

        this.players.splice(playerIndex, 1);
        this.savePlayers();
        this.updateUI();
        
        return true;
    }

    updatePlayer(playerId, updates) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error('Player not found');
        }

        if (updates.name !== undefined) {
            player.name = updates.name.trim();
        }
        
        if (updates.skill !== undefined) {
            if (updates.skill < 1 || updates.skill > 5) {
                throw new Error('Skill rating must be between 1 and 5');
            }
            player.skill = parseInt(updates.skill);
        }

        if (updates.type !== undefined && updates.type !== player.type) {
            if (updates.type === 'goalkeeper') {
                const goalkeeperCount = this.getPositionCount('goalkeeper');
                if (goalkeeperCount >= this.positionLimits.goalkeeper) {
                    throw new Error('Only one goalkeeper is allowed');
                }
            }
            player.type = updates.type;
        }

        this.savePlayers();
        this.updateUI();
        
        return player;
    }

    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId);
    }

    getAllPlayers() {
        return [...this.players];
    }

    getPlayersByType(type) {
        return this.players.filter(p => p.type === type);
    }

    getPositionCount(type) {
        return this.players.filter(p => p.type === type).length;
    }

    getAvailablePlayers() {
        return this.players.filter(p => !p.isOnField);
    }

    getPlayersOnField() {
        return this.players.filter(p => p.isOnField);
    }

    canStartGame() {
        const counts = {
            goalkeeper: this.getPositionCount('goalkeeper'),
            outfield: this.getPositionCount('outfield')
        };

        return counts.goalkeeper >= 1 && 
               counts.outfield >= 10 &&
               this.players.length >= 11;
    }

    getTeamStrength() {
        if (this.players.length === 0) return 0;
        const totalSkill = this.players.reduce((sum, player) => sum + player.skill, 0);
        return (totalSkill / this.players.length).toFixed(2);
    }

    getFieldStrength() {
        const playersOnField = this.getPlayersOnField();
        if (playersOnField.length === 0) return 0;
        const totalSkill = playersOnField.reduce((sum, player) => sum + player.skill, 0);
        return (totalSkill / playersOnField.length).toFixed(2);
    }

    resetPlayingTime() {
        this.players.forEach(player => {
            player.playingTime = 0;
        });
        this.savePlayers();
    }

    updatePlayingTime(minutes) {
        const playersOnField = this.getPlayersOnField();
        playersOnField.forEach(player => {
            player.playingTime += minutes;
        });
        this.savePlayers();
    }

    setPlayerOnField(playerId, onField, fieldPosition = null) {
        const player = this.getPlayer(playerId);
        if (!player) {
            throw new Error('Player not found');
        }

        player.isOnField = onField;
        player.fieldPosition = fieldPosition;
        this.savePlayers();
        
        return player;
    }

    initializeEventListeners() {
        const addPlayerBtn = document.getElementById('add-player-btn');
        const cancelAddBtn = document.getElementById('cancel-add');
        const playerForm = document.getElementById('player-form');
        const skillSlider = document.getElementById('player-skill');
        const skillValue = document.getElementById('skill-value');

        if (addPlayerBtn) {
            addPlayerBtn.addEventListener('click', () => {
                this.showAddPlayerForm();
            });
        }

        if (cancelAddBtn) {
            cancelAddBtn.addEventListener('click', () => {
                this.hideAddPlayerForm();
            });
        }

        if (playerForm) {
            playerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddPlayer();
            });
        }

        if (skillSlider && skillValue) {
            skillSlider.addEventListener('input', (e) => {
                skillValue.textContent = e.target.value;
            });
        }
    }

    showAddPlayerForm() {
        const form = document.getElementById('add-player-form');
        if (form) {
            form.classList.remove('hidden');
            this.updateGoalkeeperCheckbox();
            document.getElementById('player-name').focus();
        }
    }

    updateGoalkeeperCheckbox() {
        const goalkeeperCheckbox = document.getElementById('is-goalkeeper');
        const formHelp = document.querySelector('.form-help');
        
        if (goalkeeperCheckbox) {
            const hasGoalkeeper = this.getPositionCount('goalkeeper') >= 1;
            goalkeeperCheckbox.disabled = hasGoalkeeper;
            
            if (hasGoalkeeper) {
                goalkeeperCheckbox.checked = false;
                if (formHelp) {
                    formHelp.textContent = 'Goalkeeper position is already filled';
                    formHelp.style.color = '#dc3545';
                }
            } else {
                if (formHelp) {
                    formHelp.textContent = 'Check only if this player is a goalkeeper (max 1 allowed)';
                    formHelp.style.color = '#666';
                }
            }
        }
    }

    hideAddPlayerForm() {
        const form = document.getElementById('add-player-form');
        if (form) {
            form.classList.add('hidden');
            this.clearForm();
        }
    }

    clearForm() {
        const form = document.getElementById('player-form');
        if (form) {
            form.reset();
            document.getElementById('skill-value').textContent = '3';
            document.getElementById('is-goalkeeper').checked = false;
        }
    }

    handleAddPlayer() {
        try {
            const name = document.getElementById('player-name').value;
            const isGoalkeeper = document.getElementById('is-goalkeeper').checked;
            const type = isGoalkeeper ? 'goalkeeper' : 'outfield';
            const skill = document.getElementById('player-skill').value;

            this.addPlayer(name, type, skill);
            this.hideAddPlayerForm();
            
        } catch (error) {
            alert(error.message);
        }
    }

    updateUI() {
        this.updatePlayerLists();
        this.updatePositionCounts();
        this.updateGameStartButton();
    }

    updatePlayerLists() {
        const types = ['goalkeeper', 'outfield'];
        
        types.forEach(type => {
            const listElement = document.getElementById(`${type}-list`);
            if (listElement) {
                listElement.innerHTML = '';
                const players = this.getPlayersByType(type);
                
                players.forEach(player => {
                    const playerCard = this.createPlayerCard(player);
                    listElement.appendChild(playerCard);
                });
            }
        });
    }

    createPlayerCard(player) {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.dataset.playerId = player.id;

        const skillStars = '★'.repeat(player.skill) + '☆'.repeat(5 - player.skill);

        card.innerHTML = `
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-skill">Skill: ${skillStars} (${player.skill}/5)</div>
                ${player.assignedPosition ? `<div class="player-assigned">Playing: ${player.assignedPosition}</div>` : ''}
                ${player.playingTime > 0 ? `<div class="player-time">Time: ${player.playingTime.toFixed(1)}min</div>` : ''}
            </div>
            <div class="player-actions">
                <button class="btn btn-small btn-secondary" onclick="playerManager.editPlayer(${player.id})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="playerManager.confirmRemovePlayer(${player.id})">Remove</button>
            </div>
        `;

        return card;
    }

    editPlayer(playerId) {
        const player = this.getPlayer(playerId);
        if (!player) return;

        const newName = prompt('Enter new name:', player.name);
        if (newName === null) return;

        const newSkill = prompt('Enter new skill (1-5):', player.skill);
        if (newSkill === null) return;

        try {
            this.updatePlayer(playerId, {
                name: newName,
                skill: parseInt(newSkill)
            });
        } catch (error) {
            alert(error.message);
        }
    }

    confirmRemovePlayer(playerId) {
        const player = this.getPlayer(playerId);
        if (!player) return;

        if (confirm(`Are you sure you want to remove ${player.name}?`)) {
            try {
                this.removePlayer(playerId);
            } catch (error) {
                alert(error.message);
            }
        }
    }

    updatePositionCounts() {
        const gkCountElement = document.getElementById('gk-count');
        const outfieldCountElement = document.getElementById('outfield-count');

        if (gkCountElement) {
            const count = this.getPositionCount('goalkeeper');
            gkCountElement.textContent = `(${count}/1)`;
        }

        if (outfieldCountElement) {
            const count = this.getPositionCount('outfield');
            outfieldCountElement.textContent = `(${count}/10+)`;
        }
    }

    updateGameStartButton() {
        const generateButton = document.getElementById('generate-schedule-btn');
        if (generateButton) {
            generateButton.disabled = !this.canStartGame();
        }
    }

    clearAllPlayers() {
        if (confirm('Are you sure you want to delete all players? This cannot be undone.')) {
            this.players = [];
            this.nextId = 1;
            this.savePlayers();
            this.updateUI();
            console.log('All players cleared from storage');
        }
    }
}

let playerManager;