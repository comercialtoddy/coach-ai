// ====== GEMINI CONFIGURATION - SIMPLIFIED ======
// Configuração simplificada do Gemini AI para evitar erros de inicialização

class GeminiConfig {
    constructor() {
        this.isReady = true;
        this.config = {
            apiKey: process.env.GOOGLE_API_KEY || '',
            model: 'gemini-2.5-flash',
            maxTokens: 8192,
            temperature: 0.7,
            safetySettings: [
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
            ]
        };
    }

    // Método de inicialização simplificado
    async initialize() {
        console.log('ℹ️ GeminiConfig: Using simplified configuration');
        return true;
    }

    // Método para verificar se está configurado
    isConfigured() {
        return !!this.config.apiKey;
    }

    // Método para obter API key
    getApiKey() {
        return this.config.apiKey;
    }

    // Método para obter status
    getStatus() {
        return {
            configured: this.isConfigured(),
            hasApiKey: !!this.config.apiKey,
            model: this.config.model
        };
    }

    // Método para obter configuração
    getConfig() {
        return this.config;
    }

    // Método para verificar se está pronto
    isReady() {
        return true;
    }

    // Método estático para inicialização
    static async initialize() {
        console.log('ℹ️ GeminiConfig: Using simplified configuration');
        return true;
    }

    // Método estático para obter configuração
    static getConfig() {
        const instance = new GeminiConfig();
        return instance.config;
    }

    // Método estático para verificar se está pronto
    static isReady() {
        return true;
    }
}

// Função que estava faltando no geminiClient.js
function getGeminiConfig() {
    return new GeminiConfig();
}

module.exports = GeminiConfig;
module.exports.getGeminiConfig = getGeminiConfig; 