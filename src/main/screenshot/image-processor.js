// ====== IMAGE PROCESSOR - SHARP INTEGRATION ======
// Processa screenshots capturadas com redimensionamento, compressão e preparação para AI

const sharp = require('sharp');
const { createHash } = require('crypto');

class ImageProcessor {
    constructor() {
        this.isInitialized = false;
        this.defaultOptions = {
            // Configurações de redimensionamento
            maxWidth: 1920,
            maxHeight: 1080,
            fit: 'inside', // 'inside', 'outside', 'cover', 'contain', 'fill'
            
            // Configurações de compressão
            quality: 75, // JPEG quality (1-100)
            format: 'jpeg', // 'jpeg', 'png', 'webp'
            progressive: true, // Progressive JPEG
            
            // Configurações específicas para AI
            aiOptimized: true,
            removeMetadata: true,
            
            // Opções de crop para areas relevantes do CS2
            cropRegions: {
                minimap: { left: 0.02, top: 0.02, width: 0.25, height: 0.25 },
                killfeed: { left: 0.75, top: 0.02, width: 0.23, height: 0.4 },
                hud: { left: 0, top: 0.85, width: 1, height: 0.15 },
                crosshair: { left: 0.4, top: 0.4, width: 0.2, height: 0.2 }
            }
        };
        
        this.stats = {
            totalProcessed: 0,
            totalSizeReduction: 0,
            averageProcessingTime: 0,
            totalProcessingTime: 0,
            formatDistribution: {},
            sizingStats: {
                originalSizes: [],
                processedSizes: [],
                compressionRatios: []
            }
        };
    }

    async initialize() {
        try {
            console.log('🖼️ Initializing Image Processor with Sharp...');
            
            // Verificar se Sharp está disponível
            const sharpInfo = sharp();
            const sharpStats = sharpInfo.constructor;
            
            console.log(`✅ Sharp initialized - Version: ${sharpStats.versions?.sharp || 'unknown'}`);
            console.log(`📊 Supported formats:`, Object.keys(sharpStats.format || {}));
            
            this.isInitialized = true;
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Image Processor:', error.message);
            this.isInitialized = false;
            throw error;
        }
    }

    // Processar imagem principal - entrada unificada
    async processImage(imageBuffer, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Image Processor not initialized. Call initialize() first.');
        }

        const startTime = Date.now();
        const mergedOptions = { ...this.defaultOptions, ...options };
        
        try {
            console.log(`🖼️ Processing image (${imageBuffer.length} bytes)...`);
            
            // Analisar imagem original
            const originalMetadata = await sharp(imageBuffer).metadata();
            console.log(`📐 Original: ${originalMetadata.width}x${originalMetadata.height}, format: ${originalMetadata.format}`);
            
            // Pipeline de processamento
            let pipeline = sharp(imageBuffer);
            
            // 1. Remover metadados se solicitado
            if (mergedOptions.removeMetadata) {
                pipeline = pipeline.withMetadata({});
            }
            
            // 2. Redimensionar se necessário
            if (mergedOptions.maxWidth || mergedOptions.maxHeight) {
                pipeline = pipeline.resize({
                    width: mergedOptions.maxWidth,
                    height: mergedOptions.maxHeight,
                    fit: mergedOptions.fit,
                    withoutEnlargement: true
                });
            }
            
            // 3. Aplicar configurações de formato e compressão
            switch (mergedOptions.format.toLowerCase()) {
                case 'jpeg':
                case 'jpg':
                    pipeline = pipeline.jpeg({
                        quality: mergedOptions.quality,
                        progressive: mergedOptions.progressive,
                        mozjpeg: true // Usar encoder mozjpeg para melhor compressão
                    });
                    break;
                    
                case 'png':
                    pipeline = pipeline.png({
                        compressionLevel: Math.floor(mergedOptions.quality / 10),
                        adaptiveFiltering: true
                    });
                    break;
                    
                case 'webp':
                    pipeline = pipeline.webp({
                        quality: mergedOptions.quality,
                        effort: 6 // Máximo esforço de compressão
                    });
                    break;
                    
                default:
                    throw new Error(`Unsupported format: ${mergedOptions.format}`);
            }
            
            // 4. Executar pipeline
            const processedBuffer = await pipeline.toBuffer();
            const processedMetadata = await sharp(processedBuffer).metadata();
            
            const processingTime = Date.now() - startTime;
            const compressionRatio = (1 - processedBuffer.length / imageBuffer.length) * 100;
            
            // Atualizar estatísticas
            this.updateStats(imageBuffer.length, processedBuffer.length, processingTime, mergedOptions.format);
            
            console.log(`✅ Image processed successfully:`);
            console.log(`   📐 Size: ${originalMetadata.width}x${originalMetadata.height} → ${processedMetadata.width}x${processedMetadata.height}`);
            console.log(`   💾 Size: ${this.formatBytes(imageBuffer.length)} → ${this.formatBytes(processedBuffer.length)} (${compressionRatio.toFixed(1)}% reduction)`);
            console.log(`   ⏱️ Time: ${processingTime}ms`);
            
            return {
                processedBuffer,
                metadata: {
                    original: originalMetadata,
                    processed: processedMetadata,
                    processing: {
                        time: processingTime,
                        compressionRatio,
                        originalSize: imageBuffer.length,
                        processedSize: processedBuffer.length,
                        format: mergedOptions.format,
                        quality: mergedOptions.quality
                    }
                }
            };
            
        } catch (error) {
            console.error('❌ Image processing failed:', error.message);
            throw error;
        }
    }

    // Converter imagem para base64 (para AI APIs)
    async processForAI(imageBuffer, options = {}) {
        const aiOptions = {
            ...this.defaultOptions,
            maxWidth: 1024, // Tamanho otimizado para AI
            maxHeight: 768,
            quality: 80,
            format: 'jpeg',
            aiOptimized: true,
            ...options
        };
        
        const result = await this.processImage(imageBuffer, aiOptions);
        
        // Converter para base64
        const base64String = result.processedBuffer.toString('base64');
        const mimeType = `image/${aiOptions.format}`;
        const dataUrl = `data:${mimeType};base64,${base64String}`;
        
        console.log(`🤖 AI-optimized image prepared: ${this.formatBytes(result.processedBuffer.length)} → base64 (${base64String.length} chars)`);
        
        return {
            base64: base64String,
            dataUrl: dataUrl,
            mimeType: mimeType,
            buffer: result.processedBuffer,
            metadata: {
                ...result.metadata,
                base64Length: base64String.length,
                mimeType: mimeType
            }
        };
    }

    // Crop de regiões específicas do CS2
    async cropGameRegion(imageBuffer, regionName, options = {}) {
        if (!this.defaultOptions.cropRegions[regionName]) {
            throw new Error(`Unknown crop region: ${regionName}`);
        }
        
        const region = this.defaultOptions.cropRegions[regionName];
        const originalMetadata = await sharp(imageBuffer).metadata();
        
        // Calcular coordenadas absolutas
        const left = Math.round(originalMetadata.width * region.left);
        const top = Math.round(originalMetadata.height * region.top);
        const width = Math.round(originalMetadata.width * region.width);
        const height = Math.round(originalMetadata.height * region.height);
        
        console.log(`✂️ Cropping ${regionName} region: ${left},${top} ${width}x${height}`);
        
        // Crop e processar
        const croppedBuffer = await sharp(imageBuffer)
            .extract({ left, top, width, height })
            .toBuffer();
            
        // Aplicar processamento adicional se solicitado
        if (options.process) {
            return await this.processImage(croppedBuffer, options);
        }
        
        return {
            processedBuffer: croppedBuffer,
            metadata: {
                region: regionName,
                coordinates: { left, top, width, height },
                originalSize: { width: originalMetadata.width, height: originalMetadata.height }
            }
        };
    }

    // Preparar múltiplas versões da imagem para diferentes usos
    async prepareMultipleFormats(imageBuffer, formats = ['ai', 'thumbnail', 'archive']) {
        const results = {};
        
        for (const format of formats) {
            let options = {};
            
            switch (format) {
                case 'ai':
                    options = { maxWidth: 1024, maxHeight: 768, quality: 80, format: 'jpeg' };
                    results[format] = await this.processForAI(imageBuffer, options);
                    break;
                    
                case 'thumbnail':
                    options = { maxWidth: 300, maxHeight: 200, quality: 70, format: 'jpeg' };
                    results[format] = await this.processImage(imageBuffer, options);
                    break;
                    
                case 'archive':
                    options = { maxWidth: 1920, maxHeight: 1080, quality: 85, format: 'jpeg' };
                    results[format] = await this.processImage(imageBuffer, options);
                    break;
                    
                default:
                    console.warn(`Unknown format preset: ${format}`);
            }
        }
        
        return results;
    }

    // Analisar imagem sem processamento
    async analyzeImage(imageBuffer) {
        try {
            const metadata = await sharp(imageBuffer).metadata();
            const hash = createHash('md5').update(imageBuffer).digest('hex');
            
            return {
                metadata,
                hash,
                size: imageBuffer.length,
                aspectRatio: metadata.width / metadata.height,
                megapixels: (metadata.width * metadata.height) / 1000000
            };
            
        } catch (error) {
            console.error('Error analyzing image:', error.message);
            throw error;
        }
    }

    // Atualizar estatísticas de performance
    updateStats(originalSize, processedSize, processingTime, format) {
        this.stats.totalProcessed++;
        this.stats.totalSizeReduction += (originalSize - processedSize);
        this.stats.totalProcessingTime += processingTime;
        this.stats.averageProcessingTime = this.stats.totalProcessingTime / this.stats.totalProcessed;
        
        // Distribuição de formatos
        this.stats.formatDistribution[format] = (this.stats.formatDistribution[format] || 0) + 1;
        
        // Estatísticas de tamanho
        this.stats.sizingStats.originalSizes.push(originalSize);
        this.stats.sizingStats.processedSizes.push(processedSize);
        this.stats.sizingStats.compressionRatios.push((1 - processedSize / originalSize) * 100);
        
        // Manter apenas os últimos 100 registros
        if (this.stats.sizingStats.originalSizes.length > 100) {
            this.stats.sizingStats.originalSizes.shift();
            this.stats.sizingStats.processedSizes.shift();
            this.stats.sizingStats.compressionRatios.shift();
        }
    }

    // Obter estatísticas de performance
    getPerformanceStats() {
        const avgCompression = this.stats.sizingStats.compressionRatios.length > 0
            ? this.stats.sizingStats.compressionRatios.reduce((a, b) => a + b, 0) / this.stats.sizingStats.compressionRatios.length
            : 0;
            
        return {
            totalProcessed: this.stats.totalProcessed,
            averageProcessingTime: Math.round(this.stats.averageProcessingTime),
            totalSizeReduction: this.formatBytes(this.stats.totalSizeReduction),
            averageCompressionRatio: `${avgCompression.toFixed(1)}%`,
            formatDistribution: this.stats.formatDistribution,
            isInitialized: this.isInitialized
        };
    }

    // Utilitário para formatar bytes
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up Image Processor...');
        this.isInitialized = false;
        console.log('✅ Image Processor cleaned up');
    }
}

// Export singleton instance
module.exports = new ImageProcessor(); 