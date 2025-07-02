/**
 * CS2 Coach AI - Event Detector
 * Sistema para detectar eventos importantes durante o jogo
 */

class EventDetector {
    constructor(roundDatabase) {
        this.roundDB = roundDatabase;
        this.previousState = null;
        this.currentState = null;
        
        // Configurações de detecção
        this.thresholds = {
            lowHealth: 30,
            criticalHealth: 15,
            lowMoney: 1500,
            highKillStreak: 3,
            rapidKills: 5000, // 5 segundos entre kills
            clutchThreshold: 2, // 1v2 ou mais
            economyShift: 2000,
            bombPlantTime: 40, // segundos restantes quando planta
            defuseTime: 10 // segundos para defuse
        };
        
        // Tracking de eventos
        this.eventTracking = {
            lastKillTime: 0,
            killStreak: 0,
            lastHealthWarning: 0,
            lastEconomyWarning: 0,
            roundStartDetected: false,
            bombPlantDetected: false,
            clutchDetected: false
        };
    }
    
    // Atualizar estado e detectar eventos
    updateState(gameData) {
        this.previousState = this.currentState;
        this.currentState = this.parseGameState(gameData);
        
        if (!this.previousState) {
            return []; // Primeira atualização, sem eventos ainda
        }
        
        const detectedEvents = [];
        
        // Detectar início de round
        const roundStart = this.detectRoundStart();
        if (roundStart) detectedEvents.push(roundStart);
        
        // Detectar eventos de kill
        const killEvents = this.detectKillEvents();
        if (killEvents.length > 0) detectedEvents.push(...killEvents);
        
        // Detectar HP crítico
        const healthEvent = this.detectHealthEvents();
        if (healthEvent) detectedEvents.push(healthEvent);
        
        // Detectar mudanças econômicas
        const economyEvent = this.detectEconomyEvents();
        if (economyEvent) detectedEvents.push(economyEvent);
        
        // Detectar eventos de bomba
        const bombEvents = this.detectBombEvents();
        if (bombEvents.length > 0) detectedEvents.push(...bombEvents);
        
        // Detectar situações de clutch
        const clutchEvent = this.detectClutchSituation();
        if (clutchEvent) detectedEvents.push(clutchEvent);
        
        // Detectar fim de round
        const roundEnd = this.detectRoundEnd();
        if (roundEnd) detectedEvents.push(roundEnd);
        
        // Registrar eventos no banco de dados
        detectedEvents.forEach(event => {
            this.registerEventInDatabase(event);
        });
        
        return detectedEvents;
    }
    
    // Parse do estado do jogo
    parseGameState(gameData) {
        if (!gameData) return null;
        
        return {
            // Round info
            roundPhase: gameData.round?.phase,
            roundNumber: gameData.map?.round || 0,
            roundTime: gameData.round?.clock_time,
            bombState: gameData.round?.bomb,
            
            // Player info
            playerName: gameData.player?.name || 'Player',
            playerTeam: gameData.player?.team,
            playerHealth: gameData.player?.state?.health || 100,
            playerArmor: gameData.player?.state?.armor || 0,
            playerMoney: gameData.player?.state?.money || 0,
            playerKills: gameData.player?.state?.round_kills || 0,
            playerDeaths: gameData.player?.state?.deaths || 0,
            
            // Weapons
            activeWeapon: this.getActiveWeapon(gameData.player?.weapons),
            hasDefuseKit: gameData.player?.state?.defusekit || false,
            
            // Team info
            teamScore: {
                ct: gameData.map?.team_ct?.score || 0,
                t: gameData.map?.team_t?.score || 0
            },
            
            // All players (para clutch detection)
            allPlayers: gameData.allplayers || {},
            
            // Map
            mapName: gameData.map?.name,
            
            // Timestamp
            timestamp: Date.now()
        };
    }
    
    // Detectar início de round
    detectRoundStart() {
        if (this.currentState.roundPhase === 'freezetime' && 
            this.previousState.roundPhase !== 'freezetime' &&
            !this.eventTracking.roundStartDetected) {
            
            this.eventTracking.roundStartDetected = true;
            this.eventTracking.killStreak = 0;
            
            // Iniciar novo round no banco de dados
            this.roundDB.startNewRound(
                this.currentState.roundNumber,
                {
                    name: this.currentState.playerName,
                    team: this.currentState.playerTeam,
                    state: {
                        health: this.currentState.playerHealth,
                        money: this.currentState.playerMoney,
                        armor: this.currentState.playerArmor
                    }
                },
                {
                    name: this.currentState.mapName,
                    round: this.currentState.roundNumber,
                    team_ct: { score: this.currentState.teamScore.ct },
                    team_t: { score: this.currentState.teamScore.t }
                }
            );
            
            return {
                type: 'round_start',
                priority: 'high',
                data: {
                    round: this.currentState.roundNumber,
                    side: this.currentState.playerTeam,
                    money: this.currentState.playerMoney,
                    score: `CT ${this.currentState.teamScore.ct} - ${this.currentState.teamScore.t} T`
                }
            };
        }
        
        return null;
    }
    
    // Detectar eventos de kill
    detectKillEvents() {
        const events = [];
        
        // Verificar se houve kill
        if (this.currentState.playerKills > this.previousState.playerKills) {
            const killCount = this.currentState.playerKills;
            const timeSinceLastKill = Date.now() - this.eventTracking.lastKillTime;
            
            this.eventTracking.lastKillTime = Date.now();
            this.eventTracking.killStreak++;
            
            // Multi-kill detection
            if (killCount === 3) {
                events.push({
                    type: 'triple_kill',
                    priority: 'critical',
                    data: {
                        kills: killCount,
                        weapon: this.currentState.activeWeapon,
                        health: this.currentState.playerHealth
                    }
                });
            } else if (killCount === 4) {
                events.push({
                    type: 'quad_kill',
                    priority: 'critical',
                    data: {
                        kills: killCount,
                        weapon: this.currentState.activeWeapon,
                        health: this.currentState.playerHealth
                    }
                });
            } else if (killCount === 5) {
                events.push({
                    type: 'ace',
                    priority: 'critical',
                    data: {
                        kills: killCount,
                        weapon: this.currentState.activeWeapon,
                        health: this.currentState.playerHealth
                    }
                });
            }
            
            // Rapid kill detection
            if (timeSinceLastKill < this.thresholds.rapidKills && this.eventTracking.killStreak > 1) {
                events.push({
                    type: 'rapid_kills',
                    priority: 'high',
                    data: {
                        killStreak: this.eventTracking.killStreak,
                        timeBetweenKills: timeSinceLastKill / 1000
                    }
                });
            }
        }
        
        return events;
    }
    
    // Detectar eventos de saúde
    detectHealthEvents() {
        const currentHealth = this.currentState.playerHealth;
        const previousHealth = this.previousState.playerHealth;
        
        // HP caiu para nível crítico
        if (currentHealth < this.thresholds.lowHealth && 
            previousHealth >= this.thresholds.lowHealth &&
            Date.now() - this.eventTracking.lastHealthWarning > 10000) {
            
            this.eventTracking.lastHealthWarning = Date.now();
            
            const priority = currentHealth < this.thresholds.criticalHealth ? 'critical' : 'high';
            
            return {
                type: currentHealth < this.thresholds.criticalHealth ? 'critical_health' : 'low_health',
                priority: priority,
                data: {
                    health: currentHealth,
                    armor: this.currentState.playerArmor,
                    previousHealth: previousHealth,
                    hasCover: this.currentState.playerArmor > 0
                }
            };
        }
        
        return null;
    }
    
    // Detectar eventos econômicos
    detectEconomyEvents() {
        const currentMoney = this.currentState.playerMoney;
        const previousMoney = this.previousState.playerMoney;
        const moneyChange = Math.abs(currentMoney - previousMoney);
        
        // Grande mudança econômica
        if (moneyChange > this.thresholds.economyShift &&
            Date.now() - this.eventTracking.lastEconomyWarning > 15000) {
            
            this.eventTracking.lastEconomyWarning = Date.now();
            
            return {
                type: 'economy_shift',
                priority: 'medium',
                data: {
                    previousMoney: previousMoney,
                    currentMoney: currentMoney,
                    change: currentMoney - previousMoney,
                    canFullBuy: currentMoney >= 4750
                }
            };
        }
        
        // Economia baixa
        if (currentMoney < this.thresholds.lowMoney && 
            previousMoney >= this.thresholds.lowMoney) {
            
            return {
                type: 'low_economy',
                priority: 'medium',
                data: {
                    money: currentMoney,
                    canBuyArmor: currentMoney >= 650,
                    canBuyRifle: currentMoney >= 2700
                }
            };
        }
        
        return null;
    }
    
    // Detectar eventos de bomba
    detectBombEvents() {
        const events = [];
        
        // Bomba plantada
        if (this.currentState.bombState === 'planted' && 
            this.previousState.bombState !== 'planted' &&
            !this.eventTracking.bombPlantDetected) {
            
            this.eventTracking.bombPlantDetected = true;
            
            events.push({
                type: 'bomb_planted',
                priority: 'critical',
                data: {
                    timeRemaining: this.currentState.roundTime,
                    playerTeam: this.currentState.playerTeam,
                    hasDefuseKit: this.currentState.hasDefuseKit
                }
            });
        }
        
        // Bomba sendo defusada
        if (this.currentState.bombState === 'defusing' && 
            this.previousState.bombState !== 'defusing') {
            
            events.push({
                type: 'bomb_defusing',
                priority: 'critical',
                data: {
                    defuseTime: this.currentState.hasDefuseKit ? 5 : 10,
                    timeRemaining: this.currentState.roundTime
                }
            });
        }
        
        return events;
    }
    
    // Detectar situação de clutch
    detectClutchSituation() {
        if (!this.currentState.allPlayers || this.eventTracking.clutchDetected) {
            return null;
        }
        
        const players = Object.values(this.currentState.allPlayers);
        const playerTeam = this.currentState.playerTeam;
        
        // Contar jogadores vivos em cada time
        const aliveTeammates = players.filter(p => 
            p.team === playerTeam && 
            p.state?.health > 0 && 
            p.name !== this.currentState.playerName
        ).length;
        
        const aliveEnemies = players.filter(p => 
            p.team !== playerTeam && 
            p.state?.health > 0
        ).length;
        
        // Situação de clutch (1vX)
        if (aliveTeammates === 0 && aliveEnemies >= this.thresholds.clutchThreshold) {
            this.eventTracking.clutchDetected = true;
            
            this.roundDB.detectClutchSituation(aliveTeammates, aliveEnemies);
            
            return {
                type: 'clutch_situation',
                priority: 'critical',
                data: {
                    situation: `1v${aliveEnemies}`,
                    health: this.currentState.playerHealth,
                    armor: this.currentState.playerArmor,
                    money: this.currentState.playerMoney,
                    bombPlanted: this.currentState.bombState === 'planted',
                    hasDefuseKit: this.currentState.hasDefuseKit
                }
            };
        }
        
        return null;
    }
    
    // Detectar fim de round
    detectRoundEnd() {
        if ((this.currentState.roundPhase === 'over' || this.currentState.roundPhase === 'gameover') && 
            this.previousState.roundPhase !== 'over' && 
            this.previousState.roundPhase !== 'gameover') {
            
            // Reset tracking
            this.eventTracking.roundStartDetected = false;
            this.eventTracking.bombPlantDetected = false;
            this.eventTracking.clutchDetected = false;
            this.eventTracking.killStreak = 0;
            
            // Determinar vencedor
            const ctWon = this.currentState.teamScore.ct > this.previousState.teamScore.ct;
            const tWon = this.currentState.teamScore.t > this.previousState.teamScore.t;
            const winner = ctWon ? 'CT' : (tWon ? 'T' : 'DRAW');
            
            // Finalizar round no banco de dados
            this.roundDB.endRound(winner);
            
            return {
                type: 'round_end',
                priority: 'critical',
                data: {
                    winner: winner,
                    finalScore: `CT ${this.currentState.teamScore.ct} - ${this.currentState.teamScore.t} T`,
                    playerStats: {
                        kills: this.currentState.playerKills,
                        deaths: this.currentState.playerDeaths,
                        health: this.currentState.playerHealth
                    },
                    needsSummary: true // Flag para solicitar resumo do round
                }
            };
        }
        
        return null;
    }
    
    // Registrar evento no banco de dados
    registerEventInDatabase(event) {
        switch (event.type) {
            case 'triple_kill':
            case 'quad_kill':
            case 'ace':
            case 'rapid_kills':
                // Esses já são registrados via addKill no roundDB
                this.roundDB.addEvent(event.type, event.data, event.priority);
                break;
                
            case 'low_health':
            case 'critical_health':
                this.roundDB.addEvent('health_update', {
                    health: event.data.health,
                    armor: event.data.armor,
                    critical: event.type === 'critical_health'
                }, event.priority);
                break;
                
            case 'economy_shift':
            case 'low_economy':
                this.roundDB.addEconomyChange(
                    event.data.previousMoney || 0,
                    event.data.currentMoney || event.data.money,
                    event.type
                );
                break;
                
            case 'bomb_planted':
            case 'bomb_defusing':
                // Esses são registrados via addBombEvent
                this.roundDB.addEvent(event.type, event.data, event.priority);
                break;
                
            case 'clutch_situation':
                // Já registrado via detectClutchSituation
                break;
                
            default:
                this.roundDB.addEvent(event.type, event.data, event.priority);
        }
    }
    
    // Obter arma ativa
    getActiveWeapon(weapons) {
        if (!weapons) return 'unknown';
        
        for (const weapon of Object.values(weapons)) {
            if (weapon.state === 'active') {
                return weapon.name || 'unknown';
            }
        }
        
        return 'unknown';
    }
    
    // Reset detector
    reset() {
        this.previousState = null;
        this.currentState = null;
        this.eventTracking = {
            lastKillTime: 0,
            killStreak: 0,
            lastHealthWarning: 0,
            lastEconomyWarning: 0,
            roundStartDetected: false,
            bombPlantDetected: false,
            clutchDetected: false
        };
    }
}

module.exports = EventDetector;