// ====== SCREENSHOT INTERFACE - ABSTRACTION LAYER ======
// Interface abstrata para providers de screenshot (fallback + native)

/**
 * @typedef {Object} ScreenshotOptions
 * @property {number} [displayId] - ID do display a capturar (0 = primário)
 * @property {string} [windowTitle] - Título da janela específica para capturar
 * @property {string} [format] - Formato da imagem ('png', 'jpeg')
 * @property {number} [quality] - Qualidade JPEG (0-100)
 * @property {Object} [region] - Região específica para capturar
 * @property {number} [region.x] - Coordenada X
 * @property {number} [region.y] - Coordenada Y  
 * @property {number} [region.width] - Largura
 * @property {number} [region.height] - Altura
 */

/**
 * @typedef {Object} ScreenshotMetadata
 * @property {number} width - Largura da imagem capturada
 * @property {number} height - Altura da imagem capturada
 * @property {string} format - Formato da imagem
 * @property {number} captureTime - Timestamp da captura
 * @property {number} processingTime - Tempo de processamento em ms
 * @property {string} provider - Nome do provider usado
 * @property {number} displayId - ID do display capturado
 */

/**
 * @typedef {Object} ScreenshotResult
 * @property {Buffer} buffer - Buffer da imagem capturada
 * @property {ScreenshotMetadata} metadata - Metadados da captura
 */

/**
 * Classe abstrata para providers de screenshot.
 * Define a interface comum que tanto o fallback quanto as APIs nativas devem implementar.
 */
class ScreenshotProvider {
    constructor(name) {
        this.name = name;
        this.isInitialized = false;
    }

    /**
     * Inicializa o provider (verificação de dependências, configuração, etc.)
     * @returns {Promise<boolean>} True se inicializado com sucesso
     */
    async initialize() {
        throw new Error(`Method 'initialize()' must be implemented by ${this.name}`);
    }

    /**
     * Verifica se o provider está disponível no sistema atual
     * @returns {boolean} True se disponível
     */
    isAvailable() {
        throw new Error(`Method 'isAvailable()' must be implemented by ${this.name}`);
    }

    /**
     * Captura um screenshot com as opções especificadas
     * @param {ScreenshotOptions} [options] - Opções para a captura
     * @returns {Promise<ScreenshotResult>} Resultado da captura
     */
    async capture(options = {}) {
        throw new Error(`Method 'capture()' must be implemented by ${this.name}`);
    }

    /**
     * Obtém informações sobre displays disponíveis
     * @returns {Promise<Array>} Lista de displays disponíveis
     */
    async getDisplays() {
        throw new Error(`Method 'getDisplays()' must be implemented by ${this.name}`);
    }

    /**
     * Obtém informações sobre janelas disponíveis para captura
     * @returns {Promise<Array>} Lista de janelas disponíveis
     */
    async getWindows() {
        // Implementação opcional - nem todos os providers suportam
        return [];
    }

    /**
     * Cleanup de recursos quando o provider não é mais necessário
     * @returns {Promise<void>}
     */
    async cleanup() {
        this.isInitialized = false;
    }

    /**
     * Obtém estatísticas de performance do provider
     * @returns {Object} Estatísticas de performance
     */
    getPerformanceStats() {
        return {
            provider: this.name,
            totalCaptures: 0,
            averageCaptureTime: 0,
            lastCaptureTime: 0,
            errorCount: 0
        };
    }
}

module.exports = ScreenshotProvider; 