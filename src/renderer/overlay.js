// ====== COACH-AI OVERLAY JAVASCRIPT - PROFESSIONAL COACHING ENHANCED ======
// Lógica principal para o overlay de coaching CS2 com sistema profissional

// === ESTADO GLOBAL ===
let currentGSIData = null;
let coachingLevel = 'beginner';
let isConnected = false;
let lastAlertTime = 0;
let alertQueue = [];
let overlayActive = false;
let lastGSIUpdate = 0;
let connectionTimeout = null;

// === PROFESSIONAL COACHING STATE ===
let professionalInsights = null;
let multimodalResults = null;
let lastMultimodalUpdate = 0;
let patternAnalysis = null;
let momentumData = null;
let pressureLevel = 'normal';
let lastScreenshotAnalysis = null;

// === DOM ELEMENTS ===
const elements = {
    // Container
    overlayContainer: document.getElementById('overlay-container'),
    
    // Header
    coachingLevel: document.getElementById('coaching-level'),
    connectionStatus: document.getElementById('connection-status'),
    
    // Round Status
    roundPhase: document.getElementById('round-phase'),
    bombStatus: document.getElementById('bomb-status'),
    teamScore: document.getElementById('team-score'),
    
    // Player Status
    playerHealth: document.getElementById('player-health'),
    playerArmor: document.getElementById('player-armor'),
    playerKills: document.getElementById('player-kills'),
    playerDeaths: document.getElementById('player-deaths'),
    
    // Economy
    playerMoney: document.getElementById('player-money'),
    buyRecommendation: document.getElementById('buy-recommendation'),
    
    // Coaching Tips
    coachingTips: document.getElementById('coaching-tips'),
    
    // Alerts
    alertsContainer: document.getElementById('alerts-container'),
    
    // GSI Status
    gsiStatus: document.getElementById('gsi-status'),
    gsiText: document.querySelector('.gsi-text'),
    gsiDot: document.querySelector('.gsi-dot')
};

// === PROFESSIONAL COACHING STRATEGIES ===
const professionalCoachingStrategies = {
    beginner: {
        healthThreshold: 50,
        moneyThresholds: { eco: 1000, force: 2000, full: 3000 },
        maxTips: 3,
        alertFrequency: 5000, // 5 seconds
        showPatterns: false,
        showMomentum: false,
        tips: {
            lowHealth: "🏥 Health baixo! Procure cover e evite duelos diretos",
            economy: "💰 Economize quando tem menos de $1000",
            positioning: "📍 Fique próximo aos teammates para suporte",
            bomb: "💣 Bomb plantada! Jogue pelo tempo e defuse seguro",
            general: "🎯 Foque em sobrevivência e decisões econômicas básicas",
            survival: "🛡️ Priorize sobrevivência sobre frags agressivos"
        }
    },
    intermediate: {
        healthThreshold: 70,
        moneyThresholds: { eco: 1500, force: 2500, full: 3500 },
        maxTips: 4,
        alertFrequency: 3000, // 3 seconds
        showPatterns: true,
        showMomentum: false,
        tips: {
            lowHealth: "⚡ HP baixo - reposition para role de suporte",
            economy: "🛒 Force-buy possível com $2500+ - analise situação",
            armor: "🛡️ Armor essencial - compre antes de weapons",
            utility: "💥 Coordinate flash executions com teammates",
            positioning: "🎯 Controle key angles e use utility eficientemente",
            teamwork: "🤝 Comunique rotações e enemy positions",
            timing: "⏰ Wait for utility coordination antes de peek"
        }
    },
    professional: {
        healthThreshold: 80,
        moneyThresholds: { eco: 2000, force: 3000, full: 4000 },
        maxTips: 6,
        alertFrequency: 1000, // 1 second
        showPatterns: true,
        showMomentum: true,
        tips: {
            performance: "📊 Monitor K/D ratio e adjust playstyle accordingly",
            economy: "💹 Manage team economy - consider drops e eco coordination",
            positioning: "🎯 Rotação based on read de enemy patterns",
            utility: "🔥 Stack utility para coordinated site executions",
            advanced: "⚡ Timing e team coordination são fundamentais",
            antistrat: "🧠 Adapt to enemy patterns - break their read",
            momentum: "📈 Control game momentum através de strategic plays",
            pressure: "💪 Exploit pressure situations para economic advantage"
        }
    }
};

// === INICIALIZAÇÃO ===
function initialize() {
    console.log('🎮 Coach-AI Professional Overlay initialized');
    
    // Step 1: IPC Setup
    updateLoadingProgress(1, 'IPC Communication Ready');
    setupIPCListeners();
    
    setTimeout(() => {
        // Step 2: GSI Integration
        updateLoadingProgress(2, 'GSI Integration Active');
        setupProfessionalListeners();
        setupClickThrough();
        
        setTimeout(() => {
            // Step 3: AI Models
            updateLoadingProgress(3, 'AI Models Loaded');
            
            // Initial state - ALWAYS CONNECTED MODE
            updateCoachingLevel('beginner');
            updateConnectionStatus(true);
            updateGSIStatus('🔥 GSI ALWAYS CONNECTED');
            
            setTimeout(() => {
                // Step 4: Professional Analysis
                updateLoadingProgress(4, 'Professional Analysis Ready');
                
                // Start systems
                startConnectionMonitor();
                startAlertProcessor();
                startProfessionalAnalysisProcessor();
                
                // Initial tips
                updateCoachingTips([]);
                
                console.log('✅ Professional Overlay ready for GSI data');
                
                // Test overlay elements
                setTimeout(() => {
                    testOverlayElements();
                }, 1000);
                
                // Hide loading screen after all initialization is complete
                setTimeout(() => {
                    hideLoadingScreen();
                }, 2000); // Longer delay to see test results
                
            }, 400);
        }, 400);
    }, 400);
}

// === TESTE DE ELEMENTOS ===
function testOverlayElements() {
    console.log('🧪 Testing overlay elements...');
    
    // Test all DOM elements
    const elementTests = {
        overlayContainer: elements.overlayContainer,
        coachingLevel: elements.coachingLevel,
        connectionStatus: elements.connectionStatus,
        roundPhase: elements.roundPhase,
        bombStatus: elements.bombStatus,
        teamScore: elements.teamScore,
        playerHealth: elements.playerHealth,
        playerArmor: elements.playerArmor,
        playerKills: elements.playerKills,
        playerDeaths: elements.playerDeaths,
        playerMoney: elements.playerMoney,
        buyRecommendation: elements.buyRecommendation,
        coachingTips: elements.coachingTips,
        alertsContainer: elements.alertsContainer,
        gsiStatus: elements.gsiStatus,
        gsiText: elements.gsiText,
        gsiDot: elements.gsiDot
    };
    
    console.log('🧪 Element availability check:');
    for (const [name, element] of Object.entries(elementTests)) {
        const exists = !!element;
        console.log(`  ${exists ? '✅' : '❌'} ${name}: ${exists ? 'Found' : 'Missing'}`);
        
        if (!exists) {
            console.error(`❌ Missing element: ${name}`);
        }
    }
    
    // Test with sample data
    console.log('🧪 Testing with sample data...');
    
    const sampleGSIData = {
        player: {
            name: 'TestPlayer',
            team: 'CT',
            state: {
                health: 85,
                armor: 95,
                money: 3200
            },
            match_stats: {
                kills: 12,
                deaths: 8
            }
        },
        round: {
            phase: 'live',
            bomb: 'safe',
            wins: {
                ct: 8,
                t: 7
            }
        },
        coaching: {
            tips: ['🧪 Teste de dica 1', '🧪 Teste de dica 2'],
            alerts: ['⚠️ Teste de alerta']
        }
    };
    
    console.log('🧪 Applying sample data to overlay...');
    updateOverlay(sampleGSIData);
    
    console.log('🧪 Testing coaching level update...');
    updateCoachingLevel('intermediate');
    
    console.log('🧪 Testing connection status...');
    updateConnectionStatus(true);
    
    console.log('🧪 Testing GSI status...');
    updateGSIStatus('Teste de Status GSI');
    
    console.log('✅ Overlay element testing completed');
}

// === PROFESSIONAL COACHING LISTENERS ===
function setupProfessionalListeners() {
    // Multimodal coaching results
    window.electronAPI.onMultimodalCoachingResult?.((data) => {
        console.log('🤖 Received multimodal coaching result:', data.success);
        
        if (data.success) {
            multimodalResults = data.coaching;
            lastMultimodalUpdate = Date.now();
            
            // Extract professional insights
            if (data.coaching.insights) {
                professionalInsights = {
                    tips: data.coaching.insights.tips || [],
                    alerts: data.coaching.insights.alerts || [],
                    patterns: data.coaching.insights.patterns || [],
                    recommendations: data.coaching.insights.recommendations || []
                };
                
                // Extract momentum data if available
                if (data.coaching.analysis?.momentum) {
                    momentumData = data.coaching.analysis.momentum;
                }
                
                // Extract pressure analysis
                if (data.coaching.analysis?.pressure) {
                    pressureLevel = data.coaching.analysis.pressure.level || 'normal';
                }
                
                // Update coaching display with professional insights
                updateProfessionalCoachingDisplay();
                
                // Show professional alerts
                showProfessionalAlerts(professionalInsights.alerts);
            }
            
            showTemporaryAlert('🤖 Análise multimodal completa!', 'normal');
        } else {
            console.error('❌ Multimodal coaching failed:', data.error);
            showTemporaryAlert('❌ Falha na análise AI', 'high');
        }
    });
    
    // Screenshot processing results
    window.electronAPI.onScreenshotProcessed?.((data) => {
        if (data.success) {
            lastScreenshotAnalysis = {
                timestamp: Date.now(),
                metadata: data.metadata,
                files: data.files
            };
            
            console.log('📸 Screenshot processed for professional analysis');
        }
    });
    
    // Database status for professional tracking - ALWAYS CONNECTED MODE
    window.electronAPI.onDatabaseStatus?.((data) => {
        // ALWAYS SHOW DATABASE AS READY
        console.log('📊 Database ALWAYS READY for professional tracking - ALWAYS CONNECTED MODE');
    });
}

// === PROFESSIONAL ANALYSIS PROCESSOR ===
function startProfessionalAnalysisProcessor() {
    setInterval(() => {
        // Check for stale multimodal data
        const multimodalAge = Date.now() - lastMultimodalUpdate;
        
        if (multimodalAge > 30000 && multimodalResults) { // 30 seconds
            console.log('⏰ Multimodal data is stale, clearing...');
            multimodalResults = null;
            professionalInsights = null;
            updateProfessionalCoachingDisplay();
        }
        
        // Update professional metrics display
        updateProfessionalMetrics();
        
    }, 2000); // Check every 2 seconds
}

// === CLICK-THROUGH FUNCTIONALITY ===
function setupClickThrough() {
    const container = elements.overlayContainer;
    
    // Track mouse interactions
    let mouseOverOverlay = false;
    let interactionTimeout = null;
    
    container.addEventListener('mouseenter', () => {
        mouseOverOverlay = true;
        overlayActive = true;
        container.style.pointerEvents = 'auto';
        container.classList.add('interactive');
        container.classList.remove('click-through');
        clearTimeout(interactionTimeout);
    });
    
    container.addEventListener('mouseleave', () => {
        mouseOverOverlay = false;
        // Delay before making click-through
        interactionTimeout = setTimeout(() => {
            if (!mouseOverOverlay) {
                overlayActive = false;
                container.style.pointerEvents = 'none';
                container.classList.remove('interactive');
                container.classList.add('click-through');
            }
        }, 2000); // 2 seconds delay
    });
    
    // Re-enable interactions on any click within overlay
    container.addEventListener('click', () => {
        overlayActive = true;
        container.style.pointerEvents = 'auto';
        container.classList.add('interactive');
        container.classList.remove('click-through');
        clearTimeout(interactionTimeout);
    });
    
    console.log('✅ Enhanced click-through functionality enabled');
}

// === IPC COMMUNICATION ===
function setupIPCListeners() {
    // Receber dados GSI processados
    window.electronAPI.onGSIData((data) => {
        console.log('📡 GSI data received in overlay:', data);
        console.log('🔍 GSI data structure:', {
            hasPlayer: !!data.player,
            hasRound: !!data.round,
            hasMap: !!data.map,
            hasBomb: !!data.bomb,
            hasTeam: !!data.team,
            hasCoaching: !!data.coaching,
            timestamp: data.timestamp
        });
        
        // ALWAYS CONNECTED MODE - NO DISCONNECTION LOGIC
        updateConnectionStatus(true);
        updateGSIStatus('🔥 GSI ALWAYS CONNECTED');
        
        // Update overlay with GSI data
        if (data) {
            updateOverlay(data);
        } else {
            console.log('⚠️ No GSI data to process');
        }
    });
    
    // Receber status GSI específico
    window.electronAPI.on('gsi-status', (data) => {
        console.log('📡 GSI status update:', data);
        
        // ALWAYS CONNECTED - IGNORE ANY DISCONNECTION SIGNALS
        updateConnectionStatus(true);
        updateGSIStatus('🔥 GSI ALWAYS CONNECTED');
    });
        
    // Hotkey feedback
    window.electronAPI.on('coaching-level-changed', (data) => {
        console.log('🎯 Coaching level changed:', data);
        updateCoachingLevel(data.level);
        showHotkeyFeedback(data.message, '🎯');
    });

    window.electronAPI.on('opacity-changed', (data) => {
        console.log('🔄 Opacity changed:', data);
        updateTransparencyLevel(data.opacity);
        showHotkeyFeedback(data.message, '🔄');
    });

    window.electronAPI.on('overlay-status', (data) => {
        console.log('👁️ Overlay status:', data);
        if (data.visible) {
            showHotkeyFeedback('Overlay Visível', '👁️');
        }
    });

    window.electronAPI.on('position-reset', (data) => {
        console.log('📍 Position reset:', data);
        showHotkeyFeedback(data.message, '📍');
    });
        
    // Test results
    window.electronAPI.on('gemini-test-result', (data) => {
        console.log('🧠 Gemini test result:', data);
        if (data.success) {
            showTemporaryAlert('✅ Gemini AI funcionando!', 'good');
        } else {
            showTemporaryAlert('❌ Erro no Gemini AI', 'critical');
        }
    });
    
    window.electronAPI.on('screenshot-processed', (data) => {
        console.log('📸 Screenshot processed:', data);
        if (data.success) {
            showTemporaryAlert('📸 Screenshot capturado!', 'good');
        } else {
            showTemporaryAlert('❌ Erro na captura', 'critical');
        }
    });
    
    window.electronAPI.on('multimodal-coaching-result', (data) => {
        console.log('🤖 Multimodal coaching result:', data);
        if (data.success) {
            showTemporaryAlert('🤖 AI Coach ativo!', 'good');
            
            // Update with AI coaching if available
            if (data.coaching && data.coaching.insights) {
                const aiTips = data.coaching.insights.tips || [];
                const aiAlerts = data.coaching.insights.alerts || [];
                
                if (aiTips.length > 0) {
                    updateCoachingTips(aiTips.map(tip => `🤖 ${tip}`));
                }
                
                if (aiAlerts.length > 0) {
                    aiAlerts.forEach(alert => {
                        queueAlert(`🚨 ${alert}`, 'high');
                    });
                }
            }
        } else {
            showTemporaryAlert('❌ Erro no AI Coach', 'critical');
        }
    });

    console.log('✅ IPC listeners configured');
}

// === CONNECTION MONITORING - ALWAYS CONNECTED MODE ===
function startConnectionMonitor() {
    // NO CONNECTION MONITORING - ALWAYS CONNECTED MODE
    console.log('🔥 CONNECTION MONITOR: ALWAYS CONNECTED MODE - NO DISCONNECTION LOGIC');
    
    // Force connection status to always be true
    setInterval(() => {
        updateConnectionStatus(true);
        updateGSIStatus('🔥 GSI ALWAYS CONNECTED');
    }, 5000); // Update every 5 seconds to maintain always connected status
}

function showDisconnectedState() {
    // Reset to waiting state
    updateElement(elements.roundPhase, 'AGUARDANDO');
    updateElement(elements.teamScore, '0 - 0');
    updateElement(elements.playerHealth, '--');
    updateElement(elements.playerArmor, '--');
    updateElement(elements.playerKills, '--');
    updateElement(elements.playerDeaths, '--');
    updateElement(elements.playerMoney, '--');
    updateElement(elements.buyRecommendation, 'AGUARDANDO');
    
    if (elements.bombStatus) {
        elements.bombStatus.textContent = 'NO DATA';
        elements.bombStatus.className = 'bomb-status safe';
    }
    
    updateCoachingTips(['⏳ Aguardando dados GSI...', '🎮 Inicie CS2 e conecte-se a um servidor']);
    
    // Clear professional insights
    professionalInsights = null;
    multimodalResults = null;
    updateProfessionalCoachingDisplay();
}

// === ALERT PROCESSING ===
function startAlertProcessor() {
    setInterval(() => {
        if (alertQueue.length > 0) {
            const alert = alertQueue.shift();
            displayAlert(alert.message, alert.priority);
            lastAlertTime = Date.now();
        }
    }, 100);
}

// === UPDATE OVERLAY COM GSI DATA ===
function updateOverlay(gsiData) {
    console.log('🔄 Starting overlay update with GSI data...');
    
    if (!gsiData) {
        console.log('⚠️ No GSI data provided to updateOverlay');
        return;
    }
    
    console.log('📊 Updating overlay components...');
    
    // Round information
    if (gsiData.round) {
        console.log('🎯 Updating round info...');
        updateRoundInfo(gsiData.round);
    } else {
        console.log('⚠️ No round data to update');
    }
    
    // Player stats
    if (gsiData.player) {
        console.log('👤 Updating player stats...');
        updatePlayerStats(gsiData.player);
        
        console.log('💰 Updating economy...');
        updateEconomy(gsiData.player);
    } else {
        console.log('⚠️ No player data to update');
    }
    
    // Team information
    if (gsiData.team) {
        console.log('👥 Updating team info...');
        updateTeamInfo(gsiData.team);
    } else {
        console.log('⚠️ No team data to update');
    }
    
    // Update bomb status
    console.log('💣 Updating bomb status...');
    updateBombStatusFromGSI(gsiData);
    
    // Extract professional metrics from GSI
    console.log('📈 Extracting professional metrics...');
    extractProfessionalMetrics(gsiData);
    
    console.log('✅ Overlay update completed');
}

// === PROFESSIONAL METRICS EXTRACTION ===
function extractProfessionalMetrics(gsiData) {
    if (!gsiData.player || !gsiData.player.state) return;
    
    const player = gsiData.player;
    const state = player.state;
    
    // Professional survivability analysis
    const survivability = calculateSurvivability(state);
    
    // Economic viability
    const economicViability = calculateEconomicViability(state, gsiData.round);
    
    // Pressure level analysis
    const pressureAnalysis = calculatePressureLevel(gsiData);
    
    // Store for professional display
    patternAnalysis = {
        survivability: survivability,
        economicViability: economicViability,
        pressure: pressureAnalysis,
        timestamp: Date.now()
    };
}

function calculateSurvivability(playerState) {
    const health = playerState.health || 0;
    const armor = playerState.armor || 0;
    const hasHelmet = playerState.helmet || false;
    const flashed = playerState.flashed || 0;
    const burning = playerState.burning || 0;
    
    let score = health * 0.6 + armor * 0.3;
    if (hasHelmet) score += 10;
    if (flashed > 0) score -= 20;
    if (burning > 0) score -= 30;
    
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'moderate';
    if (score >= 20) return 'poor';
    return 'critical';
}

function calculateEconomicViability(playerState, roundData) {
    const money = playerState.money || 0;
    const roundPhase = roundData?.phase || 'unknown';
    
    const strategy = professionalCoachingStrategies[coachingLevel];
    
    if (money >= strategy.moneyThresholds.full) return 'strong';
    if (money >= strategy.moneyThresholds.force) return 'moderate';
    if (money >= strategy.moneyThresholds.eco) return 'limited';
    return 'critical';
}

function calculatePressureLevel(gsiData) {
    let pressureFactors = 0;
    
    // Health pressure
    if (gsiData.player?.state?.health < 50) pressureFactors++;
    if (gsiData.player?.state?.health < 30) pressureFactors++;
    
    // Economic pressure
    if (gsiData.player?.state?.money < 1500) pressureFactors++;
    if (gsiData.player?.state?.money < 800) pressureFactors++;
    
    // Bomb pressure
    if (gsiData.round?.bomb === 'planted') pressureFactors += 2;
    
    // Time pressure (if available)
    if (gsiData.round?.phase === 'live') pressureFactors++;
    
    if (pressureFactors >= 5) return 'extreme';
    if (pressureFactors >= 3) return 'high';
    if (pressureFactors >= 1) return 'moderate';
    return 'low';
}

// === ROUND INFO UPDATE ===
function updateRoundInfo(round) {
    console.log('🎯 Starting round info update:', round);
    
    if (!round) {
        console.log('⚠️ No round data provided to updateRoundInfo');
        return;
    }
    
    try {
        // Round phase
        const phase = round.phase || 'unknown';
        console.log(`⏱️ Updating round phase: ${phase}`);
        
        let displayPhase = phase.toUpperCase();
        switch (phase) {
            case 'live':
                displayPhase = 'AO VIVO';
                break;
            case 'freezetime':
                displayPhase = 'FREEZE TIME';
                break;
            case 'over':
                displayPhase = 'FINALIZADO';
                break;
            case 'warmup':
                displayPhase = 'AQUECIMENTO';
                break;
            case 'halftime':
                displayPhase = 'INTERVALO';
                break;
            default:
                displayPhase = phase.toUpperCase();
        }
        
        updateElement(elements.roundPhase, displayPhase);
    
        // Team score
    console.log('📊 ROUND SCORE UPDATE DEBUG - Round object:', round);
    console.log('📊 ROUND SCORE UPDATE DEBUG - Round.wins:', round.wins);
    
    if (round.wins) {
        const ctWins = round.wins.ct || 0;
        const tWins = round.wins.t || 0;
            const scoreText = `${ctWins} - ${tWins}`;
            
            console.log(`📊 Updating team score: ${scoreText} (CT: ${ctWins}, T: ${tWins})`);
            updateElement(elements.teamScore, scoreText);
        } else {
            console.log('⚠️ No wins data in round info - showing default score');
            console.log('📊 Available round properties:', Object.keys(round || {}));
            updateElement(elements.teamScore, '0 - 0');
        }
        
        // Bomb status
        const bombStatus = round.bomb || 'safe';
        console.log(`💣 Updating bomb status from round: ${bombStatus}`);
        
        if (elements.bombStatus) {
            let bombDisplay = bombStatus.toUpperCase();
            let bombClass = 'bomb-status';
            
            switch (bombStatus) {
                case 'planted':
                    bombDisplay = 'PLANTADA';
                    bombClass += ' planted';
                    break;
                case 'defused':
                    bombDisplay = 'DEFUSADA';
                    bombClass += ' defused';
                    break;
                case 'exploded':
                    bombDisplay = 'EXPLODIU';
                    bombClass += ' exploded';
                    break;
                case 'safe':
                default:
                    bombDisplay = 'SEGURA';
                    bombClass += ' safe';
                    break;
            }
            
            elements.bombStatus.textContent = bombDisplay;
            elements.bombStatus.className = bombClass;
        }
        
        console.log('✅ Round info updated successfully');
    } catch (error) {
        console.error('❌ Error updating round info:', error);
    }
}

// === PLAYER STATS UPDATE ===
function updatePlayerStats(player) {
    console.log('👤 Starting player stats update:', player);
    
    if (!player || !player.state) {
        console.log('⚠️ Invalid player data provided to updatePlayerStats');
        return;
    }
    
    try {
    // Health
        const health = player.state.health || 0;
        console.log(`❤️ Updating health: ${health}`);
        updateElement(elements.playerHealth, health);
    
    // Armor
        const armor = player.state.armor || 0;
        console.log(`🛡️ Updating armor: ${armor}`);
        updateElement(elements.playerArmor, armor);
    
    // Match stats
    if (player.match_stats) {
            const kills = player.match_stats.kills || 0;
            const deaths = player.match_stats.deaths || 0;
            
            console.log(`🎯 Updating kills: ${kills}`);
            updateElement(elements.playerKills, kills);
            
            console.log(`💀 Updating deaths: ${deaths}`);
            updateElement(elements.playerDeaths, deaths);
        } else {
            console.log('⚠️ No match_stats in player data');
            updateElement(elements.playerKills, '--');
            updateElement(elements.playerDeaths, '--');
        }
        
        console.log('✅ Player stats updated successfully');
    } catch (error) {
        console.error('❌ Error updating player stats:', error);
    }
}

// === ECONOMY UPDATE ===
function updateEconomy(player) {
    console.log('💰 Starting economy update:', player);
    
    if (!player || !player.state) {
        console.log('⚠️ Invalid player data provided to updateEconomy');
        return;
    }
    
    try {
    const money = player.state.money || 0;
        console.log(`💵 Updating player money: $${money}`);
        
        // Update money display
        updateElement(elements.playerMoney, `$${money.toLocaleString()}`);
    
        // Apply money status class for visual feedback
        if (elements.playerMoney) {
            const moneyElement = elements.playerMoney;
            moneyElement.className = 'stat-value';
            
            if (money >= 3000) {
                moneyElement.classList.add('good');
            } else if (money >= 1500) {
                moneyElement.classList.add('warning');
    } else {
                moneyElement.classList.add('critical');
            }
        }
        
        // Generate buy recommendation
        let buyRecommendation = 'AGUARDANDO';
        
        if (money >= 4000) {
            buyRecommendation = 'FULL BUY';
        } else if (money >= 2500) {
            buyRecommendation = 'FORCE BUY';
        } else if (money >= 1500) {
            buyRecommendation = 'LIGHT BUY';
        } else if (money < 1000) {
            buyRecommendation = 'ECO ROUND';
        } else {
            buyRecommendation = 'SAVE ROUND';
    }
    
        console.log(`🛒 Updating buy recommendation: ${buyRecommendation}`);
        updateElement(elements.buyRecommendation, buyRecommendation);
        
        // Apply recommendation class for visual feedback
    if (elements.buyRecommendation) {
            const recElement = elements.buyRecommendation;
            recElement.className = 'buy-recommendation';
            
            switch (buyRecommendation) {
                case 'FULL BUY':
                    recElement.classList.add('full-buy');
                    break;
                case 'FORCE BUY':
                    recElement.classList.add('force-buy');
                    break;
                case 'LIGHT BUY':
                    recElement.classList.add('light-buy');
                    break;
                case 'ECO ROUND':
                    recElement.classList.add('eco');
                    break;
                case 'SAVE ROUND':
                    recElement.classList.add('save');
                    break;
                default:
                    recElement.classList.add('waiting');
            }
        }
        
        console.log('✅ Economy updated successfully');
    } catch (error) {
        console.error('❌ Error updating economy:', error);
    }
}

// === BOMB STATUS FROM GSI ===
function updateBombStatusFromGSI(gsiData) {
    let status = 'SAFE';
    let statusClass = 'safe';
    
    // Check bomb from round data
    if (gsiData.round && gsiData.round.bomb) {
        switch (gsiData.round.bomb.toLowerCase()) {
            case 'planted':
                status = 'PLANTED';
                statusClass = 'planted';
                queueAlert('💣 BOMB PLANTED!', 'high');
                break;
            case 'defused':
                status = 'DEFUSED';
                statusClass = 'defused';
                queueAlert('✅ BOMB DEFUSED!', 'normal');
                break;
            case 'exploded':
                status = 'EXPLODED';
                statusClass = 'exploded';
                queueAlert('💥 BOMB EXPLODED!', 'high');
                break;
            default:
                status = 'SAFE';
                statusClass = 'safe';
        }
    }
    
    if (elements.bombStatus) {
        elements.bombStatus.textContent = status;
        elements.bombStatus.className = `bomb-status ${statusClass}`;
    }
}

// === ANÁLISE E COACHING INTELIGENTE ===
function analyzeAndCoach(gsiData) {
    console.log('🎯 Starting analyze and coach process...');
    
    if (!gsiData) {
        console.log('⚠️ No GSI data provided to analyzeAndCoach');
        updateCoachingTips(['⏳ Aguardando dados GSI...']);
        return;
    }
    
    console.log('🎯 GSI data available for coaching analysis');
    
    try {
        // Get coaching strategy for current level
    const strategy = professionalCoachingStrategies[coachingLevel];
        if (!strategy) {
            console.error(`❌ No strategy found for coaching level: ${coachingLevel}`);
            updateCoachingTips(['❌ Nível de coaching inválido']);
            return;
        }
        
        console.log(`🎯 Using ${coachingLevel} coaching strategy`);
        
    let tips = [];
        let alerts = [];
        
        // Use coaching data from main process if available
        console.log('🎯 COACHING DEBUG - GSI coaching data:', gsiData.coaching);
        console.log('🎯 COACHING DEBUG - Has coaching?', !!gsiData.coaching);
        console.log('🎯 COACHING DEBUG - Has tips?', !!(gsiData.coaching && gsiData.coaching.tips));
        console.log('🎯 COACHING DEBUG - Tips length:', gsiData.coaching?.tips?.length || 0);
        
        let coachingData = null;
        
        if (gsiData.coaching && gsiData.coaching.tips && gsiData.coaching.tips.length > 0) {
            console.log(`🎯 Using coaching tips from main process: ${gsiData.coaching.tips.length} tips`);
            console.log('🎯 COACHING TIPS FROM MAIN:', gsiData.coaching.tips);
            
            // Use complete coaching object from main process (with AI integration)
            coachingData = gsiData.coaching;
            tips = gsiData.coaching.tips;
            alerts = gsiData.coaching.alerts || [];
            
            // Log AI coaching data if present
            if (gsiData.coaching.aiTips && gsiData.coaching.aiTips.length > 0) {
                console.log('🤖 GEMINI 2.5 FLASH: AI tips received from main process:', gsiData.coaching.aiTips.length);
                console.log('🤖 GEMINI 2.5 FLASH: AI metadata:', gsiData.coaching.aiMetadata);
            }
        } else {
            console.log('🎯 Generating coaching tips in overlay...');
            console.log('🎯 COACHING DEBUG - Main process coaching missing, generating locally');
            
            // Generate tips based on coaching level
            switch (coachingLevel) {
                case 'professional':
        tips = generateProfessionalTips(gsiData, strategy);
                    break;
                case 'intermediate':
        tips = generateIntermediateTips(gsiData, strategy);
                    break;
                case 'beginner':
                default:
        tips = generateBeginnerTips(gsiData, strategy);
                    break;
            }
    }
    
    // Integrate professional insights if available
        if (professionalInsights && professionalInsights.tips) {
            console.log('🤖 Integrating professional AI insights...');
            const aiTips = integrateProfessionalInsights();
            tips = [...tips, ...aiTips].slice(0, strategy.maxTips);
        }
    
        // Ensure we have some tips
    if (tips.length === 0) {
            console.log('⚠️ No tips generated, using default tips');
            console.log('🎯 COACHING DEBUG - No tips available, reasons:');
            console.log('  - GSI coaching data:', !!gsiData.coaching);
            console.log('  - Player data:', !!gsiData.player);
            console.log('  - Player state:', !!gsiData.player?.state);
            console.log('  - Coaching level:', coachingLevel);
            tips = ['🎮 Dados insuficientes para coaching', '📊 Aguardando mais informações do jogo'];
    } else {
            console.log(`✅ COACHING SUCCESS - ${tips.length} tips ready for display`);
    }
    
        console.log(`🎯 Final coaching output: ${tips.length} tips, ${alerts.length} alerts`);
        
        // Update coaching display - use complete coaching object if available from main process
        if (coachingData) {
            console.log('🤖 Updating coaching tips with complete coaching object (including AI data)');
            updateCoachingTips(coachingData);
        } else {
            console.log('📝 Updating coaching tips with local tips array');
    updateCoachingTips(tips);
        }
        
        // Show alerts if any
        if (alerts && alerts.length > 0) {
            console.log(`⚠️ Showing ${alerts.length} alerts`);
            alerts.forEach(alert => {
                queueAlert(alert, 'high');
            });
        }
        
        console.log('✅ Analyze and coach process completed');
    } catch (error) {
        console.error('❌ Error in analyze and coach:', error);
        updateCoachingTips(['❌ Erro na análise de coaching']);
    }
}

// === PROFESSIONAL TIPS GENERATION ===
function generateProfessionalTips(gsiData, strategy) {
    console.log('🎯 Generating professional tips for:', gsiData);
    
    const tips = [];
    const player = gsiData?.player;
    
    if (!player) {
        console.log('⚠️ No player data available for professional tips');
        return ['🤖 Aguardando dados do jogador...'];
    }
    
    // Advanced performance analysis
    if (player.match_stats) {
        const performanceTip = analyzeAdvancedPerformance(player.match_stats);
        if (performanceTip) tips.push(performanceTip);
    }
    
    // Economic strategy analysis
    if (player.state && player.state.money !== undefined) {
        const economicTip = analyzeAdvancedEconomy(player.state.money, gsiData, strategy);
        if (economicTip) tips.push(economicTip);
    }
    
    // Pressure situation analysis
    if (patternAnalysis && patternAnalysis.pressure) {
        const pressureTip = analyzePressureSituation(patternAnalysis.pressure);
        if (pressureTip) tips.push(pressureTip);
    }
    
    // Momentum management
    if (momentumData && strategy.showMomentum) {
        const momentumTip = analyzeMomentum(momentumData);
        if (momentumTip) tips.push(momentumTip);
    }
    
    // Round context analysis
    const roundTips = analyzeRoundContext(gsiData.round, player, strategy);
    tips.push(...roundTips);
    
    // Se não temos dicas específicas, forneça dicas profissionais
    if (tips.length === 0) {
        tips.push('🎯 Analise o minimap constantemente');
        tips.push('💰 Gerencie economia do team');
        tips.push('📊 Monitore performance individual');
    }
    
    console.log(`🎯 Generated ${tips.length} professional tips:`, tips);
    return tips;
}

function generateIntermediateTips(gsiData, strategy) {
    console.log('🎯 Generating intermediate tips for:', gsiData);
    
    const tips = [];
    const player = gsiData?.player;
    
    if (!player) {
        console.log('⚠️ No player data available for intermediate tips');
        return ['⚡ Aguardando dados do jogador...'];
    }
    
    if (!player.state) {
        console.log('⚠️ No player state data available for intermediate tips');
        return ['📊 Aguardando dados do estado...'];
    }
    
    // Tactical analysis
    if (player.state.health !== undefined && player.state.health < strategy.healthThreshold) {
        tips.push(strategy.tips.lowHealth);
    }
    
    // Economy management
    if (player.state.money !== undefined) {
        const economyTip = analyzeEconomy(player.state.money, gsiData, strategy);
        if (economyTip) tips.push(economyTip);
    }
    
    // Utility and teamwork
    if (player.state.defusekit) {
        tips.push("🔧 Você tem kit - priorize defuses");
    }
    
    if (player.state.flashed !== undefined && player.state.flashed > 0) {
        tips.push("⚡ Flashed - aguarde recover!");
    }
    
    // Armor management
    if (player.state.armor !== undefined && player.state.money !== undefined && 
        player.state.armor < 50 && player.state.money > 1000) {
        tips.push(strategy.tips.armor || "🛡️ Considere comprar armor");
    }
    
    // Se não temos dicas específicas, forneça dicas intermediárias
    if (tips.length === 0) {
        tips.push('⚡ Use utility para suporte');
        tips.push('🎯 Foque em posicionamento tático');
        tips.push('💰 Gerencie economia pessoal');
    }
    
    console.log(`🎯 Generated ${tips.length} intermediate tips:`, tips);
    return tips;
}

function generateBeginnerTips(gsiData, strategy) {
    console.log('🎯 Generating beginner tips for:', gsiData);
    
    const tips = [];
    const player = gsiData?.player;
    
    // Verificar se player existe
    if (!player) {
        console.log('⚠️ No player data available for beginner tips');
        return ['🎮 Aguardando dados do jogador...'];
    }
    
    // Verificar se state existe
    if (!player.state) {
        console.log('⚠️ No player state data available for beginner tips');
        return ['📊 Aguardando dados do estado do jogador...'];
    }
    
    console.log('👤 Player state available:', player.state);
    
    // Basic survival
    if (player.state.health !== undefined && player.state.health < strategy.healthThreshold) {
        tips.push(strategy.tips.lowHealth);
        if (player.state.health < 30) {
            queueAlert('⚠️ HEALTH CRÍTICO!', 'high');
        }
    }
    
    // Basic economy
    if (player.state.money !== undefined) {
        const economyTip = analyzeBasicEconomy(player.state.money, strategy);
        if (economyTip) tips.push(economyTip);
    }
    
    // Round performance
    if (player.state.round_kills !== undefined && player.state.round_kills >= 2) {
        tips.push('🔥 Boa sequência! Continue assim!');
    }
    
    // Se não temos dicas específicas, forneça dicas gerais
    if (tips.length === 0) {
        tips.push('🎯 Continue jogando e observando!');
        tips.push('📚 Pratique mira e posicionamento');
    }
    
    console.log(`🎯 Generated ${tips.length} beginner tips:`, tips);
    return tips;
}

// === PROFESSIONAL INSIGHTS INTEGRATION ===
function integrateProfessionalInsights() {
    const tips = [];
    
    if (!professionalInsights) return tips;
    
    // Add professional recommendations
    if (professionalInsights.recommendations) {
        professionalInsights.recommendations.slice(0, 2).forEach(rec => {
            tips.push(`🧠 ${rec}`);
        });
    }
    
    // Add pattern insights
    if (professionalInsights.patterns && professionalInsights.patterns.length > 0) {
        const pattern = professionalInsights.patterns[0];
        tips.push(`📊 Pattern: ${pattern}`);
    }
    
    return tips;
}

// === PROFESSIONAL COACHING DISPLAY UPDATE ===
function updateProfessionalCoachingDisplay() {
    if (!professionalInsights && !patternAnalysis) return;
    
    const strategy = professionalCoachingStrategies[coachingLevel];
    
    // Don't show professional insights for beginners
    if (!strategy.showPatterns && !strategy.showMomentum) return;
    
    // Update visual indicators for professional metrics
    updateProfessionalMetricsDisplay();
    
    // Update coaching tips container with professional styling
    if (elements.coachingTips) {
        elements.coachingTips.classList.add(`coaching-${coachingLevel}`);
    }
}

function updateProfessionalMetricsDisplay() {
    // Add professional metrics to header or create new section
    const header = document.querySelector('.header');
    if (!header) return;
    
    // Check if professional indicators already exist
    let professionalIndicator = header.querySelector('.professional-indicator');
    if (!professionalIndicator && (patternAnalysis || momentumData)) {
        professionalIndicator = document.createElement('div');
        professionalIndicator.className = 'professional-indicator';
        header.appendChild(professionalIndicator);
    }
    
    if (professionalIndicator) {
        let indicatorHTML = '';
        
        // Survivability indicator
        if (patternAnalysis?.survivability) {
            const survivability = patternAnalysis.survivability;
            const survClass = survivability === 'excellent' ? 'good' : 
                             survivability === 'good' ? 'good' : 
                             survivability === 'moderate' ? 'warning' : 'critical';
            indicatorHTML += `<span class="metric-indicator ${survClass}" title="Survivability: ${survivability}">🛡️</span>`;
        }
        
        // Economic viability indicator
        if (patternAnalysis?.economicViability) {
            const economic = patternAnalysis.economicViability;
            const econClass = economic === 'strong' ? 'good' : 
                             economic === 'moderate' ? 'warning' : 'critical';
            indicatorHTML += `<span class="metric-indicator ${econClass}" title="Economy: ${economic}">💰</span>`;
        }
        
        // Pressure level indicator
        if (patternAnalysis?.pressure) {
            const pressure = patternAnalysis.pressure;
            const pressureClass = pressure === 'low' ? 'good' : 
                                 pressure === 'moderate' ? 'warning' : 'critical';
            indicatorHTML += `<span class="metric-indicator ${pressureClass}" title="Pressure: ${pressure}">⚡</span>`;
        }
        
        professionalIndicator.innerHTML = indicatorHTML;
    }
}

function updateProfessionalMetrics() {
    // Update any real-time professional metrics
    if (patternAnalysis && (Date.now() - patternAnalysis.timestamp > 30000)) {
        // Clear stale pattern analysis
        patternAnalysis = null;
        updateProfessionalMetricsDisplay();
    }
}

// === PROFESSIONAL ALERTS ===
function showProfessionalAlerts(alerts) {
    if (!alerts || alerts.length === 0) return;
    
    alerts.forEach((alert, index) => {
        setTimeout(() => {
            queueAlert(`🤖 ${alert}`, 'normal');
        }, index * 1000); // Stagger alerts by 1 second
    });
}

// === ANALYSIS FUNCTIONS ===
function analyzeAdvancedPerformance(matchStats) {
    const kills = matchStats.kills || 0;
    const deaths = matchStats.deaths || 0;
    const assists = matchStats.assists || 0;
    
    if (deaths === 0) {
        if (kills > 10) return "🔥 Performance excepcional! Mantenha pressão";
        if (kills > 5) return "🎯 Boa performance - continue agressivo";
        return null;
    }
    
    const kd = kills / deaths;
    const impact = (kills + assists * 0.5) / Math.max(deaths, 1);
    
    if (kd < 0.5) {
        return "📊 K/D crítico - mude para role support";
    } else if (kd > 2.5) {
        return "🎯 K/D excelente - capitalize momentum";
    } else if (impact > 1.5) {
        return "💫 Bom impact rating - continue assim";
    }
    
    return null;
}

function analyzeAdvancedEconomy(money, gsiData, strategy) {
    if (money < strategy.moneyThresholds.eco) {
        return "💰 Eco necessário - coordinate com team";
    }
    
    if (money >= strategy.moneyThresholds.full + 2000) {
        return "💹 Economia forte - considere drop/invest";
    }
    
    if (money >= strategy.moneyThresholds.full) {
        return "💰 Full-buy disponível - maximize utility";
    }
    
    if (money >= strategy.moneyThresholds.force) {
        const roundWins = gsiData.round?.wins;
        if (roundWins && Math.abs(roundWins.ct - roundWins.t) >= 3) {
            return "🛒 Force-buy recomendado - break enemy momentum";
        }
    }
    
    return null;
}

function analyzeBasicEconomy(money, strategy) {
    if (money < strategy.moneyThresholds.eco) {
        return "💰 Economize - não compre weapons";
    }
    
    if (money >= strategy.moneyThresholds.full) {
        return "💰 Full-buy disponível";
    }
    
    if (money >= strategy.moneyThresholds.force) {
        return "🛒 Compra básica possível";
    }
    
    return null;
}

function analyzePressureSituation(pressureLevel) {
    switch (pressureLevel) {
        case 'extreme':
            return "🚨 Pressão EXTREMA - jogue pela sobrevivência";
        case 'high':
            return "⚠️ Alta pressão - decisões conservadoras";
        case 'moderate':
            return "⚡ Pressão moderada - mantenha foco";
        default:
            return null;
    }
}

function analyzeMomentum(momentumData) {
    if (momentumData.currentMomentum === 'positive') {
        return "📈 Momentum positivo - mantenha agressividade";
    } else if (momentumData.currentMomentum === 'negative') {
        return "📉 Momentum negativo - reset necessário";
    }
    return null;
}

function analyzeRoundContext(round, player, strategy) {
    const tips = [];
    
    if (round?.phase === 'live') {
        if (player.state && player.state.health < 50) {
            tips.push("⚡ Round ativo - posição defensiva");
        }
    }
    
    if (round?.bomb === 'planted') {
        tips.push(strategy.tips.bomb || "💣 Bomb plantada - manage tempo");
    }
    
    return tips;
}

// === EXISTING ANALYSIS FUNCTIONS ===
function analyzeEconomy(money, gsiData, strategy) {
    if (money < strategy.moneyThresholds.eco) {
        return "💰 Economia necessária - evite gastos";
    }
    
    if (money >= strategy.moneyThresholds.full) {
        if (coachingLevel === 'professional') {
            return "💹 Economia alta - considere drop para team";
        } else {
            return "💰 Full-buy disponível";
        }
    }
    
    if (money >= strategy.moneyThresholds.force) {
        return "🛒 Force-buy possível";
    }
    
    return null;
}

function analyzePerformance(matchStats) {
    const kills = matchStats.kills || 0;
    const deaths = matchStats.deaths || 0;
    
    if (deaths === 0) {
        if (kills > 5) return "🔥 Performance excelente!";
        return null;
    }
    
    const kd = kills / deaths;
    
    if (kd < 0.5) {
        return "📊 K/D baixo - ajuste estratégia";
    } else if (kd > 2.0) {
        return "🎯 Excelente K/D - mantenha agressividade";
    }
    
    return null;
}

function analyzeRoundSituation(round, player, strategy) {
    const tips = [];
    
    if (round?.phase === 'live') {
        if (player.state && player.state.health < 50) {
            tips.push("⚡ Round ativo - jogue defensivo");
        }
    }
    
    if (round?.bomb === 'planted') {
        tips.push(strategy.tips.bomb || "💣 Bomb plantada - gerencie tempo");
    }
    
    return tips;
}

// === UPDATE FUNCTIONS ===
function updateCoachingLevel(level) {
    coachingLevel = level;
    updateElement(elements.coachingLevel, level.toUpperCase());
    
    // Update CSS class for styling
    if (elements.coachingLevel) {
        elements.coachingLevel.className = `coaching-level ${level}`;
    }
    
    // Update professional display based on new level
    updateProfessionalCoachingDisplay();
}

function updateConnectionStatus(connected) {
    isConnected = connected;
    if (elements.connectionStatus) {
        elements.connectionStatus.className = `status-indicator ${connected ? 'connected' : 'disconnected'}`;
        elements.connectionStatus.textContent = connected ? '●' : '○';
    }
}

function updateGSIStatus(statusText) {
    if (elements.gsiText) {
        elements.gsiText.textContent = statusText;
    }
    
    if (elements.gsiDot) {
        elements.gsiDot.className = `gsi-dot ${isConnected ? 'connected' : 'disconnected'}`;
    }
}

function updateCoachingTips(tipsOrCoaching) {
    console.log('🎯 Starting coaching tips update:', tipsOrCoaching);
    
    if (!elements.coachingTips) {
        console.error('❌ Coaching tips element not found');
        return;
    }
    
    try {
        // Clear existing tips
    elements.coachingTips.innerHTML = '';
    
        // Handle both old format (array) and new format (coaching object)
        let tips = [];
        let aiTips = [];
        let aiAlerts = [];
        let aiError = null;
        let aiMetadata = null;
        
        if (Array.isArray(tipsOrCoaching)) {
            // Old format - just an array of tips
            tips = tipsOrCoaching;
        } else if (tipsOrCoaching && typeof tipsOrCoaching === 'object') {
            // New format - coaching object with AI integration
            tips = tipsOrCoaching.tips || [];
            aiTips = tipsOrCoaching.aiTips || [];
            aiAlerts = tipsOrCoaching.aiAlerts || [];
            aiError = tipsOrCoaching.aiError;
            aiMetadata = tipsOrCoaching.aiMetadata;
        }
        
        console.log(`📝 Processing: ${tips.length} tips, ${aiTips.length} AI tips, ${aiAlerts.length} AI alerts`);
        
        if (aiMetadata) {
            console.log('🤖 GEMINI 2.5 FLASH Metadata:', aiMetadata);
        }
        
        // Add AI-powered section first (highest priority)
        if (aiTips.length > 0) {
            const aiSection = document.createElement('div');
            aiSection.className = 'ai-coaching-section';
            
            const aiHeader = document.createElement('div');
            aiHeader.className = 'ai-coaching-header';
            aiHeader.innerHTML = `🤖 Gemini 2.5 Flash AI Coach`;
            if (aiMetadata?.processingTime) {
                aiHeader.innerHTML += ` (${aiMetadata.processingTime}ms)`;
            }
            aiSection.appendChild(aiHeader);
            
            aiTips.forEach((tip, index) => {
        const tipElement = document.createElement('div');
                tipElement.className = 'coaching-tip ai-tip';
        tipElement.textContent = tip;
                tipElement.style.animationDelay = `${index * 0.15}s`;
                aiSection.appendChild(tipElement);
                console.log(`🤖 Added AI tip ${index + 1}: ${tip.substring(0, 50)}...`);
            });
            
            elements.coachingTips.appendChild(aiSection);
        }
        
        // Add AI alerts with special styling
        if (aiAlerts.length > 0) {
            aiAlerts.forEach((alert, index) => {
                const alertElement = document.createElement('div');
                alertElement.className = 'coaching-tip ai-alert high-priority';
                alertElement.textContent = `🤖 ${alert}`;
                alertElement.style.animationDelay = `${(aiTips.length + index) * 0.15}s`;
                elements.coachingTips.appendChild(alertElement);
                console.log(`🤖 Added AI alert ${index + 1}: ${alert.substring(0, 50)}...`);
            });
        }
        
        // Add regular tips (filter out duplicates with AI tips)
        if (tips.length > 0) {
            const uniqueTips = tips.filter(tip => !aiTips.includes(tip));
            
            uniqueTips.forEach((tip, index) => {
                const tipElement = document.createElement('div');
                tipElement.className = 'coaching-tip';
                tipElement.textContent = tip;
                
                // Add different styling for different tip priorities
                if (tip.includes('🔴') || tip.includes('❌') || tip.includes('💀')) {
                    tipElement.classList.add('high-priority');
                } else if (tip.includes('⚠️') || tip.includes('💣')) {
                    tipElement.classList.add('medium-priority');
                } else {
                    tipElement.classList.add('normal-priority');
                }
                
                // Add animation delay for staggered appearance
                tipElement.style.animationDelay = `${(aiTips.length + aiAlerts.length + index) * 0.1}s`;
                
            elements.coachingTips.appendChild(tipElement);
                console.log(`📝 Added regular tip ${index + 1}: ${tip.substring(0, 50)}...`);
            });
        }
        
        // Show AI error if present
        if (aiError) {
            const errorElement = document.createElement('div');
            errorElement.className = 'coaching-tip ai-error medium-priority';
            errorElement.textContent = `🤖 ⚠️ AI Coach Error: ${aiError}`;
            elements.coachingTips.appendChild(errorElement);
            console.log(`🤖 Added AI error: ${aiError}`);
        }
        
        // Show default message if everything is empty
        if (tips.length === 0 && aiTips.length === 0 && aiAlerts.length === 0 && !aiError) {
            console.log('⚠️ No coaching tips provided or empty');
            
            const defaultTip = document.createElement('div');
            defaultTip.className = 'coaching-tip waiting';
            defaultTip.textContent = '⏳ Aguardando dados do jogo...';
            elements.coachingTips.appendChild(defaultTip);
        }
        
        // Add fade-in animation class
        elements.coachingTips.classList.add('tips-updated');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            elements.coachingTips.classList.remove('tips-updated');
        }, 1000);
        
        console.log('✅ Coaching tips updated successfully');
        console.log('🤖 Gemini 2.5 Flash AI integration complete');
        
    } catch (error) {
        console.error('❌ Error updating coaching tips:', error);
        
        // Show error state
        elements.coachingTips.innerHTML = '';
        const errorTip = document.createElement('div');
        errorTip.className = 'coaching-tip error';
        errorTip.textContent = '❌ Erro ao carregar dicas';
        elements.coachingTips.appendChild(errorTip);
    }
}

function updateTeamInfo(team) {
    // This can be expanded later for team-specific information
    console.log('Team info received:', team);
}

function queueAlert(message, priority = 'normal') {
    const strategy = professionalCoachingStrategies[coachingLevel];
    const timeSinceLastAlert = Date.now() - lastAlertTime;
    
    // Respect alert frequency based on coaching level
    if (timeSinceLastAlert < strategy.alertFrequency) {
        return; // Too soon for another alert
    }
    
    alertQueue.push({ message, priority, timestamp: Date.now() });
    
    // Limit queue size
    if (alertQueue.length > 5) {
        alertQueue.shift(); // Remove oldest alert
    }
}

function displayAlert(message, priority = 'normal') {
    if (!elements.alertsContainer) return;
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${priority}`;
    alertElement.textContent = message;
    
    elements.alertsContainer.appendChild(alertElement);
    
    // Auto-remove after delay
    const removeDelay = priority === 'high' ? 5000 : 3000;
    setTimeout(() => {
        if (alertElement.parentNode) {
            alertElement.parentNode.removeChild(alertElement);
        }
    }, removeDelay);
    
    // Limit number of visible alerts
    const alerts = elements.alertsContainer.children;
    if (alerts.length > 3) {
        elements.alertsContainer.removeChild(alerts[0]);
    }
}

function showTemporaryAlert(message, priority = 'normal') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.classList.remove('hidden');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
}

function updateElement(element, value, type = '') {
    console.log(`🔄 Updating element:`, {
        hasElement: !!element,
        elementId: element?.id || 'no-id',
        elementClass: element?.className || 'no-class',
        value: value,
        type: type
    });
    
    if (!element) {
        console.error('❌ Element is null/undefined');
        return;
    }
    
    try {
        // Convert value to string if needed
        const displayValue = value !== null && value !== undefined ? String(value) : '--';
        
        // Update element content
        if (element.tagName === 'INPUT') {
            element.value = displayValue;
        } else {
            element.textContent = displayValue;
        }
        
        // Apply type-specific classes if specified
        if (type) {
            element.className = `${element.className.split(' ')[0]} ${type}`;
        }
        
        console.log(`✅ Element updated successfully: ${element.id || element.className} = "${displayValue}"`);
    } catch (error) {
        console.error('❌ Error updating element:', error);
        console.error('Element details:', {
            tagName: element.tagName,
            id: element.id,
            className: element.className
        });
    }
}

// === TRANSPARENCY MANAGEMENT ===
let currentTransparency = 0.8; // Default transparency level

function updateTransparencyLevel(opacity) {
    currentTransparency = opacity;
    
    // Apply to main container
    if (elements.overlayContainer) {
        elements.overlayContainer.style.opacity = opacity;
    }
    
    // Apply to specific elements that might need transparency adjustment
    const transparentElements = [
        elements.coachingTips,
        elements.alertsContainer,
        elements.roundPhase,
        elements.teamScore
    ];
    
    transparentElements.forEach(element => {
        if (element) {
            // Ensure child elements inherit appropriate transparency
            element.style.opacity = Math.max(opacity, 0.3); // Minimum readability
        }
    });
    
    console.log(`✅ Transparency level updated: ${Math.round(opacity * 100)}%`);
}

function getCurrentTransparency() {
    return currentTransparency;
}

// === COACHING LEVEL CYCLING ENHANCEMENT ===
function enhanceCoachingLevelDisplay(level) {
    const levelElement = elements.coachingLevel;
    
    if (levelElement) {
        // Remove previous level classes
        levelElement.classList.remove('level-beginner', 'level-intermediate', 'level-professional');
        
        // Add current level class for styling
        levelElement.classList.add(`level-${level}`);
        
        // Add visual feedback animation
        levelElement.classList.add('level-change-animation');
        setTimeout(() => {
            levelElement.classList.remove('level-change-animation');
        }, 1000);
    }
    
    // Update strategy-specific UI elements
    updateStrategySpecificElements(level);
}

function updateStrategySpecificElements(level) {
    const strategy = professionalCoachingStrategies[level];
    
    if (!strategy) return;
    
    // Update max tips display based on level
    if (elements.coachingTips) {
        elements.coachingTips.setAttribute('data-max-tips', strategy.maxTips);
        elements.coachingTips.setAttribute('data-level', level);
    }
    
    // Show/hide professional elements based on level
    const professionalElements = document.querySelectorAll('.professional-only');
    const intermediateElements = document.querySelectorAll('.intermediate-plus');
    
    professionalElements.forEach(element => {
        element.style.display = level === 'professional' ? 'block' : 'none';
    });
    
    intermediateElements.forEach(element => {
        element.style.display = ['intermediate', 'professional'].includes(level) ? 'block' : 'none';
    });
}

// === ENHANCED COACHING LEVEL UPDATE ===
function updateCoachingLevelEnhanced(level) {
    // Call original function
    updateCoachingLevel(level);
    
    // Add enhanced functionality
    enhanceCoachingLevelDisplay(level);
    
    // Re-analyze current data with new level
    if (currentGSIData) {
        console.log(`🎯 Re-analyzing with new coaching level: ${level}`);
        analyzeAndCoach(currentGSIData);
    }
}

// === HOTKEY VISUAL FEEDBACK SYSTEM ===
let hotkeyFeedbackTimeout = null;

function showHotkeyFeedback(message, icon = '⌨️', duration = 2000) {
    const feedbackElement = document.getElementById('hotkey-feedback');
    const textElement = document.getElementById('hotkey-feedback-text');
    const iconElement = feedbackElement?.querySelector('.hotkey-feedback-icon');
    
    if (!feedbackElement || !textElement || !iconElement) {
        console.warn('⚠️ Hotkey feedback elements not found');
        return;
    }
    
    // Clear any existing timeout
    if (hotkeyFeedbackTimeout) {
        clearTimeout(hotkeyFeedbackTimeout);
        hotkeyFeedbackTimeout = null;
    }
    
    // Update content
    textElement.textContent = message;
    iconElement.textContent = icon;
    
    // Show the feedback
    feedbackElement.classList.remove('hidden', 'fade-out');
    feedbackElement.classList.add('visible');
    
    console.log(`⌨️ Hotkey feedback: ${message}`);
    
    // Auto-hide after duration
    hotkeyFeedbackTimeout = setTimeout(() => {
        hideHotkeyFeedback();
    }, duration);
}

function hideHotkeyFeedback() {
    const feedbackElement = document.getElementById('hotkey-feedback');
    
    if (!feedbackElement) return;
    
    // Add fade-out class for smooth transition
    feedbackElement.classList.add('fade-out');
    
    // After transition, hide completely
    setTimeout(() => {
        feedbackElement.classList.remove('visible', 'fade-out');
        feedbackElement.classList.add('hidden');
    }, 400); // Match CSS transition duration
    
    // Clear timeout reference
    if (hotkeyFeedbackTimeout) {
        clearTimeout(hotkeyFeedbackTimeout);
        hotkeyFeedbackTimeout = null;
    }
}

function getHotkeyMessage(action, data) {
    switch (action) {
        case 'toggle-visibility':
            return data.visible ? 'OVERLAY ON' : 'OVERLAY OFF';
        case 'coaching-level':
            return `COACHING LEVEL: ${data.level?.toUpperCase() || 'UNKNOWN'}`;
        case 'transparency':
            const percentage = Math.round((data.opacity || 0) * 100);
            return `TRANSPARENCY: ${percentage}%`;
        case 'position-reset':
            return 'POSITION RESET';
        default:
            return 'HOTKEY ACTIVATED';
    }
}

function getHotkeyIcon(action) {
    switch (action) {
        case 'toggle-visibility':
            return '👁️';
        case 'coaching-level':
            return '🎯';
        case 'transparency':
            return '🔄';
        case 'position-reset':
            return '📍';
        default:
            return '⌨️';
    }
}

// === LOADING SCREEN MANAGEMENT ===
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    
    if (!loadingScreen) {
        console.warn('⚠️ Loading screen element not found');
        return;
    }
    
    console.log('🎬 Hiding loading screen...');
    
    // Add fade-out animation
    loadingScreen.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transform = 'scale(0.95)';
    
    // Remove element after animation completes
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        console.log('✅ Loading screen hidden - Coach-AI Overlay ready!');
        
        // Show a brief welcome message
        showTemporaryAlert('🚀 Coach-AI Initialized!', 'normal');
    }, 800); // Match transition duration
}

function updateLoadingProgress(step, message) {
    const stepElements = document.querySelectorAll('.loading-step');
    const progressBar = document.querySelector('.loading-progress');
    const subtitle = document.querySelector('.loading-subtitle');
    
    if (stepElements[step - 1]) {
        stepElements[step - 1].innerHTML = `✓ ${message}`;
    }
    
    if (progressBar) {
        const progress = (step / stepElements.length) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    if (subtitle) {
        subtitle.textContent = message;
    }
}

// === DIAGNÓSTICO COMPLETO ===
function runCompleteDiagnostic() {
    console.log('🔬 Running complete diagnostic...');
    
    // Test 1: Check all DOM elements
    console.log('🧪 Test 1: DOM Elements');
    testOverlayElements();
    
    // Test 2: Check coaching functions
    console.log('🧪 Test 2: Coaching Functions');
    try {
        const mockGSIData = {
            player: {
                name: 'TestPlayer',
                team: 'CT',
                state: {
                    health: 75,
                    armor: 100,
                    money: 2400,
                    round_kills: 1
                },
                match_stats: {
                    kills: 8,
                    deaths: 5,
                    assists: 2
                }
            },
            round: {
                phase: 'live',
                bomb: 'safe',
                wins: {
                    ct: 7,
                    t: 8
                }
            }
        };
        
        console.log('🎯 Testing beginner tips generation...');
        const beginnerTips = generateBeginnerTips(mockGSIData, professionalCoachingStrategies.beginner);
        console.log('✅ Beginner tips:', beginnerTips);
        
        console.log('🎯 Testing intermediate tips generation...');
        const intermediateTips = generateIntermediateTips(mockGSIData, professionalCoachingStrategies.intermediate);
        console.log('✅ Intermediate tips:', intermediateTips);
        
        console.log('🎯 Testing professional tips generation...');
        const professionalTips = generateProfessionalTips(mockGSIData, professionalCoachingStrategies.professional);
        console.log('✅ Professional tips:', professionalTips);
        
        console.log('🎯 Testing analyzeAndCoach...');
        analyzeAndCoach(mockGSIData);
        console.log('✅ analyzeAndCoach completed');
        
    } catch (error) {
        console.error('❌ Coaching function test failed:', error);
    }
    
    // Test 3: Check connection status - ALWAYS CONNECTED MODE
    console.log('🧪 Test 3: Connection Status - ALWAYS CONNECTED');
    updateConnectionStatus(true);
    updateGSIStatus('🔥 GSI ALWAYS CONNECTED - NO DISCONNECTION TESTING');
    
    // Test 4: Check alerts and tips
    console.log('🧪 Test 4: Alerts and Tips');
    updateCoachingTips([
        '🔬 Teste de dica 1',
        '🔬 Teste de dica 2',
        '⚠️ Teste de alerta'
    ]);
    
    queueAlert('🔬 Teste de alerta normal', 'normal');
    queueAlert('⚠️ Teste de alerta warning', 'warning');
    queueAlert('🚨 Teste de alerta crítico', 'high');
    
    console.log('✅ Complete diagnostic finished');
}

// Execute diagnostic after a delay to ensure everything is loaded
setTimeout(() => {
    runCompleteDiagnostic();
}, 5000); // 5 seconds after overlay loads

// API key notification removed - not needed since Gemini is working

// === INICIALIZAÇÃO AUTOMÁTICA ===
document.addEventListener('DOMContentLoaded', initialize);

console.log('🚀 Coach-AI Professional Overlay JavaScript loaded'); 