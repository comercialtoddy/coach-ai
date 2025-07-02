# CS2 Coach AI - Análise Visual de Radar - Guia Rápido

## 🚀 Como Usar

### 1. Testar o Sistema
```bash
npm run test:radar
```

### 2. Ativação Automática
O sistema ativa automaticamente análise visual em situações estratégicas:
- **Round Start**: Planejamento de posições
- **Execuções TR/CT**: Estratégias coordenadas
- **Clutch**: Análise de rotas
- **Pós-Plant**: Posicionamento ideal

### 3. Comando Manual (Futuro)
O Gemini pode solicitar análise visual usando:
```
{radar:analyze}
```

## 📊 Situações com Análise Visual

| Situação | Análise Visual | Benefícios |
|----------|----------------|------------|
| `round_start` | ✅ SIM | Posicionamento inicial ideal |
| `tr_strategy` | ✅ SIM | Execuções coordenadas |
| `ct_strategy` | ✅ SIM | Setups defensivos |
| `clutch_situation` | ✅ SIM | Rotas e timing |
| `bomb_planted` | ✅ SIM | Retake/defesa |
| `tactical_disadvantage` | ✅ SIM | Reposicionamento |
| `low_health` | ❌ NÃO | Prioridade em sobrevivência |
| `economy_shift` | ❌ NÃO | Foco em compras |

## 🗺️ Mapas Suportados

### Competitivo Ativo
- **Dust 2**: Long A, Short, Mid, B Tunnels
- **Mirage**: Palace, Connector, Window, Apps
- **Inferno**: Banana, Apps, Arch, Library
- **Nuke**: Outside, Secret, Ramp, Heaven/Hell
- **Overpass**: Monster, Connector, Bathrooms
- **Vertigo**: A Ramp, Mid, B Stairs (2 níveis)
- **Ancient**: Mid, Cave, Elbow, Temple
- **Anubis**: Mid, Connector, Palace, Water

## 💡 Exemplos de Respostas

### Com Análise Visual:
```
João, radar mostra stack pesado {icon:bombsite-a} A. 
Execute fake A com {icon:smoke} smokes, rotacione rápido 
{icon:bombsite-b} B via connector. Window player rotacionou, 
B tem apenas 1 defender.
```

### Sem Análise Visual (economia):
```
Maria, economia baixa ($1400). Force {icon:armor} armor + 
{icon:p250} P250, stack {icon:bombsite-b} B para anti-eco.
```

## ⚙️ Configuração

### API Key Gemini
Certifique-se que sua API key do Gemini 2.5 Flash está configurada:
- Arquivo: `src/config/gemini.key`
- Ou variável: `GEMINI_API_KEY`

### Verificar Radares
Os arquivos de radar devem estar em:
```
src/database/radars/
├── simpleradar/     (Padrão - Melhor para análise)
├── ingame/          (Oficial CS2)
└── ingame-transparent/ (CS2 com transparência)
```

## 🔧 Troubleshooting

### "Radar not found"
- Verifique nome do mapa no GSI
- Confirme arquivo existe em `/radars/`

### Análise visual não ativa
- Verifique tipo de situação
- Confirme fase do round (não em freeze time)
- Verifique logs: `[RADAR]`

### Performance
- Simple Radar = Mais rápido
- Cache automático após primeiro uso
- Limite de 10 requests/min (Gemini)

## 📈 Benefícios

1. **Estratégias Visuais**: Gemini "vê" o mapa
2. **Callouts Precisos**: Baseados em posições reais
3. **Timing Calculado**: Distâncias visuais para rotações
4. **Ângulos Otimizados**: Análise de linhas de visão
5. **Contexto Completo**: Decisões mais informadas

---

**Dica Pro**: O sistema funciona melhor com Simple Radar devido ao design limpo e otimizado para análise tática. 