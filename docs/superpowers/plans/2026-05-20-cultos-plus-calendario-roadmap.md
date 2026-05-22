# Cultos+ Calendario Roadmap

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar uma visao de calendario em Cultos+ para que membros, usuarios vinculados a igreja e pastores consigam enxergar cultos no curto e longo prazo, com foco em agenda, preparacao, escala ministerial e acesso rapido a OnePage do culto.

**Architecture:** Evoluir a listagem atual de `CultoPlusManager` para suportar consultas por intervalo de datas e visualizacoes calendario, preservando cards/lista existentes. Criar helpers de agrupamento por data e um componente de calendario reutilizavel, mantendo acesso a dados em `services/cultoPlusService.ts`.

**Tech Stack:** Next.js App Router, React 18, TypeScript, TailwindCSS, Lucide React, Supabase, fallback localStorage existente em Cultos+.

---

## Product Direction

Cultos+ hoje funciona bem como gestor de cultos recentes, mas a experiencia ainda e orientada a lista. O calendario deve transformar a funcionalidade em uma agenda pastoral e comunitaria:

- **Usuario/membro:** entende rapidamente quais cultos vem pela frente, quando acontecem, qual tema sera tratado e como acessar a pagina do culto.
- **Pastor/lider:** planeja a igreja a curto e longo prazo, identifica lacunas na agenda, edita cultos futuros e acompanha escalas por culto.
- **Equipe ministerial:** visualiza quando esta escalada, confirma participacao e se prepara com antecedencia.

O calendario nao substitui a lista de cultos recentes no primeiro momento. Ele adiciona uma camada de planejamento e navegacao temporal.

## Current State

Pontos confirmados no codigo:

- Modelo principal: `ChurchService` em `types.ts`, com `startsAt`, `endsAt`, `serviceType`, `status`, `slug`, `liturgyItems`, `checkinsCount` e `postsCount`.
- Data access: `cultoPlusService.getServicesByChurch(churchId, { includeDrafts, limit })`.
- UI pastoral: `components/culto-plus/CultoPlusManager.tsx`, hoje com formulario de criacao/edicao e grid de "Cultos recentes".
- Escalas: `ServiceScheduleAssignment` ja existe e pode ser exibido como detalhe do evento.
- Home ja exibe alguns cultos da igreja via `getServicesByChurch(... limit: 4)`.

## Scope Boundaries

In scope:

- Nova visao calendario em Cultos+.
- Alternancia entre lista e calendario para pastor/admin.
- Visao de agenda para usuario/membro com cultos publicados da igreja.
- Filtros por periodo, tipo de culto e status.
- Consulta por intervalo de datas no service layer.
- Detalhe rapido do culto ao clicar em um dia/evento.
- Destaques de hoje, proximo culto e cultos ao vivo.
- Preservar fallback localStorage.

Out of scope nesta primeira entrega:

- Sincronizacao com Google Calendar/Outlook.
- Recorrencia automatica de cultos.
- Drag-and-drop para reagendar.
- Notificacoes push.
- Redesenho completo de Cultos+.
- Mudanca de schema obrigatoria, salvo indice ou query necessaria para performance.

---

## Personas And Use Cases

### Usuario ou membro

- Ver proximos cultos da igreja no modo agenda.
- Alternar entre "Proximos 7 dias", "Este mes" e "Todos".
- Abrir a OnePage publica do culto.
- Identificar status: publicado, ao vivo, finalizado.
- Ver tema, pregador, horario e versiculo-chave quando disponivel.

### Pastor ou admin

- Ver calendario mensal dos cultos cadastrados.
- Planejar cultos futuros em horizonte de 30, 60 e 90 dias.
- Criar culto a partir de uma data vazia.
- Editar culto existente a partir do calendario.
- Abrir painel do culto para check-ins, posts, notas, pedidos de oracao, escala e analytics.
- Filtrar rascunhos, publicados, ao vivo e finalizados.

### Lider de ministerio

- Ver cultos em que ha escala ministerial.
- Abrir detalhe do culto e conferir responsaveis.
- Confirmar ou acompanhar status de escala quando o plano permitir.

---

## UX Requirements

### Navegacao principal

- Adicionar controle segmentado no Culto+: `Lista` | `Calendario`.
- Em mobile, o calendario deve priorizar uma agenda por dia/semana, nao uma grade mensal apertada.
- Em desktop, usar grade mensal como default para pastor/admin.
- Manter a lista atual como fallback e como modo rapido.

### Views

1. **Agenda curta**
   - Janela: hoje + proximos 7 ou 14 dias.
   - Ideal para Home, usuario/membro e mobile.
   - Agrupa por data: "Hoje", "Amanha", dia da semana.

2. **Calendario mensal**
   - Grade do mes com eventos por dia.
   - Navegacao anterior/proximo mes.
   - Botao "Hoje".
   - Contador visual quando houver muitos eventos no mesmo dia.

3. **Planejamento longo**
   - Filtro de horizonte: 30, 60, 90 dias.
   - Pode iniciar como lista agrupada por mes, antes de virar quarter/calendar completo.

### Event Card

Cada evento deve mostrar:

- Horario de inicio.
- Titulo.
- Tipo do culto.
- Status.
- Tema, quando houver espaco.
- Indicador de escala se houver `scheduleAssignments`.
- Acoes conforme permissao:
  - Usuario: `Abrir`.
  - Pastor/admin: `Abrir`, `Editar`, `Painel`.

### Empty States

- Usuario: "Ainda nao ha cultos publicados para este periodo."
- Pastor: "Nenhum culto neste periodo. Criar culto para esta data."
- Quando filtro esconder resultados, mostrar CTA para limpar filtros.

---

## Data And Service Layer

### Required service changes

- [x] Adicionar `getServicesByChurchRange(churchId, options)` em `services/cultoPlusService.ts`.
- [x] Opcoes minimas:
  - `startDate: string`
  - `endDate: string`
  - `includeDrafts?: boolean`
  - `status?: ChurchServiceStatus[]`
  - `serviceTypes?: ChurchServiceType[]`
  - `limit?: number`
- [x] Supabase query:
  - `eq('church_id', churchId)`
  - `gte('starts_at', startDate)`
  - `lte('starts_at', endDate)`
  - `order('starts_at', { ascending: true })`
- [x] Fallback localStorage deve aplicar o mesmo filtro por intervalo.
- [x] Manter `getServicesByChurch` para compatibilidade com Home e telas existentes.

### Performance

- [x] Para calendario mensal, buscar apenas o intervalo visivel com margem pequena.
- [x] Evitar carregar estatisticas completas para todos os cultos.
- [x] Estatisticas detalhadas continuam carregando apenas quando o pastor abre o painel.
- [ ] Se Supabase exigir, adicionar indice em `church_services(church_id, starts_at)`.

### Security And Visibility

- [x] Usuario/membro ve apenas cultos `published`, `live` e `finished`.
- [x] Pastor/admin da igreja ve tambem `draft`.
- [x] Cultos `archived` ficam ocultos por padrao.
- [x] Acoes de editar, painel e arquivar permanecem restritas a pastor/admin.

---

## Implementation Phases

### Phase 1 - Foundation: query por periodo

- [x] Criar tipos para opcoes de calendario em `services/cultoPlusService.ts`.
- [x] Implementar `getServicesByChurchRange`.
- [x] Cobrir fallback localStorage.
- [x] Criar helpers em `utils/cultoPlusCalendar.ts`:
  - `getCalendarMonthRange(date)`
  - `groupServicesByDate(services)`
  - `getServiceTemporalStatus(service)`
  - `formatCalendarDayLabel(date)`
- [x] Adicionar testes unitarios para agrupamento e range.

Acceptance criteria:

- Dado um intervalo de datas, retorna somente cultos da igreja dentro do periodo.
- Rascunhos so aparecem quando `includeDrafts` for verdadeiro.
- Resultado vem ordenado por `startsAt` ascendente.
- LocalStorage e Supabase respeitam a mesma regra.

### Phase 2 - Pastor calendar inside CultoPlusManager

- [x] Adicionar estado de view: `list | calendar`.
- [x] Criar componente `CultoPlusCalendarView`.
- [x] Desktop: grade mensal.
- [x] Mobile: agenda agrupada por dia.
- [x] Adicionar navegacao de mes e botao "Hoje".
- [x] Clique em evento abre painel rapido ou seleciona culto.
- [x] Clique em data vazia preenche formulario com aquela data e abre criacao.
- [x] Reutilizar `startEdit`, `openServicePanel` e link `/culto/:slug`.

Acceptance criteria:

- Pastor alterna entre lista atual e calendario sem perder dados.
- Calendario mensal mostra cultos no dia correto.
- Criar culto a partir de dia vazio abre formulario com `startsAt` naquela data.
- Eventos preservam acoes existentes: abrir, editar, painel.

### Phase 3 - Member calendar/agenda

- [x] Definir ponto de entrada para usuarios:
  - Home: card "Proximos cultos" com agenda curta.
  - Ou rota da igreja/comunidade com aba "Cultos".
- [x] Criar componente `CultoPlusPublicAgenda`.
- [x] Buscar cultos publicados da igreja vinculada.
- [x] Mostrar hoje, proximos 7 dias e mes atual.
- [x] CTA principal abre OnePage do culto.

Acceptance criteria:

- Usuario vinculado a igreja ve somente cultos publicados/ao vivo/finalizados.
- Usuario sem igreja ve empty state orientando vincular igreja.
- Agenda funciona bem em mobile.

### Phase 4 - Escalas and preparation

- [x] Mostrar indicador de escala no evento quando houver `ServiceScheduleAssignment`.
- [ ] No detalhe do evento, listar ministerios/responsaveis.
- [ ] Para lider/membro escalado, destacar "Voce esta escalado".
- [ ] Manter confirmacao/substituicao no painel existente, sem criar fluxo paralelo.

Acceptance criteria:

- Pastor consegue ver rapidamente quais cultos tem escala.
- Membro escalado identifica sua participacao.
- Nao ha exposicao indevida de dados privados para usuarios comuns.

### Phase 5 - Long-term planning

- [ ] Adicionar filtro de horizonte: `30 dias`, `60 dias`, `90 dias`.
- [ ] Criar agrupamento por mes para planejamento longo.
- [ ] Exibir lacunas: semanas sem culto cadastrado, apenas para pastor/admin.
- [ ] Opcional: exportar CSV do periodo usando fluxo de export existente.

Acceptance criteria:

- Pastor consegue auditar a agenda dos proximos 90 dias.
- Datas sem culto ficam claras sem poluir a tela do usuario comum.
- A view continua performatica com dezenas de cultos.

---

## Suggested Component Structure

- `components/culto-plus/CultoPlusManager.tsx`
  - Mantem ownership da tela pastoral.
  - Passa dados e callbacks para calendario.

- `components/culto-plus/CultoPlusCalendarView.tsx`
  - Calendario pastoral.
  - Recebe `services`, `currentDate`, `onMonthChange`, `onOpen`, `onEdit`, `onOpenPanel`, `onCreateAtDate`.

- `components/culto-plus/CultoPlusPublicAgenda.tsx`
  - Agenda de usuario/membro.
  - Sem acoes administrativas.

- `utils/cultoPlusCalendar.ts`
  - Datas, agrupamento e labels.

---

## UI Notes

- Usar `CalendarDays`, `Clock`, `ChevronLeft`, `ChevronRight`, `Plus`, `ExternalLink`, `Edit2` e `NotebookPen` de Lucide.
- Evitar cards dentro de cards; calendario deve ser uma area funcional, nao uma vitrine decorativa.
- Em mobile, preferir lista por dia com altura estavel.
- Status visual:
  - `draft`: cinza.
  - `published`: dourado/verde discreto.
  - `live`: vermelho ou emerald com pulso sutil.
  - `finished`: neutro.
- Nao dominar a tela com roxo; Cultos+ ja tem linguagem verde/dourada.

---

## Testing Plan

- [x] Unit tests para helpers de data:
  - inicio/fim do mes.
  - agrupamento por data local.
  - ordenacao por horario.
  - filtro por status.
- [ ] Smoke test do manager:
  - carrega calendario.
  - alterna lista/calendario.
  - abre culto.
  - cria a partir de data vazia.
- [ ] Smoke mobile:
  - agenda nao quebra layout.
  - textos nao sobrepoem botoes.
- [ ] Verificacao manual com dados:
  - culto hoje.
  - culto futuro.
  - culto finalizado.
  - rascunho pastoral.
  - usuario sem igreja.

---

## Risks And Decisions

- **Timezone:** usar datas locais do usuario para agrupamento visual, mas manter ISO em `startsAt`/`endsAt`.
- **Limite atual de 20 cultos:** calendario precisa de query por range para nao depender de `limit: 20`.
- **Permissoes:** calendario publico nunca deve mostrar rascunhos.
- **Escalas:** detalhes de escala podem conter nomes; exibir apenas quando usuario tiver vinculo/permissao adequada.
- **Mobile:** grade mensal completa pode ficar ilegivel; agenda responsiva e requisito, nao opcional.

## Definition Of Done

- Pastor/admin visualiza cultos em calendario mensal e lista atual continua disponivel.
- Usuario/membro visualiza proximos cultos em agenda curta.
- Dados sao carregados por intervalo, nao por lista limitada de recentes.
- Permissoes de status e acoes administrativas estao preservadas.
- Fallback localStorage funciona em ambiente sem schema Supabase.
- Testes de helpers passam e smoke manual cobre desktop/mobile.
