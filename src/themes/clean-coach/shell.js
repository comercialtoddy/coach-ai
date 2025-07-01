/**
 * CS2 Coach AI - Shell JavaScript
 * Overlay simplificado - APENAS EXIBIÇÃO de insights automáticos
 */

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
            
            if (window.IconSystem) {
                console.log('[DISPLAY] 🎯 Sistema de ícones disponível, processando...');
                
                // USAR PROCESSAMENTO SUPER ROBUSTO para garantir remoção total dos colchetes
                if (window.IconSystem.processTextSuperRobust) {
                    processedText = await window.IconSystem.processTextSuperRobust(response);
                    console.log('[DISPLAY] 🚀 Processamento SUPER ROBUSTO concluído');
                } else {
                    // Fallback para método padrão
                    console.log('[DISPLAY] ⚠️ Usando processamento padrão como fallback');
                    
                    // Auto-detectar itens do jogo e adicionar ícones
                    processedText = await window.IconSystem.autoAddIcons(response);
                    console.log('[DISPLAY] Auto-detecção completa:', processedText.substring(0, 50) + '...');
                    
                    // Processar ícones manuais {icon:nome}
                    processedText = await window.IconSystem.processTextWithIcons(processedText);
                    console.log('[DISPLAY] Processamento manual completo:', processedText.substring(0, 50) + '...');
                }
            } else {
                console.warn('[DISPLAY] ❌ Sistema de ícones não disponível!');
            }
            
            // LIMPEZA FINAL OBRIGATÓRIA: Garantir que NENHUM padrão {icon:*} sobrou
            if (window.IconSystem && window.IconSystem.cleanAllIconPatterns) {
                processedText = window.IconSystem.cleanAllIconPatterns(processedText);
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