# CS2 Coach AI - Guia de Configuração Completo

## 🎯 Visão Geral

Este guia mostra como configurar e usar todas as funcionalidades do CS2 Coach AI, incluindo as implementações avançadas baseadas no guia completo de overlay para CS2 e integração com agentes LLM.

## 📋 Pré-requisitos

### Obrigatórios
- **Node.js** (versão 16 ou superior)
- **Electron** (incluído nas dependências)
- **Counter-Strike 2** instalado
- **Gemini API Key** (Google AI Studio)

### Opcionais (para funcionalidades avançadas)
- **Steam Web API Key** (para dados de perfil)
- **Tracker.gg API Key** (para estatísticas detalhadas)
- **Tesseract OCR** (para reconhecimento de texto na tela)
- **Text-to-Speech engines** (sistema dependente)

## 🔧 Configuração Inicial

### 1. Configuração do Game State Integration (GSI)

O GSI é o coração do sistema - permite que o CS2 envie dados em tempo real para o Coach AI.

**Passo 1:** Copie o arquivo de configuração GSI
```bash
# Copie o arquivo para o diretório do CS2
cp config/gamestate_integration_cs2coach.cfg "C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg\"
```

**Passo 2:** Verifique o conteúdo do arquivo
```
"CS2 Coach AI v.1.0"
{
    "uri"               "http://127.0.0.1:3000"
    "timeout"           "5.0"
    "buffer"            "0.1"
    "throttle"          "0.5"
    "heartbeat"         "60.0"
    "auth"
    {
        "token"         "cs2-coach-ai-secure-token-2024"
    }
    "data"
    {
        "provider"              "1"
        "map"                   "1"
        "round"                 "1"
        "player_id"             "1"
        "player_state"          "1"
        "player_weapons"        "1"
        "player_match_stats"    "1"
        "allplayers"            "1"
        "bomb"                  "1"
        "phase_countdowns"      "1"
        "allgrenades"           "1"
        "map_round_wins"        "1"
    }
}
```

### 2. Configuração das Chaves de API

**Gemini API (Obrigatório):**
```bash
# Opção 1: Variável de ambiente
export GEMINI_API_KEY="sua_chave_gemini_aqui"

# Opção 2: Arquivo de configuração
echo "sua_chave_gemini_aqui" > src/config/gemini.key
```

**Steam Web API (Opcional):**
```bash
export STEAM_API_KEY="sua_chave_steam_aqui"
```

**Tracker.gg API (Opcional):**
```bash
export TRACKER_GG_API_KEY="sua_chave_tracker_gg_aqui"
```

### 3. Instalação de Dependências Opcionais

**Para OCR (Reconhecimento de Texto):**
```bash
# Windows (via Chocolatey)
choco install tesseract

# Linux
sudo apt-get install tesseract-ocr

# macOS
brew install tesseract
```

**Para Text-to-Speech:**
```bash
# Windows: Nativo (SAPI)
# macOS: Nativo (say)
# Linux:
sudo apt-get install espeak
```

## 🚀 Iniciando o Sistema

### Método 1: Comando Básico
```bash
npm start
```

### Método 2: Com Configurações Específicas
```bash
# Modo debug
NODE_ENV=development npm start

# Com todas as funcionalidades
GEMINI_API_KEY=sua_chave STEAM_API_KEY=sua_chave_steam npm start
```

## ⚙️ Configuração Avançada

### Personalização via Interface

O CS2 Coach AI possui um sistema de configuração avançado com presets:

**Presets Disponíveis:**
- `beginner` - Para jogadores iniciantes
- `intermediate` - Para jogadores intermediários 
- `advanced` - Para jogadores avançados
- `professional` - Para jogadores profissionais
- `minimal` - Configuração minimalista

### Configuração Manual

Edite o arquivo `config/user_config.json` para personalização completa:

```json
{
  "analysis": {
    "frequency": "medium",
    "autoAnalysisEnabled": true,
    "focusAreas": ["positioning", "economy", "tactics"]
  },
  "coaching": {
    "style": "balanced",
    "personality": "supportive",
    "detailLevel": "medium"
  },
  "voice": {
    "enabled": false,
    "rate": 1.2,
    "volume": 0.7
  },
  "overlay": {
    "opacity": 0.9,
    "position": "top-right",
    "theme": "dark"
  }
}
```

## 🎮 Funcionalidades Principais

### 🤖 Sistema Master Integration (NOVO)

**O que é:**
O Master Integration é o sistema central que coordena todas as funcionalidades do CS2 Coach AI.

**Funcionalidades:**
- **Análise Integrada:** Combina dados GSI + APIs + OCR em uma única análise
- **Configuração Dinâmica:** Mudanças aplicadas em tempo real
- **Sistema de Eventos:** Comunicação entre todos os sistemas
- **Cache Unificado:** Performance otimizada
- **Fallbacks Inteligentes:** Graceful degradation quando sistemas falham

**Controles via Hotkeys:**
- `F8` - Toggle Text-to-Speech
- `F7` - Toggle Análise Automática  
- `F6` - Análise Manual
- `Ctrl+T` - Toggle TTS (no overlay)
- `Ctrl+A` - Toggle Auto Analysis (no overlay)
- `Ctrl+M` - Manual Analysis (no overlay)
- `Ctrl+S` - Speak Last Insight (no overlay)

**Comandos de Debug (Console):**
```javascript
// Acessar comandos de debug
window.debugCommands

// Exemplos
window.debugCommands.toggleTTS()
window.debugCommands.applyProfessionalPreset()
window.debugCommands.getPlayerData('steamid')
window.debugCommands.testTTS('Hello from CS2 Coach AI')
```

### 1. Análise Automática em Tempo Real

**O que faz:**
- Analisa automaticamente eventos importantes do jogo
- Fornece conselhos táticos baseados na situação atual
- Adapta-se ao seu estilo de jogo

**Eventos detectados:**
- Início de round
- Bomba plantada
- Situações de clutch
- Mudanças econômicas
- HP crítico
- Vantagens táticas

### 2. Sistema de Prompts Elite

**Características:**
- Prompts especializados por contexto
- Otimização automática de tokens
- Inferência estratégica avançada
- Análise preditiva

### 3. Integração com APIs Externas

**Steam Web API:**
- Perfil do jogador
- Estatísticas do CS2
- Histórico de jogos

**Tracker.gg:**
- Estatísticas detalhadas
- Histórico de partidas
- Rankings e comparações

**HLTV:**
- Rankings de equipes
- Próximos jogos profissionais
- Contexto competitivo

### 4. Sistema OCR (Reconhecimento Óptico)

**Dados extraídos:**
- Economia inimiga
- Scoreboard completo
- Timer da bomba
- Informações de spectator

### 5. Text-to-Speech (Feedback Audível)

**Configurações:**
- Voz masculina/feminina
- Velocidade ajustável
- Volume personalizado
- Priorização por tipo de evento

## 🛡️ Segurança VAC

### ✅ Métodos Seguros Utilizados

1. **Game State Integration (GSI)**
   - API oficial da Valve
   - Sem interação direta com o processo do jogo
   - 100% VAC-safe

2. **Overlay Externo**
   - Janela separada sobreposta
   - Sem injeção de DLL
   - Sem modificação de memória

3. **OCR (Screen Reading)**
   - Captura de tela externa
   - Sem acesso à memória do jogo
   - Processamento independente

### ❌ O que NÃO é usado

- Injeção de DLL
- Leitura/escrita de memória
- Hooks no processo do jogo
- Modificação de arquivos do jogo

## 🔧 Resolução de Problemas

### Problema: GSI não está enviando dados

**Soluções:**
1. Verifique se o arquivo GSI está no diretório correto
2. Confirme que o CS2 está em execução
3. Teste a conexão: `curl http://localhost:3000`
4. Verifique os logs do console

### Problema: IA não está respondendo

**Soluções:**
1. Verifique a chave da API Gemini
2. Confirme conexão com a internet
3. Verifique rate limiting (10 requests/minuto)
4. Consulte logs de erro

### Problema: Overlay não aparece

**Soluções:**
1. Pressione F9 para toggle
2. Verifique se está em modo fullscreen
3. Confirme configurações de transparência
4. Reinicie o aplicativo

### Problema: TTS não funciona

**Soluções:**
1. Verifique se está habilitado na configuração
2. Confirme engine TTS instalado no sistema
3. Teste volume do sistema
4. Verifique logs de erro TTS

## 📊 Monitoramento e Status

### Verificar Status do Sistema

O sistema fornece informações detalhadas sobre o status:

```javascript
// Via console do overlay (F12)
console.log('Status:', window.CoachAI.getSystemStatus());
```

### Estatísticas Disponíveis

- Uptime do sistema
- Requests processados
- Taxa de acerto do cache
- Erros por sistema
- Performance da IA

## 🎯 Otimização de Performance

### Configurações para Performance

```json
{
  "performance": {
    "tokenOptimization": true,
    "cacheEnabled": true,
    "rateLimiting": true,
    "maxConcurrentRequests": 2,
    "memoryOptimization": true
  }
}
```

### Dicas de Otimização

1. **Cache:** Mantém dados frequentes em memória
2. **Rate Limiting:** Evita sobrecarga da API
3. **Token Optimization:** Reduz custos da IA
4. **Memory Management:** Limpeza automática de dados antigos

## 🔄 Atualizações e Manutenção

### Backup da Configuração

```bash
# Exportar configuração atual
cp config/user_config.json backup/user_config_backup.json
```

### Limpeza de Cache

```bash
# Limpar cache temporário
rm -rf temp/*
```

### Atualização do Sistema

```bash
# Baixar atualizações
git pull origin master

# Instalar novas dependências
npm install

# Reiniciar sistema
npm start
```

## 🆘 Suporte e Comunidade

### Logs de Debug

Para ativar logs detalhados:
```bash
NODE_ENV=development npm start
```

### Relatórios de Erro

Ao reportar problemas, inclua:
1. Versão do sistema
2. Configuração atual
3. Logs de erro
4. Passos para reproduzir

### Recursos Adicionais

- **Documentação:** `docs/`
- **Exemplos:** `examples/`
- **Configurações:** `config/`
- **Logs:** `logs/`

---

## 📝 Changelog

### v1.0.0 - Implementação Completa
- ✅ Sistema GSI completo
- ✅ Integração Gemini 2.5 Flash
- ✅ APIs externas (Steam, Tracker.gg, HLTV)
- ✅ Sistema OCR VAC-safe
- ✅ Text-to-Speech avançado
- ✅ Configuração personalizada
- ✅ Sistema de prompts Elite
- ✅ Overlay responsivo
- ✅ Análise automática inteligente

---

**CS2 Coach AI** - Sistema de coaching Tier 1 para Counter-Strike 2
*VAC-Safe • IA Avançada • Performance Otimizada* 