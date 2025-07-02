/**
 * Teste simples de carregamento de radar
 */

const RadarImageManager = require('./radarImageManager');

async function testRadarLoad() {
    const radarManager = new RadarImageManager();
    
    console.log('=== Teste de Carregamento de Radar ===\n');
    
    // Testar alguns mapas
    const testMaps = ['de_dust2', 'de_mirage', 'de_inferno'];
    const testStyles = ['simpleradar', 'ingame'];
    
    for (const map of testMaps) {
        console.log(`\nTestando mapa: ${map}`);
        
        for (const style of testStyles) {
            const radar = await radarManager.loadRadarImage(map, style);
            
            if (radar) {
                console.log(`✅ ${style}: Carregado com sucesso`);
                console.log(`   - Arquivo: ${radar.path}`);
                console.log(`   - Tamanho: ${(radar.size / 1024).toFixed(2)} KB`);
                console.log(`   - MIME: ${radar.mimeType}`);
            } else {
                console.log(`❌ ${style}: Falha ao carregar`);
            }
        }
    }
    
    // Testar preparação para Gemini
    console.log('\n\n=== Teste de Preparação para Gemini ===\n');
    const geminiData = await radarManager.prepareImageForGemini('de_mirage', 'simpleradar');
    
    if (geminiData) {
        console.log('✅ Dados preparados com sucesso');
        console.log(`   - Map: ${geminiData.metadata.mapName}`);
        console.log(`   - Style: ${geminiData.metadata.style}`);
        console.log(`   - Base64 length: ${geminiData.inlineData.data.length}`);
        console.log(`   - Callouts disponíveis:`, Object.keys(geminiData.metadata.callouts));
    }
}

testRadarLoad().catch(console.error); 