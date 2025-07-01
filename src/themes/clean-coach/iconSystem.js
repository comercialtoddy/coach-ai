/**
 * CS2 Coach AI - Sistema de Ícones
 * Sistema completo para carregar e exibir ícones dinamicamente no HUB
 */

class IconSystem {
    constructor() {
        this.iconCache = new Map();
        this.basePath = './database'; // Corrigido: sem ../ para funcionar corretamente
        this.iconMappings = this.createIconMappings();
        this.pendingIcons = new Map(); // Para rastrear ícones sendo carregados
        this.init();
    }

    init() {
        console.log('[ICON SYSTEM] Inicializado com', Object.keys(this.iconMappings).length, 'mapeamentos');
    }

    /**
     * Mapeamento completo de situações/items para ícones
     */
    createIconMappings() {
        return {
            // === ARMAS ===
            // Rifles
            'ak47': 'weapons/ak47.svg',
            'ak-47': 'weapons/ak47.svg',
            'm4a4': 'weapons/m4a1.svg',
            'm4a1': 'weapons/m4a1.svg',
            'm4a1-s': 'weapons/m4a1_silencer.svg',
            'awp': 'weapons/awp.svg',
            'aug': 'weapons/aug.svg',
            'famas': 'weapons/famas.svg',
            'galil': 'weapons/galilar.svg',
            'sg556': 'weapons/sg556.svg',
            'ssg08': 'weapons/ssg08.svg',
            'g3sg1': 'weapons/g3sg1.svg',
            'scar20': 'weapons/scar20.svg',

            // Pistolas
            'glock': 'weapons/glock.svg',
            'usp': 'weapons/usp_silencer.svg',
            'usp-s': 'weapons/usp_silencer.svg',
            'p2000': 'weapons/p2000.svg',
            'deagle': 'weapons/deagle.svg',
            'desert eagle': 'weapons/deagle.svg',
            'p250': 'weapons/p250.svg',
            'tec9': 'weapons/tec9.svg',
            'tec-9': 'weapons/tec9.svg',
            'fiveseven': 'weapons/fiveseven.svg',
            'five-seven': 'weapons/fiveseven.svg',
            'cz75': 'weapons/cz75a.svg',
            'cz75a': 'weapons/cz75a.svg',
            'revolver': 'weapons/revolver.svg',
            'elite': 'weapons/elite.svg',
            'dual berettas': 'weapons/elite.svg',

            // SMGs
            'mp7': 'weapons/mp7.svg',
            'mp9': 'weapons/mp9.svg',
            'mp5': 'weapons/mp5sd.svg',
            'mp5sd': 'weapons/mp5sd.svg',
            'ump45': 'weapons/ump45.svg',
            'ump': 'weapons/ump45.svg',
            'p90': 'weapons/p90.svg',
            'bizon': 'weapons/bizon.svg',
            'mac10': 'weapons/mac10.svg',
            'mac-10': 'weapons/mac10.svg',

            // Shotguns
            'nova': 'weapons/nova.svg',
            'xm1014': 'weapons/xm1014.svg',
            'mag7': 'weapons/mag7.svg',
            'mag-7': 'weapons/mag7.svg',
            'sawedoff': 'weapons/sawedoff.svg',
            'sawed-off': 'weapons/sawedoff.svg',

            // LMGs
            'm249': 'weapons/m249.svg',
            'negev': 'weapons/negev.svg',

            // Granadas
            'he': 'weapons/hegrenade.svg',
            'hegrenade': 'weapons/hegrenade.svg',
            'he grenade': 'weapons/hegrenade.svg',
            'flashbang': 'weapons/flashbang.svg',
            'flash': 'weapons/flashbang.svg',
            'smoke': 'weapons/smokegrenade.svg',
            'smokegrenade': 'weapons/smokegrenade.svg',
            'molotov': 'weapons/molotov.svg',
            'incgrenade': 'weapons/incgrenade.svg',
            'incendiary': 'weapons/incgrenade.svg',
            'decoy': 'weapons/decoy.svg',

            // Facas
            'knife': 'weapons/knife.svg',
            'bayonet': 'weapons/bayonet.svg',
            'karambit': 'weapons/knife_karambit.svg',
            'm9': 'weapons/knife_m9_bayonet.svg',
            'butterfly': 'weapons/knife_butterfly.svg',
            'flip': 'weapons/knife_flip.svg',
            'gut': 'weapons/knife_gut.svg',
            'bowie': 'weapons/knife_bowie.svg',

            // Equipamentos
            'c4': 'weapons/c4.svg',
            'bomb': 'weapons/c4.svg',
            'defuser': 'weapons/defuser.svg',
            'kit': 'weapons/defuser.svg',
            'armor': 'weapons/kevlar.svg',
            'kevlar': 'weapons/kevlar.svg',
            'helmet': 'weapons/helmet.svg',
            'taser': 'weapons/taser.svg',
            'zeus': 'weapons/taser.svg',

            // === ÍCONES DE INTERFACE ===
            'health': 'icons/health.svg',
            'armor-icon': 'icons/armor.svg',
            'helmet-icon': 'icons/armor-helmet.svg',
            'time': 'icons/time.svg',
            'timer': 'icons/time.svg',
            'pause': 'icons/pause.svg',
            'dead': 'icons/dead.svg',
            'elimination': 'icons/elimination.svg',
            'kill': 'icons/elimination.svg',
            'round-kills': 'icons/round-kills.svg',
            'kills': 'icons/round-kills.svg',

            // Bombsites
            'bombsite-a': 'icons/bombsite-a.svg',
            'site-a': 'icons/bombsite-a.svg',
            'a-site': 'icons/bombsite-a.svg',
            'bombsite-b': 'icons/bombsite-b.svg',
            'site-b': 'icons/bombsite-b.svg',
            'b-site': 'icons/bombsite-b.svg',
            'planted-bomb': 'icons/planted-bomb.svg',
            'planted': 'icons/planted-bomb.svg',
            'defuse': 'icons/defuse.svg',
            'defusing': 'icons/defuse.svg',

            // Radar
            'radar-dead': 'icons/radar-dead-player.svg',
            'dropped-bomb': 'icons/radar/dropped-bomb.svg'
        };
    }

    /**
     * Carrega um ícone SVG - VERSÃO ROBUSTA COM MÚLTIPLOS CAMINHOS
     */
    async loadIcon(iconKey) {
        // Verificar cache primeiro
        if (this.iconCache.has(iconKey)) {
            console.log(`[ICON] Carregado do cache: ${iconKey}`);
            return this.iconCache.get(iconKey);
        }

        const iconPath = this.iconMappings[iconKey.toLowerCase()];
        if (!iconPath) {
            console.warn(`[ICON] Ícone não encontrado no mapeamento: ${iconKey}`);
            return null;
        }

        // Tentar múltiplos caminhos possíveis
        const pathsToTry = [
            `./database/${iconPath}`,
            `../database/${iconPath}`,
            `../../database/${iconPath}`,
            `database/${iconPath}`,
            iconPath // caminho direto
        ];

        console.log(`[ICON] Tentando carregar ${iconKey} com caminhos:`, pathsToTry);

        for (const fullPath of pathsToTry) {
            try {
                console.log(`[ICON] Tentando: ${fullPath}`);
                const response = await fetch(fullPath);
                
                if (response.ok) {
                    const svgContent = await response.text();
                    
                    // Cache do ícone
                    this.iconCache.set(iconKey, svgContent);
                    
                    console.log(`[ICON] ✅ Carregado com sucesso: ${iconKey} de ${fullPath}`);
                    return svgContent;
                }
                
                console.log(`[ICON] ❌ Falhou (${response.status}): ${fullPath}`);
                
            } catch (error) {
                console.log(`[ICON] ❌ Erro em ${fullPath}:`, error.message);
            }
        }
        
        console.error(`[ICON] ❌ Falha total ao carregar ${iconKey} - todos os caminhos falharam`);
        return null;
    }

    /**
     * Cria elemento HTML do ícone
     */
    createIconElement(iconKey, options = {}) {
        const {
            size = '16px',
            className = 'inline-icon',
            style = {}
        } = options;

        return this.loadIcon(iconKey).then(svgContent => {
            if (!svgContent) return null;

            const iconDiv = document.createElement('span');
            iconDiv.className = `icon-container ${className}`;
            iconDiv.innerHTML = svgContent;
            
            // Aplicar estilos
            Object.assign(iconDiv.style, {
                display: 'inline-flex',
                alignItems: 'center',
                width: size,
                height: size,
                verticalAlign: 'middle',
                ...style
            });

            // Aplicar tamanho ao SVG interno
            const svg = iconDiv.querySelector('svg');
            if (svg) {
                svg.style.width = '100%';
                svg.style.height = '100%';
            }

            return iconDiv;
        });
    }

    /**
     * Processa texto e substitui palavras-chave por ícones - VERSÃO GARANTIDA SEM COLCHETES
     */
    async processTextWithIcons(text) {
        if (!text) return text;

        console.log('[ICON] Processando texto:', text);
        
        let processedText = text;
        
        // Regex para encontrar padrões de ícones: {icon:nome}
        const iconPattern = /\{icon:([^}]+)\}/gi;
        let match;
        
        // Usar while loop para garantir que TODOS os padrões sejam processados
        while ((match = iconPattern.exec(text)) !== null) {
            const [fullMatch, iconKey] = match;
            console.log('[ICON] Processando:', fullMatch, '->', iconKey);
            
            try {
                const svgContent = await this.loadIcon(iconKey);
                
                if (svgContent) {
                    // Criar HTML do ícone diretamente
                    const iconHtml = `<span class="icon-container inline-icon" style="display: inline-flex; align-items: center; width: 18px; height: 18px; margin: 0 3px; vertical-align: middle;">${svgContent}</span>`;
                    
                    // Substituir TODAS as ocorrências do padrão
                    processedText = processedText.replaceAll(fullMatch, iconHtml);
                    console.log('[ICON] ✅ Substituído com sucesso:', iconKey);
                } else {
                    console.warn('[ICON] ❌ Não foi possível carregar:', iconKey);
                    // IMPORTANTE: Remover TODAS as ocorrências do padrão mesmo se não carregou
                    processedText = processedText.replaceAll(fullMatch, `<span style="color: #ff6666; font-size: 12px;">[${iconKey}?]</span>`);
                }
            } catch (error) {
                console.error('[ICON] ❌ Erro ao processar', iconKey, ':', error);
                // IMPORTANTE: Remover TODAS as ocorrências do padrão em caso de erro
                processedText = processedText.replaceAll(fullMatch, `<span style="color: #ff6666; font-size: 12px;">[${iconKey}!]</span>`);
            }
            
            // Reset regex para próxima iteração
            iconPattern.lastIndex = 0;
        }

        // SEGUNDA PASSADA: Garantir que nenhum padrão {icon:*} sobrou
        const remainingPatterns = /\{icon:[^}]+\}/gi;
        if (remainingPatterns.test(processedText)) {
            console.warn('[ICON] ⚠️ Padrões restantes encontrados, limpando...');
            processedText = processedText.replace(/\{icon:([^}]+)\}/gi, '<span style="color: #ff6666; font-size: 12px;">[$1×]</span>');
        }

        console.log('[ICON] ✅ Texto final processado (sem colchetes):', processedText);
        return processedText;
    }

    /**
     * Substitui placeholders por elementos de ícone reais
     */
    replaceIconPlaceholders(element) {
        if (!this.tempIconElements) return;

        for (const [placeholder, iconElement] of this.tempIconElements) {
            const textNode = this.findTextNode(element, placeholder);
            if (textNode) {
                const parent = textNode.parentNode;
                parent.insertBefore(iconElement, textNode);
                textNode.textContent = textNode.textContent.replace(placeholder, '');
                
                if (textNode.textContent.trim() === '') {
                    parent.removeChild(textNode);
                }
            }
        }

        // Limpar cache temporário
        this.tempIconElements.clear();
    }

    /**
     * Encontra nó de texto contendo placeholder
     */
    findTextNode(element, text) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.includes(text)) {
                return node;
            }
        }
        return null;
    }

    /**
     * Auto-detecta itens do jogo no texto e adiciona ícones
     */
    async autoAddIcons(text) {
        if (!text) return text;

        let enhancedText = text;
        
        // Ordenar chaves por comprimento (mais específicas primeiro)
        const sortedKeys = Object.keys(this.iconMappings)
            .sort((a, b) => b.length - a.length);

        for (const key of sortedKeys) {
            // Criar regex para palavras completas (evitar substituições parciais)
            const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            
            if (regex.test(enhancedText)) {
                enhancedText = enhancedText.replace(regex, (match) => {
                    return `{icon:${key}} ${match}`;
                });
            }
        }

        return enhancedText;
    }

    /**
     * FUNÇÃO DE LIMPEZA FINAL - Remove TODOS os padrões {icon:*} restantes
     */
    cleanAllIconPatterns(text) {
        if (!text) return text;
        
        // Remover TODOS os padrões {icon:*} que possam ter sobrado
        const cleanedText = text.replace(/\{icon:[^}]*\}/gi, '');
        
        if (text !== cleanedText) {
            console.warn('[ICON] 🧹 Limpeza final: removidos padrões restantes');
            console.log('[ICON] Antes:', text);
            console.log('[ICON] Depois:', cleanedText);
        }
        
        return cleanedText;
    }

    /**
     * Lista todos os ícones disponíveis
     */
    getAvailableIcons() {
        return Object.keys(this.iconMappings);
    }

    /**
     * Busca ícones por categoria
     */
    getIconsByCategory(category) {
        const categories = {
            weapons: Object.keys(this.iconMappings).filter(key => 
                this.iconMappings[key].startsWith('weapons/')
            ),
            interface: Object.keys(this.iconMappings).filter(key => 
                this.iconMappings[key].startsWith('icons/')
            ),
            radar: Object.keys(this.iconMappings).filter(key => 
                this.iconMappings[key].startsWith('icons/radar/')
            )
        };
        
        return categories[category] || [];
    }

    /**
     * PROCESSAMENTO SUPER ROBUSTO - GARANTE REMOÇÃO TOTAL DOS COLCHETES
     */
    async processTextSuperRobust(text) {
        if (!text) return text;

        console.log('[ICON ROBUST] 🚀 Iniciando processamento super robusto:', text);
        
        let processedText = text;
        let attempts = 0;
        const maxAttempts = 10;
        
        // Loop até que não haja mais padrões {icon:*}
        while (/{icon:[^}]*}/gi.test(processedText) && attempts < maxAttempts) {
            attempts++;
            console.log(`[ICON ROBUST] 🔄 Tentativa ${attempts}/${maxAttempts}`);
            
            // Encontrar TODOS os padrões
            const patterns = processedText.match(/{icon:[^}]*}/gi) || [];
            console.log('[ICON ROBUST] 📋 Padrões encontrados:', patterns);
            
            for (const pattern of patterns) {
                const iconKey = pattern.replace(/{icon:([^}]+)}/, '$1');
                console.log(`[ICON ROBUST] 🔧 Processando: ${pattern} -> ${iconKey}`);
                
                try {
                    const svgContent = await this.loadIcon(iconKey);
                    
                    if (svgContent) {
                        // Criar HTML do ícone
                        const iconHtml = `<span class="icon-container inline-icon" style="display: inline-flex; align-items: center; width: 18px; height: 18px; margin: 0 3px; vertical-align: middle;">${svgContent}</span>`;
                        
                        // Substituir TODAS as ocorrências específicas
                        const beforeCount = (processedText.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                        processedText = processedText.replaceAll(pattern, iconHtml);
                        const afterCount = (processedText.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
                        
                        console.log(`[ICON ROBUST] ✅ ${iconKey}: ${beforeCount} → ${afterCount} (${beforeCount - afterCount} substituições)`);
                    } else {
                        // Substituir por indicador de erro mas SEM colchetes
                        const errorIndicator = `<span style="color: #ff9999; font-size: 11px; text-decoration: line-through;">${iconKey}</span>`;
                        processedText = processedText.replaceAll(pattern, errorIndicator);
                        console.log(`[ICON ROBUST] ❌ ${iconKey}: não carregado, substituído por indicador`);
                    }
                } catch (error) {
                    // Em caso de erro, substituir por indicador mas SEM colchetes
                    const errorIndicator = `<span style="color: #ff6666; font-size: 11px; opacity: 0.7;">${iconKey}</span>`;
                    processedText = processedText.replaceAll(pattern, errorIndicator);
                    console.log(`[ICON ROBUST] 💥 ${iconKey}: erro (${error.message}), substituído por indicador`);
                }
            }
        }
        
        // VERIFICAÇÃO FINAL: Se ainda restaram padrões, FORÇAR remoção
        if (/{icon:[^}]*}/gi.test(processedText)) {
            console.warn('[ICON ROBUST] ⚠️ FORÇANDO remoção de padrões restantes...');
            const before = processedText;
            processedText = processedText.replace(/{icon:([^}]*)}/gi, '<span style="color: #ff3333; font-size: 10px;">⚠$1</span>');
            console.log('[ICON ROBUST] 🧹 Antes da limpeza forçada:', before);
            console.log('[ICON ROBUST] 🧹 Depois da limpeza forçada:', processedText);
        }
        
        console.log(`[ICON ROBUST] ✅ CONCLUÍDO em ${attempts} tentativas:`);
        console.log('[ICON ROBUST] 📥 Entrada:', text);
        console.log('[ICON ROBUST] 📤 Saída:', processedText);
        
        return processedText;
    }
}

// Instância global
window.IconSystem = new IconSystem();

// Export para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IconSystem;
} 