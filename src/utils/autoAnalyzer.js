/**
 * CS2 Coach AI - Auto Analyzer COM RATE LIMITING
 * Sistema de análise automática com controle de quota Gemini
 */

const { buildPromptWithGSI } = require('../coach/prompt.js');
const ElitePromptSystem = require('../coach/elitePrompt.js');
const RoundDatabase = require('../database/roundDatabase.js');
const EventDetector = require('./eventDetector.js');
const GeminiMemory = require('../database/geminiMemory.js');
const SmartAnalysisTrigger = require('./smartAnalysisTrigger.js');

class AutoAnalyzer {
    constructor(geminiClient, overlayWindow = null) {
        this.geminiClient = geminiClient;
        this.overlayWindow = overlayWindow;
        this.lastAnalysis = null;
        this.analysisInterval = null;
        this.lastGameState = null;
        this.insightHistory = [];
        
        // NOVA: Sistema de banco de dados e detecção de eventos
        this.roundDatabase = new RoundDatabase();
        this.eventDetector = new EventDetector(this.roundDatabase);
        
        // NOVO: Sistema de memória do GEMINI
        this.geminiMemory = new GeminiMemory();
        
        // NOVO: Sistema inteligente de análise estratégica
        this.smartTrigger = new SmartAnalysisTrigger();
        
        // NOVO: Sistema Elite de Prompts Tier 1
        this.elitePromptSystem = new ElitePromptSystem();
        
        // NOVA: Tracking do lado do jogador
        this.currentPlayerSide = null;
        this.previousPlayerSide = null;
        
        // RATE LIMITING - Gemini Free Tier: 10 req/min
        this.requestQueue = [];
        this.lastRequestTime = 0;
        this.minRequestInterval = 10000; // 10 segundos entre requests para prompts longos
        this.isProcessingQueue = false;
        this.rateLimitRetryDelay = 60000; // 60 segundos quando atingir rate limit
        
        // COOLDOWN PARA EVITAR SPAM - ATUALIZADO COM NOVOS TIPOS
        this.lastInsightByType = {};
        this.insightCooldown = {
            'round_start': 10000,           // 10s
            'bomb_planted': 10000,          // 10s 
            'bomb_defusing': 5000,          // 5s - NOVO
            'low_health': 10000,            // 10s
            'critical_health': 8000,        // 8s - NOVO
            'economy_shift': 10000,         // 10s
            'low_economy': 12000,           // 12s - NOVO
            'match_point': 10000,           // 10s
            'tactical_disadvantage': 15000, // 15s
            'performance_boost': 8000,      // 8s
            'economy_warning': 12000,       // 12s
            'side_switch': 5000,            // 5s - NOVO: Mudança de lado
            'ct_strategy': 20000,           // 20s - NOVO: Estratégia CT específica
            'tr_strategy': 20000,           // 20s - NOVO: Estratégia TR específica
            'triple_kill': 5000,            // 5s - NOVO
            'quad_kill': 5000,              // 5s - NOVO  
            'ace': 5000,                    // 5s - NOVO
            'rapid_kills': 8000,            // 8s - NOVO
            'clutch_situation': 10000,      // 10s - NOVO
            'round_end': 5000,              // 5s - NOVO
            'round_summary': 5000,          // 5s - NOVO
            'auto_analysis': 60000          // 60s - Análise periódica
        };
        
        // Configurações estratégicas refinadas
        this.strategicConfig = {
            mainPlayerFocusOnly: true, // Focar apenas no jogador principal
            teamCallsEnabled: true, // Gerar calls para o time
            smartCooldownEnabled: true, // Cooldown inteligente baseado na situação
            maxAnalysisPerRound: 2, // Máximo 2 análises por round para evitar spam
            criticalEventBypass: true // Eventos críticos sempre passam pelo filtro
        };
        
        this.previousGameData = null;
        
        this.init();
    }
    
    init() {
        console.log('[INIT] Auto Analyzer inicializado com Análise Inteligente');
        // REMOVIDO: this.startPeriodicAnalysis(); - Não mais análise automática constante
        this.startRequestQueue();
        console.log('[SMART] Sistema SmartAnalysisTrigger ativo - análise apenas em momentos estratégicos');
    }
    
    startRequestQueue() {
        // Processar fila de requests respeitando rate limit
        setInterval(() => {
            this.processRequestQueue();
        }, 1000); // Verificar a cada segundo
    }
    
    async processRequestQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) return;
        
        const now = Date.now();
        if (now - this.lastRequestTime < this.minRequestInterval) {
            return; // Aguardar interval mínimo
        }
        
        this.isProcessingQueue = true;
        const request = this.requestQueue.shift();
        
        try {
            await this.executeInsightRequest(request);
            this.lastRequestTime = now;
        } catch (error) {
            if (error.status === 429) {
                console.log(`[RATE_LIMIT] Aguardando ${this.rateLimitRetryDelay/1000}s antes de tentar novamente...`);
                // Recolocar request na fila para tentar depois
                this.requestQueue.unshift(request);
                setTimeout(() => {
                    this.isProcessingQueue = false;
                }, this.rateLimitRetryDelay);
                return;
            } else {
                console.error('[ERROR] Request failed:', error.message);
            }
        }
        
        this.isProcessingQueue = false;
    }
    
    async executeInsightRequest(request) {
        const { analysisType, gameData, context } = request;
        
        console.log(`[INSIGHT] Processando: ${analysisType}`);
        console.log(`[DEBUG] Game data para insight:`, JSON.stringify(gameData, null, 2));
        
        // NOVO: Adicionar contexto do banco de dados quando relevante
        let enrichedGameData = { ...gameData };
        if (this.roundDatabase && this.roundDatabase.currentRound.startTime) {
            enrichedGameData.roundContext = this.roundDatabase.getAnalysisContext();
        }
        
        // NOVO: Obter contexto de memória do GEMINI
        const playerName = gameData.player?.name || 'Player';
        const memoryContext = this.geminiMemory.getMemoryContext(analysisType, enrichedGameData, playerName);
        
        // Adicionar contexto de memória ao prompt se disponível
        let enhancedContext = context;
        if (memoryContext) {
            enhancedContext = memoryContext + '\n\n' + context;
            console.log(`[MEMORY] Contexto de memória adicionado para ${playerName}`);
        }
        
        // NOVO: Usar sistema Elite de prompts para Tier 1 coaching
        let promptData;
        try {
            promptData = this.elitePromptSystem.generateElitePrompt(analysisType, enrichedGameData, enhancedContext);
            console.log(`[ELITE_PROMPT] Usando sistema Tier 1 - Tokens estimados: ${promptData.metadata.estimatedTokens}`);
        } catch (error) {
            console.log(`[FALLBACK] Elite system failed, using traditional prompt:`, error.message);
            promptData = buildPromptWithGSI(analysisType, enrichedGameData, enhancedContext);
        }
        
        console.log(`[DEBUG] System Prompt Length: ${promptData.systemPrompt.length} chars`);
        console.log(`[DEBUG] User Prompt: ${promptData.userPrompt}`);
        console.log(`[DEBUG] Enviando para Gemini...`);
        
        // NOVO: Usar configurações otimizadas do sistema Elite se disponível
        let response;
        if (promptData.geminiConfig) {
            response = await this.geminiClient.generateResponse(
                promptData.userPrompt,
                promptData.systemPrompt,
                promptData.geminiConfig
            );
        } else {
            response = await this.geminiClient.generateResponse(
            promptData.userPrompt,
            promptData.systemPrompt
        );
        }

        console.log(`[DEBUG] Resposta completa do Gemini: "${response}"`);
        console.log(`[DEBUG] Tamanho da resposta: ${response ? response.length : 0} chars`);
        
        if (!response || response.trim().length === 0) {
            console.log(`[ERROR] Gemini retornou resposta vazia para ${analysisType}`);
            return;
        }

        console.log(`[SUCCESS] Insight gerado: ${response.substring(0, 50)}...`);
        
        // NOVO: Salvar resposta na memória do GEMINI
        const conversationId = `${playerName}_${Date.now()}`;
        this.geminiMemory.addConversation(
            conversationId,
            playerName,
            analysisType,
            enhancedContext,
            response,
            enrichedGameData
        );
        
        this.displayAutoInsight(response, analysisType);
        
        // Atualizar cooldown
        this.lastInsightByType[analysisType] = Date.now();
    }
    
    queueInsightRequest(analysisType, gameData, context = '') {
        // Verificar cooldown
        const lastInsight = this.lastInsightByType[analysisType] || 0;
        const cooldown = this.insightCooldown[analysisType] || 30000;
        
        if (Date.now() - lastInsight < cooldown) {
            console.log(`[COOLDOWN] Insight ${analysisType} em cooldown por mais ${Math.round((cooldown - (Date.now() - lastInsight))/1000)}s`);
            return;
        }
        
        // Verificar se já está na fila
        const alreadyQueued = this.requestQueue.some(req => req.analysisType === analysisType);
        if (alreadyQueued) {
            console.log(`[QUEUE] ${analysisType} já está na fila`);
            return;
        }
        
        // Adicionar à fila
        this.requestQueue.push({
            analysisType,
            gameData,
            context,
            timestamp: Date.now()
        });
        
        console.log(`[QUEUE] ${analysisType} adicionado à fila (${this.requestQueue.length} pending)`);
    }
    
    // DESABILITADO: Análise periódica removida - sistema inteligente
    startPeriodicAnalysis() {
        console.log('[OLD SYSTEM] startPeriodicAnalysis desabilitado - usando SmartAnalysisTrigger');
    }
    
    stopPeriodicAnalysis() {
        console.log('[OLD SYSTEM] stopPeriodicAnalysis desnecessário - sistema inteligente ativo');
    }
    
    async updateGameState(gameData) {
        this.previousGameData = this.lastGameState;
        this.lastGameState = gameData;
        
        // NOVA FUNCIONALIDADE: Detectar mudança de lado
        this.updatePlayerSideTracking(gameData);
        
        // NOVO: Detectar eventos importantes usando o EventDetector
        const detectedEvents = this.eventDetector.updateState(gameData);
        
        // NOVO: Processar eventos com análise inteligente
        for (const event of detectedEvents) {
            console.log(`[EVENT DETECTED] ${event.type} - Priority: ${event.priority}`, event.data);
            
            // Usar SmartAnalysisTrigger para decidir se deve analisar
            const analysisDecision = this.smartTrigger.shouldAnalyze(
                event.type, 
                gameData, 
                this.roundDatabase.getAnalysisContext()
            );
            
            if (analysisDecision.should) {
                console.log(`[SMART ANALYSIS] ✅ Analisando ${event.type} - ${analysisDecision.reason} (confiança: ${analysisDecision.confidence}%)`);
                this.queueInsightRequest(event.type, gameData, JSON.stringify(event.data));
            } else {
                console.log(`[SMART ANALYSIS] ⏸️ Pulando ${event.type} - ${analysisDecision.reason}`);
            }
            
            // Resumo do round sempre acontece (independente do smart trigger)
            if (event.type === 'round_end' && event.data.needsSummary) {
                await this.generateRoundSummary(gameData);
            }
        }
        
        // REMOVIDO: Análise estratégica constante substituída por SmartAnalysisTrigger
        // if (this.previousGameData) {
        //     await this.checkStrategicMoments(gameData);
        // }
        
        // NOVO: Gerar calls inteligentes para o time
        this.generateTeamCalls(gameData);
    }
    
    // NOVA FUNÇÃO: Tracking do lado do jogador
    updatePlayerSideTracking(gameData) {
        this.previousPlayerSide = this.currentPlayerSide;
        
        if (gameData.player && gameData.player.team) {
            const newSide = this.detectPlayerSide(gameData.player.team);
            this.currentPlayerSide = newSide;
            
            console.log(`[SIDE TRACKING] Current: ${newSide ? newSide.code : 'null'}, Previous: ${this.previousPlayerSide ? this.previousPlayerSide.code : 'null'}`);
            
            // Detectar mudança de lado
            if (this.previousPlayerSide && 
                this.currentPlayerSide && 
                this.previousPlayerSide.code !== this.currentPlayerSide.code) {
                
                console.log(`[SIDE SWITCH] Mudança detectada: ${this.previousPlayerSide.code} -> ${this.currentPlayerSide.code}`);
                
                // Gerar insight sobre mudança de lado
                this.queueInsightRequest('side_switch', gameData, 
                    `Mudança de lado: ${this.previousPlayerSide.displayName} para ${this.currentPlayerSide.displayName}`);
            }
        }
    }
    
    // NOVA FUNÇÃO: Detectar lado do jogador (espelhando a do prompt.js)
    detectPlayerSide(teamValue) {
        const team = teamValue.toString().toUpperCase();
        
        if (team === 'CT' || team === 'COUNTER-TERRORIST' || team === 'COUNTERTERRORIST') {
            return {
                code: 'CT',
                displayName: 'COUNTER-TERRORIST',
                objective: 'Defender bombsites e eliminar terrorists',
                role: 'defesa'
            };
        } else if (team === 'T' || team === 'TERRORIST' || team === 'TERRORISTS') {
            return {
                code: 'TR',
                displayName: 'TERRORIST', 
                objective: 'Plantar bomba ou eliminar CTs',
                role: 'ataque'
            };
        } else {
            return {
                code: 'UNKNOWN',
                displayName: 'DESCONHECIDO',
                objective: 'Lado não detectado',
                role: 'indefinido'
            };
        }
    }
    
    // DESABILITADO: Análise automática periódica removida
    // async performAutoAnalysis() {
    //     console.log('[OLD SYSTEM] Análise automática desabilitada - usando SmartAnalysisTrigger');
    // }
    
    displayAutoInsight(insight, type) {
        console.log(`[DEBUG] displayAutoInsight chamado com:`);
        console.log(`[DEBUG] - insight: "${insight}"`);
        console.log(`[DEBUG] - type: ${type}`);
        console.log(`[DEBUG] - insight length: ${insight ? insight.length : 0}`);
        
        // REMOVIDO: Prefixos com rótulos e emojis - resposta limpa direta do GEMINI
        const fullMessage = insight; // Usar diretamente a resposta do GEMINI sem prefixos
        
        console.log(`[DEBUG] Mensagem completa a ser exibida: "${fullMessage}"`);
        console.log(`[GEMINI] ${fullMessage}`);
        
        // Enviar para o overlay via IPC (main process)
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
            console.log(`[DEBUG] Enviando insight via IPC para overlay`);
            this.overlayWindow.webContents.send('auto-insight', {
                insight: fullMessage,
                type,
                timestamp: Date.now()
            });
        } else {
            console.log(`[DEBUG] Overlay window não disponível ou destruído`);
        }
        
        // Salvar no histórico
        this.insightHistory.push({
            insight,
            type,
            timestamp: Date.now()
        });
        
        // Limitar histórico
        if (this.insightHistory.length > 20) {
            this.insightHistory = this.insightHistory.slice(-20);
        }
    }
    
    detectStrategicMoment(gameData) {
        const prev = this.previousGameData;
        if (!prev) return null;

        // 1. INÍCIO DE ROUND - COM INSIGHTS ESPECÍFICOS POR LADO
        if (gameData.round?.phase === 'freezetime' && prev.round?.phase !== 'freezetime') {
            // Detectar qual lado e dar estratégia específica
            if (this.currentPlayerSide) {
                const sideSpecificType = this.currentPlayerSide.code === 'CT' ? 'ct_strategy' : 'tr_strategy';
                return {
                    type: sideSpecificType,
                    priority: 'high',
                    context: `Round ${gameData.map?.round || 'unknown'} starting as ${this.currentPlayerSide.displayName}`
                };
            } else {
                return {
                    type: 'round_start',
                    priority: 'high',
                    context: `Round ${gameData.map?.round || 'unknown'} starting`
                };
            }
        }

        // 2. BOMBA PLANTADA - INSIGHTS ESPECÍFICOS POR LADO
        if (gameData.round?.bomb === 'planted' && prev.round?.bomb !== 'planted') {
            if (this.currentPlayerSide) {
                const bombContext = this.currentPlayerSide.code === 'CT' ? 
                    'BOMBA PLANTADA - Estratégia de retomada/defuse necessária' :
                    'BOMBA PLANTADA - Defender área plantada e evitar defuse';
                
                return {
                    type: 'bomb_planted',
                    priority: 'critical',
                    context: bombContext
                };
            } else {
                return {
                    type: 'bomb_planted',
                    priority: 'critical',
                    context: 'Bomb has been planted - critical moment'
                };
            }
        }

        // 3. HP CRÍTICO (< 30)
        if (gameData.player?.state?.health < this.minHealthForWarning && 
            prev.player?.state?.health >= this.minHealthForWarning) {
            return {
                type: 'low_health',
                priority: 'high',
                context: `HP critical: ${gameData.player.state.health} - ${this.currentPlayerSide ? this.currentPlayerSide.role : 'unknown'} position`
            };
        }

        // 4. MUDANÇA ECONÔMICA SIGNIFICATIVA (> $2000) - COM CONTEXTO DE LADO
        const currentMoney = gameData.player?.state?.money || 0;
        const prevMoney = prev.player?.state?.money || 0;
        const moneyChange = Math.abs(currentMoney - prevMoney);
        
        if (moneyChange > 2000) {
            let economyContext = `Money change: ${moneyChange > 0 ? '+' : ''}${currentMoney - prevMoney}`;
            
            // Adicionar contexto específico do lado
            if (this.currentPlayerSide) {
                if (this.currentPlayerSide.code === 'CT') {
                    economyContext += ' - CT eco: Prioritize utility e posicionamento defensivo';
                } else if (this.currentPlayerSide.code === 'TR') {
                    economyContext += ' - TR eco: Considere rush ou estratégia slow play';
                }
            }
            
            return {
                type: 'economy_shift',
                priority: 'medium',
                context: economyContext
            };
        }

        // 5. EFEITOS CRÍTICOS - ADAPTADOS POR LADO
        const currentFlashed = gameData.player?.state?.flashed || 0;
        const currentSmoked = gameData.player?.state?.smoked || 0;
        const currentBurning = gameData.player?.state?.burning || 0;
        
        if (currentFlashed > 200 && (prev.player?.state?.flashed || 0) <= 200) {
            let flashContext = 'Heavily flashed - visibility compromised';
            if (this.currentPlayerSide) {
                flashContext += this.currentPlayerSide.code === 'CT' ? 
                    ' - Recue para angle defensivo' : 
                    ' - Aguarde flash diminuir antes de push';
            }
            
            return {
                type: 'tactical_disadvantage',
                priority: 'high',
                context: flashContext
            };
        }
        
        if (currentBurning > 0 && (prev.player?.state?.burning || 0) === 0) {
            return {
                type: 'tactical_disadvantage',
                priority: 'high',
                context: `Taking fire damage - reposition needed (${this.currentPlayerSide ? this.currentPlayerSide.role : 'player'})`
            };
        }

        // 6. ARMA SEM MUNIÇÃO - COM ESTRATÉGIA POR LADO
        const activeWeapon = gameData.player?.weapons ? 
            Object.values(gameData.player.weapons).find(w => w.state === 'active') : null;
        
        if (activeWeapon && activeWeapon.ammo_clip === 0 && activeWeapon.ammo_reserve === 0) {
            const prevActiveWeapon = prev.player?.weapons ? 
                Object.values(prev.player.weapons).find(w => w.state === 'active') : null;
            
            if (prevActiveWeapon && (prevActiveWeapon.ammo_clip > 0 || prevActiveWeapon.ammo_reserve > 0)) {
                let ammoContext = 'Out of ammo - switch weapon or find pickup';
                if (this.currentPlayerSide) {
                    ammoContext += this.currentPlayerSide.code === 'CT' ? 
                        ' - Recue para spawn/teammates' : 
                        ' - Procure arma inimiga ou team drop';
                }
                
                return {
                    type: 'tactical_disadvantage',
                    priority: 'high',
                    context: ammoContext
                };
            }
        }

        // 7. ROUND MULTI-KILL - ADAPTADO POR LADO
        const currentRoundKills = gameData.player?.state?.round_kills || 0;
        const prevRoundKills = prev.player?.state?.round_kills || 0;
        
        if (currentRoundKills >= 2 && currentRoundKills > prevRoundKills) {
            let killContext = `Multi-kill achieved: ${currentRoundKills} kills this round`;
            if (this.currentPlayerSide) {
                killContext += this.currentPlayerSide.code === 'CT' ? 
                    ' - Mantenha posições defensivas' : 
                    ' - Press advantage e force objectives';
            }
            
            return {
                type: 'performance_boost',
                priority: 'medium',
                context: killContext
            };
        }

        // 8. MATCH POINT - COM CONTEXTO POR LADO
        const ctScore = gameData.map?.team_ct?.score || 0;
        const tScore = gameData.map?.team_t?.score || 0;
        const prevCtScore = prev.map?.team_ct?.score || 0;
        const prevTScore = prev.map?.team_t?.score || 0;
        
        if ((ctScore >= 15 || tScore >= 15) && (prevCtScore < 15 && prevTScore < 15)) {
            let matchPointContext = `Match point reached: ${ctScore}-${tScore}`;
            if (this.currentPlayerSide) {
                const isOurSideLeading = (this.currentPlayerSide.code === 'CT' && ctScore > tScore) || 
                                        (this.currentPlayerSide.code === 'TR' && tScore > ctScore);
                matchPointContext += isOurSideLeading ? 
                    ' - CLOSE OUT: Execute default strategy' : 
                    ' - MUST WIN: All-in strategy required';
            }
            
            return {
                type: 'match_point',
                priority: 'critical',
                context: matchPointContext
            };
        }

        // 9. ECONOMY THRESHOLD - COM ESTRATÉGIA POR LADO
        if (currentMoney <= this.lowMoneyThreshold && prevMoney > this.lowMoneyThreshold) {
            let ecoContext = `Low money: $${currentMoney}`;
            if (this.currentPlayerSide) {
                ecoContext += this.currentPlayerSide.code === 'CT' ? 
                    ' - CT eco: Stack sites, force utility' : 
                    ' - TR eco: Consider force-buy ou full save';
            }
            
            return {
                type: 'economy_warning',
                priority: 'medium',
                context: ecoContext
            };
        }

        return null; // Não é momento estratégico
    }

    async checkStrategicMoments(gameData) {
        try {
            const strategicMoment = this.detectStrategicMoment(gameData);
            
            if (strategicMoment) {
                console.log(`[REALTIME] Momento estratégico detectado: ${strategicMoment.type} - ${strategicMoment.context}`);
                
                // Usar fila para insights em tempo real
                this.queueInsightRequest(
                    strategicMoment.type, 
                    gameData, 
                    strategicMoment.context
                );
            }
        } catch (error) {
            console.error('[ERROR] Erro verificando momentos estratégicos:', error);
        }
    }
    
    getInsightHistory() {
        return this.insightHistory;
    }
    
    getQueueStatus() {
        return {
            queueLength: this.requestQueue.length,
            isProcessing: this.isProcessingQueue,
            lastRequestTime: this.lastRequestTime,
            cooldowns: this.lastInsightByType
        };
    }
    
    // NOVO: Gerar resumo completo do round
    async generateRoundSummary(gameData) {
        console.log('[ROUND SUMMARY] Gerando resumo do round...');
        
        // Obter contexto completo do banco de dados
        const roundContext = this.roundDatabase.getAnalysisContext();
        const roundSummary = this.roundDatabase.getRoundSummary();
        
        // NOVO: Avaliar efetividade das respostas baseado no resultado do round
        const roundResult = this.roundDatabase.currentRound.finalResult;
        if (roundResult) {
            this.evaluateResponseEffectiveness(
                roundResult.playerWon,
                roundContext.currentKills,
                roundContext.currentDeaths,
                roundContext.currentDamage
            );
        }
        
        // Obter estatísticas de memória para incluir no resumo
        const memoryStats = this.geminiMemory.getStats();
        
        // Criar prompt especial para resumo do round
        const summaryPrompt = `
RESUMO COMPLETO DO ROUND ${roundContext.roundNumber}

${roundSummary}

CONTEXTO ADICIONAL:
- Performance Geral: ${roundContext.overallStats.kd} K/D, ${roundContext.overallStats.winRate}% Win Rate
- Clutch Rate: ${roundContext.overallStats.clutchRate}%
- Padrões Detectados: ${roundContext.patterns.join(', ') || 'Nenhum'}

DADOS DO ROUND:
- Duração: ${Math.round(roundContext.roundDuration)}s
- Kills: ${roundContext.currentKills}
- Deaths: ${roundContext.currentDeaths}
- Dano Total: ${roundContext.currentDamage}
- Eventos Importantes: ${roundContext.importantEvents.length}

ESTATÍSTICAS DE APRENDIZADO:
- Total de Conversas: ${memoryStats.totalConversations}
- Taxa de Memória Útil: ${Math.round(memoryStats.memoryEfficiency * 100)}%
- Taxa de Acerto dos Conselhos: ${Math.round(memoryStats.accuracyRate * 100)}%

Com base em todos esses dados, forneça:
1. RESUMO EXECUTIVO do round (o que aconteceu)
2. PONTOS POSITIVOS (o que foi bem executado)
3. PONTOS DE MELHORIA (o que pode ser aprimorado)
4. LIÇÕES APRENDIDAS (insights táticos para próximos rounds)
5. RECOMENDAÇÃO ESTRATÉGICA para o próximo round
6. AVALIAÇÃO DA EFETIVIDADE DOS CONSELHOS DADOS durante o round
`;
        
        // Usar fila com prioridade máxima para resumo
        this.queueInsightRequest('round_summary', gameData, summaryPrompt);
    }
    
    // NOVO: Gerar calls inteligentes para o time
    generateTeamCalls(gameData) {
        if (!gameData.allplayers) return;
        
        const calls = this.smartTrigger.generateTeamCalls(gameData);
        
        if (calls.length > 0) {
            // Enviar calls para o overlay (não para análise do GEMINI)
            if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
                this.overlayWindow.webContents.send('team-calls', {
                    calls: calls,
                    timestamp: Date.now()
                });
            }
            
            console.log(`[TEAM CALLS] ${calls.length} calls gerados:`, calls.map(c => `${c.target}: ${c.type}`));
        }
    }
    
    // NOVO: Método para obter estatísticas em tempo real
    getRealtimeStats() {
        return {
            database: this.roundDatabase.getAnalysisContext(),
            currentRound: this.roundDatabase.currentRound,
            playerStats: this.roundDatabase.playerStats,
            patterns: this.roundDatabase.patterns,
            memory: this.geminiMemory.getStats(),
            smartTrigger: this.smartTrigger.getStats()
        };
    }
    
    // NOVO: Avaliar efetividade das respostas baseado no resultado do round
    evaluateResponseEffectiveness(roundWon, kills, deaths, damage) {
        // Buscar conversas recentes (últimos 5 minutos)
        const recentConversations = this.geminiMemory.quickLookup.recentConversations
            .filter(conv => Date.now() - conv.timestamp < 300000) // 5 minutos
            .slice(0, 5); // Máximo 5 conversas recentes
        
        recentConversations.forEach((conv, index) => {
            let effectiveness = 'neutral';
            let feedback = '';
            
            // Avaliar baseado no tipo de conselho e resultado
            switch (conv.situation) {
                case 'triple_kill':
                case 'quad_kill':
                case 'ace':
                    effectiveness = roundWon ? 'positive' : 'neutral';
                    feedback = roundWon ? 'Manteve vantagem após multi-kill' : 'Multi-kill mas round perdido';
                    break;
                    
                case 'clutch_situation':
                    effectiveness = roundWon ? 'positive' : 'negative';
                    feedback = roundWon ? 'Clutch vencido' : 'Clutch perdido';
                    break;
                    
                case 'bomb_planted':
                case 'bomb_defusing':
                    effectiveness = roundWon ? 'positive' : 'negative';
                    feedback = roundWon ? 'Situação de bomba bem executada' : 'Falha na situação de bomba';
                    break;
                    
                case 'low_health':
                case 'critical_health':
                    // Se sobreviveu com HP baixo e venceu = positivo
                    if (roundWon && deaths === 0) {
                        effectiveness = 'positive';
                        feedback = 'Sobreviveu com HP baixo e venceu round';
                    } else if (deaths > 0) {
                        effectiveness = 'neutral';
                        feedback = 'Morreu após alerta de HP baixo';
                    }
                    break;
                    
                case 'economy_shift':
                case 'economy_warning':
                    // Avaliar baseado na performance econômica
                    if (roundWon && kills >= 2) {
                        effectiveness = 'positive';
                        feedback = 'Boa gestão econômica resultou em vitória';
                    } else if (!roundWon && kills === 0) {
                        effectiveness = 'negative';
                        feedback = 'Estratégia econômica não funcionou';
                    }
                    break;
                    
                case 'round_start':
                case 'ct_strategy':
                case 'tr_strategy':
                    // Avaliar estratégia geral do round
                    if (roundWon && (kills >= 2 || damage >= 150)) {
                        effectiveness = 'positive';
                        feedback = `Estratégia efetiva: ${kills}K, ${damage} DMG`;
                    } else if (!roundWon && kills === 0 && damage < 50) {
                        effectiveness = 'negative';
                        feedback = 'Estratégia não resultou em impacto significativo';
                    }
                    break;
                    
                default:
                    // Para outros tipos, avaliar baseado na performance geral
                    if (roundWon && kills >= 1) {
                        effectiveness = 'positive';
                    } else if (!roundWon && kills === 0) {
                        effectiveness = 'negative';
                    }
            }
            
            // Marcar efetividade na memória
            this.geminiMemory.markResponseEffectiveness(
                conv.id,
                0, // Index da resposta (sempre 0 para nossa implementação)
                effectiveness,
                feedback
            );
            
            console.log(`[MEMORY] Efetividade marcada: ${effectiveness} para ${conv.situation}`);
        });
    }
    
    destroy() {
        this.stopPeriodicAnalysis();
        this.requestQueue = [];
        this.roundDatabase.reset();
        
        // NOVO: Salvar memória antes de finalizar
        if (this.geminiMemory) {
            this.geminiMemory.saveMemory();
        }
        
        // NOVO: Mostrar estatísticas do sistema inteligente
        if (this.smartTrigger) {
            const stats = this.smartTrigger.getStats();
            console.log('[SMART STATS] Jogador principal:', stats.mainPlayer.name);
            console.log('[SMART STATS] Total de análises:', stats.antiSpam.totalAnalyses);
            console.log('[SMART STATS] Análises recentes:', stats.antiSpam.recentTypes.map(t => t.type));
        }
        
        console.log('[SHUTDOWN] Auto Analyzer finalizado com sistema inteligente');
    }
}

// Export para uso no main process
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoAnalyzer;
} 