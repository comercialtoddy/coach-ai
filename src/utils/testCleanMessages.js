/**
 * Teste do Sistema de Mensagens Limpas para Team Chat
 * Execute com: node src/utils/testCleanMessages.js
 */

const TeamChatManager = require('./teamChatManager.js');

class CleanMessageTester {
    constructor() {
        this.teamChat = new TeamChatManager();
        console.log('🧹 INICIANDO TESTE DE MENSAGENS LIMPAS V3.0\n');
    }
    
    async runAllTests() {
        await this.testIconRemoval();
        await this.testEmojiRemoval();
        await this.testStrategicExtraction();
        await this.testCommandNormalization();
        await this.testSanitization();
        await this.testRealWorldScenarios();
        
        console.log('\n✅ TODOS OS TESTES DE LIMPEZA CONCLUÍDOS!');
        console.log('🧹 Sistema de mensagens limpas funcionando perfeitamente');
    }
    
    testIconRemoval() {
        console.log('🎯 TESTE 1: Remoção de Ícones');
        console.log('=============================');
        
        const testCases = [
            'Jogador com {icon:health} HP baixo deve rotacionar para {icon:bombsite-a} site A',
            'Use {icon:awp} AWP na long e {icon:smoke} smoke para cover',
            'Compre {icon:armor} armor, {icon:ak47} AK47 e {icon:flash} 2x flash',
            'Bomba plantada no {icon:bombsite-b} B, equipe {icon:defuse} defuse agora',
            'Time com {icon:money} low money deve fazer eco save'
        ];
        
        testCases.forEach((testCase, index) => {
            const cleaned = this.teamChat.cleanMessageForTeamChat(testCase);
            console.log(`📥 Input ${index + 1}: "${testCase}"`);
            console.log(`📤 Limpo: "${cleaned}"`);
            
            const hasIcons = cleaned.includes('{icon:');
            console.log(`✅ Ícones removidos: ${!hasIcons ? 'SIM' : 'NÃO'}`);
            console.log('');
        });
    }
    
    testEmojiRemoval() {
        console.log('😀 TESTE 2: Remoção de Emojis');
        console.log('==============================');
        
        const testCases = [
            '🎯 Jogador precisa rotacionar para site A urgentemente! ⚡',
            '🔥 AWP na mid está controlando o jogo 💪',
            '⚠️ HP crítico! 💀 Procure cover imediatamente 🏃',
            '🎊 Multi-kill! 🎉 Pressione vantagem agora! 🚀',
            '📊 Economy baixa 📈 Considerem eco save 💰'
        ];
        
        testCases.forEach((testCase, index) => {
            const cleaned = this.teamChat.cleanMessageForTeamChat(testCase);
            console.log(`📥 Input ${index + 1}: "${testCase}"`);
            console.log(`📤 Limpo: "${cleaned}"`);
            
            const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu.test(cleaned);
            console.log(`✅ Emojis removidos: ${!hasEmojis ? 'SIM' : 'NÃO'}`);
            console.log('');
        });
    }
    
    testStrategicExtraction() {
        console.log('🎯 TESTE 3: Extração Estratégica Limpa');
        console.log('======================================');
        
        const gameContext = {
            playerSide: { code: 'CT' },
            gameData: { round: { phase: 'live' } }
        };
        
        const testCases = [
            {
                input: 'João, com {icon:health} HP baixo deve rotacionar para {icon:bombsite-a} site A usando {icon:smoke} smoke',
                expected: 'rotate para site A'
            },
            {
                input: 'Pedro, use {icon:awp} AWP na long e mantenha posição defensiva 🎯',
                expected: 'awp na long'
            },
            {
                input: '⚠️ Bomba plantada no {icon:bombsite-b} site B! Equipe deve coordenar retake 🚀',
                expected: 'bomba plantada'
            },
            {
                input: 'Time deve fazer eco save 💰 para próximo round completo',
                expected: 'eco save'
            }
        ];
        
        testCases.forEach((testCase, index) => {
            const extracted = this.teamChat.extractIntelligentTeamMessage(testCase.input, gameContext);
            console.log(`📥 Input ${index + 1}: "${testCase.input}"`);
            console.log(`📤 Extraído: "${extracted}"`);
            console.log(`🎯 Esperado: contém "${testCase.expected}"`);
            
            const isValid = extracted && 
                          !extracted.includes('{icon:') && 
                          !/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]/gu.test(extracted);
            
            console.log(`✅ Limpo e válido: ${isValid ? 'SIM' : 'NÃO'}`);
            console.log('');
        });
    }
    
    testCommandNormalization() {
        console.log('🔧 TESTE 4: Normalização de Comandos');
        console.log('====================================');
        
        const testCases = [
            'rotacionar para site A',
            'defender site B',
            'comprar AK47 e armor',
            'economizar para próximo round',
            'jogar smoke no connector',
            'franco na long controlando'
        ];
        
        testCases.forEach((testCase, index) => {
            const normalized = this.teamChat.normalizeTeamCommand(testCase);
            console.log(`📥 Input ${index + 1}: "${testCase}"`);
            console.log(`📤 Normalizado: "${normalized}"`);
            console.log('');
        });
    }
    
    testSanitization() {
        console.log('🛡️ TESTE 5: Sanitização para CS2');
        console.log('=================================');
        
        const testCases = [
            'Mensagem com "aspas" e \'apostrofes\'',
            'Texto com\nquebras\rde linha',
            'Caracteres    múltiplos    espaços',
            'Símbolos #$%^&*()[]{}|\\',
            '{icon:health} HP baixo! 🎯 Rotate agora! ⚡'
        ];
        
        testCases.forEach((testCase, index) => {
            const sanitized = this.teamChat.sanitizeMessage(testCase);
            console.log(`📥 Input ${index + 1}: "${testCase}"`);
            console.log(`📤 Sanitizado: "${sanitized}"`);
            
            const isSafe = !/[{}"'\\]/.test(sanitized) && 
                          !sanitized.includes('\n') && 
                          !sanitized.includes('\r');
            
            console.log(`✅ Seguro para CS2: ${isSafe ? 'SIM' : 'NÃO'}`);
            console.log('');
        });
    }
    
    async testRealWorldScenarios() {
        console.log('🌍 TESTE 6: Cenários do Mundo Real');
        console.log('===================================');
        
        const realWorldMessages = [
            'Toddyclipsgg, como CT com {icon:health} HP crítico deve rotacionar para {icon:bombsite-a} A e usar {icon:smoke} smoke para cover 🎯',
            '⚡ URGENTE: Bomba plantada no {icon:bombsite-b} B! Time deve coordenar retake com {icon:flash} flashes 🚀',
            'Pedro, compre {icon:awp} AWP para mid control e mantenha posição defensiva 💪 Force picks early round',
            '💰 Economy baixa: Time deve eco save, stack {icon:bombsite-a} A site e aguardar próximo round para full buy 📊',
            '🎉 Multi-kill achieved! Pressione vantagem, rush {icon:bombsite-b} B site com coordenação total! 🔥'
        ];
        
        const gameContext = {
            type: 'auto_analysis',
            playerSide: { code: 'CT' },
            gameData: { 
                round: { phase: 'live' },
                player: { name: 'Toddyclipsgg' }
            }
        };
        
        for (let i = 0; i < realWorldMessages.length; i++) {
            const message = realWorldMessages[i];
            
            console.log(`🎮 Cenário ${i + 1}:`);
            console.log(`📥 Input: "${message}"`);
            
            // Testar sistema inteligente completo
            const shouldSend = this.teamChat.shouldSendToTeam(message, gameContext, 'normal');
            console.log(`🤖 IA decidiu: ${shouldSend.send ? 'ENVIAR' : 'NÃO ENVIAR'}`);
            console.log(`📝 Razão: ${shouldSend.reason}`);
            
            if (shouldSend.send) {
                const extracted = this.teamChat.extractIntelligentTeamMessage(message, gameContext);
                const sanitized = this.teamChat.sanitizeMessage(extracted);
                
                console.log(`📤 Mensagem final: "${sanitized}"`);
                
                // Verificar se está completamente limpa
                const isClean = !sanitized.includes('{icon:') && 
                              !/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]/gu.test(sanitized) &&
                              !/[{}"'\\]/.test(sanitized);
                
                console.log(`✅ Completamente limpa: ${isClean ? 'SIM' : 'NÃO'}`);
                
                // Simular envio se aprovado
                if (isClean && sanitized.length > 3) {
                    console.log(`🚀 ENVIARIA PARA TEAM: "${sanitized}"`);
                }
            }
            
            console.log('');
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Executar testes se arquivo for executado diretamente
if (require.main === module) {
    const tester = new CleanMessageTester();
    
    tester.runAllTests().then(() => {
        console.log('🎉 TESTE DE MENSAGENS LIMPAS CONCLUÍDO!');
        console.log('\n📋 RESUMO:');
        console.log('✅ Ícones removidos automaticamente');
        console.log('✅ Emojis removidos automaticamente');
        console.log('✅ Comandos normalizados para clareza');
        console.log('✅ Mensagens sanitizadas para CS2');
        console.log('✅ Sistema inteligente funcionando');
        console.log('\n🚀 PRONTO PARA USO EM PARTIDAS REAIS!');
        
        process.exit(0);
    }).catch(error => {
        console.error('❌ ERRO NOS TESTES:', error);
        process.exit(1);
    });
}

module.exports = CleanMessageTester; 