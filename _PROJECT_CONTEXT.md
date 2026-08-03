# 📖 Culto+ - Product Context & Business Rules

> **AI INSTRUCTION:** This file contains the "Soul" of the application. Refer to this for logic, gamification rules, and terminology.
> **VERSION:** v2.10.2 (Navegacao e estado temporal dos cultos)

## 1. Product Vision
Culto+ is one church-centered platform connecting personal Bible study, spiritual growth, community, services, volunteering, pastoral care and church management. `https://cultomais.vercel.app` is the canonical public origin. Legacy BibliaLM names and hosts are accepted only at compatibility boundaries; no active or newly generated product surface may present them as the primary brand or public URL.

## 2. User Roles & Permissions (The Hierarchy)

| Role | Key Permissions | Limits |
| :--- | :--- | :--- |
| **Visitante (Free)** | Read Bible, Feed (Read), Prayer Wall | AI Limits (low), Ads (future) |
| **Semeador (Bronze)** | + AI Chat (Medium), Custom Profile | ~10 Images/day |
| **Fiel (Silver)** | + Create Church, Podcast Gen | ~30 Images/day |
| **Visionário (Gold)** | **UNLIMITED AI**, Global Highlight | Unlimited |
| **Pastor** | + Pastoral Workspace (Journey Creator) | Unlimited + Leadership Tools |
| **Admin** | Full System Control, Wipe Data, CMS | N/A |

*   A alternância entre Minha visão, Gestão da Igreja e Workspace Pastoral deve permanecer compacta no menu: ícones lado a lado, rótulos acessíveis e somente as visões autorizadas. Não usar cards textuais nem opção de ocultar esse controle.

## 3. Core Modules

### 3.0. Identidade visual por módulo
*   Cada rota resolve um único módulo visual por meio do registro central em `constants.ts` e do resolver `utils/moduleTheme.ts`.
*   `Início` usa preto com amarelo da marca; `Bíblia` usa couro, pergaminho e ouro do Pão Diário; `Reino` usa gradiente próprio roxo, magenta e coral; `Cultos` usa verde; `Criar` usa o gradiente multicolorido da marca; `Gestão da Igreja` usa preto, grafite e prata; `Workspace Pastoral` usa roxo.
*   A identidade aparece em navegação, item ativo, cabeçalho, abas, foco e CTA principal. Superfícies de conteúdo permanecem neutras e cores semânticas de sucesso, alerta, erro e informação não são substituídas.
*   O shell determina a identidade de rotas operacionais compartilhadas: `/gestao-igreja/cultos` permanece Gestão, `/workspace-pastoral/cultos` permanece Workspace Pastoral e `/culto` ou `/meus-cultos` pertencem a Cultos.
*   `/oracoes` pertence à Bíblia, `/social/oracao` pertence ao Reino e `/oracoes/gerenciar` pertence ao Workspace Pastoral. `/criar-sala` pertence visualmente ao Workspace Pastoral.
*   Tema claro, tema escuro, menu desktop, menu móvel, navegação inferior e alternador de visões devem consumir os mesmos tokens. Cor nunca é a única indicação do módulo: título, ícone e estado ativo permanecem obrigatórios.
*   A navegação inferior pessoal usa sempre cinco destinos, nesta ordem: `Início`, `Bíblia`, `Reino`, `Cultos` e `Perfil`. Igreja, oração, grupos e descoberta são navegação contextual dentro do Reino e não substituem os destinos principais entre páginas.
*   O tratamento elevado da navegação inferior pertence exclusivamente ao destino da página atual. Reino só recebe o destaque premium em rotas do Reino; Início, Bíblia, Cultos e Perfil assumem o mesmo tratamento quando ativos.
*   Rotas ativas usam o shell correspondente ao seu módulo. A Home anterior e aliases de perfil apenas convergem para as experiências canônicas; páginas do Reino não renderizam `SocialNavigation` nem a sidebar global legada.

### 3.1. Início (Home)
*   The dashboard. Contains "Daily Bread" (Devotional), Reading Progress, and Shortcuts.
*   O item principal `Cultos` nos menus pessoal, mobile e do shell Culto+ direciona para `/meus-cultos`. A agenda pública `/culto` permanece acessível somente por atalhos internos explicitamente identificados como agenda.
*   Na `/newhome`, `Minha semana` ocupa o segundo card principal ao lado da continuidade de leitura e reúne cultos e escalas. Não deve existir um CTA principal separado de `Próximo culto`; essa informação aparece como selo discreto no primeiro culto da agenda. A retirada do card semanal da coluna lateral mantém `Minha escala` como primeira prioridade para voluntários.
*   Na `/newhome`, a barra de pesquisa deve ter largura limitada no desktop e compartilhar a linha com a saudação `Bem-vindo, [nome]` à sua direita, antes das ações de notificação e perfil. A navegação por abas mantém a altura confortável de interação e não recebe a saudação. Não repetir uma saudação grande dentro do painel inicial.
*   A faixa de atalhos da jornada na `/newhome` apresenta somente `Meta de Leitura`, `Pão Diário` e `Oração ao Amanhecer`, distribuídos em três colunas equivalentes no desktop. `Meus Estudos` permanece acessível pela biblioteca e pelo menu, sem duplicar um CTA nessa faixa.

### 3.2. Bíblia (Reader)
*   Offline-first capability.
*   **AI Tools:** Explain Verse, Generate Image, Audio Narration (TTS).
*   **Estúdio da Palavra:** `/criar-conteudo` e o editor de aulas de `/criar-sala` compartilham o componente canônico `StudyStudio`; `/criar-conteudo-v2` e `/criar-conteudo-v3` apenas preservam links antigos redirecionando para a rota canônica. O Estúdio usa capabilities por contexto, grade real de 12 colunas, biblioteca pesquisável, cinco modelos, comando `/`, pesquisa bíblica, propriedades e Obreiro IA. Sugestões da IA sempre passam por revisão e aceite total, parcial, como novos blocos ou descarte. O documento canônico usa `StudyDocumentV2`, revisão otimista e autosave; leitores públicos usam `StudyDocumentRenderer`.
*   **Pão Diário:** experiência editorial independente em cinco movimentos — ler, refletir, orar, praticar e concluir — com retomada local, controles de leitura e publicação opcional no Reino.
*   A identidade visual do Pão Diário usa couro, marrom, ouro envelhecido e superfícies de pergaminho. O leitor ocupa toda a largura útil da página, enquanto o texto bíblico usa tipografia serifada clássica distinta dos controles e comentários editoriais.
*   No modo escuro, superfícies extensas devem usar carvão quente e pergaminho neutro, reservando marrom e ouro para hierarquia e detalhes. Todo texto bíblico usa branco envelhecido `#E7E0D4`, inclusive a passagem contextual e os versos em destaque.
*   As experiências diretamente ligadas à Bíblia — Bíblia Sagrada, Pão Diário, Orações, planos e quiz — devem compartilhar a mesma família visual de pergaminho, carvão quente, couro, marrom e ouro envelhecido. Cada módulo preserva sua estrutura funcional, mas não deve introduzir uma cor institucional concorrente.
*   `/oracoes` usa essa identidade bíblica em todas as superfícies. Textos de oração em áreas escuras usam branco envelhecido `#E7E0D4`, e destaques inteligentes nunca podem reduzir o contraste da leitura.
*   `/devocional` usa o `CultoPlusPageShell` oficial. Não deve renderizar uma segunda barra de navegação própria; no modo sem interrupções, o shell é ocultado junto com as demais distrações.
*   O conteúdo oficial do Pão Diário é único por data no fuso `America/Manaus`: o primeiro acesso materializa a seleção no banco e os demais acessos recebem o mesmo conteúdo.
*   Usuários autenticados não devem receber novamente um conteúdo já registrado no histórico. Cada pessoa pode solicitar uma alternativa pessoal uma vez por dia; essa troca não altera o conteúdo oficial dos demais usuários e uma falha de geração não consome a cota.
*   A geração e a trava diária são decisões do servidor. Chaves privilegiadas, gravação do catálogo, histórico e reserva da atualização nunca devem ser executados pelo navegador.
*   O Pão Diário usa navegação mínima e um leitor de estudo que mostra uma etapa por vez, com botões explícitos de avanço e retorno; não deve assumir aparência de dashboard ou painel operacional.
*   `/devocional` deve apresentar um único título editorial para o conteúdo diário. A etapa `Ler a Palavra` é apenas um marcador discreto e não pode criar um segundo título concorrente.
*   Na primeira etapa, a ordem obrigatória é: versículo, reflexão pastoral, contexto bíblico imediato, observação e continuidade. A reflexão possui maior peso visual; o contexto permanece integrado como apoio e `Observe no texto` encerra a leitura.
*   As cinco etapas do estudo devem ser reconhecíveis como navegação sequencial secundária: trilho lateral compacto no desktop e lista completa depois do conteúdo no mobile, preservando numeração, estado atual, conclusão e acesso direto.
*   A etapa Palavra deve distinguir explicitamente texto bíblico, contexto imediato e reflexão pastoral. O trecho ampliado vem da Bíblia local do projeto e a aplicação nunca deve ser apresentada como citação bíblica.
*   O "Sentido central" preserva o conteúdo pastoral, mas deve apresentá-lo em parágrafos justificados e destacar em negrito somente termos bíblicos relevantes, sem HTML gerado pelo conteúdo.
*   Reflexões do Pão Diário são privadas por padrão e nunca são copiadas automaticamente para posts.

### 3.3. O Reino (Social)
*   **Feed:** Chronological posts. Types: Prayer, Reflection, Feeling, Quiz result and Pão Diário cards.
*   O Feed em `/social` usa o shell e o menu oficial Culto+, com uma superfície editorial de leitura, publicação rápida e atalhos para igreja e descoberta. Não deve reativar o menu lateral legado nessa rota.
*   No desktop, a coluna principal do Reino usa largura editorial ampliada de até `980px`: deve aproveitar a área disponível sem ocupar a página inteira. Cabeçalho, compositor e publicações compartilham o mesmo alinhamento; no mobile, a coluna continua fluida e sem rolagem horizontal.
*   O Feed usa a linguagem própria **Trama Viva**: superfícies editoriais neutras, gradiente Culto+ para conexão e filtros explícitos `Para você`, `Seguindo`, `Minha igreja` e `Grupos`. Falha de backend nunca é mascarada por posts mockados.
*   A publicação rápida usa o **Caderno de Partilha**: um único launcher por viewport, rascunho local recuperável, audiência textual, localização somente após consentimento, imagem validada com descrição e confirmação antes de descartar.
*   Os cards do Reino usam a linguagem de **folha editorial**, com uma dobra inferior que não intercepta ações. Reflexões podem destacar uma passagem bíblica estruturada ao lado do texto, e toda publicação informa sua audiência no cabeçalho.
*   **Seu caminho** é contextual e usa dados reais: próximo culto, convite ou compromisso de escala, convite de oração e estudo salvo. No desktop permanece como trilho lateral; no mobile abre sob demanda para priorizar o feed.
*   No mobile, a **Trama Viva** continua pela linha de autores, avatar externo, tipo editorial na margem e atalhos `Comunidade`, `Minha igreja` e `Orações`. Esses atalhos complementam a barra inferior principal, sem duplicá-la.
*   Mudanças visuais no Feed devem preservar os fluxos de publicar, comentar, curtir, compartilhar, editar, excluir e atualizar a lista.
*   **Ecclesia:** Church & Cell system. Users bind to a Church/Group to see specific Prayer Walls.
*   **Relações distintas:** `Sou membro` representa vínculo de membresia com a igreja; `Seguir página` acompanha as publicações sem tornar a pessoa membro. Uma relação nunca deve ser inferida da outra.
*   **Criação de grupos:** somente pastor ativo da mesma igreja ou líder ativo com escopo compatível pode criar grupo. Plano, membresia, voluntariado, autoria e papel de gestor não concedem essa permissão.
*   **Hierarquia de grupos:** líder com escopo de igreja pode criar grupo raiz; líder com escopo de grupo pode administrar o grupo designado e criar subgrupo abaixo dele. Todo líder selecionado precisa ter papel ativo na mesma igreja.
*   **Privacidade:** grupo privado pode ser descoberto por convite, mas seu feed só é liberado após o aceite e a confirmação de que a pessoa já é membro da igreja. Convites expiram e são consumidos atomicamente.
*   Igrejas, grupos, subgrupos e perfis usam rotas canônicas (`/igreja`, `/grupo` e `/u`) e breadcrumbs preservam o contexto da navegação.
*   Perfis canônicos em `/u/[username]` usam o shell oficial do Culto+ com o módulo Reino ativo, menu desktop expansível e navegação móvel consistente; o trilho lateral legado não deve ser renderizado nessa rota.
*   **Explore:** OmniSearch for finding Users, Churches, or Bible content.

### 3.4. Estúdio Criativo
*   Generates "Sacred Art" (DALL-E/Imagen style via Gemini) from verses.
*   Generates "AI Podcasts" (Dialogues between two hosts).

### 3.5. Workspace Pastoral
*   Exclusive to Pastors. Allows creating "Jornadas" (Study Plans) with structured weeks/days.

### 3.6. Culto+
*   Church service accompaniment module.
*   Em `/meus-cultos`, os cinco indicadores pessoais ocupam uma única faixa no mobile com ícone e valor; seus rótulos aparecem por hover, foco ou toque. A página também mostra os próximos cultos publicados da igreja vinculada, independentemente de check-in ou escala pessoal.
*   Pastors/managers create a service, liturgical timeline, public OnePage, check-ins, private sermon notes and church-linked feed posts.
*   A página pública `/culto/[serviceSlug]` é uma experiência imersiva em largura total: cabeçalho e ações compactos, transmissão como elemento dominante, atalhos imediatamente abaixo do vídeo e painel contextual de participação, momento atual e contagem regressiva.
*   Em telas horizontais com pouca altura, a primeira dobra deve acomodar cabeçalho, transmissão e todas as ações rápidas em uma linha. A timeline continua como conteúdo subsequente e o modo vertical preserva os alvos de toque maiores.
*   O painel lateral organiza uma timeline viva pelos blocos litúrgicos, combinando check-ins, posts vinculados, pedidos de oração e um comentário por usuário em cada momento, com filtros e atualização em tempo real.
*   O seletor da timeline deve permanecer acima das reações fixas, caber integralmente no painel em qualquer breakpoint e fechar após a seleção, clique externo ou tecla Esc.
*   Amém, Glória e Aleluia permanecem visíveis em uma faixa fixa da timeline. Cada toque cria um evento contabilizado e mostra temporariamente a foto pública ou as iniciais de quem reagiu.
*   A faixa de reações ocupa o rodapé do painel lateral, depois da área rolável da timeline e alinhada visualmente às ações inferiores da transmissão.
*   Quando uma participação no culto exigir autenticação, o app deve preservar a rota completa de origem. Reações iniciadas antes do login são mantidas somente na sessão, vinculadas ao culto e registradas uma única vez após a autenticação.
*   Pedidos públicos exibem no máximo 120 caracteres. Pedidos privados nunca expõem conteúdo na projeção pública ou nos eventos Realtime; mostram somente que a pessoa pediu uma oração privada.
*   The church profile surfaces published services in the `Cultos` tab.
*   Papéis gerais e operacionais são independentes: `church_manager` administra a operação, `pastor` recebe cuidado sensível, `leader` atua somente no escopo concedido e `volunteer` responde apenas pelos próprios convites e escalas.
*   O perfil ou assinatura de pastor não concede automaticamente acesso à Gestão da Igreja.

## 4. Gamification (The Mana System)
*   **Currency:** "Maná" (XP). Not spendable, prestige only.
*   **Streaks:** Daily consecutive usage.
*   **Badges:** Awarded based on XP thresholds or specific actions (e.g., "First Share").

*   **Rules:** `utils/activityRules.ts` centralizes ActionTypes, XP defaults, limits, cooldowns and anti-duplication metadata.
*   **Competition:** `/competicao` surfaces personal progress, daily Mana checklist, public rules and global user ranking.
*   **Audit:** `mana_events` and the Admin Mana audit tab support review/void flows after the Supabase migration is applied.
*   **Campaigns:** `SystemSettings.gamificationCampaigns` controls active seasons/challenges without deploy.

## 5. Domain Glossary
*   **Obreiro IA:** The AI persona.
*   **Jornada:** A structured study plan (course).
*   **Célula:** Small group within a church.
*   **Mural:** Prayer request board.
*   **Artes Sacras:** AI-generated images.

## 6. Safety & Integrity
*   **Wipe:** Admin capability to hard-delete all Firestore UGC (User Generated Content).
*   **Moderation:** Reporting system for toxic content.
*   **Quotas:** `checkFeatureAccess` must wrap ALL AI calls to prevent abuse/billing spikes.
