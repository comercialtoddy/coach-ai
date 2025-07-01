// ====== COACH-AI ADVANCED HEAP PROFILER ======
// Detailed heap analysis and object reference tracking

const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');

/**
 * Advanced Heap Profiler for Coach-AI
 * Provides detailed heap analysis and object reference tracking
 */
class AdvancedHeapProfiler {
    constructor() {
        this.isProfilingActive = false;
        this.heapSnapshots = [];
        this.objectRegistry = new Map();
        this.referenceGraph = new Map();
        this.circularReferences = new Set();
        this.retainedObjects = new Map();
        
        // Profiling configuration
        this.config = {
            trackReferences: true,
            detectCircular: true,
            maxSnapshots: 20,
            objectSizeThreshold: 1024, // 1KB
            retentionTimeThreshold: 300000 // 5 minutes
        };
        
        console.log('🔬 Advanced Heap Profiler initialized');
    }
    
    /**
     * Start heap profiling with detailed object tracking
     */
    startProfiling(config = {}) {
        if (this.isProfilingActive) {
            console.log('⚠️ Heap profiling already active');
            return;
        }
        
        this.config = { ...this.config, ...config };
        this.isProfilingActive = true;
        
        console.log('🔬 Starting advanced heap profiling...');
        
        // Initialize object tracking
        this.initializeObjectTracking();
        
        // Set up periodic profiling
        this.profilingInterval = setInterval(() => {
            this.captureHeapSnapshot();
        }, 60000); // Every minute
        
        // Initial snapshot
        this.captureHeapSnapshot();
        
        console.log('✅ Advanced heap profiling active');
    }
    
    /**
     * Stop heap profiling and generate comprehensive analysis
     */
    stopProfiling() {
        if (!this.isProfilingActive) {
            console.log('⚠️ Heap profiling not active');
            return null;
        }
        
        console.log('🔬 Stopping heap profiling...');
        
        if (this.profilingInterval) {
            clearInterval(this.profilingInterval);
            this.profilingInterval = null;
        }
        
        this.isProfilingActive = false;
        
        // Generate comprehensive analysis
        const analysis = this.generateComprehensiveAnalysis();
        
        console.log('✅ Heap profiling stopped');
        console.log(`📊 Snapshots collected: ${this.heapSnapshots.length}`);
        
        return analysis;
    }
    
    /**
     * Initialize object tracking system
     */
    initializeObjectTracking() {
        // Track object creation patterns
        this.objectCreationPatterns = {
            functions: new Map(),
            objects: new Map(),
            arrays: new Map(),
            promises: new Map(),
            buffers: new Map()
        };
        
        // Set up WeakRef tracking for large objects
        this.largeObjectTracker = new Map();
        
        console.log('🔍 Object tracking system initialized');
    }
    
    /**
     * Capture detailed heap snapshot
     */
    async captureHeapSnapshot() {
        try {
            console.log('📸 Capturing detailed heap snapshot...');
            
            const snapshot = {
                timestamp: Date.now(),
                memory: this.getDetailedMemoryInfo(),
                heapStatistics: this.getV8HeapStatistics(),
                objectCounts: this.getDetailedObjectCounts(),
                referenceAnalysis: this.analyzeObjectReferences(),
                circularReferences: this.detectCircularReferences(),
                largeObjects: this.analyzeLargeObjects(),
                retainedObjects: this.analyzeRetainedObjects(),
                gcStats: this.getGarbageCollectionStats()
            };
            
            this.heapSnapshots.push(snapshot);
            
            // Limit snapshot retention
            if (this.heapSnapshots.length > this.config.maxSnapshots) {
                this.heapSnapshots.shift();
            }
            
            // Analyze retention between snapshots
            if (this.heapSnapshots.length > 1) {
                this.analyzeRetentionBetweenSnapshots();
            }
            
            console.log('✅ Heap snapshot captured');
            
            return snapshot;
            
        } catch (error) {
            console.error('❌ Failed to capture heap snapshot:', error.message);
            return null;
        }
    }
    
    /**
     * Get detailed memory information
     */
    getDetailedMemoryInfo() {
        const memoryUsage = process.memoryUsage();
        
        // Force GC and measure effect
        let beforeGC = null;
        let afterGC = null;
        
        if (global.gc) {
            beforeGC = { ...memoryUsage };
            global.gc();
            afterGC = process.memoryUsage();
        }
        
        return {
            current: memoryUsage,
            beforeGC,
            afterGC,
            gcEffect: afterGC ? {
                heapFreed: beforeGC.heapUsed - afterGC.heapUsed,
                rssChange: beforeGC.rss - afterGC.rss,
                externalChange: beforeGC.external - afterGC.external
            } : null,
            derived: {
                heapUtilization: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
                externalToHeapRatio: memoryUsage.external / memoryUsage.heapUsed,
                rssToHeapRatio: memoryUsage.rss / memoryUsage.heapUsed
            }
        };
    }
    
    /**
     * Get V8 heap statistics
     */
    getV8HeapStatistics() {
        try {
            const v8 = require('v8');
            const stats = v8.getHeapStatistics();
            
            // Add derived metrics
            stats.derived = {
                heapUtilization: (stats.used_heap_size / stats.total_heap_size) * 100,
                heapFragmentation: ((stats.total_heap_size - stats.used_heap_size) / stats.total_heap_size) * 100,
                mallocedMemoryRatio: stats.malloced_memory / stats.total_heap_size,
                peakMallocedRatio: stats.peak_malloced_memory / stats.total_heap_size
            };
            
            return stats;
        } catch (error) {
            console.warn('⚠️ V8 heap statistics not available:', error.message);
            return null;
        }
    }
    
    /**
     * Get detailed object counts
     */
    getDetailedObjectCounts() {
        const counts = {
            tracked: {},
            estimated: {},
            handles: this.getHandleAnalysis(),
            eventListeners: this.getEventListenerAnalysis(),
            timers: this.getTimerAnalysis()
        };
        
        // Count tracked objects
        for (const [type, objects] of this.objectCreationPatterns) {
            counts.tracked[type] = objects.size;
        }
        
        // Count large objects
        counts.largeObjects = this.largeObjectTracker.size;
        
        return counts;
    }
    
    /**
     * Analyze object references
     */
    analyzeObjectReferences() {
        if (!this.config.trackReferences) {
            return { disabled: true };
        }
        
        const analysis = {
            totalReferences: this.referenceGraph.size,
            strongReferences: 0,
            weakReferences: 0,
            orphanedObjects: 0,
            referenceChains: []
        };
        
        // Analyze reference types and chains
        for (const [objectId, references] of this.referenceGraph) {
            references.forEach(ref => {
                if (ref.type === 'strong') {
                    analysis.strongReferences++;
                } else if (ref.type === 'weak') {
                    analysis.weakReferences++;
                }
            });
            
            // Check for orphaned objects (no incoming references)
            const hasIncomingRefs = Array.from(this.referenceGraph.values())
                .some(refs => refs.some(ref => ref.target === objectId));
            
            if (!hasIncomingRefs && references.length === 0) {
                analysis.orphanedObjects++;
            }
        }
        
        // Find long reference chains (potential memory leak indicators)
        analysis.referenceChains = this.findLongReferenceChains();
        
        return analysis;
    }
    
    /**
     * Detect circular references
     */
    detectCircularReferences() {
        if (!this.config.detectCircular) {
            return { disabled: true };
        }
        
        const visited = new Set();
        const recursionStack = new Set();
        const circularRefs = new Set();
        
        // Depth-first search to detect cycles
        const detectCycles = (objectId, path = []) => {
            if (recursionStack.has(objectId)) {
                // Found circular reference
                const cycleStart = path.indexOf(objectId);
                const cycle = path.slice(cycleStart);
                circularRefs.add(cycle);
                return;
            }
            
            if (visited.has(objectId)) {
                return;
            }
            
            visited.add(objectId);
            recursionStack.add(objectId);
            
            const references = this.referenceGraph.get(objectId) || [];
            references.forEach(ref => {
                detectCycles(ref.target, [...path, objectId]);
            });
            
            recursionStack.delete(objectId);
        };
        
        // Check all objects for cycles
        for (const objectId of this.referenceGraph.keys()) {
            if (!visited.has(objectId)) {
                detectCycles(objectId);
            }
        }
        
        return {
            count: circularRefs.size,
            cycles: Array.from(circularRefs),
            severity: circularRefs.size > 10 ? 'high' : circularRefs.size > 5 ? 'medium' : 'low'
        };
    }
    
    /**
     * Analyze large objects
     */
    analyzeLargeObjects() {
        const largeObjects = [];
        
        for (const [objectId, info] of this.largeObjectTracker) {
            largeObjects.push({
                id: objectId,
                type: info.type,
                size: info.size,
                age: Date.now() - info.createdAt,
                retentionCount: info.retentionCount || 0
            });
        }
        
        // Sort by size descending
        largeObjects.sort((a, b) => b.size - a.size);
        
        const analysis = {
            count: largeObjects.length,
            totalSize: largeObjects.reduce((sum, obj) => sum + obj.size, 0),
            largestObject: largeObjects[0] || null,
            oldestObject: largeObjects.reduce((oldest, obj) => 
                !oldest || obj.age > oldest.age ? obj : oldest, null),
            sizeDistribution: this.calculateSizeDistribution(largeObjects),
            typeDistribution: this.calculateTypeDistribution(largeObjects)
        };
        
        return analysis;
    }
    
    /**
     * Analyze retained objects
     */
    analyzeRetainedObjects() {
        const retainedAnalysis = {
            count: this.retainedObjects.size,
            byType: {},
            byAge: {},
            longTermRetained: []
        };
        
        // Analyze by type and age
        for (const [objectId, info] of this.retainedObjects) {
            const type = info.type;
            const age = Date.now() - info.firstSeen;
            
            // Count by type
            retainedAnalysis.byType[type] = (retainedAnalysis.byType[type] || 0) + 1;
            
            // Categorize by age
            const ageCategory = age > 600000 ? 'very_old' : // > 10 minutes
                               age > 300000 ? 'old' :       // > 5 minutes
                               age > 60000 ? 'medium' :     // > 1 minute
                               'new';
            retainedAnalysis.byAge[ageCategory] = (retainedAnalysis.byAge[ageCategory] || 0) + 1;
            
            // Track long-term retained objects
            if (age > this.config.retentionTimeThreshold) {
                retainedAnalysis.longTermRetained.push({
                    id: objectId,
                    type: info.type,
                    age: age,
                    size: info.size,
                    retentionCount: info.retentionCount
                });
            }
        }
        
        return retainedAnalysis;
    }
    
    /**
     * Get garbage collection statistics
     */
    getGarbageCollectionStats() {
        try {
            const v8 = require('v8');
            
            // Get heap space statistics
            const heapSpaces = v8.getHeapSpaceStatistics();
            
            const gcStats = {
                heapSpaces: heapSpaces,
                totalAvailableSize: heapSpaces.reduce((sum, space) => sum + space.space_available_size, 0),
                totalUsedSize: heapSpaces.reduce((sum, space) => sum + space.space_used_size, 0),
                totalPhysicalSize: heapSpaces.reduce((sum, space) => sum + space.physical_space_size, 0),
                fragmentation: this.calculateHeapFragmentation(heapSpaces)
            };
            
            return gcStats;
        } catch (error) {
            console.warn('⚠️ GC statistics not available:', error.message);
            return null;
        }
    }
    
    /**
     * Calculate heap fragmentation
     */
    calculateHeapFragmentation(heapSpaces) {
        const totalSize = heapSpaces.reduce((sum, space) => sum + space.space_size, 0);
        const totalUsed = heapSpaces.reduce((sum, space) => sum + space.space_used_size, 0);
        
        return totalSize > 0 ? ((totalSize - totalUsed) / totalSize) * 100 : 0;
    }
    
    /**
     * Analyze retention between snapshots
     */
    analyzeRetentionBetweenSnapshots() {
        if (this.heapSnapshots.length < 2) return;
        
        const current = this.heapSnapshots[this.heapSnapshots.length - 1];
        const previous = this.heapSnapshots[this.heapSnapshots.length - 2];
        
        // Update retention counts for objects that persist
        for (const [objectId, info] of this.retainedObjects) {
            if (this.objectExistsInSnapshot(objectId, current)) {
                info.retentionCount = (info.retentionCount || 0) + 1;
                info.lastSeen = current.timestamp;
            }
        }
        
        // Remove objects that no longer exist
        for (const [objectId, info] of this.retainedObjects) {
            if (!this.objectExistsInSnapshot(objectId, current)) {
                this.retainedObjects.delete(objectId);
            }
        }
    }
    
    /**
     * Check if object exists in snapshot
     */
    objectExistsInSnapshot(objectId, snapshot) {
        // This is a simplified check - in a real implementation,
        // you would need more sophisticated object tracking
        return this.largeObjectTracker.has(objectId);
    }
    
    /**
     * Find long reference chains
     */
    findLongReferenceChains(maxDepth = 10) {
        const longChains = [];
        
        const traverse = (objectId, visited = new Set(), depth = 0) => {
            if (depth > maxDepth || visited.has(objectId)) {
                if (depth > 5) { // Consider chains longer than 5 as suspicious
                    longChains.push({
                        chain: Array.from(visited),
                        depth: depth
                    });
                }
                return;
            }
            
            visited.add(objectId);
            const references = this.referenceGraph.get(objectId) || [];
            
            references.forEach(ref => {
                traverse(ref.target, new Set(visited), depth + 1);
            });
        };
        
        // Start traversal from root objects
        for (const objectId of this.referenceGraph.keys()) {
            traverse(objectId);
        }
        
        // Sort by depth descending
        return longChains.sort((a, b) => b.depth - a.depth).slice(0, 10);
    }
    
    /**
     * Get handle analysis
     */
    getHandleAnalysis() {
        const handles = process._getActiveHandles();
        const analysis = {
            total: handles.length,
            byType: {},
            suspicious: []
        };
        
        handles.forEach(handle => {
            const type = handle.constructor.name;
            analysis.byType[type] = (analysis.byType[type] || 0) + 1;
            
            // Check for suspicious handles
            if (type === 'Timeout' && handle._repeat) {
                analysis.suspicious.push({
                    type: 'repeating_timeout',
                    handle: handle
                });
            }
        });
        
        return analysis;
    }
    
    /**
     * Get event listener analysis
     */
    getEventListenerAnalysis() {
        const analysis = {
            processListeners: process.listenerCount(),
            eventTypes: {},
            maxListeners: process.getMaxListeners()
        };
        
        // Analyze event types
        const events = process._events || {};
        Object.entries(events).forEach(([event, listeners]) => {
            const count = Array.isArray(listeners) ? listeners.length : 1;
            analysis.eventTypes[event] = count;
        });
        
        return analysis;
    }
    
    /**
     * Get timer analysis
     */
    getTimerAnalysis() {
        // Note: This is limited by Node.js internal access
        const analysis = {
            activeTimers: 0,
            immediates: 0
        };
        
        // Count active timers (approximate)
        const handles = process._getActiveHandles();
        handles.forEach(handle => {
            if (handle.constructor.name === 'Timeout') {
                analysis.activeTimers++;
            } else if (handle.constructor.name === 'Immediate') {
                analysis.immediates++;
            }
        });
        
        return analysis;
    }
    
    /**
     * Calculate size distribution
     */
    calculateSizeDistribution(objects) {
        const distribution = {
            'small (<10KB)': 0,
            'medium (10KB-100KB)': 0,
            'large (100KB-1MB)': 0,
            'very_large (>1MB)': 0
        };
        
        objects.forEach(obj => {
            const sizeKB = obj.size / 1024;
            if (sizeKB < 10) distribution['small (<10KB)']++;
            else if (sizeKB < 100) distribution['medium (10KB-100KB)']++;
            else if (sizeKB < 1024) distribution['large (100KB-1MB)']++;
            else distribution['very_large (>1MB)']++;
        });
        
        return distribution;
    }
    
    /**
     * Calculate type distribution
     */
    calculateTypeDistribution(objects) {
        const distribution = {};
        objects.forEach(obj => {
            distribution[obj.type] = (distribution[obj.type] || 0) + 1;
        });
        return distribution;
    }
    
    /**
     * Generate comprehensive analysis
     */
    generateComprehensiveAnalysis() {
        console.log('🔬 Generating comprehensive heap analysis...');
        
        const analysis = {
            summary: this.generateAnalysisSummary(),
            memoryTrends: this.analyzeMemoryTrends(),
            objectRetention: this.analyzeObjectRetentionPatterns(),
            circularReferenceAnalysis: this.analyzeCircularReferencePatterns(),
            largeObjectAnalysis: this.analyzeLargeObjectPatterns(),
            garbageCollectionAnalysis: this.analyzeGCPatterns(),
            leakIndicators: this.identifyLeakIndicators(),
            recommendations: []
        };
        
        // Generate recommendations
        analysis.recommendations = this.generateHeapRecommendations(analysis);
        
        console.log('✅ Comprehensive heap analysis complete');
        
        return analysis;
    }
    
    /**
     * Generate analysis summary
     */
    generateAnalysisSummary() {
        const firstSnapshot = this.heapSnapshots[0];
        const lastSnapshot = this.heapSnapshots[this.heapSnapshots.length - 1];
        
        if (!firstSnapshot || !lastSnapshot) {
            return { error: 'Insufficient snapshots for analysis' };
        }
        
        const memoryGrowth = lastSnapshot.memory.current.heapUsed - firstSnapshot.memory.current.heapUsed;
        const duration = lastSnapshot.timestamp - firstSnapshot.timestamp;
        
        return {
            duration: duration,
            snapshots: this.heapSnapshots.length,
            memoryGrowth: memoryGrowth,
            memoryGrowthMB: memoryGrowth / 1024 / 1024,
            growthRate: (memoryGrowth / duration) * 1000,
            retainedObjectCount: this.retainedObjects.size,
            circularReferenceCount: this.circularReferences.size,
            largeObjectCount: this.largeObjectTracker.size,
            severity: this.calculateOverallSeverity(memoryGrowth, duration)
        };
    }
    
    /**
     * Calculate overall severity
     */
    calculateOverallSeverity(memoryGrowth, duration) {
        const growthRateMBPerMin = (memoryGrowth / 1024 / 1024) / (duration / 60000);
        const retentionRatio = this.retainedObjects.size / Math.max(this.largeObjectTracker.size, 1);
        
        if (growthRateMBPerMin > 10 || retentionRatio > 0.8) return 'critical';
        if (growthRateMBPerMin > 5 || retentionRatio > 0.6) return 'high';
        if (growthRateMBPerMin > 2 || retentionRatio > 0.4) return 'medium';
        if (growthRateMBPerMin > 1 || retentionRatio > 0.2) return 'low';
        return 'none';
    }
    
    /**
     * Analyze memory trends
     */
    analyzeMemoryTrends() {
        // Implementation similar to memoryLeakDetector but more detailed
        const trends = {
            heapUsed: [],
            heapTotal: [],
            external: [],
            rss: []
        };
        
        this.heapSnapshots.forEach(snapshot => {
            trends.heapUsed.push({
                timestamp: snapshot.timestamp,
                value: snapshot.memory.current.heapUsed
            });
            trends.heapTotal.push({
                timestamp: snapshot.timestamp,
                value: snapshot.memory.current.heapTotal
            });
            trends.external.push({
                timestamp: snapshot.timestamp,
                value: snapshot.memory.current.external
            });
            trends.rss.push({
                timestamp: snapshot.timestamp,
                value: snapshot.memory.current.rss
            });
        });
        
        return trends;
    }
    
    /**
     * Analyze object retention patterns
     */
    analyzeObjectRetentionPatterns() {
        const patterns = {
            shortTerm: 0,  // < 1 minute
            mediumTerm: 0, // 1-5 minutes
            longTerm: 0,   // > 5 minutes
            byType: {}
        };
        
        const now = Date.now();
        
        for (const [objectId, info] of this.retainedObjects) {
            const age = now - info.firstSeen;
            
            if (age < 60000) patterns.shortTerm++;
            else if (age < 300000) patterns.mediumTerm++;
            else patterns.longTerm++;
            
            // Count by type
            patterns.byType[info.type] = (patterns.byType[info.type] || 0) + 1;
        }
        
        return patterns;
    }
    
    /**
     * Analyze circular reference patterns
     */
    analyzeCircularReferencePatterns() {
        // This would analyze patterns in circular references
        return {
            total: this.circularReferences.size,
            patterns: Array.from(this.circularReferences)
        };
    }
    
    /**
     * Analyze large object patterns
     */
    analyzeLargeObjectPatterns() {
        const analysis = {
            growth: [],
            typeDistribution: {},
            ageDistribution: {}
        };
        
        // Analyze growth over time
        this.heapSnapshots.forEach(snapshot => {
            analysis.growth.push({
                timestamp: snapshot.timestamp,
                count: snapshot.largeObjects.count,
                totalSize: snapshot.largeObjects.totalSize
            });
        });
        
        return analysis;
    }
    
    /**
     * Analyze garbage collection patterns
     */
    analyzeGCPatterns() {
        const gcAnalysis = {
            efficiency: [],
            frequency: [],
            effectiveness: []
        };
        
        this.heapSnapshots.forEach(snapshot => {
            if (snapshot.memory.gcEffect) {
                gcAnalysis.efficiency.push({
                    timestamp: snapshot.timestamp,
                    heapFreed: snapshot.memory.gcEffect.heapFreed,
                    effectiveness: snapshot.memory.gcEffect.heapFreed / snapshot.memory.beforeGC.heapUsed
                });
            }
        });
        
        return gcAnalysis;
    }
    
    /**
     * Identify leak indicators
     */
    identifyLeakIndicators() {
        const indicators = [];
        
        // Check for consistent memory growth
        if (this.heapSnapshots.length >= 3) {
            const recentGrowth = this.heapSnapshots.slice(-3);
            const isGrowing = recentGrowth.every((snapshot, index) => {
                if (index === 0) return true;
                return snapshot.memory.current.heapUsed > recentGrowth[index - 1].memory.current.heapUsed;
            });
            
            if (isGrowing) {
                indicators.push({
                    type: 'consistent_growth',
                    severity: 'medium',
                    description: 'Memory usage consistently growing over last 3 snapshots'
                });
            }
        }
        
        // Check for high retention rates
        const retentionRate = this.retainedObjects.size / Math.max(this.largeObjectTracker.size, 1);
        if (retentionRate > 0.7) {
            indicators.push({
                type: 'high_retention',
                severity: 'high',
                description: `${(retentionRate * 100).toFixed(1)}% of objects are being retained`
            });
        }
        
        // Check for circular references
        if (this.circularReferences.size > 5) {
            indicators.push({
                type: 'circular_references',
                severity: 'medium',
                description: `${this.circularReferences.size} circular references detected`
            });
        }
        
        return indicators;
    }
    
    /**
     * Generate heap recommendations
     */
    generateHeapRecommendations(analysis) {
        const recommendations = [];
        
        // Memory growth recommendations
        if (analysis.summary.severity === 'critical') {
            recommendations.push({
                type: 'critical',
                issue: 'Critical memory growth detected',
                recommendation: 'Immediate heap profiling required. Use Chrome DevTools Memory tab.',
                action: 'enable_detailed_profiling'
            });
        }
        
        // Object retention recommendations
        if (analysis.objectRetention.longTerm > 10) {
            recommendations.push({
                type: 'retention',
                issue: 'Many long-term retained objects',
                recommendation: 'Review object lifecycle management and ensure proper cleanup',
                action: 'audit_object_lifecycle'
            });
        }
        
        // Circular reference recommendations
        if (analysis.circularReferenceAnalysis.total > 5) {
            recommendations.push({
                type: 'circular_refs',
                issue: 'Multiple circular references detected',
                recommendation: 'Review object relationships and use WeakMap/WeakSet where appropriate',
                action: 'fix_circular_references'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Save heap analysis report
     */
    async saveHeapAnalysis(analysis, filename = null) {
        try {
            const reportPath = path.join(
                app.getPath('userData'),
                filename || `heap-analysis-${Date.now()}.json`
            );
            
            const report = {
                analysis,
                snapshots: this.heapSnapshots,
                objectRegistry: Array.from(this.objectRegistry.entries()),
                config: this.config,
                generatedAt: new Date().toISOString()
            };
            
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            console.log(`📄 Heap analysis saved to: ${reportPath}`);
            return reportPath;
        } catch (error) {
            console.error('❌ Failed to save heap analysis:', error.message);
            return null;
        }
    }
    
    /**
     * Get current profiling status
     */
    getStatus() {
        return {
            isProfilingActive: this.isProfilingActive,
            snapshotCount: this.heapSnapshots.length,
            trackedObjects: this.objectRegistry.size,
            retainedObjects: this.retainedObjects.size,
            circularReferences: this.circularReferences.size,
            config: this.config
        };
    }
}

// Export singleton instance
const heapProfiler = new AdvancedHeapProfiler();

module.exports = {
    AdvancedHeapProfiler,
    heapProfiler
};

console.log('🔬 Advanced Heap Profiler module loaded'); 