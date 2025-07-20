# Coach AI 🎯

**Sistema de Coaching Inteligente com IA**

## 🚀 Início Rápido

### 1. Instalação
```bash
# Clonar repositório
git clone https://github.com/your-username/coach-ai.git
cd coach-ai

# Instalar dependências
npm install
```

### 2. Configuração
```bash
# Configurar chave Gemini (obrigatório)
export GEMINI_API_KEY="sua_chave_gemini"

# APIs opcionais
export STEAM_API_KEY="sua_chave_steam"
export TRACKER_GG_API_KEY="sua_chave_tracker"
```

### 3. Configuração
```bash
# Configuração básica do sistema
npm run setup
```

### 4. Iniciar
```bash
npm start
```

## 🎮 Como Usar

### Hotkeys Globais
- `F9` - Toggle Overlay
- `F8` - Toggle Text-to-Speech
- `F7` - Toggle Análise Automática
- `F6` - Análise Manual
- `F12` - Toggle Developer Tools
- `Ctrl+Shift+F12` - Emergency Exit

### Hotkeys no Overlay
- `Ctrl+T` - Toggle TTS
- `Ctrl+A` - Toggle Auto Analysis
- `Ctrl+M` - Manual Analysis
- `Ctrl+S` - Speak Last Insight

### Debug Commands (Console)
```javascript
// Abrir console com F12
window.debugCommands.toggleTTS()
window.debugCommands.applyProfessionalPreset()
window.debugCommands.testTTS('Hello CS2 Coach AI')
window.debugCommands.getStatus()
```

## 🏆 Funcionalidades

### ✅ Implementado e Funcional
- **Overlay VAC-Safe** - Janela transparente sobre o jogo
- **Sistema de Análise** - Análise inteligente em tempo real
- **IA Gemini 2.5 Flash** - Análise inteligente de jogadas
- **Text-to-Speech** - Feedback audível personalizado
- **OCR System** - Reconhecimento de texto na tela
- **APIs Externas** - Steam, Tracker.gg, HLTV
- **Master Integration** - Coordenação de todos os sistemas
- **Configuração Avançada** - Presets e personalização completa

### 🎯 Análise Automática
- Detecção de eventos importantes
- Conselhos táticos contextuais
- Análise de economia
- Sugestões de posicionamento
- Alertas críticos (bomba, clutch, etc.)

## 🛡️ Segurança VAC

**100% VAC-Safe:**
- ✅ Overlay externo (sem injeção)
- ✅ Sistema de análise modular
- ✅ OCR externo (sem acesso à memória)
- ✅ Sem modificação de arquivos do jogo

## ⚙️ Configuração

### Presets Disponíveis
```javascript
// Aplicar via console
window.debugCommands.applyBeginnerPreset()     // Iniciante
window.debugCommands.applyIntermediatePreset() // Intermediário
window.debugCommands.applyAdvancedPreset()     // Avançado
window.debugCommands.applyProfessionalPreset() // Profissional
window.debugCommands.applyMinimalPreset()      // Minimalista
```

### Configuração Manual
Edite `config/user_config.json` para personalização completa.

## 🔧 Resolução de Problemas

### Sistema não responde?
1. Verifique as configurações de API
2. Confirme a conexão com internet
3. Teste: `npm run test`

### IA não responde?
1. Verifique a chave Gemini
2. Confirme conexão com internet
3. Verifique rate limiting

### TTS não funciona?
1. Habilite nas configurações
2. Verifique engine TTS do sistema
3. Teste volume

## 📊 Status do Sistema

```javascript
// Ver status completo no console
window.debugCommands.getStatus()
```

## 📝 Documentação Completa

- **Setup Completo:** [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Implementação:** [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)
- **Configuração:** [docs/CONFIGURATION.md](docs/CONFIGURATION.md)

## 🆘 Suporte

1. **Logs:** Ativar console (F12) para debug
2. **Configuração:** Resetar via presets
3. **Performance:** Ajustar cache e rate limiting

---

**Coach AI** - Sistema inteligente de coaching com IA  
*Modular • IA Avançada • Performance Otimizada*