# 🎯 GEMINI ESTRATÉGICO - 10 REQUISIÇÕES POR MINUTO

## ⚡ CONFIGURAÇÃO IMPLEMENTADA

O sistema agora está configurado para usar o **Gemini 2.5 Flash** apenas em **momentos estratégicos específicos** com limite de **10 requisições por minuto**.

## 🎮 MOMENTOS ESTRATÉGICOS DEFINIDOS

### 1️⃣ **INÍCIO DE ROUND** (Priority: HIGH)
- **Trigger**: `round.phase` muda para `freezetime`
- **Análise**: Estratégia para o round que está começando

### 2️⃣ **BOMBA PLANTADA** (Priority: CRITICAL)
- **Trigger**: `round.bomb` = `planted`
- **Análise**: Táticas de defuse/retake críticas

### 3️⃣ **HP CRÍTICO** (Priority: HIGH)
- **Trigger**: Saúde < 30 HP
- **Análise**: Posicionamento defensivo e suporte

### 4️⃣ **MUDANÇA ECONÔMICA** (Priority: MEDIUM)
- **Trigger**: Variação > $2000
- **Análise**: Estratégia de compra e economia

### 5️⃣ **SITUAÇÃO DE CLUTCH** (Priority: HIGH)
- **Trigger**: Diferença de score ≥ 3
- **Análise**: Pressão psicológica e táticas

### 6️⃣ **MATCH POINT** (Priority: CRITICAL)
- **Trigger**: Score ≥ 15
- **Análise**: Táticas finais decisivas

## 📊 CONFIGURAÇÕES TÉCNICAS

### Rate Limiter Ajustado:
```javascript
maxRequests: 10 // LIMITE: 10 requests por minuto
```

### Intervalo de Análise:
```javascript
analysisInterval: 60000 // 60 segundos
```

### Detecção Inteligente:
```javascript
detectStrategicMoment(gameData) {
    // Analisa apenas momentos críticos
    // Retorna null se não é estratégico
}
```

## 🔄 FLUXO OTIMIZADO

1. **AutoAnalyzer verifica** a cada 60 segundos
2. **Detecta momento estratégico** específico
3. **Gera insight com Gemini** se crítico
4. **Economiza requisições** em momentos normais

## ✅ BENEFÍCIOS

- ⚡ **Economia de API**: Máximo 10 calls/min
- 🎯 **Insights relevantes**: Apenas em momentos críticos
- 🧠 **Qualidade alta**: Prompts específicos por situação
- 💰 **Custo otimizado**: Uso eficiente do Gemini

## 🎮 EXEMPLO DE USO

```
🔍 [AutoAnalyzer] Verificando momentos estratégicos...
🎯 [AutoAnalyzer] Momento estratégico detectado: bomb_planted
🎯 [AutoAnalyzer] Gerando insight para: bomb_planted
✅ [AutoAnalyzer] Insight estratégico gerado: Bomba plantada no site A...
```

## 🚀 RESULTADO

O **CS2 Coach AI** agora fornece insights **estratégicos de alta qualidade** apenas quando realmente necessário, otimizando o uso do Gemini 2.5 Flash e mantendo a relevância tática em momentos críticos da partida.

**STATUS:** ✅ **GEMINI ESTRATÉGICO ATIVADO** - 10 RPM configurado! 