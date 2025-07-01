// ====== GSI ERROR HANDLER - COMPREHENSIVE ERROR MANAGEMENT ======
// Gerencia todos os tipos de erro durante deployment e operações GSI

const os = require('os');
const path = require('path');

class GSIErrorHandler {
    constructor() {
        this.platform = os.platform();
        this.errorTypes = this.initializeErrorTypes();
        this.retryConfig = {
            maxRetries: 3,
            retryDelay: 1000, // 1 second
            backoffMultiplier: 2
        };
    }

    // === DEFINIÇÃO DE TIPOS DE ERRO ===
    initializeErrorTypes() {
        return {
            // File System Errors
            ENOENT: {
                type: 'FILE_NOT_FOUND',
                severity: 'ERROR',
                retryable: false,
                userMessage: 'File or directory not found'
            },
            EACCES: {
                type: 'PERMISSION_DENIED',
                severity: 'ERROR',
                retryable: true,
                userMessage: 'Permission denied - try running as administrator'
            },
            EPERM: {
                type: 'OPERATION_NOT_PERMITTED',
                severity: 'ERROR',
                retryable: true,
                userMessage: 'Operation not permitted - check file permissions'
            },
            EEXIST: {
                type: 'FILE_EXISTS',
                severity: 'WARNING',
                retryable: false,
                userMessage: 'File already exists'
            },
            ENOSPC: {
                type: 'NO_SPACE',
                severity: 'ERROR',
                retryable: false,
                userMessage: 'No space left on device'
            },
            EMFILE: {
                type: 'TOO_MANY_FILES',
                severity: 'ERROR',
                retryable: true,
                userMessage: 'Too many open files'
            },
            ENFILE: {
                type: 'FILE_TABLE_OVERFLOW',
                severity: 'ERROR',
                retryable: true,
                userMessage: 'File table overflow'
            },

            // Network/Connection Errors
            ECONNREFUSED: {
                type: 'CONNECTION_REFUSED',
                severity: 'ERROR',
                retryable: true,
                userMessage: 'Connection refused - check if GSI server is running'
            },
            ETIMEDOUT: {
                type: 'TIMEOUT',
                severity: 'ERROR',
                retryable: true,
                userMessage: 'Operation timed out'
            },

            // Custom Application Errors
            CS2_NOT_FOUND: {
                type: 'CS2_NOT_FOUND',
                severity: 'ERROR',
                retryable: false,
                userMessage: 'Counter-Strike 2 installation not found'
            },
            INVALID_CONFIG: {
                type: 'INVALID_CONFIG',
                severity: 'ERROR',
                retryable: false,
                userMessage: 'Invalid GSI configuration'
            },
            DEPLOYMENT_FAILED: {
                type: 'DEPLOYMENT_FAILED',
                severity: 'ERROR',
                retryable: true,
                userMessage: 'GSI deployment failed'
            }
        };
    }

    // === PROCESSAMENTO PRINCIPAL DE ERRO ===
    handleError(error, context = {}) {
        const errorInfo = this.analyzeError(error);
        const enrichedError = this.enrichErrorWithContext(errorInfo, context);
        const resolution = this.getErrorResolution(enrichedError);

        this.logError(enrichedError, context);

        return {
            ...enrichedError,
            resolution,
            timestamp: new Date().toISOString()
        };
    }

    // === ANÁLISE DE ERRO ===
    analyzeError(error) {
        // Handle string errors
        if (typeof error === 'string') {
            return this.createErrorInfo('GENERIC_ERROR', error, 'ERROR');
        }

        // Handle Error objects
        if (error instanceof Error) {
            const errorCode = error.code || 'UNKNOWN';
            const knownError = this.errorTypes[errorCode];

            if (knownError) {
                return {
                    code: errorCode,
                    type: knownError.type,
                    severity: knownError.severity,
                    retryable: knownError.retryable,
                    userMessage: knownError.userMessage,
                    originalMessage: error.message,
                    stack: error.stack,
                    systemError: true
                };
            }

            // Unknown system error
            return this.createErrorInfo('UNKNOWN_SYSTEM_ERROR', error.message, 'ERROR', {
                code: errorCode,
                stack: error.stack,
                systemError: true
            });
        }

        // Handle custom error objects
        if (error && typeof error === 'object') {
            return this.createErrorInfo(
                error.type || 'UNKNOWN_ERROR',
                error.message || 'Unknown error occurred',
                error.severity || 'ERROR',
                error
            );
        }

        return this.createErrorInfo('UNEXPECTED_ERROR', 'Unexpected error format', 'ERROR');
    }

    createErrorInfo(type, message, severity, additional = {}) {
        return {
            type,
            severity,
            userMessage: message,
            originalMessage: message,
            retryable: false,
            systemError: false,
            ...additional
        };
    }

    // === ENRIQUECIMENTO COM CONTEXTO ===
    enrichErrorWithContext(errorInfo, context) {
        const enriched = { ...errorInfo };

        // Add platform-specific information
        enriched.platform = this.platform;
        enriched.context = context;

        // Add operation context
        if (context.operation) {
            enriched.operation = context.operation;
            enriched.operationDetails = context.operationDetails || {};
        }

        // Add file path context
        if (context.filePath) {
            enriched.filePath = context.filePath;
            enriched.directory = path.dirname(context.filePath);
            enriched.filename = path.basename(context.filePath);
        }

        // Add CS2-specific context
        if (context.cs2Path) {
            enriched.cs2Path = context.cs2Path;
        }

        return enriched;
    }

    // === RESOLUÇÃO DE ERRO ===
    getErrorResolution(errorInfo) {
        const baseResolution = {
            canRetry: errorInfo.retryable,
            suggestedActions: [],
            technicalSteps: [],
            preventionTips: []
        };

        // Get specific resolution based on error type
        switch (errorInfo.type) {
            case 'PERMISSION_DENIED':
            case 'OPERATION_NOT_PERMITTED':
                return this.getPermissionErrorResolution(errorInfo, baseResolution);

            case 'FILE_NOT_FOUND':
                return this.getFileNotFoundResolution(errorInfo, baseResolution);

            case 'CS2_NOT_FOUND':
                return this.getCS2NotFoundResolution(errorInfo, baseResolution);

            case 'NO_SPACE':
                return this.getNoSpaceResolution(errorInfo, baseResolution);

            case 'CONNECTION_REFUSED':
                return this.getConnectionErrorResolution(errorInfo, baseResolution);

            case 'INVALID_CONFIG':
                return this.getConfigErrorResolution(errorInfo, baseResolution);

            default:
                return this.getGenericErrorResolution(errorInfo, baseResolution);
        }
    }

    // === RESOLUÇÕES ESPECÍFICAS ===
    getPermissionErrorResolution(errorInfo, base) {
        const isWindows = this.platform === 'win32';
        
        return {
            ...base,
            suggestedActions: [
                isWindows ? 'Run Coach-AI as Administrator' : 'Run Coach-AI with sudo',
                'Check folder permissions for the CS2 config directory',
                'Make sure CS2 is not running during GSI installation',
                'Verify Steam is not running in admin mode while Coach-AI runs normally'
            ],
            technicalSteps: [
                isWindows ? 'Right-click Coach-AI and select "Run as administrator"' : 'Use: sudo node main.js',
                `Check permissions on: ${errorInfo.filePath || 'CS2 config directory'}`,
                'Close all Steam and CS2 processes completely',
                'Try running the GSI deployment again'
            ],
            preventionTips: [
                'Always run Coach-AI with appropriate permissions',
                'Don\'t run Steam and Coach-AI with different permission levels',
                'Keep CS2 closed during GSI configuration changes'
            ]
        };
    }

    getFileNotFoundResolution(errorInfo, base) {
        return {
            ...base,
            suggestedActions: [
                'Verify CS2 is installed correctly',
                'Check if the file path exists',
                'Reinstall CS2 if necessary',
                'Try running CS2 Path detection again'
            ],
            technicalSteps: [
                `Verify path exists: ${errorInfo.filePath || 'Unknown path'}`,
                'Check CS2 installation through Steam',
                'Verify game files integrity in Steam',
                'Run Coach-AI CS2 detection manually'
            ],
            preventionTips: [
                'Keep CS2 updated through Steam',
                'Don\'t manually modify CS2 installation files',
                'Use standard Steam installation paths'
            ]
        };
    }

    getCS2NotFoundResolution(errorInfo, base) {
        return {
            ...base,
            suggestedActions: [
                'Install Counter-Strike 2 through Steam',
                'Make sure CS2 is installed in a standard Steam location',
                'Check if Steam is installed correctly',
                'Try manual path specification'
            ],
            technicalSteps: [
                'Open Steam and verify CS2 is in your library',
                'Try launching CS2 at least once',
                'Check Steam settings for library folders',
                'Verify CS2 files are not corrupted'
            ],
            preventionTips: [
                'Always install CS2 through official Steam',
                'Keep Steam and CS2 updated',
                'Use standard installation directories'
            ]
        };
    }

    getNoSpaceResolution(errorInfo, base) {
        return {
            ...base,
            suggestedActions: [
                'Free up disk space',
                'Move large files to another drive',
                'Empty recycle bin/trash',
                'Use disk cleanup utility'
            ],
            technicalSteps: [
                'Check available disk space',
                'Remove temporary files',
                'Move old downloads and files',
                'Run disk cleanup tools'
            ],
            preventionTips: [
                'Monitor disk space regularly',
                'Keep at least 10% free space available',
                'Use automatic cleanup tools'
            ]
        };
    }

    getConnectionErrorResolution(errorInfo, base) {
        return {
            ...base,
            suggestedActions: [
                'Make sure Coach-AI GSI server is running',
                'Check Windows Firewall settings',
                'Verify port 3000 is not blocked',
                'Check if another application is using port 3000'
            ],
            technicalSteps: [
                'Restart Coach-AI application',
                'Check firewall rules for port 3000',
                'Use netstat to check port availability',
                'Test GSI endpoint manually'
            ],
            preventionTips: [
                'Configure firewall exceptions for Coach-AI',
                'Don\'t run multiple applications on port 3000',
                'Keep antivirus updated but configure exceptions'
            ]
        };
    }

    getConfigErrorResolution(errorInfo, base) {
        return {
            ...base,
            suggestedActions: [
                'Reset GSI configuration to defaults',
                'Check GSI file format',
                'Regenerate GSI configuration',
                'Verify CS2 GSI requirements'
            ],
            technicalSteps: [
                'Delete existing GSI config file',
                'Regenerate config using Coach-AI',
                'Validate config file format',
                'Test with minimal GSI configuration'
            ],
            preventionTips: [
                'Don\'t manually edit GSI configuration files',
                'Use Coach-AI to generate configurations',
                'Keep backups of working configurations'
            ]
        };
    }

    getGenericErrorResolution(errorInfo, base) {
        return {
            ...base,
            suggestedActions: [
                'Restart the application',
                'Check system resources',
                'Update Coach-AI to latest version',
                'Contact support if issue persists'
            ],
            technicalSteps: [
                'Close and restart Coach-AI',
                'Check RAM and CPU usage',
                'Verify system requirements',
                'Check for software updates'
            ],
            preventionTips: [
                'Keep system and software updated',
                'Monitor system resources',
                'Regular restarts can prevent issues'
            ]
        };
    }

    // === RETRY MECHANISM ===
    async executeWithRetry(operation, context = {}, customRetryConfig = {}) {
        const config = { ...this.retryConfig, ...customRetryConfig };
        let lastError;
        let attempt = 0;

        while (attempt <= config.maxRetries) {
            try {
                const result = await operation();
                if (attempt > 0) {
                    console.log(`✅ Operation succeeded on attempt ${attempt + 1}`);
                }
                return { success: true, result, attempts: attempt + 1 };
            } catch (error) {
                attempt++;
                lastError = error;
                
                const errorInfo = this.analyzeError(error);
                
                if (!errorInfo.retryable || attempt > config.maxRetries) {
                    break;
                }

                const delay = config.retryDelay * Math.pow(config.backoffMultiplier, attempt - 1);
                console.log(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms...`);
                console.log(`   Error: ${errorInfo.userMessage}`);
                
                await this.sleep(delay);
            }
        }

        const finalError = this.handleError(lastError, {
            ...context,
            operation: 'retry_exhausted',
            attempts: attempt
        });

        return { 
            success: false, 
            error: finalError, 
            attempts: attempt 
        };
    }

    // === LOGGING ===
    logError(errorInfo, context) {
        const timestamp = new Date().toISOString();
        const severity = errorInfo.severity || 'ERROR';
        
        console.error(`\n[${timestamp}] ${severity}: ${errorInfo.type}`);
        console.error(`Message: ${errorInfo.userMessage}`);
        
        if (errorInfo.originalMessage && errorInfo.originalMessage !== errorInfo.userMessage) {
            console.error(`Original: ${errorInfo.originalMessage}`);
        }
        
        if (context.operation) {
            console.error(`Operation: ${context.operation}`);
        }
        
        if (errorInfo.filePath) {
            console.error(`File: ${errorInfo.filePath}`);
        }
        
        if (errorInfo.code) {
            console.error(`Code: ${errorInfo.code}`);
        }

        // Only log stack trace in development
        if (process.env.NODE_ENV === 'development' && errorInfo.stack) {
            console.error(`Stack:\n${errorInfo.stack}`);
        }

        console.error(''); // Empty line for readability
    }

    // === UTILITÁRIOS ===
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Criar erro customizado
    createCustomError(type, message, options = {}) {
        const error = new Error(message);
        error.code = type;
        Object.assign(error, options);
        return error;
    }

    // Wrapper para operações de arquivo
    async safeFileOperation(operation, context = {}) {
        try {
            return await operation();
        } catch (error) {
            throw this.handleError(error, {
                ...context,
                operation: 'file_operation'
            });
        }
    }

    // === MÉTODOS ESTÁTICOS ===
    static handle(error, context = {}) {
        const handler = new GSIErrorHandler();
        return handler.handleError(error, context);
    }

    static async retry(operation, context = {}, retryConfig = {}) {
        const handler = new GSIErrorHandler();
        return handler.executeWithRetry(operation, context, retryConfig);
    }
}

module.exports = GSIErrorHandler; 