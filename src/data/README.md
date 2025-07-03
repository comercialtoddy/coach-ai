# Diretório de Dados - GEMINI Memory System

Este diretório armazena os arquivos de memória persistente do GEMINI Coach AI.

## Arquivos

### `gemini_memory.json`
Sistema principal de memória que contém:
- **Conversas**: Histórico completo de interações
- **Perfis de Jogadores**: Estatísticas e preferências individuais
- **Padrões de Situação**: Respostas para situações similares
- **Cache de Busca**: Otimizações para recuperação rápida
- **Estatísticas**: Métricas de efetividade do sistema

## Estrutura da Memória

```json
{
  "conversations": [...],
  "responseMemory": [...],
  "playerProfiles": [...],
  "situationPatterns": [...],
  "quickLookup": {...},
  "stats": {...},
  "savedAt": 1640995200000
}
```

## Funcionalidades

1. **Memória Situacional**: Lembra respostas para situações específicas
2. **Perfil do Jogador**: Adapta conselhos baseado no histórico
3. **Avaliação de Efetividade**: Aprende com sucessos e falhas
4. **Busca Inteligente**: Encontra contextos similares rapidamente
5. **Auto-Save**: Salva automaticamente a cada 5 minutos

## Benefícios

- ✅ **Personalização**: Conselhos específicos por jogador
- ✅ **Aprendizado**: Melhora com base em resultados
- ✅ **Continuidade**: Mantém contexto entre sessões
- ✅ **Eficiência**: Evita repetir conselhos ineficazes
- ✅ **Análise**: Métricas de performance do coaching

## Limitações

- Memória limitada a 30 dias
- Máximo de 200 conversas simultâneas
- Banco de dados em arquivo JSON (não SQL)
- Rate limiting do GEMINI ainda se aplica

## Uso

O sistema funciona automaticamente:
1. **Detecta eventos** importantes durante o jogo
2. **Busca memória** de situações similares
3. **Envia contexto** enriquecido ao GEMINI
4. **Salva resposta** na memória
5. **Avalia efetividade** baseado no resultado

## Manutenção

- Arquivo é salvo automaticamente
- Limpeza de dados antigos automática
- Backup em `beforeExit` e `SIGINT`
- Logs detalhados para debug 