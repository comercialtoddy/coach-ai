/**
 * Coach AI - Main Electron Process
 * Processo principal do sistema de coaching inteligente
 * Sistema modular de análise e coaching com IA
 */

const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { MASTER_COACH_PROMPT } = require('../ai/coach/elitePrompt.js');
const GeminiClient = require('../ai/geminiClient.js');
const IntelligentOrchestrator = require('../ai/intelligentOrchestrator.js');
const ExternalAPIIntegration = require('../ai/externalApiIntegration.js');
const OCRSystem = require('../ai/ocrSystem.js');
const TextToSpeechSystem = require('../ai/textToSpeech.js');
const UserConfiguration = require('../config/userConfiguration.js');
const ElitePromptSystem = require('../ai/coach/elitePrompt.js');

class CoachAIApp {
    constructor() {
        this.overlayWindow = null;
        this.apiServer = null;
        this.isOverlayVisible = true;

        // Sistemas principais
        this.userConfig = null;
        this.apiIntegration = null;
        this.ocrSystem = null;
        this.ttsSystem = null;
        this.elitePromptSystem = null;
        this.geminiClient = null;
        this.intelligentOrchestrator = null;
        
        this.init();
    }
    
    init() {
        // Configurar app
        app.whenReady().then(async () => {
            this.createOverlayWindow();
            this.setupGlobalShortcuts();
            this.startAPIServer.bind(this)();
            this.setupIpcHandlers.bind(this)();

            // Inicializar sistemas
            await this.initializeSystems();
            this.setupConfigurationObservers();
        });
        
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });
        
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createOverlayWindow();
            }
        });
        
        app.on('will-quit', () => {
            globalShortcut.unregisterAll();
            this.destroy();
        });
    }
    
    createOverlayWindow() {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;
        
        this.overlayWindow = new BrowserWindow({
            width: width,
            height: height,
            x: 0,
            y: 0,
            transparent: true,
            frame: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: false,
            movable: false,
            minimizable: false,
            maximizable: false,
            closable: true,
            focusable: false,
            show: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                webSecurity: false,
                allowRunningInsecureContent: true
            }
        });
        
        // Configurações específicas do Windows para overlay
        if (process.platform === 'win32') {
            this.overlayWindow.setIgnoreMouseEvents(true, { forward: true });
            this.overlayWindow.setAlwaysOnTop(true, 'pop-up-menu');
        }
        
        // Carregar o overlay
        const overlayPath = path.join(__dirname, '../ui/themes/clean-coach/index.html');
        this.overlayWindow.loadFile(overlayPath);
        
        // Eventos da janela
        this.overlayWindow.once('ready-to-show', () => {
            this.overlayWindow.show();
            this.overlayWindow.focus();
            console.log('[OVERLAY] Overlay window ready');
            console.log('[DEBUG] Press F12 para toggle DevTools');
            console.log('[DEBUG] Use console.log() no renderer para debug');
        });
        
        this.overlayWindow.on('closed', () => {
            this.overlayWindow = null;
        });
        
        // Dev tools sempre ativo para desenvolvimento
        this.overlayWindow.webContents.openDevTools({
            mode: 'detach',
            activate: true
        });
        
        console.log('[DEVTOOLS] DevTools ativado - Console disponível para debug');
    }
    
    setupGlobalShortcuts() {
        // Toggle overlay visibilidade
        globalShortcut.register('F9', () => {
            this.toggleOverlay();
        });
        
        // Toggle mouse events (para configuração)
        globalShortcut.register('F10', () => {
            this.toggleMouseEvents();
        });
        
        // Toggle TTS
        globalShortcut.register('F8', () => {
            this.toggleTTS();
        });
        
        // Toggle análise automática
        globalShortcut.register('F7', () => {
            this.toggleAutoAnalysis();
        });
        
        // Análise manual
        globalShortcut.register('F6', () => {
            this.triggerManualAnalysis();
        });
        
        // Emergency close
        globalShortcut.register('Ctrl+Shift+F12', () => {
            app.quit();
        });
        
        // Toggle DevTools
        globalShortcut.register('F12', () => {
            if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
                if (this.overlayWindow.webContents.isDevToolsOpened()) {
                    this.overlayWindow.webContents.closeDevTools();
                    console.log('[DEVTOOLS] DevTools fechado');
                } else {
                    this.overlayWindow.webContents.openDevTools({
                        mode: 'detach',
                        activate: true
                    });
                    console.log('[DEVTOOLS] DevTools aberto');
                }
            }
        });
    }
    
    async initializeSystems() {
        try {
            console.log('[CORE] 🚀 Inicializando sistemas...');

            // 1. Inicializar configuração do usuário
            this.userConfig = new UserConfiguration();
            console.log('[CORE] ✅ User Configuration inicializado');

            const config = this.userConfig.getConfig();

            // 2. Inicializar Gemini Client
            this.geminiClient = new GeminiClient();
            console.log('[CORE] ✅ Gemini Client inicializado');

            // 3. Inicializar Elite Prompt System
            this.elitePromptSystem = new ElitePromptSystem();
            console.log('[CORE] ✅ Elite Prompt System inicializado');

            // 4. Inicializar APIs externas (se habilitado)
            if (config.game.apiIntegration) {
                this.apiIntegration = new ExternalAPIIntegration();
                console.log('[CORE] ✅ API Integration inicializado');
            }

            // 5. Inicializar OCR (se habilitado)
            if (config.game.ocrEnabled) {
                this.ocrSystem = new OCRSystem();
                console.log('[CORE] ✅ OCR System inicializado');
            }

            // 6. Inicializar TTS (se habilitado)
            if (config.voice.enabled) {
                this.ttsSystem = new TextToSpeechSystem();
                const voiceConfig = this.userConfig.getSection('voice');
                this.ttsSystem.configure(voiceConfig);
                console.log('[CORE] ✅ TTS System inicializado');
            }

            // Inicializar Intelligent Orchestrator (depende de geminiClient e overlayWindow)
            if (this.overlayWindow && this.geminiClient) {
                this.intelligentOrchestrator = new IntelligentOrchestrator(this.geminiClient, this.overlayWindow);
                console.log('[CORE] ✅ Intelligent Orchestrator inicializado');
            }

            console.log('[CORE] ✅ Todos os sistemas principais inicializados com sucesso');

        } catch (error) {
            console.error('[CORE] ❌ Erro na inicialização dos sistemas:', error.message);
        }
    }

    setupConfigurationObservers() {
        if (this.userConfig) {
            this.userConfig.addConfigObserver((newConfig) => {
                this.handleConfigurationChange(newConfig);
            });
        }
    }

    async handleConfigurationChange(newConfig) {
        console.log('[CORE] 🔄 Configuração alterada, atualizando sistemas...');

        // Atualizar TTS
        if (this.ttsSystem && newConfig.voice) {
            this.ttsSystem.configure(newConfig.voice);
        }

        // Reconfigurar sistemas baseado nas mudanças
        if (newConfig.voice.enabled && !this.ttsSystem) {
            this.ttsSystem = new TextToSpeechSystem();
            const voiceConfig = this.userConfig.getSection('voice');
            this.ttsSystem.configure(voiceConfig);
        }

        if (newConfig.game.ocrEnabled && !this.ocrSystem) {
            this.ocrSystem = new OCRSystem();
        }

        if (newConfig.game.apiIntegration && !this.apiIntegration) {
            this.apiIntegration = new ExternalAPIIntegration();
        }
    }

    // Funções para controle dos novos sistemas
    toggleTTS() {
        if (this.ttsSystem) {
            const config = this.userConfig.getConfig();
            const newVoiceEnabled = !config.voice.enabled;
            this.userConfig.updateConfig({
                voice: { enabled: newVoiceEnabled }
            });

            console.log(`[TTS] ${newVoiceEnabled ? 'Habilitado' : 'Desabilitado'}`);
            this.sendStatusToOverlay('tts-toggled', { enabled: newVoiceEnabled });

            // Feedback via TTS
            if (newVoiceEnabled) {
                this.ttsSystem.speak('Text to speech enabled', 'normal');
            }
        }
    }

    toggleAutoAnalysis() {
        if (this.userConfig) {
            const config = this.userConfig.getConfig();
            const newAnalysisEnabled = !config.analysis.autoAnalysisEnabled;
            this.userConfig.updateConfig({
                analysis: { autoAnalysisEnabled: newAnalysisEnabled }
            });

            console.log(`[AUTO_ANALYSIS] ${newAnalysisEnabled ? 'Habilitado' : 'Desabilitado'}`);
            this.sendStatusToOverlay('auto-analysis-toggled', { enabled: newAnalysisEnabled });
        }
    }

    async triggerManualAnalysis() {
        if (this.intelligentOrchestrator) {
            try {
                // Usar dados de análise mais recentes se disponíveis
            const analysisData = {}; // Seria obtido da última análise
                const result = await this.intelligentOrchestrator.performManualAnalysis(
                    analysisData,
                    'manual_analysis',
                    { trigger: 'hotkey' }
                );

                console.log('[MANUAL_ANALYSIS] Análise manual executada');

                if (result.success) {
                    this.sendStatusToOverlay('manual-analysis-complete', result);
                }
            } catch (error) {
                console.error('[MANUAL_ANALYSIS] Erro:', error.message);
            }
        }
    }

    displayAutoInsight(insight, type) {
        console.log(`[AUTO_INSIGHT] ${type}: ${insight}`);

        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
            this.overlayWindow.webContents.send('auto-insight', {
                insight: insight,
                type,
                timestamp: Date.now()
            });
        }
    }

    // Funções auxiliares para comunicação
    sendToOverlay(channel, data) {
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
            this.overlayWindow.webContents.send(channel, data);
        }
    }

    sendStatusToOverlay(event, data) {
        this.sendToOverlay('system-status', { event, data });
    }

    toggleOverlay() {
        if (!this.overlayWindow) return;

        if (this.isOverlayVisible) {
            this.overlayWindow.hide();
            this.isOverlayVisible = false;
            console.log('Overlay hidden');
        } else {
            this.overlayWindow.show();
            this.isOverlayVisible = true;
            console.log('Overlay shown');
        }
    }

    toggleMouseEvents() {
        if (!this.overlayWindow) return;

        const currentlyIgnoring = this.overlayWindow.isIgnoreMouseEvents();
        this.overlayWindow.setIgnoreMouseEvents(!currentlyIgnoring, { forward: true });

        console.log(`Mouse events ${currentlyIgnoring ? 'enabled' : 'disabled'}`);
    }

    getSettings() {
        const baseSettings = {
            overlayVisible: this.isOverlayVisible,
            aiEnabled: this.geminiClient !== null,
            apiConnected: this.apiServer !== null,
            shortcuts: {
                toggleOverlay: 'F9',
                toggleMouse: 'F10',
                toggleTTS: 'F8',
                toggleAutoAnalysis: 'F7',
                manualAnalysis: 'F6',
                emergencyClose: 'Ctrl+Shift+F12'
            }
        };

        // Adicionar status dos sistemas
        baseSettings.systems = {
            userConfig: this.userConfig ? this.userConfig.getConfigStats() : null,
            geminiClient: this.geminiClient ? this.geminiClient.getStats() : null,
            intelligentOrchestrator: this.intelligentOrchestrator ? this.intelligentOrchestrator.getStatus() : null,
            apiIntegration: this.apiIntegration ? this.apiIntegration.getStats() : null,
            ocrSystem: this.ocrSystem ? this.ocrSystem.getStatus() : null,
            ttsSystem: this.ttsSystem ? this.ttsSystem.getStatus() : null,
            elitePromptSystem: this.elitePromptSystem ? this.elitePromptSystem.getOptimizationStats() : null
        };

        return baseSettings;
    }

    // Cleanup
    destroy() {
        if (this.intelligentOrchestrator) {
            this.intelligentOrchestrator.destroy();
        }

        if (this.apiServer) {
            this.apiServer.close();
        }

        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
            this.overlayWindow.close();
        }

        if (this.userConfig) {
            this.userConfig.destroy();
        }

        if (this.apiIntegration) {
            this.apiIntegration.destroy();
        }

        if (this.ocrSystem) {
            this.ocrSystem.destroy();
        }

        if (this.ttsSystem) {
            this.ttsSystem.destroy();
        }

        globalShortcut.unregisterAll();
    }

    // API Server Setup for data input
    startAPIServer() {
        const http = require('http');
        
        try {
            this.apiServer = http.createServer((req, res) => {
                if (req.method === 'POST') {
                    let body = '';
                    
                    req.on('data', chunk => {
                        body += chunk.toString();
                    });
                    
                    req.on('end', () => {
                        try {
                            const inputData = JSON.parse(body);
                            this.handleInputData(inputData);
                        } catch (error) {
                            console.error('[API] Error parsing JSON:', error);
                        }
                        
                        res.writeHead(200, {'Content-Type': 'text/plain'});
                        res.end('OK');
                    });
                } else {
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.end('Coach AI API Server');
                }
            });
            
            this.apiServer.listen(3000, () => {
                console.log('[API] ✅ API Server listening on port 3000');
            });
            
            this.apiServer.on('error', (error) => {
                console.error('[API] ❌ Server error:', error);
            });
            
        } catch (error) {
            console.error('[API] ❌ Failed to start API server:', error);
        }
    }

    // Handle Input Data from various sources
    handleInputData(inputData) {
        try {
            console.log('[API] 📊 Input data received');
            
            // Send data to overlay
            this.sendToOverlay('input-data', inputData);
            
            // Trigger intelligent orchestration if enabled
            if (this.intelligentOrchestrator && this.userConfig) {
                const config = this.userConfig.getConfig();
                if (config.analysis && config.analysis.autoAnalysisEnabled) {
                    this.intelligentOrchestrator.updateAnalysisState(inputData);
                }
            }
            
        } catch (error) {
            console.error('[API] ❌ Error handling input data:', error);
        }
    }

    // MISSING METHOD: Setup IPC Handlers
    setupIpcHandlers() {
        // Master get config
        ipcMain.handle('master-get-config', async (event) => {
            try {
                if (this.userConfig) {
                    return this.userConfig.getConfig();
                }
                return null;
            } catch (error) {
                console.error('[IPC] Error getting config:', error);
                return null;
            }
        });

        // Master update config
        ipcMain.handle('master-update-config', async (event, configUpdate) => {
            try {
                if (this.userConfig) {
                    this.userConfig.updateConfig(configUpdate);
                    return { success: true };
                }
                return { success: false, error: 'UserConfig not available' };
            } catch (error) {
                console.error('[IPC] Error updating config:', error);
                return { success: false, error: error.message };
            }
        });

        // Master speak (TTS)
        ipcMain.handle('master-speak', async (event, text, priority = 'normal') => {
            try {
                if (this.ttsSystem) {
                    await this.ttsSystem.speak(text, priority);
                    return { success: true };
                }
                return { success: false, error: 'TTS system not available' };
            } catch (error) {
                console.error('[IPC] Error speaking:', error);
                return { success: false, error: error.message };
            }
        });

        // Master perform analysis
        ipcMain.handle('master-perform-analysis', async (event, analysisData) => {
            try {
                if (this.intelligentOrchestrator) {
                    const result = await this.intelligentOrchestrator.performManualAnalysis(
                        analysisData.gameData,
                        analysisData.type,
                        analysisData.context
                    );
                    return result;
                }
                return { success: false, error: 'Intelligent Orchestrator not available' };
            } catch (error) {
                console.error('[IPC] Error performing analysis:', error);
                return { success: false, error: error.message };
            }
        });

        // Master apply preset
        ipcMain.handle('master-apply-preset', async (event, presetName) => {
            try {
                if (this.userConfig) {
                    const applied = this.userConfig.applyPreset(presetName);
                    if (applied) {
                        return { success: true };
                    }
                    return { success: false, error: 'Preset not found' };
                }
                return { success: false, error: 'UserConfig not available' };
            } catch (error) {
                console.error('[IPC] Error applying preset:', error);
                return { success: false, error: error.message };
            }
        });

        // Master get player data (external API)
        ipcMain.handle('master-get-player-data', async (event, steamId) => {
            try {
                if (this.apiIntegration) {
                    const data = await this.apiIntegration.getPlayerData(steamId);
                    return data;
                }
                return { error: 'API Integration not available' };
            } catch (error) {
                console.error('[IPC] Error getting player data:', error);
                return { error: error.message };
            }
        });

        // Master get settings
        ipcMain.handle('master-get-settings', async (event) => {
            try {
                return this.getSettings();
            } catch (error) {
                console.error('[IPC] Error getting settings:', error);
                return null;
            }
        });

        // ===========================================
        // INTELLIGENT ORCHESTRATOR TESTING HANDLERS
        // ===========================================

        // Test orchestrator system
        ipcMain.handle('test-orchestrator-system', async (event) => {
            try {
                if (this.intelligentOrchestrator) {
                    await this.intelligentOrchestrator.testSystem();
                    return { success: true, data: 'Orchestrator test completed' };
                }
                return { success: false, error: 'Intelligent Orchestrator not available' };
            } catch (error) {
                console.error('[IPC] Error testing orchestrator:', error);
                return { success: false, error: error.message };
            }
        });

        // Test Gemini connection
        ipcMain.handle('test-gemini-connection', async (event) => {
            try {
                if (this.intelligentOrchestrator) {
                    const result = await this.intelligentOrchestrator.testGeminiConnection();
                    return { success: result, response: result ? 'Gemini connection OK' : 'Gemini connection failed' };
                }
                return { success: false, error: 'Intelligent Orchestrator not available' };
            } catch (error) {
                console.error('[IPC] Error testing Gemini:', error);
                return { success: false, error: error.message };
            }
        });

        // Force coaching test
        ipcMain.handle('force-coaching-test', async (event) => {
            try {
                if (this.intelligentOrchestrator) {
                    await this.intelligentOrchestrator.forceTestCoaching();
                    return { success: true };
                }
                return { success: false, error: 'Intelligent Orchestrator not available' };
            } catch (error) {
                console.error('[IPC] Error forcing coaching test:', error);
                return { success: false, error: error.message };
            }
        });

        // Debug event detection
        ipcMain.handle('debug-event-detection', async (event) => {
            try {
                if (this.intelligentOrchestrator) {
                    await this.intelligentOrchestrator.debugEventDetection();
                    return { success: true, events: 'Event detection debug completed' };
                }
                return { success: false, error: 'Intelligent Orchestrator not available' };
            } catch (error) {
                console.error('[IPC] Error debugging events:', error);
                return { success: false, error: error.message };
            }
        });

        // Get orchestrator status
        ipcMain.handle('get-orchestrator-status', async (event) => {
            try {
                if (this.intelligentOrchestrator) {
                    return this.intelligentOrchestrator.getStatus();
                }
                return { error: 'Intelligent Orchestrator not available' };
            } catch (error) {
                console.error('[IPC] Error getting orchestrator status:', error);
                return { error: error.message };
            }
        });

        // Test text cleaning for TTS
        ipcMain.handle('test-text-cleaning', async (event, text) => {
            try {
                if (this.intelligentOrchestrator) {
                    const cleanedText = this.intelligentOrchestrator.cleanTextForTTS(text);
                    return { success: true, cleanedText };
                }
                return { success: false, error: 'Intelligent Orchestrator not available' };
            } catch (error) {
                console.error('[IPC] Error testing text cleaning:', error);
                return { success: false, error: error.message };
            }
        });

        console.log('[IPC] ✅ All IPC handlers registered (including test handlers)');
    }
}

// Tratamento de erros não capturadas
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Inicializar aplicação
const coachAI = new CoachAIApp();

// Cleanup ao sair
process.on('SIGINT', () => {
    coachAI.destroy();
    process.exit(0);
});

process.on('SIGTERM', () => {
    coachAI.destroy();
    process.exit(0);
});
