# Sistema visual canônico do Culto+

## Sumário

- Fontes da verdade
- Escolha do shell
- Módulos visuais
- Tokens e classes
- Navegação
- Tipografia e marca
- Como estender o sistema

## Fontes da verdade

Consultar nesta ordem antes de implementar:

1. `moduleThemes.ts`: IDs de módulo, registro de rotas e resolver `getAppModuleForRoute`.
2. `app/globals.css`: tokens claros/escuros e classes reutilizáveis `module-*`, `cultoplus-*` e `newhome-*`.
3. `components/CultoPlusPageShell.tsx`: shell pessoal oficial, menu desktop compacto/expandido e menu mobile.
4. `components/MobileBottomNav.tsx`: destinos e comportamento da navegação inferior global.
5. `components/church-management/ChurchManagementShell.tsx`: shell operacional da Gestão da Igreja.
6. `components/workspace/PastoralWorkspaceShell.tsx`: shell do Workspace Pastoral.
7. `components/AppViewSwitcher.tsx`: alternância compacta entre visão pessoal, gestão e pastoral.
8. `components/CultoPlusBrand.tsx` e `components/LogoIcon.tsx`: marca oficial.
9. `_PROJECT_CONTEXT.md`, seção `Identidade visual por módulo`: regras de produto que não podem ser quebradas.

Usar `constants.ts` apenas como fachada pública quando ele reexportar o registro de módulos. Não duplicar o registro em outro arquivo.

## Escolha do shell

| Contexto | Shell canônico | Regra |
| --- | --- | --- |
| Visão pessoal e módulos comuns | `CultoPlusPageShell` | Envolver a página somente se nenhum layout ancestral já o fizer. |
| Gestão da Igreja | `ChurchManagementShell` / `app/gestao-igreja/layout.tsx` | Preservar menu operacional, permissões e alternador de visão. |
| Workspace Pastoral | `PastoralWorkspaceShell` / layout pastoral | Preservar identidade roxa e acesso pastoral. |
| Home personalizada | Estrutura existente de `NewHomePage` | Reusar classes `newhome-*`; não adicionar outro menu. |
| Culto público imersivo ou foco | Shell especializado existente | Manter a exceção somente quando confirmada no código. |

Antes de adicionar um shell, percorrer os layouts ancestrais da rota. Shell duplicado causa duas sidebars, dois headers, offsets incorretos e navegação móvel repetida.

## Módulos visuais

| ID | Uso | Direção visual |
| --- | --- | --- |
| `home` | `/`, `/newhome`, rotina e mapa | Preto/ameixa profundo com amarelo da marca. |
| `bible` | Bíblia, Pão Diário, oração pessoal, planos, quiz e estudos | Couro, pergaminho e ouro; serifada para texto bíblico/editorial. |
| `kingdom` | Feed, perfis públicos, igrejas, grupos e oração comunitária | Roxo, magenta e coral; tratamento editorial Trama Viva. |
| `cultos` | Agenda pessoal/pública e culto ao vivo | Verde escuro e esmeralda. |
| `create` | Estúdio, arte sacra, podcast e criação assistida | Gradiente violeta, magenta, coral e amarelo. |
| `management` | Operação da igreja | Preto, grafite e prata; maior densidade informacional. |
| `pastoral` | Ensino, cuidado e workspace pastoral | Roxo profundo. |
| `neutral` | Conta, suporte e superfícies globais | Ardósia neutra. |

Rotas ambíguas devem seguir o contexto funcional, não apenas uma palavra no caminho. Exemplos:

- `/oracoes` → `bible`
- `/social/oracao` → `kingdom`
- `/oracoes/gerenciar` → `pastoral`
- `/gestao-igreja/cultos` → `management`
- `/workspace-pastoral/cultos` → `pastoral`
- `/culto/[slug]` e `/meus-cultos` → `cultos`
- `/criar-sala` → `pastoral`

## Tokens e classes

Consumir os tokens definidos em `app/globals.css`:

- `--module-primary`, `--module-primary-hover`: ação e destaque principal.
- `--module-secondary`: acento secundário.
- `--module-surface`, `--module-surface-strong`: superfícies suaves.
- `--module-border`: bordas contextuais.
- `--module-text`, `--module-text-muted`: texto do módulo.
- `--module-on-primary`: conteúdo sobre cor primária.
- `--module-focus`: foco visível.
- `--module-gradient`: hero ou destaque principal.

Preferir as classes prontas:

- `module-accent-text`, `module-muted-text`
- `module-icon`, `module-accent-bg`, `module-gradient`
- `module-soft-surface`, `module-border`
- `module-nav-active`, `module-nav-link`, `module-submenu`
- `module-tab-indicator`, `module-focus`, `module-focus-within`
- `cultoplus-page-content`
- `newhome-card`, `newhome-soft`, `newhome-hero`, `newhome-cta` somente dentro do padrão da Home ou quando a composição for deliberadamente compartilhada.

Exemplo de bloco contextual:

```tsx
<section data-module-theme="cultos" className="module-soft-surface module-border rounded-2xl border p-5">
  <span className="module-icon flex h-11 w-11 items-center justify-center rounded-xl">
    <CalendarDays aria-hidden="true" size={20} />
  </span>
  <h2 className="mt-4 text-xl font-semibold">Próximo culto</h2>
  <p className="module-muted-text mt-2 text-sm">Domingo, 18h</p>
  <Link href="/meus-cultos" className="module-focus module-accent-bg mt-5 inline-flex min-h-11 items-center rounded-xl px-4 font-semibold">
    Ver meus cultos
  </Link>
</section>
```

Não copiar valores hexadecimais dos tokens para novos componentes. Usar cor literal apenas para cores semânticas ou quando um padrão existente específico exigir isso.

## Navegação

- Manter menu desktop pessoal expansível e compacto conforme `CultoPlusPageShell`.
- Manter submenus agrupados por módulo e destacar rota ativa com ícone, texto e estado, não apenas cor.
- Manter navegação inferior mobile com cinco destinos: `Início`, `Bíblia`, `Reino`, `Cultos`, `Perfil`.
- Manter navegação contextual dentro das páginas para igreja, grupos, oração comunitária e descoberta.
- Usar `AppViewSwitcher` para alternar visão pessoal, gestão e pastoral; respeitar capabilities.
- Atualizar o menu canônico e seus testes quando uma nova rota precisar aparecer globalmente. Não criar atalhos globais isolados dentro de uma página.

## Tipografia e marca

- Usar `font-sans` como padrão da interface.
- Usar `font-serif` para Bíblia, citações e conteúdo editorial quando coerente.
- Usar famílias especiais definidas em `tailwind.config.ts` apenas em experiências que já adotem essa linguagem.
- Respeitar a configuração global de peso: o projeto limita pesos visuais para manter consistência.
- Renderizar `Culto+` com `CultoPlusBrand` ou `LogoIcon` quando houver marca gráfica.
- Não usar o nome legado `BibliaLM` em superfícies novas.

## Como estender o sistema

Ao criar uma nova família de rotas:

1. Escolher um módulo existente sempre que o produto pertencer a um domínio atual.
2. Adicionar a regra em `APP_MODULE_ROUTE_RULES` de `moduleThemes.ts`.
3. Adicionar entrada ao menu canônico somente se a funcionalidade for um destino global.
4. Reusar tokens e classes existentes.
5. Criar novos tokens somente quando houver uma necessidade recorrente em várias superfícies.
6. Cobrir o resolver de rota e a navegação com testes.

Criar um novo módulo visual apenas quando existir um novo domínio permanente do produto, com aprovação explícita de produto/design e impacto revisado em claro, escuro, desktop e mobile.
