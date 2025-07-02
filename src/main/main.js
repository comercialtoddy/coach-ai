/**
 * CS2 Coach AI - Main Electron Process
 * Processo principal do overlay competitivo
 */

const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { MASTER_COACH_PROMPT, buildPromptWithGSI } = require('../coach/prompt.js');
const GeminiClient = require('../utils/geminiClient.js');
const AutoAnalyzer = require('../utils/autoAnalyzer.js');

class CoachAIApp {
    constructor() {
        this.overlayWindow = null;
        this.geminiClient = null;
        this.autoAnalyzer = null;
        this.gsiServer = null;
        this.isOverlayVisible = true;
        
        this.init();
    }
    
    init() {
        // Configurar app
        app.whenReady().then(() => {
            this.createOverlayWindow();
            this.setupGlobalShortcuts();
            // AI será inicializado após overlay estar pronto
            this.startGSIServer();
            this.setupIpcHandlers();
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
        const overlayPath = path.join(__dirname, '../themes/clean-coach/index.html');
        this.overlayWindow.loadFile(overlayPath);
        
        // Eventos da janela
        this.overlayWindow.once('ready-to-show', () => {
            this.overlayWindow.show();
            this.overlayWindow.focus();
                    console.log('[OVERLAY] Overlay window ready');
        console.log('[DEBUG] Press F12 para toggle DevTools');
        console.log('[DEBUG] Use console.log() no renderer para debug');
            
            // Inicializar AI após overlay estar pronto
            this.initializeAI();
        });
        
        this.overlayWindow.on('closed', () => {
            this.overlayWindow = null;
        });
        
        // Dev tools sempre ativo para desenvolvimento
        this.overlayWindow.webContents.openDevTools({
            mode: 'detach',
            activate: true
        });
        
        // Log adicional para debug
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
    
        initializeAI() {
        try {
            this.geminiClient = new GeminiClient();
            // Esperar o overlay estar pronto antes de inicializar o autoAnalyzer
            if (this.overlayWindow) {
                this.autoAnalyzer = new AutoAnalyzer(this.geminiClient, this.overlayWindow);
            }
            console.log('[AI] AI Coach initialized with AutoAnalyzer');
            console.log('[GEMINI] Gemini 2.5 Flash connected to AutoAnalyzer');
        } catch (error) {
            console.error('Failed to initialize AI:', error);
        }
    }
    
    startGSIServer() {
        // Inicializar servidor GSI para receber dados do CS2
        const http = require('http');
        
        this.gsiServer = http.createServer((req, res) => {
            if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                
                req.on('end', () => {
                    try {
                        const gameData = JSON.parse(body);
                        this.handleCS2Data(gameData);
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('OK');
  } catch (error) {
                        console.error('Error parsing GSI data:', error);
                        res.writeHead(400);
                        res.end('Bad Request');
                    }
                });
    } else {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('CS2 Coach AI GSI Server');
            }
        });
        
        this.gsiServer.listen(3000, () => {
            console.log('GSI Server listening on port 3000');
        });
    }
    
    setupIpcHandlers() {
        // Handler para requisições do Coach AI
        ipcMain.on('coach-request', async (event, data) => {
            try {
                await this.handleCoachRequest(data);
        } catch (error) {
                console.error('Error handling coach request:', error);
                event.reply('coach-response', {
                    error: true,
                    message: 'Failed to get AI response. Please try again.'
                });
            }
        });
        
        // Handler para configurações
        ipcMain.on('toggle-overlay', () => {
            this.toggleOverlay();
        });
        
        ipcMain.on('get-settings', (event) => {
            event.reply('settings-data', this.getSettings());
        });
    }
    
        async handleCoachRequest(requestData) {
        if (!this.geminiClient) {
            throw new Error('AI not initialized');
        }
        
        const { message, gameContext, timestamp } = requestData;
        
        try {
            // Usar prompt simplificado com dados GSI integrados
            const promptData = buildPromptWithGSI('auto_analysis', gameContext.gameData);
            
            // Modificar user prompt para incluir pergunta do usuário
            const userPrompt = `PERGUNTA DO USUÁRIO: ${message}\n\n${promptData.userPrompt}`;
            
            // Enviar para Gemini
            const response = await this.geminiClient.generateResponse(
                userPrompt,
                promptData.systemPrompt
            );
            
            // Enviar resposta para o renderer
            if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
                this.overlayWindow.webContents.send('coach-response', {
                    success: true,
                    message: response,
                    metadata: promptData.metadata,
                    timestamp: Date.now()
                });
            }
            
        } catch (error) {
            console.error('Error in coach request:', error);
            
            if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
                this.overlayWindow.webContents.send('coach-response', {
                    success: false,
                    error: true,
                    message: 'AI Coach is temporarily unavailable. Please try again.',
                    timestamp: Date.now()
                });
            }
        }
    }
    
    handleCS2Data(gameData) {
        // Processar dados do CS2 GSI
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
            this.overlayWindow.webContents.send('cs2-data', gameData);
        }
        
        // Auto análise com Gemini real
        if (this.autoAnalyzer) {
            this.autoAnalyzer.updateGameState(gameData);
        }
        
        // Log para desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            console.log('CS2 Data received:', {
                round: gameData.round?.phase,
                player: gameData.player?.name,
                map: gameData.map?.name
            });
        }
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
      return {
            overlayVisible: this.isOverlayVisible,
            aiEnabled: this.geminiClient !== null,
            gsiConnected: this.gsiServer !== null,
            shortcuts: {
                toggleOverlay: 'F9',
                toggleMouse: 'F10',
                emergencyClose: 'Ctrl+Shift+F12'
            }
        };
    }
    
    // Cleanup
    destroy() {
        if (this.autoAnalyzer) {
            this.autoAnalyzer.destroy();
        }
        
        if (this.gsiServer) {
            this.gsiServer.close();
        }
        
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
            this.overlayWindow.close();
        }
        
        globalShortcut.unregisterAll();
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