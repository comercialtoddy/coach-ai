// ====== COACH-AI DATABASE MANAGER ======
// SQLite database for storing game data, user preferences, and AI insights

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class CoachAIDatabase {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.dbPath = null;
    }

    // Initialize database connection and create tables
    async initialize() {
        try {
            // Get user data directory
            const userDataPath = app.getPath('userData');
            this.dbPath = path.join(userDataPath, 'coachai.db');
            
            console.log('📁 Database path:', this.dbPath);
            
            // Ensure directory exists
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Create database connection
            this.db = new Database(this.dbPath);
            this.db.pragma('journal_mode = WAL'); // Better concurrency
            this.db.pragma('foreign_keys = ON'); // Enable foreign key constraints
            
            // Create tables
            this.createTables();
            
            // Create indexes for performance
            this.createIndexes();
            
            this.isInitialized = true;
            console.log('✅ Database initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Database initialization failed:', error.message);
            throw error;
        }
    }

    // Create database schema
    createTables() {
        const createTables = [
            // Game sessions table
            `CREATE TABLE IF NOT EXISTS game_sessions (
                session_id TEXT PRIMARY KEY,
                start_time INTEGER NOT NULL,
                end_time INTEGER,
                map_name TEXT,
                coaching_level TEXT DEFAULT 'beginner',
                total_rounds INTEGER DEFAULT 0,
                player_score INTEGER DEFAULT 0,
                enemy_score INTEGER DEFAULT 0,
                created_at INTEGER DEFAULT (unixepoch()),
                updated_at INTEGER DEFAULT (unixepoch())
            )`,

            // Rounds table
            `CREATE TABLE IF NOT EXISTS rounds (
                round_id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                round_number INTEGER NOT NULL,
                round_phase TEXT,
                outcome TEXT, -- 'win', 'loss', 'draw'
                player_team TEXT, -- 'CT' or 'T'
                gsi_snapshot_json TEXT,
                round_start_time INTEGER,
                round_end_time INTEGER,
                created_at INTEGER DEFAULT (unixepoch()),
                FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE
            )`,

            // AI insights table
            `CREATE TABLE IF NOT EXISTS ai_insights (
                insight_id TEXT PRIMARY KEY,
                round_id TEXT,
                session_id TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                skill_level TEXT NOT NULL,
                advice_text TEXT NOT NULL,
                screenshot_path TEXT,
                insight_type TEXT DEFAULT 'general', -- 'general', 'economic', 'tactical', 'performance'
                confidence_score REAL DEFAULT 0.0,
                created_at INTEGER DEFAULT (unixepoch()),
                FOREIGN KEY (round_id) REFERENCES rounds(round_id) ON DELETE SET NULL,
                FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE
            )`,

            // User settings table
            `CREATE TABLE IF NOT EXISTS user_settings (
                setting_key TEXT PRIMARY KEY,
                setting_value TEXT NOT NULL,
                setting_type TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
                description TEXT,
                created_at INTEGER DEFAULT (unixepoch()),
                updated_at INTEGER DEFAULT (unixepoch())
            )`,

            // Performance metrics table
            `CREATE TABLE IF NOT EXISTS performance_metrics (
                metric_id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                round_id TEXT,
                metric_type TEXT NOT NULL, -- 'kills', 'deaths', 'assists', 'damage', 'economy'
                metric_value REAL NOT NULL,
                timestamp INTEGER NOT NULL,
                created_at INTEGER DEFAULT (unixepoch()),
                FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE,
                FOREIGN KEY (round_id) REFERENCES rounds(round_id) ON DELETE SET NULL
            )`,

            // Screenshot metadata table
            `CREATE TABLE IF NOT EXISTS screenshots (
                screenshot_id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                round_id TEXT,
                file_path TEXT NOT NULL,
                file_size INTEGER,
                width INTEGER,
                height INTEGER,
                capture_time INTEGER NOT NULL,
                processed BOOLEAN DEFAULT FALSE,
                created_at INTEGER DEFAULT (unixepoch()),
                FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE,
                FOREIGN KEY (round_id) REFERENCES rounds(round_id) ON DELETE SET NULL
            )`,

            // Round summaries table - stores compiled post-round analysis
            `CREATE TABLE IF NOT EXISTS round_summaries (
                summary_id TEXT PRIMARY KEY,
                round_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                round_number INTEGER NOT NULL,
                coaching_level TEXT NOT NULL,
                outcome TEXT,
                duration INTEGER,
                compiled_at INTEGER NOT NULL,
                
                -- Data collection metrics
                gsi_snapshots_count INTEGER DEFAULT 0,
                ai_insights_count INTEGER DEFAULT 0,
                performance_metrics_count INTEGER DEFAULT 0,
                key_events_count INTEGER DEFAULT 0,
                
                -- Analysis results (stored as JSON)
                gsi_analysis_json TEXT,
                ai_analysis_json TEXT,
                performance_analysis_json TEXT,
                events_analysis_json TEXT,
                consolidated_analysis_json TEXT,
                
                -- Structured summary
                structured_summary_json TEXT,
                key_insights_json TEXT,
                recommendations_json TEXT,
                
                -- Quality metrics
                data_completeness REAL DEFAULT 0.0,
                analysis_confidence REAL DEFAULT 0.0,
                insight_relevance REAL DEFAULT 0.0,
                
                -- Additional metadata
                player_team TEXT,
                map_name TEXT,
                processing_time INTEGER,
                
                created_at INTEGER DEFAULT (unixepoch()),
                FOREIGN KEY (round_id) REFERENCES rounds(round_id) ON DELETE CASCADE,
                FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE
            )`
        ];

        createTables.forEach(sql => {
            this.db.exec(sql);
        });

        console.log('📊 Database tables created');
    }

    // Create indexes for better performance
    createIndexes() {
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_rounds_session_id ON rounds(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_rounds_timestamp ON rounds(round_start_time)',
            'CREATE INDEX IF NOT EXISTS idx_insights_session_id ON ai_insights(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_insights_timestamp ON ai_insights(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_metrics_session_id ON performance_metrics(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_metrics_type ON performance_metrics(metric_type)',
            'CREATE INDEX IF NOT EXISTS idx_screenshots_session_id ON screenshots(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON game_sessions(start_time)',
            'CREATE INDEX IF NOT EXISTS idx_summaries_session_id ON round_summaries(session_id)',
            'CREATE INDEX IF NOT EXISTS idx_summaries_round_id ON round_summaries(round_id)',
            'CREATE INDEX IF NOT EXISTS idx_summaries_compiled_at ON round_summaries(compiled_at)',
            'CREATE INDEX IF NOT EXISTS idx_summaries_coaching_level ON round_summaries(coaching_level)',
            'CREATE INDEX IF NOT EXISTS idx_summaries_round_number ON round_summaries(round_number)'
        ];

        indexes.forEach(sql => {
            this.db.exec(sql);
        });

        console.log('🔍 Database indexes created');
    }

    // Initialize default settings
    initializeDefaultSettings() {
        const defaultSettings = [
            ['coaching_level', 'beginner', 'string', 'Default coaching level'],
            ['overlay_opacity', '0.8', 'number', 'Overlay transparency level'],
            ['overlay_position', '{"x": 20, "y": 20}', 'json', 'Overlay position coordinates'],
            ['auto_screenshot', 'true', 'boolean', 'Automatically take screenshots'],
            ['screenshot_quality', '0.8', 'number', 'Screenshot compression quality'],
            ['database_cleanup_days', '30', 'number', 'Days to keep old data'],
            ['gemini_api_key', '', 'string', 'Google Gemini API key'],
            ['performance_tracking', 'true', 'boolean', 'Enable performance metrics tracking']
        ];

        const insertSetting = this.db.prepare(`
            INSERT OR IGNORE INTO user_settings (setting_key, setting_value, setting_type, description)
            VALUES (?, ?, ?, ?)
        `);

        defaultSettings.forEach(([key, value, type, desc]) => {
            insertSetting.run(key, value, type, desc);
        });

        console.log('⚙️ Default settings initialized');
    }

    // === GAME SESSIONS CRUD ===

    createSession(sessionId, mapName = null, coachingLevel = 'beginner') {
        const stmt = this.db.prepare(`
            INSERT INTO game_sessions (session_id, start_time, map_name, coaching_level)
            VALUES (?, ?, ?, ?)
        `);
        return stmt.run(sessionId, Date.now(), mapName, coachingLevel);
    }

    updateSession(sessionId, updates) {
        const { endTime, totalRounds, playerScore, enemyScore } = updates;
        const stmt = this.db.prepare(`
            UPDATE game_sessions 
            SET end_time = ?, total_rounds = ?, player_score = ?, enemy_score = ?, updated_at = ?
            WHERE session_id = ?
        `);
        return stmt.run(endTime || Date.now(), totalRounds, playerScore, enemyScore, Date.now(), sessionId);
    }

    getSession(sessionId) {
        const stmt = this.db.prepare('SELECT * FROM game_sessions WHERE session_id = ?');
        return stmt.get(sessionId);
    }

    getRecentSessions(limit = 10) {
        const stmt = this.db.prepare(`
            SELECT * FROM game_sessions 
            ORDER BY start_time DESC 
            LIMIT ?
        `);
        return stmt.all(limit);
    }

    // === ROUNDS CRUD ===

    createRound(roundId, sessionId, roundNumber, playerTeam = null) {
        const stmt = this.db.prepare(`
            INSERT INTO rounds (round_id, session_id, round_number, player_team, round_start_time)
            VALUES (?, ?, ?, ?, ?)
        `);
        return stmt.run(roundId, sessionId, roundNumber, playerTeam, Date.now());
    }

    updateRound(roundId, updates) {
        const { outcome, roundPhase, gsiSnapshot, roundEndTime } = updates;
        const stmt = this.db.prepare(`
            UPDATE rounds 
            SET outcome = ?, round_phase = ?, gsi_snapshot_json = ?, round_end_time = ?
            WHERE round_id = ?
        `);
        return stmt.run(
            outcome, 
            roundPhase, 
            JSON.stringify(gsiSnapshot), 
            roundEndTime || Date.now(), 
            roundId
        );
    }

    getRound(roundId) {
        const stmt = this.db.prepare('SELECT * FROM rounds WHERE round_id = ?');
        const round = stmt.get(roundId);
        if (round && round.gsi_snapshot_json) {
            round.gsi_snapshot = JSON.parse(round.gsi_snapshot_json);
        }
        return round;
    }

    getSessionRounds(sessionId) {
        const stmt = this.db.prepare(`
            SELECT * FROM rounds 
            WHERE session_id = ? 
            ORDER BY round_number ASC
        `);
        return stmt.all(sessionId).map(round => {
            if (round.gsi_snapshot_json) {
                round.gsi_snapshot = JSON.parse(round.gsi_snapshot_json);
            }
            return round;
        });
    }

    // === AI INSIGHTS CRUD ===

    createInsight(insightId, sessionId, roundId, skillLevel, adviceText, screenshotPath = null, insightType = 'general') {
        const stmt = this.db.prepare(`
            INSERT INTO ai_insights (insight_id, session_id, round_id, timestamp, skill_level, advice_text, screenshot_path, insight_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(insightId, sessionId, roundId, Date.now(), skillLevel, adviceText, screenshotPath, insightType);
    }

    getInsights(sessionId, limit = 50) {
        const stmt = this.db.prepare(`
            SELECT * FROM ai_insights 
            WHERE session_id = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        `);
        return stmt.all(sessionId, limit);
    }

    getInsightsByType(sessionId, insightType) {
        const stmt = this.db.prepare(`
            SELECT * FROM ai_insights 
            WHERE session_id = ? AND insight_type = ?
            ORDER BY timestamp DESC
        `);
        return stmt.all(sessionId, insightType);
    }

    // === USER SETTINGS CRUD ===

    setSetting(key, value, type = 'string') {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO user_settings (setting_key, setting_value, setting_type, updated_at)
            VALUES (?, ?, ?, ?)
        `);
        return stmt.run(key, value, type, Date.now());
    }

    getSetting(key, defaultValue = null) {
        const stmt = this.db.prepare('SELECT setting_value, setting_type FROM user_settings WHERE setting_key = ?');
        const result = stmt.get(key);
        
        if (!result) return defaultValue;
        
        // Convert based on type
        switch (result.setting_type) {
            case 'number':
                return parseFloat(result.setting_value);
            case 'boolean':
                return result.setting_value === 'true';
            case 'json':
                try {
                    return JSON.parse(result.setting_value);
                } catch {
                    return defaultValue;
                }
            default:
                return result.setting_value;
        }
    }

    getAllSettings() {
        const stmt = this.db.prepare('SELECT * FROM user_settings ORDER BY setting_key');
        return stmt.all().reduce((acc, row) => {
            acc[row.setting_key] = this.getSetting(row.setting_key);
            return acc;
        }, {});
    }

    // === PERFORMANCE METRICS ===

    recordMetric(metricId, sessionId, roundId, metricType, metricValue) {
        const stmt = this.db.prepare(`
            INSERT INTO performance_metrics (metric_id, session_id, round_id, metric_type, metric_value, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(metricId, sessionId, roundId, metricType, metricValue, Date.now());
    }

    getMetrics(sessionId, metricType = null) {
        let sql = 'SELECT * FROM performance_metrics WHERE session_id = ?';
        let params = [sessionId];
        
        if (metricType) {
            sql += ' AND metric_type = ?';
            params.push(metricType);
        }
        
        sql += ' ORDER BY timestamp DESC';
        
        const stmt = this.db.prepare(sql);
        return stmt.all(...params);
    }

    // === SCREENSHOTS ===

    recordScreenshot(screenshotId, sessionId, roundId, filePath, metadata = {}) {
        const stmt = this.db.prepare(`
            INSERT INTO screenshots (screenshot_id, session_id, round_id, file_path, file_size, width, height, capture_time)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
            screenshotId, 
            sessionId, 
            roundId, 
            filePath, 
            metadata.fileSize || null,
            metadata.width || null,
            metadata.height || null,
            Date.now()
        );
    }

    getScreenshots(sessionId) {
        const stmt = this.db.prepare(`
            SELECT * FROM screenshots 
            WHERE session_id = ? 
            ORDER BY capture_time DESC
        `);
        return stmt.all(sessionId);
    }

    // === ROUND SUMMARIES CRUD ===

    createRoundSummary(summaryData) {
        const {
            summaryId,
            roundId,
            sessionId,
            roundNumber,
            coachingLevel,
            outcome,
            duration,
            compiledAt,
            gsiSnapshotsCount,
            aiInsightsCount,
            performanceMetricsCount,
            keyEventsCount,
            gsiAnalysis,
            aiAnalysis,
            performanceAnalysis,
            eventsAnalysis,
            consolidatedAnalysis,
            structuredSummary,
            keyInsights,
            recommendations,
            dataCompleteness,
            analysisConfidence,
            insightRelevance,
            playerTeam,
            mapName,
            processingTime
        } = summaryData;

        const stmt = this.db.prepare(`
            INSERT INTO round_summaries (
                summary_id, round_id, session_id, round_number, coaching_level,
                outcome, duration, compiled_at,
                gsi_snapshots_count, ai_insights_count, performance_metrics_count, key_events_count,
                gsi_analysis_json, ai_analysis_json, performance_analysis_json, events_analysis_json,
                consolidated_analysis_json, structured_summary_json, key_insights_json, recommendations_json,
                data_completeness, analysis_confidence, insight_relevance,
                player_team, map_name, processing_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        return stmt.run(
            summaryId, roundId, sessionId, roundNumber, coachingLevel,
            outcome, duration, compiledAt,
            gsiSnapshotsCount, aiInsightsCount, performanceMetricsCount, keyEventsCount,
            JSON.stringify(gsiAnalysis), JSON.stringify(aiAnalysis), 
            JSON.stringify(performanceAnalysis), JSON.stringify(eventsAnalysis),
            JSON.stringify(consolidatedAnalysis), JSON.stringify(structuredSummary),
            JSON.stringify(keyInsights), JSON.stringify(recommendations),
            dataCompleteness, analysisConfidence, insightRelevance,
            playerTeam, mapName, processingTime
        );
    }

    getRoundSummary(summaryId) {
        const stmt = this.db.prepare('SELECT * FROM round_summaries WHERE summary_id = ?');
        const summary = stmt.get(summaryId);
        
        if (summary) {
            this.parseRoundSummaryJSON(summary);
        }
        
        return summary;
    }

    getRoundSummaryByRoundId(roundId) {
        const stmt = this.db.prepare('SELECT * FROM round_summaries WHERE round_id = ?');
        const summary = stmt.get(roundId);
        
        if (summary) {
            this.parseRoundSummaryJSON(summary);
        }
        
        return summary;
    }

    getSessionRoundSummaries(sessionId, limit = 50) {
        const stmt = this.db.prepare(`
            SELECT * FROM round_summaries 
            WHERE session_id = ? 
            ORDER BY round_number ASC 
            LIMIT ?
        `);
        const summaries = stmt.all(sessionId, limit);
        
        summaries.forEach(summary => {
            this.parseRoundSummaryJSON(summary);
        });
        
        return summaries;
    }

    getRecentRoundSummaries(limit = 20) {
        const stmt = this.db.prepare(`
            SELECT * FROM round_summaries 
            ORDER BY compiled_at DESC 
            LIMIT ?
        `);
        const summaries = stmt.all(limit);
        
        summaries.forEach(summary => {
            this.parseRoundSummaryJSON(summary);
        });
        
        return summaries;
    }

    getRoundSummariesByCoachingLevel(coachingLevel, limit = 50) {
        const stmt = this.db.prepare(`
            SELECT * FROM round_summaries 
            WHERE coaching_level = ? 
            ORDER BY compiled_at DESC 
            LIMIT ?
        `);
        const summaries = stmt.all(coachingLevel, limit);
        
        summaries.forEach(summary => {
            this.parseRoundSummaryJSON(summary);
        });
        
        return summaries;
    }

    // Helper function to parse JSON fields in round summaries
    parseRoundSummaryJSON(summary) {
        const jsonFields = [
            'gsi_analysis_json', 'ai_analysis_json', 'performance_analysis_json',
            'events_analysis_json', 'consolidated_analysis_json', 'structured_summary_json',
            'key_insights_json', 'recommendations_json'
        ];

        jsonFields.forEach(field => {
            if (summary[field]) {
                try {
                    const fieldName = field.replace('_json', '');
                    summary[fieldName] = JSON.parse(summary[field]);
                } catch (error) {
                    console.error(`❌ Failed to parse JSON field ${field}:`, error.message);
                    summary[field.replace('_json', '')] = null;
                }
            }
        });
    }

    // === UTILITY METHODS ===

    // Get database statistics
    getStats() {
        const queries = {
            sessions: 'SELECT COUNT(*) as count FROM game_sessions',
            rounds: 'SELECT COUNT(*) as count FROM rounds',
            insights: 'SELECT COUNT(*) as count FROM ai_insights',
            screenshots: 'SELECT COUNT(*) as count FROM screenshots',
            summaries: 'SELECT COUNT(*) as count FROM round_summaries'
        };

        const stats = {};
        for (const [key, sql] of Object.entries(queries)) {
            stats[key] = this.db.prepare(sql).get().count;
        }

        // Add round summary specific stats
        if (stats.summaries > 0) {
            const summaryQueries = {
                avgDataCompleteness: 'SELECT AVG(data_completeness) as avg FROM round_summaries',
                avgAnalysisConfidence: 'SELECT AVG(analysis_confidence) as avg FROM round_summaries',
                avgProcessingTime: 'SELECT AVG(processing_time) as avg FROM round_summaries'
            };

            for (const [key, sql] of Object.entries(summaryQueries)) {
                const result = this.db.prepare(sql).get();
                stats[key] = result.avg || 0;
            }
        }

        stats.dbSize = fs.existsSync(this.dbPath) ? fs.statSync(this.dbPath).size : 0;
        stats.dbPath = this.dbPath;

        return stats;
    }

    // Clean up old data
    cleanup(daysToKeep = 30) {
        const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
        
        const stmt = this.db.prepare('DELETE FROM game_sessions WHERE start_time < ?');
        const result = stmt.run(cutoffTime);
        
        console.log(`🧹 Cleaned up ${result.changes} old sessions`);
        return result.changes;
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close();
            this.isInitialized = false;
            console.log('📊 Database connection closed');
        }
    }

    // Check if database is ready
    isReady() {
        return this.isInitialized && this.db !== null;
    }
}

// Export singleton instance
module.exports = new CoachAIDatabase(); 