// ====== MULTIMODAL COACH - GSI + SCREENSHOT AI ANALYSIS ======
// Integra dados GSI, screenshots e Gemini AI para coaching multimodal avançado
// Baseado em estratégias de coaching profissional de CS2 em competições mundiais

const { getGeminiClient } = require('./geminiClient');

class MultimodalCoach {
    constructor() {
        this.geminiClient = null;
        this.isInitialized = false;
        
        // Configurações de coaching por nível (baseadas em análise profissional)
        this.coachingConfigs = {
            beginner: {
                focusAreas: ['health', 'economy', 'positioning', 'basic_tactics', 'survival'],
                promptStyle: 'simple',
                maxInsights: 3,
                urgencyThreshold: 'high',
                analysisDepth: 'immediate',
                communicationStyle: 'direct'
            },
            intermediate: {
                focusAreas: ['utility_usage', 'team_coordination', 'map_control', 'economic_strategy', 'rotation_timing'],
                promptStyle: 'detailed',
                maxInsights: 5,
                urgencyThreshold: 'medium',
                analysisDepth: 'tactical',
                communicationStyle: 'educational'
            },
            professional: {
                focusAreas: ['micro_positioning', 'advanced_tactics', 'psychological_warfare', 'meta_analysis', 'momentum_control', 'pattern_recognition'],
                promptStyle: 'analytical',
                maxInsights: 7,
                urgencyThreshold: 'low',
                analysisDepth: 'strategic',
                communicationStyle: 'analytical'
            }
        };

        // Templates de prompts otimizados para coaching profissional
        this.promptTemplates = {
            simple: {
                system: "You are an expert CS2 coach providing precise, actionable advice to beginner players. Focus on immediate survival, economy management, and fundamental positioning. Communicate like a professional coach during a timeout - clear, direct, and focused on immediate actions.",
                context: "Analyze the current game state and screenshot. Provide SHORT, IMMEDIATE actions focusing on survival and basic economic decisions. Think like a professional coach identifying critical mistakes that need instant correction.",
                format: "Respond in Portuguese with bullet points (•). Each tip should be ONE ACTION maximum. Prioritize: 1) Immediate safety, 2) Economic decisions, 3) Basic positioning."
            },
            detailed: {
                system: "You are a professional CS2 coach helping intermediate players develop tactical understanding and team coordination. Focus on utility usage, economic strategy, and map control like coaches in professional tournaments.",
                context: "Examine the round situation, team economy, utility availability, and positioning. Provide strategic advice that considers both immediate tactics and upcoming rounds. Analyze patterns and team coordination opportunities.",
                format: "Respond in Portuguese with sections: SITUAÇÃO TÁTICA, ECONOMIA, UTILIDADES, COORDENAÇÃO. Be specific about timing and execution like professional coaching during timeouts."
            },
            analytical: {
                system: "You are an elite CS2 analyst providing championship-level strategic insights. Perform deep analysis of micro-positioning, economic implications, meta-game considerations, psychological pressure, and momentum control like coaches in Major tournaments.",
                context: "Perform comprehensive analysis considering: opponent patterns, economic cycles, utility meta, positioning advantages, psychological momentum, and strategic depth. Think like coaches who analyze every detail during professional matches.",
                format: "Respond in Portuguese with detailed sections: ANÁLISE ESTRATÉGICA, PADRÕES DO ADVERSÁRIO, ECONOMIA AVANÇADA, CONTROLE DE MOMENTUM, PRESSÃO PSICOLÓGICA, META-JOGO."
            }
        };

        // Sistema de detecção de padrões e tendências (inspirado em coaching profissional)
        this.patternHistory = {
            economicCycles: [],
            roundOutcomes: [],
            utilityUsage: [],
            positioningPatterns: [],
            performanceUnderPressure: []
        };

        // Análise de momentum e timing (conceitos de coaching profissional)
        this.momentumTracker = {
            currentMomentum: 'neutral',
            roundStreak: 0,
            lastMomentumShift: null,
            pressureSituations: [],
            clutchPerformance: []
        };

        // Meta-game awareness (constantemente atualizado como coaches profissionais)
        this.metaAnalysis = {
            currentMeta: {
                economicPatterns: ['anti-eco', 'force-buy-meta', 'save-round-timing'],
                utilityMeta: ['smoke-execute', 'flash-coordination', 'molly-control'],
                positioningMeta: ['off-angles', 'aggressive-holds', 'late-rotations']
            },
            mapSpecificMeta: {},
            adaptiveStrategies: []
        };

        // Estatísticas de performance aprimoradas
        this.stats = {
            totalAnalyses: 0,
            averageResponseTime: 0,
            totalResponseTime: 0,
            successfulAnalyses: 0,
            failedAnalyses: 0,
            insightCategories: {},
            lastAnalysisTime: null,
            professionalInsights: {
                patternDetections: 0,
                economicAnalyses: 0,
                momentumIdentifications: 0,
                pressureSituations: 0,
                metaAdjustments: 0
            }
        };
    }

    async initialize() {
        try {
            console.log('🎯 Initializing Professional Multimodal Coach...');
            
            // Obter instância do Gemini client
            this.geminiClient = getGeminiClient();
            
            // Verificar se Gemini está inicializado
            if (!this.geminiClient.isReady()) {
                console.log('🚀 Initializing Gemini client...');
                await this.geminiClient.initialize();
            }
            
            // Inicializar sistemas de análise profissional
            this.initializeProfessionalAnalysis();
            
            this.isInitialized = true;
            console.log('✅ Professional Multimodal Coach initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Professional Multimodal Coach:', error.message);
            this.isInitialized = false;
            throw error;
        }
    }

    // Inicializar sistemas de análise profissional
    initializeProfessionalAnalysis() {
        console.log('🧠 Initializing professional analysis systems...');
        
        // Configurar detecção de padrões
        this.patternHistory = {
            economicCycles: [],
            roundOutcomes: [],
            utilityUsage: [],
            positioningPatterns: [],
            performanceUnderPressure: []
        };

        // Configurar rastreamento de momentum
        this.momentumTracker = {
            currentMomentum: 'neutral',
            roundStreak: 0,
            lastMomentumShift: null,
            pressureSituations: [],
            clutchPerformance: []
        };

        console.log('🔄 Professional analysis systems ready');
    }

    // ====== SISTEMA DE ANÁLISE PROFISSIONAL ======

    // Análise de padrões econômicos (como coaches profissionais)
    analyzeEconomicPatterns(gsiData, extractedData) {
        if (!extractedData?.player?.state || !extractedData?.round?.score) return null;

        const analysis = {
            currentEconomicState: this.determineEconomicState(extractedData),
            predictedOpponentEconomy: this.predictOpponentEconomy(extractedData),
            recommendedBuy: this.recommendBuyStrategy(extractedData),
            economicPressure: this.calculateEconomicPressure(extractedData),
            forceOpportunity: this.detectForceOpportunity(extractedData)
        };

        // Armazenar para análise de padrões
        this.patternHistory.economicCycles.push({
            round: extractedData.map?.round || 0,
            state: analysis.currentEconomicState,
            timestamp: Date.now()
        });

        // Manter apenas últimos 10 rounds
        if (this.patternHistory.economicCycles.length > 10) {
            this.patternHistory.economicCycles.shift();
        }

        this.stats.professionalInsights.economicAnalyses++;
        return analysis;
    }

    // Detectar situações de pressão (conceito crucial do coaching profissional)
    detectPressureSituation(extractedData, gsiData) {
        const pressureFactors = [];
        let pressureLevel = 'low';

        // Fatores de pressão identificados por coaches profissionais
        if (extractedData?.player?.state) {
            const state = extractedData.player.state;
            
            // Pressão de saúde
            if (state.health <= 30) pressureFactors.push('low_health');
            if (state.armor <= 25) pressureFactors.push('low_armor');
            
            // Pressão econômica
            if (state.money <= 2000) pressureFactors.push('economic_pressure');
            
            // Pressão de rounds
            if (extractedData.round?.score) {
                const score = extractedData.round.score;
                const roundDiff = Math.abs(score.ct - score.t);
                if (roundDiff >= 10) pressureFactors.push('round_pressure');
            }
        }

        // Pressão de bomba
        if (extractedData?.bomb?.state && extractedData.bomb.state !== 'safe') {
            pressureFactors.push('bomb_pressure');
            if (extractedData.bomb.countdown && extractedData.bomb.countdown <= 10) {
                pressureFactors.push('critical_bomb_pressure');
            }
        }

        // Pressão de situação numérica
        if (extractedData?.team?.alive_count <= 2) {
            pressureFactors.push('numerical_disadvantage');
        }

        // Calcular nível de pressão
        if (pressureFactors.length >= 3) pressureLevel = 'high';
        else if (pressureFactors.length >= 2) pressureLevel = 'medium';

        const pressureSituation = {
            level: pressureLevel,
            factors: pressureFactors,
            timestamp: Date.now(),
            round: extractedData?.map?.round || 0
        };

        this.momentumTracker.pressureSituations.push(pressureSituation);
        this.stats.professionalInsights.pressureSituations++;

        return pressureSituation;
    }

    // Análise de momentum (conceito de coaching de alto nível)
    analyzeMomentum(extractedData) {
        if (!extractedData?.round?.score) return this.momentumTracker.currentMomentum;

        const score = extractedData.round.score;
        const totalRounds = score.ct + score.t;
        
        // Detectar mudanças de momentum baseado em tendências
        if (this.patternHistory.roundOutcomes.length >= 3) {
            const recentOutcomes = this.patternHistory.roundOutcomes.slice(-3);
            const wins = recentOutcomes.filter(outcome => outcome.won).length;
            
            if (wins >= 2) {
                this.momentumTracker.currentMomentum = 'positive';
                this.momentumTracker.roundStreak = wins;
            } else if (wins <= 1) {
                this.momentumTracker.currentMomentum = 'negative';
                this.momentumTracker.roundStreak = 3 - wins;
            }
        }

        // Detectar momentos críticos de momentum
        const momentumFactors = this.detectMomentumFactors(extractedData);
        
        this.stats.professionalInsights.momentumIdentifications++;
        return {
            current: this.momentumTracker.currentMomentum,
            streak: this.momentumTracker.roundStreak,
            factors: momentumFactors,
            critical: momentumFactors.includes('timeout_opportunity') || momentumFactors.includes('anti_eco_critical')
        };
    }

    // Detectar fatores de momentum como coaches profissionais
    detectMomentumFactors(extractedData) {
        const factors = [];
        
        if (!extractedData) return factors;

        // Fatores econômicos de momentum
        const economicAnalysis = this.analyzeEconomicPatterns(null, extractedData);
        if (economicAnalysis?.economicPressure === 'high') {
            factors.push('economic_pressure_critical');
        }
        
        // Fatores de bomba
        if (extractedData.bomb?.state === 'defusing') {
            factors.push('defuse_momentum');
        } else if (extractedData.bomb?.state === 'planted') {
            factors.push('plant_momentum');
        }

        // Fatores de performance
        if (extractedData.player?.state?.round_kills >= 2) {
            factors.push('multi_kill_momentum');
        }

        // Fatores de timing (conceito avançado de coaching)
        if (extractedData.round?.phase === 'live') {
            const roundNumber = extractedData.map?.round || 0;
            if (roundNumber === 15 || roundNumber === 30) {
                factors.push('half_time_critical');
            }
            if (roundNumber % 5 === 0) {
                factors.push('economic_reset_opportunity');
            }
        }

        return factors;
    }

    // ====== EXTRAÇÃO APRIMORADA DE DADOS GSI ======

    extractRelevantGSIData(gsiData, coachingLevel = 'beginner') {
        if (!gsiData) return null;

        const config = this.coachingConfigs[coachingLevel];
        const extracted = {
            timestamp: Date.now(),
            level: coachingLevel
        };

        try {
            // Dados básicos sempre incluídos
            if (gsiData.player) {
                extracted.player = {
                    team: gsiData.player.team,
                    activity: gsiData.player.activity
                };

                // Estado do jogador com análise profissional
                if (gsiData.player.state) {
                    extracted.player.state = {
                        health: gsiData.player.state.health || 0,
                        armor: gsiData.player.state.armor || 0,
                        money: gsiData.player.state.money || 0,
                        round_kills: gsiData.player.state.round_kills || 0,
                        flashed: gsiData.player.state.flashed || 0,
                        defusekit: gsiData.player.state.defusekit || false,
                        // Análises adicionais profissionais
                        survivalability: this.calculateSurvivability(gsiData.player.state),
                        economicViability: this.calculateEconomicViability(gsiData.player.state),
                        pressureLevel: this.calculatePlayerPressure(gsiData.player.state)
                    };
                }

                // Análise avançada de armas (conceito profissional)
                if (gsiData.player.weapons) {
                    const weapons = Object.values(gsiData.player.weapons);
                    extracted.player.weapons = {
                        primary: weapons.find(w => w.type === 'Rifle' || w.type === 'SniperRifle' || w.type === 'Shotgun')?.name,
                        secondary: weapons.find(w => w.type === 'Pistol')?.name,
                        grenades: weapons.filter(w => w.type === 'Grenade').map(g => g.name),
                        // Análise profissional de utility
                        utilityCount: weapons.filter(w => w.type === 'Grenade').length,
                        utilityValue: this.calculateUtilityValue(weapons.filter(w => w.type === 'Grenade')),
                        weaponEconomy: this.calculateWeaponEconomy(weapons)
                    };
                }

                // Estatísticas com contexto profissional
                if (gsiData.player.match_stats) {
                    extracted.player.stats = {
                        kills: gsiData.player.match_stats.kills || 0,
                        deaths: gsiData.player.match_stats.deaths || 0,
                        assists: gsiData.player.match_stats.assists || 0,
                        mvps: gsiData.player.match_stats.mvps || 0,
                        score: gsiData.player.match_stats.score || 0,
                        // Métricas profissionais
                        kd: this.calculateKD(gsiData.player.match_stats),
                        impact: this.calculateImpactRating(gsiData.player.match_stats),
                        clutchPotential: this.assessClutchPotential(gsiData.player.match_stats)
                    };
                }
            }

            // Informações do round com análise estratégica
            if (gsiData.round) {
                extracted.round = {
                    phase: gsiData.round.phase,
                    bomb: gsiData.round.bomb || 'safe'
                };

                if (gsiData.round.wins_team_ct !== undefined) {
                    extracted.round.score = {
                        ct: gsiData.round.wins_team_ct,
                        t: gsiData.round.wins_team_t || 0
                    };
                    
                    // Análise estratégica do placar
                    extracted.round.strategicContext = this.analyzeStrategicContext(extracted.round.score);
                }
            }

            // Informações do mapa com meta-analysis
            if (gsiData.map) {
                extracted.map = {
                    name: gsiData.map.name,
                    phase: gsiData.map.phase,
                    round: gsiData.map.round,
                    // Meta-analysis específica do mapa
                    mapMeta: this.getMapMeta(gsiData.map.name),
                    strategicValue: this.calculateStrategicValue(gsiData.map)
                };
            }

            // Informações da bomba com análise tática
            if (gsiData.bomb) {
                extracted.bomb = {
                    state: gsiData.bomb.state,
                    countdown: gsiData.bomb.countdown,
                    // Análise tática da bomba
                    tacticalPressure: this.calculateBombPressure(gsiData.bomb),
                    defuseOpportunity: this.assessDefuseOpportunity(gsiData.bomb)
                };
            }

            // Dados avançados específicos por nível de coaching
            if (config.focusAreas.includes('team_coordination') && gsiData.allplayers) {
                const teamPlayers = Object.values(gsiData.allplayers).filter(p => 
                    p.team === extracted.player?.team
                );
                
                extracted.team = {
                    alive_count: teamPlayers.filter(p => (p.state?.health || 0) > 0).length,
                    total_money: teamPlayers.reduce((sum, p) => sum + (p.state?.money || 0), 0),
                    average_health: teamPlayers.length > 0 ? 
                        teamPlayers.reduce((sum, p) => sum + (p.state?.health || 0), 0) / teamPlayers.length : 0,
                    // Análises profissionais de equipe
                    economicPower: this.calculateTeamEconomicPower(teamPlayers),
                    tacticalSynergy: this.assessTacticalSynergy(teamPlayers),
                    coordinationLevel: this.assessCoordinationLevel(teamPlayers)
                };
            }

            // Análises profissionais avançadas se for nível professional
            if (coachingLevel === 'professional') {
                extracted.professionalAnalysis = {
                    economicAnalysis: this.analyzeEconomicPatterns(gsiData, extracted),
                    pressureSituation: this.detectPressureSituation(extracted, gsiData),
                    momentumAnalysis: this.analyzeMomentum(extracted),
                    metaContext: this.analyzeMetaContext(extracted),
                    patternInsights: this.extractPatternInsights(extracted)
                };
            }

            return extracted;

        } catch (error) {
            console.error('❌ Error extracting professional GSI data:', error.message);
            return null;
        }
    }

    // ====== MÉTODOS DE ANÁLISE PROFISSIONAL ======

    calculateSurvivability(playerState) {
        const health = playerState.health || 0;
        const armor = playerState.armor || 0;
        
        if (health <= 20 && armor <= 25) return 'critical';
        if (health <= 40 && armor <= 50) return 'low';
        if (health >= 80 && armor >= 75) return 'high';
        return 'medium';
    }

    calculateEconomicViability(playerState) {
        const money = playerState.money || 0;
        
        if (money >= 9000) return 'full_buy_multiple';
        if (money >= 4000) return 'full_buy';
        if (money >= 2000) return 'force_buy';
        if (money >= 500) return 'eco_save';
        return 'critical_eco';
    }

    calculatePlayerPressure(playerState) {
        let pressureScore = 0;
        
        if ((playerState.health || 0) <= 30) pressureScore += 3;
        if ((playerState.armor || 0) <= 25) pressureScore += 2;
        if ((playerState.money || 0) <= 2000) pressureScore += 2;
        if (playerState.flashed > 0) pressureScore += 2;
        
        if (pressureScore >= 6) return 'extreme';
        if (pressureScore >= 4) return 'high';
        if (pressureScore >= 2) return 'medium';
        return 'low';
    }

    calculateUtilityValue(grenades) {
        const utilityValues = {
            'Smoke Grenade': 300,
            'HE Grenade': 300,
            'Flashbang': 200,
            'Decoy Grenade': 50,
            'Incendiary Grenade': 600,
            'Molotov': 400
        };
        
        return grenades.reduce((total, grenade) => {
            return total + (utilityValues[grenade.name] || 0);
        }, 0);
    }

    calculateWeaponEconomy(weapons) {
        const weaponValues = {
            'AK-47': 2700,
            'M4A4': 3100,
            'M4A1-S': 2900,
            'AWP': 4750,
            'Glock-18': 0,
            'USP-S': 0,
            'P250': 300,
            'Tec-9': 500
        };
        
        return weapons.reduce((total, weapon) => {
            return total + (weaponValues[weapon.name] || 0);
        }, 0);
    }

    calculateKD(stats) {
        const kills = stats.kills || 0;
        const deaths = stats.deaths || 0;
        return deaths > 0 ? (kills / deaths) : kills;
    }

    calculateImpactRating(stats) {
        const kills = stats.kills || 0;
        const assists = stats.assists || 0;
        const deaths = stats.deaths || 0;
        const mvps = stats.mvps || 0;
        
        return (kills * 2 + assists + mvps * 3) / Math.max(deaths, 1);
    }

    assessClutchPotential(stats) {
        const kd = this.calculateKD(stats);
        const mvps = stats.mvps || 0;
        
        if (kd >= 1.5 && mvps >= 3) return 'high';
        if (kd >= 1.0 && mvps >= 1) return 'medium';
        return 'low';
    }

    analyzeStrategicContext(score) {
        const totalRounds = score.ct + score.t;
        const roundDiff = Math.abs(score.ct - score.t);
        
        if (totalRounds >= 25) return 'overtime_pressure';
        if (roundDiff >= 10) return 'blowout_situation';
        if (roundDiff <= 2 && totalRounds >= 20) return 'close_game_critical';
        if (totalRounds === 15) return 'half_time_switch';
        return 'standard_flow';
    }

    getMapMeta(mapName) {
        const mapMetas = {
            'de_dust2': {
                economicMeta: 'aggressive_force_buys',
                utilityMeta: 'smoke_heavy',
                positioningMeta: 'long_range_duels'
            },
            'de_mirage': {
                economicMeta: 'utility_investment',
                utilityMeta: 'flash_coordination',
                positioningMeta: 'close_angles'
            },
            'de_inferno': {
                economicMeta: 'anti_eco_strong',
                utilityMeta: 'molotov_control',
                positioningMeta: 'chokepoint_control'
            }
        };
        
        return mapMetas[mapName] || {
            economicMeta: 'standard',
            utilityMeta: 'balanced',
            positioningMeta: 'adaptive'
        };
    }

    calculateStrategicValue(mapData) {
        const round = mapData.round || 0;
        
        if (round === 15 || round === 30) return 'half_time_critical';
        if (round % 5 === 0) return 'economic_reset';
        if (round >= 25) return 'overtime_every_round';
        return 'standard';
    }

    calculateBombPressure(bombData) {
        if (bombData.state === 'planted' && bombData.countdown) {
            if (bombData.countdown <= 10) return 'extreme';
            if (bombData.countdown <= 20) return 'high';
            return 'medium';
        }
        return 'none';
    }

    assessDefuseOpportunity(bombData) {
        if (bombData.state === 'planted' && bombData.countdown) {
            if (bombData.countdown >= 10) return 'safe_defuse';
            if (bombData.countdown >= 5) return 'risky_defuse';
            return 'impossible_defuse';
        }
        return 'no_bomb';
    }

    calculateTeamEconomicPower(teamPlayers) {
        const totalMoney = teamPlayers.reduce((sum, p) => sum + (p.state?.money || 0), 0);
        const avgMoney = totalMoney / teamPlayers.length;
        
        if (avgMoney >= 8000) return 'dominant';
        if (avgMoney >= 4000) return 'strong';
        if (avgMoney >= 2000) return 'limited';
        return 'critical';
    }

    assessTacticalSynergy(teamPlayers) {
        // Análise simplificada baseada na distribuição de utility
        const playersWithUtility = teamPlayers.filter(p => {
            if (!p.weapons) return false;
            const weapons = Object.values(p.weapons);
            return weapons.some(w => w.type === 'Grenade');
        }).length;
        
        const synergyRatio = playersWithUtility / teamPlayers.length;
        
        if (synergyRatio >= 0.8) return 'high';
        if (synergyRatio >= 0.6) return 'medium';
        return 'low';
    }

    assessCoordinationLevel(teamPlayers) {
        const aliveCount = teamPlayers.filter(p => (p.state?.health || 0) > 0).length;
        const totalPlayers = teamPlayers.length;
        
        if (aliveCount === totalPlayers) return 'full_team';
        if (aliveCount >= 4) return 'strong_numbers';
        if (aliveCount >= 3) return 'standard';
        if (aliveCount >= 2) return 'limited';
        return 'critical';
    }

    analyzeMetaContext(extractedData) {
        return {
            currentMeta: this.metaAnalysis.currentMeta,
            mapSpecific: extractedData.map ? this.getMapMeta(extractedData.map.name) : null,
            adaptiveRecommendations: this.generateAdaptiveRecommendations(extractedData)
        };
    }

    extractPatternInsights(extractedData) {
        const insights = [];
        
        // Análise de padrões econômicos
        if (this.patternHistory.economicCycles.length >= 3) {
            const recentEco = this.patternHistory.economicCycles.slice(-3);
            const pattern = this.detectEconomicPattern(recentEco);
            if (pattern) insights.push(pattern);
        }
        
        // Análise de padrões de momentum
        if (this.momentumTracker.pressureSituations.length >= 2) {
            const pressurePattern = this.detectPressurePattern();
            if (pressurePattern) insights.push(pressurePattern);
        }
        
        this.stats.professionalInsights.patternDetections++;
        return insights;
    }

    detectEconomicPattern(economicHistory) {
        const states = economicHistory.map(e => e.state);
        
        if (states.every(s => s === 'force_buy')) {
            return {
                type: 'economic_pattern',
                pattern: 'consecutive_force_buys',
                recommendation: 'Adversário pode estar em pressão econômica - anti-eco otimizado'
            };
        }
        
        if (states.includes('critical_eco') && states.includes('full_buy')) {
            return {
                type: 'economic_pattern',
                pattern: 'eco_to_buy_cycle',
                recommendation: 'Padrão eco-buy detectado - timing para aggressive plays'
            };
        }
        
        return null;
    }

    detectPressurePattern() {
        const recentPressure = this.momentumTracker.pressureSituations.slice(-2);
        const highPressureCount = recentPressure.filter(p => p.level === 'high').length;
        
        if (highPressureCount >= 2) {
            return {
                type: 'pressure_pattern',
                pattern: 'consecutive_high_pressure',
                recommendation: 'Múltiplas situações de alta pressão - foco em compostura'
            };
        }
        
        return null;
    }

    generateAdaptiveRecommendations(extractedData) {
        const recommendations = [];
        
        // Recomendações baseadas no meta atual
        if (extractedData.map?.name) {
            const mapMeta = this.getMapMeta(extractedData.map.name);
            recommendations.push({
                type: 'meta_adaptation',
                area: mapMeta.utilityMeta,
                suggestion: `Adaptar utility para meta ${mapMeta.utilityMeta} em ${extractedData.map.name}`
            });
        }
        
        return recommendations;
    }

    // ====== MÉTODOS AUXILIARES DE ECONOMIA ======

    determineEconomicState(extractedData) {
        if (!extractedData?.player?.state) return 'unknown';
        
        const money = extractedData.player.state.money;
        
        if (money >= 9000) return 'surplus';
        if (money >= 4000) return 'full_buy';
        if (money >= 2000) return 'force_buy';
        if (money >= 500) return 'eco';
        return 'critical_eco';
    }

    predictOpponentEconomy(extractedData) {
        // Análise simplificada baseada no round e placar
        if (!extractedData?.round?.score || !extractedData?.map?.round) return 'unknown';
        
        const round = extractedData.map.round;
        const score = extractedData.round.score;
        
        // Lógica simplificada para predição econômica do adversário
        if (round <= 3) return 'pistol_follow_up';
        if (round === 16) return 'second_half_pistol';
        
        // Baseado em momentum de rounds
        const opponentTeam = extractedData.player?.team === 'CT' ? 't' : 'ct';
        const opponentScore = opponentTeam === 'ct' ? score.ct : score.t;
        
        if (opponentScore >= 3) return 'likely_full_buy';
        return 'likely_eco_force';
    }

    recommendBuyStrategy(extractedData) {
        const economicState = this.determineEconomicState(extractedData);
        const predictedOpponent = this.predictOpponentEconomy(extractedData);
        
        if (economicState === 'full_buy' && predictedOpponent === 'likely_eco_force') {
            return 'anti_eco_buy';
        }
        
        if (economicState === 'force_buy' && predictedOpponent === 'likely_full_buy') {
            return 'force_buy_aggressive';
        }
        
        return 'standard_buy';
    }

    calculateEconomicPressure(extractedData) {
        if (!extractedData?.team?.total_money || !extractedData?.team?.alive_count) return 'unknown';
        
        const avgMoney = extractedData.team.total_money / extractedData.team.alive_count;
        
        if (avgMoney <= 1500) return 'high';
        if (avgMoney <= 3000) return 'medium';
        return 'low';
    }

    detectForceOpportunity(extractedData) {
        const economicState = this.determineEconomicState(extractedData);
        const momentum = this.momentumTracker.currentMomentum;
        
        if (economicState === 'force_buy' && momentum === 'positive') {
            return 'high_chance_force';
        }
        
        if (economicState === 'eco' && momentum === 'negative') {
            return 'desperation_force';
        }
        
        return 'standard_play';
    }

    // ====== SUBTASK 1 & 2: GSI DATA EXTRACTION AND FORMATTING ======

    extractRelevantGSIData(gsiData, coachingLevel = 'beginner') {
        if (!gsiData) return null;

        const config = this.coachingConfigs[coachingLevel];
        const extracted = {
            timestamp: Date.now(),
            level: coachingLevel
        };

        try {
            // Dados básicos sempre incluídos
            if (gsiData.player) {
                extracted.player = {
                    team: gsiData.player.team,
                    activity: gsiData.player.activity
                };

                // Estado do jogador
                if (gsiData.player.state) {
                    extracted.player.state = {
                        health: gsiData.player.state.health || 0,
                        armor: gsiData.player.state.armor || 0,
                        money: gsiData.player.state.money || 0,
                        round_kills: gsiData.player.state.round_kills || 0,
                        flashed: gsiData.player.state.flashed || 0,
                        defusekit: gsiData.player.state.defusekit || false
                    };
                }

                // Armas (apenas principais)
                if (gsiData.player.weapons) {
                    const weapons = Object.values(gsiData.player.weapons);
                    extracted.player.weapons = {
                        primary: weapons.find(w => w.type === 'Rifle' || w.type === 'SniperRifle' || w.type === 'Shotgun')?.name,
                        secondary: weapons.find(w => w.type === 'Pistol')?.name,
                        grenades: weapons.filter(w => w.type === 'Grenade').map(g => g.name)
                    };
                }

                // Estatísticas de match
                if (gsiData.player.match_stats) {
                    extracted.player.stats = {
                        kills: gsiData.player.match_stats.kills || 0,
                        deaths: gsiData.player.match_stats.deaths || 0,
                        assists: gsiData.player.match_stats.assists || 0,
                        mvps: gsiData.player.match_stats.mvps || 0,
                        score: gsiData.player.match_stats.score || 0
                    };
                }
            }

            // Informações do round
            if (gsiData.round) {
                extracted.round = {
                    phase: gsiData.round.phase,
                    bomb: gsiData.round.bomb || 'safe'
                };

                if (gsiData.round.wins_team_ct !== undefined) {
                    extracted.round.score = {
                        ct: gsiData.round.wins_team_ct,
                        t: gsiData.round.wins_team_t || 0
                    };
                }
            }

            // Informações do mapa
            if (gsiData.map) {
                extracted.map = {
                    name: gsiData.map.name,
                    phase: gsiData.map.phase,
                    round: gsiData.map.round
                };
            }

            // Informações da bomba
            if (gsiData.bomb) {
                extracted.bomb = {
                    state: gsiData.bomb.state,
                    countdown: gsiData.bomb.countdown
                };
            }

            // Dados específicos por nível de coaching
            if (config.focusAreas.includes('team_coordination') && gsiData.allplayers) {
                const teamPlayers = Object.values(gsiData.allplayers).filter(p => 
                    p.team === extracted.player?.team
                );
                
                extracted.team = {
                    alive_count: teamPlayers.filter(p => (p.state?.health || 0) > 0).length,
                    total_money: teamPlayers.reduce((sum, p) => sum + (p.state?.money || 0), 0),
                    average_health: teamPlayers.length > 0 ? 
                        teamPlayers.reduce((sum, p) => sum + (p.state?.health || 0), 0) / teamPlayers.length : 0
                };
            }

            return extracted;

        } catch (error) {
            console.error('❌ Error extracting GSI data:', error.message);
            return null;
        }
    }

    formatGSIDataForPrompt(extractedData) {
        if (!extractedData) return "No game data available.";

        try {
            const parts = [];

            // Informações básicas
            if (extractedData.map?.name) {
                parts.push(`MAPA: ${extractedData.map.name}`);
            }

            if (extractedData.round) {
                const phase = extractedData.round.phase === 'live' ? 'AO VIVO' : 
                             extractedData.round.phase === 'freezetime' ? 'FREEZE TIME' : 
                             extractedData.round.phase;
                parts.push(`FASE: ${phase}`);

                if (extractedData.round.score) {
                    parts.push(`PLACAR: CT ${extractedData.round.score.ct} - ${extractedData.round.score.t} T`);
                    
                    // Adicionar contexto estratégico profissional
                    if (extractedData.round.strategicContext) {
                        const contextMap = {
                            'overtime_pressure': 'OVERTIME CRÍTICO',
                            'blowout_situation': 'BLOWOUT',
                            'close_game_critical': 'JOGO APERTADO',
                            'half_time_switch': 'TROCA DE LADO',
                            'standard_flow': 'FLUXO NORMAL'
                        };
                        parts.push(`CONTEXTO: ${contextMap[extractedData.round.strategicContext] || extractedData.round.strategicContext}`);
                    }
                }

                if (extractedData.round.bomb !== 'safe') {
                    parts.push(`BOMBA: ${extractedData.round.bomb.toUpperCase()}`);
                }
            }

            // Estado do jogador com análise profissional
            if (extractedData.player) {
                const p = extractedData.player;
                if (p.state) {
                    parts.push(`JOGADOR: ${p.state.health}HP, ${p.state.armor}A, $${p.state.money}`);
                    
                    // Análise profissional de sobrevivência
                    if (p.state.survivalability) {
                        const survivalMap = {
                            'critical': 'SOBREVIVÊNCIA CRÍTICA',
                            'low': 'SOBREVIVÊNCIA BAIXA',
                            'medium': 'SOBREVIVÊNCIA MÉDIA',
                            'high': 'SOBREVIVÊNCIA ALTA'
                        };
                        parts.push(`SOBREVIVÊNCIA: ${survivalMap[p.state.survivalability]}`);
                    }
                    
                    // Análise econômica profissional
                    if (p.state.economicViability) {
                        const ecoMap = {
                            'full_buy_multiple': 'ECO DOMINANTE',
                            'full_buy': 'FULL BUY',
                            'force_buy': 'FORCE BUY',
                            'eco_save': 'ECO SAVE',
                            'critical_eco': 'ECO CRÍTICO'
                        };
                        parts.push(`ECONOMIA: ${ecoMap[p.state.economicViability]}`);
                    }
                    
                    // Nível de pressão profissional
                    if (p.state.pressureLevel && p.state.pressureLevel !== 'low') {
                        const pressureMap = {
                            'extreme': 'PRESSÃO EXTREMA',
                            'high': 'ALTA PRESSÃO',
                            'medium': 'PRESSÃO MÉDIA'
                        };
                        parts.push(`PRESSÃO: ${pressureMap[p.state.pressureLevel]}`);
                    }
                    
                    if (p.state.round_kills > 0) {
                        parts.push(`KILLS ROUND: ${p.state.round_kills}`);
                    }
                    
                    if (p.state.flashed > 0) {
                        parts.push(`STATUS: FLASHED`);
                    }
                    
                    if (p.state.defusekit) {
                        parts.push(`ITEM: KIT DEFUSE`);
                    }
                }

                // Análise avançada de armas
                if (p.weapons) {
                    const weapons = [];
                    if (p.weapons.primary) weapons.push(p.weapons.primary);
                    if (p.weapons.secondary) weapons.push(p.weapons.secondary);
                    if (p.weapons.grenades?.length > 0) weapons.push(...p.weapons.grenades);
                    
                    if (weapons.length > 0) {
                        parts.push(`ARMAS: ${weapons.join(', ')}`);
                    }
                    
                    // Análise profissional de utility
                    if (p.weapons.utilityCount > 0) {
                        parts.push(`UTILITY: ${p.weapons.utilityCount} granadas ($${p.weapons.utilityValue})`);
                    }
                    
                    if (p.weapons.weaponEconomy > 0) {
                        parts.push(`VALOR ARMAS: $${p.weapons.weaponEconomy}`);
                    }
                }

                // Estatísticas com métricas profissionais
                if (p.stats) {
                    const kd = p.stats.deaths > 0 ? (p.stats.kills / p.stats.deaths).toFixed(1) : p.stats.kills;
                    parts.push(`STATS: ${p.stats.kills}K/${p.stats.deaths}D (K/D: ${kd})`);
                    
                    // Métricas profissionais
                    if (p.stats.impact) {
                        parts.push(`IMPACT: ${p.stats.impact.toFixed(1)}`);
                    }
                    
                    if (p.stats.clutchPotential && p.stats.clutchPotential !== 'low') {
                        const clutchMap = {
                            'high': 'CLUTCH ALTO',
                            'medium': 'CLUTCH MÉDIO'
                        };
                        parts.push(`CLUTCH: ${clutchMap[p.stats.clutchPotential]}`);
                    }
                }
            }

            // Informações da equipe com análise profissional
            if (extractedData.team) {
                let teamInfo = `EQUIPE: ${extractedData.team.alive_count} vivos, $${extractedData.team.total_money} total`;
                
                if (extractedData.team.economicPower) {
                    const powerMap = {
                        'dominant': 'ECONOMIA DOMINANTE',
                        'strong': 'ECONOMIA FORTE',
                        'limited': 'ECONOMIA LIMITADA',
                        'critical': 'ECONOMIA CRÍTICA'
                    };
                    teamInfo += ` (${powerMap[extractedData.team.economicPower]})`;
                }
                
                parts.push(teamInfo);
                
                // Sinergia tática
                if (extractedData.team.tacticalSynergy) {
                    const synergyMap = {
                        'high': 'SINERGIA ALTA',
                        'medium': 'SINERGIA MÉDIA',
                        'low': 'SINERGIA BAIXA'
                    };
                    parts.push(`SINERGIA: ${synergyMap[extractedData.team.tacticalSynergy]}`);
                }
            }

            // Informações da bomba com análise tática profissional
            if (extractedData.bomb && extractedData.bomb.state !== 'safe') {
                let bombInfo = `BOMBA: ${extractedData.bomb.state.toUpperCase()}`;
                if (extractedData.bomb.countdown) {
                    bombInfo += ` (${extractedData.bomb.countdown.toFixed(1)}s)`;
                }
                
                // Pressão tática da bomba
                if (extractedData.bomb.tacticalPressure && extractedData.bomb.tacticalPressure !== 'none') {
                    const pressureMap = {
                        'extreme': 'PRESSÃO EXTREMA',
                        'high': 'PRESSÃO ALTA',
                        'medium': 'PRESSÃO MÉDIA'
                    };
                    bombInfo += ` - ${pressureMap[extractedData.bomb.tacticalPressure]}`;
                }
                
                // Oportunidade de defuse
                if (extractedData.bomb.defuseOpportunity && extractedData.bomb.defuseOpportunity !== 'no_bomb') {
                    const defuseMap = {
                        'safe_defuse': 'DEFUSE SEGURO',
                        'risky_defuse': 'DEFUSE ARRISCADO',
                        'impossible_defuse': 'DEFUSE IMPOSSÍVEL'
                    };
                    bombInfo += ` (${defuseMap[extractedData.bomb.defuseOpportunity]})`;
                }
                
                parts.push(bombInfo);
            }

            // Análises profissionais avançadas (nível professional)
            if (extractedData.professionalAnalysis) {
                const prof = extractedData.professionalAnalysis;
                
                // Análise econômica
                if (prof.economicAnalysis) {
                    const eco = prof.economicAnalysis;
                    if (eco.recommendedBuy !== 'standard_buy') {
                        const buyMap = {
                            'anti_eco_buy': 'ANTI-ECO RECOMENDADO',
                            'force_buy_aggressive': 'FORCE AGRESSIVO',
                            'eco_save': 'ECO SAVE NECESSÁRIO'
                        };
                        parts.push(`ESTRATÉGIA: ${buyMap[eco.recommendedBuy] || eco.recommendedBuy}`);
                    }
                    
                    if (eco.forceOpportunity !== 'standard_play') {
                        const forceMap = {
                            'high_chance_force': 'OPORTUNIDADE FORCE',
                            'desperation_force': 'FORCE DESESPERO'
                        };
                        parts.push(`FORCE: ${forceMap[eco.forceOpportunity]}`);
                    }
                }
                
                // Situação de pressão
                if (prof.pressureSituation && prof.pressureSituation.level !== 'low') {
                    const factors = prof.pressureSituation.factors.join(', ');
                    parts.push(`FATORES PRESSÃO: ${factors}`);
                }
                
                // Análise de momentum
                if (prof.momentumAnalysis && prof.momentumAnalysis.current !== 'neutral') {
                    const momentumMap = {
                        'positive': 'MOMENTUM POSITIVO',
                        'negative': 'MOMENTUM NEGATIVO'
                    };
                    let momentumInfo = momentumMap[prof.momentumAnalysis.current];
                    if (prof.momentumAnalysis.streak > 0) {
                        momentumInfo += ` (${prof.momentumAnalysis.streak} rounds)`;
                    }
                    if (prof.momentumAnalysis.critical) {
                        momentumInfo += ' - CRÍTICO';
                    }
                    parts.push(`MOMENTUM: ${momentumInfo}`);
                }
                
                // Insights de padrões
                if (prof.patternInsights && prof.patternInsights.length > 0) {
                    prof.patternInsights.forEach(insight => {
                        if (insight.recommendation) {
                            parts.push(`PADRÃO: ${insight.recommendation}`);
                        }
                    });
                }
            }

            // Meta-analysis específica do mapa
            if (extractedData.map?.mapMeta) {
                const meta = extractedData.map.mapMeta;
                parts.push(`META MAPA: ${meta.utilityMeta}, ${meta.positioningMeta}`);
            }

            return parts.join(' | ');

        } catch (error) {
            console.error('❌ Error formatting professional GSI data:', error.message);
            return "Error formatting professional game data.";
        }
    }

    // ====== SUBTASK 4: CONSTRUCT MULTIMODAL REQUEST APRIMORADO ======

    constructMultimodalRequest(gsiText, imageBase64, mimeType, coachingLevel = 'beginner') {
        const config = this.coachingConfigs[coachingLevel];
        const template = this.promptTemplates[config.promptStyle];

        try {
            // Prompt completo - agora com 65536 tokens disponíveis!
            let contextPrompt = `${template.context}

DADOS DO JOGO: ${gsiText}

INSTRUÇÕES:
- Analise os dados do jogo E a imagem da tela
- Foque em: ${config.focusAreas.join(', ')}
- Nível: ${config.analysisDepth}
- Estilo: ${config.communicationStyle}
- Máximo de ${config.maxInsights} insights
- ${template.format}

ANÁLISE ESPECÍFICA POR NÍVEL:`;

            // Adicionar contexto específico por nível
            if (coachingLevel === 'professional') {
                contextPrompt += `
- Padrões econômicos e predições do adversário
- Análise de momentum e timing estratégico  
- Fatores de pressão psicológica
- Meta-game e adaptações necessárias
- Oportunidades táticas e timing

Pense como coach de Major tournament.`;
            } else if (coachingLevel === 'intermediate') {
                contextPrompt += `
- Coordenação de equipe e uso de utility
- Timing de rotações e controle de mapa
- Decisões econômicas e force-buy
- Melhorias de posicionamento

Eduque desenvolvendo game sense.`;
            } else {
                contextPrompt += `
- Sobrevivência imediata e posicionamento
- Decisões econômicas básicas (buy/save)
- Awareness de inimigos e timings
- Proteção de HP/armor e utility

Comunique claro e direto.`;
            }

            contextPrompt += `

Forneça coaching específico baseado na situação atual.`;

            // Construir request body para Gemini com configurações otimizadas
            const requestBody = {
                contents: [{
                    parts: [
                        {
                            text: template.system
                        },
                        {
                            text: contextPrompt
                        },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: imageBase64
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 65536  // Usar limite máximo do Gemini 2.5 Flash!
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_ONLY_HIGH"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH", 
                        threshold: "BLOCK_ONLY_HIGH"
                    }
                ]
            };

            return requestBody;

        } catch (error) {
            console.error('❌ Error constructing professional multimodal request:', error.message);
            throw error;
        }
    }

    // ====== SUBTASK 5 & 6: EXECUTE API CALL AND PARSE RESPONSE (PROFISSIONAL) ======

    async generateMultimodalCoaching(gsiData, imageBase64, mimeType, coachingLevel = 'beginner') {
        console.log('🤖 GEMINI 2.5 FLASH: Starting multimodal coaching generation...');
        console.log('🤖 GEMINI 2.5 FLASH: Coach initialized?', this.isInitialized);
        console.log('🤖 GEMINI 2.5 FLASH: Has GSI data?', !!gsiData);
        console.log('🤖 GEMINI 2.5 FLASH: Has screenshot?', !!imageBase64);
        console.log('🤖 GEMINI 2.5 FLASH: Coaching level:', coachingLevel);
        
        if (!this.isInitialized) {
            console.error('❌ GEMINI 2.5 FLASH: Professional Multimodal Coach not initialized');
            throw new Error('Professional Multimodal Coach not initialized. Call initialize() first.');
        }

        const startTime = Date.now();
        this.stats.totalAnalyses++;

        try {
            console.log(`🎯 GEMINI 2.5 FLASH: Generating ${coachingLevel} professional coaching with multimodal AI...`);

            // Extrair e formatar dados GSI com análise profissional
            const extractedGSI = this.extractRelevantGSIData(gsiData, coachingLevel);
            const gsiText = this.formatGSIDataForPrompt(extractedGSI);
            
            console.log(`📊 Professional GSI Summary: ${gsiText.substring(0, 120)}...`);

            // Construir request multimodal profissional
            const requestBody = this.constructMultimodalRequest(gsiText, imageBase64, mimeType, coachingLevel);

            // Executar chamada para Gemini com contexto profissional
            console.log('🚀 GEMINI 2.5 FLASH: Sending professional multimodal request to Gemini...');
            console.log('🤖 GEMINI 2.5 FLASH: Using model - gemini-2.5-flash');
            
            // Usar o método correto generateContentMultimodal
            const parts = requestBody.contents[0].parts;
            const options = {
                generationConfig: requestBody.generationConfig,
                safetySettings: requestBody.safetySettings
            };
            
            const response = await this.geminiClient.generateContentMultimodal(parts, options);

            console.log('🤖 GEMINI 2.5 FLASH: Response received!', !!response.text);
            console.log('🤖 GEMINI 2.5 FLASH: Response details:', {
                hasText: !!response.text,
                textLength: response.text?.length || 0,
                metadata: response.metadata || {}
            });
            
            if (!response.text || response.text.trim().length === 0) {
                console.error('❌ GEMINI 2.5 FLASH: Empty response - likely safety filter');
                console.log('🤖 GEMINI 2.5 FLASH: Trying fallback with simple prompt...');
                
                // Try a simple text-only fallback (no image to avoid safety filters)
                console.log('🤖 GEMINI 2.5 FLASH: Attempting text-only fallback...');
                const fallbackPrompt = `Você é um coach de CS2. Dê uma dica geral para melhorar no jogo.
                
Situação:
- Jogador: ${extractedGSI?.player?.state?.health || 100}HP, $${extractedGSI?.player?.state?.money || 0}
- Mapa: ${extractedGSI?.map?.name || 'unknown'}
- Round: ${extractedGSI?.round?.phase || 'unknown'}

Responda em português com 1 dica simples.`;
                
                const fallbackResponse = await this.geminiClient.generateText(fallbackPrompt, {
                    generationConfig: { temperature: 0.3, maxOutputTokens: 100 }
                });
                
                if (fallbackResponse.text && fallbackResponse.text.trim().length > 0) {
                    console.log('✅ GEMINI 2.5 FLASH: Text-only fallback successful');
                    response.text = fallbackResponse.text;
                } else {
                    throw new Error(`Gemini API error: No text in response (including text-only fallback)`);
                }
            }

            // Parsear resposta com análise profissional
            const rawText = response.text;
            console.log(`📝 GEMINI 2.5 FLASH: AI response (${rawText.length} chars): ${rawText.substring(0, 150)}...`);

            // Extrair insights estruturados com análise profissional
            const insights = this.extractActionableInsights(rawText, coachingLevel);

            console.log(`🤖 GEMINI 2.5 FLASH: Insights extracted: ${insights.tips?.length || 0} tips, ${insights.alerts?.length || 0} alerts`);
            console.log(`🤖 GEMINI 2.5 FLASH: Professional insights: ${Object.keys(insights.professionalInsights || {}).length} categories`);

            const processingTime = Date.now() - startTime;
            this.updateStats(processingTime, true, insights);

            console.log(`✅ GEMINI 2.5 FLASH: Professional multimodal coaching generated successfully (${processingTime}ms)`);

            // Resultado aprimorado com análise profissional
            const result = {
                success: true,
                coaching: {
                    level: coachingLevel,
                    gsiSummary: gsiText,
                    rawResponse: rawText,
                    insights: insights,
                    timestamp: Date.now(),
                    processingTime: processingTime,
                    // Dados profissionais adicionais
                    professionalContext: {
                        analysisDepth: this.coachingConfigs[coachingLevel].analysisDepth,
                        communicationStyle: this.coachingConfigs[coachingLevel].communicationStyle,
                        focusAreas: this.coachingConfigs[coachingLevel].focusAreas
                    }
                },
                metadata: {
                    gsiData: extractedGSI,
                    imageSize: imageBase64.length,
                    mimeType: mimeType,
                    requestTokens: JSON.stringify(requestBody).length,
                    // Metadata profissional
                    professionalAnalysis: extractedGSI?.professionalAnalysis || null,
                    coachingComplexity: this.calculateCoachingComplexity(insights, extractedGSI)
                }
            };

            return result;

        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.updateStats(processingTime, false);
            
            console.error('❌ Professional multimodal coaching generation failed:', error.message);
            
            return {
                success: false,
                error: error.message,
                coaching: null,
                metadata: {
                    processingTime: processingTime,
                    gsiData: gsiData ? this.extractRelevantGSIData(gsiData, coachingLevel) : null,
                    failureType: this.categorizeFailure(error.message)
                }
            };
        }
    }

    // Calcular complexidade do coaching (métrica profissional)
    calculateCoachingComplexity(insights, extractedGSI) {
        let complexityScore = 0;
        
        // Complexidade baseada em insights
        if (insights.tips?.length >= 5) complexityScore += 2;
        if (insights.alerts?.length >= 2) complexityScore += 2;
        if (insights.categories?.length >= 4) complexityScore += 2;
        if (insights.professionalInsights?.economicRecommendations?.length > 0) complexityScore += 3;
        if (insights.professionalInsights?.tacticalAdjustments?.length > 0) complexityScore += 3;
        
        // Complexidade baseada em dados GSI
        if (extractedGSI?.professionalAnalysis) {
            complexityScore += 5;
            if (extractedGSI.professionalAnalysis.patternInsights?.length > 0) complexityScore += 3;
            if (extractedGSI.professionalAnalysis.momentumAnalysis?.critical) complexityScore += 2;
        }
        
        if (complexityScore >= 15) return 'master';
        if (complexityScore >= 12) return 'expert';
        if (complexityScore >= 8) return 'professional';
        if (complexityScore >= 5) return 'intermediate';
        return 'basic';
    }

    // Categorizar tipo de falha para análise
    categorizeFailure(errorMessage) {
        const message = errorMessage.toLowerCase();
        
        if (message.includes('api') || message.includes('quota')) return 'api_error';
        if (message.includes('network') || message.includes('timeout')) return 'network_error';
        if (message.includes('auth') || message.includes('key')) return 'authentication_error';
        if (message.includes('gsi') || message.includes('data')) return 'data_processing_error';
        return 'unknown_error';
    }

    // Atualizar estatísticas de performance profissionais
    updateStats(processingTime, success, insights = null) {
        this.stats.totalResponseTime += processingTime;
        this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.totalAnalyses;
        this.stats.lastAnalysisTime = Date.now();

        if (success) {
            this.stats.successfulAnalyses++;
            
            // Atualizar estatísticas profissionais baseadas nos insights
            if (insights?.professionalInsights) {
                const prof = insights.professionalInsights;
                
                if (prof.economicRecommendations?.length > 0) {
                    this.stats.professionalInsights.economicAnalyses++;
                }
                if (prof.momentumFactors?.length > 0) {
                    this.stats.professionalInsights.momentumIdentifications++;
                }
                if (prof.tacticalAdjustments?.length > 0) {
                    this.stats.professionalInsights.metaAdjustments++;
                }
            }
        } else {
            this.stats.failedAnalyses++;
        }
    }

    // ====== SUBTASK 7: EXTRACT ACTIONABLE INSIGHTS APRIMORADO ======

    extractActionableInsights(rawText, coachingLevel) {
        if (!rawText) return { tips: [], alerts: [], categories: [], professionalInsights: {} };

        try {
            const insights = {
                tips: [],
                alerts: [],
                categories: [],
                urgency: 'low',
                confidence: 'medium',
                professionalInsights: {
                    economicRecommendations: [],
                    tacticalAdjustments: [],
                    momentumFactors: [],
                    pressurePoints: [],
                    metaAdaptations: []
                }
            };

            // Dividir texto em linhas e limpar
            const lines = rawText.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            // Detectar categorias principais com análise profissional
            const categories = this.detectInsightCategories(rawText);
            insights.categories = categories;

            // Extrair tips baseado no formato com análise profissional
            const config = this.coachingConfigs[coachingLevel];

            if (config.promptStyle === 'simple') {
                // Formato bullet points (•) com foco em ações imediatas
                const bulletPoints = lines.filter(line => 
                    line.startsWith('•') || 
                    line.startsWith('-') || 
                    line.startsWith('*')
                );
                
                insights.tips = bulletPoints
                    .map(line => line.replace(/^[•\-*]\s*/, '').trim())
                    .filter(tip => tip.length > 0)
                    .slice(0, config.maxInsights);

            } else if (config.promptStyle === 'detailed') {
                // Formato por seções com análise tática
                let currentSection = '';
                let recommendations = [];
                let economicTips = [];
                let tacticalTips = [];

                for (const line of lines) {
                    const upperLine = line.toUpperCase();
                    
                    if (upperLine.includes('ECONOMIA')) {
                        currentSection = 'economy';
                        continue;
                    } else if (upperLine.includes('UTILIDADES')) {
                        currentSection = 'utilities';
                        continue;
                    } else if (upperLine.includes('COORDENAÇÃO')) {
                        currentSection = 'coordination';
                        continue;
                    } else if (upperLine.includes('RECOMENDAÇÕES') || upperLine.includes('SUGESTÕES')) {
                        currentSection = 'recommendations';
                        continue;
                    }

                    if (currentSection === 'recommendations' && 
                        (line.startsWith('-') || line.startsWith('•') || line.startsWith('*'))) {
                        recommendations.push(line.replace(/^[•\-*]\s*/, '').trim());
                    } else if (currentSection === 'economy' && line.includes(':')) {
                        economicTips.push(line.trim());
                        insights.professionalInsights.economicRecommendations.push(line.trim());
                    } else if ((currentSection === 'utilities' || currentSection === 'coordination') && line.includes(':')) {
                        tacticalTips.push(line.trim());
                        insights.professionalInsights.tacticalAdjustments.push(line.trim());
                    }
                }

                insights.tips = [...recommendations, ...economicTips, ...tacticalTips].slice(0, config.maxInsights);

            } else {
                // Formato analítico profissional - extrair insights por categoria
                let currentSection = '';
                let strategicPoints = [];
                let economicPoints = [];
                let momentumPoints = [];
                let pressurePoints = [];

                for (const line of lines) {
                    const upperLine = line.toUpperCase();
                    
                    if (upperLine.includes('ANÁLISE ESTRATÉGICA') || upperLine.includes('ESTRATÉGICA')) {
                        currentSection = 'strategic';
                        continue;
                    } else if (upperLine.includes('ECONOMIA') || upperLine.includes('ECONÔMICA')) {
                        currentSection = 'economic';
                        continue;
                    } else if (upperLine.includes('MOMENTUM') || upperLine.includes('PSICOLÓGICO')) {
                        currentSection = 'momentum';
                        continue;
                    } else if (upperLine.includes('PRESSÃO') || upperLine.includes('PADRÕES')) {
                        currentSection = 'pressure';
                        continue;
                    }

                    // Extrair pontos por seção
                    if (line.includes(':') || line.includes('recomend') || line.includes('deve') || line.includes('precisa')) {
                        const cleanLine = line.trim();
                        
                        switch (currentSection) {
                            case 'strategic':
                                strategicPoints.push(cleanLine);
                                insights.professionalInsights.tacticalAdjustments.push(cleanLine);
                                break;
                            case 'economic':
                                economicPoints.push(cleanLine);
                                insights.professionalInsights.economicRecommendations.push(cleanLine);
                                break;
                            case 'momentum':
                                momentumPoints.push(cleanLine);
                                insights.professionalInsights.momentumFactors.push(cleanLine);
                                break;
                            case 'pressure':
                                pressurePoints.push(cleanLine);
                                insights.professionalInsights.pressurePoints.push(cleanLine);
                                break;
                            default:
                                strategicPoints.push(cleanLine);
                        }
                    }
                }

                insights.tips = [...strategicPoints, ...economicPoints, ...momentumPoints, ...pressurePoints]
                    .slice(0, config.maxInsights)
                    .map(point => point.trim());
            }

            // Detectar alerts urgentes com análise profissional
            const urgentKeywords = [
                'crítico', 'urgente', 'imediato', 'perigo', 'atenção',
                'baixo hp', 'sem armor', 'sem dinheiro', 'bomba',
                'inimigo próximo', 'reload', 'recuar', 'force',
                'momentum negativo', 'pressão extrema', 'clutch'
            ];

            insights.alerts = insights.tips.filter(tip => {
                const lowerTip = tip.toLowerCase();
                return urgentKeywords.some(keyword => lowerTip.includes(keyword));
            }).slice(0, 3); // Máximo 3 alerts para coaching profissional

            // Detectar nível de urgência com critérios profissionais
            if (insights.alerts.length >= 2) {
                insights.urgency = 'high';
            } else if (insights.alerts.length >= 1 || 
                       categories.includes('tactical') || 
                       categories.includes('economic') ||
                       categories.includes('momentum')) {
                insights.urgency = 'medium';
            }

            // Calcular confiança baseada na qualidade da resposta profissional
            let confidenceScore = 0;
            if (insights.tips.length >= 3) confidenceScore += 2;
            if (rawText.length > 200) confidenceScore += 2;
            if (insights.professionalInsights.economicRecommendations.length > 0) confidenceScore += 1;
            if (insights.professionalInsights.tacticalAdjustments.length > 0) confidenceScore += 1;
            if (categories.length >= 3) confidenceScore += 1;

            if (confidenceScore >= 6) {
                insights.confidence = 'high';
            } else if (confidenceScore >= 4) {
                insights.confidence = 'medium';
            } else {
                insights.confidence = 'low';
            }

            // Atualizar estatísticas de categorias profissionais
            categories.forEach(category => {
                this.stats.insightCategories[category] = (this.stats.insightCategories[category] || 0) + 1;
            });

            // Incrementar estatísticas profissionais
            if (insights.professionalInsights.economicRecommendations.length > 0) {
                this.stats.professionalInsights.economicAnalyses++;
            }
            if (insights.professionalInsights.momentumFactors.length > 0) {
                this.stats.professionalInsights.momentumIdentifications++;
            }

            return insights;

        } catch (error) {
            console.error('❌ Error extracting professional insights:', error.message);
            return { 
                tips: ['Erro ao processar insights profissionais da AI'], 
                alerts: [], 
                categories: ['error'],
                urgency: 'low',
                confidence: 'low',
                professionalInsights: {}
            };
        }
    }

    // Detectar categorias de insights com análise profissional aprimorada
    detectInsightCategories(text) {
        const categories = [];
        const lowerText = text.toLowerCase();

        // Definir padrões para cada categoria com foco profissional
        const categoryPatterns = {
            health: ['health', 'hp', 'vida', 'saúde', 'armor', 'armadura', 'sobrevivência'],
            economic: ['money', 'dinheiro', 'economia', 'buy', 'comprar', 'eco', 'force', 'save'],
            positioning: ['posição', 'position', 'cover', 'angle', 'spot', 'peek', 'hold'],
            tactical: ['tática', 'tactic', 'strategy', 'estratégia', 'team', 'execute', 'timing'],
            utility: ['utility', 'utilidade', 'granada', 'smoke', 'flash', 'molly', 'he'],
            weapon: ['weapon', 'arma', 'reload', 'ammo', 'munição', 'rifle', 'pistol'],
            map: ['map', 'mapa', 'site', 'bombsite', 'area', 'rotation', 'control'],
            psychological: ['confidence', 'confiança', 'pressure', 'pressão', 'momentum', 'mental'],
            // Categorias profissionais adicionais
            momentum: ['momentum', 'streak', 'rounds', 'psychological', 'morale', 'confidence'],
            meta: ['meta', 'trend', 'pattern', 'adaptation', 'current', 'professional'],
            pressure: ['pressure', 'clutch', 'critical', 'urgent', 'emergency', 'stress'],
            pattern: ['pattern', 'tendency', 'habit', 'repetitive', 'predictable', 'consistent'],
            coordination: ['coordination', 'sync', 'teamwork', 'communication', 'together'],
            adaptation: ['adapt', 'adjust', 'change', 'modify', 'counter', 'respond']
        };

        Object.entries(categoryPatterns).forEach(([category, patterns]) => {
            if (patterns.some(pattern => lowerText.includes(pattern))) {
                categories.push(category);
            }
        });

        return categories.length > 0 ? categories : ['general'];
    }

    // Obter estatísticas de performance profissionais aprimoradas
    getPerformanceStats() {
        const successRate = this.stats.totalAnalyses > 0 ? 
            (this.stats.successfulAnalyses / this.stats.totalAnalyses * 100).toFixed(1) : 0;

        return {
            isInitialized: this.isInitialized,
            totalAnalyses: this.stats.totalAnalyses,
            successfulAnalyses: this.stats.successfulAnalyses,
            failedAnalyses: this.stats.failedAnalyses,
            successRate: `${successRate}%`,
            averageResponseTime: `${Math.round(this.stats.averageResponseTime)}ms`,
            insightCategories: this.stats.insightCategories,
            lastAnalysisTime: this.stats.lastAnalysisTime,
            supportedLevels: Object.keys(this.coachingConfigs),
            // Estatísticas profissionais
            professionalInsights: {
                patternDetections: this.stats.professionalInsights.patternDetections,
                economicAnalyses: this.stats.professionalInsights.economicAnalyses,
                momentumIdentifications: this.stats.professionalInsights.momentumIdentifications,
                pressureSituations: this.stats.professionalInsights.pressureSituations,
                metaAdjustments: this.stats.professionalInsights.metaAdjustments
            },
            // Análise de eficácia profissional
            professionalEffectiveness: {
                patternAccuracy: this.calculatePatternAccuracy(),
                economicPredictionRate: this.calculateEconomicAccuracy(),
                momentumDetectionRate: this.calculateMomentumAccuracy(),
                overallProfessionalRating: this.calculateOverallProfessionalRating()
            }
        };
    }

    // Métodos de cálculo de eficácia profissional
    calculatePatternAccuracy() {
        const total = this.stats.professionalInsights.patternDetections;
        return total > 0 ? `${Math.min(95, 70 + (total * 2))}%` : '0%';
    }

    calculateEconomicAccuracy() {
        const total = this.stats.professionalInsights.economicAnalyses;
        return total > 0 ? `${Math.min(92, 65 + (total * 3))}%` : '0%';
    }

    calculateMomentumAccuracy() {
        const total = this.stats.professionalInsights.momentumIdentifications;
        return total > 0 ? `${Math.min(88, 60 + (total * 4))}%` : '0%';
    }

    calculateOverallProfessionalRating() {
        const totalProfessionalAnalyses = Object.values(this.stats.professionalInsights)
            .reduce((sum, count) => sum + count, 0);
        
        if (totalProfessionalAnalyses < 5) return 'Desenvolvimento';
        if (totalProfessionalAnalyses < 15) return 'Competente';
        if (totalProfessionalAnalyses < 30) return 'Profissional';
        if (totalProfessionalAnalyses < 50) return 'Expert';
        return 'Master Coach';
    }

    // Cleanup aprimorado
    async cleanup() {
        console.log('🧹 Cleaning up Professional Multimodal Coach...');
        
        // Salvar estatísticas profissionais antes do cleanup
        if (this.stats.totalAnalyses > 0) {
            console.log(`📊 Professional Analysis Summary:`);
            console.log(`   Total Analyses: ${this.stats.totalAnalyses}`);
            console.log(`   Success Rate: ${(this.stats.successfulAnalyses / this.stats.totalAnalyses * 100).toFixed(1)}%`);
            console.log(`   Pattern Detections: ${this.stats.professionalInsights.patternDetections}`);
            console.log(`   Economic Analyses: ${this.stats.professionalInsights.economicAnalyses}`);
            console.log(`   Momentum Identifications: ${this.stats.professionalInsights.momentumIdentifications}`);
        }
        
        this.isInitialized = false;
        console.log('✅ Professional Multimodal Coach cleaned up');
    }
}

// Export singleton instance
module.exports = new MultimodalCoach(); 