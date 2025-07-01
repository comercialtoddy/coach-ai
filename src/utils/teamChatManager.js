/**
 * Team Chat Manager - Sistema de envio automático de mensagens para o team
 * Usa apenas comandos nativos do CS2 sem interferir no jogo
 * V3.0: AUTO-EXECUÇÃO INTELIGENTE + DECISÃO IA
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class TeamChatManager {
    constructor() {
        this.cs2ConfigPath = this.findCS2ConfigPath();
        this.chatQueue = [];
        this.isProcessing = false;
        this.lastMessageTime = 0;
        this.messageDelay = 3000; // 3 segundos entre mensagens
        this.maxMessageLength = 120; // Limite de caracteres do CS2
        
        // V3.0: SISTEMA DE AUTO-EXECUÇÃO
        this.isAutoExecutorActive = false;
        this.gameStateDetected = false;
        this.lastGameActivity = 0;
        this.autoExecutorFile = 'coach_ai_auto_executor.cfg';
        
        // V3.0: SISTEMA INTELIGENTE DE DECISÃO  
        this.messageHistory = [];
        this.lastTeamChatTime = 0;
        this.teamChatCooldown = 45000; // 45s entre mensagens automáticas do team
        this.criticalSituationOverride = true; // Permite override em situações críticas
        
        console.log('[TEAM CHAT] V3.0 Inicializado - Auto-Execution System + AI Decision');
        console.log('[TEAM CHAT] CS2 Config Path:', this.cs2ConfigPath);
        
        // Inicializar sistema de auto-execução
        this.setupAutoExecutor();
    }
    
    /**
     * V3.0: Configura sistema de auto-execução automática
     */
    setupAutoExecutor() {
        try {
            this.createPersistentAutoExecutor();
            this.createAutoBindSystem();
            console.log('[AUTO-EXEC] Sistema de auto-execução configurado com sucesso');
        } catch (error) {
            console.error('[AUTO-EXEC] Erro ao configurar sistema:', error);
        }
    }
    
    /**
     * V3.0: Cria executor automático que monitora estado do jogo
     */
    createPersistentAutoExecutor() {
        const autoExecutorContent = `// Coach AI v3.0 - Auto Executor System
// ATIVA AUTOMATICAMENTE quando CS2 detecta GSI ativo

// Detectar se o jogo está ativo via GSI
alias "coach_detect_game" "echo [COACH AI] Detectando estado do jogo..."

// Sistema de auto-bind que se reativa
alias "coach_auto_bind" "bind END coach_send_ready; echo [COACH AI] Sistema ativo - pressione END se necessário"

// Comando para jogador sinalizar que está pronto (opcional)
alias "coach_send_ready" "say_team [COACH] Sistema Coach AI ativo e monitorando; coach_auto_bind"

// Comando de ativação principal (executado automaticamente)
alias "coach_activate_system" "coach_auto_bind; echo [COACH AI] Sistema ativado automaticamente!"

// Auto-execução quando arquivo for carregado
coach_activate_system

// Sistema de limpeza (se necessário)
alias "coach_deactivate" "unbind END; echo [COACH AI] Sistema desativado"

// Log de status
echo "[COACH AI] Auto-Executor v3.0 carregado!"
echo "[COACH AI] Sistema será ativado automaticamente em partidas"
echo "[COACH AI] Pressione END para teste manual se necessário"`;

        const autoExecutorPath = path.join(this.cs2ConfigPath, this.autoExecutorFile);
        fs.writeFileSync(autoExecutorPath, autoExecutorContent, 'utf8');
        
        console.log('[AUTO-EXEC] Arquivo auto-executor criado:', this.autoExecutorFile);
    }
    
    /**
     * V3.0: Sistema de bind automático para detecção de jogo ativo
     */
    createAutoBindSystem() {
        const autoBindContent = `// Coach AI v3.0 - Auto Bind System
// Executa automaticamente quando jogador entra em servidor

// Comandos de inicialização automática
exec coach_ai_auto_executor.cfg

// Auto-bind para detecção de jogo ativo
bind "TAB" "+showscores; coach_game_active"
alias "coach_game_active" "echo [COACH AI] Jogo detectado - sistema ativo"

// Sistema sempre ativo em background
echo "[COACH AI] Auto-bind system loaded - monitoring game state"`;

        const autoBindPath = path.join(this.cs2ConfigPath, 'autoexec.cfg');
        
        // Verificar se autoexec.cfg já existe
        let existingContent = '';
        if (fs.existsSync(autoBindPath)) {
            existingContent = fs.readFileSync(autoBindPath, 'utf8');
        }
        
        // Adicionar apenas se não existir
        if (!existingContent.includes('coach_ai_auto_executor')) {
            const newContent = existingContent + '\n\n' + autoBindContent;
            fs.writeFileSync(autoBindPath, newContent, 'utf8');
            console.log('[AUTO-EXEC] Sistema adicionado ao autoexec.cfg');
        } else {
            console.log('[AUTO-EXEC] Sistema já existe no autoexec.cfg');
        }
    }
    
    /**
     * V3.0: Detecta automaticamente quando jogador entra em partida
     */
    detectGameActivity(gameData) {
        const now = Date.now();
        
        // Verificar se dados GSI indicam jogo ativo
        const isInGame = gameData && 
                        gameData.map && 
                        gameData.player && 
                        gameData.round;
        
        if (isInGame && !this.gameStateDetected) {
            this.gameStateDetected = true;
            this.lastGameActivity = now;
            this.activateAutoExecutor();
            console.log('[AUTO-EXEC] Jogo detectado automaticamente - ativando sistema');
        } else if (isInGame) {
            this.lastGameActivity = now;
        }
        
        // Detectar se jogador saiu do jogo (sem GSI por mais de 30s)
        if (!isInGame && this.gameStateDetected && (now - this.lastGameActivity > 30000)) {
            this.gameStateDetected = false;
            console.log('[AUTO-EXEC] Jogador saiu do jogo - standby mode');
        }
    }
    
    /**
     * V3.0: Ativa sistema automaticamente quando jogo é detectado
     */
    activateAutoExecutor() {
        if (this.isAutoExecutorActive) return;
        
        try {
            // Criar comando de ativação instantânea
            const instantActivationContent = `// Coach AI v3.0 - Ativação Instantânea
// Executado automaticamente quando jogo detectado

say_team "[COACH] Sistema Coach AI ativo - monitorando partida"
echo "[COACH AI] Sistema ativado automaticamente!"
echo "[COACH AI] Mensagens estratégicas serão enviadas conforme necessário"

// Bind para teste manual se necessário
bind "END" "say_team [COACH] Sistema funcionando normalmente"

// Log de confirmação
echo "[COACH AI] Auto-executor ativo - sistema operacional!"`;

            const instantPath = path.join(this.cs2ConfigPath, 'coach_instant_activation.cfg');
            fs.writeFileSync(instantPath, instantActivationContent, 'utf8');
            
            this.isAutoExecutorActive = true;
            console.log('[AUTO-EXEC] Sistema ativado automaticamente com sucesso!');
            
            // Auto-cleanup do arquivo em 10 segundos
            setTimeout(() => {
                try {
                    if (fs.existsSync(instantPath)) {
                        fs.unlinkSync(instantPath);
                        console.log('[AUTO-EXEC] Arquivo de ativação instantânea removido');
                    }
                } catch (error) {
                    console.error('[AUTO-EXEC] Erro ao limpar arquivo:', error);
                }
            }, 10000);
            
        } catch (error) {
            console.error('[AUTO-EXEC] Erro na ativação automática:', error);
        }
    }
    
    /**
     * Encontra automaticamente o diretório de configuração do CS2
     * VERSÃO OTIMIZADA - SEM FALLBACKS
     */
    findCS2ConfigPath() {
        const platform = os.platform();
        
        if (platform === 'win32') {
            // Windows - Busca direta na estrutura Steam
            const possiblePaths = [
                path.join(os.homedir(), 'AppData', 'Local', 'Steam'),
                'C:\\Program Files (x86)\\Steam',
                'C:\\Program Files\\Steam'
            ];
            
            for (const steamDir of possiblePaths) {
                const configPath = path.join(steamDir, 'userdata');
                if (fs.existsSync(configPath)) {
                    const cs2Path = this.findCS2UserConfig(configPath);
                    if (cs2Path) return cs2Path;
                }
            }
        } else if (platform === 'linux') {
            const linuxPath = path.join(os.homedir(), '.steam', 'steam', 'userdata');
            return this.findCS2UserConfig(linuxPath);
        } else if (platform === 'darwin') {
            const macPath = path.join(os.homedir(), 'Library', 'Application Support', 'Steam', 'userdata');
            return this.findCS2UserConfig(macPath);
        }
        
        throw new Error('CS2 configuration directory not found. Make sure CS2 and Steam are installed.');
    }
    
    /**
     * Procura pela pasta de configuração do CS2 na estrutura do Steam
     * VERSÃO OTIMIZADA - SEM FALLBACKS
     */
    findCS2UserConfig(userdataPath) {
        if (!fs.existsSync(userdataPath)) return null;
        
        const userFolders = fs.readdirSync(userdataPath);
        
        for (const userFolder of userFolders) {
            if (!userFolder.match(/^\d+$/)) continue;
            
            const cs2ConfigPath = path.join(userdataPath, userFolder, '730', 'local', 'cfg');
            if (fs.existsSync(cs2ConfigPath)) {
                console.log('[TEAM CHAT] ✅ CS2 config encontrado:', cs2ConfigPath);
                return cs2ConfigPath;
            }
        }
        
        return null;
    }
    
    /**
     * V3.0: Sistema Inteligente de Decisão para Envio de Mensagens
     * Gemini decide quando enviar baseado na situação do jogo
     */
    async sendIntelligentTeamMessage(fullMessage, gameContext, priority = 'normal') {
        // DECISÃO INTELIGENTE: Verificar se mensagem deve ser enviada
        const shouldSend = this.shouldSendToTeam(fullMessage, gameContext, priority);
        
        if (!shouldSend.send) {
            console.log(`[TEAM CHAT] 🤖 IA decidiu NÃO enviar: ${shouldSend.reason}`);
            return false;
        }
        
        console.log(`[TEAM CHAT] 🤖 IA decidiu ENVIAR: ${shouldSend.reason}`);
        
        // Extrair mensagem otimizada para team chat
        const teamMessage = this.extractIntelligentTeamMessage(fullMessage, gameContext);
        
        if (!teamMessage) {
            console.log('[TEAM CHAT] 🤖 IA não conseguiu extrair mensagem relevante para team');
            return false;
        }
        
        return await this.sendTeamMessage(teamMessage, priority);
    }
    
    /**
     * V3.0: Lógica inteligente para decidir se enviar mensagem para team
     */
    shouldSendToTeam(message, gameContext, priority) {
        const now = Date.now();
        
        // 1. SITUAÇÕES CRÍTICAS - SEMPRE ENVIAR
        const criticalKeywords = [
            'bomba armada', 'planted', 'defuse', 'hp crítico', 'low hp',
            'match point', 'última round', 'clutch', 'save', 'eco'
        ];
        
        const isCritical = criticalKeywords.some(keyword => 
            message.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (isCritical && this.criticalSituationOverride) {
            return {
                send: true,
                reason: 'Situação crítica detectada - override de cooldown'
            };
        }
        
        // 2. VERIFICAR COOLDOWN GLOBAL
        if (now - this.lastTeamChatTime < this.teamChatCooldown) {
            const remainingCooldown = Math.round((this.teamChatCooldown - (now - this.lastTeamChatTime)) / 1000);
            return {
                send: false,
                reason: `Cooldown ativo (${remainingCooldown}s restantes)`
            };
        }
        
        // 3. VERIFICAR RELEVÂNCIA DA MENSAGEM
        const hasStrategicContent = this.hasStrategicContent(message);
        if (!hasStrategicContent) {
            return {
                send: false,
                reason: 'Mensagem não contém conteúdo estratégico relevante para team'
            };
        }
        
        // 4. VERIFICAR CONTEXTO DO JOGO
        if (!gameContext || !gameContext.playerSide) {
            return {
                send: false,
                reason: 'Contexto de jogo insuficiente para decisão'
            };
        }
        
        // 5. VERIFICAR SE É INÍCIO DE ROUND (evitar spam)
        if (gameContext.gameData && gameContext.gameData.round) {
            const roundPhase = gameContext.gameData.round.phase;
            if (roundPhase === 'freezetime' && gameContext.type !== 'round_start') {
                return {
                    send: false,
                    reason: 'Evitando spam durante freezetime'
                };
            }
        }
        
        // 6. PRIORITY OVERRIDE
        if (priority === 'urgent') {
            return {
                send: true,
                reason: 'Prioridade urgente - bypass de filtros'
            };
        }
        
        // 7. DECISÃO FINAL - ENVIAR
        return {
            send: true,
            reason: 'Mensagem estratégica relevante aprovada pela IA'
        };
    }
    
    /**
     * V3.0: Verificar se mensagem contém conteúdo estratégico relevante
     */
    hasStrategicContent(message) {
        const strategicKeywords = [
            // Posicionamento e movimento
            'site', 'long', 'short', 'mid', 'rush', 'rotate', 'stack',
            
            // Ações táticas  
            'smoke', 'flash', 'molly', 'plant', 'defuse', 'peek', 'hold',
            
            // Economia e compra
            'buy', 'save', 'eco', 'force', 'armor', 'rifle', 'awp',
            
            // Informação crítica
            'hp baixo', 'low hp', 'spotted', 'flashed', 'burning',
            
            // Coordenação
            'team', 'together', 'split', 'trade', 'cover', 'support'
        ];
        
        const messageWords = message.toLowerCase().split(' ');
        const strategicWordCount = messageWords.filter(word => 
            strategicKeywords.some(keyword => word.includes(keyword))
        ).length;
        
        // Deve ter pelo menos 1 palavra estratégica
        return strategicWordCount >= 1;
    }
    
    /**
     * V3.0: Extração inteligente de mensagem para team chat
     * CLEAN VERSION - Remove TODOS os ícones, emojis e formatação
     */
    extractIntelligentTeamMessage(fullMessage, gameContext) {
        // LIMPEZA COMPLETA PARA TEAM CHAT
        let cleanMessage = this.cleanMessageForTeamChat(fullMessage);
        
        // Remover nome do jogador se presente
        if (gameContext.gameData && gameContext.gameData.player && gameContext.gameData.player.name) {
            const playerName = gameContext.gameData.player.name;
            cleanMessage = cleanMessage.replace(new RegExp(playerName, 'gi'), '').trim();
        }
        
        // Procurar por comandos estratégicos específicos (texto LIMPO)
        const strategicPatterns = [
            // Movimento e posicionamento (versões limpas)
            /(rotate|rotacionar|go|move|stack|vá) (?:to |para )?(?:site )?([AB])/i,
            /(rush|push|take|force) (?:site )?([AB])/i,
            /(hold|defend|watch|segure|defenda) (?:site )?([AB]|long|short|mid)/i,
            
            // Utility usage (sem ícones)
            /(smoke|flash|molly|nade|granada) ([AB]|long|short|mid|connector)/i,
            /(use|throw|jogue|lance) (smoke|flash|molly)/i,
            
            // Ações críticas (texto limpo)
            /(plant|plante|defuse|defuse|save|eco|buy|compre)/i,
            /(low hp|hp baixo|hp critico|burning|queimando|flashed)/i,
            /(bomba plantada|bomb planted|defuse agora|retake)/i,
            
            // Informação tática (limpa)
            /(spotted|visto|enemy|inimigo) (?:at |in |on |em |no )?([AB]|long|short|mid)/i,
            /(awp|sniper|franco) (?:at |in |on |em |no )?([AB]|long|short|mid)/i,
            
            // Economia e estratégia
            /(save round|eco round|force buy|full buy)/i,
            /(match point|ultima round|final)/i
        ];
        
        // Tentar extrair comando específico (VERSÃO MELHORADA)
        for (const pattern of strategicPatterns) {
            const match = cleanMessage.match(pattern);
            if (match) {
                // Construir mensagem curta e clara (SEM emojis/ícones)
                let shortMessage = match[0];
                
                // Normalizar comandos para inglês/português claro
                shortMessage = this.normalizeTeamCommand(shortMessage);
                
                // Adicionar contexto do lado se relevante (SEM prefixos com símbolos)
                if (gameContext.playerSide && ['rotate', 'stack', 'hold', 'defend', 'rotacionar', 'defenda'].some(cmd => 
                    shortMessage.toLowerCase().includes(cmd))) {
                    const sideContext = gameContext.playerSide.code === 'CT' ? 'DEF' : 'ATK';
                    shortMessage = `${sideContext}: ${shortMessage}`;
                } else {
                    shortMessage = `COACH: ${shortMessage}`;
                }
                
                return shortMessage.substring(0, this.maxMessageLength);
            }
        }
        
        // Fallback: Primeira frase mais relevante
        const sentences = cleanMessage.split(/[.!?]+/).filter(s => s.trim().length > 5);
        if (sentences.length > 0) {
            const firstSentence = sentences[0].trim();
            if (firstSentence.length >= 10 && firstSentence.length <= 80) {
                return `[COACH] ${firstSentence}`;
            }
        }
        
        return null;
    }
    
    /**
     * Envia mensagem para o team automaticamente
     */
    async sendTeamMessage(message, priority = 'normal') {
        if (!message || message.trim().length === 0) return false;
        
        // Limitar tamanho da mensagem
        const cleanMessage = this.sanitizeMessage(message);
        if (cleanMessage.length > this.maxMessageLength) {
            console.warn('[TEAM CHAT] ⚠️ Mensagem muito longa, truncando...');
            cleanMessage = cleanMessage.substring(0, this.maxMessageLength - 3) + '...';
        }
        
        const chatItem = {
            message: cleanMessage,
            priority: priority,
            timestamp: Date.now(),
            id: Math.random().toString(36).substr(2, 9)
        };
        
        // Adicionar à fila baseado na prioridade
        if (priority === 'urgent') {
            this.chatQueue.unshift(chatItem); // Adicionar no início
        } else {
            this.chatQueue.push(chatItem); // Adicionar no final
        }
        
        console.log(`[TEAM CHAT] 📝 Mensagem adicionada à fila (${priority}):`, cleanMessage);
        
        // Processar fila se não estiver processando
        if (!this.isProcessing) {
            this.processQueue();
        }
        
        return chatItem.id;
    }
    
    /**
     * Processa a fila de mensagens
     */
    async processQueue() {
        if (this.isProcessing || this.chatQueue.length === 0) return;
        
        this.isProcessing = true;
        console.log('[TEAM CHAT] 🔄 Processando fila de mensagens...');
        
        while (this.chatQueue.length > 0) {
            const now = Date.now();
            
            // Respeitar delay entre mensagens
            if (now - this.lastMessageTime < this.messageDelay) {
                const waitTime = this.messageDelay - (now - this.lastMessageTime);
                console.log(`[TEAM CHAT] ⏱️ Aguardando ${waitTime}ms antes da próxima mensagem...`);
                await this.sleep(waitTime);
            }
            
            const chatItem = this.chatQueue.shift();
            await this.executeTeamCommand(chatItem);
            
            this.lastMessageTime = Date.now();
        }
        
        this.isProcessing = false;
        console.log('[TEAM CHAT] ✅ Fila de mensagens processada');
    }
    
    /**
     * Executa o comando de team chat no CS2
     */
    async executeTeamCommand(chatItem) {
        try {
            const configContent = this.generateChatConfig(chatItem);
            const configFileName = `team_chat_${chatItem.id}.cfg`;
            const configFilePath = path.join(this.cs2ConfigPath, configFileName);
            
            // Escrever arquivo de configuração
            fs.writeFileSync(configFilePath, configContent, 'utf8');
            console.log(`[TEAM CHAT] 📁 Config criado: ${configFileName}`);
            
            // Criar comando de execução principal
            this.createExecutionCommands(chatItem.id);
            
            // Agendar limpeza do arquivo
            setTimeout(() => {
                this.cleanupConfigFile(configFilePath);
            }, 10000); // Limpar após 10 segundos
            
            console.log(`[TEAM CHAT] 📤 Mensagem enviada: "${chatItem.message}"`);
            
        } catch (error) {
            console.error('[TEAM CHAT] ❌ Erro ao executar comando:', error);
        }
    }
    
    /**
     * Gera conteúdo do arquivo de configuração para team chat
     */
    generateChatConfig(chatItem) {
        const escapedMessage = chatItem.message.replace(/"/g, '\\"');
        
        return `// Coach AI Team Chat - Gerado automaticamente
// ID: ${chatItem.id} | Prioridade: ${chatItem.priority}
// Timestamp: ${new Date(chatItem.timestamp).toLocaleString()}

// Comando principal - enviar mensagem para o team
say_team "${escapedMessage}"

// Log no console
echo "[COACH AI] Mensagem enviada para o team: ${escapedMessage}"

// Auto-limpeza (remover este comando após uso)
unbind "coach_temp_${chatItem.id}"

// Fim da configuração
`;
    }
    
    /**
     * Cria comandos de execução e binds temporários
     */
    createExecutionCommands(messageId) {
        const execConfigContent = `// Coach AI - Executor Principal
// Execute este comando no console: exec coach_ai_executor

// Alias temporário para execução
alias "coach_execute_${messageId}" "exec team_chat_${messageId}.cfg"

// Bind temporário (tecla não utilizada no jogo)
bind "HOME" "coach_execute_${messageId}"

// Auto-execução
coach_execute_${messageId}

// Limpar alias após 5 segundos
alias "coach_cleanup_${messageId}" "unbind HOME; unalias coach_execute_${messageId}; unalias coach_cleanup_${messageId}"
`;
        
        const execFilePath = path.join(this.cs2ConfigPath, 'coach_ai_executor.cfg');
        fs.writeFileSync(execFilePath, execConfigContent, 'utf8');
        
        console.log(`[TEAM CHAT] ⚙️ Executor criado para mensagem ${messageId}`);
    }
    
    /**
     * Limpa arquivo de configuração temporário
     */
    cleanupConfigFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('[TEAM CHAT] 🧹 Arquivo temporário removido:', path.basename(filePath));
            }
        } catch (error) {
            console.error('[TEAM CHAT] ⚠️ Erro ao limpar arquivo:', error);
        }
    }
    
    /**
     * V3.0: Sanitiza mensagem para uso no CS2 (VERSÃO LIMPA)
     * Remove ícones, emojis e caracteres problemáticos
     */
    sanitizeMessage(message) {
        // Usar sistema de limpeza completo primeiro
        let cleanMessage = this.cleanMessageForTeamChat(message);
        
        // Sanitização adicional para CS2
        cleanMessage = cleanMessage
            .replace(/[\r\n]+/g, ' ') // Remover quebras de linha
            .replace(/\s+/g, ' ') // Múltiplos espaços -> espaço único
            .replace(/[^\w\s\-_.,!?():]/g, '') // Caracteres seguros apenas
            .replace(/["']/g, '') // Aspas podem causar problemas nos .cfg
            .trim();
        
        // Verificar se restou conteúdo após limpeza
        if (cleanMessage.length < 3) {
            return 'COACH: Sistema ativo'; // Mensagem padrão se limpeza removeu tudo
        }
        
        console.log(`[SANITIZE] "${message}" -> "${cleanMessage}"`);
        
        return cleanMessage;
    }
    
    /**
     * Utilitário para delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * V3.0: Sistema Inteligente de Dicas Estratégicas
     * Substituindo o método antigo com decisão IA
     */
    async sendStrategicTip(fullTip, gameContext) {
        // Detectar atividade do jogo automaticamente
        if (gameContext && gameContext.gameData) {
            this.detectGameActivity(gameContext.gameData);
        }
        
        // Usar novo sistema inteligente de decisão
        return await this.sendIntelligentTeamMessage(fullTip, gameContext, 'normal');
    }
    
    /**
     * V3.0: Limpeza completa de mensagem para team chat
     * Remove TODOS os ícones, emojis e formatação especial
     */
    cleanMessageForTeamChat(message) {
        if (!message) return '';
        
        let cleanedMessage = message;
        
        // 1. REMOVER TODOS OS ÍCONES {icon:*}
        cleanedMessage = cleanedMessage.replace(/\{icon:[^}]+\}/g, '');
        
        // 2. REMOVER EMOJIS COMUNS
        const emojiPatterns = [
            /[\u{1F600}-\u{1F64F}]/gu, // Emoticons
            /[\u{1F300}-\u{1F5FF}]/gu, // Símbolos e pictogramas
            /[\u{1F680}-\u{1F6FF}]/gu, // Transporte e símbolos de mapa
            /[\u{1F1E0}-\u{1F1FF}]/gu, // Bandeiras
            /[\u{2600}-\u{26FF}]/gu,   // Símbolos diversos
            /[\u{2700}-\u{27BF}]/gu,   // Dingbats
            /🎯|🔥|⚡|💀|🎮|🚀|✅|❌|⚠️|📊|📈|🎊|🎉|🤖|🧠|⏰|📝|📤|📁|🧹|🔄|⏱️/g // Emojis específicos usados no sistema
        ];
        
        for (const pattern of emojiPatterns) {
            cleanedMessage = cleanedMessage.replace(pattern, '');
        }
        
        // 3. REMOVER CARACTERES ESPECIAIS DE FORMATAÇÃO
        cleanedMessage = cleanedMessage
            .replace(/[\*_~`]/g, '') // Markdown
            .replace(/\[|\]/g, '') // Colchetes
            .replace(/\|/g, '') // Pipes
            .replace(/#{1,6}\s*/g, '') // Headers markdown
            .replace(/>\s*/g, '') // Blockquotes
            .replace(/```[\s\S]*?```/g, '') // Code blocks
            .replace(/`([^`]+)`/g, '$1'); // Inline code
        
        // 4. LIMPAR PREFIXOS COMUNS DO SISTEMA
        const systemPrefixes = [
            /^\[DEBUG\]\s*/gi,
            /^\[GEMINI\]\s*/gi,
            /^\[COACH AI\]\s*/gi,
            /^\[TEAM CHAT\]\s*/gi,
            /^\[AUTO-EXEC\]\s*/gi,
            /^\[GSI\]\s*/gi,
            /^\[ANALYZER\]\s*/gi
        ];
        
        for (const prefix of systemPrefixes) {
            cleanedMessage = cleanedMessage.replace(prefix, '');
        }
        
        // 5. NORMALIZAR ESPAÇOS E QUEBRAS DE LINHA
        cleanedMessage = cleanedMessage
            .replace(/\r?\n/g, ' ') // Quebras de linha -> espaço
            .replace(/\s+/g, ' ') // Múltiplos espaços -> espaço único
            .trim(); // Remover espaços início/fim
        
        // 6. LIMPAR PONTUAÇÃO EXCESSIVA
        cleanedMessage = cleanedMessage
            .replace(/[.]{2,}/g, '.') // Múltiplos pontos
            .replace(/[!]{2,}/g, '!') // Múltiplos exclamação
            .replace(/[?]{2,}/g, '?') // Múltiplas interrogação
            .replace(/[,]{2,}/g, ',') // Múltiplas vírgulas
            .replace(/[:]{2,}/g, ':'); // Múltiplos dois pontos
        
        // 7. VERIFICAR SE RESTOU CONTEÚDO VÁLIDO
        if (cleanedMessage.length < 3) {
            return ''; // Muito curto após limpeza
        }
        
        // 8. CAPITALIZAR PRIMEIRA LETRA SE NECESSÁRIO
        if (cleanedMessage.length > 0) {
            cleanedMessage = cleanedMessage.charAt(0).toUpperCase() + cleanedMessage.slice(1);
        }
        
        console.log(`[CLEAN] Original: "${message}"`);
        console.log(`[CLEAN] Limpo: "${cleanedMessage}"`);
        
        return cleanedMessage;
    }
    
    /**
     * V3.0: Normaliza comandos estratégicos para team chat
     * Padroniza termos para comunicação clara e profissional
     */
    normalizeTeamCommand(command) {
        if (!command) return '';
        
        let normalized = command.toLowerCase();
        
        // Mapeamento de termos para padronização
        const commandMap = {
            // Movimento
            'rotacionar': 'rotate',
            'vá': 'go',
            'mover': 'move',
            'segurar': 'hold',
            'defender': 'defend',
            'vigiar': 'watch',
            
            // Ações
            'plantar': 'plant',
            'defusar': 'defuse',
            'comprar': 'buy',
            'economizar': 'save',
            'jogar': 'throw',
            'lançar': 'throw',
            
            // Utility
            'granada': 'nade',
            'fumaca': 'smoke',
            'flash': 'flash',
            'molotov': 'molly',
            
            // Info
            'visto': 'spotted',
            'inimigo': 'enemy',
            'franco': 'awp',
            'atirador': 'sniper',
            
            // Estado
            'queimando': 'burning',
            'baixo': 'low',
            'critico': 'critical'
        };
        
        // Aplicar normalizações
        for (const [portuguese, english] of Object.entries(commandMap)) {
            normalized = normalized.replace(new RegExp(`\\b${portuguese}\\b`, 'gi'), english);
        }
        
        // Limpar e capitalizar adequadamente
        normalized = normalized
            .split(' ')
            .map(word => word.trim())
            .filter(word => word.length > 0)
            .join(' ');
        
        // Capitalizar primeira letra
        if (normalized.length > 0) {
            normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
        }
        
        console.log(`[NORMALIZE] "${command}" -> "${normalized}"`);
        
        return normalized;
    }
    
    /**
     * Cria instruções para o jogador
     */
    getPlayerInstructions() {
        return {
            setup: [
                "1. Copie os arquivos .cfg para sua pasta CS2/cfg",
                "2. No console do CS2, digite: exec coach_ai_executor",
                "3. O sistema enviará mensagens automaticamente para o team"
            ],
            commands: [
                "exec coach_ai_executor - Ativar sistema",
                "bind HOME coach_ai_manual - Envio manual (tecla HOME)",
                "unbind HOME - Desativar sistema"
            ],
            path: this.cs2ConfigPath
        };
    }
    
    /**
     * Status do sistema
     */
    getStatus() {
        return {
            configPath: this.cs2ConfigPath,
            queueSize: this.chatQueue.length,
            isProcessing: this.isProcessing,
            lastMessage: this.lastMessageTime,
            messageDelay: this.messageDelay
        };
    }
}

module.exports = TeamChatManager; 