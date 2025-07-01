// ====== SCREENSHOT DESKTOP PROVIDER - FALLBACK IMPLEMENTATION ======
// Implementação fallback usando screenshot-desktop para prototipagem e compatibilidade

const screenshot = require('screenshot-desktop');
const ScreenshotProvider = require('./screenshot-interface');
const { screen } = require('electron');

class ScreenshotDesktopProvider extends ScreenshotProvider {
    constructor() {
        super('screenshot-desktop');
        this.stats = {
            provider: this.name,
            totalCaptures: 0,
            averageCaptureTime: 0,
            lastCaptureTime: 0,
            errorCount: 0,
            captureTimesHistory: []
        };
    }

    async initialize() {
        try {
            console.log('📸 Initializing screenshot-desktop provider...');
            
            // Test basic functionality
            const testStart = Date.now();
            await screenshot({ format: 'png' });
            const testTime = Date.now() - testStart;
            
            this.isInitialized = true;
            console.log(`✅ screenshot-desktop provider initialized successfully (test: ${testTime}ms)`);
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize screenshot-desktop provider:', error.message);
            this.isInitialized = false;
            return false;
        }
    }

    isAvailable() {
        try {
            // screenshot-desktop should work on all platforms with Node.js
            require.resolve('screenshot-desktop');
            return true;
        } catch {
            return false;
        }
    }

    async capture(options = {}) {
        if (!this.isInitialized) {
            throw new Error('ScreenshotDesktopProvider not initialized. Call initialize() first.');
        }

        const startTime = Date.now();
        console.warn('⚠️ Using screenshot-desktop fallback for screenshot capture.');
        
        try {
            // Configurar opções para screenshot-desktop
            const captureOptions = {
                format: options.format || 'png',
                screen: options.displayId?.toString() || undefined,
                quality: options.quality || 90
            };

            // Adicionar suporte para região se especificada
            if (options.region) {
                // screenshot-desktop não suporta região diretamente
                // Vamos capturar a tela toda e depois crop (se necessário)
                console.warn('📐 Region capture not directly supported by screenshot-desktop. Capturing full screen.');
            }

            console.log(`📸 Capturing screenshot with options:`, captureOptions);
            
            const imageBuffer = await screenshot(captureOptions);
            const endTime = Date.now();
            const processingTime = endTime - startTime;

            // Obter informações sobre o display capturado
            const displays = screen.getAllDisplays();
            const targetDisplay = displays[options.displayId || 0] || displays[0];
            
            // Atualizar estatísticas
            this.stats.totalCaptures++;
            this.stats.lastCaptureTime = processingTime;
            this.stats.captureTimesHistory.push(processingTime);
            
            // Manter apenas os últimos 10 tempos para média
            if (this.stats.captureTimesHistory.length > 10) {
                this.stats.captureTimesHistory.shift();
            }
            
            this.stats.averageCaptureTime = this.stats.captureTimesHistory.reduce((a, b) => a + b) / this.stats.captureTimesHistory.length;

            const metadata = {
                width: targetDisplay.size.width,
                height: targetDisplay.size.height,
                format: captureOptions.format,
                captureTime: startTime,
                processingTime: processingTime,
                provider: this.name,
                displayId: options.displayId || 0
            };

            console.log(`✅ Screenshot captured successfully (${processingTime}ms, ${imageBuffer.length} bytes)`);
            
            return {
                buffer: imageBuffer,
                metadata: metadata
            };

        } catch (error) {
            this.stats.errorCount++;
            console.error('❌ Error capturing screenshot with screenshot-desktop:', error);
            throw new Error(`Screenshot capture failed: ${error.message}`);
        }
    }

    async getDisplays() {
        try {
            const displays = screen.getAllDisplays();
            return displays.map((display, index) => ({
                id: index,
                primary: display.id === screen.getPrimaryDisplay().id,
                bounds: display.bounds,
                size: display.size,
                scaleFactor: display.scaleFactor,
                label: `Display ${index + 1}${display.id === screen.getPrimaryDisplay().id ? ' (Primary)' : ''}`
            }));
        } catch (error) {
            console.error('Error getting displays:', error);
            return [{ id: 0, primary: true, label: 'Primary Display' }];
        }
    }

    async getWindows() {
        // screenshot-desktop não oferece suporte nativo para listar janelas
        console.warn('📋 Window enumeration not supported by screenshot-desktop provider');
        return [];
    }

    async cleanup() {
        console.log('🧹 Cleaning up screenshot-desktop provider...');
        this.isInitialized = false;
        
        // Reset stats
        this.stats = {
            provider: this.name,
            totalCaptures: 0,
            averageCaptureTime: 0,
            lastCaptureTime: 0,
            errorCount: 0,
            captureTimesHistory: []
        };
        
        console.log('✅ screenshot-desktop provider cleaned up');
    }

    getPerformanceStats() {
        return {
            ...this.stats,
            isAvailable: this.isAvailable(),
            isInitialized: this.isInitialized,
            capabilities: {
                fullScreenCapture: true,
                windowCapture: false,
                regionCapture: false,
                multiDisplay: true,
                formatSupport: ['png', 'jpeg']
            }
        };
    }

    // Método utilitário para teste de conectividade
    async testCapture() {
        console.log('🧪 Testing screenshot-desktop provider...');
        try {
            const result = await this.capture({ format: 'png' });
            console.log(`✅ Test successful: ${result.metadata.processingTime}ms, ${result.buffer.length} bytes`);
            return result;
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            throw error;
        }
    }
}

module.exports = ScreenshotDesktopProvider; 