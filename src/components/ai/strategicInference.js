/**
 * CS2 Coach AI - Strategic Inference Engine
 * Sistema de inferência estratégica para coaching Tier 1
 * Constrói modelos de oponentes e fornece análise preditiva
 */

class StrategicInference {
    constructor() {
        // Modelo do oponente baseado em observações
        this.opponentModel = {
            players: new Map(), // Modelo individual por jogador
            teamPatterns: {
                economicBehavior: [],
                roundStrategies: [],
                positionPreferences: new Map(),
                utilityUsage: new Map(),
                clutchTendencies: []
            },
            confidence: 0, // 0-100% confiança no modelo
            lastUpdated: Date.now(),
            roundsObserved: 0
        };
        
        // Sistema de tracking de dano para inferência de HP inimigo
        this.damageTracking = new Map(); // PlayerID -> DamageData
        
        // Tracking de economia inimiga
        this.economicInference = {
            lastKnownMoney: new Map(),
            purchasePatterns: [],
            forceRounds: [],
            saveRounds: [],
            fullBuyRounds: []
        };
        
        // Padrões táticos detectados
        this.tacticalPatterns = {
            sitePreferences: { A: 0, B: 0, mid: 0 },
            executionTiming: [], // Slow vs fast
            retakeStrategies: [],
            antiEcoPatterns: [],
            clutchSuccessRate: 0
        };
        
        // Inferência de posições
        this.positionInference = {
            lastKnownPositions: new Map(),
            movementPatterns: new Map(),
            utilitySources: new Map(), // De onde vieram as granadas
            soundCues: []
        };
        
        // Estatísticas de confiabilidade
        this.reliability = {
            damageInference: 0,
            positionInference: 0,
            economicInference: 0,
            tacticalInference: 0
        };
    }
    
    /**
     * Atualiza modelo com nova informação do GSI
     * @param {Object} gameData - Dados do GSI
     * @param {Object} previousData - Estado anterior para comparação
     */
    updateInference(gameData, previousData) {
        console.log('[INFERENCE] Atualizando modelo estratégico');
        
        // Incrementar rounds observados
        if (this.isNewRound(gameData, previousData)) {
            this.opponentModel.roundsObserved++;
        }
        
        // Atualizar tracking de dano
        this.updateDamageInference(gameData, previousData);
        
        // Inferir economia inimiga
        this.updateEconomicInference(gameData, previousData);
        
        // Detectar padrões táticos
        this.updateTacticalPatterns(gameData, previousData);
        
        // Inferir posições baseado em utilitários
        this.updatePositionInference(gameData, previousData);
        
        // Atualizar confiança do modelo
        this.updateModelConfidence();
        
        this.opponentModel.lastUpdated = Date.now();
        
        console.log(`[INFERENCE] Modelo atualizado - Confiança: ${this.opponentModel.confidence}%`);
    }
    
    /**
     * Atualiza tracking de dano para inferir HP inimigo
     */
    updateDamageInference(gameData, previousData) {
        if (!gameData.player?.state || !previousData) return;
        
        // Detectar dano causado baseado em mudanças de stats
        const currentDamage = Number(gameData.player.state.total_damage) || 0;
        const previousDamage = Number(previousData.player?.state?.total_damage) || 0;
        const damageDeal = currentDamage - previousDamage;
        
        if (damageDeal > 0) {
            console.log(`[DAMAGE_INFERENCE] Dano causado: ${damageDeal}`);
            
            // Registrar dano para inferência futura
            const timestamp = Date.now();
            this.addDamageRecord({
                damage: damageDeal,
                timestamp,
                round: gameData.map?.round,
                phase: gameData.round?.phase
            });
            
            this.reliability.damageInference = Math.min(100, this.reliability.damageInference + 5);
        }
    }
    
    /**
     * Infere economia inimiga baseado no placar e kill feed
     */
    updateEconomicInference(gameData, previousData) {
        if (!gameData.map) return;
        
        const currentRound = Number(gameData.map.round) || 0;
        const ctScore = Number(gameData.map.team_ct?.score) || 0;
        const tScore = Number(gameData.map.team_t?.score) || 0;
        
        // Analisar economia baseado em resultado do round anterior
        if (previousData?.map && currentRound > (Number(previousData.map.round) || 0)) {
            const roundResult = this.analyzeRoundResult(gameData, previousData);
            this.inferEconomicState(roundResult, currentRound);
        }
        
        this.reliability.economicInference = Math.min(100, this.reliability.economicInference + 3);
    }
    
    /**
     * Detecta padrões táticos baseado em eventos
     */
    updateTacticalPatterns(gameData, previousData) {
        // Detectar preferências de site
        if (gameData.round?.bomb === 'planted') {
            const site = this.inferBombSite(gameData);
            if (site !== 'unknown') {
                this.tacticalPatterns.sitePreferences[site]++;
                console.log(`[TACTICAL] Site preference updated: ${site}`);
            }
        }
        
        // Analisar timing de execução
        if (gameData.round?.phase === 'live' && previousData?.round?.phase === 'freezetime') {
            const executionTiming = this.analyzeExecutionTiming(gameData);
            this.tacticalPatterns.executionTiming.push(executionTiming);
        }
        
        this.reliability.tacticalInference = Math.min(100, this.reliability.tacticalInference + 2);
    }
    
    /**
     * Infere posições baseado em granadas e sons
     */
    updatePositionInference(gameData, previousData) {
        // Detectar granadas inimigas para inferir posições
        this.analyzeEnemyUtility(gameData, previousData);
        
        // Tracking de movimento baseado em sound cues
        this.analyzeSoundCues(gameData);
        
        this.reliability.positionInference = Math.min(100, this.reliability.positionInference + 1);
    }
    
    /**
     * Gera análise preditiva baseada no modelo
     * @param {string} analysisType - Tipo de análise (pre-round, mid-round, post-round)
     * @returns {Object} Análise preditiva
     */
    generatePredictiveAnalysis(analysisType, gameData) {
        console.log(`[PREDICTION] Gerando análise preditiva: ${analysisType}`);
        
        const analysis = {
            confidence: this.opponentModel.confidence,
            predictions: [],
            recommendations: [],
            inferredStates: this.getInferredStates(),
            patterns: this.getDetectedPatterns()
        };
        
        switch (analysisType) {
            case 'pre_round':
                analysis.predictions.push(...this.predictRoundStrategy(gameData));
                analysis.recommendations.push(...this.generatePreRoundRecommendations(gameData));
                break;
                
            case 'mid_round':
                analysis.predictions.push(...this.predictEnemyActions(gameData));
                analysis.recommendations.push(...this.generateMidRoundRecommendations(gameData));
                break;
                
            case 'post_round':
                analysis.predictions.push(...this.predictNextRoundEconomy(gameData));
                analysis.recommendations.push(...this.generatePostRoundRecommendations(gameData));
                break;
        }
        
        return analysis;
    }
    
    /**
     * Prediz estratégia inimiga para o round
     */
    predictRoundStrategy(gameData) {
        const predictions = [];
        const roundNumber = Number(gameData.map?.round) || 0;
        
        // Análise econômica
        const economicState = this.inferCurrentEnemyEconomy(gameData);
        predictions.push({
            type: 'economy',
            prediction: economicState.state,
            confidence: economicState.confidence,
            reasoning: economicState.reasoning
        });
        
        // Análise de preferências de site
        const sitePreference = this.predictSitePreference();
        predictions.push({
            type: 'site_preference',
            prediction: sitePreference.site,
            confidence: sitePreference.confidence,
            reasoning: `Baseado em ${this.opponentModel.roundsObserved} rounds observados`
        });
        
        // Análise de timing
        const timingPreference = this.predictExecutionTiming();
        predictions.push({
            type: 'execution_timing',
            prediction: timingPreference.timing,
            confidence: timingPreference.confidence,
            reasoning: timingPreference.reasoning
        });
        
        return predictions;
    }
    
    /**
     * Prediz ações inimigas durante o round
     */
    predictEnemyActions(gameData) {
        const predictions = [];
        
        // Predizer retake strategy baseado em patterns
        if (gameData.round?.bomb === 'planted') {
            const retakeStrategy = this.predictRetakeStrategy(gameData);
            predictions.push({
                type: 'retake_strategy',
                prediction: retakeStrategy.strategy,
                confidence: retakeStrategy.confidence,
                reasoning: retakeStrategy.reasoning
            });
        }
        
        // Predizer rotações baseado em sound cues
        const rotationLikelihood = this.predictRotations(gameData);
        predictions.push({
            type: 'rotations',
            prediction: rotationLikelihood.prediction,
            confidence: rotationLikelihood.confidence,
            reasoning: rotationLikelihood.reasoning
        });
        
        return predictions;
    }
    
    /**
     * Prediz economia inimiga para próximo round
     */
    predictNextRoundEconomy(gameData) {
        const predictions = [];
        
        const economyPrediction = this.calculateNextRoundEconomy(gameData);
        predictions.push({
            type: 'next_round_economy',
            prediction: economyPrediction.state,
            confidence: economyPrediction.confidence,
            reasoning: economyPrediction.reasoning,
            expectedBuys: economyPrediction.expectedBuys
        });
        
        return predictions;
    }
    
    /**
     * Gera recomendações estratégicas
     */
    generatePreRoundRecommendations(gameData) {
        const recommendations = [];
        const predictions = this.predictRoundStrategy(gameData);
        
        // Recomendações baseadas na economia inimiga
        const economyPrediction = predictions.find(p => p.type === 'economy');
        if (economyPrediction) {
            switch (economyPrediction.prediction) {
                case 'eco':
                    recommendations.push({
                        type: 'anti_eco',
                        recommendation: 'Manter distância, usar utility para área denial, evitar close quarters',
                        priority: 'high'
                    });
                    break;
                case 'force':
                    recommendations.push({
                        type: 'anti_force',
                        recommendation: 'Esperar utility inimiga, jogar safe angles, priorizar team fighting',
                        priority: 'high'
                    });
                    break;
                case 'full':
                    recommendations.push({
                        type: 'anti_full',
                        recommendation: 'Execução coordenada, smoke walls, utility synergy máxima',
                        priority: 'high'
                    });
                    break;
            }
        }
        
        // Recomendações baseadas em preferências de site
        const sitePreference = predictions.find(p => p.type === 'site_preference');
        if (sitePreference && sitePreference.confidence > 60) {
            recommendations.push({
                type: 'site_stack',
                recommendation: `Considerar stack em ${sitePreference.prediction} baseado em padrões observados`,
                priority: 'medium'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Estados inferidos atuais
     */
    getInferredStates() {
        return {
            enemyHP: this.getInferredEnemyHP(),
            enemyEconomy: this.getInferredEnemyEconomy(),
            enemyPositions: this.getInferredPositions(),
            teamMorale: this.getInferredMorale()
        };
    }
    
    /**
     * Padrões detectados
     */
    getDetectedPatterns() {
        return {
            sitePreferences: this.tacticalPatterns.sitePreferences,
            executionTiming: this.summarizeExecutionTiming(),
            economicBehavior: this.summarizeEconomicBehavior(),
            clutchTendencies: this.tacticalPatterns.clutchTendencies
        };
    }
    
    /**
     * Funções auxiliares
     */
    
    isNewRound(gameData, previousData) {
        if (!previousData?.map) return false;
        const currentRound = Number(gameData.map?.round) || 0;
        const previousRound = Number(previousData.map?.round) || 0;
        return currentRound > previousRound;
    }
    
    addDamageRecord(damageData) {
        if (!this.damageTracking.has('recent')) {
            this.damageTracking.set('recent', []);
        }
        
        const recentDamage = this.damageTracking.get('recent');
        recentDamage.push(damageData);
        
        // Manter apenas os últimos 10 registros
        if (recentDamage.length > 10) {
            recentDamage.shift();
        }
    }
    
    analyzeRoundResult(gameData, previousData) {
        const currentScore = {
            ct: Number(gameData.map?.team_ct?.score) || 0,
            t: Number(gameData.map?.team_t?.score) || 0
        };
        
        const previousScore = {
            ct: Number(previousData.map?.team_ct?.score) || 0,
            t: Number(previousData.map?.team_t?.score) || 0
        };
        
        if (currentScore.ct > previousScore.ct) {
            return { winner: 'CT', method: 'unknown' };
        } else if (currentScore.t > previousScore.t) {
            return { winner: 'T', method: 'unknown' };
        }
        
        return { winner: 'unknown', method: 'unknown' };
    }
    
    inferBombSite(gameData) {
        // Logic simplificada - seria melhor com coordenadas
        if (gameData.bomb?.position) {
            // Implementar mapeamento de coordenadas para sites
            return Math.random() > 0.5 ? 'A' : 'B'; // Placeholder
        }
        return 'unknown';
    }
    
    analyzeExecutionTiming(gameData) {
        const currentTime = Number(gameData.round?.clock_time) || 0;
        const freezeEndTime = 115; // Tempo padrão do freeze
        const executionDelay = freezeEndTime - currentTime;
        
        if (executionDelay < 20) return 'fast';
        if (executionDelay < 60) return 'medium';
        return 'slow';
    }
    
    analyzeEnemyUtility(gameData, previousData) {
        // Detectar novas granadas para inferir posições
        // Implementar lógica baseada em mudanças no estado do jogo
    }
    
    analyzeSoundCues(gameData) {
        // Analisar sound cues para inferir movimento inimigo
        // Implementar baseado em dados disponíveis no GSI
    }
    
    updateModelConfidence() {
        const avgReliability = (
            this.reliability.damageInference +
            this.reliability.positionInference +
            this.reliability.economicInference +
            this.reliability.tacticalInference
        ) / 4;
        
        const roundsWeight = Math.min(100, this.opponentModel.roundsObserved * 5);
        
        this.opponentModel.confidence = Math.round((avgReliability + roundsWeight) / 2);
    }
    
    // Implementar métodos de predição específicos...
    predictSitePreference() {
        const total = this.tacticalPatterns.sitePreferences.A + this.tacticalPatterns.sitePreferences.B;
        if (total === 0) return { site: 'unknown', confidence: 0 };
        
        const aPreference = this.tacticalPatterns.sitePreferences.A / total;
        const bPreference = this.tacticalPatterns.sitePreferences.B / total;
        
        if (aPreference > 0.6) return { site: 'A', confidence: Math.round(aPreference * 100) };
        if (bPreference > 0.6) return { site: 'B', confidence: Math.round(bPreference * 100) };
        
        return { site: 'balanced', confidence: 50 };
    }
    
    predictExecutionTiming() {
        if (this.tacticalPatterns.executionTiming.length === 0) {
            return { timing: 'unknown', confidence: 0, reasoning: 'Dados insuficientes' };
        }
        
        const recent = this.tacticalPatterns.executionTiming.slice(-5);
        const fastCount = recent.filter(t => t === 'fast').length;
        const slowCount = recent.filter(t => t === 'slow').length;
        
        if (fastCount > slowCount + 1) {
            return { timing: 'fast', confidence: 70, reasoning: 'Padrão de execução rápida observado' };
        } else if (slowCount > fastCount + 1) {
            return { timing: 'slow', confidence: 70, reasoning: 'Padrão de jogo lento observado' };
        }
        
        return { timing: 'medium', confidence: 50, reasoning: 'Padrão misto observado' };
    }
    
    // Métodos para obter estados inferidos
    getInferredEnemyHP() {
        const damageRecords = this.damageTracking.get('recent') || [];
        if (damageRecords.length === 0) return 'unknown';
        
        const totalDamage = damageRecords.reduce((sum, record) => sum + record.damage, 0);
        return `~${Math.max(0, 100 - totalDamage)} HP (inferido)`;
    }
    
    getInferredEnemyEconomy() {
        return this.inferCurrentEnemyEconomy().state;
    }
    
    getInferredPositions() {
        return Array.from(this.positionInference.lastKnownPositions.entries());
    }
    
    getInferredMorale() {
        // Calcular moral baseado em rounds recentes
        const recentRounds = Math.min(5, this.opponentModel.roundsObserved);
        if (recentRounds === 0) return 'unknown';
        
        // Simplificado - implementar baseado em win/loss streak
        return 'neutral';
    }
    
    // Métodos para sumarizar padrões
    summarizeExecutionTiming() {
        const timing = this.tacticalPatterns.executionTiming;
        if (timing.length === 0) return 'Dados insuficientes';
        
        const counts = timing.reduce((acc, t) => {
            acc[t] = (acc[t] || 0) + 1;
            return acc;
        }, {});
        
        const dominant = Object.entries(counts)
            .sort(([,a], [,b]) => b - a)[0];
        
        return `Predominantemente ${dominant[0]} (${dominant[1]}/${timing.length})`;
    }
    
    summarizeEconomicBehavior() {
        const patterns = this.economicInference.purchasePatterns;
        if (patterns.length === 0) return 'Padrões em análise';
        
        return `${patterns.length} padrões de compra observados`;
    }
    
    // Métodos específicos de predição econômica
    inferCurrentEnemyEconomy(gameData = {}) {
        // Lógica simplificada baseada no placar e round
        const round = Number(gameData.map?.round) || 0;
        const ctScore = Number(gameData.map?.team_ct?.score) || 0;
        const tScore = Number(gameData.map?.team_t?.score) || 0;
        
        // Determinar se o oponente provavelmente ganhou/perdeu o último round
        // Isso é uma simplificação - seria melhor com dados históricos
        
        if (round <= 3) {
            return { state: 'pistol', confidence: 80, reasoning: 'Rounds iniciais' };
        }
        
        // Implementar lógica mais sofisticada baseada em padrões observados
        return { state: 'unknown', confidence: 20, reasoning: 'Dados insuficientes para inferência' };
    }
    
    calculateNextRoundEconomy(gameData) {
        return {
            state: 'unknown',
            confidence: 30,
            reasoning: 'Análise em desenvolvimento',
            expectedBuys: []
        };
    }
    
    predictRetakeStrategy(gameData) {
        return {
            strategy: 'unknown',
            confidence: 20,
            reasoning: 'Padrões de retake sendo analisados'
        };
    }
    
    predictRotations(gameData) {
        return {
            prediction: 'unknown',
            confidence: 20,
            reasoning: 'Sistema de rotação em desenvolvimento'
        };
    }
    
    inferEconomicState(roundResult, currentRound) {
        // Implementar lógica de inferência econômica baseada no resultado do round
        console.log(`[ECONOMIC_INFERENCE] Round ${currentRound}: ${roundResult.winner} won`);
    }
    
    generateMidRoundRecommendations(gameData) {
        return [{
            type: 'adaptive',
            recommendation: 'Ajustar estratégia baseado em intel coletada',
            priority: 'medium'
        }];
    }
    
    generatePostRoundRecommendations(gameData) {
        return [{
            type: 'preparation',
            recommendation: 'Preparar para próximo round baseado em padrões observados',
            priority: 'low'
        }];
    }
    
    /**
     * Obter resumo do modelo para debugging
     */
    getModelSummary() {
        return {
            confidence: this.opponentModel.confidence,
            roundsObserved: this.opponentModel.roundsObserved,
            reliability: this.reliability,
            patterns: {
                sitePreferences: this.tacticalPatterns.sitePreferences,
                executionTiming: this.tacticalPatterns.executionTiming.length
            }
        };
    }
    
    /**
     * Reset do modelo para nova partida
     */
    reset() {
        this.opponentModel.roundsObserved = 0;
        this.opponentModel.confidence = 0;
        this.damageTracking.clear();
        this.tacticalPatterns.sitePreferences = { A: 0, B: 0, mid: 0 };
        this.tacticalPatterns.executionTiming = [];
        this.reliability = {
            damageInference: 0,
            positionInference: 0,
            economicInference: 0,
            tacticalInference: 0
        };
        
        console.log('[INFERENCE] Modelo resetado para nova partida');
    }
}

module.exports = StrategicInference; 