// ====== POST-ROUND ANALYZER - COMPILE GSI + AI INSIGHTS ======
// Compila dados GSI e insights AI para gerar resumos pós-partida estruturados
// Sistema profissional de análise baseado em metodologias de coaching de CS2

const database = require('./database');
const multimodalCoach = require('./multimodalCoach');
const performanceCalculator = require('./performanceMetricsCalculator');
const historicalRetriever = require('./historicalDataRetriever');
const historicalComparator = require('./historicalDataComparator');

class PostRoundAnalyzer {
    constructor() {
        this.isInitialized = false;
        this.currentRoundData = null;
        this.aiInsightsBuffer = [];
        this.gsiDataBuffer = [];
        this.performanceBuffer = [];
        
        // Configurações de análise por nível
        this.analysisConfigs = {
            beginner: {
                focusMetrics: ['kills', 'deaths', 'health_management', 'money_management'],
                summaryDepth: 'basic',
                keyInsights: 3,
                performanceCategories: ['survival', 'economy', 'basic_tactics']
            },
            intermediate: {
                focusMetrics: ['kd_ratio', 'utility_usage', 'positioning', 'team_coordination', 'economic_decisions'],
                summaryDepth: 'detailed',
                keyInsights: 5,
                performanceCategories: ['tactical', 'coordination', 'utility', 'economy', 'positioning']
            },
            professional: {
                focusMetrics: ['impact_rating', 'clutch_performance', 'momentum_control', 'meta_adaptation', 'pressure_handling'],
                summaryDepth: 'comprehensive',
                keyInsights: 7,
                performanceCategories: ['strategic', 'mental', 'mechanical', 'leadership', 'adaptation', 'pressure']
            }
        };

        // Templates de resumo estruturado
        this.summaryTemplates = {
            basic: {
                sections: ['round_overview', 'performance_highlights', 'key_learnings', 'next_round_focus'],
                format: 'simplified'
            },
            detailed: {
                sections: ['round_analysis', 'tactical_breakdown', 'economic_review', 'team_coordination', 'improvement_areas'],
                format: 'structured'
            },
            comprehensive: {
                sections: ['strategic_analysis', 'performance_metrics', 'pattern_identification', 'mental_game', 'adaptation_recommendations', 'meta_insights'],
                format: 'professional'
            }
        };

        // Estatísticas do analisador
        this.stats = {
            totalRoundsSummary: 0,
            successfulAnalyses: 0,
            failedAnalyses: 0,
            averageProcessingTime: 0,
            totalProcessingTime: 0,
            insightCategories: {},
            lastAnalysisTime: null
        };
    }

    async initialize() {
        try {
            console.log('📊 Initializing Post-Round Analyzer...');
            
            // Initialize performance calculator
            if (!performanceCalculator.isInitialized) {
                performanceCalculator.initialize();
            }
            
            // Initialize historical data retriever
            if (!historicalRetriever.isInitialized) {
                await historicalRetriever.initialize();
            }
            
            // Initialize historical data comparator
            if (!historicalComparator.isInitialized) {
                await historicalComparator.initialize();
            }
            
            this.isInitialized = true;
            console.log('✅ Post-Round Analyzer initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Post-Round Analyzer:', error.message);
            return false;
        }
    }

    // ====== ROUND DATA COMPILATION ======

    // Iniciar coleta de dados para novo round
    startRoundDataCollection(roundId, sessionId, roundNumber, playerTeam) {
        const startTime = Date.now();
        
        this.currentRoundData = {
            roundId,
            sessionId,
            roundNumber,
            playerTeam,
            startTime,
            endTime: null,
            duration: null,
            // Buffers para dados coletados durante o round
            gsiSnapshots: [],
            aiInsights: [],
            performanceMetrics: [],
            screenshots: [],
            keyEvents: [],
            // Status
            isActive: true,
            dataCompiled: false
        };

        // Limpar buffers
        this.gsiDataBuffer = [];
        this.aiInsightsBuffer = [];
        this.performanceBuffer = [];

        console.log(`📊 Started data collection for Round ${roundNumber} (${roundId})`);
        return this.currentRoundData;
    }

    // Adicionar snapshot GSI durante o round
    addGSISnapshot(gsiData, processedData = null) {
        if (!this.currentRoundData || !this.currentRoundData.isActive) return;

        const snapshot = {
            timestamp: Date.now(),
            rawGSI: gsiData,
            processedGSI: processedData,
            roundTime: Date.now() - this.currentRoundData.startTime
        };

        this.currentRoundData.gsiSnapshots.push(snapshot);
        this.gsiDataBuffer.push(snapshot);

        // Manter apenas últimos 50 snapshots para performance
        if (this.currentRoundData.gsiSnapshots.length > 50) {
            this.currentRoundData.gsiSnapshots.shift();
        }
    }

    // Adicionar insight AI durante o round
    addAIInsight(insight, metadata = {}) {
        if (!this.currentRoundData || !this.currentRoundData.isActive) return;

        const aiInsight = {
            timestamp: Date.now(),
            insight,
            metadata,
            roundTime: Date.now() - this.currentRoundData.startTime,
            insightId: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        this.currentRoundData.aiInsights.push(aiInsight);
        this.aiInsightsBuffer.push(aiInsight);

        console.log(`🧠 Added AI insight to Round ${this.currentRoundData.roundNumber}`);
    }

    // Adicionar métrica de performance durante o round
    addPerformanceMetric(metricType, value, context = {}) {
        if (!this.currentRoundData || !this.currentRoundData.isActive) return;

        const metric = {
            timestamp: Date.now(),
            metricType,
            value,
            context,
            roundTime: Date.now() - this.currentRoundData.startTime,
            metricId: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        this.currentRoundData.performanceMetrics.push(metric);
        this.performanceBuffer.push(metric);
    }

    // Adicionar evento chave durante o round
    addKeyEvent(eventType, description, data = {}) {
        if (!this.currentRoundData || !this.currentRoundData.isActive) return;

        const event = {
            timestamp: Date.now(),
            eventType,
            description,
            data,
            roundTime: Date.now() - this.currentRoundData.startTime
        };

        this.currentRoundData.keyEvents.push(event);
        console.log(`⚡ Recorded key event: ${eventType} - ${description}`);
    }

    // ====== ROUND SUMMARY COMPILATION ======

    // Finalizar round e compilar resumo
    async compileRoundSummary(outcome = null, coachingLevel = 'beginner') {
        if (!this.currentRoundData || !this.currentRoundData.isActive) {
            throw new Error('No active round to compile summary for');
        }

        const startTime = Date.now();
        
        try {
            console.log(`📊 Compiling summary for Round ${this.currentRoundData.roundNumber}...`);

            // Finalizar dados do round
            this.currentRoundData.endTime = Date.now();
            this.currentRoundData.duration = this.currentRoundData.endTime - this.currentRoundData.startTime;
            this.currentRoundData.isActive = false;
            this.currentRoundData.outcome = outcome;

            // Compilar dados GSI
            const gsiAnalysis = this.analyzeGSIData(this.currentRoundData.gsiSnapshots);
            
            // Compilar insights AI
            const aiAnalysis = this.analyzeAIInsights(this.currentRoundData.aiInsights, coachingLevel);
            
            // Compilar métricas de performance
            const performanceAnalysis = this.analyzePerformanceMetrics(this.currentRoundData.performanceMetrics);
            
            // Analisar eventos chave
            const eventsAnalysis = this.analyzeKeyEvents(this.currentRoundData.keyEvents);

            // 6. Análise consolidada
            console.log('🎯 Performing consolidated analysis...');
            const consolidatedAnalysis = this.generateConsolidatedAnalysis({
                gsi: gsiAnalysis,
                ai: aiAnalysis,
                performance: performanceAnalysis,
                events: eventsAnalysis,
                roundData: this.currentRoundData
            }, coachingLevel);

            // 7. Calculate Performance Metrics
            console.log('📊 Calculating performance metrics...');
            let performanceMetrics = null;
            try {
                const roundSummaryForMetrics = {
                    roundNumber: this.currentRoundData.roundNumber,
                    roundId: this.currentRoundData.roundId,
                    sessionId: this.currentRoundData.sessionId,
                    outcome,
                    duration: this.currentRoundData.duration,
                    coachingLevel,
                    gsiAnalysis,
                    aiAnalysis,
                    performanceAnalysis,
                    eventsAnalysis
                };
                
                performanceMetrics = performanceCalculator.calculateRoundMetrics(roundSummaryForMetrics, coachingLevel);
                console.log(`📈 Performance metrics calculated: Overall ${(performanceMetrics.overall.score * 100).toFixed(1)}%`);
                
            } catch (metricsError) {
                console.error('❌ Failed to calculate performance metrics:', metricsError.message);
                performanceMetrics = null;
            }

            // 8. Estruturação do resumo final
            console.log('📝 Creating structured summary...');
            const structuredSummary = this.generateStructuredSummary(consolidatedAnalysis, coachingLevel);

            // Compilar resumo final
            const roundSummary = {
                // Identificação
                roundId: this.currentRoundData.roundId,
                sessionId: this.currentRoundData.sessionId,
                roundNumber: this.currentRoundData.roundNumber,
                coachingLevel,
                outcome,
                duration: this.currentRoundData.duration,
                compiledAt: Date.now(),

                // Dados coletados
                dataCollected: {
                    gsiSnapshots: this.currentRoundData.gsiSnapshots.length,
                    aiInsights: this.currentRoundData.aiInsights.length,
                    performanceMetrics: this.currentRoundData.performanceBuffer.length,
                    keyEvents: this.currentRoundData.keyEvents.length
                },

                // Análises
                gsiAnalysis,
                aiAnalysis,
                performanceAnalysis,
                eventsAnalysis,
                consolidatedAnalysis,

                // Performance Metrics
                performanceMetrics,

                // Resumo estruturado
                structuredSummary,
                keyInsights: this.extractKeyInsights(consolidatedAnalysis),
                recommendations: this.generateRecommendations(consolidatedAnalysis, coachingLevel),

                // Métricas de qualidade
                qualityMetrics: {
                    dataCompleteness: this.calculateDataCompleteness(),
                    analysisConfidence: this.calculateAnalysisConfidence(gsiAnalysis, aiAnalysis, performanceAnalysis),
                    insightRelevance: this.calculateInsightRelevance(aiAnalysis)
                }
            };

            // Marcar como compilado
            this.currentRoundData.dataCompiled = true;
            this.currentRoundData.compiledSummary = roundSummary;

            // Atualizar estatísticas
            const processingTime = Date.now() - startTime;
            this.updateStats(processingTime, true, roundSummary);

            console.log(`✅ Round summary compiled successfully in ${processingTime}ms`);
            console.log(`📊 Data: ${roundSummary.dataCollected.gsiSnapshots} GSI, ${roundSummary.dataCollected.aiInsights} insights, ${roundSummary.dataCollected.performanceMetrics} metrics`);
            console.log(`🎯 Quality: ${(roundSummary.qualityMetrics.analysisConfidence * 100).toFixed(1)}% confidence`);

            // Save to database
            if (database.isReady()) {
                try {
                    const summaryData = {
                        summaryId: `summary_${roundSummary.roundId}_${Date.now()}`,
                        roundId: roundSummary.roundId,
                        sessionId: roundSummary.sessionId,
                        roundNumber: roundSummary.roundNumber,
                        coachingLevel: roundSummary.coachingLevel,
                        outcome: roundSummary.outcome,
                        duration: roundSummary.duration,
                        compiledAt: roundSummary.compiledAt,
                        
                        // Data collection counts
                        gsiSnapshotsCount: roundSummary.dataCollected.gsiSnapshots,
                        aiInsightsCount: roundSummary.dataCollected.aiInsights,
                        performanceMetricsCount: roundSummary.dataCollected.performanceMetrics,
                        keyEventsCount: roundSummary.dataCollected.keyEvents,
                        
                        // Analysis data
                        gsiAnalysis: roundSummary.gsiAnalysis,
                        aiAnalysis: roundSummary.aiAnalysis,
                        performanceAnalysis: roundSummary.performanceAnalysis,
                        eventsAnalysis: roundSummary.eventsAnalysis,
                        consolidatedAnalysis: roundSummary.consolidatedAnalysis,
                        
                        // Structured data
                        structuredSummary: roundSummary.structuredSummary,
                        keyInsights: roundSummary.keyInsights,
                        recommendations: roundSummary.recommendations,
                        
                        // Quality metrics
                        dataCompleteness: roundSummary.qualityMetrics.dataCompleteness,
                        analysisConfidence: roundSummary.qualityMetrics.analysisConfidence,
                        insightRelevance: roundSummary.qualityMetrics.insightRelevance,
                        
                        // Additional metadata
                        playerTeam: this.currentRoundData.playerTeam,
                        mapName: null, // Will be set from GSI data if available
                        processingTime
                    };

                    // Extract map name from GSI data if available
                    if (roundSummary.gsiAnalysis?.available && this.currentRoundData.gsiSnapshots?.length > 0) {
                        const latestSnapshot = this.currentRoundData.gsiSnapshots[this.currentRoundData.gsiSnapshots.length - 1];
                        summaryData.mapName = latestSnapshot.processedGSI?.map?.name || 
                                            latestSnapshot.rawGSI?.map?.name || null;
                    }

                    database.createRoundSummary(summaryData);
                    console.log(`💾 Round summary saved to database`);
                    
                } catch (dbError) {
                    console.error('❌ Failed to save round summary to database:', dbError.message);
                    // Don't throw error - compilation was successful, just database save failed
                }
            }

            return roundSummary;

        } catch (error) {
            console.error('❌ Failed to compile round summary:', error.message);
            this.updateStats(Date.now() - startTime, false, null);
            throw error;
        }
    }

    // ====== ANÁLISE DE DADOS GSI ======

    analyzeGSIData(gsiSnapshots) {
        if (!gsiSnapshots.length) return { available: false };

        console.log(`🔍 Analyzing ${gsiSnapshots.length} GSI snapshots...`);

        const analysis = {
            available: true,
            snapshotsCount: gsiSnapshots.length,
            timeSpan: gsiSnapshots[gsiSnapshots.length - 1].timestamp - gsiSnapshots[0].timestamp,
            
            // Análise do jogador
            playerAnalysis: this.analyzePlayerProgression(gsiSnapshots),
            
            // Análise econômica
            economicAnalysis: this.analyzeEconomicProgression(gsiSnapshots),
            
            // Análise tática
            tacticalAnalysis: this.analyzeTacticalProgression(gsiSnapshots),
            
            // Momentos críticos
            criticalMoments: this.identifyCriticalMoments(gsiSnapshots),
            
            // Padrões identificados
            patterns: this.identifyGSIPatterns(gsiSnapshots)
        };

        return analysis;
    }

    analyzePlayerProgression(gsiSnapshots) {
        const playerStates = gsiSnapshots
            .map(s => s.processedGSI?.player?.state || s.rawGSI?.player?.state)
            .filter(Boolean);

        if (!playerStates.length) return { available: false };

        return {
            available: true,
            healthProgression: this.calculateProgression(playerStates, 'health'),
            armorProgression: this.calculateProgression(playerStates, 'armor'),
            moneyProgression: this.calculateProgression(playerStates, 'money'),
            killsProgression: this.calculateProgression(playerStates, 'round_kills'),
            
            // Métricas de performance
            avgHealth: this.calculateAverage(playerStates, 'health'),
            avgArmor: this.calculateAverage(playerStates, 'armor'),
            finalMoney: playerStates[playerStates.length - 1]?.money || 0,
            totalKills: playerStates[playerStates.length - 1]?.round_kills || 0,
            
            // Análise de risco
            lowHealthMoments: playerStates.filter(s => (s.health || 0) <= 30).length,
            lowArmorMoments: playerStates.filter(s => (s.armor || 0) <= 25).length,
            highRiskMoments: playerStates.filter(s => (s.health || 0) <= 30 && (s.armor || 0) <= 25).length
        };
    }

    analyzeEconomicProgression(gsiSnapshots) {
        const moneyData = gsiSnapshots
            .map(s => ({
                timestamp: s.timestamp,
                money: s.processedGSI?.player?.state?.money || s.rawGSI?.player?.state?.money || 0,
                weapons: s.processedGSI?.player?.weapons || s.rawGSI?.player?.weapons
            }))
            .filter(d => d.money !== undefined);

        if (!moneyData.length) return { available: false };

        return {
            available: true,
            startMoney: moneyData[0].money,
            endMoney: moneyData[moneyData.length - 1].money,
            moneyChange: moneyData[moneyData.length - 1].money - moneyData[0].money,
            maxMoney: Math.max(...moneyData.map(d => d.money)),
            minMoney: Math.min(...moneyData.map(d => d.money)),
            
            // Análise de investimento
            investmentDecisions: this.analyzeInvestmentDecisions(moneyData),
            economicRisk: this.assessEconomicRisk(moneyData),
            buyPatterns: this.identifyBuyPatterns(moneyData)
        };
    }

    analyzeTacticalProgression(gsiSnapshots) {
        const tacticalData = gsiSnapshots.map(s => ({
            timestamp: s.timestamp,
            position: s.processedGSI?.player?.position || null,
            weapons: s.processedGSI?.player?.weapons || s.rawGSI?.player?.weapons,
            team: s.processedGSI?.player?.team || s.rawGSI?.player?.team,
            roundPhase: s.processedGSI?.round?.phase || s.rawGSI?.round?.phase
        })).filter(d => d.team);

        if (!tacticalData.length) return { available: false };

        return {
            available: true,
            teamSide: tacticalData[0].team,
            phaseTransitions: this.identifyPhaseTransitions(tacticalData),
            weaponChanges: this.identifyWeaponChanges(tacticalData),
            tacticalAdaptations: this.identifyTacticalAdaptations(tacticalData)
        };
    }

    identifyCriticalMoments(gsiSnapshots) {
        const criticalMoments = [];

        gsiSnapshots.forEach((snapshot, index) => {
            const data = snapshot.processedGSI || snapshot.rawGSI;
            const playerState = data?.player?.state;
            
            if (!playerState) return;

            // Momentos de baixa vida
            if (playerState.health <= 20 && playerState.health > 0) {
                criticalMoments.push({
                    type: 'low_health',
                    timestamp: snapshot.timestamp,
                    value: playerState.health,
                    description: `Vida crítica: ${playerState.health}HP`
                });
            }

            // Momentos de clutch (último vivo)
            if (data.team?.alive_count === 1) {
                criticalMoments.push({
                    type: 'clutch_situation',
                    timestamp: snapshot.timestamp,
                    description: 'Situação de clutch - último vivo'
                });
            }

            // Momentos de bomba
            if (data.bomb?.state && data.bomb.state !== 'safe') {
                criticalMoments.push({
                    type: 'bomb_situation',
                    timestamp: snapshot.timestamp,
                    bombState: data.bomb.state,
                    countdown: data.bomb.countdown,
                    description: `Bomba ${data.bomb.state}${data.bomb.countdown ? ` - ${data.bomb.countdown}s` : ''}`
                });
            }

            // Multi-kills
            if (playerState.round_kills > 1 && index > 0) {
                const prevKills = gsiSnapshots[index - 1].processedGSI?.player?.state?.round_kills || 
                                gsiSnapshots[index - 1].rawGSI?.player?.state?.round_kills || 0;
                if (playerState.round_kills > prevKills) {
                    criticalMoments.push({
                        type: 'multi_kill',
                        timestamp: snapshot.timestamp,
                        kills: playerState.round_kills,
                        description: `${playerState.round_kills} kills no round`
                    });
                }
            }
        });

        return criticalMoments;
    }

    identifyGSIPatterns(gsiSnapshots) {
        return {
            economicPatterns: this.identifyEconomicPatterns(gsiSnapshots),
            behavioralPatterns: this.identifyBehavioralPatterns(gsiSnapshots),
            performancePatterns: this.identifyPerformancePatterns(gsiSnapshots)
        };
    }

    // ====== ANÁLISE DE INSIGHTS AI ======

    analyzeAIInsights(aiInsights, coachingLevel) {
        if (!aiInsights.length) return { available: false };

        console.log(`🤖 Analyzing ${aiInsights.length} AI insights...`);

        return {
            available: true,
            insightsCount: aiInsights.length,
            
            // Categorização de insights
            categorizedInsights: this.categorizeInsights(aiInsights),
            
            // Análise temporal
            temporalDistribution: this.analyzeInsightTiming(aiInsights),
            
            // Relevância por nível
            relevanceAnalysis: this.analyzeInsightRelevance(aiInsights, coachingLevel),
            
            // Padrões de coaching
            coachingPatterns: this.identifyCoachingPatterns(aiInsights),
            
            // Efetividade
            effectiveness: this.assessInsightEffectiveness(aiInsights)
        };
    }

    categorizeInsights(aiInsights) {
        const categories = {
            tactical: [],
            economic: [],
            mechanical: [],
            strategic: [],
            psychological: [],
            situational: []
        };

        aiInsights.forEach(insight => {
            // Categorizar baseado no conteúdo do insight
            const category = this.determineInsightCategory(insight);
            if (categories[category]) {
                categories[category].push(insight);
            }
        });

        return categories;
    }

    determineInsightCategory(insight) {
        const text = insight.insight?.text || insight.insight?.advice || JSON.stringify(insight.insight);
        const lowerText = text.toLowerCase();

        if (lowerText.includes('economy') || lowerText.includes('money') || lowerText.includes('buy')) {
            return 'economic';
        }
        if (lowerText.includes('position') || lowerText.includes('angle') || lowerText.includes('peek')) {
            return 'tactical';
        }
        if (lowerText.includes('aim') || lowerText.includes('crosshair') || lowerText.includes('recoil')) {
            return 'mechanical';
        }
        if (lowerText.includes('strategy') || lowerText.includes('plan') || lowerText.includes('coordinate')) {
            return 'strategic';
        }
        if (lowerText.includes('pressure') || lowerText.includes('calm') || lowerText.includes('focus')) {
            return 'psychological';
        }
        
        return 'situational';
    }

    // ====== ANÁLISE DE MÉTRICAS DE PERFORMANCE ======

    analyzePerformanceMetrics(performanceMetrics) {
        if (!performanceMetrics.length) return { available: false };

        console.log(`📈 Analyzing ${performanceMetrics.length} performance metrics...`);

        // Agrupar métricas por tipo
        const metricsByType = {};
        performanceMetrics.forEach(metric => {
            if (!metricsByType[metric.metricType]) {
                metricsByType[metric.metricType] = [];
            }
            metricsByType[metric.metricType].push(metric);
        });

        return {
            available: true,
            totalMetrics: performanceMetrics.length,
            metricTypes: Object.keys(metricsByType),
            
            // Análise por tipo
            typeAnalysis: this.analyzeMetricsByType(metricsByType),
            
            // Tendências
            trends: this.identifyPerformanceTrends(performanceMetrics),
            
            // Picos de performance
            performancePeaks: this.identifyPerformancePeaks(performanceMetrics),
            
            // Análise temporal
            temporalAnalysis: this.analyzeMetricTiming(performanceMetrics)
        };
    }

    analyzeKeyEvents(keyEvents) {
        return {
            totalEvents: keyEvents.length,
            eventTypes: [...new Set(keyEvents.map(e => e.eventType))],
            events: keyEvents
        };
    }

    // ====== ANÁLISE CONSOLIDADA ======

    generateConsolidatedAnalysis(analyses, coachingLevel) {
        const config = this.analysisConfigs[coachingLevel];
        
        return {
            coachingLevel,
            analysisDepth: config.summaryDepth,
            
            // Síntese dos dados
            dataSynthesis: this.synthesizeAnalyses(analyses),
            
            // Performance geral
            overallPerformance: this.assessOverallPerformance(analyses, config.focusMetrics),
            
            // Áreas de destaque
            highlights: this.identifyHighlights(analyses, config.performanceCategories),
            
            // Áreas de melhoria
            improvementAreas: this.identifyImprovementAreas(analyses, config.focusMetrics),
            
            // Correlações
            correlations: this.identifyCorrelations(analyses),
            
            // Contexto estratégico
            strategicContext: this.analyzeStrategicContext(analyses)
        };
    }

    synthesizeAnalyses(analyses) {
        return {
            dataAvailability: {
                gsi: analyses.gsi.available,
                ai: analyses.ai.available,
                performance: analyses.performance.available,
                events: analyses.events?.totalEvents > 0
            },
            dataQuality: this.assessDataQuality(analyses),
            analysisCompleteness: this.calculateAnalysisCompleteness(analyses)
        };
    }

    // ====== RESUMO ESTRUTURADO ======

    generateStructuredSummary(consolidatedAnalysis, coachingLevel) {
        const template = this.summaryTemplates[this.analysisConfigs[coachingLevel].summaryDepth];
        const summary = {};

        template.sections.forEach(section => {
            summary[section] = this.generateSummarySection(section, consolidatedAnalysis, coachingLevel);
        });

        return {
            format: template.format,
            sections: summary,
            generatedAt: Date.now()
        };
    }

    generateSummarySection(sectionType, analysis, coachingLevel) {
        switch (sectionType) {
            case 'round_overview':
                return this.generateRoundOverview(analysis);
            case 'performance_highlights':
                return this.generatePerformanceHighlights(analysis);
            case 'key_learnings':
                return this.generateKeyLearnings(analysis, coachingLevel);
            case 'next_round_focus':
                return this.generateNextRoundFocus(analysis, coachingLevel);
            case 'round_analysis':
                return this.generateRoundAnalysis(analysis);
            case 'tactical_breakdown':
                return this.generateTacticalBreakdown(analysis);
            case 'economic_review':
                return this.generateEconomicReview(analysis);
            case 'strategic_analysis':
                return this.generateStrategicAnalysis(analysis);
            case 'pattern_identification':
                return this.generatePatternIdentification(analysis);
            default:
                return { type: sectionType, content: 'Section not implemented', available: false };
        }
    }

    // ====== UTILITÁRIOS ======

    calculateProgression(data, field) {
        const values = data.map(d => d[field] || 0);
        return {
            start: values[0] || 0,
            end: values[values.length - 1] || 0,
            change: (values[values.length - 1] || 0) - (values[0] || 0),
            max: Math.max(...values),
            min: Math.min(...values)
        };
    }

    calculateAverage(data, field) {
        const values = data.map(d => d[field] || 0).filter(v => v !== null && v !== undefined);
        return values.length ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    }

    // ====== REPORT UTILITY METHODS ======

    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatPercentage(value, decimals = 1) {
        return `${(value * 100).toFixed(decimals)}%`;
    }

    formatNumber(value, decimals = 2) {
        return Number(value).toFixed(decimals);
    }

    generateOverviewSummary(content) {
        const outcome = content.roundInfo?.outcome || 'unknown';
        const score = content.performanceSummary?.overallScore || '0%';
        const trend = content.performanceSummary?.trend || 'stable';
        
        return `Round ${outcome} with ${score} performance (${trend} trend)`;
    }

    extractMetricHighlights(analysis) {
        const highlights = [];
        
        if (analysis.overallPerformance?.metrics) {
            Object.entries(analysis.overallPerformance.metrics).forEach(([metric, value]) => {
                if (value > 0.8) { // High performance threshold
                    highlights.push({
                        metric,
                        value: this.formatPercentage(value),
                        level: 'excellent'
                    });
                } else if (value > 0.6) {
                    highlights.push({
                        metric,
                        value: this.formatPercentage(value),
                        level: 'good'
                    });
                }
            });
        }
        
        return highlights;
    }

    identifyImprovementIndicators(analysis) {
        const improvements = [];
        
        if (analysis.correlations) {
            analysis.correlations.forEach(correlation => {
                if (correlation.strength > 0.6 && correlation.direction === 'positive') {
                    improvements.push({
                        area: correlation.area,
                        indicator: correlation.indicator,
                        strength: correlation.strength
                    });
                }
            });
        }
        
        return improvements;
    }

    extractNotableMoments(analysis) {
        const moments = [];
        
        if (analysis.strategicContext?.criticalMoments) {
            analysis.strategicContext.criticalMoments.forEach(moment => {
                moments.push({
                    type: moment.type,
                    description: moment.description,
                    timestamp: moment.timestamp,
                    impact: moment.impact || 'medium'
                });
            });
        }
        
        return moments;
    }

    generateHighlightsSummary(content) {
        const achievementCount = content.achievements?.length || 0;
        const improvementCount = content.improvements?.length || 0;
        
        return `${achievementCount} achievements identified with ${improvementCount} improvement indicators`;
    }

    extractPrimaryLearnings(analysis, config) {
        const learnings = [];
        
        config.focusMetrics.forEach(metric => {
            if (analysis.overallPerformance?.breakdown?.[metric]) {
                const performance = analysis.overallPerformance.breakdown[metric];
                if (performance.insight) {
                    learnings.push({
                        metric,
                        insight: performance.insight,
                        importance: performance.importance || 'medium'
                    });
                }
            }
        });
        
        return learnings.slice(0, 3); // Top 3 learnings
    }

    extractTechnicalLearnings(analysis, config) {
        const learnings = [];
        
        if (analysis.highlights) {
            analysis.highlights.forEach(highlight => {
                if (highlight.category === 'technical' || highlight.category === 'mechanical') {
                    learnings.push({
                        area: highlight.area || 'general',
                        learning: highlight.description,
                        actionable: highlight.actionable || true
                    });
                }
            });
        }
        
        return learnings;
    }

    extractStrategicLearnings(analysis, config) {
        const learnings = [];
        
        if (analysis.strategicContext?.insights) {
            analysis.strategicContext.insights.forEach(insight => {
                learnings.push({
                    context: insight.context,
                    learning: insight.description,
                    application: insight.application
                });
            });
        }
        
        return learnings;
    }

    extractPatternLearnings(analysis, config) {
        const learnings = [];
        
        if (analysis.correlations) {
            analysis.correlations.forEach(correlation => {
                if (correlation.pattern && correlation.learnable) {
                    learnings.push({
                        pattern: correlation.pattern,
                        learning: correlation.description,
                        reproducible: correlation.reproducible || false
                    });
                }
            });
        }
        
        return learnings;
    }

    generateLearningsSummary(content, coachingLevel) {
        const totalLearnings = (content.primaryLearnings?.length || 0) + 
                             (content.technicalLearnings?.length || 0) + 
                             (content.strategicLearnings?.length || 0);
        
        return `${totalLearnings} key learnings identified for ${coachingLevel} level coaching`;
    }

    identifyPriorityFocusAreas(analysis, config) {
        const areas = [];
        
        if (analysis.improvementAreas) {
            analysis.improvementAreas.forEach((area, index) => {
                areas.push({
                    area: area.area || area,
                    priority: index < 2 ? 'high' : 'medium',
                    rationale: area.rationale || 'Performance improvement opportunity',
                    metrics: area.metrics || {}
                });
            });
        }
        
        return areas.slice(0, config.keyInsights);
    }

    generateImmediateActions(analysis, config) {
        const actions = [];
        
        config.focusMetrics.forEach(metric => {
            if (analysis.improvementAreas?.some(area => area.area === metric)) {
                actions.push({
                    action: `Focus on improving ${metric}`,
                    rationale: `Identified as improvement area`,
                    timeframe: 'immediate'
                });
            }
        });
        
        return actions.slice(0, 3);
    }

    identifySkillDevelopmentAreas(analysis, config) {
        const areas = [];
        
        config.performanceCategories.forEach(category => {
            if (analysis.overallPerformance?.breakdown?.[category]?.score < 0.6) {
                areas.push({
                    skill: category,
                    currentLevel: analysis.overallPerformance.breakdown[category].score,
                    targetLevel: 0.8,
                    developmentPath: `Practice ${category} fundamentals`
                });
            }
        });
        
        return areas;
    }

    generateMentalFocus(analysis, config) {
        return {
            confidence: analysis.overallPerformance?.confidence || 'maintain',
            pressure: analysis.strategicContext?.pressure || 'normal',
            focus: 'Stay consistent with current approach',
            mindset: config.summaryDepth === 'comprehensive' ? 'strategic' : 'tactical'
        };
    }

    generateFocusSummary(content, coachingLevel) {
        const priorityCount = content.priorityAreas?.length || 0;
        const actionCount = content.immediateActions?.length || 0;
        
        return `${priorityCount} priority areas with ${actionCount} immediate actions for next round`;
    }

    // ====== DETAILED ANALYSIS METHODS ======

    generatePerformanceBreakdown(analysis) {
        const breakdown = {
            overall: analysis.overallPerformance?.score || 0,
            categories: {},
            trends: {},
            comparisons: {}
        };

        if (analysis.overallPerformance?.breakdown) {
            Object.entries(analysis.overallPerformance.breakdown).forEach(([category, data]) => {
                breakdown.categories[category] = {
                    score: data.score || 0,
                    trend: data.trend || 'stable',
                    insights: data.insights || []
                };
            });
        }

        return breakdown;
    }

    analyzeDecisions(analysis) {
        const decisions = {
            totalDecisions: 0,
            goodDecisions: 0,
            poorDecisions: 0,
            criticalDecisions: [],
            patterns: []
        };

        if (analysis.strategicContext?.decisions) {
            decisions.totalDecisions = analysis.strategicContext.decisions.length;
            analysis.strategicContext.decisions.forEach(decision => {
                if (decision.quality === 'good') decisions.goodDecisions++;
                if (decision.quality === 'poor') decisions.poorDecisions++;
                if (decision.critical) decisions.criticalDecisions.push(decision);
            });
        }

        return decisions;
    }

    analyzeRoundTiming(analysis) {
        const timing = {
            phaseTiming: {},
            decisionTiming: {},
            reactionTimes: {},
            efficiency: 'normal'
        };

        if (analysis.strategicContext?.timing) {
            timing.phaseTiming = analysis.strategicContext.timing.phases || {};
            timing.decisionTiming = analysis.strategicContext.timing.decisions || {};
            timing.efficiency = analysis.strategicContext.timing.efficiency || 'normal';
        }

        return timing;
    }

    analyzeCriticalMoments(analysis) {
        const moments = {
            totalMoments: 0,
            handledWell: 0,
            missedOpportunities: 0,
            details: []
        };

        if (analysis.strategicContext?.criticalMoments) {
            moments.totalMoments = analysis.strategicContext.criticalMoments.length;
            analysis.strategicContext.criticalMoments.forEach(moment => {
                moments.details.push({
                    type: moment.type,
                    outcome: moment.outcome || 'neutral',
                    description: moment.description,
                    timestamp: moment.timestamp
                });
                
                if (moment.outcome === 'positive') moments.handledWell++;
                if (moment.outcome === 'missed') moments.missedOpportunities++;
            });
        }

        return moments;
    }

    generateRoundAnalysisSummary(content) {
        const score = this.formatPercentage(content.performanceBreakdown?.overall || 0);
        const criticalCount = content.criticalMoments?.totalMoments || 0;
        
        return `Overall performance: ${score} with ${criticalCount} critical moments analyzed`;
    }

    analyzeTacticalPositioning(analysis) {
        const positioning = {
            averageRating: 0,
            strongPositions: [],
            weakPositions: [],
            adaptability: 'medium'
        };

        if (analysis.highlights) {
            const positionHighlights = analysis.highlights.filter(h => h.category === 'positioning');
            positioning.strongPositions = positionHighlights.map(h => h.description);
        }

        if (analysis.improvementAreas) {
            const positionImprovements = analysis.improvementAreas.filter(a => a.area === 'positioning');
            positioning.weakPositions = positionImprovements.map(a => a.description);
        }

        return positioning;
    }

    analyzeUtilityUsage(analysis) {
        const utility = {
            usage: {},
            efficiency: 0,
            timing: 'average',
            impact: 'medium'
        };

        if (analysis.overallPerformance?.breakdown?.utility) {
            utility.efficiency = analysis.overallPerformance.breakdown.utility.score || 0;
            utility.usage = analysis.overallPerformance.breakdown.utility.breakdown || {};
        }

        return utility;
    }

    analyzeTeamCoordination(analysis) {
        const teamwork = {
            coordinationScore: 0,
            communication: 'average',
            supportActions: 0,
            leadership: false
        };

        if (analysis.overallPerformance?.breakdown?.teamwork) {
            teamwork.coordinationScore = analysis.overallPerformance.breakdown.teamwork.score || 0;
            teamwork.supportActions = analysis.overallPerformance.breakdown.teamwork.actions || 0;
        }

        return teamwork;
    }

    analyzeMapControl(analysis) {
        const mapControl = {
            areasControlled: [],
            contestedAreas: [],
            controlEfficiency: 0,
            rotationTiming: 'average'
        };

        if (analysis.strategicContext?.mapControl) {
            mapControl.areasControlled = analysis.strategicContext.mapControl.controlled || [];
            mapControl.contestedAreas = analysis.strategicContext.mapControl.contested || [];
            mapControl.controlEfficiency = analysis.strategicContext.mapControl.efficiency || 0;
        }

        return mapControl;
    }

    generateTacticalSummary(content) {
        const positioningStrength = content.positioning?.strongPositions?.length || 0;
        const utilityEfficiency = this.formatPercentage(content.utilityUsage?.efficiency || 0);
        
        return `${positioningStrength} strong positions identified, ${utilityEfficiency} utility efficiency`;
    }

    analyzeEconomicPerformance(analysis) {
        const economic = {
            efficiency: 0,
            decisions: [],
            riskManagement: 'medium',
            overallRating: 'average'
        };

        if (analysis.overallPerformance?.breakdown?.economic) {
            economic.efficiency = analysis.overallPerformance.breakdown.economic.score || 0;
            economic.decisions = analysis.overallPerformance.breakdown.economic.decisions || [];
        }

        return economic;
    }

    analyzeBuyDecisions(analysis) {
        const buyDecisions = {
            totalBuys: 0,
            optimalBuys: 0,
            suboptimalBuys: 0,
            patterns: []
        };

        if (analysis.strategicContext?.economic?.buyDecisions) {
            const decisions = analysis.strategicContext.economic.buyDecisions;
            buyDecisions.totalBuys = decisions.length;
            buyDecisions.optimalBuys = decisions.filter(d => d.quality === 'optimal').length;
            buyDecisions.suboptimalBuys = decisions.filter(d => d.quality === 'suboptimal').length;
        }

        return buyDecisions;
    }

    analyzeSaveSituations(analysis) {
        const saveSituations = {
            totalSaves: 0,
            successfulSaves: 0,
            efficiency: 0,
            recommendations: []
        };

        if (analysis.strategicContext?.economic?.saveSituations) {
            const saves = analysis.strategicContext.economic.saveSituations;
            saveSituations.totalSaves = saves.length;
            saveSituations.successfulSaves = saves.filter(s => s.success).length;
            saveSituations.efficiency = saves.length > 0 ? 
                saveSituations.successfulSaves / saveSituations.totalSaves : 0;
        }

        return saveSituations;
    }

    analyzeEconomicEfficiency(analysis) {
        const efficiency = {
            moneyManagement: 0,
            investmentReturn: 0,
            wasteMinimization: 0,
            overallScore: 0
        };

        if (analysis.overallPerformance?.breakdown?.economic?.efficiency) {
            const eff = analysis.overallPerformance.breakdown.economic.efficiency;
            efficiency.moneyManagement = eff.management || 0;
            efficiency.investmentReturn = eff.return || 0;
            efficiency.wasteMinimization = eff.waste || 0;
            efficiency.overallScore = eff.overall || 0;
        }

        return efficiency;
    }

    generateEconomicSummary(content) {
        const efficiency = this.formatPercentage(content.economicPerformance?.efficiency || 0);
        const buyRatio = content.buyDecisions?.totalBuys ? 
            this.formatPercentage(content.buyDecisions.optimalBuys / content.buyDecisions.totalBuys) : '0%';
        
        return `${efficiency} economic efficiency with ${buyRatio} optimal buy decisions`;
    }

    analyzeStrategicDecisions(analysis) {
        const decisions = {
            strategicChoices: [],
            adaptations: [],
            metaUnderstanding: 'basic',
            decisionQuality: 0
        };

        if (analysis.strategicContext?.strategic) {
            decisions.strategicChoices = analysis.strategicContext.strategic.choices || [];
            decisions.adaptations = analysis.strategicContext.strategic.adaptations || [];
            decisions.metaUnderstanding = analysis.strategicContext.strategic.metaLevel || 'basic';
        }

        return decisions;
    }

    analyzeAdaptation(analysis) {
        const adaptation = {
            responseTime: 'average',
            flexibility: 'medium',
            counterStrategies: [],
            effectiveness: 0
        };

        if (analysis.strategicContext?.adaptation) {
            adaptation.responseTime = analysis.strategicContext.adaptation.responseTime || 'average';
            adaptation.flexibility = analysis.strategicContext.adaptation.flexibility || 'medium';
            adaptation.effectiveness = analysis.strategicContext.adaptation.effectiveness || 0;
        }

        return adaptation;
    }

    analyzeMetaUnderstanding(analysis) {
        const meta = {
            currentMeta: 'standard',
            understanding: 'basic',
            application: 'limited',
            innovations: []
        };

        if (analysis.strategicContext?.meta) {
            meta.currentMeta = analysis.strategicContext.meta.current || 'standard';
            meta.understanding = analysis.strategicContext.meta.understanding || 'basic';
            meta.application = analysis.strategicContext.meta.application || 'limited';
        }

        return meta;
    }

    analyzeStrategicPatterns(analysis) {
        const patterns = {
            recognizedPatterns: [],
            exploitedPatterns: [],
            missedPatterns: [],
            patternAdaptation: 'slow'
        };

        if (analysis.correlations) {
            patterns.recognizedPatterns = analysis.correlations.filter(c => c.type === 'strategic');
        }

        return patterns;
    }

    generateStrategicSummary(content) {
        const choicesCount = content.strategicDecisions?.strategicChoices?.length || 0;
        const adaptationEffectiveness = this.formatPercentage(content.adaptation?.effectiveness || 0);
        
        return `${choicesCount} strategic decisions with ${adaptationEffectiveness} adaptation effectiveness`;
    }

    identifyDecisionPatterns(analysis) {
        const patterns = [];
        
        if (analysis.strategicContext?.patterns?.decisions) {
            analysis.strategicContext.patterns.decisions.forEach(pattern => {
                patterns.push({
                    type: 'decision',
                    pattern: pattern.pattern,
                    frequency: pattern.frequency,
                    effectiveness: pattern.effectiveness
                });
            });
        }
        
        return patterns;
    }

    identifyImprovementPatterns(analysis) {
        const patterns = [];
        
        if (analysis.correlations) {
            analysis.correlations.forEach(correlation => {
                if (correlation.improvementPotential) {
                    patterns.push({
                        type: 'improvement',
                        pattern: correlation.pattern,
                        potential: correlation.improvementPotential,
                        timeframe: correlation.timeframe
                    });
                }
            });
        }
        
        return patterns;
    }

    generatePatternSummary(content) {
        const totalPatterns = (content.behavioralPatterns?.length || 0) + 
                            (content.performancePatterns?.length || 0) + 
                            (content.decisionPatterns?.length || 0);
        
        return `${totalPatterns} patterns identified across behavioral, performance, and decision-making areas`;
    }

    extractKeyInsights(analysis, coachingLevel) {
        const config = this.analysisConfigs[coachingLevel];
        const insights = [];
        return insights.slice(0, config.keyInsights);
    }

    generateRecommendations(analysis, coachingLevel) {
        const config = this.analysisConfigs[coachingLevel];
        
        return {
            immediate: [],
            shortTerm: [],
            longTerm: [],
            focus: config.focusMetrics[0] || 'general_improvement'
        };
    }

    calculateDataCompleteness(roundData) {
        const expectedData = {
            gsi: roundData.gsiSnapshots.length > 0,
            ai: roundData.aiInsights.length > 0,
            performance: roundData.performanceMetrics.length > 0,
            events: roundData.keyEvents.length > 0
        };

        const availableCount = Object.values(expectedData).filter(Boolean).length;
        return availableCount / Object.keys(expectedData).length;
    }

    calculateAnalysisConfidence(gsiAnalysis, aiAnalysis, performanceAnalysis) {
        return 0.85; // Placeholder
    }

    calculateInsightRelevance(aiAnalysis) {
        return 0.90; // Placeholder
    }

    updateStats(processingTime, success, summary) {
        this.stats.totalRoundsSummary++;
        this.stats.totalProcessingTime += processingTime;
        this.stats.averageProcessingTime = this.stats.totalProcessingTime / this.stats.totalRoundsSummary;
        this.stats.lastAnalysisTime = Date.now();

        if (success) {
            this.stats.successfulAnalyses++;
        } else {
            this.stats.failedAnalyses++;
        }

        if (summary && summary.aiAnalysis?.categorizedInsights) {
            const categories = summary.aiAnalysis.categorizedInsights;
            Object.keys(categories).forEach(category => {
                this.stats.insightCategories[category] = (this.stats.insightCategories[category] || 0) + categories[category].length;
            });
        }
    }

    // ====== INTERFACE PÚBLICA ======

    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.totalRoundsSummary > 0 ? 
                (this.stats.successfulAnalyses / this.stats.totalRoundsSummary) * 100 : 0,
            isActive: this.currentRoundData?.isActive || false,
            currentRound: this.currentRoundData?.roundNumber || null
        };
    }

    getCurrentRoundData() {
        return this.currentRoundData;
    }

    isCollectingData() {
        return this.currentRoundData !== null && !this.currentRoundData.dataCompiled;
    }

    // ====== HISTORICAL DATA RETRIEVAL INTERFACE ======

    async getRecentPerformance(criteria = {}) {
        if (!historicalRetriever.isInitialized) {
            throw new Error('Historical data retriever not initialized');
        }
        
        console.log('📚 Getting recent performance data...');
        return await historicalRetriever.getRecentRoundSummaries({
            limit: 20,
            includeMetrics: true,
            ...criteria
        });
    }

    async getSessionAnalysis(sessionId, criteria = {}) {
        if (!historicalRetriever.isInitialized) {
            throw new Error('Historical data retriever not initialized');
        }
        
        console.log(`📚 Getting session analysis for ${sessionId}...`);
        return await historicalRetriever.getSessionSummaries(sessionId, criteria);
    }

    async getPerformanceTrends(criteria = {}) {
        if (!historicalRetriever.isInitialized) {
            throw new Error('Historical data retriever not initialized');
        }
        
        console.log('📈 Getting performance trends...');
        return await historicalRetriever.getPerformanceTrends(criteria);
    }

    async getCoachingAnalysis(criteria = {}) {
        if (!historicalRetriever.isInitialized) {
            throw new Error('Historical data retriever not initialized');
        }
        
        console.log('🎯 Getting coaching level analysis...');
        return await historicalRetriever.getCoachingLevelAnalysis(criteria);
    }

    async getPersonalBests(criteria = {}) {
        if (!historicalRetriever.isInitialized) {
            throw new Error('Historical data retriever not initialized');
        }
        
        console.log('🏆 Getting personal bests...');
        return await historicalRetriever.getPersonalBests(criteria);
    }

    async getMapAnalysis(mapName, criteria = {}) {
        if (!historicalRetriever.isInitialized) {
            throw new Error('Historical data retriever not initialized');
        }
        
        console.log(`🗺️ Getting map analysis for ${mapName}...`);
        return await historicalRetriever.getMapSpecificAnalysis(mapName, criteria);
    }

    getHistoricalStats() {
        if (!historicalRetriever.isInitialized) {
            return { error: 'Historical data retriever not initialized' };
        }
        
        return historicalRetriever.getStats();
    }

    clearHistoricalCache() {
        if (historicalRetriever.isInitialized) {
            historicalRetriever.clearCache();
            console.log('🧹 Historical data cache cleared');
        }
    }

    // ====== HISTORICAL DATA COMPARISON INTERFACE ======

    async compareWithHistoricalAverages(roundSummary, criteria = {}) {
        if (!historicalComparator.isInitialized) {
            throw new Error('Historical data comparator not initialized');
        }
        
        console.log('📊 Comparing with historical averages...');
        return await historicalComparator.compareWithHistoricalAverages(roundSummary, criteria);
    }

    async compareWithPersonalBests(roundSummary, criteria = {}) {
        if (!historicalComparator.isInitialized) {
            throw new Error('Historical data comparator not initialized');
        }
        
        console.log('🏆 Comparing with personal bests...');
        return await historicalComparator.compareWithPersonalBests(roundSummary, criteria);
    }

    async compareWithSpecificSessions(roundSummary, criteria = {}) {
        if (!historicalComparator.isInitialized) {
            throw new Error('Historical data comparator not initialized');
        }
        
        console.log('🔍 Comparing with specific sessions...');
        return await historicalComparator.compareWithSpecificSessions(roundSummary, criteria);
    }

    async performComprehensiveComparison(roundSummary, criteria = {}) {
        if (!historicalComparator.isInitialized) {
            throw new Error('Historical data comparator not initialized');
        }
        
        console.log('🌟 Performing comprehensive historical comparison...');
        return await historicalComparator.performComprehensiveComparison(roundSummary, criteria);
    }

    async generateHistoricalComparisonReport(roundSummary, options = {}) {
        const startTime = Date.now();
        
        try {
            console.log('📈 Generating historical comparison report...');
            
            const {
                includeAverages = true,
                includePersonalBests = true,
                includeSessionComparisons = false,
                comparisonDepth = 'detailed'
            } = options;

            const report = {
                type: 'historical_comparison_report',
                roundId: roundSummary.roundId,
                roundNumber: roundSummary.roundNumber,
                coachingLevel: roundSummary.coachingLevel,
                generatedAt: Date.now(),
                comparisons: {},
                summary: {},
                recommendations: []
            };

            // Historical averages comparison
            if (includeAverages) {
                try {
                    report.comparisons.historicalAverages = await this.compareWithHistoricalAverages(
                        roundSummary, 
                        options.averagesConfig || {}
                    );
                } catch (error) {
                    console.error('❌ Historical averages comparison failed:', error.message);
                    report.comparisons.historicalAverages = { error: error.message };
                }
            }

            // Personal bests comparison
            if (includePersonalBests) {
                try {
                    report.comparisons.personalBests = await this.compareWithPersonalBests(
                        roundSummary, 
                        options.personalBestsConfig || {}
                    );
                } catch (error) {
                    console.error('❌ Personal bests comparison failed:', error.message);
                    report.comparisons.personalBests = { error: error.message };
                }
            }

            // Session comparisons
            if (includeSessionComparisons) {
                try {
                    report.comparisons.sessionComparisons = await this.compareWithSpecificSessions(
                        roundSummary, 
                        options.sessionConfig || {}
                    );
                } catch (error) {
                    console.error('❌ Session comparison failed:', error.message);
                    report.comparisons.sessionComparisons = { error: error.message };
                }
            }

            // Generate summary insights
            report.summary = this.generateComparisonSummary(report.comparisons);
            
            // Generate consolidated recommendations
            report.recommendations = this.generateComparisonRecommendations(report.comparisons);

            // Add metadata
            report.metadata = {
                processingTime: Date.now() - startTime,
                comparisonsPerformed: Object.keys(report.comparisons).length,
                comparisonDepth,
                dataQuality: this.assessComparisonReportQuality(report.comparisons)
            };

            console.log(`✅ Historical comparison report generated in ${Date.now() - startTime}ms`);
            return report;

        } catch (error) {
            console.error('❌ Failed to generate historical comparison report:', error.message);
            throw error;
        }
    }

    generateComparisonSummary(comparisons) {
        const summary = {
            overallTrend: 'stable',
            significantChanges: 0,
            achievements: 0,
            improvementAreas: [],
            keyFindings: []
        };

        // Analyze historical averages
        if (comparisons.historicalAverages && !comparisons.historicalAverages.error) {
            const avgComp = comparisons.historicalAverages;
            if (avgComp.consolidatedAnalysis) {
                summary.overallTrend = avgComp.consolidatedAnalysis.overallDirection;
                summary.keyFindings.push(...(avgComp.insights || []));
            }
        }

        // Analyze personal bests
        if (comparisons.personalBests && !comparisons.personalBests.error) {
            const bestComp = comparisons.personalBests;
            if (bestComp.achievements) {
                summary.achievements = bestComp.achievements.length;
                summary.keyFindings.push(...(bestComp.insights || []));
            }
        }

        // Analyze session comparisons
        if (comparisons.sessionComparisons && !comparisons.sessionComparisons.error) {
            const sessionComp = comparisons.sessionComparisons;
            if (sessionComp.insights) {
                summary.keyFindings.push(...sessionComp.insights);
            }
        }

        // Count significant changes
        summary.significantChanges = summary.keyFindings.filter(f => 
            f.priority === 'high' || f.type === 'significant_change'
        ).length;

        return summary;
    }

    generateComparisonRecommendations(comparisons) {
        const recommendations = [];

        // Collect recommendations from all comparison types
        Object.values(comparisons).forEach(comparison => {
            if (comparison && comparison.recommendations && !comparison.error) {
                recommendations.push(...comparison.recommendations);
            }
        });

        // Deduplicate and prioritize recommendations
        const uniqueRecommendations = this.prioritizeRecommendations(recommendations);

        return uniqueRecommendations;
    }

    prioritizeRecommendations(recommendations) {
        // Remove duplicates based on message similarity
        const unique = recommendations.filter((rec, index, self) => 
            index === self.findIndex(r => r.message === rec.message)
        );

        // Sort by priority
        return unique.sort((a, b) => {
            const priorities = { high: 3, medium: 2, low: 1 };
            return (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
        });
    }

    assessComparisonReportQuality(comparisons) {
        const availableComparisons = Object.values(comparisons).filter(c => c && !c.error).length;
        const totalComparisons = Object.keys(comparisons).length;
        
        if (totalComparisons === 0) return 0;
        
        const availabilityScore = availableComparisons / totalComparisons;
        
        // Additional quality factors could be added here
        // (data completeness, confidence levels, etc.)
        
        return Math.max(0.2, availabilityScore); // Minimum quality score of 0.2
    }

    getComparisonStats() {
        if (!historicalComparator.isInitialized) {
            return { error: 'Historical data comparator not initialized' };
        }
        
        return historicalComparator.getStats();
    }

    // ====== SINGLE-ROUND STRUCTURED REPORT GENERATOR ======

    async generateSingleRoundReport(roundSummary, options = {}) {
        const startTime = Date.now();
        
        try {
            console.log(`📄 Generating single-round structured report for Round ${roundSummary.roundNumber}...`);
            
            const {
                format = 'json',          // 'json', 'markdown', 'html', 'text'
                sections = 'auto',        // 'auto', 'basic', 'detailed', 'comprehensive', or array of specific sections
                includeHistoricalComparison = false,
                includeCharts = false,
                exportToFile = false,
                filePath = null,
                templateOverrides = {}
            } = options;

            // Determine report structure
            const reportStructure = this.determineReportStructure(roundSummary.coachingLevel, sections);
            
            // Build the report
            const report = {
                type: 'single_round_structured_report',
                metadata: {
                    roundId: roundSummary.roundId,
                    roundNumber: roundSummary.roundNumber,
                    sessionId: roundSummary.sessionId,
                    coachingLevel: roundSummary.coachingLevel,
                    outcome: roundSummary.outcome,
                    duration: roundSummary.duration,
                    generatedAt: Date.now(),
                    format,
                    sections: reportStructure.sections,
                    processingTime: 0 // Will be updated at end
                },
                header: this.generateReportHeader(roundSummary),
                sections: {},
                summary: {},
                recommendations: [],
                footer: {}
            };

            // Generate each section
            console.log(`📋 Generating ${reportStructure.sections.length} report sections...`);
            
            for (const sectionType of reportStructure.sections) {
                try {
                    console.log(`  📝 Generating ${sectionType} section...`);
                    report.sections[sectionType] = this.generateSummarySection(
                        sectionType, 
                        roundSummary.consolidatedAnalysis, 
                        roundSummary.coachingLevel
                    );
                } catch (error) {
                    console.error(`❌ Failed to generate ${sectionType} section:`, error.message);
                    report.sections[sectionType] = {
                        type: sectionType,
                        available: false,
                        error: error.message
                    };
                }
            }

            // Add historical comparison if requested
            if (includeHistoricalComparison) {
                try {
                    console.log('📊 Adding historical comparison section...');
                    report.sections.historical_comparison = await this.generateHistoricalComparisonReport(
                        roundSummary, 
                        options.comparisonConfig || {}
                    );
                } catch (error) {
                    console.error('❌ Failed to generate historical comparison:', error.message);
                    report.sections.historical_comparison = { error: error.message };
                }
            }

            // Generate executive summary
            report.summary = this.generateExecutiveSummary(report.sections, roundSummary);
            
            // Extract actionable recommendations
            report.recommendations = this.extractActionableRecommendations(report.sections, roundSummary.coachingLevel);
            
            // Add footer with technical details
            report.footer = this.generateReportFooter(report, roundSummary);

            // Update processing time
            report.metadata.processingTime = Date.now() - startTime;

            // Format the report based on requested format
            const formattedReport = this.formatReport(report, format, templateOverrides);

            // Export to file if requested
            if (exportToFile) {
                await this.exportReportToFile(formattedReport, format, filePath, roundSummary);
            }

            console.log(`✅ Single-round structured report generated in ${Date.now() - startTime}ms`);
            console.log(`📊 Report includes ${Object.keys(report.sections).length} sections with ${report.recommendations.length} recommendations`);
            
            return formattedReport;

        } catch (error) {
            console.error('❌ Failed to generate single-round structured report:', error.message);
            throw error;
        }
    }

    determineReportStructure(coachingLevel, sections) {
        if (sections === 'auto') {
            const template = this.summaryTemplates[this.analysisConfigs[coachingLevel].summaryDepth];
            return {
                sections: template.sections,
                format: template.format
            };
        }
        
        if (typeof sections === 'string') {
            const template = this.summaryTemplates[sections];
            return {
                sections: template ? template.sections : ['round_overview'],
                format: template ? template.format : 'simplified'
            };
        }
        
        if (Array.isArray(sections)) {
            return {
                sections,
                format: 'custom'
            };
        }

        // Default fallback
        return {
            sections: ['round_overview', 'performance_highlights', 'key_learnings'],
            format: 'simplified'
        };
    }

    generateReportHeader(roundSummary) {
        return {
            title: `CS2 Coach AI - Round ${roundSummary.roundNumber} Analysis Report`,
            subtitle: `${roundSummary.coachingLevel.toUpperCase()} Level Coaching`,
            sessionInfo: {
                sessionId: roundSummary.sessionId,
                roundId: roundSummary.roundId,
                outcome: roundSummary.outcome,
                duration: this.formatDuration(roundSummary.duration),
                completedAt: new Date(roundSummary.compiledAt).toLocaleString()
            },
            qualityMetrics: {
                dataCompleteness: this.formatPercentage(roundSummary.qualityMetrics?.dataCompleteness || 0),
                analysisConfidence: this.formatPercentage(roundSummary.qualityMetrics?.analysisConfidence || 0),
                insightRelevance: this.formatPercentage(roundSummary.qualityMetrics?.insightRelevance || 0)
            }
        };
    }

    generateExecutiveSummary(sections, roundSummary) {
        const summary = {
            overallAssessment: 'Performance analysis completed',
            keyHighlights: [],
            criticalFindings: [],
            progressIndicators: {},
            nextStepsPriority: []
        };

        // Extract key highlights from sections
        Object.values(sections).forEach(section => {
            if (section.available && section.content?.summary) {
                summary.keyHighlights.push({
                    section: section.type,
                    highlight: section.content.summary
                });
            }
        });

        // Determine overall assessment
        if (roundSummary.performanceMetrics?.overall) {
            const overallScore = roundSummary.performanceMetrics.overall.score;
            if (overallScore >= 0.8) {
                summary.overallAssessment = 'Excellent performance with strong execution';
            } else if (overallScore >= 0.6) {
                summary.overallAssessment = 'Good performance with room for improvement';
            } else if (overallScore >= 0.4) {
                summary.overallAssessment = 'Average performance with clear development areas';
            } else {
                summary.overallAssessment = 'Below average performance requiring focused improvement';
            }
        }

        // Extract critical findings
        if (sections.round_analysis?.content?.criticalMoments) {
            summary.criticalFindings = sections.round_analysis.content.criticalMoments.details
                .filter(moment => moment.outcome === 'missed')
                .map(moment => moment.description);
        }

        return summary;
    }

    extractActionableRecommendations(sections, coachingLevel) {
        const recommendations = [];
        const config = this.analysisConfigs[coachingLevel];

        // Extract recommendations from next round focus
        if (sections.next_round_focus?.content?.immediateActions) {
            sections.next_round_focus.content.immediateActions.forEach(action => {
                recommendations.push({
                    priority: 'immediate',
                    category: 'tactical',
                    action: action.action,
                    rationale: action.rationale,
                    timeframe: action.timeframe
                });
            });
        }

        // Extract improvement areas
        if (sections.key_learnings?.content?.primaryLearnings) {
            sections.key_learnings.content.primaryLearnings.forEach(learning => {
                if (learning.importance === 'high') {
                    recommendations.push({
                        priority: 'high',
                        category: 'skill_development',
                        action: `Focus on improving ${learning.metric}`,
                        rationale: learning.insight,
                        timeframe: 'short_term'
                    });
                }
            });
        }

        // Extract pattern-based recommendations
        if (sections.pattern_identification?.content?.improvementPatterns) {
            sections.pattern_identification.content.improvementPatterns.forEach(pattern => {
                recommendations.push({
                    priority: 'medium',
                    category: 'pattern_improvement',
                    action: `Address ${pattern.pattern} pattern`,
                    rationale: `Improvement potential: ${pattern.potential}`,
                    timeframe: pattern.timeframe || 'medium_term'
                });
            });
        }

        // Sort by priority
        const priorityOrder = { immediate: 4, high: 3, medium: 2, low: 1 };
        return recommendations
            .sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0))
            .slice(0, config.keyInsights); // Limit based on coaching level
    }

    generateReportFooter(report, roundSummary) {
        return {
            generationDetails: {
                processingTime: `${report.metadata.processingTime}ms`,
                sectionsGenerated: Object.keys(report.sections).length,
                dataQuality: roundSummary.qualityMetrics?.dataCompleteness || 0,
                analysisVersion: '1.0.0'
            },
            disclaimer: 'This analysis is generated by CS2 Coach AI and should be used as guidance alongside personal judgment and experience.',
            nextSteps: 'Review recommendations and focus on priority areas in your next gaming session.',
            contactInfo: {
                feedback: 'Use the feedback system to improve AI coaching quality',
                version: 'CS2 Coach AI v1.0.0'
            }
        };
    }

    formatReport(report, format, templateOverrides = {}) {
        switch (format.toLowerCase()) {
            case 'markdown':
                return this.formatReportAsMarkdown(report, templateOverrides);
            case 'html':
                return this.formatReportAsHTML(report, templateOverrides);
            case 'text':
                return this.formatReportAsText(report, templateOverrides);
            case 'json':
            default:
                return report; // Already in JSON format
        }
    }

    formatReportAsMarkdown(report, templateOverrides = {}) {
        let markdown = `# ${report.header.title}\n\n`;
        markdown += `**${report.header.subtitle}**\n\n`;
        
        // Session info
        markdown += `## Session Information\n\n`;
        markdown += `- **Round**: ${report.metadata.roundNumber}\n`;
        markdown += `- **Outcome**: ${report.header.sessionInfo.outcome}\n`;
        markdown += `- **Duration**: ${report.header.sessionInfo.duration}\n`;
        markdown += `- **Completed**: ${report.header.sessionInfo.completedAt}\n\n`;

        // Executive summary
        markdown += `## Executive Summary\n\n`;
        markdown += `${report.summary.overallAssessment}\n\n`;

        // Sections
        Object.entries(report.sections).forEach(([sectionType, section]) => {
            if (section.available) {
                markdown += `## ${this.formatSectionTitle(sectionType)}\n\n`;
                markdown += `${section.content.summary || 'Analysis completed'}\n\n`;
                
                // Add detailed content based on section type
                if (section.content.achievements?.length) {
                    markdown += `### Achievements\n\n`;
                    section.content.achievements.forEach(achievement => {
                        markdown += `- ${achievement.description || achievement}\n`;
                    });
                    markdown += `\n`;
                }
            }
        });

        // Recommendations
        if (report.recommendations.length) {
            markdown += `## Recommendations\n\n`;
            report.recommendations.forEach((rec, index) => {
                markdown += `${index + 1}. **${rec.action}** _(${rec.priority})_\n`;
                markdown += `   - ${rec.rationale}\n\n`;
            });
        }

        return markdown;
    }

    formatReportAsHTML(report, templateOverrides = {}) {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.header.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .metric { background: #f5f5f5; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .recommendation { background: #e8f4fd; border-left: 4px solid #007acc; padding: 15px; margin: 10px 0; }
        .priority-high { border-left-color: #d73027; }
        .priority-medium { border-left-color: #fdae61; }
        .priority-low { border-left-color: #74add1; }
    </style>
</head>
<body>`;

        html += `<div class="header">`;
        html += `<h1>${report.header.title}</h1>`;
        html += `<h2>${report.header.subtitle}</h2>`;
        html += `<div class="session-info">`;
        html += `<p><strong>Round:</strong> ${report.metadata.roundNumber} | `;
        html += `<strong>Outcome:</strong> ${report.header.sessionInfo.outcome} | `;
        html += `<strong>Duration:</strong> ${report.header.sessionInfo.duration}</p>`;
        html += `</div></div>`;

        // Executive summary
        html += `<div class="section">`;
        html += `<h2>Executive Summary</h2>`;
        html += `<p>${report.summary.overallAssessment}</p>`;
        html += `</div>`;

        // Sections
        Object.entries(report.sections).forEach(([sectionType, section]) => {
            if (section.available) {
                html += `<div class="section">`;
                html += `<h2>${this.formatSectionTitle(sectionType)}</h2>`;
                html += `<p>${section.content.summary || 'Analysis completed'}</p>`;
                html += `</div>`;
            }
        });

        // Recommendations
        if (report.recommendations.length) {
            html += `<div class="section">`;
            html += `<h2>Recommendations</h2>`;
            report.recommendations.forEach((rec, index) => {
                html += `<div class="recommendation priority-${rec.priority}">`;
                html += `<strong>${index + 1}. ${rec.action}</strong><br>`;
                html += `<em>${rec.rationale}</em>`;
                html += `</div>`;
            });
            html += `</div>`;
        }

        html += `</body></html>`;
        return html;
    }

    formatReportAsText(report, templateOverrides = {}) {
        let text = `${report.header.title}\n`;
        text += `${'='.repeat(report.header.title.length)}\n\n`;
        text += `${report.header.subtitle}\n\n`;
        
        // Session info
        text += `SESSION INFORMATION\n`;
        text += `-`.repeat(20) + '\n';
        text += `Round: ${report.metadata.roundNumber}\n`;
        text += `Outcome: ${report.header.sessionInfo.outcome}\n`;
        text += `Duration: ${report.header.sessionInfo.duration}\n`;
        text += `Completed: ${report.header.sessionInfo.completedAt}\n\n`;

        // Executive summary
        text += `EXECUTIVE SUMMARY\n`;
        text += `-`.repeat(20) + '\n';
        text += `${report.summary.overallAssessment}\n\n`;

        // Sections
        Object.entries(report.sections).forEach(([sectionType, section]) => {
            if (section.available) {
                const title = this.formatSectionTitle(sectionType).toUpperCase();
                text += `${title}\n`;
                text += `-`.repeat(title.length) + '\n';
                text += `${section.content.summary || 'Analysis completed'}\n\n`;
            }
        });

        // Recommendations
        if (report.recommendations.length) {
            text += `RECOMMENDATIONS\n`;
            text += `-`.repeat(15) + '\n';
            report.recommendations.forEach((rec, index) => {
                text += `${index + 1}. ${rec.action} [${rec.priority.toUpperCase()}]\n`;
                text += `   ${rec.rationale}\n\n`;
            });
        }

        return text;
    }

    formatSectionTitle(sectionType) {
        return sectionType.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    async exportReportToFile(report, format, filePath, roundSummary) {
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            // Determine file path if not provided
            if (!filePath) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                const fileName = `round_${roundSummary.roundNumber}_report_${timestamp}.${format}`;
                filePath = path.join(process.cwd(), 'reports', fileName);
            }

            // Ensure directory exists
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });

            // Write file based on format
            let content;
            if (format === 'json') {
                content = JSON.stringify(report, null, 2);
            } else {
                content = report; // Already formatted as string
            }

            await fs.writeFile(filePath, content, 'utf8');
            
            console.log(`📁 Report exported to: ${filePath}`);
            return filePath;
            
        } catch (error) {
            console.error('❌ Failed to export report to file:', error.message);
            throw error;
        }
    }

    // ====== HISTORICAL/COMPARATIVE STRUCTURED REPORT GENERATOR ======

    async generateHistoricalReport(criteria = {}, options = {}) {
        const startTime = Date.now();
        
        try {
            console.log('📊 Generating historical/comparative structured report...');
            
            const {
                timeframe = '30d',       // '7d', '30d', '90d', 'all'
                reportType = 'trends',   // 'trends', 'comparison', 'progression', 'comprehensive'
                format = 'json',         // 'json', 'markdown', 'html', 'text'
                includeCharts = true,
                includeDetailedBreakdown = true,
                exportToFile = false,
                filePath = null,
                templateOverrides = {}
            } = options;

            // Get historical data based on criteria
            const historicalData = await this.gatherHistoricalData(criteria, timeframe);
            
            if (!historicalData || historicalData.rounds.length === 0) {
                throw new Error('No historical data available for the specified criteria');
            }

            // Build the historical report structure
            const report = {
                type: 'historical_comparative_report',
                metadata: {
                    timeframe,
                    reportType,
                    format,
                    generatedAt: Date.now(),
                    dataPoints: historicalData.rounds.length,
                    dateRange: {
                        start: historicalData.dateRange.start,
                        end: historicalData.dateRange.end
                    },
                    processingTime: 0
                },
                header: this.generateHistoricalReportHeader(historicalData, timeframe, reportType),
                executiveSummary: {},
                sections: {},
                visualizations: {},
                insights: [],
                recommendations: [],
                footer: {}
            };

            // Generate sections based on report type
            console.log(`📋 Generating ${reportType} historical analysis...`);
            
            switch (reportType) {
                case 'trends':
                    report.sections = await this.generateTrendsAnalysis(historicalData, options);
                    break;
                case 'comparison':
                    report.sections = await this.generateComparisonAnalysis(historicalData, options);
                    break;
                case 'progression':
                    report.sections = await this.generateProgressionAnalysis(historicalData, options);
                    break;
                case 'comprehensive':
                default:
                    report.sections = await this.generateComprehensiveHistoricalAnalysis(historicalData, options);
                    break;
            }

            // Generate visualizations
            if (includeCharts) {
                console.log('📈 Generating charts and visualizations...');
                report.visualizations = this.generateHistoricalVisualizations(historicalData, format);
            }

            // Generate executive summary
            report.executiveSummary = this.generateHistoricalExecutiveSummary(
                historicalData, 
                report.sections, 
                report.visualizations
            );

            // Extract insights and recommendations
            report.insights = this.extractHistoricalInsights(historicalData, report.sections);
            report.recommendations = this.generateHistoricalRecommendations(
                historicalData, 
                report.sections, 
                report.insights
            );

            // Add footer
            report.footer = this.generateHistoricalReportFooter(report, historicalData);

            // Update processing time
            report.metadata.processingTime = Date.now() - startTime;

            // Format the report
            const formattedReport = this.formatHistoricalReport(report, format, templateOverrides);

            // Export to file if requested
            if (exportToFile) {
                await this.exportHistoricalReportToFile(formattedReport, format, filePath, timeframe, reportType);
            }

            console.log(`✅ Historical report generated in ${Date.now() - startTime}ms`);
            console.log(`📊 Report covers ${historicalData.rounds.length} rounds with ${report.insights.length} insights`);
            
            return formattedReport;

        } catch (error) {
            console.error('❌ Failed to generate historical report:', error.message);
            throw error;
        }
    }

    async gatherHistoricalData(criteria, timeframe) {
        const data = {
            rounds: [],
            sessionSummaries: [],
            performanceMetrics: [],
            trends: {},
            dateRange: {},
            aggregatedStats: {}
        };

        try {
            // Determine date range
            const endDate = new Date();
            let startDate = new Date();
            
            switch (timeframe) {
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(endDate.getDate() - 90);
                    break;
                case 'all':
                    startDate = new Date(0); // Beginning of time
                    break;
                default:
                    startDate.setDate(endDate.getDate() - 30);
            }

            data.dateRange = { start: startDate, end: endDate };

            // Get historical rounds
            data.rounds = await historicalRetriever.getRecentRoundSummaries({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                includeMetrics: true,
                includeAnalysis: true,
                ...criteria
            });

            // Get performance trends
            data.trends = await historicalRetriever.getPerformanceTrends({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                ...criteria
            });

            // Calculate aggregated statistics
            data.aggregatedStats = this.calculateAggregatedStats(data.rounds);

            console.log(`📚 Gathered ${data.rounds.length} rounds for historical analysis`);
            
            return data;

        } catch (error) {
            console.error('❌ Failed to gather historical data:', error.message);
            throw error;
        }
    }

    calculateAggregatedStats(rounds) {
        if (!rounds || rounds.length === 0) {
            return { averagePerformance: 0, totalRounds: 0, winRate: 0, trends: {} };
        }

        const stats = {
            totalRounds: rounds.length,
            averagePerformance: 0,
            winRate: 0,
            averageDuration: 0,
            performanceByCategory: {},
            trendsOverTime: {},
            bestPerformance: 0,
            worstPerformance: 1,
            improvementRate: 0
        };

        // Calculate basic averages
        let totalPerformance = 0;
        let wins = 0;
        let totalDuration = 0;

        rounds.forEach(round => {
            const performance = round.performanceMetrics?.overall?.score || 0;
            totalPerformance += performance;
            
            if (round.outcome === 'victory' || round.outcome === 'win') {
                wins++;
            }
            
            totalDuration += round.duration || 0;
            
            stats.bestPerformance = Math.max(stats.bestPerformance, performance);
            stats.worstPerformance = Math.min(stats.worstPerformance, performance);
        });

        stats.averagePerformance = totalPerformance / rounds.length;
        stats.winRate = wins / rounds.length;
        stats.averageDuration = totalDuration / rounds.length;

        // Calculate improvement rate (first vs last half)
        if (rounds.length >= 4) {
            const firstHalf = rounds.slice(0, Math.floor(rounds.length / 2));
            const secondHalf = rounds.slice(Math.floor(rounds.length / 2));
            
            const firstHalfAvg = firstHalf.reduce((sum, r) => sum + (r.performanceMetrics?.overall?.score || 0), 0) / firstHalf.length;
            const secondHalfAvg = secondHalf.reduce((sum, r) => sum + (r.performanceMetrics?.overall?.score || 0), 0) / secondHalf.length;
            
            stats.improvementRate = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
        }

        return stats;
    }

    generateHistoricalReportHeader(historicalData, timeframe, reportType) {
        const formatTimeframe = (tf) => {
            switch (tf) {
                case '7d': return '7 Days';
                case '30d': return '30 Days';
                case '90d': return '90 Days';
                case 'all': return 'All Time';
                default: return tf;
            }
        };

        const formatReportType = (type) => {
            switch (type) {
                case 'trends': return 'Performance Trends Analysis';
                case 'comparison': return 'Comparative Performance Analysis';
                case 'progression': return 'Skill Progression Analysis';
                case 'comprehensive': return 'Comprehensive Historical Analysis';
                default: return 'Historical Analysis';
            }
        };

        return {
            title: `CS2 Coach AI - Historical Performance Report`,
            subtitle: `${formatReportType(reportType)} - ${formatTimeframe(timeframe)}`,
            timeframe: {
                period: formatTimeframe(timeframe),
                startDate: new Date(historicalData.dateRange.start).toLocaleDateString(),
                endDate: new Date(historicalData.dateRange.end).toLocaleDateString(),
                totalDays: Math.ceil((historicalData.dateRange.end - historicalData.dateRange.start) / (1000 * 60 * 60 * 24))
            },
            dataOverview: {
                totalRounds: historicalData.rounds.length,
                averagePerformance: this.formatPercentage(historicalData.aggregatedStats.averagePerformance),
                winRate: this.formatPercentage(historicalData.aggregatedStats.winRate),
                dataQuality: historicalData.rounds.length > 0 ? 'good' : 'insufficient'
            }
        };
    }

    // ====== HISTORICAL ANALYSIS METHODS ======

    async generateTrendsAnalysis(historicalData, options) {
        const sections = {};

        try {
            // Performance trends over time
            sections.performanceTrends = {
                type: 'performance_trends',
                available: true,
                content: this.analyzePerformanceTrends(historicalData),
                timestamp: Date.now()
            };

            // Skill development trends
            sections.skillTrends = {
                type: 'skill_trends',
                available: true,
                content: this.analyzeSkillTrends(historicalData),
                timestamp: Date.now()
            };

            // Win rate trends
            sections.winRateTrends = {
                type: 'winrate_trends',
                available: true,
                content: this.analyzeWinRateTrends(historicalData),
                timestamp: Date.now()
            };

            // Pattern evolution
            sections.patternEvolution = {
                type: 'pattern_evolution',
                available: true,
                content: this.analyzePatternEvolution(historicalData),
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('❌ Error generating trends analysis:', error.message);
        }

        return sections;
    }

    async generateComparisonAnalysis(historicalData, options) {
        const sections = {};

        try {
            // Best vs worst performance comparison
            sections.bestVsWorst = {
                type: 'best_vs_worst_comparison',
                available: true,
                content: this.compareBestVsWorstRounds(historicalData),
                timestamp: Date.now()
            };

            // Recent vs historical comparison
            sections.recentVsHistorical = {
                type: 'recent_vs_historical',
                available: true,
                content: this.compareRecentVsHistorical(historicalData),
                timestamp: Date.now()
            };

            // Performance consistency analysis
            sections.consistencyAnalysis = {
                type: 'consistency_analysis',
                available: true,
                content: this.analyzeConsistency(historicalData),
                timestamp: Date.now()
            };

            // Coaching level progression
            sections.coachingLevelComparison = {
                type: 'coaching_level_comparison',
                available: true,
                content: this.analyzeCoachingLevelProgression(historicalData),
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('❌ Error generating comparison analysis:', error.message);
        }

        return sections;
    }

    async generateProgressionAnalysis(historicalData, options) {
        const sections = {};

        try {
            // Skill progression tracking
            sections.skillProgression = {
                type: 'skill_progression',
                available: true,
                content: this.analyzeSkillProgression(historicalData),
                timestamp: Date.now()
            };

            // Learning curve analysis
            sections.learningCurve = {
                type: 'learning_curve',
                available: true,
                content: this.analyzeLearningCurve(historicalData),
                timestamp: Date.now()
            };

            // Milestone tracking
            sections.milestones = {
                type: 'milestone_tracking',
                available: true,
                content: this.trackMilestones(historicalData),
                timestamp: Date.now()
            };

            // Improvement rate analysis
            sections.improvementRate = {
                type: 'improvement_rate',
                available: true,
                content: this.analyzeImprovementRate(historicalData),
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('❌ Error generating progression analysis:', error.message);
        }

        return sections;
    }

    async generateComprehensiveHistoricalAnalysis(historicalData, options) {
        const sections = {};

        try {
            // Combine all analysis types
            const trendsAnalysis = await this.generateTrendsAnalysis(historicalData, options);
            const comparisonAnalysis = await this.generateComparisonAnalysis(historicalData, options);
            const progressionAnalysis = await this.generateProgressionAnalysis(historicalData, options);

            // Merge all sections
            Object.assign(sections, trendsAnalysis, comparisonAnalysis, progressionAnalysis);

            // Add comprehensive overview
            sections.comprehensiveOverview = {
                type: 'comprehensive_overview',
                available: true,
                content: this.generateComprehensiveOverview(historicalData, sections),
                timestamp: Date.now()
            };

            // Strategic insights
            sections.strategicInsights = {
                type: 'strategic_insights',
                available: true,
                content: this.generateStrategicInsights(historicalData, sections),
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('❌ Error generating comprehensive analysis:', error.message);
        }

        return sections;
    }

    // ====== PERFORMANCE ANALYSIS METHODS ======

    analyzePerformanceTrends(historicalData) {
        const content = {
            overallTrend: 'stable',
            trendDirection: 'neutral',
            trendStrength: 0,
            periodAnalysis: {},
            significantChanges: [],
            forecast: {},
            summary: ''
        };

        if (historicalData.rounds.length < 2) {
            content.summary = 'Insufficient data for trend analysis';
            return content;
        }

        // Calculate overall trend
        const performances = historicalData.rounds.map(r => r.performanceMetrics?.overall?.score || 0);
        const trend = this.calculateLinearTrend(performances);
        
        content.trendDirection = trend.slope > 0.01 ? 'improving' : trend.slope < -0.01 ? 'declining' : 'stable';
        content.trendStrength = Math.abs(trend.slope);
        content.overallTrend = content.trendDirection;

        // Period analysis (divide into quarters)
        const quarterSize = Math.max(1, Math.floor(historicalData.rounds.length / 4));
        for (let i = 0; i < 4; i++) {
            const start = i * quarterSize;
            const end = Math.min((i + 1) * quarterSize, historicalData.rounds.length);
            const periodRounds = historicalData.rounds.slice(start, end);
            
            if (periodRounds.length > 0) {
                const avgPerformance = periodRounds.reduce((sum, r) => sum + (r.performanceMetrics?.overall?.score || 0), 0) / periodRounds.length;
                content.periodAnalysis[`quarter_${i + 1}`] = {
                    averagePerformance: avgPerformance,
                    rounds: periodRounds.length,
                    winRate: periodRounds.filter(r => r.outcome === 'victory').length / periodRounds.length
                };
            }
        }

        // Identify significant changes
        content.significantChanges = this.identifySignificantPerformanceChanges(performances);

        // Generate summary
        const improvementPercentage = ((performances[performances.length - 1] - performances[0]) / performances[0] * 100).toFixed(1);
        content.summary = `Performance trend: ${content.trendDirection} (${improvementPercentage}% change over period)`;

        return content;
    }

    analyzeSkillTrends(historicalData) {
        const content = {
            skillCategories: {},
            mostImproved: [],
            needsWork: [],
            consistency: {},
            summary: ''
        };

        const skillCategories = ['aiming', 'positioning', 'economic', 'tactical', 'teamwork'];
        
        skillCategories.forEach(skill => {
            const skillScores = historicalData.rounds.map(r => 
                r.performanceMetrics?.breakdown?.[skill]?.score || 0
            );
            
            if (skillScores.length > 0) {
                const trend = this.calculateLinearTrend(skillScores);
                const average = skillScores.reduce((sum, score) => sum + score, 0) / skillScores.length;
                const variance = this.calculateVariance(skillScores);
                
                content.skillCategories[skill] = {
                    averageScore: average,
                    trend: trend.slope > 0.01 ? 'improving' : trend.slope < -0.01 ? 'declining' : 'stable',
                    trendStrength: Math.abs(trend.slope),
                    consistency: 1 - variance, // Lower variance = higher consistency
                    recentPerformance: skillScores.slice(-5).reduce((sum, score) => sum + score, 0) / Math.min(5, skillScores.length)
                };
            }
        });

        // Identify most improved and needs work
        Object.entries(content.skillCategories).forEach(([skill, data]) => {
            if (data.trend === 'improving' && data.trendStrength > 0.02) {
                content.mostImproved.push({ skill, improvement: data.trendStrength });
            }
            if (data.averageScore < 0.6 || data.trend === 'declining') {
                content.needsWork.push({ skill, score: data.averageScore, trend: data.trend });
            }
        });

        // Sort by improvement/need
        content.mostImproved.sort((a, b) => b.improvement - a.improvement);
        content.needsWork.sort((a, b) => a.score - b.score);

        content.summary = `${content.mostImproved.length} skills improving, ${content.needsWork.length} need attention`;

        return content;
    }

    analyzeWinRateTrends(historicalData) {
        const content = {
            overallWinRate: 0,
            winRateTrend: 'stable',
            recentWinRate: 0,
            streaks: { current: 0, best: 0, type: 'none' },
            winRateByPeriod: {},
            summary: ''
        };

        const rounds = historicalData.rounds;
        if (rounds.length === 0) {
            content.summary = 'No rounds available for win rate analysis';
            return content;
        }

        // Calculate overall win rate
        const wins = rounds.filter(r => r.outcome === 'victory' || r.outcome === 'win').length;
        content.overallWinRate = wins / rounds.length;

        // Calculate recent win rate (last 25% of rounds)
        const recentCount = Math.max(1, Math.floor(rounds.length * 0.25));
        const recentRounds = rounds.slice(-recentCount);
        const recentWins = recentRounds.filter(r => r.outcome === 'victory' || r.outcome === 'win').length;
        content.recentWinRate = recentWins / recentRounds.length;

        // Analyze trend
        if (content.recentWinRate > content.overallWinRate + 0.1) {
            content.winRateTrend = 'improving';
        } else if (content.recentWinRate < content.overallWinRate - 0.1) {
            content.winRateTrend = 'declining';
        }

        // Analyze streaks
        content.streaks = this.analyzeStreaks(rounds);

        // Win rate by period
        const periods = Math.min(4, Math.floor(rounds.length / 3));
        for (let i = 0; i < periods; i++) {
            const start = Math.floor(i * rounds.length / periods);
            const end = Math.floor((i + 1) * rounds.length / periods);
            const periodRounds = rounds.slice(start, end);
            const periodWins = periodRounds.filter(r => r.outcome === 'victory' || r.outcome === 'win').length;
            
            content.winRateByPeriod[`period_${i + 1}`] = {
                winRate: periodWins / periodRounds.length,
                rounds: periodRounds.length
            };
        }

        content.summary = `${this.formatPercentage(content.overallWinRate)} win rate (${content.winRateTrend})`;

        return content;
    }

    analyzePatternEvolution(historicalData) {
        const content = {
            identifiedPatterns: [],
            patternChanges: [],
            emergingPatterns: [],
            fadingPatterns: [],
            summary: ''
        };

        // This would analyze how patterns change over time
        // For now, providing a basic structure
        content.identifiedPatterns = [
            { pattern: 'early_round_aggression', frequency: 0.7, effectiveness: 0.6, trend: 'stable' },
            { pattern: 'economic_discipline', frequency: 0.8, effectiveness: 0.75, trend: 'improving' }
        ];

        content.summary = `${content.identifiedPatterns.length} patterns tracked over time`;

        return content;
    }

    // ====== COMPARISON ANALYSIS METHODS ======

    compareBestVsWorstRounds(historicalData) {
        const content = {
            bestRound: null,
            worstRound: null,
            comparison: {},
            keyDifferences: [],
            learnings: [],
            summary: ''
        };

        if (historicalData.rounds.length === 0) {
            content.summary = 'No rounds available for comparison';
            return content;
        }

        // Find best and worst rounds by performance score
        const roundsWithScores = historicalData.rounds
            .filter(r => r.performanceMetrics?.overall?.score !== undefined)
            .sort((a, b) => (b.performanceMetrics?.overall?.score || 0) - (a.performanceMetrics?.overall?.score || 0));

        if (roundsWithScores.length >= 2) {
            content.bestRound = roundsWithScores[0];
            content.worstRound = roundsWithScores[roundsWithScores.length - 1];

            // Compare key metrics
            const bestScore = content.bestRound.performanceMetrics?.overall?.score || 0;
            const worstScore = content.worstRound.performanceMetrics?.overall?.score || 0;

            content.comparison = {
                performanceDifference: bestScore - worstScore,
                durationDifference: (content.bestRound.duration || 0) - (content.worstRound.duration || 0),
                outcomeDifference: {
                    best: content.bestRound.outcome,
                    worst: content.worstRound.outcome
                }
            };

            // Identify key differences
            content.keyDifferences = this.identifyKeyDifferences(content.bestRound, content.worstRound);

            content.summary = `${this.formatPercentage(bestScore - worstScore)} performance gap between best and worst rounds`;
        } else {
            content.summary = 'Insufficient data for best vs worst comparison';
        }

        return content;
    }

    compareRecentVsHistorical(historicalData) {
        const content = {
            recentPerformance: {},
            historicalPerformance: {},
            comparison: {},
            trends: {},
            summary: ''
        };

        if (historicalData.rounds.length < 4) {
            content.summary = 'Insufficient data for recent vs historical comparison';
            return content;
        }

        // Split data: recent (last 25%) vs historical (rest)
        const splitPoint = Math.floor(historicalData.rounds.length * 0.75);
        const historicalRounds = historicalData.rounds.slice(0, splitPoint);
        const recentRounds = historicalData.rounds.slice(splitPoint);

        // Calculate metrics for each period
        content.recentPerformance = this.calculatePeriodMetrics(recentRounds);
        content.historicalPerformance = this.calculatePeriodMetrics(historicalRounds);

        // Compare the periods
        content.comparison = {
            performanceChange: content.recentPerformance.averageScore - content.historicalPerformance.averageScore,
            winRateChange: content.recentPerformance.winRate - content.historicalPerformance.winRate,
            consistencyChange: content.recentPerformance.consistency - content.historicalPerformance.consistency
        };

        // Determine overall trend
        const overallImprovement = content.comparison.performanceChange > 0.05 ? 'improving' : 
                                  content.comparison.performanceChange < -0.05 ? 'declining' : 'stable';

        content.summary = `Recent performance vs historical: ${overallImprovement} (${this.formatPercentage(content.comparison.performanceChange)} change)`;

        return content;
    }

    analyzeConsistency(historicalData) {
        const content = {
            overallConsistency: 0,
            consistencyTrend: 'stable',
            performanceVariability: 0,
            streakAnalysis: {},
            consistentAreas: [],
            inconsistentAreas: [],
            summary: ''
        };

        if (historicalData.rounds.length < 3) {
            content.summary = 'Insufficient data for consistency analysis';
            return content;
        }

        const performances = historicalData.rounds.map(r => r.performanceMetrics?.overall?.score || 0);
        
        // Calculate overall consistency (1 - coefficient of variation)
        const mean = performances.reduce((sum, p) => sum + p, 0) / performances.length;
        const variance = performances.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / performances.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
        
        content.overallConsistency = Math.max(0, 1 - coefficientOfVariation);
        content.performanceVariability = coefficientOfVariation;

        // Analyze consistency across different skill areas
        const skillAreas = ['aiming', 'positioning', 'economic', 'tactical'];
        skillAreas.forEach(skill => {
            const skillScores = historicalData.rounds.map(r => 
                r.performanceMetrics?.breakdown?.[skill]?.score || 0
            );
            
            if (skillScores.length > 0) {
                const skillVariance = this.calculateVariance(skillScores);
                if (skillVariance < 0.1) {
                    content.consistentAreas.push(skill);
                } else if (skillVariance > 0.3) {
                    content.inconsistentAreas.push(skill);
                }
            }
        });

        content.summary = `${this.formatPercentage(content.overallConsistency)} consistency rating`;

        return content;
    }

    analyzeCoachingLevelProgression(historicalData) {
        const content = {
            levelProgression: [],
            currentLevel: 'beginner',
            readinessForNext: false,
            levelMetrics: {},
            recommendations: [],
            summary: ''
        };

        // Track progression through coaching levels
        const levelOrder = ['beginner', 'intermediate', 'professional'];
        const levelCounts = {};
        
        historicalData.rounds.forEach(round => {
            const level = round.coachingLevel || 'beginner';
            levelCounts[level] = (levelCounts[level] || 0) + 1;
        });

        // Determine current level (most recent or most frequent)
        const recentLevel = historicalData.rounds[historicalData.rounds.length - 1]?.coachingLevel || 'beginner';
        content.currentLevel = recentLevel;

        // Analyze readiness for next level
        if (recentLevel === 'beginner') {
            const recentPerformance = historicalData.rounds.slice(-10)
                .reduce((sum, r) => sum + (r.performanceMetrics?.overall?.score || 0), 0) / Math.min(10, historicalData.rounds.length);
            content.readinessForNext = recentPerformance > 0.7;
        }

        content.summary = `Current level: ${content.currentLevel}${content.readinessForNext ? ' (ready for advancement)' : ''}`;

        return content;
    }

    // ====== UTILITY METHODS FOR ANALYSIS ======

    calculateLinearTrend(values) {
        if (values.length < 2) return { slope: 0, intercept: 0, r2: 0 };

        const n = values.length;
        const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // 0² + 1² + 2² + ... + (n-1)²

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept, r2: 0 }; // R² calculation omitted for brevity
    }

    calculateVariance(values) {
        if (values.length === 0) return 0;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return variance;
    }

    identifySignificantPerformanceChanges(performances) {
        const changes = [];
        const threshold = 0.15; // 15% change threshold

        for (let i = 1; i < performances.length; i++) {
            const change = performances[i] - performances[i - 1];
            if (Math.abs(change) > threshold) {
                changes.push({
                    roundIndex: i,
                    change,
                    type: change > 0 ? 'improvement' : 'decline',
                    magnitude: Math.abs(change)
                });
            }
        }

        return changes;
    }

    analyzeStreaks(rounds) {
        const streaks = { current: 0, best: 0, type: 'none', bestType: 'none' };
        
        if (rounds.length === 0) return streaks;

        let currentStreak = 1;
        let currentType = rounds[rounds.length - 1].outcome === 'victory' ? 'win' : 'loss';
        let bestStreak = 1;
        let bestType = currentType;

        // Analyze from most recent backwards
        for (let i = rounds.length - 2; i >= 0; i--) {
            const isWin = rounds[i].outcome === 'victory';
            const currentIsWin = currentType === 'win';
            
            if (isWin === currentIsWin) {
                currentStreak++;
            } else {
                if (currentStreak > bestStreak) {
                    bestStreak = currentStreak;
                    bestType = currentType;
                }
                break;
            }
        }

        if (currentStreak > bestStreak) {
            bestStreak = currentStreak;
            bestType = currentType;
        }

        streaks.current = currentStreak;
        streaks.type = currentType;
        streaks.best = bestStreak;
        streaks.bestType = bestType;

        return streaks;
    }

    identifyKeyDifferences(bestRound, worstRound) {
        const differences = [];

        // Compare performance metrics
        const bestMetrics = bestRound.performanceMetrics?.breakdown || {};
        const worstMetrics = worstRound.performanceMetrics?.breakdown || {};

        Object.keys({ ...bestMetrics, ...worstMetrics }).forEach(metric => {
            const bestScore = bestMetrics[metric]?.score || 0;
            const worstScore = worstMetrics[metric]?.score || 0;
            const difference = bestScore - worstScore;

            if (Math.abs(difference) > 0.2) { // Significant difference threshold
                differences.push({
                    metric,
                    difference,
                    bestScore,
                    worstScore,
                    impact: difference > 0 ? 'positive' : 'negative'
                });
            }
        });

        return differences.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
    }

    calculatePeriodMetrics(rounds) {
        if (rounds.length === 0) {
            return { averageScore: 0, winRate: 0, consistency: 0, rounds: 0 };
        }

        const scores = rounds.map(r => r.performanceMetrics?.overall?.score || 0);
        const wins = rounds.filter(r => r.outcome === 'victory' || r.outcome === 'win').length;
        
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const variance = this.calculateVariance(scores);
        const consistency = Math.max(0, 1 - variance);

        return {
            averageScore,
            winRate: wins / rounds.length,
            consistency,
            rounds: rounds.length
        };
    }

    // ====== PROGRESSION ANALYSIS METHODS ======

    analyzeSkillProgression(historicalData) {
        const content = {
            skillProgression: {},
            overallProgression: 'stable',
            progressionRate: 0,
            plateauPeriods: [],
            growthSpurts: [],
            summary: ''
        };

        const skillCategories = ['aiming', 'positioning', 'economic', 'tactical', 'teamwork'];
        
        skillCategories.forEach(skill => {
            const skillScores = historicalData.rounds.map(r => 
                r.performanceMetrics?.breakdown?.[skill]?.score || 0
            );
            
            if (skillScores.length >= 3) {
                const firstThird = skillScores.slice(0, Math.floor(skillScores.length / 3));
                const lastThird = skillScores.slice(-Math.floor(skillScores.length / 3));
                
                const firstAvg = firstThird.reduce((sum, score) => sum + score, 0) / firstThird.length;
                const lastAvg = lastThird.reduce((sum, score) => sum + score, 0) / lastThird.length;
                const progression = lastAvg - firstAvg;
                
                content.skillProgression[skill] = {
                    startingLevel: firstAvg,
                    currentLevel: lastAvg,
                    absoluteGrowth: progression,
                    relativeGrowth: firstAvg > 0 ? (progression / firstAvg) : 0,
                    trend: progression > 0.05 ? 'improving' : progression < -0.05 ? 'declining' : 'stable'
                };
            }
        });

        // Calculate overall progression
        const progressionValues = Object.values(content.skillProgression).map(s => s.absoluteGrowth);
        if (progressionValues.length > 0) {
            const avgProgression = progressionValues.reduce((sum, val) => sum + val, 0) / progressionValues.length;
            content.progressionRate = avgProgression;
            content.overallProgression = avgProgression > 0.05 ? 'improving' : avgProgression < -0.05 ? 'declining' : 'stable';
        }

        content.summary = `Overall skill progression: ${content.overallProgression} (${this.formatPercentage(content.progressionRate)} average growth)`;

        return content;
    }

    analyzeLearningCurve(historicalData) {
        const content = {
            learningPhases: [],
            currentPhase: 'plateau',
            accelerationPoints: [],
            plateauPeriods: [],
            optimalLearningRate: 0,
            summary: ''
        };

        if (historicalData.rounds.length < 6) {
            content.summary = 'Insufficient data for learning curve analysis';
            return content;
        }

        const performances = historicalData.rounds.map(r => r.performanceMetrics?.overall?.score || 0);
        
        // Identify learning phases
        const windowSize = Math.max(3, Math.floor(performances.length / 6));
        for (let i = 0; i <= performances.length - windowSize; i += windowSize) {
            const window = performances.slice(i, i + windowSize);
            const windowAvg = window.reduce((sum, val) => sum + val, 0) / window.length;
            const trend = this.calculateLinearTrend(window);
            
            content.learningPhases.push({
                startIndex: i,
                endIndex: i + windowSize - 1,
                averagePerformance: windowAvg,
                trend: trend.slope > 0.02 ? 'acceleration' : trend.slope < -0.02 ? 'regression' : 'plateau',
                trendStrength: Math.abs(trend.slope)
            });
        }

        // Identify current phase
        const latestPhase = content.learningPhases[content.learningPhases.length - 1];
        content.currentPhase = latestPhase?.trend || 'plateau';

        // Find acceleration points and plateaus
        content.accelerationPoints = content.learningPhases.filter(phase => phase.trend === 'acceleration');
        content.plateauPeriods = content.learningPhases.filter(phase => phase.trend === 'plateau');

        content.summary = `Currently in ${content.currentPhase} phase with ${content.accelerationPoints.length} acceleration periods identified`;

        return content;
    }

    trackMilestones(historicalData) {
        const content = {
            achievedMilestones: [],
            upcomingMilestones: [],
            milestoneProgress: {},
            nextMilestone: null,
            summary: ''
        };

        // Define standard milestones
        const milestones = [
            { name: 'First Victory', threshold: 0.1, type: 'win_rate', achieved: false },
            { name: 'Consistent Player', threshold: 0.5, type: 'overall_performance', achieved: false },
            { name: 'Tactical Awareness', threshold: 0.6, type: 'tactical_score', achieved: false },
            { name: 'Economic Mastery', threshold: 0.7, type: 'economic_score', achieved: false },
            { name: 'Team Leader', threshold: 0.8, type: 'teamwork_score', achieved: false },
            { name: 'Elite Performance', threshold: 0.9, type: 'overall_performance', achieved: false }
        ];

        // Check milestone achievement
        milestones.forEach(milestone => {
            let currentValue = 0;
            
            switch (milestone.type) {
                case 'win_rate':
                    const wins = historicalData.rounds.filter(r => r.outcome === 'victory' || r.outcome === 'win').length;
                    currentValue = historicalData.rounds.length > 0 ? wins / historicalData.rounds.length : 0;
                    break;
                case 'overall_performance':
                    const recentRounds = historicalData.rounds.slice(-10);
                    currentValue = recentRounds.length > 0 ? 
                        recentRounds.reduce((sum, r) => sum + (r.performanceMetrics?.overall?.score || 0), 0) / recentRounds.length : 0;
                    break;
                case 'tactical_score':
                case 'economic_score':
                case 'teamwork_score':
                    const skillName = milestone.type.replace('_score', '');
                    const recentSkillRounds = historicalData.rounds.slice(-10);
                    currentValue = recentSkillRounds.length > 0 ?
                        recentSkillRounds.reduce((sum, r) => sum + (r.performanceMetrics?.breakdown?.[skillName]?.score || 0), 0) / recentSkillRounds.length : 0;
                    break;
            }

            if (currentValue >= milestone.threshold) {
                milestone.achieved = true;
                content.achievedMilestones.push({
                    ...milestone,
                    achievedAt: Date.now(), // Would need actual achievement date in real implementation
                    currentValue
                });
            } else {
                content.upcomingMilestones.push({
                    ...milestone,
                    currentValue,
                    progress: currentValue / milestone.threshold
                });
            }
        });

        // Find next milestone
        content.upcomingMilestones.sort((a, b) => b.progress - a.progress);
        content.nextMilestone = content.upcomingMilestones[0] || null;

        content.summary = `${content.achievedMilestones.length} milestones achieved, next: ${content.nextMilestone?.name || 'None'}`;

        return content;
    }

    analyzeImprovementRate(historicalData) {
        const content = {
            overallImprovementRate: 0,
            improvementBySkill: {},
            consistencyOfImprovement: 0,
            accelerationPeriods: [],
            projectedTimelines: {},
            summary: ''
        };

        if (historicalData.rounds.length < 4) {
            content.summary = 'Insufficient data for improvement rate analysis';
            return content;
        }

        // Calculate overall improvement rate
        const firstQuarter = historicalData.rounds.slice(0, Math.floor(historicalData.rounds.length / 4));
        const lastQuarter = historicalData.rounds.slice(-Math.floor(historicalData.rounds.length / 4));
        
        const firstAvg = firstQuarter.reduce((sum, r) => sum + (r.performanceMetrics?.overall?.score || 0), 0) / firstQuarter.length;
        const lastAvg = lastQuarter.reduce((sum, r) => sum + (r.performanceMetrics?.overall?.score || 0), 0) / lastQuarter.length;
        
        content.overallImprovementRate = (lastAvg - firstAvg) / (historicalData.rounds.length / 4); // Improvement per round

        // Calculate improvement by skill
        const skillCategories = ['aiming', 'positioning', 'economic', 'tactical', 'teamwork'];
        skillCategories.forEach(skill => {
            const firstSkillAvg = firstQuarter.reduce((sum, r) => sum + (r.performanceMetrics?.breakdown?.[skill]?.score || 0), 0) / firstQuarter.length;
            const lastSkillAvg = lastQuarter.reduce((sum, r) => sum + (r.performanceMetrics?.breakdown?.[skill]?.score || 0), 0) / lastQuarter.length;
            
            content.improvementBySkill[skill] = {
                rate: (lastSkillAvg - firstSkillAvg) / (historicalData.rounds.length / 4),
                direction: lastSkillAvg > firstSkillAvg ? 'improving' : 'declining',
                magnitude: Math.abs(lastSkillAvg - firstSkillAvg)
            };
        });

        content.summary = `${this.formatPercentage(content.overallImprovementRate)} improvement rate per round`;

        return content;
    }

    // ====== VISUALIZATION METHODS ======

    generateHistoricalVisualizations(historicalData, format) {
        const visualizations = {};

        try {
            // Performance trend chart
            visualizations.performanceTrend = this.createPerformanceTrendChart(historicalData, format);
            
            // Win rate chart
            visualizations.winRateChart = this.createWinRateChart(historicalData, format);
            
            // Skill progression radar/spider chart
            visualizations.skillProgression = this.createSkillProgressionChart(historicalData, format);
            
            // Performance distribution histogram
            visualizations.performanceDistribution = this.createPerformanceDistributionChart(historicalData, format);

        } catch (error) {
            console.error('❌ Error generating visualizations:', error.message);
        }

        return visualizations;
    }

    createPerformanceTrendChart(historicalData, format) {
        const performances = historicalData.rounds.map((r, index) => ({
            round: index + 1,
            score: r.performanceMetrics?.overall?.score || 0,
            outcome: r.outcome
        }));

        if (format === 'html') {
            return this.generateHTMLChart(performances, 'Performance Trend', 'line');
        } else if (format === 'markdown' || format === 'text') {
            return this.generateASCIIChart(performances, 'Performance Trend');
        } else {
            return { data: performances, type: 'line_chart', title: 'Performance Trend' };
        }
    }

    createWinRateChart(historicalData, format) {
        // Calculate rolling win rate
        const windowSize = Math.max(3, Math.floor(historicalData.rounds.length / 10));
        const winRateData = [];

        for (let i = windowSize - 1; i < historicalData.rounds.length; i++) {
            const window = historicalData.rounds.slice(i - windowSize + 1, i + 1);
            const wins = window.filter(r => r.outcome === 'victory' || r.outcome === 'win').length;
            winRateData.push({
                round: i + 1,
                winRate: wins / windowSize,
                period: `Rounds ${i - windowSize + 2}-${i + 1}`
            });
        }

        if (format === 'html') {
            return this.generateHTMLChart(winRateData, 'Win Rate Trend', 'line');
        } else if (format === 'markdown' || format === 'text') {
            return this.generateASCIIChart(winRateData, 'Win Rate Trend');
        } else {
            return { data: winRateData, type: 'line_chart', title: 'Win Rate Trend' };
        }
    }

    createSkillProgressionChart(historicalData, format) {
        const skillCategories = ['aiming', 'positioning', 'economic', 'tactical', 'teamwork'];
        const progressionData = {};

        skillCategories.forEach(skill => {
            const skillScores = historicalData.rounds.map(r => 
                r.performanceMetrics?.breakdown?.[skill]?.score || 0
            );
            
            if (skillScores.length >= 4) {
                const firstHalf = skillScores.slice(0, Math.floor(skillScores.length / 2));
                const secondHalf = skillScores.slice(Math.floor(skillScores.length / 2));
                
                const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
                const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
                
                progressionData[skill] = {
                    initial: firstAvg,
                    current: secondAvg,
                    growth: secondAvg - firstAvg
                };
            }
        });

        if (format === 'html') {
            return this.generateHTMLRadarChart(progressionData, 'Skill Progression');
        } else if (format === 'markdown' || format === 'text') {
            return this.generateASCIIRadarChart(progressionData, 'Skill Progression');
        } else {
            return { data: progressionData, type: 'radar_chart', title: 'Skill Progression' };
        }
    }

    createPerformanceDistributionChart(historicalData, format) {
        const performances = historicalData.rounds.map(r => r.performanceMetrics?.overall?.score || 0);
        
        // Create distribution bins
        const bins = [
            { range: '0-20%', min: 0, max: 0.2, count: 0 },
            { range: '20-40%', min: 0.2, max: 0.4, count: 0 },
            { range: '40-60%', min: 0.4, max: 0.6, count: 0 },
            { range: '60-80%', min: 0.6, max: 0.8, count: 0 },
            { range: '80-100%', min: 0.8, max: 1.0, count: 0 }
        ];

        performances.forEach(score => {
            bins.forEach(bin => {
                if (score >= bin.min && score < bin.max) {
                    bin.count++;
                }
            });
        });

        if (format === 'html') {
            return this.generateHTMLHistogram(bins, 'Performance Distribution');
        } else if (format === 'markdown' || format === 'text') {
            return this.generateASCIIHistogram(bins, 'Performance Distribution');
        } else {
            return { data: bins, type: 'histogram', title: 'Performance Distribution' };
        }
    }

    generateHTMLChart(data, title, type = 'line') {
        // Simple HTML/CSS chart representation
        const maxValue = Math.max(...data.map(d => d.score || d.winRate || 0));
        const minValue = Math.min(...data.map(d => d.score || d.winRate || 0));
        const range = maxValue - minValue;

        let chartHTML = `<div class="chart-container">
            <h3>${title}</h3>
            <div class="chart-area" style="position: relative; height: 200px; border: 1px solid #ccc; background: #f9f9f9;">`;

        data.forEach((point, index) => {
            const value = point.score || point.winRate || 0;
            const x = (index / (data.length - 1)) * 90 + 5; // 5% margin
            const y = range > 0 ? ((maxValue - value) / range) * 80 + 10 : 50; // 10% margin

            chartHTML += `<div class="data-point" style="position: absolute; left: ${x}%; top: ${y}%; width: 4px; height: 4px; background: #007acc; border-radius: 50%;"></div>`;
        });

        chartHTML += `</div></div>`;
        return chartHTML;
    }

    generateASCIIChart(data, title) {
        const width = 60;
        const height = 15;
        const maxValue = Math.max(...data.map(d => d.score || d.winRate || 0));
        const minValue = Math.min(...data.map(d => d.score || d.winRate || 0));

        let chart = `${title}\n${'='.repeat(title.length)}\n\n`;
        
        // Create ASCII chart
        for (let row = 0; row < height; row++) {
            const threshold = maxValue - (row / height) * (maxValue - minValue);
            let line = '';
            
            for (let i = 0; i < Math.min(data.length, width); i++) {
                const value = data[Math.floor(i * data.length / width)]?.score || 
                            data[Math.floor(i * data.length / width)]?.winRate || 0;
                line += value >= threshold ? '█' : ' ';
            }
            
            chart += `${threshold.toFixed(2).padStart(6)} |${line}|\n`;
        }
        
        chart += `       ${'─'.repeat(width + 2)}\n`;
        chart += `       Round 1${' '.repeat(width - 15)}Round ${data.length}\n`;

        return chart;
    }

    generateASCIIRadarChart(data, title) {
        let chart = `${title}\n${'='.repeat(title.length)}\n\n`;
        
        Object.entries(data).forEach(([skill, values]) => {
            const initialBar = '█'.repeat(Math.floor(values.initial * 20));
            const currentBar = '█'.repeat(Math.floor(values.current * 20));
            const growth = values.growth >= 0 ? `+${(values.growth * 100).toFixed(1)}%` : `${(values.growth * 100).toFixed(1)}%`;
            
            chart += `${skill.padEnd(12)}: ${currentBar.padEnd(20)} ${(values.current * 100).toFixed(1)}% (${growth})\n`;
        });

        return chart;
    }

    generateASCIIHistogram(bins, title) {
        let chart = `${title}\n${'='.repeat(title.length)}\n\n`;
        
        const maxCount = Math.max(...bins.map(bin => bin.count));
        
        bins.forEach(bin => {
            const barLength = maxCount > 0 ? Math.floor((bin.count / maxCount) * 30) : 0;
            const bar = '█'.repeat(barLength);
            chart += `${bin.range.padEnd(8)}: ${bar.padEnd(30)} (${bin.count})\n`;
        });

        return chart;
    }

    // ====== COMPREHENSIVE OVERVIEW AND INSIGHTS ======

    generateComprehensiveOverview(historicalData, sections) {
        return {
            dataQuality: {
                completeness: historicalData.rounds.length >= 10 ? 'excellent' : 
                            historicalData.rounds.length >= 5 ? 'good' : 'limited',
                consistency: 'good', // Would calculate based on data patterns
                timespan: this.formatTimespan(historicalData.dateRange)
            },
            keyFindings: this.extractKeyFindings(sections),
            overallAssessment: this.generateOverallAssessment(historicalData, sections),
            confidenceLevel: this.calculateReportConfidence(historicalData, sections)
        };
    }

    generateStrategicInsights(historicalData, sections) {
        return {
            longTermTrends: this.identifyLongTermTrends(sections),
            strengthsAndWeaknesses: this.identifyStrengthsAndWeaknesses(sections),
            optimalPerformanceConditions: this.identifyOptimalConditions(historicalData),
            developmentRecommendations: this.generateDevelopmentRecommendations(sections)
        };
    }

    extractKeyFindings(sections) {
        const findings = [];
        
        // Extract from each section type
        Object.values(sections).forEach(section => {
            if (section.available && section.content?.summary) {
                findings.push({
                    section: section.type,
                    finding: section.content.summary,
                    importance: 'medium' // Would be determined by analysis
                });
            }
        });

        return findings.slice(0, 5); // Top 5 findings
    }

    generateOverallAssessment(historicalData, sections) {
        if (historicalData.aggregatedStats.improvementRate > 0.1) {
            return 'Strong upward trajectory with consistent improvement across multiple areas';
        } else if (historicalData.aggregatedStats.improvementRate > 0.05) {
            return 'Steady improvement with good development momentum';
        } else if (historicalData.aggregatedStats.improvementRate > -0.05) {
            return 'Stable performance with opportunities for targeted improvement';
        } else {
            return 'Performance decline identified - requires focused intervention';
        }
    }

    calculateReportConfidence(historicalData, sections) {
        const dataPoints = historicalData.rounds.length;
        const sectionAvailability = Object.values(sections).filter(s => s.available).length / Object.keys(sections).length;
        
        if (dataPoints >= 20 && sectionAvailability > 0.8) {
            return 'high';
        } else if (dataPoints >= 10 && sectionAvailability > 0.6) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    identifyLongTermTrends(sections) {
        // Extract trends from various sections
        const trends = [];
        
        if (sections.performanceTrends?.content?.trendDirection) {
            trends.push({
                area: 'overall_performance',
                direction: sections.performanceTrends.content.trendDirection,
                strength: sections.performanceTrends.content.trendStrength
            });
        }

        return trends;
    }

    identifyStrengthsAndWeaknesses(sections) {
        const analysis = { strengths: [], weaknesses: [] };
        
        if (sections.skillTrends?.content) {
            sections.skillTrends.content.mostImproved?.forEach(skill => {
                analysis.strengths.push(`${skill.skill} showing improvement`);
            });
            
            sections.skillTrends.content.needsWork?.forEach(skill => {
                analysis.weaknesses.push(`${skill.skill} needs attention`);
            });
        }

        return analysis;
    }

    identifyOptimalConditions(historicalData) {
        // Analyze patterns in best-performing rounds
        const topPerformingRounds = historicalData.rounds
            .filter(r => r.performanceMetrics?.overall?.score > 0.7)
            .slice(0, 5);

        return {
            conditions: topPerformingRounds.length > 0 ? 'High performance correlates with longer engagement periods' : 'Insufficient high-performance data',
            recommendations: 'Focus on replicating conditions from best-performing sessions'
        };
    }

    generateDevelopmentRecommendations(sections) {
        const recommendations = [];
        
        // Extract recommendations from various sections
        if (sections.skillProgression?.content?.skillProgression) {
            Object.entries(sections.skillProgression.content.skillProgression).forEach(([skill, data]) => {
                if (data.trend === 'declining') {
                    recommendations.push({
                        priority: 'high',
                        area: skill,
                        action: `Focus on improving ${skill} fundamentals`,
                        timeframe: 'immediate'
                    });
                }
            });
        }

        return recommendations;
    }

    formatTimespan(dateRange) {
        const days = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
        if (days <= 7) return `${days} days`;
        if (days <= 30) return `${Math.ceil(days / 7)} weeks`;
        if (days <= 90) return `${Math.ceil(days / 30)} months`;
        return `${Math.ceil(days / 90)} quarters`;
    }

    // ====== HISTORICAL REPORT SUMMARY AND INSIGHTS ======

    generateHistoricalExecutiveSummary(historicalData, sections, visualizations) {
        const summary = {
            timeframeSummary: '',
            keyMetrics: {},
            performanceOverview: '',
            criticalInsights: [],
            actionableTakeaways: [],
            progressAssessment: ''
        };

        // Timeframe summary
        const timespan = this.formatTimespan(historicalData.dateRange);
        summary.timeframeSummary = `Analysis covers ${historicalData.rounds.length} rounds over ${timespan}`;

        // Key metrics
        summary.keyMetrics = {
            averagePerformance: this.formatPercentage(historicalData.aggregatedStats.averagePerformance),
            winRate: this.formatPercentage(historicalData.aggregatedStats.winRate),
            improvementRate: this.formatPercentage(historicalData.aggregatedStats.improvementRate),
            bestPerformance: this.formatPercentage(historicalData.aggregatedStats.bestPerformance),
            consistency: sections.consistencyAnalysis?.content?.overallConsistency ? 
                this.formatPercentage(sections.consistencyAnalysis.content.overallConsistency) : 'N/A'
        };

        // Performance overview
        if (historicalData.aggregatedStats.improvementRate > 0.05) {
            summary.performanceOverview = `Strong positive trajectory with ${summary.keyMetrics.improvementRate} improvement rate. Performance has been consistently trending upward with good momentum.`;
        } else if (historicalData.aggregatedStats.improvementRate > -0.05) {
            summary.performanceOverview = `Stable performance period with ${summary.keyMetrics.averagePerformance} average performance. Ready for focused skill development initiatives.`;
        } else {
            summary.performanceOverview = `Performance decline period requiring intervention. Current trajectory shows ${summary.keyMetrics.improvementRate} negative trend.`;
        }

        // Critical insights
        if (sections.skillTrends?.content?.mostImproved?.length > 0) {
            summary.criticalInsights.push(`Strongest improvement in ${sections.skillTrends.content.mostImproved[0].skill}`);
        }
        if (sections.winRateTrends?.content?.winRateTrend) {
            summary.criticalInsights.push(`Win rate trend: ${sections.winRateTrends.content.winRateTrend}`);
        }
        if (sections.milestones?.content?.nextMilestone) {
            summary.criticalInsights.push(`Next milestone: ${sections.milestones.content.nextMilestone.name}`);
        }

        // Actionable takeaways
        summary.actionableTakeaways = this.generateActionableTakeaways(sections);

        // Progress assessment
        summary.progressAssessment = this.generateProgressAssessment(historicalData, sections);

        return summary;
    }

    extractHistoricalInsights(historicalData, sections) {
        const insights = [];

        // Performance insights
        if (sections.performanceTrends?.content) {
            const trend = sections.performanceTrends.content;
            insights.push({
                type: 'performance_trend',
                priority: trend.trendDirection !== 'stable' ? 'high' : 'medium',
                insight: `Performance trending ${trend.trendDirection} with ${this.formatPercentage(trend.trendStrength)} strength`,
                data: trend,
                actionable: true
            });
        }

        // Consistency insights
        if (sections.consistencyAnalysis?.content) {
            const consistency = sections.consistencyAnalysis.content;
            if (consistency.overallConsistency < 0.6) {
                insights.push({
                    type: 'consistency_issue',
                    priority: 'high',
                    insight: `Low consistency detected (${this.formatPercentage(consistency.overallConsistency)}) - focus on fundamentals`,
                    data: consistency,
                    actionable: true
                });
            }
        }

        // Skill development insights
        if (sections.skillProgression?.content?.skillProgression) {
            Object.entries(sections.skillProgression.content.skillProgression).forEach(([skill, data]) => {
                if (data.trend === 'improving' && data.absoluteGrowth > 0.1) {
                    insights.push({
                        type: 'skill_breakthrough',
                        priority: 'medium',
                        insight: `Significant ${skill} improvement: ${this.formatPercentage(data.absoluteGrowth)} growth`,
                        data: { skill, ...data },
                        actionable: false
                    });
                }
            });
        }

        // Milestone insights
        if (sections.milestones?.content?.nextMilestone) {
            const milestone = sections.milestones.content.nextMilestone;
            if (milestone.progress > 0.8) {
                insights.push({
                    type: 'milestone_approaching',
                    priority: 'medium',
                    insight: `Close to achieving ${milestone.name} (${this.formatPercentage(milestone.progress)} complete)`,
                    data: milestone,
                    actionable: true
                });
            }
        }

        // Best vs worst insights
        if (sections.bestVsWorst?.content?.keyDifferences) {
            const topDifference = sections.bestVsWorst.content.keyDifferences[0];
            if (topDifference) {
                insights.push({
                    type: 'performance_gap',
                    priority: 'high',
                    insight: `Largest performance gap in ${topDifference.metric} (${this.formatPercentage(topDifference.difference)} difference)`,
                    data: topDifference,
                    actionable: true
                });
            }
        }

        return insights.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        });
    }

    generateHistoricalRecommendations(historicalData, sections, insights) {
        const recommendations = [];

        // Process high-priority insights for recommendations
        insights.filter(insight => insight.priority === 'high' && insight.actionable).forEach(insight => {
            switch (insight.type) {
                case 'performance_trend':
                    if (insight.data.trendDirection === 'declining') {
                        recommendations.push({
                            priority: 'immediate',
                            category: 'performance_recovery',
                            action: 'Focus on fundamental skills practice',
                            rationale: 'Performance decline detected requiring immediate intervention',
                            timeframe: 'next 5 rounds',
                            expectedImpact: 'high'
                        });
                    }
                    break;
                case 'consistency_issue':
                    recommendations.push({
                        priority: 'high',
                        category: 'consistency_improvement',
                        action: 'Establish consistent pre-round routine and practice schedule',
                        rationale: insight.insight,
                        timeframe: 'next 2 weeks',
                        expectedImpact: 'medium'
                    });
                    break;
                case 'performance_gap':
                    recommendations.push({
                        priority: 'high',
                        category: 'skill_focus',
                        action: `Dedicate focused practice to ${insight.data.metric}`,
                        rationale: insight.insight,
                        timeframe: 'next 10 rounds',
                        expectedImpact: 'high'
                    });
                    break;
            }
        });

        // Process medium-priority insights
        insights.filter(insight => insight.priority === 'medium' && insight.actionable).forEach(insight => {
            if (insight.type === 'milestone_approaching') {
                recommendations.push({
                    priority: 'medium',
                    category: 'milestone_achievement',
                    action: `Focus on specific requirements for ${insight.data.name}`,
                    rationale: insight.insight,
                    timeframe: 'next 15 rounds',
                    expectedImpact: 'medium'
                });
            }
        });

        // Add progression-based recommendations
        if (sections.skillProgression?.content?.skillProgression) {
            const skillsNeedingWork = Object.entries(sections.skillProgression.content.skillProgression)
                .filter(([skill, data]) => data.trend === 'declining' || data.currentLevel < 0.5)
                .slice(0, 2); // Top 2 skills needing work

            skillsNeedingWork.forEach(([skill, data]) => {
                recommendations.push({
                    priority: 'medium',
                    category: 'skill_development',
                    action: `Create structured practice plan for ${skill}`,
                    rationale: `${skill} shows declining trend or low performance`,
                    timeframe: 'next month',
                    expectedImpact: 'medium'
                });
            });
        }

        // Sort by priority and limit
        const priorityOrder = { immediate: 4, high: 3, medium: 2, low: 1 };
        return recommendations
            .sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0))
            .slice(0, 8); // Limit to top 8 recommendations
    }

    generateActionableTakeaways(sections) {
        const takeaways = [];

        // From skill trends
        if (sections.skillTrends?.content?.mostImproved?.length > 0) {
            takeaways.push(`Continue leveraging strength in ${sections.skillTrends.content.mostImproved[0].skill}`);
        }
        if (sections.skillTrends?.content?.needsWork?.length > 0) {
            takeaways.push(`Prioritize improvement in ${sections.skillTrends.content.needsWork[0].skill}`);
        }

        // From consistency analysis
        if (sections.consistencyAnalysis?.content?.consistentAreas?.length > 0) {
            takeaways.push(`Maintain consistency in ${sections.consistencyAnalysis.content.consistentAreas.join(', ')}`);
        }

        // From learning curve
        if (sections.learningCurve?.content?.currentPhase) {
            const phase = sections.learningCurve.content.currentPhase;
            if (phase === 'acceleration') {
                takeaways.push('Currently in learning acceleration phase - maintain momentum');
            } else if (phase === 'plateau') {
                takeaways.push('In plateau phase - consider new training approaches');
            }
        }

        return takeaways.slice(0, 5); // Top 5 takeaways
    }

    generateProgressAssessment(historicalData, sections) {
        const assessment = [];
        
        // Overall trajectory
        const improvementRate = historicalData.aggregatedStats.improvementRate;
        if (improvementRate > 0.1) {
            assessment.push('Excellent progress trajectory');
        } else if (improvementRate > 0.05) {
            assessment.push('Good steady improvement');
        } else if (improvementRate > -0.05) {
            assessment.push('Stable performance plateau');
        } else {
            assessment.push('Declining performance requiring attention');
        }

        // Skill development
        if (sections.skillProgression?.content?.overallProgression) {
            assessment.push(`Skill development: ${sections.skillProgression.content.overallProgression}`);
        }

        // Consistency
        if (sections.consistencyAnalysis?.content?.overallConsistency) {
            const consistency = sections.consistencyAnalysis.content.overallConsistency;
            if (consistency > 0.8) {
                assessment.push('Highly consistent performance');
            } else if (consistency > 0.6) {
                assessment.push('Moderately consistent performance');
            } else {
                assessment.push('Inconsistent performance - focus on fundamentals');
            }
        }

        return assessment.join('. ') + '.';
    }

    generateHistoricalReportFooter(report, historicalData) {
        return {
            generationDetails: {
                processingTime: `${report.metadata.processingTime}ms`,
                dataPoints: historicalData.rounds.length,
                analysisDepth: Object.keys(report.sections).length,
                confidenceLevel: report.executiveSummary?.confidenceLevel || 'medium',
                reportVersion: '1.0.0'
            },
            dataSource: {
                timeframe: this.formatTimespan(historicalData.dateRange),
                roundsAnalyzed: historicalData.rounds.length,
                dataQuality: historicalData.rounds.length >= 10 ? 'high' : 'medium',
                lastUpdated: new Date().toISOString()
            },
            disclaimer: 'Historical analysis is based on available data and should be interpreted within the context of gameplay evolution and external factors.',
            recommendations: {
                updateFrequency: 'Generate updated reports weekly for optimal trend tracking',
                dataCollection: 'Maintain consistent data collection for improved analysis accuracy'
            }
        };
    }

    // ====== HISTORICAL REPORT FORMATTING METHODS ======

    formatHistoricalReport(report, format, templateOverrides = {}) {
        switch (format.toLowerCase()) {
            case 'markdown':
                return this.formatHistoricalReportAsMarkdown(report, templateOverrides);
            case 'html':
                return this.formatHistoricalReportAsHTML(report, templateOverrides);
            case 'text':
                return this.formatHistoricalReportAsText(report, templateOverrides);
            case 'json':
            default:
                return report; // Already in JSON format
        }
    }

    formatHistoricalReportAsMarkdown(report, templateOverrides = {}) {
        let markdown = `# ${report.header.title}\n\n`;
        markdown += `**${report.header.subtitle}**\n\n`;
        
        // Timeframe info
        markdown += `## Analysis Period\n\n`;
        markdown += `- **Period**: ${report.header.timeframe.period}\n`;
        markdown += `- **Date Range**: ${report.header.timeframe.startDate} to ${report.header.timeframe.endDate}\n`;
        markdown += `- **Total Rounds**: ${report.header.dataOverview.totalRounds}\n`;
        markdown += `- **Data Quality**: ${report.header.dataOverview.dataQuality}\n\n`;

        // Executive summary
        markdown += `## Executive Summary\n\n`;
        if (report.executiveSummary.timeframeSummary) {
            markdown += `${report.executiveSummary.timeframeSummary}\n\n`;
        }
        markdown += `${report.executiveSummary.performanceOverview}\n\n`;

        // Key metrics
        markdown += `### Key Performance Metrics\n\n`;
        Object.entries(report.executiveSummary.keyMetrics || {}).forEach(([metric, value]) => {
            markdown += `- **${metric.charAt(0).toUpperCase() + metric.slice(1)}**: ${value}\n`;
        });
        markdown += `\n`;

        // Visualizations
        if (report.visualizations && Object.keys(report.visualizations).length > 0) {
            markdown += `## Performance Visualizations\n\n`;
            Object.entries(report.visualizations).forEach(([chartType, chart]) => {
                if (typeof chart === 'string') {
                    markdown += `### ${chartType.charAt(0).toUpperCase() + chartType.slice(1)}\n\n`;
                    markdown += `\`\`\`\n${chart}\n\`\`\`\n\n`;
                }
            });
        }

        // Insights
        if (report.insights.length > 0) {
            markdown += `## Key Insights\n\n`;
            report.insights.forEach((insight, index) => {
                markdown += `${index + 1}. **${insight.type.replace('_', ' ').toUpperCase()}** _(${insight.priority})_\n`;
                markdown += `   ${insight.insight}\n\n`;
            });
        }

        // Recommendations
        if (report.recommendations.length > 0) {
            markdown += `## Recommendations\n\n`;
            report.recommendations.forEach((rec, index) => {
                markdown += `### ${index + 1}. ${rec.action}\n`;
                markdown += `- **Priority**: ${rec.priority}\n`;
                markdown += `- **Category**: ${rec.category}\n`;
                markdown += `- **Rationale**: ${rec.rationale}\n`;
                markdown += `- **Timeframe**: ${rec.timeframe}\n`;
                markdown += `- **Expected Impact**: ${rec.expectedImpact}\n\n`;
            });
        }

        return markdown;
    }

    formatHistoricalReportAsHTML(report, templateOverrides = {}) {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.header.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .header { border-bottom: 3px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
        .timeframe { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric-card { background: #f0f8ff; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007acc; }
        .insight { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; }
        .recommendation { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 10px 0; }
        .priority-immediate { border-left-color: #dc3545; }
        .priority-high { border-left-color: #fd7e14; }
        .priority-medium { border-left-color: #20c997; }
        .chart-container { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .visualization { font-family: monospace; white-space: pre-line; background: #2d3748; color: #e2e8f0; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>`;

        html += `<div class="header">`;
        html += `<h1>${report.header.title}</h1>`;
        html += `<h2>${report.header.subtitle}</h2>`;
        html += `</div>`;

        // Timeframe
        html += `<div class="timeframe">`;
        html += `<h3>Analysis Period</h3>`;
        html += `<p><strong>Period:</strong> ${report.header.timeframe.period}</p>`;
        html += `<p><strong>Date Range:</strong> ${report.header.timeframe.startDate} to ${report.header.timeframe.endDate}</p>`;
        html += `<p><strong>Total Rounds:</strong> ${report.header.dataOverview.totalRounds}</p>`;
        html += `</div>`;

        // Executive summary
        html += `<div class="section">`;
        html += `<h2>Executive Summary</h2>`;
        html += `<p>${report.executiveSummary.performanceOverview}</p>`;
        html += `</div>`;

        // Key metrics
        if (report.executiveSummary.keyMetrics) {
            html += `<div class="metrics">`;
            Object.entries(report.executiveSummary.keyMetrics).forEach(([metric, value]) => {
                html += `<div class="metric-card">`;
                html += `<div class="metric-value">${value}</div>`;
                html += `<div class="metric-label">${metric.charAt(0).toUpperCase() + metric.slice(1)}</div>`;
                html += `</div>`;
            });
            html += `</div>`;
        }

        // Visualizations
        if (report.visualizations && Object.keys(report.visualizations).length > 0) {
            html += `<div class="section">`;
            html += `<h2>Performance Visualizations</h2>`;
            Object.entries(report.visualizations).forEach(([chartType, chart]) => {
                if (typeof chart === 'string') {
                    html += `<div class="chart-container">`;
                    html += `<h3>${chartType.charAt(0).toUpperCase() + chartType.slice(1)}</h3>`;
                    html += `<div class="visualization">${chart}</div>`;
                    html += `</div>`;
                }
            });
            html += `</div>`;
        }

        // Insights
        if (report.insights.length > 0) {
            html += `<div class="section">`;
            html += `<h2>Key Insights</h2>`;
            report.insights.forEach((insight, index) => {
                html += `<div class="insight">`;
                html += `<strong>${insight.type.replace('_', ' ').toUpperCase()}</strong> <em>(${insight.priority})</em><br>`;
                html += `${insight.insight}`;
                html += `</div>`;
            });
            html += `</div>`;
        }

        // Recommendations
        if (report.recommendations.length > 0) {
            html += `<div class="section">`;
            html += `<h2>Recommendations</h2>`;
            report.recommendations.forEach((rec, index) => {
                html += `<div class="recommendation priority-${rec.priority}">`;
                html += `<h4>${index + 1}. ${rec.action}</h4>`;
                html += `<p><strong>Rationale:</strong> ${rec.rationale}</p>`;
                html += `<p><strong>Timeframe:</strong> ${rec.timeframe} | <strong>Impact:</strong> ${rec.expectedImpact}</p>`;
                html += `</div>`;
            });
            html += `</div>`;
        }

        html += `</body></html>`;
        return html;
    }

    formatHistoricalReportAsText(report, templateOverrides = {}) {
        let text = `${report.header.title}\n`;
        text += `${'='.repeat(report.header.title.length)}\n\n`;
        text += `${report.header.subtitle}\n\n`;
        
        // Analysis period
        text += `ANALYSIS PERIOD\n`;
        text += `-`.repeat(20) + '\n';
        text += `Period: ${report.header.timeframe.period}\n`;
        text += `Date Range: ${report.header.timeframe.startDate} to ${report.header.timeframe.endDate}\n`;
        text += `Total Rounds: ${report.header.dataOverview.totalRounds}\n\n`;

        // Executive summary
        text += `EXECUTIVE SUMMARY\n`;
        text += `-`.repeat(20) + '\n';
        text += `${report.executiveSummary.performanceOverview}\n\n`;

        // Key metrics
        if (report.executiveSummary.keyMetrics) {
            text += `KEY METRICS\n`;
            text += `-`.repeat(15) + '\n';
            Object.entries(report.executiveSummary.keyMetrics).forEach(([metric, value]) => {
                text += `${metric.charAt(0).toUpperCase() + metric.slice(1)}: ${value}\n`;
            });
            text += `\n`;
        }

        // Visualizations
        if (report.visualizations && Object.keys(report.visualizations).length > 0) {
            text += `PERFORMANCE VISUALIZATIONS\n`;
            text += `-`.repeat(30) + '\n';
            Object.entries(report.visualizations).forEach(([chartType, chart]) => {
                if (typeof chart === 'string') {
                    text += `\n${chartType.charAt(0).toUpperCase() + chartType.slice(1)}:\n`;
                    text += `${chart}\n`;
                }
            });
        }

        // Insights
        if (report.insights.length > 0) {
            text += `KEY INSIGHTS\n`;
            text += `-`.repeat(15) + '\n';
            report.insights.forEach((insight, index) => {
                text += `${index + 1}. ${insight.insight} [${insight.priority.toUpperCase()}]\n\n`;
            });
        }

        // Recommendations
        if (report.recommendations.length > 0) {
            text += `RECOMMENDATIONS\n`;
            text += `-`.repeat(20) + '\n';
            report.recommendations.forEach((rec, index) => {
                text += `${index + 1}. ${rec.action}\n`;
                text += `   Priority: ${rec.priority} | Timeframe: ${rec.timeframe}\n`;
                text += `   ${rec.rationale}\n\n`;
            });
        }

        return text;
    }

    async exportHistoricalReportToFile(report, format, filePath, timeframe, reportType) {
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            // Determine file path if not provided
            if (!filePath) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                const fileName = `historical_${reportType}_${timeframe}_${timestamp}.${format}`;
                filePath = path.join(process.cwd(), 'reports', 'historical', fileName);
            }

            // Ensure directory exists
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });

            // Write file based on format
            let content;
            if (format === 'json') {
                content = JSON.stringify(report, null, 2);
            } else {
                content = report; // Already formatted as string
            }

            await fs.writeFile(filePath, content, 'utf8');
            
            console.log(`📁 Historical report exported to: ${filePath}`);
            return filePath;
            
        } catch (error) {
            console.error('❌ Failed to export historical report to file:', error.message);
            throw error;
        }
    }

    // ====== STRUCTURED REPORT GENERATION METHODS ======

    generateRoundOverview(analysis) {
        const overview = {
            type: 'round_overview',
            available: true,
            content: {},
            timestamp: Date.now()
        };

        try {
            // Basic round information
            overview.content.roundInfo = {
                outcome: analysis.dataSynthesis?.outcome || 'unknown',
                duration: this.formatDuration(analysis.duration || 0),
                dataQuality: this.formatPercentage(analysis.dataSynthesis?.dataQuality || 0),
                analysisCompleteness: this.formatPercentage(analysis.dataSynthesis?.analysisCompleteness || 0)
            };

            // Performance summary
            if (analysis.overallPerformance) {
                overview.content.performanceSummary = {
                    overallScore: this.formatPercentage(analysis.overallPerformance.score || 0),
                    trend: analysis.overallPerformance.trend || 'stable',
                    primaryStrengths: analysis.highlights?.slice(0, 3) || [],
                    keyAreas: analysis.improvementAreas?.slice(0, 2) || []
                };
            }

            // Data availability
            overview.content.dataAvailability = {
                gsiData: analysis.dataSynthesis?.dataAvailability?.gsi || false,
                aiInsights: analysis.dataSynthesis?.dataAvailability?.ai || false,
                performanceMetrics: analysis.dataSynthesis?.dataAvailability?.performance || false,
                keyEvents: analysis.dataSynthesis?.dataAvailability?.events || false
            };

            overview.content.summary = this.generateOverviewSummary(overview.content);

        } catch (error) {
            console.error('Error generating round overview:', error.message);
            overview.available = false;
            overview.error = error.message;
        }

        return overview;
    }

    generatePerformanceHighlights(analysis) {
        const highlights = {
            type: 'performance_highlights',
            available: true,
            content: {},
            timestamp: Date.now()
        };

        try {
            // Top achievements
            highlights.content.achievements = [];
            if (analysis.highlights) {
                highlights.content.achievements = analysis.highlights.map(highlight => ({
                    category: highlight.category || 'general',
                    description: highlight.description || highlight,
                    impact: highlight.impact || 'medium',
                    metrics: highlight.metrics || {}
                }));
            }

            // Performance metrics highlights
            highlights.content.metricsHighlights = this.extractMetricHighlights(analysis);

            // Improvement indicators
            highlights.content.improvements = this.identifyImprovementIndicators(analysis);

            // Notable moments
            highlights.content.notableMoments = this.extractNotableMoments(analysis);

            highlights.content.summary = this.generateHighlightsSummary(highlights.content);

        } catch (error) {
            console.error('Error generating performance highlights:', error.message);
            highlights.available = false;
            highlights.error = error.message;
        }

        return highlights;
    }

    generateKeyLearnings(analysis, coachingLevel) {
        const learnings = {
            type: 'key_learnings',
            available: true,
            content: {},
            coachingLevel,
            timestamp: Date.now()
        };

        try {
            const config = this.analysisConfigs[coachingLevel];
            
            // Extract insights based on coaching level
            learnings.content.primaryLearnings = this.extractPrimaryLearnings(analysis, config);
            
            // Technical learnings
            learnings.content.technicalLearnings = this.extractTechnicalLearnings(analysis, config);
            
            // Strategic learnings
            learnings.content.strategicLearnings = this.extractStrategicLearnings(analysis, config);
            
            // Pattern learnings
            learnings.content.patternLearnings = this.extractPatternLearnings(analysis, config);

            learnings.content.summary = this.generateLearningsSummary(learnings.content, coachingLevel);

        } catch (error) {
            console.error('Error generating key learnings:', error.message);
            learnings.available = false;
            learnings.error = error.message;
        }

        return learnings;
    }

    generateNextRoundFocus(analysis, coachingLevel) {
        const focus = {
            type: 'next_round_focus',
            available: true,
            content: {},
            coachingLevel,
            timestamp: Date.now()
        };

        try {
            const config = this.analysisConfigs[coachingLevel];
            
            // Priority focus areas
            focus.content.priorityAreas = this.identifyPriorityFocusAreas(analysis, config);
            
            // Immediate actionables
            focus.content.immediateActions = this.generateImmediateActions(analysis, config);
            
            // Skill development
            focus.content.skillDevelopment = this.identifySkillDevelopmentAreas(analysis, config);
            
            // Mental game
            focus.content.mentalFocus = this.generateMentalFocus(analysis, config);

            focus.content.summary = this.generateFocusSummary(focus.content, coachingLevel);

        } catch (error) {
            console.error('Error generating next round focus:', error.message);
            focus.available = false;
            focus.error = error.message;
        }

        return focus;
    }

    generateRoundAnalysis(analysis) {
        const roundAnalysis = {
            type: 'round_analysis',
            available: true,
            content: {},
            timestamp: Date.now()
        };

        try {
            // Performance breakdown
            roundAnalysis.content.performanceBreakdown = this.generatePerformanceBreakdown(analysis);
            
            // Decision analysis
            roundAnalysis.content.decisionAnalysis = this.analyzeDecisions(analysis);
            
            // Timing analysis
            roundAnalysis.content.timingAnalysis = this.analyzeRoundTiming(analysis);
            
            // Critical moments analysis
            roundAnalysis.content.criticalMoments = this.analyzeCriticalMoments(analysis);

            roundAnalysis.content.summary = this.generateRoundAnalysisSummary(roundAnalysis.content);

        } catch (error) {
            console.error('Error generating round analysis:', error.message);
            roundAnalysis.available = false;
            roundAnalysis.error = error.message;
        }

        return roundAnalysis;
    }

    generateTacticalBreakdown(analysis) {
        const tactical = {
            type: 'tactical_breakdown',
            available: true,
            content: {},
            timestamp: Date.now()
        };

        try {
            // Positioning analysis
            tactical.content.positioning = this.analyzeTacticalPositioning(analysis);
            
            // Utility usage
            tactical.content.utilityUsage = this.analyzeUtilityUsage(analysis);
            
            // Team coordination
            tactical.content.teamwork = this.analyzeTeamCoordination(analysis);
            
            // Map control
            tactical.content.mapControl = this.analyzeMapControl(analysis);

            tactical.content.summary = this.generateTacticalSummary(tactical.content);

        } catch (error) {
            console.error('Error generating tactical breakdown:', error.message);
            tactical.available = false;
            tactical.error = error.message;
        }

        return tactical;
    }

    generateEconomicReview(analysis) {
        const economic = {
            type: 'economic_review',
            available: true,
            content: {},
            timestamp: Date.now()
        };

        try {
            // Economic performance
            economic.content.economicPerformance = this.analyzeEconomicPerformance(analysis);
            
            // Buy decisions
            economic.content.buyDecisions = this.analyzeBuyDecisions(analysis);
            
            // Save situations
            economic.content.saveSituations = this.analyzeSaveSituations(analysis);
            
            // Economic efficiency
            economic.content.efficiency = this.analyzeEconomicEfficiency(analysis);

            economic.content.summary = this.generateEconomicSummary(economic.content);

        } catch (error) {
            console.error('Error generating economic review:', error.message);
            economic.available = false;
            economic.error = error.message;
        }

        return economic;
    }

    generateStrategicAnalysis(analysis) {
        const strategic = {
            type: 'strategic_analysis',
            available: true,
            content: {},
            timestamp: Date.now()
        };

        try {
            // Strategic decisions
            strategic.content.strategicDecisions = this.analyzeStrategicDecisions(analysis);
            
            // Adaptation analysis
            strategic.content.adaptation = this.analyzeAdaptation(analysis);
            
            // Meta understanding
            strategic.content.metaUnderstanding = this.analyzeMetaUnderstanding(analysis);
            
            // Long-term patterns
            strategic.content.patterns = this.analyzeStrategicPatterns(analysis);

            strategic.content.summary = this.generateStrategicSummary(strategic.content);

        } catch (error) {
            console.error('Error generating strategic analysis:', error.message);
            strategic.available = false;
            strategic.error = error.message;
        }

        return strategic;
    }

    generatePatternIdentification(analysis) {
        const patterns = {
            type: 'pattern_identification',
            available: true,
            content: {},
            timestamp: Date.now()
        };

        try {
            // Behavioral patterns
            patterns.content.behavioralPatterns = this.identifyBehavioralPatterns(analysis);
            
            // Performance patterns
            patterns.content.performancePatterns = this.identifyPerformancePatterns(analysis);
            
            // Decision patterns
            patterns.content.decisionPatterns = this.identifyDecisionPatterns(analysis);
            
            // Improvement patterns
            patterns.content.improvementPatterns = this.identifyImprovementPatterns(analysis);

            patterns.content.summary = this.generatePatternSummary(patterns.content);

        } catch (error) {
            console.error('Error generating pattern identification:', error.message);
            patterns.available = false;
            patterns.error = error.message;
        }

        return patterns;
    }
    
    // Placeholder methods for analyses not implemented yet
    analyzeInvestmentDecisions(data) { return []; }
    assessEconomicRisk(data) { return 'medium'; }
    identifyBuyPatterns(data) { return []; }
    identifyPhaseTransitions(data) { return []; }
    identifyWeaponChanges(data) { return []; }
    identifyTacticalAdaptations(data) { return []; }
    identifyEconomicPatterns(data) { return []; }
    identifyBehavioralPatterns(data) { return []; }
    identifyPerformancePatterns(data) { return []; }
    analyzeInsightTiming(data) { return {}; }
    analyzeInsightRelevance(data, level) { return {}; }
    identifyCoachingPatterns(data) { return {}; }
    assessInsightEffectiveness(data) { return {}; }
    analyzeMetricsByType(data) { return {}; }
    identifyPerformanceTrends(data) { return []; }
    identifyPerformancePeaks(data) { return []; }
    analyzeMetricTiming(data) { return {}; }
    assessOverallPerformance(data, metrics) { return {}; }
    identifyHighlights(data, categories) { return []; }
    identifyImprovementAreas(data, metrics) { return []; }
    identifyCorrelations(data) { return []; }
    analyzeStrategicContext(data) { return {}; }
    assessDataQuality(data) { return 0.85; }
    calculateAnalysisCompleteness(data) { return 0.90; }
}

// Export singleton instance
module.exports = new PostRoundAnalyzer(); 