class PlayerManager {
    constructor() {
        this.players = [];
        this.nextId = 1;
        
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

    addPlayer(name, skill) {
        if (!name || !skill) {
            throw new Error('All fields are required');
        }

        if (skill < 1 || skill > 5) {
            throw new Error('Skill rating must be between 1 and 5');
        }

        if (this.players.length >= 20) {
            throw new Error('Maximum 20 players allowed');
        }

        const player = {
            id: this.nextId++,
            name: name.trim(),
            skill: parseInt(skill),
            isGoalkeeper: false,     // NEW: goalkeeper selection
            isAvailable: true,       // NEW: match availability  
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

        this.savePlayers();
        this.updateUI();
        
        return player;
    }

    setGoalkeeper(playerId) {
        // First, remove goalkeeper status from all players
        this.players.forEach(p => p.isGoalkeeper = false);
        
        // Then set the selected player as goalkeeper
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.isGoalkeeper = true;
        }
        
        this.savePlayers();
        this.updateUI();
    }

    setPlayerAvailability(playerId, isAvailable) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.isAvailable = isAvailable;
            this.savePlayers();
            this.updateUI();
        }
    }

    togglePlayerAvailability(playerId) {
        console.log('togglePlayerAvailability called for player ID:', playerId);
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            console.log(`Before toggle: ${player.name} availability = ${player.isAvailable}`);
            player.isAvailable = !player.isAvailable;
            console.log(`After toggle: ${player.name} availability = ${player.isAvailable}`);
            this.savePlayers();
            this.updateUI();
        } else {
            console.error('Player not found with ID:', playerId);
        }
    }

    updatePlayerSkill(playerId, newSkill) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.skill = parseInt(newSkill);
            this.savePlayers();
            this.updateUI();
        }
    }

    getPlayer(playerId) {
        return this.players.find(p => p.id === playerId);
    }

    getAllPlayers() {
        return [...this.players];
    }

    getAvailablePlayers() {
        return this.players.filter(p => p.isAvailable);
    }

    getGoalkeeper() {
        return this.players.find(p => p.isGoalkeeper);
    }

    getOutfieldPlayers() {
        return this.players.filter(p => !p.isGoalkeeper);
    }

    canStartGame() {
        const availablePlayers = this.getAvailablePlayers();
        const availableGoalkeeper = availablePlayers.find(p => p.isGoalkeeper);
        const availableOutfield = availablePlayers.filter(p => !p.isGoalkeeper);

        return availableGoalkeeper && availableOutfield.length >= 10;
    }

    initializeEventListeners() {
        console.log('🔧 Initializing event listeners...');
        const addPlayerBtn = document.getElementById('add-player-btn');
        const cancelAddBtn = document.getElementById('cancel-add');
        const playerForm = document.getElementById('player-form');
        const playerNameInput = document.getElementById('player-name');
        const skillSlider = document.getElementById('player-skill');
        const skillValue = document.getElementById('skill-value');

        console.log('Add Player Button found:', !!addPlayerBtn);

        if (addPlayerBtn) {
            console.log('📝 Setting up Add Player button click listener');
            addPlayerBtn.addEventListener('click', (e) => {
                console.log('🖱️ Add Player button clicked!');
                e.preventDefault();
                this.showAddPlayerForm();
            });

            // Allow Enter key to activate the Add Player button
            addPlayerBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.showAddPlayerForm();
                }
            });

            // Focus the Add Player button on page load for keyboard workflow
            setTimeout(() => addPlayerBtn.focus(), 100);
        } else {
            console.error('❌ Add Player button not found!');
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

        // Allow Enter key to submit from name input
        if (playerNameInput) {
            playerNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleAddPlayer();
                }
            });
        }

        if (skillSlider && skillValue) {
            skillSlider.addEventListener('input', (e) => {
                skillValue.textContent = e.target.value;
            });
        }
    }

    showAddPlayerForm() {
        console.log('🔍 showAddPlayerForm called');
        const form = document.getElementById('add-player-form');
        console.log('Form found:', !!form);
        if (form) {
            console.log('📋 Showing form...');
            form.classList.remove('hidden');
            form.style.display = 'block';
            console.log('Form display style:', form.style.display);
            console.log('Form classes:', form.className);
            const nameInput = document.getElementById('player-name');
            if (nameInput) {
                nameInput.focus();
                console.log('✅ Form shown and focused');
            }
        } else {
            console.error('❌ Form not found!');
        }
    }

    hideAddPlayerForm() {
        const form = document.getElementById('add-player-form');
        if (form) {
            form.classList.add('hidden');
            form.style.display = 'none';
            this.clearForm();
        }
    }

    clearForm() {
        const form = document.getElementById('player-form');
        if (form) {
            form.reset();
            document.getElementById('skill-value').textContent = '3';
        }
    }

    handleAddPlayer() {
        try {
            const name = document.getElementById('player-name').value;
            const skill = document.getElementById('player-skill').value;

            this.addPlayer(name, skill);
            this.hideAddPlayerForm();

            // Focus back on Add Player button for quick keyboard workflow
            const addPlayerBtn = document.getElementById('add-player-btn');
            if (addPlayerBtn) {
                setTimeout(() => addPlayerBtn.focus(), 50);
            }

        } catch (error) {
            alert(error.message);
        }
    }

    updateUI() {
        this.updatePlayerList();
        this.updateRosterInfo();
        this.updateGameStartButton();
        
        // Initialize Lucide icons after DOM update
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    updatePlayerList() {
        const listElement = document.getElementById('all-players-list');
        if (!listElement) return;

        listElement.innerHTML = '';
        
        this.players.forEach(player => {
            const playerCard = this.createPlayerCard(player);
            listElement.appendChild(playerCard);
        });
    }

    createPlayerCard(player) {
        const card = document.createElement('div');
        card.className = 'player-row';
        card.dataset.playerId = player.id;

        console.log(`Creating card for ${player.name}: isAvailable = ${player.isAvailable}`);
        
        card.innerHTML = `
            <div class="player-info-section">
                <div class="player-icons">
                    <button class="icon-btn delete-btn" onclick="playerManager.confirmRemovePlayer(${player.id})" title="Delete player">
                        <i data-lucide="trash-2"></i>
                    </button>
                    <button class="icon-btn edit-btn" onclick="playerManager.editPlayerName(${player.id})" title="Edit name">
                        <i data-lucide="edit-3"></i>
                    </button>
                </div>
                <div class="player-name">${player.name}</div>
            </div>
            <div class="player-controls">
                <label class="control-item goalkeeper-control">
                    <input type="radio" name="goalkeeper-selection" value="${player.id}" 
                           ${player.isGoalkeeper ? 'checked' : ''} 
                           onchange="playerManager.setGoalkeeper(${player.id})">
                    <span class="control-label">GK</span>
                </label>
                <div class="control-item available-control">
                    <button class="availability-badge ${player.isAvailable ? 'available' : 'unavailable'}"
                            onclick="playerManager.togglePlayerAvailability(${player.id})"
                            title="Click to toggle availability">
                        ${player.isAvailable ? 'Available' : 'Unavailable'}
                    </button>
                </div>
                <div class="control-item skill-control">
                    <span class="control-label">Skill</span>
                    <input type="range" min="1" max="5" value="${player.skill}" 
                           onchange="playerManager.updatePlayerSkill(${player.id}, this.value)">
                    <span class="skill-value">${player.skill}</span>
                </div>
            </div>
        `;

        return card;
    }

    updateRosterInfo() {
        const rosterCount = document.getElementById('roster-count');
        const goalkeeperStatus = document.getElementById('goalkeeper-status');
        const availableCount = document.getElementById('available-count');

        if (rosterCount) {
            rosterCount.textContent = `${this.players.length} players`;
        }

        if (goalkeeperStatus) {
            const goalkeeper = this.getGoalkeeper();
            goalkeeperStatus.textContent = goalkeeper ? 
                `Goalkeeper: ${goalkeeper.name}` : 
                'No goalkeeper selected';
        }

        if (availableCount) {
            const available = this.getAvailablePlayers().length;
            availableCount.textContent = `${available} available for match`;
        }
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

    editPlayerName(playerId) {
        const player = this.getPlayer(playerId);
        if (!player) return;

        const newName = prompt('Enter new name:', player.name);
        if (newName === null || newName.trim() === '') return;

        try {
            this.updatePlayer(playerId, {
                name: newName.trim()
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    playerManager = new PlayerManager();
});