class Game {
    constructor() {
        this.config = {
            tickRate: 3000,
            maxDays: 100,
            gridSize: 80,
            gridCols: 12,
            gridRows: 9,
            costs: {
                house: 1500,
                factory: 3000,
                solar: 4000,
                park: 2500,
                recycle: 3500,
                campaign: 1000,
                upgradeFactor: 1.8
            },
            taxCooldown: 7,
            maxEventsPerWeek: 2,
            capacities: {
                house: { people: 100, energy: 2 },
                factory: { jobs: 50, energy: 10, pollution: 5 },
                solar: { energy: 30 },
                park: { happiness: 5, pollution: -3 },
                recycle: { pollution: -2, recycling: 10 }
            }
        };

        this.state = {
            day: 1,
            week: 1,
            money: 10000,
            population: 100,
            energy: 100,
            energyProduction: 0,
            energyConsumption: 0,
            happiness: 60,
            pollution: 10,
            recycling: 0,
            housingCapacity: 0,
            jobsAvailable: 0,
            jobsFilled: 0,
            unemployed: 0,
            migrants: 0,
            buildings: [],
            missions: [],
            activeEvents: [],
            selectedBuilding: null,
            running: false,
            paused: false,
            gameOver: false,
            score: 0,
            campaignCooldown: 0,
            eventsThisWeek: 0,
            lastEventDay: 0,
            eventConstructionCounters: {
                house: 0,
                factory: 0,
                solar: 0,
                park: 0,
                recycle: 0
            }
        };

        this.timer = null;
        this.eventTemplates = [
            {
                id: 'move_out',
                title: '🏠 Moradores Querendo Sair',
                description: 'Famílias estão pensando em se mudar devido à falta de infraestrutura. Construa 2 casas novas para mantê-las!',
                requirement: { type: 'house', count: 2, startCount: 0 },
                daysToComplete: 5,
                reward: { money: 500, happiness: 10 },
                penalty: { money: -1000, happiness: -15 },
                icon: '🏠',
                countsBuildingsDuringEvent: true
            },
            {
                id: 'no_park',
                title: '🌳 Reclamação sobre Parques',
                description: 'Moradores reclamam da falta de áreas verdes. Construa um parque novo para melhorar a qualidade de vida!',
                requirement: { type: 'park', count: 1, startCount: 0 },
                daysToComplete: 3,
                reward: { money: 300, happiness: 15 },
                penalty: { money: -500, happiness: -10 },
                icon: '🌳',
                countsBuildingsDuringEvent: true
            },
            {
                id: 'pollution_complaint',
                title: '🌫️ Queixa de Poluição',
                description: 'Moradores estão sofrendo com a poluição. Construa um centro de reciclagem ou parque novo!',
                requirement: { type: 'recycle_park', count: 1, startCount: 0 },
                daysToComplete: 4,
                reward: { money: 400, pollution: -10 },
                penalty: { money: -800, happiness: -20 },
                icon: '⚠️',
                countsBuildingsDuringEvent: true
            },
            {
                id: 'energy_crisis',
                title: '⚡ Crise de Energia',
                description: 'A cidade está com falta de energia. Construa uma usina solar nova!',
                requirement: { type: 'solar', count: 1, startCount: 0 },
                daysToComplete: 4,
                reward: { money: 600, energy: 20 },
                penalty: { money: -1200, energy: -30 },
                icon: '⚡',
                countsBuildingsDuringEvent: true
            },
            {
                id: 'population_boom',
                title: '👥 Boom Populacional',
                description: 'Mais pessoas estão vindo para a cidade! Construa 3 casas novas para acomodá-las.',
                requirement: { type: 'house', count: 3, startCount: 0 },
                daysToComplete: 6,
                reward: { money: 800, migrants: 150 },
                penalty: { money: -1500, happiness: -25 },
                icon: '👥',
                countsBuildingsDuringEvent: true
            },
            {
                id: 'job_crisis',
                title: '💼 Crise de Empregos',
                description: 'Muitos moradores estão desempregados. Construa uma indústria nova para criar empregos!',
                requirement: { type: 'factory', count: 1, startCount: 0 },
                daysToComplete: 5,
                reward: { money: 700, happiness: 15 },
                penalty: { money: -900, happiness: -20 },
                icon: '💼',
                countsBuildingsDuringEvent: true
            }
        ];
        
        this.initGrid();
        this.setupEventListeners();
    }

    initGrid() {
        const gameGrid = document.getElementById('game-grid');
        gameGrid.innerHTML = '';
        
        // Ajusta o tamanho do grid container
        gameGrid.style.width = `${this.config.gridCols * this.config.gridSize}px`;
        gameGrid.style.height = `${this.config.gridRows * this.config.gridSize}px`;
        
        for (let row = 0; row < this.config.gridRows; row++) {
            for (let col = 0; col < this.config.gridCols; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.style.left = `${col * this.config.gridSize}px`;
                cell.style.top = `${row * this.config.gridSize}px`;
                gameGrid.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        // Botão de início
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        
        // Botão de reinício
        document.getElementById('restart-btn').addEventListener('click', () => location.reload());
        
        // Botão de pausa
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseResume());
        
        // Controle dos painéis
        document.getElementById('toggle-left-panel').addEventListener('click', () => {
            document.getElementById('left-panel').classList.toggle('panel-visible');
        });
        
        document.getElementById('toggle-right-panel').addEventListener('click', () => {
            document.getElementById('right-panel').classList.toggle('panel-visible');
        });

        // Fecha painéis ao clicar fora (para mobile)
        document.addEventListener('click', (e) => {
            const leftPanel = document.getElementById('left-panel');
            const rightPanel = document.getElementById('right-panel');
            const toggleLeft = document.getElementById('toggle-left-panel');
            const toggleRight = document.getElementById('toggle-right-panel');
            
            if (leftPanel && !leftPanel.contains(e.target) && toggleLeft && !toggleLeft.contains(e.target)) {
                leftPanel.classList.remove('panel-visible');
            }
            
            if (rightPanel && !rightPanel.contains(e.target) && toggleRight && !toggleRight.contains(e.target)) {
                rightPanel.classList.remove('panel-visible');
            }
        });

        // Botões de ação
        document.getElementById('btn-house').addEventListener('click', () => this.build('house'));
        document.getElementById('btn-factory').addEventListener('click', () => this.build('factory'));
        document.getElementById('btn-solar').addEventListener('click', () => this.build('solar'));
        document.getElementById('btn-park').addEventListener('click', () => this.build('park'));
        document.getElementById('btn-recycle').addEventListener('click', () => this.build('recycle'));
        document.getElementById('btn-upgrade').addEventListener('click', () => this.upgradeSelected());
        document.getElementById('btn-campaign').addEventListener('click', () => this.launchCampaign());

        // Scroll na área do jogo
        const gameArea = document.getElementById('game-area');
        let isDragging = false;
        let startX, startY, scrollLeft, scrollTop;

        gameArea.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.pageX - gameArea.offsetLeft;
            startY = e.pageY - gameArea.offsetTop;
            scrollLeft = gameArea.scrollLeft;
            scrollTop = gameArea.scrollTop;
            gameArea.style.cursor = 'grabbing';
        });

        gameArea.addEventListener('mouseleave', () => {
            isDragging = false;
            gameArea.style.cursor = 'grab';
        });

        gameArea.addEventListener('mouseup', () => {
            isDragging = false;
            gameArea.style.cursor = 'grab';
        });

        gameArea.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - gameArea.offsetLeft;
            const y = e.pageY - gameArea.offsetTop;
            const walkX = (x - startX) * 2;
            const walkY = (y - startY) * 2;
            gameArea.scrollLeft = scrollLeft - walkX;
            gameArea.scrollTop = scrollTop - walkY;
        });

        // Suporte a touch para mobile
        gameArea.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.pageX;
            startY = touch.pageY;
            scrollLeft = gameArea.scrollLeft;
            scrollTop = gameArea.scrollTop;
        }, { passive: true });

        gameArea.addEventListener('touchmove', (e) => {
            if (!this.state.running || this.state.paused) return;
            e.preventDefault();
            const touch = e.touches[0];
            const x = touch.pageX;
            const y = touch.pageY;
            const walkX = (x - startX) * 2;
            const walkY = (y - startY) * 2;
            gameArea.scrollLeft = scrollLeft - walkX;
            gameArea.scrollTop = scrollTop - walkY;
        }, { passive: false });
    }

    start() {
        if (this.state.running) return;
        
        document.getElementById('start-screen').classList.add('hidden');
        this.init();
        this.state.running = true;
        this.timer = setInterval(() => this.tick(), this.config.tickRate);
        this.notify("Bem-vindo, prefeito! Gerencie sua cidade com sabedoria.");
        
        this.addBuilding('house', 2, 3);
        this.addBuilding('solar', 5, 2);
        
        this.setupMissions();
        this.updateUI();
    }

    pauseResume() {
        this.state.paused = !this.state.paused;
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.state.paused) {
            clearInterval(this.timer);
            pauseBtn.innerHTML = '▶️ Continuar';
            this.notify("Jogo pausado");
        } else {
            this.timer = setInterval(() => this.tick(), this.config.tickRate);
            pauseBtn.innerHTML = '⏸️ Pausar';
            this.notify("Jogo continuado");
        }
    }

    init() {
        this.state.buildings = [];
        this.state.activeEvents = [];
        this.updateEnvironment();
    }

    tick() {
        if (this.state.gameOver || !this.state.running || this.state.paused) return;

        this.state.day++;
        this.state.week = Math.ceil(this.state.day / 7);
        
        this.updateCooldowns();
        this.updateActiveEvents();
        
        const dayPercent = (this.state.day / this.config.maxDays) * 100;
        document.getElementById('day-fill').style.width = `${dayPercent}%`;
        document.getElementById('current-day').textContent = this.state.day;
        document.getElementById('current-day-info').textContent = `${this.state.day}/100`;

        this.calculateCapacities();
        this.autoCollectTax();
        this.generateMigrants();
        this.processMigrants();
        this.calculateBuildingEffects();
        this.updatePopulation();
        this.updateEnvironment();
        this.checkMissions();
        this.tryGenerateEvent();
        this.checkEndGame();
        this.updateUI();
    }

    calculateCapacities() {
        this.state.housingCapacity = 0;
        this.state.jobsAvailable = 0;
        this.state.energyProduction = 0;
        this.state.energyConsumption = 0;
        
        this.state.buildings.forEach(building => {
            const levelMultiplier = 1 + (building.level - 1) * 0.5;
            
            switch (building.type) {
                case 'house':
                    this.state.housingCapacity += Math.floor(this.config.capacities.house.people * levelMultiplier);
                    this.state.energyConsumption += this.config.capacities.house.energy * levelMultiplier;
                    break;
                case 'factory':
                    this.state.jobsAvailable += Math.floor(this.config.capacities.factory.jobs * levelMultiplier);
                    this.state.energyConsumption += this.config.capacities.factory.energy * levelMultiplier;
                    break;
                case 'solar':
                    this.state.energyProduction += Math.floor(this.config.capacities.solar.energy * levelMultiplier);
                    break;
                case 'park':
                    this.state.energyConsumption += 0.5 * levelMultiplier;
                    break;
                case 'recycle':
                    this.state.energyConsumption += 3 * levelMultiplier;
                    break;
            }
        });
        
        if (this.state.population > this.state.housingCapacity) {
            this.state.population = this.state.housingCapacity;
        }
        
        this.state.jobsFilled = Math.min(this.state.population * 0.5, this.state.jobsAvailable);
        this.state.unemployed = Math.max(0, (this.state.population * 0.5) - this.state.jobsFilled);
        
        const energyNet = this.state.energyProduction - this.state.energyConsumption;
        const energyPercentage = Math.max(0, Math.min(100, (energyNet / Math.max(1, this.state.energyConsumption)) * 100));
        this.state.energy = energyPercentage;
    }

        autoCollectTax() {
        // Coleta automática de impostos a cada 7 dias
        if (this.state.day % 7 === 0 && this.state.day > 0) {
            const taxRate = 0.12;
            const taxAmount = Math.floor(this.state.population * taxRate);
            
            if (taxAmount > 0) {
                this.updateResource('money', taxAmount);
                this.notify(`💰 Impostos coletados automaticamente: $${taxAmount}`);
                this.spawnFloater(`+$${taxAmount}`, 100, 50, '#FFD700');
            }
        }
    }

    generateMigrants() {
        let migrantChance = 0;
        
        if (this.state.happiness > 70) {
            migrantChance = 0.3;
        } else if (this.state.happiness > 50) {
            migrantChance = 0.15;
        } else if (this.state.happiness > 30) {
            migrantChance = 0.05;
        }
        
        const jobFactor = this.state.jobsAvailable > this.state.jobsFilled ? 0.2 : 0;
        const finalChance = migrantChance + jobFactor;
        
        if (Math.random() < finalChance) {
            let migrantCount = 0;
            if (this.state.happiness > 80) migrantCount = Math.floor(Math.random() * 30) + 20;
            else if (this.state.happiness > 60) migrantCount = Math.floor(Math.random() * 20) + 10;
            else migrantCount = Math.floor(Math.random() * 10) + 5;
            
            this.state.migrants += migrantCount;
            
            if (migrantCount > 15) {
                this.notify(`👥 ${migrantCount} novos imigrantes chegaram à cidade! Construa casas para abrigá-los.`);
            }
        }
    }

    processMigrants() {
        if (this.state.migrants > 0 && this.state.population < this.state.housingCapacity) {
            const availableHousing = this.state.housingCapacity - this.state.population;
            const migrantsToProcess = Math.min(this.state.migrants, availableHousing);
            
            if (migrantsToProcess > 0) {
                this.state.population += migrantsToProcess;
                this.state.migrants -= migrantsToProcess;
                
                if (migrantsToProcess > 10) {
                    this.notify(`🏠 ${migrantsToProcess} imigrantes foram acomodados em novas casas!`);
                }
            }
        }
        
        const indicator = document.getElementById('migrants-indicator');
        if (this.state.migrants > 0) {
            indicator.style.display = 'block';
            document.getElementById('migrants-count').textContent = this.state.migrants;
        } else {
            indicator.style.display = 'none';
        }
    }

    calculateBuildingEffects() {
        let pollutionDelta = 0;
        let happinessDelta = 0;
        let recyclingDelta = 0;

        this.state.buildings.forEach(building => {
            const levelMultiplier = 1 + (building.level - 1) * 0.5;
            
            switch (building.type) {
                case 'factory':
                    pollutionDelta += this.config.capacities.factory.pollution * levelMultiplier;
                    happinessDelta -= 0.5 * levelMultiplier;
                    break;
                case 'park':
                    pollutionDelta += this.config.capacities.park.pollution * levelMultiplier;
                    happinessDelta += this.config.capacities.park.happiness * levelMultiplier;
                    break;
                case 'recycle':
                    pollutionDelta += this.config.capacities.recycle.pollution * levelMultiplier;
                    recyclingDelta += this.config.capacities.recycle.recycling * levelMultiplier;
                    break;
            }
        });
        
        // Penalidade por imigrantes sem casas
        const migrantPenalty = this.state.migrants * 0.02;
        happinessDelta -= migrantPenalty;
        
        const populationPollution = this.state.population / 2000;
        pollutionDelta += populationPollution;
        
        if (this.state.unemployed > 10) {
            happinessDelta -= this.state.unemployed * 0.02;
        }
        
        pollutionDelta *= (1 - (this.state.recycling / 200));
        
        this.updateResource('pollution', pollutionDelta, 0, 100);
        this.updateResource('happiness', happinessDelta, 0, 100);
        this.updateResource('recycling', recyclingDelta * 0.1, 0, 100);
        
        const factoryIncome = this.state.jobsFilled * 0.5;
        this.updateResource('money', factoryIncome);
    }

    updatePopulation() {
        let naturalGrowth = 0;
        
        if (this.state.happiness > 70) {
            naturalGrowth = 0.1;
        } else if (this.state.happiness > 50) {
            naturalGrowth = 0.05;
        } else if (this.state.happiness > 30) {
            naturalGrowth = 0.01;
        } else if (this.state.happiness <= 10) {
            naturalGrowth = -0.05;
        }
        
        if (this.state.pollution > 60) {
            naturalGrowth -= 0.03;
        } else if (this.state.pollution > 40) {
            naturalGrowth -= 0.01;
        }
        
        if (this.state.energy < 30) {
            naturalGrowth -= 0.02;
        }
        
        const newPopulation = Math.floor(this.state.population * (1 + naturalGrowth / 100));
        this.state.population = Math.min(newPopulation, this.state.housingCapacity);
        
        if (this.state.population < 10) {
            this.state.population = 10;
        }
    }

    updateResource(resource, delta, min = 0, max = null) {
        const oldValue = this.state[resource];
        this.state[resource] += delta;

        if (max !== null && this.state[resource] > max) {
            this.state[resource] = max;
        }
        
        if (this.state[resource] < min) {
            this.state[resource] = min;
        }
        
        if (resource === 'money' && this.state.money < 0) {
            this.state.money = 0;
        }
    }

    updateEnvironment() {
        const area = document.getElementById('game-area');
        const status = document.getElementById('eco-status');
        
        if (this.state.pollution < 20) {
            area.style.background = 'var(--bg-clean)';
            area.style.filter = 'brightness(1.1)';
            status.innerHTML = '🌿 Sustentável';
            status.style.color = '#98FB98';
        } else if (this.state.pollution < 50) {
            area.style.background = 'var(--bg-eco)';
            area.style.filter = 'brightness(1)';
            status.innerHTML = '⚠️ Moderado';
            status.style.color = '#FFD700';
        } else {
            area.style.background = 'var(--bg-polluted)';
            area.style.filter = 'brightness(0.8)';
            status.innerHTML = '☠️ Poluído';
            status.style.color = '#FF6B6B';
        }
        
        const dayStatus = document.getElementById('day-status');
        const dayOfWeek = (this.state.day % 7) || 7;
        
        const statuses = [
            'Dia de trabalho', 'Dia de trabalho', 'Dia de trabalho', 
            'Quase fim de semana', 'Sexta-feira!', 'Final de semana', 
            'Descanso dominical'
        ];
        
        dayStatus.textContent = statuses[dayOfWeek - 1];
    }

    build(type) {
        if (!this.state.running || this.state.paused) return;

        const cost = this.config.costs[type];
        if (this.state.money < cost) {
            this.notify(`Dinheiro insuficiente! Necessário: $${cost}`, true);
            this.shakeElement('ui-money');
            return;
        }

        let placed = false;
        let attempts = 0;
        const maxAttempts = 50;

        while (!placed && attempts < maxAttempts) {
            const col = Math.floor(Math.random() * this.config.gridCols);
            const row = Math.floor(Math.random() * this.config.gridRows);
            
            const isOccupied = this.state.buildings.some(b => 
                b.col === col && b.row === row
            );
            
            if (!isOccupied) {
                if (this.addBuilding(type, col, row)) {
                    this.updateResource('money', -cost);
                    
                    this.state.eventConstructionCounters[type]++;
                    
                    this.notify(`${this.getBuildingName(type)} construído!`);
                    
                    if (type === 'house' && this.state.migrants > 0) {
                        this.processMigrants();
                    }
                    
                    placed = true;
                }
            }
            attempts++;
        }

        if (!placed) {
            this.notify("Não há espaço disponível para construção!", true);
        }
    }

    addBuilding(type, col, row) {
        const building = {
            id: Date.now() + Math.random(),
            type: type,
            col: col,
            row: row,
            level: 1,
            name: this.getBuildingName(type),
            icon: this.getBuildingIcon(type),
            color: this.getBuildingColor(type)
        };

        this.state.buildings.push(building);
        this.renderBuilding(building);
        return true;
    }

    getBuildingName(type) {
        const names = {
            house: 'Residencial',
            factory: 'Indústria',
            solar: 'Energia Solar',
            park: 'Parque',
            recycle: 'Centro de Reciclagem'
        };
        return names[type] || 'Edifício';
    }

    getBuildingIcon(type) {
        const icons = {
            house: '🏠',
            factory: '🏭',
            solar: '☀️',
            park: '🌳',
            recycle: '♻️'
        };
        return icons[type] || '🏢';
    }

    getBuildingColor(type) {
        const colors = {
            house: '#3498db',
            factory: '#e74c3c',
            solar: '#f1c40f',
            park: '#2ecc71',
            recycle: '#9b59b6'
        };
        return colors[type] || '#95a5a6';
    }

    renderBuilding(building) {
        const gameGrid = document.getElementById('game-grid');
        const element = document.createElement('div');
        
        element.className = 'building';
        element.id = `building-${building.id}`;
        element.style.left = `${building.col * this.config.gridSize + 5}px`;
        element.style.top = `${building.row * this.config.gridSize + 5}px`;
        element.style.color = building.color;
        
        element.innerHTML = `
            <div class="b-icon">${building.icon}</div>
            <div class="b-level">${building.level}</div>
            <div class="b-name">${building.name}</div>
        `;
        
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectBuilding(building);
        });
        
        gameGrid.appendChild(element);
        
        element.style.transform = 'scale(0)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 10);
    }

    selectBuilding(building) {
        document.querySelectorAll('.building.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        const element = document.getElementById(`building-${building.id}`);
        if (element) {
            element.classList.add('selected');
            this.state.selectedBuilding = building;
            this.notify(`${building.name} selecionado. Nível ${building.level}`);
        }
    }

    upgradeSelected() {
        if (!this.state.selectedBuilding) {
            this.notify("Selecione um edifício para melhorar!", true);
            return;
        }

        const building = this.state.selectedBuilding;
        const upgradeCost = Math.floor(this.config.costs[building.type] * 
            Math.pow(this.config.upgradeFactor, building.level - 1));

        if (this.state.money < upgradeCost) {
            this.notify(`Dinheiro insuficiente! Necessário: $${upgradeCost}`, true);
            return;
        }

        if (confirm(`Melhorar ${building.name} para nível ${building.level + 1} por $${upgradeCost}?`)) {
            this.updateResource('money', -upgradeCost);
            building.level++;
            
            const levelElement = document.querySelector(`#building-${building.id} .b-level`);
            if (levelElement) {
                levelElement.textContent = building.level;
            }
            
            this.notify(`${building.name} melhorado para nível ${building.level}!`);
            this.spawnFloater('⬆️ Nível ' + building.level, 
                building.col * this.config.gridSize + 40, 
                building.row * this.config.gridSize + 40,
                '#FFD700');
        }
    }

    launchCampaign() {
        if (this.state.campaignCooldown > 0) {
            this.notify(`Campanha só pode ser realizada a cada 5 dias. Aguarde ${this.state.campaignCooldown} dias.`, true);
            return;
        }

        const cost = this.config.costs.campaign;
        
        if (this.state.money < cost) {
            this.notify(`Dinheiro insuficiente! Necessário: $${cost}`, true);
            return;
        }

        this.updateResource('money', -cost);
        this.updateResource('happiness', 10);
        this.updateResource('pollution', -3);
        this.updateResource('recycling', 3);
        
        this.state.campaignCooldown = 5;
        document.getElementById('campaign-cooldown').style.display = 'block';
        document.getElementById('campaign-cooldown').textContent = '5 dias';
        
        this.notify("📢 Campanha de conscientização realizada!");
        this.spawnParticles(15, '#98FB98');
    }

    setupMissions() {
        this.state.missions = [
            { id: 1, text: "Reduza a poluição abaixo de 20%", check: () => this.state.pollution < 20, reward: 3000, done: false },
            { id: 2, text: "Alcance 75% de felicidade", check: () => this.state.happiness >= 75, reward: 2500, done: false },
            { id: 3, text: "Tenha 3 parques na cidade", check: () => this.state.buildings.filter(b => b.type === 'park').length >= 3, reward: 4000, done: false },
            { id: 4, text: "Alcance 40% de reciclagem", check: () => this.state.recycling >= 40, reward: 3500, done: false },
            { id: 5, text: "Tenha população acima de 500", check: () => this.state.population >= 500, reward: 5000, done: false },
            { id: 6, text: "Construa uma indústria para criar empregos", check: () => this.state.buildings.filter(b => b.type === 'factory').length >= 1, reward: 4000, done: false },
            { id: 7, text: "Tenha 50% da população empregada", check: () => (this.state.jobsFilled / this.state.population) >= 0.5, reward: 6000, done: false }
        ];
        
        this.renderMissions();
    }

    checkMissions() {
        this.state.missions.forEach(mission => {
            if (!mission.done && mission.check()) {
                mission.done = true;
                this.updateResource('money', mission.reward);
                this.notify(`🎯 Missão concluída: ${mission.text}! +$${mission.reward}`);
                this.spawnFloater(`+$${mission.reward}`, 300, 50, '#FFD700');
                this.renderMissions();
            }
        });
    }

    renderMissions() {
        const container = document.getElementById('missions-list');
        container.innerHTML = '';
        
        this.state.missions.forEach(mission => {
            const missionElement = document.createElement('div');
            missionElement.className = `mission ${mission.done ? 'completed' : ''}`;
            
            let progress = '';
            if (!mission.done) {
                if (mission.id === 3) {
                    const parkCount = this.state.buildings.filter(b => b.type === 'park').length;
                    progress = ` (${parkCount}/3)`;
                } else if (mission.id === 5) {
                    progress = ` (${Math.floor(this.state.population)}/500)`;
                } else if (mission.id === 6) {
                    const factoryCount = this.state.buildings.filter(b => b.type === 'factory').length;
                    progress = ` (${factoryCount}/1)`;
                } else if (mission.id === 7) {
                    const employmentRate = this.state.population > 0 ? (this.state.jobsFilled / this.state.population) * 100 : 0;
                    progress = ` (${employmentRate.toFixed(1)}%/50%)`;
                }
            }
            
            missionElement.innerHTML = `
                ${mission.text}${progress}
                <span class="mission-reward">$${mission.reward}</span>
            `;
            container.appendChild(missionElement);
        });
    }

    updateCooldowns() {
        // Removida a lógica de taxCooldown
        
        if (this.state.campaignCooldown > 0) {
            this.state.campaignCooldown--;
            if (this.state.campaignCooldown === 0) {
                document.getElementById('campaign-cooldown').style.display = 'none';
            } else {
                document.getElementById('campaign-cooldown').textContent = `${this.state.campaignCooldown} dias`;
            }
        }
        
        // Calcular dias até a próxima coleta de impostos (a cada 7 dias)
        const daysUntilNextTax = 7 - (this.state.day % 7);
        document.getElementById('next-tax').textContent = 
            daysUntilNextTax === 7 ? "Hoje!" : `${daysUntilNextTax} dias`;
    }

    updateActiveEvents() {
        for (let i = this.state.activeEvents.length - 1; i >= 0; i--) {
            const event = this.state.activeEvents[i];
            event.daysLeft--;
            
            if (event.daysLeft <= 0) {
                this.eventFailed(event);
                this.state.activeEvents.splice(i, 1);
            }
        }
        
        this.renderActiveEvents();
    }

    tryGenerateEvent() {
        if (this.state.eventsThisWeek >= this.config.maxEventsPerWeek) return;
        
        if (this.state.day > 3 && Math.random() < 0.15) {
            if (this.state.day - this.state.lastEventDay > 2) {
                this.generateRandomEvent();
                this.state.eventsThisWeek++;
                this.state.lastEventDay = this.state.day;
            }
        }
        
        if (this.state.day % 7 === 1) {
            this.state.eventsThisWeek = 0;
        }
    }

    generateRandomEvent() {
        const template = this.eventTemplates[Math.floor(Math.random() * this.eventTemplates.length)];
        
        let startCount = 0;
        if (template.requirement.type === 'recycle_park') {
            const recycleCount = this.state.buildings.filter(b => b.type === 'recycle').length;
            const parkCount = this.state.buildings.filter(b => b.type === 'park').length;
            startCount = recycleCount + parkCount;
        } else {
            startCount = this.state.buildings.filter(b => b.type === template.requirement.type).length;
        }
        
        const event = {
            id: Date.now() + Math.random(),
            title: template.title,
            description: template.description,
            requirement: { 
                type: template.requirement.type, 
                count: template.requirement.count, 
                startCount: startCount 
            },
            daysToComplete: template.daysToComplete,
            daysLeft: template.daysToComplete,
            reward: { ...template.reward },
            penalty: { ...template.penalty },
            icon: template.icon,
            completed: false,
            countsBuildingsDuringEvent: template.countsBuildingsDuringEvent
        };
        
        if (event.reward.migrants) {
            event.reward.migrants = event.reward.migrants;
        }
        
        this.state.activeEvents.push(event);
        this.renderActiveEvents();
        
        this.notify(`<strong>${event.title}</strong><br>${event.description}<br>Tempo: ${event.daysLeft} dias`, false, 6000);
    }

    renderActiveEvents() {
        const container = document.getElementById('active-events');
        
        if (this.state.activeEvents.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 15px; color: #98FB98; font-size: 0.85em;">
                    Nenhum evento ativo no momento
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        this.state.activeEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event-card';
            
            let requirementMet = false;
            let requirementText = '';
            let currentCount = 0;
            
            if (event.requirement.type === 'recycle_park') {
                const recycleCount = this.state.buildings.filter(b => b.type === 'recycle').length;
                const parkCount = this.state.buildings.filter(b => b.type === 'park').length;
                currentCount = recycleCount + parkCount;
                
                if (event.countsBuildingsDuringEvent) {
                    currentCount = currentCount - event.requirement.startCount;
                }
                
                requirementMet = currentCount >= event.requirement.count;
                requirementText = `Construído: ${Math.max(0, currentCount)}/${event.requirement.count}`;
            } else {
                currentCount = this.state.buildings.filter(b => b.type === event.requirement.type).length;
                
                if (event.countsBuildingsDuringEvent) {
                    currentCount = currentCount - event.requirement.startCount;
                }
                
                requirementMet = currentCount >= event.requirement.count;
                requirementText = `Construído: ${Math.max(0, currentCount)}/${event.requirement.count}`;
            }
            
            const statusColor = requirementMet ? '#3CB371' : '#FF8C00';
            const statusText = requirementMet ? '✔️ Pronto para concluir' : '⏳ Aguardando';
            
            eventElement.innerHTML = `
                <div class="event-header">
                    <div class="event-title">${event.icon} ${event.title}</div>
                    <div class="event-timer">${event.daysLeft} dias</div>
                </div>
                <div class="event-description">${event.description}</div>
                <div style="font-size: 0.75em; margin: 5px 0; color: ${statusColor}">
                    ${statusText}<br>
                    <small>${requirementText}</small>
                </div>
                <div class="event-actions">
                    <button class="event-btn complete-event" data-event-id="${event.id}" ${!requirementMet ? 'disabled style="opacity: 0.5"' : ''}>
                        Concluir (+$${event.reward.money || 0})
                    </button>
                    <button class="event-btn primary ignore-event" data-event-id="${event.id}">
                        Ignorar (-$${Math.abs(event.penalty.money) || 0})
                    </button>
                </div>
            `;
            
            container.appendChild(eventElement);
        });
        
        // Adicionar event listeners aos botões dos eventos
        document.querySelectorAll('.complete-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.getAttribute('data-event-id');
                this.completeEvent(eventId);
            });
        });
        
        document.querySelectorAll('.ignore-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.getAttribute('data-event-id');
                this.ignoreEvent(eventId);
            });
        });
    }

    completeEvent(eventId) {
        const eventIndex = this.state.activeEvents.findIndex(e => e.id == eventId);
        if (eventIndex === -1) return;
        
        const event = this.state.activeEvents[eventIndex];
        
        Object.keys(event.reward).forEach(key => {
            if (key === 'migrants') {
                this.state.migrants += event.reward[key];
                this.notify(`${event.reward[key]} imigrantes chegaram à cidade!`);
            } else if (event.reward[key] !== 0) {
                this.updateResource(key, event.reward[key]);
            }
        });
        
        this.state.activeEvents.splice(eventIndex, 1);
        this.renderActiveEvents();
        
        this.notify(`✅ Evento concluído: ${event.title}! Recompensa recebida.`);
    }

    ignoreEvent(eventId) {
        const eventIndex = this.state.activeEvents.findIndex(e => e.id == eventId);
        if (eventIndex === -1) return;
        
        const event = this.state.activeEvents[eventIndex];
        
        Object.keys(event.penalty).forEach(key => {
            if (event.penalty[key] !== 0) {
                this.updateResource(key, event.penalty[key]);
            }
        });
        
        this.state.activeEvents.splice(eventIndex, 1);
        this.renderActiveEvents();
        
        this.notify(`❌ Evento ignorado: ${event.title}. Penalidade aplicada.`, true);
    }

    eventFailed(event) {
        Object.keys(event.penalty).forEach(key => {
            if (event.penalty[key] !== 0) {
                this.updateResource(key, event.penalty[key] * 1.5);
            }
        });
        
        this.notify(`⏰ Evento falhou: ${event.title}. Penalidade aumentada aplicada.`, true);
    }

    checkEndGame() {
        let gameOver = false;
        let title = "";
        let message = "";
        let icon = "💀";

        if (this.state.day >= this.config.maxDays) {
            gameOver = true;
            title = "Mandato Concluído!";
            icon = "🏆";
            
            const pollutionScore = Math.max(0, 100 - this.state.pollution);
            const happinessScore = this.state.happiness;
            const populationScore = Math.min(100, (this.state.population / 10));
            const recycleScore = this.state.recycling;
            const employmentScore = this.state.population > 0 ? (this.state.jobsFilled / this.state.population) * 100 : 0;
            const eventsScore = Math.min(20, this.state.activeEvents.length * 5);
            
            this.state.score = Math.floor(
                (pollutionScore * 0.2) + 
                (happinessScore * 0.2) + 
                (populationScore * 0.2) + 
                (recycleScore * 0.15) +
                (employmentScore * 0.15) +
                eventsScore
            );
            
            message = `Você completou ${this.config.maxDays} dias como prefeito!<br>
                      Sua pontuação: <strong>${this.state.score}/100</strong><br><br>`;
            
            if (this.state.score >= 80) {
                message += "🏆 <strong>Excelente trabalho!</strong> Sua cidade é um modelo de sustentabilidade!";
            } else if (this.state.score >= 60) {
                message += "👍 <strong>Bom trabalho!</strong> Sua cidade está no caminho certo.";
            } else {
                message += "⚠️ <strong>Há espaço para melhorar</strong> na gestão ambiental.";
            }
        } else if (this.state.pollution >= 95) {
            gameOver = true;
            title = "Colapso Ambiental";
            message = "A poluição tornou a cidade inabitável. A população teve que evacuar.";
        } else if (this.state.happiness <= 5) {
            gameOver = true;
            title = "Revolta Popular";
            message = "A população se revoltou contra a má gestão da cidade.";
        } else if (this.state.energy <= 5) {
            gameOver = true;
            title = "Apagão Total";
            message = "A cidade ficou sem energia e entrou em colapso.";
        } else if (this.state.money <= 0 && this.state.population < 100) {
            gameOver = true;
            title = "Falência";
            message = "A cidade faliu e não pode mais se sustentar.";
        }

        if (gameOver) {
            this.endGame(title, message, icon);
        }
    }

    endGame(title, message, icon = "💀") {
        this.state.gameOver = true;
        this.state.running = false;
        clearInterval(this.timer);
        
        document.getElementById('end-icon').textContent = icon;
        document.getElementById('end-title').textContent = title;
        document.getElementById('end-msg').innerHTML = message;
        
        const statsContent = document.getElementById('stats-content');
        statsContent.innerHTML = `
            <div>💰 Orçamento Final: <strong>$${Math.floor(this.state.money)}</strong></div>
            <div>👥 População Final: <strong>${Math.floor(this.state.population).toLocaleString()}</strong></div>
            <div>😊 Felicidade Final: <strong>${Math.floor(this.state.happiness)}%</strong></div>
            <div>🌫️ Poluição Final: <strong>${Math.floor(this.state.pollution)}%</strong></div>
            <div>⚡ Energia Final: <strong>${Math.floor(this.state.energy)}%</strong></div>
            <div>♻️ Reciclagem Final: <strong>${Math.floor(this.state.recycling)}%</strong></div>
            <div>💼 Empregos Preenchidos: <strong>${this.state.jobsFilled}/${this.state.jobsAvailable}</strong></div>
            <div>🏢 Total de Construções: <strong>${this.state.buildings.length}</strong></div>
            <div>🏠 Casas Construídas: <strong>${this.state.buildings.filter(b => b.type === 'house').length}</strong></div>
            <div>🏭 Indústrias Construídas: <strong>${this.state.buildings.filter(b => b.type === 'factory').length}</strong></div>
            <div>📅 Dias Sobrevividos: <strong>${this.state.day}</strong></div>
            <div>🎯 Missões Concluídas: <strong>${this.state.missions.filter(m => m.done).length}/${this.state.missions.length}</strong></div>
        `;
        
        document.getElementById('end-screen').classList.remove('hidden');
    }

    updateUI() {
        document.getElementById('ui-day').textContent = this.state.day;
        document.getElementById('ui-week').textContent = this.state.week;
        document.getElementById('ui-pop').textContent = Math.floor(this.state.population).toLocaleString();
        document.getElementById('ui-money').textContent = `$${Math.floor(this.state.money)}`;
        document.getElementById('ui-energy').textContent = `${Math.floor(this.state.energy)}%`;
        document.getElementById('ui-happy').textContent = `${Math.floor(this.state.happiness)}%`;
        document.getElementById('ui-pollute').textContent = `${Math.floor(this.state.pollution)}%`;
        document.getElementById('ui-migrants').textContent = this.state.migrants;
        
        const employmentRate = this.state.population > 0 ? (this.state.jobsFilled / this.state.population) * 100 : 0;
        const housingRate = this.state.housingCapacity > 0 ? (this.state.population / this.state.housingCapacity) * 100 : 0;
        
        document.getElementById('ui-jobs').textContent = `${this.state.jobsFilled}/${this.state.jobsAvailable}`;
        document.getElementById('ui-housing').textContent = `${this.state.population}/${this.state.housingCapacity}`;
        
        document.getElementById('week-number').textContent = this.state.week;
        
        document.getElementById('events-this-week').textContent = 
            `${this.state.eventsThisWeek}/${this.config.maxEventsPerWeek}`;
        
        document.getElementById('bar-money').style.width = `${Math.min(100, this.state.money / 20000 * 100)}%`;
        document.getElementById('bar-energy').style.width = `${Math.min(100, this.state.energy)}%`;
        document.getElementById('bar-happy').style.width = `${this.state.happiness}%`;
        document.getElementById('bar-pollute').style.width = `${this.state.pollution}%`;
        document.getElementById('bar-jobs').style.width = `${Math.min(100, employmentRate)}%`;
        document.getElementById('bar-housing').style.width = `${Math.min(100, housingRate)}%`;
        
        this.updateBarColor('bar-pollute', this.state.pollution, [30, 70]);
        this.updateBarColor('bar-energy', this.state.energy, [30, 70]);
        this.updateBarColor('bar-happy', this.state.happiness, [40, 70]);
        this.updateBarColor('bar-jobs', employmentRate, [40, 80]);
        this.updateBarColor('bar-housing', housingRate, [60, 90]);
        
        this.updateButtonStates();
    }

    updateBarColor(barId, value, thresholds) {
        const bar = document.getElementById(barId);
        if (!bar) return;
        
        if (value < thresholds[0]) {
            bar.style.background = '#2ecc71';
        } else if (value < thresholds[1]) {
            bar.style.background = '#f39c12';
        } else {
            bar.style.background = '#e74c3c';
        }
    }

    updateButtonStates() {
        const buttons = ['house', 'factory', 'solar', 'park', 'recycle'];
        buttons.forEach(type => {
            const btn = document.getElementById(`btn-${type}`);
            const cost = this.config.costs[type];
            btn.disabled = this.state.money < cost;
        });

        const campaignBtn = document.getElementById('btn-campaign');
        campaignBtn.disabled = this.state.campaignCooldown > 0 || this.state.money < this.config.costs.campaign;
        
        // Removido o botão de impostos
    }

    notify(message, isError = false, duration = 4000) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        
        if (isError) {
            notification.style.borderColor = '#e74c3c';
            notification.style.color = '#FF6B6B';
        }
        
        notification.innerHTML = message;
        document.querySelector('.game-main-container').appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => notification.remove(), 500);
        }, duration);
    }

    spawnFloater(text, x, y, color = '#FFFFFF') {
        const floater = document.createElement('div');
        floater.className = 'floater';
        floater.textContent = text;
        floater.style.left = `${x}px`;
        floater.style.top = `${y}px`;
        floater.style.color = color;
        
        document.getElementById('game-grid').appendChild(floater);
        setTimeout(() => floater.remove(), 1500);
    }

    spawnParticles(count, color) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.background = color;
                particle.style.left = `${Math.random() * 800}px`;
                particle.style.top = `${Math.random() * 600}px`;
                
                document.getElementById('game-grid').appendChild(particle);
                
                particle.style.transition = 'all 1s';
                setTimeout(() => {
                    particle.style.transform = `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)`;
                    particle.style.opacity = '0';
                }, 10);
                
                setTimeout(() => particle.remove(), 1100);
            }, i * 30);
        }
    }

    shakeElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.parentElement.classList.add('shake');
            setTimeout(() => element.parentElement.classList.remove('shake'), 500);
        }
    }
}

// Criar instância do jogo quando a página carregar
let game;

document.addEventListener('DOMContentLoaded', function() {
    game = new Game();
    
    function addBackgroundParticles() {
        const container = document.querySelector('.game-main-container');
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.background = i % 3 === 0 ? '#3CB371' : i % 3 === 1 ? '#98FB98' : '#2E8B57';
            particle.style.width = `${Math.random() * 8 + 4}px`;
            particle.style.height = particle.style.width;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.opacity = Math.random() * 0.3 + 0.1;
            container.appendChild(particle);
            
            animateParticle(particle);
        }
    }
    
    function animateParticle(particle) {
        let x = parseFloat(particle.style.left);
        let y = parseFloat(particle.style.top);
        let dx = (Math.random() - 0.5) * 0.2;
        let dy = (Math.random() - 0.5) * 0.2;
        
        function move() {
            x += dx;
            y += dy;
            
            if (x <= 0 || x >= 100) dx = -dx;
            if (y <= 0 || y >= 100) dy = -dy;
            
            particle.style.left = `${x}%`;
            particle.style.top = `${y}%`;
            
            requestAnimationFrame(move);
        }
        
        move();
    }
    
    addBackgroundParticles();
});