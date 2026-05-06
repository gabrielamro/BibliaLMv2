# Preview Publicado e Compartilhamento Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ao acessar a preview de uma sala/jornada publicada, o pastor deve conseguir compartilhar o link, controlar acesso publico/privado, definir quem pode acessar, permitir ou bloquear download em PDF, editar o conteudo publicado e compartilhar no Feed do Reino.

**Architecture:** Evoluir o fluxo existente de `views/public/PublicPlanPage.tsx` e `views/PlanBuilderPage.tsx`, reaproveitando `CustomPlan.privacyType`, `ContentPrivacyLevel`, `dbService`, `navigator.share` e o feed social. O MVP deve funcionar sem reescrever a jornada: adicionar uma barra/ painel de acoes para o dono, um modal de compartilhamento e pequenos ajustes de persistencia/permissao.

**Tech Stack:** Next.js App Router, React, TypeScript, TailwindCSS, Lucide React, Supabase services, Playwright, Node test runner.

---

## Product Direction

A experiencia apos publicar precisa deixar claro que a sala esta viva e pronta para distribuicao. O pastor deve abrir a preview publicada e encontrar acoes pastorais essenciais:

- Compartilhar link publico/privado.
- Copiar link de acesso.
- Alterar visibilidade entre publico e privado.
- Definir quem pode acessar quando privado.
- Permitir ou bloquear download em PDF.
- Voltar para edicao da sala publicada.
- Publicar a sala no Feed do Reino.

O aluno/visitante nao deve ver controles administrativos. Ele deve ver apenas o conteudo permitido pelo nivel de acesso.

## Scope Boundaries

In scope:

- Botao de compartilhamento visivel na preview publicada para o dono da sala.
- Modal/painel "Compartilhar sala" com link copiavel.
- Alternancia de acesso publico/privado.
- Controle de audiencia privada por usuarios, igreja/grupo ou convidados, conforme suporte atual do produto.
- Toggle "Permitir download em PDF".
- Botao "Editar" para voltar ao editor da sala.
- Botao "Compartilhar no Feed do Reino".
- Regras de exibicao: controles administrativos apenas para autor/dono.
- Testes de regras puras e smoke E2E.

Out of scope para este roadmap:

- Recriar o editor de aulas.
- Reescrever todo o modelo de permissoes do BibliaLM.
- Criar analytics avancado de compartilhamento.
- Criar um sistema completo de convites por email/WhatsApp se nao existir infraestrutura pronta.
- Reestilizar a tela inteira da preview.

## Proposed File Structure

- Modify: `types.ts`
  - Adicionar campos opcionais de distribuicao se ainda nao existirem: `allowPdfDownload`, `accessUserIds`, `accessGroupIds`, `shareSlug` ou equivalente.
- Modify: `views/public/PublicPlanPage.tsx`
  - Mostrar acoes administrativas para `isOwner`.
  - Abrir modal de compartilhamento.
  - Respeitar permissao de PDF.
  - Redirecionar para edicao.
- Modify: `views/PlanBuilderPage.tsx`
  - Persistir novas configuracoes de compartilhamento/publicacao.
  - Apos publicar, levar para preview com acoes de compartilhamento visiveis.
- Create: `components/plan/PlanShareModal.tsx`
  - Modal de link, publico/privado, audiencia, PDF e feed.
- Create: `components/plan/PlanOwnerPreviewActions.tsx`
  - Barra compacta de acoes do dono na preview publicada.
- Create: `utils/planSharing.ts`
  - Gerar link de compartilhamento, normalizar privacidade, checar acesso e montar payload de feed.
- Create: `tests/planSharing.test.ts`
  - Testes de link, acesso e privacidade.
- Create/Modify: `tests/publicPlanShare.spec.ts`
  - Smoke E2E da preview publicada com acoes do dono.

## Data Model Proposal

Usar campos opcionais para evitar migracao quebrando dados antigos:

```ts
interface CustomPlan {
  privacyType: 'public' | 'followers' | 'church' | 'group';
  privacyLevel?: ContentPrivacyLevel;
  allowPdfDownload?: boolean;
  accessUserIds?: string[];
  accessGroupIds?: string[];
  accessChurchId?: string;
  shareSlug?: string;
  lastSharedAt?: string;
}
```

Mapeamento inicial recomendado:

- Publico: `privacyType = 'public'`, `privacyLevel = 'public'`.
- Privado por convite: `privacyLevel = 'invite_only'`, validar `accessUserIds`.
- Igreja: `privacyType = 'church'`, validar `accessChurchId` ou `churchId`.
- Grupo: `privacyType = 'group'`, validar `accessGroupIds`.
- PDF: `allowPdfDownload = true | false`, padrao `false` para salas novas e `true` apenas se produto decidir liberar por padrao.

## Phase 0: Baseline e Decisoes Minimas

**Goal:** Entender o estado atual antes de tocar no fluxo publicado.

- [ ] Ler `types.ts` para confirmar campos existentes de privacidade em `CustomPlan`.
- [ ] Ler `views/public/PublicPlanPage.tsx` e mapear onde `isOwner`, `canViewContent` e `navigator.share` ja existem.
- [ ] Ler `views/PlanBuilderPage.tsx` e confirmar onde `handleSavePlan('published')` navega apos publicar.
- [ ] Rodar `node --test tests/planStudioProgress.test.ts` se existir, apenas como sinal local relacionado a jornada.
- [ ] Rodar `npm run typecheck` e registrar falhas pre-existentes.

Acceptance:

- Existe uma nota curta com campos atuais, lacunas e falhas pre-existentes.
- Nenhuma alteracao funcional foi feita nesta fase.

## Phase 1: Regras Puras de Compartilhamento

**Goal:** Criar base testavel para link, permissao e payload social.

- [ ] Criar `utils/planSharing.ts`.
- [ ] Implementar `getPlanShareUrl(planId, shareSlug?)`, usando rota canonica `/jornada/{planId}` enquanto nao houver slug.
- [ ] Implementar `canUserAccessPlan(plan, userProfile, currentUserId)`.
- [ ] Implementar `normalizePlanPrivacy(input)` para converter publico/privado/audiencia em campos persistiveis.
- [ ] Implementar `buildPlanSharePostContent(plan, shareUrl, description)` para o Feed do Reino.
- [ ] Criar `tests/planSharing.test.ts`.
- [ ] Testar: dono acessa sempre, publico acessa sem login, privado bloqueia nao autorizado, igreja valida mesma igreja, grupo valida grupo permitido.
- [ ] Rodar `node --test tests/planSharing.test.ts`.
- [ ] Commit.

Acceptance:

- A regra de acesso nao depende do componente React.
- O link gerado e estavel e copiavel.
- O payload de feed nao duplica logica dentro da tela.

## Phase 2: Modal "Compartilhar Sala"

**Goal:** Disponibilizar o link e as configuracoes centrais em uma UI pequena.

- [ ] Criar `components/plan/PlanShareModal.tsx`.
- [ ] Mostrar campo readonly com link e botao copiar.
- [ ] Mostrar acao de compartilhamento nativo quando `navigator.share` existir.
- [ ] Mostrar controle publico/privado.
- [ ] Quando privado, mostrar seletor de audiencia suportada: convidados, igreja ou grupo.
- [ ] Mostrar toggle "Permitir download em PDF".
- [ ] Mostrar botao "Compartilhar no Feed do Reino" com campo opcional de descricao.
- [ ] Desabilitar salvar quando privado sem audiencia definida.
- [ ] Usar notificacoes existentes de sucesso/erro.

Acceptance:

- Ao clicar em compartilhar, o pastor ve o link de compartilhamento.
- O pastor consegue copiar o link.
- O modal deixa claro quem tera acesso antes de salvar.
- O aluno/visitante nao consegue abrir esse modal.

## Phase 3: Barra de Acoes na Preview Publicada

**Goal:** Fazer a preview publicada mostrar as acoes pedidas ao dono.

- [ ] Criar `components/plan/PlanOwnerPreviewActions.tsx`.
- [ ] Em `views/public/PublicPlanPage.tsx`, renderizar a barra apenas quando `isOwner`.
- [ ] Adicionar botao "Compartilhar" abrindo `PlanShareModal`.
- [ ] Adicionar botao "Editar" navegando para `/criar-sala?id={plan.id}`.
- [ ] Adicionar estado visual "Publico" ou "Privado".
- [ ] Manter a barra discreta e sticky no topo ou no rodape mobile.
- [ ] Garantir que visitantes nao vejam editar, compartilhar no feed ou configuracoes.

Acceptance:

- Preview publicada mostra botao de compartilhamento para o dono.
- Clicar no botao mostra o link para compartilhar.
- Preview publicada mostra botao de editar para o dono.
- Visitante autorizado ve somente o conteudo.

## Phase 4: Persistencia das Configuracoes

**Goal:** Salvar privacidade, audiencia e PDF no plano.

- [ ] Atualizar `handleSavePlan` ou criar handler especifico em `PublicPlanPage` para persistir alteracoes do modal.
- [ ] Atualizar `dbService.updateCustomPlan` com os campos de compartilhamento.
- [ ] Evitar sobrescrever campos nao relacionados do plano.
- [ ] Recarregar estado local apos salvar.
- [ ] Exibir mensagem de sucesso: "Configuracoes de compartilhamento salvas."
- [ ] Exibir erro se nao for dono ou se a atualizacao falhar.

Acceptance:

- Alterar para publico/privado persiste ao recarregar.
- Audiencia privada persiste ao recarregar.
- Permissao de PDF persiste ao recarregar.
- Usuario sem permissao nao altera configuracoes.

## Phase 5: Download em PDF

**Goal:** Permitir baixar PDF apenas quando configurado.

- [ ] Verificar se ja existe gerador/exportador PDF no projeto.
- [ ] Se existir, reutilizar o fluxo atual.
- [ ] Se nao existir, criar MVP com `window.print()` usando CSS `@media print` e rotular como "Baixar PDF".
- [ ] Em `PublicPlanPage`, mostrar botao de PDF quando `plan.allowPdfDownload === true` e usuario tem acesso ao conteudo.
- [ ] Esconder ou bloquear PDF quando privado sem acesso.
- [ ] Garantir que o PDF nao inclua barra administrativa, comentarios ou controles sociais.

Acceptance:

- Aluno autorizado consegue baixar/imprimir PDF quando liberado.
- Aluno nao autorizado nao acessa PDF.
- Se PDF estiver desligado, o botao nao aparece para alunos.
- Dono consegue testar o PDF na preview.

## Phase 6: Compartilhar no Feed do Reino

**Goal:** Publicar a sala no feed social com link e capa.

- [ ] Reaproveitar padrao de `SavedStudiesPage.handleShareStudy`.
- [ ] Criar post via `dbService.createPost`.
- [ ] Usar tipo apropriado: `plan`, `study` ou novo tipo suportado pelo feed.
- [ ] Incluir titulo, descricao, capa e link da sala.
- [ ] Registrar atividade com `recordActivity('social_post', ...)`.
- [ ] Navegar para `/social` com `refreshFeed: true` apos sucesso.
- [ ] Bloquear compartilhamento no feed se a sala estiver privada sem link/acesso publico, ou exibir aviso claro.

Acceptance:

- O pastor compartilha a sala no Feed do Reino a partir da preview.
- O post gerado leva para a preview da sala.
- Feed nao publica link quebrado ou inacessivel por engano.

## Phase 7: Fluxo Apos Publicar

**Goal:** Depois de publicar, levar o pastor para a preview com as acoes visiveis.

- [ ] Ajustar o modal de sucesso em `PlanBuilderPage`.
- [ ] Ao confirmar "Ver Plano", navegar para `/jornada/{savedPlanId}`.
- [ ] Garantir que a pagina carregada reconhece o dono e mostra a barra de acoes.
- [ ] Se a sala ainda nao tiver ID antes de publicar, aguardar criacao antes de navegar.
- [ ] Verificar que editar retorna para `/criar-sala?id={savedPlanId}`.

Acceptance:

- Apos publicar, acessar a preview mostra o botao de compartilhamento.
- O pastor nao precisa voltar ao workspace para compartilhar.
- O botao editar funciona em sala recem-publicada e sala antiga.

## Phase 8: Testes e Verificacao Visual

**Goal:** Reduzir risco em acesso privado e UI responsiva.

- [ ] Criar/atualizar `tests/publicPlanShare.spec.ts`.
- [ ] Testar dono ve barra: compartilhar, editar, publico/privado, PDF.
- [ ] Testar visitante nao ve barra administrativa.
- [ ] Testar privado bloqueia usuario nao autorizado.
- [ ] Testar mobile: botoes nao sobrepoem conteudo.
- [ ] Rodar `node --test tests/planSharing.test.ts`.
- [ ] Rodar `npx playwright test tests/publicPlanShare.spec.ts --project=chromium`.
- [ ] Rodar `npm run typecheck`.

Acceptance:

- Testes puros passam.
- Smoke Playwright passa ou registra bloqueios reais de ambiente.
- TypeScript nao introduz novos erros.

## Suggested Milestones

1. **MVP de compartilhamento:** Fases 1-3. Preview publicada mostra botao, link e editar.
2. **Controle de acesso:** Fase 4. Publico/privado e audiencia persistem.
3. **Distribuicao completa:** Fases 5-6. PDF e Feed do Reino.
4. **Fluxo polido:** Fase 7. Publicacao leva direto para preview acionavel.
5. **Release candidate:** Fase 8. Testes e responsividade.

## Main Risks

- Privacidade ja tem varios conceitos (`privacyType`, `privacyLevel`, `visibility`); evitar criar um quarto modelo concorrente.
- O feed pode nao reconhecer um tipo `plan`; confirmar antes de criar payload novo.
- Download em PDF pode vazar controles administrativos se usar print sem CSS dedicada.
- Privado por usuario/grupo exige busca e validacao; se a infraestrutura ainda nao estiver pronta, fazer MVP com igreja/grupo antes de convite individual.
- Existem muitas mudancas locais no workspace; implementar em commits pequenos e nao reverter alteracoes de outros arquivos.

## Final Definition of Done

- Apos publicar, a preview da sala mostra botao de compartilhamento para o dono.
- Clicar em compartilhar exibe o link copiavel.
- O dono pode alternar entre publico e privado.
- Quando privado, o dono define quem acessa usando as audiencias suportadas.
- O dono pode permitir ou bloquear download em PDF.
- O dono pode editar a sala publicada.
- O dono pode compartilhar no Feed do Reino.
- Visitantes/alunos nao veem acoes administrativas.
- Regras de acesso e smoke E2E estao cobertos por testes.
