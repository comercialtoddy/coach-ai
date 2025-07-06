# 🧪 GUIA DE TESTE - CS2 Coach AI Intelligent Orchestrator

## 🎯 **STATUS DA IMPLEMENTAÇÃO**

✅ **SISTEMA INTELIGENTE FUNCIONANDO**
- Intelligent Orchestrator implementado e ativo
- Debugging completo adicionado 
- Sanitização robusta de TTS implementada
- Métodos de teste disponíveis via console

---

## 🚀 **COMO TESTAR O SISTEMA**

### **1. INICIALIZAR O SISTEMA**
```bash
npm start
```

**O que você deve ver:**
- `[ORCHESTRATOR] 🎭 Iniciando sistema orquestrador inteligente...`
- `[CORE] ✅ Intelligent Orchestrator inicializado`
- `[TTS_SYSTEM] ✅ Sistema TTS inicializado`

### **2. ABRIR CONSOLE DO NAVEGADOR**
- Pressione **F12** para abrir/fechar DevTools
- Vá para a aba **Console**
- Digite: `window.debugCommands` para ver comandos disponíveis

---

## 🛠️ **COMANDOS DE TESTE DISPONÍVEIS**

### **🧪 TESTES PRINCIPAIS**

```javascript
// 1. TESTAR SISTEMA COMPLETO
window.debugCommands.testOrchestratorSystem()

// 2. TESTAR CONEXÃO COM GEMINI
window.debugCommands.testGeminiConnection()

// 3. TESTAR TTS
window.debugCommands.testTTSSystem()

// 4. FORÇAR COACHING (TESTE GEMINI + TTS)
window.debugCommands.forceCoachingTest()

// 5. OBTER STATUS DO SISTEMA
window.debugCommands.getOrchestratorStatus()
```

### **🧹 TESTE DE SANITIZAÇÃO DO TTS**

```javascript
// Testar limpeza de texto JSON/Markdown
window.debugCommands.cleanTextForTTSTest(`{
    "analysis": "Teste **markdown**",
    "data": ["item1", "item2"],
    "recommendation": "*Continue* defensivo"
}`)

// Testar com texto complexo
window.debugCommands.cleanTextForTTSTest(`
**ANÁLISE:** Você tem {health: 100} HP
*Recomendação:* Mantenha posição [bombsite A]
- Compre AK47
- Use granadas
`)
```

### **🎮 SIMULAÇÃO DE JOGO**

```javascript
// Debug detecção de eventos
window.debugCommands.debugEventDetection()

// Análise manual
window.debugCommands.triggerManualAnalysis()
```

---

## 🎤 **TESTANDO TTS E SANITIZAÇÃO**

### **PROBLEMA RESOLVIDO: Texto Limpo para TTS**

**Antes (com problemas):**
```
{health: 100, money: 5000} **Mantenha** posição [defensive]
```

**Depois (limpo e falável):**
```
100 pontos de vida, 5000 dollars. Mantenha posição defensive
```

### **RECURSOS DE LIMPEZA IMPLEMENTADOS:**

1. **Remoção de JSON/Markdown completo**
2. **Expansão de abreviações do CS2**
3. **Normalização de pontuação**
4. **Limite de 500 caracteres para TTS**
5. **Fallbacks de segurança**

---

## 🔍 **DEBUGGING E LOGS**

### **Logs Importantes a Observar:**

```
[ORCHESTRATOR] 🧠 Iniciando geração de coaching personalizado
[ORCHESTRATOR] 🔧 Dados otimizados para Gemini
[ORCHESTRATOR] 📝 Prompt elite gerado
[ORCHESTRATOR] 🚀 Chamando Gemini para geração de resposta
[ORCHESTRATOR] ✅ Resposta do Gemini recebida
[ORCHESTRATOR] 🧹 Limpando texto para TTS
[ORCHESTRATOR] ✅ Texto limpo para TTS
[ORCHESTRATOR] 🎤 Iniciando entrega de coaching
[ORCHESTRATOR] ✅ TTS executado com sucesso
```

### **Verificar se há Erros:**

```
❌ [ORCHESTRATOR] Erro na chamada do Gemini
❌ [ORCHESTRATOR] Nenhuma resposta do Gemini para falar
❌ [ORCHESTRATOR] Sistema TTS não disponível
```

---

## 🎯 **TESTES ESPECÍFICOS**

### **1. TESTE COMPLETO DO GEMINI + TTS**

```javascript
// Execute este comando e observe:
window.debugCommands.forceCoachingTest()

// O que deve acontecer:
// 1. ✅ Gemini gera resposta
// 2. ✅ Texto é sanitizado 
// 3. ✅ TTS fala o texto limpo
// 4. ✅ Aparece no overlay
```

### **2. VERIFICAR SANITIZAÇÃO**

```javascript
// Teste com texto "sujo":
window.debugCommands.cleanTextForTTSTest(`
{
    "player": {"name": "Test", "hp": 50},
    "advice": "**Mantenha** *posição* defensiva",
    "items": ["AK47", "armor"],
    "cs2_terms": "CT vs T no bombsite A"
}
`)

// Resultado esperado (limpo):
// "Test 50 pontos de vida advice Mantenha posição defensiva items AK47 armor Counter-Terrorist vs Terrorist no bombsite A"
```

### **3. TESTE DE PERFORMANCE**

```javascript
// Verificar status e métricas:
let status = await window.debugCommands.getOrchestratorStatus()
console.log('Status completo:', status)

// Verificar sistemas ativos:
console.log('TTS Status:', status.ttsStatus)
console.log('Micro-serviços:', status.microServicesStatus)
console.log('Métricas:', status.performanceMetrics)
```

---

## 🔧 **ATALHOS DO TECLADO**

- **Ctrl+T**: Toggle TTS
- **Ctrl+A**: Toggle Análise Automática  
- **Ctrl+M**: Análise Manual
- **Ctrl+S**: Falar Último Insight
- **F12**: Toggle DevTools

---

## 🚨 **RESOLUÇÃO DE PROBLEMAS**

### **Gemini Não Responde:**
1. Verificar chave API em `src/components/config/gemini.key`
2. Testar conexão: `window.debugCommands.testGeminiConnection()`
3. Verificar logs: `[ORCHESTRATOR] ❌ Erro na chamada do Gemini`

### **TTS Não Funciona:**
1. Verificar se está habilitado: `window.debugCommands.getOrchestratorStatus()`
2. Testar diretamente: `window.debugCommands.testTTSSystem()`
3. Verificar sistema: `[TTS_SYSTEM] ✅ Sistema TTS inicializado`

### **Texto Não Está Limpo:**
1. Testar sanitização: `window.debugCommands.cleanTextForTTSTest("seu texto")`
2. Verificar logs: `[ORCHESTRATOR] 🧹 Limpando texto para TTS`
3. Conferir resultado: `[ORCHESTRATOR] ✅ Texto limpo para TTS`

---

## 🎮 **TESTE EM JOGO**

### **Para Testar com CS2:**

1. **Configure GSI** (Game State Integration)
2. **Inicie uma partida** (pode ser com bots)
3. **Observe o console** para logs GSI:
   ```
   [GSI] 📊 Game data received
   [ORCHESTRATOR] 📡 Evento detectado: round_start
   [ORCHESTRATOR] 🎤 GEMINI RESPONSE TTS: "..."
   ```

### **Eventos que Acionam Coaching:**
- Início de round
- Bomba plantada
- Vida baixa
- Situações de clutch
- Mudanças econômicas
- Multi-kills

---

## ✅ **CHECKLIST DE FUNCIONAMENTO**

### **Sistema Básico:**
- [ ] Sistema inicializa sem erros
- [ ] DevTools abre/fecha com F12
- [ ] Console mostra comandos disponíveis

### **Gemini Integration:**
- [ ] `testGeminiConnection()` retorna sucesso
- [ ] `forceCoachingTest()` gera coaching
- [ ] Logs mostram resposta do Gemini

### **TTS + Sanitização:**
- [ ] `testTTSSystem()` reproduz áudio
- [ ] `cleanTextForTTSTest()` limpa texto
- [ ] TTS fala texto limpo e compreensível

### **Sistema Completo:**
- [ ] `testOrchestratorSystem()` passa todos os testes
- [ ] Status mostra todos os sistemas ativos
- [ ] Coaching aparece no overlay E é falado

---

## 🎉 **COMO SABER QUE ESTÁ FUNCIONANDO**

### **✅ SUCESSO - Você deve ver:**
1. **Console:** Comandos disponíveis listados
2. **Logs:** Sistema inicializado com sucesso
3. **TTS:** Áudio sendo reproduzido
4. **Overlay:** Coaching aparecendo na tela
5. **Sanitização:** Texto limpo nos logs

### **❌ PROBLEMAS - Se você vir:**
1. **Erros no console** - Verificar configuração
2. **Sem áudio** - Verificar TTS
3. **Texto "sujo"** - Problema na sanitização
4. **Sem resposta** - Problema com Gemini

---

## 🚀 **PRÓXIMOS PASSOS**

1. **Teste todos os comandos** listados acima
2. **Configure GSI** para teste em jogo
3. **Ajuste configurações** conforme necessário
4. **Monitore logs** para identificar problemas

O sistema está **PRONTO PARA USO** com sanitização completa e debugging avançado! 🎯 