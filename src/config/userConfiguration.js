/**
 * CS2 Coach AI - User Configuration System
 * Sistema de configuração avançado baseado no guia fornecido
 * Permite personalização completa do comportamento do coach
 */

const fs = require('fs');
const path = require('path');

class UserConfiguration {
    constructor() {
        this.configPath = path.join(__dirname, '../../config/user_config.json');
        this.defaultConfig = this.getDefaultConfiguration();
        this.currentConfig = null;
        
        // Validadores de configuração
        this.validators = {
            analysisFrequency: (value) => ['low', 'medium', 'high', 'ultra'].includes(value),
            coachingStyle: (value) => ['passive', 'balanced', 'aggressive', 'professional'].includes(value),
            voiceEnabled: (value) => typeof value === 'boolean',
            overlayOpacity: (value) => typeof value === 'number' && value >= 0 && value <= 1,
            autoAnalysisEnabled: (value) => typeof value === 'boolean'
        };
        
        // Observadores de mudanças
        this.configObservers = [];
        
        this.init();
    }
    
    init() {
        try {
            this.loadConfiguration();
            console.log('[USER_CONFIG] ✅ Configuração do usuário carregada');
        } catch (error) {
            console.error('[USER_CONFIG] ❌ Erro ao carregar configuração:', error.message);
            this.currentConfig = { ...this.defaultConfig };
            this.saveConfiguration();
        }
    }
    
    /**
     * Configuração padrão baseada no guia fornecido
     * @returns {Object} Configuração padrão
     */
    getDefaultConfiguration() {
        return {
            // === ANÁLISE E COACHING ===
            analysis: {
                frequency: 'medium',           // low, medium, high, ultra
                autoAnalysisEnabled: true,     // Análise automática ativada
                smartTriggersEnabled: true,    // Triggers inteligentes
                focusAreas: [                  // Áreas de foco
                    'positioning',
                    'economy',
                    'tactics',
                    'utility'
                ],
                maxAnalysisPerRound: 2,        // Máximo de análises por round
                criticalEventsOnly: false      // Apenas eventos críticos
            },
            
            // === ESTILO DE COACHING ===
            coaching: {
                style: 'balanced',             // passive, balanced, aggressive, professional
                personality: 'supportive',     // supportive, analytical, motivational, strict
                detailLevel: 'medium',         // low, medium, high, detailed
                encouragementEnabled: true,    // Encorajamento ativo
                constructiveCriticism: true,   // Crítica construtiva
                proactiveAdvice: true         // Conselhos proativos
            },
            
            // === VOICE & AUDIO ===
            voice: {
                enabled: false,               // Text-to-Speech habilitado
                voice: 'male',                // male, female
                language: 'en-US',            // Idioma
                rate: 1.2,                    // Velocidade (0.5-2.0)
                pitch: 1.0,                   // Tom (0.5-2.0)
                volume: 0.7,                  // Volume (0.0-1.0)
                criticalOnly: false,          // Apenas eventos críticos
                interruptions: true          // Permitir interrupções
            },
            
            // === OVERLAY & UI ===
            overlay: {
                enabled: true,                // Overlay ativo
                opacity: 0.9,                // Opacidade (0.0-1.0)
                position: 'top-right',        // top-left, top-right, bottom-left, bottom-right
                size: 'medium',               // small, medium, large
                theme: 'dark',                // dark, light, blue, green
                animationsEnabled: true,      // Animações
                iconsEnabled: true,           // Ícones de armas/equipamentos
                fadeOutDelay: 10000          // Delay para fade out (ms)
            },
            
            // === PERFORMANCE ===
            performance: {
                tokenOptimization: true,      // Otimização de tokens
                cacheEnabled: true,           // Cache habilitado
                rateLimiting: true,           // Rate limiting
                maxConcurrentRequests: 2,     // Máximo de requests simultâneos
                requestTimeout: 5000,         // Timeout de requests (ms)
                memoryOptimization: true      // Otimização de memória
            },
            
            // === GAME INTEGRATION ===
            game: {
                gsiEnabled: true,             // Game State Integration
                ocrEnabled: false,            // OCR para dados adicionais
                apiIntegration: true,         // Integração com APIs externas
                steamIntegration: false,      // Integração com Steam
                trackerggIntegration: false,  // Integração com Tracker.gg
                hltvIntegration: false        // Integração com HLTV
            },
            
            // === FILTERS & PRIORITIES ===
            filters: {
                minimumConfidence: 70,        // Confiança mínima para insights (%)
                spamProtection: true,         // Proteção contra spam
                duplicateFilter: true,        // Filtro de duplicatas
                contextualFiltering: true,    // Filtragem contextual
                priorityLevels: {             // Níveis de prioridade
                    critical: true,
                    high: true,
                    medium: true,
                    low: false
                }
            },
            
            // === ADVANCED FEATURES ===
            advanced: {
                strategicInference: true,     // Inferência estratégica
                predictiveAnalysis: true,     // Análise preditiva
                patternRecognition: true,     // Reconhecimento de padrões
                adaptiveLearning: true,       // Aprendizado adaptativo
                customPrompts: false,         // Prompts personalizados
                debugMode: false              // Modo debug
            },
            
            // === PERSONALIZATION ===
            personalization: {
                playerName: '',               // Nome do jogador
                preferredRole: 'any',         // any, rifler, awper, support, igl, entry
                experienceLevel: 'intermediate', // beginner, intermediate, advanced, professional
                preferredMaps: [],            // Mapas preferidos
                playstyle: 'balanced',        // aggressive, balanced, defensive, tactical
                skillAreas: {                 // Áreas de habilidade (1-10)
                    aim: 5,
                    positioning: 5,
                    gamesense: 5,
                    communication: 5,
                    utility: 5,
                    economy: 5
                }
            },
            
            // === NOTIFICATIONS ===
            notifications: {
                enabled: true,                // Notificações habilitadas
                types: {
                    roundStart: true,
                    bombPlanted: true,
                    economyWarning: true,
                    tacticalAdvice: true,
                    performanceUpdate: false,
                    achievements: false
                },
                cooldowns: {                  // Cooldowns por tipo (ms)
                    roundStart: 15000,
                    bombPlanted: 5000,
                    economyWarning: 20000,
                    tacticalAdvice: 10000,
                    performanceUpdate: 30000,
                    achievements: 60000
                }
            },
            
            // === PRIVACY & SECURITY ===
            privacy: {
                dataCollection: true,        // Coleta de dados para melhoria
                anonymousStats: true,        // Estatísticas anônimas
                cloudSync: false,            // Sincronização na nuvem
                localOnly: true,             // Apenas dados locais
                autoCleanup: true,           // Limpeza automática
                retentionDays: 30            // Dias de retenção de dados
            },
            
            // === SHORTCUTS & HOTKEYS ===
            shortcuts: {
                toggleOverlay: 'F9',         // Toggle overlay
                toggleVoice: 'F8',           // Toggle voice
                toggleAnalysis: 'F7',        // Toggle análise
                manualAnalysis: 'F6',        // Análise manual
                clearChat: 'F5',             // Limpar chat
                emergencyStop: 'Ctrl+Shift+F12' // Parada de emergência
            },
            
            // === METADATA ===
            metadata: {
                version: '1.0.0',            // Versão da configuração
                created: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                migrationLevel: 1            // Nível de migração
            }
        };
    }
    
    /**
     * Carregar configuração do arquivo
     */
    loadConfiguration() {
        if (fs.existsSync(this.configPath)) {
            const configData = fs.readFileSync(this.configPath, 'utf8');
            const loadedConfig = JSON.parse(configData);
            
            // Merge com configuração padrão para garantir completude
            this.currentConfig = this.mergeConfigurations(this.defaultConfig, loadedConfig);
            
            // Validar configuração
            this.validateConfiguration();
            
            // Atualizar metadados
            this.currentConfig.metadata.lastModified = new Date().toISOString();
            
        } else {
            this.currentConfig = { ...this.defaultConfig };
            this.saveConfiguration();
        }
    }
    
    /**
     * Salvar configuração no arquivo
     */
    saveConfiguration() {
        try {
            // Criar diretório se não existir
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            
            // Atualizar timestamp
            this.currentConfig.metadata.lastModified = new Date().toISOString();
            
            // Salvar com formatação
            const configJson = JSON.stringify(this.currentConfig, null, 2);
            fs.writeFileSync(this.configPath, configJson);
            
            console.log('[USER_CONFIG] ✅ Configuração salva');
            
            // Notificar observadores
            this.notifyConfigObservers();
            
        } catch (error) {
            console.error('[USER_CONFIG] ❌ Erro ao salvar configuração:', error.message);
            throw error;
        }
    }
    
    /**
     * Validar configuração
     */
    validateConfiguration() {
        const errors = [];
        
        // Validar campos críticos
        Object.entries(this.validators).forEach(([key, validator]) => {
            if (this.currentConfig[key] !== undefined) {
                if (!validator(this.currentConfig[key])) {
                    errors.push(`Invalid value for ${key}: ${this.currentConfig[key]}`);
                }
            }
        });
        
        // Validar ranges numéricos
        if (this.currentConfig.overlay.opacity < 0 || this.currentConfig.overlay.opacity > 1) {
            errors.push('Overlay opacity must be between 0 and 1');
        }
        
        if (this.currentConfig.voice.rate < 0.5 || this.currentConfig.voice.rate > 2.0) {
            errors.push('Voice rate must be between 0.5 and 2.0');
        }
        
        // Validar arrays
        if (!Array.isArray(this.currentConfig.analysis.focusAreas)) {
            errors.push('Focus areas must be an array');
        }
        
        if (errors.length > 0) {
            console.warn('[USER_CONFIG] ⚠️ Configuração contém erros:', errors);
            // Aplicar correções automáticas
            this.applyAutoFixes();
        }
    }
    
    /**
     * Aplicar correções automáticas
     */
    applyAutoFixes() {
        // Corrigir valores fora do range
        if (this.currentConfig.overlay.opacity < 0) this.currentConfig.overlay.opacity = 0;
        if (this.currentConfig.overlay.opacity > 1) this.currentConfig.overlay.opacity = 1;
        
        if (this.currentConfig.voice.rate < 0.5) this.currentConfig.voice.rate = 0.5;
        if (this.currentConfig.voice.rate > 2.0) this.currentConfig.voice.rate = 2.0;
        
        // Corrigir tipos inválidos
        if (!Array.isArray(this.currentConfig.analysis.focusAreas)) {
            this.currentConfig.analysis.focusAreas = this.defaultConfig.analysis.focusAreas;
        }
        
        console.log('[USER_CONFIG] 🔧 Correções automáticas aplicadas');
    }
    
    /**
     * Merge configurações (deep merge)
     */
    mergeConfigurations(defaultConfig, userConfig) {
        const merged = { ...defaultConfig };
        
        Object.keys(userConfig).forEach(key => {
            if (typeof userConfig[key] === 'object' && userConfig[key] !== null && !Array.isArray(userConfig[key])) {
                merged[key] = this.mergeConfigurations(defaultConfig[key] || {}, userConfig[key]);
            } else {
                merged[key] = userConfig[key];
            }
        });
        
        return merged;
    }
    
    // ===========================================
    // MÉTODOS PÚBLICOS
    // ===========================================
    
    /**
     * Obter configuração atual
     * @returns {Object} Configuração atual
     */
    getConfig() {
        return { ...this.currentConfig };
    }
    
    /**
     * Obter seção específica da configuração
     * @param {string} section - Nome da seção
     * @returns {Object} Seção da configuração
     */
    getSection(section) {
        return this.currentConfig[section] ? { ...this.currentConfig[section] } : {};
    }
    
    /**
     * Atualizar configuração
     * @param {Object} updates - Atualizações a serem aplicadas
     */
    updateConfig(updates) {
        this.currentConfig = this.mergeConfigurations(this.currentConfig, updates);
        this.validateConfiguration();
        this.saveConfiguration();
    }
    
    /**
     * Atualizar seção específica
     * @param {string} section - Nome da seção
     * @param {Object} updates - Atualizações da seção
     */
    updateSection(section, updates) {
        if (!this.currentConfig[section]) {
            this.currentConfig[section] = {};
        }
        
        this.currentConfig[section] = { ...this.currentConfig[section], ...updates };
        this.validateConfiguration();
        this.saveConfiguration();
    }
    
    /**
     * Resetar configuração para padrão
     */
    resetToDefault() {
        this.currentConfig = { ...this.defaultConfig };
        this.saveConfiguration();
        console.log('[USER_CONFIG] 🔄 Configuração resetada para padrão');
    }
    
    /**
     * Resetar seção específica
     * @param {string} section - Nome da seção
     */
    resetSection(section) {
        if (this.defaultConfig[section]) {
            this.currentConfig[section] = { ...this.defaultConfig[section] };
            this.saveConfiguration();
            console.log(`[USER_CONFIG] 🔄 Seção ${section} resetada`);
        }
    }
    
    // ===========================================
    // PRESETS DE CONFIGURAÇÃO
    // ===========================================
    
    /**
     * Aplicar preset de configuração
     * @param {string} presetName - Nome do preset
     */
    applyPreset(presetName) {
        const presets = this.getPresets();
        
        if (presets[presetName]) {
            this.updateConfig(presets[presetName]);
            console.log(`[USER_CONFIG] 🎯 Preset ${presetName} aplicado`);
        } else {
            console.warn(`[USER_CONFIG] ⚠️ Preset ${presetName} não encontrado`);
        }
    }
    
    /**
     * Obter presets disponíveis
     * @returns {Object} Presets disponíveis
     */
    getPresets() {
        return {
            // Preset para iniciantes
            beginner: {
                analysis: { frequency: 'low', maxAnalysisPerRound: 1 },
                coaching: { style: 'supportive', detailLevel: 'low' },
                voice: { enabled: true, criticalOnly: true },
                overlay: { size: 'large', fadeOutDelay: 15000 },
                personalization: { experienceLevel: 'beginner' }
            },
            
            // Preset para jogadores intermediários
            intermediate: {
                analysis: { frequency: 'medium', maxAnalysisPerRound: 2 },
                coaching: { style: 'balanced', detailLevel: 'medium' },
                voice: { enabled: false },
                overlay: { size: 'medium', fadeOutDelay: 10000 },
                personalization: { experienceLevel: 'intermediate' }
            },
            
            // Preset para jogadores avançados
            advanced: {
                analysis: { frequency: 'high', maxAnalysisPerRound: 3 },
                coaching: { style: 'professional', detailLevel: 'high' },
                voice: { enabled: false },
                overlay: { size: 'medium', fadeOutDelay: 8000 },
                personalization: { experienceLevel: 'advanced' },
                advanced: { strategicInference: true, predictiveAnalysis: true }
            },
            
            // Preset para jogadores profissionais
            professional: {
                analysis: { frequency: 'ultra', maxAnalysisPerRound: 4 },
                coaching: { style: 'analytical', detailLevel: 'detailed' },
                voice: { enabled: false },
                overlay: { size: 'small', fadeOutDelay: 5000 },
                personalization: { experienceLevel: 'professional' },
                advanced: { strategicInference: true, predictiveAnalysis: true, patternRecognition: true }
            },
            
            // Preset minimalista
            minimal: {
                analysis: { frequency: 'low', criticalEventsOnly: true },
                coaching: { style: 'passive', detailLevel: 'low' },
                voice: { enabled: false },
                overlay: { size: 'small', opacity: 0.7 },
                notifications: { enabled: false }
            }
        };
    }
    
    // ===========================================
    // OBSERVADORES DE CONFIGURAÇÃO
    // ===========================================
    
    /**
     * Adicionar observador de mudanças
     * @param {Function} observer - Função callback
     */
    addConfigObserver(observer) {
        this.configObservers.push(observer);
    }
    
    /**
     * Remover observador
     * @param {Function} observer - Função callback
     */
    removeConfigObserver(observer) {
        const index = this.configObservers.indexOf(observer);
        if (index > -1) {
            this.configObservers.splice(index, 1);
        }
    }
    
    /**
     * Notificar observadores
     */
    notifyConfigObservers() {
        this.configObservers.forEach(observer => {
            try {
                observer(this.currentConfig);
            } catch (error) {
                console.error('[USER_CONFIG] ❌ Erro ao notificar observador:', error.message);
            }
        });
    }
    
    // ===========================================
    // UTILITIES
    // ===========================================
    
    /**
     * Exportar configuração
     * @returns {string} Configuração como JSON
     */
    exportConfig() {
        return JSON.stringify(this.currentConfig, null, 2);
    }
    
    /**
     * Importar configuração
     * @param {string} configJson - Configuração como JSON
     */
    importConfig(configJson) {
        try {
            const importedConfig = JSON.parse(configJson);
            this.currentConfig = this.mergeConfigurations(this.defaultConfig, importedConfig);
            this.validateConfiguration();
            this.saveConfiguration();
            console.log('[USER_CONFIG] 📥 Configuração importada com sucesso');
        } catch (error) {
            console.error('[USER_CONFIG] ❌ Erro ao importar configuração:', error.message);
            throw error;
        }
    }
    
    /**
     * Obter estatísticas de configuração
     * @returns {Object} Estatísticas
     */
    getConfigStats() {
        return {
            totalSections: Object.keys(this.currentConfig).length,
            enabledFeatures: this.getEnabledFeatures(),
            presetSuggestion: this.suggestPreset(),
            configSize: JSON.stringify(this.currentConfig).length,
            lastModified: this.currentConfig.metadata.lastModified
        };
    }
    
    /**
     * Obter recursos habilitados
     * @returns {Array} Lista de recursos habilitados
     */
    getEnabledFeatures() {
        const features = [];
        
        if (this.currentConfig.analysis.autoAnalysisEnabled) features.push('Auto Analysis');
        if (this.currentConfig.voice.enabled) features.push('Text-to-Speech');
        if (this.currentConfig.game.ocrEnabled) features.push('OCR');
        if (this.currentConfig.advanced.strategicInference) features.push('Strategic Inference');
        if (this.currentConfig.advanced.predictiveAnalysis) features.push('Predictive Analysis');
        if (this.currentConfig.game.apiIntegration) features.push('API Integration');
        
        return features;
    }
    
    /**
     * Sugerir preset baseado na configuração atual
     * @returns {string} Nome do preset sugerido
     */
    suggestPreset() {
        const exp = this.currentConfig.personalization.experienceLevel;
        const freq = this.currentConfig.analysis.frequency;
        
        if (exp === 'beginner' || freq === 'low') return 'beginner';
        if (exp === 'professional' || freq === 'ultra') return 'professional';
        if (exp === 'advanced' || freq === 'high') return 'advanced';
        
        return 'intermediate';
    }
    
    /**
     * Destruir sistema de configuração
     */
    destroy() {
        this.configObservers = [];
        console.log('[USER_CONFIG] Sistema de configuração destruído');
    }
}

module.exports = UserConfiguration;