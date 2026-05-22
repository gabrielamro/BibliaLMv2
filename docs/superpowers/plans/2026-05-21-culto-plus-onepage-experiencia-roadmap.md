# Culto+ OnePage Experiencia Roadmap

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evoluir a pagina publica do culto (`/culto/:slug`) para uma experiencia de acompanhamento mais clara, bonita e util para membros e visitantes, alinhada ao anexo: hero imersivo, status de live, countdown, entrada na live, adicionar ao calendario, metricas visiveis e barra de acoes principais.

**Architecture:** Manter a OnePage como tela publica e concentrar regras de dados em `services/cultoPlusService.ts`. A UI deve reaproveitar `CultoPlusTopActions`, estados existentes de check-in, notas, oracao, feed, liturgia e QR, adicionando somente os dados e componentes que ainda faltam.

**Tech Stack:** Next.js App Router, React 18, TypeScript, TailwindCSS, Lucide React, Supabase, fallback localStorage existente em Cultos+.

---

## Product Direction

A pagina do culto precisa virar a central do membro durante o culto e antes dele:

- **Antes do culto:** ver horario, tema, igreja, status, tempo restante, link da live e opcao de adicionar ao calendario.
- **Durante o culto:** acompanhar momento atual, fazer check-in, anotar, pedir oracao, ofertar, convidar e compartilhar.
- **Depois do culto:** rever liturgia, salvar versiculo, ver posts, manter historico em "Meus Cultos" e continuar interagindo com pedidos de oracao.

A referencia visual indica uma tela mais editorial e operacional ao mesmo tempo: fundo verde profundo com dourado, topo leve, informacao concentrada acima da dobra e acoes rapidas logo abaixo.

---

## Current State Confirmed

Pontos ja existentes no codigo:

- `components/culto-plus/CultoPlusOnePage.tsx` ja renderiza a pagina publica do culto.
- A barra global ja e ocultada via `useHeader().setIsHeaderHidden(true)`.
- `CultoPlusTopActions` ja oferece voltar, notificacao e menu de tres pontos.
- O QR de check-in ja esta no menu de tres pontos e abre modal.
- `ChurchService` ja tem `title`, `theme`, `churchName`, `churchSlug`, `preacherName`, `startsAt`, `endsAt`, `keyVerseRef`, `keyVerseText`, `bannerUrl`, `status`, `liturgyItems`, `checkinsCount` e `postsCount`.
- `cultoPlusService` ja registra visitas, check-ins, notas, pedidos de oracao, posts, reacoes, save do versiculo e live state.
- `ServiceLiturgyItem` ja permite item de oferta com `pixKeyType` e `pixKey`.
- A OnePage ja exibe timeline liturgica, momento atual, reacoes, anotacoes, feed, pedido de oracao e versiculo-chave.

Gaps em relacao ao anexo:

- Nao ha campo persistido para link da live no culto.
- O countdown visual ainda nao esta no formato de card principal.
- A entrada na live ainda nao e uma acao real baseada em URL cadastrada.
- "Adicionar ao calendario" ainda nao gera evento `.ics`.
- As metricas existem, mas precisam virar uma faixa visual unica com data, horario, versiculo, visitas e check-ins.
- As acoes principais existem espalhadas pela tela; precisam virar uma action rail acima da dobra.
- A oferta aparece dentro da liturgia, mas falta um acesso rapido "Ofertar".

---

## Impact Areas

### Types and data model

- [x] Atualizar `types.ts`:
  - Adicionar `liveUrl?: string` em `ChurchService`.
  - Opcional: adicionar `liveProvider?: 'youtube' | 'instagram' | 'facebook' | 'zoom' | 'other'` se houver necessidade visual.
- [x] Atualizar `services/cultoPlusService.ts`:
  - Incluir `liveUrl` em `CreateChurchServiceInput`.
  - Incluir `liveUrl` em `UpdateChurchServiceInput`.
  - Mapear `live_url` em `mapService`.
  - Persistir `live_url` em `toServicePayload`.
  - Preservar fallback localStorage.
- [x] Criar migration SQL:
  - Adicionar coluna `live_url text null` em `church_services`.
  - Nao alterar RLS se a coluna fizer parte da linha ja protegida.
  - Considerar validacao no app, nao constraint no banco, para evitar bloquear provedores futuros.

### Pastor/admin creation flow

- [x] Atualizar `components/culto-plus/CultoPlusManager.tsx`:
  - Adicionar campo "Link da live" na criacao/edicao do culto.
  - Validar URL apenas quando preenchida.
  - Preencher campo ao editar culto existente.
  - Enviar `liveUrl` em create/update.
  - Manter o culto sem live como fluxo valido.

### Public OnePage

- [x] Refatorar `components/culto-plus/CultoPlusOnePage.tsx`:
  - Criar hero em duas colunas no desktop e empilhado no mobile.
  - Manter `CultoPlusTopActions` sobre o banner.
  - Exibir badge `Culto+`, titulo, tema e card de boas-vindas.
  - Criar card lateral de live/countdown.
  - Criar faixa de metricas.
  - Criar action rail com comandos principais.
  - Preservar conteudo abaixo: timeline, notas, oracao, feed, versiculo e reacoes.

### Shared UI/helpers

- [x] Criar helpers em `utils/cultoPlusOnePage.ts` ou no proprio componente inicialmente:
  - `getServiceCountdownParts(startsAt, nowDate)`.
  - `getLiveStatusLabel(service, nowDate)`.
  - `buildServiceCalendarEvent(service)`.
  - `downloadServiceIcs(service)`.
- [ ] Se o componente crescer demais, extrair:
  - `CultoPlusHero`.
  - `CultoPlusLiveCard`.
  - `CultoPlusMetricsRail`.
  - `CultoPlusActionRail`.

### Related pages

- [ ] `views/MyCultosPage.tsx`:
  - Nenhuma mudanca obrigatoria para a primeira entrega.
  - Opcional: cards podem refletir status de live quando `liveUrl` existir.
- [ ] `views/public/ChurchProfilePage.tsx`:
  - Opcional: agenda pode mostrar badge "Live" quando culto tiver `liveUrl`.
- [ ] `components/culto-plus/CultoPlusPublicAgenda.tsx`:
  - Opcional: mostrar indicacao de live e horario de inicio.

---

## UX Requirements

### Hero

- [ ] Usar `bannerUrl` como imagem de fundo quando existir.
- [ ] Quando nao houver `bannerUrl`, usar fundo premium verde/dourado ja alinhado ao Culto+.
- [ ] Topo:
  - Botao voltar circular no canto superior esquerdo.
  - Botao notificacao circular no canto superior direito.
  - Botao tres pontos circular ao lado da notificacao.
  - Menu de tres pontos deve manter QR de check-in, compartilhar e ver igreja.
- [ ] Conteudo principal:
  - Badge `Culto+`.
  - Titulo grande do culto.
  - Tema/subtitulo abaixo.
  - Card de boas-vindas com nome da igreja, horario e pregador quando houver.

### Live card

- [ ] Exibir card lateral com status:
  - `Ao vivo em breve` quando ainda nao comecou e ha `liveUrl`.
  - `Ao vivo agora` quando `service.status === 'live'` ou estiver dentro do horario.
  - `Culto encerrado` apos `endsAt`.
  - `Live indisponivel` quando nao houver `liveUrl`.
- [ ] Countdown deve mostrar hora, minuto e segundo quando o culto ainda nao comecou.
- [ ] Depois que o culto comecar, o mesmo contador deve mudar para tempo em andamento, mostrando ha quanto tempo o culto esta acontecendo.
- [ ] Botao principal:
  - `Entrar na live` quando `liveUrl` existir.
  - Desabilitado ou oculto quando nao houver link.
  - Abrir em nova aba com `rel="noopener noreferrer"`.
- [ ] Link secundario:
  - `Adicionar ao calendario`.
  - Gerar e baixar arquivo `.ics` com titulo, tema, igreja, inicio, fim e URL da OnePage.

### Metrics rail

- [ ] Exibir abaixo do hero:
  - Dia da semana e data.
  - Horario de inicio.
  - Versiculo-chave.
  - Visitas.
  - Check-ins.
- [ ] Em desktop, usar faixa horizontal com divisores sutis.
- [ ] Em mobile, usar grid de 2 colunas ou lista compacta.
- [ ] Evitar textos longos quebrando layout; truncar versiculo se necessario.

### Action rail

- [ ] Criar barra de acoes logo abaixo das metricas:
  - `Acompanhar`: rola para momento atual/timeline ou faz check-in se ainda nao fez.
  - `Anotacoes`: abre painel de anotacoes existente.
  - `Pedidos de oracao`: foca/abre formulario de pedido de oracao.
  - `Ofertar`: abre modal com PIX quando houver item de oferta com `pixKey`.
  - `Convidar`: abre modal simples com link e texto de convite.
  - `Compartilhar`: usa `navigator.share` com fallback de copiar link.
- [ ] Cada acao deve ter icone, titulo e subtitulo curto.
- [ ] Em mobile, usar scroll horizontal ou grid de 2 colunas com toque confortavel.
- [ ] As acoes nao devem duplicar botoes de baixo; onde houver duplicacao, botao inferior pode virar conteudo secundario.

### Offering modal

- [ ] Localizar primeiro `liturgyItems` com `kind === 'offering'` e `pixKey`.
- [ ] Abrir modal com:
  - Titulo "Ofertar".
  - Chave PIX.
  - Tipo da chave.
  - Botao copiar chave.
  - Texto pastoral curto e prudente, sem pressionar o usuario.
- [ ] Se nao houver PIX cadastrado:
  - Para membro: mostrar mensagem discreta "Oferta indisponivel neste culto."
  - Para pastor/admin: opcionalmente orientar cadastrar PIX no item de oferta da liturgia.

### Invite modal

- [ ] Modal "Convidar alguem" com:
  - Texto pronto de convite.
  - Link da OnePage.
  - Botao copiar.
  - Botao compartilhar quando `navigator.share` existir.

---

## Implementation Phases

### Phase 1 - Data foundation: live link

- [x] Adicionar `liveUrl` ao tipo `ChurchService`.
- [x] Adicionar `liveUrl` aos inputs de criacao/edicao.
- [x] Mapear `live_url` no service layer.
- [x] Criar migration SQL para `church_services.live_url`.
- [x] Atualizar fallback localStorage.

Acceptance criteria:

- Pastor consegue salvar culto com ou sem link da live.
- Culto salvo com link retorna `liveUrl` em `getServiceBySlug`.
- Cultos antigos sem link continuam abrindo normalmente.

### Phase 2 - Pastor setup

- [x] Adicionar campo "Link da live" no formulario de Culto+.
- [x] Validar URL somente se preenchida.
- [x] Ao editar culto, campo deve carregar valor salvo.
- [x] Ao gerar sugestao por IA, nao sobrescrever `liveUrl`.

Acceptance criteria:

- O link da live pode ser adicionado, editado e removido.
- Formulario nao bloqueia cultos presenciais sem transmissao.

### Phase 3 - Hero and live card

- [x] Reestruturar hero conforme anexo.
- [x] Manter topo padrao com voltar, sino e tres pontos.
- [x] Criar card de countdown.
- [x] Implementar `Entrar na live`.
- [x] Implementar `Adicionar ao calendario` com `.ics`.

Acceptance criteria:

- A primeira dobra mostra titulo, tema, boas-vindas, status e countdown.
- Quando `liveUrl` existe, `Entrar na live` abre a URL correta.
- Quando nao existe, a pagina nao promete live.
- `.ics` contem titulo, inicio, fim, descricao, igreja e link da OnePage.

### Phase 4 - Metrics and action rail

- [x] Criar faixa de metricas com data, horario, versiculo, visitas e check-ins.
- [x] Criar action rail com seis acoes principais.
- [x] Conectar acoes aos fluxos ja existentes.
- [x] Adicionar modais de oferta e convite.

Acceptance criteria:

- Usuario consegue chegar em check-in/acompanhamento, anotacoes, oracao, oferta, convite e compartilhamento sem rolar a pagina toda.
- Ofertar so mostra PIX quando houver `pixKey`.
- Compartilhar e convidar funcionam com fallback de copiar link.

### Phase 5 - Responsive, accessibility and polish

- [ ] Mobile: hero empilhado, botoes acessiveis e sem sobreposicao.
- [ ] Desktop: hero em duas colunas com card de live a direita.
- [ ] Garantir contraste AA entre texto e fundo.
- [ ] Garantir foco visivel nos botoes e modais.
- [ ] Respeitar `prefers-reduced-motion` se houver animacao de countdown ou transicoes.
- [ ] Verificar textos longos de titulo, tema, igreja e versiculo.

Acceptance criteria:

- Pagina funciona em 360px, tablet e desktop.
- Nenhum texto sobrepoe outro.
- Modais fecham com botao, clique fora e tecla Esc se padrao ja existir no app.
- Icon buttons tem `aria-label`.

### Phase 6 - Tests and validation

- [x] Adicionar testes unitarios para helpers:
  - Countdown.
  - Status de live.
  - Geracao de ICS.
  - Deteccao de item de oferta.
- [x] Rodar `npm run typecheck`.
- [x] Rodar testes existentes de Culto+.
- [ ] Validar visualmente `/culto/:slug` em desktop e mobile.
- [ ] Validar culto com `liveUrl`, sem `liveUrl`, futuro, ao vivo e encerrado.

Acceptance criteria:

- TypeScript sem erros.
- Fluxos publicos principais continuam funcionando.
- QR no menu de tres pontos permanece acessivel.
- Check-in, notas, oracao, feed e salvar versiculo nao regressam.

---

## Detailed Behavior Rules

### Countdown

- [x] Antes do inicio: mostrar tempo restante ate `startsAt` com label `Comeca em`.
- [x] Durante o culto: mostrar `Ao vivo agora` e trocar a contagem regressiva por tempo em andamento desde `startsAt`, com label `Em andamento ha`.
- [x] Apos `endsAt`: mostrar `Culto encerrado`.
- [x] Se a data for invalida, ocultar countdown e manter informacoes basicas.

### Live URL

- [x] Aceitar YouTube, Instagram, Facebook, Zoom e outros links HTTPS.
- [x] Bloquear `javascript:` e valores sem protocolo seguro.
- [x] Exibir live somente quando `liveUrl` estiver preenchido.
- [x] Nao confundir `service.status === 'live'` com link de live. Status indica andamento; `liveUrl` indica transmissao externa.

### Calendar file

- [x] Nome do arquivo: `culto-${service.slug}.ics`.
- [x] `DTSTART` e `DTEND` devem usar UTC.
- [x] `SUMMARY`: titulo do culto.
- [x] `DESCRIPTION`: tema, igreja, pregador e link da OnePage.
- [x] `LOCATION`: nome da igreja.
- [x] `URL`: OnePage publica.

### Action rail routing

- [x] `Acompanhar`:
  - Se usuario nao fez check-in, pode priorizar check-in.
  - Se ja fez check-in, rola para "Momento atual" ou timeline.
- [x] `Anotacoes`: abre `isNotePanelOpen`.
- [x] `Pedidos de oracao`: rola para formulario de pedido ou abre modal se for extraido.
- [x] `Ofertar`: abre modal de oferta.
- [x] `Convidar`: abre modal de convite.
- [x] `Compartilhar`: chama `handleShare`.

---

## Out Of Scope For This Roadmap

- Redesenhar painel pastoral inteiro.
- Criar transmissao nativa dentro do BibliaLM.
- Chat ao vivo.
- Push notifications reais.
- Integracao direta com Google Calendar/Outlook via OAuth.
- Recorrencia automatica de cultos.
- Sistema financeiro completo de ofertas.

---

## Risk Notes

- `liveUrl` exige migration; em ambientes sem schema atualizado, o fallback localStorage deve continuar funcionando, mas Supabase pode retornar erro se o mapper tentar selecionar coluna inexistente dependendo da query atual.
- Countdown com segundo a segundo pode causar renders frequentes; limitar o timer ao hero e limpar intervalo no unmount.
- QR usa servico externo para imagem; manter no menu e evitar depender dele para carregar a pagina principal.
- Oferta com PIX deve ser tratada com tom pastoral prudente, sem pressao e sem prometer deducao, recibo ou processamento financeiro.
- O hero com imagem de fundo precisa de overlay forte o bastante para leitura, especialmente em banners enviados por igrejas.

---

## Definition Of Done

- [ ] Roadmap implementado em fases sem regressao dos fluxos existentes.
- [ ] A pagina publica do culto bate com a intencao visual do anexo.
- [ ] Link da live e calendario funcionam de ponta a ponta.
- [ ] Action rail resolve as acoes principais acima da dobra.
- [ ] Mobile e desktop revisados visualmente.
- [ ] `npm run typecheck` passa.
- [ ] Testes relevantes de Culto+ passam.
