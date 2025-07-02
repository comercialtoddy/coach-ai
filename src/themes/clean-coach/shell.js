/**
 * CS2 Coach AI - Shell JavaScript
 * Overlay simplificado - APENAS EXIBIÇÃO de insights automáticos
 */

// Importar sistema de ícones
let IconSystem = null;
if (typeof window !== 'undefined') {
    // Aguardar carregamento do IconSystem
    document.addEventListener('DOMContentLoaded', () => {
        if (window.IconSystem) {
            IconSystem = window.IconSystem;
            console.log('[SHELL] IconSystem carregado com sucesso');
        }
    });
}

class CoachAI {
    constructor() {
        this.elements = {
            coachResponse: document.getElementById('coach-response'),
            coachStatus: document.getElementById('coach-status')
        };
        
        this.gameData = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeAutoAnalyzer();
        console.log('[INIT] Coach AI Display initialized - Auto insights only');
        console.log('[OVERLAY] Ready for automated CS2 coaching insights');
        console.log('[ANALYZER] Auto analyzer ready for proactive insights');
        
        // Debug info adicional
        if (window.debugUtils) {
            window.debugUtils.log('Coach AI Display instance created', 'success');
        }
    }
    
    async initializeAutoAnalyzer() {
        // AutoAnalyzer real está no main process - apenas configurar receptor
        this.setupAutoInsightListener();
        console.log('[LISTENER] Auto Analyzer listener configurado');
    }
    
    setupEventListeners() {
        // Prevenir context menu
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Manter status ativo
        this.elements.coachStatus.style.background = 'var(--active-primary)';
    }
    
    async displayResponse(response, type = 'normal') {
        const responseElement = this.elements.coachResponse;
        
        // Adicionar animação
        responseElement.classList.add('fade-in');
        
        try {
            console.log('[DISPLAY] Iniciando processamento de ícones para:', response.substring(0, 50) + '...');
            
            // Processar texto com sistema de ícones
            let processedText = response;
            
            if (IconSystem && IconSystem.processText) {
                console.log('[DISPLAY] 🎯 Sistema de ícones disponível, processando...');
                
                // USAR PROCESSAMENTO SUPER ROBUSTO para garantir remoção total dos colchetes
                if (IconSystem.processTextSuperRobust) {
                    processedText = await IconSystem.processTextSuperRobust(response);
                    console.log('[DISPLAY] 🚀 Processamento SUPER ROBUSTO concluído');
                } else {
                    // Fallback para método padrão
                    console.log('[DISPLAY] ⚠️ Usando processamento padrão como fallback');
                    
                    // Auto-detectar itens do jogo e adicionar ícones
                    processedText = await IconSystem.autoAddIcons(response);
                    console.log('[DISPLAY] Auto-detecção completa:', processedText.substring(0, 50) + '...');
                    
                    // Processar ícones manuais {icon:nome}
                    processedText = await IconSystem.processTextWithIcons(processedText);
                    console.log('[DISPLAY] Processamento manual completo:', processedText.substring(0, 50) + '...');
                }
            } else {
                console.warn('[DISPLAY] ❌ Sistema de ícones não disponível!');
            }
            
            // LIMPEZA FINAL OBRIGATÓRIA: Garantir que NENHUM padrão {icon:*} sobrou
            if (IconSystem && IconSystem.cleanAllIconPatterns) {
                processedText = IconSystem.cleanAllIconPatterns(processedText);
                console.log('[DISPLAY] 🧹 Limpeza final aplicada');
            } else {
                // LIMPEZA DE EMERGÊNCIA: Se IconSystem não estiver disponível
                console.warn('[DISPLAY] ⚠️ IconSystem não disponível, aplicando limpeza de emergência');
                processedText = processedText.replace(/\{icon:[^}]*\}/gi, '');
                console.log('[DISPLAY] 🚨 Limpeza de emergência aplicada');
            }
            
            // Definir conteúdo baseado no tipo - AGORA COM HTML DIRETO
            if (type === 'error') {
                responseElement.innerHTML = `<span style="color: var(--error);">${processedText}</span>`;
            } else if (type === 'success') {
                responseElement.innerHTML = `<span style="color: var(--success);">${processedText}</span>`;
            } else {
                responseElement.innerHTML = processedText; // Mudado de textContent para innerHTML
            }
            
            console.log('[DISPLAY] ✅ Conteúdo definido (SEM COLCHETES):', processedText.substring(0, 100));
            
        } catch (error) {
            console.error('[DISPLAY] Erro ao processar ícones:', error);
            // Fallback para texto simples
            if (type === 'error') {
                responseElement.innerHTML = `<span style="color: var(--error);">${response}</span>`;
            } else if (type === 'success') {
                responseElement.innerHTML = `<span style="color: var(--success);">${response}</span>`;
            } else {
                responseElement.textContent = response;
            }
        }
        
        // Scroll para o final
        responseElement.scrollTop = responseElement.scrollHeight;
        
        // Remover animação após completar
        setTimeout(() => {
            responseElement.classList.remove('fade-in');
        }, 250);
        
        console.log('[DISPLAY] Response shown with icons:', response.substring(0, 50) + '...');
    }
    
    updateGameData(data) {
        this.gameData = data;
        
        // Verificar se dados do player estão chegando
        if (!data.player) {
            console.log('[WARNING] Player data missing - verifique GSI config');
        }
        
        console.log('[DATA] Game data received for AI context:', {
            player: data.player?.name || 'MISSING',
            team: data.player?.team || 'MISSING',
            round: data.round?.phase,
            map: data.map?.name,
            hasPlayer: !!data.player
        });
        
        // Debug detalhado
        if (window.debugUtils) {
            window.debugUtils.log(`Game data updated: ${JSON.stringify(data, null, 2)}`, 'info');
        }
        
        // AutoAnalyzer real está rodando no main process - insights virão via IPC
    }
    
    setupAutoInsightListener() {
        // Configurar receptor de insights do AutoAnalyzer (main process)
        if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
            const { ipcRenderer } = require('electron');
            
            ipcRenderer.on('auto-insight', (event, data) => {
                console.log('[GEMINI INSIGHT RECEIVED]:', data.insight);
                this.displayResponse(data.insight, 'success');
            });
            
            // Listener para respostas manuais (caso ainda venham)
            ipcRenderer.on('coach-response', (event, response) => {
                if (response.success) {
                    this.displayResponse(response.message, 'success');
                } else {
                    this.displayResponse(response.message || 'AI Coach error', 'error');
                }
            });
            
            console.log('🔗 Auto insight listener configurado via IPC');
        }
    }
    
    destroy() {
        // AutoAnalyzer cleanup é feito no main process
        console.log('[SHUTDOWN] Coach AI Display destroyed');
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.CoachAI = new CoachAI();
});

// Cleanup ao fechar
window.addEventListener('beforeunload', () => {
    if (window.CoachAI) {
        window.CoachAI.destroy();
    }
});

// Sistema de controle do indicador visual do Gemini
class GeminiAnalysisIndicator {
    constructor() {
        this.indicator = null;
        this.isVisible = false;
        this.currentState = 'idle';
        this.init();
    }
    
    init() {
        // Aguardar DOM estar pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupIndicator());
        } else {
            this.setupIndicator();
        }
    }
    
    setupIndicator() {
        this.indicator = document.getElementById('gemini-analysis-indicator');
        if (!this.indicator) {
            console.warn('[INDICATOR] Elemento gemini-analysis-indicator não encontrado');
            return;
        }
        
        console.log('[INDICATOR] Indicador visual inicializado');
        
        // Adicionar event listeners
        this.indicator.addEventListener('animationend', (e) => {
            if (e.animationName === 'progressFlow' && this.currentState === 'completing') {
                this.hide();
            }
        });
    }
    
    show(options = {}) {
        if (!this.indicator) return;
        
        const {
            type = 'visual',
            title = 'GEMINI ANALYZING',
            subtitle = 'Visual Radar Analysis',
            state = 'analyzing'
        } = options;
        
        // Atualizar conteúdo
        this.updateContent(title, subtitle);
        
        // Atualizar estado visual
        this.setState(state);
        
        // Mostrar indicador
        this.indicator.classList.remove('hidden');
        setTimeout(() => {
            this.indicator.classList.add('visible');
            this.isVisible = true;
        }, 50);
        
        // Adicionar efeito no container principal
        const coachContainer = document.querySelector('.ai-coach-container');
        if (coachContainer) {
            coachContainer.classList.add('analyzing');
        }
        
        console.log(`[INDICATOR] Mostrando análise: ${type} - ${title}`);
    }
    
    hide() {
        if (!this.indicator || !this.isVisible) return;
        
        this.indicator.classList.remove('visible');
        this.indicator.classList.add('hidden');
        this.isVisible = false;
        
        // Remover efeito do container principal
        const coachContainer = document.querySelector('.ai-coach-container');
        if (coachContainer) {
            coachContainer.classList.remove('analyzing');
        }
        
        // Reset estado após animação
        setTimeout(() => {
            this.setState('idle');
        }, 400);
        
        console.log('[INDICATOR] Ocultando indicador');
    }
    
    updateContent(title, subtitle) {
        if (!this.indicator) return;
        
        const titleElement = this.indicator.querySelector('.analysis-title');
        const subtitleElement = this.indicator.querySelector('.analysis-subtitle');
        
        if (titleElement) titleElement.textContent = title;
        if (subtitleElement) subtitleElement.textContent = subtitle;
    }
    
    setState(state) {
        if (!this.indicator) return;
        
        // Remover estados anteriores
        this.indicator.classList.remove('analyzing', 'processing', 'error', 'completing');
        
        // Adicionar novo estado
        this.indicator.classList.add(state);
        this.currentState = state;
        
        // Atualizar conteúdo baseado no estado
        switch (state) {
            case 'analyzing':
                this.updateContent('GEMINI ANALYZING', 'Visual Radar Analysis');
                break;
            case 'processing':
                this.updateContent('PROCESSING', 'Generating Strategy');
                break;
            case 'error':
                this.updateContent('ANALYSIS ERROR', 'Retrying...');
                break;
            case 'completing':
                this.updateContent('ANALYSIS COMPLETE', 'Preparing Response');
                break;
        }
    }
    
    // Métodos específicos para diferentes tipos de análise
    showVisualAnalysis(mapName = '') {
        this.show({
            type: 'visual',
            title: 'GEMINI ANALYZING',
            subtitle: mapName ? `Visual Analysis: ${mapName}` : 'Visual Radar Analysis',
            state: 'analyzing'
        });
    }
    
    showTextAnalysis() {
        this.show({
            type: 'text',
            title: 'GEMINI THINKING',
            subtitle: 'Tactical Analysis',
            state: 'processing'
        });
    }
    
    showError(errorMessage = '') {
        this.show({
            type: 'error',
            title: 'ANALYSIS ERROR',
            subtitle: errorMessage || 'Retrying analysis...',
            state: 'error'
        });
        
        // Auto-hide após 3 segundos
        setTimeout(() => {
            if (this.currentState === 'error') {
                this.hide();
            }
        }, 3000);
    }
    
    complete() {
        if (this.isVisible) {
            this.setState('completing');
            // Hide após breve delay
            setTimeout(() => this.hide(), 800);
        }
    }
}

// Instância global do indicador
const geminiIndicator = new GeminiAnalysisIndicator();

// Sistema principal do Coach AI
window.CoachAI = {
    // ... existing code ...
    
    currentGameData: null,
    lastResponseTime: 0,
    
    // Função principal para exibir resposta
    displayResponse(response, type = 'info') {
        console.log('[SHELL] Exibindo resposta:', response);
        
        // Completar indicador se estiver visível
        if (geminiIndicator.isVisible) {
            geminiIndicator.complete();
        }
        
        // Verificar se response é válido
        if (!response || typeof response !== 'string') {
            console.warn('[SHELL] Resposta inválida recebida:', response);
            return;
        }
        
        // Processar resposta com sistema de ícones
        let processedResponse = response;
        
        if (IconSystem && IconSystem.processText) {
            console.log('[SHELL] Processando ícones na resposta...');
            
            try {
                // Usar o sistema super robusto implementado
                processedResponse = IconSystem.processTextSuperRobust(response);
                
                // Limpeza final de segurança
                processedResponse = IconSystem.cleanAllIconPatterns(processedResponse);
                
                console.log('[SHELL] Resposta após processamento de ícones:', processedResponse);
                
                // Verificar se ainda há padrões não processados
                const remainingPatterns = (processedResponse.match(/\{icon:[^}]+\}/g) || []).length;
                if (remainingPatterns > 0) {
                    console.warn(`[SHELL] ${remainingPatterns} padrões de ícone não processados encontrados`);
                }
            } catch (error) {
                console.error('[SHELL] Erro ao processar ícones:', error);
                // Usar resposta original em caso de erro
                processedResponse = response;
            }
        } else {
            console.warn('[SHELL] IconSystem não disponível');
        }
        
        // Atualizar elemento de resposta
        const responseElement = document.getElementById('coach-response');
        if (responseElement) {
            responseElement.innerHTML = processedResponse;
            responseElement.className = `coach-response ${type}`;
            
            // Animação de entrada
            responseElement.style.opacity = '0';
            responseElement.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                responseElement.style.opacity = '1';
                responseElement.style.transform = 'translateY(0)';
                responseElement.style.transition = 'all 0.3s ease';
            }, 100);
            
            this.lastResponseTime = Date.now();
            console.log('[SHELL] Resposta exibida com sucesso');
        } else {
            console.error('[SHELL] Elemento coach-response não encontrado');
        }
        
        // Atualizar status
        this.updateStatus('active');
    },
    
    // Indicar início de análise visual
    startVisualAnalysis(mapName = '') {
        console.log(`[SHELL] Iniciando análise visual${mapName ? ` para ${mapName}` : ''}`);
        geminiIndicator.showVisualAnalysis(mapName);
    },
    
    // Indicar início de análise de texto
    startTextAnalysis() {
        console.log('[SHELL] Iniciando análise de texto');
        geminiIndicator.showTextAnalysis();
    },
    
    // Indicar erro na análise
    showAnalysisError(error = '') {
        console.log('[SHELL] Erro na análise:', error);
        geminiIndicator.showError(error);
    },
    
    // Atualizar dados do jogo
    updateGameData(data) {
        this.currentGameData = data;
        console.log('[SHELL] Dados do jogo atualizados');
        
        // Determinar se próxima análise será visual
        if (data && data.map) {
            const mapName = typeof data.map === 'string' ? data.map : data.map.name;
            if (mapName) {
                // Pre-indicar que análise visual pode acontecer
                console.log(`[SHELL] Mapa detectado: ${mapName} - Análise visual disponível`);
            }
        }
    },
    
    // Atualizar status do coach
    updateStatus(status) {
        const statusElement = document.getElementById('coach-status');
        if (statusElement) {
            statusElement.className = `coach-status ${status}`;
            
            const statusText = {
                'inactive': '○',
                'active': '●',
                'analyzing': '◐',
                'error': '◌'
            };
            
            statusElement.textContent = statusText[status] || '○';
        }
    },
    
    // Método para teste do indicador
    testIndicator() {
        console.log('[TEST] Testando indicador visual...');
        
        // Teste 1: Análise visual
        geminiIndicator.showVisualAnalysis('de_mirage');
        
        setTimeout(() => {
            geminiIndicator.setState('processing');
        }, 2000);
        
        setTimeout(() => {
            geminiIndicator.complete();
        }, 4000);
        
        // Teste 2: Análise de texto (após 6 segundos)
        setTimeout(() => {
            geminiIndicator.showTextAnalysis();
            
            setTimeout(() => {
                geminiIndicator.complete();
            }, 2000);
        }, 6000);
        
        // Teste 3: Erro (após 10 segundos)
        setTimeout(() => {
            geminiIndicator.showError('Rate limit exceeded');
        }, 10000);
    }
};

// Expor indicador globalmente para testes
window.GeminiIndicator = geminiIndicator;

// Log de inicialização
console.log('[SHELL] Sistema carregado com indicador visual do Gemini');

// Auto-inicialização quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.CoachAI.updateStatus('inactive');
        console.log('[SHELL] Interface inicializada');
    });
} else {
    window.CoachAI.updateStatus('inactive');
    console.log('[SHELL] Interface inicializada');
} 