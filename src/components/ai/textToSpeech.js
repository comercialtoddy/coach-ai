/**
 * CS2 Coach AI - Text-to-Speech System
 * Sistema de feedback audível em tempo real
 * Implementação baseada no guia fornecido
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class TextToSpeechSystem {
    constructor() {
        this.config = {
            // Configurações de voz
            voice: {
                language: 'en-US',
                gender: 'male', // male, female
                rate: 1.2, // Velocidade da fala (0.5 - 2.0)
                pitch: 1.0, // Tom da voz (0.5 - 2.0)
                volume: 0.7 // Volume (0.0 - 1.0)
            },
            
            // Configurações de sistema
            enabled: true,
            maxQueueSize: 5,
            interruptPrevious: true,
            
            // Configurações de timing
            delays: {
                critical: 0,        // Eventos críticos (bomba plantada, etc.)
                normal: 500,        // Eventos normais
                low: 1000          // Eventos de baixa prioridade
            },
            
            // Filtros de conteúdo
            maxLength: 100,         // Máximo de caracteres por fala
            minInterval: 2000,      // Intervalo mínimo entre falas (ms)
            
            // Configurações de áudio
            audioFormat: 'wav',
            sampleRate: 22050,
            tempDir: path.join(__dirname, '..', '..', '..', 'temp', 'tts')
        };
        
        // Estado interno
        this.isInitialized = false;
        this.currentlyPlaying = null;
        this.speechQueue = [];
        this.lastSpeechTime = 0;
        this.ttsEngine = null;
        
        // Cache de áudio
        this.audioCache = new Map();
        this.cacheTTL = 300000; // 5 minutos
        
        // Estatísticas
        this.stats = {
            totalSpeech: 0,
            cacheHits: 0,
            queueDropped: 0,
            errors: 0
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Detectar engine TTS disponível
            this.ttsEngine = await this.detectTTSEngine();
            
            // Criar diretório temporário
            if (!fs.existsSync(this.config.tempDir)) {
                fs.mkdirSync(this.config.tempDir, { recursive: true });
            }
            
            this.isInitialized = true;
            console.log(`[TTS_SYSTEM] ✅ Sistema TTS inicializado com engine: ${this.ttsEngine}`);
            
        } catch (error) {
            console.error('[TTS_SYSTEM] ❌ Erro na inicialização:', error.message);
            console.warn('[TTS_SYSTEM] ⚠️ Funcionalidades TTS não estarão disponíveis');
        }
    }
    
    async detectTTSEngine() {
        // Detectar sistema operacional e engine disponível
        const platform = process.platform;
        
        if (platform === 'win32') {
            // Windows: usar SAPI
            return 'sapi';
        } else if (platform === 'darwin') {
            // macOS: usar say
            return 'say';
        } else if (platform === 'linux') {
            // Linux: verificar espeak ou festival
            try {
                await this.checkCommand('espeak');
                return 'espeak';
            } catch {
                try {
                    await this.checkCommand('festival');
                    return 'festival';
                } catch {
                    // Fallback para node-speaker se disponível
                    return 'node-speaker';
                }
            }
        }
        
        throw new Error('Nenhum engine TTS compatível encontrado');
    }
    
    async checkCommand(command) {
        return new Promise((resolve, reject) => {
            const { exec } = require('child_process');
            exec(`which ${command}`, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
    
    // ===========================================
    // MÉTODOS PRINCIPAIS
    // ===========================================
    
    /**
     * Falar texto com prioridade
     * @param {string} text - Texto a ser falado
     * @param {string} priority - Prioridade (critical, normal, low)
     * @param {Object} options - Opções específicas
     * @returns {Promise<boolean>} Sucesso na operação
     */
    async speak(text, priority = 'normal', options = {}) {
        if (!this.isInitialized || !this.config.enabled) {
            return false;
        }
        
        try {
            // Preprocessar texto
            const processedText = this.preprocessText(text);
            
            if (!processedText) {
                return false;
            }
            
            // Verificar intervalo mínimo
            const now = Date.now();
            if (now - this.lastSpeechTime < this.config.minInterval && priority !== 'critical') {
                console.log(`[TTS_SYSTEM] ⏸️ Fala ignorada por intervalo mínimo: "${processedText}"`);
                return false;
            }
            
            // Criar item da fila
            const speechItem = {
                text: processedText,
                priority,
                timestamp: now,
                options: { ...this.config.voice, ...options },
                hash: this.generateTextHash(processedText)
            };
            
            // Gerenciar fila baseado na prioridade
            if (priority === 'critical') {
                // Crítico: interromper atual e ir para início da fila
                if (this.currentlyPlaying) {
                    this.stopCurrentSpeech();
                }
                this.speechQueue.unshift(speechItem);
            } else {
                // Normal/Low: adicionar à fila
                this.speechQueue.push(speechItem);
            }
            
            // Limitar tamanho da fila
            while (this.speechQueue.length > this.config.maxQueueSize) {
                const dropped = this.speechQueue.pop();
                this.stats.queueDropped++;
                console.log(`[TTS_SYSTEM] 🗑️ Fala descartada da fila: "${dropped.text}"`);
            }
            
            // Processar fila
            this.processQueue();
            
            return true;
            
        } catch (error) {
            console.error('[TTS_SYSTEM] ❌ Erro ao falar:', error.message);
            this.stats.errors++;
            return false;
        }
    }
    
    /**
     * Processar fila de fala
     */
    async processQueue() {
        if (this.currentlyPlaying || this.speechQueue.length === 0) {
            return;
        }
        
        const speechItem = this.speechQueue.shift();
        this.currentlyPlaying = speechItem;
        
        try {
            // Verificar cache de áudio
            const cachedAudio = this.getCachedAudio(speechItem.hash);
            
            if (cachedAudio) {
                console.log(`[TTS_SYSTEM] 🎵 Cache hit para: "${speechItem.text}"`);
                await this.playAudio(cachedAudio);
                this.stats.cacheHits++;
            } else {
                console.log(`[TTS_SYSTEM] 🎤 Gerando áudio para: "${speechItem.text}"`);
                const audioFile = await this.generateAudio(speechItem);
                
                if (audioFile) {
                    // Cache áudio
                    this.setCachedAudio(speechItem.hash, audioFile);
                    
                    // Reproduzir
                    await this.playAudio(audioFile);
                }
            }
            
            this.lastSpeechTime = Date.now();
            this.stats.totalSpeech++;
            
        } catch (error) {
            console.error('[TTS_SYSTEM] ❌ Erro ao processar fala:', error.message);
            this.stats.errors++;
        } finally {
            this.currentlyPlaying = null;
            
            // Continuar processando fila
            setTimeout(() => this.processQueue(), 100);
        }
    }
    
    /**
     * Gerar áudio usando engine TTS
     * @param {Object} speechItem - Item da fila de fala
     * @returns {Promise<string>} Path do arquivo de áudio
     */
    async generateAudio(speechItem) {
        const audioFile = path.join(this.config.tempDir, `tts_${speechItem.hash}.${this.config.audioFormat}`);
        
        try {
            switch (this.ttsEngine) {
                case 'sapi':
                    await this.generateWithSAPI(speechItem, audioFile);
                    break;
                case 'say':
                    await this.generateWithSay(speechItem, audioFile);
                    break;
                case 'espeak':
                    await this.generateWithEspeak(speechItem, audioFile);
                    break;
                case 'festival':
                    await this.generateWithFestival(speechItem, audioFile);
                    break;
                case 'node-speaker':
                    await this.generateWithNodeSpeaker(speechItem, audioFile);
                    break;
                default:
                    throw new Error(`Engine TTS não suportado: ${this.ttsEngine}`);
            }
            
            return audioFile;
            
        } catch (error) {
            console.error('[TTS_SYSTEM] ❌ Erro ao gerar áudio:', error.message);
            return null;
        }
    }
    
    // ===========================================
    // ENGINES TTS ESPECÍFICOS
    // ===========================================
    
    /**
     * Gerar áudio usando SAPI (Windows)
     */
    async generateWithSAPI(speechItem, audioFile) {
        return new Promise((resolve, reject) => {
            const { spawn } = require('child_process');
            
            // Usar PowerShell para SAPI
            const script = `
                Add-Type -AssemblyName System.speech
                $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer
                $speak.Rate = ${Math.round(speechItem.options.rate * 10) - 10}
                $speak.Volume = ${Math.round(speechItem.options.volume * 100)}
                $speak.SetOutputToWaveFile("${audioFile}")
                $speak.Speak("${speechItem.text}")
                $speak.Dispose()
            `;
            
            const ps = spawn('powershell', ['-Command', script]);
            
            ps.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`SAPI falhou com código ${code}`));
                }
            });
            
            ps.on('error', reject);
        });
    }
    
    /**
     * Gerar áudio usando Say (macOS)
     */
    async generateWithSay(speechItem, audioFile) {
        return new Promise((resolve, reject) => {
            const args = [
                '-v', 'Alex', // Voz padrão
                '-r', Math.round(speechItem.options.rate * 200),
                '-o', audioFile,
                speechItem.text
            ];
            
            const say = spawn('say', args);
            
            say.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Say falhou com código ${code}`));
                }
            });
            
            say.on('error', reject);
        });
    }
    
    /**
     * Gerar áudio usando eSpeak (Linux)
     */
    async generateWithEspeak(speechItem, audioFile) {
        return new Promise((resolve, reject) => {
            const args = [
                '-v', 'en',
                '-s', Math.round(speechItem.options.rate * 175),
                '-p', Math.round(speechItem.options.pitch * 50),
                '-a', Math.round(speechItem.options.volume * 200),
                '-w', audioFile,
                speechItem.text
            ];
            
            const espeak = spawn('espeak', args);
            
            espeak.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`eSpeak falhou com código ${code}`));
                }
            });
            
            espeak.on('error', reject);
        });
    }
    
    /**
     * Gerar áudio usando Festival (Linux)
     */
    async generateWithFestival(speechItem, audioFile) {
        return new Promise((resolve, reject) => {
            const tempScript = path.join(this.config.tempDir, `festival_${Date.now()}.scm`);
            
            const script = `
                (voice_kal_diphone)
                (set! audio_method 'audio_command)
                (set! audio_command "sox -t raw -r 16000 -s -2 - -t wav ${audioFile}")
                (SayText "${speechItem.text}")
            `;
            
            fs.writeFileSync(tempScript, script);
            
            const festival = spawn('festival', ['-b', tempScript]);
            
            festival.on('close', (code) => {
                // Limpar script temporário
                fs.unlinkSync(tempScript);
                
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Festival falhou com código ${code}`));
                }
            });
            
            festival.on('error', reject);
        });
    }
    
    /**
     * Gerar áudio usando Node Speaker (fallback)
     */
    async generateWithNodeSpeaker(speechItem, audioFile) {
        try {
            // Usar biblioteca de síntese simples
            const { createWriteStream } = require('fs');
            const Speaker = require('speaker');
            
            // Implementação básica de síntese
            const sampleRate = this.config.sampleRate;
            const duration = speechItem.text.length * 0.1; // ~100ms por caractere
            const samples = Math.floor(sampleRate * duration);
            
            const buffer = Buffer.alloc(samples * 2); // 16-bit
            
            // Gerar tom simples baseado no texto
            for (let i = 0; i < samples; i++) {
                const frequency = 440 + (speechItem.text.charCodeAt(i % speechItem.text.length) % 200);
                const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
                buffer.writeInt16LE(sample * 32767, i * 2);
            }
            
            fs.writeFileSync(audioFile, buffer);
            
        } catch (error) {
            throw new Error(`Node Speaker falhou: ${error.message}`);
        }
    }
    
    // ===========================================
    // REPRODUÇÃO DE ÁUDIO
    // ===========================================
    
    /**
     * Reproduzir arquivo de áudio
     * @param {string} audioFile - Path do arquivo de áudio
     * @returns {Promise<void>}
     */
    async playAudio(audioFile) {
        return new Promise((resolve, reject) => {
            let player;
            
            if (process.platform === 'win32') {
                // Windows: usar PowerShell
                const script = `
                    Add-Type -AssemblyName presentationCore
                    $mediaPlayer = New-Object System.Windows.Media.MediaPlayer
                    $mediaPlayer.Open([System.Uri]::new("${audioFile}"))
                    $mediaPlayer.Play()
                    Start-Sleep -Seconds 5
                    $mediaPlayer.Close()
                `;
                
                player = spawn('powershell', ['-Command', script]);
            } else if (process.platform === 'darwin') {
                // macOS: usar afplay
                player = spawn('afplay', [audioFile]);
            } else {
                // Linux: usar aplay ou paplay
                player = spawn('aplay', [audioFile]);
            }
            
            player.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Player falhou com código ${code}`));
                }
            });
            
            player.on('error', reject);
        });
    }
    
    /**
     * Parar fala atual
     */
    stopCurrentSpeech() {
        if (this.currentlyPlaying) {
            console.log(`[TTS_SYSTEM] ⏹️ Parando fala atual: "${this.currentlyPlaying.text}"`);
            this.currentlyPlaying = null;
        }
    }
    
    /**
     * Limpar fila de fala
     */
    clearQueue() {
        const cleared = this.speechQueue.length;
        this.speechQueue = [];
        this.stats.queueDropped += cleared;
        console.log(`[TTS_SYSTEM] 🗑️ Fila limpa: ${cleared} itens removidos`);
    }
    
    // ===========================================
    // PROCESSAMENTO DE TEXTO
    // ===========================================
    
    /**
     * Preprocessar texto para TTS
     * @param {string} text - Texto original
     * @returns {string} Texto processado
     */
    preprocessText(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        let processed = text.trim();
        
        // Limitar tamanho
        if (processed.length > this.config.maxLength) {
            processed = processed.substring(0, this.config.maxLength) + '...';
        }
        
        // Limpar caracteres especiais
        processed = processed.replace(/[{}[\]]/g, ''); // Remover colchetes
        processed = processed.replace(/\s+/g, ' '); // Normalizar espaços
        
        // Substituir abreviações comuns do CS2
        processed = processed.replace(/\bCS2\b/g, 'Counter-Strike 2');
        processed = processed.replace(/\bCT\b/g, 'Counter-Terrorist');
        processed = processed.replace(/\bTR\b/g, 'Terrorist');
        processed = processed.replace(/\bAK\b/g, 'AK-47');
        processed = processed.replace(/\bM4\b/g, 'M4A4');
        processed = processed.replace(/\bAWP\b/g, 'AWP');
        processed = processed.replace(/\bHP\b/g, 'Health Points');
        
        // Normalizar números
        processed = processed.replace(/\$(\d+)/g, '$1 dollars');
        processed = processed.replace(/(\d+)%/g, '$1 percent');
        
        return processed;
    }
    
    /**
     * Gerar hash do texto para cache
     * @param {string} text - Texto
     * @returns {string} Hash MD5
     */
    generateTextHash(text) {
        return crypto.createHash('md5').update(text).digest('hex');
    }
    
    // ===========================================
    // CACHE DE ÁUDIO
    // ===========================================
    
    getCachedAudio(hash) {
        const cached = this.audioCache.get(hash);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
            return cached.file;
        }
        
        if (cached) {
            this.audioCache.delete(hash);
        }
        
        return null;
    }
    
    setCachedAudio(hash, file) {
        this.audioCache.set(hash, {
            file,
            timestamp: Date.now()
        });
    }
    
    // ===========================================
    // MÉTODOS ESPECÍFICOS PARA CS2
    // ===========================================
    
    /**
     * Falar dica crítica (bomba plantada, etc.)
     * @param {string} text - Texto da dica
     */
    async speakCritical(text) {
        return await this.speak(text, 'critical', { rate: 1.4, volume: 0.8 });
    }
    
    /**
     * Falar dica tática normal
     * @param {string} text - Texto da dica
     */
    async speakTactical(text) {
        return await this.speak(text, 'normal', { rate: 1.2, volume: 0.7 });
    }
    
    /**
     * Falar informação de economia
     * @param {string} text - Texto da informação
     */
    async speakEconomy(text) {
        return await this.speak(text, 'low', { rate: 1.0, volume: 0.6 });
    }
    
    // ===========================================
    // CONFIGURAÇÃO E STATUS
    // ===========================================
    
    /**
     * Configurar sistema TTS
     * @param {Object} newConfig - Nova configuração
     */
    configure(newConfig) {
        Object.assign(this.config, newConfig);
        console.log('[TTS_SYSTEM] Configuração atualizada:', newConfig);
    }
    
    /**
     * Obter status do sistema
     * @returns {Object} Status atual
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            enabled: this.config.enabled,
            engine: this.ttsEngine,
            currentlyPlaying: this.currentlyPlaying?.text || null,
            queueSize: this.speechQueue.length,
            cacheSize: this.audioCache.size,
            stats: { ...this.stats }
        };
    }
    
    /**
     * Destruir sistema TTS
     */
    destroy() {
        // Parar fala atual
        this.stopCurrentSpeech();
        
        // Limpar fila
        this.clearQueue();
        
        // Limpar cache
        this.audioCache.clear();
        
        // Limpar arquivos temporários
        try {
            if (fs.existsSync(this.config.tempDir)) {
                const files = fs.readdirSync(this.config.tempDir);
                files.forEach(file => {
                    fs.unlinkSync(path.join(this.config.tempDir, file));
                });
            }
        } catch (error) {
            console.warn('[TTS_SYSTEM] ⚠️ Erro ao limpar arquivos temporários:', error.message);
        }
        
        console.log('[TTS_SYSTEM] Sistema TTS destruído');
    }
}

module.exports = TextToSpeechSystem;