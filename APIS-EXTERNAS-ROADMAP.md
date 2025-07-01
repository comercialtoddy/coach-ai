# 🌐 ROADMAP: INTEGRAÇÃO APIS EXTERNAS - CS2 Coach AI

## 📋 **VISÃO GERAL**

Este documento descreve como integrar **Steam Web API** e **Tracker.gg API** para expandir significativamente as capacidades do CS2 Coach AI com dados históricos e estatísticas avançadas.

---

## 🎯 **APIS DISPONÍVEIS**

### **1. Steam Web API**
- **Estatísticas de longo prazo**
- **Conquistas e progressão**
- **Lista de amigos e status**
- **Histórico de performance**

### **2. Tracker.gg API** 
- **Estatísticas competitivas** (limitado)
- **Ranking e progresso**
- **Comparações com comunidade**
- **Análises de performance**

---

## 🔑 **CONFIGURAÇÃO STEAM WEB API**

### **Obter API Key:**
1. Acesse: https://steamcommunity.com/dev/apikey
2. Registre domínio/aplicação
3. Copie a API Key

### **Implementação Proposta:**
```javascript
// src/utils/steamClient.js
class SteamWebClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.steampowered.com';
    }
    
    async getPlayerStats(steamId) {
        // ISteamUserStats/GetUserStatsForGame
        // Retorna: kills, deaths, assists, playtime, etc.
    }
    
    async getPlayerAchievements(steamId) {
        // ISteamUserStats/GetPlayerAchievements  
        // Retorna: conquistas desbloqueadas, progresso
    }
    
    async getFriendsList(steamId) {
        // ISteamUser/GetFriendList
        // Retorna: amigos para lobby/team building
    }
}
```

### **Dados Valiosos Disponíveis:**
- **Total playtime** - Experiência geral
- **Kill/Death ratio** - Performance histórica  
- **Headshot percentage** - Precisão
- **Bomb plants/defuses** - Especialização tática
- **Map preferences** - Expertise por mapa

---

## 🎮 **CONFIGURAÇÃO TRACKER.GG API**

### **Limitações Atuais:**
⚠️ **CS:GO/CS2 não suportado** - API limitada a:
- Apex Legends
- The Division 2
- Splitgate (descontinuado)

### **Implementação Futura (se disponível):**
```javascript
// src/utils/trackerClient.js
class TrackerGGClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://public-api.tracker.gg/v2';
    }
    
    async getPlayerProfile(platform, username) {
        // Retornaria: rank, stats, recent matches
    }
    
    async getPlayerStats(platform, username) {
        // Retornaria: performance metrics, trends
    }
}
```

---

## 🚀 **IMPLEMENTAÇÃO ESTRATÉGICA**

### **Fase 1: Steam Web API Integration**
```javascript
// Integração com AutoAnalyzer existente
class EnhancedAutoAnalyzer extends AutoAnalyzer {
    constructor(geminiClient, overlayWindow, steamClient) {
        super(geminiClient, overlayWindow);
        this.steamClient = steamClient;
        this.playerProfile = null;
    }
    
    async initializePlayerProfile(gameData) {
        const steamId = gameData.provider?.steamid;
        if (steamId && !this.playerProfile) {
            this.playerProfile = await this.steamClient.getPlayerStats(steamId);
        }
    }
    
    generateContextualInsight(gameData, strategicMoment) {
        // Combinar dados GSI em tempo real com perfil Steam
        const context = {
            current: gameData,
            historical: this.playerProfile,
            moment: strategicMoment
        };
        
        // Prompt personalizado baseado em histórico
        return this.createPersonalizedPrompt(context);
    }
}
```

### **Insights Aprimorados com Steam Data:**

#### **Análise de Performance:**
```javascript
if (gameData.player.state.round_kills >= 2) {
    const avgKD = this.playerProfile.kd_ratio;
    if (avgKD < 1.0) {
        return "🎯 Excelente! Multi-kill acima da sua média histórica!";
    } else {
        return "🔥 Mantendo sua performance consistente!";
    }
}
```

#### **Recomendações Econômicas:**
```javascript
if (gameData.player.state.money < 2000) {
    const ecoWinRate = this.playerProfile.eco_round_wins / this.playerProfile.eco_rounds;
    if (ecoWinRate > 0.3) {
        return "💪 Você tem boa taxa de eco rounds - force!";
    } else {
        return "🛡️ Jogue mais conservador - sua taxa eco é baixa";
    }
}
```

#### **Especialização por Mapa:**
```javascript
if (gameData.map.name === 'de_dust2') {
    const dust2WinRate = this.playerProfile.maps.de_dust2.win_rate;
    if (dust2WinRate > 0.6) {
        return "🏆 Dust2 é seu forte - seja agressivo!";
    } else {
        return "📚 Dust2 precisa prática - jogue mais seguro";
    }
}
```

---

## 📊 **ESTRUTURA DE DADOS EXPANDIDA**

### **Perfil Steam Exemplo:**
```javascript
{
    steamId: "76561198...",
    totalPlaytime: 1247, // horas
    stats: {
        kills: 15420,
        deaths: 12180,
        assists: 3240,
        kd_ratio: 1.27,
        headshot_percentage: 0.42,
        bomb_plants: 245,
        bomb_defuses: 180,
        eco_rounds: 890,
        eco_round_wins: 267
    },
    maps: {
        de_dust2: { wins: 89, losses: 67, win_rate: 0.57 },
        de_mirage: { wins: 102, losses: 58, win_rate: 0.64 },
        // ... outros mapas
    },
    achievements: {
        expert_marksman: true,
        clutch_master: false,
        // ... outras conquistas
    }
}
```

---

## 🔮 **FUNCIONALIDADES FUTURAS**

### **1. Coaching Personalizado**
- **Pontos fracos** identificados via histórico
- **Recomendações específicas** por mapa/situação
- **Metas progressivas** baseadas em conquistas

### **2. Análise Comparativa**
- **Performance vs amigos** Steam
- **Rank prediction** baseado em stats
- **Áreas de melhoria** priorizadas

### **3. Team Building**
- **Compatibilidade de playstyle** com amigos
- **Sugestões de roles** por player
- **Estratégias de equipe** personalizadas

### **4. Progression Tracking**
- **Metas semanais/mensais**
- **Tracking de melhoria**
- **Celebração de marcos**

---

## 🛠️ **IMPLEMENTAÇÃO TÉCNICA**

### **Estrutura de Arquivos:**
```
src/
├── utils/
│   ├── steamClient.js        # Steam Web API
│   ├── trackerClient.js      # Tracker.gg API (futuro)
│   ├── profileManager.js     # Gerencia perfis combinados
│   └── enhancedAnalyzer.js   # AutoAnalyzer + APIs externas
├── coach/
│   ├── personalizedPrompts.js # Prompts baseados em histórico
│   └── progressionAnalyzer.js # Análise de progressão
└── storage/
    ├── playerProfiles.json   # Cache de perfis
    └── performanceHistory.json # Histórico de sessões
```

### **Fluxo de Integração:**
```
1. GSI Data (Tempo Real) → AutoAnalyzer
2. Steam API (Histórico) → ProfileManager  
3. Dados Combinados → EnhancedAnalyzer
4. Gemini + Context → Insights Personalizados
5. Overlay Display → Coaching Avançado
```

---

## 💡 **BENEFÍCIOS ESPERADOS**

### **Para o Jogador:**
- **Coaching 100% personalizado** baseado em histórico
- **Identificação de padrões** de performance
- **Metas realistas** e progressão clara
- **Insights profundos** sobre pontos fortes/fracos

### **Para o Sistema:**
- **Prompts mais contextualizados** para Gemini
- **Cache inteligente** para reduzir API calls
- **Análises longitudinais** de melhoria
- **Feedback loop** para otimização contínua

---

## 🚦 **STATUS DE IMPLEMENTAÇÃO**

| Componente | Status | Prioridade | ETA |
|------------|--------|------------|-----|
| Steam Web API | 🟡 Planejado | Alta | Q1 2024 |
| Profile Manager | 🟡 Planejado | Alta | Q1 2024 |
| Enhanced Analyzer | 🟡 Planejado | Média | Q2 2024 |
| Tracker.gg API | 🔴 Bloqueado | Baixa | TBD |
| Progression System | 🟡 Planejado | Média | Q2 2024 |

---

**🎯 Esta integração transformará o CS2 Coach AI de um overlay tático para um sistema completo de desenvolvimento de habilidades!** 