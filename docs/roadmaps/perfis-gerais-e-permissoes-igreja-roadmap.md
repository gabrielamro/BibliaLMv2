# Roadmap: Perfis Gerais e Permissoes por Igreja

Status: implementacao inicial aplicada em 2026-07-08
Data: 2026-07-08
Modulo alvo: Perfil, Workspace Pastoral, Gestao da Igreja e controle de rotas

## 1. Objetivo

Separar claramente duas dimensoes que hoje aparecem misturadas em algumas telas:

1. Tipo geral do perfil no BibliaLM.
2. Permissoes operacionais vinculadas a uma igreja especifica.

O usuario deve poder se cadastrar como **Pastor** mesmo sem estar vinculado a uma igreja. Isso representa a identidade/uso pastoral da conta, nao uma permissao administrativa sobre uma igreja.

Ao mesmo tempo, permissoes dentro de uma igreja continuam dependendo de vinculo, escopo e validacao.

## 2. Decisao arquitetural

### 2.1 Tipos gerais de perfil

O perfil geral do usuario deve ter tres tipos visiveis:

| Tipo geral | O que significa | Exige igreja? | Observacao |
| --- | --- | --- | --- |
| `user` | Usuario comum, membro, leitor, participante da comunidade | Nao | Perfil padrao |
| `pastor` | Pessoa que usa recursos pastorais, cria estudos, salas, cultos e conteudo pastoral | Nao | Nao vira gestor de igreja automaticamente |
| `manager` | Pessoa com foco em operacao/gestao de igreja no app | Nao para identidade geral; sim para gerir uma igreja concreta | Nao recebe permissao sobre igreja sem vinculo |

O perfil `admin` continua existindo, mas e interno/sistema e ja esta setado. Nao deve ser opcao publica de cadastro.

### 2.2 Permissoes vinculadas a igreja

As permissoes dentro de uma igreja sao separadas do tipo geral do perfil:

| Papel na igreja | Escopo | Como deve ser concedido |
| --- | --- | --- |
| `church_manager` / gestor | Igreja inteira | Solicitação, aprovacao ou admin legado |
| `pastor` | Igreja, grupo, culto ou cuidado pastoral | Vinculo com igreja e permissao concedida |
| `leader` / lider | Equipe, grupo, culto ou area | Vinculo com igreja e escopo |
| `volunteer` / voluntario | Equipe, escala, atividade ou culto | Convite, aceite ou atribuicao |

Regra principal: **tipo geral `pastor` nao concede papel de pastor em uma igreja automaticamente**.

## 3. Estado atual observado

- `SubscriptionTier` hoje inclui `free`, `bronze`, `silver`, `gold`, `pastor`, `admin`.
- `subscriptionTier` mistura plano comercial, identidade pastoral e acesso interno.
- `UserProfile` nao possui ainda um campo semantico dedicado para tipo geral de perfil.
- `church_member_roles` ja modela papeis operacionais por igreja, com `role`, `scope_type` e `scope_id`.
- `complete-profile` permite editar dados publicos, igreja, plano e preferencias, mas nao tem uma selecao clara de tipo geral do perfil.
- Algumas rotas usam `subscriptionTier === 'pastor'` para liberar Workspace Pastoral e recursos pastorais.
- Gestao da Igreja usa papeis operacionais e vinculo com igreja, o que deve continuar separado.

## 4. Modelo alvo de dados

### 4.1 Novo campo recomendado

Adicionar ao `UserProfile`:

```ts
export type GeneralProfileType = 'user' | 'pastor' | 'manager';

export interface UserProfile {
  profileType?: GeneralProfileType;
}
```

Regra de migracao:

- perfis sem `profileType` assumem `user`;
- `subscriptionTier === 'pastor'` pode migrar inicialmente para `profileType = 'pastor'`;
- gestores operacionais conhecidos podem receber `profileType = 'manager'`, mas isso nao substitui `church_member_roles`;
- `subscriptionTier === 'admin'` permanece interno e nao depende de `profileType`.

### 4.2 Manter `subscriptionTier` para plano

No alvo final, `subscriptionTier` deve representar plano/capacidade comercial, nao identidade eclesiastica.

Transicao segura:

- manter compatibilidade com `subscriptionTier === 'pastor'` enquanto as rotas sao migradas;
- criar helpers centralizados para evitar condicionais espalhadas.

Helpers sugeridos:

```ts
isGeneralPastor(profile)
isGeneralManager(profile)
isAdmin(profile)
canAccessPastoralWorkspace(profile)
canAccessChurchManagement(profile, churchRoleContext)
```

## 5. Regras de produto

| ID | Regra |
| --- | --- |
| RN-PER-001 | O usuario pode escolher `Usuario`, `Pastor` ou `Gestor` em `/complete-profile`. |
| RN-PER-002 | Escolher `Pastor` nao exige igreja. |
| RN-PER-003 | Escolher `Gestor` nao concede gestao de igreja automaticamente. |
| RN-PER-004 | `Pastor` geral pode acessar ferramentas pastorais pessoais mesmo sem igreja. |
| RN-PER-005 | Gestao de uma igreja concreta exige papel operacional em `church_member_roles`, admin legado ou fluxo aprovado. |
| RN-PER-006 | Pastor vinculado a igreja pode ter permissao pastoral escopada sem ser gestor administrativo. |
| RN-PER-007 | Lider e voluntario sempre sao papeis vinculados a igreja/equipe/grupo/culto. |
| RN-PER-008 | Perfil `admin` nao aparece como opcao publica em cadastro/complete-profile. |
| RN-PER-009 | Rotas devem usar helpers de permissao, nao comparar campos diretamente em cada componente. |
| RN-PER-010 | Mudanca de tipo geral deve registrar atividade relevante no historico quando alterar acesso do usuario. |

## 6. Impacto por rota

### 6.1 `/complete-profile`

Adicionar selecao de tipo geral:

- Usuario;
- Pastor;
- Gestor.

Comportamento:

- `Pastor`: habilita experiencia pastoral pessoal sem exigir igreja.
- `Gestor`: explica que para gerir uma igreja sera necessario vinculo/validacao.
- Igreja continua opcional.
- Se usuario vincular igreja, isso continua sendo apenas membership, nao permissao administrativa.

### 6.2 Workspace Pastoral

Rotas que devem aceitar pastor sem igreja:

- `/workspace-pastoral`;
- `/workspace-pastoral/cultos`;
- `/workspace-pastoral/cultos/novo`;
- criacao de estudos, salas, planos e conteudos pastorais, quando nao dependerem de uma igreja.

Quando uma funcionalidade exigir igreja, a tela deve mostrar estado vazio/CTA:

> Vincule uma igreja para publicar como igreja ou gerir equipes.

### 6.3 Gestao da Igreja

Rotas de gestao operacional continuam exigindo permissao de igreja:

- `/gestao-igreja`;
- `/gestao-igreja/cultos`;
- `/gestao-igreja/equipes`;
- `/gestao-igreja/pessoas`;
- QR, inbox, papeis e permissoes.

Perfil geral `Gestor` pode ver convite/explicacao para solicitar acesso, mas nao deve administrar uma igreja sem role.

### 6.4 Pagina publica de igreja

Fluxo de responsabilidade por igreja continua separado:

- solicitar responsabilidade;
- validar;
- conceder role operacional;
- nao depender apenas do tipo geral do perfil.

## 7. Roadmap de execucao

### Sprint 1 - Modelo e helpers de permissao

Objetivo: parar de espalhar regra de pastor/gestor em cada tela.

- [x] Criar `GeneralProfileType` em `types.ts`.
- [x] Adicionar `profileType?: GeneralProfileType` em `UserProfile`.
- [x] Criar helper central de perfil/permissao.
- [x] Mapear compatibilidade com `subscriptionTier === 'pastor'`.
- [x] Criar testes unitarios para helpers.

Arquivos provaveis:

- `types.ts`;
- `utils/profileAccess.ts`;
- `tests/profileAccess.test.ts`.

### Sprint 2 - Complete Profile

Objetivo: permitir que o usuario escolha seu tipo geral sem depender de igreja.

- [x] Adicionar seletor `Usuario`, `Pastor`, `Gestor` em `/complete-profile`.
- [x] Explicar a diferenca entre tipo geral e permissao de igreja.
- [x] Persistir `profileType` no perfil.
- [x] Nao solicitar permissao da igreja para marcar `Pastor`.
- [x] Manter igreja opcional.
- [x] Esconder `Admin` como opcao publica.

Arquivos provaveis:

- `views/CompleteProfilePage.tsx`;
- `services/supabase.ts`;
- `utils/profileSettings.ts`.

### Sprint 3 - Rotas pastorais sem igreja obrigatoria

Objetivo: habilitar o pastor geral nas rotas pastorais pessoais.

- [x] Atualizar guards de `/workspace-pastoral`.
- [x] Atualizar guards de criacao de conteudo pastoral.
- [x] Separar funcionalidades que exigem igreja das que nao exigem.
- [ ] Exibir CTA de vinculo com igreja apenas quando necessario.
- [x] Preservar compatibilidade com perfis `subscriptionTier === 'pastor'`.

Rotas alvo:

- `/workspace-pastoral`;
- `/workspace-pastoral/cultos`;
- `/workspace-pastoral/cultos/novo`;
- `/criar-sala`;
- rotas de criacao pastoral que hoje dependam de `subscriptionTier`.

### Sprint 4 - Gestao da igreja por role operacional

Objetivo: garantir que gestor geral nao vire gestor de igreja sem autorizacao.

- [x] Auditar guards de `/gestao-igreja`.
- [x] Exigir `church_member_roles`, admin legado ou solicitacao aprovada para gestao real.
- [x] Criar estado de acesso pendente para `profileType = manager` sem igreja.
- [x] Criar CTA para solicitar acesso de gestor/pastor na igreja.
- [x] Garantir que pastor geral veja apenas o que seu papel operacional permitir.

### Sprint 5 - Migracao e compatibilidade

Objetivo: transicao sem quebrar usuarios atuais.

- [x] Migration SQL para `profiles.profile_type`.
- [x] Backfill inicial por `subscription_tier`.
- [x] Atualizar mapeamento `mapProfile`.
- [x] Atualizar criacao de perfil.
- [x] Atualizar validadores SQL/RLS se necessario.
- [x] Criar release note de mudanca de modelo.

### Sprint 6 - Auditoria de cenarios e QA automatizado

Objetivo: validar que cada perfil ve as rotas corretas.

Cenarios cobertos em `tests/profilePermissionScenarios.test.ts`:

- [x] usuario comum sem igreja;
- [x] pastor sem igreja;
- [x] gestor sem igreja;
- [x] pastor com igreja, sem role operacional;
- [x] gestor aprovado de igreja;
- [x] lider de equipe;
- [x] voluntario;
- [x] admin interno.

Validacoes:

- [x] pastor sem igreja acessa Workspace Pastoral;
- [x] pastor sem igreja nao administra Gestao da Igreja;
- [x] gestor geral sem igreja ve CTA de solicitar/vincular igreja;
- [x] gestor aprovado acessa Gestao da Igreja;
- [x] admin interno continua com acesso total definido pelo sistema.

## 8. Criterios de aceite

- `/complete-profile` permite selecionar `Usuario`, `Pastor` e `Gestor`.
- Pastor pode salvar perfil sem igreja.
- Pastor sem igreja acessa ferramentas pastorais pessoais.
- Gestor geral nao administra igreja sem permissao operacional.
- Papeis de igreja continuam escopados por `church_member_roles`.
- Rotas deixam de depender diretamente de `subscriptionTier === 'pastor'` sempre que a decisao for identidade/funcao.
- `admin` nao aparece como escolha publica.
- `npm run typecheck` passa.

## 9. Riscos e cuidados

- Nao trocar plano comercial por tipo de perfil em uma unica mudanca grande.
- Nao conceder permissoes administrativas por auto-declaracao.
- Nao quebrar usuarios que ja usam `subscriptionTier = pastor`.
- Nao expor dados pastorais sensiveis para gestores operacionais.
- Manter logica de permissao em helpers/services, nao duplicada em componentes.

## 10. Decisao final do arquiteto

O BibliaLM passa a diferenciar:

- **identidade geral do usuario**: Usuario, Pastor, Gestor;
- **permissao operacional na igreja**: gestor, pastor, lider, voluntario;
- **admin interno**: papel de sistema ja definido, fora do cadastro publico.

Essa separacao evita o erro de produto mais perigoso: transformar uma declaracao de perfil em permissao administrativa real.
