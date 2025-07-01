/**
 * CS2 Coach AI - Debug Utilities
 * Utilitários para debug e desenvolvimento
 */

class DebugUtils {
    constructor() {
        this.isDebugMode = true;
        this.logHistory = [];
        this.maxLogs = 100;
        this.debugActive = true;
        this.init();
    }
    
    init() {
        if (!this.isDebugMode) return;
        
        // Adicionar indicador visual de debug
        this.addDebugIndicator();
        
        // Interceptar console.log para histórico
        this.interceptConsole();
        
        // Adicionar atalhos de debug
        this.setupDebugShortcuts();
        
        // Log inicial
        this.log('[DEBUG] Debug mode ativado', 'info');
        this.log('[COMMANDS] Comandos disponíveis:', 'info');
        this.log('  - Ctrl+D: Toggle debug info', 'info');
        this.log('  - Ctrl+L: Mostrar logs', 'info');
        this.log('  - Ctrl+C: Limpar console', 'info');
        
        console.log('[DEBUG] Debug utils carregado!');
        console.log('[HELP] Use: testCoach(), testGame(), debugInfo(), logs()');
        
        this.setupGlobalFunctions();
    }
    
    addDebugIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'debug-indicator';
        indicator.innerHTML = '[DEV]';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #FF6B6B;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            z-index: 10002;
            font-family: monospace;
            pointer-events: none;
        `;
        document.body.appendChild(indicator);
    }
    
    interceptConsole() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.log = (...args) => {
            this.logHistory.push({
                type: 'log',
                args: args,
                timestamp: new Date().toISOString()
            });
            originalLog.apply(console, args);
        };
        
        console.error = (...args) => {
            this.logHistory.push({
                type: 'error',
                args: args,
                timestamp: new Date().toISOString()
            });
            originalError.apply(console, args);
        };
        
        console.warn = (...args) => {
            this.logHistory.push({
                type: 'warn',
                args: args,
                timestamp: new Date().toISOString()
            });
            originalWarn.apply(console, args);
        };
    }
    
    setupDebugShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!e.ctrlKey) return;
            
            switch (e.key.toLowerCase()) {
                case 'd':
                    e.preventDefault();
                    this.toggleDebugInfo();
                    break;
                case 'l':
                    e.preventDefault();
                    this.showLogs();
                    break;
                case 'c':
                    e.preventDefault();
                    this.clearConsole();
                    break;
            }
        });
    }
    
    toggleDebugInfo() {
        let debugPanel = document.getElementById('debug-panel');
        
        if (debugPanel) {
            debugPanel.remove();
            return;
        }
        
        debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            width: 300px;
            background: rgba(0, 0, 0, 0.9);
            color: #00FF00;
            padding: 10px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 11px;
            z-index: 10001;
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #333;
        `;
        
        const info = this.getDebugInfo();
        debugPanel.innerHTML = `
            <div style="border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 5px;">
                <strong>[DEBUG INFO]</strong>
            </div>
            ${info}
        `;
        
        document.body.appendChild(debugPanel);
        
        // Auto-remove após 10 segundos
        setTimeout(() => {
            if (debugPanel && debugPanel.parentNode) {
                debugPanel.remove();
            }
        }, 10000);
    }
    
    getDebugInfo() {
        const coachAI = window.CoachAI;
        return `
            <div><strong>Coach AI Status:</strong></div>
            <div>Inicializado: ${coachAI ? 'YES' : 'NO'}</div>
            <div>Processing: ${coachAI?.isProcessing ? 'ACTIVE' : 'IDLE'}</div>
            <div>Game Data: ${coachAI?.gameData ? 'CONNECTED' : 'MISSING'}</div>
            
            <div style="margin-top: 10px;"><strong>Electron:</strong></div>
            <div>Process: ${typeof window.process !== 'undefined' ? 'YES' : 'NO'}</div>
            <div>IPC: ${typeof require !== 'undefined' ? 'YES' : 'NO'}</div>
            
            <div style="margin-top: 10px;"><strong>Elements:</strong></div>
            <div>Input: ${document.getElementById('coach-input') ? 'FOUND' : 'MISSING'}</div>
            <div>Response: ${document.getElementById('coach-response') ? 'FOUND' : 'MISSING'}</div>
            <div>Status: ${document.getElementById('coach-status') ? 'FOUND' : 'MISSING'}</div>
            
            <div style="margin-top: 10px;"><strong>Performance:</strong></div>
            <div>DOM Nodes: ${document.querySelectorAll('*').length}</div>
            <div>Memory: ${this.getMemoryInfo()}</div>
            <div>Logs: ${this.logHistory.length}</div>
        `;
    }
    
    getMemoryInfo() {
        if (performance.memory) {
            const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            const total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024);
            return `${used}MB / ${total}MB`;
        }
        return 'N/A';
    }
    
    showLogs() {
        console.group('[LOG HISTORY] Debug Log History');
        this.logHistory.slice(-20).forEach(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            console.log(`[${time}] [${entry.type.toUpperCase()}]`, ...entry.args);
        });
        console.groupEnd();
    }
    
    clearConsole() {
        console.clear();
        this.logHistory = [];
        this.log('[CLEAN] Console limpo', 'info');
    }
    
    log(message, type = 'log') {
        const prefix = {
            'log': '[LOG]',
            'info': '[INFO]',
            'warn': '[WARN]',
            'error': '[ERROR]',
            'success': '[SUCCESS]'
        }[type] || '[LOG]';
        
        console.log(`${prefix} [DEBUG] ${message}`);
    }
    
    // Métodos públicos para uso no console
    testCoachAI() {
        if (!window.CoachAI) {
            this.log('CoachAI não inicializado', 'error');
            return;
        }
        
        this.log('Verificando elementos da interface...', 'info');
        
        // Verificar elementos sem simular input
        const elements = ['coach-input', 'coach-response', 'coach-status'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            this.log(`Element ${id}: ${el ? 'FOUND' : 'MISSING'}`, el ? 'success' : 'error');
        });
    }
    
    // REMOVIDO: Não testar com dados simulados

    setupGlobalFunctions() {
        // Funções globais para debug
        window.testCoach = () => this.testCoachAI();
        // REMOVIDO: testGame - não usar dados simulados
        window.debugInfo = () => this.toggleDebugInfo();
        window.logs = () => this.showLogs();
        window.clearLogs = () => this.clearLogs();
        // REMOVIDO: Não testar com dados mockados
        // REMOVIDO: Não usar simulações - apenas dados reais do CS2
    }

    // REMOVIDO: Não testar com dados mockados - AutoAnalyzer usa Gemini real

    // REMOVIDO: Não simular dados do player - apenas GSI real

    // REMOVIDO: Não forçar insights mockados - apenas Gemini real

    clearLogs() {
        this.logHistory = [];
        this.log('Logs limpos', 'info');
    }
}

// Inicializar debug apenas em desenvolvimento
if (typeof window !== 'undefined') {
    window.debugUtils = new DebugUtils();
    
    // Funções globais para uso no console
    window.testCoach = () => window.debugUtils.testCoachAI();
    // REMOVIDO: testGame - não usar dados simulados
    window.debugInfo = () => window.debugUtils.toggleDebugInfo();
    window.logs = () => window.debugUtils.showLogs();
    
    console.log('[DEBUG] Debug utils carregado!');
    console.log('[HELP] Use: testCoach(), testGame(), debugInfo(), logs()');
} 