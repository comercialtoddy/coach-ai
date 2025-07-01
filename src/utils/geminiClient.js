/**
 * CS2 Coach AI - Gemini Client
 * Cliente especializado para Gemini 2.5 Flash com CS2
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

class GeminiClient {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || this.loadApiKey();
        this.genAI = null;
        this.model = null;
        this.conversationHistory = [];
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
    
    // REMOVIDO: Não gerar tips mockados - apenas usar Gemini real
    
    // REMOVIDO: Não parsear tips mockados
    
    // REMOVIDO: Não usar tips padrão mockados
    
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