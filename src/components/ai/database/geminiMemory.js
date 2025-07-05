/**
 * CS2 Coach AI - GEMINI Memory System
 * Sistema de memória persistente para o GEMINI lembrar de conversas e respostas anteriores
 */

const fs = require('fs');
const path = require('path');

class GeminiMemory {
    constructor(persistenceFile = null) {
        // Banco de dados de memória
        this.conversations = new Map(); // ID da conversa -> array de mensagens
        this.responseMemory = new Map(); // Hash da situação -> resposta anterior
        this.playerProfiles = new Map(); // Nome do jogador -> perfil e histórico
        this.situationPatterns = new Map(); // Padrão da situação -> respostas similares
        
        // Cache de busca rápida
        this.quickLookup = {
            recentConversations: [], // Últimas 50 conversas
            commonSituations: new Map(), // Situações frequentes
            playerPreferences: new Map(), // Preferências detectadas do jogador
            successfulAdvices: [], // Conselhos que resultaram em sucesso
            failedAdvices: [] // Conselhos que não funcionaram
        };
        
        // Configurações
        this.maxConversations = 200; // Máximo de conversas na memória
        this.maxResponsesPerSituation = 10; // Máximo de respostas similares
        this.maxPlayerProfiles = 50; // Máximo de perfis de jogadores
        this.memoryRetentionDays = 30; // Dias para manter memória
        
        // Sistema de persistência
        this.persistenceFile = persistenceFile || path.join(__dirname, '../../data/gemini_memory.json');
        this.lastSaveTime = Date.now();
        this.autoSaveInterval = 300000; // 5 minutos
        
        // Estatísticas
        this.stats = {
            totalConversations: 0,
            totalResponses: 0,
            memoryHits: 0, // Quantas vezes a memória foi útil
            accurateAdvices: 0,
            inaccurateAdvices: 0,
            averageResponseTime: 0
        };
        
        this.init();
    }
    
    init() {
        // Criar diretório se não existir
        const dataDir = path.dirname(this.persistenceFile);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Carregar memória persistente
        this.loadMemory();
        
        // Configurar auto-save
        this.setupAutoSave();
        
        console.log('[MEMORY] GEMINI Memory System inicializado');
        console.log(`[MEMORY] Conversas carregadas: ${this.conversations.size}`);
        console.log(`[MEMORY] Perfis de jogadores: ${this.playerProfiles.size}`);
    }
    
    // Adicionar nova conversa
    addConversation(conversationId, playerName, situation, userMessage, geminiResponse, gameContext = {}) {
        const conversation = {
            id: conversationId,
            timestamp: Date.now(),
            playerName: playerName,
            situation: situation,
            userMessage: userMessage,
            geminiResponse: geminiResponse,
            gameContext: this.cleanGameContext(gameContext),
            responseHash: this.generateHash(situation, gameContext),
            effectiveness: null, // Será preenchido depois baseado no resultado
            feedback: null
        };
        
        // Adicionar à conversa
        if (!this.conversations.has(conversationId)) {
            this.conversations.set(conversationId, []);
        }
        this.conversations.get(conversationId).push(conversation);
        
        // Adicionar aos patterns de situação
        this.addToSituationPatterns(conversation);
        
        // Atualizar perfil do jogador
        this.updatePlayerProfile(playerName, conversation);
        
        // Atualizar cache de busca rápida
        this.updateQuickLookup(conversation);
        
        // Atualizar estatísticas
        this.stats.totalConversations++;
        this.stats.totalResponses++;
        
        // Limpar memória antiga se necessário
        this.cleanOldMemories();
        
        console.log(`[MEMORY] Nova conversa adicionada: ${conversationId} para ${playerName}`);
        
        return conversation;
    }
    
    // Buscar respostas similares para uma situação
    findSimilarResponses(situation, gameContext, playerName = null, limit = 5) {
        const searchHash = this.generateHash(situation, gameContext);
        const similarResponses = [];
        
        // 1. Busca exata por hash
        if (this.responseMemory.has(searchHash)) {
            const exactMatch = this.responseMemory.get(searchHash);
            similarResponses.push({
                type: 'exact_match',
                confidence: 1.0,
                response: exactMatch.response,
                context: exactMatch.context,
                timestamp: exactMatch.timestamp,
                effectiveness: exactMatch.effectiveness
            });
            this.stats.memoryHits++;
        }
        
        // 2. Busca por situação similar
        const situationKey = this.extractSituationKey(situation);
        if (this.situationPatterns.has(situationKey)) {
            const patterns = this.situationPatterns.get(situationKey);
            patterns.forEach(pattern => {
                if (pattern.responseHash !== searchHash) { // Evitar duplicatas
                    const similarity = this.calculateSimilarity(gameContext, pattern.gameContext);
                    if (similarity > 0.6) { // 60% de similaridade mínima
                        similarResponses.push({
                            type: 'situation_match',
                            confidence: similarity,
                            response: pattern.geminiResponse,
                            context: pattern.gameContext,
                            timestamp: pattern.timestamp,
                            effectiveness: pattern.effectiveness
                        });
                    }
                }
            });
        }
        
        // 3. Busca por perfil do jogador
        if (playerName && this.playerProfiles.has(playerName)) {
            const profile = this.playerProfiles.get(playerName);
            profile.successfulAdvices.forEach(advice => {
                if (advice.situation.includes(situationKey)) {
                    similarResponses.push({
                        type: 'player_history',
                        confidence: 0.8,
                        response: advice.response,
                        context: advice.context,
                        timestamp: advice.timestamp,
                        effectiveness: 'positive'
                    });
                }
            });
        }
        
        // 4. Busca em conversas recentes similares
        this.quickLookup.recentConversations.forEach(conv => {
            if (conv.situation === situation && conv.playerName !== playerName) {
                const similarity = this.calculateSimilarity(gameContext, conv.gameContext);
                if (similarity > 0.5) {
                    similarResponses.push({
                        type: 'recent_similar',
                        confidence: similarity * 0.7, // Reduzir confiança para outras pessoas
                        response: conv.geminiResponse,
                        context: conv.gameContext,
                        timestamp: conv.timestamp,
                        effectiveness: conv.effectiveness
                    });
                }
            }
        });
        
        // Ordenar por confiança e limitar resultados
        similarResponses.sort((a, b) => b.confidence - a.confidence);
        return similarResponses.slice(0, limit);
    }
    
    // Obter contexto de memória para enviar ao GEMINI
    getMemoryContext(situation, gameContext, playerName) {
        const similarResponses = this.findSimilarResponses(situation, gameContext, playerName, 3);
        const playerProfile = this.playerProfiles.get(playerName);
        
        if (similarResponses.length === 0 && !playerProfile) {
            return null; // Nenhum contexto de memória
        }
        
        let memoryContext = `=== CONTEXTO DE MEMÓRIA ===\n`;
        
        // Adicionar perfil do jogador
        if (playerProfile) {
            memoryContext += `PERFIL DO JOGADOR ${playerName}:\n`;
            memoryContext += `- Estilo de jogo: ${playerProfile.playstyle || 'Não detectado'}\n`;
            memoryContext += `- Pontos fortes: ${playerProfile.strengths.join(', ') || 'Analisando...'}\n`;
            memoryContext += `- Áreas de melhoria: ${playerProfile.weaknesses.join(', ') || 'Analisando...'}\n`;
            memoryContext += `- Conselhos efetivos anteriores: ${playerProfile.successfulAdvices.length}\n`;
            memoryContext += `- Win rate recente: ${playerProfile.recentWinRate}%\n\n`;
        }
        
        // Adicionar respostas similares
        if (similarResponses.length > 0) {
            memoryContext += `SITUAÇÕES SIMILARES ANTERIORES:\n`;
            similarResponses.forEach((similar, index) => {
                memoryContext += `${index + 1}. [${similar.type}] (${Math.round(similar.confidence * 100)}% similar)\n`;
                memoryContext += `   Resposta anterior: "${similar.response.substring(0, 100)}..."\n`;
                memoryContext += `   Efetividade: ${similar.effectiveness || 'Não avaliada'}\n\n`;
            });
        }
        
        memoryContext += `INSTRUÇÕES: Use este contexto para personalizar sua resposta, evite repetir exatamente os mesmos conselhos, mas aprenda com o que funcionou antes.\n`;
        
        return memoryContext;
    }
    
    // Marcar efetividade de uma resposta baseada no resultado
    markResponseEffectiveness(conversationId, responseIndex, effectiveness, feedback = '') {
        if (!this.conversations.has(conversationId)) return false;
        
        const conversation = this.conversations.get(conversationId);
        if (responseIndex >= conversation.length) return false;
        
        const response = conversation[responseIndex];
        response.effectiveness = effectiveness; // 'positive', 'negative', 'neutral'
        response.feedback = feedback;
        response.evaluatedAt = Date.now();
        
        // Atualizar perfil do jogador
        const playerProfile = this.playerProfiles.get(response.playerName);
        if (playerProfile) {
            if (effectiveness === 'positive') {
                playerProfile.successfulAdvices.push({
                    situation: response.situation,
                    response: response.geminiResponse,
                    context: response.gameContext,
                    timestamp: response.timestamp
                });
                this.stats.accurateAdvices++;
            } else if (effectiveness === 'negative') {
                playerProfile.failedAdvices.push({
                    situation: response.situation,
                    response: response.geminiResponse,
                    reason: feedback,
                    timestamp: response.timestamp
                });
                this.stats.inaccurateAdvices++;
            }
        }
        
        // Atualizar memória de respostas
        this.responseMemory.set(response.responseHash, {
            response: response.geminiResponse,
            context: response.gameContext,
            timestamp: response.timestamp,
            effectiveness: effectiveness
        });
        
        console.log(`[MEMORY] Efetividade marcada: ${effectiveness} para conversa ${conversationId}`);
        return true;
    }
    
    // Atualizar perfil do jogador
    updatePlayerProfile(playerName, conversation) {
        if (!this.playerProfiles.has(playerName)) {
            this.playerProfiles.set(playerName, {
                name: playerName,
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                totalConversations: 0,
                playstyle: null,
                strengths: [],
                weaknesses: [],
                successfulAdvices: [],
                failedAdvices: [],
                recentWinRate: 0,
                averageKD: 0,
                preferredSide: null, // CT ou TR
                commonSituations: [],
                learningProgress: new Map()
            });
        }
        
        const profile = this.playerProfiles.get(playerName);
        profile.lastSeen = Date.now();
        profile.totalConversations++;
        
        // Analisar contexto do jogo para atualizar perfil
        if (conversation.gameContext) {
            const ctx = conversation.gameContext;
            
            // Detectar lado preferido
            if (ctx.playerSide) {
                if (!profile.preferredSide) {
                    profile.preferredSide = ctx.playerSide;
                } else if (profile.preferredSide !== ctx.playerSide) {
                    profile.preferredSide = 'both'; // Joga ambos os lados
                }
            }
            
            // Atualizar estatísticas
            if (ctx.kills !== undefined && ctx.deaths !== undefined) {
                profile.averageKD = ((profile.averageKD * (profile.totalConversations - 1)) + (ctx.kills / Math.max(ctx.deaths, 1))) / profile.totalConversations;
            }
            
            // Detectar situações comuns
            if (!profile.commonSituations.includes(conversation.situation)) {
                profile.commonSituations.push(conversation.situation);
            }
        }
    }
    
    // Gerar hash único para situação + contexto
    generateHash(situation, gameContext) {
        const contextStr = JSON.stringify({
            situation: situation,
            round: gameContext.roundNumber || 0,
            side: gameContext.playerSide || '',
            health: Math.floor((gameContext.playerHealth || 100) / 25) * 25, // Agrupa por quartis
            money: Math.floor((gameContext.playerMoney || 0) / 1000) * 1000, // Agrupa por milhares
            score: `${gameContext.teamScore?.ct || 0}-${gameContext.teamScore?.t || 0}`
        });
        
        // Hash simples mas efetivo
        let hash = 0;
        for (let i = 0; i < contextStr.length; i++) {
            const char = contextStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    
    // Calcular similaridade entre dois contextos
    calculateSimilarity(context1, context2) {
        if (!context1 || !context2) return 0;
        
        let similarity = 0;
        let factors = 0;
        
        // Comparar lado do jogador
        if (context1.playerSide && context2.playerSide) {
            similarity += context1.playerSide === context2.playerSide ? 0.3 : 0;
            factors++;
        }
        
        // Comparar HP (mais similar quanto mais próximo)
        if (context1.playerHealth !== undefined && context2.playerHealth !== undefined) {
            const healthDiff = Math.abs(context1.playerHealth - context2.playerHealth);
            similarity += Math.max(0, (100 - healthDiff) / 100) * 0.2;
            factors++;
        }
        
        // Comparar economia (similar)
        if (context1.playerMoney !== undefined && context2.playerMoney !== undefined) {
            const moneyDiff = Math.abs(context1.playerMoney - context2.playerMoney);
            similarity += Math.max(0, (5000 - moneyDiff) / 5000) * 0.2;
            factors++;
        }
        
        // Comparar round number (rounds próximos são mais similares)
        if (context1.roundNumber && context2.roundNumber) {
            const roundDiff = Math.abs(context1.roundNumber - context2.roundNumber);
            similarity += Math.max(0, (15 - roundDiff) / 15) * 0.1;
            factors++;
        }
        
        // Comparar score (situações de match point, etc)
        if (context1.teamScore && context2.teamScore) {
            const score1 = `${context1.teamScore.ct}-${context1.teamScore.t}`;
            const score2 = `${context2.teamScore.ct}-${context2.teamScore.t}`;
            similarity += score1 === score2 ? 0.2 : 0;
            factors++;
        }
        
        return factors > 0 ? similarity / factors : 0;
    }
    
    // Extrair chave da situação
    extractSituationKey(situation) {
        const keywords = [
            'triple_kill', 'quad_kill', 'ace', 'clutch', 'bomb_planted', 
            'low_health', 'round_start', 'economy', 'ct_strategy', 'tr_strategy'
        ];
        
        for (const keyword of keywords) {
            if (situation.toLowerCase().includes(keyword)) {
                return keyword;
            }
        }
        
        return 'general';
    }
    
    // Adicionar aos padrões de situação
    addToSituationPatterns(conversation) {
        const situationKey = this.extractSituationKey(conversation.situation);
        
        if (!this.situationPatterns.has(situationKey)) {
            this.situationPatterns.set(situationKey, []);
        }
        
        const patterns = this.situationPatterns.get(situationKey);
        patterns.push(conversation);
        
        // Limitar número de padrões
        if (patterns.length > this.maxResponsesPerSituation) {
            patterns.shift(); // Remove o mais antigo
        }
    }
    
    // Atualizar cache de busca rápida
    updateQuickLookup(conversation) {
        // Adicionar às conversas recentes
        this.quickLookup.recentConversations.unshift(conversation);
        if (this.quickLookup.recentConversations.length > 50) {
            this.quickLookup.recentConversations.pop();
        }
        
        // Atualizar situações comuns
        const situationKey = this.extractSituationKey(conversation.situation);
        const count = this.quickLookup.commonSituations.get(situationKey) || 0;
        this.quickLookup.commonSituations.set(situationKey, count + 1);
    }
    
    // Limpar dados antigos
    cleanOldMemories() {
        const cutoffTime = Date.now() - (this.memoryRetentionDays * 24 * 60 * 60 * 1000);
        
        // Limpar conversas antigas
        this.conversations.forEach((messages, conversationId) => {
            const filteredMessages = messages.filter(msg => msg.timestamp > cutoffTime);
            if (filteredMessages.length === 0) {
                this.conversations.delete(conversationId);
            } else {
                this.conversations.set(conversationId, filteredMessages);
            }
        });
        
        // Limpar perfis de jogadores inativos
        this.playerProfiles.forEach((profile, playerName) => {
            if (profile.lastSeen < cutoffTime) {
                this.playerProfiles.delete(playerName);
            }
        });
        
        // Limitar número total de conversas
        if (this.conversations.size > this.maxConversations) {
            const conversationIds = Array.from(this.conversations.keys());
            const oldestIds = conversationIds
                .sort((a, b) => {
                    const aTime = Math.min(...this.conversations.get(a).map(m => m.timestamp));
                    const bTime = Math.min(...this.conversations.get(b).map(m => m.timestamp));
                    return aTime - bTime;
                })
                .slice(0, this.conversations.size - this.maxConversations);
                
            oldestIds.forEach(id => this.conversations.delete(id));
        }
    }
    
    // Limpar contexto do jogo (remover dados desnecessários)
    cleanGameContext(gameContext) {
        return {
            roundNumber: gameContext.roundNumber,
            playerName: gameContext.playerName,
            playerSide: gameContext.playerSide,
            playerHealth: gameContext.playerHealth,
            playerMoney: gameContext.playerMoney,
            teamScore: gameContext.teamScore,
            mapName: gameContext.mapName,
            kills: gameContext.currentKills,
            deaths: gameContext.currentDeaths,
            damage: gameContext.currentDamage
        };
    }
    
    // Salvar memória em arquivo
    saveMemory() {
        try {
            const memoryData = {
                conversations: Array.from(this.conversations.entries()),
                responseMemory: Array.from(this.responseMemory.entries()),
                playerProfiles: Array.from(this.playerProfiles.entries()),
                situationPatterns: Array.from(this.situationPatterns.entries()),
                quickLookup: {
                    recentConversations: this.quickLookup.recentConversations,
                    commonSituations: Array.from(this.quickLookup.commonSituations.entries()),
                    playerPreferences: Array.from(this.quickLookup.playerPreferences.entries()),
                    successfulAdvices: this.quickLookup.successfulAdvices,
                    failedAdvices: this.quickLookup.failedAdvices
                },
                stats: this.stats,
                savedAt: Date.now()
            };
            
            fs.writeFileSync(this.persistenceFile, JSON.stringify(memoryData, null, 2));
            this.lastSaveTime = Date.now();
            console.log(`[MEMORY] Memória salva em ${this.persistenceFile}`);
            return true;
        } catch (error) {
            console.error('[MEMORY] Erro ao salvar memória:', error);
            return false;
        }
    }
    
    // Carregar memória do arquivo
    loadMemory() {
        try {
            if (!fs.existsSync(this.persistenceFile)) {
                console.log('[MEMORY] Arquivo de memória não encontrado, iniciando com memória limpa');
                return;
            }
            
            const data = fs.readFileSync(this.persistenceFile, 'utf8');
            const memoryData = JSON.parse(data);
            
            // Restaurar Maps
            this.conversations = new Map(memoryData.conversations || []);
            this.responseMemory = new Map(memoryData.responseMemory || []);
            this.playerProfiles = new Map(memoryData.playerProfiles || []);
            this.situationPatterns = new Map(memoryData.situationPatterns || []);
            
            // Restaurar quickLookup
            if (memoryData.quickLookup) {
                this.quickLookup.recentConversations = memoryData.quickLookup.recentConversations || [];
                this.quickLookup.commonSituations = new Map(memoryData.quickLookup.commonSituations || []);
                this.quickLookup.playerPreferences = new Map(memoryData.quickLookup.playerPreferences || []);
                this.quickLookup.successfulAdvices = memoryData.quickLookup.successfulAdvices || [];
                this.quickLookup.failedAdvices = memoryData.quickLookup.failedAdvices || [];
            }
            
            // Restaurar estatísticas
            if (memoryData.stats) {
                this.stats = { ...this.stats, ...memoryData.stats };
            }
            
            console.log(`[MEMORY] Memória carregada de ${this.persistenceFile}`);
            console.log(`[MEMORY] Data do backup: ${new Date(memoryData.savedAt || 0).toLocaleString()}`);
            
        } catch (error) {
            console.error('[MEMORY] Erro ao carregar memória:', error);
            console.log('[MEMORY] Iniciando com memória limpa');
        }
    }
    
    // Configurar auto-save
    setupAutoSave() {
        setInterval(() => {
            if (Date.now() - this.lastSaveTime > this.autoSaveInterval) {
                this.saveMemory();
            }
        }, 60000); // Verificar a cada minuto
        
        // Salvar na saída do processo
        process.on('beforeExit', () => {
            this.saveMemory();
        });
        
        process.on('SIGINT', () => {
            this.saveMemory();
            process.exit(0);
        });
    }
    
    // Obter estatísticas da memória
    getStats() {
        return {
            ...this.stats,
            memorySize: {
                conversations: this.conversations.size,
                responseMemory: this.responseMemory.size,
                playerProfiles: this.playerProfiles.size,
                situationPatterns: this.situationPatterns.size
            },
            memoryEfficiency: this.stats.memoryHits / Math.max(this.stats.totalResponses, 1),
            accuracyRate: this.stats.accurateAdvices / Math.max(this.stats.accurateAdvices + this.stats.inaccurateAdvices, 1)
        };
    }
    
    // Buscar conversas por jogador
    getPlayerHistory(playerName, limit = 10) {
        const playerConversations = [];
        
        this.conversations.forEach((messages) => {
            messages.forEach(msg => {
                if (msg.playerName === playerName) {
                    playerConversations.push(msg);
                }
            });
        });
        
        return playerConversations
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
    
    // Reset completo da memória
    reset() {
        this.conversations.clear();
        this.responseMemory.clear();
        this.playerProfiles.clear();
        this.situationPatterns.clear();
        
        this.quickLookup.recentConversations = [];
        this.quickLookup.commonSituations.clear();
        this.quickLookup.playerPreferences.clear();
        this.quickLookup.successfulAdvices = [];
        this.quickLookup.failedAdvices = [];
        
        this.stats = {
            totalConversations: 0,
            totalResponses: 0,
            memoryHits: 0,
            accurateAdvices: 0,
            inaccurateAdvices: 0,
            averageResponseTime: 0
        };
        
        console.log('[MEMORY] Memória resetada completamente');
    }
}

module.exports = GeminiMemory; 