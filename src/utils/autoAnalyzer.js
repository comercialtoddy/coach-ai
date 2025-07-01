/**
 * CS2 Coach AI - Auto Analyzer COM RATE LIMITING
 * Sistema de análise automática com controle de quota Gemini
 */

const { buildPromptWithGSI } = require('../coach/prompt.js');

class AutoAnalyzer {
    constructor(geminiClient, overlayWindow = null, teamChatManager = null) {
        this.geminiClient = geminiClient;
        this.overlayWindow = overlayWindow;
        this.teamChatManager = teamChatManager;
        this.lastAnalysis = null;
        this.analysisInterval = null;
        this.lastGameState = null;
        this.insightHistory = [];
        
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
            'low_health': 10000,            // 10s
            'economy_shift': 10000,         // 10s
            'match_point': 10000,           // 10s
            'tactical_disadvantage': 15000, // 15s
            'performance_boost': 8000,      // 8s
            'economy_warning': 12000,       // 12s
            'side_switch': 5000,            // 5s - NOVO: Mudança de lado
            'ct_strategy': 20000,           // 20s - NOVO: Estratégia CT específica
            'tr_strategy': 20000,           // 20s - NOVO: Estratégia TR específica
            'auto_analysis': 60000          // 60s - Análise periódica
        };
        
        // Configurações estratégicas
        this.analysisIntervalMs = 10000; // 2 minutos para economia de requests
        this.minHealthForWarning = 30;
        this.lowMoneyThreshold = 1000;
        this.previousGameData = null;
        
        this.init();
    }
    
    init() {
        console.log('[INIT] Auto Analyzer inicializado com Rate Limiting (10s interval)');
        this.startPeriodicAnalysis();
        this.startRequestQueue();
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
        
        const promptData = buildPromptWithGSI(analysisType, gameData);
        
        console.log(`[DEBUG] System Prompt Length: ${promptData.systemPrompt.length} chars`);
        console.log(`[DEBUG] User Prompt: ${promptData.userPrompt}`);
        console.log(`[DEBUG] Enviando para Gemini...`);
        
        const response = await this.geminiClient.generateResponse(
            promptData.userPrompt,
            promptData.systemPrompt,
            { maxLength: 150 }
        );

        console.log(`[DEBUG] Resposta completa do Gemini: "${response}"`);
        console.log(`[DEBUG] Tamanho da resposta: ${response ? response.length : 0} chars`);
        
        if (!response || response.trim().length === 0) {
            console.log(`[ERROR] Gemini retornou resposta vazia para ${analysisType}`);
            return;
        }

        console.log(`[SUCCESS] Insight gerado: ${response.substring(0, 50)}...`);
        await this.displayAutoInsight(response, analysisType);
        
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
    
    startPeriodicAnalysis() {
        // Análise estratégica a cada 2 minutos (reduzido para economizar requests)
        this.analysisInterval = setInterval(() => {
            this.performAutoAnalysis();
        }, this.analysisIntervalMs);
    }
    
    stopPeriodicAnalysis() {
        if (this.analysisInterval) {
            clearInterval(this.analysisInterval);
            this.analysisInterval = null;
        }
    }
    
    async updateGameState(gameData) {
        this.previousGameData = this.lastGameState;
        this.lastGameState = gameData;
        
        // NOVA FUNCIONALIDADE: Detectar mudança de lado
        this.updatePlayerSideTracking(gameData);
        
        // Análise estratégica apenas em momentos críticos
        if (this.previousGameData) {
            await this.checkStrategicMoments(gameData);
        }
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
    
    async performAutoAnalysis() {
        if (!this.lastGameState || !this.geminiClient) {
            console.log('[WARNING] AutoAnalysis skipped: Missing game state or Gemini client');
            return;
        }
        
        console.log('[ANALYZER] Verificando momentos estratégicos...');
        
        // Usar fila para auto analysis periódica
        this.queueInsightRequest('auto_analysis', this.lastGameState, 'Periodic analysis');
    }
    
    async displayAutoInsight(insight, type) {
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
        
        // V3.0: SISTEMA INTELIGENTE DE TEAM CHAT
        if (this.teamChatManager) {
            try {
                // Sistema inteligente decide se enviar para o team
                const teamChatResult = await this.teamChatManager.sendStrategicTip(fullMessage, {
                    type: type,
                    playerSide: this.currentPlayerSide,
                    gameData: this.lastGameState
                });
                
                if (teamChatResult) {
                    console.log(`[TEAM CHAT] 🤖 IA enviou "${type}" para team (ID: ${teamChatResult})`);
                    // Atualizar timestamp para cooldown inteligente
                    this.teamChatManager.lastTeamChatTime = Date.now();
                } else {
                    console.log(`[TEAM CHAT] 🤖 IA decidiu não enviar "${type}" para team`);
                }
            } catch (chatError) {
                console.error(`[TEAM CHAT] ❌ Erro no sistema inteligente:`, chatError);
            }
        } else {
            console.log(`[TEAM CHAT] ⚠️ Sistema inteligente não disponível`);
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
    
    destroy() {
        this.stopPeriodicAnalysis();
        console.log('[SHUTDOWN] Auto Analyzer finalizado');
    }
}

// Export para uso no main process
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoAnalyzer;
} 