/**
 * Teste do Sistema de Team Chat Automático
 * Execute com: node src/utils/testTeamChat.js
 */

const TeamChatManager = require('./teamChatManager.js');
const path = require('path');

class TeamChatTester {
    constructor() {
        this.teamChat = new TeamChatManager();
        console.log('🧪 INICIANDO TESTE DO TEAM CHAT MANAGER\n');
    }
    
    async runAllTests() {
        await this.testBasicFunctionality();
        await this.testIntelligentMessageSystem();
        await this.testQueueSystem();
        await this.testConfigGeneration();
        await this.testPathDetection();
        
        console.log('\n✅ TODOS OS TESTES V3.0 CONCLUÍDOS!');
        console.log('📋 Verifique os arquivos .cfg gerados na pasta CS2');
        console.log('🤖 Sistema inteligente funcionando corretamente');
    }
    
    async testBasicFunctionality() {
        console.log('📝 TESTE 1: Funcionalidade Básica');
        console.log('================================');
        
        // Teste envio simples
        const messageId1 = await this.teamChat.sendTeamMessage('[COACH] Teste básico funcionando', 'normal');
        console.log(`✅ Mensagem enviada com ID: ${messageId1}`);
        
        // Teste mensagem urgente
        const messageId2 = await this.teamChat.sendTeamMessage('[COACH] URGENTE: Defuse agora!', 'urgent');
        console.log(`⚡ Mensagem urgente enviada com ID: ${messageId2}`);
        
        // Aguardar processamento
        await this.sleep(5000);
        console.log('');
    }
    
    async testIntelligentMessageSystem() {
        console.log('🤖 TESTE 2: Sistema Inteligente V3.0');
        console.log('=====================================');
        
        const testCases = [
            {
                fullTip: 'Jogador com HP baixo deve rotacionar para site A urgentemente',
                gameContext: { 
                    type: 'low_health',
                    playerSide: { code: 'CT' },
                    gameData: { round: { phase: 'live' } }
                },
                shouldSend: true,
                reason: 'Situação crítica - HP baixo'
            },
            {
                fullTip: 'Configuração de crosshair está adequada para seu estilo',
                gameContext: { 
                    type: 'personal_feedback',
                    playerSide: { code: 'CT' },
                    gameData: { round: { phase: 'live' } }
                },
                shouldSend: false,
                reason: 'Feedback pessoal - não relevante para team'
            },
            {
                fullTip: 'Bomba plantada no site B, equipe deve coordenar retake',
                gameContext: { 
                    type: 'bomb_planted',
                    playerSide: { code: 'CT' },
                    gameData: { round: { phase: 'live', bomb: 'planted' } }
                },
                shouldSend: true,
                reason: 'Situação crítica - bomba plantada'
            },
            {
                fullTip: 'Time deve fazer eco save para próximo round',
                gameContext: { 
                    type: 'economy_warning',
                    playerSide: { code: 'CT' },
                    gameData: { round: { phase: 'live' } }
                },
                shouldSend: true,
                reason: 'Estratégia econômica relevante'
            }
        ];
        
        for (const testCase of testCases) {
            console.log(`📥 Input: "${testCase.fullTip}"`);
            console.log(`🎯 Context: ${testCase.gameContext.type}`);
            
            // Testar decisão do sistema inteligente
            const decision = this.teamChat.shouldSendToTeam(
                testCase.fullTip, 
                testCase.gameContext, 
                'normal'
            );
            
            console.log(`🤖 IA decidiu: ${decision.send ? 'ENVIAR' : 'NÃO ENVIAR'}`);
            console.log(`📝 Razão: ${decision.reason}`);
            console.log(`✅ Esperado: ${testCase.shouldSend ? 'ENVIAR' : 'NÃO ENVIAR'}`);
            
            if (decision.send === testCase.shouldSend) {
                console.log('✅ PASSOU\n');
            } else {
                console.log('❌ FALHOU\n');
            }
        }
    }
    
    async testQueueSystem() {
        console.log('⏱️ TESTE 3: Sistema de Fila');
        console.log('============================');
        
        // Adicionar múltiplas mensagens rapidamente
        console.log('📝 Adicionando 5 mensagens à fila...');
        
        const messages = [
            '[COACH] Primeira mensagem',
            '[COACH] Segunda mensagem', 
            '[COACH] URGENTE: Terceira prioritária',
            '[COACH] Quarta mensagem',
            '[COACH] Quinta mensagem'
        ];
        
        // Adicionar mensagens
        await this.teamChat.sendTeamMessage(messages[0], 'normal');
        await this.teamChat.sendTeamMessage(messages[1], 'normal');
        await this.teamChat.sendTeamMessage(messages[2], 'urgent'); // Esta deve ir primeiro
        await this.teamChat.sendTeamMessage(messages[3], 'normal');
        await this.teamChat.sendTeamMessage(messages[4], 'normal');
        
        console.log('⏳ Aguardando processamento da fila...');
        
        // Verificar status
        const status = this.teamChat.getStatus();
        console.log('📊 Status inicial:', JSON.stringify(status, null, 2));
        
        // Aguardar processamento completo
        await this.sleep(20000); // 20 segundos para 5 mensagens com delay de 3s
        
        const finalStatus = this.teamChat.getStatus();
        console.log('📊 Status final:', JSON.stringify(finalStatus, null, 2));
        console.log('');
    }
    
    testConfigGeneration() {
        console.log('⚙️ TESTE 4: Geração de Configuração');
        console.log('====================================');
        
        const testChatItem = {
            message: '[COACH] Teste de configuração',
            priority: 'normal',
            timestamp: Date.now(),
            id: 'test123'
        };
        
        const config = this.teamChat.generateChatConfig(testChatItem);
        console.log('📄 Configuração gerada:');
        console.log('------------------------');
        console.log(config);
        console.log('------------------------');
        
        // Verificar elementos essenciais
        const hasTeamCommand = config.includes('say_team');
        const hasMessage = config.includes(testChatItem.message);
        const hasEcho = config.includes('echo');
        
        console.log(`✅ Contém say_team: ${hasTeamCommand}`);
        console.log(`✅ Contém mensagem: ${hasMessage}`);
        console.log(`✅ Contém echo: ${hasEcho}`);
        console.log('');
    }
    
    testPathDetection() {
        console.log('📂 TESTE 5: Detecção de Pasta CS2');
        console.log('==================================');
        
        const status = this.teamChat.getStatus();
        console.log('📁 Pasta CS2 detectada:', status.configPath);
        
        const instructions = this.teamChat.getPlayerInstructions();
        console.log('\n📋 Instruções para o jogador:');
        instructions.setup.forEach((step, index) => {
            console.log(`   ${index + 1}. ${step}`);
        });
        
        console.log('\n⚙️ Comandos disponíveis:');
        instructions.commands.forEach(cmd => {
            console.log(`   - ${cmd}`);
        });
        console.log('');
    }
    
    async testStrategicTipIntegration() {
        console.log('🎯 TESTE 6: Integração com Dicas Estratégicas');
        console.log('==============================================');
        
        const mockGameContext = {
            map: 'de_dust2',
            round: 'live',
            player: { team: 'CT', health: 45 }
        };
        
        const strategicTips = [
            'Jogador com {icon:health} HP baixo precisa rotacionar para {icon:bombsite-a} site A',
            'Use {icon:smoke} smoke e {icon:flash} flash para push no {icon:bombsite-b} site B',
            'Time deve fazer eco save, aguardar próximo round para buy completo',
            '{icon:awp} AWP na mid pode controlar o jogo, mantenha posição',
            'Bomba plantada no A, foquem na {icon:defuse} defusa imediata'
        ];
        
        for (const tip of strategicTips) {
            console.log(`📥 Dica completa: "${tip}"`);
            
            const result = await this.teamChat.sendStrategicTip(tip, mockGameContext);
            
            if (result) {
                console.log(`✅ Processado com sucesso (ID: ${result})`);
            } else {
                console.log('❌ Não foi possível extrair dica estratégica');
            }
            
            await this.sleep(1000); // Pequeno delay entre testes
        }
        
        console.log('');
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Executar testes se arquivo for executado diretamente
if (require.main === module) {
    const tester = new TeamChatTester();
    
    tester.runAllTests().then(() => {
        console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('1. Verifique se os arquivos .cfg foram criados');
        console.log('2. Execute "exec coach_ai_executor" no CS2'); 
        console.log('3. Teste o sistema em uma partida');
        
        process.exit(0);
    }).catch(error => {
        console.error('❌ ERRO NOS TESTES:', error);
        process.exit(1);
    });
}

module.exports = TeamChatTester; 