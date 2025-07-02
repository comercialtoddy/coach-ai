# CS2 Coach AI - Sistema Inteligente com Banco de Dados

## Visão Geral

O sistema foi aprimorado com um banco de dados inteligente que armazena informações limpas dos rounds e detecta automaticamente eventos importantes para análise em tempo real pelo GEMINI.

## Componentes Principais

### 1. Round Database (`src/database/roundDatabase.js`)
Sistema de banco de dados em memória que armazena:
- **Informações do Round**: número, duração, jogador, lado (CT/TR), mapa
- **Eventos**: kills, deaths, danos, uso de utilitários, posições
- **Estatísticas**: K/D, win rate, clutch rate, padrões de jogo
- **Histórico**: últimos 30 rounds para análise de tendências

### 2. Event Detector (`src/utils/eventDetector.js`) 
Detecta automaticamente eventos importantes:
- **Triple Kill / Quad Kill / Ace**: Multi-kills impressionantes
- **HP Crítico**: Vida abaixo de 30 HP (alerta) ou 15 HP (crítico)
- **Bomba Plantada/Defusando**: Momentos decisivos do round
- **Clutch**: Situações 1vX detectadas automaticamente
- **Mudanças Econômicas**: Variações significativas de dinheiro
- **Fim de Round**: Gera resumo completo automaticamente

### 3. Auto Analyzer Aprimorado
Integra o banco de dados e detector de eventos:
- Análise em tempo real de eventos críticos
- Envio de contexto completo para o GEMINI
- Resumo automático no final de cada round
- Histórico de performance para insights mais precisos

## Fluxo de Funcionamento

1. **Início do Round**
   - Round Database cria novo registro
   - Event Detector reseta tracking
   - GEMINI recebe estratégia inicial

2. **Durante o Round**
   - Eventos são detectados em tempo real
   - Banco armazena informações limpas (sem JSON)
   - GEMINI analisa momentos críticos com contexto completo

3. **Fim do Round**
   - Sistema gera resumo automático
   - GEMINI fornece análise completa:
     - Resumo executivo
     - Pontos positivos
     - Pontos de melhoria
     - Lições aprendidas
     - Recomendações para próximo round

## Eventos Monitorados

### Prioridade CRÍTICA
- Ace (5 kills)
- Quad Kill (4 kills)
- Triple Kill (3 kills)
- Bomba plantada/defusando
- Clutch (1vX)
- HP crítico (<15)
- Fim de round

### Prioridade ALTA
- HP baixo (<30)
- Kills rápidas consecutivas
- Início de round
- Match point

### Prioridade MÉDIA
- Mudanças econômicas (>$2000)
- Economia baixa (<$1500)
- Multi-kills (2+)

## Dados Armazenados

### Por Round
```javascript
{
    roundNumber: 5,
    playerName: "João",
    playerSide: "CT",
    startMoney: 4750,
    events: [
        { type: "round_start", data: {...} },
        { type: "triple_kill", data: {...} },
        { type: "bomb_planted", data: {...} }
    ],
    kills: [...],
    deaths: [...],
    damages: [...],
    summary: {
        performance: { kills: 3, deaths: 1, damage: 287 },
        keyEvents: [...],
        roundImpact: 450
    }
}
```

### Estatísticas Acumuladas
- Total de kills/deaths/assists
- Dano total causado
- Clutches tentados/vencidos
- Bombas plantadas/desarmadas
- Taxa de vitória (win rate)
- K/D ratio
- Padrões de jogo detectados

## Integração com GEMINI

O sistema envia para o GEMINI:
1. **Dados GSI limpos** (posição, HP, dinheiro, armas)
2. **Contexto do banco de dados** (histórico, estatísticas)
3. **Eventos importantes** (kills, clutch, bomba)
4. **Análise de padrões** (rush, eco, performance)

## Benefícios

1. **Análise Contextualizada**: GEMINI tem histórico completo
2. **Insights Precisos**: Baseados em dados reais acumulados
3. **Aprendizado Contínuo**: Detecta padrões de jogo
4. **Feedback Personalizado**: Específico para cada jogador
5. **Resumos Detalhados**: Análise completa pós-round

## Configuração

O sistema funciona automaticamente ao iniciar o Coach AI. Não requer configuração adicional.

## Limitações

- Banco de dados em memória (reseta ao fechar o app)
- Máximo de 30 rounds no histórico
- Rate limiting do GEMINI (10 req/min)

## Próximas Melhorias

- Persistência do banco de dados
- Exportação de estatísticas
- Análise pós-partida completa
- Machine learning para previsões 