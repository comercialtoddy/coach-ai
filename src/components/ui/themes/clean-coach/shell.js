/**
 * CS2 Coach AI - Shell JavaScript
 * Overlay simplificado - ATUALIZADO com integração completa dos novos sistemas
 * Suporte para: Master Integration, TTS, OCR, APIs Externas, Configuração Avançada
 */

class CoachAI {
    constructor() {
        this.elements = {
            coachResponse: document.getElementById('coach-response'),
            coachStatus: document.getElementById('coach-status')
        };
        
        this.gameData = null;
        
        // NOVO: Estado dos sistemas
        this.systemStatus = {
            masterIntegration: false,
            tts: false,
            ocr: false,
            apiIntegration: false,
            autoAnalysis: true
        };
        
        // NOVO: Configuração do usuário
        this.userConfig = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeAutoAnalyzer();
        this.setupMasterIntegrationListeners();
        this.loadUserConfiguration();
        
        console.log('[INIT] Coach AI Display initialized - Auto insights + Master Integration');
        console.log('[OVERLAY] Ready for automated CS2 coaching insights');
        console.log('[ANALYZER] Auto analyzer ready for proactive insights');
        console.log('[MASTER] Master Integration listener configured');
        
        // Debug info adicional
        if (window.debugUtils) {
            window.debugUtils.log('Coach AI Display instance created with Master Integration', 'success');
        }
    }
    
    async initializeAutoAnalyzer() {
        // AutoAnalyzer real está no main process - apenas configurar receptor
        this.setupAutoInsightListener();
        console.log('[LISTENER] Auto Analyzer listener configurado');
    }
    
    // NOVO: Configurar listeners do Master Integration
    setupMasterIntegrationListeners() {
        if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
            const { ipcRenderer } = require('electron');
            
            // Status do sistema
            ipcRenderer.on('system-status', (event, data) => {
                this.handleSystemStatus(data);
            });
            
            // Configuração alterada
            ipcRenderer.on('config-changed', (event, config) => {
                this.handleConfigurationChange(config);
            });
            
            // Erros de API
            ipcRenderer.on('api-error', (event, error) => {
                this.handleAPIError(error);
            });
            
            console.log('[MASTER] 🔗 Master Integration listeners configurados');
        }
    }
    
    // NOVO: Carregar configuração do usuário
    async loadUserConfiguration() {
        if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
            const { ipcRenderer } = require('electron');
            
            try {
                this.userConfig = await ipcRenderer.invoke('master-get-config');
                if (this.userConfig) {
                    this.applyUserConfiguration();
                    console.log('[CONFIG] ✅ Configuração do usuário carregada');
                }
            } catch (error) {
                console.warn('[CONFIG] ⚠️ Erro ao carregar configuração:', error.message);
            }
        }
    }
    
    // NOVO: Aplicar configuração do usuário à interface
    applyUserConfiguration() {
        if (!this.userConfig) return;
        
        // Aplicar configurações do overlay
        if (this.userConfig.overlay) {
            document.body.style.opacity = this.userConfig.overlay.opacity;
            
            // Aplicar tema
            document.body.className = `theme-${this.userConfig.overlay.theme}`;
            
            // Configurar fade out
            if (this.userConfig.overlay.fadeOutDelay) {
                this.fadeOutDelay = this.userConfig.overlay.fadeOutDelay;
            }
        }
        
        // Atualizar status dos sistemas
        this.systemStatus.tts = this.userConfig.voice?.enabled || false;
        this.systemStatus.ocr = this.userConfig.game?.ocrEnabled || false;
        this.systemStatus.apiIntegration = this.userConfig.game?.apiIntegration || false;
        this.systemStatus.autoAnalysis = this.userConfig.analysis?.autoAnalysisEnabled || true;
        
        this.updateStatusDisplay();
    }
    
    // NOVO: Atualizar display de status
    updateStatusDisplay() {
        const statusText = [];
        
        if (this.systemStatus.masterIntegration) statusText.push('🤖 Master');
        if (this.systemStatus.tts) statusText.push('🔊 TTS');
        if (this.systemStatus.ocr) statusText.push('👁️ OCR');
        if (this.systemStatus.apiIntegration) statusText.push('🌐 APIs');
        if (this.systemStatus.autoAnalysis) statusText.push('🔍 Auto');
        
        if (this.elements.coachStatus) {
            this.elements.coachStatus.title = `Sistemas ativos: ${statusText.join(' ')}`;
        }
    }
    
    setupEventListeners() {
        // Prevenir context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // NOVO: Hotkeys para controle dos sistemas
        document.addEventListener('keydown', (e) => {
            this.handleHotkeys(e);
        });
        
        // Manter status ativo
        this.elements.coachStatus.style.background = 'var(--active-primary)';
    }
    
    // NOVO: Controle via hotkeys
    handleHotkeys(event) {
        // Verificar se não estamos em um input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Ctrl+T: Toggle TTS
        if (event.ctrlKey && event.key === 't') {
            event.preventDefault();
            this.toggleTTS();
        }
        
        // Ctrl+A: Toggle Auto Analysis
        if (event.ctrlKey && event.key === 'a') {
            event.preventDefault();
            this.toggleAutoAnalysis();
        }
        
        // Ctrl+M: Manual Analysis
        if (event.ctrlKey && event.key === 'm') {
            event.preventDefault();
            this.triggerManualAnalysis();
        }
        
        // Ctrl+S: Speak last insight
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            this.speakLastInsight();
        }
    }
    
    // NOVO: Funções de controle dos sistemas
    async toggleTTS() {
        if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
            const { ipcRenderer } = require('electron');
            
            try {
                const newState = !this.systemStatus.tts;
                await ipcRenderer.invoke('master-update-config', {
                    voice: { enabled: newState }
                });
                
                this.systemStatus.tts = newState;
                this.updateStatusDisplay();
                
                const message = newState ? 'TTS Habilitado' : 'TTS Desabilitado';
                this.displayResponse(message, 'success');
                
                // Se estamos habilitando, testar
                if (newState) {
                    await ipcRenderer.invoke('master-speak', 'Text to speech system enabled', 'normal');
                }
                
            } catch (error) {
                console.error('[TTS] Erro ao alterar:', error);
                this.displayResponse('Erro ao alterar TTS', 'error');
            }
        }
    }
    
    async toggleAutoAnalysis() {
        if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
            const { ipcRenderer } = require('electron');
            
            try {
                const newState = !this.systemStatus.autoAnalysis;
                await ipcRenderer.invoke('master-update-config', {
                    analysis: { autoAnalysisEnabled: newState }
                });
                
                this.systemStatus.autoAnalysis = newState;
                this.updateStatusDisplay();
                
                const message = newState ? 'Análise Automática Habilitada' : 'Análise Automática Desabilitada';
                this.displayResponse(message, 'success');
                
            } catch (error) {
                console.error('[AUTO_ANALYSIS] Erro ao alterar:', error);
                this.displayResponse('Erro ao alterar análise automática', 'error');
            }
        }
    }
    
    async triggerManualAnalysis() {
        if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
            const { ipcRenderer } = require('electron');
            
            try {
                this.displayResponse('Executando análise manual...', 'normal');
                
                // Trigger análise manual
                // O main process vai pegar os dados GSI mais recentes
                const result = await ipcRenderer.invoke('master-perform-analysis', {
                    type: 'manual_analysis',
                    gameData: this.gameData || {},
                    context: { trigger: 'manual_hotkey' }
                });
                
                if (result && result.success) {
                    console.log('[MANUAL_ANALYSIS] ✅ Análise executada com sucesso');
                } else {
                    this.displayResponse('Análise manual não disponível no momento', 'error');
                }
                
            } catch (error) {
                console.error('[MANUAL_ANALYSIS] Erro:', error);
                this.displayResponse('Erro na análise manual', 'error');
            }
        }
    }
    
    async speakLastInsight() {
        if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
            const { ipcRenderer } = require('electron');
            
            try {
                const lastInsight = this.elements.coachResponse.textContent;
                if (lastInsight && lastInsight.trim()) {
                    await ipcRenderer.invoke('master-speak', lastInsight, 'normal');
                    console.log('[TTS] 🔊 Falando último insight');
                } else {
                    this.displayResponse('Nenhum insight para falar', 'error');
                }
                
            } catch (error) {
                console.error('[TTS] Erro ao falar:', error);
                this.displayResponse('Erro no TTS', 'error');
            }
        }
    }
    
    // NOVO: Aplicar presets de configuração
    async applyPreset(presetName) {
        if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
            const { ipcRenderer } = require('electron');
            
            try {
                await ipcRenderer.invoke('master-apply-preset', presetName);
                this.displayResponse(`Preset ${presetName} aplicado`, 'success');
                
                // Recarregar configuração
                setTimeout(() => {
                    this.loadUserConfiguration();
                }, 1000);
                
            } catch (error) {
                console.error('[PRESET] Erro ao aplicar:', error);
                this.displayResponse(`Erro ao aplicar preset ${presetName}`, 'error');
            }
        }
    }
    
    // NOVO: Obter dados externos de um jogador
    async getPlayerExternalData(steamId) {
        if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
            const { ipcRenderer } = require('electron');
            
            try {
                this.displayResponse(`Obtendo dados externos para ${steamId}...`, 'normal');
                
                const data = await ipcRenderer.invoke('master-get-player-data', steamId);
                
                if (data && !data.error) {
                    console.log('[EXTERNAL_DATA] ✅ Dados obtidos:', data);
                    this.displayResponse('Dados externos obtidos com sucesso', 'success');
                    return data;
                } else {
                    this.displayResponse(`Erro: ${data.error || 'Dados não disponíveis'}`, 'error');
                    return null;
                }
                
            } catch (error) {
                console.error('[EXTERNAL_DATA] Erro:', error);
                this.displayResponse('Erro ao obter dados externos', 'error');
                return null;
            }
        }
    }
    
    // NOVO: Handlers para eventos do sistema
    handleSystemStatus(statusData) {
        console.log('[SYSTEM_STATUS]', statusData);
        
        if (statusData.event === 'system-initialized') {
            this.systemStatus.masterIntegration = true;
            this.updateStatusDisplay();
            this.displayResponse('Sistema Master Integration inicializado', 'success');
        }
        
        if (statusData.event === 'tts-toggled') {
            this.systemStatus.tts = statusData.data.enabled;
            this.updateStatusDisplay();
        }
        
        if (statusData.event === 'auto-analysis-toggled') {
            this.systemStatus.autoAnalysis = statusData.data.enabled;
            this.updateStatusDisplay();
        }
        
        if (statusData.event === 'manual-analysis-complete') {
            console.log('[MANUAL_ANALYSIS] Completa:', statusData.data);
        }
    }
    
    handleConfigurationChange(newConfig) {
        console.log('[CONFIG_CHANGE] Nova configuração recebida');
        this.userConfig = newConfig;
        this.applyUserConfiguration();
        this.displayResponse('Configuração atualizada', 'success');
    }
    
    handleAPIError(error) {
        console.warn('[API_ERROR]', error);
        this.displayResponse(`API Error: ${error.service} - ${error.error}`, 'error');
    }
    
    async displayResponse(response, type = 'normal') {
        const responseElement = this.elements.coachResponse;
        
        // Adicionar animação
        responseElement.classList.add('fade-in');
        
        try {
            console.log('[DISPLAY] Iniciando processamento de ícones para:', response.substring(0, 50) + '...');
            
            // Processar texto com sistema de ícones
            let processedText = response;
            
            if (window.IconSystem) {
                console.log('[DISPLAY] 🎯 Sistema de ícones disponível, processando...');
                
                // USAR PROCESSAMENTO SUPER ROBUSTO para garantir remoção total dos colchetes
                if (window.IconSystem.processTextSuperRobust) {
                    processedText = await window.IconSystem.processTextSuperRobust(response);
                    console.log('[DISPLAY] 🚀 Processamento SUPER ROBUSTO concluído');
                } else {
                    // Fallback para método padrão
                    console.log('[DISPLAY] ⚠️ Usando processamento padrão como fallback');
                    
                    // Auto-detectar itens do jogo e adicionar ícones
                    processedText = await window.IconSystem.autoAddIcons(response);
                    console.log('[DISPLAY] Auto-detecção completa:', processedText.substring(0, 50) + '...');
                    
                    // Processar ícones manuais {icon:nome}
                    processedText = await window.IconSystem.processTextWithIcons(processedText);
                    console.log('[DISPLAY] Processamento manual completo:', processedText.substring(0, 50) + '...');
                }
            } else {
                console.warn('[DISPLAY] ❌ Sistema de ícones não disponível!');
            }
            
            // LIMPEZA FINAL OBRIGATÓRIA: Garantir que NENHUM padrão {icon:*} sobrou
            if (window.IconSystem && window.IconSystem.cleanAllIconPatterns) {
                processedText = window.IconSystem.cleanAllIconPatterns(processedText);
                console.log('[DISPLAY] 🧹 Limpeza final aplicada');
            } else {
                // LIMPEZA DE EMERGÊNCIA: Se IconSystem não estiver disponível
                console.warn('[DISPLAY] ⚠️ IconSystem não disponível, aplicando limpeza de emergência');
                processedText = processedText.replace(/\{icon:[^}]*\}/gi, '');
                console.log('[DISPLAY] 🚨 Limpeza de emergência aplicada');
            }
            
            // Definir conteúdo baseado no tipo - AGORA COM HTML DIRETO
            if (type === 'error') {
                responseElement.innerHTML = `<span style="color: var(--error);">${processedText}</span>`;
            } else if (type === 'success') {
                responseElement.innerHTML = `<span style="color: var(--success);">${processedText}</span>`;
            } else {
                responseElement.innerHTML = processedText; // Mudado de textContent para innerHTML
            }
            
            console.log('[DISPLAY] ✅ Conteúdo definido (SEM COLCHETES):', processedText.substring(0, 100));
            
        } catch (error) {
            console.error('[DISPLAY] Erro ao processar ícones:', error);
            // Fallback para texto simples
            if (type === 'error') {
                responseElement.innerHTML = `<span style="color: var(--error);">${response}</span>`;
            } else if (type === 'success') {
                responseElement.innerHTML = `<span style="color: var(--success);">${response}</span>`;
            } else {
                responseElement.textContent = response;
            }
        }
        
        // Scroll para o final
        responseElement.scrollTop = responseElement.scrollHeight;
        
        // Remover animação após completar
        setTimeout(() => {
            responseElement.classList.remove('fade-in');
        }, 250);
        
        // NOVO: Auto fade-out se configurado
        if (this.userConfig?.overlay?.fadeOutDelay && type !== 'error') {
            setTimeout(() => {
                responseElement.style.opacity = '0.3';
                setTimeout(() => {
                    responseElement.style.opacity = '1';
                }, 2000);
            }, this.userConfig.overlay.fadeOutDelay);
        }
        
        console.log('[DISPLAY] Response shown with icons:', response.substring(0, 50) + '...');
    }
    
    updateGameData(data) {
        this.gameData = data;
        
        // Verificar se dados do player estão chegando
        if (!data.player) {
            console.log('[WARNING] Player data missing - verifique GSI config');
        }
        
        console.log('[DATA] Game data received for AI context:', {
            player: data.player?.name || 'MISSING',
            team: data.player?.team || 'MISSING',
            round: data.round?.phase,
            map: data.map?.name,
            hasPlayer: !!data.player
        });
        
        // NOVO: Detectar SteamID para dados externos
        if (data.player?.steamid && this.systemStatus.apiIntegration) {
            // Opcional: buscar dados externos automaticamente em certas situações
            // this.getPlayerExternalData(data.player.steamid);
        }
        
        // Debug detalhado
        if (window.debugUtils) {
            window.debugUtils.log(`Game data updated: ${JSON.stringify(data, null, 2)}`, 'info');
        }
        
        // AutoAnalyzer real está rodando no main process - insights virão via IPC
    }
    
    setupAutoInsightListener() {
        // Configurar receptor de insights do AutoAnalyzer (main process)
        if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
            const { ipcRenderer } = require('electron');
            
            ipcRenderer.on('auto-insight', (event, data) => {
                console.log('[GEMINI INSIGHT RECEIVED]:', data.insight);
                this.displayResponse(data.insight, 'success');
            });
            
            // Listener para respostas manuais (caso ainda venham)
            ipcRenderer.on('coach-response', (event, response) => {
                if (response.success) {
                    this.displayResponse(response.message, 'success');
                } else {
                    this.displayResponse(response.message || 'AI Coach error', 'error');
                }
            });
            
            console.log('🔗 Auto insight listener configurado via IPC');
        }
    }
    
    // NOVO: Métodos públicos para controle externo
    getSystemStatus() {
        return {
            ...this.systemStatus,
            userConfig: this.userConfig,
            gameData: this.gameData
        };
    }
    
    // NOVO: Interface para debug e desenvolvimento
    debugCommands() {
        return {
            // Controle de sistemas
            toggleTTS: () => this.toggleTTS(),
            toggleAutoAnalysis: () => this.toggleAutoAnalysis(),
            triggerManualAnalysis: () => this.triggerManualAnalysis(),
            speakLastInsight: () => this.speakLastInsight(),
            
            // Presets
            applyBeginnerPreset: () => this.applyPreset('beginner'),
            applyIntermediatePreset: () => this.applyPreset('intermediate'),
            applyAdvancedPreset: () => this.applyPreset('advanced'),
            applyProfessionalPreset: () => this.applyPreset('professional'),
            applyMinimalPreset: () => this.applyPreset('minimal'),
            
            // Dados externos
            getPlayerData: (steamId) => this.getPlayerExternalData(steamId),
            
            // Status
            getStatus: () => this.getSystemStatus(),
            
            // Teste
            testTTS: (text) => this.speakText(text || 'Test message from CS2 Coach AI'),
            testDisplay: (message) => this.displayResponse(message || 'Test message', 'success')
        };
    }
    
    async speakText(text) {
        if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
            const { ipcRenderer } = require('electron');
            
            try {
                await ipcRenderer.invoke('master-speak', text, 'normal');
                console.log('[TTS] 🔊 Falando:', text);
            } catch (error) {
                console.error('[TTS] Erro ao falar:', error);
            }
        }
    }
    
    destroy() {
        // AutoAnalyzer cleanup é feito no main process
        console.log('[SHUTDOWN] Coach AI Display destroyed');
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.CoachAI = new CoachAI();
    
    // NOVO: Expor comandos de debug no console
    window.debugCommands = window.CoachAI.debugCommands();
    
    console.log('[DEBUG] 🛠️ Comandos disponíveis no console:');
    console.log('window.debugCommands - Lista de comandos de debug');
    console.log('Ctrl+T - Toggle TTS');
    console.log('Ctrl+A - Toggle Auto Analysis');
    console.log('Ctrl+M - Manual Analysis');
    console.log('Ctrl+S - Speak Last Insight');
});

// Cleanup ao fechar
window.addEventListener('beforeunload', () => {
    if (window.CoachAI) {
        window.CoachAI.destroy();
    }
}); 