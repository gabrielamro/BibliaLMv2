# Roadmap — Desenvolvimento Assistido por IA e Economia de Tokens

**Status:** proposta de arquitetura de trabalho  
**Escopo:** reduzir tokens, tempo e retrabalho consumidos pela IA durante a evolução do código do Culto+.  
**Fora do escopo:** consumo de IA pelos usuários finais, quotas de chat/imagem do produto e custo dos provedores em produção.

## 1. Objetivo

Criar um fluxo em que a IA receba somente o contexto necessário, execute mudanças pequenas e verificáveis, reutilize conhecimento estável do projeto e pare antes de reler ou reescrever partes irrelevantes.

O resultado esperado não é “mandar menos texto a qualquer custo”. É reduzir contexto inútil sem perder segurança arquitetural, regras de produto ou qualidade de revisão.

Metas sugeridas para a primeira medição:

- reduzir em 40% o contexto médio enviado por tarefa;
- reduzir em 30% as reexecuções causadas por falta de contexto ou escopo ambíguo;
- manter ou melhorar a taxa de typecheck/build/teste bem-sucedida na primeira tentativa;
- reduzir mudanças fora do escopo e diffs revertidos;
- tornar o tempo de descoberta de arquivos e regras previsível.

## 2. O que é o harness neste contexto

O harness será uma camada local de execução e avaliação para o trabalho da IA no repositório. Ele não precisa chamar outro modelo.

Ele deve:

- preparar um pacote mínimo de contexto para cada tipo de tarefa;
- executar comandos determinísticos de validação;
- comparar o diff produzido com invariantes do projeto;
- detectar arquivos fora do escopo, alterações perigosas e regressões de contratos;
- gerar um resumo curto para a próxima iteração da IA;
- permitir uma rodada mockada/offline antes de qualquer revisão mais cara.

Em termos simples: o harness funciona como “memória operacional + testes + porteiro do diff” para o agente.

## 3. Diagnóstico do fluxo atual

O repositório já possui boas fontes de verdade, mas elas estão distribuídas:

- `_PROJECT_CONTEXT.md` e `_ARCHITECT_AGENT.md` contêm regras amplas;
- `.agents/skills/*/SKILL.md` contém instruções por especialidade;
- `types.ts`, `constants.ts`, `moduleThemes.ts` e shells contêm contratos canônicos;
- roadmaps e release notes guardam decisões históricas;
- testes específicos comprovam contratos de UI, segurança e negócio.

Sem uma camada de seleção, a IA tende a:

- receber documentos inteiros quando apenas uma seção é relevante;
- reler arquivos grandes para encontrar poucas funções;
- misturar arquitetura histórica com regra atual;
- alterar arquivos próximos, mas fora do pedido;
- repetir explicações e contexto já estabilizado;
- executar build/testes amplos antes de uma validação barata;
- gastar tokens descrevendo progresso em vez de produzir evidência.

O primeiro trabalho deve medir esses padrões no fluxo real, não presumir que todo contexto é desperdício.

## 4. Arquitetura proposta para o desenvolvimento assistido

### 4.1 Context pack por tarefa

Criar um gerador de contexto por intenção, por exemplo:

```text
scripts/ai-context-pack.mjs --task frontend --route /meus-cultos
scripts/ai-context-pack.mjs --task supabase --area church-management
scripts/ai-context-pack.mjs --task bug --text "erro de runtime na agenda"
```

O pacote deve retornar somente:

1. regras globais aplicáveis;
2. skill(s) necessárias;
3. arquivos de entrada relevantes;
4. contratos/tipos consumidos;
5. testes próximos;
6. comandos de validação;
7. riscos conhecidos e decisões abertas.

Não deve despejar o repositório inteiro nem roadmaps não relacionados.

### 4.2 Índice local do repositório

Manter um índice leve, gerado por script, com:

- rota → view → componentes → serviços → tipos → testes;
- arquivo → módulo visual;
- serviço → tabelas/API usadas;
- skill → áreas aplicáveis;
- comando → custo/tempo aproximado;
- decisão → arquivo de origem e status.

O índice pode começar como JSON/Markdown versionado. Não é necessário introduzir embeddings ou banco vetorial na primeira fase.

### 4.3 Memória de projeto em camadas

Separar informação por estabilidade:

- **Sempre:** regras arquiteturais e segurança;
- **Por tarefa:** arquivos, rota, critérios e testes relevantes;
- **Histórico:** release notes e decisões antigas, consultados somente quando necessário;
- **Descartável:** logs de uma execução, tentativas e hipóteses já invalidadas.

A IA deve receber o resumo atual e links/paths para detalhes, e não todo o histórico acumulado.

### 4.4 Contrato de tarefa antes da implementação

Antes de editar, cada tarefa deve ter um envelope compacto:

```yaml
objective: "Separar escalas de Meus Cultos"
scope:
  include: ["app/minhas-escalas", "views/MyCultosPage.tsx", "components/CultoPlusPageShell.tsx"]
  exclude: ["redesign global", "alterações de schema sem necessidade"]
acceptance:
  - "typecheck passa"
  - "links antigos continuam funcionando"
validation: ["npm run typecheck", "npm run test:...", "npm run build"]
```

Esse contrato reduz ambiguidades e permite ao harness verificar se a IA mexeu além do pedido.

## 5. Estratégias diretas de economia de tokens

### Contexto

- usar `rg`/índice para localizar antes de abrir arquivos;
- ler faixas de linhas em vez de arquivos extensos completos;
- carregar uma skill por vez, salvo quando a tarefa realmente cruza especialidades;
- resumir documentos de contexto estáveis em referências curtas;
- não reenviar saída anterior inteira: manter somente decisões, erros e próximos checks;
- anexar o diff atual e o erro atual, não toda a conversa histórica;
- parar a busca quando a cadeia de impacto estiver comprovada.

### Implementação

- preferir patches pequenos e uma intenção por patch;
- não refatorar enquanto corrige um bug, salvo impacto comprovado;
- separar investigação, implementação e validação;
- pedir à IA para reportar arquivos alterados e evidência, não narrativa extensa;
- usar scripts existentes para operações repetíveis;
- evitar gerar código que já existe em outro componente.

### Validação

Executar em ordem crescente de custo:

1. checagem estrutural do diff;
2. teste unitário/contrato focado;
3. typecheck;
4. teste de módulo;
5. build;
6. E2E e revisão visual quando aplicável.

Se uma etapa barata falhar, não gastar tokens com diagnóstico de uma etapa cara.

## 6. Harness de desenvolvimento

### Componentes

Criar inicialmente:

- `scripts/ai-context-pack.mjs` — seleção de contexto;
- `scripts/ai-harness.mjs` — orquestração de checks;
- `scripts/ai-diff-guard.mjs` — validação de escopo e arquivos proibidos;
- `tests/ai-harness/fixtures/` — tarefas representativas;
- `tests/ai-harness/invariants/` — regras verificáveis;
- `docs/ai-development/` — manual curto de operação.

### Comandos sugeridos

```text
npm run ai:context -- --task frontend --route /meus-cultos
npm run ai:harness -- --fixture frontend-route
npm run ai:harness:changed
npm run ai:diff-guard
npm run ai:verify
```

O primeiro modo deve ser barato e local. O harness não deve depender de uma API de IA para validar o diff.

### Invariantes iniciais

- nenhum segredo ou `.env` entra no diff;
- nenhuma alteração fora do escopo declarado sem justificativa;
- UI não chama Supabase diretamente quando a regra exige `services/`;
- novas rotas usam o shell correto;
- `types.ts` continua sendo a fonte global de tipos;
- rotas novas atualizam o resolver de módulo quando necessário;
- chamadas de IA continuam protegidas pelas políticas arquiteturais do projeto;
- mudanças relevantes possuem teste ou justificativa explícita;
- `npm run typecheck` passa;
- build/testes pertinentes passam antes da entrega.

### Fixture de tarefa

Cada fixture deve conter:

- pedido original resumido;
- skill(s) esperadas;
- arquivos permitidos;
- arquivos proibidos;
- invariantes;
- validações;
- tamanho máximo esperado do diff;
- resultado esperado.

Exemplo de fixtures prioritárias:

- corrigir bug em rota API;
- criar rota frontend dentro do shell Culto+;
- alterar serviço Supabase com RLS;
- atualizar um componente visual;
- investigar erro sem implementar;
- revisar uma alteração existente.

## 7. Fluxo operacional recomendado para a IA

### Etapa A — Classificar

Identificar se o pedido é responder, diagnosticar, revisar ou implementar. Isso impede que uma investigação gere mudanças não autorizadas.

### Etapa B — Montar contexto mínimo

Selecionar skill, regras, arquivos, dependências e testes. Registrar o motivo de cada arquivo incluído.

### Etapa C — Criar contrato

Definir objetivo, escopo, exclusões, critérios de aceite e comandos de validação.

### Etapa D — Investigar

Usar busca direcionada e leitura parcial. Produzir apenas achados confirmados, suspeitas e impacto.

### Etapa E — Implementar em patch pequeno

Editar somente os arquivos autorizados. Se o impacto exigir ampliar escopo, parar e registrar a justificativa.

### Etapa F — Validar progressivamente

Rodar o harness, diff guard e checks baratos antes de build/E2E.

### Etapa G — Entregar memória compacta

Registrar:

- o que mudou;
- arquivos e contratos afetados;
- validações executadas;
- limitações e próximo passo seguro.

Esse resumo substitui reenviar toda a conversa em uma nova tarefa.

## 8. Fases do roadmap

### Fase 0 — Medição do fluxo atual

- [ ] Coletar 10–20 tarefas recentes feitas com IA.
- [ ] Medir arquivos lidos, tamanho aproximado do contexto, número de iterações e validações.
- [ ] Classificar desperdícios: contexto, repetição, escopo, falha de validação e retrabalho.
- [ ] Definir baseline de tokens/tempo por tipo de tarefa.

**Gate:** metas baseadas no fluxo real, não em estimativa.

### Fase 1 — Context pack mínimo

- [ ] Criar catálogo de tarefas, skills e arquivos canônicos.
- [ ] Implementar `ai-context-pack` com saída curta e caminhos absolutos.
- [ ] Adicionar regras de inclusão/exclusão.
- [ ] Criar templates para frontend, backend, Supabase, bug e revisão.

**Gate:** uma tarefa típica consegue iniciar com um pacote menor sem perder dependências essenciais.

### Fase 2 — Contrato e diff guard

- [ ] Criar schema de contrato de tarefa.
- [ ] Implementar verificação de arquivos fora do escopo.
- [ ] Verificar invariantes arquiteturais simples.
- [ ] Gerar relatório de diff curto para a IA.

**Gate:** o harness detecta alteração indevida antes do build.

### Fase 3 — Harness determinístico

- [ ] Criar fixtures representativas.
- [ ] Implementar checks baratos, typecheck e testes focados.
- [ ] Criar `ai:verify` como porta de qualidade local.
- [ ] Produzir relatório compacto com falha acionável.

**Gate:** a IA recebe erro específico e reproduzível, sem precisar reler o repositório inteiro.

### Fase 4 — Memória e continuidade

- [ ] Criar formato de resumo de tarefa concluída.
- [ ] Indexar decisões ativas e roadmaps sem carregar histórico irrelevante.
- [ ] Registrar decisões em documentos canônicos quando houver mudança arquitetural.
- [ ] Evitar que a memória acumule tentativas descartadas.

**Gate:** uma nova sessão retoma o trabalho com resumo curto e evidência verificável.

### Fase 5 — Integração com CI e revisão

- [ ] Executar diff guard e invariantes em pull requests quando aplicável.
- [ ] Comparar tempo/token estimado por fixture ao baseline.
- [ ] Bloquear regressões de contrato, não bloquear por estilo subjetivo.
- [ ] Criar relatório de revisão pronto para o humano.

**Gate:** economia de tokens não reduz a segurança da entrega.

### Fase 6 — Otimização contínua

- [ ] Remover contexto que não altera decisões.
- [ ] Consolidar prompts repetidos em templates curtos.
- [ ] Atualizar fixtures quando surgirem regressões reais.
- [ ] Revisar mensalmente custo, primeira tentativa, retrabalho e escopo.

## 9. Impactos no repositório

| Área | Impacto | Observação |
| --- | --- | --- |
| Scripts | médio/alto | novos comandos locais e relatórios |
| Testes | alto | fixtures e invariantes do harness |
| Skills | médio | referências mais roteáveis e específicas |
| Documentação | alto | manual de contexto, contratos e memória |
| CI | médio | checks baratos em PR, sem chamar IA por padrão |
| Código de produto | baixo inicialmente | a primeira fase não altera runtime do app |
| Arquitetura | médio | formaliza fontes da verdade e dependências |

## 10. Critérios de aceite

1. Uma tarefa frontend não carrega contexto de Supabase, IA ou Gestão sem dependência comprovada.
2. Uma tarefa de bug não altera código automaticamente sem autorização explícita.
3. O harness identifica arquivos fora do escopo e invariantes quebradas.
4. O fluxo padrão não chama modelo externo para validar typecheck, diff ou testes.
5. Os erros do harness são curtos, reproduzíveis e acionáveis.
6. Uma nova sessão consegue retomar uma tarefa usando um resumo compacto.
7. O processo mantém as skills e regras de segurança aplicáveis.
8. O ganho é medido por tokens/contexto, iterações e sucesso na primeira validação.

## 11. Priorização recomendada

### Primeiros 7 dias

Criar templates de contrato, catálogo de arquivos canônicos, `ai-context-pack` inicial e medição de 10 tarefas reais.

### Próximos 14 dias

Criar `ai-diff-guard`, fixtures de frontend/backend/Supabase e validação progressiva local.

### Próximos 30 dias

Integrar `ai:verify` à rotina, documentar memória de tarefa, adicionar checks a PRs e comparar o baseline com os resultados.

### Depois do baseline

Considerar indexação semântica/RAG do repositório somente se busca por caminhos e contexto roteado não forem suficientes. Embeddings não devem ser o primeiro investimento.

## 12. Decisões em aberto

- Onde o harness será executado: somente local, CI ou ambos?
- O contexto pack será gerado sob demanda ou também persistido por tarefa?
- Qual limite de arquivos/diff deve bloquear uma tarefa?
- Quais invariantes devem ser bloqueantes e quais apenas alertas?
- Como medir tokens quando a interface de IA não expõe contagem exata?
- Quais tipos de tarefa merecem fixtures obrigatórias antes de qualquer implementação?
