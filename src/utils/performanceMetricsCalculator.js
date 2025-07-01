// ====== PERFORMANCE METRICS CALCULATOR ======
// Cálculo de métricas de performance essenciais baseadas em metodologias profissionais de CS2
// Sistema de análise quantitativa para coaching avançado

class PerformanceMetricsCalculator {
    constructor() {
        this.isInitialized = false;
        
        // Configurações de métricas por nível de coaching
        this.metricConfigs = {
            beginner: {
                primaryMetrics: ['kills', 'deaths', 'kd_ratio', 'survival_rate', 'money_efficiency'],
                weightings: {
                    kills: 0.3,
                    survival: 0.4,
                    economy: 0.3
                },
                thresholds: {
                    excellent: 0.8,
                    good: 0.6,
                    average: 0.4,
                    poor: 0.2
                }
            },
            intermediate: {
                primaryMetrics: ['kd_ratio', 'adr', 'utility_usage', 'positioning_score', 'team_contribution'],
                weightings: {
                    fragging: 0.25,
                    utility: 0.25,
                    positioning: 0.25,
                    teamwork: 0.25
                },
                thresholds: {
                    excellent: 0.85,
                    good: 0.65,
                    average: 0.45,
                    poor: 0.25
                }
            },
            professional: {
                primaryMetrics: ['impact_rating', 'clutch_success', 'pressure_performance', 'strategic_value', 'consistency'],
                weightings: {
                    impact: 0.3,
                    clutch: 0.2,
                    pressure: 0.2,
                    strategy: 0.15,
                    consistency: 0.15
                },
                thresholds: {
                    excellent: 0.9,
                    good: 0.7,
                    average: 0.5,
                    poor: 0.3
                }
            }
        };

        // Formulas profissionais baseadas em competições de alto nível
        this.formulas = {
            // Métricas básicas
            kd_ratio: (kills, deaths) => deaths > 0 ? kills / deaths : kills,
            survival_rate: (rounds_played, rounds_survived) => rounds_played > 0 ? rounds_survived / rounds_played : 0,
            kill_rate: (kills, rounds_played) => rounds_played > 0 ? kills / rounds_played : 0,
            
            // Métricas econômicas
            money_efficiency: (money_spent, value_generated) => money_spent > 0 ? value_generated / money_spent : 0,
            economic_rating: (money_saved, money_earned, team_economy) => {
                const contribution = (money_saved + money_earned) / team_economy;
                return Math.min(contribution, 2.0); // Cap at 200%
            },
            
            // Métricas de utilidade
            utility_effectiveness: (utility_used, utility_value, rounds) => {
                if (rounds === 0) return 0;
                return (utility_value / Math.max(utility_used, 1)) / rounds;
            },
            
            // Métricas de impacto (fórmula HLTV-inspired)
            impact_rating: (kills, deaths, assists, rounds, team_rounds_won) => {
                const kd = deaths > 0 ? kills / deaths : kills;
                const kpr = rounds > 0 ? kills / rounds : 0;
                const survival = deaths < rounds ? (rounds - deaths) / rounds : 0;
                const win_contribution = team_rounds_won > 0 ? kills / team_rounds_won : 0;
                
                return (kd * 0.3 + kpr * 0.3 + survival * 0.2 + win_contribution * 0.2);
            },
            
            // Métricas de pressão
            pressure_performance: (pressure_situations, pressure_successes) => {
                return pressure_situations > 0 ? pressure_successes / pressure_situations : 0;
            },
            
            // Consistência (variação do desempenho)
            consistency_score: (performance_array) => {
                if (performance_array.length < 2) return 1.0;
                const mean = performance_array.reduce((sum, val) => sum + val, 0) / performance_array.length;
                const variance = performance_array.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / performance_array.length;
                const stdDev = Math.sqrt(variance);
                return Math.max(0, 1 - (stdDev / Math.max(mean, 0.1))); // Normalized consistency
            }
        };

        // Estatísticas do calculador
        this.stats = {
            totalCalculations: 0,
            metricTypes: {},
            averageCalculationTime: 0,
            lastCalculationTime: null
        };
    }

    initialize() {
        this.isInitialized = true;
        console.log('📊 Performance Metrics Calculator initialized');
        return true;
    }

    // ====== CÁLCULO DE MÉTRICAS PRINCIPAIS ======

    calculateRoundMetrics(roundSummary, coachingLevel = 'beginner') {
        const startTime = Date.now();
        
        try {
            console.log(`📊 Calculating performance metrics for Round ${roundSummary.roundNumber} (${coachingLevel})`);
            
            const config = this.metricConfigs[coachingLevel];
            const metrics = {};

            // Extrair dados básicos do resumo
            const roundData = this.extractRoundData(roundSummary);
            
            // Calcular métricas básicas
            metrics.basic = this.calculateBasicMetrics(roundData);
            
            // Calcular métricas econômicas
            metrics.economic = this.calculateEconomicMetrics(roundData);
            
            // Calcular métricas de utilidade
            metrics.utility = this.calculateUtilityMetrics(roundData);
            
            // Calcular métricas táticas
            metrics.tactical = this.calculateTacticalMetrics(roundData);
            
            // Calcular métricas de impacto
            metrics.impact = this.calculateImpactMetrics(roundData);
            
            // Calcular métricas específicas do nível
            metrics.levelSpecific = this.calculateLevelSpecificMetrics(roundData, coachingLevel);
            
            // Calcular score geral
            metrics.overall = this.calculateOverallScore(metrics, config);
            
            // Calcular classificações
            metrics.ratings = this.calculateRatings(metrics, config);
            
            // Adicionar metadados
            metrics.metadata = {
                coachingLevel,
                roundNumber: roundSummary.roundNumber,
                calculatedAt: Date.now(),
                calculationTime: Date.now() - startTime,
                dataQuality: this.assessDataQuality(roundData)
            };

            // Atualizar estatísticas
            this.updateStats(Date.now() - startTime, true, metrics);

            console.log(`✅ Metrics calculated in ${Date.now() - startTime}ms`);
            console.log(`📈 Overall Score: ${(metrics.overall.score * 100).toFixed(1)}% (${metrics.overall.rating})`);
            
            return metrics;

        } catch (error) {
            console.error('❌ Failed to calculate round metrics:', error.message);
            this.updateStats(Date.now() - startTime, false, null);
            throw error;
        }
    }

    // ====== EXTRAÇÃO DE DADOS ======

    extractRoundData(roundSummary) {
        const data = {
            // Dados básicos
            roundNumber: roundSummary.roundNumber,
            outcome: roundSummary.outcome,
            duration: roundSummary.duration,
            coachingLevel: roundSummary.coachingLevel,
            
            // Dados de performance inicializados
            kills: 0,
            deaths: 0,
            assists: 0,
            health_damage_dealt: 0,
            health_damage_taken: 0,
            
            // Dados econômicos
            money_start: 0,
            money_end: 0,
            money_spent: 0,
            equipment_value: 0,
            
            // Dados de utilidade
            utility_used: 0,
            utility_value: 0,
            flashbangs_thrown: 0,
            smokes_thrown: 0,
            he_grenades_thrown: 0,
            
            // Dados de situação
            pressure_situations: 0,
            pressure_successes: 0,
            clutch_situations: 0,
            clutch_successes: 0,
            
            // Dados de equipe
            team_alive: 5,
            enemy_alive: 5,
            team_economy: 0,
            
            // Arrays para análise temporal
            health_progression: [],
            money_progression: [],
            position_changes: [],
            critical_moments: []
        };

        // Extrair dados GSI se disponível
        if (roundSummary.gsiAnalysis?.available) {
            const gsi = roundSummary.gsiAnalysis;
            
            // Dados do jogador
            if (gsi.playerAnalysis?.available) {
                const player = gsi.playerAnalysis;
                data.kills = player.totalKills || 0;
                data.health_progression = this.extractHealthProgression(player);
                data.money_progression = this.extractMoneyProgression(player);
            }
            
            // Dados econômicos
            if (gsi.economicAnalysis?.available) {
                const economic = gsi.economicAnalysis;
                data.money_start = economic.startMoney || 0;
                data.money_end = economic.endMoney || 0;
                data.money_spent = data.money_start - data.money_end;
            }
            
            // Momentos críticos
            data.critical_moments = gsi.criticalMoments || [];
            data.pressure_situations = this.countPressureSituations(data.critical_moments);
        }

        // Extrair dados de insights AI se disponível
        if (roundSummary.aiAnalysis?.available) {
            const ai = roundSummary.aiAnalysis;
            
            // Contar insights por categoria para métricas de utilidade
            if (ai.categorizedInsights) {
                data.utility_insights = (ai.categorizedInsights.tactical || []).length;
                data.strategic_insights = (ai.categorizedInsights.strategic || []).length;
                data.economic_insights = (ai.categorizedInsights.economic || []).length;
            }
        }

        // Extrair dados de performance se disponível
        if (roundSummary.performanceAnalysis?.available) {
            const performance = roundSummary.performanceAnalysis;
            
            // Extrair métricas específicas dos dados de performance
            Object.keys(performance.metricsByType || {}).forEach(metricType => {
                const metrics = performance.metricsByType[metricType];
                if (metrics.length > 0) {
                    data[metricType] = metrics[metrics.length - 1].value; // Valor mais recente
                }
            });
        }

        return data;
    }

    extractHealthProgression(playerAnalysis) {
        if (!playerAnalysis.healthProgression) return [];
        
        return [
            playerAnalysis.healthProgression.start || 100,
            playerAnalysis.healthProgression.end || 0,
            playerAnalysis.healthProgression.min || 0,
            playerAnalysis.healthProgression.max || 100
        ];
    }

    extractMoneyProgression(playerAnalysis) {
        if (!playerAnalysis.moneyProgression) return [];
        
        return [
            playerAnalysis.moneyProgression.start || 0,
            playerAnalysis.moneyProgression.end || 0,
            playerAnalysis.moneyProgression.change || 0
        ];
    }

    countPressureSituations(criticalMoments) {
        return criticalMoments.filter(moment => 
            moment.type === 'low_health' || 
            moment.type === 'clutch_situation' || 
            moment.type === 'bomb_situation'
        ).length;
    }

    // ====== CÁLCULO DE MÉTRICAS ESPECÍFICAS ======

    calculateBasicMetrics(data) {
        return {
            kills: data.kills,
            deaths: data.deaths,
            assists: data.assists,
            kd_ratio: this.formulas.kd_ratio(data.kills, data.deaths),
            kill_rate: this.formulas.kill_rate(data.kills, 1), // 1 round
            survival_rate: data.deaths === 0 ? 1.0 : 0.0,
            health_efficiency: this.calculateHealthEfficiency(data.health_progression),
            damage_efficiency: this.calculateDamageEfficiency(data.health_damage_dealt, data.health_damage_taken)
        };
    }

    calculateEconomicMetrics(data) {
        return {
            money_start: data.money_start,
            money_end: data.money_end,
            money_spent: data.money_spent,
            money_efficiency: this.formulas.money_efficiency(data.money_spent, data.kills * 300), // Valor por kill
            economic_impact: this.calculateEconomicImpact(data),
            investment_return: this.calculateInvestmentReturn(data),
            save_efficiency: this.calculateSaveEfficiency(data)
        };
    }

    calculateUtilityMetrics(data) {
        return {
            utility_used: data.utility_used,
            utility_value: data.utility_value,
            utility_efficiency: this.formulas.utility_effectiveness(data.utility_used, data.utility_value, 1),
            tactical_versatility: this.calculateTacticalVersatility(data),
            support_rating: this.calculateSupportRating(data),
            strategic_contribution: this.calculateStrategicContribution(data)
        };
    }

    calculateTacticalMetrics(data) {
        return {
            positioning_score: this.calculatePositioningScore(data),
            timing_accuracy: this.calculateTimingAccuracy(data),
            decision_quality: this.calculateDecisionQuality(data),
            adaptability: this.calculateAdaptability(data),
            map_control: this.calculateMapControl(data)
        };
    }

    calculateImpactMetrics(data) {
        return {
            impact_rating: this.formulas.impact_rating(data.kills, data.deaths, data.assists, 1, 1),
            pressure_performance: this.formulas.pressure_performance(data.pressure_situations, data.pressure_successes),
            clutch_potential: this.calculateClutchPotential(data),
            momentum_influence: this.calculateMomentumInfluence(data),
            game_changing_plays: this.calculateGameChangingPlays(data)
        };
    }

    calculateLevelSpecificMetrics(data, coachingLevel) {
        const config = this.metricConfigs[coachingLevel];
        const metrics = {};

        config.primaryMetrics.forEach(metricName => {
            metrics[metricName] = this.calculateSpecificMetric(metricName, data);
        });

        return metrics;
    }

    calculateOverallScore(metrics, config) {
        const weightings = config.weightings;
        let score = 0;
        let totalWeight = 0;

        Object.keys(weightings).forEach(category => {
            const weight = weightings[category];
            const categoryScore = this.getCategoryScore(category, metrics);
            score += categoryScore * weight;
            totalWeight += weight;
        });

        const finalScore = totalWeight > 0 ? score / totalWeight : 0;
        
        return {
            score: Math.min(Math.max(finalScore, 0), 1), // Clamp between 0 and 1
            rating: this.getScoreRating(finalScore, config.thresholds),
            breakdown: this.getScoreBreakdown(metrics, weightings)
        };
    }

    calculateRatings(metrics, config) {
        const ratings = {};
        const thresholds = config.thresholds;

        // Rating para cada categoria
        Object.keys(metrics).forEach(category => {
            if (category !== 'metadata' && category !== 'overall') {
                const categoryScore = this.getCategoryScore(category, { [category]: metrics[category] });
                ratings[category] = this.getScoreRating(categoryScore, thresholds);
            }
        });

        return ratings;
    }

    // ====== MÉTODOS AUXILIARES DE CÁLCULO ======

    calculateHealthEfficiency(healthProgression) {
        if (!healthProgression.length) return 0;
        
        const startHealth = healthProgression[0] || 100;
        const endHealth = healthProgression[1] || 0;
        const survived = endHealth > 0;
        
        if (survived) {
            return Math.min(endHealth / startHealth, 1.0);
        } else {
            // Penalizar morte, mas dar crédito por tempo sobrevivido
            return 0.1; // Base score for dying
        }
    }

    calculateDamageEfficiency(damageDealt, damageTaken) {
        if (damageDealt === 0 && damageTaken === 0) return 0.5;
        const totalDamage = damageDealt + damageTaken;
        return totalDamage > 0 ? damageDealt / totalDamage : 0;
    }

    calculateEconomicImpact(data) {
        const moneySpent = data.money_spent || 0;
        const kills = data.kills || 0;
        const survived = data.deaths === 0;
        
        // Impacto econômico baseado em valor gerado vs gasto
        const valueGenerated = (kills * 300) + (survived ? 1000 : 0); // Kill reward + survival bonus
        return moneySpent > 0 ? valueGenerated / moneySpent : 0;
    }

    calculateInvestmentReturn(data) {
        // ROI baseado em performance vs investimento
        const investment = data.equipment_value || data.money_spent || 0;
        const returns = (data.kills * 300) + (data.assists * 100);
        return investment > 0 ? returns / investment : 0;
    }

    calculateSaveEfficiency(data) {
        // Eficiência em situações de save
        if (data.money_end > data.money_start) return 1.0; // Gained money
        if (data.money_spent < 1000) return 0.8; // Eco round
        return 0.3; // Force buy
    }

    calculateTacticalVersatility(data) {
        // Versatilidade baseada em variedade de ações
        const actions = [
            data.flashbangs_thrown > 0,
            data.smokes_thrown > 0,
            data.he_grenades_thrown > 0,
            data.kills > 0,
            data.assists > 0
        ].filter(Boolean).length;
        
        return actions / 5.0; // Normalizado
    }

    calculateSupportRating(data) {
        // Rating de suporte baseado em assists e utility
        const assists = data.assists || 0;
        const utility = data.utility_used || 0;
        return Math.min((assists * 0.6 + utility * 0.4) / 3, 1.0);
    }

    calculateStrategicContribution(data) {
        // Contribuição estratégica baseada em insights e decisões
        const strategicInsights = data.strategic_insights || 0;
        const economicInsights = data.economic_insights || 0;
        return Math.min((strategicInsights + economicInsights) / 5, 1.0);
    }

    calculatePositioningScore(data) {
        // Score de posicionamento baseado em sobrevivência e critical moments
        const survived = data.deaths === 0;
        const criticalMoments = data.critical_moments?.length || 0;
        const lowHealthMoments = data.critical_moments?.filter(m => m.type === 'low_health').length || 0;
        
        if (survived) return 0.9;
        if (lowHealthMoments === 0) return 0.7;
        return Math.max(0.3, 0.7 - (lowHealthMoments * 0.1));
    }

    calculateTimingAccuracy(data) {
        // Precisão de timing baseado em moments e decisions
        const totalMoments = data.critical_moments?.length || 0;
        if (totalMoments === 0) return 0.5; // Neutral
        
        const goodTimingMoments = data.critical_moments?.filter(m => 
            m.type === 'multi_kill' || m.type === 'clutch_success'
        ).length || 0;
        
        return totalMoments > 0 ? goodTimingMoments / totalMoments : 0.5;
    }

    calculateDecisionQuality(data) {
        // Qualidade de decisões baseada em outcomes
        const survived = data.deaths === 0;
        const kills = data.kills || 0;
        const economicEfficiency = data.money_spent > 0 ? (kills * 300) / data.money_spent : 0;
        
        return (
            (survived ? 0.4 : 0) +
            (Math.min(kills / 2, 0.3)) +
            (Math.min(economicEfficiency, 0.3))
        );
    }

    calculateAdaptability(data) {
        // Adaptabilidade baseada em variety de situações enfrentadas
        const situationTypes = new Set(
            data.critical_moments?.map(m => m.type) || []
        ).size;
        
        return Math.min(situationTypes / 4, 1.0); // Max 4 tipos de situação
    }

    calculateMapControl(data) {
        // Controle de mapa baseado em posicionamento e movimentação
        const positionChanges = data.position_changes?.length || 0;
        const survived = data.deaths === 0;
        
        // Mais movimento = melhor controle de mapa, mas penalizar se morreu
        const mobilityScore = Math.min(positionChanges / 10, 0.6);
        const survivalBonus = survived ? 0.4 : 0;
        
        return mobilityScore + survivalBonus;
    }

    calculateClutchPotential(data) {
        // Potencial de clutch baseado em situações de pressão
        const clutchSituations = data.clutch_situations || 0;
        const clutchSuccesses = data.clutch_successes || 0;
        
        if (clutchSituations === 0) return 0.5; // Neutro se não teve clutch
        return clutchSuccesses / clutchSituations;
    }

    calculateMomentumInfluence(data) {
        // Influência no momentum baseada em multi-kills e timing
        const multiKills = data.critical_moments?.filter(m => m.type === 'multi_kill').length || 0;
        const kills = data.kills || 0;
        
        if (kills === 0) return 0;
        return Math.min((multiKills / kills) + (kills / 5), 1.0);
    }

    calculateGameChangingPlays(data) {
        // Jogadas que mudam o jogo
        const gameChangingMoments = data.critical_moments?.filter(m => 
            m.type === 'multi_kill' || 
            m.type === 'clutch_success' ||
            (m.type === 'bomb_situation' && data.outcome === 'win')
        ).length || 0;
        
        return Math.min(gameChangingMoments / 2, 1.0);
    }

    calculateSpecificMetric(metricName, data) {
        // Implementar métricas específicas baseadas no nome
        switch (metricName) {
            case 'kills': return data.kills || 0;
            case 'deaths': return data.deaths || 0;
            case 'kd_ratio': return this.formulas.kd_ratio(data.kills, data.deaths);
            case 'survival_rate': return data.deaths === 0 ? 1.0 : 0.0;
            case 'money_efficiency': return this.formulas.money_efficiency(data.money_spent, data.kills * 300);
            case 'adr': return data.health_damage_dealt || 0; // Average Damage per Round
            case 'utility_usage': return data.utility_used || 0;
            case 'positioning_score': return this.calculatePositioningScore(data);
            case 'team_contribution': return this.calculateSupportRating(data);
            case 'impact_rating': return this.formulas.impact_rating(data.kills, data.deaths, data.assists, 1, 1);
            case 'clutch_success': return this.calculateClutchPotential(data);
            case 'pressure_performance': return this.formulas.pressure_performance(data.pressure_situations, data.pressure_successes);
            case 'strategic_value': return this.calculateStrategicContribution(data);
            case 'consistency': return 0.5; // Placeholder - needs historical data
            default: return 0;
        }
    }

    getCategoryScore(category, metrics) {
        // Obter score médio da categoria
        const categoryMetrics = metrics[category];
        if (!categoryMetrics || typeof categoryMetrics !== 'object') return 0;
        
        const values = Object.values(categoryMetrics).filter(val => typeof val === 'number');
        if (values.length === 0) return 0;
        
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    getScoreRating(score, thresholds) {
        if (score >= thresholds.excellent) return 'excellent';
        if (score >= thresholds.good) return 'good';
        if (score >= thresholds.average) return 'average';
        return 'poor';
    }

    getScoreBreakdown(metrics, weightings) {
        const breakdown = {};
        
        Object.keys(weightings).forEach(category => {
            breakdown[category] = {
                score: this.getCategoryScore(category, metrics),
                weight: weightings[category],
                contribution: this.getCategoryScore(category, metrics) * weightings[category]
            };
        });
        
        return breakdown;
    }

    assessDataQuality(data) {
        // Avaliar qualidade dos dados disponíveis
        const requiredFields = ['kills', 'deaths', 'money_start', 'money_end'];
        const availableFields = requiredFields.filter(field => 
            data[field] !== undefined && data[field] !== null
        );
        
        return availableFields.length / requiredFields.length;
    }

    updateStats(processingTime, success, metrics) {
        this.stats.totalCalculations++;
        this.stats.averageCalculationTime = 
            (this.stats.averageCalculationTime * (this.stats.totalCalculations - 1) + processingTime) / 
            this.stats.totalCalculations;
        this.stats.lastCalculationTime = Date.now();

        if (success && metrics) {
            Object.keys(metrics).forEach(category => {
                this.stats.metricTypes[category] = (this.stats.metricTypes[category] || 0) + 1;
            });
        }
    }

    // ====== INTERFACE PÚBLICA ======

    getStats() {
        return {
            ...this.stats,
            isInitialized: this.isInitialized
        };
    }

    getSupportedMetrics(coachingLevel = 'beginner') {
        return this.metricConfigs[coachingLevel]?.primaryMetrics || [];
    }

    getMetricThresholds(coachingLevel = 'beginner') {
        return this.metricConfigs[coachingLevel]?.thresholds || {};
    }
}

// Export singleton instance
module.exports = new PerformanceMetricsCalculator();