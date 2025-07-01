# 🗣️ TEAM CHAT AUTOMÁTICO - IMPLEMENTADO

## 🎯 **FUNCIONALIDADE IMPLEMENTADA**
Sistema que envia **automaticamente** dicas do Coach AI para o team do CS2 sem atrapalhar o jogo do jogador, usando apenas comandos nativos do CS2.

---

## 🛠️ **COMO FUNCIONA**

### **1. Detecção Automática da Pasta CS2**
- ✅ **Windows:** Procura automaticamente no Steam (`AppData/Local/Steam`, `Program Files/Steam`, etc.)
- ✅ **Linux:** `~/.steam/steam/userdata`
- ✅ **Mac:** `~/Library/Application Support/Steam/userdata`
- 🔄 **Fallback:** Cria pasta `cs2_configs/` se não encontrar Steam

### **2. Geração de Comandos CS2**
```cs2
// Exemplo de comando gerado automaticamente:
say_team "[COACH] Rotate para site B"
echo "[COACH AI] Mensagem enviada para o team"
```

### **3. Sistema de Arquivos .cfg Temporários**
- 📁 Cria arquivos `team_chat_[ID].cfg` na pasta CS2
- ⚡ Auto-execução via `exec` commands
- 🧹 Limpeza automática após 10 segundos
- 🔄 Sistema de fila com delay de 3 segundos entre mensagens

---

## 🎮 **SETUP PARA O JOGADOR**

### **Passo 1: Localização Automática**
O sistema encontra automaticamente sua pasta CS2. Verifique no console:
```
[TEAM CHAT] ✅ Encontrou CS2 config em: C:\...\Steam\userdata\[ID]\730\local\cfg
```

### **Passo 2: Ativação no CS2**
No console do CS2, digite **UMA VEZ**:
```cs2
exec coach_ai_executor
```

### **Passo 3: Funcionamento Automático** 
- ✅ Coach AI detecta dicas importantes
- ✅ Gera comandos `say_team` automaticamente
- ✅ Mensagens aparecem no chat do team sem você digitar
- ✅ Não interfere no seu jogo (sem abrir chat, sem teclas)

---

## 🎛️ **CONTROLES DISPONÍVEIS**

### **Atalhos Globais:**
- **F11** - Liga/Desliga team chat automático
- **Ctrl+F11** - Enviar mensagem de teste
- **F9** - Toggle overlay (existente)
- **F10** - Toggle mouse events (existente)

### **Status no Console:**
```
[TEAM CHAT] ✅ Team Chat Automático ATIVADO
[TEAM CHAT] 📤 Dica estratégica enviada automaticamente para o team
[TEAM CHAT] 🧪 Mensagem de teste enviada: "[COACH] Teste"
```

---

## 📝 **EXEMPLOS DE FUNCIONAMENTO**

### **Situação 1: Análise Automática**
```
Coach AI detecta: "Jogador com HP baixo deve rotacionar para site A"
Sistema extrai: "[COACH] Rotate para site A"
CS2 executa: say_team "[COACH] Rotate para site A"
Team vê no chat: [COACH] Rotate para site A
```

### **Situação 2: Dica Estratégica**
```
Coach AI analisa: "Use smoke e flash para push no site B"
Sistema extrai: "[COACH] Smoke e flash site B"
CS2 executa: say_team "[COACH] Smoke e flash site B" 
Team vê no chat: [COACH] Smoke e flash site B
```

### **Situação 3: Informação Crítica**
```
Coach AI detecta: "Bomba plantada, time precisa defusar urgente"
Sistema extrai: "[COACH] Defuse urgente"
Prioridade: URGENT (pula fila)
CS2 executa: say_team "[COACH] Defuse urgente"
```

---

## ⚙️ **CONFIGURAÇÕES TÉCNICAS**

### **Limites e Delays:**
- 📏 **Tamanho máximo:** 120 caracteres (limite do CS2)
- ⏱️ **Delay entre mensagens:** 3 segundos
- 📋 **Sistema de fila:** Prioridade (urgent/normal)
- 🧹 **Limpeza automática:** Arquivos removidos após 10s

### **Mensagens Processadas:**
- ✅ Remove `{icon:*}` dos textos
- ✅ Sanitiza caracteres especiais
- ✅ Extrai frases-chave estratégicas
- ✅ Formato otimizado: `[COACH] Ação`

### **Detecção de Frases Estratégicas:**
```regex
- Rotações: "rotate para site [AB]"
- Economia: "eco save [AB]"  
- Rushes: "rush push force [AB]"
- AWP: "awp mid long short"
- Utilidades: "smoke flash molly [AB]"
- Bomba: "plant defuse"
- Status: "low hp"
```

---

## 🔧 **TROUBLESHOOTING**

### **❌ Problema: Pasta CS2 não encontrada**
```
[TEAM CHAT] ⚠️ Usando caminho fallback: ./cs2_configs
[TEAM CHAT] 📋 Copie os arquivos .cfg para a pasta cfg do CS2 manualmente
```

**Solução:**
1. Copie arquivos da pasta `cs2_configs/` 
2. Cole em `C:\Steam\userdata\[SEU_ID]\730\local\cfg\`
3. Execute `exec coach_ai_executor` no CS2

### **❌ Problema: Mensagens não aparecem**
**Verifique:**
1. ✅ Executou `exec coach_ai_executor` no CS2?
2. ✅ Team chat automático está ativado? (F11)
3. ✅ Há mensagens na fila? (verifique console)

### **❌ Problema: Muitas mensagens**
**Configuração:**
- Delay padrão: 3 segundos
- Use F11 para desativar temporariamente
- Mensagens urgentes têm prioridade

---

## 🚀 **FUNCIONAMENTO EM DETALHES**

### **Fluxo Completo:**
1. **Coach AI gera resposta** com análise estratégica
2. **Sistema extrai essência** da dica (frases-chave)
3. **Adiciona à fila** com prioridade adequada
4. **Respeita delay** entre mensagens (3s)
5. **Gera arquivo .cfg** com comando `say_team`
6. **CS2 executa automaticamente** o comando
7. **Mensagem aparece no team chat** 
8. **Arquivo é removido** após 10 segundos

### **Vantagens:**
- 🎯 **Não interfere no jogo** - zero input do jogador
- ⚡ **Automático** - funciona em background
- 🛡️ **Seguro** - usa apenas comandos nativos CS2
- 🧹 **Limpo** - remove arquivos temporários
- 📋 **Inteligente** - extrai apenas info relevante
- ⏱️ **Controlado** - delay para não spammar

---

## 📞 **STATUS: TOTALMENTE FUNCIONAL**

### ✅ **Implementado:**
- Sistema de detecção automática de pasta CS2
- Geração de comandos `say_team` automáticos  
- Extração inteligente de frases estratégicas
- Sistema de fila com prioridades
- Limpeza automática de arquivos
- Controles por atalhos (F11, Ctrl+F11)
- Integração completa com Coach AI

### 🎮 **Para Usar:**
1. **Execute o Coach AI** (já funciona automaticamente)
2. **Digite no CS2:** `exec coach_ai_executor` 
3. **Pronto!** Mensagens automáticas ativadas

**O sistema está 100% funcional e pronto para uso!** 🎉 