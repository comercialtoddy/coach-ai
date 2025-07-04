/**
 * CS2 Coach AI - External API Integration Module
 * Integração com APIs externas (Tracker.gg, Leetify, HLTV)
 * Fornece dados históricos e análise pré-partida
 */

const axios = require('axios');
const NodeCache = require('node-cache');

class ExternalApiIntegration {
    constructor() {
        // Cache com TTL de 1 hora para dados de jogadores
        this.cache = new NodeCache({ stdTTL: 3600 });
        
        // Configurações das APIs
        this.config = {
            trackerGG: {
                baseUrl: 'https://public-api.tracker.gg/v2/csgo',
                apiKey: process.env.TRACKER_GG_API_KEY || '',
                rateLimit: 30, // requests per minute
                headers: {
                    'TRN-Api-Key': process.env.TRACKER_GG_API_KEY || '',
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip'
                }
            },
            leetify: {
                baseUrl: 'https://api.leetify.com/v1',
                apiKey: process.env.LEETIFY_API_KEY || '',
                rateLimit: 60
            },
            steam: {
                baseUrl: 'https://api.steampowered.com',
                apiKey: process.env.STEAM_API_KEY || ''
            }
        };
        
        // Rate limiting
        this.requestQueue = new Map();
        this.lastRequestTime = new Map();
        
        // Estatísticas de uso
        this.stats = {
            apiCalls: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: 0
        };
        
        console.log('[API_INTEGRATION] External API Integration initialized');
    }
    
    /**
     * Busca dados do jogador no Tracker.gg
     * @param {string} steamId - Steam ID 64 do jogador
     * @returns {Object} Dados completos do jogador
     */
    async getTrackerGGProfile(steamId) {
        const cacheKey = `tracker_profile_${steamId}`;
        
        // Verifica cache primeiro
        const cached = this.cache.get(cacheKey);
        if (cached) {
            this.stats.cacheHits++;
            console.log(`[TRACKER.GG] Cache hit for ${steamId}`);
            return cached;
        }
        
        this.stats.cacheMisses++;
        
        try {
            // Rate limiting check
            await this.checkRateLimit('trackerGG');
            
            // Busca perfil principal
            const profileUrl = `${this.config.trackerGG.baseUrl}/standard/profile/steam/${steamId}`;
            const response = await axios.get(profileUrl, {
                headers: this.config.trackerGG.headers,
                timeout: 10000
            });
            
            if (response.data && response.data.data) {
                const profileData = this.parseTrackerGGData(response.data.data);
                
                // Busca dados de matches recentes
                const matchesData = await this.getTrackerGGMatches(steamId);
                profileData.recentMatches = matchesData;
                
                // Cacheia resultado
                this.cache.set(cacheKey, profileData);
                
                this.stats.apiCalls++;
                console.log(`[TRACKER.GG] Profile fetched for ${steamId}`);
                
                return profileData;
            }
            
            throw new Error('Invalid response from Tracker.gg');
            
        } catch (error) {
            this.stats.errors++;
            console.error('[TRACKER.GG] Error fetching profile:', error.message);
            
            // Retorna dados mock em caso de erro (para desenvolvimento)
            return this.getMockPlayerData(steamId);
        }
    }
    
    /**
     * Busca matches recentes do jogador
     * @param {string} steamId - Steam ID do jogador
     * @returns {Array} Lista de partidas recentes
     */
    async getTrackerGGMatches(steamId) {
        try {
            const matchesUrl = `${this.config.trackerGG.baseUrl}/standard/profile/steam/${steamId}/segments/match`;
            
            const response = await axios.get(matchesUrl, {
                headers: this.config.trackerGG.headers,
                params: {
                    limit: 20, // Últimas 20 partidas
                    queue: 'competitive' // Apenas competitivo
                },
                timeout: 10000
            });
            
            if (response.data && response.data.data) {
                return response.data.data.map(match => ({
                    matchId: match.attributes.id,
                    map: match.metadata.mapName,
                    result: match.metadata.result,
                    score: match.metadata.score,
                    kd: match.stats.kd.value,
                    kills: match.stats.kills.value,
                    deaths: match.stats.deaths.value,
                    assists: match.stats.assists.value,
                    headshots: match.stats.headshotPct.value,
                    adr: match.stats.damagePerRound.value,
                    rating: match.stats.rating.value,
                    timestamp: match.metadata.timestamp
                }));
            }
            
            return [];
            
        } catch (error) {
            console.error('[TRACKER.GG] Error fetching matches:', error.message);
            return [];
        }
    }
    
    /**
     * Parse dos dados do Tracker.gg para formato interno
     * @param {Object} rawData - Dados brutos da API
     * @returns {Object} Dados formatados
     */
    parseTrackerGGData(rawData) {
        const segments = rawData.segments || [];
        const overviewSegment = segments.find(s => s.type === 'overview') || {};
        const stats = overviewSegment.stats || {};
        
        return {
            // Informações básicas
            platformInfo: {
                platformSlug: rawData.platformInfo?.platformSlug || 'steam',
                platformUserId: rawData.platformInfo?.platformUserId || '',
                platformUserHandle: rawData.platformInfo?.platformUserHandle || 'Unknown',
                avatarUrl: rawData.platformInfo?.avatarUrl || ''
            },
            
            // Estatísticas gerais
            stats: {
                timePlayed: stats.timePlayed?.value || 0,
                score: stats.score?.value || 0,
                kills: stats.kills?.value || 0,
                deaths: stats.deaths?.value || 0,
                kd: stats.kd?.value || 0,
                damage: stats.damage?.value || 0,
                headshots: stats.headshots?.value || 0,
                headshotPct: stats.headshotPct?.value || 0,
                shotsFired: stats.shotsFired?.value || 0,
                shotsHit: stats.shotsHit?.value || 0,
                shotsAccuracy: stats.shotsAccuracy?.value || 0,
                wins: stats.wins?.value || 0,
                losses: stats.losses?.value || 0,
                winRate: stats.wlPercentage?.value || 0,
                mvp: stats.mvp?.value || 0,
                matchesPlayed: stats.matchesPlayed?.value || 0,
                roundsPlayed: stats.roundsPlayed?.value || 0,
                roundsWon: stats.roundsWon?.value || 0
            },
            
            // Rankings e ratings
            ratings: {
                rank: stats.rank?.metadata?.iconUrl || '',
                rankName: stats.rank?.displayValue || 'Unranked',
                rating: stats.rating?.value || 0,
                rankPercentile: stats.rankScore?.percentile || 0
            },
            
            // Análise derivada
            analysis: {
                role: this.inferPlayerRole(stats),
                playStyle: this.inferPlayStyle(stats),
                strengths: this.identifyStrengths(stats),
                weaknesses: this.identifyWeaknesses(stats)
            }
        };
    }
    
    /**
     * Infere o role/função do jogador baseado nas estatísticas
     * @param {Object} stats - Estatísticas do jogador
     * @returns {string} Role inferido
     */
    inferPlayerRole(stats) {
        const kd = stats.kd?.value || 0;
        const headshotPct = stats.headshotPct?.value || 0;
        const adr = stats.damagePerRound?.value || 0;
        
        if (headshotPct > 50 && kd > 1.2) {
            return 'awper';
        } else if (adr > 85 && kd > 1.1) {
            return 'entry_fragger';
        } else if (stats.mvp?.value > stats.matchesPlayed?.value * 0.25) {
            return 'playmaker';
        } else if (kd < 0.9 && stats.shotsAccuracy?.value > 20) {
            return 'support';
        } else {
            return 'rifler';
        }
    }
    
    /**
     * Infere o estilo de jogo do jogador
     * @param {Object} stats - Estatísticas do jogador
     * @returns {string} Estilo de jogo
     */
    inferPlayStyle(stats) {
        const kd = stats.kd?.value || 0;
        const winRate = stats.wlPercentage?.value || 0;
        const accuracy = stats.shotsAccuracy?.value || 0;
        
        if (kd > 1.3 && accuracy > 25) {
            return 'aggressive';
        } else if (winRate > 55 && kd > 1.0) {
            return 'balanced';
        } else if (accuracy > 22 && kd < 1.0) {
            return 'supportive';
        } else {
            return 'passive';
        }
    }
    
    /**
     * Identifica pontos fortes do jogador
     * @param {Object} stats - Estatísticas do jogador
     * @returns {Array} Lista de pontos fortes
     */
    identifyStrengths(stats) {
        const strengths = [];
        
        if (stats.headshotPct?.value > 50) strengths.push('high_headshot_rate');
        if (stats.kd?.value > 1.2) strengths.push('good_fragger');
        if (stats.wlPercentage?.value > 55) strengths.push('winner_mentality');
        if (stats.shotsAccuracy?.value > 25) strengths.push('good_aim');
        if (stats.mvp?.value > stats.matchesPlayed?.value * 0.25) strengths.push('mvp_player');
        
        return strengths;
    }
    
    /**
     * Identifica pontos fracos do jogador
     * @param {Object} stats - Estatísticas do jogador
     * @returns {Array} Lista de pontos fracos
     */
    identifyWeaknesses(stats) {
        const weaknesses = [];
        
        if (stats.kd?.value < 0.8) weaknesses.push('low_kd');
        if (stats.headshotPct?.value < 35) weaknesses.push('low_headshot_rate');
        if (stats.wlPercentage?.value < 45) weaknesses.push('low_win_rate');
        if (stats.shotsAccuracy?.value < 15) weaknesses.push('poor_aim');
        
        return weaknesses;
    }
    
    /**
     * Gera um briefing pré-partida baseado nos dados dos jogadores
     * @param {Array} teamSteamIds - Lista de Steam IDs do time
     * @param {Array} enemySteamIds - Lista de Steam IDs do time inimigo
     * @returns {Object} Briefing completo
     */
    async generatePreMatchBriefing(teamSteamIds = [], enemySteamIds = [], map = '') {
        console.log('[BRIEFING] Generating pre-match briefing...');
        
        try {
            // Busca dados de todos os jogadores em paralelo
            const [teamData, enemyData] = await Promise.all([
                Promise.all(teamSteamIds.map(id => this.getTrackerGGProfile(id))),
                Promise.all(enemySteamIds.map(id => this.getTrackerGGProfile(id)))
            ]);
            
            // Analisa dados do time
            const teamAnalysis = this.analyzeTeam(teamData);
            const enemyAnalysis = this.analyzeTeam(enemyData);
            
            // Gera recomendações estratégicas
            const strategicRecommendations = this.generateStrategicRecommendations(
                teamAnalysis, 
                enemyAnalysis, 
                map
            );
            
            // Identifica ameaças e oportunidades
            const threats = this.identifyThreats(enemyData);
            const opportunities = this.identifyOpportunities(enemyData);
            
            return {
                generatedAt: new Date().toISOString(),
                map: map,
                teamAnalysis: teamAnalysis,
                enemyAnalysis: enemyAnalysis,
                threats: threats,
                opportunities: opportunities,
                strategicRecommendations: strategicRecommendations,
                confidence: this.calculateConfidence(enemyData)
            };
            
        } catch (error) {
            console.error('[BRIEFING] Error generating briefing:', error);
            return {
                error: true,
                message: 'Failed to generate briefing',
                fallbackStrategy: 'Play default setups and gather intel'
            };
        }
    }
    
    /**
     * Analisa um time completo
     * @param {Array} playersData - Dados dos jogadores
     * @returns {Object} Análise do time
     */
    analyzeTeam(playersData) {
        if (!playersData || playersData.length === 0) {
            return { error: 'No data available' };
        }
        
        // Calcula médias do time
        const avgKD = playersData.reduce((sum, p) => sum + (p.stats?.kd || 0), 0) / playersData.length;
        const avgWinRate = playersData.reduce((sum, p) => sum + (p.stats?.winRate || 0), 0) / playersData.length;
        const avgRating = playersData.reduce((sum, p) => sum + (p.ratings?.rating || 0), 0) / playersData.length;
        
        // Identifica melhor e pior jogador
        const sortedByKD = [...playersData].sort((a, b) => (b.stats?.kd || 0) - (a.stats?.kd || 0));
        const topPlayer = sortedByKD[0];
        const weakestPlayer = sortedByKD[sortedByKD.length - 1];
        
        // Identifica roles no time
        const roles = playersData.map(p => p.analysis?.role || 'unknown');
        const hasAWPer = roles.includes('awper');
        const entryCount = roles.filter(r => r === 'entry_fragger').length;
        
        // Determina estilo do time
        const teamStyle = avgKD > 1.1 && entryCount >= 2 ? 'aggressive' : 
                         hasAWPer && avgKD > 1.0 ? 'tactical' : 
                         avgKD < 0.9 ? 'defensive' : 'balanced';
        
        return {
            playerCount: playersData.length,
            averageKD: avgKD.toFixed(2),
            averageWinRate: avgWinRate.toFixed(1),
            averageRating: avgRating.toFixed(0),
            topPlayer: {
                username: topPlayer?.platformInfo?.platformUserHandle || 'Unknown',
                kd: topPlayer?.stats?.kd || 0,
                role: topPlayer?.analysis?.role || 'unknown'
            },
            weakestPlayer: {
                username: weakestPlayer?.platformInfo?.platformUserHandle || 'Unknown',
                kd: weakestPlayer?.stats?.kd || 0,
                vulnerability: weakestPlayer?.stats?.kd < 0.8 ? 'high' : 'medium'
            },
            teamComposition: {
                hasAWPer: hasAWPer,
                entryFraggers: entryCount,
                supports: roles.filter(r => r === 'support').length
            },
            teamStyle: teamStyle,
            predictedStrategy: this.predictTeamStrategy(teamStyle, roles)
        };
    }
    
    /**
     * Identifica principais ameaças no time inimigo
     * @param {Array} enemyData - Dados dos inimigos
     * @returns {Array} Lista de ameaças
     */
    identifyThreats(enemyData) {
        const threats = [];
        
        enemyData.forEach(player => {
            const stats = player.stats || {};
            const analysis = player.analysis || {};
            
            if (stats.kd > 1.5) {
                threats.push({
                    type: 'star_player',
                    player: player.platformInfo?.platformUserHandle || 'Unknown',
                    kd: stats.kd,
                    role: analysis.role,
                    threat_level: 'high',
                    counter_strategy: 'Focus fire, use utility to isolate'
                });
            }
            
            if (analysis.role === 'awper' && stats.headshotPct > 50) {
                threats.push({
                    type: 'skilled_awper',
                    player: player.platformInfo?.platformUserHandle || 'Unknown',
                    headshot_rate: stats.headshotPct,
                    threat_level: 'high',
                    counter_strategy: 'Smoke key angles, use flashes for peeks'
                });
            }
            
            if (analysis.playStyle === 'aggressive' && stats.kd > 1.2) {
                threats.push({
                    type: 'aggressive_player',
                    player: player.platformInfo?.platformUserHandle || 'Unknown',
                    threat_level: 'medium',
                    counter_strategy: 'Stack sites, prepare for rushes'
                });
            }
        });
        
        return threats.sort((a, b) => {
            const levels = { high: 3, medium: 2, low: 1 };
            return levels[b.threat_level] - levels[a.threat_level];
        });
    }
    
    /**
     * Identifica oportunidades contra o time inimigo
     * @param {Array} enemyData - Dados dos inimigos
     * @returns {Array} Lista de oportunidades
     */
    identifyOpportunities(enemyData) {
        const opportunities = [];
        
        // Procura por jogadores fracos
        const weakPlayers = enemyData.filter(p => (p.stats?.kd || 0) < 0.8);
        if (weakPlayers.length > 0) {
            opportunities.push({
                type: 'weak_players',
                players: weakPlayers.map(p => p.platformInfo?.platformUserHandle || 'Unknown'),
                exploitation: 'Target these players for easy picks'
            });
        }
        
        // Time com baixa taxa de vitória
        const avgWinRate = enemyData.reduce((sum, p) => sum + (p.stats?.winRate || 0), 0) / enemyData.length;
        if (avgWinRate < 45) {
            opportunities.push({
                type: 'low_confidence_team',
                winRate: avgWinRate,
                exploitation: 'Apply pressure early to break morale'
            });
        }
        
        // Falta de AWPer
        const hasAWPer = enemyData.some(p => p.analysis?.role === 'awper');
        if (!hasAWPer) {
            opportunities.push({
                type: 'no_awper',
                exploitation: 'Control long ranges with AWP'
            });
        }
        
        return opportunities;
    }
    
    /**
     * Gera recomendações estratégicas baseadas na análise
     * @param {Object} teamAnalysis - Análise do nosso time
     * @param {Object} enemyAnalysis - Análise do time inimigo
     * @param {string} map - Mapa da partida
     * @returns {Array} Lista de recomendações
     */
    generateStrategicRecommendations(teamAnalysis, enemyAnalysis, map) {
        const recommendations = [];
        
        // Recomendação baseada no estilo dos times
        if (enemyAnalysis.teamStyle === 'aggressive' && teamAnalysis.teamStyle === 'tactical') {
            recommendations.push({
                type: 'counter_style',
                priority: 'high',
                title: 'Counter Aggressive Play',
                description: 'Enemy team plays aggressive. Use utility to slow pushes and play for trades.',
                specific_actions: [
                    'Stack bombsites early in rounds',
                    'Use incendiaries on chokepoints',
                    'Play crossfires and trade frags'
                ]
            });
        }
        
        // Recomendação baseada em ameaças específicas
        if (enemyAnalysis.teamComposition?.hasAWPer) {
            recommendations.push({
                type: 'counter_awp',
                priority: 'high',
                title: 'Neutralize Enemy AWPer',
                description: 'Enemy has dedicated AWPer. Control their angles.',
                specific_actions: [
                    'Smoke common AWP angles immediately',
                    'Use coordinated flashes for peeks',
                    'Force close-range engagements'
                ]
            });
        }
        
        // Recomendação para explorar fraquezas
        if (enemyAnalysis.weakestPlayer?.vulnerability === 'high') {
            recommendations.push({
                type: 'exploit_weakness',
                priority: 'medium',
                title: 'Target Weak Link',
                description: `Focus ${enemyAnalysis.weakestPlayer.username} - lowest performer on enemy team.`,
                specific_actions: [
                    'Push their typical positions',
                    'Force duels against this player',
                    'Exploit for map control'
                ]
            });
        }
        
        // Recomendações específicas do mapa
        const mapRecommendations = this.getMapSpecificRecommendations(map, teamAnalysis, enemyAnalysis);
        recommendations.push(...mapRecommendations);
        
        return recommendations.sort((a, b) => {
            const priority = { high: 3, medium: 2, low: 1 };
            return priority[b.priority] - priority[a.priority];
        });
    }
    
    /**
     * Prediz estratégia do time baseado no estilo e composição
     * @param {string} teamStyle - Estilo do time
     * @param {Array} roles - Roles dos jogadores
     * @returns {string} Estratégia prevista
     */
    predictTeamStrategy(teamStyle, roles) {
        if (teamStyle === 'aggressive') {
            return 'Fast executes and map control';
        } else if (teamStyle === 'tactical' && roles.includes('awper')) {
            return 'Slow defaults with AWP control';
        } else if (teamStyle === 'defensive') {
            return 'Passive holds and late rotates';
        } else {
            return 'Standard defaults and mid-round calls';
        }
    }
    
    /**
     * Retorna recomendações específicas para cada mapa
     * @param {string} map - Nome do mapa
     * @param {Object} teamAnalysis - Análise do time
     * @param {Object} enemyAnalysis - Análise inimiga
     * @returns {Array} Recomendações do mapa
     */
    getMapSpecificRecommendations(map, teamAnalysis, enemyAnalysis) {
        const mapStrats = {
            'de_mirage': [
                {
                    type: 'map_control',
                    priority: 'high',
                    title: 'Control Middle',
                    description: 'Mid control is crucial on Mirage',
                    specific_actions: ['Smoke window/connector early', 'Contest mid with 2 players']
                }
            ],
            'de_dust2': [
                {
                    type: 'map_control',
                    priority: 'high',
                    title: 'Long A Control',
                    description: 'Take long control for map presence',
                    specific_actions: ['Rush long with flash support', 'Smoke CT cross']
                }
            ],
            'de_inferno': [
                {
                    type: 'map_control',
                    priority: 'high',
                    title: 'Banana Control',
                    description: 'Control banana for B site pressure',
                    specific_actions: ['Molly car position', 'Flash over for control']
                }
            ]
        };
        
        return mapStrats[map] || [{
            type: 'generic',
            priority: 'medium',
            title: 'Default Setup',
            description: 'Play standard positions and gather info',
            specific_actions: ['Spread across map', 'Look for picks']
        }];
    }
    
    /**
     * Calcula confiança na análise baseado na quantidade de dados
     * @param {Array} playersData - Dados dos jogadores
     * @returns {number} Percentual de confiança
     */
    calculateConfidence(playersData) {
        let confidence = 0;
        
        // Base confidence
        confidence += playersData.length * 10; // 10% por jogador com dados
        
        // Adiciona confiança baseado em matches jogados
        playersData.forEach(player => {
            const matches = player.stats?.matchesPlayed || 0;
            if (matches > 100) confidence += 10;
            else if (matches > 50) confidence += 5;
            else if (matches > 20) confidence += 3;
        });
        
        // Adiciona confiança se temos dados recentes
        const hasRecentData = playersData.some(p => 
            p.recentMatches && p.recentMatches.length > 10
        );
        if (hasRecentData) confidence += 15;
        
        return Math.min(confidence, 95); // Máximo 95% de confiança
    }
    
    /**
     * Rate limiting implementation
     * @param {string} api - Nome da API
     */
    async checkRateLimit(api) {
        const config = this.config[api];
        if (!config) return;
        
        const lastRequest = this.lastRequestTime.get(api) || 0;
        const timeSinceLastRequest = Date.now() - lastRequest;
        const minInterval = (60 * 1000) / config.rateLimit; // ms between requests
        
        if (timeSinceLastRequest < minInterval) {
            const waitTime = minInterval - timeSinceLastRequest;
            console.log(`[RATE_LIMIT] Waiting ${waitTime}ms for ${api}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime.set(api, Date.now());
    }
    
    /**
     * Retorna dados mock para desenvolvimento/testes
     * @param {string} steamId - Steam ID do jogador
     * @returns {Object} Dados mock do jogador
     */
    getMockPlayerData(steamId) {
        console.log('[MOCK] Returning mock data for development');
        
        return {
            platformInfo: {
                platformSlug: 'steam',
                platformUserId: steamId,
                platformUserHandle: 'MockPlayer_' + steamId.slice(-4),
                avatarUrl: 'https://via.placeholder.com/128'
            },
            stats: {
                timePlayed: 120000,
                kills: 15420,
                deaths: 13200,
                kd: 1.17,
                damage: 1842000,
                headshots: 7800,
                headshotPct: 50.6,
                wins: 520,
                losses: 480,
                winRate: 52.0,
                mvp: 156,
                matchesPlayed: 1000,
                shotsAccuracy: 19.2
            },
            ratings: {
                rank: 'Distinguished Master Guardian',
                rankName: 'DMG',
                rating: 1850,
                rankPercentile: 72
            },
            analysis: {
                role: 'rifler',
                playStyle: 'balanced',
                strengths: ['good_fragger', 'high_headshot_rate'],
                weaknesses: []
            },
            recentMatches: [
                {
                    map: 'de_mirage',
                    result: 'win',
                    score: '16-12',
                    kd: 1.33,
                    kills: 24,
                    deaths: 18,
                    rating: 1.22
                }
            ]
        };
    }
    
    /**
     * Retorna estatísticas de uso da API
     * @returns {Object} Estatísticas
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.keys().length,
            cacheHitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0
        };
    }
}

module.exports = ExternalApiIntegration; 