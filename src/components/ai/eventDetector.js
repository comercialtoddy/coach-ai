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
            clutchDetected: false,
            lastSyntheticEvent: 0  // Para teste do sistema
        };
    }
    
    // Atualizar estado e detectar eventos
    updateState(gameData) {
        console.log('[EVENT_DETECTOR] 🔍 updateState called');
        
        this.previousState = this.currentState;
        this.currentState = this.parseGameState(gameData);
        
        console.log('[EVENT_DETECTOR] 📊 Current state:', {
            phase: this.currentState?.roundPhase,
            health: this.currentState?.playerHealth,
            money: this.currentState?.playerMoney,
            kills: this.currentState?.playerKills,
            round: this.currentState?.roundNumber
        });
        
        if (!this.previousState) {
            console.log('[EVENT_DETECTOR] ⏸️ No previous state - skipping event detection');
            return []; // Primeira atualização, sem eventos ainda
        }
        
        console.log('[EVENT_DETECTOR] 📈 Previous state:', {
            phase: this.previousState?.roundPhase,
            health: this.previousState?.playerHealth,
            money: this.previousState?.playerMoney,
            kills: this.previousState?.playerKills,
            round: this.previousState?.roundNumber
        });
        
        const detectedEvents = [];
        
        // Detectar início de round
        console.log('[EVENT_DETECTOR] 🎯 Checking round start...');
        const roundStart = this.detectRoundStart();
        if (roundStart) {
            console.log('[EVENT_DETECTOR] ✅ Round start detected:', roundStart);
            detectedEvents.push(roundStart);
        }
        
        // Detectar eventos de kill
        console.log('[EVENT_DETECTOR] ⚔️ Checking kill events...');
        const killEvents = this.detectKillEvents();
        if (killEvents.length > 0) {
            console.log('[EVENT_DETECTOR] ✅ Kill events detected:', killEvents);
            detectedEvents.push(...killEvents);
        }
        
        // Detectar HP crítico
        console.log('[EVENT_DETECTOR] ❤️ Checking health events...');
        const healthEvent = this.detectHealthEvents();
        if (healthEvent) {
            console.log('[EVENT_DETECTOR] ✅ Health event detected:', healthEvent);
            detectedEvents.push(healthEvent);
        }
        
        // Detectar mudanças econômicas
        console.log('[EVENT_DETECTOR] 💰 Checking economy events...');
        const economyEvent = this.detectEconomyEvents();
        if (economyEvent) {
            console.log('[EVENT_DETECTOR] ✅ Economy event detected:', economyEvent);
            detectedEvents.push(economyEvent);
        }
        
        // Detectar eventos de bomba
        console.log('[EVENT_DETECTOR] 💣 Checking bomb events...');
        const bombEvents = this.detectBombEvents();
        if (bombEvents.length > 0) {
            console.log('[EVENT_DETECTOR] ✅ Bomb events detected:', bombEvents);
            detectedEvents.push(...bombEvents);
        }
        
        // Detectar situações de clutch
        console.log('[EVENT_DETECTOR] 🎯 Checking clutch situation...');
        const clutchEvent = this.detectClutchSituation();
        if (clutchEvent) {
            console.log('[EVENT_DETECTOR] ✅ Clutch event detected:', clutchEvent);
            detectedEvents.push(clutchEvent);
        }
        
        // Detectar fim de round
        console.log('[EVENT_DETECTOR] 🏁 Checking round end...');
        const roundEnd = this.detectRoundEnd();
        if (roundEnd) {
            console.log('[EVENT_DETECTOR] ✅ Round end detected:', roundEnd);
            detectedEvents.push(roundEnd);
        }

        // TESTE: Evento sintético para verificar funcionamento
        const syntheticEvent = this.detectSyntheticEvent();
        if (syntheticEvent) {
            console.log('[EVENT_DETECTOR] 🧪 Synthetic event detected:', syntheticEvent);
            detectedEvents.push(syntheticEvent);
        }
        
        // NOVO: Se nenhum evento foi detectado, adicionar logs detalhados
        if (detectedEvents.length === 0) {
            console.log('[EVENT_DETECTOR] ⚠️ No events detected. Detailed analysis:');
            this.debugEventDetection();
        } else {
            console.log(`[EVENT_DETECTOR] 🎉 ${detectedEvents.length} events detected:`, detectedEvents.map(e => e.type));
        }
        
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
    
    // TESTE: Evento sintético para verificar funcionamento do sistema
    detectSyntheticEvent() {
        const now = Date.now();
        const timeSinceLastSynthetic = now - this.eventTracking.lastSyntheticEvent;
        
        // Gerar evento teste a cada 60 segundos (menos frequente)
        if (timeSinceLastSynthetic > 60000) { // 60 segundos
            this.eventTracking.lastSyntheticEvent = now;
            
            return {
                type: 'coaching_system_test',
                priority: 'normal',
                data: {
                    context: 'Testando sistema de coaching inteligente',
                    instruction: 'Forneça uma dica rápida de CS2 para verificar se o sistema está funcionando',
                    playerName: this.currentState?.playerName || 'Player',
                    currentHealth: this.currentState?.playerHealth || 100,
                    currentMoney: this.currentState?.playerMoney || 0,
                    mapName: this.currentState?.mapName || 'unknown',
                    roundNumber: this.currentState?.roundNumber || 0
                }
            };
        }
        
        return null;
    }

    // Debug detalhado da detecção de eventos
    debugEventDetection() {
        console.log('[DEBUG] === ANÁLISE DETALHADA DE EVENTOS ===');
        
        // Debug round start
        console.log('[DEBUG] Round Start Check:');
        console.log(`  - Current phase: ${this.currentState?.roundPhase}`);
        console.log(`  - Previous phase: ${this.previousState?.roundPhase}`);
        console.log(`  - Round start detected: ${this.eventTracking.roundStartDetected}`);
        console.log(`  - Condition: ${this.currentState?.roundPhase === 'freezetime'} && ${this.previousState?.roundPhase !== 'freezetime'} && ${!this.eventTracking.roundStartDetected}`);
        
        // Debug health events
        console.log('[DEBUG] Health Events Check:');
        console.log(`  - Current health: ${this.currentState?.playerHealth}`);
        console.log(`  - Previous health: ${this.previousState?.playerHealth}`);
        console.log(`  - Low health threshold: ${this.thresholds.lowHealth}`);
        console.log(`  - Time since last warning: ${Date.now() - this.eventTracking.lastHealthWarning}ms`);
        
        // Debug economy events
        console.log('[DEBUG] Economy Events Check:');
        console.log(`  - Current money: ${this.currentState?.playerMoney}`);
        console.log(`  - Previous money: ${this.previousState?.playerMoney}`);
        console.log(`  - Money change: ${Math.abs((this.currentState?.playerMoney || 0) - (this.previousState?.playerMoney || 0))}`);
        console.log(`  - Economy shift threshold: ${this.thresholds.economyShift}`);
        
        // Debug kill events
        console.log('[DEBUG] Kill Events Check:');
        console.log(`  - Current kills: ${this.currentState?.playerKills}`);
        console.log(`  - Previous kills: ${this.previousState?.playerKills}`);
        console.log(`  - Kill difference: ${(this.currentState?.playerKills || 0) - (this.previousState?.playerKills || 0)}`);
        
        // Debug bomb events
        console.log('[DEBUG] Bomb Events Check:');
        console.log(`  - Current bomb state: ${this.currentState?.bombState}`);
        console.log(`  - Previous bomb state: ${this.previousState?.bombState}`);
        console.log(`  - Bomb plant detected: ${this.eventTracking.bombPlantDetected}`);
        
        // Debug game data availability
        console.log('[DEBUG] Data Availability:');
        console.log(`  - Current state exists: ${!!this.currentState}`);
        console.log(`  - Previous state exists: ${!!this.previousState}`);
        console.log(`  - Player data exists: ${!!this.currentState?.playerName}`);
        console.log(`  - Round data exists: ${!!this.currentState?.roundPhase}`);
        
        console.log('[DEBUG] === FIM DA ANÁLISE ===');
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
            clutchDetected: false,
            lastSyntheticEvent: 0
        };
    }
}

module.exports = EventDetector; 