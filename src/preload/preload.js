const { contextBridge, ipcRenderer } = require('electron');

// API segura exposta para o renderer process
const electronAPI = {
  // === ESTADO E CONFIGURAÇÃO ===
  
  // Obter nível de coaching atual
  getCoachingLevel: () => ipcRenderer.invoke('get-coaching-level'),
  
  // Obter status do overlay
  getOverlayStatus: () => ipcRenderer.invoke('get-overlay-status'),
  
  // Obter dados GSI atuais
  getCurrentGSIData: () => ipcRenderer.invoke('get-current-gsi-data'),

  // === DATABASE API ===
  
  // Database status and stats
  getDatabaseStatus: () => ipcRenderer.invoke('database-get-status'),
  
  // User settings
  getSetting: (key, defaultValue = null) => ipcRenderer.invoke('database-get-setting', key, defaultValue),
  setSetting: (key, value, type = 'string') => ipcRenderer.invoke('database-set-setting', key, value, type),
  getAllSettings: () => ipcRenderer.invoke('database-get-all-settings'),
  
  // Session management
  getCurrentSession: () => ipcRenderer.invoke('database-get-current-session'),
  getRecentSessions: (limit = 10) => ipcRenderer.invoke('database-get-recent-sessions', limit),
  getSession: (sessionId) => ipcRenderer.invoke('database-get-session', sessionId),
  startSession: (mapName = null) => ipcRenderer.invoke('database-start-session', mapName),
  endSession: () => ipcRenderer.invoke('database-end-session'),
  
  // Performance metrics
  getMetrics: (sessionId, metricType = null) => ipcRenderer.invoke('database-get-metrics', sessionId, metricType),
  
  // AI insights
  createInsight: (sessionId, roundId, skillLevel, adviceText, screenshotPath = null, insightType = 'general') => 
    ipcRenderer.invoke('database-create-insight', sessionId, roundId, skillLevel, adviceText, screenshotPath, insightType),
  getInsights: (sessionId, insightType = null) => ipcRenderer.invoke('database-get-insights', sessionId, insightType),
  
  // Screenshots
  recordScreenshot: (sessionId, roundId, filePath, metadata = {}) => 
    ipcRenderer.invoke('database-record-screenshot', sessionId, roundId, filePath, metadata),
  getScreenshots: (sessionId) => ipcRenderer.invoke('database-get-screenshots', sessionId),
  
  // Database utilities
  cleanupDatabase: (daysToKeep = 30) => ipcRenderer.invoke('database-cleanup', daysToKeep),

  // === LISTENERS PARA EVENTOS DO MAIN PROCESS ===
  
  // Função genérica para escutar eventos
  on: (channel, callback) => {
    // Lista de canais permitidos para segurança
    const allowedChannels = [
      'gsi-data',
      'gsi-status', 
      'coaching-level-changed',
      'opacity-changed',
      'overlay-status',
      'position-reset',
      'database-status',
      'session-started',
      'session-ended',
      'gemini-test-result',
      'screenshot-processed',
      'multimodal-coaching-result'
    ];
    
    if (allowedChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, data) => callback(data));
    } else {
      console.warn(`[PRELOAD] Channel '${channel}' not allowed`);
    }
  },
  
  // Receber dados GSI processados
  onGSIData: (callback) => {
    ipcRenderer.on('gsi-data', (event, data) => callback(data));
  },

  // Escutar mudanças no nível de coaching
  onCoachingLevelChanged: (callback) => {
    ipcRenderer.on('coaching-level-changed', (event, data) => callback(data));
  },

  // Escutar mudanças na opacidade
  onOpacityChanged: (callback) => {
    ipcRenderer.on('opacity-changed', (event, data) => callback(data));
  },

  // Escutar mudanças no status do overlay
  onOverlayStatus: (callback) => {
    ipcRenderer.on('overlay-status', (event, data) => callback(data));
  },

  // Escutar reset de posição do overlay
  onPositionReset: (callback) => {
    ipcRenderer.on('position-reset', (event, data) => callback(data));
  },

  // Escutar status GSI
  onGSIStatus: (callback) => {
    ipcRenderer.on('gsi-status', (event, data) => callback(data));
  },

  // Escutar resultados de testes
  onGeminiTestResult: (callback) => {
    ipcRenderer.on('gemini-test-result', (event, data) => callback(data));
  },

  onScreenshotProcessed: (callback) => {
    ipcRenderer.on('screenshot-processed', (event, data) => callback(data));
  },

  onMultimodalCoachingResult: (callback) => {
    ipcRenderer.on('multimodal-coaching-result', (event, data) => callback(data));
  },

  // Escutar status do banco de dados
  onDatabaseStatus: (callback) => {
    ipcRenderer.on('database-status', (event, data) => callback(data));
  },

  // Escutar eventos de sessão
  onSessionStarted: (callback) => {
    ipcRenderer.on('session-started', (event, data) => callback(data));
  },

  onSessionEnded: (callback) => {
    ipcRenderer.on('session-ended', (event, data) => callback(data));
  },

  // === UTILITÁRIOS ===
  
  // Remover listeners (cleanup)
  removeListener: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Remover listener específico
  removeSpecificListener: (channel, callback) => {
    ipcRenderer.off(channel, callback);
  },

  // === VERSÃO E DEBUG ===
  
  // Verificar se está em modo dev
  isDevMode: process.argv.includes('--dev'),
  
  // Versão do Electron
  electronVersion: process.versions.electron,
  
  // Log para debug (apenas em dev mode)
  log: (...args) => {
    if (process.argv.includes('--dev')) {
      console.log('[PRELOAD]', ...args);
    }
  },

  // === EVENTOS PERSONALIZADOS ===
  
  // Enviar evento customizado para main process (se necessário no futuro)
  sendToMain: (channel, data) => {
    // Lista de canais permitidos para segurança
    const allowedChannels = [
      'renderer-ready',
      'overlay-interaction', 
      'request-screenshot',
      'request-ai-analysis'
    ];
    
    if (allowedChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      console.warn(`[PRELOAD] Channel '${channel}' not allowed`);
    }
  }
};

// === INICIALIZAÇÃO ===

// Log de inicialização em dev mode
if (process.argv.includes('--dev')) {
  console.log('[PRELOAD] Preload script loaded');
  console.log('[PRELOAD] Electron version:', process.versions.electron);
  console.log('[PRELOAD] Node version:', process.versions.node);
}

// Expor API segura para o renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// === LISTENERS GLOBAIS ===

// Cleanup automático quando a janela é fechada
window.addEventListener('beforeunload', () => {
  // Remover todos os listeners para evitar memory leaks
  ipcRenderer.removeAllListeners('gsi-data');
  ipcRenderer.removeAllListeners('gsi-status');
  ipcRenderer.removeAllListeners('coaching-level-changed');
  ipcRenderer.removeAllListeners('opacity-changed');
  ipcRenderer.removeAllListeners('overlay-status');
  ipcRenderer.removeAllListeners('position-reset');
  ipcRenderer.removeAllListeners('database-status');
  ipcRenderer.removeAllListeners('session-started');
  ipcRenderer.removeAllListeners('session-ended');
  ipcRenderer.removeAllListeners('gemini-test-result');
  ipcRenderer.removeAllListeners('screenshot-processed');
  ipcRenderer.removeAllListeners('multimodal-coaching-result');
  
  if (process.argv.includes('--dev')) {
    console.log('[PRELOAD] Cleaned up all IPC listeners');
  }
});

// === SEGURANÇA ===

// Prevenir acesso direto ao Node.js APIs no renderer
Object.freeze(electronAPI);

// Log de segurança
if (process.argv.includes('--dev')) {
  console.log('[PRELOAD] Context isolation enabled');
  console.log('[PRELOAD] Node integration disabled');
  console.log('[PRELOAD] API safely exposed to renderer');
}

// === EXPORT PARA TESTES (se necessário) ===
module.exports = { electronAPI }; 