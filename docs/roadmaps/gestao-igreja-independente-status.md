# Status do Roadmap: Gestao da Igreja Independente

Data: 2026-06-26

## Fases do MVP

| Fase | Status | Observacao |
| --- | --- | --- |
| Roles e permissoes | Implementado em app/SQL | Scripts de aplicacao/validacao foram criados; validacao real ainda esta bloqueada por autenticacao da `DATABASE_URL`. |
| Rota independente `/gestao-igreja` | Implementado | Gate operacional protege o segmento por igreja e role. |
| Identidade visual v0 | Implementado | Shell prata/grafite e telas operacionais responsivas. |
| Designacoes v0 | Implementado parcial | Lista, criacao, aceite/recusa, notificacao e reconhecimento existem; pipeline de voluntariado ganhou categorias, cargos padronizados, filtro e contagem. |
| Equipes v0 | Implementado parcial | CRUD/listagem e estados vazios reais; falta vincular membros/equipe com contadores reais. |
| Notificacoes v0 | Implementado | Eventos, central, leitura/dispensa, dedupe e RPC para QR publico. |
| Dashboard v0 | Implementado parcial | Usa summary real ou zero quando schema nao existe; ainda possui atividades/regras auxiliares estaticas. |
| QR/forms | Implementado | Token publico, scan, envio para inbox, contador, notificacao via RPC, entrada no pipeline de voluntariado e regras de roteamento cobertas por teste local. |
| Inbox simples | Implementado parcial | Lista, atribuicao, prioridade, status e detalhe real; regras de status/atribuicao estao cobertas por teste local, falta RLS com perfis reais. |
| Cultos e Eventos | Implementado parcial | Hub conectado ao Culto+ e sincronizacao idempotente de escalas/pedidos para designacoes/inbox; falta validar no Supabase real. |
| Minha Igreja v0 | Implementado parcial | Mostra status, designacoes e insignias reais quando existem; ainda ha conteudos auxiliares de onboarding. |
| Atribuicao de responsavel | Implementado | Inbox atualiza responsavel, prioridade e proxima acao. |
| Status basico do pedido | Implementado | Status interno e publico conectados ao service. |
| Queries economicas | Implementado parcial | Services usam projections/limites, snapshots leves foram adicionados e a suite local do modulo roda via runner ESM estavel com 28 testes. |
| Voluntariado por ministerio | Implementado parcial | Catalogo de ministerios/cargos, QR com cargo de interesse, filtro por categoria e contagem estao prontos; falta validar com dados reais e acao final para converter interessado em equipe/designacao/role. |
| Grupos/celulas | Implementado parcial | Gestao consome grupos reais, mostra convites pendentes e gera alertas de acompanhamento; falta validar com dados reais e ampliar acoes por convite. |
| Snapshots historicos | Implementado parcial | SQL, service e tela de relatorios permitem criar/listar snapshots leves; falta aplicar no Supabase real e validar volume. |

## Fases fora do primeiro corte

| Fase | Status | Observacao |
| --- | --- | --- |
| Analytics avancado | Pendente | Depende de snapshots e volume real. |
| Relatorios exportaveis | Pendente | Fora do MVP. |
| Multi-campus | Pendente | Fora do MVP. |
| Financeiro | Pendente | Fora do MVP. |
| Automacoes complexas | Pendente | Fora do MVP. |
| Preferencias granulares por usuario/canal | Pendente | Base de eventos existe; UI/configuracao futura. |
| Ranking individual publico de voluntarios | Nao recomendado no MVP | Risco pastoral indicado no roadmap. |

## Próximas pendências técnicas

- [x] Corrigir a autenticação da `DATABASE_URL`/Postgres do Supabase real (colchetes removidos da senha no `.env`).
- [x] Aplicar `scripts/create_church_management.sql` no Supabase real (`npm run church:sql:apply` executado com sucesso).
- [x] Preencher variáveis `CHURCH_RLS_*` e rodar validação de RLS (`npm run church:rls:profiles` passando 100% com dados reais).
- [x] Corrigir escopo da query no RLS de badges (`where a.id = church_volunteer_badges.source_id` para evitar colisão com `a.source_id`).
- [ ] Ampliar testes automatizados de componentes/integração para QR público, inbox, designações, notificações e gate.
- [ ] Validar no Supabase real a sincronização Culto+ -> Gestão para escalas/pedidos.
- [ ] Evoluir grupos/células com ações por convite individual dentro da Gestão.
- [ ] Validar o pipeline de voluntariado com submissões reais e fechamento de conversão.
