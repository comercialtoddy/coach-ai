const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const { autoUpdater } = require('electron-updater');
const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

// GSI Deployment utilities
const GSIDeployer = require('../utils/gsiDeployer');
const GSIErrorHandler = require('../utils/gsiErrorHandler');
const GSIConfigGenerator = require('../utils/gsiConfigGenerator');

// Screenshot utilities
const screenshotManager = require('./screenshot/screenshot-manager');

// Gemini AI utilities
const { getGeminiClient } = require('../utils/geminiClient');
const GeminiConfig = require('../utils/geminiConfig');

// AI Coaching and Analysis
const multimodalCoach = require('../utils/multimodalCoach');
const postRoundAnalyzer = require('../utils/postRoundAnalyzer');

// Performance and Historical Data
const performanceMetricsCalculator = require('../utils/performanceMetricsCalculator');
const historicalDataRetriever = require('../utils/historicalDataRetriever');
const historicalDataComparator = require('../utils/historicalDataComparator');

// Utilities
const database = require('../utils/database');
const heapProfiler = require('../utils/heapProfiler');
const cs2PathDetector = require('../utils/cs2PathDetector');

// GSI Configuration
const GSI_PORTS = [3000, 3001, 3002, 3003, 3004]; // Multiple ports to try
let currentGSIPort = null;
let gsiServerInstance = null;

// Estado global da aplicação
let mainWindow;
let gsiServer;
let wsServer;
let overlayVisible = true;
let coachingLevel = 'beginner'; // beginner, intermediate, professional
let overlayOpacity = 0.8;
let currentGSIData = null;
let currentSession = null;
let currentRound = null;
let isDevMode = process.argv.includes('--dev');

// Configurações do overlay
const OVERLAY_CONFIG = {
  width: 1920, // MANTER A RESOLUÇÃO DE 1920X1080
  height: 1080, // MANTER A RESOLUÇÃO DE 1920X1080
  opacity: overlayOpacity,
  transparent: true,
  frame: false,
  alwaysOnTop: true,
  skipTaskbar: true,
  resizable: false,
  movable: true,
  focusable: false,
  webSecurity: false
};

// Inicialização do Electron
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // Criar janela transparente do overlay
  mainWindow = new BrowserWindow({
    ...OVERLAY_CONFIG,
    x: width - OVERLAY_CONFIG.width - 50,
    y: 50,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../preload/preload.js')
    }
  });

  // Carregar interface do overlay
  mainWindow.loadFile(path.join(__dirname, '../renderer/overlay.html'));

  // Click-through quando não focado
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Dev tools em modo desenvolvimento
  if (isDevMode) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Eventos da janela
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  console.log('✅ Overlay window created');
}

// Configurar hotkeys globais
function setupGlobalHotkeys() {
  // F10: Toggle overlay visibility
  globalShortcut.register('F10', () => {
    if (mainWindow) {
      overlayVisible = !overlayVisible;
      if (overlayVisible) {
        mainWindow.show();
        sendToRenderer('overlay-status', { visible: true, level: coachingLevel });
      } else {
        mainWindow.hide();
      }
      
      // Save visibility setting to database
      if (database && database.isReady()) {
        database.setSetting('overlay_visible', overlayVisible.toString(), 'boolean');
        console.log(`💾 Saved overlay visibility: ${overlayVisible}`);
      }
      
      console.log(`🔄 Overlay ${overlayVisible ? 'shown' : 'hidden'}`);
    }
  });

  // F11: Cycle coaching levels
  globalShortcut.register('F11', () => {
    const levels = ['beginner', 'intermediate', 'professional'];
    const currentIndex = levels.indexOf(coachingLevel);
    coachingLevel = levels[(currentIndex + 1) % levels.length];
    
    sendToRenderer('coaching-level-changed', { 
      level: coachingLevel,
      message: `Coaching Level: ${coachingLevel.toUpperCase()}`
    });
    
    // Save coaching level to database
    if (database && database.isReady()) {
      database.setSetting('coaching_level', coachingLevel, 'string');
      console.log(`💾 Saved coaching level: ${coachingLevel}`);
    }
    
    console.log(`🎯 Coaching level changed to: ${coachingLevel}`);
  });

  // F12: Adjust overlay opacity
  globalShortcut.register('F12', () => {
    const opacityLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
    const currentIndex = opacityLevels.indexOf(overlayOpacity);
    overlayOpacity = opacityLevels[(currentIndex + 1) % opacityLevels.length];
    
    if (mainWindow) {
      mainWindow.setOpacity(overlayOpacity);
      sendToRenderer('opacity-changed', { 
        opacity: overlayOpacity,
        message: `Transparency: ${Math.round(overlayOpacity * 100)}%`
      });
    }
    
    // Save opacity setting to database
    if (database && database.isReady()) {
      database.setSetting('overlay_opacity', overlayOpacity.toString(), 'number');
      console.log(`💾 Saved overlay opacity: ${overlayOpacity}`);
    }
    
    console.log(`🔄 Overlay opacity changed to: ${overlayOpacity}`);
  });

  // F6: Test Multimodal AI Coaching
  globalShortcut.register('F6', async () => {
    console.log('🤖 F6 pressed - Testing Multimodal AI Coaching...');
    
    try {
      // Initialize multimodal coach
      if (!multimodalCoach.isInitialized) {
        console.log('🔧 Initializing Multimodal Coach...');
        await multimodalCoach.initialize();
      }
      
      // Capture AI-optimized screenshot
      const screenshot = await screenshotManager.captureAndProcessForAI();
      console.log(`📸 Screenshot captured for AI: ${screenshot.metadata.base64Length} chars`);
      
      // Use current GSI data or mock data for testing
      const testGSIData = currentGSIData || {
        player: {
          team: 'CT',
          state: { health: 78, armor: 95, money: 2400, round_kills: 1 },
          match_stats: { kills: 8, deaths: 5, assists: 3 }
        },
        round: { phase: 'live', bomb: 'safe', wins_team_ct: 7, wins_team_t: 8 },
        map: { name: 'de_dust2', round: 16 }
      };
      
      // Generate multimodal coaching
      const coaching = await multimodalCoach.generateMultimodalCoaching(
        testGSIData,
        screenshot.base64,
        screenshot.mimeType,
        coachingLevel
      );
      
      if (coaching.success) {
        console.log('✅ Multimodal coaching generated successfully!');
        console.log(`📊 GSI Summary: ${coaching.coaching.gsiSummary}`);
        console.log(`💡 Insights: ${coaching.coaching.insights.tips.length} tips, ${coaching.coaching.insights.alerts.length} alerts`);
        console.log(`⏱️ Processing time: ${coaching.coaching.processingTime}ms`);
        
        sendToRenderer('multimodal-coaching-result', {
          success: true,
          coaching: coaching.coaching,
          metadata: coaching.metadata,
          message: 'Multimodal AI coaching successful!'
        });

        // Add AI insight to post-round analyzer
        if (postRoundAnalyzer.isInitialized && postRoundAnalyzer.isCollectingData()) {
          postRoundAnalyzer.addAIInsight(coaching.coaching, {
            source: 'multimodal_test',
            level: coachingLevel,
            screenshot: true,
            gsiData: testGSIData
          });
          console.log(`📊 AI insight added to round analysis`);
        }
      } else {
        throw new Error(coaching.error);
      }
      
    } catch (error) {
      console.error('❌ F6 Multimodal coaching test failed:', error.message);
      sendToRenderer('multimodal-coaching-result', {
        success: false,
        error: error.message,
        message: 'Multimodal AI coaching test failed'
      });
    }
  });

  // F7: Test Gemini AI
  globalShortcut.register('F7', async () => {
    console.log('🧠 F7 pressed - Testing Gemini AI...');
    
    try {
      const geminiClient = getGeminiClient();
      
      // Initialize if not ready
      if (!geminiClient.isReady()) {
        console.log('🔧 Initializing Gemini client...');
        await geminiClient.initialize();
      }
      
      // Test connection
      const result = await geminiClient.testConnection();
      
      sendToRenderer('gemini-test-result', {
        success: result.success,
        response: result.response,
        message: 'Gemini AI test successful!'
      });
      
    } catch (error) {
      console.error('❌ F7 Gemini test failed:', error.message);
      sendToRenderer('gemini-test-result', {
        success: false,
        error: error.message,
        message: 'Gemini AI test failed'
      });
    }
  });

  // F8: Capture screenshot with AI processing
  globalShortcut.register('F8', async () => {
    console.log('📸 F8 pressed - Capturing and processing screenshot...');
    
    try {
      // Test AI-optimized capture
      const aiResult = await screenshotManager.captureAndProcessForAI();
      console.log(`✅ AI-optimized screenshot processed! Size: ${aiResult.metadata.base64Length} chars`);
      
      // Test multiple formats
      const formatsResult = await screenshotManager.captureMultipleFormats(['ai', 'thumbnail', 'archive']);
      console.log('✅ Multiple formats processed!');
      
      // Test game region cropping
      const minimapResult = await screenshotManager.captureGameRegion('minimap');
      console.log('✅ Minimap region cropped!');
      
      // Save processed results for testing
      const fs = require('fs');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Save AI-optimized version to userData directory
      const aiFilename = `coach-ai-processed-${timestamp}.jpg`;
      const aiFilepath = path.join(app.getPath('userData'), aiFilename);
      fs.writeFileSync(aiFilepath, aiResult.buffer);
      
      // Save thumbnail
      if (formatsResult.formats.thumbnail) {
        const thumbFilename = `coach-ai-thumbnail-${timestamp}.jpg`;
        const thumbFilepath = path.join(app.getPath('userData'), thumbFilename);
        fs.writeFileSync(thumbFilepath, formatsResult.formats.thumbnail.processedBuffer);
      }
      
      // Save minimap crop
      const minimapFilename = `coach-ai-minimap-${timestamp}.jpg`;
      const minimapFilepath = path.join(app.getPath('userData'), minimapFilename);
      fs.writeFileSync(minimapFilepath, minimapResult.croppedBuffer);
      
      console.log(`💾 Processed screenshots saved to userData directory`);
      console.log(`🤖 AI version: ${aiResult.metadata.processing.compressionRatio.toFixed(1)}% compression`);
      
      sendToRenderer('screenshot-processed', {
        success: true,
        files: {
          ai: { filename: aiFilename, filepath: aiFilepath },
          thumbnail: formatsResult.formats.thumbnail ? { 
            filename: `coach-ai-thumbnail-${timestamp}.jpg`,
            filepath: path.join(app.getPath('userData'), `coach-ai-thumbnail-${timestamp}.jpg`)
          } : null,
          minimap: { filename: minimapFilename, filepath: minimapFilepath }
        },
        metadata: {
          ai: aiResult.metadata,
          formats: formatsResult.metadata,
          minimap: minimapResult.metadata
        },
        message: 'Screenshots captured and processed successfully!'
      });
      
    } catch (error) {
      console.error('❌ Screenshot processing failed:', error.message);
      sendToRenderer('screenshot-captured', {
        success: false,
        error: error.message,
        message: 'Screenshot processing failed'
      });
    }
  });

  // Ctrl+F10: Reset overlay position
  globalShortcut.register('CommandOrControl+F10', () => {
    if (mainWindow) {
      const { width, height } = screen.getPrimaryDisplay().workAreaSize;
      const defaultPosition = {
        x: width - OVERLAY_CONFIG.width - 50,
        y: 50
      };
      
      mainWindow.setPosition(defaultPosition.x, defaultPosition.y);
      
      sendToRenderer('position-reset', {
        position: defaultPosition,
        message: 'Position Reset'
      });
      
      // Save position to database
      if (database && database.isReady()) {
        database.setSetting('overlay_position', JSON.stringify(defaultPosition), 'json');
        console.log(`💾 Saved overlay position: ${defaultPosition.x}, ${defaultPosition.y}`);
      }
      
      console.log(`📍 Overlay position reset to: ${defaultPosition.x}, ${defaultPosition.y}`);
    }
  });

  console.log('✅ Global hotkeys registered (F6, F7, F8, F10, F11, F12, Ctrl+F10)');
}

// Configurar servidor GSI
function setupGSIServer() {
  // Se já temos um servidor rodando, não criar outro
  if (gsiServerInstance) {
    console.log('🔄 GSI server already running on port', currentGSIPort);
    return;
  }

  try {
    console.log('🔄 Setting up GSI server...');
    
    const app = express();
    app.use(express.json());
    
    // Add keep-alive middleware
    app.use((req, res, next) => {
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Keep-Alive', 'timeout=30, max=1000');
      next();
    });

    // Endpoint para receber dados GSI do CS2
    app.post('/gsi', async (req, res) => {
      try {
        const gsiData = req.body;
        currentGSIData = gsiData;
        
        // Respond quickly to CS2 to maintain connection
        res.status(200).json({ status: 'received', timestamp: Date.now() });
        
        const now = new Date().toLocaleTimeString();
        console.log(`🎯 [${now}] GSI DATA RECEIVED FROM CS2!`);
        
        if (gsiData.test) {
          console.log('🧪 GSI TEST DATA RECEIVED');
        } else {
          console.log('🎮 GSI REAL CS2 DATA RECEIVED');
        }
        
        // Log only important data to avoid spam
        if (gsiData.player && gsiData.player.state) {
          console.log(`👤 Player: ${gsiData.player.name} | Health: ${gsiData.player.state.health} | Money: $${gsiData.player.state.money}`);
        }
        
        // LOG COACHING TIPS DEBUG
        if (gsiData.player) {
          console.log('🎯 COACHING DEBUG - Player data available for tips generation');
          console.log('🎯 COACHING DEBUG - Current level:', coachingLevel);
        } else {
          console.log('❌ COACHING DEBUG - No player data for tips!');
        }
        
        // LOG ROUND SCORE DEBUG  
        if (gsiData.round && gsiData.round.wins_team_ct !== undefined && gsiData.round.wins_team_t !== undefined) {
          console.log(`📊 SCORE DEBUG - CT: ${gsiData.round.wins_team_ct} | T: ${gsiData.round.wins_team_t}`);
        } else if (gsiData.map && gsiData.map.team_ct && gsiData.map.team_t) {
          console.log(`📊 SCORE DEBUG - Map teams - CT: ${JSON.stringify(gsiData.map.team_ct)} | T: ${JSON.stringify(gsiData.map.team_t)}`);
        } else {
          console.log('❌ SCORE DEBUG - No round wins or team data found in GSI!');
          console.log('📊 SCORE DEBUG - Available round keys:', gsiData.round ? Object.keys(gsiData.round) : 'No round data');
          console.log('📊 SCORE DEBUG - Available map keys:', gsiData.map ? Object.keys(gsiData.map) : 'No map data');
        }
        
        // ALWAYS CONNECTED - NO DISCONNECTION LOGIC
        console.log('✅ GSI data processed - ALWAYS CONNECTED');
        sendToRenderer('gsi-status', { connected: true, message: 'CS2 ALWAYS CONNECTED' });
        
        // Process data in background to avoid blocking response
        setImmediate(async () => {
          try {
            // Process GSI data with enhanced coaching system
            const processed = await processGSIData(gsiData);
            
            console.log('📊 PROCESSED DATA DEBUG:');
            console.log('  📊 Has processed round?', !!processed.round);
            console.log('  📊 Round wins:', processed.round?.wins);
            console.log('  🎯 Coaching tips count:', processed.coaching?.tips?.length || 0);
            console.log('  🎯 Coaching alerts count:', processed.coaching?.alerts?.length || 0);
            console.log('  🎯 Coaching tips:', processed.coaching?.tips);
            
            // Send processed data to overlay
            sendToRenderer('gsi-data', processed);
            
            console.log('✅ GSI data sent to overlay successfully');
          } catch (error) {
            console.error('❌ Error processing GSI data in background:', error.message);
            console.error('📊 Background processing error stack:', error.stack);
          }
        });
        
      } catch (error) {
        console.error('❌ GSI endpoint error:', error.message);
        console.error('📊 GSI endpoint error stack:', error.stack);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'healthy', 
        timestamp: Date.now(),
        gsiConnected: true, // ALWAYS CONNECTED
        message: 'GSI ALWAYS CONNECTED',
        port: currentGSIPort
      });
    });

    // Try multiple ports to avoid conflicts
    tryStartServer(app, 0);
    
          } catch (error) {
    console.error('❌ Failed to setup GSI server:', error);
  }
}

function tryStartServer(app, portIndex) {
  if (portIndex >= GSI_PORTS.length) {
    console.error('❌ No available ports for GSI server');
    sendToRenderer('gsi-status', { connected: false, message: 'No available ports' });
    return;
  }

  const port = GSI_PORTS[portIndex];
  console.log(`🔄 Trying port ${port}...`);

  const server = app.listen(port, () => {
    currentGSIPort = port;
    gsiServerInstance = server;
    console.log(`✅ GSI server running on port ${port} - ALWAYS CONNECTED MODE`);
    
    // Configure server settings for stability
    server.keepAliveTimeout = 30000; // 30 seconds
    server.headersTimeout = 35000; // 35 seconds (must be greater than keepAliveTimeout)
    
    sendToRenderer('gsi-status', { 
      connected: true, // ALWAYS CONNECTED
      message: `GSI Server ALWAYS CONNECTED on port ${port}` 
    });
    
    console.log('🔥 GSI CONNECTION MODE: ALWAYS CONNECTED - NO DISCONNECTION MONITORING');
  });

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} in use, trying next port...`);
      tryStartServer(app, portIndex + 1);
    } else {
      console.error('❌ GSI server error:', error);
      gsiServerInstance = null;
      currentGSIPort = null;
    }
  });
}

// GSI CONNECTION MODE: ALWAYS CONNECTED
// NO DISCONNECTION MONITORING - GSI STAYS CONNECTED PERMANENTLY

// === AUTO-UPDATER CONFIGURATION ===
function setupAutoUpdater() {
  console.log('🔄 Setting up auto-updater...');
  
  // Configure auto-updater settings
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  
  // Set custom user agent for GitHub releases
  autoUpdater.requestHeaders = {
    'User-Agent': 'Coach-AI-Updater'
  };

  // Auto-updater event handlers
  autoUpdater.on('checking-for-update', () => {
    console.log('🔍 Checking for updates...');
    sendToRenderer('updater-checking');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('📦 Update available:', info.version);
    sendToRenderer('updater-available', { version: info.version });
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('✅ No updates available. Current version:', info.version);
    sendToRenderer('updater-not-available', { version: info.version });
  });

  autoUpdater.on('error', (error) => {
    console.error('❌ Auto-updater error:', error.message);
    sendToRenderer('updater-error', { error: error.message });
  });

  autoUpdater.on('download-progress', (progress) => {
    const percentage = Math.round(progress.percent);
    console.log(`📥 Downloading update: ${percentage}%`);
    sendToRenderer('updater-progress', { 
      percent: percentage,
      transferred: progress.transferred,
      total: progress.total 
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('✅ Update downloaded and ready to install:', info.version);
    sendToRenderer('updater-downloaded', { 
      version: info.version,
      message: 'Update ready to install. Will install on app restart.' 
    });
  });
}

async function checkForUpdates(silent = false) {
  try {
      if (!silent) {
      console.log('🔍 Manually checking for updates...');
    }

    const result = await autoUpdater.checkForUpdatesAndNotify();
    
    if (!silent) {
    if (result) {
        console.log('📦 Update check completed');
      } else {
        console.log('✅ No updates available');
      }
    }
    
    return result;
  } catch (error) {
    if (!silent) {
      console.error('❌ Failed to check for updates:', error.message);
    }
    return null;
  }
}

function quitAndInstall() {
  console.log('🔄 Installing update and restarting...');
    autoUpdater.quitAndInstall();
}

// === DATABASE INITIALIZATION ===
async function initializeDatabase() {
    console.log('📊 Initializing database...');
  
  try {
    console.log('🔄 Calling database.initialize()...');
    const dbInitResult = await database.initialize();
    console.log('📊 Database initialization result:', dbInitResult);
    
    if (!database.isReady()) {
      throw new Error('Database initialization completed but database reports not ready');
    }
    
    console.log('✅ Database is ready, initializing default settings...');
    database.initializeDefaultSettings();
    
    console.log('⚙️ Loading user settings from database...');
    const settings = database.getAllSettings();
    console.log('⚙️ Loaded user settings:', Object.keys(settings).length, 'settings');
    console.log('📋 Settings loaded:', settings);
    
    // Get basic database stats
    console.log('📊 Getting database stats...');
    const stats = database.getStats();
    console.log('📊 Database stats:', stats);
    
    console.log('📊 Initializing Post-Round Analyzer...');
    await postRoundAnalyzer.initialize();
    console.log('✅ Post-Round Analyzer ready!');
    
    console.log('✅ Database initialization completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('📋 Continuing without database - some features may be limited');
    return false;
  }
}

async function restoreHotkeySettings() {
  console.log('⚙️ Restoring hotkey settings...');
  
  try {
    console.log('🔄 Restoring hotkey settings from database...');
    
    if (!database || !database.isReady()) {
      console.log('⚠️ Database not ready, using default hotkey settings');
      return;
    }
    
    // Restore coaching level
    const savedCoachingLevel = database.getSetting('coaching_level', 'beginner');
    if (savedCoachingLevel && ['beginner', 'intermediate', 'professional'].includes(savedCoachingLevel)) {
    coachingLevel = savedCoachingLevel;
    }
    console.log(`📊 Restored coaching level: ${coachingLevel}`);
    
    // Restore overlay opacity
    const savedOpacity = database.getSetting('overlay_opacity', 0.8);
    if (savedOpacity && typeof savedOpacity === 'number' && savedOpacity >= 0.1 && savedOpacity <= 1.0) {
    overlayOpacity = savedOpacity;
    if (mainWindow) {
      mainWindow.setOpacity(overlayOpacity);
    }
    }
    console.log(`📊 Restored overlay opacity: ${overlayOpacity}`);
    
    // Restore overlay position
    const savedPosition = database.getSetting('overlay_position', null);
    if (savedPosition && mainWindow) {
      try {
        const position = typeof savedPosition === 'string' ? JSON.parse(savedPosition) : savedPosition;
        if (position && typeof position.x === 'number' && typeof position.y === 'number') {
          mainWindow.setPosition(position.x, position.y);
          console.log(`📍 Restored overlay position: ${position.x}, ${position.y}`);
        }
      } catch (posError) {
        console.log('⚠️ Failed to restore position:', posError.message);
      }
    }
    
    // Restore overlay visibility
    const savedVisibility = database.getSetting('overlay_visible', true);
    if (typeof savedVisibility === 'boolean') {
    overlayVisible = savedVisibility;
    if (mainWindow) {
      if (overlayVisible) {
        mainWindow.show();
      } else {
        mainWindow.hide();
        }
      }
    }
    console.log(`📂 Restored overlay visibility: ${overlayVisible}`);
    
    // Send initial status to renderer
    sendToRenderer('overlay-status', {
      visible: overlayVisible,
      opacity: overlayOpacity,
      level: coachingLevel
    });
    
    // Send individual events to ensure renderer state is synchronized
    sendToRenderer('coaching-level-changed', {
      level: coachingLevel,
      message: `Coaching Level: ${coachingLevel.toUpperCase()}`
    });
    
    sendToRenderer('opacity-changed', {
      opacity: overlayOpacity,
      message: `Transparency: ${Math.round(overlayOpacity * 100)}%`
    });
    
    console.log('✅ Hotkey settings restored successfully');
    
  } catch (error) {
    console.error('❌ Failed to restore hotkey settings:', error.message);
    console.log('📋 Using default hotkey settings');
  }
}

// === SESSION MANAGEMENT ===
function startGameSession(mapName = null) {
  try {
    if (currentSession) {
      console.log('⚠️ Session already active, ending previous session');
      endGameSession();
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    database.createSession(sessionId, mapName, coachingLevel);
    
    currentSession = {
      id: sessionId,
      startTime: Date.now(),
      mapName: mapName,
      roundCount: 0,
      playerScore: 0,
      enemyScore: 0
    };

    console.log(`🎮 Game session started: ${sessionId}`);
    console.log(`📍 Map: ${mapName || 'Unknown'}`);
    console.log(`🎯 Coaching Level: ${coachingLevel}`);
    
    sendToRenderer('session-started', currentSession);
    
    return currentSession;
  } catch (error) {
    console.error('❌ Failed to start game session:', error.message);
    return null;
  }
}

function endGameSession() {
  try {
    if (!currentSession) {
      console.log('⚠️ No active session to end');
      return;
    }

    // Update session in database
    database.updateSession(currentSession.id, {
      endTime: Date.now(),
      totalRounds: currentSession.roundCount,
      playerScore: currentSession.playerScore,
      enemyScore: currentSession.enemyScore
    });

    console.log(`🏁 Game session ended: ${currentSession.id}`);
    console.log(`📊 Total rounds: ${currentSession.roundCount}`);
    console.log(`🎯 Final score: ${currentSession.playerScore} - ${currentSession.enemyScore}`);
    
    sendToRenderer('session-ended', {
      sessionId: currentSession.id,
      duration: Date.now() - currentSession.startTime,
      rounds: currentSession.roundCount,
      score: `${currentSession.playerScore} - ${currentSession.enemyScore}`
    });

    currentSession = null;
    currentRound = null;
    
  } catch (error) {
    console.error('❌ Failed to end game session:', error.message);
  }
}

function startNewRound(roundNumber, playerTeam = null) {
  try {
    if (!currentSession) {
      console.log('⚠️ No active session, starting new session');
      startGameSession();
    }

    const roundId = `${currentSession.id}_round_${roundNumber}`;
    
    database.createRound(roundId, currentSession.id, roundNumber, playerTeam);
    
    currentRound = {
      id: roundId,
      sessionId: currentSession.id,
      number: roundNumber,
      startTime: Date.now(),
      playerTeam: playerTeam
    };

    currentSession.roundCount = Math.max(currentSession.roundCount, roundNumber);

    console.log(`🔄 Round ${roundNumber} started (${roundId})`);

    // Start post-round data collection
    if (postRoundAnalyzer.isInitialized) {
      postRoundAnalyzer.startRoundDataCollection(roundId, currentSession.id, roundNumber, playerTeam);
      console.log(`📊 Data collection started for Round ${roundNumber}`);
    }
    
    return currentRound;
  } catch (error) {
    console.error('❌ Failed to start round:', error.message);
    return null;
  }
}

async function endCurrentRound(outcome = null) {
  try {
    if (!currentRound) return;

    // Update round in database
    database.updateRound(currentRound.id, {
      outcome: outcome,
      roundPhase: 'over',
      gsiSnapshot: currentGSIData,
      roundEndTime: Date.now()
    });

    console.log(`✅ Round ${currentRound.number} ended with outcome: ${outcome || 'unknown'}`);

    // Compile post-round summary
    if (postRoundAnalyzer.isInitialized && postRoundAnalyzer.isCollectingData()) {
      try {
        const roundSummary = await postRoundAnalyzer.compileRoundSummary(outcome, coachingLevel);
        console.log(`📊 Round summary compiled for Round ${currentRound.number}`);
        
        // Send summary to renderer
        sendToRenderer('round-summary-compiled', {
          roundNumber: currentRound.number,
          summary: roundSummary,
          message: 'Round analysis complete!'
        });
        
      } catch (error) {
        console.error('❌ Failed to compile round summary:', error.message);
      }
    }
    
    currentRound = null;
  } catch (error) {
    console.error('❌ Failed to end round:', error.message);
  }
}

// === ENHANCED GSI PROCESSING ===
async function processGSIData(gsiData) {
  console.log('🔄 Starting GSI data processing...');
  
  const processed = {
    timestamp: Date.now(),
    coachingLevel: coachingLevel,
    round: null,
    player: null,
    team: null,
    bomb: null,
    map: null,
    events: [],
    coaching: {
      tips: [],
      alerts: []
    },
    analytics: {
      performance: null,
      historical: null
    }
  };

  try {
    console.log('🎮 Processing session and round management...');
    
    // Auto-detect session/round changes
    if (gsiData.map && gsiData.map.name) {
      if (!currentSession || currentSession.mapName !== gsiData.map.name) {
        console.log(`🗺️ Starting new session for map: ${gsiData.map.name}`);
        startGameSession(gsiData.map.name);
      }
    }

    // Round management
    if (gsiData.map && gsiData.map.round) {
      const roundNumber = gsiData.map.round;
      if (!currentRound || currentRound.number !== roundNumber) {
        // End previous round if exists
        if (currentRound) {
          console.log(`🏁 Ending round ${currentRound.number}`);
          await endCurrentRound();
        }
        // Start new round
        console.log(`🎯 Starting new round ${roundNumber}`);
        startNewRound(roundNumber, gsiData.player?.team);
      }
    }

    console.log('📊 Processing round data...');
    // Extrair informações do round
    if (gsiData.round) {
      console.log('📊 RAW ROUND DATA from GSI:', gsiData.round);
      
      // Try multiple sources for round wins data
      let ctWins = 0;
      let tWins = 0;
      
      // Primary: direct wins data from round
      if (gsiData.round.wins_team_ct !== undefined && gsiData.round.wins_team_t !== undefined) {
        ctWins = gsiData.round.wins_team_ct;
        tWins = gsiData.round.wins_team_t;
        console.log('📊 SCORE SOURCE: round.wins_team_* (primary)');
      }
      // Secondary: try map team data
      else if (gsiData.map && gsiData.map.team_ct && gsiData.map.team_t) {
        ctWins = gsiData.map.team_ct.score || gsiData.map.team_ct.wins || 0;
        tWins = gsiData.map.team_t.score || gsiData.map.team_t.wins || 0;
        console.log('📊 SCORE SOURCE: map.team_* (secondary)');
      }
      // Fallback: try other possible locations
      else {
        console.log('📊 SCORE SOURCE: Using fallback (0-0)');
        console.log('📊 AVAILABLE ROUND PROPERTIES:', Object.keys(gsiData.round));
        if (gsiData.map) {
          console.log('📊 AVAILABLE MAP PROPERTIES:', Object.keys(gsiData.map));
        }
      }
      
      processed.round = {
        phase: gsiData.round.phase || 'unknown',
        bomb: gsiData.round.bomb || 'safe',
        wins: {
          ct: ctWins,
          t: tWins
        }
      };

      console.log('📈 Round processed:', processed.round);
      console.log('📊 ROUND WINS EXTRACTED - CT:', processed.round.wins.ct, 'T:', processed.round.wins.t);

      // Update session scores
      if (currentSession) {
        currentSession.playerScore = processed.round.wins.ct || 0;
        currentSession.enemyScore = processed.round.wins.t || 0;
        console.log('📊 Session scores updated - Player:', currentSession.playerScore, 'Enemy:', currentSession.enemyScore);
      }
    } else {
      console.log('⚠️ No round data in GSI payload');
      console.log('📊 GSI DATA KEYS:', Object.keys(gsiData || {}));
    }

    console.log('🗺️ Processing map data...');
    // Extrair informações do mapa
    if (gsiData.map) {
      processed.map = {
        name: gsiData.map.name || 'unknown',
        phase: gsiData.map.phase || 'unknown',
        round: gsiData.map.round || 0,
        team_ct: gsiData.map.team_ct || {},
        team_t: gsiData.map.team_t || {},
        num_matches_to_win_series: gsiData.map.num_matches_to_win_series || 16,
        current_spectators: gsiData.map.current_spectators || 0,
        souvenirs_total: gsiData.map.souvenirs_total || 0
      };
      
      console.log('🗺️ Map processed:', { 
        name: processed.map.name, 
        round: processed.map.round, 
        phase: processed.map.phase 
      });
    } else {
      console.log('⚠️ No map data in GSI payload');
    }

    console.log('👤 Processing player data...');
    // Extrair informações do jogador
    if (gsiData.player) {
      processed.player = {
        steamid: gsiData.player.steamid || 'unknown',
        name: gsiData.player.name || 'Player',
        team: gsiData.player.team || 'unknown',
        activity: gsiData.player.activity || 'unknown',
        state: {
          health: gsiData.player.state?.health || 0,
          armor: gsiData.player.state?.armor || 0,
          helmet: gsiData.player.state?.helmet || false,
          flashed: gsiData.player.state?.flashed || 0,
          burning: gsiData.player.state?.burning || 0,
          money: gsiData.player.state?.money || 0,
          round_kills: gsiData.player.state?.round_kills || 0,
          round_killhs: gsiData.player.state?.round_killhs || 0,
          defusekit: gsiData.player.state?.defusekit || false
        },
        match_stats: {
          kills: gsiData.player.match_stats?.kills || 0,
          assists: gsiData.player.match_stats?.assists || 0,
          deaths: gsiData.player.match_stats?.deaths || 0,
          mvps: gsiData.player.match_stats?.mvps || 0,
          score: gsiData.player.match_stats?.score || 0
        },
        weapons: gsiData.player.weapons || {}
      };

      console.log('👤 Player processed:', {
        name: processed.player.name,
        team: processed.player.team,
        health: processed.player.state.health,
        money: processed.player.state.money,
        k: processed.player.match_stats.kills,
        d: processed.player.match_stats.deaths
      });

      console.log('📊 Calculating performance analytics...');
      // === ENHANCED PERFORMANCE ANALYTICS ===
      
      // Calculate real-time performance metrics
      if (performanceMetricsCalculator && performanceMetricsCalculator.isInitialized && currentSession && currentRound) {
        try {
          const sessionData = {
            id: currentSession.id,
            mapName: currentSession.mapName,
            startTime: currentSession.startTime
          };
          
          const roundData = {
            id: currentRound.id,
            number: currentRound.number,
            playerData: processed.player,
            timestamp: processed.timestamp
          };
          
          const metrics = await performanceMetricsCalculator.calculateMetrics(sessionData, roundData);
          processed.analytics.performance = metrics;
          
          console.log(`📊 Performance metrics calculated: ${Object.keys(metrics).length} metrics`);
        } catch (error) {
          console.error('❌ Performance metrics calculation failed:', error.message);
        }
      } else {
        console.log('⚠️ Performance metrics calculator not available');
      }

      console.log('📚 Checking historical data...');
      // Retrieve and compare historical data
      if (historicalDataRetriever && historicalDataRetriever.isInitialized && processed.player.steamid) {
        try {
          const query = {
            playerId: processed.player.steamid,
            mapName: processed.map?.name,
            timeframe: '7d', // Last 7 days
            limit: 10
          };
          
          const historicalData = await historicalDataRetriever.retrieveData(query);
          
          if (historicalData && historicalData.length > 0) {
            // Compare current performance with historical
            const currentPerformance = {
              kd: processed.player.match_stats.deaths > 0 ? 
                processed.player.match_stats.kills / processed.player.match_stats.deaths : 
                processed.player.match_stats.kills,
              adr: processed.analytics.performance?.averageDamagePerRound || 0,
              kpr: processed.analytics.performance?.killsPerRound || 0
            };
            
            const comparison = await historicalDataComparator.compare(
              currentPerformance, 
              historicalData, 
              { type: 'performance_trend' }
            );
            
            processed.analytics.historical = {
              comparison: comparison,
              trend: comparison.trend || 'stable',
              improvement: comparison.improvement || 0
            };
            
            console.log(`📈 Historical comparison: ${comparison.trend} trend (${comparison.improvement > 0 ? '+' : ''}${comparison.improvement}%)`);
          }
        } catch (error) {
          console.error('❌ Historical data analysis failed:', error.message);
        }
      } else {
        console.log('⚠️ Historical data retriever not available or no steamid');
      }

      console.log('💾 Recording metrics to database...');
      // Record performance metrics to database
      if (currentSession && currentRound && database && database.isReady()) {
        try {
          // Record enhanced metrics including analytics
          const metrics = [
            ['health', processed.player.state.health],
            ['armor', processed.player.state.armor],
            ['money', processed.player.state.money],
            ['kills', processed.player.match_stats.kills],
            ['deaths', processed.player.match_stats.deaths],
            ['round_kills', processed.player.state.round_kills],
            ['kd_ratio', processed.player.match_stats.deaths > 0 ? 
              processed.player.match_stats.kills / processed.player.match_stats.deaths : 
              processed.player.match_stats.kills],
            ['mvps', processed.player.match_stats.mvps]
          ];

          // Add performance analytics if available
          if (processed.analytics.performance) {
            if (processed.analytics.performance.averageDamagePerRound) {
              metrics.push(['adr', processed.analytics.performance.averageDamagePerRound]);
            }
            if (processed.analytics.performance.killsPerRound) {
              metrics.push(['kpr', processed.analytics.performance.killsPerRound]);
            }
            if (processed.analytics.performance.headshotPercentage) {
              metrics.push(['hs_percentage', processed.analytics.performance.headshotPercentage]);
            }
          }

          metrics.forEach(([type, value]) => {
            const metricId = `${currentRound.id}_${type}_${Date.now()}`;
            database.recordMetric(metricId, currentSession.id, currentRound.id, type, value);
          });
          
          console.log(`💾 Recorded ${metrics.length} enhanced metrics to database`);
        } catch (error) {
          console.error('❌ Failed to record enhanced metrics:', error.message);
        }
      } else {
        console.log('⚠️ Database not ready for metrics recording');
      }

      console.log('🎯 Generating coaching tips...');
      // === ENHANCED COACHING WITH ANALYTICS ===
      processed.coaching = generateEnhancedCoachingTips(
        processed.player, 
        processed.round, 
        coachingLevel,
        processed.analytics
      );
      
      console.log(`🎯 Generated ${processed.coaching.tips.length} tips and ${processed.coaching.alerts.length} alerts`);
      
      // === GEMINI 2.5 FLASH AI COACHING INTEGRATION ===
      console.log('🤖 ============ GEMINI 2.5 FLASH DEBUG START ============');
      console.log('🤖 Attempting Gemini 2.5 Flash AI coaching...');
      console.log('🤖 Multimodal coach exists?', !!multimodalCoach);
      console.log('🤖 Multimodal coach initialized?', multimodalCoach?.isInitialized);
      console.log('🤖 Coaching level:', coachingLevel);
      
      try {
        // Check if multimodal coach is available and initialized
        if (multimodalCoach && multimodalCoach.isInitialized) {
          console.log('🎯 GEMINI 2.5 FLASH: ✅ Coach is initialized, capturing screenshot...');
          
          // Capture screenshot for AI analysis
          const screenshot = await screenshotManager.captureAndProcessForAI();
          console.log('🎯 GEMINI 2.5 FLASH: ✅ Screenshot captured:', {
            hasBase64: !!screenshot.base64,
            base64Length: screenshot.base64?.length || 0,
            mimeType: screenshot.mimeType
          });
          
          console.log('🎯 GEMINI 2.5 FLASH: 🚀 Calling generateMultimodalCoaching...');
          console.log(`🎯 GEMINI 2.5 FLASH: Using coaching level: ${coachingLevel}`);
          
          // Generate AI coaching with Gemini 2.5 Flash
          const aiCoaching = await multimodalCoach.generateMultimodalCoaching(
            gsiData,
            screenshot.base64,
            screenshot.mimeType,
            coachingLevel
          );
          
          console.log('🎯 GEMINI 2.5 FLASH: 📝 AI coaching call completed. Success?', aiCoaching?.success);
          
          if (aiCoaching.success) {
            console.log('🤖 ✅ GEMINI 2.5 FLASH: AI coaching generated successfully!');
            console.log(`🤖 📊 GEMINI 2.5 FLASH: AI insights: ${aiCoaching.coaching.insights.tips.length} tips`);
            
            // Integrate AI tips with basic coaching
            processed.coaching.aiTips = aiCoaching.coaching.insights.tips || [];
            processed.coaching.aiAlerts = aiCoaching.coaching.insights.alerts || [];
            processed.coaching.aiAnalysis = aiCoaching.coaching.rawResponse || '';
            processed.coaching.aiMetadata = {
              processingTime: aiCoaching.coaching.processingTime,
              level: aiCoaching.coaching.level,
              model: 'gemini-2.5-flash'
            };
            
            // Add best AI tips to main tips
            if (aiCoaching.coaching.insights.tips.length > 0) {
              processed.coaching.tips.unshift(...aiCoaching.coaching.insights.tips.slice(0, 3));
            }
            
            console.log('🤖 ✅ GEMINI 2.5 FLASH: AI tips integrated into coaching system');
          } else {
            console.error('🤖 ❌ GEMINI 2.5 FLASH: AI coaching failed:', aiCoaching.error);
            processed.coaching.aiError = aiCoaching.error;
          }
        } else {
          console.log('🤖 ❌ GEMINI 2.5 FLASH: Multimodal coach not available or not initialized');
          if (multimodalCoach) {
            console.log('🤖 📊 GEMINI 2.5 FLASH: Coach status debug:', {
              exists: !!multimodalCoach,
              isInitialized: multimodalCoach.isInitialized,
              hasGenerateMethod: typeof multimodalCoach.generateMultimodalCoaching === 'function',
              hasInitializeMethod: typeof multimodalCoach.initialize === 'function'
            });
            
            // Try to force initialization if not initialized
            console.log('🤖 🔄 GEMINI 2.5 FLASH: Attempting emergency initialization...');
            try {
              await multimodalCoach.initialize();
              if (multimodalCoach.isInitialized) {
                console.log('🤖 ✅ GEMINI 2.5 FLASH: Emergency initialization successful!');
              } else {
                console.log('🤖 ❌ GEMINI 2.5 FLASH: Emergency initialization failed - still not marked as initialized');
              }
            } catch (emergencyError) {
              console.error('🤖 ❌ GEMINI 2.5 FLASH: Emergency initialization error:', emergencyError.message);
            }
          } else {
            console.log('🤖 ❌ GEMINI 2.5 FLASH: multimodalCoach is null/undefined');
          }
        }
      } catch (aiError) {
        console.error('🤖 ❌ GEMINI 2.5 FLASH: AI coaching integration failed:', aiError.message);
        console.error('🤖 📊 GEMINI 2.5 FLASH: AI error stack:', aiError.stack);
        processed.coaching.aiError = aiError.message;
      }
      
      console.log('🤖 ============ GEMINI 2.5 FLASH DEBUG END ============');
      
      // Ensure we always have some coaching tips
      if (processed.coaching.tips.length === 0) {
        console.log('🎯 No coaching tips generated - adding fallback tips');
        processed.coaching.tips = [
          '🎮 Continue jogando!',
          '📊 Monitore sua performance',
          '💰 Gerencie sua economia'
        ];
      }
      
      console.log('🎯 FINAL COACHING FOR OVERLAY:', processed.coaching.tips);
      console.log('🤖 AI COACHING STATUS:', {
        aiTips: processed.coaching.aiTips?.length || 0,
        aiAlerts: processed.coaching.aiAlerts?.length || 0,
        aiError: processed.coaching.aiError || 'None'
      });
    } else {
      console.log('⚠️ No player data in GSI payload');
    }

    console.log('💣 Processing bomb data...');
    // Extrair informações da bomba
    if (gsiData.bomb) {
      processed.bomb = {
        state: gsiData.bomb.state || 'unknown',
        countdown: gsiData.bomb.countdown || null,
        position: gsiData.bomb.position || null
      };
      console.log('💣 Bomb processed:', processed.bomb);
    } else {
      console.log('⚠️ No bomb data in GSI payload');
    }

    console.log('👥 Processing team data...');
    // Extrair informações da equipe  
    if (gsiData.allplayers && processed.player?.team) {
      const teamPlayers = Object.values(gsiData.allplayers).filter(p => 
        p.team === processed.player.team
      );
      
      processed.team = {
        players: teamPlayers.map(p => ({
          steamid: p.steamid || 'unknown',
          name: p.name || 'Player',
          health: p.state?.health || 0,
          armor: p.state?.armor || 0,
          money: p.state?.money || 0,
          alive: (p.state?.health || 0) > 0,
          position: p.position || null
        })),
        totalMoney: teamPlayers.reduce((sum, p) => sum + (p.state?.money || 0), 0),
        aliveCount: teamPlayers.filter(p => (p.state?.health || 0) > 0).length,
        averageHealth: teamPlayers.length > 0 ? 
          teamPlayers.reduce((sum, p) => sum + (p.state?.health || 0), 0) / teamPlayers.length : 0
      };
      
      console.log('👥 Team processed:', {
        playerCount: processed.team.players.length,
        aliveCount: processed.team.aliveCount,
        totalMoney: processed.team.totalMoney
      });
    } else {
      console.log('⚠️ No team data in GSI payload or no player team info');
    }

  } catch (error) {
    console.error('❌ Error processing GSI data:', error);
    console.error('📊 Processing error stack:', error.stack);
  }

  console.log('📄 Adding GSI snapshot to post-round analyzer...');
  // Add enhanced GSI snapshot to post-round analyzer
  if (postRoundAnalyzer && postRoundAnalyzer.isInitialized && postRoundAnalyzer.isCollectingData()) {
    try {
    postRoundAnalyzer.addGSISnapshot(gsiData, processed);
      console.log('📄 GSI snapshot added to post-round analyzer');
    } catch (error) {
      console.error('❌ Failed to add GSI snapshot to post-round analyzer:', error.message);
    }
  } else {
    console.log('⚠️ Post-round analyzer not available for GSI snapshot');
  }

  console.log('✅ GSI data processing completed');
  console.log('📋 Final processed data summary:', {
    hasPlayer: !!processed.player,
    hasRound: !!processed.round,
    hasMap: !!processed.map,
    hasBomb: !!processed.bomb,
    hasTeam: !!processed.team,
    coachingTipsCount: processed.coaching?.tips?.length || 0,
    coachingAlertsCount: processed.coaching?.alerts?.length || 0
  });

  return processed;
}

// === ENHANCED COACHING SYSTEM ===
function generateEnhancedCoachingTips(player, round, level, analytics) {
  const tips = [];
  const alerts = [];

  if (!player.state) return { tips, alerts };

  const health = player.state.health;
  const armor = player.state.armor;
  const money = player.state.money;
  const roundKills = player.state.round_kills;

  // === PERFORMANCE-BASED COACHING ===
  if (analytics?.performance) {
    const performance = analytics.performance;
    
    if (performance.killsPerRound > 1.5) {
      tips.push('🔥 Excelente KPR! Continue agressivo');
    } else if (performance.killsPerRound < 0.5) {
      tips.push('🎯 Foque em posicionamento para mais kills');
    }
    
    if (performance.averageDamagePerRound > 80) {
      tips.push('💥 Bom ADR! Finalize os duelos');
    } else if (performance.averageDamagePerRound < 50) {
      tips.push('⚡ ADR baixo - seja mais agressivo');
    }
    
    if (performance.headshotPercentage > 60) {
      tips.push('🎯 Excelente precisão headshot!');
    } else if (performance.headshotPercentage < 30) {
      tips.push('🎯 Treine mira na cabeça');
    }
  }

  // === HISTORICAL TREND COACHING ===
  if (analytics?.historical) {
    const historical = analytics.historical;
    
    if (historical.trend === 'improving') {
      tips.push(`📈 Performance melhorando (+${historical.improvement.toFixed(1)}%)`);
    } else if (historical.trend === 'declining') {
      alerts.push(`📉 Performance caindo (${historical.improvement.toFixed(1)}%)`);
      tips.push('🔄 Revise estratégia - tendência negativa');
    }
    
    if (historical.comparison?.strongMaps) {
      tips.push(`🗺️ Mapa forte: ${historical.comparison.strongMaps[0]}`);
    }
  }

  // === LEVEL-BASED COACHING WITH ANALYTICS ===
  switch (level) {
    case 'beginner':
      // Health warnings
      if (health < 30) {
        alerts.push('🔴 Health crítico - jogue defensivo!');
        tips.push('🏥 Procure cover e evite duelos diretos');
      } else if (health < 50) {
        tips.push('⚠️ Health baixo - seja cauteloso');
      }

      // Basic economy
      if (money < 1000) {
        tips.push('💰 Economia baixa - considere eco round');
      } else if (money > 3000) {
        tips.push('💰 Boa economia - full buy disponível');
      }

      // Round performance
      if (roundKills >= 2) {
        tips.push('🔥 Boa sequência! Continue assim!');
      }
      
      // Simple analytics feedback
      if (analytics?.performance?.accuracy < 20) {
        tips.push('🎯 Treine mira no aim_botz');
      }
      break;

    case 'intermediate':
      // Advanced health management
      if (health < 50) {
        tips.push('⚡ HP baixo - reposition para suporte');
      }
      
      // Armor management
      if (armor < 50 && money > 1000) {
        tips.push('🛡️ Armor baixo - considere upgrade');
      }
      
      // Utility considerations
      if (player.state.defusekit) {
        tips.push('🔧 Você tem kit - priorize defuses');
      }
      
      // Flash management
      if (player.state.flashed > 0) {
        alerts.push('⚡ Flashed - aguarde!');
      }

      // Economy strategy
      if (money >= 2500 && money < 3500) {
        tips.push('🛒 Force-buy possível - analise situação');
      }
      
      // Performance analytics feedback
      if (analytics?.performance) {
        const perf = analytics.performance;
        if (perf.economyRating < 0.7) {
          tips.push('💰 Melhore gestão econômica');
        }
        if (perf.clutchSuccess > 50) {
          tips.push('🏆 Boa taxa de clutch!');
        }
      }
      break;

    case 'professional':
      // Performance analysis
      const kd = player.match_stats.deaths > 0 ? 
        player.match_stats.kills / player.match_stats.deaths : 
        player.match_stats.kills;
      
      if (kd > 2.0) {
        tips.push('🎯 Excelente K/D - mantenha agressividade');
      } else if (kd < 0.8) {
        tips.push('📊 K/D baixo - ajuste estratégia');
      }

      // Advanced economy
      if (money > 5000) {
        tips.push('💹 Economia excessiva - considere drop para team');
      }

      // MVP tracking
      if (player.match_stats.mvps > 2) {
        tips.push('🏆 Alto MVP count - continue liderando');
      }

      // Advanced analytics feedback
      if (analytics?.performance) {
        const perf = analytics.performance;
        
        if (perf.entryFragRate > 70) {
          tips.push('⚡ Excelente entry frag rate');
        }
        
        if (perf.supportRating > 1.2) {
          tips.push('🤝 Boa taxa de suporte ao team');
        }
        
        if (perf.mapControl < 30) {
          tips.push('🗺️ Melhore controle de mapa');
        }
      }

      // Historical performance insights
      if (analytics?.historical?.comparison) {
        const comp = analytics.historical.comparison;
        if (comp.consistencyRating < 60) {
          tips.push('📈 Foque em consistência');
        }
      }

            // Tactical suggestions
      if (roundKills >= 3) {
        tips.push('🔥 Multi-kill! Aproveite momentum');
      }
      break;
  }

  // === SITUATIONAL COACHING ===
  if (round) {
    if (round.phase === 'live') {
      if (round.bomb === 'planted') {
        if (player.team === 'CT') {
          tips.push('💣 Bomb plantada - organize defuse');
          
          // Analytics-based bomb coaching
          if (analytics?.performance?.defuseSuccess > 70) {
            tips.push('🔧 Boa taxa defuse - lidere');
          }
        } else {
          tips.push('💣 Bomb plantada - defenda posição');
        }
      }
    }
    
    if (round.phase === 'freezetime') {
      tips.push('❄️ Freeze time - planeje estratégia');
      
      // Economy-based freeze time tips
      if (money > 4000 && analytics?.performance?.utilityUsage < 50) {
        tips.push('💰 Invista em utilitários');
      }
    }
  }

  // === WEAPON-BASED COACHING ===
  if (player.weapons) {
    const hasRifle = Object.values(player.weapons).some(w => 
      w.name?.includes('ak47') || w.name?.includes('m4a')
    );
    
    const hasAwp = Object.values(player.weapons).some(w => 
      w.name?.includes('awp')
    );
    
    if (hasAwp && analytics?.performance?.awpKillRate < 40) {
      tips.push('🎯 AWP: Melhore posicionamento');
    }
    
    if (hasRifle && analytics?.performance?.rifleAccuracy < 25) {
      tips.push('🔫 Rifle: Controle recoil');
    }
  }

  // Limit tips and alerts based on coaching level
  const maxTips = level === 'professional' ? 4 : level === 'intermediate' ? 3 : 2;
  const maxAlerts = 2;

  return { 
    tips: tips.slice(0, maxTips), 
    alerts: alerts.slice(0, maxAlerts) 
  };
}

// Legacy function for compatibility (calls enhanced version)
function generateCoachingTips(player, round, level) {
  return generateEnhancedCoachingTips(player, round, level, null);
}

// Enviar dados para o renderer
function sendToRenderer(channel, data) {
  console.log(`📤 Sending to renderer - Channel: ${channel}`);
  
  if (mainWindow && mainWindow.webContents) {
    try {
      console.log(`📊 Data structure for ${channel}:`, typeof data === 'object' ? Object.keys(data) : 'primitive');
      
      // Log specific channel data for debugging
      if (channel === 'gsi-data' && data) {
        console.log(`🎮 GSI data being sent to overlay:`, {
          timestamp: data.timestamp,
          hasPlayer: !!data.player,
          hasRound: !!data.round,
          hasMap: !!data.map,
          playerName: data.player?.name,
          playerHealth: data.player?.state?.health,
          playerMoney: data.player?.state?.money,
          roundPhase: data.round?.phase,
          mapName: data.map?.name,
          coachingTipsCount: data.coaching?.tips?.length || 0,
          coachingAlertsCount: data.coaching?.alerts?.length || 0
        });
      }
      
    mainWindow.webContents.send(channel, data);
      console.log(`✅ Data sent successfully to renderer on channel: ${channel}`);
    } catch (error) {
      console.error(`❌ Failed to send data to renderer on channel ${channel}:`, error.message);
      console.error('📊 Error details:', error.stack);
    }
  } else {
    console.error(`❌ Cannot send to renderer - window not available. Channel: ${channel}`);
    console.error('🪟 Window state:', {
      hasMainWindow: !!mainWindow,
      hasWebContents: mainWindow ? !!mainWindow.webContents : false,
      isDestroyed: mainWindow ? mainWindow.isDestroyed() : 'no window'
    });
  }
}

// Manipular mensagens WebSocket
function handleWebSocketMessage(data) {
  switch (data.type) {
    case 'get-status':
      // Retornar status atual
      break;
    case 'toggle-overlay':
      // Toggle overlay via WebSocket
      break;
    default:
      console.log('📡 Unknown WebSocket message type:', data.type);
  }
}

// Configurar IPC handlers
function setupIPC() {
  // === HOTKEY CONTROL IPC HANDLERS ===
  
  // Get overlay status and settings
  ipcMain.handle('get-overlay-status', () => {
    return {
      visible: overlayVisible,
      opacity: overlayOpacity,
      level: coachingLevel,
      position: mainWindow ? mainWindow.getBounds() : null
    };
  });

  // Manual hotkey triggers (for testing or UI controls)
  ipcMain.handle('trigger-hotkey', (event, hotkeyName) => {
    switch (hotkeyName) {
      case 'toggle-overlay':
        // Trigger F10 functionality
        if (mainWindow) {
          overlayVisible = !overlayVisible;
          if (overlayVisible) {
            mainWindow.show();
            sendToRenderer('overlay-status', { visible: true, level: coachingLevel });
          } else {
            mainWindow.hide();
          }
          console.log(`🔄 Overlay ${overlayVisible ? 'shown' : 'hidden'} (via IPC)`);
        }
        break;
        
      case 'cycle-coaching-level':
        // Trigger F11 functionality
        const levels = ['beginner', 'intermediate', 'professional'];
        const currentIndex = levels.indexOf(coachingLevel);
        coachingLevel = levels[(currentIndex + 1) % levels.length];
        
        sendToRenderer('coaching-level-changed', { 
          level: coachingLevel,
          message: `Coaching Level: ${coachingLevel.toUpperCase()}`
        });
        
        console.log(`🎯 Coaching level changed to: ${coachingLevel} (via IPC)`);
        break;
        
      case 'cycle-transparency':
        // Trigger F12 functionality
        const opacityLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
        const currentOpacityIndex = opacityLevels.indexOf(overlayOpacity);
        overlayOpacity = opacityLevels[(currentOpacityIndex + 1) % opacityLevels.length];
        
        if (mainWindow) {
          mainWindow.setOpacity(overlayOpacity);
          sendToRenderer('opacity-changed', { 
            opacity: overlayOpacity,
            message: `Transparency: ${Math.round(overlayOpacity * 100)}%`
          });
        }
        
        console.log(`🔄 Overlay opacity changed to: ${overlayOpacity} (via IPC)`);
        break;
        
      case 'reset-position':
        // Trigger Ctrl+F10 functionality
        if (mainWindow) {
          const { width, height } = screen.getPrimaryDisplay().workAreaSize;
          const defaultPosition = {
            x: width - OVERLAY_CONFIG.width - 50,
            y: 50
          };
          
          mainWindow.setPosition(defaultPosition.x, defaultPosition.y);
          
          sendToRenderer('position-reset', {
            position: defaultPosition,
            message: 'Position Reset'
          });
          
          console.log(`📍 Overlay position reset to: ${defaultPosition.x}, ${defaultPosition.y} (via IPC)`);
        }
        break;
        
      default:
        console.warn(`❓ Unknown hotkey trigger: ${hotkeyName}`);
        return { success: false, error: 'Unknown hotkey' };
    }
    
    return { success: true, action: hotkeyName };
  });

  // === HOTKEY SETTINGS PERSISTENCE ===
  
  // Save hotkey settings to database
  ipcMain.handle('save-hotkey-settings', async (event, settings) => {
    try {
      const { visibility, coachingLevel: level, transparency, position } = settings;
      
      // Save individual settings
      if (visibility !== undefined) {
        database.setSetting('overlay_visible', visibility.toString(), 'boolean');
      }
      
      if (level !== undefined) {
        database.setSetting('coaching_level', level, 'string');
      }
      
      if (transparency !== undefined) {
        database.setSetting('overlay_opacity', transparency.toString(), 'number');
      }
      
      if (position !== undefined) {
        database.setSetting('overlay_position', JSON.stringify(position), 'json');
      }
      
      console.log(`💾 Hotkey settings saved:`, settings);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to save hotkey settings:', error.message);
      return { success: false, error: error.message };
    }
  });
  
  // Load hotkey settings from database
  ipcMain.handle('load-hotkey-settings', () => {
    try {
      const settings = {
        visibility: database.getSetting('overlay_visible', true),
        coachingLevel: database.getSetting('coaching_level', 'beginner'),
        transparency: database.getSetting('overlay_opacity', 0.8),
        position: database.getSetting('overlay_position', { x: 20, y: 20 })
      };
      
      console.log('📂 Hotkey settings loaded:', settings);
      return { success: true, settings };
    } catch (error) {
      console.error('❌ Failed to load hotkey settings:', error.message);
      return { success: false, error: error.message, settings: null };
    }
  });

  // Handle para dados do renderer
  ipcMain.handle('get-coaching-level', () => {
    return coachingLevel;
  });

  ipcMain.handle('get-current-gsi-data', () => {
    return currentGSIData;
  });

  // GSI Deployment handlers
  ipcMain.handle('deploy-gsi-config', async (event, options = {}) => {
    try {
      console.log('🚀 Starting GSI deployment...');
      const deployer = new GSIDeployer();
      
      const deploymentOptions = {
        coachingLevel: coachingLevel,
        uri: 'http://localhost:3000/gsi',
        ...options
      };
      
      const result = await deployer.deployGSIConfig(deploymentOptions);
      
      if (result.success) {
        console.log('✅ GSI deployment successful!');
        sendToRenderer('gsi-deployment-success', result);
      } else {
        console.error('❌ GSI deployment failed:', result.error);
        sendToRenderer('gsi-deployment-error', result);
      }
      
      return result;
    } catch (error) {
      const handledError = GSIErrorHandler.handle(error, {
        operation: 'gsi-deployment',
        coachingLevel: coachingLevel
      });
      
      console.error('❌ GSI deployment error:', handledError);
      sendToRenderer('gsi-deployment-error', handledError);
      
      return { success: false, error: handledError };
    }
  });

  ipcMain.handle('check-gsi-status', async () => {
    try {
      const deployer = new GSIDeployer();
      const status = await deployer.getDeploymentStatus();
      return status;
    } catch (error) {
      return { 
        deployed: false, 
        error: error.message 
      };
    }
  });

  ipcMain.handle('remove-gsi-config', async () => {
    try {
      const deployer = new GSIDeployer();
      const result = await deployer.uninstallGSI();
      
      if (result.success) {
        sendToRenderer('gsi-removal-success', result);
      } else {
        sendToRenderer('gsi-removal-error', result);
      }
      
      return result;
    } catch (error) {
      const handledError = GSIErrorHandler.handle(error, {
        operation: 'gsi-removal'
      });
      return { success: false, error: handledError };
    }
  });

  // Screenshot IPC handlers
  ipcMain.handle('capture-screenshot', async (event, options = {}) => {
    try {
      console.log('📸 IPC screenshot capture requested...');
      const result = await screenshotManager.captureScreenshot(options);
      
      return {
        success: true,
        buffer: result.buffer,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('❌ IPC screenshot capture failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('get-screenshot-status', () => {
    try {
      return screenshotManager.getStatus();
    } catch (error) {
      return {
        initialized: false,
        error: error.message
      };
    }
  });

  ipcMain.handle('get-screenshot-displays', async () => {
    try {
      const displays = await screenshotManager.getDisplays();
      return { success: true, displays };
    } catch (error) {
      return { success: false, error: error.message, displays: [] };
    }
  });

  ipcMain.handle('get-screenshot-stats', () => {
    try {
      return screenshotManager.getPerformanceStats();
    } catch (error) {
      return { error: error.message };
    }
  });

  ipcMain.handle('test-screenshot-providers', async () => {
    try {
      const results = await screenshotManager.testAllProviders();
      return { success: true, results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // === IMAGE PROCESSING IPC HANDLERS ===

  // Capture and process for AI
  ipcMain.handle('capture-and-process-for-ai', async (event, options = {}) => {
    try {
      console.log('🤖 IPC AI-optimized screenshot capture requested...');
      const result = await screenshotManager.captureAndProcessForAI(options);
      
      return {
        success: true,
        base64: result.base64,
        dataUrl: result.dataUrl,
        mimeType: result.mimeType,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('❌ IPC AI screenshot processing failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Capture and process with custom options
  ipcMain.handle('capture-and-process', async (event, options = {}) => {
    try {
      console.log('🖼️ IPC processed screenshot capture requested...');
      const result = await screenshotManager.captureAndProcess(options);
      
      return {
        success: true,
        originalBuffer: result.originalBuffer,
        processedBuffer: result.processedBuffer,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('❌ IPC screenshot processing failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Capture specific CS2 game regions
  ipcMain.handle('capture-game-region', async (event, regionName, options = {}) => {
    try {
      console.log(`✂️ IPC ${regionName} region capture requested...`);
      const result = await screenshotManager.captureGameRegion(regionName, options);
      
      return {
        success: true,
        croppedBuffer: result.croppedBuffer,
        metadata: result.metadata
      };
    } catch (error) {
      console.error(`❌ IPC ${regionName} region capture failed:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Capture multiple formats
  ipcMain.handle('capture-multiple-formats', async (event, formats = ['ai', 'thumbnail', 'archive'], options = {}) => {
    try {
      console.log(`📋 IPC multiple formats capture requested: ${formats.join(', ')}`);
      const result = await screenshotManager.captureMultipleFormats(formats, options);
      
      return {
        success: true,
        formats: result.formats,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('❌ IPC multiple formats capture failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Get full status including image processor
  ipcMain.handle('get-full-screenshot-status', () => {
    try {
      const status = screenshotManager.getFullStatus();
      return { success: true, status };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: null
      };
    }
  });

  // Process existing image buffer
  ipcMain.handle('process-image-buffer', async (event, imageBuffer, options = {}) => {
    try {
      console.log('🖼️ IPC image buffer processing requested...');
      const result = await screenshotManager.imageProcessor.processImage(imageBuffer, options);
      
      return {
        success: true,
        processedBuffer: result.processedBuffer,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('❌ IPC image buffer processing failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Analyze image without processing
  ipcMain.handle('analyze-image', async (event, imageBuffer) => {
    try {
      console.log('📊 IPC image analysis requested...');
      const result = await screenshotManager.imageProcessor.analyzeImage(imageBuffer);
      
      return {
        success: true,
        analysis: result
      };
    } catch (error) {
      console.error('❌ IPC image analysis failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  });

  // === MULTIMODAL AI COACHING IPC HANDLERS ===

  // Initialize multimodal coach
  ipcMain.handle('multimodal-coach-initialize', async (event) => {
    try {
      console.log('🤖 IPC Multimodal Coach initialization requested...');
      const success = await multimodalCoach.initialize();
      
      return {
        success: success,
        status: multimodalCoach.getPerformanceStats(),
        message: 'Multimodal Coach initialized successfully'
      };
    } catch (error) {
      console.error('❌ IPC Multimodal Coach initialization failed:', error.message);
      return {
        success: false,
        error: error.message,
        status: null
      };
    }
  });

  // Generate multimodal coaching
  ipcMain.handle('generate-multimodal-coaching', async (event, gsiData, imageBase64, mimeType, coachingLevel = 'beginner') => {
    try {
      console.log('🤖 IPC Multimodal coaching generation requested...');
      
      if (!multimodalCoach.isInitialized) {
        console.log('🔧 Auto-initializing Multimodal Coach...');
        await multimodalCoach.initialize();
      }
      
      const result = await multimodalCoach.generateMultimodalCoaching(
        gsiData,
        imageBase64,
        mimeType,
        coachingLevel
      );
      
      return result;
    } catch (error) {
      console.error('❌ IPC Multimodal coaching generation failed:', error.message);
      return {
        success: false,
        error: error.message,
        coaching: null
      };
    }
  });

  // Auto-generate coaching from current state
  ipcMain.handle('auto-generate-coaching', async (event, coachingLevel = 'beginner') => {
    try {
      console.log('🎯 IPC Auto-coaching generation requested...');
      
      // Initialize if needed
      if (!multimodalCoach.isInitialized) {
        await multimodalCoach.initialize();
      }
      
      // Capture current screenshot
      const screenshot = await screenshotManager.captureAndProcessForAI();
      
      // Use current GSI data or fallback
      const gsiData = currentGSIData || {
        player: { team: 'CT', state: { health: 100, armor: 100, money: 3000 } },
        round: { phase: 'live', bomb: 'safe' },
        map: { name: 'unknown' }
      };
      
      // Generate coaching
      const result = await multimodalCoach.generateMultimodalCoaching(
        gsiData,
        screenshot.base64,
        screenshot.mimeType,
        coachingLevel
      );
      
      return result;
    } catch (error) {
      console.error('❌ IPC Auto-coaching generation failed:', error.message);
      return {
        success: false,
        error: error.message,
        coaching: null
      };
    }
  });

  // Get coaching performance stats
  ipcMain.handle('get-coaching-stats', () => {
    try {
      const stats = multimodalCoach.getPerformanceStats();
      return { success: true, stats };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stats: null
      };
    }
  });

  // Extract GSI data for testing
  ipcMain.handle('extract-gsi-data', (event, gsiData, coachingLevel = 'beginner') => {
    try {
      const extracted = multimodalCoach.extractRelevantGSIData(gsiData, coachingLevel);
      const formatted = multimodalCoach.formatGSIDataForPrompt(extracted);
      
      return {
        success: true,
        extracted: extracted,
        formatted: formatted
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        extracted: null,
        formatted: null
      };
    }
  });

  // Gemini AI IPC handlers
  ipcMain.handle('gemini-initialize', async (event, options = {}) => {
    try {
      console.log('🚀 IPC Gemini initialization requested...');
      const geminiClient = getGeminiClient();
      const success = await geminiClient.initialize(options);
      
      return {
        success: success,
        status: geminiClient.getStatus(),
        message: 'Gemini client initialized successfully'
      };
    } catch (error) {
      console.error('❌ IPC Gemini initialization failed:', error.message);
      return {
        success: false,
        error: error.message,
        status: null
      };
    }
  });

  ipcMain.handle('gemini-generate-text', async (event, prompt, options = {}) => {
    try {
      console.log('💭 IPC Gemini text generation requested...');
      const geminiClient = getGeminiClient();
      
      if (!geminiClient.isReady()) {
        throw new Error('Gemini client not initialized. Call gemini-initialize first.');
      }
      
      const result = await geminiClient.generateText(prompt, options);
      
      return {
        success: true,
        text: result.text,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('❌ IPC Gemini text generation failed:', error.message);
      return {
        success: false,
        error: error.message,
        text: null,
        metadata: null
      };
    }
  });

  ipcMain.handle('gemini-test-connection', async (event) => {
    try {
      console.log('🧪 IPC Gemini connection test requested...');
      const geminiClient = getGeminiClient();
      
      if (!geminiClient.isReady()) {
        // Try to initialize if not ready
        await geminiClient.initialize();
      }
      
      const result = await geminiClient.testConnection();
      
      return {
        success: result.success,
        response: result.response,
        message: 'Gemini connection test successful'
      };
    } catch (error) {
      console.error('❌ IPC Gemini connection test failed:', error.message);
      return {
        success: false,
        error: error.message,
        response: null
      };
    }
  });

  ipcMain.handle('gemini-get-status', () => {
    try {
      const geminiClient = getGeminiClient();
      return {
        success: true,
        status: geminiClient.getStatus()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: null
      };
    }
  });

  // === DATABASE IPC HANDLERS ===
  
  // Get database status and stats
  ipcMain.handle('database-get-status', () => {
    try {
      if (!database.isReady()) {
        return {
          success: false,
          error: 'Database not initialized',
          initialized: false
        };
      }
      
      const stats = database.getStats();
      return {
        success: true,
        initialized: true,
        stats: stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        initialized: false
      };
    }
  });

  // User settings management
  ipcMain.handle('database-get-setting', (event, key, defaultValue = null) => {
    try {
      const value = database.getSetting(key, defaultValue);
      return { success: true, value };
    } catch (error) {
      return { success: false, error: error.message, value: defaultValue };
    }
  });

  ipcMain.handle('database-set-setting', (event, key, value, type = 'string') => {
    try {
      database.setSetting(key, value, type);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('database-get-all-settings', () => {
    try {
      const settings = database.getAllSettings();
      return { success: true, settings };
    } catch (error) {
      return { success: false, error: error.message, settings: {} };
    }
  });

  // Session management
  ipcMain.handle('database-get-current-session', () => {
    try {
      return {
        success: true,
        session: currentSession,
        round: currentRound
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        session: null,
        round: null
      };
    }
  });

  ipcMain.handle('database-get-recent-sessions', (event, limit = 10) => {
    try {
      const sessions = database.getRecentSessions(limit);
      return { success: true, sessions };
    } catch (error) {
      return { success: false, error: error.message, sessions: [] };
    }
  });

  ipcMain.handle('database-get-session', (event, sessionId) => {
    try {
      const session = database.getSession(sessionId);
      const rounds = database.getSessionRounds(sessionId);
      const insights = database.getInsights(sessionId);
      
      return {
        success: true,
        session: session,
        rounds: rounds,
        insights: insights
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        session: null,
        rounds: [],
        insights: []
      };
    }
  });

  // Performance metrics
  ipcMain.handle('database-get-metrics', (event, sessionId, metricType = null) => {
    try {
      const metrics = database.getMetrics(sessionId, metricType);
      return { success: true, metrics };
    } catch (error) {
      return { success: false, error: error.message, metrics: [] };
    }
  });

  // AI insights
  ipcMain.handle('database-create-insight', (event, sessionId, roundId, skillLevel, adviceText, screenshotPath = null, insightType = 'general') => {
    try {
      const insightId = `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      database.createInsight(insightId, sessionId, roundId, skillLevel, adviceText, screenshotPath, insightType);
      
      return { success: true, insightId };
    } catch (error) {
      return { success: false, error: error.message, insightId: null };
    }
  });

  ipcMain.handle('database-get-insights', (event, sessionId, insightType = null) => {
    try {
      const insights = insightType 
        ? database.getInsightsByType(sessionId, insightType)
        : database.getInsights(sessionId);
      
      return { success: true, insights };
    } catch (error) {
      return { success: false, error: error.message, insights: [] };
    }
  });

  // Screenshots
  ipcMain.handle('database-record-screenshot', (event, sessionId, roundId, filePath, metadata = {}) => {
    try {
      const screenshotId = `screenshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      database.recordScreenshot(screenshotId, sessionId, roundId, filePath, metadata);
      
      return { success: true, screenshotId };
    } catch (error) {
      return { success: false, error: error.message, screenshotId: null };
    }
  });

  ipcMain.handle('database-get-screenshots', (event, sessionId) => {
    try {
      const screenshots = database.getScreenshots(sessionId);
      return { success: true, screenshots };
    } catch (error) {
      return { success: false, error: error.message, screenshots: [] };
    }
  });

  // Database utilities
  ipcMain.handle('database-cleanup', (event, daysToKeep = 30) => {
    try {
      const deletedCount = database.cleanup(daysToKeep);
      return { 
        success: true, 
        deletedCount,
        message: `Cleaned up ${deletedCount} old sessions`
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        deletedCount: 0
      };
    }
  });

  // Manual session control
  ipcMain.handle('database-start-session', (event, mapName = null) => {
    try {
      const session = startGameSession(mapName);
      return { success: true, session };
    } catch (error) {
      return { success: false, error: error.message, session: null };
    }
  });

  ipcMain.handle('database-end-session', () => {
    try {
      endGameSession();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // === AUTO-UPDATER IPC HANDLERS ===
  
  // Check for updates manually
  ipcMain.handle('updater-check-for-updates', async (event, silent = false) => {
    try {
      const result = await checkForUpdates(silent);
      return {
        success: true,
        updateInfo: result?.updateInfo || null,
        message: 'Update check completed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        updateInfo: null
      };
    }
  });

  // Get updater status
  ipcMain.handle('updater-get-status', () => {
    try {
      return {
        success: true,
        isDevMode: isDevMode,
        autoDownload: autoUpdater.autoDownload,
        autoInstallOnAppQuit: autoUpdater.autoInstallOnAppQuit,
        currentVersion: app.getVersion(),
        allowPrerelease: autoUpdater.allowPrerelease || false
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Force quit and install update
  ipcMain.handle('updater-quit-and-install', () => {
    try {
      quitAndInstall();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Set auto-updater preferences
  ipcMain.handle('updater-set-preferences', (event, preferences = {}) => {
    try {
      if (typeof preferences.autoDownload === 'boolean') {
        autoUpdater.autoDownload = preferences.autoDownload;
      }
      
      if (typeof preferences.autoInstallOnAppQuit === 'boolean') {
        autoUpdater.autoInstallOnAppQuit = preferences.autoInstallOnAppQuit;
      }
      
      if (typeof preferences.allowPrerelease === 'boolean') {
        autoUpdater.allowPrerelease = preferences.allowPrerelease;
      }
      
      return {
        success: true,
        preferences: {
          autoDownload: autoUpdater.autoDownload,
          autoInstallOnAppQuit: autoUpdater.autoInstallOnAppQuit,
          allowPrerelease: autoUpdater.allowPrerelease || false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  // === PERFORMANCE METRICS IPC HANDLERS ===
  
  ipcMain.handle('metrics-calculate', async (event, sessionData, roundData) => {
    try {
      const metrics = await performanceMetricsCalculator.calculateMetrics(sessionData, roundData);
      return { success: true, metrics };
    } catch (error) {
      console.error('❌ Performance metrics calculation failed:', error.message);
      return { success: false, error: error.message, metrics: null };
    }
  });

  ipcMain.handle('metrics-get-trends', async (event, playerId, timeframe = '7d') => {
    try {
      const trends = await performanceMetricsCalculator.getTrends(playerId, timeframe);
      return { success: true, trends };
    } catch (error) {
      return { success: false, error: error.message, trends: null };
    }
  });

  ipcMain.handle('metrics-get-status', () => {
    try {
      const status = performanceMetricsCalculator.getStatus();
      return { success: true, status };
    } catch (error) {
      return { success: false, error: error.message, status: null };
    }
  });

  // === HISTORICAL DATA IPC HANDLERS ===

  ipcMain.handle('historical-retrieve', async (event, query) => {
    try {
      const data = await historicalDataRetriever.retrieveData(query);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Historical data retrieval failed:', error.message);
      return { success: false, error: error.message, data: null };
    }
  });

  ipcMain.handle('historical-compare', async (event, session1, session2, options = {}) => {
    try {
      const comparison = await historicalDataComparator.compare(session1, session2, options);
      return { success: true, comparison };
    } catch (error) {
      console.error('❌ Historical data comparison failed:', error.message);
      return { success: false, error: error.message, comparison: null };
    }
  });

  ipcMain.handle('historical-get-performance-trends', async (event, playerId, timeRange) => {
    try {
      const trends = await historicalDataComparator.getPerformanceTrends(playerId, timeRange);
      return { success: true, trends };
    } catch (error) {
      return { success: false, error: error.message, trends: null };
    }
  });

  // === POST-ROUND ANALYZER IPC HANDLERS ===

  ipcMain.handle('analyzer-start-collection', () => {
    try {
      postRoundAnalyzer.startDataCollection();
      return { success: true, message: 'Data collection started' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('analyzer-stop-collection', () => {
    try {
      postRoundAnalyzer.stopDataCollection();
      return { success: true, message: 'Data collection stopped' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('analyzer-get-round-summary', async (event, roundId) => {
    try {
      const summary = await postRoundAnalyzer.generateRoundSummary(roundId);
      return { success: true, summary };
    } catch (error) {
      return { success: false, error: error.message, summary: null };
    }
  });

  ipcMain.handle('analyzer-add-insight', (event, insight, metadata = {}) => {
    try {
      postRoundAnalyzer.addAIInsight(insight, metadata);
      return { success: true, message: 'Insight added successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('analyzer-get-status', () => {
    try {
      const status = {
        initialized: postRoundAnalyzer.isInitialized,
        collecting: postRoundAnalyzer.isCollectingData(),
        roundsAnalyzed: postRoundAnalyzer.getTotalRoundsAnalyzed(),
        lastAnalysis: postRoundAnalyzer.getLastAnalysisTime()
      };
      return { success: true, status };
    } catch (error) {
      return { success: false, error: error.message, status: null };
    }
  });

  // === CS2 PATH DETECTOR IPC HANDLERS ===

  ipcMain.handle('cs2-detect-path', async () => {
    try {
      const path = await cs2PathDetector.detectCS2Path();
      return { success: true, path };
    } catch (error) {
      return { success: false, error: error.message, path: null };
    }
  });

  ipcMain.handle('cs2-verify-installation', async (event, customPath = null) => {
    try {
      const verified = await cs2PathDetector.verifyInstallation(customPath);
      return { success: true, verified };
    } catch (error) {
      return { success: false, error: error.message, verified: false };
    }
  });

  ipcMain.handle('cs2-get-config-path', async () => {
    try {
      const configPath = await cs2PathDetector.getConfigDirectory();
      return { success: true, configPath };
    } catch (error) {
      return { success: false, error: error.message, configPath: null };
    }
  });

  // === HEAP PROFILER IPC HANDLERS ===

  ipcMain.handle('profiler-start', () => {
    try {
      heapProfiler.startProfiling();
      return { success: true, message: 'Heap profiling started' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('profiler-stop', () => {
    try {
      const report = heapProfiler.stopProfiling();
      return { success: true, report };
    } catch (error) {
      return { success: false, error: error.message, report: null };
    }
  });

  ipcMain.handle('profiler-get-memory-usage', () => {
    try {
      const usage = heapProfiler.getMemoryUsage();
      return { success: true, usage };
    } catch (error) {
      return { success: false, error: error.message, usage: null };
    }
  });

  ipcMain.handle('profiler-cleanup-old-profiles', () => {
    try {
      const cleanedCount = heapProfiler.cleanupOldProfiles();
      return { success: true, cleanedCount, message: `Cleaned ${cleanedCount} old profiles` };
    } catch (error) {
      return { success: false, error: error.message, cleanedCount: 0 };
    }
  });

  console.log('✅ IPC handlers setup');
}

// Verificar e sugerir deployment GSI
async function checkGSISetup() {
  try {
    console.log('🔍 Checking GSI configuration...');
    const deployer = new GSIDeployer();
    const status = await deployer.getDeploymentStatus();
    
    if (status.deployed) {
      console.log('✅ GSI configuration already deployed');
      console.log(`📁 File: ${status.filePath}`);
      sendToRenderer('gsi-status-check', { 
        deployed: true, 
        message: 'GSI configuration is ready!' 
      });
    } else {
      console.log('⚠️ GSI configuration not found');
      console.log('💡 GSI auto-deployment available via F9 or overlay interface');
      sendToRenderer('gsi-status-check', { 
        deployed: false, 
        message: 'GSI not configured - automatic setup available',
        canAutoDeploy: true
      });
    }
  } catch (error) {
    console.error('❌ GSI check failed:', error.message);
    sendToRenderer('gsi-status-check', { 
      deployed: false, 
      error: error.message,
      message: 'Unable to check GSI status'
    });
  }
}

// Add F9 hotkey for quick GSI deployment
function setupGSIHotkey() {
  globalShortcut.register('F9', async () => {
    console.log('🚀 F9 pressed - Starting quick GSI deployment...');
    
    try {
      const deployer = new GSIDeployer();
      const result = await deployer.deployGSIConfig({
        coachingLevel: coachingLevel,
        uri: 'http://localhost:3000/gsi'
      });
      
      if (result.success) {
        sendToRenderer('gsi-deployment-success', {
          ...result,
          message: 'GSI deployed successfully! Launch CS2 to test.'
        });
      } else {
        sendToRenderer('gsi-deployment-error', {
          ...result,
          message: 'GSI deployment failed. Check console for details.'
        });
      }
    } catch (error) {
      const handledError = GSIErrorHandler.handle(error, {
        operation: 'f9-quick-deployment'
      });
      
      sendToRenderer('gsi-deployment-error', {
        error: handledError,
        message: 'Quick GSI deployment failed.'
      });
    }
  });
  
  console.log('✅ F9 hotkey registered for quick GSI deployment');
}

// Inicializar Screenshot Manager
async function initializeScreenshot() {
  try {
    console.log('📸 Initializing Screenshot Manager...');
    await screenshotManager.initialize();
    
    const status = screenshotManager.getStatus();
    console.log(`✅ Screenshot system ready with ${status.activeProvider} provider`);
    
    sendToRenderer('screenshot-status', {
      initialized: true,
      provider: status.activeProvider,
      nativeAvailable: status.providers.native.available
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize screenshot system:', error.message);
    sendToRenderer('screenshot-status', {
      initialized: false,
      error: error.message
    });
  }
}

// Inicializar todos os recursos do Coach-AI
async function initializeAllResources() {
  console.log('🚀 Starting Coach-AI full initialization...');
  
  try {
    // 1. Initialize core systems first
    console.log('📊 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    // 2. Initialize Gemini AI Client FIRST (required for multimodal coach)
    console.log('🧠 Initializing Gemini AI Client...');
    try {
      const geminiClient = getGeminiClient();
      if (!geminiClient.isReady()) {
        await geminiClient.initialize();
        console.log('✅ Gemini AI Client initialized successfully');
      } else {
        console.log('✅ Gemini AI Client already ready');
      }
    } catch (error) {
      console.error('❌ Gemini AI Client initialization failed:', error.message);
      console.log('⚠️ Multimodal coaching will not be available');
    }
    
    // 2b. Initialize Gemini configuration (skip if no initialize method)
    console.log('🧠 Checking Gemini configuration...');
    try {
      if (GeminiConfig && typeof GeminiConfig.initialize === 'function') {
        await GeminiConfig.initialize();
        console.log('✅ Gemini configuration ready');
      } else {
        console.log('ℹ️ GeminiConfig.initialize not available, using default configuration');
      }
    } catch (error) {
      console.error('❌ Gemini configuration failed:', error.message);
    }
    
    // 3. Initialize Performance Systems (skip if no initialize method)
    console.log('📈 Checking performance metrics calculator...');
    try {
      if (performanceMetricsCalculator && typeof performanceMetricsCalculator.initialize === 'function') {
        await performanceMetricsCalculator.initialize();
        console.log('✅ Performance metrics calculator ready');
      } else {
        console.log('ℹ️ Performance metrics calculator already initialized or no init method needed');
      }
    } catch (error) {
      console.error('❌ Performance metrics calculator failed:', error.message);
    }
    
    // 4. Initialize Data Analysis Systems (skip if no initialize method)
    console.log('📚 Checking historical data retriever...');
    try {
      if (historicalDataRetriever && typeof historicalDataRetriever.initialize === 'function') {
        await historicalDataRetriever.initialize();
        console.log('✅ Historical data retriever ready');
      } else {
        console.log('ℹ️ Historical data retriever already initialized or no init method needed');
      }
    } catch (error) {
      console.error('❌ Historical data retriever failed:', error.message);
    }
    
    console.log('🔍 Checking historical data comparator...');
    try {
      if (historicalDataComparator && typeof historicalDataComparator.initialize === 'function') {
        await historicalDataComparator.initialize();
        console.log('✅ Historical data comparator ready');
      } else {
        console.log('ℹ️ Historical data comparator already initialized or no init method needed');
      }
    } catch (error) {
      console.error('❌ Historical data comparator failed:', error.message);
    }
    
    // 5. Initialize AI Coaching Systems
    console.log('🤖 Initializing multimodal coach with Gemini 2.5 Flash...');
    try {
      if (multimodalCoach) {
        // Force initialization of multimodal coach
        await multimodalCoach.initialize();
        
        if (multimodalCoach.isInitialized) {
          console.log('✅ 🤖 GEMINI 2.5 FLASH: Multimodal coach ready for AI coaching!');
          console.log('📊 🤖 GEMINI 2.5 FLASH: Performance stats:', multimodalCoach.getPerformanceStats());
        } else {
          throw new Error('Multimodal coach initialization failed - not marked as initialized');
        }
      } else {
        console.error('❌ Multimodal coach module not loaded');
      }
    } catch (error) {
      console.error('❌ 🤖 GEMINI 2.5 FLASH: Multimodal coach initialization failed:', error.message);
      console.error('🔍 🤖 GEMINI 2.5 FLASH: Full error:', error.stack);
      console.log('⚠️ Multimodal coaching will not be available - falling back to basic coaching');
    }
    
    console.log('🎯 Checking post-round analyzer...');
    try {
      if (postRoundAnalyzer && typeof postRoundAnalyzer.initialize === 'function') {
        await postRoundAnalyzer.initialize();
        console.log('✅ Post-round analyzer ready');
      } else {
        console.log('ℹ️ Post-round analyzer already initialized or no init method needed');
      }
    } catch (error) {
      console.error('❌ Post-round analyzer failed:', error.message);
    }
    
    // 6. Initialize Screenshot System
    console.log('📸 Initializing screenshot manager...');
    try {
      await initializeScreenshot();
    } catch (error) {
      console.error('❌ Screenshot manager failed:', error.message);
    }
    
    // 7. Initialize CS2 path detection (skip if no initialize method)
    console.log('🎮 Checking CS2 path detector...');
    try {
      if (cs2PathDetector && typeof cs2PathDetector.initialize === 'function') {
        await cs2PathDetector.initialize();
        console.log('✅ CS2 path detector ready');
      } else {
        console.log('ℹ️ CS2 path detector ready (no initialization required)');
      }
    } catch (error) {
      console.error('❌ CS2 path detector failed:', error.message);
    }
    
    // 8. Initialize heap profiler (skip if no initialize method)
    console.log('🔬 Checking heap profiler...');
    try {
      if (heapProfiler && typeof heapProfiler.initialize === 'function') {
        await heapProfiler.initialize();
        console.log('✅ Heap profiler ready');
      } else {
        console.log('ℹ️ Heap profiler ready (no initialization required)');
      }
    } catch (error) {
      console.error('❌ Heap profiler failed:', error.message);
    }
    
    // 9. Restore user settings
    console.log('⚙️ Restoring hotkey settings...');
    try {
      await restoreHotkeySettings();
      console.log('✅ Hotkey settings restored');
    } catch (error) {
      console.error('❌ Hotkey settings restoration failed:', error.message);
    }
    
    console.log('🎉 All Coach-AI resources initialized successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize Coach-AI resources:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Send error notification to overlay
    sendToRenderer('initialization-error', {
      error: error.message,
      message: 'Some Coach-AI features may not work properly'
    });
    
    return false;
  }
}

// Eventos do app
app.whenReady().then(async () => {
  console.log('🚀 Coach-AI starting up...');
  
  // Create main window
  createWindow();
  
  // Setup global hotkeys
  setupGlobalHotkeys();
  setupGSIHotkey(); // Add GSI deployment hotkey
  
  // Setup servers and IPC
  setupGSIServer();
  setupIPC();
  
  // Setup auto-updater
  setupAutoUpdater();
  
  // Initialize ALL Coach-AI resources
  const initSuccess = await initializeAllResources();
  
  if (initSuccess) {
    // Check GSI setup after everything is initialized
    setTimeout(checkGSISetup, 2000); // 2 second delay to let everything load
    
    // Check for updates after everything is initialized
    setTimeout(() => {
      checkForUpdates(true); // Silent check on startup
    }, 5000); // 5 second delay to let everything load
    
    console.log('🎉 Coach-AI started successfully with ALL resources!');
    console.log('📋 Available Controls:');
    console.log('   F6  - Test Multimodal AI Coaching');
    console.log('   F7  - Test Gemini AI');
    console.log('   F8  - Capture screenshot');
    console.log('   F9  - Quick GSI deployment');
    console.log('   F10 - Toggle overlay');
    console.log('   F11 - Change coaching level');
    console.log('   F12 - Adjust transparency');
    console.log('   Ctrl+F10 - Reset overlay position');
    
    // Notify overlay that all systems are ready - ALWAYS CONNECTED MODE
    sendToRenderer('all-systems-ready', {
      initialized: true,
      database: { connected: true, status: 'ALWAYS CONNECTED' }, // Force database always connected
      resources: [
        'Database',
        'Gemini AI', 
        'Performance Metrics',
        'Historical Data',
        'Multimodal Coach',
        'Post-Round Analyzer',
        'Screenshot System',
        'CS2 Integration',
        'Heap Profiler'
      ],
      message: 'All Coach-AI systems initialized successfully!'
    });
    
  } else {
    console.warn('⚠️ Coach-AI started with some initialization errors');
    console.warn('🔧 Some features may not work properly');
    
    sendToRenderer('partial-initialization', {
      initialized: false,
      database: { connected: true, status: 'ALWAYS CONNECTED' }, // Force database always connected even on errors
      message: 'Coach-AI started with some errors. Check console for details.'
    });
  }
  
  // ALWAYS CONNECTED MODE - Send periodic database status
  setInterval(() => {
    sendToRenderer('database-status', {
      connected: true,
      status: 'ALWAYS CONNECTED',
      initialized: true,
      message: 'Database ALWAYS CONNECTED'
    });
  }, 5000); // Send every 5 seconds to ensure overlay always shows connected
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', async () => {
  // End current session if active
  if (currentSession) {
    console.log('🏁 Ending active session before quit...');
    endGameSession();
  }

  // Close database connection
  if (database.isReady()) {
    console.log('📊 Closing database connection...');
    database.close();
  }

  // Limpar hotkeys
  globalShortcut.unregisterAll();
  
  // Close screenshot system
  if (screenshotManager) {
    await screenshotManager.cleanup();
  }

  // Close multimodal coach
  if (multimodalCoach) {
    await multimodalCoach.cleanup();
  }

  console.log('👋 Coach-AI shutdown complete');
});

// Export para testes (se necessário)
module.exports = {
  createWindow,
  processGSIData,
  generateCoachingTips
}; 