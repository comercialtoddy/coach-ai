// ====== SCREENSHOT MANAGER - CENTRAL ORCHESTRATOR ======
// Gerencia a escolha automática entre provider nativo e fallback baseado na disponibilidade

const NativeScreenshotProvider = require('./native-screenshot-provider');
const ScreenshotDesktopProvider = require('./screenshot-desktop-provider');
const ImageProcessor = require('./image-processor');

class ScreenshotManager {
    constructor() {
        this.nativeProvider = null;
        this.fallbackProvider = null;
        this.activeProvider = null;
        this.imageProcessor = ImageProcessor;
        this.isInitialized = false;
        this.initializationTime = null;
        
        // Estatísticas agregadas
        this.managerStats = {
            totalInitializations: 0,
            providerSwitches: 0,
            currentProvider: null,
            lastInitialization: null,
            initializationHistory: []
        };
    }

    async initialize() {
        try {
            console.log('🔧 Initializing Screenshot Manager...');
            const initStart = Date.now();
            
            // Inicializar providers
            this.nativeProvider = new NativeScreenshotProvider();
            this.fallbackProvider = new ScreenshotDesktopProvider();
            
            // Inicializar processador de imagens
            await this.imageProcessor.initialize();
            
            // Tentar inicializar provider nativo primeiro
            console.log('🚀 Attempting to initialize native provider...');
            const nativeInitialized = await this.nativeProvider.initialize();
            
            if (nativeInitialized && this.nativeProvider.isAvailable()) {
                this.activeProvider = this.nativeProvider;
                console.log('✅ Screenshot Manager: Using NATIVE provider (optimal performance)');
            } else {
                console.log('⚠️ Native provider not available, initializing fallback...');
                
                const fallbackInitialized = await this.fallbackProvider.initialize();
                if (fallbackInitialized) {
                    this.activeProvider = this.fallbackProvider;
                    console.warn('📸 Screenshot Manager: Using FALLBACK provider (screenshot-desktop)');
                } else {
                    throw new Error('Both native and fallback providers failed to initialize');
                }
            }
            
            this.isInitialized = true;
            this.initializationTime = Date.now() - initStart;
            
            // Atualizar estatísticas
            this.managerStats.totalInitializations++;
            this.managerStats.currentProvider = this.activeProvider.name;
            this.managerStats.lastInitialization = Date.now();
            this.managerStats.initializationHistory.push({
                timestamp: Date.now(),
                provider: this.activeProvider.name,
                initTime: this.initializationTime,
                wasNativeAvailable: nativeInitialized
            });
            
            // Manter apenas os últimos 5 históricos
            if (this.managerStats.initializationHistory.length > 5) {
                this.managerStats.initializationHistory.shift();
            }
            
            console.log(`✅ Screenshot Manager initialized successfully (${this.initializationTime}ms)`);
            console.log(`📊 Active Provider: ${this.activeProvider.name}`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Screenshot Manager:', error.message);
            this.isInitialized = false;
            throw error;
        }
    }

    async captureScreenshot(options = {}) {
        if (!this.isInitialized || !this.activeProvider) {
            throw new Error('Screenshot Manager not initialized. Call initialize() first.');
        }

        try {
            console.log(`📸 Capturing screenshot via ${this.activeProvider.name}...`);
            
            const result = await this.activeProvider.capture(options);
            
            // Adicionar informações do manager aos metadados
            result.metadata.manager = {
                activeProvider: this.activeProvider.name,
                nativeAvailable: this.nativeProvider?.isAvailable() || false,
                fallbackAvailable: this.fallbackProvider?.isAvailable() || false,
                initializationTime: this.initializationTime
            };
            
            return result;
            
        } catch (error) {
            console.error(`❌ Screenshot capture failed with ${this.activeProvider.name}:`, error.message);
            
            // Tentar fallback automático se o provider nativo falhar
            if (this.activeProvider === this.nativeProvider && this.fallbackProvider?.isAvailable()) {
                console.warn('🔄 Attempting automatic fallback to screenshot-desktop...');
                try {
                    const fallbackResult = await this.fallbackProvider.capture(options);
                    
                    // Marcar que houve switch de provider
                    this.managerStats.providerSwitches++;
                    
                    fallbackResult.metadata.manager = {
                        activeProvider: 'fallback-emergency',
                        originalProvider: this.activeProvider.name,
                        emergencyFallback: true,
                        switchReason: error.message
                    };
                    
                    console.warn('✅ Emergency fallback successful');
                    return fallbackResult;
                    
                } catch (fallbackError) {
                    console.error('❌ Emergency fallback also failed:', fallbackError.message);
                    throw new Error(`Both providers failed: Native (${error.message}), Fallback (${fallbackError.message})`);
                }
            }
            
            throw error;
        }
    }

    async getDisplays() {
        if (!this.isInitialized || !this.activeProvider) {
            throw new Error('Screenshot Manager not initialized');
        }

        try {
            return await this.activeProvider.getDisplays();
        } catch (error) {
            console.error('Error getting displays:', error.message);
            
            // Tentar fallback se necessário
            if (this.activeProvider === this.nativeProvider && this.fallbackProvider?.isAvailable()) {
                console.warn('🔄 Trying fallback for getDisplays...');
                return await this.fallbackProvider.getDisplays();
            }
            
            throw error;
        }
    }

    async getWindows() {
        if (!this.isInitialized || !this.activeProvider) {
            throw new Error('Screenshot Manager not initialized');
        }

        try {
            return await this.activeProvider.getWindows();
        } catch (error) {
            console.error('Error getting windows:', error.message);
            return []; // Windows enumeration is optional
        }
    }

    // Forçar switch para um provider específico
    async switchProvider(providerType) {
        if (!this.isInitialized) {
            throw new Error('Screenshot Manager not initialized');
        }

        let targetProvider = null;
        
        switch (providerType) {
            case 'native':
                if (!this.nativeProvider?.isAvailable()) {
                    throw new Error('Native provider not available');
                }
                targetProvider = this.nativeProvider;
                break;
                
            case 'fallback':
                if (!this.fallbackProvider?.isAvailable()) {
                    throw new Error('Fallback provider not available');
                }
                targetProvider = this.fallbackProvider;
                break;
                
            default:
                throw new Error(`Unknown provider type: ${providerType}`);
        }

        const previousProvider = this.activeProvider.name;
        this.activeProvider = targetProvider;
        this.managerStats.providerSwitches++;
        this.managerStats.currentProvider = this.activeProvider.name;
        
        console.log(`🔄 Provider switched: ${previousProvider} → ${this.activeProvider.name}`);
        return true;
    }

    // Obter status completo do manager
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            initializationTime: this.initializationTime,
            activeProvider: this.activeProvider?.name || null,
            providers: {
                native: {
                    available: this.nativeProvider?.isAvailable() || false,
                    initialized: this.nativeProvider?.isInitialized || false,
                    stats: this.nativeProvider?.getPerformanceStats() || null
                },
                fallback: {
                    available: this.fallbackProvider?.isAvailable() || false,
                    initialized: this.fallbackProvider?.isInitialized || false,
                    stats: this.fallbackProvider?.getPerformanceStats() || null
                }
            },
            managerStats: this.managerStats
        };
    }

    // Obter estatísticas de performance agregadas
    getPerformanceStats() {
        const status = this.getStatus();
        const activeStats = this.activeProvider?.getPerformanceStats() || {};
        
        return {
            ...activeStats,
            manager: this.managerStats,
            providersAvailable: {
                native: status.providers.native.available,
                fallback: status.providers.fallback.available
            },
            recommendedProvider: this.nativeProvider?.isAvailable() ? 'native' : 'fallback'
        };
    }

    // Teste de conectividade de todos os providers
    async testAllProviders() {
        console.log('🧪 Testing all screenshot providers...');
        const results = {};

        // Testar provider nativo
        if (this.nativeProvider) {
            try {
                if (this.nativeProvider.isAvailable()) {
                    await this.nativeProvider.testNativeModule();
                    results.native = { success: true, message: 'Native provider test successful' };
                } else {
                    results.native = { success: false, message: 'Native provider not available' };
                }
            } catch (error) {
                results.native = { success: false, message: error.message };
            }
        }

        // Testar provider fallback
        if (this.fallbackProvider) {
            try {
                if (this.fallbackProvider.isAvailable()) {
                    await this.fallbackProvider.testCapture();
                    results.fallback = { success: true, message: 'Fallback provider test successful' };
                } else {
                    results.fallback = { success: false, message: 'Fallback provider not available' };
                }
            } catch (error) {
                results.fallback = { success: false, message: error.message };
            }
        }

        console.log('🧪 Provider test results:', results);
        return results;
    }

    // ====== MÉTODOS COM PROCESSAMENTO DE IMAGEM ======

    // Capturar e processar para AI automaticamente
    async captureAndProcessForAI(options = {}) {
        if (!this.isInitialized || !this.activeProvider) {
            throw new Error('Screenshot Manager not initialized');
        }

        try {
            console.log('🤖 Capturing and processing screenshot for AI...');
            
            // Capturar screenshot
            const screenshotResult = await this.captureScreenshot(options);
            
            // Processar para AI com configurações otimizadas
            const aiOptions = {
                maxWidth: 1024,
                maxHeight: 768,
                quality: 80,
                format: 'jpeg',
                ...options.processing
            };
            
            const aiResult = await this.imageProcessor.processForAI(screenshotResult.buffer, aiOptions);
            
            // Combinar metadados
            return {
                ...aiResult,
                metadata: {
                    ...aiResult.metadata,
                    screenshot: screenshotResult.metadata,
                    captureTime: screenshotResult.metadata.captureTime,
                    display: screenshotResult.metadata.display
                }
            };
            
        } catch (error) {
            console.error('❌ Failed to capture and process for AI:', error.message);
            throw error;
        }
    }

    // Capturar e processar com opções customizadas
    async captureAndProcess(options = {}) {
        if (!this.isInitialized || !this.activeProvider) {
            throw new Error('Screenshot Manager not initialized');
        }

        try {
            console.log('🖼️ Capturing and processing screenshot...');
            
            // Capturar screenshot
            const screenshotResult = await this.captureScreenshot(options);
            
            // Aplicar processamento se solicitado
            if (options.process !== false) {
                const processingOptions = {
                    maxWidth: 1920,
                    maxHeight: 1080,
                    quality: 75,
                    format: 'jpeg',
                    ...options.processing
                };
                
                const processed = await this.imageProcessor.processImage(screenshotResult.buffer, processingOptions);
                
                return {
                    originalBuffer: screenshotResult.buffer,
                    processedBuffer: processed.processedBuffer,
                    metadata: {
                        screenshot: screenshotResult.metadata,
                        processing: processed.metadata
                    }
                };
            }
            
            // Retornar apenas captura original
            return {
                originalBuffer: screenshotResult.buffer,
                processedBuffer: screenshotResult.buffer,
                metadata: {
                    screenshot: screenshotResult.metadata,
                    processing: null
                }
            };
            
        } catch (error) {
            console.error('❌ Failed to capture and process:', error.message);
            throw error;
        }
    }

    // Capturar região específica do CS2 e processar
    async captureGameRegion(regionName, options = {}) {
        if (!this.isInitialized || !this.activeProvider) {
            throw new Error('Screenshot Manager not initialized');
        }

        try {
            console.log(`✂️ Capturing and cropping ${regionName} region...`);
            
            // Capturar screenshot completo
            const screenshotResult = await this.captureScreenshot(options);
            
            // Recortar região específica
            const cropResult = await this.imageProcessor.cropGameRegion(
                screenshotResult.buffer, 
                regionName, 
                options.cropOptions
            );
            
            return {
                croppedBuffer: cropResult.processedBuffer,
                metadata: {
                    screenshot: screenshotResult.metadata,
                    crop: cropResult.metadata
                }
            };
            
        } catch (error) {
            console.error(`❌ Failed to capture ${regionName} region:`, error.message);
            throw error;
        }
    }

    // Preparar múltiplas versões de uma captura
    async captureMultipleFormats(formats = ['ai', 'thumbnail', 'archive'], options = {}) {
        if (!this.isInitialized || !this.activeProvider) {
            throw new Error('Screenshot Manager not initialized');
        }

        try {
            console.log(`📋 Capturing and preparing multiple formats: ${formats.join(', ')}`);
            
            // Capturar screenshot
            const screenshotResult = await this.captureScreenshot(options);
            
            // Preparar múltiplos formatos
            const formatsResult = await this.imageProcessor.prepareMultipleFormats(
                screenshotResult.buffer, 
                formats
            );
            
            return {
                formats: formatsResult,
                metadata: {
                    screenshot: screenshotResult.metadata,
                    timestamp: Date.now()
                }
            };
            
        } catch (error) {
            console.error('❌ Failed to capture multiple formats:', error.message);
            throw error;
        }
    }

    // Obter status completo incluindo processador de imagens
    getFullStatus() {
        const baseStatus = this.getStatus();
        
        return {
            ...baseStatus,
            imageProcessor: {
                initialized: this.imageProcessor.isInitialized,
                stats: this.imageProcessor.getPerformanceStats()
            }
        };
    }

    async cleanup() {
        console.log('🧹 Cleaning up Screenshot Manager...');
        
        if (this.nativeProvider) {
            await this.nativeProvider.cleanup();
        }
        
        if (this.fallbackProvider) {
            await this.fallbackProvider.cleanup();
        }
        
        if (this.imageProcessor) {
            await this.imageProcessor.cleanup();
        }
        
        this.activeProvider = null;
        this.isInitialized = false;
        this.initializationTime = null;
        
        console.log('✅ Screenshot Manager cleaned up');
    }
}

// Export singleton instance
module.exports = new ScreenshotManager(); 