// ====== NATIVE SCREENSHOT PROVIDER - SYSTEM APIs IMPLEMENTATION ======
// Implementação usando APIs nativas do sistema (Windows DXGI, macOS CGWindowListCreateImage, Linux XCB/PipeWire)
// Este módulo será desenvolvido nas próximas subtasks com node-addon-api + cmake-js

const ScreenshotProvider = require('./screenshot-interface');
const path = require('path');
const os = require('os');

class NativeScreenshotProvider extends ScreenshotProvider {
    constructor() {
        super('native-screenshot');
        this.nativeModule = null;
        this.platform = os.platform();
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
            console.log(`🔧 Initializing native screenshot provider for ${this.platform}...`);
            
            // Windows: Tentar carregar módulo DXGI Desktop Duplication
            if (this.platform === 'win32') {
                try {
                    console.log('📦 Attempting to load native DXGI Desktop Duplication module...');
                    const nativeModulePath = path.join(__dirname, '..', '..', 'native', 'screenshot', 'build', 'Release', 'native_screenshot_module.node');
                    
                    const nativeModule = require(nativeModulePath);
                    const { DesktopDuplicator } = nativeModule;
                    
                    // Criar instância do DesktopDuplicator
                    this.duplicator = new DesktopDuplicator();
                    this.duplicator.initialize(0); // Primary display
                    
                    this.nativeModule = nativeModule;
                    this.isInitialized = true;
                    this.isNativeLoaded = true;
                    
                    console.log('✅ Native DXGI Desktop Duplication module loaded successfully!');
                    console.log(`📊 Resolution: ${this.duplicator.width}x${this.duplicator.height}`);
                    console.log(`🎮 API: DXGI Desktop Duplication (Hardware Accelerated)`);
                    
                    return true;
                    
                } catch (nativeError) {
                    console.warn('⚠️ Native DXGI module not available:', nativeError.message);
                    console.log('📋 Reasons could be:');
                    console.log('   - CMake not installed (required for compilation)');
                    console.log('   - Visual Studio Build Tools not available');
                    console.log('   - Module not yet compiled (run: cd src/native/screenshot && npm install)');
                    console.log('🔄 Operating in architecture mode - ready for native compilation...');
                    
                    // Criar mock object para demonstrar arquitetura
                    this.nativeModule = null;
                    this.duplicator = null;
                    this.isInitialized = true; // Architecture is ready
                    this.isNativeLoaded = false;
                    
                    return true; // Architecture ready, even without native compilation
                }
            } else {
                // Outras plataformas - arquitetura preparada para implementação futura
                console.log(`📋 Platform ${this.platform} - Architecture ready for native implementation`);
                this.nativeModule = null;
                this.duplicator = null;
                this.isInitialized = true;
                this.isNativeLoaded = false;
                return true;
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize native screenshot provider:', error.message);
            this.isInitialized = false;
            this.isNativeLoaded = false;
            return false;
        }
    }

    isAvailable() {
        // Provider is available if architecture is initialized (even without native compilation)
        return this.isInitialized;
    }

    isNativeCompiled() {
        // Check if native module is actually compiled and loaded
        return this.isNativeLoaded && this.nativeModule !== null;
    }

    async capture(options = {}) {
        if (!this.isAvailable()) {
            throw new Error('Native screenshot provider not available. Architecture not initialized.');
        }

        const startTime = Date.now();
        
        // Check if native module is compiled and ready
        if (this.isNativeCompiled() && this.duplicator) {
            console.log(`🚀 Using native DXGI Desktop Duplication API`);
            
            try {
                // Use real DXGI capture via AsyncWorker
                return new Promise((resolve, reject) => {
                    const timeoutMs = options.timeoutMs || 16; // 16ms for 60 FPS
                    
                    this.duplicator.captureFrame((err, data) => {
                        if (err) {
                            this.stats.errorCount++;
                            reject(new Error(`DXGI capture failed: ${err.message}`));
                        } else {
                            if (data) {
                                const endTime = Date.now();
                                const processingTime = endTime - startTime;
                                
                                // Update stats
                                this.stats.totalCaptures++;
                                this.stats.lastCaptureTime = processingTime;
                                this.stats.captureTimesHistory.push(processingTime);
                                
                                if (this.stats.captureTimesHistory.length > 10) {
                                    this.stats.captureTimesHistory.shift();
                                }
                                
                                this.stats.averageCaptureTime = this.stats.captureTimesHistory.reduce((a, b) => a + b) / this.stats.captureTimesHistory.length;

                                console.log(`✅ DXGI screenshot captured (${processingTime}ms, ${data.pixels.length} bytes, ${data.format})`);
                                
                                resolve({
                                    buffer: data.pixels,
                                    metadata: {
                                        width: data.width,
                                        height: data.height,
                                        format: data.format,
                                        stride: data.stride,
                                        timestamp: data.timestamp,
                                        captureTime: startTime,
                                        processingTime: processingTime,
                                        provider: `${this.name}-dxgi`,
                                        api: 'DXGI Desktop Duplication'
                                    }
                                });
                            } else {
                                // No new frame (timeout) - this is normal
                                resolve(null);
                            }
                        }
                    }, timeoutMs);
                });
                
            } catch (error) {
                this.stats.errorCount++;
                console.error('❌ Error with DXGI capture:', error);
                throw new Error(`DXGI capture failed: ${error.message}`);
            }
            
        } else {
            // Architecture mode - native module not compiled yet
            console.log(`📋 Native screenshot architecture ready for ${this.platform}`);
            console.log(`🔧 To enable real DXGI capture:`);
            console.log(`   1. Install CMake: choco install cmake (or manual install)`);
            console.log(`   2. cd src/native/screenshot && npm install`);
            console.log(`   3. Restart application`);
            
            // Return demonstration data to show architecture works
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            
            this.stats.totalCaptures++;
            this.stats.lastCaptureTime = processingTime;
            
            throw new Error(`Native module not compiled. Architecture ready - compile with CMake to enable DXGI capture.`);
        }
    }

    async getDisplays() {
        if (!this.isAvailable()) {
            return [];
        }

        try {
            // Obter displays através da API nativa
            return await this.nativeModule.getDisplays();
        } catch (error) {
            console.error('Error getting displays from native API:', error);
            return [];
        }
    }

    async getWindows() {
        if (!this.isAvailable()) {
            return [];
        }

        try {
            // Obter janelas através da API nativa (se suportado)
            if (this.nativeModule.getWindows) {
                return await this.nativeModule.getWindows();
            }
            return [];
        } catch (error) {
            console.error('Error getting windows from native API:', error);
            return [];
        }
    }

    async cleanup() {
        console.log('🧹 Cleaning up native screenshot provider...');
        
        if (this.nativeModule && this.nativeModule.cleanup) {
            try {
                await this.nativeModule.cleanup();
            } catch (error) {
                console.warn('Warning during native module cleanup:', error.message);
            }
        }
        
        this.nativeModule = null;
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
        
        console.log('✅ Native screenshot provider cleaned up');
    }

    getPerformanceStats() {
        return {
            ...this.stats,
            platform: this.platform,
            isAvailable: this.isAvailable(),
            isInitialized: this.isInitialized,
            nativeModuleLoaded: this.nativeModule !== null,
            capabilities: this._getPlatformCapabilities()
        };
    }

    // === MÉTODOS PRIVADOS ===

    _getNativeModulePath() {
        // Caminho onde o módulo nativo compilado será localizado
        // Será criado após implementação das subtasks 6.2-6.5
        return path.join(__dirname, '..', '..', '..', 'build', 'Release', 'native_screenshot_module.node');
    }

    _getPlatformCapabilities() {
        const baseCapabilities = {
            fullScreenCapture: true,
            formatSupport: ['png', 'jpeg', 'raw']
        };

        switch (this.platform) {
            case 'win32':
                return {
                    ...baseCapabilities,
                    windowCapture: true,
                    regionCapture: true,
                    multiDisplay: true,
                    hardwareAccelerated: true,
                    api: 'DXGI Desktop Duplication'
                };
                
            case 'darwin':
                return {
                    ...baseCapabilities,
                    windowCapture: true,
                    regionCapture: true,
                    multiDisplay: true,
                    hardwareAccelerated: true,
                    api: 'CGWindowListCreateImage'
                };
                
            case 'linux':
                return {
                    ...baseCapabilities,
                    windowCapture: false, // Depende do X11/Wayland
                    regionCapture: true,
                    multiDisplay: true,
                    hardwareAccelerated: false, // Depende da implementação
                    api: 'XCB/PipeWire'
                };
                
            default:
                return { ...baseCapabilities, api: 'unknown' };
        }
    }

    // Método para teste de desenvolvimento
    async testNativeModule() {
        console.log('🧪 Testing native screenshot module...');
        if (!this.isAvailable()) {
            throw new Error('Native module not available for testing');
        }

        try {
            const result = await this.capture({ format: 'png' });
            console.log(`✅ Native module test successful: ${result.metadata.processingTime}ms`);
            return result;
        } catch (error) {
            console.error('❌ Native module test failed:', error.message);
            throw error;
        }
    }
}

module.exports = NativeScreenshotProvider; 