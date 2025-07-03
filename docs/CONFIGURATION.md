# CS2 Coach AI - Configuration Guide

## 🔧 Sistema de Configuração Centralizado

Este documento descreve como configurar e usar o sistema centralizado de API keys e variáveis de ambiente do CS2 Coach AI.

## 📁 Estrutura de Arquivos

```
coach-ai/
├── config/
│   └── env.example           # Template com todas as variáveis
├── src/
│   └── config/
│       └── environment.js    # Sistema centralizado de configuração
└── .env                      # Suas variáveis (criar baseado no template)
```

## 🚀 Setup Inicial

### 1. Copiar Template de Configuração

```bash
# Copiar template para o arquivo de configuração
cp config/env.example .env
```

### 2. Configurar API Keys Obrigatórias

```bash
# Mínimo necessário para funcionar
GEMINI_API_KEY=sua_key_gemini_aqui

# Para integração com dados externos (recomendado)
TRACKER_GG_API_KEY=sua_key_tracker_gg_aqui
```

### 3. Habilitar Features

```bash
# Habilitar integração com Tracker.gg
ENABLE_TRACKER_GG_INTEGRATION=true

# Outras features (opcional)
ENABLE_DISCORD_BOT=false
ENABLE_TEAM_FEATURES=false
```

## 🎯 Uso no Código

### Importando a Configuração

```javascript
const config = require('./config/environment');

// Verificar se uma API está habilitada
if (config.gamingProviders.trackerGg.enabled) {
    console.log('Tracker.gg está habilitado!');
}

// Obter API key de forma segura
const apiKey = config.getApiKey('gamingProviders', 'trackerGg');
```

### Exemplo Prático

```javascript
const config = require('./config/environment');

class MyService {
    constructor() {
        // Configuração automática baseada no ambiente
        this.aiProvider = this.selectAiProvider();
        this.gamingApis = this.setupGamingApis();
    }
    
    selectAiProvider() {
        // Prioridade: Gemini > OpenAI > Anthropic
        if (config.aiProviders.gemini.enabled) {
            return {
                name: 'gemini',
                apiKey: config.aiProviders.gemini.apiKey,
                maxTokens: config.aiProviders.gemini.maxTokens
            };
        }
        
        if (config.aiProviders.openai.enabled) {
            return {
                name: 'openai',
                apiKey: config.aiProviders.openai.apiKey,
                maxTokens: config.aiProviders.openai.maxTokens
            };
        }
        
        throw new Error('Nenhum AI provider configurado');
    }
    
    setupGamingApis() {
        const apis = {};
        
        if (config.gamingProviders.trackerGg.enabled) {
            apis.trackerGg = new TrackerGgClient();
        }
        
        if (config.gamingProviders.leetify.enabled) {
            apis.leetify = new LeetifyClient();
        }
        
        return apis;
    }
}
```

## 🔑 Guia de API Keys

### Onde Obter as API Keys

| Provider | URL | Descrição |
|----------|-----|-----------|
| **Gemini AI** | [AI Studio](https://aistudio.google.com/app/apikey) | API key gratuita do Google |
| **Tracker.gg** | [Developers](https://tracker.gg/developers) | Estatísticas de jogadores |
| **Steam** | [API Key](https://steamcommunity.com/dev/apikey) | Dados básicos do Steam |
| **FACEIT** | [Developers](https://developers.faceit.com/) | Dados competitivos |
| **Discord** | [Developer Portal](https://discord.com/developers/applications) | Bot token |

### Configuração de Desenvolvimento vs Produção

```bash
# Desenvolvimento - Use test keys quando disponível
NODE_ENV=development
TRACKER_GG_API_KEY=your_main_key
TEST_TRACKER_GG_API_KEY=your_test_key

# Produção - Apenas keys principais + segurança
NODE_ENV=production
JWT_SECRET=your_super_secret_jwt_key
SESSION_SECRET=your_session_secret
ENCRYPTION_KEY=your_encryption_key
```

## 🎛️ Feature Flags

### Features Principais

```bash
# Gaming Data Integration
ENABLE_TRACKER_GG_INTEGRATION=true    # Estatísticas de jogadores
ENABLE_LEETIFY_INTEGRATION=false      # Analytics avançados
ENABLE_HLTV_INTEGRATION=false         # Dados profissionais

# Team Features
ENABLE_DISCORD_BOT=false              # Bot para Discord
ENABLE_TEAM_FEATURES=false            # Recursos para equipes

# Advanced Features
ENABLE_ML_MODELS=false                # Machine Learning
ENABLE_PREMIUM_FEATURES=false         # Recursos premium
```

### Features Beta

```bash
# Beta Testing
ENABLE_BETA_FEATURES=true
BETA_USER_WHITELIST=user1@example.com,user2@example.com
```

## 🔍 Debug e Monitoramento

### Verificar Configuração

```javascript
const config = require('./config/environment');

// Informações de debug
console.log('Debug Info:', config.getDebugInfo());

// Resultado esperado:
{
  environment: 'development',
  enabledAiProviders: ['gemini'],
  enabledGamingProviders: ['trackerGg'],
  enabledFeatures: ['trackerGgIntegration'],
  securityConfigured: false
}
```

### Logging de Configuração

```bash
# Habilitar logs detalhados
DEBUG_MODE=true
VERBOSE_LOGGING=true
LOG_LEVEL=debug
```

## 🛡️ Segurança

### Secrets Obrigatórios (Produção)

```bash
# NUNCA commitar estes valores!
JWT_SECRET=sua_chave_jwt_super_secreta_aqui
SESSION_SECRET=sua_chave_de_sessao_aqui  
ENCRYPTION_KEY=sua_chave_de_criptografia_aqui
```

### Boas Práticas

1. **Nunca commitar o arquivo `.env`**
2. **Use valores diferentes entre desenvolvimento e produção**
3. **Rotacione keys regularmente**
4. **Use test keys em desenvolvimento quando disponível**
5. **Valide secrets obrigatórios no startup**

## 🔄 Rate Limiting

### Configuração de Limites

```bash
# Requests per minute
TRACKER_GG_RATE_LIMIT=100
LEETIFY_RATE_LIMIT=60
STEAM_RATE_LIMIT=100

# Token limits para AI
GEMINI_MAX_TOKENS=1000
OPENAI_MAX_TOKENS=1000
```

### Uso no Código

```javascript
const config = require('./config/environment');

class ApiClient {
    constructor() {
        this.rateLimit = config.gamingProviders.trackerGg.rateLimit;
        this.rateLimiter = new RateLimiter(this.rateLimit, '1m');
    }
    
    async makeRequest() {
        await this.rateLimiter.wait();
        // ... fazer requisição
    }
}
```

## 🏗️ Ambientes de Deploy

### Desenvolvimento Local

```bash
NODE_ENV=development
DEBUG_MODE=true
# Apenas keys essenciais
```

### Staging/Testing

```bash
NODE_ENV=staging
# Test keys quando disponível
# Monitoramento básico
```

### Produção

```bash
NODE_ENV=production
# All production keys
# Full monitoring
# Security secrets
```

## 🆘 Troubleshooting

### Problemas Comuns

1. **Erro: "Provider não encontrado"**
   - Verificar se a API key está configurada no `.env`
   - Verificar se a feature flag está habilitada

2. **Erro: "Variáveis obrigatórias não encontradas"**
   - Verificar se pelo menos um AI provider está configurado
   - Em produção, verificar se todos os secrets estão definidos

3. **Rate Limiting**
   - Ajustar limites no `.env`
   - Implementar cache para reduzir requisições

### Debug Commands

```bash
# Verificar configuração atual
node -e "console.log(require('./src/config/environment').getDebugInfo())"

# Testar API key específica
node -e "console.log(require('./src/config/environment').getApiKey('gamingProviders', 'trackerGg'))"
```

## 📊 Exemplo Completo

### .env de Desenvolvimento

```bash
# AI Provider
GEMINI_API_KEY=AIza...your_key_here

# Gaming APIs
TRACKER_GG_API_KEY=your_tracker_key_here
ENABLE_TRACKER_GG_INTEGRATION=true

# Application
NODE_ENV=development
DEBUG_MODE=true
LOG_LEVEL=debug

# GSI
GSI_PORT=3000
GSI_AUTH_TOKEN=coach-ai-2024
```

### Uso no Main App

```javascript
const config = require('./src/config/environment');
const TrackerGgClient = require('./src/utils/trackerGgPoc');

class CoachAI {
    constructor() {
        this.validateConfiguration();
        this.setupServices();
    }
    
    validateConfiguration() {
        console.log('[CONFIG] Validando configuração...');
        console.log('[CONFIG] AI Providers:', config.getDebugInfo().enabledAiProviders);
        console.log('[CONFIG] Gaming APIs:', config.getDebugInfo().enabledGamingProviders);
        
        if (!config.aiProviders.gemini.enabled && !config.aiProviders.openai.enabled) {
            throw new Error('Nenhum AI provider configurado!');
        }
    }
    
    setupServices() {
        // Setup automático baseado na configuração
        this.services = {};
        
        if (config.gamingProviders.trackerGg.enabled) {
            this.services.trackerGg = new TrackerGgClient();
            console.log('[CONFIG] Tracker.gg habilitado');
        }
        
        // Outros serviços...
    }
}

module.exports = CoachAI;
```

---

**Este sistema garante que todas as API keys e configurações estejam centralizadas, seguras e fáceis de gerenciar!** 🔐✨ 