# CS2 Coach AI - Sistema de Análise Visual de Radar Implementado

## Visão Geral

O CS2 Coach AI agora possui capacidade de análise visual de mapas usando o Gemini 2.5 Flash. O sistema pode analisar imagens de radar tático para fornecer estratégias mais contextualizadas e precisas.

## Arquitetura do Sistema

### 1. **RadarImageManager** (`src/utils/radarImageManager.js`)
- Gerencia carregamento e conversão de imagens de radar
- Suporta múltiplos estilos: Simple Radar, In-game, In-game Transparent
- Converte imagens para Base64 para envio ao Gemini
- Cache inteligente para otimizar performance
- Metadados de callouts por mapa

### 2. **GeminiClient Atualizado** (`src/utils/geminiClient.js`)
- Novo método `analyzeWithRadar()` para análise multimodal
- Método `shouldIncludeRadar()` determina quando usar análise visual
- Integração com RadarImageManager
- Construção de prompts especializados para contexto visual

### 3. **Prompt Atualizado** (`src/coach/prompt.js`)
- Instruções detalhadas sobre quando solicitar análise visual
- Comando `{radar:analyze}` para o Gemini indicar necessidade de visual
- Exemplos de uso e limitações
- Situações ideais para análise visual

### 4. **AutoAnalyzer Atualizado** (`src/utils/autoAnalyzer.js`)
- Detecção automática de quando incluir análise visual
- Processamento de solicitações `{radar:analyze}` do Gemini
- Reprocessamento com contexto visual quando necessário

## Como Funciona

### Fluxo Automático:
1. **Detecção de Situação**: Sistema identifica momentos estratégicos
2. **Verificação Visual**: `shouldIncludeRadar()` verifica se análise visual ajudaria
3. **Carregamento de Radar**: RadarImageManager carrega imagem do mapa atual
4. **Análise Multimodal**: Gemini analisa texto + imagem do radar
5. **Resposta Contextualizada**: Estratégia baseada em posicionamento visual

### Situações que Ativam Análise Visual:
- `round_start`: Planejamento de posições iniciais
- `tr_strategy`: Execuções coordenadas em bombsites
- `ct_strategy`: Setups defensivos e crossfires
- `clutch_situation`: Rotas e timing em clutch
- `bomb_planted`: Posicionamento para retake/defesa
- `tactical_disadvantage`: Reposicionamento estratégico

## Mapas Suportados

### Mapas Ativos:
- de_dust2 (com callouts: Long A, Short, Mid, B Tunnels, etc.)
- de_mirage (Palace, Connector, Window, Apps, etc.)
- de_inferno (Banana, Apps, Arch, Library, etc.)
- de_nuke (Outside, Secret, Ramp, Heaven/Hell)
- de_overpass (Monster, Connector, Bathrooms, Water)
- de_vertigo (A Ramp, Mid, B Stairs, dois níveis)
- de_ancient (Mid, Cave, Elbow, Temple)
- de_anubis (Mid, Connector, Palace, Water)

### Mapas Clássicos:
- cs_office, cs_italy, de_cache, de_train

## Estilos de Radar Disponíveis

1. **Simple Radar** (Padrão):
   - Design limpo e tático
   - Callouts claros
   - Ideal para análise estratégica
   - Fonte: https://readtldr.gg/simpleradar

2. **In-game**:
   - Radares oficiais do CS2
   - Visual detalhado
   - Texturas originais

3. **In-game Transparent**:
   - Versão transparente dos radares CS2
   - Melhor contraste
   - Editados para clareza

## Exemplos de Respostas com Análise Visual

### Exemplo 1 - Round Start (CT):
```
João, análise visual mostra gap em mid. Stack 2 {icon:bombsite-a} A (1 quad, 1 site), 
2 {icon:bombsite-b} B (1 plat, 1 default), 1 mid com {icon:awp} AWP window. 
{icon:smoke} Smoke T spawn às 1:45 para info.
```

### Exemplo 2 - Execução TR:
```
Maria, radar indica rotação CT para {icon:bombsite-a} A. Execute split {icon:bombsite-b} B:
3 upper via monster com {icon:flash} flashes coordenados, 2 lower via water.
{icon:smoke} Smoke heaven/site simultaneamente.
```

### Exemplo 3 - Clutch 1v2:
```
Pedro, análise visual: enemies likely plat/default {icon:bombsite-b} B. 
Rotacione via connector silencioso, {icon:flash} flash deep site, 
peek default primeiro. {icon:time} 25s disponíveis.
```

## Configuração e Customização

### Adicionar Novos Mapas:
1. Adicione imagens de radar em `/src/database/radars/[style]/`
2. Nome do arquivo: `[mapname]_radar.png` ou `[mapname].png`
3. Atualize callouts em `getMapCallouts()` no RadarImageManager

### Ajustar Threshold de Análise Visual:
Edite `visualAnalysisTypes` em `shouldIncludeRadar()` para controlar quando usar análise visual.

### Performance:
- Cache automático de imagens carregadas
- Análise visual apenas em momentos estratégicos
- Fallback para análise texto-only se radar não disponível

## Limitações

1. **Rate Limiting**: Análise visual conta como request normal do Gemini
2. **Tamanho**: Imagens são redimensionadas para otimizar tokens
3. **Freeze Time**: Análise visual desabilitada durante freeze time
4. **Mapas Custom**: Apenas mapas oficiais têm radares disponíveis

## Troubleshooting

### Radar não carregando:
- Verifique se arquivo existe em `/src/database/radars/`
- Confirme nome do arquivo corresponde ao nome do mapa
- Verifique logs: `[RadarManager] Radar not found`

### Análise visual não ativando:
- Verifique se situação está em `visualAnalysisTypes`
- Confirme que GSI está enviando nome do mapa
- Verifique fase do round (não funciona em freeze time)

### Performance lenta:
- Limpe cache: `radarManager.clearCache()`
- Reduza frequência de análise visual
- Use estilo "simpleradar" (arquivos menores)

## Melhorias Futuras

1. **Posição do Jogador**: Overlay da posição atual no radar
2. **Tracking de Enemies**: Marcar últimas posições conhecidas
3. **Heatmaps**: Análise de áreas mais perigosas
4. **Smoke/Flash Lineups**: Sugestões visuais de utility
5. **Minimap em Tempo Real**: Integração com GSI para radar dinâmico

## Conclusão

O sistema de análise visual de radar eleva o CS2 Coach AI a um novo nível, fornecendo estratégias baseadas em contexto visual real dos mapas. O Gemini 2.5 Flash pode agora "ver" o mapa e fornecer sugestões táticas precisas baseadas em posicionamento, ângulos e distâncias.

---

**Implementado em**: Janeiro 2025  
**Versão**: 1.0.0  
**API**: Gemini 2.5 Flash com Image Understanding 