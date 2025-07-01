// ====== GSI CONFIG GENERATOR - DYNAMIC GSI FILE CREATOR ======
// Gera dinamicamente o arquivo gamestate_integration_coachai.cfg

class GSIConfigGenerator {
    constructor() {
        this.appName = 'coach-ai';
        this.version = '1.0.0';
        this.defaultConfig = this.getDefaultConfig();
    }

    // === CONFIGURAÇÃO PADRÃO ===
    getDefaultConfig() {
        return {
            // Identification
            appName: this.appName,
            version: this.version,
            
            // Connection settings
            uri: 'http://localhost:3000/gsi',
            timeout: '5.0',
            buffer: '0.1',
            throttle: '0.5',
            heartbeat: '30.0',
            
            // Authentication
            auth: {
                token: 'coachai_secure_token_2024'
            },
            
            // Output settings
            output: {
                precision_time: '3',
                precision_position: '1',
                precision_vector: '3'
            },
            
            // Data capture settings
            data: {
                // Fundamental coaching data
                provider: '1',      // CS2 version info
                map: '1',          // Map name, phase, round
                round: '1',        // Bomb status, winner
                player: '1',       // HP, armor, kills, helmet, defusekit
                weapons: '1',      // Equipped weapon, ammo
                
                // Advanced coaching data
                allplayers: '1',   // All players positions (GOTV required)
                phase_countdowns: '1',  // Time remaining
                grenades: '1',     // All grenades including molotovs
                bomb: '1',         // Bomb location and carrier
                previously: '1'    // Previous round data
            }
        };
    }

    // === CONFIGURAÇÃO PERSONALIZADA ===
    createCustomConfig(options = {}) {
        const config = { ...this.defaultConfig };
        
        // Override settings if provided
        if (options.uri) config.uri = options.uri;
        if (options.timeout) config.timeout = options.timeout.toString();
        if (options.buffer) config.buffer = options.buffer.toString();
        if (options.throttle) config.throttle = options.throttle.toString();
        if (options.heartbeat) config.heartbeat = options.heartbeat.toString();
        
        // Custom auth token
        if (options.authToken) {
            config.auth.token = options.authToken;
        }
        
        // Data selection for different coaching levels
        if (options.coachingLevel) {
            config.data = this.getDataForCoachingLevel(options.coachingLevel);
        }
        
        // Custom precision settings
        if (options.precision) {
            config.output = { ...config.output, ...options.precision };
        }
        
        return config;
    }

    // === DADOS POR NÍVEL DE COACHING ===
    getDataForCoachingLevel(level) {
        const baseData = {
            provider: '1',
            map: '1',
            round: '1',
            player: '1',
            weapons: '1'
        };

        switch (level.toLowerCase()) {
            case 'beginner':
                // Apenas dados fundamentais para iniciantes
                return {
                    ...baseData,
                    bomb: '1'  // Status da bomba é importante
                };
                
            case 'intermediate':
                // Dados intermediários incluindo granadas
                return {
                    ...baseData,
                    bomb: '1',
                    grenades: '1',
                    phase_countdowns: '1'
                };
                
            case 'professional':
            case 'pro':
                // Todos os dados para análise profissional
                return {
                    ...baseData,
                    allplayers: '1',
                    phase_countdowns: '1',
                    grenades: '1',
                    bomb: '1',
                    previously: '1'
                };
                
            default:
                // Configuração completa por padrão
                return this.defaultConfig.data;
        }
    }

    // === GERAÇÃO DO CONTEÚDO DO ARQUIVO ===
    generateConfigContent(options = {}) {
        const config = this.createCustomConfig(options);
        
        // Generate the CFG file content in CS2 format
        let content = '';
        
        // Header comment
        content += `// ====== COACH-AI GSI Configuration ======\n`;
        content += `// Auto-generated configuration for Counter-Strike 2\n`;
        content += `// Game State Integration for real-time coaching overlay\n`;
        content += `// Generated: ${new Date().toISOString()}\n`;
        content += `// Version: ${config.version}\n\n`;
        
        // Main configuration block
        content += `"${config.appName} Configuration"\n{\n`;
        
        // URI and connection settings
        content += `    "uri"        "${config.uri}"\n`;
        content += `    "timeout"    "${config.timeout}"\n`;
        content += `    "buffer"     "${config.buffer}"\n`;
        content += `    "throttle"   "${config.throttle}"\n`;
        content += `    "heartbeat"  "${config.heartbeat}"\n\n`;
        
        // Authentication
        if (config.auth && config.auth.token) {
            content += `    "auth"\n    {\n`;
            content += `        "token"  "${config.auth.token}"\n`;
            content += `    }\n\n`;
        }
        
        // Output precision settings
        content += `    "output"\n    {\n`;
        content += `        "precision_time"      "${config.output.precision_time}"\n`;
        content += `        "precision_position"  "${config.output.precision_position}"\n`;
        content += `        "precision_vector"    "${config.output.precision_vector}"\n`;
        content += `    }\n\n`;
        
        // Data capture settings
        content += `    "data"\n    {\n`;
        
        // Add each data section that's enabled
        Object.entries(config.data).forEach(([key, value]) => {
            if (value === '1') {
                content += `        "${key}"    "${value}"\n`;
            }
        });
        
        content += `    }\n`;
        content += `}\n`;
        
        return content;
    }

    // === PRESETS PARA DIFERENTES CENÁRIOS ===
    generateBeginnerConfig() {
        return this.generateConfigContent({
            coachingLevel: 'beginner',
            buffer: 0.2,  // Slower updates for beginners
            throttle: 1.0
        });
    }

    generateIntermediateConfig() {
        return this.generateConfigContent({
            coachingLevel: 'intermediate',
            buffer: 0.1,
            throttle: 0.5
        });
    }

    generateProfessionalConfig() {
        return this.generateConfigContent({
            coachingLevel: 'professional',
            buffer: 0.1,
            throttle: 0.3  // Faster updates for pros
        });
    }

    // === VALIDAÇÃO E UTILITÁRIOS ===
    validateConfig(config) {
        const required = ['uri', 'timeout', 'buffer', 'data'];
        const missing = required.filter(key => !config[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required config fields: ${missing.join(', ')}`);
        }

        // Validate URI format
        if (!config.uri.startsWith('http://') && !config.uri.startsWith('https://')) {
            throw new Error('URI must start with http:// or https://');
        }

        // Validate numeric values
        const numericFields = ['timeout', 'buffer', 'throttle', 'heartbeat'];
        for (const field of numericFields) {
            if (config[field] && isNaN(parseFloat(config[field]))) {
                throw new Error(`Field ${field} must be a valid number`);
            }
        }

        return true;
    }

    // Gerar configuração com validação
    generateValidatedConfig(options = {}) {
        const config = this.createCustomConfig(options);
        this.validateConfig(config);
        return this.generateConfigContent(options);
    }

    // === MÉTODOS PARA DEBUGGING ===
    getConfigSummary(options = {}) {
        const config = this.createCustomConfig(options);
        
        return {
            connection: {
                uri: config.uri,
                timeout: `${config.timeout}s`,
                buffer: `${config.buffer}s`,
                throttle: `${config.throttle}s`,
                heartbeat: `${config.heartbeat}s`
            },
            dataCapture: Object.keys(config.data).filter(key => config.data[key] === '1'),
            authEnabled: !!(config.auth && config.auth.token),
            estimatedUpdateRate: `~${Math.round(1000 / (parseFloat(config.throttle) * 1000))} updates/sec`,
            coachingLevel: options.coachingLevel || 'default'
        };
    }

    // Gerar múltiplas configurações para testing
    generateAllConfigs() {
        return {
            beginner: this.generateBeginnerConfig(),
            intermediate: this.generateIntermediateConfig(),
            professional: this.generateProfessionalConfig(),
            default: this.generateConfigContent()
        };
    }

    // === CONFIGURAÇÃO COM BASE NA PORTA CUSTOMIZADA ===
    generateConfigForPort(port, options = {}) {
        return this.generateConfigContent({
            ...options,
            uri: `http://localhost:${port}/gsi`
        });
    }

    // === MÉTODOS PARA TESTES E DESENVOLVIMENTO ===
    generateTestConfig() {
        return this.generateConfigContent({
            uri: 'http://localhost:3000/gsi',
            authToken: 'test_token_dev_only',
            coachingLevel: 'beginner',
            buffer: 0.5,  // Slower for testing
            throttle: 2.0
        });
    }

    // Método estático para uso direto
    static generate(options = {}) {
        const generator = new GSIConfigGenerator();
        return generator.generateValidatedConfig(options);
    }

    // Método estático para obter configuração padrão
    static getDefault() {
        const generator = new GSIConfigGenerator();
        return generator.generateConfigContent();
    }
}

module.exports = GSIConfigGenerator; 