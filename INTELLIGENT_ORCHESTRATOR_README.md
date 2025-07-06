# 🧠 Intelligent Orchestrator - Sistema de Coaching Personalizado

O **Intelligent Orchestrator** substituiu o `autoAnalyzer.js` com uma arquitetura modular avançada, aprendizado de jogador e **uso obrigatório do TTS (Text-to-Speech)**.

## 🎯 Principais Funcionalidades

### 1. Orquestração Inteligente
- Micro-serviços especializados para diferentes aspectos do jogo
- Decisões estratégicas baseadas no perfil do jogador
- Processamento de requisições com sistema de prioridades
- Modo de emergência para situações críticas

### 2. Aprendizado de Jogador
- Perfil personalizado que evolui com o tempo
- Análise de estilo de jogo (agressividade, trabalho em equipe, etc.)
- Adaptação automática das respostas baseada no comportamento
- Histórico de aprendizado para melhorar recomendações

### 3. TTS Obrigatório
- Todo coaching é falado usando o sistema TTS
- Prioridades diferentes para situações críticas vs normais
- Adaptação do texto para comunicação verbal
- Configuração automática de voz e velocidade

## 🏗️ Arquitetura de Micro-Serviços

### Serviços Táticos
- **PositioningService**: Análise de posicionamento
- **EconomyService**: Gestão econômica
- **TeamworkService**: Coordenação de equipe
- **AimingService**: Técnicas de mira
- **MovementService**: Movimentação e deslocamento

### Serviços Estratégicos
- **GameplanService**: Planejamento de jogo
- **AdaptationService**: Adaptação ao oponente
- **PredictionService**: Predição de situações

### Serviços Psicológicos
- **MotivationService**: Motivação e foco
- **PressureService**: Gerenciamento de pressão
- **ConfidenceService**: Construção de confiança

### Serviços de Comunicação
- **CalloutsService**: Callouts eficazes
- **FeedbackService**: Feedback personalizado
- **TeachingService**: Ensino e aprendizagem

## 🎮 Perfil do Jogador

O sistema mantém um perfil completo do jogador que inclui:

- **Preferências de comunicação**: verbal, text, balanced
- **Nível de detalhamento**: high, medium, low
- **Foco preferido**: tactical, strategic, economic
- **Estilo de jogo**: agressividade, trabalho em equipe, economia, etc.
- **Adaptações**: estilo de resposta, encorajamento, criticidade

## 🔄 Fluxo de Processamento

1. **Recebimento de dados GSI**
2. **Detecção de eventos**
3. **Análise de relevância**
4. **Criação de requisição estratégica**
5. **Execução de micro-serviços**
6. **Geração de coaching personalizado**
7. **Entrega via TTS (obrigatório)**

## 🎤 Sistema TTS Integrado

- **Configuração automática** de voz e velocidade
- **Prioridades de fala**: Critical, Normal, Low
- **Adaptação para TTS**: limpeza de texto, substituições
- **Interrupção inteligente** para situações críticas

## 🚨 Modo de Emergência

Ativado quando:
- Vida < 20 HP
- Bomba plantada
- Match point
- Situação de clutch

Comportamento:
- Limpa fila de requisições
- Para TTS atual
- Prioridade máxima
- Respostas mais diretas

## 🎯 Uso Prático

```javascript
const orchestrator = new IntelligentOrchestrator(geminiClient, overlayWindow);
await orchestrator.init();

// Processamento automático
orchestrator.updateGameState(gameData);

// Análise manual
const result = await orchestrator.performManualAnalysis(gameData, 'manual_analysis');
```

## 🔧 Controle

### Hotkeys Globais
- **F6**: Análise manual
- **F7**: Toggle análise automática
- **F8**: Toggle TTS
- **F9**: Toggle overlay
- **F10**: Toggle eventos do mouse

### Comandos IPC
- `master-update-config`: Configuração
- `master-perform-analysis`: Análise manual
- `master-speak`: TTS direto

## 📊 Vantagens

### Sobre o Sistema Anterior
- **Modularidade**: Cada aspecto é um serviço independente
- **Personalização**: Coaching único por jogador
- **Eficiência**: Processamento apenas quando necessário
- **Experiência**: TTS sempre ativo, coaching natural

### Funcionalidades Avançadas
- Aprendizado contínuo do estilo do jogador
- Adaptação automática das respostas
- Micro-serviços especializados
- Sistema de prioridades inteligente
- Modo de emergência para situações críticas

## 🚀 Implementação

O sistema foi implementado para:
1. **Substituir completamente** o autoAnalyzer.js
2. **Manter compatibilidade** com IPC handlers existentes
3. **Integrar obrigatoriamente** o sistema TTS
4. **Fornecer coaching personalizado** baseado no perfil do jogador
5. **Organizar recursos** em micro-serviços estratégicos

---

**Resultado:** Um sistema de coaching muito mais inteligente, personalizado e eficiente que aprende com o jogador e oferece uma experiência imersiva através do TTS obrigatório. 