/**
 * CS2 Coach AI - Elite Tier 1 Prompt System
 * Sistema de prompts evoluído para coaching profissional
 * Integra otimização de tokens e inferência estratégica
 */

const TokenOptimizer = require('../utils/tokenOptimizer.js');
const StrategicInference = require('../utils/strategicInference.js');

class ElitePromptSystem {
    constructor() {
        this.tokenOptimizer = new TokenOptimizer();
        this.strategicInference = new StrategicInference();
        
        // System prompts especializados por contexto
        this.systemPrompts = {
            // Análise preditiva pré-round
            pre_round: this.buildPreRoundPrompt(),
            
            // Análise reativa mid-round
            mid_round: this.buildMidRoundPrompt(),
            
            // Análise de causa raiz pós-round
            post_round: this.buildPostRoundPrompt(),
            
            // Análise de clutch situações
            clutch_analysis: this.buildClutchPrompt(),
            
            // Análise econômica
            economy_analysis: this.buildEconomyPrompt()
        };
        
        // Configurações do sistema
        this.config = {
            useTokenOptimization: true,
            useStrategicInference: true,
            adaptPromptToContext: true,
            maxTokensPerAnalysis: 800, // Limite otimizado
            responseFormat: 'structured' // structured | natural
        };
        
        // Cache de dados anteriores para análise delta
        this.previousGameData = null;
    }
    
    /**
     * Gera prompt otimizado para Tier 1 coaching
     * @param {string} analysisType - Tipo de análise
     * @param {Object} gameData - Dados do GSI
     * @param {string} context - Contexto adicional
     * @returns {Object} Prompt estruturado e otimizado
     */
    generateElitePrompt(analysisType, gameData, context = '') {
        console.log(`[ELITE_PROMPT] Gerando prompt Tier 1 para: ${analysisType}`);
        
        // 1. OTIMIZAR DADOS GSI
        let optimizedData = gameData;
        if (this.config.useTokenOptimization) {
            optimizedData = this.tokenOptimizer.optimizeGameData(gameData, analysisType);
        }
        
        // 2. GERAR ANÁLISE PREDITIVA
        let strategicContext = '';
        if (this.config.useStrategicInference) {
            this.strategicInference.updateInference(gameData, this.previousGameData);
            const predictiveAnalysis = this.strategicInference.generatePredictiveAnalysis(
                this.mapAnalysisTypeToPhase(analysisType), 
                gameData
            );
            strategicContext = this.formatStrategicContext(predictiveAnalysis);
        }
        
        // 3. SELECIONAR PROMPT ESPECIALIZADO
        const systemPrompt = this.selectSystemPrompt(analysisType, optimizedData);
        
        // 4. CONSTRUIR USER PROMPT OTIMIZADO
        const userPrompt = this.buildOptimizedUserPrompt(
            analysisType, 
            optimizedData, 
            context, 
            strategicContext
        );
        
        // 5. APLICAR FORMATAÇÃO FINAL
        const finalPrompt = this.applyFinalFormatting(systemPrompt, userPrompt, analysisType);
        
        // Armazenar para próxima análise
        this.previousGameData = gameData;
        
        console.log(`[ELITE_PROMPT] Prompt gerado: ${finalPrompt.userPrompt.length} chars`);
        
        return finalPrompt;
    }
    
    /**
     * System prompt para análise pré-round (Preditiva)
     */
    buildPreRoundPrompt() {
        return `Você é um ANALISTA TÁTICO ELITE com especialização em ANÁLISE PREDITIVA para equipes Tier 1.

## EXPERTISE CORE:
- **Função**: Strategist & Intel Analyst
- **Especialização**: Modelagem de oponentes e predição de estratégias
- **Metodologia**: Inferência baseada em padrões + análise de tendências

## MISSION BRIEFING:
Sua tarefa é processar intel limitada para PREDIZER estratégias inimigas e fornecer CONTRA-ESTRATÉGIAS otimizadas.

## FRAMEWORK DE ANÁLISE PREDITIVA:

### 1. ECONOMIC WARFARE:
- Analise economia inferida do oponente
- Prediga tipo de compra (eco/force/full)
- Recomende anti-estratégia econômica

### 2. PATTERN RECOGNITION:
- Identifique tendências táticas observadas
- Projete probabilidade de execução
- Sugira contra-medidas preventivas

### 3. RISK ASSESSMENT:
- Calcule probabilidades de sucesso
- Identifique pontos de vulnerabilidade
- Priorize allocation de recursos

## OUTPUT FORMAT:
Responda em JSON estruturado:
{
  "economic_prediction": "estado_economico_inimigo",
  "tactical_prediction": "estrategia_mais_provavel", 
  "counter_strategy": "contra_estrategia_otimizada",
  "confidence": "nivel_confianca_0_100",
  "key_intel": "informacao_critica"
}

CRITICAL: Use SEMPRE ícones {icon:nome} para armas/equipamentos mencionados.`;
    }
    
    /**
     * System prompt para análise mid-round (Reativa)
     */
    buildMidRoundPrompt() {
        return `Você é um TACTICAL COORDINATOR ELITE para coaching em tempo real durante execução.

## EXPERTISE CORE:
- **Função**: Real-time Tactical Coordinator
- **Especialização**: Micro-decisões e adaptação dinâmica
- **Metodologia**: Análise situacional + resposta adaptativa

## MISSION BRIEFING:
Processar situação em tempo real e fornecer orientação tática IMEDIATA baseada no estado atual e intel inferida.

## FRAMEWORK DE ANÁLISE REATIVA:

### 1. SITUATION ASSESSMENT:
- Avalie posicionamento atual
- Identifique ameaças imediatas
- Calcule vantagens/desvantagens

### 2. ADAPTIVE STRATEGY:
- Ajuste tática baseado em novos dados
- Priorize objetivos por importância
- Otimize uso de recursos disponíveis

### 3. EXECUTION GUIDANCE:
- Forneça instruções específicas e acionáveis
- Priorize timing crítico
- Minimize exposure ao risco

## OUTPUT FORMAT:
Responda em JSON estruturado:
{
  "immediate_action": "acao_imediata_necessaria",
  "positioning": "ajuste_posicionamento",
  "utility_usage": "uso_otimo_utilitarios",
  "risk_level": "alto_medio_baixo",
  "success_probability": "percentual_sucesso"
}

CRITICAL: Use SEMPRE ícones {icon:nome} para armas/equipamentos mencionados.`;
    }
    
    /**
     * System prompt para análise pós-round (Causa Raiz)
     */
    buildPostRoundPrompt() {
        return `Você é um PERFORMANCE ANALYST ELITE especializado em análise de causa raiz e melhoria contínua.

## EXPERTISE CORE:
- **Função**: Post-Game Performance Analyst
- **Especialização**: Root cause analysis + strategic learning
- **Metodologia**: Análise retrospectiva + pattern detection

## MISSION BRIEFING:
Analisar resultado do round para identificar CAUSA RAIZ do sucesso/falha e extrair LIÇÕES ESTRATÉGICAS para rounds futuros.

## FRAMEWORK DE ANÁLISE POST-ROUND:

### 1. ROOT CAUSE ANALYSIS:
- Identifique fator decisivo do resultado
- Analise qualidade de execução vs estratégia
- Determine pontos de melhoria críticos

### 2. STRATEGIC LEARNING:
- Extraia padrões do oponente observados
- Identifique adaptações necessárias
- Priorize focos de desenvolvimento

### 3. NEXT ROUND PREPARATION:
- Recomende ajustes táticos
- Sugira preparação mental/técnica
- Otimize strategy selection

## OUTPUT FORMAT:
Responda em JSON estruturado:
{
  "root_cause": "fator_decisivo_resultado",
  "execution_quality": "excelente_boa_regular_ruim",
  "key_learning": "licao_estrategica_principal",
  "opponent_pattern": "padrao_inimigo_detectado",
  "next_round_focus": "foco_proximo_round"
}

CRITICAL: Use SEMPRE ícones {icon:nome} para armas/equipamentos mencionados.`;
    }
    
    /**
     * Constrói outros prompts especializados
     */
    buildClutchPrompt() {
        return `Você é um CLUTCH SPECIALIST ELITE com expertise em situações 1vX de alta pressão.

MISSION: Analisar situação de clutch e fornecer estratégia otimizada para maximizar chance de sucesso.

FRAMEWORK: Isolamento de duelos + gerenciamento de tempo + posicionamento ideal.

OUTPUT: JSON com strategy, positioning, timing, confidence.`;
    }
    
    buildEconomyPrompt() {
        return `Você é um ECONOMIC STRATEGIST ELITE especializado em warfare econômica.

MISSION: Analisar estado econômico e fornecer estratégia de compra/save otimizada.

FRAMEWORK: Economy management + opponent inference + ROI optimization.

OUTPUT: JSON com buy_strategy, economic_reasoning, opponent_prediction, efficiency_score.`;
    }
    
    /**
     * Seleciona system prompt baseado no tipo de análise
     */
    selectSystemPrompt(analysisType, gameData) {
        // Mapeamento inteligente baseado no contexto
        if (analysisType.includes('round_start') || analysisType.includes('_strategy')) {
            return this.systemPrompts.pre_round;
        }
        
        if (analysisType.includes('bomb_') || analysisType.includes('clutch') || 
            analysisType.includes('tactical_')) {
            return this.systemPrompts.mid_round;
        }
        
        if (analysisType.includes('round_end') || analysisType.includes('round_summary')) {
            return this.systemPrompts.post_round;
        }
        
        if (analysisType.includes('clutch_situation')) {
            return this.systemPrompts.clutch_analysis;
        }
        
        if (analysisType.includes('economy')) {
            return this.systemPrompts.economy_analysis;
        }
        
        // Default para mid-round (mais versátil)
        return this.systemPrompts.mid_round;
    }
    
    /**
     * Constrói user prompt otimizado
     */
    buildOptimizedUserPrompt(analysisType, optimizedData, context, strategicContext) {
        const parts = [];
        
        // 1. HEADER COM TIPO DE ANÁLISE
        parts.push(`=== ${analysisType.toUpperCase()} ANALYSIS ===`);
        
        // 2. DADOS GSI OTIMIZADOS
        if (this.config.useTokenOptimization && optimizedData.player) {
            const formatted = this.tokenOptimizer.formatForPrompt(optimizedData, analysisType);
            parts.push('GAME STATE (OPTIMIZED):');
            parts.push(formatted);
        } else {
            parts.push('GAME STATE:');
            parts.push(this.formatTraditionalGSI(optimizedData));
        }
        
        // 3. CONTEXTO ESTRATÉGICO (INFERÊNCIA)
        if (strategicContext) {
            parts.push('STRATEGIC INTEL:');
            parts.push(strategicContext);
        }
        
        // 4. CONTEXTO ADICIONAL
        if (context) {
            parts.push('ADDITIONAL CONTEXT:');
            parts.push(context);
        }
        
        // 5. INSTRUÇÃO ESPECÍFICA
        parts.push(this.getAnalysisInstruction(analysisType));
        
        return parts.join('\n\n');
    }
    
    /**
     * Formata contexto estratégico da inferência
     */
    formatStrategicContext(predictiveAnalysis) {
        const parts = [];
        
        if (predictiveAnalysis.confidence > 0) {
            parts.push(`Model Confidence: ${predictiveAnalysis.confidence}%`);
        }
        
        if (predictiveAnalysis.predictions.length > 0) {
            parts.push('PREDICTIONS:');
            predictiveAnalysis.predictions.forEach(pred => {
                parts.push(`- ${pred.type}: ${pred.prediction} (${pred.confidence}% confidence)`);
                if (pred.reasoning) parts.push(`  Reasoning: ${pred.reasoning}`);
            });
        }
        
        if (predictiveAnalysis.inferredStates) {
            parts.push('INFERRED STATES:');
            Object.entries(predictiveAnalysis.inferredStates).forEach(([key, value]) => {
                if (value && value !== 'unknown') {
                    parts.push(`- ${key}: ${value}`);
                }
            });
        }
        
        if (predictiveAnalysis.patterns && Object.keys(predictiveAnalysis.patterns).length > 0) {
            parts.push('DETECTED PATTERNS:');
            Object.entries(predictiveAnalysis.patterns).forEach(([key, value]) => {
                if (value && typeof value === 'object') {
                    parts.push(`- ${key}: ${JSON.stringify(value)}`);
                } else if (value) {
                    parts.push(`- ${key}: ${value}`);
                }
            });
        }
        
        return parts.join('\n');
    }
    
    /**
     * Formatar GSI tradicional como fallback
     */
    formatTraditionalGSI(gameData) {
        const parts = [];
        
        if (gameData.player) {
            parts.push(`Player: ${gameData.player.name || 'Unknown'}`);
            if (gameData.player.team) parts.push(`Team: ${gameData.player.team}`);
            if (gameData.player.state) {
                const s = gameData.player.state;
                parts.push(`HP: ${s.health || 0} | Armor: ${s.armor || 0} | Money: $${s.money || 0}`);
            }
        }
        
        if (gameData.round) {
            parts.push(`Phase: ${gameData.round.phase || 'unknown'}`);
            if (gameData.round.clock_time) parts.push(`Time: ${gameData.round.clock_time}s`);
            if (gameData.round.bomb) parts.push(`Bomb: ${gameData.round.bomb}`);
        }
        
        if (gameData.map) {
            if (gameData.map.round) parts.push(`Round: ${gameData.map.round}`);
            if (gameData.map.team_ct && gameData.map.team_t) {
                parts.push(`Score: CT ${gameData.map.team_ct.score || 0} - ${gameData.map.team_t.score || 0} T`);
            }
        }
        
        return parts.join('\n');
    }
    
    /**
     * Gera instrução específica por tipo de análise
     */
    getAnalysisInstruction(analysisType) {
        const instructions = {
            'round_start': 'ANALYZE opponent economy and predict their most likely strategy. Provide optimized counter-strategy.',
            'bomb_planted': 'IMMEDIATE TACTICAL GUIDANCE: Assess post-plant situation and provide optimal positioning/defuse strategy.',
            'clutch_situation': 'CLUTCH ANALYSIS: Optimize 1vX strategy with positioning, timing, and duel isolation.',
            'economy_shift': 'ECONOMIC WARFARE: Analyze economy change impact and adjust buy/save strategy.',
            'round_end': 'ROOT CAUSE ANALYSIS: Identify why this round was won/lost and extract strategic lessons.',
            'ct_strategy': 'CT TACTICAL ANALYSIS: Provide defensive positioning and utility coordination strategy.',
            'tr_strategy': 'T TACTICAL ANALYSIS: Provide offensive execution and site prioritization strategy.'
        };
        
        return instructions[analysisType] || 'TACTICAL ANALYSIS: Assess current situation and provide strategic guidance.';
    }
    
    /**
     * Mapeia tipo de análise para fase estratégica
     */
    mapAnalysisTypeToPhase(analysisType) {
        if (analysisType.includes('round_start') || analysisType.includes('_strategy')) {
            return 'pre_round';
        }
        if (analysisType.includes('round_end') || analysisType.includes('round_summary')) {
            return 'post_round';
        }
        return 'mid_round';
    }
    
    /**
     * Aplica formatação final e otimizações
     */
    applyFinalFormatting(systemPrompt, userPrompt, analysisType) {
        // Adicionar metadados para tracking
        const metadata = {
            type: analysisType,
            timestamp: Date.now(),
            tokenOptimization: this.config.useTokenOptimization,
            strategicInference: this.config.useStrategicInference,
            estimatedTokens: this.estimatePromptTokens(systemPrompt + userPrompt)
        };
        
        return {
            systemPrompt,
            userPrompt,
            metadata,
            // Configurações específicas para o Gemini
            geminiConfig: {
                temperature: 0.3, // Mais determinístico para coaching
                maxOutputTokens: 1500, // CORRIGIDO: Mais tokens para respostas Elite completas
                topP: 0.8,
                topK: 40
            }
        };
    }
    
    /**
     * Estima tokens do prompt
     */
    estimatePromptTokens(text) {
        return Math.ceil(text.length / 4); // Aproximação
    }
    
    /**
     * Obter estatísticas de otimização
     */
    getOptimizationStats() {
        const tokenStats = this.tokenOptimizer.getOptimizationStats();
        const inferenceStats = this.strategicInference.getModelSummary();
        
        return {
            tokenOptimization: tokenStats,
            strategicInference: inferenceStats,
            systemStatus: {
                promptVariants: Object.keys(this.systemPrompts).length,
                optimization: this.config.useTokenOptimization ? 'ENABLED' : 'DISABLED',
                inference: this.config.useStrategicInference ? 'ENABLED' : 'DISABLED'
            }
        };
    }
    
    /**
     * Reset para nova sessão
     */
    reset() {
        this.tokenOptimizer = new TokenOptimizer();
        this.strategicInference.reset();
        this.previousGameData = null;
        
        console.log('[ELITE_PROMPT] Sistema resetado para nova sessão');
    }
    
    /**
     * Configurar sistema
     */
    configure(options) {
        Object.assign(this.config, options);
        console.log('[ELITE_PROMPT] Configuração atualizada:', this.config);
    }
}

module.exports = ElitePromptSystem; 