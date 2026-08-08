---
name: culto-plus-visual
description: Padronizar a criação, alteração e revisão de páginas, componentes e funcionalidades do Culto+ conforme o shell, o menu responsivo, os temas por módulo e a identidade visual existentes no repositório. Usar em qualquer trabalho de frontend do Culto+ que envolva novas rotas, telas, dashboards, formulários, cards, navegação, responsividade, tema claro/escuro ou consistência visual com páginas existentes.
---

# Culto+ Visual

Preservar a identidade visual do Culto+ a partir do código canônico do próprio produto. Reutilizar shell, navegação, tokens e padrões existentes antes de criar qualquer solução visual nova.

## Fluxo obrigatório

1. Ler `references/visual-system.md` para identificar as fontes da verdade, o módulo visual da rota e o shell correto.
2. Inspecionar a rota solicitada, seu `layout.tsx` mais próximo e duas páginas representativas do mesmo módulo. Não inferir o padrão somente por memória ou por mockup.
3. Ler `references/page-patterns.md` antes de criar ou reorganizar uma página, formulário, dashboard, lista, modal ou estado de interface.
4. Implementar dentro do shell existente. Não duplicar sidebar, cabeçalho, navegação inferior, alternador de visão, marca ou controle de tema.
5. Consumir os tokens do módulo por classes utilitárias (`module-*`) ou variáveis `--module-*`. Manter superfícies de conteúdo neutras e reservar a cor do módulo para orientação, foco, ícones, estado ativo e CTA principal.
6. Preservar tema claro/escuro, comportamento responsivo, permissões e fluxos funcionais existentes.
7. Validar desktop e mobile, teclado, foco, overflow, estados assíncronos e ausência de navegação duplicada.

## Decisões de shell

- Usar `CultoPlusPageShell` para páginas da visão pessoal e módulos Bíblia, Reino, Cultos, Criar e superfícies neutras.
- Usar o layout/shell já existente em `app/gestao-igreja` para rotas de Gestão da Igreja.
- Usar `PastoralWorkspaceShell` ou o layout pastoral existente para rotas do Workspace Pastoral.
- Preservar shells próprios somente quando a rota já for explicitamente imersiva, de foco ou tiver layout especializado. Confirmar a exceção no código antes de mantê-la.
- Não envolver uma página em um segundo shell quando o layout ancestral já fornecer o shell correto.

## Regras inegociáveis

- Tratar `moduleThemes.ts` e `app/globals.css` como fonte da verdade para módulos e tokens; não criar uma paleta paralela.
- Resolver a identidade pela rota com `getAppModuleForRoute`; atualizar `APP_MODULE_ROUTE_RULES` ao introduzir uma nova família de rotas.
- Usar `data-module` no shell e `data-module-theme` somente em blocos contextuais que pertençam visualmente a outro módulo.
- Preservar no mobile os cinco destinos pessoais, nesta ordem: `Início`, `Bíblia`, `Reino`, `Cultos`, `Perfil`.
- Direcionar o item principal `Cultos` para `/meus-cultos`; a agenda pública fica no perfil da igreja (`/igreja/[slug]`), não em `/culto`.
- Manter cor semântica própria para sucesso, alerta, erro e informação. Não substituir esses estados pela cor do módulo.
- Usar ícones de `lucide-react` e a marca existente (`CultoPlusBrand`/`LogoIcon`); não desenhar substitutos improvisados.
- Manter alvos de toque com pelo menos 44 px, foco visível, HTML semântico, rótulos acessíveis e suporte a teclado.
- Evitar largura fixa que provoque rolagem horizontal. Usar `min-w-0`, grids responsivos e containers fluidos conforme necessário.
- Não apresentar `BibliaLM` como marca ativa. Usar `Culto+`.

## Hierarquia visual

- Dar a cada página um título inequívoco, contexto curto e uma ação primária clara quando houver ação principal.
- Usar cards e superfícies para agrupar informação, não para transformar toda linha em um card.
- Aplicar gradiente do módulo em heróis ou destaques de alta hierarquia; evitar gradiente decorativo em todos os componentes.
- Usar tipografia sans como base. Reservar serifada para leitura bíblica, citações e momentos editoriais coerentes.
- Preferir raios `rounded-xl`, `rounded-2xl` e `rounded-3xl` já recorrentes; manter densidade operacional maior em gestão e leitura mais arejada em conteúdo bíblico/editorial.
- Incluir estados de carregamento, vazio, erro, sucesso e bloqueio de permissão quando aplicáveis.

## Verificação final

- Confirmar que a rota ativa recebe o módulo esperado.
- Confirmar que existe somente um menu principal por breakpoint.
- Confirmar que desktop expandido/compacto e mobile continuam navegáveis.
- Confirmar claro/escuro sem texto, borda ou foco ilegíveis.
- Confirmar responsividade em largura pequena e em desktop amplo.
- Confirmar que CTA, ícone e estado ativo usam tokens do módulo.
- Executar `npm run typecheck` e os testes relevantes ao módulo alterado.
- Atualizar testes de contrato visual quando a mudança tocar shell, rota, navegação ou tokens.

## Referências

- Ler `references/visual-system.md` para fontes canônicas, módulos, tokens, shells e navegação.
- Ler `references/page-patterns.md` para composição de páginas, componentes, estados e checklist de revisão.
