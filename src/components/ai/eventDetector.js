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
    
    // Detectar início de round com análise estratégica
    detectRoundStart() {
        if (this.currentState.roundPhase === 'freezetime' && 
            this.previousState.roundPhase !== 'freezetime' &&
            !this.eventTracking.roundStartDetected) {
            
            this.eventTracking.roundStartDetected = true;
            this.eventTracking.killStreak = 0;
            
            // Classificar tipo de round para análise mais específica
            let roundType = 'round_start';
            const money = this.currentState.playerMoney;
            const roundNumber = this.currentState.roundNumber;
            
            // Rounds especiais que merecem análise
            if (roundNumber === 1 || roundNumber === 16) {
                roundType = 'round_start_pistol';
            } else if (money < 1500) {
                roundType = 'round_start_eco';
            } else if (money < 3000) {
                roundType = 'round_start_force';
            } else if (this.isMatchPoint()) {
                roundType = 'round_start_decisive';
            }
            
            return {
                type: roundType,
                priority: roundType.includes('pistol') || roundType.includes('decisive') ? 'high' : 'medium',
                data: {
                    round: this.currentState.roundNumber,
                    side: this.currentState.playerTeam,
                    money: this.currentState.playerMoney,
                    score: `CT ${this.currentState.teamScore.ct} - ${this.currentState.teamScore.t} T`,
                    roundType: roundType
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
    
    // Funções auxiliares para detecção estratégica
    isMatchPoint() {
        const ctScore = this.currentState.teamScore.ct;
        const tScore = this.currentState.teamScore.t;
        return ctScore >= 15 || tScore >= 15;
    }
    
    isPistolRound() {
        const roundNumber = this.currentState.roundNumber;
        return roundNumber === 1 || roundNumber === 16;
    }
    
    isEcoRound() {
        return this.currentState.playerMoney < 1500;
    }
    
    isForceRound() {
        return this.currentState.playerMoney >= 1500 && this.currentState.playerMoney < 3000;
    }
    
    isCloseGame() {
        const ctScore = this.currentState.teamScore.ct;
        const tScore = this.currentState.teamScore.t;
        return Math.abs(ctScore - tScore) <= 2;
    }
    
    hasLowTime() {
        return this.currentState.roundTime <= 30;
    }
    
    isOvertime() {
        const ctScore = this.currentState.teamScore.ct;
        const tScore = this.currentState.teamScore.t;
        return (ctScore + tScore) >= 30;
    }
    
    // Detectar situações específicas que requerem calls inteligentes
    detectTeamSituations() {
        const situations = [];
        
        if (!this.currentState.allPlayers) return situations;
        
        const players = Object.values(this.currentState.allPlayers);
        const playerTeam = this.currentState.playerTeam;
        const teammates = players.filter(p => 
            p.team === playerTeam && 
            p.name !== this.currentState.playerName
        );
        const enemies = players.filter(p => p.team !== playerTeam);
        
        // Situação: Múltiplos teammates com HP baixo
        const lowHealthTeammates = teammates.filter(p => 
            p.state?.health > 0 && p.state?.health < 30
        );
        
        if (lowHealthTeammates.length >= 2) {
            situations.push({
                type: 'team_low_health',
                severity: 'high',
                data: {
                    count: lowHealthTeammates.length,
                    players: lowHealthTeammates.map(p => ({ name: p.name, health: p.state.health }))
                }
            });
        }
        
        // Situação: Desvantagem numérica
        const aliveTeammates = teammates.filter(p => p.state?.health > 0);
        const aliveEnemies = enemies.filter(p => p.state?.health > 0);
        
        if (aliveTeammates.length < aliveEnemies.length - 1) {
            situations.push({
                type: 'numerical_disadvantage',
                severity: 'critical',
                data: {
                    allies: aliveTeammates.length + 1, // +1 para o próprio jogador
                    enemies: aliveEnemies.length,
                    deficit: aliveEnemies.length - (aliveTeammates.length + 1)
                }
            });
        }
        
        // Situação: Time economicamente quebrado
        const avgTeamMoney = teammates.reduce((sum, p) => sum + (p.state?.money || 0), 0) / teammates.length;
        if (avgTeamMoney < 1000 && this.currentState.playerMoney < 1000) {
            situations.push({
                type: 'team_economy_crisis',
                severity: 'high',
                data: {
                    avgMoney: Math.round(avgTeamMoney),
                    playerMoney: this.currentState.playerMoney
                }
            });
        }
        
        return situations;
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