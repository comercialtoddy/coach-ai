/**
 * CS2 Coach AI - Round Database System
 * Sistema de banco de dados simples para armazenar informações dos rounds
 */

class RoundDatabase {
    constructor() {
        // Banco de dados em memória
        this.currentRound = {
            roundNumber: 0,
            startTime: null,
            endTime: null,
            playerName: '',
            playerSide: '',
            startHealth: 100,
            startMoney: 0,
            events: [],
            kills: [],
            deaths: [],
            damages: [],
            utilities: [],
            positions: [],
            economyChanges: [],
            bombEvents: [],
            finalResult: null,
            roundScore: { ct: 0, t: 0 }
        };
        
        // Histórico de rounds
        this.roundHistory = [];
        
        // Cache de análises
        this.analysisCache = new Map();
        
        // Estatísticas acumuladas
        this.playerStats = {
            totalKills: 0,
            totalDeaths: 0,
            totalAssists: 0,
            totalDamage: 0,
            clutchesWon: 0,
            bombsPlanted: 0,
            bombsDefused: 0,
            roundsPlayed: 0,
            roundsWon: 0,
            economyValue: 0,
            headshotPercentage: 0,
            averageKillsPerRound: 0,
            favoriteWeapon: null,
            bestPerformance: null
        };
        
        // Padrões detectados
        this.patterns = {
            rushB: 0,
            stackA: 0,
            ecoRounds: 0,
            forceRounds: 0,
            antiEcoFails: 0,
            clutchAttempts: 0
        };
    }
    
    // Iniciar novo round
    startNewRound(roundNumber, playerData, mapData) {
        // Salvar round anterior se existir
        if (this.currentRound.startTime && this.currentRound.events.length > 0) {
            this.saveRound();
        }
        
        // Resetar round atual
        this.currentRound = {
            roundNumber: roundNumber || this.currentRound.roundNumber + 1,
            startTime: Date.now(),
            endTime: null,
            playerName: playerData?.name || 'Jogador',
            playerSide: this.detectSide(playerData?.team),
            startHealth: playerData?.state?.health || 100,
            startMoney: playerData?.state?.money || 0,
            startArmor: playerData?.state?.armor || 0,
            startHelmet: playerData?.state?.helmet || false,
            mapName: mapData?.name || 'unknown',
            events: [],
            kills: [],
            deaths: [],
            damages: [],
            utilities: [],
            positions: [],
            economyChanges: [],
            bombEvents: [],
            weaponPurchases: [],
            roundScore: {
                ct: mapData?.team_ct?.score || 0,
                t: mapData?.team_t?.score || 0
            }
        };
        
        this.addEvent('round_start', {
            side: this.currentRound.playerSide,
            economy: this.currentRound.startMoney,
            health: this.currentRound.startHealth
        });
    }
    
    // Adicionar evento genérico
    addEvent(type, data, priority = 'normal') {
        const event = {
            type,
            timestamp: Date.now(),
            relativeTime: Date.now() - this.currentRound.startTime,
            data: this.cleanData(data),
            priority
        };
        
        this.currentRound.events.push(event);
        
        // Log eventos importantes
        if (priority === 'high' || priority === 'critical') {
            console.log(`[ROUND DB] Evento importante: ${type}`, event.data);
        }
    }
    
    // Adicionar kill
    addKill(killerName, victimName, weapon, headshot = false, assistName = null) {
        const kill = {
            timestamp: Date.now(),
            relativeTime: Date.now() - this.currentRound.startTime,
            killer: killerName,
            victim: victimName,
            weapon: weapon,
            headshot: headshot,
            assist: assistName,
            isPlayerKill: killerName === this.currentRound.playerName,
            isPlayerDeath: victimName === this.currentRound.playerName,
            killNumber: this.currentRound.kills.filter(k => k.killer === killerName).length + 1
        };
        
        this.currentRound.kills.push(kill);
        
        // Detectar eventos importantes
        if (kill.isPlayerKill) {
            this.playerStats.totalKills++;
            
            // Detectar multi-kills
            const recentKills = this.currentRound.kills.filter(k => 
                k.isPlayerKill && 
                k.timestamp > Date.now() - 5000
            ).length;
            
            if (recentKills === 3) {
                this.addEvent('triple_kill', {
                    weapon: weapon,
                    time: kill.relativeTime
                }, 'critical');
            } else if (recentKills === 4) {
                this.addEvent('quad_kill', {
                    weapon: weapon,
                    time: kill.relativeTime
                }, 'critical');
            } else if (recentKills === 5) {
                this.addEvent('ace', {
                    weapon: weapon,
                    time: kill.relativeTime
                }, 'critical');
            }
        }
        
        return kill;
    }
    
    // Adicionar dano
    addDamage(attackerName, victimName, damage, weapon, hitGroup) {
        const damageEvent = {
            timestamp: Date.now(),
            relativeTime: Date.now() - this.currentRound.startTime,
            attacker: attackerName,
            victim: victimName,
            damage: damage,
            weapon: weapon,
            hitGroup: hitGroup,
            isPlayerDamage: attackerName === this.currentRound.playerName
        };
        
        this.currentRound.damages.push(damageEvent);
        
        if (damageEvent.isPlayerDamage) {
            this.playerStats.totalDamage += damage;
        }
    }
    
    // Adicionar uso de utilitário
    addUtility(type, throwerName, position) {
        const utility = {
            timestamp: Date.now(),
            relativeTime: Date.now() - this.currentRound.startTime,
            type: type, // smoke, flash, he, molotov, decoy
            thrower: throwerName,
            position: position,
            isPlayerUtility: throwerName === this.currentRound.playerName
        };
        
        this.currentRound.utilities.push(utility);
    }
    
    // Adicionar posição do jogador
    addPosition(position, activity = 'moving') {
        const pos = {
            timestamp: Date.now(),
            relativeTime: Date.now() - this.currentRound.startTime,
            x: position.x || 0,
            y: position.y || 0,
            z: position.z || 0,
            activity: activity // moving, camping, rotating, rushing
        };
        
        this.currentRound.positions.push(pos);
    }
    
    // Adicionar evento de bomba
    addBombEvent(type, playerName, site = null) {
        const bombEvent = {
            timestamp: Date.now(),
            relativeTime: Date.now() - this.currentRound.startTime,
            type: type, // planted, defused, dropped, picked_up
            player: playerName,
            site: site,
            isPlayerAction: playerName === this.currentRound.playerName
        };
        
        this.currentRound.bombEvents.push(bombEvent);
        
        // Adicionar como evento importante
        if (type === 'planted') {
            this.addEvent('bomb_planted', {
                site: site,
                planter: playerName,
                time: bombEvent.relativeTime
            }, 'critical');
            
            if (bombEvent.isPlayerAction) {
                this.playerStats.bombsPlanted++;
            }
        } else if (type === 'defused') {
            this.addEvent('bomb_defused', {
                defuser: playerName,
                time: bombEvent.relativeTime
            }, 'critical');
            
            if (bombEvent.isPlayerAction) {
                this.playerStats.bombsDefused++;
            }
        }
    }
    
    // Adicionar mudança econômica
    addEconomyChange(oldMoney, newMoney, reason = '') {
        const change = {
            timestamp: Date.now(),
            relativeTime: Date.now() - this.currentRound.startTime,
            oldMoney: oldMoney,
            newMoney: newMoney,
            difference: newMoney - oldMoney,
            reason: reason // kill_reward, round_loss, round_win, purchase
        };
        
        this.currentRound.economyChanges.push(change);
    }
    
    // Detectar situação de clutch
    detectClutchSituation(aliveTeammates, aliveEnemies) {
        if (aliveTeammates === 0 && aliveEnemies > 0) {
            const clutchType = `1v${aliveEnemies}`;
            this.addEvent('clutch_situation', {
                type: clutchType,
                health: this.getPlayerHealth(),
                hasDefuseKit: this.hasDefuseKit(),
                bombPlanted: this.isBombPlanted()
            }, 'critical');
            
            this.patterns.clutchAttempts++;
        }
    }
    
    // Finalizar round
    endRound(winner, mvp = null) {
        this.currentRound.endTime = Date.now();
        this.currentRound.duration = this.currentRound.endTime - this.currentRound.startTime;
        this.currentRound.finalResult = {
            winner: winner, // 'CT' ou 'T'
            playerWon: winner === this.currentRound.playerSide,
            mvp: mvp,
            reason: this.detectRoundEndReason()
        };
        
        // Atualizar estatísticas
        this.playerStats.roundsPlayed++;
        if (this.currentRound.finalResult.playerWon) {
            this.playerStats.roundsWon++;
        }
        
        // Detectar clutch vencido
        const lastClutch = this.currentRound.events.findLast(e => e.type === 'clutch_situation');
        if (lastClutch && this.currentRound.finalResult.playerWon) {
            this.playerStats.clutchesWon++;
        }
        
        this.saveRound();
    }
    
    // Salvar round no histórico
    saveRound() {
        // Criar resumo do round
        const roundSummary = {
            ...this.currentRound,
            summary: this.generateRoundSummary()
        };
        
        this.roundHistory.push(roundSummary);
        
        // Manter apenas últimos 30 rounds
        if (this.roundHistory.length > 30) {
            this.roundHistory.shift();
        }
    }
    
    // Gerar resumo do round
    generateRoundSummary() {
        const kills = this.currentRound.kills.filter(k => k.isPlayerKill).length;
        const deaths = this.currentRound.deaths.filter(d => d.isPlayerDeath).length;
        const damage = this.currentRound.damages.filter(d => d.isPlayerDamage)
            .reduce((sum, d) => sum + d.damage, 0);
        
        return {
            performance: {
                kills: kills,
                deaths: deaths,
                damage: damage,
                assists: this.currentRound.kills.filter(k => k.assist === this.currentRound.playerName).length
            },
            keyEvents: this.currentRound.events.filter(e => e.priority === 'critical' || e.priority === 'high'),
            economyImpact: this.calculateEconomyImpact(),
            roundImpact: this.calculateRoundImpact()
        };
    }
    
    // Obter contexto para análise
    getAnalysisContext() {
        // Preparar dados limpos para o GEMINI
        const context = {
            // Informações do round atual
            roundNumber: this.currentRound.roundNumber,
            playerName: this.currentRound.playerName,
            playerSide: this.currentRound.playerSide,
            roundDuration: (Date.now() - this.currentRound.startTime) / 1000,
            
            // Performance atual
            currentKills: this.currentRound.kills.filter(k => k.isPlayerKill).length,
            currentDeaths: this.currentRound.deaths.filter(d => d.isPlayerDeath).length,
            currentDamage: this.currentRound.damages.filter(d => d.isPlayerDamage)
                .reduce((sum, d) => sum + d.damage, 0),
            
            // Eventos importantes
            importantEvents: this.currentRound.events
                .filter(e => e.priority === 'critical' || e.priority === 'high')
                .map(e => `${e.type}: ${JSON.stringify(e.data)}`),
            
            // Histórico recente (últimos 3 rounds)
            recentHistory: this.roundHistory.slice(-3).map(r => ({
                round: r.roundNumber,
                result: r.finalResult?.playerWon ? 'VITÓRIA' : 'DERROTA',
                kills: r.summary?.performance.kills || 0,
                deaths: r.summary?.performance.deaths || 0
            })),
            
            // Estatísticas gerais
            overallStats: {
                winRate: Math.round((this.playerStats.roundsWon / this.playerStats.roundsPlayed) * 100) || 0,
                kd: (this.playerStats.totalKills / Math.max(this.playerStats.totalDeaths, 1)).toFixed(2),
                averageKills: (this.playerStats.totalKills / Math.max(this.playerStats.roundsPlayed, 1)).toFixed(1),
                clutchRate: Math.round((this.playerStats.clutchesWon / Math.max(this.patterns.clutchAttempts, 1)) * 100) || 0
            },
            
            // Padrões detectados
            patterns: this.detectCurrentPatterns()
        };
        
        return context;
    }
    
    // Obter resumo completo do round
    getRoundSummary() {
        const summary = [];
        
        // Título
        summary.push(`ROUND ${this.currentRound.roundNumber} - ${this.currentRound.playerName} (${this.currentRound.playerSide})`);
        
        // Performance
        const kills = this.currentRound.kills.filter(k => k.isPlayerKill).length;
        const deaths = this.currentRound.deaths.filter(d => d.isPlayerDeath).length;
        const damage = this.currentRound.damages.filter(d => d.isPlayerDamage)
            .reduce((sum, d) => sum + d.damage, 0);
        
        summary.push(`Performance: ${kills}K/${deaths}D - ${damage} DMG`);
        
        // Eventos importantes em ordem cronológica
        const timeline = [];
        
        this.currentRound.events.forEach(event => {
            if (event.priority === 'critical' || event.priority === 'high') {
                const time = Math.round(event.relativeTime / 1000);
                timeline.push(`[${time}s] ${this.formatEvent(event)}`);
            }
        });
        
        this.currentRound.kills.forEach(kill => {
            if (kill.isPlayerKill || kill.isPlayerDeath) {
                const time = Math.round(kill.relativeTime / 1000);
                const action = kill.isPlayerKill ? 
                    `Matou ${kill.victim} com ${kill.weapon}${kill.headshot ? ' (HS)' : ''}` :
                    `Morreu para ${kill.killer} (${kill.weapon})`;
                timeline.push(`[${time}s] ${action}`);
            }
        });
        
        // Ordenar timeline
        timeline.sort((a, b) => {
            const timeA = parseInt(a.match(/\[(\d+)s\]/)[1]);
            const timeB = parseInt(b.match(/\[(\d+)s\]/)[1]);
            return timeA - timeB;
        });
        
        summary.push('\nTIMELINE:');
        summary.push(...timeline);
        
        // Resultado
        if (this.currentRound.finalResult) {
            summary.push(`\nRESULTADO: ${this.currentRound.finalResult.playerWon ? 'VITÓRIA' : 'DERROTA'} - ${this.currentRound.finalResult.reason}`);
        }
        
        return summary.join('\n');
    }
    
    // Funções auxiliares
    detectSide(team) {
        if (!team) return 'UNKNOWN';
        const teamUpper = team.toString().toUpperCase();
        if (teamUpper === 'CT' || teamUpper.includes('COUNTER')) return 'CT';
        if (teamUpper === 'T' || teamUpper.includes('TERROR')) return 'TR';
        return 'UNKNOWN';
    }
    
    cleanData(data) {
        // Remove estruturas JSON complexas e mantém apenas valores simples
        if (typeof data !== 'object' || data === null) return data;
        
        const cleaned = {};
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                cleaned[key] = value;
            } else if (Array.isArray(value)) {
                cleaned[key] = value.filter(v => 
                    typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
                );
            }
        }
        return cleaned;
    }
    
    formatEvent(event) {
        switch (event.type) {
            case 'round_start':
                return `Round iniciado como ${event.data.side} com $${event.data.economy}`;
            case 'bomb_planted':
                return `Bomba plantada no site ${event.data.site}`;
            case 'bomb_defused':
                return `Bomba desarmada por ${event.data.defuser}`;
            case 'triple_kill':
                return `TRIPLE KILL com ${event.data.weapon}!`;
            case 'quad_kill':
                return `QUAD KILL com ${event.data.weapon}!`;
            case 'ace':
                return `ACE com ${event.data.weapon}!`;
            case 'clutch_situation':
                return `Clutch ${event.data.type} com ${event.data.health} HP`;
            case 'low_health':
                return `HP crítico: ${event.data.health}`;
            default:
                return `${event.type}: ${JSON.stringify(event.data)}`;
        }
    }
    
    detectRoundEndReason() {
        // Analisar eventos para determinar como o round terminou
        const bombPlanted = this.currentRound.bombEvents.some(e => e.type === 'planted');
        const bombDefused = this.currentRound.bombEvents.some(e => e.type === 'defused');
        const allKilled = this.currentRound.kills.length >= 5;
        
        if (bombDefused) return 'Bomba desarmada';
        if (bombPlanted && this.currentRound.finalResult?.winner === 'T') return 'Bomba explodiu';
        if (allKilled) return 'Eliminação total';
        if (!bombPlanted && this.currentRound.duration > 105000) return 'Tempo esgotado';
        
        return 'Eliminação';
    }
    
    calculateEconomyImpact() {
        const changes = this.currentRound.economyChanges;
        if (changes.length === 0) return 0;
        
        const totalChange = changes.reduce((sum, c) => sum + c.difference, 0);
        return totalChange;
    }
    
    calculateRoundImpact() {
        // Calcular impacto do jogador no round
        const kills = this.currentRound.kills.filter(k => k.isPlayerKill).length;
        const damage = this.currentRound.damages.filter(d => d.isPlayerDamage)
            .reduce((sum, d) => sum + d.damage, 0);
        const bombPlant = this.currentRound.bombEvents.some(e => e.type === 'planted' && e.isPlayerAction);
        const bombDefuse = this.currentRound.bombEvents.some(e => e.type === 'defused' && e.isPlayerAction);
        
        let impact = (kills * 100) + (damage * 0.5);
        if (bombPlant) impact += 150;
        if (bombDefuse) impact += 200;
        
        return Math.round(impact);
    }
    
    detectCurrentPatterns() {
        // Analisar padrões nos últimos rounds
        const recentRounds = this.roundHistory.slice(-5);
        const patterns = [];
        
        // Detectar eco rounds
        const ecoRounds = recentRounds.filter(r => r.startMoney < 2000).length;
        if (ecoRounds >= 2) patterns.push('ECO_FREQUENTE');
        
        // Detectar rushes
        const fastRounds = recentRounds.filter(r => r.duration < 30000).length;
        if (fastRounds >= 3) patterns.push('RUSH_PATTERN');
        
        // Detectar performance
        const highKillRounds = recentRounds.filter(r => 
            r.summary?.performance.kills >= 3
        ).length;
        if (highKillRounds >= 2) patterns.push('HIGH_PERFORMANCE');
        
        return patterns;
    }
    
    getPlayerHealth() {
        // Obter HP atual do último evento ou estado
        const lastHealthEvent = this.currentRound.events.findLast(e => 
            e.type === 'health_update' || e.data.health !== undefined
        );
        return lastHealthEvent?.data.health || 100;
    }
    
    hasDefuseKit() {
        // Verificar se jogador tem defuse kit
        return this.currentRound.events.some(e => 
            e.type === 'item_pickup' && e.data.item === 'defuser'
        );
    }
    
    isBombPlanted() {
        return this.currentRound.bombEvents.some(e => e.type === 'planted');
    }
    
    // Limpar banco de dados
    reset() {
        this.currentRound = {
            roundNumber: 0,
            startTime: null,
            events: [],
            kills: [],
            deaths: [],
            damages: [],
            utilities: [],
            positions: [],
            economyChanges: [],
            bombEvents: []
        };
        this.roundHistory = [];
        this.analysisCache.clear();
        
        console.log('[ROUND DB] Banco de dados resetado');
    }
}

module.exports = RoundDatabase; 