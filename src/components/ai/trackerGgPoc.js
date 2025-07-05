/**
 * CS2 Coach AI - Tracker.gg API Integration Proof of Concept
 * Demonstração de como integrar dados externos de jogadores
 */

const axios = require('axios');
const config = require('../../config/environment');

class TrackerGgClient {
    constructor(apiKey = null) {
        // Tracker.gg API base URL
        this.baseUrl = 'https://public-api.tracker.gg/v2/csgo';
        
        // Usar configuração centralizada
        this.apiKey = apiKey || config.getApiKey('gamingProviders', 'trackerGg');
        this.rateLimit = config.gamingProviders.trackerGg.rateLimit;
        
        // Headers padrão para requisições
        this.headers = {
            'TRN-Api-Key': this.apiKey,
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip'
        };
        
        // Cache simples para evitar rate limiting
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }
    
    /**
     * Busca perfil de jogador pelo Steam ID ou username
     * @param {string} identifier - Steam ID ou username
     * @param {string} platform - 'steam' ou 'faceit'
     * @returns {Object} Dados do perfil do jogador
     */
    async getPlayerProfile(identifier, platform = 'steam') {
        const cacheKey = `profile:${platform}:${identifier}`;
        
        // Verificar cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('[TRACKER.GG] Retornando dados do cache');
                return cached.data;
            }
        }
        
        try {
            console.log(`[TRACKER.GG] Buscando perfil: ${identifier}`);
            
            const response = await axios.get(
                `${this.baseUrl}/standard/profile/${platform}/${identifier}`,
                { headers: this.headers }
            );
            
            // Armazenar no cache
            this.cache.set(cacheKey, {
                data: response.data,
                timestamp: Date.now()
            });
            
            return response.data;
        } catch (error) {
            console.error('[TRACKER.GG] Erro ao buscar perfil:', error.message);
            throw error;
        }
    }
    
    /**
     * Extrai estatísticas relevantes para o CS2 Coach AI
     * @param {Object} profileData - Dados brutos do perfil
     * @returns {Object} Estatísticas formatadas
     */
    extractRelevantStats(profileData) {
        const data = profileData.data;
        const segments = data.segments;
        
        // Encontrar estatísticas gerais
        const overview = segments.find(s => s.type === 'overview');
        const stats = overview?.stats || {};
        
        return {
            // Informações básicas
            platformInfo: data.platformInfo,
            userInfo: data.userInfo,
            
            // Estatísticas principais
            rating: stats.rating?.value || 0,
            kd: stats.kd?.value || 0,
            kills: stats.kills?.value || 0,
            deaths: stats.deaths?.value || 0,
            headshots: stats.headshotPct?.value || 0,
            accuracy: stats.accuracy?.value || 0,
            
            // Estatísticas de round
            winRate: stats.wlPercentage?.value || 0,
            matchesPlayed: stats.matchesPlayed?.value || 0,
            wins: stats.wins?.value || 0,
            mvps: stats.mvp?.value || 0,
            
            // Performance recente
            recentPerformance: this.extractRecentPerformance(segments),
            
            // Mapas favoritos
            mapStats: this.extractMapStats(segments)
        };
    }
    
    /**
     * Extrai performance recente do jogador
     * @param {Array} segments - Segmentos de dados
     * @returns {Array} Performance dos últimos jogos
     */
    extractRecentPerformance(segments) {
        const recentMatches = segments.filter(s => s.type === 'match').slice(0, 5);
        
        return recentMatches.map(match => ({
            map: match.metadata?.map || 'unknown',
            result: match.stats?.roundsWon?.value > match.stats?.roundsLost?.value ? 'win' : 'loss',
            kills: match.stats?.kills?.value || 0,
            deaths: match.stats?.deaths?.value || 0,
            kd: match.stats?.kd?.value || 0,
            rating: match.stats?.rating?.value || 0
        }));
    }
    
    /**
     * Extrai estatísticas por mapa
     * @param {Array} segments - Segmentos de dados
     * @returns {Object} Stats organizadas por mapa
     */
    extractMapStats(segments) {
        const mapSegments = segments.filter(s => s.type === 'map');
        const mapStats = {};
        
        mapSegments.forEach(map => {
            const mapName = map.metadata?.name || 'unknown';
            mapStats[mapName] = {
                matches: map.stats?.matchesPlayed?.value || 0,
                winRate: map.stats?.wlPercentage?.value || 0,
                kd: map.stats?.kd?.value || 0,
                rating: map.stats?.rating?.value || 0
            };
        });
        
        return mapStats;
    }
    
    /**
     * Gera briefing pré-partida baseado nos dados do jogador
     * @param {string} playerIdentifier - Steam ID do jogador
     * @returns {Object} Briefing formatado para o Coach AI
     */
    async generatePreMatchBriefing(playerIdentifier) {
        try {
            // Buscar dados do jogador
            const profileData = await this.getPlayerProfile(playerIdentifier);
            const stats = this.extractRelevantStats(profileData);
            
            // Analisar pontos fortes e fracos
            const analysis = this.analyzePlayerStrengths(stats);
            
            // Gerar recomendações táticas
            const recommendations = this.generateTacticalRecommendations(stats, analysis);
            
            return {
                player: {
                    name: stats.userInfo.displayName,
                    platform: stats.platformInfo.platformSlug,
                    avatar: stats.userInfo.avatarUrl
                },
                overview: {
                    rating: stats.rating,
                    kd: stats.kd,
                    winRate: stats.winRate,
                    matchesPlayed: stats.matchesPlayed,
                    recentForm: this.calculateRecentForm(stats.recentPerformance)
                },
                analysis,
                recommendations,
                mapPreferences: this.identifyMapPreferences(stats.mapStats),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('[TRACKER.GG] Erro ao gerar briefing:', error);
            throw error;
        }
    }
    
    /**
     * Analisa pontos fortes e fracos do jogador
     * @param {Object} stats - Estatísticas do jogador
     * @returns {Object} Análise de strengths/weaknesses
     */
    analyzePlayerStrengths(stats) {
        const strengths = [];
        const weaknesses = [];
        
        // Análise de KD
        if (stats.kd > 1.2) {
            strengths.push({
                type: 'fragging',
                description: 'Excelente capacidade de eliminar oponentes',
                value: stats.kd
            });
        } else if (stats.kd < 0.8) {
            weaknesses.push({
                type: 'survival',
                description: 'Dificuldade em manter-se vivo durante rounds',
                value: stats.kd
            });
        }
        
        // Análise de Headshot
        if (stats.headshots > 50) {
            strengths.push({
                type: 'aim',
                description: 'Precisão excepcional com alta taxa de headshot',
                value: stats.headshots
            });
        }
        
        // Análise de Win Rate
        if (stats.winRate > 55) {
            strengths.push({
                type: 'teamplay',
                description: 'Contribui consistentemente para vitórias da equipe',
                value: stats.winRate
            });
        }
        
        return { strengths, weaknesses };
    }
    
    /**
     * Gera recomendações táticas baseadas na análise
     * @param {Object} stats - Estatísticas do jogador
     * @param {Object} analysis - Análise de pontos fortes/fracos
     * @returns {Array} Lista de recomendações
     */
    generateTacticalRecommendations(stats, analysis) {
        const recommendations = [];
        
        // Recomendações baseadas em pontos fracos
        analysis.weaknesses.forEach(weakness => {
            if (weakness.type === 'survival') {
                recommendations.push({
                    priority: 'high',
                    type: 'positioning',
                    message: 'Priorize posições defensivas e evite peeks agressivos',
                    reasoning: `KD baixo (${weakness.value}) indica necessidade de jogar mais conservador`
                });
            }
        });
        
        // Recomendações baseadas em pontos fortes
        analysis.strengths.forEach(strength => {
            if (strength.type === 'aim') {
                recommendations.push({
                    priority: 'medium',
                    type: 'aggression',
                    message: 'Aproveite sua mira superior para buscar picks iniciais',
                    reasoning: `Taxa de headshot alta (${strength.value}%) permite duelos favoráveis`
                });
            }
        });
        
        return recommendations;
    }
    
    /**
     * Calcula a forma recente do jogador
     * @param {Array} recentPerformance - Últimas partidas
     * @returns {string} 'hot' | 'cold' | 'average'
     */
    calculateRecentForm(recentPerformance) {
        if (!recentPerformance.length) return 'unknown';
        
        const avgRating = recentPerformance.reduce((sum, match) => sum + match.rating, 0) / recentPerformance.length;
        const winRate = recentPerformance.filter(m => m.result === 'win').length / recentPerformance.length;
        
        if (avgRating > 1.1 && winRate > 0.6) return 'hot';
        if (avgRating < 0.9 || winRate < 0.4) return 'cold';
        return 'average';
    }
    
    /**
     * Identifica preferências de mapa do jogador
     * @param {Object} mapStats - Estatísticas por mapa
     * @returns {Object} Mapas favoritos e a evitar
     */
    identifyMapPreferences(mapStats) {
        const maps = Object.entries(mapStats);
        
        // Ordenar por performance (win rate * kd)
        maps.sort((a, b) => {
            const scoreA = (a[1].winRate * a[1].kd);
            const scoreB = (b[1].winRate * b[1].kd);
            return scoreB - scoreA;
        });
        
        return {
            strongest: maps.slice(0, 3).map(([name, stats]) => ({ name, ...stats })),
            weakest: maps.slice(-3).map(([name, stats]) => ({ name, ...stats }))
        };
    }
}

// Exemplo de uso
async function demonstrateTrackerGgIntegration() {
    console.log('[POC] Iniciando demonstração da integração Tracker.gg\n');
    
    // Criar cliente (use sua própria API key)
    const tracker = new TrackerGgClient();
    
    // Steam ID de exemplo (você pode substituir por um real)
    const exampleSteamId = '76561198123456789';
    
    try {
        console.log(`[POC] Buscando dados do jogador: ${exampleSteamId}`);
        
        // Gerar briefing pré-partida
        const briefing = await tracker.generatePreMatchBriefing(exampleSteamId);
        
        console.log('\n=== BRIEFING PRÉ-PARTIDA ===');
        console.log(`Jogador: ${briefing.player.name}`);
        console.log(`Rating: ${briefing.overview.rating}`);
        console.log(`K/D: ${briefing.overview.kd}`);
        console.log(`Win Rate: ${briefing.overview.winRate}%`);
        console.log(`Forma Recente: ${briefing.overview.recentForm}`);
        
        console.log('\n=== PONTOS FORTES ===');
        briefing.analysis.strengths.forEach(s => {
            console.log(`- ${s.description} (${s.value})`);
        });
        
        console.log('\n=== PONTOS FRACOS ===');
        briefing.analysis.weaknesses.forEach(w => {
            console.log(`- ${w.description} (${w.value})`);
        });
        
        console.log('\n=== RECOMENDAÇÕES TÁTICAS ===');
        briefing.recommendations.forEach(r => {
            console.log(`[${r.priority.toUpperCase()}] ${r.message}`);
            console.log(`  Razão: ${r.reasoning}`);
        });
        
        console.log('\n=== MAPAS FAVORITOS ===');
        briefing.mapPreferences.strongest.forEach(map => {
            console.log(`- ${map.name}: ${map.winRate}% win rate, ${map.kd} K/D`);
        });
        
    } catch (error) {
        console.error('[POC] Erro na demonstração:', error.message);
        console.log('\nNOTA: Para funcionar, você precisa:');
        console.log('1. Obter uma API key em https://tracker.gg/developers');
        console.log('2. Definir TRACKER_GG_API_KEY no .env ou passar como parâmetro');
        console.log('3. Usar um Steam ID válido de um jogador real');
    }
}

// Exportar para uso no Coach AI
module.exports = TrackerGgClient;

// Executar demonstração se chamado diretamente
if (require.main === module) {
    demonstrateTrackerGgIntegration();
} 