/**
 * CS2 Coach AI - Intelligent Orchestrator
 * Sistema orquestrador inteligente para coaching adaptativo
 * Substitui autoAnalyzer.js com arquitetura modular e aprendizado de jogador
 */

const ElitePromptSystem = require('./coach/elitePrompt.js');
const RoundDatabase = require('./database/roundDatabase.js');
const EventDetector = require('./eventDetector.js');
const GeminiMemory = require('./database/geminiMemory.js');
const SmartAnalysisTrigger = require('./smartAnalysisTrigger.js');
const TextToSpeechSystem = require('./textToSpeech.js');
const StrategicInference = require('./strategicInference.js');
const TokenOptimizer = require('./tokenOptimizer.js');

class IntelligentOrchestrator {
    constructor(geminiClient, overlayWindow = null) {
        this.geminiClient = geminiClient;
        this.overlayWindow = overlayWindow;
        
        // CORE SYSTEMS
        this.tts = new TextToSpeechSystem();
        this.elitePromptSystem = new ElitePromptSystem();
        this.roundDatabase = new RoundDatabase();
        this.eventDetector = new EventDetector(this.roundDatabase);
        this.geminiMemory = new GeminiMemory();
        this.smartTrigger = new SmartAnalysisTrigger();
        this.strategicInference = new StrategicInference();
        this.tokenOptimizer = new TokenOptimizer();
        
        // PLAYER LEARNING & ADAPTATION
        this.playerProfile = {
            name: 'Player',
            preferences: {
                communication: 'balanced', // verbal, text, balanced
                detail: 'medium', // high, medium, low
                timing: 'realtime', // realtime, delayed, summary
                focus: 'tactical', // tactical, strategic, economic
                personality: 'coach' // coach, friend, analyst
            },
            playstyle: {
                aggression: 0.5, // 0-1 scale
                teamwork: 0.5,
                economy: 0.5,
                positioning: 0.5,
                aim: 0.5,
                clutch: 0.5
            },
            adaptations: {
                responseStyle: 'direct',
                encouragement: 'moderate',
                criticalness: 'balanced',
                technicality: 'medium'
            },
            learningHistory: [],
            lastUpdate: Date.now()
        };
        
        // MICRO-SERVICES ARCHITECTURE
        this.microServices = {
            // TACTICAL SERVICES
            positioning: new PositioningService(this),
            economy: new EconomyService(this),
            teamwork: new TeamworkService(this),
            aiming: new AimingService(this),
            movement: new MovementService(this),
            
            // STRATEGIC SERVICES
            gameplan: new GameplanService(this),
            adaptation: new AdaptationService(this),
            prediction: new PredictionService(this),
            
            // PSYCHOLOGICAL SERVICES
            motivation: new MotivationService(this),
            pressure: new PressureService(this),
            confidence: new ConfidenceService(this),
            
            // COMMUNICATION SERVICES
            callouts: new CalloutsService(this),
            feedback: new FeedbackService(this),
            teaching: new TeachingService(this)
        };
        
        // REQUEST MANAGEMENT
        this.requestQueue = [];
        this.activeRequests = new Set();
        this.requestHistory = [];
        this.emergencyMode = false;
        this.isProcessingQueue = false;
        
        // LEARNING ALGORITHM
        this.learningEngine = new PlayerLearningEngine(this.playerProfile);
        
        // PERFORMANCE TRACKING
        this.performanceMetrics = {
            totalCoachingEvents: 0,
            successfulAdaptations: 0,
            playerSatisfaction: 0.5,
            responseAccuracy: 0.5,
            ttsUsage: 0,
            preferredServices: {}
        };
        
        this.init();
    }
    
    async init() {
        console.log('[ORCHESTRATOR] 🚀 Iniciando sistema orquestrador inteligente...');
        
        // Inicializar TTS obrigatório
        await this.tts.init();
        
        // Configurar TTS para coaching
        this.tts.configure({
            voice: {
                language: 'en-US',
                gender: 'male',
                rate: 1.3,
                pitch: 1.0,
                volume: 0.8
            },
            enabled: true,
            interruptPrevious: true
        });
        
        // Inicializar micro-serviços
        await this.initializeMicroServices();
        
        // Carregar perfil do jogador
        await this.loadPlayerProfile();
        
        // Inicializar sistema de aprendizado
        this.learningEngine.initialize();
        
        // Configurar processamento de requisições
        this.startRequestProcessor();
        
        console.log('[ORCHESTRATOR] ✅ Sistema orquestrador inicializado');
        console.log('[ORCHESTRATOR] 🎤 TTS Sistema ativo e pronto para coaching');
        console.log('[ORCHESTRATOR] 🧠 Aprendizado de jogador habilitado');
        console.log('[ORCHESTRATOR] 🤫 TTS será usado APENAS para respostas do Gemini');
    }
    
    async initializeMicroServices() {
        console.log('[ORCHESTRATOR] 🔧 Inicializando micro-serviços...');
        
        for (const [serviceName, service] of Object.entries(this.microServices)) {
            try {
                await service.initialize();
                console.log(`[ORCHESTRATOR] ✅ ${serviceName} service initialized`);
            } catch (error) {
                console.error(`[ORCHESTRATOR] ❌ Failed to initialize ${serviceName}:`, error);
            }
        }
    }

    startRequestProcessor() {
        // Processar fila de requisições periodicamente
        setInterval(() => {
            if (this.requestQueue.length > 0 && !this.isProcessingQueue) {
                this.processRequestQueue();
            }
        }, 1000); // Verificar a cada segundo
        
        console.log('[ORCHESTRATOR] 🔄 Request processor iniciado');
    }

    async updateAllSystems(gameData) {
        try {
            // Atualizar round database
            if (this.roundDatabase && typeof this.roundDatabase.updateState === 'function') {
                this.roundDatabase.updateState(gameData);
            }

            // Atualizar sistema de memória
            if (this.geminiMemory && gameData.player?.name) {
                // A memória será atualizada quando uma conversa for adicionada
            }

            // Atualizar token optimizer com dados atuais
            if (this.tokenOptimizer && typeof this.tokenOptimizer.updateContext === 'function') {
                this.tokenOptimizer.updateContext(gameData);
            }

            // Atualizar sistema de inferência estratégica
            if (this.strategicInference && typeof this.strategicInference.updateGameState === 'function') {
                this.strategicInference.updateGameState(gameData);
            }

            console.log('[ORCHESTRATOR] 🔄 Todos os sistemas atualizados');
        } catch (error) {
            console.error('[ORCHESTRATOR] ❌ Erro ao atualizar sistemas:', error);
        }
    }
    
    // ===========================================
    // MAIN ORCHESTRATION METHODS
    // ===========================================
    
    async updateGameState(gameData) {
        try {
            // Atualizar dados em todos os sistemas
            await this.updateAllSystems(gameData);
            
            // Detectar eventos
            const events = this.eventDetector.updateState(gameData);
            
            // Aprender com o jogador
            await this.learningEngine.analyze(gameData, events);
            
            // Processar eventos estrategicamente
            await this.processEventsStrategically(events, gameData);
            
            // Atualizar predições
            this.strategicInference.updateInference(gameData, this.previousGameData);
            
            // Verificar situações de emergência
            await this.checkEmergencyMode(gameData);
            
            this.previousGameData = gameData;
            
        } catch (error) {
            console.error('[ORCHESTRATOR] ❌ Erro ao atualizar estado:', error);
        }
    }
    
    async processEventsStrategically(events, gameData) {
        for (const event of events) {
            // Determinar relevância baseado no perfil do jogador
            const relevance = this.calculateEventRelevance(event, gameData);
            
            if (relevance.shouldProcess) {
                // Criar requisição estratégica
                const request = this.createStrategicRequest(event, gameData, relevance);
                
                // Enfileirar requisição
                await this.enqueueRequest(request);
            }
        }
    }
    
    calculateEventRelevance(event, gameData) {
        const playerFocus = this.playerProfile.preferences.focus;
        const eventType = event.type;
        
        let relevanceScore = 0;
        let shouldProcess = false;
        let recommendedServices = [];
        
        // Calcular relevância baseado no foco do jogador
        switch (playerFocus) {
            case 'tactical':
                if (['bomb_planted', 'clutch_situation', 'low_health'].includes(eventType)) {
                    relevanceScore = 0.9;
                    recommendedServices = ['positioning', 'movement', 'callouts'];
                }
                break;
            case 'strategic':
                if (['round_start', 'economy_shift', 'side_switch'].includes(eventType)) {
                    relevanceScore = 0.8;
                    recommendedServices = ['gameplan', 'adaptation', 'economy'];
                }
                break;
            case 'economic':
                if (['economy_shift', 'round_end', 'low_economy'].includes(eventType)) {
                    relevanceScore = 0.85;
                    recommendedServices = ['economy', 'gameplan'];
                }
                break;
        }

        // TESTE: Processar evento sintético para verificar funcionamento
        if (eventType === 'coaching_system_test') {
            relevanceScore = 1.0; // Máxima relevância para teste
            recommendedServices = ['motivation', 'feedback', 'teaching'];
            console.log('[ORCHESTRATOR] 🧪 Processando teste do sistema de coaching');
        }
        
        // Ajustar baseado no estilo de jogo
        relevanceScore *= this.getPlaystyleMultiplier(event, gameData);
        
        shouldProcess = relevanceScore > 0.5;
        
        return {
            shouldProcess,
            relevanceScore,
            recommendedServices,
            reason: `Event ${eventType} scored ${relevanceScore.toFixed(2)} for ${playerFocus} focus`
        };
    }
    
    createStrategicRequest(event, gameData, relevance) {
        return {
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'strategic_coaching',
            event,
            gameData,
            relevance,
            playerProfile: this.playerProfile,
            recommendedServices: relevance.recommendedServices,
            priority: this.determinePriority(event, relevance),
            timestamp: Date.now(),
            adaptations: this.generateAdaptations(event, gameData)
        };
    }
    
    async enqueueRequest(request) {
        // Verificar se é emergência
        if (this.emergencyMode || request.priority === 'emergency') {
            return await this.processEmergencyRequest(request);
        }
        
        // Adicionar à fila
        this.requestQueue.push(request);
        
        // Processar imediatamente se alta prioridade
        if (request.priority === 'critical') {
            this.processRequestQueue();
        }
    }
    
    async processRequestQueue() {
        if (this.requestQueue.length === 0 || this.isProcessingQueue) return;
        
        this.isProcessingQueue = true;
        
        try {
            // Ordenar por prioridade
            this.requestQueue.sort((a, b) => this.priorityToNumber(b.priority) - this.priorityToNumber(a.priority));
            
            const request = this.requestQueue.shift();
            
            await this.processStrategicRequest(request);
            
        } catch (error) {
            console.error('[ORCHESTRATOR] ❌ Erro ao processar requisição:', error);
        } finally {
            this.isProcessingQueue = false;
        }
        
        // Continuar processando se há mais na fila
        if (this.requestQueue.length > 0) {
            setTimeout(() => this.processRequestQueue(), 500);
        }
    }
    
    async processStrategicRequest(request) {
        console.log(`[ORCHESTRATOR] 🎯 Processando requisição estratégica: ${request.type}`);
        
        // Marcar como ativa
        this.activeRequests.add(request.id);
        
        try {
            // Executar micro-serviços recomendados
            const serviceResults = await this.executeMicroServices(request);
            
            // Gerar coaching personalizado
            const coaching = await this.generatePersonalizedCoaching(request, serviceResults);
            
            // SEMPRE usar TTS
            await this.deliverCoaching(coaching, request);
            
            // Aprender com o resultado
            await this.learningEngine.recordInteraction(request, coaching);
            
            // Atualizar métricas
            this.updatePerformanceMetrics(request, coaching);
            
        } finally {
            this.activeRequests.delete(request.id);
        }
    }
    
    async executeMicroServices(request) {
        const results = {};
        
        for (const serviceName of request.recommendedServices) {
            const service = this.microServices[serviceName];
            
            if (service) {
                try {
                    const result = await service.process(request);
                    results[serviceName] = result;
                } catch (error) {
                    console.error(`[ORCHESTRATOR] ❌ Erro no serviço ${serviceName}:`, error);
                }
            }
        }
        
        return results;
    }
    
    async generatePersonalizedCoaching(request, serviceResults) {
        console.log(`[ORCHESTRATOR] 🧠 Iniciando geração de coaching personalizado para evento: ${request.event.type}`);
        
        // Otimizar dados para o Gemini
        const optimizedData = this.tokenOptimizer.optimizeGameData(
            request.gameData,
            request.event.type
        );
        
        console.log(`[ORCHESTRATOR] 🔧 Dados otimizados para Gemini (${JSON.stringify(optimizedData).length} chars)`);
        
        // Criar contexto personalizado
        const personalizedContext = this.createPersonalizedContext(request, serviceResults);
        
        console.log(`[ORCHESTRATOR] 👤 Contexto personalizado criado (${personalizedContext.length} chars)`);
        
        // Gerar prompt elite personalizado
        const promptData = this.elitePromptSystem.generateElitePrompt(
            request.event.type,
            optimizedData,
            personalizedContext
        );
        
        console.log(`[ORCHESTRATOR] 📝 Prompt elite gerado:`, {
            userPromptLength: promptData.userPrompt?.length || 0,
            systemPromptLength: promptData.systemPrompt?.length || 0,
            hasConfig: !!promptData.geminiConfig
        });
        
        // Adicionar instruções de personalização
        const personalizedPrompt = this.addPersonalizationInstructions(promptData);
        
        console.log(`[ORCHESTRATOR] 🎯 Instruções de personalização adicionadas`);
        
        // Gerar resposta do Gemini
        console.log(`[ORCHESTRATOR] 🚀 Chamando Gemini para geração de resposta...`);
        
        let response;
        try {
            response = await this.geminiClient.generateResponse(
                personalizedPrompt.userPrompt,
                personalizedPrompt.systemPrompt,
                personalizedPrompt.geminiConfig
            );
            
            console.log(`[ORCHESTRATOR] ✅ Resposta do Gemini recebida:`, {
                responseLength: response?.length || 0,
                responsePreview: response?.substring(0, 100) || 'VAZIO',
                hasResponse: !!response
            });
            
        } catch (error) {
            console.error(`[ORCHESTRATOR] ❌ Erro na chamada do Gemini:`, error);
            
            // Resposta de fallback
            response = this.generateFallbackResponse(request);
            console.log(`[ORCHESTRATOR] 🔄 Usando resposta de fallback: ${response}`);
        }
        
        // Verificar se a resposta é válida
        if (!response || response.trim() === '') {
            console.log(`[ORCHESTRATOR] ⚠️ Resposta do Gemini vazia ou inválida, gerando fallback`);
            response = this.generateFallbackResponse(request);
        }
        
        console.log(`[ORCHESTRATOR] 📤 Resposta final do Gemini: "${response.substring(0, 200)}..."`);
        
        // Processar resposta
        const adaptedResponse = this.adaptResponseToPlayer(response, request);
        const ttsText = this.prepareTTSText(response, request);
        
        console.log(`[ORCHESTRATOR] 🎤 Texto TTS preparado: "${ttsText.substring(0, 100)}..."`);
        
        return {
            originalResponse: response,
            adaptedResponse: adaptedResponse,
            ttsText: ttsText,
            metadata: {
                serviceResults,
                playerProfile: this.playerProfile,
                adaptations: request.adaptations
            }
        };
    }
    
    generateFallbackResponse(request) {
        const fallbackResponses = {
            'coaching_system_test': 'Sistema de coaching ativo e funcionando. Continue focado no jogo!',
            'round_start': 'Novo round iniciado. Foque na estratégia e mantenha a comunicação com a equipe.',
            'bomb_planted': 'Bomba plantada! Mantenha a calma e execute a estratégia de defesa.',
            'clutch_situation': 'Situação de clutch! Respire fundo, analise a situação e confie em suas habilidades.',
            'low_health': 'Vida baixa! Procure cobertura e jogue de forma mais defensiva.',
            'economy_shift': 'Mudança na economia detectada. Ajuste sua estratégia de compra de acordo.',
            'triple_kill': 'Excelente performance! Continue mantendo esse ritmo.',
            'default': 'Continue focado e mantenha a estratégia atual. Você está indo bem!'
        };
        
        return fallbackResponses[request.event.type] || fallbackResponses['default'];
    }
    
    createPersonalizedContext(request, serviceResults) {
        const profile = this.playerProfile;
        
        let context = `
PERFIL DO JOGADOR:
- Nome: ${profile.name}
- Estilo de Comunicação: ${profile.preferences.communication}
- Nível de Detalhamento: ${profile.preferences.detail}
- Foco Preferido: ${profile.preferences.focus}
- Personalidade de Coaching: ${profile.preferences.personality}

ANÁLISE DE ESTILO DE JOGO:
- Agressividade: ${(profile.playstyle.aggression * 100).toFixed(0)}%
- Trabalho em Equipe: ${(profile.playstyle.teamwork * 100).toFixed(0)}%
- Consciência Econômica: ${(profile.playstyle.economy * 100).toFixed(0)}%
- Posicionamento: ${(profile.playstyle.positioning * 100).toFixed(0)}%
- Habilidade de Mira: ${(profile.playstyle.aim * 100).toFixed(0)}%
- Habilidade de Clutch: ${(profile.playstyle.clutch * 100).toFixed(0)}%

ADAPTAÇÕES PERSONALIZADAS:
- Estilo de Resposta: ${profile.adaptations.responseStyle}
- Nível de Encorajamento: ${profile.adaptations.encouragement}
- Criticidade: ${profile.adaptations.criticalness}
- Tecnicidade: ${profile.adaptations.technicality}

RESULTADOS DOS MICRO-SERVIÇOS:
${Object.entries(serviceResults).map(([service, result]) => 
    `- ${service}: ${result.summary || 'Processado'}`
).join('\n')}

INSTRUÇÕES DE PERSONALIZAÇÃO:
Baseado no perfil do jogador, adapte sua resposta para:
1. Usar o estilo de comunicação preferido (${profile.preferences.communication})
2. Fornecer o nível de detalhamento adequado (${profile.preferences.detail})
3. Focar no aspecto preferido (${profile.preferences.focus})
4. Adotar a personalidade de coaching adequada (${profile.preferences.personality})
5. Considerar as pontuações de estilo de jogo para dar conselhos específicos

${request.event.type === 'coaching_system_test' ? 
`TESTE DO SISTEMA: Este é um teste automático. Forneça uma dica útil e motivacional de CS2 
baseada nos dados atuais do jogador. Seja conciso e prático. A resposta será falada via TTS.` : ''}
`;
        
        return context;
    }
    
    adaptResponseToPlayer(response, request) {
        const profile = this.playerProfile;
        let adaptedResponse = response;
        
        // Adaptar baseado no estilo de resposta
        switch (profile.adaptations.responseStyle) {
            case 'direct':
                adaptedResponse = this.makeResponseMoreDirect(adaptedResponse);
                break;
            case 'encouraging':
                adaptedResponse = this.makeResponseMoreEncouraging(adaptedResponse);
                break;
            case 'analytical':
                adaptedResponse = this.makeResponseMoreAnalytical(adaptedResponse);
                break;
        }
        
        // Ajustar tecnicidade
        if (profile.adaptations.technicality === 'high') {
            adaptedResponse = this.addTechnicalDetails(adaptedResponse, request);
        } else if (profile.adaptations.technicality === 'low') {
            adaptedResponse = this.simplifyResponse(adaptedResponse);
        }
        
        return adaptedResponse;
    }
    
    prepareTTSText(response, request) {
        const profile = this.playerProfile;
        let ttsText = response;
        
        // Adaptar para TTS
        ttsText = this.cleanTextForTTS(ttsText);
        
        // Ajustar baseado nas preferências
        if (profile.preferences.communication === 'verbal') {
            ttsText = this.enhanceForVerbalCommunication(ttsText);
        }
        
        // Adicionar elementos motivacionais se necessário
        if (profile.adaptations.encouragement === 'high') {
            ttsText = this.addMotivationalElements(ttsText);
        }
        
        return ttsText;
    }
    
    async deliverCoaching(coaching, request) {
        const profile = this.playerProfile;
        
        console.log(`[ORCHESTRATOR] 🎤 Iniciando entrega de coaching para evento: ${request.event.type}`);
        console.log(`[ORCHESTRATOR] 🎤 Coaching recebido:`, {
            hasOriginalResponse: !!coaching.originalResponse,
            hasAdaptedResponse: !!coaching.adaptedResponse,
            hasTTSText: !!coaching.ttsText,
            ttsTextLength: coaching.ttsText?.length || 0,
            ttsTextPreview: coaching.ttsText?.substring(0, 100) || 'VAZIO'
        });
        
        // Verificar se temos uma resposta válida do Gemini
        if (!coaching.ttsText || coaching.ttsText.trim() === '') {
            console.log('[ORCHESTRATOR] ⚠️ Nenhuma resposta do Gemini para falar - TTS cancelado');
            return;
        }
        
        // USAR TTS APENAS com resposta real do Gemini
        let ttsText = coaching.ttsText;
        
        // Verificar se TTS está disponível
        if (!this.tts) {
            console.error('[ORCHESTRATOR] ❌ Sistema TTS não disponível');
            return;
        }
        
        // Determinar prioridade TTS baseado no evento
        let ttsPriority = 'normal';
        if (request.priority === 'critical' || request.priority === 'emergency') {
            ttsPriority = 'critical';
        }
        
        console.log(`[ORCHESTRATOR] 🔊 Preparando TTS com prioridade: ${ttsPriority}`);
        console.log(`[ORCHESTRATOR] 🎵 Texto final para TTS: "${ttsText}"`);
        
        try {
            // Falar a resposta do Gemini
            await this.tts.speak(ttsText, ttsPriority);
            
            console.log(`[ORCHESTRATOR] ✅ TTS executado com sucesso`);
            
            // Atualizar métricas de TTS
            this.performanceMetrics.ttsUsage++;
            
        } catch (error) {
            console.error(`[ORCHESTRATOR] ❌ Erro no TTS:`, error);
        }
        
        // Também enviar para overlay se o jogador preferir comunicação balanceada
        if (profile.preferences.communication === 'balanced' || profile.preferences.communication === 'text') {
            this.sendToOverlay(coaching, request);
        }
        
        console.log(`[ORCHESTRATOR] 📱 Coaching do Gemini entregue para ${profile.name}`);
    }
    
    sendToOverlay(coaching, request) {
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
            this.overlayWindow.webContents.send('intelligent-coaching', {
                coaching: coaching.adaptedResponse,
                type: request.event.type,
                priority: request.priority,
                playerProfile: this.playerProfile,
                timestamp: Date.now()
            });
        }
    }
    
    // ===========================================
    // PLAYER LEARNING ENGINE
    // ===========================================
    
    async loadPlayerProfile() {
        try {
            // Carregar perfil salvo ou criar novo
            const savedProfile = await this.geminiMemory.getPlayerProfile();
            
            if (savedProfile) {
                this.playerProfile = { ...this.playerProfile, ...savedProfile };
                console.log(`[ORCHESTRATOR] 👤 Perfil carregado: ${this.playerProfile.name}`);
            } else {
                console.log('[ORCHESTRATOR] 👤 Novo perfil de jogador criado');
            }
        } catch (error) {
            console.error('[ORCHESTRATOR] ❌ Erro ao carregar perfil:', error);
        }
    }
    
    async savePlayerProfile() {
        try {
            await this.geminiMemory.savePlayerProfile(this.playerProfile);
            console.log('[ORCHESTRATOR] 💾 Perfil do jogador salvo');
        } catch (error) {
            console.error('[ORCHESTRATOR] ❌ Erro ao salvar perfil:', error);
        }
    }
    
    // ===========================================
    // EMERGENCY MODE
    // ===========================================
    
    async checkEmergencyMode(gameData) {
        const emergencyConditions = [
            gameData.player?.state?.health < 20,
            gameData.round?.phase === 'bomb' && gameData.round?.bomb === 'planted',
            gameData.map?.team_ct?.score >= 15 || gameData.map?.team_t?.score >= 15,
            this.isClutchSituation(gameData)
        ];
        
        const isEmergency = emergencyConditions.some(condition => condition);
        
        if (isEmergency && !this.emergencyMode) {
            this.emergencyMode = true;
            console.log('[ORCHESTRATOR] 🚨 MODO EMERGÊNCIA ATIVADO');
            // Nota: TTS será usado apenas quando o Gemini gerar coaching para emergência
        } else if (!isEmergency && this.emergencyMode) {
            this.emergencyMode = false;
            console.log('[ORCHESTRATOR] ✅ Modo emergência desativado');
        }
    }
    
    async processEmergencyRequest(request) {
        console.log('[ORCHESTRATOR] 🚨 Processando requisição de emergência');
        
        // Limpar fila e processar imediatamente
        this.requestQueue = [];
        
        // Parar TTS atual
        this.tts.stopCurrentSpeech();
        
        // Processar com prioridade máxima
        await this.processStrategicRequest(request);
    }
    
    // ===========================================
    // UTILITY METHODS
    // ===========================================
    
    priorityToNumber(priority) {
        const priorities = {
            'emergency': 4,
            'critical': 3,
            'high': 2,
            'normal': 1,
            'low': 0
        };
        return priorities[priority] || 0;
    }
    
    getPlaystyleMultiplier(event, gameData) {
        const profile = this.playerProfile.playstyle;
        
        switch (event.type) {
            case 'bomb_planted':
                return profile.positioning * 1.2;
            case 'clutch_situation':
                return profile.clutch * 1.5;
            case 'economy_shift':
                return profile.economy * 1.3;
            case 'triple_kill':
                return profile.aim * 1.1;
            default:
                return 1.0;
        }
    }
    
    cleanTextForTTS(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        console.log(`[ORCHESTRATOR] 🧹 Limpando texto para TTS: "${text.substring(0, 100)}..."`);
        
        let cleanedText = text;
        
        // FASE 1: Remover estruturas JSON e markdown
        cleanedText = cleanedText
            // Remover objetos JSON completos
            .replace(/\{[^{}]*\}/g, '')
            // Remover arrays JSON
            .replace(/\[[^\[\]]*\]/g, '')
            // Remover markdown headers
            .replace(/^#{1,6}\s+/gm, '')
            // Remover markdown bold/italic
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/\*([^*]+)\*/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/_([^_]+)_/g, '$1')
            // Remover markdown links
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Remover markdown code blocks
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`([^`]+)`/g, '$1')
            // Remover markdown listas
            .replace(/^[-*+]\s+/gm, '')
            .replace(/^\d+\.\s+/gm, '');
        
        // FASE 2: Remover caracteres especiais e estruturas
        cleanedText = cleanedText
            // Remover colchetes e chaves
            .replace(/[{}[\]()]/g, '')
            // Remover caracteres especiais
            .replace(/[|\\\/]/g, '')
            // Remover múltiplos dois pontos
            .replace(/:{2,}/g, ':')
            // Remover pontos de interrogação múltiplos
            .replace(/\?{2,}/g, '?')
            // Remover exclamações múltiplas
            .replace(/!{2,}/g, '!')
            // Remover traços múltiplos
            .replace(/-{2,}/g, ' ')
            // Remover underscores múltiplos
            .replace(/_{2,}/g, ' ')
            // Remover aspas duplas e simples desnecessárias
            .replace(/["""'']/g, '')
            // Remover caracteres de controle
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            // Remover caracteres Unicode especiais
            .replace(/[\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F]/g, ' ');
        
        // FASE 3: Normalizar quebras de linha e espaços
        cleanedText = cleanedText
            // Normalizar quebras de linha
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            // Remover quebras de linha múltiplas
            .replace(/\n{3,}/g, '\n\n')
            // Converter quebras de linha em espaços para TTS
            .replace(/\n/g, ' ')
            // Remover espaços múltiplos
            .replace(/\s{2,}/g, ' ')
            // Remover espaços no início e fim
            .trim();
        
        // FASE 4: Melhorar pronúncia para TTS
        cleanedText = cleanedText
            // Expandir abreviações comuns do CS2
            .replace(/\bCS2\b/gi, 'Counter-Strike 2')
            .replace(/\bCS:GO\b/gi, 'Counter-Strike Global Offensive')
            .replace(/\bCT\b/gi, 'Counter-Terrorist')
            .replace(/\bCTs\b/gi, 'Counter-Terrorists')
            .replace(/\bT\b/gi, 'Terrorist')
            .replace(/\bTs\b/gi, 'Terrorists')
            .replace(/\bHP\b/gi, 'pontos de vida')
            .replace(/\bMP\b/gi, 'dinheiro')
            .replace(/\bK\/D\b/gi, 'kill death ratio')
            .replace(/\bADR\b/gi, 'average damage per round')
            .replace(/\bHS\b/gi, 'headshot')
            .replace(/\bFF\b/gi, 'friendly fire')
            .replace(/\bGG\b/gi, 'good game')
            .replace(/\bWP\b/gi, 'well played')
            .replace(/\bNT\b/gi, 'nice try')
            .replace(/\bGL\b/gi, 'good luck')
            .replace(/\bHF\b/gi, 'have fun')
            .replace(/\bEZ\b/gi, 'easy')
            .replace(/\bRIP\b/gi, 'rest in peace')
            .replace(/\bOMG\b/gi, 'oh my god')
            .replace(/\bWTF\b/gi, 'what the')
            .replace(/\bFML\b/gi, 'oh no')
            .replace(/\bIMO\b/gi, 'in my opinion')
            .replace(/\bTBH\b/gi, 'to be honest')
            .replace(/\bBTW\b/gi, 'by the way')
            // Normalizar números
            .replace(/\b(\d+)k\b/gi, '$1 mil')
            .replace(/\b(\d+)%\b/gi, '$1 porcento')
            .replace(/\$(\d+)/g, '$1 dollars')
            // Melhorar pontuação para pausas naturais
            .replace(/\./g, '. ')
            .replace(/,/g, ', ')
            .replace(/!/g, '! ')
            .replace(/\?/g, '? ')
            .replace(/:/g, ': ')
            .replace(/;/g, '; ')
            // Remover espaços duplos criados
            .replace(/\s{2,}/g, ' ')
            .trim();
        
        // FASE 5: Validações finais
        if (cleanedText.length < 3) {
            console.log(`[ORCHESTRATOR] ⚠️ Texto muito curto após limpeza: "${cleanedText}"`);
            return 'Coaching disponível.';
        }
        
        // Limitar tamanho para TTS (máximo 500 caracteres)
        if (cleanedText.length > 500) {
            cleanedText = cleanedText.substring(0, 497) + '...';
            console.log(`[ORCHESTRATOR] ✂️ Texto truncado para TTS (500 chars)`);
        }
        
        console.log(`[ORCHESTRATOR] ✅ Texto limpo para TTS: "${cleanedText}"`);
        
        return cleanedText;
    }

    determinePriority(event, relevance) {
        // Determinar prioridade baseado no tipo de evento
        const eventType = event.type;
        
        if (['bomb_planted', 'clutch_situation'].includes(eventType)) {
            return 'critical';
        } else if (['triple_kill', 'quad_kill', 'ace', 'low_health'].includes(eventType)) {
            return 'high';
        } else if (['round_start', 'economy_shift', 'coaching_system_test'].includes(eventType)) {
            return 'normal';
        } else {
            return 'low';
        }
    }

    generateAdaptations(event, gameData) {
        const profile = this.playerProfile;
        
        return {
            responseTone: profile.adaptations.responseStyle,
            detailLevel: profile.preferences.detail,
            urgency: event.priority === 'critical' ? 'high' : 'normal',
            encouragement: profile.adaptations.encouragement,
            technicality: profile.adaptations.technicality
        };
    }

    addPersonalizationInstructions(promptData) {
        // Adicionar instruções de personalização ao prompt
        const personalizedInstructions = `
INSTRUÇÕES DE PERSONALIZAÇÃO:
- Responda de forma ${this.playerProfile.adaptations.responseStyle}
- Use nível de detalhamento ${this.playerProfile.preferences.detail}
- Foque em aspectos ${this.playerProfile.preferences.focus}
- Adopte personalidade de ${this.playerProfile.preferences.personality}
`;
        
        return {
            ...promptData,
            systemPrompt: promptData.systemPrompt + '\n' + personalizedInstructions
        };
    }

    makeResponseMoreDirect(response) {
        // Simplificar resposta para ser mais direta
        return response.replace(/talvez|poderia|possivelmente/gi, '')
                      .replace(/eu sugeriria que/gi, '')
                      .replace(/você deveria considerar/gi, '');
    }

    makeResponseMoreEncouraging(response) {
        // Adicionar elementos motivacionais
        const encouragingPrefixes = [
            'Excelente! ',
            'Ótimo trabalho! ',
            'Muito bem! ',
            'Continue assim! '
        ];
        
        const randomPrefix = encouragingPrefixes[Math.floor(Math.random() * encouragingPrefixes.length)];
        return randomPrefix + response;
    }

    makeResponseMoreAnalytical(response) {
        // Adicionar análise técnica
        return `Análise: ${response}. Recomendação baseada nos dados atuais.`;
    }

    addTechnicalDetails(response, request) {
        // Adicionar detalhes técnicos baseado no contexto
        const gameData = request.gameData;
        let technicalInfo = '';
        
        if (gameData.player?.state?.health) {
            technicalInfo += ` (HP: ${gameData.player.state.health})`;
        }
        
        if (gameData.player?.state?.money) {
            technicalInfo += ` (Dinheiro: $${gameData.player.state.money})`;
        }
        
        return response + technicalInfo;
    }

    simplifyResponse(response) {
        // Simplificar resposta removendo jargões técnicos
        return response.replace(/posicionamento tático/gi, 'posição')
                      .replace(/vantagem econômica/gi, 'mais dinheiro')
                      .replace(/inferência estratégica/gi, 'estratégia');
    }

    enhanceForVerbalCommunication(text) {
        // Otimizar texto para comunicação verbal
        return text.replace(/\./g, '. ')
                  .replace(/,/g, ', ')
                  .replace(/!/g, '! ')
                  .replace(/\s+/g, ' ');
    }

    addMotivationalElements(text) {
        // Adicionar elementos motivacionais
        const motivationalSuffixes = [
            ' Você consegue!',
            ' Continue focado!',
            ' Mantenha a confiança!',
            ' Boa sorte!'
        ];
        
        const randomSuffix = motivationalSuffixes[Math.floor(Math.random() * motivationalSuffixes.length)];
        return text + randomSuffix;
    }

    updatePerformanceMetrics(request, coaching) {
        // Atualizar métricas de performance
        this.performanceMetrics.totalCoachingEvents++;
        
        // Incrementar contador do serviço mais usado
        const services = request.recommendedServices;
        services.forEach(service => {
            this.performanceMetrics.preferredServices[service] = 
                (this.performanceMetrics.preferredServices[service] || 0) + 1;
        });
    }
    
    isClutchSituation(gameData) {
        if (!gameData.allplayers) return false;
        
        const alivePlayers = Object.values(gameData.allplayers)
            .filter(player => player.state?.health > 0);
        
        return alivePlayers.length <= 2;
    }
    
    // ===========================================
    // STATUS AND MANAGEMENT
    // ===========================================
    
    getStatus() {
        return {
            initialized: true,
            emergencyMode: this.emergencyMode,
            queueLength: this.requestQueue.length,
            activeRequests: this.activeRequests.size,
            playerProfile: this.playerProfile,
            performanceMetrics: this.performanceMetrics,
            ttsStatus: this.tts.getStatus(),
            microServicesStatus: Object.fromEntries(
                Object.entries(this.microServices).map(([name, service]) => [
                    name, 
                    service.getStatus ? service.getStatus() : { active: true }
                ])
            )
        };
    }
    
    async performManualAnalysis(gameData, analysisType = 'manual_analysis', context = {}) {
        const request = {
            id: `manual_${Date.now()}`,
            type: 'manual_coaching',
            event: { type: analysisType, data: context },
            gameData,
            priority: 'high',
            recommendedServices: ['teaching', 'feedback', 'gameplan'],
            timestamp: Date.now()
        };
        
        return await this.processStrategicRequest(request);
    }
    
    destroy() {
        console.log('[ORCHESTRATOR] 🔄 Finalizando sistema orquestrador...');
        
        // Salvar perfil do jogador
        this.savePlayerProfile();
        
        // Destruir TTS
        this.tts.destroy();
        
        // Destruir micro-serviços
        Object.values(this.microServices).forEach(service => {
            if (service.destroy) service.destroy();
        });
        
        // Limpar filas
        this.requestQueue = [];
        this.activeRequests.clear();
        
        console.log('[ORCHESTRATOR] ✅ Sistema orquestrador finalizado');
    }

    // ===========================================
    // TESTING AND DEBUGGING METHODS
    // ===========================================
    
    async testSystem() {
        console.log('[ORCHESTRATOR] 🧪 Iniciando teste completo do sistema...');
        
        // Teste 1: Verificar inicialização
        const status = this.getStatus();
        console.log('[ORCHESTRATOR] 📊 Status do sistema:', status);
        
        // Teste 2: Testar geração de coaching
        const testGameData = {
            player: {
                name: 'TestPlayer',
                state: {
                    health: 100,
                    armor: 100,
                    money: 3000,
                    round_kills: 0,
                    round_killhs: 0
                }
            },
            round: {
                phase: 'live',
                number: 1
            },
            map: {
                name: 'de_dust2',
                team_ct: { score: 0 },
                team_t: { score: 0 }
            }
        };
        
        try {
            console.log('[ORCHESTRATOR] 🎯 Testando geração de coaching...');
            await this.performManualAnalysis(testGameData, 'coaching_system_test', {
                message: 'Teste manual do sistema de coaching'
            });
            
            console.log('[ORCHESTRATOR] ✅ Teste de coaching concluído');
            
        } catch (error) {
            console.error('[ORCHESTRATOR] ❌ Erro no teste de coaching:', error);
        }
        
        // Teste 3: Testar TTS diretamente
        try {
            console.log('[ORCHESTRATOR] 🎤 Testando TTS diretamente...');
            const testMessage = 'Sistema de coaching Counter-Strike 2 funcionando corretamente!';
            await this.tts.speak(testMessage, 'normal');
            
            console.log('[ORCHESTRATOR] ✅ Teste de TTS concluído');
            
        } catch (error) {
            console.error('[ORCHESTRATOR] ❌ Erro no teste de TTS:', error);
        }
        
        console.log('[ORCHESTRATOR] 🏁 Teste completo do sistema finalizado');
    }
    
    async testGeminiConnection() {
        console.log('[ORCHESTRATOR] 🔍 Testando conexão com Gemini...');
        
        try {
            const testPrompt = 'Responda apenas com "OK" se você pode me ouvir.';
            const response = await this.geminiClient.generateResponse(testPrompt, 'Você é um assistente de teste.');
            
            console.log('[ORCHESTRATOR] ✅ Conexão com Gemini OK:', response);
            return true;
            
        } catch (error) {
            console.error('[ORCHESTRATOR] ❌ Erro na conexão com Gemini:', error);
            return false;
        }
    }
    
    async debugEventDetection() {
        console.log('[ORCHESTRATOR] 🔍 Iniciando debug de detecção de eventos...');
        
        // Verificar se eventDetector existe e está funcionando
        if (!this.eventDetector) {
            console.error('[ORCHESTRATOR] ❌ EventDetector não encontrado');
            return;
        }
        
        // Simular dados de jogo para teste
        const testGameData = {
            player: {
                name: 'TestPlayer',
                state: {
                    health: 50,
                    armor: 0,
                    money: 1000,
                    round_kills: 2,
                    round_killhs: 1
                }
            },
            round: {
                phase: 'live',
                number: 5
            },
            map: {
                name: 'de_mirage',
                team_ct: { score: 2 },
                team_t: { score: 2 }
            }
        };
        
        try {
            // Detectar eventos
            const events = this.eventDetector.detectEvents(testGameData);
            console.log('[ORCHESTRATOR] 📡 Eventos detectados:', events);
            
            // Processar eventos se houver
            if (events && events.length > 0) {
                await this.processEventsStrategically(events, testGameData);
            }
            
            console.log('[ORCHESTRATOR] ✅ Debug de detecção de eventos concluído');
            
        } catch (error) {
            console.error('[ORCHESTRATOR] ❌ Erro no debug de eventos:', error);
        }
    }
    
    // Método para forçar um teste de coaching
    async forceTestCoaching() {
        console.log('[ORCHESTRATOR] 🚀 Forçando teste de coaching...');
        
        const testRequest = {
            id: `force_test_${Date.now()}`,
            type: 'manual_test',
            event: { 
                type: 'coaching_system_test',
                data: { message: 'Teste forçado do sistema' }
            },
            gameData: {
                player: {
                    name: 'TestPlayer',
                    state: {
                        health: 100,
                        armor: 100,
                        money: 5000,
                        round_kills: 3,
                        round_killhs: 2
                    }
                },
                round: {
                    phase: 'live',
                    number: 10
                },
                map: {
                    name: 'de_dust2',
                    team_ct: { score: 5 },
                    team_t: { score: 4 }
                }
            },
            priority: 'high',
            recommendedServices: ['teaching', 'motivation', 'feedback'],
            timestamp: Date.now(),
            adaptations: {
                responseTone: 'encouraging',
                detailLevel: 'medium',
                urgency: 'normal',
                encouragement: 'high',
                technicality: 'medium'
            }
        };
        
        try {
            await this.processStrategicRequest(testRequest);
            console.log('[ORCHESTRATOR] ✅ Teste de coaching forçado concluído');
            
        } catch (error) {
            console.error('[ORCHESTRATOR] ❌ Erro no teste forçado:', error);
        }
    }
}

// ===========================================
// MICRO-SERVICES IMPLEMENTATIONS
// ===========================================

class BaseMicroService {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
        this.initialized = false;
    }
    
    async initialize() {
        this.initialized = true;
    }
    
    async process(request) {
        throw new Error('Process method must be implemented');
    }
    
    getStatus() {
        return { initialized: this.initialized };
    }
}

class PositioningService extends BaseMicroService {
    async process(request) {
        const gameData = request.gameData;
        const playerPos = gameData.player?.position;
        
        if (!playerPos) {
            return { summary: 'No position data available' };
        }
        
        // Análise de posicionamento
        const mapName = gameData.map?.name;
        const phase = gameData.round?.phase;
        const side = gameData.player?.team;
        
        return {
            summary: `Position analysis for ${mapName} as ${side} in ${phase}`,
            recommendation: 'Maintain current position or rotate based on team needs',
            urgency: 'normal'
        };
    }
}

class EconomyService extends BaseMicroService {
    async process(request) {
        const gameData = request.gameData;
        const money = gameData.player?.state?.money || 0;
        
        return {
            summary: `Economy analysis: $${money}`,
            recommendation: money > 3000 ? 'Full buy round' : 'Eco or force buy',
            urgency: money < 1000 ? 'high' : 'normal'
        };
    }
}

class TeamworkService extends BaseMicroService {
    async process(request) {
        const gameData = request.gameData;
        const allPlayers = gameData.allplayers;
        
        if (!allPlayers) {
            return { summary: 'No team data available' };
        }
        
        const teammates = Object.values(allPlayers)
            .filter(p => p.team === gameData.player?.team);
        
        return {
            summary: `Team coordination analysis: ${teammates.length} teammates`,
            recommendation: 'Maintain team communication and coordination',
            urgency: 'normal'
        };
    }
}

class AimingService extends BaseMicroService {
    async process(request) {
        const gameData = request.gameData;
        const weapon = gameData.player?.weapons ? 
            Object.values(gameData.player.weapons).find(w => w.state === 'active') : null;
        
        return {
            summary: `Aiming analysis with ${weapon?.name || 'unknown weapon'}`,
            recommendation: 'Focus on crosshair placement and pre-aiming',
            urgency: 'normal'
        };
    }
}

class MovementService extends BaseMicroService {
    async process(request) {
        const gameData = request.gameData;
        const velocity = gameData.player?.state?.velocity || 0;
        
        return {
            summary: `Movement analysis: velocity ${velocity}`,
            recommendation: 'Use counter-strafing and silent movement when needed',
            urgency: 'normal'
        };
    }
}

class GameplanService extends BaseMicroService {
    async process(request) {
        const gameData = request.gameData;
        const roundNum = gameData.map?.round || 0;
        const score = `${gameData.map?.team_ct?.score || 0}-${gameData.map?.team_t?.score || 0}`;
        
        return {
            summary: `Gameplan analysis: Round ${roundNum}, Score ${score}`,
            recommendation: 'Adapt strategy based on score and enemy patterns',
            urgency: 'normal'
        };
    }
}

class AdaptationService extends BaseMicroService {
    async process(request) {
        const profile = request.playerProfile;
        
        return {
            summary: `Adaptation analysis for ${profile.name}`,
            recommendation: 'Continue learning and adapting to opponent patterns',
            urgency: 'normal'
        };
    }
}

class PredictionService extends BaseMicroService {
    async process(request) {
        const gameData = request.gameData;
        const phase = gameData.round?.phase;
        
        return {
            summary: `Prediction analysis for ${phase} phase`,
            recommendation: 'Anticipate enemy movements and prepare for likely scenarios',
            urgency: 'normal'
        };
    }
}

class MotivationService extends BaseMicroService {
    async process(request) {
        const profile = request.playerProfile;
        
        return {
            summary: `Motivation boost for ${profile.name}`,
            recommendation: 'Stay focused and maintain positive mindset',
            urgency: 'normal'
        };
    }
}

class PressureService extends BaseMicroService {
    async process(request) {
        const gameData = request.gameData;
        const health = gameData.player?.state?.health || 100;
        
        return {
            summary: `Pressure management: ${health}HP`,
            recommendation: health < 50 ? 'Play carefully and use cover' : 'Maintain aggressive positioning',
            urgency: health < 30 ? 'high' : 'normal'
        };
    }
}

class ConfidenceService extends BaseMicroService {
    async process(request) {
        const gameData = request.gameData;
        const kills = gameData.player?.state?.round_kills || 0;
        
        return {
            summary: `Confidence analysis: ${kills} kills this round`,
            recommendation: kills > 1 ? 'Maintain momentum' : 'Focus on positioning and team play',
            urgency: 'normal'
        };
    }
}

class CalloutsService extends BaseMicroService {
    async process(request) {
        const gameData = request.gameData;
        const mapName = gameData.map?.name;
        
        return {
            summary: `Callouts analysis for ${mapName}`,
            recommendation: 'Use clear and concise callouts for team communication',
            urgency: 'normal'
        };
    }
}

class FeedbackService extends BaseMicroService {
    async process(request) {
        const profile = request.playerProfile;
        
        return {
            summary: `Feedback analysis for ${profile.preferences.detail} detail level`,
            recommendation: 'Continue improvement based on coaching feedback',
            urgency: 'normal'
        };
    }
}

class TeachingService extends BaseMicroService {
    async process(request) {
        const gameData = request.gameData;
        const event = request.event;
        
        return {
            summary: `Teaching moment for ${event.type}`,
            recommendation: 'Learn from this situation for future rounds',
            urgency: 'normal'
        };
    }
}

// ===========================================
// PLAYER LEARNING ENGINE
// ===========================================

class PlayerLearningEngine {
    constructor(playerProfile) {
        this.profile = playerProfile;
        this.behaviorPatterns = {};
        this.learningRate = 0.1;
        this.adaptationThreshold = 0.7;
    }
    
    initialize() {
        console.log('[LEARNING_ENGINE] 🧠 Sistema de aprendizado inicializado');
    }
    
    async analyze(gameData, events) {
        // Analisar comportamento do jogador
        this.analyzeBehavior(gameData);
        
        // Analisar respostas a eventos
        this.analyzeEventResponses(events, gameData);
        
        // Atualizar perfil se necessário
        await this.updateProfile();
    }
    
    analyzeBehavior(gameData) {
        const player = gameData.player;
        if (!player) return;
        
        // Analisar agressividade
        const velocity = player.state?.velocity || 0;
        if (velocity > 200) {
            this.adjustPlaystyle('aggression', 0.05);
        }
        
        // Analisar economia
        const money = player.state?.money || 0;
        if (money < 2000) {
            this.adjustPlaystyle('economy', -0.02);
        }
        
        // Analisar posicionamento
        const position = player.position;
        if (position) {
            this.adjustPlaystyle('positioning', 0.01);
        }
    }
    
    analyzeEventResponses(events, gameData) {
        for (const event of events) {
            switch (event.type) {
                case 'clutch_situation':
                    this.adjustPlaystyle('clutch', 0.1);
                    break;
                case 'bomb_planted':
                    this.adjustPlaystyle('teamwork', 0.05);
                    break;
            }
        }
    }
    
    adjustPlaystyle(attribute, delta) {
        const current = this.profile.playstyle[attribute];
        const newValue = Math.max(0, Math.min(1, current + delta));
        
        this.profile.playstyle[attribute] = newValue;
        
        console.log(`[LEARNING_ENGINE] 📊 ${attribute}: ${current.toFixed(2)} -> ${newValue.toFixed(2)}`);
    }
    
    async updateProfile() {
        this.profile.lastUpdate = Date.now();
        // Salvar mudanças significativas
    }
    
    async recordInteraction(request, coaching) {
        this.profile.learningHistory.push({
            timestamp: Date.now(),
            event: request.event.type,
            coaching: coaching.adaptedResponse.substring(0, 100),
            effectiveness: 'unknown' // Será atualizado baseado no feedback
        });
        
        // Limitar histórico
        if (this.profile.learningHistory.length > 100) {
            this.profile.learningHistory = this.profile.learningHistory.slice(-100);
        }
    }
}

module.exports = IntelligentOrchestrator; 