/**
 * CS2 Coach AI - Gemini Client
 * Cliente especializado para Gemini 2.5 Flash com CS2
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const RadarImageManager = require('./radarImageManager'); // Nova importação
const { buildPromptWithGSI } = require('../coach/prompt'); // Importar buildPromptWithGSI

class GeminiClient {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || this.loadApiKey();
        this.genAI = null;
        this.model = null;
        this.conversationHistory = [];
        this.radarManager = new RadarImageManager(); // Nova instância
        this.rateLimiter = {
            requests: 0,
            resetTime: Date.now() + 60000, // Reset a cada minuto
            maxRequests: 10 // LIMITE: 10 requests por minuto para momentos estratégicos
        };
        
        this.init();
    }
    
    loadApiKey() {
        try {
            const configPath = path.join(__dirname, '../config/gemini.key');
            if (fs.existsSync(configPath)) {
                return fs.readFileSync(configPath, 'utf8').trim();
            }
            
            // Usar dotenv diretamente
            require('dotenv').config();
            return process.env.GEMINI_API_KEY;
        } catch (error) {
            console.error('Error loading API key:', error);
            return null;
        }
    }
    
    init() {
        if (!this.apiKey) {
            throw new Error('Gemini API key not found. Please set GEMINI_API_KEY environment variable or create config/gemini.key file.');
        }
        
        try {
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            
            // Configurar modelo Gemini 2.5 Flash
            this.model = this.genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.95,
                    maxOutputTokens: 2048, // Aumentado para suportar prompts longos
                    responseMimeType: "text/plain",
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_NONE",
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_NONE",
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", 
                        threshold: "BLOCK_NONE",
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_NONE",
                    },
                ],
            });
            
            console.log('✅ Gemini 2.5 Flash initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Gemini:', error);
            throw error;
        }
    }
    
    async generateResponse(userPrompt, systemPrompt = '', options = {}) {
        // Verificar rate limiting
        if (!this.checkRateLimit()) {
            throw new Error('Rate limit exceeded. Please wait before making another request.');
        }
        
        try {
            // Construir prompt completo
            const fullPrompt = this.buildFullPrompt(userPrompt, systemPrompt, options);
            
            // Gerar resposta
            const result = await this.model.generateContent(fullPrompt);
            const response = result.response;
            const text = response.text();
            
            // Processar e limpar resposta
            const cleanedResponse = this.processResponse(text, options);
            
            // Salvar no histórico
            this.saveToHistory(userPrompt, cleanedResponse);
            
            // Incrementar contador de requests
            this.rateLimiter.requests++;
            
            return cleanedResponse;
            
        } catch (error) {
            console.error('[ERROR] Error generating response:', error);
            throw error; // Não usar fallbacks - propagar erro real
        }
    }
    
    buildFullPrompt(userPrompt, systemPrompt, options = {}) {
        let fullPrompt = '';
        
        // Adicionar system prompt se fornecido
        if (systemPrompt) {
            fullPrompt += `${systemPrompt}\n\n`;
        }
        
        // Adicionar contexto de conversação se habilitado
        if (options.includeHistory && this.conversationHistory.length > 0) {
            const recentHistory = this.conversationHistory.slice(-3); // Últimas 3 interações
            fullPrompt += 'RECENT CONTEXT:\n';
            recentHistory.forEach(entry => {
                fullPrompt += `User: ${entry.prompt}\nCoach: ${entry.response}\n`;
            });
            fullPrompt += '\n';
        }
        
        // Adicionar prompt do usuário (já formatado pelo prompt builder)
        fullPrompt += userPrompt;
        
        return fullPrompt;
    }
    
    processResponse(rawResponse, options = {}) {
        let processed = rawResponse.trim();
        
        // Remover prefixos comuns da IA
        processed = processed.replace(/^(Coach:|AI:|Response:)\s*/i, '');
        
        // Limitar tamanho para overlay
        const maxLength = options.maxLength || 150;
        if (processed.length > maxLength) {
            processed = processed.substring(0, maxLength - 3) + '...';
        }
        
        // Limpar formatação markdown básica
        processed = processed.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
        processed = processed.replace(/\*(.*?)\*/g, '$1'); // Italic
        processed = processed.replace(/`(.*?)`/g, '$1'); // Code
        
        // Retornar apenas respostas reais do Gemini
        
        return processed;
    }
    
    // REMOVIDO: Não filtrar respostas - aceitar todas as respostas reais do Gemini
    
    // REMOVIDO: Não usar fallbacks - apenas respostas reais do Gemini
    
    saveToHistory(prompt, response) {
        this.conversationHistory.push({
            prompt,
            response,
            timestamp: Date.now()
        });
        
        // Manter apenas últimas 10 interações
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }
    }
    
    checkRateLimit() {
        const now = Date.now();
        
        // Reset contador se passou 1 minuto
        if (now > this.rateLimiter.resetTime) {
            this.rateLimiter.requests = 0;
            this.rateLimiter.resetTime = now + 60000;
        }
        
        return this.rateLimiter.requests < this.rateLimiter.maxRequests;
    }
    
    // Métodos especializados para diferentes tipos de análise
    async analyzeScreenshot(imageData, question = "") {
        try {
            const prompt = `Analyze this CS2 screenshot and provide tactical advice. ${question}`;
            
            const imagePart = {
                inlineData: {
                    data: imageData,
                    mimeType: "image/png"
                }
            };
            
            const result = await this.model.generateContent([prompt, imagePart]);
            const response = result.response.text();
            
            return this.processResponse(response, { maxLength: 200 });
            
        } catch (error) {
            console.error('[ERROR] Error analyzing screenshot:', error);
            throw error; // Não usar fallback - propagar erro real
        }
    }
    
    /**
     * Analisa situação tática com contexto visual do mapa
     * @param {Object} gameData - Dados do GSI
     * @param {string} analysisType - Tipo de análise solicitada
     * @param {boolean} includeRadar - Se deve incluir análise visual do radar
     * @returns {string} Resposta tática com contexto visual
     */
    async analyzeWithRadar(gameData, analysisType, includeRadar = false) {
        try {
            // Verificar se deve incluir análise visual
            if (!includeRadar || !gameData?.map) {
                // Indicar análise de texto
                this.notifyAnalysisStart('text');
                
                // Análise padrão sem visual
                const result = await this.generateResponse(
                    buildPromptWithGSI(analysisType, gameData).userPrompt,
                    buildPromptWithGSI(analysisType, gameData).systemPrompt
                );
                
                this.notifyAnalysisEnd();
                return result;
            }
            
            // Extrair nome do mapa
            const mapName = typeof gameData.map === 'string' 
                ? gameData.map 
                : gameData.map?.name;
                
            if (!mapName) {
                console.warn('[GeminiClient] Map name not found in game data');
                this.notifyAnalysisStart('text');
                
                const result = await this.generateResponse(
                    buildPromptWithGSI(analysisType, gameData).userPrompt,
                    buildPromptWithGSI(analysisType, gameData).systemPrompt
                );
                
                this.notifyAnalysisEnd();
                return result;
            }
            
            // Indicar início de análise visual
            this.notifyAnalysisStart('visual', mapName);
            
            // Preparar imagem do radar
            const radarImage = await this.radarManager.prepareImageForGemini(mapName, 'simpleradar');
            
            if (!radarImage) {
                console.warn(`[GeminiClient] Radar image not found for map: ${mapName}`);
                // Fallback para análise sem visual
                this.notifyAnalysisStart('text'); // Atualizar tipo
                
                const result = await this.generateResponse(
                    buildPromptWithGSI(analysisType, gameData).userPrompt,
                    buildPromptWithGSI(analysisType, gameData).systemPrompt
                );
                
                this.notifyAnalysisEnd();
                return result;
            }
            
            console.log(`[VISUAL] Iniciando análise visual para ${mapName}`);
            
            // Construir prompt especializado com contexto visual
            const visualPrompt = this.buildVisualAnalysisPrompt(gameData, analysisType, radarImage.metadata);
            
            // Preparar conteúdo multimodal
            const contents = [
                visualPrompt,
                radarImage.inlineData
            ];
            
            // Indicar processamento
            this.notifyAnalysisProcessing();
            
            // Gerar resposta com análise visual
            const result = await this.model.generateContent(contents);
            const response = result.response.text();
            
            console.log(`[VISUAL] Análise visual concluída para ${mapName}`);
            
            // Processar resposta com limite aumentado para análise visual
            const processedResponse = this.processResponse(response, { maxLength: 250 });
            
            this.notifyAnalysisEnd();
            return processedResponse;
            
        } catch (error) {
            console.error('[ERROR] Error in radar analysis:', error);
            this.notifyAnalysisError(error.message);
            
            // Fallback para análise sem visual
            try {
                const fallbackResult = await this.generateResponse(
                    buildPromptWithGSI(analysisType, gameData).userPrompt,
                    buildPromptWithGSI(analysisType, gameData).systemPrompt
                );
                this.notifyAnalysisEnd();
                return fallbackResult;
            } catch (fallbackError) {
                this.notifyAnalysisError('Analysis failed');
                throw fallbackError;
            }
        }
    }
    
    /**
     * Constrói prompt especializado para análise visual
     */
    buildVisualAnalysisPrompt(gameData, analysisType, mapMetadata) {
        const { buildPromptWithGSI } = require('../coach/prompt');
        const basePrompt = buildPromptWithGSI(analysisType, gameData);
        
        // Adicionar contexto visual específico
        let visualContext = `\n\nCONTEXTO VISUAL DO MAPA ${mapMetadata.mapName}:\n`;
        visualContext += `Você está vendo o radar tático do mapa. Use a imagem para:\n`;
        visualContext += `- Identificar posições estratégicas baseadas na localização atual\n`;
        visualContext += `- Sugerir rotações e movimentações otimizadas\n`;
        visualContext += `- Analisar ângulos e linhas de visão\n`;
        visualContext += `- Planejar execuções coordenadas\n\n`;
        
        // Adicionar callouts do mapa
        if (mapMetadata.callouts) {
            visualContext += `PONTOS CHAVE DO MAPA:\n`;
            if (mapMetadata.callouts.bombsites) {
                visualContext += `Bombsites: ${mapMetadata.callouts.bombsites.join(', ')}\n`;
            }
            if (mapMetadata.callouts.keyPositions) {
                visualContext += `Posições importantes: ${mapMetadata.callouts.keyPositions.join(', ')}\n`;
            }
            if (mapMetadata.callouts.midControl) {
                visualContext += `Controle de mid: ${mapMetadata.callouts.midControl}\n`;
            }
        }
        
        // Combinar prompts
        return basePrompt.systemPrompt + '\n' + basePrompt.userPrompt + visualContext;
    }
    
    /**
     * Verifica se a análise deve incluir contexto visual
     * Baseado no tipo de análise e situação do jogo
     */
    shouldIncludeRadar(analysisType, gameData) {
        // Tipos de análise que se beneficiam de contexto visual
        const visualAnalysisTypes = [
            'round_start',      // Planejamento inicial
            'tr_strategy',      // Execuções ofensivas
            'ct_strategy',      // Setups defensivos
            'clutch_situation', // Posicionamento em clutch
            'bomb_planted',     // Retake/defesa pós-plant
            'tactical_disadvantage' // Reposicionamento
        ];
        
        // Verificar se é um tipo que se beneficia de análise visual
        if (!visualAnalysisTypes.includes(analysisType)) {
            return false;
        }
        
        // Verificar se tem dados de mapa
        if (!gameData?.map) {
            return false;
        }
        
        // Verificar fase do round (não precisa de visual em freeze time)
        if (gameData.round?.phase === 'freezetime') {
            return false;
        }
        
        return true;
    }
    
    // REMOVIDO: Não filtrar respostas - aceitar todas as respostas reais do Gemini
    
    // REMOVIDO: Não gerar tips mockados - apenas usar Gemini real
    
    // REMOVIDO: Não parsear tips mockados
    
    // REMOVIDO: Não usar tips padrão mockados
    
    // Métodos de notificação para o indicador visual
    notifyAnalysisStart(type, mapName = '') {
        console.log(`[GEMINI] Iniciando análise ${type}${mapName ? ` para ${mapName}` : ''}`);
        
        // Emitir evento para overlay
        if (typeof window !== 'undefined' && window.CoachAI) {
            if (type === 'visual') {
                window.CoachAI.startVisualAnalysis(mapName);
            } else {
                window.CoachAI.startTextAnalysis();
            }
        }
        
        // Emitir para main process se disponível
        if (typeof window !== 'undefined' && window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.send('analysis-status', {
                    type: 'start',
                    analysisType: type,
                    mapName
                });
            } catch (e) {
                // Not in Electron context
            }
        }
    }
    
    notifyAnalysisProcessing() {
        console.log('[GEMINI] Processando análise...');
        
        if (typeof window !== 'undefined' && window.GeminiIndicator) {
            window.GeminiIndicator.setState('processing');
        }
        
        if (typeof window !== 'undefined' && window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.send('analysis-status', {
                    type: 'processing'
                });
            } catch (e) {
                // Not in Electron context
            }
        }
    }
    
    notifyAnalysisEnd() {
        console.log('[GEMINI] Análise concluída');
        
        if (typeof window !== 'undefined' && window.GeminiIndicator) {
            window.GeminiIndicator.complete();
        }
        
        if (typeof window !== 'undefined' && window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.send('analysis-status', {
                    type: 'complete'
                });
            } catch (e) {
                // Not in Electron context
            }
        }
    }
    
    notifyAnalysisError(errorMessage = '') {
        console.log('[GEMINI] Erro na análise:', errorMessage);
        
        if (typeof window !== 'undefined' && window.CoachAI) {
            window.CoachAI.showAnalysisError(errorMessage);
        }
        
        if (typeof window !== 'undefined' && window.require) {
            try {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.send('analysis-status', {
                    type: 'error',
                    message: errorMessage
                });
            } catch (e) {
                // Not in Electron context
            }
        }
    }
    
    // Limpeza e estatísticas
    clearHistory() {
        this.conversationHistory = [];
    }
    
    getStats() {
        return {
            totalRequests: this.rateLimiter.requests,
            historySize: this.conversationHistory.length,
            rateLimit: {
                current: this.rateLimiter.requests,
                max: this.rateLimiter.maxRequests,
                resetIn: Math.max(0, this.rateLimiter.resetTime - Date.now())
            }
        };
    }
}

module.exports = GeminiClient; 