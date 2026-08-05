# Padrões de páginas e funcionalidades

## Sumário

- Anatomia de página
- Padrões por tipo de interface
- Responsividade
- Acessibilidade
- Estados e feedback
- Revisão de consistência

## Anatomia de página

Compor a página dentro do shell correto nesta ordem:

1. Cabeçalho de conteúdo com contexto, `h1`, descrição curta e ação primária opcional.
2. Resumo ou indicadores somente quando ajudarem uma decisão real.
3. Conteúdo principal em uma coluna fluida ou grid responsivo.
4. Ações secundárias e navegação contextual próximas do conteúdo afetado.
5. Estados de carregamento, vazio, erro e permissão na mesma geometria do conteúdo final.

Base sugerida, adaptável ao módulo:

```tsx
<div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
  <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      <p className="module-accent-text text-xs font-semibold uppercase tracking-[0.18em]">Módulo</p>
      <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Título da página</h1>
      <p className="module-muted-text mt-2 max-w-2xl text-sm leading-6">Descrição objetiva.</p>
    </div>
    <button className="module-focus module-accent-bg min-h-11 rounded-xl px-4 font-semibold">Ação principal</button>
  </header>
  <main className="mt-6 min-w-0">...</main>
</div>
```

Usar `main` apenas se o shell ou layout não fornecer um `main` ancestral. Evitar landmarks duplicados.

## Padrões por tipo de interface

### Dashboard

- Limitar indicadores ao conjunto necessário para leitura rápida.
- Ordenar blocos por prioridade e frequência de uso.
- Usar grids `sm`, `lg` e `xl` sem depender de largura fixa.
- Evitar uma coleção uniforme de cards quando existem hierarquias diferentes.

### Lista operacional

- Manter filtros e busca próximos da lista.
- Priorizar escaneabilidade, seleção e ações contextuais.
- Usar tabela somente quando a comparação entre colunas for essencial; oferecer alternativa responsiva no mobile.
- Preservar paginação, ordenação, loading e seleção durante mutações.

### Formulário

- Associar `label` e controle; explicar formato antes do erro.
- Agrupar campos por decisão do usuário.
- Mostrar validação junto ao campo e resumo somente quando útil.
- Manter ação primária previsível e ação destrutiva visualmente separada.
- Usar drawer ou modal apenas para tarefa curta e contextual; usar página para fluxo longo.

### Modal, drawer e popover

- Reusar componentes existentes do mesmo módulo.
- Definir título acessível, foco inicial, fechamento por `Esc` e devolução do foco.
- Evitar modal dentro de modal.
- Manter ações fixas somente quando o conteúdo puder rolar sem escondê-las.

### Card

- Usar superfície neutra, borda discreta e ícone/CTA na cor do módulo.
- Usar card interativo como um único link ou botão quando toda a área for acionável.
- Não aninhar controles clicáveis incompatíveis.
- Preservar altura por conteúdo; usar alturas iguais apenas quando melhorarem comparação.

### Conteúdo bíblico/editorial

- Priorizar legibilidade e largura de linha confortável.
- Usar serifada para passagem ou citação, não obrigatoriamente para controles.
- Usar branco envelhecido no modo escuro do módulo Bíblia por meio dos tokens.
- Não sacrificar contraste por textura ou imagem de fundo.

## Responsividade

- Começar em 320 px e ampliar progressivamente.
- Manter controles de toque com dimensão mínima de 44 × 44 px.
- Usar `min-w-0` em filhos de flex/grid com texto longo.
- Trocar colunas por pilha antes que cards ou tabelas comprimam conteúdo.
- Reservar espaço para a navegação inferior mobile quando ela estiver ativa.
- Considerar `env(safe-area-inset-bottom)` em elementos fixos.
- Testar menus, dropdowns e drawers em viewport curta, não apenas estreita.
- Não ocultar função essencial apenas para resolver falta de espaço.

## Acessibilidade

- Usar um único `h1` por página e hierarquia de headings sem saltos arbitrários.
- Usar `button` para ação e `Link` para navegação.
- Fornecer nome acessível a botões de ícone.
- Manter `aria-current`, `aria-expanded`, `aria-controls` e roles de tabs quando aplicáveis.
- Usar `module-focus` ou foco equivalente visível.
- Não comunicar módulo, status ou erro somente por cor.
- Respeitar contraste nos dois temas e movimento reduzido quando houver animação relevante.
- Evitar texto essencial abaixo de 12 px; rótulos compactos menores devem ser auxiliares.

## Estados e feedback

- Carregamento: preservar a estrutura e anunciar progresso quando necessário.
- Vazio: explicar por que está vazio e oferecer próxima ação real.
- Erro: dizer o que falhou e permitir tentar novamente quando possível.
- Sucesso: confirmar a mudança sem bloquear a continuidade.
- Permissão: explicar o acesso necessário sem sugerir que o dado não existe.
- Desabilitado: expor motivo por texto, tooltip acessível ou mensagem próxima.
- Mutação: impedir duplicidade, preservar dados digitados e apresentar feedback.

Usar cores semânticas para esses estados. A cor do módulo continua sendo identidade e ação, não substituto de sucesso/alerta/erro.

## Revisão de consistência

Comparar a implementação com duas páginas do mesmo módulo e verificar:

- shell e menu corretos;
- título, espaçamento e largura de conteúdo coerentes;
- tokens do módulo em foco, CTA, ícones e ativo;
- superfícies neutras e legíveis;
- claro/escuro completos;
- mobile sem navegação duplicada ou overflow horizontal;
- estados assíncronos e permissões preservados;
- sem marca, rota ou terminologia legada;
- sem lógica de negócio movida para componente visual;
- testes atualizados para o contrato alterado.
