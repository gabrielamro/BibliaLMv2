# Programa de Execução — Agosto de 2026

## Objetivo

Transformar os roadmaps do Culto+ em uma fila única, verificável e segura de execução. Este documento não substitui o histórico dos roadmaps existentes; ele registra a ordem operacional atual e o critério para encerrar cada frente.

## Regra de operação

- Uma frente de produto ampla só entra em implementação quando a dependência anterior tiver evidência de conclusão.
- Cada entrega deve registrar responsável, escopo, teste executado, decisão de produto e atualização do roadmap de origem.
- Conteúdo pastoral, oração, testemunho, presença e dados de grupos privados exigem revisão de privacidade e cuidado pastoral antes do rollout.
- Nenhuma mudança de credencial, pagamento, produção ou dado real é executada sem a autorização e o acesso apropriados.

## Situação inicial confirmada

- O worktree possui uma entrega local em andamento para `v2.10.6` (Trilhas e Diário). Os arquivos de versão e contexto já foram alterados por essa entrega e não devem ser reutilizados para esta frente antes de sua conclusão.
- O repositório tem cinco rotas API no App Router: IA do Estúdio, contexto bíblico, busca de igrejas, devocional diário e proxy de imagem.
- A triagem inicial identificou referências que exigem auditoria de fronteira servidor/cliente, dados privilegiados, HTML renderizado e scripts operacionais. O resultado é um inventário de risco; não afirma vulnerabilidade sem revisão contextual.
- A configuração inicial não possuía CI versionada. O workflow `Quality gate` foi incluído para pull requests e `main`, com Node 20, instalação reprodutível, typecheck, regressões de Gestão e Reino, políticas de segurança e build.

### Achados confirmados da triagem 1A

- `app/api/ai/studio` valida bearer token, usuário e plano antes de chamar a IA; a revisão seguinte deve confirmar que o controle central de cota também é aplicado em toda a cadeia de geração.
- `app/api/devotional/daily` mantém a chave de serviço no servidor e valida o token para operações pessoais.
- `app/api/image-proxy` usa lista de domínios, mas segue redirecionamentos sem revalidar o destino e não limita tamanho nem valida o tipo de conteúdo retornado. Essas proteções entram no pacote de hardening antes de ampliar seu uso.
- `app/api/churches/search` aceita busca pública e consulta provedores externos. Necessita limite de entrada, rate limit e política explícita de logs/custos antes de escalar tráfego.

### Entrega concluída no pacote 1A

- O proxy de imagens agora aceita apenas HTTPS em hosts exatos, revalida cada redirecionamento, limita a resposta a 5 MB e aceita somente `Content-Type` de imagem. A política possui três testes automatizados e passou no typecheck em 06/08/2026.
- A busca pública de igrejas agora limita e valida os parâmetros de entrada e reduz o log de falha do provedor ao status técnico, sem registrar o corpo retornado. Rate limit compartilhado continua como requisito de infraestrutura para o pacote 1B.
- A busca pública de igrejas aceita somente chaves privadas no servidor e envia cache HTTP compartilhável de cinco minutos para respostas bem-sucedidas; isso reduz chamadas repetidas aos provedores, mas não substitui rate limit distribuído.
- A geração de estudos por IA agora resolve acesso no servidor por uma política central: perfis pastorais e gestores, matriz de recursos configurável e fallback compatível com os planos existentes. A cota diária persistente continua pendente de uma operação atômica no banco; não será simulada em memória.
- A auditoria estrutural e a validação comportamental de RLS da Gestão da Igreja passaram contra o banco configurado. O validador reconhece as políticas granulares atuais de QR e os nomes introduzidos pelas migrações de escopo; a matriz comportamental confirmou gestor, pastor, líder, voluntário, membro e admin em transações revertidas.

## Fase 0 — Governança e baseline

**Status:** em execução

### Entregas

1. Manter este registro como fila única de execução.
2. Ao concluir a entrega local `v2.10.6`, reconciliar versão, release notes, contexto e roadmap status.
3. Classificar cada roadmap como `ativo`, `entregue`, `substituído` ou `arquivado`.
4. Converter somente roadmaps ativos em épicos pequenos com responsável, risco e critério de aceite.

### Critério de conclusão

- Há uma única fonte para o status de cada iniciativa.
- Roadmaps entregues não aparecem como backlog ativo.
- Toda tarefa ativa tem evidência de produto, segurança e teste esperada.

### Classificação operacional dos roadmaps (06/08/2026)

`Entregue` significa que o escopo declarado já está no código. `Ativo` significa que ainda há evolução ou rollout verificável; não significa autorização para iniciar sem o gate anterior. `Substituído` e `arquivado` preservam contexto histórico, mas não entram na fila.

| Roadmap | Situação | Decisão operacional |
| --- | --- | --- |
| Consolidação de rotas, segurança e integrações | ativo | Fonte da Fase 1; rate limit distribuído continua pendente. |
| Culto+ implementation tracker | ativo | MVP entregue; os cinco momentos litúrgicos restantes são evolução pastoral futura. |
| Devocional — leitura prioritária | entregue | Entregue na v2.6.10. |
| Estúdio da Palavra — editor unificado | entregue | O próprio documento registra a conclusão na v2.8.0. |
| Conteúdo do ecossistema no Feed | entregue | Entregue na v2.6.0. |
| Gestão de cultos — refatoração de listagem/detalhe | arquivado | Proposta complementar absorvida pelas rotas atuais de Gestão. |
| Gestão da Igreja — central de controle de cultos | arquivado | Proposta de produto absorvida pela Gestão da Igreja atual. |
| Gestão da Igreja independente | substituído | Arquitetura substituída pelo status operacional e pelas rotas implementadas. |
| Gestão da Igreja independente — status | ativo | Implementação base concluída; restam quatro itens marcados no próprio documento. |
| Gestão de pessoas, equipes e cultos — arquitetura frontend | arquivado | Documento de arquitetura histórico, sem backlog operacional marcado. |
| Home/Reino mobile ready | arquivado | Sem pendência executável registrada; manter apenas como referência histórica. |
| Jornada digital do culto | ativo | Possui itens abertos e depende do baseline de segurança e perfis de teste. |
| Maná — expansão, níveis e rankings | ativo | Código e migration preparados; depende da aplicação/validação controlada no Supabase. |
| Monetização, assinatura e gamificação | ativo | Implementação declarada em andamento; bloqueada por controles de segurança e pagamento. |
| Obreiro IA — suporte do app | ativo | Backlog de produto aberto; só inicia após quota persistente e base versionada. |
| Padronização visual por módulos | entregue | Entregue na v2.8.1. |
| Pão Diário Culto+ | ativo | Núcleo entregue; evolução editorial e auditoria continuam planejadas. |
| Perfis gerais e permissões por igreja | ativo | Implementação inicial aplicada; resta uma pendência de experiência. |
| Reino — feed, perfis, igrejas e UI/UX | ativo | Fundação funcional entregue; fases de privacidade, busca e testes seguem abertas. |
| Reino — visibilidade e descoberta | substituído | Regras incorporadas ao roadmap de Reino UI/UX, que é a fonte ativa. |

### Épicos ativos e gates de aceite

| Ordem | Épico | Dono funcional | Risco | Gate de aceite |
| --- | --- | --- | --- | --- |
| 1 | Limites e observabilidade de endpoints públicos | Engenharia/DevOps | alto: custo e abuso de provedores | contador distribuído por IP/usuário, métricas sem dados pessoais e teste de 429. |
| 2 | RLS comportamental por perfil | concluído | alto: acesso indevido entre papéis | Matriz aprovada para os seis papéis em 06/08/2026, com rollback por transação. |
| 3 | Fluxo de voluntariado da Gestão | Produto + Engenharia | alto: dados pessoais e permissão operacional | interesse, convite, aceite/recusa, escala e atualização de vaga persistem com perfis de teste. |
| 4 | Privacidade e audiência do Reino | Produto + Engenharia | alto: exposição de conteúdo restrito | audiência compreensível antes de publicar; UI, API e RLS bloqueiam acesso fora do público. |
| 5 | Evolução editorial do Pão Diário | Produto editorial + revisão pastoral | médio: confusão entre Bíblia e aplicação | conteúdo auditável, origem explícita, privacidade por padrão e revisão pastoral. |
| 6 | Obreiro IA como ajuda de produto | Produto + Engenharia | médio: custo e orientação inadequada | base versionada, limites persistentes e respostas separadas de aconselhamento pastoral. |
| 7 | Maná e monetização | Produto + Engenharia | alto: impacto financeiro e espiritual | migration aplicada, auditoria administrativa e nenhuma cobrança por acesso essencial. |

## Fase 1 — Segurança e integrações

**Status:** triagem iniciada; não iniciar mutações de produção sem autorização.

### Pacote 1A — Inventário e classificação

- Revisar rotas API, serviços, scripts e variáveis por tipo de acesso: público, autenticado, administrativo e serviço.
- Classificar renderização HTML/UGC/IA e registrar o controle de sanitização aplicável.
- Mapear operações de banco com privilégio e sua política RLS/teste por papel.

#### Inventário de rotas API confirmado

| Rota | Acesso | Dependência privilegiada | Controles confirmados | Próximo controle |
| --- | --- | --- | --- | --- |
| `/api/ai/chat` | autenticado | Supabase service role + Cloudflare Workers AI | bearer validado, plano, limite de entrada, retry e resposta sem cache | contador de cota atômico e rate limit compartilhado. |
| `/api/ai/generate` | autenticado | Supabase service role + provedor textual | bearer, capability central, limite de entrada, retry e resposta sem cache | contador de cota atômico e rate limit compartilhado. |
| `/api/ai/image` | autenticado | Supabase service role + provedor de imagem | bearer, capability, limite de entrada e resposta sem cache | contador de cota atômico e rate limit compartilhado. |
| `/api/ai/studio` | autenticado | Supabase service role + IA | bearer, capability central, limite de entrada, retry e resposta sem cache | cota diária persistente e atômica. |
| `/api/bible/context` | público | nenhuma; Bíblia empacotada | referência numérica validada | cache/limite só se métricas mostrarem pressão; não há custo de provedor. |
| `/api/churches/search` | público | Google Places ou Nominatim | entrada limitada, segredo server-only, cache HTTP e logs reduzidos | rate limit distribuído e sinais de custo por provedor. |
| `/api/devotional/daily` | público para conteúdo canônico; autenticado para personalização | Supabase service role + geração editorial | token para dados pessoais, reserva de atualização e resposta privada sem cache | rate limit compartilhado na geração antes de escalar tráfego. |
| `/api/image-proxy` | público | banda de provedor externo | allowlist HTTPS, redirecionamento revalidado, MIME e tamanho limitados, cache | rate limit distribuído e métrica de banda. |

#### Inventário de renderização HTML/UGC/IA

| Superfície | Evidência observada | Situação | Próxima ação |
| --- | --- | --- | --- |
| Título institucional da landing | quebras de linha renderizadas por composição React | concluído | configuração não é mais interpretada como HTML. |
| Estudos, planos e blocos ricos públicos | `dangerouslySetInnerHTML` e `innerHTML` em renderizadores/editor | requer auditoria de contrato de escrita e leitura | definir sanitização no limite de persistência e renderização; cobrir payload malicioso. |
| Análises e respostas de IA | HTML inserido em Notebook e chat | requer auditoria; IA não deve ser tratada como confiável | renderizar texto/Markdown seguro ou sanitizar uma allowlist mínima antes da UI. |
| Script de tema no layout | `dangerouslySetInnerHTML` com script local fixo | controlado pelo código | manter isolado e sem interpolação de dados do usuário. |

Não foi encontrado um sanitizador HTML reconhecível no código pesquisado. Isso confirma ausência de evidência de sanitização central, mas não prova exploração enquanto as origens e os contratos de persistência dos campos ainda não forem revisados.

O primeiro recorte foi concluído nos leitores públicos de estudos e planos, no Notebook de análises e no bloco de conteúdo de estudos: a allowlist permite somente marcação editorial e links `https`, `mailto`, relativos ou âncoras. Scripts, eventos, mídia incorporada, formulários, estilos e URLs perigosas são removidos antes de `dangerouslySetInnerHTML`. As demais superfícies continuam em auditoria separada.

### Pacote 1B — Controles de entrega

- Definir a suíte mínima bloqueante: typecheck, testes do módulo afetado e build.
- Propor a configuração de CI após validação do ambiente de deploy.
- Registrar logs seguros, limites de requisição e sinais operacionais necessários por endpoint público.

### Entrega concluída no pacote 1B

- A porta de qualidade foi versionada em `.github/workflows/quality.yml`. Os runners Node passaram a declarar `esbuild` como dependência de desenvolvimento, eliminando uma dependência implícita que impediria testes em ambiente limpo. A validação local passou em Node 20 para typecheck, 47 testes de Gestão, 12 de Reino, 13 de políticas de segurança e build de produção.
- Nenhum contador distribuído está configurado no repositório para os endpoints públicos. A escolha e a credencial de uma infraestrutura compartilhada de rate limit permanecem pré-requisito para aplicar o limite de tráfego de forma efetiva.

### Critério de conclusão

- Cada rota privilegiada possui dono, autenticação/autorização e teste correspondente.
- Não há segredo ou ação administrativa exposta ao cliente.
- CI bloqueia regressões técnicas definidas pelo time.

## Fase 2 — Gestão da Igreja

**Status:** aguardando conclusão do baseline de segurança.

### Primeiro recorte

`interesse de voluntário → convite → aceite/recusa → equipe/escala → atualização da vaga`

### Critério de conclusão

- Fluxo validado com perfis reais de teste e dados descartáveis no Supabase.
- Permissões, transições e notificações persistem após recarga.
- Indicadores usam dados reais e não inferem maturidade espiritual.

## Fase 3 — Reino

**Status:** planejado; iniciar após os contratos de permissões da Fase 1.

### Primeiro recorte

`audiência do post → comentário → seguir/membresia → convite e aceite de grupo`

### Critério de conclusão

- O usuário entende a audiência antes de publicar.
- Conteúdo privado não é acessível fora da audiência em UI, API ou Data API.
- Convites e vínculos sociais têm estados explícitos e testados.

## Fase 4 — Experiências pastorais e de valor

**Status:** planejado.

- Culto+: modelar os cinco momentos restantes com consentimento, moderação e responsáveis.
- Pão Diário: priorizar qualidade editorial, continuidade e transparência entre Bíblia, interpretação e aplicação.
- Obreiro IA: manter base de ajuda versionada, transparente e separada de aconselhamento pastoral.

### Entrega editorial do Pão Diário — 07/08/2026

- A geração de um novo devocional passa pelo auditor pastoral antes de ser persistida; falha, reprovação ou resposta incompleta impedem a publicação automática.
- Quando a auditoria não aprova o material, o fluxo preserva o fallback previamente revisado em vez de apresentar uma geração não verificada.
- A leitura identifica se a reflexão é editorial do Culto+ ou foi gerada com apoio de IA e reforça que ela não substitui o texto bíblico no contexto.
- Regressão coberta em `tests/devotionalEditorialSafety.test.ts`; typecheck executado com sucesso.

## Fase 5 — Crescimento e monetização

**Status:** bloqueado pelas Fases 1 a 3.

- Replanejar SEO para a arquitetura atual em Next.js, com metadata e indexação verificáveis no servidor.
- Consolidar pagamentos e auditoria administrativa antes de qualquer ampliação comercial.
- Cobrar por capacidade técnica e organização, nunca por acesso à Bíblia, oração essencial ou pertencimento.

## Próxima revisão

Após a entrega local `v2.10.6` e a conclusão do inventário da Fase 1A, decidir o primeiro épico implementável da Gestão da Igreja.
