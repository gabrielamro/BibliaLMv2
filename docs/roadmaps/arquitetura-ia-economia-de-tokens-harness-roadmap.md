# Roadmap — Arquitetura de IA e Economia de Tokens do Culto+

> **Escopo:** este documento trata do consumo de IA dentro do produto pelos usuários. Para economia de tokens no desenvolvimento assistido por IA, consulte `arquitetura-ia-desenvolvimento-assistido-harness-roadmap.md`.

**Status:** proposta de arquitetura  
**Objetivo:** reduzir custo, latência e chamadas redundantes de IA sem degradar a qualidade pastoral, mantendo rastreabilidade, limites por usuário e uma base automatizada para avaliar prompts e modelos.

## 1. Resumo executivo

O problema não é apenas “usar prompts menores”. O consumo atual pode crescer por quatro motivos combinados:

1. o mesmo contexto/histórico é reenviado em várias interações;
2. falhas de JSON geram uma segunda chamada de reparo;
3. a cadeia de fallback pode executar mais de um provedor para uma solicitação;
4. testes e smoke tests podem chamar modelos reais sem orçamento ou cache.

A proposta é criar uma camada única de execução de IA com cinco controles:

- roteamento por tarefa e orçamento;
- contexto mínimo e sumarização persistente;
- cache/deduplicação por hash;
- telemetria de tokens, custo, latência e qualidade;
- harness de avaliação com fixtures, mocks e um pequeno conjunto de chamadas reais controladas.

## 2. Diagnóstico inicial do código

### Pontos positivos já existentes

- `services/aiFeatureAccessPolicy.ts` centraliza capabilities por recurso.
- `retryWithBackoff` já existe.
- Rotas `/api/ai/generate`, `/api/ai/chat`, `/api/ai/image` e `/api/ai/studio` já criam uma fronteira server-side.
- Cloudflare Workers AI foi colocado como provedor principal para texto e imagem em entregas recentes.
- Há registro de `usage_today` para algumas capacidades.

### Riscos e oportunidades confirmados

- `services/geminiService.ts` possui fallback Cloudflare → Groq → OpenRouter → Gemini. Em uma falha parcial, a mesma intenção pode consumir múltiplos provedores; o fallback precisa distinguir erro transitório, erro de validação e resposta ruim.
- `parseJsonWithRepair` faz uma segunda chamada de IA quando o JSON falha. Isso deve ser exceção mensurada; primeiro deve haver schema, modo JSON nativo e reparo determinístico local.
- `checkAiHealth` chama um modelo real com “Diga apenas OK”. Smoke test de produção não deve consumir token; deve existir um health check de configuração e um probe real separado, manual/monitorado.
- `sendMessageToGeminiStream` constrói o prompt reenviando todo o histórico e chama Gemini diretamente. O fluxo precisa passar pela mesma política server-side do chat, com limite de histórico, resumo e telemetria.
- A chamada de Groq/OpenRouter no fallback não possui o mesmo envelope de `retryWithBackoff`, timeout e registro de consumo da chamada Cloudflare.
- Os limites de `max_tokens` existem em Cloudflare, mas ainda precisam ser definidos por tarefa, e não apenas por um default global de até 2.048.
- O cliente recebe texto, mas não há evidência de um contrato uniforme para `usage`, `provider`, `model`, `requestId`, `cacheHit` e `finishReason`.
- O repositório tem várias entradas históricas de IA (`pastorAgent`, `geminiService`, `aiTextClient`, `cloudflareAiService`, geradores de estudo, devocional, chat e imagem), o que aumenta o risco de prompts e regras divergentes.

Esses pontos são hipóteses de custo/arquitetura que devem ser confirmadas com telemetria antes de uma migração ampla.

## 3. O que é um harness de IA

Um harness é uma camada de teste e avaliação que executa as mesmas tarefas de IA com entradas controladas e compara o resultado com critérios definidos. Ele não é outro modelo nem precisa ser um produto separado.

No Culto+, o harness deve:

- carregar casos versionados de chat, estudo, sermão, devocional, JSON, legenda e análise;
- executar offline com respostas mockadas para testar parsing, fallback, limites e UI;
- executar uma amostra real pequena, somente quando autorizado, com teto de chamadas/tokens;
- comparar qualidade estrutural, segurança pastoral, fidelidade ao formato e custo;
- gerar relatório por modelo, prompt, versão e caso;
- bloquear regressões quando uma mudança aumenta tokens ou quebra o contrato.

Exemplo de caso:

```json
{
  "id": "study.json.valid-basic",
  "task": "studyGeneration",
  "input": { "verse": "João 3:16", "audience": "adultos" },
  "expected": { "format": "json", "requiredKeys": ["title", "blocks"] },
  "budget": { "maxInputTokens": 900, "maxOutputTokens": 700 }
}
```

O harness deve avaliar comportamento, não “dar nota teológica absoluta” automaticamente. Conteúdo pastoral sensível continua exigindo revisão humana e o `pastorAuditor` deve ser tratado como apoio, não autoridade final.

## 4. Arquitetura alvo

### 4.1 AI Gateway interno

Criar um único executor server-side, por exemplo `services/aiGateway.ts`, com:

- `task`/feature explícita;
- política de modelo e orçamento por tarefa;
- timeout e retry classificados por erro;
- cache e deduplicação;
- validação de entrada e saída;
- registro de uso;
- fallback controlado;
- `requestId` para correlação.

Contrato sugerido:

```ts
type AiTask =
  | 'chat'
  | 'study_generation'
  | 'json_generation'
  | 'json_repair'
  | 'devotional_refresh'
  | 'sermon_builder'
  | 'caption'
  | 'image_prompt'
  | 'tts';

type AiRunResult<T = string> = {
  value: T;
  provider: string;
  model: string;
  requestId: string;
  cacheHit: boolean;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
};
```

O contrato real deve ser definido em `types.ts`, conforme a regra arquitetural do projeto.

### 4.2 Registro de políticas

Centralizar em `constants.ts` ou em uma política server-side versionada:

| Tarefa | Modelo inicial | Saída | Limite inicial | Fallback |
| --- | --- | --- | --- | --- |
| Chat curto | modelo econômico | texto | histórico resumido + saída curta | 1 fallback |
| JSON de estudo | modelo econômico com JSON | schema | entrada e saída definidos pelo schema | reparo local, IA só em último caso |
| Sermão/estudo profundo | modelo de maior qualidade | JSON/texto | orçamento explícito e confirmação quando alto | sem cascata automática longa |
| Devocional diário | geração canônica/cacheada | conteúdo versionado | uma geração por data/escopo | fallback editorial local |
| Legenda/título | modelo econômico | texto curto | saída curta | sem fallback se não crítico |
| Imagem | modelo de imagem | binário | prompt truncado e deduplicado | imagem stock/fallback |
| TTS | modelo TTS | áudio | cache por texto/voz | fallback definido |

Nenhuma tarefa deve usar o modelo mais caro por padrão. A política deve permitir desligar um provedor sem alterar as views.

### 4.3 Contexto eficiente

- Limitar histórico de chat por número de turnos e tokens.
- Criar resumo de conversa quando o limite for atingido; enviar resumo + últimas mensagens, não todo o histórico.
- Extrair somente os blocos do estudo necessários para a operação atual.
- Separar instrução estática, contexto recuperado e entrada do usuário.
- Não reenviar documentos completos quando um hash/ID de versão resolver a recuperação server-side.
- Limitar conteúdo de usuário por tamanho antes de enviar ao modelo.
- Evitar incluir instruções repetidas em cada mensagem quando o servidor já controla o template.

### 4.4 Cache e deduplicação

Implementar em camadas:

1. **Memória/request-local:** evita duplicidade simultânea durante uma única execução.
2. **Cache persistente:** Supabase ou storage apropriado para respostas determinísticas, com `promptVersion`, `model`, `inputHash` e TTL.
3. **Cache semântico posterior:** somente depois de medir segurança e similaridade; não iniciar com busca vetorial para resolver um problema que hash exato já cobre.

Aplicações prioritárias:

- devocional canônico por data;
- contexto bíblico por referência/versão;
- reparos ou normalizações idênticas;
- TTS pelo texto/voz/velocidade;
- imagens com prompt e parâmetros iguais;
- sugestões de título/legenda repetidas.

Nunca compartilhar cache de conteúdo privado entre usuários sem chave de escopo e política de audiência.

### 4.5 Saída estruturada sem chamadas extras

- Definir schemas TypeScript/Zod para cada resposta JSON.
- Solicitar JSON nativo quando o provedor suportar.
- Fazer primeiro `JSON.parse` + validação local.
- Tentar extração determinística de bloco JSON e correções seguras de markdown.
- Só chamar `json_repair` se o caso for realmente recuperável e o orçamento permitir.
- Registrar quantos reparos ocorreram; se a taxa subir, corrigir prompt/schema, não ampliar retries.

## 5. Observabilidade e orçamento

### Métricas mínimas por chamada

- usuário/escopo anonimizado;
- feature/task;
- provider/model;
- promptVersion;
- inputTokens/outputTokens/totalTokens, quando o provedor fornecer;
- estimativa de custo quando não fornecer;
- latência;
- cache hit/miss;
- retry count e fallback count;
- status, erro classificado e tamanho da saída;
- resultado de validação do schema.

Não registrar prompt completo, token, conteúdo pastoral privado ou dados pessoais em logs de produção. Persistir apenas hashes, tamanhos e metadados necessários.

### Limites

- limite por usuário/dia e por tarefa;
- limite por requisição;
- limite de concorrência;
- orçamento mensal por provedor;
- circuit breaker quando um provedor falhar ou o custo subir;
- bloqueio de chamadas duplicadas em andamento;
- confirmação explícita para tarefas de alto custo.

O `usage_today` atual deve evoluir para uma operação atômica; atualizações concorrentes em `profiles` podem perder contagem. Se a precisão de cobrança/limite for importante, usar uma tabela de eventos de uso com chave idempotente e agregação segura.

## 6. Harness e estrutura de testes

### Fase inicial, sem custo de IA

Criar:

- `scripts/ai-harness.mjs` ou equivalente TypeScript;
- `tests/ai-harness/fixtures/*.json`;
- `tests/ai-harness/mocks/`;
- `tests/ai-harness/assertions/`;
- `docs/ai/README.md` com como executar.

Comandos sugeridos:

```text
npm run ai:harness              # somente mocks, rápido e sem chamadas externas
npm run ai:harness:changed      # casos ligados aos arquivos/prompts alterados
npm run ai:harness:live         # amostra real com orçamento explícito
npm run ai:report               # relatório de custo/qualidade
```

O modo `live` deve exigir uma flag explícita, negar produção por padrão e interromper ao atingir o teto de chamadas/tokens.

### Assertions recomendadas

- JSON válido e schema completo;
- ausência de campos proibidos/segredos;
- tamanho máximo de saída;
- referências bíblicas em formato esperado;
- separação entre texto bíblico, interpretação e aplicação;
- ausência de aconselhamento perigoso ou afirmações de autoridade indevida;
- idioma/tom esperado;
- custo e tokens abaixo do orçamento;
- fallback usado somente quando permitido;
- cache hit no segundo caso idêntico;
- idempotência de retry;
- tempo máximo de resposta.

### Avaliação por amostra

Separar três níveis:

1. **Unitário:** parser, normalizador, truncamento, hash, política e classificação de erro.
2. **Contrato:** rota API com provider mockado, auth, capability, quota e formato.
3. **Live eval:** pequeno conjunto real, versionado e agendado manualmente; comparar custo e qualidade contra baseline.

Playwright deve validar as jornadas essenciais; o harness não substitui testes de UI.

## 7. Fases do roadmap

### Fase 0 — Baseline de consumo

- [ ] Inventariar todas as chamadas por feature e provider.
- [ ] Adicionar `requestId`, task, model, latência e status sem registrar conteúdo sensível.
- [ ] Medir tokens reais ou estimados por rota durante sete dias.
- [ ] Identificar top 10 prompts/features por consumo e por repetição.
- [ ] Definir orçamento de referência e metas: redução de 30–50% sem queda de qualidade aceitável.

**Gate:** nenhuma otimização estrutural começa sem saber quais chamadas dominam o consumo.

### Fase 1 — Bloqueios imediatos de desperdício

- [ ] Remover health check real do caminho automático de produção.
- [ ] Desabilitar chamadas duplicadas por clique/concurrency key.
- [ ] Aplicar limite de entrada e saída por feature.
- [ ] Classificar erros antes de fallback/retry.
- [ ] Garantir timeout uniforme em todos os providers.
- [ ] Encaminhar chat e streaming pela fronteira server-side única.

**Gate:** uma falha não dispara cascata ilimitada e uma mesma ação não gera chamadas concorrentes.

### Fase 2 — Gateway e políticas por tarefa

- [ ] Criar `aiGateway` e adaptar `/api/ai/generate`, `/api/ai/chat`, `/api/ai/studio`, imagem e TTS.
- [ ] Criar registro de modelos, budgets e fallback por task.
- [ ] Uniformizar auth, `checkFeatureAccess`, quota, retry e telemetria.
- [ ] Remover acessos diretos dos componentes/views.

**Gate:** toda chamada de IA passa por um executor observável e governado.

### Fase 3 — Contexto, cache e JSON

- [ ] Implementar truncamento por tokens e resumo de histórico.
- [ ] Implementar hash/deduplicação de request.
- [ ] Cachear devocional canônico, TTS, contexto bíblico e respostas determinísticas.
- [ ] Adotar schemas e reparo local antes de `json_repair`.
- [ ] Persistir versões de prompt e invalidar cache quando a versão mudar.

**Gate:** casos repetidos têm cache hit e JSON inválido não chama automaticamente um segundo modelo na maioria dos casos.

### Fase 4 — Harness e regressão de custo

- [ ] Criar fixtures representativas e mocks por provider.
- [ ] Criar comandos `ai:harness`, `ai:harness:changed` e `ai:harness:live`.
- [ ] Adicionar assertions de qualidade, segurança, schema e orçamento.
- [ ] Criar baseline por prompt/modelo.
- [ ] Adicionar relatório de diferença de tokens e qualidade em PR/CI.

**Gate:** uma mudança de prompt/modelo mostra impacto antes de ser publicada.

### Fase 5 — Otimização de qualidade/custo

- [ ] Usar modelo econômico para tarefas curtas e determinísticas.
- [ ] Reservar modelos maiores para tarefas profundas ou revisão explícita.
- [ ] Testar prompts menores com o harness, não por intuição.
- [ ] Avaliar saída em duas etapas locais: geração → validação; chamar segunda IA apenas quando necessário.
- [ ] Avaliar fine-tuning/distillation somente se o volume e a estabilidade justificarem; não é o primeiro passo.

**Gate:** matriz de modelo por tarefa sustentada por dados de qualidade e custo.

### Fase 6 — Operação contínua

- [ ] Dashboard de consumo por feature, usuário, modelo e provider.
- [ ] Alertas para aumento de tokens, fallback, erro JSON e latência.
- [ ] Revisão mensal de prompts e de casos do harness.
- [ ] Expiração e limpeza de caches conforme privacidade/TTL.
- [ ] Atualizar documentação, release notes e versão a cada entrega significativa.

## 8. Impactos no repositório

| Área | Arquivos prováveis | Impacto |
| --- | --- | --- |
| Gateway | `services/geminiService.ts`, novo `services/aiGateway.ts` | alto |
| Providers | `services/cloudflareAiService.ts`, `services/aiTextClient.ts`, config de Gemini/Groq/OpenRouter | alto |
| Rotas | `app/api/ai/*`, `app/api/devotional/daily` | alto |
| Access/quota | `services/aiFeatureAccessPolicy.ts`, `profiles.usage_today`, migrations | alto |
| Prompts | `services/pastorAgent.ts`, `services/pastorAuditor.ts`, estudo, devocional, chat | alto |
| UI | `components/AIChat.tsx`, `ObreiroIAChatbot.tsx`, Studio e telas de geração | médio |
| Testes | `tests/`, novos `tests/ai-harness/`, scripts | alto |
| Observabilidade | novo serviço/tabela/relatório, sem conteúdo bruto | médio/alto |
| Documentação | `_ARCHITECT_AGENT.md`, `constants.ts`, `_RELEASENOTES.md`, `docs/ai/` | médio |

## 9. Critérios de aceite

1. Toda chamada de IA tem task, provider/model, promptVersion, requestId e status mensuráveis.
2. Toda chamada autenticada passa por capability, quota e fronteira server-side.
3. O chat não reenvia indefinidamente o histórico completo.
4. Fallback e retry têm limite, classificação e timeout.
5. Requests idênticos em janela configurada não geram chamadas duplicadas.
6. JSON é validado localmente e reparo por IA é raro, mensurado e limitado.
7. O harness executa testes sem custo externo por padrão.
8. O modo live exige autorização explícita e possui teto de tokens/chamadas.
9. CI bloqueia aumento de custo acima do orçamento definido para casos críticos.
10. Nenhum log de produção expõe prompt privado, token, segredo ou dado pessoal.

## 10. Priorização recomendada

### Primeiros 7 dias

Instrumentar consumo, bloquear duplicidade/concurrency, retirar smoke tests reais do caminho automático, limitar saída e corrigir o streaming direto fora do gateway.

### Próximos 14 dias

Implementar gateway mínimo, política por tarefa, classificação de fallback, cache exato e schemas para as três respostas JSON de maior volume.

### Próximos 30 dias

Entregar harness mockado, baseline de custo/qualidade, resumo de chat, relatório de PR e dashboard operacional.

### Depois do baseline

Testar substituição de modelos e prompts com evidência. Só então considerar cache semântico, fine-tuning ou arquitetura multiagente.

## 11. Decisões que precisam de aprovação

- Qual orçamento mensal e diário é aceitável por feature?
- Quais tarefas podem usar somente modelo econômico?
- Quais conteúdos exigem revisão humana/pastoral antes de persistir/publicar?
- O cache persistente ficará em Supabase ou em uma camada externa?
- O harness live rodará manualmente, em CI noturno ou ambos?
- Podemos armazenar métricas agregadas de uso por usuário/igreja, respeitando privacidade?
