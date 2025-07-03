/**
 * CS2 Coach AI - Smart Analysis Trigger
 * Sistema inteligente para decidir quando o GEMINI deve analisar e responder
 * Elimina spam e foca apenas em momentos estratégicos críticos
 */

class SmartAnalysisTrigger {
    constructor() {
        // Identificação do jogador principal
        this.mainPlayer = {
            name: null,
            steamId: null,
            confidence: 0,
            detectionStartTime: Date.now(),
            interactionCount: 0
        };
        
        // Sistema anti-spam inteligente
        this.antiSpam = {
            lastAnalysisTime: 0,
            analysisCount: 0,
            cooldownActive: false,
            minIntervalBetweenAnalysis: 15000, // 15 segundos mínimo
            maxAnalysisPerMinute: 3, // Máximo 3 análises por minuto
            lastAnalysisTypes: [], // Últimos 5 tipos de análise
            spamPrevention: new Map() // Prevenção por tipo
        };
        
        // Momentos estratégicos que justificam análise
        this.strategicMoments = {
            // CRÍTICOS - Sempre analisar
            critical: [
                'ace', 'quad_kill', 'triple_kill',
                'clutch_1v4', 'clutch_1v3', 'clutch_1v2',
                'bomb_planted_last_30s', 'defuse_last_10s',
                'match_point_final', 'overtime_start'
            ],
            
            // IMPORTANTES - Analisar se condições específicas
            important: [
                'round_start_pistol', 'round_start_eco', 'round_start_force',
                'economy_crisis', 'momentum_shift',
                'tactical_timeout', 'side_switch',
                'performance_spike', 'performance_drop'
            ],
            
            // CONTEXTUAIS - Analisar baseado em contexto maior
            contextual: [
                'double_kill', 'bomb_planted',
                'low_health_multiple', 'economic_advantage',
                'map_control_shift', 'utility_usage_critical'
            ]
        };
        
        // Detecção de padrões estratégicos
        this.patternDetection = {
            roundTypes: [], // Últimos 10 rounds classificados
            playerPerformance: new Map(), // Performance por jogador
            teamMomentum: 0, // -100 a +100
            economicState: 'unknown', // eco, force, full, broken
            tacticalPhase: 'early' // early, mid, late, overtime
        };
        
        // Estatísticas para decisão inteligente
        this.performanceMetrics = {
            winRateL5: 0, // Win rate últimos 5 rounds
            kdRatioTrend: 0, // Tendência do K/D
            economyTrend: 0, // Tendência econômica
            clutchSuccess: 0, // Taxa de sucesso em clutch
            utilityEfficiency: 0, // Eficiência de uso de utility
            communicationNeeded: false // Se precisa de comunicação com time
        };
    }
    
    // Detectar automaticamente o jogador principal
    detectMainPlayer(gameData) {
        if (!gameData.player) return false;
        
        const currentPlayer = {
            name: gameData.player.name,
            steamId: gameData.provider?.steamid
        };
        
        // Se ainda não temos jogador principal
        if (!this.mainPlayer.name) {
            this.mainPlayer.name = currentPlayer.name;
            this.mainPlayer.steamId = currentPlayer.steamId;
            this.mainPlayer.confidence = 50;
            this.mainPlayer.interactionCount = 1;
            
            console.log(`[MAIN PLAYER] Detectado jogador principal: ${currentPlayer.name}`);
            return true;
        }
        
        // Se é o mesmo jogador, aumentar confiança
        if (this.mainPlayer.name === currentPlayer.name) {
            this.mainPlayer.interactionCount++;
            this.mainPlayer.confidence = Math.min(100, this.mainPlayer.confidence + 2);
            return true;
        }
        
        // Se é jogador diferente
        const timeSinceDetection = Date.now() - this.mainPlayer.detectionStartTime;
        
        // Se passou menos de 2 minutos e confiança é alta, ignorar outros jogadores
        if (timeSinceDetection < 120000 && this.mainPlayer.confidence > 70) {
            console.log(`[MAIN PLAYER] Ignorando jogador ${currentPlayer.name} - foco no main: ${this.mainPlayer.name}`);
            return false;
        }
        
        // Se passou tempo suficiente ou confiança baixa, reavaliar
        if (timeSinceDetection > 300000 || this.mainPlayer.confidence < 30) {
            console.log(`[MAIN PLAYER] Reavaliando jogador principal: ${this.mainPlayer.name} → ${currentPlayer.name}`);
            this.mainPlayer.name = currentPlayer.name;
            this.mainPlayer.steamId = currentPlayer.steamId;
            this.mainPlayer.confidence = 60;
            this.mainPlayer.detectionStartTime = Date.now();
            this.mainPlayer.interactionCount = 1;
            return true;
        }
        
        return false;
    }
    
    // Decidir se deve fazer análise baseado na situação
    shouldAnalyze(eventType, gameData, roundContext) {
        // 1. VERIFICAR SE É O JOGADOR PRINCIPAL
        if (!this.detectMainPlayer(gameData)) {
            console.log(`[SMART TRIGGER] Análise negada - não é o jogador principal`);
            return { should: false, reason: 'not_main_player' };
        }
        
        // 2. VERIFICAR ANTI-SPAM
        const spamCheck = this.checkAntiSpam(eventType);
        if (!spamCheck.allowed) {
            console.log(`[SMART TRIGGER] Análise negada - anti-spam: ${spamCheck.reason}`);
            return { should: false, reason: spamCheck.reason };
        }
        
        // 3. CLASSIFICAR IMPORTÂNCIA DO EVENTO
        const importance = this.classifyEventImportance(eventType, gameData, roundContext);
        
        // 4. VERIFICAR CONTEXTO ESTRATÉGICO
        const strategicContext = this.analyzeStrategicContext(gameData, roundContext);
        
        // 5. TOMAR DECISÃO FINAL
        const decision = this.makeAnalysisDecision(importance, strategicContext, eventType);
        
        if (decision.should) {
            this.recordAnalysis(eventType);
            console.log(`[SMART TRIGGER] ✅ Análise aprovada: ${eventType} (${decision.reason})`);
        } else {
            console.log(`[SMART TRIGGER] ❌ Análise negada: ${eventType} (${decision.reason})`);
        }
        
        return decision;
    }
    
    // Classificar importância do evento
    classifyEventImportance(eventType, gameData, roundContext) {
        // CRÍTICOS - Sempre importantes
        if (this.strategicMoments.critical.includes(eventType)) {
            return { level: 'critical', score: 100 };
        }
        
        // IMPORTANTES - Dependem do contexto
        if (this.strategicMoments.important.includes(eventType)) {
            let score = 70;
            
            // Aumentar importância baseado no contexto
            if (this.isEconomyRound(gameData)) score += 15;
            if (this.isMatchPoint(gameData)) score += 15;
            if (this.isCloseRound(gameData)) score += 10;
            
            return { level: 'important', score: Math.min(100, score) };
        }
        
        // CONTEXTUAIS - Analisar situação específica
        if (this.strategicMoments.contextual.includes(eventType)) {
            let score = 40;
            
            // Avaliar contexto específico
            if (eventType === 'double_kill' && this.isClutchSituation(gameData)) score += 30;
            if (eventType === 'bomb_planted' && this.isLowTime(gameData)) score += 25;
            if (eventType === 'low_health_multiple' && this.isTeamFight(gameData)) score += 20;
            
            return { level: 'contextual', score: Math.min(100, score) };
        }
        
        // EVENTOS NÃO ESTRATÉGICOS
        return { level: 'minor', score: 0 };
    }
    
    // Analisar contexto estratégico geral
    analyzeStrategicContext(gameData, roundContext) {
        const context = {
            roundPhase: this.detectRoundPhase(gameData),
            economicState: this.detectEconomicState(gameData),
            teamMomentum: this.calculateTeamMomentum(roundContext),
            performanceState: this.assessPlayerPerformance(roundContext),
            communicationNeed: this.assessCommunicationNeed(gameData)
        };
        
        // Calcular score de contexto estratégico
        let contextScore = 0;
        
        if (context.roundPhase === 'decisive') contextScore += 25;
        if (context.economicState === 'critical') contextScore += 20;
        if (Math.abs(context.teamMomentum) > 60) contextScore += 15;
        if (context.performanceState === 'struggling') contextScore += 20;
        if (context.communicationNeed) contextScore += 10;
        
        return { ...context, score: contextScore };
    }
    
    // Tomar decisão final sobre análise
    makeAnalysisDecision(importance, strategicContext, eventType) {
        const totalScore = importance.score + strategicContext.score;
        
        // REGRAS DE DECISÃO
        
        // Sempre analisar eventos críticos
        if (importance.level === 'critical') {
            return { should: true, reason: 'critical_event', confidence: 100 };
        }
        
        // Analisar importantes se score alto o suficiente
        if (importance.level === 'important' && totalScore >= 80) {
            return { should: true, reason: 'important_with_context', confidence: 85 };
        }
        
        // Analisar contextuais apenas se score muito alto
        if (importance.level === 'contextual' && totalScore >= 70) {
            return { should: true, reason: 'contextual_strategic', confidence: 75 };
        }
        
        // Analisar se é início/fim de round importante
        if (this.isStrategicRoundMoment(eventType, strategicContext)) {
            return { should: true, reason: 'strategic_round_moment', confidence: 80 };
        }
        
        // Analisar se jogador está performando mal e precisa de ajuda
        if (strategicContext.performanceState === 'struggling' && totalScore >= 50) {
            return { should: true, reason: 'performance_support', confidence: 70 };
        }
        
        // Negar análise - não é momento estratégico
        return { 
            should: false, 
            reason: `low_strategic_value (score: ${totalScore})`, 
            confidence: 0 
        };
    }
    
    // Sistema anti-spam
    checkAntiSpam(eventType) {
        const now = Date.now();
        
        // Verificar intervalo mínimo entre análises
        if (now - this.antiSpam.lastAnalysisTime < this.antiSpam.minIntervalBetweenAnalysis) {
            return { 
                allowed: false, 
                reason: `cooldown_active (${Math.round((this.antiSpam.minIntervalBetweenAnalysis - (now - this.antiSpam.lastAnalysisTime))/1000)}s remaining)` 
            };
        }
        
        // Verificar limite por minuto
        const oneMinuteAgo = now - 60000;
        const recentAnalyses = this.antiSpam.lastAnalysisTypes.filter(a => a.timestamp > oneMinuteAgo);
        
        if (recentAnalyses.length >= this.antiSpam.maxAnalysisPerMinute) {
            return { 
                allowed: false, 
                reason: `rate_limit_exceeded (${recentAnalyses.length}/${this.antiSpam.maxAnalysisPerMinute} per minute)` 
            };
        }
        
        // Verificar spam do mesmo tipo
        const sameTypeRecent = recentAnalyses.filter(a => a.type === eventType);
        if (sameTypeRecent.length >= 2) {
            return { 
                allowed: false, 
                reason: `duplicate_type_spam (${eventType} repeated ${sameTypeRecent.length} times)` 
            };
        }
        
        return { allowed: true, reason: 'passed_all_checks' };
    }
    
    // Registrar análise para controle
    recordAnalysis(eventType) {
        const now = Date.now();
        this.antiSpam.lastAnalysisTime = now;
        this.antiSpam.analysisCount++;
        
        // Adicionar aos últimos tipos
        this.antiSpam.lastAnalysisTypes.unshift({
            type: eventType,
            timestamp: now
        });
        
        // Manter apenas últimos 10
        if (this.antiSpam.lastAnalysisTypes.length > 10) {
            this.antiSpam.lastAnalysisTypes = this.antiSpam.lastAnalysisTypes.slice(0, 10);
        }
    }
    
    // Funções auxiliares de contexto
    detectRoundPhase(gameData) {
        const ctScore = gameData.map?.team_ct?.score || 0;
        const tScore = gameData.map?.team_t?.score || 0;
        const totalRounds = ctScore + tScore;
        
        if (totalRounds <= 3) return 'early';
        if (totalRounds <= 12) return 'mid';
        if (ctScore >= 15 || tScore >= 15) return 'decisive';
        if (totalRounds >= 30) return 'overtime';
        return 'late';
    }
    
    detectEconomicState(gameData) {
        const money = gameData.player?.state?.money || 0;
        
        if (money < 1000) return 'broken';
        if (money < 2500) return 'eco';
        if (money < 4000) return 'force';
        if (money >= 4500) return 'full';
        return 'normal';
    }
    
    calculateTeamMomentum(roundContext) {
        // Simular momentum baseado em rounds recentes
        if (!roundContext || !roundContext.recentHistory) return 0;
        
        let momentum = 0;
        roundContext.recentHistory.forEach((round, index) => {
            const weight = (roundContext.recentHistory.length - index) / roundContext.recentHistory.length;
            momentum += round.result === 'VITÓRIA' ? weight * 20 : weight * -20;
        });
        
        return Math.max(-100, Math.min(100, momentum));
    }
    
    assessPlayerPerformance(roundContext) {
        if (!roundContext) return 'normal';
        
        const kd = roundContext.overallStats?.kd || 1;
        const winRate = roundContext.overallStats?.winRate || 50;
        
        if (kd < 0.7 && winRate < 40) return 'struggling';
        if (kd > 1.5 && winRate > 70) return 'excellent';
        return 'normal';
    }
    
    assessCommunicationNeed(gameData) {
        // Avaliar se precisa de calls para o time
        const players = Object.values(gameData.allplayers || {});
        const alivePlayers = players.filter(p => p.state?.health > 0);
        
        // Se tem poucos players vivos, comunicação é crítica
        if (alivePlayers.length <= 2) return true;
        
        // Se há bomba plantada, comunicação é importante
        if (gameData.round?.bomb === 'planted') return true;
        
        return false;
    }
    
    isEconomyRound(gameData) {
        const money = gameData.player?.state?.money || 0;
        return money < 2000;
    }
    
    isMatchPoint(gameData) {
        const ctScore = gameData.map?.team_ct?.score || 0;
        const tScore = gameData.map?.team_t?.score || 0;
        return ctScore >= 15 || tScore >= 15;
    }
    
    isCloseRound(gameData) {
        const ctScore = gameData.map?.team_ct?.score || 0;
        const tScore = gameData.map?.team_t?.score || 0;
        return Math.abs(ctScore - tScore) <= 2;
    }
    
    isClutchSituation(gameData) {
        const players = Object.values(gameData.allplayers || {});
        const playerTeam = gameData.player?.team;
        const aliveTeammates = players.filter(p => 
            p.team === playerTeam && 
            p.state?.health > 0 && 
            p.name !== gameData.player?.name
        ).length;
        
        return aliveTeammates <= 1;
    }
    
    isLowTime(gameData) {
        const time = gameData.round?.clock_time || 0;
        return time <= 30;
    }
    
    isTeamFight(gameData) {
        const players = Object.values(gameData.allplayers || {});
        const alivePlayers = players.filter(p => p.state?.health > 0);
        return alivePlayers.length >= 6; // Muitos players vivos = team fight
    }
    
    isStrategicRoundMoment(eventType, context) {
        // Momentos específicos que sempre valem análise
        if (eventType === 'round_start' && context.economicState === 'critical') return true;
        if (eventType === 'round_start' && context.roundPhase === 'decisive') return true;
        if (eventType === 'side_switch') return true;
        if (eventType === 'tactical_timeout') return true;
        
        return false;
    }
    
    // Gerar calls inteligentes para o time
    generateTeamCalls(gameData) {
        const calls = [];
        const players = Object.values(gameData.allplayers || {});
        const playerTeam = gameData.player?.team;
        const teammates = players.filter(p => 
            p.team === playerTeam && 
            p.name !== gameData.player?.name
        );
        
        teammates.forEach(teammate => {
            // Call para teammate com HP baixo
            if (teammate.state?.health < 30 && teammate.state?.health > 0) {
                calls.push({
                    type: 'health_warning',
                    target: teammate.name,
                    message: `${teammate.name} está com ${teammate.state.health} HP - cuidado com posicionamento`
                });
            }
            
            // Call para teammate morto recente
            if (teammate.state?.health <= 0) {
                calls.push({
                    type: 'player_down',
                    target: teammate.name,
                    message: `${teammate.name} está down - ajustar posicionamento do time`
                });
            }
            
            // Call para economia do teammate
            if (teammate.state?.money < 1000) {
                calls.push({
                    type: 'economy_help',
                    target: teammate.name,
                    message: `${teammate.name} está sem dinheiro - considere drop de arma`
                });
            }
        });
        
        return calls;
    }
    
    // Obter estatísticas do sistema
    getStats() {
        return {
            mainPlayer: this.mainPlayer,
            antiSpam: {
                totalAnalyses: this.antiSpam.analysisCount,
                lastAnalysisTime: this.antiSpam.lastAnalysisTime,
                recentTypes: this.antiSpam.lastAnalysisTypes.slice(0, 5)
            },
            performance: this.performanceMetrics
        };
    }
    
    // Reset para nova sessão
    reset() {
        this.mainPlayer = {
            name: null,
            steamId: null,
            confidence: 0,
            detectionStartTime: Date.now(),
            interactionCount: 0
        };
        
        this.antiSpam.lastAnalysisTime = 0;
        this.antiSpam.analysisCount = 0;
        this.antiSpam.lastAnalysisTypes = [];
        
        console.log('[SMART TRIGGER] Sistema resetado para nova sessão');
    }
}

module.exports = SmartAnalysisTrigger; 