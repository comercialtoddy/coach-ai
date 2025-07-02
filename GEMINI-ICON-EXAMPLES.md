# 🤖 EXEMPLOS PRÁTICOS - Como o Gemini Deve Responder

## 📝 FORMATO CORRETO DAS RESPOSTAS

### **ESTRUTURA OBRIGATÓRIA:**
```
[Nome do jogador], [situação] com {icon:item} [descrição] [ação táctica]
```

---

## 🎯 EXEMPLOS POR CENÁRIO

### **SITUAÇÃO 1: ROUND START (CT SIDE)**

**❌ RESPOSTA INCORRETA:**
```
"João, como CT segure A site com AWP, use smoke para controlar"
```

**✅ RESPOSTA CORRETA:**
```
"João, como CT stack {icon:bombsite-a} A site com {icon:awp} AWP long, use {icon:smoke} smoke connector para controle"
```

### **SITUAÇÃO 2: ROUND START (TR SIDE)**

**❌ RESPOSTA INCORRETA:**
```
"Maria, execute B com flashes e smoke, plant bomba para default"
```

**✅ RESPOSTA CORRETA:**
```
"Maria, execute {icon:bombsite-b} B com {icon:flash} flashes e {icon:smoke} smoke, plant {icon:c4} bomba para default"
```

### **SITUAÇÃO 3: HP BAIXO**

**❌ RESPOSTA INCORRETA:**
```
"Pedro, HP crítico - fall back para spawn"
```

**✅ RESPOSTA CORRETA:**
```
"Pedro, {icon:health} HP crítico - fall back para spawn, deixe team entry"
```

### **SITUAÇÃO 4: COMPRA DE EQUIPAMENTOS**

**❌ RESPOSTA INCORRETA:**
```
"Ana, compre AK47, armor e flashes para execute"
```

**✅ RESPOSTA CORRETA:**
```
"Ana, compre {icon:ak47} AK47, {icon:armor} armor e {icon:flash} flashes para execute"
```

### **SITUAÇÃO 5: BOMBA ARMADA**

**❌ RESPOSTA INCORRETA:**
```
"Carlos, bomba plantada A - rotate CT spawn para retake"
```

**✅ RESPOSTA CORRETA:**
```
"Carlos, {icon:planted-bomb} bomba plantada {icon:bombsite-a} A - rotate CT spawn para retake"
```

### **SITUAÇÃO 6: TEMPO CRÍTICO**

**❌ RESPOSTA INCORRETA:**
```
"João, 20 segundos restantes, defuse agora"
```

**✅ RESPOSTA CORRETA:**
```
"João, {icon:time} 20s restantes, {icon:defuse} defuse agora com cover"
```

### **SITUAÇÃO 7: LOADOUT COMPLETO**

**❌ RESPOSTA INCORRETA:**
```
"Maria, buy round: AK47, armor, HE, 2x flash, smoke"
```

**✅ RESPOSTA CORRETA:**
```
"Maria, buy: {icon:ak47} AK47, {icon:armor} armor, {icon:he} HE, {icon:flash} 2x flash, {icon:smoke} smoke"
```

### **SITUAÇÃO 8: ECO ROUND**

**❌ RESPOSTA INCORRETA:**
```
"Pedro, eco round: force armor P250, stack A site"
```

**✅ RESPOSTA CORRETA:**
```
"Pedro, eco: force {icon:armor} armor {icon:p250} P250, stack {icon:bombsite-a} A site"
```

---

## 🎮 SITUAÇÕES COMPLEXAS

### **SITUAÇÃO 9: TÁTICA COMPLETA CT**

**❌ RESPOSTA INCORRETA:**
```
"Ana, como CT setup: AWP mid, M4 A ramp, smoke connector quando TR push"
```

**✅ RESPOSTA CORRETA:**
```
"Ana, CT setup: {icon:awp} AWP mid, {icon:m4a1} M4 {icon:bombsite-a} A ramp, {icon:smoke} smoke connector quando TR push"
```

### **SITUAÇÃO 10: TÁTICA COMPLETA TR**

**❌ RESPOSTA INCORRETA:**
```
"Carlos, TR execute B: smoke deep, double flash wall, AK47 entry, plant para long"
```

**✅ RESPOSTA CORRETA:**
```
"Carlos, TR execute {icon:bombsite-b} B: {icon:smoke} smoke deep, {icon:flash} double flash wall, {icon:ak47} AK47 entry, plant {icon:c4} para long"
```

### **SITUAÇÃO 11: SITUAÇÃO DE CLUTCH**

**❌ RESPOSTA INCORRETA:**
```
"João, 1v2 clutch: HP baixo, use AWP angles, tempo a seu favor"
```

**✅ RESPOSTA CORRETA:**
```
"João, 1v2 clutch: {icon:health} HP baixo, use {icon:awp} AWP angles, {icon:time} tempo a seu favor"
```

### **SITUAÇÃO 12: ANTI-ECO**

**❌ RESPOSTA INCORRETA:**
```
"Maria, anti-eco: P250 close angles, armor obrigatório, não peek long"
```

**✅ RESPOSTA CORRETA:**
```
"Maria, anti-eco: {icon:p250} P250 close angles, {icon:armor} armor obrigatório, não peek long"
```

---

## 🏆 SITUAÇÕES AVANÇADAS

### **SITUAÇÃO 13: RETAKE COORDENADO**

**✅ RESPOSTA CORRETA:**
```
"Time, retake {icon:bombsite-a} A coordenado: {icon:smoke} smoke planted, {icon:flash} flash over wall, {icon:m4a1} M4 long, {icon:ak47} AK47 short. {icon:defuser} Kit ready."
```

### **SITUAÇÃO 14: POST-PLANT**

**✅ RESPOSTA CORRETA:**
```
"Pedro, {icon:planted-bomb} post-plant {icon:bombsite-b} B: hold {icon:awp} AWP tunnel, {icon:ak47} AK47 window, {icon:time} 45s advantage"
```

### **SITUAÇÃO 15: ECONOMIA CRÍTICA**

**✅ RESPOSTA CORRETA:**
```
"Ana, economia crítica: save main {icon:awp} AWP, force {icon:armor} armor {icon:p250} P250 próximo round"
```

### **SITUAÇÃO 16: MATCH POINT**

**✅ RESPOSTA CORRETA:**
```
"Carlos, match point: {icon:awp} AWP pick mid, {icon:smoke} smoke execute {icon:bombsite-a} A, {icon:flash} flash coordenado para close"
```

---

## ⚠️ ERROS MAIS COMUNS - EVITE!

### **ERRO 1: Esqueceu ícone de arma**
❌ "Compre AWP para mid"
✅ "Compre {icon:awp} AWP para mid"

### **ERRO 2: Esqueceu ícone de site**
❌ "Execute A site"  
✅ "Execute {icon:bombsite-a} A site"

### **ERRO 3: Esqueceu ícone de HP**
❌ "HP baixo, cuidado"
✅ "{icon:health} HP baixo, cuidado"

### **ERRO 4: Esqueceu ícone de granada**
❌ "Use smoke e flash"
✅ "Use {icon:smoke} smoke e {icon:flash} flash"

### **ERRO 5: Esqueceu ícone de bomba**
❌ "Bomba plantada A"
✅ "{icon:planted-bomb} bomba plantada {icon:bombsite-a} A"

---

## 📋 CHECKLIST FINAL ANTES DE ENVIAR

Antes de enviar QUALQUER resposta, verifique:

- [ ] **Nome do jogador** incluído?
- [ ] **Todas as armas** têm ícones?
- [ ] **Todas as granadas** têm ícones?
- [ ] **Sites A/B** têm ícones?
- [ ] **HP mencionado** tem ícone?
- [ ] **Tempo mencionado** tem ícone?
- [ ] **Bomba/C4** tem ícone?
- [ ] **Formato** {icon:nome} correto?

---

## 🎯 DICA FINAL

**REGRA DE OURO:** Se você escreveu o nome de uma arma, equipamento, granada, site ou mencionou HP/tempo SEM o ícone correspondente, a resposta está INCORRETA.

**SEMPRE** coloque o ícone ANTES da palavra:
✅ `{icon:awp} AWP`
❌ `AWP {icon:awp}` 
❌ `AWP`

**🎮 Com essas instruções, suas respostas serão PERFEITAS e VISUAIS!** 