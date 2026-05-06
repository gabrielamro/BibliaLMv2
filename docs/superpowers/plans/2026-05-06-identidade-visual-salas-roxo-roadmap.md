# Identidade Visual Roxa para Salas Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar uma identidade visual unica para Planos/Salas/Jornadas, usando roxo como cor de dominio, para diferenciar claramente esse produto dos Estudos em todos os pontos de criacao, publicacao, preview, feed e descoberta.

**Architecture:** Introduzir tokens semanticos de dominio para "room/sala" e aplicar gradualmente em componentes ja existentes, sem redesenhar telas inteiras. O trabalho deve centralizar estilo em helpers/componentes reutilizaveis e substituir usos pontuais de `bible-gold` somente quando o contexto for Sala/Plano/Jornada.

**Tech Stack:** Next.js App Router, React, TypeScript, TailwindCSS, Lucide React, Supabase data models existentes, Playwright, Node test runner.

---

## Product Direction

Hoje "Estudo" e "Sala" competem visualmente. Ambos usam muito dourado (`bible-gold`), cards parecidos e linguagem de publicacao semelhante. A nova direcao cria uma assinatura propria:

- **Estudo:** conteudo editorial individual, leitura profunda, artigo/devocional. Continua com linguagem dourada/papel.
- **Sala/Plano/Jornada:** ambiente vivo de discipulado, turma, progresso, acesso, participantes e publicacao comunitaria. Passa a usar roxo como cor principal.

A Sala deve ser reconhecida no primeiro olhar, seja no Feed do Reino, workspace, preview publicada, editor ou cards de descoberta.

## Visual Identity

### Core Tokens

Criar tokens semanticos para sala:

```ts
room: {
  ink: '#2b174f',
  purple: '#7c3aed',
  purpleDark: '#5b21b6',
  purpleSoft: '#f3e8ff',
  violet: '#8b5cf6',
  indigo: '#4f46e5',
  surface: '#faf5ff',
  ring: 'rgba(124, 58, 237, 0.28)'
}
```

Aplicacao sugerida:

- Primario: `room-purple`.
- Hover/ativo: `room-purpleDark`.
- Fundos suaves: `room-purpleSoft` / `room-surface`.
- Bordas/focus: `room-ring`.
- Gradiente permitido, com parcimonia: roxo -> indigo.

### Visual Markers

Para diferenciar de estudo:

- Badge fixo: "Sala" ou "Jornada".
- Icone principal: `Users`, `GraduationCap`, `Route`, `CalendarDays` ou `LayoutDashboard`, nunca `BookOpen` como marcador principal.
- CTAs de sala: roxo.
- Cards de sala: borda/halo roxo, label roxo, status "Sala ativa".
- Feed: post de sala deve ter composicao propria, nao reutilizar o card premium de estudo como se fosse artigo.

## Scope Boundaries

In scope:

- Tokens de design para sala.
- Helper de identidade visual para tipo de conteudo.
- Cards de sala no workspace, feed, exploracao, perfil publico e acervo.
- Preview publicada da sala.
- Criacao/publicacao da sala.
- Modal de compartilhamento da sala.
- Post de Feed do Reino para sala.
- Links legados `/plano/:id` e canonicos `/jornada/:id` devem mostrar a mesma identidade.
- Testes de classificacao visual e smoke E2E basico.

Out of scope:

- Redesenhar estudos.
- Alterar identidade global do BibliaLM.
- Trocar toda a navegacao para roxo.
- Reescrever fluxo de criacao de conteudo/estudo.
- Mudar schema de banco, exceto se for preciso distinguir post `plan` no feed.
- Remover `bible-gold` de contextos que nao sao sala.

## Proposed File Structure

- Modify: `tailwind.config.ts`
  - Adicionar `room` como familia de cores semanticas.
- Create: `utils/contentIdentity.ts`
  - Centralizar identidade visual por dominio: `study`, `room`, `prayer`, `quiz`, etc.
- Create: `tests/contentIdentity.test.ts`
  - Garantir que `plan`, `room`, `jornada`, `sala` retornam identidade roxa.
- Modify: `components/ui/StandardCard.tsx`
  - Permitir variante visual por dominio sem quebrar cards de estudo.
- Modify: `components/workspace/WorkspacePlansTab.tsx`
  - Aplicar variante roxa em cards de Salas.
- Modify: `views/public/PublicPlanPage.tsx`
  - Trocar acoes, badges e highlights de sala para roxo.
- Modify: `components/plan/PlanOwnerPreviewActions.tsx`
  - Usar identidade roxa.
- Modify: `components/plan/PlanShareModal.tsx`
  - Usar roxo para Sala, mantendo estudo separado.
- Modify: `utils/planSharing.ts`
  - Opcional: trocar payload do feed para tipo/metadata de sala se o feed suportar.
- Modify: `utils/studySharePost.ts` ou criar `utils/roomSharePost.ts`
  - Evitar que Sala seja parseada/renderizada como "study premium".
- Modify: `components/social/FeedPostCard.tsx`
  - Renderizar post de sala com card roxo proprio.
- Modify: `views/social/SocialFeedPage.tsx`
  - Garantir que interacoes/compartilhamento preservam tipo de sala.
- Modify: `views/ExplorePage.tsx`, `views/CommunityArticlesPage.tsx`, `views/public/PublicUserPlansPage.tsx`, `app/acervo/page.tsx`
  - Aplicar cards e badges de Sala.
- Modify: `views/CreateRoomStudioPage.tsx` e/ou `views/PlanBuilderPage.tsx`
  - Aplicar identidade roxa na criacao/publicacao da Sala.

## Phase 0: Inventory e Decisao de Linguagem

**Goal:** Mapear todos os pontos onde Sala/Plano aparece e separar de Estudo.

- [ ] Listar rotas de sala: `/criar-sala`, `/jornada/:id`, `/plano/:id`, `/workspace-pastoral`, `/planos`.
- [ ] Listar superficies sociais: Feed do Reino, perfil publico, comunidade, acervo, explorar.
- [ ] Listar componentes compartilhados que hoje usam dourado: `StandardCard`, `StandardHeader`, `FeedPostCard`, `PlanOwnerPreviewActions`, `PlanShareModal`.
- [ ] Definir nomenclatura unica exibida: preferir **Sala** na UI e aceitar **Jornada/Plano** como aliases internos/legados.
- [ ] Registrar onde `bible-gold` deve permanecer por ser Estudo/Biblia e onde deve virar roxo por ser Sala.

Acceptance:

- Ha uma matriz "superficie x identidade atual x identidade desejada".
- Nenhuma tela e alterada nesta fase.

## Phase 1: Tokens e Helper de Identidade

**Goal:** Criar a base tecnica para nao espalhar classes roxas manualmente.

- [ ] Adicionar `room` em `tailwind.config.ts`.
- [ ] Criar `utils/contentIdentity.ts`.
- [ ] Implementar `getContentIdentity(typeOrSource)` retornando:
  - label principal.
  - icon key sugerido.
  - classes de badge.
  - classes de botao primario.
  - classes de borda/halo/card.
  - rota canonica quando aplicavel.
- [ ] Mapear `plan`, `room`, `sala`, `jornada`, `lesson` para identidade `room`.
- [ ] Mapear `study`, `article`, `devotional`, `sermon` para identidade `study`, preservando dourado.
- [ ] Criar `tests/contentIdentity.test.ts`.
- [ ] Rodar `node --test tests/contentIdentity.test.ts`.

Acceptance:

- A identidade de Sala vem de helper central.
- Estudos nao mudam visualmente por acidente.

## Phase 2: Cards de Workspace e Descoberta

**Goal:** Fazer Sala parecer Sala antes mesmo da pessoa abrir.

- [ ] Atualizar `StandardCard` para aceitar `variant="room"` ou `identity`.
- [ ] Em `WorkspacePlansTab`, usar card roxo para salas.
- [ ] Trocar badge de categoria/frequencia para:
  - badge "Sala".
  - badge "Ao vivo" ou "Rascunho" com roxo/estado.
  - badge de frequencia secundario, menos dominante.
- [ ] Em `ExplorePage`, `CommunityArticlesPage`, `PublicUserPlansPage` e `acervo`, aplicar o mesmo card roxo.
- [ ] Garantir que cards de Estudo continuem dourados/editoriais.
- [ ] Adicionar teste unitario para helper/card se possivel.

Acceptance:

- Cards de sala no workspace e descoberta sao roxos.
- Cards de estudo continuam com identidade atual.
- Usuario consegue distinguir Sala vs Estudo sem ler o texto completo.

## Phase 3: Criacao e Publicacao da Sala

**Goal:** Toda criacao/publicacao de Sala usar a linguagem roxa.

- [ ] Em `/criar-sala`, trocar CTAs principais de publicacao/salvar/preview para identidade de sala.
- [ ] Atualizar paineis de configuracao/acesso/publicacao para roxo.
- [ ] Em `PlanBuilderPage` legado, aplicar a mesma linguagem enquanto ele existir.
- [ ] Atualizar modal de sucesso: "Sala publicada" com identidade roxa.
- [ ] Preservar criacao de Estudo/Conteudo com identidade dourada atual.
- [ ] Garantir mobile sem sobreposicao de botoes.

Acceptance:

- Ao criar Sala, a UI comunica "ambiente/turma/comunidade", nao artigo.
- Nao ha regressao visual em `/criar-conteudo`.

## Phase 4: Preview Publicada da Sala

**Goal:** A Sala publicada ter assinatura roxa propria.

- [ ] Em `PublicPlanPage`, aplicar roxo no hero/status/actions da sala.
- [ ] Atualizar `PlanOwnerPreviewActions` para roxo.
- [ ] Atualizar `PlanShareModal` para roxo.
- [ ] Trocar iconografia principal para `Users`, `GraduationCap`, `Route` ou `CalendarDays`.
- [ ] Badge visivel: "Sala" / "Sala ativa".
- [ ] Manter componentes de conteudo/aula com boa legibilidade e sem virar uma pagina roxa inteira.

Acceptance:

- Ao abrir `/jornada/:id` ou `/plano/:id`, a identidade roxa aparece acima da dobra.
- Acoes do dono usam roxo.
- Alunos veem a Sala como ambiente de discipulado, nao como estudo individual.

## Phase 5: Feed do Reino

**Goal:** Compartilhar Sala no feed com card proprio.

- [ ] Criar `utils/roomSharePost.ts` ou estender parser atual com `kind: 'room_share'`.
- [ ] Atualizar `buildPlanSharePostContent` para gerar `room_share`.
- [ ] Atualizar `services/supabase.ts` `mapPost` para parsear `room_share`.
- [ ] Atualizar `types.ts` `Post` para suportar campos de sala se necessario:
  - `roomId`, `roomTitle`, `roomCoverUrl`, `roomUrl`, `roomStatusLabel`.
- [ ] Atualizar `FeedPostCard` para renderizar sala com:
  - fundo/halo roxo.
  - badge "Sala do Reino".
  - iconografia de turma/jornada.
  - CTA "Entrar na Sala" ou "Ver Sala".
- [ ] Garantir que `study_share` continue dourado/editorial.
- [ ] Adicionar teste `roomSharePost.test.ts`.

Acceptance:

- Post de Sala no Feed e visualmente diferente de post de Estudo.
- Links de feed levam para `/jornada/:id` ou `/plano/:id` sem 404.
- Interacoes sociais continuam funcionando.

## Phase 6: Estados, Acessibilidade e Contraste

**Goal:** A identidade roxa ser bonita sem sacrificar legibilidade.

- [ ] Verificar contraste de roxo em texto, botoes e badges.
- [ ] Criar variantes light/dark:
  - Light: fundo `room-purpleSoft`, texto `room-purpleDark`.
  - Dark: fundo roxo translucid, texto violeta claro.
- [ ] Garantir focus ring visivel.
- [ ] Garantir touch targets de 44px nos botoes principais.
- [ ] Evitar UI monocromatica: roxo deve ser dominio, nao parede inteira.
- [ ] Validar em 390px, 768px e desktop.

Acceptance:

- Roxo passa contraste WCAG AA nos textos essenciais.
- Nao ha botao com texto estourando no mobile.
- A experiencia continua sofisticada e pastoral.

## Phase 7: Testes E2E e Auditoria Visual

**Goal:** Garantir consistencia nas principais rotas.

- [ ] Criar/atualizar Playwright para `/criar-sala`.
- [ ] Criar/atualizar Playwright para `/jornada/:id` e `/plano/:id`.
- [ ] Criar/atualizar Playwright para Feed com post de sala.
- [ ] Capturar screenshots desktop/mobile.
- [ ] Adicionar checks por `data-testid` ou classes semanticas:
  - `data-content-identity="room"`.
  - `data-content-identity="study"`.
- [ ] Rodar `npm run typecheck`.

Acceptance:

- Smoke passa para criacao, preview e feed de Sala.
- Typecheck nao ganha novos erros.
- Screenshots mostram diferenca clara entre Sala e Estudo.

## Suggested Milestones

1. **Base de identidade:** Phases 0-1. Tokens e helper prontos.
2. **Percepcao imediata:** Phase 2. Cards e descoberta roxos.
3. **Fluxo do pastor:** Phases 3-4. Criacao/publicacao/preview roxas.
4. **Distribuicao social:** Phase 5. Feed com card proprio de Sala.
5. **Release candidate:** Phases 6-7. Acessibilidade, mobile e testes.

## Main Risks

- Trocar `bible-gold` globalmente quebraria Estudos e leitura biblica; a troca deve ser contextual.
- O feed hoje reaproveita `study_share`; se Sala continuar como estudo, a nova identidade nao vai aparecer.
- `StandardCard` e `StandardHeader` sao compartilhados; precisam aceitar variante sem forcar roxo em tudo.
- Ja existem rotas legadas (`/plano/:id`) e canonicas (`/jornada/:id`); as duas devem receber a mesma identidade.
- Roxo em excesso pode deixar a UI com cara de ferramenta generica; usar como assinatura, nao como banho de tinta.

## Final Definition of Done

- Salas/Planos/Jornadas possuem identidade roxa consistente.
- Estudos continuam visualmente distintos com identidade editorial/dourada.
- Feed do Reino mostra Sala com card proprio.
- Criacao e publicacao de Sala usam roxo.
- Preview publicada de Sala usa roxo em acoes, badges e status.
- Workspace, descoberta, perfil publico e acervo distinguem Sala de Estudo.
- Rotas `/jornada/:id` e `/plano/:id` exibem a mesma identidade.
- Testes unitarios e smoke E2E cobrem a classificacao visual principal.
