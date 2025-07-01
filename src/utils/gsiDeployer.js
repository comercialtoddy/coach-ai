// ====== GSI DEPLOYER - AUTOMATED GSI DEPLOYMENT ======
// Orquestra detecção do CS2, validação de permissões e deployment do GSI

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const CS2PathDetector = require('./cs2PathDetector');
const GSIConfigGenerator = require('./gsiConfigGenerator');

class GSIDeployer {
    constructor() {
        this.pathDetector = new CS2PathDetector();
        this.configGenerator = new GSIConfigGenerator();
        this.cs2Info = null;
        this.deploymentResult = null;
    }

    // === DEPLOYMENT PRINCIPAL ===
    async deployGSIConfig(options = {}) {
        console.log('🚀 Starting GSI deployment process...');
        
        try {
            // Step 1: Detect CS2 installation
            const cs2Info = await this.detectCS2Installation();
            if (!cs2Info.found) {
                return this.createFailureResult('CS2_NOT_FOUND', cs2Info.error);
            }

            // Step 2: Validate path and permissions
            const validation = await this.validatePathAndPermissions(cs2Info);
            if (!validation.isValid) {
                return this.createFailureResult('VALIDATION_FAILED', validation.error, validation);
            }

            // Step 3: Generate GSI configuration
            const configContent = this.generateGSIContent(options);

            // Step 4: Write configuration file
            const writeResult = await this.writeGSIFile(cs2Info.configPath, configContent, options);
            if (!writeResult.success) {
                return this.createFailureResult('WRITE_FAILED', writeResult.error, writeResult);
            }

            // Step 5: Verify deployment
            const verification = await this.verifyDeployment(cs2Info.configPath);

            console.log('✅ GSI deployment completed successfully!');
            return this.createSuccessResult(cs2Info, configContent, writeResult, verification);

        } catch (error) {
            console.error('❌ GSI deployment failed:', error);
            return this.createFailureResult('UNEXPECTED_ERROR', error.message, { error });
        }
    }

    // === STEP 1: DETECÇÃO DO CS2 ===
    async detectCS2Installation() {
        console.log('🔍 Step 1: Detecting CS2 installation...');
        
        try {
            const cs2Info = await this.pathDetector.getCS2InstallationInfo();
            this.cs2Info = cs2Info;

            if (cs2Info.found) {
                console.log(`✅ CS2 found at: ${cs2Info.installPath}`);
                console.log(`📁 Config directory: ${cs2Info.configPath}`);
            } else {
                console.log('❌ CS2 installation not found');
                console.log('💡 Possible paths to check:');
                this.pathDetector.getPossiblePaths().forEach(p => 
                    console.log(`   - ${p}`)
                );
            }

            return cs2Info;
        } catch (error) {
            console.error('❌ CS2 detection error:', error.message);
            return {
                found: false,
                error: `Detection failed: ${error.message}`
            };
        }
    }

    // === STEP 2: VALIDAÇÃO DE PATH E PERMISSÕES ===
    async validatePathAndPermissions(cs2Info) {
        console.log('🔐 Step 2: Validating path and permissions...');
        
        try {
            // Check if config directory exists
            if (!fsSync.existsSync(cs2Info.configPath)) {
                console.log(`❌ Config directory not found: ${cs2Info.configPath}`);
                return {
                    isValid: false,
                    error: `Config directory does not exist: ${cs2Info.configPath}`,
                    needsManualSetup: true
                };
            }

            // Check write permissions
            const permissions = await this.pathDetector.checkConfigPermissions(cs2Info.configPath);
            
            if (!permissions.writable) {
                console.log(`❌ No write permission to: ${cs2Info.configPath}`);
                return {
                    isValid: false,
                    error: permissions.error,
                    needsElevation: permissions.needsElevation,
                    path: cs2Info.configPath
                };
            }

            console.log('✅ Path and permissions validated');
            return {
                isValid: true,
                path: cs2Info.configPath,
                writable: true
            };

        } catch (error) {
            console.error('❌ Validation error:', error.message);
            return {
                isValid: false,
                error: `Validation failed: ${error.message}`
            };
        }
    }

    // === STEP 3: GERAÇÃO DA CONFIGURAÇÃO ===
    generateGSIContent(options = {}) {
        console.log('📝 Step 3: Generating GSI configuration...');
        
        try {
            // Use coaching level if provided, otherwise use default
            const configOptions = {
                coachingLevel: options.coachingLevel || 'professional',
                uri: options.uri || 'http://localhost:3000/gsi',
                authToken: options.authToken || 'coachai_secure_token_2024',
                ...options
            };

            const content = this.configGenerator.generateValidatedConfig(configOptions);
            
            console.log(`✅ Generated GSI config for ${configOptions.coachingLevel} level`);
            console.log(`🔗 URI: ${configOptions.uri}`);
            
            return content;
        } catch (error) {
            console.error('❌ Config generation error:', error.message);
            throw new Error(`Failed to generate GSI config: ${error.message}`);
        }
    }

    // === STEP 4: ESCRITA DO ARQUIVO ===
    async writeGSIFile(configPath, content, options = {}) {
        console.log('💾 Step 4: Writing GSI configuration file...');
        
        const fileName = options.fileName || 'gamestate_integration_coachai.cfg';
        const filePath = path.join(configPath, fileName);
        const backupPath = path.join(configPath, `${fileName}.backup.${Date.now()}`);

        try {
            // Create backup if file exists
            if (fsSync.existsSync(filePath)) {
                console.log('📋 Creating backup of existing file...');
                await fs.copyFile(filePath, backupPath);
                console.log(`✅ Backup created: ${backupPath}`);
            }

            // Write new configuration
            await fs.writeFile(filePath, content, 'utf8');
            
            console.log(`✅ GSI config written to: ${filePath}`);
            console.log(`📊 File size: ${content.length} bytes`);

            return {
                success: true,
                filePath,
                backupPath: fsSync.existsSync(backupPath) ? backupPath : null,
                fileSize: content.length
            };

        } catch (error) {
            console.error('❌ File write error:', error.message);
            
            // Try to restore backup if write failed and backup exists
            if (fsSync.existsSync(backupPath)) {
                try {
                    await fs.copyFile(backupPath, filePath);
                    console.log('🔄 Restored backup due to write failure');
                } catch (restoreError) {
                    console.error('❌ Failed to restore backup:', restoreError.message);
                }
            }

            return {
                success: false,
                error: error.message,
                errorCode: error.code,
                filePath,
                needsElevation: error.code === 'EACCES' || error.code === 'EPERM'
            };
        }
    }

    // === STEP 5: VERIFICAÇÃO DO DEPLOYMENT ===
    async verifyDeployment(configPath) {
        console.log('🔍 Step 5: Verifying deployment...');
        
        const fileName = 'gamestate_integration_coachai.cfg';
        const filePath = path.join(configPath, fileName);

        try {
            // Check if file exists
            if (!fsSync.existsSync(filePath)) {
                return {
                    verified: false,
                    error: 'GSI config file not found after write'
                };
            }

            // Read and validate content
            const content = await fs.readFile(filePath, 'utf8');
            const stats = await fs.stat(filePath);

            // Basic content validation
            const hasURI = content.includes('uri');
            const hasTimeout = content.includes('timeout');
            const hasData = content.includes('data');
            const hasCoachAI = content.includes('coach-ai');

            const isValid = hasURI && hasTimeout && hasData && hasCoachAI;

            console.log('✅ Deployment verification completed');
            console.log(`📄 File exists: ${fsSync.existsSync(filePath)}`);
            console.log(`📊 File size: ${stats.size} bytes`);
            console.log(`✅ Content valid: ${isValid}`);

            return {
                verified: true,
                filePath,
                fileSize: stats.size,
                contentValid: isValid,
                lastModified: stats.mtime,
                details: {
                    hasURI,
                    hasTimeout,
                    hasData,
                    hasCoachAI
                }
            };

        } catch (error) {
            console.error('❌ Verification error:', error.message);
            return {
                verified: false,
                error: error.message
            };
        }
    }

    // === RESULT HELPERS ===
    createSuccessResult(cs2Info, configContent, writeResult, verification) {
        return {
            success: true,
            deployment: {
                cs2Path: cs2Info.installPath,
                configPath: cs2Info.configPath,
                filePath: writeResult.filePath,
                backupCreated: !!writeResult.backupPath,
                backupPath: writeResult.backupPath
            },
            verification,
            config: {
                contentLength: configContent.length,
                generatedAt: new Date().toISOString()
            },
            instructions: {
                nextSteps: [
                    'Launch Counter-Strike 2',
                    'Start a match (Deathmatch, Casual, or Private)',
                    'GSI data should start flowing to localhost:3000/gsi',
                    'Check the Coach-AI overlay for real-time data'
                ],
                troubleshooting: [
                    'If no data appears, restart CS2 completely',
                    'Make sure Coach-AI is running and listening on port 3000',
                    'Check Windows Firewall/Antivirus settings',
                    'Verify the config file is in the correct location'
                ]
            }
        };
    }

    createFailureResult(errorType, errorMessage, additionalData = {}) {
        const result = {
            success: false,
            errorType,
            error: errorMessage,
            timestamp: new Date().toISOString(),
            ...additionalData
        };

        // Add specific instructions based on error type
        switch (errorType) {
            case 'CS2_NOT_FOUND':
                result.solutions = [
                    'Install Counter-Strike 2 through Steam',
                    'Make sure CS2 is installed in a standard Steam location',
                    'If using a custom Steam library, check the path manually',
                    'Try running Coach-AI as administrator'
                ];
                result.manualPath = this.pathDetector.getPossiblePaths();
                break;

            case 'VALIDATION_FAILED':
                result.solutions = [
                    'Run Coach-AI as administrator/sudo',
                    'Check folder permissions for the CS2 cfg directory',
                    'Make sure CS2 is not running during installation',
                    'Verify Steam is not running in admin mode while Coach-AI runs normally'
                ];
                break;

            case 'WRITE_FAILED':
                result.solutions = [
                    additionalData.needsElevation ? 'Run Coach-AI as administrator' : 'Check file permissions',
                    'Close CS2 completely before trying again',
                    'Check available disk space',
                    'Temporarily disable antivirus if it blocks file creation'
                ];
                break;
        }

        return result;
    }

    // === MÉTODOS UTILITÁRIOS ===
    async getDeploymentStatus() {
        try {
            const cs2Info = await this.pathDetector.getCS2InstallationInfo();
            if (!cs2Info.found) {
                return { deployed: false, reason: 'CS2 not found' };
            }

            const gsiPath = path.join(cs2Info.configPath, 'gamestate_integration_coachai.cfg');
            const exists = fsSync.existsSync(gsiPath);

            if (!exists) {
                return { deployed: false, reason: 'GSI config not found' };
            }

            const stats = await fs.stat(gsiPath);
            const content = await fs.readFile(gsiPath, 'utf8');

            return {
                deployed: true,
                filePath: gsiPath,
                fileSize: stats.size,
                lastModified: stats.mtime,
                contentPreview: content.substring(0, 200) + '...'
            };

        } catch (error) {
            return { 
                deployed: false, 
                reason: 'Error checking status',
                error: error.message 
            };
        }
    }

    async uninstallGSI() {
        try {
            const cs2Info = await this.pathDetector.getCS2InstallationInfo();
            if (!cs2Info.found) {
                return { success: false, error: 'CS2 not found' };
            }

            const gsiPath = path.join(cs2Info.configPath, 'gamestate_integration_coachai.cfg');
            
            if (fsSync.existsSync(gsiPath)) {
                await fs.unlink(gsiPath);
                console.log('✅ GSI config removed successfully');
                return { success: true, removedFile: gsiPath };
            } else {
                return { success: true, message: 'GSI config was not installed' };
            }

        } catch (error) {
            console.error('❌ Failed to remove GSI config:', error.message);
            return { success: false, error: error.message };
        }
    }

    // === MÉTODOS ESTÁTICOS ===
    static async quickDeploy(options = {}) {
        const deployer = new GSIDeployer();
        return await deployer.deployGSIConfig(options);
    }

    static async checkStatus() {
        const deployer = new GSIDeployer();
        return await deployer.getDeploymentStatus();
    }

    static async remove() {
        const deployer = new GSIDeployer();
        return await deployer.uninstallGSI();
    }
}

module.exports = GSIDeployer; 