/**
 * CS2 Coach AI - Radar Image Manager
 * Sistema para carregar e gerenciar imagens de radar para análise visual
 */

const fs = require('fs');
const path = require('path');

class RadarImageManager {
    constructor() {
        this.radarPaths = {
            ingame: path.join(__dirname, '../database/radars/ingame'),
            ingameTransparent: path.join(__dirname, '../database/radars/ingame-transparent'),
            simpleradar: path.join(__dirname, '../database/radars/simpleradar'),
            ingameLegacy: path.join(__dirname, '../database/radars/ingame-legacy')
        };
        
        this.supportedMaps = [
            'de_ancient', 'de_anubis', 'de_dust2', 'de_inferno', 
            'de_mirage', 'de_nuke', 'de_overpass', 'de_vertigo',
            'cs_italy', 'cs_office', 'de_cache', 'de_train'
        ];
        
        this.imageCache = new Map();
    }
    
    /**
     * Carrega uma imagem de radar e converte para base64
     * @param {string} mapName - Nome do mapa (ex: de_dust2)
     * @param {string} style - Estilo do radar (ingame, simpleradar, etc)
     * @returns {Object} Objeto com dados da imagem e metadados
     */
    async loadRadarImage(mapName, style = 'simpleradar') {
        const cacheKey = `${mapName}_${style}`;
        
        // Verificar cache
        if (this.imageCache.has(cacheKey)) {
            return this.imageCache.get(cacheKey);
        }
        
        try {
            // Determinar caminho baseado no estilo
            const radarPath = this.getRadarPath(mapName, style);
            
            if (!radarPath || !fs.existsSync(radarPath)) {
                console.warn(`[RadarManager] Radar not found: ${mapName} (${style})`);
                return null;
            }
            
            // Ler arquivo e converter para base64
            const imageBuffer = fs.readFileSync(radarPath);
            const base64Image = imageBuffer.toString('base64');
            
            // Determinar MIME type
            const ext = path.extname(radarPath).toLowerCase();
            const mimeType = this.getMimeType(ext);
            
            const imageData = {
                mapName,
                style,
                base64: base64Image,
                mimeType,
                size: imageBuffer.length,
                path: radarPath,
                callouts: this.getMapCallouts(mapName)
            };
            
            // Cachear resultado
            this.imageCache.set(cacheKey, imageData);
            
            return imageData;
            
        } catch (error) {
            console.error(`[RadarManager] Error loading radar: ${error.message}`);
            return null;
        }
    }
    
    /**
     * Determina o caminho do arquivo de radar
     */
    getRadarPath(mapName, style) {
        const basePath = this.radarPaths[style];
        if (!basePath) return null;
        
        // Tentar diferentes extensões
        const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
        
        for (const ext of extensions) {
            // Primeiro tentar com _radar suffix
            const fullPath = path.join(basePath, `${mapName}_radar${ext}`);
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
            
            // Tentar sem _radar suffix (padrão mais comum)
            const altPath = path.join(basePath, `${mapName}${ext}`);
            if (fs.existsSync(altPath)) {
                return altPath;
            }
            
            // Para simpleradar, arquivos são .webp
            if (style === 'simpleradar' && ext === '.png') {
                const webpPath = path.join(basePath, `${mapName}.webp`);
                if (fs.existsSync(webpPath)) {
                    return webpPath;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Determina MIME type baseado na extensão
     */
    getMimeType(extension) {
        const mimeTypes = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.webp': 'image/webp'
        };
        
        return mimeTypes[extension.toLowerCase()] || 'image/png';
    }
    
    /**
     * Retorna callouts importantes do mapa para contexto
     */
    getMapCallouts(mapName) {
        const callouts = {
            de_dust2: {
                bombsites: ['A Site (Long/Short)', 'B Site (Tunnels/Window)'],
                keyPositions: ['Long A', 'Short/Cat', 'Mid', 'B Tunnels', 'Upper B', 'Lower B'],
                ctSpawn: 'CT Spawn (near B site)',
                tSpawn: 'T Spawn (outside long)',
                midControl: 'Mid Doors crucial for map control'
            },
            de_mirage: {
                bombsites: ['A Site (Palace/Ramp)', 'B Site (Apps/Short)'],
                keyPositions: ['Palace', 'A Ramp', 'Connector', 'Window', 'B Apps', 'Underpass'],
                ctSpawn: 'CT Spawn (near B site)',
                tSpawn: 'T Spawn (near A ramp)',
                midControl: 'Mid/Window control essential'
            },
            de_inferno: {
                bombsites: ['A Site (Arch/Apps)', 'B Site (Banana/CT)'],
                keyPositions: ['Banana', 'Mid', 'Apps', 'Arch', 'Library', 'Construction'],
                ctSpawn: 'CT Spawn (near A site)',
                tSpawn: 'T Spawn (near banana)',
                midControl: 'Banana and Mid control critical'
            },
            de_nuke: {
                bombsites: ['A Site (Upper)', 'B Site (Lower)'],
                keyPositions: ['Outside', 'Secret', 'Ramp', 'Heaven', 'Hell', 'Vents'],
                ctSpawn: 'CT Spawn (between sites)',
                tSpawn: 'T Spawn (outside)',
                verticalPlay: 'Vertical gameplay with upper/lower levels'
            },
            de_overpass: {
                bombsites: ['A Site (Bathrooms/Long)', 'B Site (Monster/Pillar)'],
                keyPositions: ['Monster', 'Connector', 'Bathrooms', 'Long A', 'Short B', 'Water'],
                ctSpawn: 'CT Spawn (near B site)',
                tSpawn: 'T Spawn (near fountain)',
                connectorControl: 'Connector crucial for rotations'
            },
            de_vertigo: {
                bombsites: ['A Site (Ramp)', 'B Site (Stairs)'],
                keyPositions: ['A Ramp', 'Mid', 'B Stairs', 'Elevator', 'T Spawn', 'CT Spawn'],
                ctSpawn: 'CT Spawn (between sites)',
                tSpawn: 'T Spawn (bottom)',
                verticalPlay: 'Two-level map with crucial mid control'
            },
            de_ancient: {
                bombsites: ['A Site (Main/Elbow)', 'B Site (Cave/Ruins)'],
                keyPositions: ['Mid', 'Cave', 'Elbow', 'Temple', 'Red', 'CT'],
                ctSpawn: 'CT Spawn (near A site)',
                tSpawn: 'T Spawn (near mid)',
                midControl: 'Mid control opens both sites'
            },
            de_anubis: {
                bombsites: ['A Site (Main/Palace)', 'B Site (Upper/Lower)'],
                keyPositions: ['Mid', 'Connector', 'Palace', 'Main', 'Water', 'B Stairs'],
                ctSpawn: 'CT Spawn (near connector)',
                tSpawn: 'T Spawn (near canals)',
                connectorControl: 'Connector key for rotations'
            }
        };
        
        return callouts[mapName] || {
            bombsites: ['A Site', 'B Site'],
            keyPositions: ['Mid', 'Long', 'Short'],
            general: 'Standard competitive map layout'
        };
    }
    
    /**
     * Prepara dados de imagem para envio ao Gemini
     */
    async prepareImageForGemini(mapName, style = 'simpleradar') {
        const imageData = await this.loadRadarImage(mapName, style);
        
        if (!imageData) {
            return null;
        }
        
        // Formato esperado pelo Gemini
        return {
            inlineData: {
                data: imageData.base64,
                mimeType: imageData.mimeType
            },
            metadata: {
                mapName: imageData.mapName,
                callouts: imageData.callouts,
                style: imageData.style
            }
        };
    }
    
    /**
     * Lista todos os mapas disponíveis
     */
    getAvailableMaps() {
        const availableMaps = {};
        
        Object.entries(this.radarPaths).forEach(([style, dirPath]) => {
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath);
                availableMaps[style] = files
                    .filter(f => f.match(/\.(png|jpg|jpeg|webp)$/i))
                    .map(f => f.replace(/_radar|\.png|\.jpg|\.jpeg|\.webp/gi, ''))
                    .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
            }
        });
        
        return availableMaps;
    }
    
    /**
     * Limpa o cache de imagens
     */
    clearCache() {
        this.imageCache.clear();
        console.log('[RadarManager] Image cache cleared');
    }
}

module.exports = RadarImageManager; 