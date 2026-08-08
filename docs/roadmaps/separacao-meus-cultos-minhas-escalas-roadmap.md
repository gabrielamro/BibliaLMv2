# Roadmap — Separação de Meus Cultos e Minhas Escalas

**Status:** proposta para validação de produto  
**Módulo:** Cultos + Gestão da Igreja  
**Rotas alvo:** `/meus-cultos`, nova `/minhas-escalas`, `/culto` e `/culto/[serviceSlug]`  
**Objetivo:** reduzir a densidade de `/meus-cultos`, separar o histórico/experiência de culto das obrigações de serviço e deixar explícita a diferença entre agenda física da igreja e culto online.

## 1. Decisão de produto proposta

### `/meus-cultos` — memória e participação

Deve concentrar somente o que pertence à experiência pessoal de acompanhar ou registrar um culto:

- cultos oficiais em que a pessoa fez check-in;
- registros pessoais de cultos externos;
- notas, decisões, orações, músicas e versículos;
- acesso ao diário individual do culto;
- uma entrada curta para o próximo culto físico da igreja;
- link contextual para `Minhas escalas` quando houver uma escala relacionada.

Não deve mais conter a operação completa de escalas, equipes, candidaturas e convites.

### `/minhas-escalas` — compromissos de serviço

Deve concentrar a vida operacional do membro/voluntário:

- próximas escalas e histórico de escalas;
- convites pendentes, aceite e recusa;
- confirmação de presença/resposta;
- equipe e função associadas;
- solicitações de voluntariado e seu andamento;
- acesso a detalhes do culto físico relacionado;
- estados vazios, conflito, atraso e erro de atualização.

O nome da página é “Minhas escalas”; o texto auxiliar pode explicar “Veja onde você serve, responda convites e acompanhe suas equipes”.

### `/culto` e `/culto/[serviceSlug]` — agenda e experiência pública

- `/culto` continua sendo a agenda de cultos publicados pela igreja.
- A agenda deve priorizar cultos físicos/presenciais, pois é nela que o usuário procura data, horário e local para participar.
- Cultos online não devem desaparecer: devem ser identificados por um selo/filtro “Online” e continuar abrindo a OnePage em `/culto/[serviceSlug]`.
- O calendário pode exibir ambos quando a igreja publicar os dois formatos, mas com filtros explícitos `Todos`, `Presenciais` e `Online`; o padrão recomendado é `Presenciais` quando o contexto for a agenda da igreja.
- A OnePage mantém a experiência ao vivo, transmissão, check-in e participação online, sem transformar a agenda pessoal em uma página operacional.

## 2. Estado atual confirmado

`views/MyCultosPage.tsx` carrega em uma única tela:

- `cultoPlusService.getUserCheckedInServices`;
- `personalServiceJournalService.getJournalsByUser`;
- `churchManagementService.listUserCultoAssignments`;
- `churchManagementService.listUserTeams`;
- `churchManagementService.listMemberSubmissions`;
- `cultoPlusService.getServicesByChurchRange`.

Além do histórico, a tela possui resumo de escalas, agenda do próximo culto, âncoras para `#escala`, `#equipes` e `#solicitacoes`, e o componente `PersonalCultosOperations` com modais de escala, equipe e voluntariado.

O shell pessoal já possui o módulo `cultos` e atualmente aponta para:

- `Agenda de cultos` → `/culto`;
- `Meu painel` → `/meus-cultos`;
- `Minha escala` → `/meus-cultos#escala`;
- `Minhas equipes` → `/meus-cultos#equipes`;
- `Solicitações` → `/meus-cultos#solicitacoes`.

O modelo `ChurchService` já possui `serviceType`; a experiência de gestão também já usa o conceito de presencial. Ainda será necessário confirmar se a coluna/contrato atual diferencia de forma consistente `online` e `presencial` em todos os dados publicados, ou se será preciso introduzir um campo de modalidade compatível.

## 3. Arquitetura alvo

### Componentes e views

1. Extrair o bloco de histórico/participação de `MyCultosPage` para componentes menores, preservando a fonte de dados atual.
2. Criar `views/MyScalesPage.tsx` para a página `/minhas-escalas`.
3. Reaproveitar `PersonalCultosOperations` como base de apresentação, mas dividir responsabilidades em componentes orientados a escala:
   - `PersonalScaleList`;
   - `PersonalScaleDetails`;
   - `PersonalTeamsPanel`;
   - `VolunteerRequestsPanel`.
4. Manter ações de dados em `services/churchManagementService.ts`; não mover regra de aceite, conflito ou permissão para a view.
5. Se o componente de operações continuar compartilhável, torná-lo configurável por contexto sem duplicar a regra de negócio.

### Dados e serviços

- Criar um carregador de dados específico para escalas pessoais, preferencialmente no serviço existente ou em `services/personalScalesService.ts` se a separação reduzir acoplamento.
- Manter `listUserCultoAssignments`, `listUserTeams` e `listMemberSubmissions` como contratos de dados reutilizáveis.
- Definir a ordenação da nova página: pendentes primeiro, próximas escalas depois, histórico por data descrescente.
- Garantir que aceitar/recusar escala atualize a lista local sem recarregar a página inteira.
- Garantir que a escala preserve o vínculo com o `ChurchService` e permita navegar para sua OnePage/agenda.
- Auditar RLS e permissões para confirmar que o membro recebe apenas suas próprias designações e equipes permitidas.

### Modalidade de culto

- Auditar `ChurchServiceType`, `service_type`, `liveUrl`, status e os textos da OnePage.
- Definir uma função única, por exemplo `getServiceModality(service)`, para evitar que cada tela interprete online/presencial de maneira diferente.
- Se `serviceType` não for suficiente, adicionar um campo compatível e uma migration segura com default `presencial` para registros existentes.
- Atualizar agenda, cards, detalhes da escala e OnePage para mostrar modalidade por texto e ícone, nunca apenas por cor.
- Não alterar a regra de que a escala normalmente pertence a um culto/evento físico sem antes validar o caso de escala para transmissão ou operação online.

## 4. Navegação e compatibilidade

### Menu principal

- Manter `Cultos` como destino principal mobile em `/meus-cultos`.
- Trocar os links de hash por `/minhas-escalas`:
  - `Minha escala` → `/minhas-escalas`;
  - `Minhas equipes` → `/minhas-escalas#equipes`;
  - `Solicitações` → `/minhas-escalas#solicitacoes`.
- Adicionar a nova rota ao `APP_MODULE_ROUTE_RULES` do módulo `cultos`.
- Atualizar o estado ativo do submenu para reconhecer a nova rota.

### Links e redirects existentes a auditar

- `next.config.ts`: redirects de `/minha-igreja/acompanhamento`, `/minha-igreja/designacoes` e `/minha-igreja/equipes`.
- `app/minha-igreja/*/page.tsx`: destinos atuais com hashes.
- `views/NewHomePage.tsx`: cards de “Minha escala”, “Ver minhas designações”, calendário e atalhos.
- `components/social/KingdomPathRail.tsx`: CTA “Ver minha escala”.
- `components/church-management/ChurchQrPublicFormPreview.tsx`: retorno de candidatura.
- `services/churchManagementService.ts`: links de notificações em `/meus-cultos#solicitacoes`.
- `scripts/seed_full_qa_fixture.mjs`: links de fixture e notificações.
- `data/appHelpKnowledge.ts`, `views/LiveMapPage.tsx` e release notes/documentação do módulo.
- `components/culto-plus/CultoPlusOnePage.tsx`: retorno para Meus Cultos e CTA de escala.

### Compatibilidade de links antigos

- Manter `/meus-cultos#escala`, `#equipes` e `#solicitacoes` funcionando por período de transição.
- A solução preferida é uma resolução de hash no cliente que redirecione para `/minhas-escalas` preservando o destino; caso isso não seja confiável no App Router, manter seções mínimas ou criar redirects sem perder o estado do usuário.
- Não quebrar links de notificações, e-mails, QR forms ou favoritos existentes.

## 5. Direção visual

- Usar o `CultoPlusPageShell` e o módulo visual `cultos` na nova página.
- Reutilizar as cores e a densidade operacional da Gestão da Igreja como referência de organização: grafite, prata, superfícies compactas e hierarquia de status.
- Aplicar o verde do Culto (`module-*`/tokens de `cultos`) como subcor contextual para identidade, CTA primário, foco, ícones de serviço e estado ativo.
- Não criar uma paleta paralela nem copiar hexadecimais diretamente; usar `data-module-theme="cultos"`, tokens e classes existentes.
- Separar visualmente estados semânticos: pendente em alerta, confirmado em sucesso, recusado em erro/negativo; verde não deve significar todos os estados.
- Priorizar lista operacional na página de escalas, com resumo curto e filtros; evitar o hero e os cinco indicadores da página atual quando não ajudarem uma decisão.
- Validar claro/escuro, 320 px, mobile com navegação inferior e desktop com menu compacto/expandido.

## 6. Fases de execução

### Fase 0 — Contrato de produto e inventário

- [ ] Aprovar os nomes e a responsabilidade de cada rota.
- [ ] Confirmar regra de agenda: físicos como padrão; online disponível por filtro e selo.
- [ ] Confirmar se escalas online são permitidas ou se a escala deve ser marcada como presencial/operacional.
- [ ] Fechar estados obrigatórios da escala e critérios de ordenação.

**Gate:** produto aprova o mapa `/meus-cultos` + `/minhas-escalas` + `/culto`.

### Fase 1 — Contratos de modalidade e serviços

- [x] Auditar dados reais e migrations de `church_services`/tabelas de escala.
- [x] Centralizar resolução de modalidade online/presencial.
- [x] Ajustar filtros e tipos sem alterar registros existentes.
- [x] Cobrir serviço sem modalidade, serviço antigo e serviço com `liveUrl`.

**Gate:** cada culto aparece com modalidade determinística e compatível com dados antigos.

### Fase 2 — Nova página Minhas escalas

- [x] Criar rota protegida `/minhas-escalas`.
- [x] Criar cabeçalho, resumo enxuto, filtros e lista de próximas/históricas.
- [x] Migrar respostas de aceite/recusa, detalhes, equipes e solicitações.
- [x] Adicionar links para o culto relacionado e para agenda.
- [x] Preservar loading, vazio, erro, permissão e atualização otimista/segura.

**Gate:** membro consegue encontrar, responder e revisar uma escala sem entrar em `/meus-cultos`.

### Fase 3 — Enxugamento de Meus Cultos

- [x] Remover `PersonalCultosOperations` da composição principal.
- [x] Manter histórico, registros pessoais e próximo culto físico.
- [x] Trocar o CTA de escala por link direto para `/minhas-escalas`.
- [x] Revisar os indicadores para não contar escalas/equipes na página de memória.

**Gate:** nenhum bloco operacional de escala fica duplicado em duas páginas.

### Fase 4 — Agenda física e online

- [x] Adicionar filtro/selo de modalidade à agenda pública.
- [x] Ajustar cards e calendário para informar local ou transmissão conforme o tipo.
- [x] Manter a OnePage online funcional e sem regressão no check-in/stream.
- [x] Garantir que a agenda de culto físico continue sendo a entrada principal para compromissos presenciais.

**Gate:** usuário diferencia onde participar fisicamente e quando acompanhar online sem depender de cor ou conhecimento prévio.

### Fase 5 — Navegação, links e migração de referências

- [x] Atualizar shell, Home, Reino, notificações, redirects, QR e mapa do app.
- [x] Atualizar testes de contrato e fixture de QA.
- [x] Adicionar compatibilidade para hashes antigos.
- [x] Atualizar `LiveMapPage`, ajuda contextual e documentação do módulo.

**Gate:** nenhuma entrada conhecida de escala leva o usuário à página antiga ou a uma âncora inexistente.

### Fase 6 — Validação e rollout

- [x] Executar `npm run typecheck` e `npm run build`.
- [x] Executar testes de menu, Home, Gestão da Igreja e novos testes de escala/modalidade.
- [x] Validar perfis: membro sem igreja, membro com igreja, voluntário, líder e gestor. — validado em 2026-08-07 com fixture `.qa-fixture.local.json` (`guest` sem igreja, `member` com escalas, `leader`, `manager`, `pastor`); páginas `/minhas-escalas` e `/meus-cultos` carregam com CTA/menu corretos. Screenshots em `.tmp-tests/qa-visual-escalas/persona-*.png`.
- [x] Testar desktop, mobile, claro/escuro, teclado e recarga com links antigos. — validado em 2026-08-07 via Playwright autenticado em `http://127.0.0.1:3010`: `/minhas-escalas` (320/1280 + claro/escuro), `/meus-cultos` (CTA para escalas, sem bloco operacional completo), redirects `#escala`/`#equipes`/`#solicitacoes`, reload `#equipes`, menu Cultos com `Minha escala`/`Minhas equipes`/`Solicitações` + estado ativo, agenda pública na aba Cultos do perfil da igreja (filtros Todos/Presenciais/Online + selo texto+ícone). Browser MCP (`cursor-ide-browser`) ficou indisponível nesta sessão (abas não persistiam); QA feito com Playwright. Teclado: Tab funciona, mas o portal de dev do Next.js captura os primeiros focos.
- [ ] Publicar com observação de erros de carregamento e respostas de escala. — migration `20260807120000_church_service_modality.sql` **já aplicada** no banco do `.env` (`modality` + check + índice; backfill `online=2` / `presencial=43`). Falta publicar o app (commit/deploy) e observar erros em produção.

## 7. Impacto por área

| Área | Impacto | Ação necessária |
| --- | --- | --- |
| Rotas App Router | alto | nova rota protegida e compatibilidade de hashes |
| Shell/menu | alto | submenu, estado ativo e links canônicos |
| `MyCultosPage` | alto | remover operações e reduzir carregamento/densidade |
| `PersonalCultosOperations` | alto | decompor/reaproveitar na nova página |
| Serviços | médio/alto | contrato de carregamento pessoal e modalidade |
| Supabase/RLS | médio | auditar, migration somente se modalidade exigir |
| Agenda pública | médio | filtros e rótulos online/presencial |
| OnePage do culto | médio | preservar fluxo online e links de retorno |
| Gestão da Igreja | baixo/médio | manter origem de criação/gestão das escalas; ajustar links de retorno |
| Home/Reino/notificações | médio | atualizar CTAs e links |
| Testes/QA | alto | navegação, dados, permissões, modalidade e regressão |
| Conteúdo/ajuda/mapa | baixo/médio | atualizar nomenclatura e destinos |

## 8. Critérios de aceite finais

1. `/meus-cultos` abre com foco em memória e participação, sem lista operacional completa de escalas/equipes/solicitações.
2. `/minhas-escalas` permite visualizar, filtrar, abrir e responder escalas sem duplicar a lógica de Gestão.
3. Links de menu, Home, Reino, notificações e redirects apontam para a nova página.
4. Links antigos com hashes continuam levando ao conteúdo equivalente.
5. A agenda de `/culto` diferencia cultos presenciais e online por texto, filtro e metadado adequado.
6. A OnePage online continua acessível e os cultos físicos continuam usando a agenda da igreja.
7. RLS e permissões impedem que um usuário veja escalas de outro.
8. A interface usa shell e tokens do Culto+, com referência de densidade da Gestão e verde de Cultos como subcor.
9. Typecheck, build e testes relevantes passam em claro/escuro, desktop e mobile.

## 9. Riscos e decisões em aberto

- **Modalidade insuficiente:** `serviceType` pode representar categoria litúrgica, não necessariamente modalidade. Confirmar antes de usar esse campo como `online/presencial`.
- **Escala duplicada:** mover visual sem mover contrato pode deixar carregamentos e notificações duplicados. A nova página deve ser a única dona da operação pessoal.
- **Links históricos:** notificações e favoritos podem conter hashes antigos; a compatibilidade deve ser tratada como requisito, não como detalhe pós-lançamento.
- **Escala online:** uma pessoa pode ser escalada para operação de transmissão online. O produto precisa distinguir “culto online” de “função remota no culto” antes de aplicar filtros físicos.
- **Performance:** hoje `/meus-cultos` faz seis consultas em paralelo. Separar a página permite que a memória não carregue dados de escala e que a página de escalas não carregue journals/check-ins.
- **Permissões:** candidaturas e equipes têm dados pessoais e status operacionais; qualquer mudança de query deve manter RLS e testes por perfil.
