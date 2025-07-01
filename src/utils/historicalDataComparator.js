// ====== HISTORICAL DATA COMPARATOR ======
// Sistema de comparação de dados históricos para análise de tendências e progressão
// Funções para comparar performance atual com médias históricas, recordes pessoais e sessões específicas

const historicalRetriever = require('./historicalDataRetriever');
const performanceCalculator = require('./performanceMetricsCalculator');

class HistoricalDataComparator {
    constructor() {
        this.isInitialized = false;
        
        // Configurações de comparação por tipo
        this.comparisonConfigs = {
            historical_averages: {
                timeRanges: [7, 30, 90], // days
                metricCategories: ['basic', 'economic', 'tactical', 'impact'],
                confidenceThreshold: 0.6,
                significanceThreshold: 0.05 // 5% difference
            },
            personal_bests: {
                metricTypes: ['overall_score', 'kills', 'survival_rate', 'impact_rating', 'economic_efficiency'],
                contextualFactors: ['coaching_level', 'map_name', 'player_team'],
                improvementThreshold: 0.02 // 2% improvement
            },
            session_comparison: {
                similarityFactors: ['coaching_level', 'map_name', 'duration_range'],
                maxSessions: 10,
                detailLevels: ['basic', 'detailed', 'comprehensive']
            }
        };

        // Templates de resultado de comparação
        this.comparisonTemplates = {
            improvement: {
                threshold: 0.1, // 10% improvement
                message: 'Significant improvement detected',
                priority: 'high'
            },
            decline: {
                threshold: -0.1, // 10% decline
                message: 'Performance decline noted',
                priority: 'medium'
            },
            stable: {
                threshold: 0.05, // 5% variation
                message: 'Performance remains stable',
                priority: 'low'
            }
        };

        // Estatísticas do comparador
        this.stats = {
            totalComparisons: 0,
            comparisonTypes: {},
            averageProcessingTime: 0,
            lastComparisonTime: null,
            significantChanges: 0
        };
    }

    async initialize() {
        try {
            console.log('📊 Initializing Historical Data Comparator...');
            
            // Verificar dependências
            if (!historicalRetriever.isInitialized) {
                await historicalRetriever.initialize();
            }
            
            if (!performanceCalculator.isInitialized) {
                performanceCalculator.initialize();
            }
            
            this.isInitialized = true;
            console.log('✅ Historical Data Comparator initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Historical Data Comparator:', error.message);
            return false;
        }
    }

    // ====== COMPARAÇÃO COM MÉDIAS HISTÓRICAS ======

    async compareWithHistoricalAverages(currentData, criteria = {}) {
        const startTime = Date.now();
        
        try {
            console.log('📈 Comparing with historical averages...');
            
            const {
                timeRanges = [7, 30, 90],
                coachingLevel = currentData.coachingLevel,
                metricCategories = ['basic', 'economic', 'tactical', 'impact'],
                includeContext = true
            } = criteria;

            const comparisons = {};
            
            // Comparar com diferentes períodos históricos
            for (const timeRange of timeRanges) {
                console.log(`📊 Analyzing ${timeRange}-day historical average...`);
                
                // Buscar dados históricos
                const historicalTrends = await historicalRetriever.getPerformanceTrends({
                    timeRange,
                    coachingLevel,
                    metricTypes: metricCategories,
                    aggregationType: 'overall'
                });

                if (historicalTrends.dataPoints === 0) {
                    console.log(`⚠️ No historical data available for ${timeRange}-day period`);
                    comparisons[`${timeRange}days`] = {
                        available: false,
                        reason: 'insufficient_historical_data'
                    };
                    continue;
                }

                // Calcular médias históricas
                const historicalAverages = this.calculateHistoricalAverages(historicalTrends);
                
                // Realizar comparação
                const comparison = this.performAverageComparison(
                    currentData, 
                    historicalAverages, 
                    timeRange
                );

                comparisons[`${timeRange}days`] = {
                    available: true,
                    timeRange,
                    dataPoints: historicalTrends.dataPoints,
                    historicalAverages,
                    comparison,
                    trend: this.analyzeTrendDirection(historicalTrends.trends),
                    confidence: this.calculateComparisonConfidence(historicalTrends.dataPoints)
                };
            }

            // Análise consolidada
            const consolidatedAnalysis = this.consolidateAverageComparisons(comparisons);
            
            // Gerar insights e recomendações
            const insights = this.generateAverageComparisonInsights(comparisons, currentData);
            
            const result = {
                type: 'historical_averages',
                currentData: this.extractComparableMetrics(currentData),
                comparisons,
                consolidatedAnalysis,
                insights,
                recommendations: this.generateAverageRecommendations(consolidatedAnalysis),
                metadata: {
                    comparisonTime: Date.now(),
                    processingTime: Date.now() - startTime,
                    dataQuality: this.assessAverageComparisonQuality(comparisons)
                }
            };

            this.updateStats(Date.now() - startTime, 'historical_averages', true);
            
            console.log(`✅ Historical averages comparison completed in ${Date.now() - startTime}ms`);
            return result;

        } catch (error) {
            console.error('❌ Failed to compare with historical averages:', error.message);
            this.updateStats(Date.now() - startTime, 'historical_averages', false);
            throw error;
        }
    }

    // ====== COMPARAÇÃO COM RECORDES PESSOAIS ======

    async compareWithPersonalBests(currentData, criteria = {}) {
        const startTime = Date.now();
        
        try {
            console.log('🏆 Comparing with personal bests...');
            
            const {
                metricTypes = ['overall_score', 'kills', 'survival_rate', 'impact_rating'],
                timeRange = null,
                contextFilters = {},
                includeNearMisses = true
            } = criteria;

            // Buscar recordes pessoais
            const personalBests = await historicalRetriever.getPersonalBests({
                metricTypes,
                timeRange,
                coachingLevel: currentData.coachingLevel,
                ...contextFilters
            });

            if (Object.keys(personalBests.personalBests).length === 0) {
                console.log('⚠️ No personal bests data available');
                return {
                    type: 'personal_bests',
                    available: false,
                    reason: 'no_personal_bests_data'
                };
            }

            // Comparar métricas atuais com recordes
            const comparisons = {};
            const achievements = [];
            const nearMisses = [];

            for (const metricType of metricTypes) {
                const bestRecord = personalBests.personalBests[metricType];
                if (!bestRecord) continue;

                const currentValue = this.extractMetricFromData(currentData, metricType);
                if (currentValue === null) continue;

                const comparison = this.performBestComparison(
                    currentValue, 
                    bestRecord, 
                    metricType
                );

                comparisons[metricType] = comparison;

                // Detectar conquistas e quase-conquistas
                if (comparison.isNewBest) {
                    achievements.push({
                        metric: metricType,
                        newValue: currentValue,
                        previousBest: bestRecord.value,
                        improvement: comparison.improvementPercentage,
                        significance: this.calculateAchievementSignificance(comparison)
                    });
                } else if (includeNearMisses && comparison.percentageOfBest >= 0.9) {
                    nearMisses.push({
                        metric: metricType,
                        currentValue,
                        bestValue: bestRecord.value,
                        percentageOfBest: comparison.percentageOfBest,
                        gap: comparison.gap
                    });
                }
            }

            // Análise de progressão
            const progressionAnalysis = await this.analyzeProgressionToBests(
                currentData, 
                personalBests
            );

            // Gerar insights e recomendações
            const insights = this.generatePersonalBestInsights(
                comparisons, 
                achievements, 
                nearMisses
            );

            const result = {
                type: 'personal_bests',
                available: true,
                currentData: this.extractComparableMetrics(currentData),
                personalBests: personalBests.personalBests,
                comparisons,
                achievements,
                nearMisses,
                progressionAnalysis,
                insights,
                recommendations: this.generatePersonalBestRecommendations(
                    achievements, 
                    nearMisses, 
                    progressionAnalysis
                ),
                metadata: {
                    comparisonTime: Date.now(),
                    processingTime: Date.now() - startTime,
                    totalBestsAnalyzed: metricTypes.length,
                    achievementsCount: achievements.length
                }
            };

            this.updateStats(Date.now() - startTime, 'personal_bests', true);
            
            console.log(`✅ Personal bests comparison completed: ${achievements.length} achievements, ${nearMisses.length} near misses`);
            return result;

        } catch (error) {
            console.error('❌ Failed to compare with personal bests:', error.message);
            this.updateStats(Date.now() - startTime, 'personal_bests', false);
            throw error;
        }
    }

    // ====== COMPARAÇÃO COM SESSÕES ESPECÍFICAS ======

    async compareWithSpecificSessions(currentData, criteria = {}) {
        const startTime = Date.now();
        
        try {
            console.log('🔍 Comparing with specific sessions...');
            
            const {
                sessionIds = [],
                autoSelectSimilar = true,
                maxSessions = 5,
                similarityFactors = ['coaching_level', 'map_name'],
                detailLevel = 'detailed'
            } = criteria;

            let targetSessions = [];

            // Se IDs específicos fornecidos, buscar essas sessões
            if (sessionIds.length > 0) {
                console.log(`📋 Comparing with ${sessionIds.length} specified sessions...`);
                
                for (const sessionId of sessionIds) {
                    const sessionData = await historicalRetriever.getSessionSummaries(sessionId);
                    if (sessionData.summariesCount > 0) {
                        targetSessions.push(sessionData);
                    }
                }
            }

            // Se habilitado, buscar sessões similares automaticamente
            if (autoSelectSimilar) {
                console.log('🤖 Auto-selecting similar sessions for comparison...');
                
                const similarSessions = await this.findSimilarSessions(
                    currentData, 
                    similarityFactors, 
                    maxSessions
                );
                
                // Adicionar sessões similares que não estão já incluídas
                for (const session of similarSessions) {
                    if (!targetSessions.find(ts => ts.sessionId === session.sessionId)) {
                        targetSessions.push(session);
                    }
                }
            }

            if (targetSessions.length === 0) {
                console.log('⚠️ No comparable sessions found');
                return {
                    type: 'specific_sessions',
                    available: false,
                    reason: 'no_comparable_sessions'
                };
            }

            // Realizar comparações com cada sessão
            const sessionComparisons = [];
            
            for (const sessionData of targetSessions) {
                console.log(`📊 Comparing with session ${sessionData.sessionId}...`);
                
                const comparison = await this.performSessionComparison(
                    currentData,
                    sessionData,
                    detailLevel
                );
                
                sessionComparisons.push(comparison);
            }

            // Análise consolidada de múltiplas sessões
            const consolidatedAnalysis = this.consolidateSessionComparisons(sessionComparisons);
            
            // Identificar padrões e tendências
            const patterns = this.identifyComparisonPatterns(sessionComparisons);
            
            // Gerar insights
            const insights = this.generateSessionComparisonInsights(
                sessionComparisons, 
                consolidatedAnalysis, 
                patterns
            );

            const result = {
                type: 'specific_sessions',
                available: true,
                currentData: this.extractComparableMetrics(currentData),
                targetSessions: targetSessions.map(ts => ({
                    sessionId: ts.sessionId,
                    summariesCount: ts.summariesCount,
                    sessionAnalysis: ts.sessionAnalysis
                })),
                sessionComparisons,
                consolidatedAnalysis,
                patterns,
                insights,
                recommendations: this.generateSessionRecommendations(
                    consolidatedAnalysis, 
                    patterns
                ),
                metadata: {
                    comparisonTime: Date.now(),
                    processingTime: Date.now() - startTime,
                    sessionsCompared: sessionComparisons.length,
                    similarityFactors
                }
            };

            this.updateStats(Date.now() - startTime, 'specific_sessions', true);
            
            console.log(`✅ Session comparison completed: ${sessionComparisons.length} sessions analyzed`);
            return result;

        } catch (error) {
            console.error('❌ Failed to compare with specific sessions:', error.message);
            this.updateStats(Date.now() - startTime, 'specific_sessions', false);
            throw error;
        }
    }

    // ====== COMPARAÇÃO ABRANGENTE ======

    async performComprehensiveComparison(currentData, criteria = {}) {
        const startTime = Date.now();
        
        try {
            console.log('🌟 Performing comprehensive historical comparison...');
            
            const {
                includeAverages = true,
                includePersonalBests = true,
                includeSessionComparisons = true,
                maxProcessingTime = 30000 // 30 seconds max
            } = criteria;

            const results = {
                type: 'comprehensive',
                currentData: this.extractComparableMetrics(currentData),
                comparisons: {},
                overallAnalysis: null,
                keyFindings: [],
                recommendations: []
            };

            // Comparação com médias históricas
            if (includeAverages) {
                try {
                    console.log('📈 Running historical averages comparison...');
                    results.comparisons.historicalAverages = await this.compareWithHistoricalAverages(
                        currentData, 
                        criteria.averagesConfig || {}
                    );
                } catch (error) {
                    console.error('❌ Historical averages comparison failed:', error.message);
                    results.comparisons.historicalAverages = { error: error.message };
                }
            }

            // Comparação com recordes pessoais
            if (includePersonalBests) {
                try {
                    console.log('🏆 Running personal bests comparison...');
                    results.comparisons.personalBests = await this.compareWithPersonalBests(
                        currentData, 
                        criteria.personalBestsConfig || {}
                    );
                } catch (error) {
                    console.error('❌ Personal bests comparison failed:', error.message);
                    results.comparisons.personalBests = { error: error.message };
                }
            }

            // Comparação com sessões específicas
            if (includeSessionComparisons) {
                try {
                    console.log('🔍 Running session comparisons...');
                    results.comparisons.specificSessions = await this.compareWithSpecificSessions(
                        currentData, 
                        criteria.sessionConfig || {}
                    );
                } catch (error) {
                    console.error('❌ Session comparison failed:', error.message);
                    results.comparisons.specificSessions = { error: error.message };
                }
            }

            // Análise geral consolidada
            results.overallAnalysis = this.generateOverallAnalysis(results.comparisons);
            
            // Extrair descobertas principais
            results.keyFindings = this.extractKeyFindings(results.comparisons);
            
            // Gerar recomendações consolidadas
            results.recommendations = this.generateConsolidatedRecommendations(
                results.comparisons, 
                results.overallAnalysis
            );

            // Adicionar metadados
            results.metadata = {
                comparisonTime: Date.now(),
                processingTime: Date.now() - startTime,
                comparisonsPerformed: Object.keys(results.comparisons).length,
                dataQuality: this.assessOverallComparisonQuality(results.comparisons)
            };

            this.updateStats(Date.now() - startTime, 'comprehensive', true);
            
            console.log(`✅ Comprehensive comparison completed in ${Date.now() - startTime}ms`);
            console.log(`📊 Key findings: ${results.keyFindings.length}, Recommendations: ${results.recommendations.length}`);
            
            return results;

        } catch (error) {
            console.error('❌ Failed to perform comprehensive comparison:', error.message);
            this.updateStats(Date.now() - startTime, 'comprehensive', false);
            throw error;
        }
    }

    // ====== MÉTODOS AUXILIARES DE CÁLCULO ======

    calculateHistoricalAverages(historicalTrends) {
        const averages = {};
        
        if (!historicalTrends.trends) return averages;

        Object.keys(historicalTrends.trends).forEach(metricType => {
            const trendData = historicalTrends.trends[metricType];
            if (trendData.values && trendData.values.length > 0) {
                averages[metricType] = {
                    average: trendData.values.reduce((sum, val) => sum + val, 0) / trendData.values.length,
                    min: Math.min(...trendData.values),
                    max: Math.max(...trendData.values),
                    trend: trendData.direction || 'stable',
                    confidence: trendData.confidence || 0.5,
                    dataPoints: trendData.values.length
                };
            }
        });

        return averages;
    }

    performAverageComparison(currentData, historicalAverages, timeRange) {
        const comparison = {
            timeRange,
            metrics: {},
            overallTrend: 'stable',
            significantChanges: 0
        };

        Object.keys(historicalAverages).forEach(metricType => {
            const currentValue = this.extractMetricFromData(currentData, metricType);
            const avgData = historicalAverages[metricType];
            
            if (currentValue !== null && avgData) {
                const percentChange = ((currentValue - avgData.average) / avgData.average) * 100;
                const isSignificant = Math.abs(percentChange) >= this.comparisonConfigs.historical_averages.significanceThreshold * 100;
                
                comparison.metrics[metricType] = {
                    currentValue,
                    historicalAverage: avgData.average,
                    percentChange,
                    isImprovement: percentChange > 0,
                    isSignificant,
                    confidenceLevel: avgData.confidence,
                    trend: this.determineTrendDirection(percentChange)
                };

                if (isSignificant) {
                    comparison.significantChanges++;
                }
            }
        });

        // Determinar tendência geral
        const improvements = Object.values(comparison.metrics).filter(m => m.isImprovement && m.isSignificant).length;
        const declines = Object.values(comparison.metrics).filter(m => !m.isImprovement && m.isSignificant).length;
        
        if (improvements > declines) {
            comparison.overallTrend = 'improving';
        } else if (declines > improvements) {
            comparison.overallTrend = 'declining';
        }

        return comparison;
    }

    performBestComparison(currentValue, bestRecord, metricType) {
        const isNewBest = currentValue > bestRecord.value;
        const percentageOfBest = (currentValue / bestRecord.value) * 100;
        const gap = bestRecord.value - currentValue;
        const improvementPercentage = ((currentValue - bestRecord.value) / bestRecord.value) * 100;

        return {
            metricType,
            currentValue,
            bestValue: bestRecord.value,
            isNewBest,
            percentageOfBest,
            gap: isNewBest ? 0 : gap,
            improvementPercentage: isNewBest ? improvementPercentage : 0,
            timeSinceBest: Date.now() - bestRecord.date,
            bestContext: bestRecord.context || {}
        };
    }

    async performSessionComparison(currentData, sessionData, detailLevel) {
        const sessionSummaries = sessionData.summaries;
        const sessionAnalysis = sessionData.sessionAnalysis;

        // Agregar métricas da sessão de comparação
        const aggregatedSessionMetrics = this.aggregateSessionMetrics(sessionSummaries);
        
        // Comparar métricas chave
        const metricComparisons = this.compareMetricSets(
            this.extractComparableMetrics(currentData),
            aggregatedSessionMetrics
        );

        const comparison = {
            sessionId: sessionData.sessionId,
            sessionRounds: sessionData.summariesCount,
            sessionAnalysis,
            metricComparisons,
            overallComparison: this.calculateOverallSessionComparison(metricComparisons),
            similarities: this.calculateSessionSimilarities(currentData, sessionData),
            differences: this.calculateSessionDifferences(currentData, sessionData)
        };

        if (detailLevel === 'comprehensive') {
            comparison.detailedAnalysis = await this.generateDetailedSessionComparison(
                currentData, 
                sessionData
            );
        }

        return comparison;
    }

    // ====== MÉTODOS DE ANÁLISE E INSIGHTS ======

    consolidateAverageComparisons(comparisons) {
        const consolidation = {
            availableTimeRanges: [],
            consistentTrends: [],
            conflictingTrends: [],
            overallDirection: 'stable',
            confidenceLevel: 'medium'
        };

        const availableComparisons = Object.values(comparisons).filter(c => c.available);
        consolidation.availableTimeRanges = availableComparisons.map(c => c.timeRange);

        if (availableComparisons.length === 0) return consolidation;

        // Analisar tendências consistentes
        const trendCounts = { improving: 0, declining: 0, stable: 0 };
        availableComparisons.forEach(comp => {
            trendCounts[comp.comparison.overallTrend]++;
        });

        const dominantTrend = Object.keys(trendCounts).reduce((a, b) => 
            trendCounts[a] > trendCounts[b] ? a : b
        );

        consolidation.overallDirection = dominantTrend;
        consolidation.confidenceLevel = this.calculateConsolidatedConfidence(availableComparisons);

        return consolidation;
    }

    generateAverageComparisonInsights(comparisons, currentData) {
        const insights = [];

        Object.values(comparisons).forEach(comparison => {
            if (!comparison.available) return;

            const { timeRange, comparison: comp } = comparison;
            
            if (comp.significantChanges > 0) {
                insights.push({
                    type: 'significant_change',
                    timeRange,
                    message: `${comp.significantChanges} significant changes detected over ${timeRange} days`,
                    trend: comp.overallTrend,
                    priority: comp.significantChanges > 2 ? 'high' : 'medium'
                });
            }

            // Insights específicos por métrica
            Object.keys(comp.metrics).forEach(metricType => {
                const metric = comp.metrics[metricType];
                if (metric.isSignificant) {
                    insights.push({
                        type: 'metric_insight',
                        metricType,
                        timeRange,
                        message: `${metricType} ${metric.isImprovement ? 'improved' : 'declined'} by ${Math.abs(metric.percentChange).toFixed(1)}%`,
                        trend: metric.trend,
                        priority: Math.abs(metric.percentChange) > 20 ? 'high' : 'medium'
                    });
                }
            });
        });

        return insights;
    }

    generatePersonalBestInsights(comparisons, achievements, nearMisses) {
        const insights = [];

        // Insights sobre conquistas
        achievements.forEach(achievement => {
            insights.push({
                type: 'achievement',
                metricType: achievement.metric,
                message: `New personal best in ${achievement.metric}!`,
                improvement: achievement.improvement,
                significance: achievement.significance,
                priority: 'high'
            });
        });

        // Insights sobre quase-conquistas
        nearMisses.forEach(nearMiss => {
            insights.push({
                type: 'near_miss',
                metricType: nearMiss.metric,
                message: `Very close to personal best in ${nearMiss.metric} (${nearMiss.percentageOfBest.toFixed(1)}%)`,
                gap: nearMiss.gap,
                priority: 'medium'
            });
        });

        // Análise geral de progresso
        const totalMetrics = Object.keys(comparisons).length;
        const improvingMetrics = Object.values(comparisons).filter(c => c.currentValue > c.bestValue * 0.9).length;
        
        if (improvingMetrics / totalMetrics > 0.7) {
            insights.push({
                type: 'progress_trend',
                message: 'Overall performance is approaching your best levels',
                percentage: (improvingMetrics / totalMetrics * 100),
                priority: 'medium'
            });
        }

        return insights;
    }

    generateSessionComparisonInsights(sessionComparisons, consolidatedAnalysis, patterns) {
        const insights = [];

        // Insights de padrões identificados
        patterns.forEach(pattern => {
            insights.push({
                type: 'pattern',
                pattern: pattern.type,
                message: pattern.description,
                confidence: pattern.confidence,
                priority: pattern.significance > 0.7 ? 'high' : 'medium'
            });
        });

        // Insights de comparação consolidada
        if (consolidatedAnalysis.overallPerformance) {
            insights.push({
                type: 'overall_comparison',
                message: `Current performance is ${consolidatedAnalysis.overallPerformance.trend} compared to similar sessions`,
                percentile: consolidatedAnalysis.overallPerformance.percentile,
                priority: 'medium'
            });
        }

        return insights;
    }

    // ====== MÉTODOS DE RECOMENDAÇÃO ======

    generateAverageRecommendations(consolidatedAnalysis) {
        const recommendations = [];

        if (consolidatedAnalysis.overallDirection === 'declining') {
            recommendations.push({
                type: 'improvement_focus',
                message: 'Focus on fundamentals to reverse declining trend',
                priority: 'high',
                actions: ['Review basic mechanics', 'Practice aim training', 'Analyze positioning']
            });
        } else if (consolidatedAnalysis.overallDirection === 'improving') {
            recommendations.push({
                type: 'maintain_momentum',
                message: 'Maintain current training approach',
                priority: 'medium',
                actions: ['Continue current practice routine', 'Track progress consistently']
            });
        }

        return recommendations;
    }

    generatePersonalBestRecommendations(achievements, nearMisses, progressionAnalysis) {
        const recommendations = [];

        if (achievements.length > 0) {
            recommendations.push({
                type: 'capitalize_success',
                message: 'Build on recent achievements',
                priority: 'medium',
                actions: ['Analyze what led to improvements', 'Maintain successful strategies']
            });
        }

        if (nearMisses.length > 0) {
            recommendations.push({
                type: 'push_for_records',
                message: 'Several personal records within reach',
                priority: 'medium',
                actions: nearMisses.map(nm => `Focus on improving ${nm.metric}`)
            });
        }

        return recommendations;
    }

    generateSessionRecommendations(consolidatedAnalysis, patterns) {
        const recommendations = [];

        patterns.forEach(pattern => {
            if (pattern.type === 'improvement_opportunity') {
                recommendations.push({
                    type: 'pattern_based',
                    message: pattern.recommendation,
                    priority: 'medium',
                    actions: pattern.suggestedActions || []
                });
            }
        });

        return recommendations;
    }

    // ====== MÉTODOS AUXILIARES ======

    extractComparableMetrics(data) {
        // Extrair métricas comparáveis dos dados
        const metrics = {};
        
        if (data.performanceMetrics) {
            const perf = data.performanceMetrics;
            
            // Métricas básicas
            if (perf.basic) {
                metrics.kills = perf.basic.kills || 0;
                metrics.deaths = perf.basic.deaths || 0;
                metrics.kd_ratio = perf.basic.kd_ratio || 0;
                metrics.survival_rate = perf.basic.survival_rate || 0;
            }
            
            // Score geral
            if (perf.overall) {
                metrics.overall_score = perf.overall.score || 0;
            }
            
            // Métricas econômicas
            if (perf.economic) {
                metrics.economic_efficiency = perf.economic.money_efficiency || 0;
            }
            
            // Métricas de impacto
            if (perf.impact) {
                metrics.impact_rating = perf.impact.impact_rating || 0;
            }
        }
        
        return metrics;
    }

    extractMetricFromData(data, metricType) {
        const metrics = this.extractComparableMetrics(data);
        return metrics[metricType] || null;
    }

    determineTrendDirection(percentChange) {
        if (percentChange > 10) return 'strong_improvement';
        if (percentChange > 5) return 'improvement';
        if (percentChange < -10) return 'strong_decline';
        if (percentChange < -5) return 'decline';
        return 'stable';
    }

    calculateComparisonConfidence(dataPoints) {
        if (dataPoints >= 20) return 'high';
        if (dataPoints >= 10) return 'medium';
        if (dataPoints >= 5) return 'low';
        return 'very_low';
    }

    updateStats(processingTime, comparisonType, success) {
        this.stats.totalComparisons++;
        this.stats.lastComparisonTime = Date.now();
        
        if (!this.stats.comparisonTypes[comparisonType]) {
            this.stats.comparisonTypes[comparisonType] = 0;
        }
        this.stats.comparisonTypes[comparisonType]++;
        
        // Update average processing time
        this.stats.averageProcessingTime = (
            (this.stats.averageProcessingTime * (this.stats.totalComparisons - 1)) + processingTime
        ) / this.stats.totalComparisons;
    }

    getStats() {
        return {
            ...this.stats,
            isInitialized: this.isInitialized
        };
    }

    // ====== PLACEHOLDER METHODS (TO BE IMPLEMENTED) ======

    analyzeTrendDirection(trends) { return 'stable'; }
    consolidateSessionComparisons(comparisons) { return {}; }
    identifyComparisonPatterns(comparisons) { return []; }
    findSimilarSessions(currentData, factors, max) { return []; }
    aggregateSessionMetrics(summaries) { return {}; }
    compareMetricSets(current, session) { return {}; }
    calculateOverallSessionComparison(comparisons) { return {}; }
    calculateSessionSimilarities(current, session) { return {}; }
    calculateSessionDifferences(current, session) { return {}; }
    generateDetailedSessionComparison(current, session) { return {}; }
    calculateConsolidatedConfidence(comparisons) { return 'medium'; }
    calculateAchievementSignificance(comparison) { return 0.5; }
    analyzeProgressionToBests(currentData, personalBests) { return {}; }
    generateOverallAnalysis(comparisons) { return {}; }
    extractKeyFindings(comparisons) { return []; }
    generateConsolidatedRecommendations(comparisons, analysis) { return []; }
    assessOverallComparisonQuality(comparisons) { return 0.75; }
    assessAverageComparisonQuality(comparisons) { return 0.75; }
}

module.exports = new HistoricalDataComparator(); 