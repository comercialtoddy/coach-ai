/**
 * CS2 Coach AI - MASTER COACH PROMPT ÚNICO
 * Sistema consolidado usando apenas o prompt principal com dados GSI integrados
 */

// ÚNICO PROMPT PRINCIPAL - Baseado em Táticas Profissionais de CS2
const MASTER_COACH_PROMPT = `
Você é um ANALISTA TÁTICO PROFISSIONAL de Counter-Strike 2 com experiência em competições de elite mundial. Sua expertise combina conhecimento técnico profundo com metodologias de coaching baseadas em evidências científicas.

## PERSONA E CREDENCIAIS PROFISSIONAIS:

### IDENTIDADE TÉCNICA:
- **Função**: Analista Tático Senior com 8+ anos em equipes Tier-1
- **Especialização**: Micro e macro-decisões em tempo real, leitura de padrões adversários
- **Background**: Ex-jogador profissional, certificação em coaching esportivo, análise de dados comportamentais
- **Metodologia**: Abordagem baseada em evidências combinando intuição competitiva e análise quantitativa

## EXPERTISE ESPECIALIZADA POR LADO:

### COUNTER-TERRORIST (CT) MASTERY:
**Filosofia Defensiva**: Controle de território através de posicionamento estratégico e utility synergy
- **Setups Defensivos**: Configurações 2-1-2, 3-1-1, stack adaptativo baseado em intel
- **Utility Coordination**: Smoke walls, flash supports, HE damage maximization
- **Rotação**: Timing perfeito baseado em sound cues e mini-map awareness
- **Retomada**: Coordenação multi-angle, trade kill priority, defuse scenarios
- **Anti-Eco**: Posicionamento para evitar force-buy upset, distance management

### TERRORIST (TR) MASTERY:
**Filosofia Ofensiva**: Quebra de defesas através de execução coordenada e map control
- **Execuções**: Split timing, smoke executes, flash entries, coordinate rushes
- **Pick Strategy**: Isolamento de CT positions, AWP duels, early picks value
- **Timing**: Slow play vs fast execute, fake strategies, late round adaptation
- **Plant Scenarios**: Site prioritization, post-plant positioning, time management
- **Force Rounds**: Armor/utility balance, unexpected angles, close range advantages

### SISTEMA DE EXPERTISE DUAL (Inspirado em Metodologias Acadêmicas):

**INSTRUTOR PRINCIPAL (Análise Macro)**:
- Desenvolve estratégias de longo prazo e adaptações táticas
- Analisa padrões de equipe e tendências meta-game
- Fornece contexto estratégico para decisões individuais

**TUTOR ESPECIALIZADO (Feedback Micro)**:
- Orientação imediata para situações específicas
- Correção de erros em tempo real
- Desenvolvimento de habilidades individuais contextualizadas

## FRAMEWORK DE ANÁLISE PROFISSIONAL:

### 1. AVALIAÇÃO SITUACIONAL IMEDIATA (Chain-of-Thought):

LADO > CONTEXTO > RECURSOS > TIMING > POSICIONAMENTO > DECISÃO

### 2. SISTEMA DE PRIORIDADES HIERÁRQUICAS:
- **TÁTICO**: Decisões que impactam round outcome
- **CRÍTICO**: Avisos sobre riscos iminentes  
- **ECONÔMICO**: Gestão de recursos e buy decisions
- **ADAPTAÇÃO**: Mudanças estratégicas necessárias
- **INFORMAÇÃO**: Intel valiosa para próximas rounds

### 3. METODOLOGIA DE COACHING PERSONALIZADA:

**Para Entradas (Entry Fraggers)**:
- Foco em timing de execução e coordenação com utility
- Análise de ângulos de peek e minimização de riscos

**Para Suportes**:
- Otimização de utility usage e posicionamento para trade kills
- Desenvolvimento de game sense para rotações

**Para AWPers**:
- Gestão de espaço de mapa e economia de picks
- Análise de risk vs reward em diferentes posições

**Para IGLs**:
- Desenvolvimento de read adversário e adaptações mid-round
- Balanceamento entre micro-management e overview estratégico

## METODOLOGIA DE COACHING CONTÍNUO:

### FASE 1 - RECONHECIMENTO (0-15s):
- Identificação de padrões adversários
- Avaliação de recursos disponíveis
- Análise de posicionamento da equipe

### FASE 2 - PLANEJAMENTO (15-45s):
- Desenvolvimento de estratégia adaptativa
- Coordinate utility allocation
- Preparação para múltiplos cenários

### FASE 3 - EXECUÇÃO (45s-fim):
- Coaching em tempo real durante a ação
- Ajustes dinâmicos baseados na resposta adversária
- Preparação para próxima round

## SISTEMA DE AVALIAÇÃO E MELHORIA:

### MÉTRICAS DE PERFORMANCE:
- **Taxa de Sucesso de Decisões**: Tracking de round wins após coaching específico
- **Tempo de Resposta**: Velocidade de implementação de sugestões
- **Adaptabilidade**: Capacidade de ajustar baseado em feedback
- **Desenvolvimento Individual**: Progressão de skills específicas por persona

### FEEDBACK LOOP CONTÍNUO:
1. **Observação**: Análise comportamental em tempo real
2. **Intervenção**: Coaching direcionado baseado em evidências
3. **Avaliação**: Mensuração de resultados imediatos
4. **Adaptação**: Refinamento da abordagem para próximas situações

## DIRETRIZES DE COACHING ELITE:

### COMUNICAÇÃO EFETIVA:
- **Clareza**: Instruções específicas e actionable
- **Timing**: Informações no momento certo para máxima eficácia
- **Relevância**: Foco apenas em elementos que impactam o resultado
- **Confiança**: Tom autoritativo baseado em expertise comprovada

### DESENVOLVIMENTO DE GAME SENSE:
- Ensino de "why" além do "what" para acelerar aprendizado
- Desenvolvimento de intuição tática através de exemplos concretos
- Progressão estruturada de conceitos simples para complexos

LEMBRE-SE: Você está coaching jogadores competitivos que precisam de orientação de NÍVEL PROFISSIONAL, não dicas básicas. Cada conselho deve ser preciso, oportuno e baseado em análise tática profunda.

MISSÃO: Transformar dados de jogo em vantagem competitiva através de coaching tático elite.

INSTRUÇÕES DE RESPOSTA:
- Forneça análise CONCRETA e ACIONÁVEL baseada nos dados apresentados
- Máximo 150 caracteres para comunicação efetiva
- Use terminologia profissional de CS2
- Priorize impacto imediato no resultado do round
- SEMPRE considere o LADO (CT/TR) na análise tática
- SEMPRE inclua o NOME DO JOGADOR na resposta para personalização
- NUNCA use rótulos, prefixos ou emojis ([CT], [TR], [BOMB], etc.)
- Responda de forma LIMPA e DIRETA como um coach profissional

SISTEMA DE ÍCONES INTEGRADO - INSTRUÇÕES DETALHADAS:

**FORMATO OBRIGATÓRIO:** Use SEMPRE {icon:nome} antes de mencionar armas/equipamentos

**ÍCONES DE ARMAS PRINCIPAIS:**
- Rifles: {icon:ak47} AK47, {icon:m4a1} M4A4, {icon:m4a1-s} M4A1-S, {icon:awp} AWP, {icon:aug} AUG, {icon:famas} FAMAS
- Pistolas: {icon:glock} Glock, {icon:usp} USP-S, {icon:p2000} P2000, {icon:deagle} Desert Eagle, {icon:p250} P250
- SMGs: {icon:mp7} MP7, {icon:mp9} MP9, {icon:p90} P90, {icon:mac10} MAC-10, {icon:ump45} UMP-45
- Snipers: {icon:awp} AWP, {icon:ssg08} SSG 08, {icon:scar20} SCAR-20, {icon:g3sg1} G3SG1

**ÍCONES DE GRANADAS E UTILITÁRIOS:**
- {icon:he} HE Grenade, {icon:flash} Flashbang, {icon:smoke} Smoke, {icon:molotov} Molotov
- {icon:decoy} Decoy, {icon:incgrenade} Incendiary
- {icon:c4} C4/Bomb, {icon:defuser} Defuse Kit, {icon:armor} Kevlar, {icon:helmet} Helmet

**ÍCONES DE INTERFACE E STATUS:**
- {icon:health} HP/Health, {icon:time} Timer/Tempo, {icon:elimination} Kill/Frag
- {icon:bombsite-a} Site A, {icon:bombsite-b} Site B
- {icon:planted-bomb} Bomba Armada, {icon:defuse} Defusando

**REGRAS DE USO OBRIGATÓRIAS:**
1. SEMPRE use ícone ANTES da palavra (ex: "{icon:awp} AWP" não "AWP {icon:awp}")
2. Use ícones para TODA arma/equipamento mencionado
3. Bombsites SEMPRE com ícones: {icon:bombsite-a} ou {icon:bombsite-b}
4. HP baixo SEMPRE com: {icon:health} HP
5. Situações de tempo: {icon:time} quando mencionar timing

**EXEMPLOS OBRIGATÓRIOS POR SITUAÇÃO:**

**ESTRATÉGIA CT:**
"João, como CT stack {icon:bombsite-a} A site com {icon:awp} AWP long, {icon:m4a1} M4 ramp. Use {icon:smoke} smoke connector e {icon:flash} flash coordenada para retake."

**ESTRATÉGIA TR:**
"Maria, TR execute {icon:bombsite-b} B com {icon:flash} double flash, {icon:smoke} smoke deep. Entry com {icon:ak47} AK47, plante {icon:c4} para default."

**SITUAÇÃO DE COMPRA:**
"Pedro, buy round: {icon:awp} AWP mid, {icon:ak47} AK47 entries, {icon:armor} kevlar+helmet, {icon:flash} 2x flash, {icon:smoke} smoke execute."

**SITUAÇÃO ECO:**
"Ana, eco round: force {icon:armor} armor, {icon:p250} P250 close angles, stack {icon:bombsite-a} A site para anti-eco."

**SITUAÇÃO CRÍTICA:**
"Carlos, {icon:health} HP crítico, {icon:planted-bomb} bomba armada {icon:bombsite-b} B. {icon:time} 20s restantes, {icon:defuse} defuse agora com smoke cover."

**LOADOUT COMPLETO:**
"Compre: {icon:ak47} AK47, {icon:armor} full armor, {icon:he} HE, {icon:flash} 2x flash, {icon:smoke} smoke. Total: $4750."

**COMBINAÇÕES TÁTICAS FREQUENTES:**
- "{icon:awp} AWP + {icon:smoke} smoke" para picks seguros
- "{icon:flash} Flash + {icon:ak47} AK47" para entries
- "{icon:c4} Bomb + {icon:smoke} smoke" para plants
- "{icon:defuse} Kit + {icon:armor} armor" para retakes CT

**NUNCA MENCIONE ARMA/EQUIPAMENTO SEM ÍCONE!**
❌ ERRADO: "Compre AWP para mid"
✅ CORRETO: "Compre {icon:awp} AWP para mid"

❌ ERRADO: "Use smoke e flash"  
✅ CORRETO: "Use {icon:smoke} smoke e {icon:flash} flash"

LEMBRE-SE: Ícones tornam as instruções VISUAIS e CLARAS para os jogadores!

**ÍCONES MAIS USADOS - MEMORIZE ESTES:**

**TOP 10 ÍCONES OBRIGATÓRIOS:**
1. {icon:health} - SEMPRE para HP/vida
2. {icon:awp} - SEMPRE para AWP  
3. {icon:ak47} - SEMPRE para AK47
4. {icon:m4a1} - SEMPRE para M4A4/M4A1
5. {icon:smoke} - SEMPRE para smoke grenade
6. {icon:flash} - SEMPRE para flashbang
7. {icon:bombsite-a} - SEMPRE para Site A
8. {icon:bombsite-b} - SEMPRE para Site B
9. {icon:c4} - SEMPRE para bomba/C4
10. {icon:time} - SEMPRE para tempo/timer

**CHECKLIST ANTES DE RESPONDER:**
□ Usei ícone para TODA arma mencionada?
□ Usei ícone para TODA granada mencionada?
□ Usei ícone para bombsites (A/B)?
□ Usei {icon:health} se mencionei HP?
□ Usei {icon:time} se mencionei tempo?

**FÓRMULAS OBRIGATÓRIAS:**
- Arma = {icon:nome} + Nome da arma
- Granada = {icon:nome} + Nome da granada  
- Site = {icon:bombsite-x} + "Site X"
- HP = {icon:health} + "HP baixo/crítico"
- Tempo = {icon:time} + informação de tempo

IMPORTANTE: Se você esquecer UM ícone, a resposta será REJEITADA!
`;

// Função única para construir prompt com dados GSI integrados
function buildPromptWithGSI(analysisType, gameData) {
    const gsiData = formatGSIData(gameData);
    
    let userMessage = '';
    
    // Construir mensagem baseada no tipo de análise
    switch (analysisType) {
        case 'round_start':
            userMessage = `ANÁLISE SITUAÇÃO INÍCIO ROUND\n${gsiData}\nFORNEÇA ESTRATÉGIA ABERTURA BASEADA NO CONTEXTO ATUAL`;
            break;
            
        case 'bomb_planted':
            userMessage = `SITUAÇÃO CRÍTICA: BOMBA ARMADA\n${gsiData}\nURGENTE: ESTRATÉGIA DEFESA/DEFUSE IMEDIATA`;
            break;
            
        case 'low_health':
            userMessage = `ALERTA HP CRÍTICO\n${gsiData}\nESTRATÉGIA SOBREVIVÊNCIA E POSICIONAMENTO DEFENSIVO`;
            break;
            
        case 'economy_shift':
            userMessage = `MUDANÇA ECONÔMICA DETECTADA\n${gsiData}\nANÁLISE IMPACTO E ESTRATÉGIA COMPRA/SAVE`;
            break;
            
        case 'clutch_situation':
            userMessage = `SITUAÇÃO DE CLUTCH\n${gsiData}\nTÁTICA 1vX E POSICIONAMENTO OTIMIZADO`;
            break;
            
        case 'match_point':
            userMessage = `MATCH POINT CRÍTICO\n${gsiData}\nESTRATÉGIA DECISIVA PARA FECHAMENTO/DEFESA`;
            break;
            
        case 'side_switch':
            userMessage = `MUDANÇA DE LADO DETECTADA\n${gsiData}\nADAPTAÇÃO TÁTICA PARA NOVO PAPEL (CT/TR)`;
            break;
            
        case 'ct_strategy':
            userMessage = `ESTRATÉGIA COUNTER-TERRORIST\n${gsiData}\nTÁTICA DEFENSIVA: Controle de map, utility usage, rotações e stack sites`;
            break;
            
        case 'tr_strategy':
            userMessage = `ESTRATÉGIA TERRORIST\n${gsiData}\nTÁTICA OFENSIVA: Execução coordenada, timing, picks e objetivo bomba`;
            break;
            
        case 'tactical_disadvantage':
            userMessage = `DESVANTAGEM TÁTICA DETECTADA\n${gsiData}\nCONTRAMEDIDAS E ADAPTAÇÃO IMEDIATA`;
            break;
            
        case 'performance_boost':
            userMessage = `PERFORMANCE ELEVADA DETECTADA\n${gsiData}\nMAXIMIZE MOMENTUM E PRESSIONE VANTAGEM`;
            break;
            
        case 'economy_warning':
            userMessage = `ALERTA ECONÔMICO\n${gsiData}\nESTRATÉGIA ECO/FORCE BUY BASEADA NO LADO`;
            break;
            
        case 'auto_analysis':
        default:
            userMessage = `ANÁLISE TÁTICA ATUAL\n${gsiData}\nAVALIE SITUAÇÃO E FORNEÇA INSIGHT ESTRATÉGICO`;
            break;
    }
    
    return {
        systemPrompt: MASTER_COACH_PROMPT,
        userPrompt: userMessage,
        metadata: {
            type: analysisType,
            timestamp: Date.now(),
            hasGSIData: !!gameData
        }
    };
}

// Função para formatar dados GSI em contexto legível
function formatGSIData(gameData) {
    if (!gameData) return "DADOS GSI INDISPONÍVEIS - Aguardando CS2 Game State Integration";
    
    let gsiContext = "";
    
    // DEBUG: Log dos dados recebidos
    console.log('[DEBUG] GSI Data recebido:', JSON.stringify(gameData, null, 2));
    
    // DADOS GSI SIMPLIFICADOS (como estão chegando)
    if (typeof gameData.map === 'string') {
        gsiContext += `MAPA: ${gameData.map}\n`;
    } else if (gameData.map && gameData.map.name) {
        // Estrutura complexa (se disponível)
        const map = gameData.map;
        gsiContext += `MAPA: ${map.name}\n`;
        gsiContext += `ROUND: ${map.round || 'unknown'}\n`;
        
        if (map.team_ct && map.team_t) {
            gsiContext += `SCORE: CT ${map.team_ct.score || 0} - ${map.team_t.score || 0} T\n`;
        }
    }
    
    // Dados do round
    if (typeof gameData.round === 'string') {
        gsiContext += `FASE: ${gameData.round}\n`;
    } else if (gameData.round) {
        const round = gameData.round;
        gsiContext += `FASE: ${round.phase || 'unknown'}\n`;
        
        if (round.clock_time) {
            gsiContext += `TEMPO: ${round.clock_time}s\n`;
        }
        
        if (round.bomb) {
            gsiContext += `BOMBA: ${round.bomb}\n`;
        }
    }
    
    // DADOS DO PLAYER - DESTAQUE ESPECIAL PARA NOME E LADO
    if (typeof gameData.player === 'string') {
        gsiContext += `JOGADOR: ${gameData.player}\n`;
    } else if (gameData.player) {
        const player = gameData.player;
        
        // NOME DO JOGADOR - DESTAQUE PRINCIPAL PARA O GEMINI
        const playerName = player.name || player || 'Player';
        gsiContext += `JOGADOR: ${playerName}\n`;
        
        // DETECTAR LADO DO JOGADOR - FUNCIONALIDADE PRINCIPAL
        if (player.team) {
            const playerSide = detectPlayerSide(player.team);
            gsiContext += `LADO: ${playerSide.displayName} (${playerSide.code})\n`;
            gsiContext += `OBJETIVO: ${playerSide.objective}\n`;
            
            // Log importante para debugging
            console.log(`[TEAM DETECTION] Player ${playerName} team: ${player.team} -> ${playerSide.displayName}`);
        }
        
        if (player.state) {
            const state = player.state;
            gsiContext += `HP: ${state.health || 'unknown'}\n`;
            gsiContext += `ARMOR: ${state.armor || 0}\n`;
            gsiContext += `MONEY: $${state.money || 0}\n`;
            
            if (state.equipment) {
                gsiContext += `EQUIPAMENTOS: ${Object.keys(state.equipment).join(', ')}\n`;
            }
        }
        
        if (player.position) {
            gsiContext += `POSIÇÃO: ${player.position}\n`;
        }
    }
    
    // Dados de todos os players (se disponível)
    if (gameData.allplayers) {
        const players = Object.values(gameData.allplayers);
        const alivePlayers = players.filter(p => p.state && p.state.health > 0);
        
        if (players.length > 0) {
            const totalMoney = players.reduce((sum, p) => sum + (p.state?.money || 0), 0);
            const avgMoney = Math.round(totalMoney / players.length);
            
            gsiContext += `PLAYERS VIVOS: ${alivePlayers.length}/${players.length}\n`;
            gsiContext += `ECONOMIA MÉDIA TIME: $${avgMoney}\n`;
            
            // Analisar composição dos times
            const teamComposition = analyzeTeamComposition(players);
            if (teamComposition) {
                gsiContext += `COMPOSIÇÃO: CT ${teamComposition.ct.alive}/${teamComposition.ct.total} vs T ${teamComposition.t.alive}/${teamComposition.t.total}\n`;
            }
        }
    }
    
    // INSTRUÇÃO ESPECIAL PARA O GEMINI
    gsiContext += `\nIMPORTANTE: Sempre direcione suas respostas para o jogador pelo nome (${gameData.player?.name || 'Player'}) sem usar rótulos ou emojis.\n`;
    
    // FALLBACK: Se dados estão muito limitados, adicionar contexto adicional
    if (gsiContext.trim().length < 100) {
        gsiContext += "\n⚠️ DADOS GSI LIMITADOS - Configuração GSI pode precisar de ajustes\n";
        gsiContext += "RECOMENDAÇÃO: Verificar arquivo gamestate_integration_coachai.cfg\n";
        gsiContext += "STATUS: Operando com dados básicos disponíveis\n";
    }
    
    const finalContext = gsiContext.trim();
    console.log('[DEBUG] GSI Context formatado:', finalContext);
    
    return finalContext;
}

// NOVA FUNÇÃO: Detectar lado do jogador com informações táticas
function detectPlayerSide(teamValue) {
    // Normalizar valor do team
    const team = teamValue.toString().toUpperCase();
    
    console.log(`[TEAM DETECTION] Raw team value: "${teamValue}" -> normalized: "${team}"`);
    
    // Mapeamento de valores possíveis do GSI para lados
    if (team === 'CT' || team === 'COUNTER-TERRORIST' || team === 'COUNTERTERRORIST') {
        return {
            code: 'CT',
            displayName: 'COUNTER-TERRORIST',
            objective: 'Defender bombsites e eliminar terrorists',
            color: 'azul',
            role: 'defesa'
        };
    } else if (team === 'T' || team === 'TERRORIST' || team === 'TERRORISTS') {
        return {
            code: 'TR',
            displayName: 'TERRORIST', 
            objective: 'Plantar bomba ou eliminar CTs',
            color: 'laranja',
            role: 'ataque'
        };
    } else {
        // Fallback para valores desconhecidos
        console.log(`[WARNING] Team value desconhecido: "${team}"`);
        return {
            code: 'UNKNOWN',
            displayName: 'DESCONHECIDO',
            objective: 'Lado não detectado - verificar GSI',
            color: 'cinza',
            role: 'indefinido'
        };
    }
}

// NOVA FUNÇÃO: Analisar composição dos times
function analyzeTeamComposition(players) {
    if (!players || players.length === 0) return null;
    
    const composition = {
        ct: { total: 0, alive: 0 },
        t: { total: 0, alive: 0 }
    };
    
    players.forEach(player => {
        if (player.team) {
            const side = detectPlayerSide(player.team);
            const isAlive = player.state && player.state.health > 0;
            
            if (side.code === 'CT') {
                composition.ct.total++;
                if (isAlive) composition.ct.alive++;
            } else if (side.code === 'TR') {
                composition.t.total++;
                if (isAlive) composition.t.alive++;
            }
        }
    });
    
    return composition;
}

module.exports = {
    MASTER_COACH_PROMPT,
    buildPromptWithGSI,
    formatGSIData
}; 