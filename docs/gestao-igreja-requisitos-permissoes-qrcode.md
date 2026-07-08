# Requisito Funcional - Fluxo de Permissoes, Equipes, Designacoes e QR Code

Status: documento funcional detalhado, sem implementacao  
Data: 2026-06-30  
Modulo: Gestao da Igreja  
Rotas principais: `/gestao-igreja`, `/minha-igreja`, `/qr/[token]`, `/social/igreja/[churchSlug]/gerir`, `/admin`

## 1. Objetivo

Documentar o fluxo funcional real e as regras de negocio do modulo Gestao da Igreja, com foco em:

- permissao de acesso ao modulo;
- solicitacao e aprovacao de responsabilidade pela igreja;
- concessao de papeis operacionais;
- criacao de equipes;
- criacao de designacoes vinculadas ou nao a equipes;
- aceite/recusa de designacoes;
- fluxo completo de QR Code/formulario;
- roteamento para Inbox;
- retorno visivel em Minha Igreja;
- lacunas atuais de aprovacao, vagas e centralizacao.

Este documento nao implementa nada. Ele organiza a regra funcional a partir do estado observado no repositorio e aponta decisoes pendentes.

## 2. Fontes observadas no repositorio

- `docs/roadmaps/gestao-igreja-independente-roadmap.md`
- `docs/roadmaps/gestao-igreja-independente-status.md`
- `utils/churchManagementRules.ts`
- `services/churchManagementService.ts`
- `services/churchNotificationService.ts`
- `services/supabase.ts`
- `scripts/create_church_management.sql`
- `scripts/create_churches.sql`
- `scripts/church_role_requests_admin_policies.sql`
- `components/church-management/*`
- `app/gestao-igreja/*`
- `app/minha-igreja/*`
- `app/qr/[token]/page.tsx`
- `views/AdminPage.tsx`
- `views/public/ChurchProfilePage.tsx`
- `views/public/ChurchContractPage.tsx`
- `types.ts`
- `tests/churchManagementRules.test.ts`
- `tests/churchManagement.test.ts`

## 3. Leitura executiva

O modulo Gestao da Igreja ja esta separado do Workspace Pastoral e opera em quatro fluxos que hoje aparecem em telas diferentes:

1. Fluxo de aprovacao inicial de responsabilidade pela igreja.
2. Fluxo de permissoes operacionais por role e escopo.
3. Fluxo de equipes e designacoes de servico.
4. Fluxo de QR Code, formulario publico, Inbox e retorno ao membro.

O fluxo real nao esta em um unico lugar da UI, mas a regra tecnica esta parcialmente centralizada em `churchManagementService`, `churchNotificationService`, `churchManagementRules` e no SQL/RLS do modulo.

Pontos mais importantes:

- Aprovacao inicial de gestao existe: o usuario solicita responsabilidade por uma igreja e um admin da plataforma aprova ou recusa em `/admin`.
- A aprovacao inicial adiciona o usuario como admin da igreja no campo `churches.admins`, atualiza vinculo e perfil, mas nao necessariamente cria um registro em `church_member_roles`.
- Depois que um usuario tem acesso, a concessao de roles operacionais (`church_manager`, `pastor`, `leader`, `volunteer`) e direta por usuario autorizado, sem workflow multiaprovador proprio.
- Equipe possui `capacity`, mas designacao nao possui quantidade de vagas no modelo atual. Pelo requisito de produto, designacao deve ter vagas obrigatorias.
- Designacao hoje funciona como uma atribuicao/convite individual ou atividade com um assignee opcional. Para suportar vagas corretamente, a designacao precisa ser tratada como atividade/oferta com multiplos convites ou slots.
- QR Code cria um formulario ativo com token unico, URL `/qr/[token]`, contadores de scan/envio, submissao em Inbox e notificacao.
- A UI publica do QR exige login antes de salvar o envio, mas o banco/modelo ainda possui `allow_anonymous` e RLS que permitem submissao publica de formulario ativo. Isso e uma divergencia de regra.
- QR de `prayer` e `pastor_care` e tratado como sensivel e roteado para pastor. QR de `volunteer`, `visitor`, `group` e `custom` e roteado para lideranca/gestao.
- O membro ve apenas o espelho seguro em `/minha-igreja`: status publico, designacoes proprias, insignias e retornos permitidos.

## 4. Glossario funcional

| Termo | Definicao |
| --- | --- |
| Igreja | Entidade principal (`churches`) onde equipes, roles, designacoes, QR Codes, submissoes e notificacoes ficam escopados. |
| Membro | Usuario vinculado a uma igreja, normalmente por `memberships` e/ou `userProfile.churchData`. |
| Gestao da Igreja | Modulo operacional independente acessado por `/gestao-igreja`. |
| Minha Igreja | Area do membro acessada por `/minha-igreja`, usada como espelho seguro dos fluxos da gestao. |
| Role operacional | Papel da tabela `church_member_roles`: `church_manager`, `pastor`, `leader`, `volunteer`. |
| Escopo | Limite da role ou designacao: `church`, `team`, `group`, `service`, `event`. |
| Church admin legado | Usuario presente em `churches.admins`; hoje tambem passa no gate de acesso. |
| Gestor da Igreja | Papel operacional `church_manager`; gerencia operacao, permissoes, equipes, QR, configuracoes e dados nao sensiveis. |
| Pastor | Papel operacional `pastor`; acessa cuidado pastoral e itens sensiveis, mas nao vira gestor administrativo automaticamente. |
| Lider | Papel operacional `leader`; atua dentro do escopo recebido. |
| Voluntario | Papel operacional `volunteer`; ve suas proprias atividades, equipes e retornos, sem acesso administrativo. |
| Equipe | Grupo operacional de servico (`church_service_teams`) com area, lider, status e capacidade. |
| Designacao | Atividade/atribuicao de servico (`church_assignments`) com escopo, status, pessoa designada, lider e feedback ao membro. |
| Vaga | Quantidade de posicoes disponiveis para uma designacao. No estado atual, existe apenas `capacity` na equipe; deve virar regra propria da designacao. |
| QR/formulario | Entrada publica da igreja (`church_qr_forms`) com tipo, token, campos, privacidade, validade e destino. |
| Submissao | Resposta enviada por formulario/QR (`church_form_submissions`) e tratada na Inbox. |
| Inbox | Fila operacional de pedidos, voluntariado, visitantes, cuidado pastoral e entradas de grupo. |
| Notificacao operacional | Evento visivel para dashboard, membro ou ambos (`church_management_notifications` e `church_notification_events`). |

## 5. Atores e responsabilidades

| Ator | Responsabilidade principal | Acesso real observado |
| --- | --- | --- |
| Admin da plataforma | Aprovar/rejeitar solicitacoes de responsabilidade pela igreja e administrar seguranca global. | Acesso por `subscription_tier = admin` ou regra `is_platform_admin()`. |
| Usuario solicitante | Solicita gerir ou assumir responsabilidade por uma igreja. | Cria `church_role_requests` com status `pending`. |
| Church admin legado | Responsavel aprovado ou cadastrado em `churches.admins`. | Passa no `ChurchManagementAccessGate` como `isChurchAdmin`. |
| Gestor da Igreja (`church_manager`) | Gerencia operacao, roles, equipes, QR, configuracoes, indicadores e submissoes nao sensiveis. | Role operacional ativa e escopada. |
| Pastor (`pastor`) | Acompanha cuidado pastoral e submissoes sensiveis. | Role operacional ativa; acesso a cuidado sensivel por RLS. |
| Lider (`leader`) | Coordena equipes, designacoes e escopos recebidos. | Role ativa; acesso depende do escopo. |
| Voluntario (`volunteer`) | Recebe designacoes e acompanha propria atividade. | Nao acessa `/gestao-igreja` por padrao. |
| Membro autenticado | Envia QR, acompanha status, aceita/recusa designacoes proprias. | Area `/minha-igreja`. |
| Visitante nao autenticado | Escaneia QR e inicia formulario. | UI atual solicita login antes de salvar; banco ainda permite desenho publico/anonimo. |

## 6. Fluxo real consolidado

### 6.1 Fluxo A - Aprovacao inicial para gerir uma igreja

Fluxo observado:

1. Usuario acessa uma pagina publica da igreja ou tela de contratacao/gestao:
   - `/social/igreja/[churchSlug]/gerir`
   - `/igreja/[churchSlug]/gerir`
   - CTA na pagina publica da igreja.
2. Usuario precisa estar autenticado.
3. Usuario informa/assume responsabilidade pela igreja.
4. Sistema cria ou atualiza `church_role_requests` com:
   - `church_id`;
   - `user_id`;
   - `requested_role` igual a `pastor` ou `admin`;
   - `status = pending`;
   - `requested_at`.
5. Admin da plataforma acessa `/admin`.
6. Admin ve solicitacoes pendentes.
7. Admin aprova ou recusa.
8. Se recusada:
   - `church_role_requests.status = rejected`;
   - `reviewed_by` e `reviewed_at` sao preenchidos;
   - usuario nao recebe acesso de gestao por essa solicitacao.
9. Se aprovada:
   - `church_role_requests.status = approved`;
   - `reviewed_by` e `reviewed_at` sao preenchidos;
   - usuario e adicionado a `churches.admins`;
   - `verification_status` pode mudar de `unclaimed` para `claimed`;
   - vinculo em `memberships` e criado/atualizado;
   - `userProfile.churchData` e atualizado com igreja, nome e slug.
10. Ao acessar `/gestao-igreja`, o gate busca igreja ativa, roles e admins.
11. Usuario passa no gate se for:
   - admin da plataforma;
   - admin da igreja em `churches.admins`;
   - usuario com role ativa permitida.

Fluxo ASCII:

```text
Usuario autenticado
  -> Solicita gerir igreja
  -> church_role_requests(status=pending)
  -> Admin plataforma revisa em /admin
     -> Rejeita: status=rejected, sem acesso
     -> Aprova: status=approved
          -> adiciona user em churches.admins
          -> upsert membership
          -> atualiza userProfile.churchData
          -> usuario passa no gate como church admin
```

Observacao funcional:

- Este e o unico fluxo de aprovacao formal confirmado para entrada inicial na gestao.
- Ele nao substitui a tabela de roles operacionais. Ele libera acesso por caminho legado/admin da igreja.

### 6.2 Fluxo B - Concessao de permissoes operacionais

Fluxo observado:

1. Usuario autorizado acessa `/gestao-igreja/permissoes`.
2. A tela lista roles reais da igreja por `church_member_roles`.
3. Para conceder papel, usuario vai para `/gestao-igreja/permissoes/nova`.
4. Informam-se:
   - ID do usuario;
   - role operacional;
   - escopo;
   - ID do escopo, quando aplicavel.
5. Service executa `grantRole`.
6. O registro e criado/atualizado por `upsert`.
7. Usuario que recebeu papel e notificado com `role_granted`.
8. Para revogar, a permissao e atualizada para `status = revoked` e recebe `revoked_at`.

Fluxo ASCII:

```text
Gestor autorizado
  -> /gestao-igreja/permissoes/nova
  -> escolhe usuario, role e escopo
  -> church_member_roles upsert
  -> notificacao role_granted
  -> usuario passa a ter permissoes dentro do escopo
```

Observacao funcional:

- Nao ha workflow de aprovacao multi-etapa para conceder role operacional.
- A seguranca depende de quem pode executar a concessao e das policies de RLS.

### 6.3 Fluxo C - Equipes e designacoes

Fluxo observado:

1. Usuario autorizado acessa `/gestao-igreja/equipes`.
2. Cria equipe em `/gestao-igreja/equipes/nova`.
3. Equipe recebe:
   - nome;
   - area;
   - descricao;
   - capacidade;
   - status;
   - criador.
4. Usuario autorizado acessa `/gestao-igreja/designacoes`.
5. Cria designacao em `/gestao-igreja/designacoes/nova`.
6. Designacao recebe:
   - titulo;
   - descricao;
   - escopo;
   - data;
   - voluntario opcional;
   - lider;
   - feedback publico ao membro.
7. Se houver pessoa designada, ela recebe notificacao e ve em `/minha-igreja/designacoes`.
8. Pessoa designada aceita ou recusa.
9. Aceite/recusa atualiza status e timestamp.
10. Lider/criador recebe notificacao.
11. Aceite tambem pode gerar reconhecimento/insignia.

Fluxo ASCII:

```text
Gestao da Igreja
  -> cria equipe (capacity existe na equipe)
  -> cria designacao (hoje sem campo de vagas)
  -> opcionalmente vincula equipe/escopo/voluntario
  -> notifica membro ou lideranca
  -> membro ve em Minha Igreja
  -> aceita ou recusa
  -> lideranca e notificada
```

Ponto critico:

- O requisito de produto diz que designacao deve ter quantidade de vagas.
- O estado atual so guarda capacidade na equipe, nao na designacao.
- A regra normativa deste documento define vagas como obrigatorias na designacao.

### 6.4 Fluxo D - QR Code, formulario, Inbox e Minha Igreja

Fluxo observado:

1. Usuario autorizado acessa `/gestao-igreja/qrcodes`.
2. Cria QR/formulario em `/gestao-igreja/qrcodes/novo`.
3. Escolhe tipo:
   - `prayer`;
   - `volunteer`;
   - `visitor`;
   - `pastor_care`;
   - `group`;
   - `custom`.
4. Sistema aplica campos padrao conforme tipo.
5. Sistema gera token unico.
6. Sistema salva `church_qr_forms`.
7. Sistema exibe URL publica `/qr/[token]`.
8. UI gera imagem do QR a partir da URL publica.
9. Igreja copia, baixa ou imprime o QR.
10. Pessoa escaneia QR.
11. Pagina `/qr/[token]` busca formulario ativo pelo token.
12. Se encontrado:
    - scan e contado uma vez por sessao de navegador;
    - formulario e exibido com texto de privacidade;
    - se usuario nao esta logado, UI guarda payload em sessionStorage e abre login;
    - apos login, payload e enviado.
13. Service cria `church_form_submissions` com:
    - igreja;
    - formulario;
    - tipo;
    - usuario submitter, quando identificado;
    - nome/contato extraidos do payload;
    - payload completo;
    - status interno `received`;
    - status publico `Recebido pela igreja`;
    - feedback publico com texto de confirmacao;
    - sensibilidade calculada pelo tipo;
    - proxima acao calculada pelo tipo.
14. Service incrementa contador de envio.
15. Service gera notificacao:
    - `prayer` e `pastor_care`: pastor, urgente;
    - demais tipos: lideranca, acao.
16. Submissao aparece em `/gestao-igreja/inbox`.
17. Responsavel autorizado atribui pessoa, prioridade e status.
18. Atualizacoes relevantes notificam o membro identificado.
19. Membro ve retorno em `/minha-igreja/acompanhamento`.

Fluxo ASCII:

```text
Gestor cria QR
  -> token unico
  -> URL /qr/[token]
  -> igreja imprime/compartilha
  -> pessoa escaneia
  -> formulario ativo e carregado
  -> usuario loga para salvar na UI atual
  -> submissao criada em church_form_submissions
  -> contador de envio
  -> notificacao por tipo
  -> Inbox da Gestao
  -> atribuicao/status/prioridade
  -> retorno seguro em Minha Igreja
```

## 7. Requisitos funcionais

### RF-AC - Acesso e entrada no modulo

| ID | Requisito |
| --- | --- |
| RF-AC-001 | O modulo Gestao da Igreja deve ser acessado por rota propria `/gestao-igreja`. |
| RF-AC-002 | O modulo deve exigir usuario autenticado. |
| RF-AC-003 | O modulo deve exigir igreja ativa vinculada ao usuario ou responsabilidade aprovada. |
| RF-AC-004 | O gate deve permitir admin da plataforma, admin da igreja legado e usuarios com role operacional ativa permitida. |
| RF-AC-005 | Usuario sem acesso deve ser redirecionado para fluxo de solicitacao/gestao publica da igreja. |
| RF-AC-006 | O modulo deve diferenciar plano comercial de papel operacional da igreja. |
| RF-AC-007 | Um usuario pode solicitar responsabilidade por igreja a partir da pagina publica/contratacao. |
| RF-AC-008 | A aprovacao inicial deve ser feita por admin da plataforma. |

### RF-PERM - Permissoes operacionais

| ID | Requisito |
| --- | --- |
| RF-PERM-001 | O sistema deve listar roles operacionais por igreja. |
| RF-PERM-002 | O sistema deve permitir conceder role operacional a um usuario. |
| RF-PERM-003 | A concessao de role deve exigir escopo. |
| RF-PERM-004 | O sistema deve permitir revogar role sem apagar historico basico. |
| RF-PERM-005 | A role concedida deve gerar notificacao para o usuario quando possivel. |
| RF-PERM-006 | O sistema deve permitir multiplas roles para o mesmo usuario em uma igreja, desde que role/escopo sejam distintos. |
| RF-PERM-007 | O sistema deve impedir que uma designacao conceda permissao sensivel automaticamente. |

### RF-EQ - Equipes

| ID | Requisito |
| --- | --- |
| RF-EQ-001 | A igreja deve poder criar varias equipes. |
| RF-EQ-002 | Uma equipe deve pertencer a uma unica igreja. |
| RF-EQ-003 | Uma equipe deve possuir nome, area, descricao opcional, status e capacidade. |
| RF-EQ-004 | Uma equipe pode possuir lider vinculado. |
| RF-EQ-005 | Uma equipe deve poder ser pausada ou arquivada. |
| RF-EQ-006 | Uma equipe deve poder ser usada como base para designacoes. |
| RF-EQ-007 | A equipe nao deve conceder permissao sensivel automaticamente. |

### RF-DES - Designacoes

| ID | Requisito |
| --- | --- |
| RF-DES-001 | A igreja deve poder criar varias designacoes. |
| RF-DES-002 | Uma designacao pode estar vinculada a uma equipe. |
| RF-DES-003 | Uma designacao deve ter titulo, descricao, escopo, status e feedback publico. |
| RF-DES-004 | Uma designacao deve ter quantidade de vagas obrigatoria. |
| RF-DES-005 | Uma designacao deve permitir convite/atribuicao de uma ou mais pessoas ate o limite de vagas. |
| RF-DES-006 | Toda pessoa designada deve poder aceitar ou recusar formalmente. |
| RF-DES-007 | Aceite/recusa deve notificar a lideranca responsavel. |
| RF-DES-008 | Designacoes aceitas devem aparecer em Minha Igreja. |
| RF-DES-009 | Designacoes recusadas, expiradas ou removidas nao devem ocupar vaga ativa. |
| RF-DES-010 | Designacoes importadas de outro modulo devem manter origem por `source_type` e `source_id`. |

### RF-QR - QR Codes e formularios

| ID | Requisito |
| --- | --- |
| RF-QR-001 | A igreja deve poder criar QR Codes/formularios. |
| RF-QR-002 | Cada QR deve pertencer a uma unica igreja. |
| RF-QR-003 | Cada QR deve ter token unico. |
| RF-QR-004 | Cada QR deve gerar URL publica no padrao `/qr/[token]`. |
| RF-QR-005 | Cada QR deve ter tipo funcional. |
| RF-QR-006 | Cada QR deve ter texto de privacidade visivel ao usuario final. |
| RF-QR-007 | Cada QR deve ter mensagem de confirmacao/retorno publico. |
| RF-QR-008 | Cada QR deve ter destino interno definido. |
| RF-QR-009 | Cada QR deve ter validade configuravel. |
| RF-QR-010 | QR pausado, expirado ou arquivado nao deve aceitar novas submissoes. |
| RF-QR-011 | A abertura do QR deve contar scan sem bloquear o formulario se a metrica falhar. |
| RF-QR-012 | O envio do formulario deve gerar submissao na Inbox. |
| RF-QR-013 | O envio deve incrementar contador de submissoes sem bloquear o fluxo se a metrica falhar. |
| RF-QR-014 | O envio deve gerar notificacao para o papel correto conforme tipo. |

### RF-INB - Inbox

| ID | Requisito |
| --- | --- |
| RF-INB-001 | A Inbox deve listar submissoes da igreja. |
| RF-INB-002 | A Inbox deve filtrar por status e prioridade. |
| RF-INB-003 | A submissao deve ter status interno e status publico. |
| RF-INB-004 | A submissao deve permitir atribuir responsavel. |
| RF-INB-005 | A submissao deve permitir alterar prioridade. |
| RF-INB-006 | A submissao deve permitir atualizar proxima acao. |
| RF-INB-007 | Atualizacoes relevantes devem notificar o membro identificado. |
| RF-INB-008 | Pedidos sensiveis devem ter acesso restrito a pastor ou responsavel atribuido. |

### RF-MI - Minha Igreja

| ID | Requisito |
| --- | --- |
| RF-MI-001 | O membro deve ter area propria em `/minha-igreja`. |
| RF-MI-002 | O membro deve ver apenas seus proprios pedidos, designacoes e conquistas. |
| RF-MI-003 | O membro nao deve ver notas internas, dados de outros membros ou bastidores administrativos. |
| RF-MI-004 | O membro deve conseguir aceitar ou recusar designacoes pendentes. |
| RF-MI-005 | O membro deve ver status publico de submissoes feitas por ele. |

### RF-NOT - Notificacoes

| ID | Requisito |
| --- | --- |
| RF-NOT-001 | Eventos operacionais devem gerar notificacao quando houver acao relevante. |
| RF-NOT-002 | Notificacao deve ter severidade: `info`, `action` ou `urgent`. |
| RF-NOT-003 | Notificacao deve ter canal: `dashboard`, `member` ou `both`. |
| RF-NOT-004 | Notificacoes repetidas devem usar `dedupe_key`. |
| RF-NOT-005 | Usuario deve poder marcar notificacao como lida. |
| RF-NOT-006 | Usuario deve poder dispensar notificacao quando aplicavel. |
| RF-NOT-007 | Falha ao criar notificacao nao deve bloquear o fluxo principal. |

## 8. Regras de negocio

### RN-AC - Acesso ao modulo

| ID | Regra |
| --- | --- |
| RN-AC-001 | Visitantes nao autenticados nao acessam `/gestao-igreja`. |
| RN-AC-002 | O usuario precisa ter uma igreja ativa para operar a Gestao da Igreja. |
| RN-AC-003 | Admin da plataforma sempre pode acessar o modulo. |
| RN-AC-004 | Usuario presente em `churches.admins` pode acessar como church admin legado. |
| RN-AC-005 | Usuario comum acessa a Gestao somente se possuir role operacional ativa permitida. |
| RN-AC-006 | Roles permitidas por padrao no gate: `church_manager`, `pastor`, `leader`. |
| RN-AC-007 | `volunteer` nao acessa a gestao administrativa por padrao. |
| RN-AC-008 | Plano comercial nao deve ser confundido com role operacional. |
| RN-AC-009 | `subscription_tier = admin` e excecao de plataforma, nao papel eclesiastico. |
| RN-AC-010 | Se o usuario nao tiver igreja ativa, o sistema deve tentar localizar responsabilidade aprovada antes de negar acesso. |
| RN-AC-011 | Se houver responsabilidade aprovada, o perfil pode ser sincronizado com a igreja aprovada. |
| RN-AC-012 | Usuario sem acesso deve ser direcionado para solicitar gestao ou para Minha Igreja, conforme contexto. |

### RN-APR - Aprovacao de responsabilidade pela igreja

| ID | Regra |
| --- | --- |
| RN-APR-001 | A aprovacao inicial de gestao deve passar por admin da plataforma. |
| RN-APR-002 | Um usuario pode criar solicitacao de responsabilidade apenas para si mesmo. |
| RN-APR-003 | Uma solicitacao deve ser unica por igreja, usuario e papel solicitado. |
| RN-APR-004 | Estados validos da solicitacao: `pending`, `approved`, `rejected`. |
| RN-APR-005 | Apenas admin da plataforma pode aprovar ou rejeitar solicitacoes. |
| RN-APR-006 | Solicitacao aprovada deve preencher `reviewed_by` e `reviewed_at`. |
| RN-APR-007 | Solicitacao rejeitada nao deve conceder nenhum acesso operacional. |
| RN-APR-008 | Ao aprovar, usuario deve ser adicionado a `churches.admins`. |
| RN-APR-009 | Ao aprovar, igreja `unclaimed` pode passar para `claimed`. |
| RN-APR-010 | Ao aprovar, vinculo em `memberships` deve ser criado/atualizado. |
| RN-APR-011 | Ao aprovar, perfil do usuario deve receber `churchData`. |
| RN-APR-012 | A aprovacao inicial nao substitui role operacional escopada. |
| RN-APR-013 | O campo `requested_role` atual aceita `pastor` ou `admin`; o papel operacional `church_manager` nao aparece diretamente nesse fluxo. |
| RN-APR-014 | Deve existir mapeamento funcional claro entre `requested_role = admin` e o papel "Gestor da Igreja". |

### RN-PERM - Roles operacionais

| ID | Regra |
| --- | --- |
| RN-PERM-001 | Roles operacionais validas: `church_manager`, `pastor`, `leader`, `volunteer`. |
| RN-PERM-002 | Escopos validos: `church`, `team`, `group`, `service`, `event`. |
| RN-PERM-003 | Status validos de role: `active`, `paused`, `revoked`. |
| RN-PERM-004 | Um usuario pode ter mais de uma role na mesma igreja. |
| RN-PERM-005 | A combinacao igreja + usuario + role + escopo + ID do escopo deve ser unica. |
| RN-PERM-006 | `church_manager` pode administrar operacao da igreja. |
| RN-PERM-007 | `pastor` pode acessar cuidado pastoral e submissoes sensiveis. |
| RN-PERM-008 | `leader` deve atuar apenas dentro do escopo recebido. |
| RN-PERM-009 | `volunteer` deve acessar apenas suas proprias designacoes, equipes e retornos. |
| RN-PERM-010 | Gestor da Igreja nao recebe acesso pastoral sensivel automaticamente. |
| RN-PERM-011 | Pastor nao vira gestor administrativo automaticamente. |
| RN-PERM-012 | Lider nao deve ver dados fora do escopo. |
| RN-PERM-013 | Voluntario nao deve ver dados administrativos de outros membros. |
| RN-PERM-014 | Revogar role deve marcar `status = revoked` e `revoked_at`, nao apagar registro. |
| RN-PERM-015 | Concessao de role deve gerar notificacao `role_granted` para o usuario. |
| RN-PERM-016 | Equipe, designacao ou aceite de designacao nao concedem permissao sensivel automaticamente. |
| RN-PERM-017 | Permissao real deve ser derivada de role ativa e escopo, nao de texto de UI. |

### RN-EQ - Equipes

| ID | Regra |
| --- | --- |
| RN-EQ-001 | Igreja pode criar varias equipes. |
| RN-EQ-002 | Equipe pertence a uma unica igreja. |
| RN-EQ-003 | Equipe deve possuir nome e area. |
| RN-EQ-004 | Equipe pode possuir descricao. |
| RN-EQ-005 | Equipe pode possuir lider. |
| RN-EQ-006 | Equipe pode possuir capacidade (`capacity`). |
| RN-EQ-007 | Status validos de equipe: `active`, `paused`, `archived`. |
| RN-EQ-008 | Slug da equipe deve ser unico dentro da igreja. |
| RN-EQ-009 | Equipe ativa pode ser usada para organizar designacoes. |
| RN-EQ-010 | Equipe pausada nao deve receber novas designacoes, salvo decisao explicita da gestao. |
| RN-EQ-011 | Equipe arquivada deve permanecer historica, mas nao operacional. |
| RN-EQ-012 | Capacidade da equipe representa limite operacional geral da equipe, nao quantidade de vagas de uma designacao especifica. |
| RN-EQ-013 | Equipe nao concede role automaticamente ao lider informado. |
| RN-EQ-014 | Lider so gerencia equipe se tambem possuir role/escopo compativel. |
| RN-EQ-015 | Membros da igreja podem ler equipes quando permitido por RLS, mas nao gerenciar sem role. |

### RN-DES - Designacoes e vagas

| ID | Regra |
| --- | --- |
| RN-DES-001 | Igreja pode criar varias designacoes. |
| RN-DES-002 | Designacao pertence a uma unica igreja. |
| RN-DES-003 | Designacao pode estar vinculada a uma equipe. |
| RN-DES-004 | Designacao pode existir sem equipe quando o escopo for igreja, grupo, culto ou evento. |
| RN-DES-005 | Designacao deve possuir titulo. |
| RN-DES-006 | Designacao deve possuir escopo. |
| RN-DES-007 | Designacao deve possuir status. |
| RN-DES-008 | Designacao deve possuir feedback publico ao membro. |
| RN-DES-009 | Toda designacao deve exigir aceite/recusa formal por padrao. |
| RN-DES-010 | Toda designacao deve possuir quantidade de vagas obrigatoria. |
| RN-DES-011 | Quantidade de vagas deve ser inteiro positivo maior que zero. |
| RN-DES-012 | Vagas da designacao nao podem ser substituidas pela capacidade da equipe. |
| RN-DES-013 | Vagas pendentes podem ficar reservadas enquanto o convite aguarda aceite, para evitar overbooking. |
| RN-DES-014 | Vaga aceita deve contar como ocupada. |
| RN-DES-015 | Vaga recusada deve voltar a ficar disponivel. |
| RN-DES-016 | Vaga expirada deve voltar a ficar disponivel, salvo regra de auditoria contraria. |
| RN-DES-017 | Vaga removida nao deve ficar ocupada. |
| RN-DES-018 | Nao deve ser possivel convidar mais pessoas do que o total de vagas disponiveis, considerando vagas reservadas. |
| RN-DES-019 | Status validos: `draft`, `pending`, `accepted`, `declined`, `paused`, `expired`, `removed`. |
| RN-DES-020 | Designacao em `draft` nao deve notificar membro final. |
| RN-DES-021 | Designacao em `pending` aguarda aceite/recusa. |
| RN-DES-022 | Designacao em `accepted` indica compromisso aceito pelo membro. |
| RN-DES-023 | Designacao em `declined` indica recusa formal pelo membro. |
| RN-DES-024 | Designacao em `paused` fica temporariamente suspensa. |
| RN-DES-025 | Designacao em `expired` passou do prazo sem conclusao/aceite. |
| RN-DES-026 | Designacao em `removed` foi removida operacionalmente, mantendo historico. |
| RN-DES-027 | Apenas o proprio assignee pode aceitar ou recusar sua designacao. |
| RN-DES-028 | Aceite deve preencher `accepted_at`. |
| RN-DES-029 | Recusa deve preencher `declined_at`. |
| RN-DES-030 | Aceite deve notificar lider/criador ou audiencia de lideranca. |
| RN-DES-031 | Recusa deve notificar lider/criador ou audiencia de lideranca. |
| RN-DES-032 | Aceitar designacao nao concede role operacional. |
| RN-DES-033 | Designacao deve aparecer em Minha Igreja apenas para o membro designado. |
| RN-DES-034 | Designacao pode ter origem externa, como escala do Culto+, por `source_type` e `source_id`. |
| RN-DES-035 | A combinacao igreja + origem + ID de origem deve impedir duplicidade de importacao. |
| RN-DES-036 | Conversao de interessado em voluntariado para designacao ainda precisa de regra explicita. |

### RN-QR - QR Codes e formularios

| ID | Regra |
| --- | --- |
| RN-QR-001 | QR/formulario pertence a uma unica igreja. |
| RN-QR-002 | Apenas usuario com permissao operacional compativel deve criar/editar QR. |
| RN-QR-003 | RLS atual permite gerencia de QR por `church_manager`. |
| RN-QR-004 | Tipos validos: `prayer`, `volunteer`, `visitor`, `pastor_care`, `group`, `custom`. |
| RN-QR-005 | Token do QR deve ser unico. |
| RN-QR-006 | URL publica deve usar `/qr/[token]`. |
| RN-QR-007 | Status validos de QR: `draft`, `active`, `paused`, `expired`, `archived`. |
| RN-QR-008 | Apenas QR `active` e nao expirado deve abrir formulario publico. |
| RN-QR-009 | QR pausado nao deve aceitar novos envios. |
| RN-QR-010 | QR expirado nao deve aceitar novos envios. |
| RN-QR-011 | QR arquivado nao deve aceitar novos envios. |
| RN-QR-012 | Cada QR deve ter destino interno. |
| RN-QR-013 | Cada QR deve exibir texto de privacidade. |
| RN-QR-014 | Cada QR deve exibir ou usar texto de confirmacao ao final do envio. |
| RN-QR-015 | Validade padrao observada: 30 dias em configuracoes da gestao. |
| RN-QR-016 | A abertura do formulario deve incrementar `scans_count` quando possivel. |
| RN-QR-017 | Contagem de scan nao deve bloquear a abertura do formulario. |
| RN-QR-018 | O mesmo navegador/sessao nao deve contar multiplos scans do mesmo formulario na mesma sessao. |
| RN-QR-019 | Submissao deve incrementar `submissions_count` quando possivel. |
| RN-QR-020 | Falha no contador de submissao nao deve desfazer a submissao salva. |
| RN-QR-021 | `prayer` e `pastor_care` devem ser classificados como sensiveis. |
| RN-QR-022 | `prayer` e `pastor_care` devem ser roteados para audiencia `pastor`. |
| RN-QR-023 | `prayer` e `pastor_care` devem gerar severidade `urgent`. |
| RN-QR-024 | `volunteer` deve ser roteado para audiencia `leader`. |
| RN-QR-025 | `volunteer` deve ter proxima acao "Encaminhar para lideranca". |
| RN-QR-026 | `visitor`, `group` e `custom` devem ser roteados para lideranca por padrao. |
| RN-QR-027 | Submissao deve salvar payload completo enviado pelo formulario. |
| RN-QR-028 | Nome e contato devem ser extraidos de campos em portugues ou ingles quando existirem. |
| RN-QR-029 | UI atual exige login antes de salvar envio real. |
| RN-QR-030 | Modelo atual possui `allow_anonymous`; a regra final precisa decidir se envio anonimo e permitido ou proibido. |
| RN-QR-031 | Se login for obrigatorio, `allow_anonymous` deve ser removido, ignorado ou usado apenas em fase futura. |
| RN-QR-032 | Se anonimo for permitido, Minha Igreja nao deve prometer acompanhamento individual sem identificacao. |
| RN-QR-033 | Ao enviar QR autenticado sem igreja vinculada, o sistema atual pode preencher `userProfile.churchData` com a igreja do formulario; essa regra precisa validacao de produto para nao transformar visitante em membro sem consentimento. |

### RN-INB - Submissoes e Inbox

| ID | Regra |
| --- | --- |
| RN-INB-001 | Toda submissao deve pertencer a uma igreja. |
| RN-INB-002 | Toda submissao deve ter tipo de formulario. |
| RN-INB-003 | Status internos validos: `received`, `assigned`, `in_progress`, `waiting_member`, `answered`, `closed`, `archived`. |
| RN-INB-004 | Prioridades validas: `low`, `normal`, `high`, `urgent`. |
| RN-INB-005 | Submissao nova deve iniciar com status interno `received`. |
| RN-INB-006 | Submissao nova deve iniciar com status publico `Recebido pela igreja`. |
| RN-INB-007 | Submissao deve ter `next_action` inicial conforme tipo do QR. |
| RN-INB-008 | Atribuir responsavel em submissao `received` muda status para `assigned`. |
| RN-INB-009 | Atribuir responsavel deve mudar status publico para `Encaminhado para responsavel`. |
| RN-INB-010 | Remover responsavel deve preservar status publico atual. |
| RN-INB-011 | Atualizar status para `waiting_member` deve refletir publicamente "Aguardando sua resposta". |
| RN-INB-012 | Atualizar status de `waiting_member` pelo toggle atual fecha o item como `closed`. |
| RN-INB-013 | Fechar item deve preencher `closed_at`. |
| RN-INB-014 | Submissao sensivel deve ser lida por pastor, responsavel atribuido ou proprio submitter. |
| RN-INB-015 | Submissao nao sensivel pode ser lida por gestor operacional autorizado. |
| RN-INB-016 | Responsavel atribuido pode atualizar a submissao. |
| RN-INB-017 | Atualizacao de submissao identificada deve notificar o submitter. |
| RN-INB-018 | Status publico e feedback publico devem ser linguagem segura para o membro. |
| RN-INB-019 | Resumo interno e bastidores nao devem aparecer em Minha Igreja. |

### RN-MI - Minha Igreja

| ID | Regra |
| --- | --- |
| RN-MI-001 | Minha Igreja deve mostrar apenas dados do proprio usuario. |
| RN-MI-002 | Submissoes devem ser filtradas por `submitter_user_id`. |
| RN-MI-003 | Designacoes devem ser filtradas por `assignee_user_id`. |
| RN-MI-004 | Insignias devem ser filtradas por usuario. |
| RN-MI-005 | Membro deve ver status publico, nao status tecnico completo quando houver risco de exposicao. |
| RN-MI-006 | Membro deve poder aceitar ou recusar designacoes pendentes. |
| RN-MI-007 | Membro nao deve ver dados administrativos de outros membros. |
| RN-MI-008 | Membro nao deve ver notas pastorais internas. |
| RN-MI-009 | Membro nao deve ver fila completa da Inbox. |
| RN-MI-010 | Membro deve receber retorno quando uma submissao propria mudar de status. |

### RN-NOT - Notificacoes e eventos

| ID | Regra |
| --- | --- |
| RN-NOT-001 | Concessao de role deve gerar evento/notificacao `role_granted`. |
| RN-NOT-002 | Criacao de equipe deve gerar `team_created`. |
| RN-NOT-003 | Criacao de designacao deve gerar `assignment_created`. |
| RN-NOT-004 | Aceite deve gerar `assignment_accepted`. |
| RN-NOT-005 | Recusa deve gerar `assignment_declined`. |
| RN-NOT-006 | Criacao de QR deve gerar `qr_form_created`. |
| RN-NOT-007 | Nova submissao deve gerar `submission_created`. |
| RN-NOT-008 | Atualizacao de submissao deve gerar `submission_status_updated` para o membro identificado. |
| RN-NOT-009 | Conquista/insignia deve gerar `volunteer_badge_awarded` ou `badge_awarded`. |
| RN-NOT-010 | Eventos repetidos devem usar `dedupe_key`. |
| RN-NOT-011 | Notificacao deve poder ser marcada como lida. |
| RN-NOT-012 | Notificacao deve poder ser dispensada. |
| RN-NOT-013 | Criacao de notificacao nao deve bloquear fluxo principal. |
| RN-NOT-014 | Notificacao deve apontar para rota acionavel quando houver acao esperada. |

### RN-SEG - Privacidade, RLS e seguranca

| ID | Regra |
| --- | --- |
| RN-SEG-001 | Todas as tabelas publicas do modulo devem ter RLS ativo. |
| RN-SEG-002 | Role operacional deve ser validada por igreja e escopo. |
| RN-SEG-003 | `church_manager` gerencia operacao, mas nao cuidado sensivel automaticamente. |
| RN-SEG-004 | `pastor` acessa cuidado sensivel. |
| RN-SEG-005 | `leader` acessa apenas escopo atribuido. |
| RN-SEG-006 | `volunteer` acessa apenas dados proprios. |
| RN-SEG-007 | Submitter pode ler suas proprias submissoes. |
| RN-SEG-008 | Submissao sensivel nao deve ser lida por gestor administrativo sem papel pastoral ou atribuicao. |
| RN-SEG-009 | QR ativo pode ser lido publicamente por token, mas submissao precisa respeitar regra final de login/anonimato. |
| RN-SEG-010 | Funcoes de contador e notificacao devem evitar expor dados sensiveis. |
| RN-SEG-011 | Alteracoes sensiveis de permissao devem deixar trilha minima: quem concedeu, quando concedeu, quando revogou. |

## 9. Matriz funcional de permissoes

| Acao | Plataforma admin | Church admin legado | Gestor (`church_manager`) | Pastor | Lider | Voluntario/membro |
| --- | --- | --- | --- | --- | --- | --- |
| Acessar `/gestao-igreja` | Sim | Sim | Sim | Sim | Sim | Nao |
| Aprovar solicitacao inicial de gestao | Sim | Nao | Nao | Nao | Nao | Nao |
| Solicitar responsabilidade por igreja | Sim | Sim | Sim | Sim | Sim | Sim, se autenticado |
| Conceder/revogar role operacional | Via admin/global | Parcial/legado | Sim | Nao por padrao | Nao por padrao | Nao |
| Ver roles da igreja | Sim | Sim | Sim | Sim | Parcial/escopo | Proprias roles |
| Criar equipe | Sim | Sim | Sim | Nao por RLS atual | Sim se escopo permitir | Nao |
| Editar equipe | Sim | Sim | Sim | Nao por RLS atual | Sim se escopo permitir | Nao |
| Criar designacao | Sim | Sim | Sim | Nao por RLS atual | Sim se escopo permitir | Nao |
| Aceitar/recusar propria designacao | Se for assignee | Se for assignee | Se for assignee | Se for assignee | Se for assignee | Sim |
| Criar QR/formulario | Sim | Sim | Sim por RLS atual | Nao por RLS atual | Nao por RLS atual | Nao |
| Abrir QR publico | Sim | Sim | Sim | Sim | Sim | Sim |
| Enviar QR | Sim, se UI/login permitir | Sim | Sim | Sim | Sim | Sim autenticado na UI atual |
| Ver Inbox nao sensivel | Sim | Sim | Sim | Sim | Se atribuido/escopo | Proprio item |
| Ver Inbox sensivel | Sim | Nao por padrao | Nao por padrao | Sim | Se atribuido | Proprio item |
| Atualizar submissao sensivel | Sim | Nao por padrao | Nao por padrao | Sim | Se atribuido | Nao |
| Ver Minha Igreja | Sim | Sim | Sim | Sim | Sim | Sim, dados proprios |
| Ver insignias de outro usuario | Sim | Sim | Sim | Sim | Sim se autorizado | Nao |

Observacao: a matriz mistura o alvo funcional com o estado RLS observado. Onde aparece "por RLS atual", a decisao final de produto pode ampliar a permissao se houver role/escopo especifico.

## 10. Fluxos de aprovacao: o que existe e o que falta

### Existe

| Fluxo | Existe? | Como funciona |
| --- | --- | --- |
| Aprovacao inicial para gerir igreja | Sim | `church_role_requests` pendente, revisado por admin da plataforma. |
| Aceite/recusa de designacao pelo membro | Sim | `respondToAssignment`, somente assignee aceita/recusa. |
| Atribuicao de responsavel na Inbox | Sim | Atualiza `assigned_to`, prioridade, status e status publico. |

### Nao existe ou esta incompleto

| Fluxo | Estado | Decisao necessaria |
| --- | --- | --- |
| Aprovacao multi-etapa para conceder role operacional | Nao observado | Definir se `church_manager` pode conceder diretamente ou se roles sensiveis exigem aprovacao. |
| Aprovacao de voluntariado vindo do QR | Parcial | Hoje vira submissao na Inbox; falta conversao formal para equipe, designacao ou role. |
| Quantidade de vagas na designacao | Nao modelado | Definir campo e regra de preenchimento/ocupacao de vagas. |
| Convite de varias pessoas para a mesma designacao | Incompleto | Definir se designacao e atividade pai + convites filhos, ou se cada registro representa uma vaga individual. |
| QR anonimo vs login obrigatorio | Divergente | Decidir regra unica: login obrigatorio ou anonimo permitido. |
| `requested_role=admin` vs `church_manager` | Desalinhado | Definir mapeamento oficial entre solicitacao inicial e role operacional. |
| Mana em aceite de designacao | Divergente | Roadmap recomenda nao contar XP bruto; service atual cria `mana_events` com XP. |

## 11. Regras especificas para "designacao com vagas"

O requisito resumido do produto diz: "designacao deve ter a quantidade de vagas".

Regra normativa recomendada:

1. Designacao deve representar uma oportunidade/atividade de servico.
2. Designacao deve possuir `vagas_totais`.
3. Cada convite/resposta deve ocupar ou liberar vaga conforme status.
4. Convite pendente deve reservar vaga para evitar excesso de convidados.
5. Convite recusado, expirado ou removido libera vaga.
6. Convite aceito ocupa vaga.
7. Nao deve existir aceite alem do total de vagas.
8. Equipe pode ter capacidade geral, mas isso nao substitui vagas da designacao.

Modelo funcional recomendado:

```text
Equipe
  -> possui capacidade geral
  -> pode ter varias Designacoes

Designacao
  -> possui vagas_totais
  -> possui escopo/data/feedback
  -> possui varios convites ou atribuicoes

Convite/Atribuicao
  -> pertence a uma designacao
  -> pertence a um usuario
  -> status: pending/accepted/declined/expired/removed
```

Se o produto quiser manter a tabela atual como esta:

- cada registro de `church_assignments` representa uma vaga individual;
- a "designacao pai" ainda precisara existir em outra entidade ou agrupamento por `source_id`, `team_id`, titulo/data/escopo;
- caso contrario nao ha como controlar "3 vagas para portaria" sem criar 3 registros soltos e descentralizados.

## 12. Fluxo real do QR Code em detalhe

### 12.1 Criacao

1. Usuario autorizado acessa `/gestao-igreja/qrcodes/novo`.
2. Informa titulo, tipo, descricao e destino.
3. Sistema usa campos padrao do tipo:
   - Pedido de oracao: nome, contato, pedido.
   - Voluntariado: nome, contato, cargo de interesse, disponibilidade.
   - Visitante: nome, contato, primeira visita.
   - Cuidado pastoral: nome, contato, descricao do cuidado.
   - Grupo: nome, contato, preferencia de grupo.
   - Personalizado: nome, contato, mensagem.
4. Sistema aplica configuracoes da igreja:
   - validade padrao;
   - texto de privacidade;
   - texto de confirmacao.
5. Sistema salva QR ativo.
6. Sistema notifica dashboard com `qr_form_created`.

### 12.2 Distribuicao

1. Tela de QR lista formularios.
2. Usuario seleciona QR.
3. Sistema monta URL publica.
4. UI gera imagem de QR.
5. Usuario pode:
   - copiar link;
   - abrir link;
   - baixar imagem;
   - imprimir cartaz.

### 12.3 Abertura publica

1. Pessoa abre `/qr/[token]`.
2. Sistema busca formulario ativo pelo token.
3. Se nao existir, estiver pausado ou expirado, mostra "Formulario indisponivel".
4. Se existir, conta scan de forma nao bloqueante.
5. Formulario exibe titulo, descricao, campos e privacidade.

### 12.4 Envio

1. Pessoa preenche formulario.
2. UI atual exige login para salvar.
3. Se nao logado:
   - payload e guardado em sessionStorage;
   - modal/login e aberto;
   - depois do login o envio e retomado.
4. Envio cria submissao na Inbox.
5. Sistema extrai nome/contato.
6. Sistema classifica sensibilidade e roteamento.
7. Sistema incrementa contador de envio.
8. Sistema dispara notificacao por RPC ou fallback.
9. Usuario ve confirmacao e CTA para acompanhamento.

### 12.5 Tratamento na Inbox

1. Lideranca/pastor/gestor acessa `/gestao-igreja/inbox`.
2. Filtra por status/prioridade.
3. Abre item.
4. Atribui responsavel.
5. Ajusta prioridade.
6. Atualiza status.
7. Sistema preserva status publico apropriado.
8. Se submitter e identificado, Minha Igreja e notificada.

### 12.6 Espelho do membro

1. Membro acessa `/minha-igreja/acompanhamento`.
2. Sistema lista submissoes proprias.
3. Membro ve:
   - tipo do pedido;
   - status publico;
   - feedback publico;
   - proxima acao segura.
4. Membro nao ve:
   - responsavel interno, se nao for permitido;
   - resumo interno;
   - notas pastorais;
   - fila geral;
   - dados de outros membros.

## 13. Problemas de centralizacao encontrados

| Problema | Impacto funcional | Recomendacao de produto |
| --- | --- | --- |
| Acesso inicial usa `church_role_requests` e `churches.admins`, enquanto operacao usa `church_member_roles`. | Dois conceitos de permissao convivem. | Definir transicao: aprovado como admin deve gerar `church_manager` ou continuar como admin legado? |
| QR esta em rota publica, Inbox em gestao e retorno em Minha Igreja. | Fluxo parece espalhado. | Documentar QR como "entrada", Inbox como "tratamento", Minha Igreja como "espelho". |
| Designacao nao tem vagas. | Nao atende requisito de capacidade por atividade. | Criar regra funcional de vagas na designacao antes de evoluir UI. |
| Equipe tem capacidade, mas sem membros reais/contadores completos. | Vagas da equipe podem ser confundidas com vagas de designacao. | Manter capacidade da equipe como referencia geral. |
| Voluntariado por QR para na Inbox. | Nao ha conversao final clara. | Definir acao "aprovar interessado" -> criar convite/designacao/role/equipe. |
| QR login obrigatorio vs `allow_anonymous`. | Regra de privacidade fica ambigua. | Escolher uma regra unica para MVP. |
| Criacao de role usa ID manual do usuario. | Operacao dificil e sujeita a erro. | Requisito futuro: busca de usuario por nome/email com validacao. |
| Mana por aceite diverge da decisao consolidada. | Risco pastoral e de abuso. | Alinhar service e regra: insignia sim, XP bruto nao, se essa for a decisao final. |

## 14. Criterios de aceite funcionais

### Acesso

- Dado usuario nao autenticado, quando acessar `/gestao-igreja`, entao deve ser impedido e chamado a entrar.
- Dado usuario autenticado sem igreja ativa e sem responsabilidade aprovada, quando acessar `/gestao-igreja`, entao deve ser enviado ao fluxo de solicitacao/gestao da igreja.
- Dado usuario com responsabilidade aprovada, quando acessar `/gestao-igreja`, entao deve passar pelo gate como admin da igreja.
- Dado usuario com role ativa `church_manager`, `pastor` ou `leader`, quando acessar `/gestao-igreja`, entao deve passar pelo gate conforme escopo.
- Dado usuario apenas `volunteer`, quando acessar `/gestao-igreja`, entao nao deve acessar painel administrativo.

### Permissoes

- Dado gestor autorizado, quando conceder role, entao role deve ser criada/atualizada com igreja, usuario, role e escopo.
- Dado role concedida, quando houver notificacoes disponiveis, entao usuario deve receber notificacao.
- Dado role revogada, quando usuario tentar usar acesso, entao nao deve passar como role ativa.

### Equipes

- Dado gestor autorizado, quando criar equipe, entao equipe deve ser salva com igreja, nome, area, capacidade e status.
- Dado equipe pausada/arquivada, quando criar nova designacao para ela, entao o sistema deve bloquear ou alertar conforme decisao final.

### Designacoes

- Dado gestor/lider autorizado, quando criar designacao, entao deve informar quantidade de vagas.
- Dado designacao com vagas preenchidas, quando tentar convidar novo membro alem do limite, entao sistema deve impedir.
- Dado membro designado, quando aceitar, entao status deve virar `accepted` e vaga ficar ocupada.
- Dado membro designado, quando recusar, entao status deve virar `declined` e vaga ficar disponivel.
- Dado designacao aceita, quando membro abrir Minha Igreja, entao deve aparecer como ativa.

### QR Code

- Dado gestor autorizado, quando criar QR, entao sistema deve gerar token unico e URL publica.
- Dado QR ativo e nao expirado, quando pessoa abrir link, entao formulario deve carregar.
- Dado QR pausado/expirado/arquivado, quando pessoa abrir link, entao formulario deve aparecer indisponivel.
- Dado pessoa envia formulario, quando envio for salvo, entao submissao deve aparecer na Inbox.
- Dado QR de oracao ou cuidado pastoral, quando submissao for criada, entao deve ser sensivel e urgente para pastor.
- Dado QR de voluntariado, quando submissao for criada, entao deve ir para lideranca com proxima acao de encaminhamento.
- Dado submitter identificado, quando status mudar, entao deve receber retorno em Minha Igreja.

## 15. Decisoes pendentes para fechar a regra

1. Aprovacao inicial `admin` deve criar automaticamente role `church_manager`?
2. Pastor aprovado deve ganhar role `pastor` automaticamente?
3. `churches.admins` sera mantido como permissao valida ou migrado para `church_member_roles`?
4. QR no MVP exige login sempre ou permite anonimato?
5. Se permitir anonimato, quais tipos podem ser anonimos?
6. Envio de QR deve vincular automaticamente `churchData` ao perfil do usuario?
7. Designacao sera uma entidade pai com convites filhos, ou cada vaga sera um registro de designacao?
8. Convite pendente reserva vaga ou apenas aceite ocupa vaga?
9. Quem pode aprovar interessado em voluntariado vindo do QR?
10. Aprovar voluntario cria role `volunteer`, cria designacao, adiciona em equipe ou todas as opcoes?
11. Aceite de designacao gera apenas insignia ou tambem Mana/XP?
12. Lider pode criar QR dentro do seu escopo ou apenas `church_manager`?
13. Pastor pode criar QR de cuidado pastoral sem ser gestor?
14. Quais roles podem exportar ou ver indicadores sensiveis futuramente?

## 16. Resumo final do fluxo real

O fluxo real deve ser entendido assim:

```text
1. Plataforma aprova quem pode gerir uma igreja
   -> church_role_requests
   -> /admin
   -> churches.admins + membership + churchData

2. Gestao define papeis operacionais
   -> church_member_roles
   -> roles por igreja e escopo

3. Igreja organiza operacao
   -> equipes
   -> designacoes
   -> vagas da designacao (requisito pendente)
   -> aceite/recusa pelo membro

4. QR cria entradas publicas
   -> /qr/[token]
   -> submissao
   -> inbox
   -> notificacao
   -> retorno em Minha Igreja

5. Minha Igreja e o espelho seguro
   -> status publico
   -> minhas designacoes
   -> minhas conquistas
   -> sem bastidores administrativos
```

Regra de ouro:

- Permissao vem de role e escopo.
- Equipe organiza pessoas, mas nao concede acesso sensivel.
- Designacao organiza servico, mas nao concede permissao sensivel.
- QR recebe demanda, mas sempre precisa cair em Inbox com destino, privacidade e status.
- Minha Igreja mostra retorno seguro, nao os bastidores da gestao.
