/**
 * CS2 Coach AI - OCR System (VAC-Safe)
 * Sistema de reconhecimento óptico de caracteres para dados não disponíveis via GSI
 * Implementação baseada no guia fornecido - 100% VAC-Safe
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

class OCRSystem {
    constructor() {
        this.config = {
            // Configurações do OCR
            tesseractPath: 'tesseract', // Path para tesseract
            tempDir: path.join(__dirname, '..', '..', '..', 'temp'),
            confidence: 70, // Mínimo 70% de confiança
            language: 'eng', // Idioma
            
            // Áreas de interesse na tela (coordenadas relativas)
            regions: {
                scoreboard: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
                economy: { x: 0.02, y: 0.85, width: 0.2, height: 0.1 },
                minimap: { x: 0.78, y: 0.05, width: 0.2, height: 0.2 },
                roundTimer: { x: 0.45, y: 0.05, width: 0.1, height: 0.05 },
                bombTimer: { x: 0.4, y: 0.3, width: 0.2, height: 0.1 }
            },
            
            // Configurações de captura
            captureDelay: 100, // Delay entre capturas (ms)
            maxRetries: 3,
            timeout: 5000
        };
        
        this.isInitialized = false;
        this.lastCapture = null;
        this.processingQueue = [];
        this.isProcessing = false;
        
        // Cache para evitar processamento desnecessário
        this.cache = new Map();
        this.cacheTTL = 2000; // 2 segundos
        
        this.init();
    }
    
    async init() {
        try {
            // Verificar se tesseract está disponível
            await this.checkTesseractInstallation();
            
            // Criar diretório temporário
            if (!fs.existsSync(this.config.tempDir)) {
                fs.mkdirSync(this.config.tempDir, { recursive: true });
            }
            
            this.isInitialized = true;
            console.log('[OCR_SYSTEM] ✅ Sistema OCR inicializado');
            
        } catch (error) {
            console.error('[OCR_SYSTEM] ❌ Erro na inicialização:', error.message);
            console.warn('[OCR_SYSTEM] ⚠️ Funcionalidades OCR não estarão disponíveis');
        }
    }
    
    async checkTesseractInstallation() {
        return new Promise((resolve, reject) => {
            exec('tesseract --version', (error, stdout, stderr) => {
                if (error) {
                    reject(new Error('Tesseract não encontrado. Instale: npm install tesseract.js ou apt-get install tesseract-ocr'));
                } else {
                    console.log('[OCR_SYSTEM] Tesseract detectado:', stdout.split('\n')[0]);
                    resolve();
                }
            });
        });
    }
    
    // ===========================================
    // CAPTURA DE TELA (VAC-SAFE)
    // ===========================================
    
    /**
     * Capturar tela usando método VAC-safe
     * @param {string} region - Região a ser capturada
     * @returns {Promise<string>} Path do arquivo de imagem
     */
    async captureScreen(region = 'full') {
        if (!this.isInitialized) {
            throw new Error('OCR System not initialized');
        }
        
        try {
            // Usar screenshot library VAC-safe
            const screenshot = require('screenshot-desktop');
            const timestamp = Date.now();
            const filename = `capture_${region}_${timestamp}.png`;
            const filepath = path.join(this.config.tempDir, filename);
            
            // Capturar tela completa
            const img = await screenshot();
            
            // Se região específica, recortar
            if (region !== 'full' && this.config.regions[region]) {
                const croppedImg = await this.cropImage(img, this.config.regions[region]);
                fs.writeFileSync(filepath, croppedImg);
            } else {
                fs.writeFileSync(filepath, img);
            }
            
            this.lastCapture = filepath;
            console.log(`[OCR_SYSTEM] 📸 Captura realizada: ${region}`);
            
            return filepath;
            
        } catch (error) {
            console.error('[OCR_SYSTEM] ❌ Erro na captura:', error.message);
            throw error;
        }
    }
    
    /**
     * Recortar imagem para região específica
     * @param {Buffer} imageBuffer - Buffer da imagem
     * @param {Object} region - Região a ser recortada
     * @returns {Promise<Buffer>} Buffer da imagem recortada
     */
    async cropImage(imageBuffer, region) {
        try {
            const sharp = require('sharp');
            const metadata = await sharp(imageBuffer).metadata();
            
            const cropConfig = {
                left: Math.round(metadata.width * region.x),
                top: Math.round(metadata.height * region.y),
                width: Math.round(metadata.width * region.width),
                height: Math.round(metadata.height * region.height)
            };
            
            return await sharp(imageBuffer)
                .extract(cropConfig)
                .toBuffer();
                
        } catch (error) {
            console.error('[OCR_SYSTEM] ❌ Erro ao recortar imagem:', error.message);
            throw error;
        }
    }
    
    // ===========================================
    // PROCESSAMENTO OCR
    // ===========================================
    
    /**
     * Processar imagem com OCR
     * @param {string} imagePath - Path da imagem
     * @param {Object} options - Opções do OCR
     * @returns {Promise<Object>} Resultado do OCR
     */
    async processImage(imagePath, options = {}) {
        const cacheKey = `${imagePath}_${JSON.stringify(options)}`;
        
        // Verificar cache
        const cached = this.getCachedResult(cacheKey);
        if (cached) {
            return cached;
        }
        
        try {
            // Pré-processar imagem para melhor OCR
            const processedImagePath = await this.preprocessImage(imagePath, options);
            
            // Executar OCR
            const result = await this.runTesseract(processedImagePath, options);
            
            // Pós-processar resultado
            const processedResult = this.postprocessOCRResult(result, options);
            
            // Cache resultado
            this.setCachedResult(cacheKey, processedResult);
            
            // Limpar arquivo temporário
            this.cleanupTempFile(processedImagePath);
            
            return processedResult;
            
        } catch (error) {
            console.error('[OCR_SYSTEM] ❌ Erro no processamento OCR:', error.message);
            throw error;
        }
    }
    
    /**
     * Pré-processar imagem para melhor OCR
     * @param {string} imagePath - Path da imagem
     * @param {Object} options - Opções de processamento
     * @returns {Promise<string>} Path da imagem processada
     */
    async preprocessImage(imagePath, options = {}) {
        try {
            const sharp = require('sharp');
            const timestamp = Date.now();
            const processedPath = path.join(this.config.tempDir, `processed_${timestamp}.png`);
            
            let pipeline = sharp(imagePath);
            
            // Aplicar filtros baseados no tipo de dados
            if (options.type === 'economy') {
                pipeline = pipeline
                    .greyscale()
                    .threshold(128)
                    .sharpen();
            } else if (options.type === 'scoreboard') {
                pipeline = pipeline
                    .greyscale()
                    .normalize()
                    .sharpen();
            } else if (options.type === 'timer') {
                pipeline = pipeline
                    .greyscale()
                    .threshold(100)
                    .sharpen({ sigma: 1.5 });
            }
            
            // Aplicar upscaling para melhor precisão
            pipeline = pipeline.resize({
                width: 1920,
                height: 1080,
                fit: 'inside',
                withoutEnlargement: false
            });
            
            await pipeline.png().toFile(processedPath);
            
            return processedPath;
            
        } catch (error) {
            console.error('[OCR_SYSTEM] ❌ Erro no pré-processamento:', error.message);
            return imagePath; // Retornar original se falhar
        }
    }
    
    /**
     * Executar Tesseract OCR
     * @param {string} imagePath - Path da imagem
     * @param {Object} options - Opções do Tesseract
     * @returns {Promise<Object>} Resultado do OCR
     */
    async runTesseract(imagePath, options = {}) {
        return new Promise((resolve, reject) => {
            const outputPath = path.join(this.config.tempDir, `ocr_${Date.now()}`);
            
            // Construir comando Tesseract
            let command = `tesseract "${imagePath}" "${outputPath}"`;
            
            // Adicionar configurações específicas
            if (options.type === 'economy') {
                command += ' -c tessedit_char_whitelist=0123456789$';
            } else if (options.type === 'timer') {
                command += ' -c tessedit_char_whitelist=0123456789:';
            } else if (options.type === 'scoreboard') {
                command += ' -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            }
            
            command += ` -l ${this.config.language}`;
            
            // Executar comando
            exec(command, { timeout: this.config.timeout }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Tesseract error: ${error.message}`));
                    return;
                }
                
                try {
                    // Ler resultado
                    const resultText = fs.readFileSync(`${outputPath}.txt`, 'utf8');
                    
                    // Limpar arquivo de resultado
                    fs.unlinkSync(`${outputPath}.txt`);
                    
                    resolve({
                        text: resultText.trim(),
                        confidence: this.calculateConfidence(resultText),
                        timestamp: Date.now()
                    });
                    
                } catch (readError) {
                    reject(new Error(`Failed to read OCR result: ${readError.message}`));
                }
            });
        });
    }
    
    /**
     * Pós-processar resultado do OCR
     * @param {Object} result - Resultado bruto do OCR
     * @param {Object} options - Opções de pós-processamento
     * @returns {Object} Resultado processado
     */
    postprocessOCRResult(result, options = {}) {
        let processedText = result.text;
        
        // Limpeza básica
        processedText = processedText.replace(/\s+/g, ' ').trim();
        
        // Processamento específico por tipo
        if (options.type === 'economy') {
            processedText = this.processEconomyText(processedText);
        } else if (options.type === 'timer') {
            processedText = this.processTimerText(processedText);
        } else if (options.type === 'scoreboard') {
            processedText = this.processScoreboardText(processedText);
        }
        
        return {
            originalText: result.text,
            processedText,
            confidence: result.confidence,
            timestamp: result.timestamp,
            type: options.type || 'unknown'
        };
    }
    
    // ===========================================
    // PROCESSAMENTO ESPECÍFICO POR TIPO
    // ===========================================
    
    /**
     * Processar texto de economia
     * @param {string} text - Texto bruto
     * @returns {string} Texto processado
     */
    processEconomyText(text) {
        // Extrair valores monetários
        const moneyRegex = /\$?(\d+)/g;
        const matches = text.match(moneyRegex);
        
        if (matches) {
            return matches.map(match => match.replace('$', '')).join(',');
        }
        
        return text;
    }
    
    /**
     * Processar texto de timer
     * @param {string} text - Texto bruto
     * @returns {string} Texto processado
     */
    processTimerText(text) {
        // Extrair formato de tempo (mm:ss)
        const timeRegex = /(\d{1,2}):(\d{2})/;
        const match = text.match(timeRegex);
        
        if (match) {
            return `${match[1]}:${match[2]}`;
        }
        
        return text;
    }
    
    /**
     * Processar texto de scoreboard
     * @param {string} text - Texto bruto
     * @returns {Object} Dados estruturados do scoreboard
     */
    processScoreboardText(text) {
        const lines = text.split('\n');
        const players = [];
        
        lines.forEach(line => {
            // Tentar extrair dados do jogador (nome, kills, deaths, assists)
            const playerRegex = /(\w+)\s+(\d+)\s+(\d+)\s+(\d+)/;
            const match = line.match(playerRegex);
            
            if (match) {
                players.push({
                    name: match[1],
                    kills: parseInt(match[2]),
                    deaths: parseInt(match[3]),
                    assists: parseInt(match[4])
                });
            }
        });
        
        return {
            players,
            rawText: text
        };
    }
    
    // ===========================================
    // MÉTODOS ESPECIALIZADOS
    // ===========================================
    
    /**
     * Extrair economia inimiga
     * @returns {Promise<Object>} Dados da economia inimiga
     */
    async extractEnemyEconomy() {
        try {
            const imagePath = await this.captureScreen('economy');
            const result = await this.processImage(imagePath, { type: 'economy' });
            
            this.cleanupTempFile(imagePath);
            
            return {
                success: true,
                data: result,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('[OCR_SYSTEM] ❌ Erro ao extrair economia:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    
    /**
     * Extrair dados do scoreboard
     * @returns {Promise<Object>} Dados do scoreboard
     */
    async extractScoreboard() {
        try {
            const imagePath = await this.captureScreen('scoreboard');
            const result = await this.processImage(imagePath, { type: 'scoreboard' });
            
            this.cleanupTempFile(imagePath);
            
            return {
                success: true,
                data: result,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('[OCR_SYSTEM] ❌ Erro ao extrair scoreboard:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    
    /**
     * Extrair timer da bomba
     * @returns {Promise<Object>} Dados do timer da bomba
     */
    async extractBombTimer() {
        try {
            const imagePath = await this.captureScreen('bombTimer');
            const result = await this.processImage(imagePath, { type: 'timer' });
            
            this.cleanupTempFile(imagePath);
            
            return {
                success: true,
                data: result,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('[OCR_SYSTEM] ❌ Erro ao extrair timer da bomba:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    
    // ===========================================
    // UTILITY METHODS
    // ===========================================
    
    calculateConfidence(text) {
        // Calcular confiança básica baseada na qualidade do texto
        if (!text || text.length === 0) return 0;
        
        // Penalizar caracteres especiais e espaços excessivos
        const cleanText = text.replace(/[^\w\s\d$:]/g, '');
        const ratio = cleanText.length / text.length;
        
        return Math.round(ratio * 100);
    }
    
    getCachedResult(key) {
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }
        
        if (cached) {
            this.cache.delete(key);
        }
        
        return null;
    }
    
    setCachedResult(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    cleanupTempFile(filepath) {
        try {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        } catch (error) {
            console.warn('[OCR_SYSTEM] ⚠️ Erro ao limpar arquivo temporário:', error.message);
        }
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    // ===========================================
    // STATUS E MONITORAMENTO
    // ===========================================
    
    getStatus() {
        return {
            initialized: this.isInitialized,
            processing: this.isProcessing,
            queueSize: this.processingQueue.length,
            cacheSize: this.cache.size,
            lastCapture: this.lastCapture,
            regions: Object.keys(this.config.regions)
        };
    }
    
    destroy() {
        // Limpar cache
        this.clearCache();
        
        // Limpar arquivos temporários
        try {
            if (fs.existsSync(this.config.tempDir)) {
                const files = fs.readdirSync(this.config.tempDir);
                files.forEach(file => {
                    fs.unlinkSync(path.join(this.config.tempDir, file));
                });
            }
        } catch (error) {
            console.warn('[OCR_SYSTEM] ⚠️ Erro ao limpar diretório temporário:', error.message);
        }
        
        console.log('[OCR_SYSTEM] Sistema OCR destruído');
    }
}

module.exports = OCRSystem;