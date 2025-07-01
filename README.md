# 🎯 CS2 Coach AI - Competitive Overlay

## 📋 Visão Geral

Overlay competitivo para Counter-Strike 2 integrado com **Gemini 2.5 Flash AI**, oferecendo coaching tático em tempo real através de uma interface limpa e não-intrusiva.

### ✨ Características Principais

- **🤖 AI Coach Integrado**: Powered by Gemini 2.5 Flash
- **🎮 Overlay Não-Intrusivo**: Respeita o FOV do CS2
- **⚡ Tempo Real**: Dados via CS2 GSI (Game State Integration)
- **🎨 Design Limpo**: Paleta minimalista em tons neutros
- **🚀 Alto Performance**: Otimizado para resolução 1920x1080
- **⌨️ Atalhos Globais**: Controle rápido sem sair do jogo

---

## 🚀 Instalação Rápida

### Pré-requisitos
- Node.js 18+ 
- Windows 10/11
- Counter-Strike 2
- Chave API do Google Gemini

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/coach-ai.git
cd coach-ai
```

2. **Instale dependências**
```bash
npm install
```

3. **Configure API Key**
```bash
# Opção 1: Arquivo de configuração
echo "sua_chave_api_aqui" > src/config/gemini.key

# Opção 2: Variável de ambiente
cp .env.example .env
# Edite o arquivo .env com sua chave
```

4. **Execute**
```bash
npm start
```

---

## ⚙️ Configuração do CS2

### Habilitar GSI

1. Copie o arquivo de configuração:
```bash
cp gamestate_integration_coachai.cfg "C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg\"
```

2. No CS2, execute no console:
```
exec gamestate_integration_coachai.cfg
```

### Verificar Conexão
- O overlay deve mostrar status verde no AI Coach
- Dados do jogo aparecerão em tempo real

---

## 🎮 Como Usar

### Atalhos Globais
- **F9**: Toggle overlay visibilidade
- **F10**: Toggle eventos do mouse (para configuração)
- **Ctrl+Shift+F12**: Fechar aplicação

### Interação com AI Coach
1. Digite sua pergunta no campo inferior (max 400 chars)
2. Pressione Enter ou clique em "Send"
3. Receba coaching tático personalizado

### Exemplos de Perguntas
```
"Como melhorar minha economia?"
"Que posição devo segurar em Mirage?"
"Quando fazer força-buy?"
"Como usar smokes no site A?"
```

---

## 🧩 Componentes do Overlay

### Layout Limpo e Não-Intrusivo

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                 Campo de Visão                       │
│                   CS2 FOV                           │
│                NÃO OBSTRUÍDO                        │
│                                                      │
│                                                      │
│              ┌─────────────────┐                     │
│              │  AI Coach Panel │                     │
│              ├─────────────────┤                     │
│              │   Input Area    │                     │
│              └─────────────────┘                     │
└──────────────────────────────────────────────────────┘
```

### Componente Único

**🤖 AI Coach Interface**: Interface limpa com duas seções:
- **Coach Panel**: Respostas do Gemini 2.5 Flash  
- **Input Area**: Campo de texto + contador de caracteres (400 max)

---

## 🎨 Personalização

### Paleta de Cores

| Elemento | Cor | Uso |
|----------|-----|-----|
| `--bg-primary` | #2A2A2A | Fundo principal |
| `--bg-secondary` | #3A3A3A | Bordas/contêineres |
| `--active-primary` | #4A9E5A | Elementos ativos |
| `--text-primary` | #FFFFFF | Texto principal |
| `--text-secondary` | #CCCCCC | Texto auxiliar |

### Modificar Estilos

Edite os arquivos em `src/themes/clean-coach/vars/`:
- `colors.css` - Paleta de cores
- `sizes.css` - Dimensões e espaçamentos

---

## 🔧 Desenvolvimento

### Estrutura do Projeto

```
src/
├── themes/clean-coach/     # Overlay UI
│   ├── index.html         # Estrutura HTML
│   ├── index.css          # Estilos principais  
│   ├── shell.js           # Lógica JavaScript
│   └── vars/              # Variáveis CSS
├── coach/                 # Sistema de IA
│   └── prompt.js          # Prompts especializados
├── main/                  # Electron main process
│   └── main.js            # Processo principal
└── utils/                 # Utilitários
    └── geminiClient.js    # Cliente Gemini
```

### Scripts Disponíveis

```bash
npm start       # Executar aplicação
npm run dev     # Modo desenvolvimento
npm run build   # Build para produção
npm test        # Executar testes
```

### Debug

Para desenvolvimento, habilite o console:
```bash
NODE_ENV=development npm start
```

---

## 🤖 Sistema de IA

### Prompts Especializados

O sistema usa templates contextuais para diferentes situações:

- **Tactical**: Dicas gerais de gameplay
- **Economy**: Gestão econômica
- **Positioning**: Posicionamento e movimento  
- **Utility**: Uso de granadas
- **Analysis**: Análise pós-round

### Estilos de Resposta

- **Quick** (≤100 chars): Respostas diretas
- **Detailed** (≤200 chars): Explicações completas
- **Urgent** (≤50 chars): Ações imediatas

---

## 📊 Performance

### Otimizações Implementadas

- ✅ Rate limiting (60 req/min)
- ✅ Histórico limitado (10 interações)
- ✅ Respostas cacheadas  
- ✅ Fallbacks offline
- ✅ CSS otimizado para 60fps

### Requisitos do Sistema

- **RAM**: 256MB+ para overlay
- **CPU**: Impacto <2% em gaming
- **GPU**: Transparência nativa
- **Rede**: ~1KB/s para GSI + API calls

---

## 🛠️ Troubleshooting

### Problemas Comuns

**❌ Overlay não aparece**
```bash
# Verificar se está rodando
tasklist | findstr "electron"

# Tentar atalho F9 para toggle
```

**❌ AI não responde**
```bash
# Verificar chave API
echo %GEMINI_API_KEY%

# Verificar conectividade
curl -I https://generativelanguage.googleapis.com
```

**❌ CS2 GSI não funciona**
- Verificar arquivo cfg em `csgo/cfg/`
- Executar `exec gamestate_integration_coachai.cfg` no console
- Verificar porta 3000 livre

### Logs e Debug

Logs estão em:
- Console do Electron (F12 no overlay)
- Terminal onde executou `npm start`

---

## 🔒 Privacidade e Segurança

### Dados Enviados para Gemini
- ✅ Apenas texto das perguntas
- ✅ Contexto básico do jogo (HP, economia, mapa)
- ❌ Nenhum dado pessoal identificável
- ❌ Screenshots ou áudio

### Dados Armazenados Localmente
- Histórico de conversação (10 últimas)
- Configurações do overlay
- Logs de debug (se habilitado)

---

## 📋 Checklist de Validação

### ✅ Revisão 1: Funcionalidade Básica
- [x] Overlay posicionado corretamente (centro inferior)
- [x] Não obstrui FOV do CS2 (campo de visão livre)
- [x] Atalhos globais funcionando
- [x] Interface responsiva e minimalista
- [x] Paleta de cores aplicada
- [x] Input com limite 400 chars

### ✅ Revisão 2: Integração IA
- [x] Gemini 2.5 Flash conectado
- [x] Prompts especializados carregados
- [x] Rate limiting implementado
- [x] Fallbacks funcionando
- [x] Histórico de conversação
- [x] Análise de contexto ativa

### ✅ Revisão 3: Não-Intrusividade CS2
- [x] **REMOVIDOS** elementos que duplicam HUD CS2:
  - [x] Mini mapa (CS2 já tem radar)
  - [x] Player tracker (CS2 já mostra status da equipe)  
  - [x] Timer de round (CS2 já tem cronômetro)
  - [x] Dicas táticas mock (removido simulação)
- [x] GSI Server para contexto real (porta 3000)
- [x] Performance otimizada
- [x] **APENAS** AI Coach interface mantida

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie branch para feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para branch (`git push origin feature/nova-funcionalidade`)
5. Abra Pull Request

---

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

## 🙏 Agradecimentos

- **Valve** pelo CS2 e Game State Integration
- **Google** pelo Gemini 2.5 Flash API
- **Electron** pela plataforma de overlay
- **Comunidade CS** pelo feedback e testes

---

## 🎯 CS2 Coach AI - Detecção de Lado (CT/TR) Implementada

O **CS2 Coach AI** agora detecta automaticamente qual lado você está jogando (Counter-Terrorist ou Terrorist) e fornece **estratégias específicas** para cada situação!

## 🚀 Nova Funcionalidade: Detecção de Lado

### ✨ O que foi implementado:

#### 1. **Detecção Automática de Lado**
- 🔵 **CT (Counter-Terrorist)**: Estratégias defensivas
- 🟠 **TR (Terrorist)**: Estratégias ofensivas  
- 🔄 **Mudança de Lado**: Detecta automaticamente quando você troca de time

#### 2. **Insights Táticos Específicos por Lado**

**Como CT:**
- 🛡️ Posicionamento defensivo otimizado
- 💨 Coordenação de smoke walls e utility
- 🔄 Timing de rotações baseado em intel
- 💣 Estratégias de retomada e defuse

**Como TR:**
- ⚡ Execuções coordenadas e timing
- 🎯 Early picks e isolamento de CTs
- 💣 Priorização de sites para plant
- 🚀 Post-plant positioning

#### 3. **Análises Contextuais Melhoradas**
- 📊 Economia específica por lado
- ⚔️ Match point com estratégias de fechamento
- 🩸 HP crítico com posicionamento por role
- 🔫 Situações de clutch adaptadas

## 📋 Como Funciona

### 1. **Dados GSI Expandidos**
O sistema agora lê o campo `player.team` do Game State Integration e detecta:

```javascript
// Dados enviados para o GEMINI incluem:
LADO: COUNTER-TERRORIST (CT)
OBJETIVO: Defender bombsites e eliminar terrorists
```

### 2. **Prompts Específicos**
O GEMINI recebe contexto especializado:

- `ct_strategy`: Táticas defensivas profissionais
- `tr_strategy`: Estratégias ofensivas coordenadas  
- `side_switch`: Adaptação imediata na troca de lado

### 3. **Cooldowns Inteligentes**
- Mudança de lado: 5s (detecção rápida)
- Estratégias CT: 20s (análises profundas)
- Estratégias TR: 20s (execuções complexas)

## 🎮 Experiência de Jogo

### Interface Simplificada - APENAS Auto-Insights:
```
┌─────────────────────────────────┐
│ 🟢 AI Coach                     │
│ ┌─────────────────────────────┐ │
│ │ João, como CT stack A site  │ │
│ │ com AWP, use smoke connector│ │  
│ │ para slow push              │ │
│ │ (Fonte 16px - MUITO CLARO)  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Exemplo de Insights Automáticos CT:
```
João, como CT stack A site com AWP, use smoke connector para slow push
Pedro, bomb planted A - rotate through CT spawn, coordinate retake
Maria, HP crítico - fall back to site, let teammates entry frag
```

### Exemplo de Insights Automáticos TR:
```
Carlos, TR side execute fast B with flash over wall, plant for long
Ana, economy shift - force buy armor utility, rush A coordinated  
João, multi-kill achieved - press advantage e force objectives
```

### ✨ **Características da Interface:**
- **🔥 Fonte 16px**: Leitura clara e instantânea
- **🎯 Zero Interação**: Foco 100% no gameplay  
- **🤖 Insights Automáticos**: GEMINI analisa e orienta automaticamente
- **👤 Personalizado**: Sempre inclui seu nome nas instruções
- **🚫 Sem Rótulos**: Comunicação limpa sem [CT], [TR], emojis

## 🛠️ Configuração GSI

O arquivo `gamestate_integration_coachai.cfg` já está configurado para capturar dados de team:

```cfg
"data"
{
  "player_id"           "1"    // Inclui team information
  "player_state"        "1"    // Estado do jogador
  "map"                 "1"    // Score dos times
  "round"               "1"    // Fases do round
}
```

## 🔧 Implementação Técnica

### Arquivos Modificados:
1. **`src/coach/prompt.js`**: Detecção de lado e prompts específicos
2. **`src/utils/autoAnalyzer.js`**: Tracking de mudanças e insights
3. **`README.md`**: Documentação atualizada

### Funções Principais:
- `detectPlayerSide()`: Identifica CT/TR a partir dos dados GSI
- `updatePlayerSideTracking()`: Monitora mudanças de lado
- `analyzeTeamComposition()`: Analisa composição dos times

## 🎯 Próximos Passos

Para testar a funcionalidade:

1. **Inicie o CS2** com o GSI configurado
2. **Execute o Coach AI** 
3. **Entre em uma partida** (Casual, Competitive, ou Deathmatch)
4. **Observe os insights automáticos** específicos para seu lado atual
5. **Aproveite o coaching personalizado** sem distrações de interface

### Interface Otimizada:
- **✅ Zero Interação**: Não precisa digitar nada, foque no jogo
- **✅ Fonte 16px**: Leitura clara mesmo durante ação intensa  
- **✅ Insights Automáticos**: GEMINI monitora e orienta automaticamente
- **✅ Personalização**: Coaching direcionado com seu nome

### Logs de Debug:
```javascript
[TEAM DETECTION] Player João team: CT -> COUNTER-TERRORIST  
[SIDE TRACKING] Current: CT, Previous: null
[GEMINI INSIGHT RECEIVED]: João, como CT stack A site com utility
[DISPLAY] Response shown: João, como CT stack A site...
```

## 🏆 Benefícios

- ✅ **Estratégias Precisas**: Coaching específico para sua role atual
- ✅ **Adaptação Automática**: Sem necessidade de configuração manual  
- ✅ **Insights Profissionais**: Baseado em táticas competitivas reais
- ✅ **Timing Perfeito**: Sugestões no momento certo do round

---

**O CS2 Coach AI agora entende exatamente qual lado você está jogando e fornece o coaching tático mais relevante para cada situação!** 🎯🏆

** Happy Gaming!** 🎯 