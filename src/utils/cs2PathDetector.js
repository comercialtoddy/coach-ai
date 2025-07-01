// ====== CS2 PATH DETECTOR - CROSS-PLATFORM ======
// Detecta automaticamente o caminho de instalação do CS2

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

class CS2PathDetector {
    constructor() {
        this.platform = os.platform();
        this.possiblePaths = [];
        this.detectedPath = null;
        this.cfgPath = null;
    }

    // === DETECÇÃO PRINCIPAL ===
    async detectCS2Path() {
        console.log(`🔍 Detecting CS2 installation on ${this.platform}...`);
        
        try {
            switch (this.platform) {
                case 'win32':
                    return await this.detectWindowsPath();
                case 'darwin':
                    return await this.detectMacOSPath();
                case 'linux':
                    return await this.detectLinuxPath();
                default:
                    throw new Error(`Unsupported platform: ${this.platform}`);
            }
        } catch (error) {
            console.error('❌ CS2 path detection failed:', error.message);
            return null;
        }
    }

    // === WINDOWS DETECTION ===
    async detectWindowsPath() {
        const methods = [
            () => this.checkWindowsRegistry(),
            () => this.checkWindowsCommonPaths(),
            () => this.checkSteamLibraries()
        ];

        for (const method of methods) {
            try {
                const result = await method();
                if (result) {
                    console.log(`✅ Found CS2 via Windows method: ${result}`);
                    return this.validateAndSetPath(result);
                }
            } catch (error) {
                console.log(`⚠️ Windows detection method failed: ${error.message}`);
            }
        }

        return null;
    }

    checkWindowsRegistry() {
        try {
            // Tentar localizar Steam via registro
            const steamCmd = 'reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Valve\\Steam" /v InstallPath 2>nul || reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Valve\\Steam" /v InstallPath 2>nul';
            const output = execSync(steamCmd, { encoding: 'utf8' });
            
            const match = output.match(/InstallPath\s+REG_SZ\s+(.+)/);
            if (match && match[1]) {
                const steamPath = match[1].trim();
                const cs2Path = path.join(steamPath, 'steamapps', 'common', 'Counter-Strike Global Offensive');
                
                if (fs.existsSync(cs2Path)) {
                    return cs2Path;
                }
            }
        } catch (error) {
            console.log('Registry method failed:', error.message);
        }
        return null;
    }

    checkWindowsCommonPaths() {
        const commonPaths = [
            'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive',
            'C:\\Program Files\\Steam\\steamapps\\common\\Counter-Strike Global Offensive',
            'D:\\Steam\\steamapps\\common\\Counter-Strike Global Offensive',
            'E:\\Steam\\steamapps\\common\\Counter-Strike Global Offensive',
            'C:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive',
            'D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive'
        ];

        for (const testPath of commonPaths) {
            if (fs.existsSync(testPath)) {
                return testPath;
            }
        }
        return null;
    }

    // === MACOS DETECTION ===
    async detectMacOSPath() {
        const commonPaths = [
            path.join(os.homedir(), 'Library', 'Application Support', 'Steam', 'steamapps', 'common', 'Counter-Strike Global Offensive'),
            '/Applications/Steam.app/Contents/MacOS/steamapps/common/Counter-Strike Global Offensive'
        ];

        for (const testPath of commonPaths) {
            if (fs.existsSync(testPath)) {
                console.log(`✅ Found CS2 on macOS: ${testPath}`);
                return this.validateAndSetPath(testPath);
            }
        }

        // Tentar localizar via comando Steam
        try {
            const steamPath = await this.findSteamPath();
            if (steamPath) {
                const cs2Path = path.join(steamPath, 'steamapps', 'common', 'Counter-Strike Global Offensive');
                if (fs.existsSync(cs2Path)) {
                    return this.validateAndSetPath(cs2Path);
                }
            }
        } catch (error) {
            console.log('macOS Steam detection failed:', error.message);
        }

        return null;
    }

    // === LINUX DETECTION ===
    async detectLinuxPath() {
        const commonPaths = [
            path.join(os.homedir(), '.steam', 'steam', 'steamapps', 'common', 'Counter-Strike Global Offensive'),
            path.join(os.homedir(), '.local', 'share', 'Steam', 'steamapps', 'common', 'Counter-Strike Global Offensive'),
            '/usr/local/games/steam/steamapps/common/Counter-Strike Global Offensive'
        ];

        for (const testPath of commonPaths) {
            if (fs.existsSync(testPath)) {
                console.log(`✅ Found CS2 on Linux: ${testPath}`);
                return this.validateAndSetPath(testPath);
            }
        }

        // Verificar bibliotecas Steam customizadas
        try {
            const steamLibraries = await this.findLinuxSteamLibraries();
            for (const library of steamLibraries) {
                const cs2Path = path.join(library, 'steamapps', 'common', 'Counter-Strike Global Offensive');
                if (fs.existsSync(cs2Path)) {
                    return this.validateAndSetPath(cs2Path);
                }
            }
        } catch (error) {
            console.log('Linux Steam libraries detection failed:', error.message);
        }

        return null;
    }

    // === STEAM LIBRARIES DETECTION ===
    async checkSteamLibraries() {
        try {
            const steamPath = await this.findSteamPath();
            if (!steamPath) return null;

            const configPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf');
            if (!fs.existsSync(configPath)) return null;

            const content = fs.readFileSync(configPath, 'utf8');
            const libraries = this.parseVDF(content);
            
            for (const library of libraries) {
                const cs2Path = path.join(library, 'steamapps', 'common', 'Counter-Strike Global Offensive');
                if (fs.existsSync(cs2Path)) {
                    return cs2Path;
                }
            }
        } catch (error) {
            console.log('Steam libraries detection failed:', error.message);
        }
        return null;
    }

    // === UTILITY METHODS ===
    async findSteamPath() {
        if (this.platform === 'win32') {
            return this.checkWindowsRegistry()?.replace(/steamapps.*/, '');
        } else if (this.platform === 'darwin') {
            const paths = [
                path.join(os.homedir(), 'Library', 'Application Support', 'Steam'),
                '/Applications/Steam.app/Contents/MacOS'
            ];
            return paths.find(p => fs.existsSync(p));
        } else if (this.platform === 'linux') {
            const paths = [
                path.join(os.homedir(), '.steam', 'steam'),
                path.join(os.homedir(), '.local', 'share', 'Steam')
            ];
            return paths.find(p => fs.existsSync(p));
        }
        return null;
    }

    async findLinuxSteamLibraries() {
        const libraries = [];
        const configPaths = [
            path.join(os.homedir(), '.steam', 'steam', 'steamapps', 'libraryfolders.vdf'),
            path.join(os.homedir(), '.local', 'share', 'Steam', 'steamapps', 'libraryfolders.vdf')
        ];

        for (const configPath of configPaths) {
            if (fs.existsSync(configPath)) {
                try {
                    const content = fs.readFileSync(configPath, 'utf8');
                    libraries.push(...this.parseVDF(content));
                } catch (error) {
                    console.log(`Failed to parse ${configPath}:`, error.message);
                }
            }
        }

        return libraries;
    }

    parseVDF(content) {
        const libraries = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            const match = line.match(/"path"\s+"(.+)"/);
            if (match && match[1]) {
                libraries.push(match[1].replace(/\\\\/g, '\\'));
            }
        }
        
        return libraries;
    }

    validateAndSetPath(cs2Path) {
        // Verificar se é uma instalação válida do CS2
        const indicators = [
            path.join(cs2Path, 'game', 'csgo'),
            path.join(cs2Path, 'game', 'bin'),
            path.join(cs2Path, 'cs2.exe'), // Windows
            path.join(cs2Path, 'cs2'), // Linux/Mac
        ];

        const hasValidIndicator = indicators.some(indicator => fs.existsSync(indicator));
        
        if (hasValidIndicator) {
            this.detectedPath = cs2Path;
            this.cfgPath = path.join(cs2Path, 'game', 'csgo', 'cfg');
            
            console.log(`✅ CS2 installation validated: ${cs2Path}`);
            console.log(`📁 Config directory: ${this.cfgPath}`);
            
            return {
                installPath: cs2Path,
                configPath: this.cfgPath,
                isValid: true
            };
        }

        console.log(`❌ Invalid CS2 installation: ${cs2Path}`);
        return null;
    }

    // === PUBLIC METHODS ===
    async getCS2InstallationInfo() {
        const result = await this.detectCS2Path();
        
        if (!result) {
            return {
                found: false,
                installPath: null,
                configPath: null,
                error: 'CS2 installation not found'
            };
        }

        return {
            found: true,
            installPath: result.installPath,
            configPath: result.configPath,
            platform: this.platform,
            isValid: result.isValid
        };
    }

    // Método para verificar se o diretório de config existe e tem permissão de escrita
    async checkConfigPermissions(configPath = null) {
        const targetPath = configPath || this.cfgPath;
        
        if (!targetPath || !fs.existsSync(targetPath)) {
            return {
                exists: false,
                writable: false,
                error: 'Config directory does not exist'
            };
        }

        try {
            // Tentar criar um arquivo temporário para testar permissão de escrita
            const testFile = path.join(targetPath, '.coach-ai-test-write');
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            
            return {
                exists: true,
                writable: true,
                path: targetPath
            };
        } catch (error) {
            return {
                exists: true,
                writable: false,
                error: `No write permission: ${error.message}`,
                needsElevation: error.code === 'EACCES' || error.code === 'EPERM'
            };
        }
    }

    // Método para obter caminhos possíveis para debug
    getPossiblePaths() {
        switch (this.platform) {
            case 'win32':
                return [
                    'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive',
                    'C:\\Program Files\\Steam\\steamapps\\common\\Counter-Strike Global Offensive',
                    'D:\\Steam\\steamapps\\common\\Counter-Strike Global Offensive'
                ];
            case 'darwin':
                return [
                    path.join(os.homedir(), 'Library', 'Application Support', 'Steam', 'steamapps', 'common', 'Counter-Strike Global Offensive')
                ];
            case 'linux':
                return [
                    path.join(os.homedir(), '.steam', 'steam', 'steamapps', 'common', 'Counter-Strike Global Offensive'),
                    path.join(os.homedir(), '.local', 'share', 'Steam', 'steamapps', 'common', 'Counter-Strike Global Offensive')
                ];
            default:
                return [];
        }
    }
}

module.exports = CS2PathDetector; 