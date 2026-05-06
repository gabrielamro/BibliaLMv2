# Roadmap da Aba Reino na Home

## Objetivo

Dar vida funcional a aba **Reino** da Home (`views/Inicio03.tsx`) sem tratar o mockup como tela isolada. O Reino deve virar a porta social do BibliaLM: feed, igreja/celula, oracao, compartilhamento de conteudo, interacao e notificacoes com regras claras de acesso.

## Estado Atual Confirmado

- A aba Reino esta em `views/Inicio03.tsx`, com `ReinoTab`.
- O feed usa `useKingdomFeed(userProfile)`, busca `dbService.getGlobalFeed` e cai para `data/mockFeedData.ts` quando nao ha dados.
- O composer real existe em `components/social/KingdomComposer.tsx` com abas de reflexao, oracao, check-in e sentimento.
- O mural usa `usePrayerWall(churchId)` e servicos de `prayer_requests`.
- Posts sao criados por `dbService.createPost`, com fallback de colunas em `utils/kingdomPostPayload.ts`.
- Existem destinos `global`, `church` e `cell`, mas o feed da Home ainda carrega pouco contexto e mostra somente uma janela curta.

## Regras de Negocio

**RN-REINO-01: Login e leitura**
Usuario deslogado pode visualizar o Reino em modo leitura com bloqueios claros para postar, interceder, comentar, curtir e compartilhar.

**RN-REINO-02: Contexto de comunidade**
Usuario com igreja vinculada ve prioridade para posts da propria igreja e atalhos de igreja/celula. Usuario sem igreja ve feed global e CTA para vincular igreja.

**RN-REINO-03: Destino do post**
Todo post deve ter destino `global`, `church` ou `cell`. Se destino for `church`, exige `churchId`. Se destino for `cell`, exige `cellId`/grupo vinculado.

**RN-REINO-04: Tipos de post**
O Reino deve suportar `reflection`, `prayer`, `feeling`, `image`, `study` e `room` como tipos oficiais no feed. Check-in pode continuar como reflexao com metadados ate existir tipo dedicado.

**RN-REINO-05: Conteudo compartilhado**
Estudos, salas/jornadas e posts compartilhados devem renderizar como cards clicaveis no Feed do Reino, sem expor links privados quebrados.

**RN-REINO-06: Privacidade herdada**
Conteudo privado ou por convite nao pode ser publicado no feed global sem confirmacao ou sem link acessivel. O feed deve bloquear ou explicar a restricao.

**RN-REINO-07: Interacoes**
Curtir, comentar, compartilhar e salvar exigem login, atualizam estado otimista e revertem em caso de erro.

**RN-REINO-08: Mural de oracao**
Pedido de oracao deve nascer como post/mural coerente com o destino escolhido. Interceder deve incrementar contagem uma vez por usuario.

**RN-REINO-09: Moderacao minima**
Autor pode excluir proprio post. Lider/pastor da igreja pode moderar posts da igreja/celula quando a permissao existir no perfil.

**RN-REINO-10: Notificacoes**
Curtidas, comentarios, intercessoes, mencoes e compartilhamentos relevantes devem gerar notificacoes acionaveis na Home.

**RN-REINO-11: Ranking/Maná**
Acoes sociais pontuam com limites anti-spam: postar, receber intercessao, compartilhar conteudo e comentar podem registrar atividade, mas nao devem gerar pontuacao infinita.

**RN-REINO-12: Fallback honesto**
Mocks so aparecem como estado vazio/preview de produto. Quando houver erro de banco, a UI deve indicar indisponibilidade ou modo demonstrativo.

## Roadmap de Implementacao

### Fase 0: Baseline e Contratos

- Mapear colunas reais de `posts`, `prayer_requests`, `notifications` e perfis de igreja/grupo.
- Consolidar contrato `Post` e payload de insert/update em utilitarios testaveis.
- Criar testes para `buildPostInsertPayloads`, fallback de feed e parse de compartilhamentos.
- Definir quais mocks ficam permitidos na Home e em que estados.

**Aceite:** contrato documentado, testes de payload passando, nenhum comportamento visual alterado.

### Fase 1: Feed Vivo na Home

- Evoluir `useKingdomFeed` para aceitar filtro: `global`, `church`, `cell`, `following` quando existir.
- Buscar mais que 3 posts e paginar/abrir "Ver Tudo no Reino" preservando filtro.
- Mostrar estado vazio pastoral e CTA certo: criar post, vincular igreja ou abrir feed social.
- Remover dependencia silenciosa de mock quando a tabela responde vazia.

**Aceite:** a aba Reino mostra feed real por contexto e fallback de erro distinguivel de feed vazio.

### Fase 2: Composer com RN de Destino

- Validar destino antes de `dbService.createPost`.
- Bloquear `church` sem `churchId` e `cell` sem `groupId`.
- Persistir metadados de check-in de forma estruturada ou padronizada.
- Adicionar teste para payload por destino.
- Garantir que upload de imagem e post textual tenham mensagens de erro claras.

**Aceite:** nao existe post de igreja/celula sem identificador correto; composer respeita login e contexto.

### Fase 3: Interacoes e Comentarios

- Padronizar handlers de like/comment/share/save no Feed da Home e pagina `/social`.
- Criar ou reutilizar modal/pagina de comentarios para `/p/{postId}`.
- Incrementar `shares_count`/`shares` de modo consistente.
- Aplicar optimistic update com rollback.

**Aceite:** curtir, comentar, compartilhar e salvar funcionam igual na Home e na tela social.

### Fase 4: Mural de Oracao Integrado

- Permitir criar pedido de oracao a partir da aba Reino.
- Definir se pedido tambem cria post do tipo `prayer` ou se o card do mural referencia `prayer_requests`.
- Filtrar mural por igreja quando houver `churchId`, global quando nao houver.
- Registrar intercessao uma unica vez por usuario.

**Aceite:** usuario pode pedir oracao e interceder sem sair da Home; contagem e permissao ficam consistentes.

### Fase 5: Compartilhar Estudos e Salas no Reino

- Finalizar cards de `study` e `room` no `FeedPostCard`.
- Reutilizar `utils/contentSharing.ts` e `utils/planSharing.ts`.
- Bloquear publicacao no feed para conteudo privado inacessivel.
- Adicionar caminho "Compartilhar no Feed do Reino" vindo de preview, acervo e sala publicada.

**Aceite:** estudo/sala compartilhado no Reino abre a rota publica correta e nao vaza conteudo privado.

### Fase 6: Notificacoes e Atividade

- Criar notificacoes para comentarios, intercessoes, mencoes e compartilhamentos.
- Integrar com `notifications` ja exibidas na Home.
- Registrar `recordActivity` com limites por acao/dia.
- Exibir resumo na sidebar da aba Reino.

**Aceite:** usuario recebe notificacoes acionaveis e Maná nao pode ser inflado por repeticao simples.

### Fase 7: Moderacao e Igreja

- Identificar papéis de pastor/lider/admin no `userProfile`.
- Permitir moderacao de posts da igreja/celula por usuarios autorizados.
- Adicionar reportar post/comentario usando `ReportTicket`.
- Criar estados visuais para conteudo removido ou denunciado.

**Aceite:** autor controla o proprio post e lider autorizado consegue moderar comunidade local.

### Fase 8: Polimento da Tela Reino

- Revisar layout mobile da Home para feed, mural e CTA flutuante.
- Garantir que cards nao sobreponham conteudo e que botoes tenham alvos de toque adequados.
- Harmonizar a aba Reino com `/social`, sem duplicar experiencias divergentes.
- Adicionar smoke Playwright para `/?tab=reino` logado/deslogado.

**Aceite:** Reino fica usavel como primeira tela social e nao apenas atalho para `/social`.

## Marcos Sugeridos

1. **MVP Vivo:** Fases 0-2.
2. **Interacao Real:** Fases 3-4.
3. **Distribuicao de Conteudo:** Fase 5.
4. **Comunidade Pastoral:** Fases 6-7.
5. **Release da Home Reino:** Fase 8.

## Riscos Principais

- `posts` pode ter schemas diferentes entre ambientes; manter fallback de colunas, mas testar payloads.
- Hoje `getGlobalFeed` prioriza destino global; feed de igreja/celula precisa consulta propria para nao depender apenas de ordenacao local.
- Mocks mascaram erro de banco; separar erro, vazio e demo evita conclusoes erradas.
- Privacidade de estudos/salas precisa ser respeitada antes de postar links no Reino.
- A Home e `/social` podem divergir se as regras ficarem duplicadas em componentes.

## Definition of Done

- Aba Reino usa dados reais e estados honestos.
- Usuario sabe quando esta no contexto global, igreja ou celula.
- Postar, interceder, curtir, comentar e compartilhar seguem RN testadas.
- Estudos e salas compartilhados aparecem como cards funcionais.
- Conteudo privado nao vaza no feed.
- Home Reino e `/social` compartilham regras e utilitarios.
- Testes cobrem payload, filtros, privacidade e smoke visual da aba.
