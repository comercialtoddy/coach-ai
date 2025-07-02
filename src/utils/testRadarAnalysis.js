/**
 * CS2 Coach AI - Teste de Análise Visual de Radar
 * Demonstração do sistema de análise com imagens de mapas
 */

const GeminiClient = require('./geminiClient');
const RadarImageManager = require('./radarImageManager');

async function testRadarAnalysis() {
    console.log('=== CS2 Coach AI - Teste de Análise Visual de Radar ===\n');
    
    try {
        // Inicializar componentes
        const geminiClient = new GeminiClient();
        const radarManager = new RadarImageManager();
        
        // Listar mapas disponíveis
        console.log('📍 Mapas disponíveis para análise:');
        const availableMaps = radarManager.getAvailableMaps();
        console.log(JSON.stringify(availableMaps, null, 2));
        console.log('');
        
        // Simular dados de jogo para teste
        const testGameData = {
            map: 'de_mirage',
            round: {
                phase: 'live',
                clock_time: '1:30',
                bomb: 'carried'
            },
            player: {
                name: 'TestPlayer',
                team: 'T',
                state: {
                    health: 100,
                    armor: 100,
                    money: 4750,
                    equipment: {
                        ak47: true,
                        flashbang: 2,
                        smokegrenade: 1,
                        hegrenade: 1
                    }
                }
            },
            map: {
                name: 'de_mirage',
                round: 5,
                team_ct: { score: 2 },
                team_t: { score: 2 }
            }
        };
        
        // Teste 1: Análise de estratégia TR com radar
        console.log('🎯 Teste 1: Estratégia TR com análise visual\n');
        const trStrategy = await geminiClient.analyzeWithRadar(
            testGameData, 
            'tr_strategy', 
            true // Forçar uso de radar
        );
        console.log('Resposta:', trStrategy);
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Teste 2: Round start com análise visual
        console.log('🎯 Teste 2: Round Start com posicionamento\n');
        testGameData.round.phase = 'freezetime';
        const roundStart = await geminiClient.analyzeWithRadar(
            testGameData,
            'round_start',
            true
        );
        console.log('Resposta:', roundStart);
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Teste 3: Clutch situation
        console.log('🎯 Teste 3: Clutch 1v2 com análise de rotas\n');
        testGameData.round.phase = 'live';
        testGameData.player.state.health = 47;
        const clutch = await geminiClient.analyzeWithRadar(
            testGameData,
            'clutch_situation',
            true
        );
        console.log('Resposta:', clutch);
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Teste 4: Verificar detecção automática
        console.log('🎯 Teste 4: Detecção automática de necessidade visual\n');
        const shouldUseRadar1 = geminiClient.shouldIncludeRadar('tr_strategy', testGameData);
        const shouldUseRadar2 = geminiClient.shouldIncludeRadar('low_health', testGameData);
        const shouldUseRadar3 = geminiClient.shouldIncludeRadar('economy_shift', testGameData);
        
        console.log('TR Strategy deve usar radar?', shouldUseRadar1 ? 'SIM ✅' : 'NÃO ❌');
        console.log('Low Health deve usar radar?', shouldUseRadar2 ? 'SIM ✅' : 'NÃO ❌');
        console.log('Economy Shift deve usar radar?', shouldUseRadar3 ? 'SIM ✅' : 'NÃO ❌');
        
        console.log('\n✅ Teste concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante teste:', error.message);
        console.error(error.stack);
    }
}

// Executar teste se chamado diretamente
if (require.main === module) {
    testRadarAnalysis().then(() => {
        console.log('\n📊 Teste finalizado');
        process.exit(0);
    }).catch(err => {
        console.error('Erro fatal:', err);
        process.exit(1);
    });
}

module.exports = { testRadarAnalysis }; 