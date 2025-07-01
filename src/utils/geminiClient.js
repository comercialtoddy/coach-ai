// ====== GEMINI CLIENT - GOOGLE GENERATIVE AI CLIENT WRAPPER ======
// Cliente wrapper para Google Gemini API com inicialização segura e error handling

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getGeminiConfig } = require('./geminiConfig');

class GeminiClient {
    constructor() {
        this.genAI = null;
        this.model = null;
        this.isInitialized = false;
        this.config = getGeminiConfig();
        this.modelName = 'gemini-2.5-flash'; // Default model - Gemini 2.5 Flash
        this.defaultGenerationConfig = {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048
        };
        this.defaultSafetySettings = [
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
        ];
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokensUsed: 0,
            averageResponseTime: 0,
            responseTimeHistory: []
        };
    }

    // === INICIALIZAÇÃO ===
    async initialize(options = {}) {
        console.log('🚀 Initializing Gemini AI Client...');
        
        try {
            // Inicializar configuração se necessário
            if (!this.config.isConfigured()) {
                const configInitialized = await this.config.initialize();
                if (!configInitialized) {
                    throw new Error('Gemini configuration not available. API key required.');
                }
            }

            // Obter API key segura
            const apiKey = this.config.getApiKey();
            
            // Inicializar GoogleGenerativeAI
            this.genAI = new GoogleGenerativeAI(apiKey);
            
            // Configurar modelo com opções customizáveis
            const modelOptions = {
                model: options.model || this.modelName,
                generationConfig: { 
                    ...this.defaultGenerationConfig,
                    ...options.generationConfig 
                },
                safetySettings: options.safetySettings || this.defaultSafetySettings
            };
            
            this.model = this.genAI.getGenerativeModel(modelOptions);
            this.isInitialized = true;
            
            console.log('✅ Gemini AI Client initialized successfully');
            console.log(`📊 Model: ${modelOptions.model}`);
            console.log(`🎛️ Temperature: ${modelOptions.generationConfig.temperature}`);
            console.log(`🔢 Max Output Tokens: ${modelOptions.generationConfig.maxOutputTokens}`);
            console.log(`🔑 API Key configured: ${apiKey ? 'YES' : 'NO'}`);
            console.log(`🔑 API Key length: ${apiKey ? apiKey.length : 0} chars`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Gemini AI Client:', error.message);
            this.isInitialized = false;
            throw error;
        }
    }

    // === GETTERS ===
    isReady() {
        return this.isInitialized && this.model !== null;
    }

    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isReady: this.isReady(),
            model: this.modelName,
            configStatus: this.config.getStatus(),
            stats: { ...this.stats }
        };
    }

    getModel() {
        if (!this.isReady()) {
            throw new Error('Gemini client not initialized. Call initialize() first.');
        }
        return this.model;
    }

    // === TEXT GENERATION ===
    async generateText(prompt, options = {}) {
        if (!this.isReady()) {
            throw new Error('Gemini client not initialized. Call initialize() first.');
        }

        const startTime = Date.now();
        this.stats.totalRequests++;

        try {
            console.log('💭 Generating text with Gemini...');
            console.log(`📝 Prompt length: ${prompt.length} characters`);
            
            // Preparar prompt
            const inputText = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
            
            // Configuração específica para esta request (se fornecida)
            let modelToUse = this.model;
            if (options.generationConfig || options.safetySettings) {
                const requestModelOptions = {
                    model: this.modelName,
                    generationConfig: { 
                        ...this.defaultGenerationConfig,
                        ...options.generationConfig 
                    },
                    safetySettings: options.safetySettings || this.defaultSafetySettings
                };
                modelToUse = this.genAI.getGenerativeModel(requestModelOptions);
            }

            // Fazer a request
            const result = await modelToUse.generateContent(inputText);
            const response = await result.response;
            const text = response.text();

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Atualizar estatísticas
            this.stats.successfulRequests++;
            this._updateResponseTimeStats(responseTime);
            
            // Calcular tokens usados (aproximado baseado em caracteres)
            const estimatedTokens = Math.ceil((inputText.length + text.length) / 4);
            this.stats.totalTokensUsed += estimatedTokens;

            console.log(`✅ Text generated successfully (${responseTime}ms)`);
            console.log(`📊 Response length: ${text.length} characters`);
            console.log(`🎯 Estimated tokens: ${estimatedTokens}`);

            return {
                text: text,
                metadata: {
                    promptLength: inputText.length,
                    responseLength: text.length,
                    responseTime: responseTime,
                    estimatedTokens: estimatedTokens,
                    model: this.modelName,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            this.stats.failedRequests++;
            this._updateResponseTimeStats(responseTime);

            console.error('❌ Text generation failed:', error.message);

            // Análise específica de erros
            const errorInfo = this._analyzeError(error);
            throw new Error(`Gemini text generation failed: ${errorInfo.message}`);
        }
    }

    // === MULTIMODAL SUPPORT ===
    async generateContentMultimodal(parts, options = {}) {
        if (!this.isReady()) {
            throw new Error('Gemini client not initialized. Call initialize() first.');
        }

        const startTime = Date.now();
        this.stats.totalRequests++;

        try {
            console.log('🖼️ Generating multimodal content with Gemini...');
            console.log(`📦 Parts count: ${parts.length}`);
            
            // Configuração específica para esta request (se fornecida)
            let modelToUse = this.model;
            if (options.generationConfig || options.safetySettings) {
                const requestModelOptions = {
                    model: this.modelName,
                    generationConfig: { 
                        ...this.defaultGenerationConfig,
                        ...options.generationConfig 
                    },
                    safetySettings: options.safetySettings || this.defaultSafetySettings
                };
                modelToUse = this.genAI.getGenerativeModel(requestModelOptions);
            }

            // Fazer a request multimodal
            const result = await modelToUse.generateContent(parts);
            const response = await result.response;
            
            // Debug the response
            console.log('🔍 Debug multimodal response:', {
                hasResponse: !!response,
                candidatesLength: response.candidates?.length || 0,
                finishReason: response.candidates?.[0]?.finishReason || 'unknown',
                safetyRatings: response.candidates?.[0]?.safetyRatings || []
            });
            
            const text = response.text();

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Atualizar estatísticas
            this.stats.successfulRequests++;
            this._updateResponseTimeStats(responseTime);

            console.log(`✅ Multimodal content generated successfully (${responseTime}ms)`);
            console.log(`📊 Response length: ${text.length} characters`);

            return {
                text: text,
                metadata: {
                    partsCount: parts.length,
                    responseLength: text.length,
                    responseTime: responseTime,
                    model: this.modelName,
                    timestamp: new Date().toISOString()
                }
            };

        } catch (error) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            this.stats.failedRequests++;
            this._updateResponseTimeStats(responseTime);

            console.error('❌ Multimodal content generation failed:', error.message);

            const errorInfo = this._analyzeError(error);
            throw new Error(`Gemini multimodal generation failed: ${errorInfo.message}`);
        }
    }

    // === TESTING ===
    async testConnection() {
        console.log('🧪 Testing Gemini client connection...');
        
        try {
            const testPrompt = 'Hello! This is a connection test. Please respond with "Connection successful".';
            const result = await this.generateText(testPrompt);
            
            if (result.text && result.text.length > 0) {
                console.log('✅ Gemini client connection test successful');
                console.log(`📝 Test response: ${result.text.substring(0, 100)}...`);
                return { success: true, response: result.text };
            } else {
                throw new Error('Empty response from Gemini');
            }
            
        } catch (error) {
            console.error('❌ Gemini client connection test failed:', error.message);
            throw error;
        }
    }

    // === MÉTODOS PRIVADOS ===
    _updateResponseTimeStats(responseTime) {
        this.stats.responseTimeHistory.push(responseTime);
        
        // Manter apenas os últimos 50 tempos de resposta
        if (this.stats.responseTimeHistory.length > 50) {
            this.stats.responseTimeHistory.shift();
        }
        
        // Calcular média
        this.stats.averageResponseTime = this.stats.responseTimeHistory.reduce((a, b) => a + b) / this.stats.responseTimeHistory.length;
    }

    _analyzeError(error) {
        const message = error.message || error.toString();
        
        if (message.includes('API_KEY_INVALID') || message.includes('invalid API key')) {
            return { type: 'AUTH_ERROR', message: 'Invalid API key' };
        } else if (message.includes('PERMISSION_DENIED')) {
            return { type: 'PERMISSION_ERROR', message: 'Permission denied - check API key permissions' };
        } else if (message.includes('QUOTA_EXCEEDED') || message.includes('rate limit')) {
            return { type: 'QUOTA_ERROR', message: 'API quota exceeded or rate limit hit' };
        } else if (message.includes('timeout') || message.includes('TIMEOUT')) {
            return { type: 'TIMEOUT_ERROR', message: 'Request timeout' };
        } else if (message.includes('network') || message.includes('connection')) {
            return { type: 'NETWORK_ERROR', message: 'Network connectivity issue' };
        } else {
            return { type: 'UNKNOWN_ERROR', message: message };
        }
    }

    // === CLEANUP ===
    async cleanup() {
        console.log('🧹 Cleaning up Gemini client...');
        
        this.model = null;
        this.genAI = null;
        this.isInitialized = false;
        
        // Reset stats
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalTokensUsed: 0,
            averageResponseTime: 0,
            responseTimeHistory: []
        };
        
        console.log('✅ Gemini client cleaned up');
    }
}

// Singleton instance
let geminiClient = null;

function getGeminiClient() {
    if (!geminiClient) {
        geminiClient = new GeminiClient();
    }
    return geminiClient;
}

module.exports = {
    GeminiClient,
    getGeminiClient
}; 