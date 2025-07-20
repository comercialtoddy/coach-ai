/**
 * Coach AI - Centralized Environment Configuration
 * Sistema centralizado para gerenciar todas as API keys e configurações
 */

require('dotenv').config();

class EnvironmentConfig {
    constructor() {
        this.validateRequired();
        this.setupConfiguration();
    }

    /**
     * Configurações de AI Providers
     */
    get aiProviders() {
        return {
            gemini: {
                apiKey: process.env.GEMINI_API_KEY,
                maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS) || 1000,
                enabled: !!process.env.GEMINI_API_KEY
            },
            openai: {
                apiKey: process.env.OPENAI_API_KEY,
                maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
                enabled: !!process.env.OPENAI_API_KEY
            },
            anthropic: {
                apiKey: process.env.ANTHROPIC_API_KEY,
                enabled: !!process.env.ANTHROPIC_API_KEY
            }
        };
    }

    /**
     * Configurações de Gaming Data Providers
     */
    get gamingProviders() {
        return {
            trackerGg: {
                apiKey: process.env.TRACKER_GG_API_KEY,
                rateLimit: parseInt(process.env.TRACKER_GG_RATE_LIMIT) || 100,
                enabled: this.isFeatureEnabled('TRACKER_GG_INTEGRATION'),
                testApiKey: process.env.TEST_TRACKER_GG_API_KEY
            },
            leetify: {
                apiKey: process.env.LEETIFY_API_KEY,
                rateLimit: parseInt(process.env.LEETIFY_RATE_LIMIT) || 60,
                enabled: this.isFeatureEnabled('LEETIFY_INTEGRATION'),
                testApiKey: process.env.TEST_LEETIFY_API_KEY
            },
            hltv: {
                apiKey: process.env.HLTV_API_KEY,
                rateLimit: parseInt(process.env.HLTV_RATE_LIMIT) || 50,
                enabled: this.isFeatureEnabled('HLTV_INTEGRATION')
            },
            faceit: {
                apiKey: process.env.FACEIT_API_KEY,
                enabled: !!process.env.FACEIT_API_KEY
            },
            steam: {
                apiKey: process.env.STEAM_API_KEY,
                rateLimit: parseInt(process.env.STEAM_RATE_LIMIT) || 100,
                enabled: !!process.env.STEAM_API_KEY
            }
        };
    }

    /**
     * Configurações de Serviços Externos
     */
    get externalServices() {
        return {
            discord: {
                botToken: process.env.DISCORD_BOT_TOKEN,
                enabled: this.isFeatureEnabled('DISCORD_BOT')
            },
            teamspeak: {
                apiKey: process.env.TEAMSPEAK_API_KEY,
                enabled: !!process.env.TEAMSPEAK_API_KEY
            },
            twitch: {
                clientId: process.env.TWITCH_CLIENT_ID,
                clientSecret: process.env.TWITCH_CLIENT_SECRET,
                enabled: !!(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET)
            },
            youtube: {
                apiKey: process.env.YOUTUBE_API_KEY,
                enabled: !!process.env.YOUTUBE_API_KEY
            }
        };
    }

    /**
     * Configurações de Banco de Dados
     */
    get database() {
        return {
            redis: {
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                password: process.env.REDIS_PASSWORD,
                enabled: !!process.env.REDIS_URL
            },
            mongodb: {
                uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/coach_ai',
                username: process.env.MONGODB_USERNAME,
                password: process.env.MONGODB_PASSWORD,
                enabled: !!process.env.MONGODB_URI
            },
            postgres: {
                url: process.env.POSTGRES_URL,
                enabled: !!process.env.POSTGRES_URL
            }
        };
    }

    /**
     * Configurações da Aplicação
     */
    get application() {
        return {
            name: process.env.APP_NAME || 'Coach_AI',
            version: process.env.APP_VERSION || '2.0.0',
            port: parseInt(process.env.APP_PORT) || 3000,
            nodeEnv: process.env.NODE_ENV || 'development',
            
            api: {
                port: parseInt(process.env.API_PORT) || 3000,
                authToken: process.env.API_AUTH_TOKEN || 'coach-ai-2024'
            },
            
            logging: {
                level: process.env.LOG_LEVEL || 'info',
                debug: process.env.DEBUG_MODE === 'true',
                verbose: process.env.VERBOSE_LOGGING === 'true',
                profiling: process.env.ENABLE_PROFILING === 'true'
            }
        };
    }

    /**
     * Configurações de Segurança
     */
    get security() {
        return {
            jwtSecret: process.env.JWT_SECRET,
            sessionSecret: process.env.SESSION_SECRET,
            encryptionKey: process.env.ENCRYPTION_KEY,
            
            // Validar se secrets críticos estão definidos
            hasRequiredSecrets: !!(process.env.JWT_SECRET && 
                                   process.env.SESSION_SECRET && 
                                   process.env.ENCRYPTION_KEY)
        };
    }

    /**
     * Configurações de Monitoramento
     */
    get monitoring() {
        return {
            googleAnalytics: {
                trackingId: process.env.GA_TRACKING_ID,
                enabled: !!process.env.GA_TRACKING_ID
            },
            sentry: {
                dsn: process.env.SENTRY_DSN,
                enabled: !!process.env.SENTRY_DSN
            },
            datadog: {
                apiKey: process.env.DATADOG_API_KEY,
                enabled: !!process.env.DATADOG_API_KEY
            }
        };
    }

    /**
     * Configurações de Cloud Services
     */
    get cloudServices() {
        return {
            aws: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                region: process.env.AWS_REGION || 'us-east-1',
                enabled: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
            },
            azure: {
                clientId: process.env.AZURE_CLIENT_ID,
                clientSecret: process.env.AZURE_CLIENT_SECRET,
                enabled: !!(process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET)
            },
            gcp: {
                projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
                keyFile: process.env.GOOGLE_CLOUD_KEY_FILE,
                enabled: !!(process.env.GOOGLE_CLOUD_PROJECT_ID && process.env.GOOGLE_CLOUD_KEY_FILE)
            }
        };
    }

    /**
     * Feature Flags
     */
    get features() {
        return {
            trackerGgIntegration: this.isFeatureEnabled('TRACKER_GG_INTEGRATION'),
            leetifyIntegration: this.isFeatureEnabled('LEETIFY_INTEGRATION'),
            hltvIntegration: this.isFeatureEnabled('HLTV_INTEGRATION'),
            discordBot: this.isFeatureEnabled('DISCORD_BOT'),
            teamFeatures: this.isFeatureEnabled('TEAM_FEATURES'),
            mlModels: this.isFeatureEnabled('ML_MODELS'),
            premiumFeatures: this.isFeatureEnabled('PREMIUM_FEATURES'),
            betaFeatures: this.isFeatureEnabled('BETA_FEATURES'),
            
            // Lista de usuários beta
            betaUserWhitelist: this.getBetaUserWhitelist()
        };
    }

    /**
     * Verifica se uma feature está habilitada
     */
    isFeatureEnabled(featureName) {
        const envVar = `ENABLE_${featureName}`;
        return process.env[envVar] === 'true';
    }

    /**
     * Obtém lista de usuários beta
     */
    getBetaUserWhitelist() {
        const whitelist = process.env.BETA_USER_WHITELIST;
        return whitelist ? whitelist.split(',').map(email => email.trim()) : [];
    }

    /**
     * Verifica se está em ambiente de desenvolvimento
     */
    get isDevelopment() {
        return this.application.nodeEnv === 'development';
    }

    /**
     * Verifica se está em ambiente de produção
     */
    get isProduction() {
        return this.application.nodeEnv === 'production';
    }

    /**
     * Verifica se está em ambiente de teste
     */
    get isTest() {
        return this.application.nodeEnv === 'test';
    }

    /**
     * Obtém API key para ambiente de desenvolvimento/teste
     */
    getApiKey(provider, service) {
        const providerConfig = this[provider] && this[provider][service];
        if (!providerConfig) {
            throw new Error(`Provider ${provider}.${service} não encontrado`);
        }

        // Em desenvolvimento, usar test key se disponível
        if (this.isDevelopment && providerConfig.testApiKey) {
            return providerConfig.testApiKey;
        }

        return providerConfig.apiKey;
    }

    /**
     * Valida configurações obrigatórias
     */
    validateRequired() {
        const required = [];

        // AI Provider (pelo menos um)
        if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
            required.push('GEMINI_API_KEY ou OPENAI_API_KEY');
        }

        // Secrets de segurança em produção
        if (this.application.nodeEnv === 'production') {
            if (!process.env.JWT_SECRET) required.push('JWT_SECRET');
            if (!process.env.SESSION_SECRET) required.push('SESSION_SECRET');
            if (!process.env.ENCRYPTION_KEY) required.push('ENCRYPTION_KEY');
        }

        if (required.length > 0) {
            throw new Error(`Variáveis de ambiente obrigatórias não encontradas: ${required.join(', ')}`);
        }
    }

    /**
     * Setup inicial da configuração
     */
    setupConfiguration() {
        // Log de configuração em desenvolvimento
        if (this.isDevelopment && this.application.logging.debug) {
            console.log('[CONFIG] Configuração carregada:');
            console.log(`[CONFIG] Ambiente: ${this.application.nodeEnv}`);
            console.log(`[CONFIG] AI Providers: ${Object.keys(this.aiProviders).filter(k => this.aiProviders[k].enabled).join(', ')}`);
            console.log(`[CONFIG] Gaming Providers: ${Object.keys(this.gamingProviders).filter(k => this.gamingProviders[k].enabled).join(', ')}`);
            console.log(`[CONFIG] Features ativas: ${Object.keys(this.features).filter(k => this.features[k] === true).join(', ')}`);
        }
    }

    /**
     * Obtém configuração completa para debugging
     */
    getDebugInfo() {
        return {
            environment: this.application.nodeEnv,
            enabledAiProviders: Object.keys(this.aiProviders).filter(k => this.aiProviders[k].enabled),
            enabledGamingProviders: Object.keys(this.gamingProviders).filter(k => this.gamingProviders[k].enabled),
            enabledExternalServices: Object.keys(this.externalServices).filter(k => this.externalServices[k].enabled),
            enabledFeatures: Object.keys(this.features).filter(k => this.features[k] === true),
            databaseConnections: Object.keys(this.database).filter(k => this.database[k].enabled),
            cloudServices: Object.keys(this.cloudServices).filter(k => this.cloudServices[k].enabled),
            securityConfigured: this.security.hasRequiredSecrets
        };
    }
}

// Singleton instance
const config = new EnvironmentConfig();

module.exports = config;