# Meu Culto Manual Roadmap

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que o usuario registre e acompanhe um culto mesmo quando a igreja nao possui pagina oficial do Culto+. A experiencia deve funcionar como um caderno espiritual privado: musicas, versiculos lidos, anotacoes da mensagem, oracoes silenciosas, sentimentos, decisoes, aplicacoes praticas e memoria do que Deus falou naquele encontro.

**Architecture:** Criar uma camada separada de registros pessoais de culto, sem depender de `ChurchService`. O Culto+ oficial continua sendo a fonte para cultos publicados pela igreja; o novo fluxo cria um `PersonalServiceJournal` privado do usuario, visivel apenas para ele por padrao, integrado em `Meus Cultos`.

**Tech Stack:** Next.js App Router, React 18, TypeScript, TailwindCSS, Lucide React, Supabase, `bibleService`, fallback localStorage, padroes visuais Culto+.

---

## Product Direction

Nem toda igreja tera uma pagina de culto cadastrada. Mesmo assim, o membro pode estar no culto e querer guardar sua jornada espiritual daquele dia. O produto deve resolver esse caso sem forcar a igreja a ter Culto+ configurado.

Essa funcionalidade deve parecer menos "painel pastoral" e mais "caderno vivo do membro":

- rapido o bastante para usar durante o culto;
- privado por padrao;
- organizado o suficiente para revisitar depois;
- integrado com BibliaLM para buscar versiculos;
- pastoralmente sensivel para sentimentos, oracao e decisoes pessoais;
- sem depender de check-in oficial, QR ou pagina publica.

Nome sugerido da funcionalidade: **Meu Culto** ou **Registro de Culto**.

---

## Current State

Pontos existentes no produto:

- `Meus Cultos` ja existe como rota e mostra cultos oficiais onde o usuario fez check-in.
- `cultoPlusService.getUserCheckedInServices(userId)` ja lista cultos oficiais participados.
- `bibleService.getTextByReference(ref)` ja permite buscar texto biblico por referencia.
- `ServiceNote` e `ServicePrayerRequest` existem, mas dependem de `serviceId`.
- `PrayerRequest` global/igreja/grupo existe, mas e comunitario; o novo pedido silencioso deve ser privado.
- O usuario ja pode ter `churchData`, mas o fluxo tambem deve funcionar para visitante ou igreja nao configurada.

Gap principal:

- Nao existe um registro pessoal de culto independente da pagina oficial do Culto+.

---

## Scope

In scope:

- Criar registro pessoal/manual de culto.
- Integrar registros manuais em `Meus Cultos`.
- Permitir criar registro a partir da igreja, Home ou Meus Cultos.
- Registrar musicas tocadas.
- Pesquisar versiculos lidos/pedidos pelo pastor.
- Escrever anotacoes da mensagem.
- Registrar oracao silenciosa privada.
- Registrar sentimentos do momento.
- Registrar decisoes, aplicacoes praticas e proximos passos.
- Autosave e rascunho local.
- Privacidade forte: tudo privado por padrao.

Out of scope na primeira entrega:

- Compartilhamento publico automatico.
- Transformar registro manual em Culto+ oficial.
- Reconhecimento de audio/transcricao do culto.
- Letras completas de musicas.
- Analytics pastorais.
- Comentarios de outros membros.
- Notificacoes push.

---

## Personas And Use Cases

### Membro em uma igreja sem Culto+

- Abre a pagina da igreja ou `Meus Cultos`.
- Clica em `Registrar culto`.
- Preenche igreja, data e horario rapidamente.
- Vai anotando musicas, versiculos, oracoes e pensamentos durante o culto.
- Salva tudo no historico privado.

### Visitante em uma igreja

- Nao tem igreja vinculada ou esta visitando outra igreja.
- Cria um registro manual com nome da igreja digitado.
- Guarda anotacoes e sentimentos sem expor nada publicamente.

### Usuario em culto oficial, mas sem querer interagir publicamente

- Pode criar anotacao pessoal manual mesmo que exista OnePage oficial.
- O registro manual pode ser vinculado opcionalmente ao culto oficial, mas continua privado.

---

## UX Requirements

### Entry points

- [x] Em `Meus Cultos`, adicionar botao `Registrar culto`.
- [ ] Na pagina da igreja, quando nao houver Culto+ publicado/proximo, mostrar CTA `Registrar meu culto`.
- [ ] Na Home, em agenda vazia da igreja, oferecer `Registrar culto manual`.
- [ ] Em uma OnePage oficial, opcionalmente mostrar `Criar registro pessoal` para quem quer um diario mais completo.

### Creation flow

O fluxo deve ter dois modos:

1. **Modo rapido durante o culto**
   - Uma tela unica, otimizada para celular.
   - Botoes grandes para adicionar:
     - Musica
     - Versiculo
     - Anotacao
     - Oracao silenciosa
     - Sentimento
     - Decisao
   - Autosave a cada alteracao.

2. **Modo revisao depois do culto**
   - Tela organizada por secoes.
   - Permite revisar, editar e completar o registro.
   - Mostra resumo do culto e proximos passos espirituais.

### Basic fields

- [ ] Nome do culto ou titulo pessoal.
- [ ] Nome da igreja.
- [ ] Igreja vinculada, se houver `churchId`.
- [ ] Data.
- [ ] Horario aproximado de inicio e fim.
- [ ] Pastor/pregador, opcional.
- [ ] Tema percebido da mensagem.
- [ ] Tipo: domingo, jovens, celula, vigilia, conferencia, outro.

### Music section

- [ ] Adicionar titulo da musica.
- [ ] Marcar momento: abertura, louvor, resposta, encerramento, outro.
- [ ] Campo opcional: "O que essa musica despertou em mim?"
- [ ] Evitar armazenar letras completas por padrao.
- [ ] Permitir reordenar musicas.

### Bible verse section

- [ ] Campo de busca por referencia, usando `bibleService.getTextByReference`.
- [ ] Salvar referencia formatada.
- [ ] Salvar texto do versiculo retornado.
- [ ] Campo: "Por que esse texto foi importante no culto?"
- [ ] Marcar se foi:
  - lido pelo pastor;
  - lido pela igreja;
  - lembrado pelo usuario;
  - base da mensagem.

### Message notes

- [ ] Campo livre de anotacoes.
- [ ] Blocos rapidos:
  - Ideia principal.
  - Frase que marcou.
  - O que aprendi sobre Deus.
  - O que preciso obedecer.
  - Pergunta que ficou.
- [ ] Permitir tags privadas: fe, familia, chamado, arrependimento, gratidao, cura, missao.

### Silent prayer

- [ ] Criar `Pedido silencioso`.
- [ ] Privado por padrao e sem opcao de publicar na primeira versao.
- [ ] Campos:
  - Pedido.
  - Motivo.
  - Pessoas envolvidas, opcional.
  - Quero lembrar de orar por isso.
  - Resposta futura, opcional.
- [ ] Nao misturar com mural publico de oracao.

### Feelings and discernment

- [ ] Registrar sentimento do momento.
- [ ] Opcoes sugeridas:
  - Paz
  - Gratidao
  - Quebrantado
  - Confrontado
  - Esperancoso
  - Confuso
  - Triste
  - Alegre
  - Encorajado
  - Cansado
- [ ] Intensidade de 1 a 5.
- [ ] Campo: "Por que me senti assim?"
- [ ] Campo opcional: "Como quero responder a isso com sabedoria?"

### Decisions and next steps

- [ ] Registrar decisao pessoal.
- [ ] Registrar compromisso pratico.
- [ ] Criar lembrete simples para revisar depois.
- [ ] Campo: "Uma acao nesta semana".
- [ ] Campo: "Uma pessoa por quem vou orar".
- [ ] Campo: "Um versiculo para memorizar".

### Review screen

- [ ] Mostrar resumo do culto.
- [ ] Mostrar timeline pessoal:
  - musicas;
  - versiculos;
  - anotacoes;
  - oracoes;
  - sentimentos;
  - decisoes.
- [ ] Permitir editar qualquer secao.
- [ ] CTA final: `Salvar em Meus Cultos`.
- [ ] Depois de salvo, mostrar em `Meus Cultos` junto com cultos oficiais.

---

## Data Model

Criar novos tipos em `types.ts`:

- [ ] `PersonalServiceJournal`
- [ ] `PersonalServiceSong`
- [ ] `PersonalServiceVerse`
- [ ] `PersonalServicePrayer`
- [ ] `PersonalServiceFeeling`
- [ ] `PersonalServiceDecision`

Modelo sugerido:

```ts
export interface PersonalServiceJournal {
  id: string;
  userId: string;
  churchId?: string | null;
  churchName: string;
  linkedServiceId?: string | null;
  title: string;
  theme?: string;
  preacherName?: string;
  serviceType?: ChurchServiceType;
  serviceDate: string;
  startsAt?: string | null;
  endsAt?: string | null;
  songs: PersonalServiceSong[];
  verses: PersonalServiceVerse[];
  messageNotes: string;
  prayers: PersonalServicePrayer[];
  feelings: PersonalServiceFeeling[];
  decisions: PersonalServiceDecision[];
  tags: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Supabase

- [ ] Criar tabela `personal_service_journals`.
- [ ] Campos principais:
  - `id text primary key`
  - `user_id uuid not null references profiles(id)`
  - `church_id uuid null references churches(id)`
  - `church_name text`
  - `linked_service_id text null references church_services(id)`
  - `title text not null`
  - `theme text`
  - `preacher_name text`
  - `service_type text`
  - `service_date date not null`
  - `starts_at timestamptz`
  - `ends_at timestamptz`
  - `songs jsonb not null default '[]'`
  - `verses jsonb not null default '[]'`
  - `message_notes text`
  - `prayers jsonb not null default '[]'`
  - `feelings jsonb not null default '[]'`
  - `decisions jsonb not null default '[]'`
  - `tags jsonb not null default '[]'`
  - `is_archived boolean not null default false`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- [ ] RLS:
  - Usuario so le seus proprios registros.
  - Usuario so cria para si mesmo.
  - Usuario so atualiza/deleta seus proprios registros.
- [ ] Indice:
  - `personal_service_journals(user_id, service_date desc)`

### Local fallback

- [ ] Criar chave localStorage:
  - `biblialm.personalServiceJournals`
- [ ] Usar fallback quando Supabase estiver indisponivel.
- [ ] Manter mesmo contrato de dados do service.

---

## Service Layer

Criar `services/personalServiceJournalService.ts`:

- [ ] `createJournal(input)`
- [ ] `updateJournal(journalId, updates)`
- [ ] `getJournalById(journalId, userId)`
- [ ] `getJournalsByUser(userId, options)`
- [ ] `deleteJournal(journalId, userId)`
- [ ] `archiveJournal(journalId, userId)`
- [ ] `autosaveDraft(input)`
- [ ] `getDraft(userId)`
- [ ] `clearDraft(userId)`

Regras:

- [ ] Nenhuma logica de Supabase dentro dos componentes.
- [ ] Componentes chamam service layer.
- [ ] Service layer cuida de mapear snake_case/camelCase.
- [ ] Todo registro manual pertence a um usuario.

---

## Routes And Components

### Routes

- [x] `app/meus-cultos/novo/page.tsx`
- [x] `app/meus-cultos/[journalId]/page.tsx`

### Views

- [x] `views/PersonalCultoJournalPage.tsx`
- [ ] `views/PersonalCultoJournalDetailPage.tsx`

### Components

- [ ] `components/culto-plus/personal/PersonalCultoJournalEditor.tsx`
- [ ] `components/culto-plus/personal/JournalBasicsStep.tsx`
- [ ] `components/culto-plus/personal/JournalQuickActions.tsx`
- [ ] `components/culto-plus/personal/JournalSongsSection.tsx`
- [ ] `components/culto-plus/personal/JournalVersesSection.tsx`
- [ ] `components/culto-plus/personal/JournalPrayerModal.tsx`
- [ ] `components/culto-plus/personal/JournalFeelingPicker.tsx`
- [ ] `components/culto-plus/personal/JournalDecisionSection.tsx`
- [ ] `components/culto-plus/personal/JournalReviewCard.tsx`

---

## Integration With Meus Cultos

- [ ] `Meus Cultos` deve mostrar duas origens:
  - cultos oficiais com check-in;
  - registros manuais privados.
- [ ] Card manual deve indicar `Registro pessoal`.
- [ ] Card oficial deve indicar `Culto+`.
- [ ] Filtros:
  - Todos
  - Oficiais
  - Meus registros
  - Com pedidos silenciosos
  - Com decisoes
- [ ] Busca por:
  - igreja;
  - tema;
  - versiculo;
  - musica;
  - tag.

---

## AI Assistance

Primeira versao deve funcionar sem IA. Depois, adicionar apoio opcional:

- [ ] Gerar resumo privado do culto.
- [ ] Sugerir plano de pratica semanal.
- [ ] Criar perguntas de reflexao.
- [ ] Organizar anotacoes baguncadas.
- [ ] Sugerir oracao pessoal a partir das anotacoes.
- [ ] Nunca publicar nem compartilhar sem confirmacao explicita.

Notas de seguranca:

- IA deve tratar oracoes e sentimentos como conteudo sensivel.
- Nada deve ir para feed, mural ou igreja sem acao clara do usuario.
- Evitar tom de diagnostico emocional ou aconselhamento clinico.

---

## Implementation Phases

### Phase 1 - Foundation

- [x] Criar tipos `PersonalServiceJournal` e filhos em `types.ts`.
- [x] Criar migration SQL `personal_service_journals`.
- [x] Configurar RLS user-only.
- [x] Criar `personalServiceJournalService.ts`.
- [x] Implementar fallback localStorage.

Acceptance criteria:

- Usuario autenticado cria, edita e lista registros manuais.
- Outro usuario nao consegue ler registros de terceiros.
- LocalStorage funciona quando Supabase nao esta disponivel.

### Phase 2 - Create flow

- [x] Criar rota `/meus-cultos/novo`.
- [x] Criar editor mobile-first.
- [x] Implementar campos basicos.
- [x] Implementar autosave de rascunho.
- [ ] Implementar quick actions.

Acceptance criteria:

- Usuario consegue iniciar registro em menos de 2 cliques a partir de `Meus Cultos`.
- Registro pode ser salvo com dados minimos: titulo, igreja e data.
- Se sair da tela, rascunho e recuperado.

### Phase 3 - Spiritual sections

- [x] Implementar musicas.
- [x] Implementar versiculos com busca biblica.
- [x] Implementar anotacoes da mensagem.
- [x] Implementar pedido silencioso privado.
- [x] Implementar sentimentos.
- [x] Implementar decisoes e proximos passos.

Acceptance criteria:

- Usuario consegue registrar tudo que aconteceu no culto sem pagina oficial.
- Pedido silencioso fica privado e aparece apenas no detalhe do registro.
- Versiculo pesquisado traz texto biblico e referencia formatada.

### Phase 4 - Meus Cultos integration

- [x] Atualizar `views/MyCultosPage.tsx` para carregar registros manuais.
- [x] Unificar cards oficiais e manuais.
- [x] Adicionar filtros e busca.
- [x] Criar detalhe do registro manual.

Acceptance criteria:

- `Meus Cultos` mostra cultos oficiais e registros pessoais.
- Usuario distingue claramente `Culto+` de `Registro pessoal`.
- Ao abrir registro manual, consegue revisar e editar.

### Phase 5 - Church profile entry

- [ ] Na pagina da igreja, detectar quando nao ha Culto+ ativo/proximo.
- [ ] Mostrar CTA `Registrar meu culto`.
- [ ] Preencher automaticamente `churchId` e `churchName` quando possivel.
- [ ] Permitir editar nome da igreja se for visitante.

Acceptance criteria:

- Usuario na pagina de uma igreja sem Culto+ consegue criar registro manual.
- O registro fica vinculado a igreja quando houver `churchId`.

### Phase 6 - Polish and privacy

- [ ] Revisar microcopy pastoral.
- [ ] Garantir mobile 360px sem sobreposicao.
- [ ] Garantir foco visivel e labels acessiveis.
- [ ] Adicionar empty states.
- [ ] Adicionar confirmacao antes de deletar.
- [ ] Adicionar exportacao simples para texto/markdown, opcional.

Acceptance criteria:

- Experiencia parece um diario espiritual privado, nao um formulario burocratico.
- Fluxo e confortavel durante o culto.
- Nada e compartilhado sem consentimento explicito.

---

## Suggested UI Shape

### First screen

- Header simples:
  - Voltar
  - `Meu Culto`
  - Salvar
- Card de contexto:
  - Igreja
  - Data
  - Titulo
  - Pastor
- Barra de quick actions:
  - Musica
  - Versiculo
  - Anotacao
  - Oracao
  - Sentimento
  - Decisao

### During service mode

- Tela escura/verde discreta para reduzir brilho.
- Botoes grandes.
- Campos curtos.
- Autosave visivel: `Salvo agora`.
- Evitar muitos passos obrigatorios.

### Review mode

- Cards por secao.
- Timeline pessoal.
- Resumo no topo.
- CTA para continuar editando.

---

## Privacy And Pastoral Guardrails

- [ ] Tudo privado por padrao.
- [ ] Pedido silencioso nunca aparece em mural publico.
- [ ] Sentimentos nao devem gerar diagnostico.
- [ ] IA nao deve dizer "Deus esta dizendo" de forma direta.
- [ ] Microcopy deve usar linguagem de apoio:
  - "O que marcou voce?"
  - "Como voce quer responder?"
  - "Deseja guardar isso para orar depois?"
- [ ] Compartilhamento futuro deve ser seletivo:
  - compartilhar apenas resumo;
  - compartilhar apenas versiculo;
  - compartilhar testemunho editado pelo usuario.

---

## Test Plan

- [ ] Unit tests:
  - mapper snake_case/camelCase;
  - CRUD service local fallback;
  - autosave draft;
  - filtros de `Meus Cultos`;
  - verse search flow com mock.
- [ ] Typecheck.
- [ ] Build.
- [ ] Manual QA:
  - usuario com igreja;
  - usuario sem igreja;
  - igreja sem Culto+;
  - registro com pedido silencioso;
  - registro com muitos versiculos/musicas;
  - mobile 360px;
  - dark mode.

---

## Definition Of Done

- [ ] Usuario cria um registro manual de culto sem pagina oficial.
- [ ] Registro fica salvo em `Meus Cultos`.
- [ ] Usuario consegue adicionar musicas, versiculos, anotacoes, oracoes silenciosas, sentimentos e decisoes.
- [ ] Pedido silencioso e privado.
- [ ] Versiculo pode ser pesquisado e salvo.
- [ ] Layout funciona durante o culto em mobile.
- [ ] RLS protege registros pessoais.
- [x] `npm run typecheck` passa.
- [ ] Testes principais passam.
