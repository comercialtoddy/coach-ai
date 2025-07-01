// ====== HISTORICAL DATA RETRIEVER ======
// Sistema avançado de recuperação de dados históricos para análise de tendências
// Funções otimizadas para consultas de resumos pós-partida e métricas

const database = require('./database');

class HistoricalDataRetriever {
    constructor() {
        this.isInitialized = false;
        
        // Cache para consultas frequentes
        this.queryCache = new Map();
        this.cacheExpiration = 5 * 60 * 1000; // 5 minutos
        
        // Configurações de consulta por tipo
        this.queryConfigs = {
            recent_performance: {
                defaultLimit: 20,
                sortBy: 'compiled_at',
                sortOrder: 'DESC',
                includes: ['performance_metrics', 'quality_metrics']
            },
            coaching_level_analysis: {
                defaultLimit: 50,
                groupBy: 'coaching_level',
                includes: ['structured_summary', 'key_insights']
            },
            temporal_trends: {
                defaultLimit: 100,
                sortBy: 'compiled_at',
                sortOrder: 'ASC',
                includes: ['performance_metrics', 'gsi_analysis']
            },
            session_comparison: {
                groupBy: 'session_id',
                includes: ['all']
            }
        };

        // Agregadores de dados
        this.aggregators = {
            performance_metrics: this.aggregatePerformanceMetrics.bind(this),
            quality_scores: this.aggregateQualityScores.bind(this),
            coaching_insights: this.aggregateCoachingInsights.bind(this),
            temporal_patterns: this.aggregateTemporalPatterns.bind(this)
        };

        // Estatísticas
        this.stats = {
            totalQueries: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averageQueryTime: 0,
            popularQueries: {},
            lastQueryTime: null
        };
    }

    async initialize() {
        try {
            console.log('📚 Initializing Historical Data Retriever...');
            
            // Verificar dependências
            if (!database.isReady()) {
                throw new Error('Database not ready');
            }

            // Validar schema
            await this.validateDatabaseSchema();
            
            // Criar indexes customizados se necessário
            await this.createCustomIndexes();
            
            this.isInitialized = true;
            console.log('✅ Historical Data Retriever initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Historical Data Retriever:', error.message);
            return false;
        }
    }

    // ====== CONSULTAS PRINCIPAIS ======

    async getRecentRoundSummaries(criteria = {}) {
        const startTime = Date.now();
        
        try {
            console.log('📖 Retrieving recent round summaries...');
            
            const {
                limit = 20,
                coachingLevel = null,
                dateRange = null,
                includeMetrics = true,
                includeAnalysis = false,
                sortBy = 'compiled_at',
                sortOrder = 'DESC'
            } = criteria;

            // Verificar cache
            const cacheKey = this.generateCacheKey('recent', criteria);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                this.updateStats(Date.now() - startTime, true, true);
                return cached;
            }

            // Construir query
            let query = 'SELECT * FROM round_summaries WHERE 1=1';
            const params = [];

            // Filtros
            if (coachingLevel) {
                query += ' AND coaching_level = ?';
                params.push(coachingLevel);
            }

            if (dateRange) {
                if (dateRange.start) {
                    query += ' AND compiled_at >= ?';
                    params.push(dateRange.start);
                }
                if (dateRange.end) {
                    query += ' AND compiled_at <= ?';
                    params.push(dateRange.end);
                }
            }

            // Ordenação
            query += ` ORDER BY ${sortBy} ${sortOrder}`;
            
            // Limite
            query += ` LIMIT ?`;
            params.push(limit);

            console.log(`🔍 Executing query: ${query}`);
            console.log(`📊 Parameters: ${JSON.stringify(params)}`);

            const stmt = database.db.prepare(query);
            const summaries = stmt.all(...params);

            // Parse JSON fields
            summaries.forEach(summary => {
                database.parseRoundSummaryJSON(summary);
            });

            // Processar dados
            const processedSummaries = await this.processSummariesForRetrieval(
                summaries, 
                { includeMetrics, includeAnalysis }
            );

            // Cache resultado
            this.setCache(cacheKey, processedSummaries);

            this.updateStats(Date.now() - startTime, true, false);
            
            console.log(`✅ Retrieved ${processedSummaries.length} recent summaries`);
            return processedSummaries;

        } catch (error) {
            console.error('❌ Failed to retrieve recent summaries:', error.message);
            this.updateStats(Date.now() - startTime, false, false);
            throw error;
        }
    }

    async getSessionSummaries(sessionId, criteria = {}) {
        const startTime = Date.now();
        
        try {
            console.log(`📖 Retrieving summaries for session ${sessionId}...`);
            
            const {
                includeDetails = true,
                sortByRound = true
            } = criteria;

            // Verificar cache
            const cacheKey = this.generateCacheKey('session', { sessionId, ...criteria });
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                this.updateStats(Date.now() - startTime, true, true);
                return cached;
            }

            // Buscar resumos da sessão
            const summaries = database.getSessionRoundSummaries(sessionId, 100);

            if (!summaries.length) {
                console.log(`⚠️ No summaries found for session ${sessionId}`);
                return {
                    sessionId,
                    summariesCount: 0,
                    summaries: [],
                    sessionAnalysis: null
                };
            }

            // Análise da sessão
            const sessionAnalysis = await this.analyzeSession(summaries);

            const result = {
                sessionId,
                summariesCount: summaries.length,
                summaries: includeDetails ? summaries : summaries.map(s => ({
                    summary_id: s.summary_id,
                    round_number: s.round_number,
                    outcome: s.outcome,
                    overall_score: s.performanceMetrics?.overall?.score || 0
                })),
                sessionAnalysis
            };

            // Cache resultado
            this.setCache(cacheKey, result);

            this.updateStats(Date.now() - startTime, true, false);
            
            console.log(`✅ Retrieved ${summaries.length} session summaries`);
            return result;

        } catch (error) {
            console.error('❌ Failed to retrieve session summaries:', error.message);
            this.updateStats(Date.now() - startTime, false, false);
            throw error;
        }
    }

    async getPerformanceTrends(criteria = {}) {
        const startTime = Date.now();
        
        try {
            console.log('📈 Retrieving performance trends...');
            
            const {
                timeRange = 30, // days
                coachingLevel = null,
                metricTypes = ['overall', 'kills', 'survival_rate', 'economic'],
                aggregationType = 'daily',
                includeComparison = true
            } = criteria;

            // Verificar cache
            const cacheKey = this.generateCacheKey('trends', criteria);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                this.updateStats(Date.now() - startTime, true, true);
                return cached;
            }

            // Calcular período
            const endTime = Date.now();
            const startTimeRange = endTime - (timeRange * 24 * 60 * 60 * 1000);

            // Buscar dados do período
            const summaries = await this.getRecentRoundSummaries({
                dateRange: { start: startTimeRange, end: endTime },
                coachingLevel,
                limit: 500,
                includeMetrics: true
            });

            if (!summaries.length) {
                console.log('⚠️ No performance data found in specified time range');
                return {
                    timeRange,
                    dataPoints: 0,
                    trends: {},
                    comparison: null
                };
            }

            // Agregar dados por período
            const aggregatedData = this.aggregateByTime(summaries, aggregationType);
            
            // Calcular tendências
            const trends = this.calculateTrends(aggregatedData, metricTypes);
            
            // Comparação histórica se solicitada
            let comparison = null;
            if (includeComparison) {
                comparison = await this.calculateHistoricalComparison(trends, timeRange);
            }

            const result = {
                timeRange,
                aggregationType,
                dataPoints: summaries.length,
                trends,
                comparison,
                periodAnalysis: this.analyzePeriodPerformance(aggregatedData)
            };

            // Cache resultado
            this.setCache(cacheKey, result);

            this.updateStats(Date.now() - startTime, true, false);
            
            console.log(`✅ Retrieved trends for ${summaries.length} data points`);
            return result;

        } catch (error) {
            console.error('❌ Failed to retrieve performance trends:', error.message);
            this.updateStats(Date.now() - startTime, false, false);
            throw error;
        }
    }

    async getCoachingLevelAnalysis(criteria = {}) {
        const startTime = Date.now();
        
        try {
            console.log('🎯 Retrieving coaching level analysis...');
            
            const {
                includeProgression = true,
                includeComparison = true,
                timeRange = 60 // days
            } = criteria;

            // Verificar cache
            const cacheKey = this.generateCacheKey('coaching_analysis', criteria);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                this.updateStats(Date.now() - startTime, true, true);
                return cached;
            }

            // Buscar dados por nível
            const levels = ['beginner', 'intermediate', 'professional'];
            const levelData = {};

            for (const level of levels) {
                const summaries = await this.getRecentRoundSummaries({
                    coachingLevel: level,
                    limit: 100,
                    includeMetrics: true
                });

                if (summaries.length > 0) {
                    levelData[level] = {
                        summariesCount: summaries.length,
                        summaries: summaries,
                        analysis: this.analyzeLevelPerformance(summaries)
                    };
                }
            }

            // Análise de progressão se solicitada
            let progression = null;
            if (includeProgression) {
                progression = await this.analyzeCoachingProgression(levelData);
            }

            // Comparação entre níveis
            let comparison = null;
            if (includeComparison) {
                comparison = this.compareLevels(levelData);
            }

            const result = {
                levels: Object.keys(levelData),
                levelData,
                progression,
                comparison,
                recommendations: this.generateLevelRecommendations(levelData)
            };

            // Cache resultado
            this.setCache(cacheKey, result);

            this.updateStats(Date.now() - startTime, true, false);
            
            console.log(`✅ Retrieved coaching analysis for ${levels.length} levels`);
            return result;

        } catch (error) {
            console.error('❌ Failed to retrieve coaching level analysis:', error.message);
            this.updateStats(Date.now() - startTime, false, false);
            throw error;
        }
    }

    async getPersonalBests(criteria = {}) {
        const startTime = Date.now();
        
        try {
            console.log('🏆 Retrieving personal bests...');
            
            const {
                metricTypes = ['overall_score', 'kills', 'survival_rate', 'impact_rating'],
                timeRange = null,
                coachingLevel = null
            } = criteria;

            // Verificar cache
            const cacheKey = this.generateCacheKey('personal_bests', criteria);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                this.updateStats(Date.now() - startTime, true, true);
                return cached;
            }

            // Construir filtros
            const filters = {};
            if (timeRange) {
                filters.dateRange = {
                    start: Date.now() - (timeRange * 24 * 60 * 60 * 1000),
                    end: Date.now()
                };
            }
            if (coachingLevel) {
                filters.coachingLevel = coachingLevel;
            }

            // Buscar todos os resumos relevantes
            const summaries = await this.getRecentRoundSummaries({
                ...filters,
                limit: 1000,
                includeMetrics: true
            });

            if (!summaries.length) {
                console.log('⚠️ No data found for personal bests calculation');
                return {
                    metricTypes,
                    personalBests: {},
                    context: { totalRounds: 0, timeRange }
                };
            }

            // Calcular personal bests para cada métrica
            const personalBests = {};
            
            for (const metricType of metricTypes) {
                const bestRound = this.findBestRound(summaries, metricType);
                if (bestRound) {
                    personalBests[metricType] = {
                        value: this.extractMetricValue(bestRound, metricType),
                        roundNumber: bestRound.round_number,
                        sessionId: bestRound.session_id,
                        date: bestRound.compiled_at,
                        context: this.getBestRoundContext(bestRound)
                    };
                }
            }

            const result = {
                metricTypes,
                personalBests,
                context: {
                    totalRounds: summaries.length,
                    timeRange,
                    coachingLevel,
                    analysisDate: Date.now()
                }
            };

            // Cache resultado
            this.setCache(cacheKey, result);

            this.updateStats(Date.now() - startTime, true, false);
            
            console.log(`✅ Retrieved personal bests for ${metricTypes.length} metrics`);
            return result;

        } catch (error) {
            console.error('❌ Failed to retrieve personal bests:', error.message);
            this.updateStats(Date.now() - startTime, false, false);
            throw error;
        }
    }

    async getMapSpecificAnalysis(mapName, criteria = {}) {
        const startTime = Date.now();
        
        try {
            console.log(`🗺️ Retrieving analysis for map ${mapName}...`);
            
            const {
                includeComparison = true,
                timeRange = 90 // days
            } = criteria;

            // Buscar dados específicos do mapa
            const query = `
                SELECT * FROM round_summaries 
                WHERE map_name = ? 
                AND compiled_at >= ?
                ORDER BY compiled_at DESC
                LIMIT 200
            `;
            
            const params = [
                mapName, 
                Date.now() - (timeRange * 24 * 60 * 60 * 1000)
            ];

            const stmt = database.db.prepare(query);
            const summaries = stmt.all(...params);

            // Parse JSON fields
            summaries.forEach(summary => {
                database.parseRoundSummaryJSON(summary);
            });

            if (!summaries.length) {
                console.log(`⚠️ No data found for map ${mapName}`);
                return {
                    mapName,
                    dataPoints: 0,
                    analysis: null,
                    comparison: null
                };
            }

            // Análise específica do mapa
            const mapAnalysis = this.analyzeMapPerformance(summaries, mapName);

            // Comparação com outros mapas se solicitada
            let comparison = null;
            if (includeComparison) {
                comparison = await this.compareWithOtherMaps(mapName, mapAnalysis);
            }

            const result = {
                mapName,
                dataPoints: summaries.length,
                timeRange,
                analysis: mapAnalysis,
                comparison,
                recommendations: this.generateMapRecommendations(mapAnalysis)
            };

            this.updateStats(Date.now() - startTime, true, false);
            
            console.log(`✅ Retrieved map analysis for ${mapName} (${summaries.length} rounds)`);
            return result;

        } catch (error) {
            console.error(`❌ Failed to retrieve map analysis for ${mapName}:`, error.message);
            this.updateStats(Date.now() - startTime, false, false);
            throw error;
        }
    }

    // ====== FUNÇÕES DE AGREGAÇÃO ======

    aggregatePerformanceMetrics(summaries) {
        const metrics = {
            overall_scores: [],
            kills: [],
            deaths: [],
            kd_ratios: [],
            survival_rates: [],
            economic_efficiency: []
        };

        summaries.forEach(summary => {
            if (summary.performanceMetrics) {
                const pm = summary.performanceMetrics;
                
                if (pm.overall?.score !== undefined) {
                    metrics.overall_scores.push(pm.overall.score);
                }
                if (pm.basic?.kills !== undefined) {
                    metrics.kills.push(pm.basic.kills);
                }
                if (pm.basic?.deaths !== undefined) {
                    metrics.deaths.push(pm.basic.deaths);
                }
                if (pm.basic?.kd_ratio !== undefined) {
                    metrics.kd_ratios.push(pm.basic.kd_ratio);
                }
                if (pm.basic?.survival_rate !== undefined) {
                    metrics.survival_rates.push(pm.basic.survival_rate);
                }
                if (pm.economic?.money_efficiency !== undefined) {
                    metrics.economic_efficiency.push(pm.economic.money_efficiency);
                }
            }
        });

        // Calcular estatísticas
        const aggregated = {};
        Object.keys(metrics).forEach(key => {
            const values = metrics[key];
            if (values.length > 0) {
                aggregated[key] = {
                    count: values.length,
                    average: values.reduce((sum, val) => sum + val, 0) / values.length,
                    min: Math.min(...values),
                    max: Math.max(...values),
                    median: this.calculateMedian(values),
                    trend: this.calculateTrendDirection(values)
                };
            }
        });

        return aggregated;
    }

    aggregateQualityScores(summaries) {
        const scores = {
            data_completeness: [],
            analysis_confidence: [],
            insight_relevance: []
        };

        summaries.forEach(summary => {
            if (summary.data_completeness !== undefined) {
                scores.data_completeness.push(summary.data_completeness);
            }
            if (summary.analysis_confidence !== undefined) {
                scores.analysis_confidence.push(summary.analysis_confidence);
            }
            if (summary.insight_relevance !== undefined) {
                scores.insight_relevance.push(summary.insight_relevance);
            }
        });

        const aggregated = {};
        Object.keys(scores).forEach(key => {
            const values = scores[key];
            if (values.length > 0) {
                aggregated[key] = {
                    average: values.reduce((sum, val) => sum + val, 0) / values.length,
                    trend: this.calculateTrendDirection(values)
                };
            }
        });

        return aggregated;
    }

    aggregateCoachingInsights(summaries) {
        const insights = {
            total_insights: 0,
            categories: {},
            effectiveness: []
        };

        summaries.forEach(summary => {
            if (summary.ai_insights_count) {
                insights.total_insights += summary.ai_insights_count;
            }
            
            // Categorizar insights se disponível
            if (summary.aiAnalysis?.categorizedInsights) {
                Object.keys(summary.aiAnalysis.categorizedInsights).forEach(category => {
                    const categoryInsights = summary.aiAnalysis.categorizedInsights[category];
                    insights.categories[category] = (insights.categories[category] || 0) + categoryInsights.length;
                });
            }
        });

        return insights;
    }

    aggregateTemporalPatterns(summaries) {
        // Agrupar por período do dia, dia da semana, etc.
        const patterns = {
            by_hour: {},
            by_day_of_week: {},
            by_date: {}
        };

        summaries.forEach(summary => {
            const date = new Date(summary.compiled_at);
            const hour = date.getHours();
            const dayOfWeek = date.getDay();
            const dateKey = date.toISOString().split('T')[0];

            // Por hora
            patterns.by_hour[hour] = (patterns.by_hour[hour] || 0) + 1;
            
            // Por dia da semana
            patterns.by_day_of_week[dayOfWeek] = (patterns.by_day_of_week[dayOfWeek] || 0) + 1;
            
            // Por data
            patterns.by_date[dateKey] = (patterns.by_date[dateKey] || 0) + 1;
        });

        return patterns;
    }

    // ====== ANÁLISES ESPECIALIZADAS ======

    async analyzeSession(summaries) {
        if (!summaries.length) return null;

        const firstRound = summaries[0];
        const lastRound = summaries[summaries.length - 1];

        return {
            duration: lastRound.compiled_at - firstRound.compiled_at,
            totalRounds: summaries.length,
            performanceProgression: this.calculateSessionProgression(summaries),
            consistencyScore: this.calculateSessionConsistency(summaries),
            highlights: this.identifySessionHighlights(summaries),
            lowPoints: this.identifySessionLowPoints(summaries),
            overallTrend: this.calculateSessionTrend(summaries)
        };
    }

    analyzeLevelPerformance(summaries) {
        const metrics = this.aggregatePerformanceMetrics(summaries);
        const quality = this.aggregateQualityScores(summaries);
        
        return {
            averagePerformance: metrics.overall_scores?.average || 0,
            consistency: this.calculateConsistency(summaries),
            improvementRate: this.calculateImprovementRate(summaries),
            strongAreas: this.identifyStrongAreas(metrics),
            weakAreas: this.identifyWeakAreas(metrics),
            dataQuality: quality
        };
    }

    analyzeMapPerformance(summaries, mapName) {
        const performance = this.aggregatePerformanceMetrics(summaries);
        
        return {
            mapName,
            totalRounds: summaries.length,
            averagePerformance: performance.overall_scores?.average || 0,
            winRate: this.calculateWinRate(summaries),
            preferredSide: this.identifyPreferredSide(summaries),
            strongPositions: this.identifyStrongPositions(summaries),
            weakPositions: this.identifyWeakPositions(summaries),
            economicPatterns: this.analyzeMapEconomicPatterns(summaries)
        };
    }

    // ====== FUNÇÕES AUXILIARES ======

    async processSummariesForRetrieval(summaries, options) {
        const { includeMetrics, includeAnalysis } = options;

        return summaries.map(summary => {
            const processed = {
                summary_id: summary.summary_id,
                round_id: summary.round_id,
                session_id: summary.session_id,
                round_number: summary.round_number,
                coaching_level: summary.coaching_level,
                outcome: summary.outcome,
                compiled_at: summary.compiled_at,
                data_completeness: summary.data_completeness,
                analysis_confidence: summary.analysis_confidence
            };

            if (includeMetrics && summary.performanceMetrics) {
                processed.performanceMetrics = summary.performanceMetrics;
            }

            if (includeAnalysis) {
                processed.gsiAnalysis = summary.gsiAnalysis;
                processed.aiAnalysis = summary.aiAnalysis;
                processed.structuredSummary = summary.structuredSummary;
            }

            return processed;
        });
    }

    findBestRound(summaries, metricType) {
        if (!summaries.length) return null;

        let bestRound = null;
        let bestValue = -Infinity;

        summaries.forEach(summary => {
            const value = this.extractMetricValue(summary, metricType);
            if (value !== null && value > bestValue) {
                bestValue = value;
                bestRound = summary;
            }
        });

        return bestRound;
    }

    extractMetricValue(summary, metricType) {
        if (!summary.performanceMetrics) return null;

        const pm = summary.performanceMetrics;

        switch (metricType) {
            case 'overall_score':
                return pm.overall?.score || null;
            case 'kills':
                return pm.basic?.kills || null;
            case 'survival_rate':
                return pm.basic?.survival_rate || null;
            case 'impact_rating':
                return pm.impact?.impact_rating || null;
            case 'economic_efficiency':
                return pm.economic?.money_efficiency || null;
            default:
                return null;
        }
    }

    calculateTrendDirection(values) {
        if (values.length < 2) return 'stable';
        
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
        
        const change = (secondAvg - firstAvg) / firstAvg;
        
        if (change > 0.1) return 'improving';
        if (change < -0.1) return 'declining';
        return 'stable';
    }

    calculateMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        } else {
            return sorted[mid];
        }
    }

    // ====== CACHE MANAGEMENT ======

    generateCacheKey(type, criteria) {
        return `${type}_${JSON.stringify(criteria)}`;
    }

    getFromCache(key) {
        const cached = this.queryCache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheExpiration) {
            this.queryCache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    setCache(key, data) {
        this.queryCache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        // Limitar tamanho do cache
        if (this.queryCache.size > 100) {
            const oldestKey = this.queryCache.keys().next().value;
            this.queryCache.delete(oldestKey);
        }
    }

    // ====== VALIDAÇÃO E CONFIGURAÇÃO ======

    async validateDatabaseSchema() {
        // Verificar se todas as tabelas necessárias existem
        const requiredTables = ['round_summaries', 'game_sessions', 'rounds'];
        
        for (const table of requiredTables) {
            const query = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`;
            const stmt = database.db.prepare(query);
            const result = stmt.get(table);
            
            if (!result) {
                throw new Error(`Required table '${table}' not found`);
            }
        }
        
        console.log('✅ Database schema validated');
    }

    async createCustomIndexes() {
        // Indexes customizados para consultas históricas
        const customIndexes = [
            'CREATE INDEX IF NOT EXISTS idx_summaries_map_name ON round_summaries(map_name)',
            'CREATE INDEX IF NOT EXISTS idx_summaries_outcome ON round_summaries(outcome)',
            'CREATE INDEX IF NOT EXISTS idx_summaries_date_range ON round_summaries(compiled_at, coaching_level)'
        ];

        customIndexes.forEach(sql => {
            try {
                database.db.exec(sql);
            } catch (error) {
                console.warn(`⚠️ Failed to create custom index: ${error.message}`);
            }
        });

        console.log('📊 Custom indexes created');
    }

    updateStats(processingTime, success, fromCache) {
        this.stats.totalQueries++;
        this.stats.lastQueryTime = Date.now();
        
        if (fromCache) {
            this.stats.cacheHits++;
        } else {
            this.stats.cacheMisses++;
        }
        
        if (success) {
            this.stats.averageQueryTime = 
                (this.stats.averageQueryTime * (this.stats.totalQueries - 1) + processingTime) / 
                this.stats.totalQueries;
        }
    }

    // ====== INTERFACE PÚBLICA ======

    getStats() {
        return {
            ...this.stats,
            cacheSize: this.queryCache.size,
            cacheHitRate: this.stats.totalQueries > 0 ? 
                (this.stats.cacheHits / this.stats.totalQueries * 100).toFixed(2) + '%' : '0%',
            isInitialized: this.isInitialized
        };
    }

    clearCache() {
        this.queryCache.clear();
        console.log('🧹 Query cache cleared');
    }

    // Métodos placeholder para análises complexas
    calculateSessionProgression(summaries) { return 'improving'; }
    calculateSessionConsistency(summaries) { return 0.75; }
    identifySessionHighlights(summaries) { return []; }
    identifySessionLowPoints(summaries) { return []; }
    calculateSessionTrend(summaries) { return 'stable'; }
    calculateConsistency(summaries) { return 0.8; }
    calculateImprovementRate(summaries) { return 0.05; }
    identifyStrongAreas(metrics) { return ['tactical']; }
    identifyWeakAreas(metrics) { return ['economic']; }
    calculateWinRate(summaries) { 
        const wins = summaries.filter(s => s.outcome === 'win').length;
        return summaries.length > 0 ? wins / summaries.length : 0;
    }
    identifyPreferredSide(summaries) { return 'CT'; }
    identifyStrongPositions(summaries) { return []; }
    identifyWeakPositions(summaries) { return []; }
    analyzeMapEconomicPatterns(summaries) { return {}; }
    getBestRoundContext(round) { return {}; }
    aggregateByTime(summaries, type) { return {}; }
    calculateTrends(data, types) { return {}; }
    calculateHistoricalComparison(trends, range) { return {}; }
    analyzePeriodPerformance(data) { return {}; }
    analyzeCoachingProgression(data) { return {}; }
    compareLevels(data) { return {}; }
    generateLevelRecommendations(data) { return []; }
    compareWithOtherMaps(mapName, analysis) { return {}; }
    generateMapRecommendations(analysis) { return []; }
}

// Export singleton instance
module.exports = new HistoricalDataRetriever(); 