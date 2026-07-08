# Roadmap: Modo Leitura Focada

## Objetivo

Transformar o modo leitura focada em uma experiencia realmente dedicada ao conteudo, removendo distracoes visuais, reduzindo densidade de interface e oferecendo uma leitura linear, confortavel e pastoral para aulas, jornadas e textos biblicos.

Hoje o modo focado em `views/public/PublicPlanPage.tsx` muda pouco: altera fundo, esconde parcialmente header/rodape e mantem a toolbar sticky, blocos editoriais largos, imagens, cards e secoes interativas no mesmo peso visual. O resultado parece uma variacao de tema, nao um modo de leitura.

## Principios

- Conteudo primeiro: texto e versiculo devem ocupar o centro da tela.
- Interface minima: controles aparecem sob demanda e somem durante leitura.
- Leitura linear: blocos visuais devem ser convertidos para um fluxo escaneavel.
- Conforto: largura, tamanho, entrelinha e contraste devem ser otimizados para longos periodos.
- Retorno simples: sair do foco deve restaurar a experiencia normal sem perda de progresso.

## Escopo Inicial

Aplicar primeiro ao leitor de aulas publicadas em `views/public/PublicPlanPage.tsx`, dentro do estado `readingDay && canViewContent`.

Depois, reaproveitar o padrao para:

- `components/Reader.tsx` / Biblia.
- `components/PlanReader.tsx` / plano de leitura.
- Conteudos publicados one-page quando fizer sentido.

## Estado Atual Confirmado

- Toggle em `isFocusedMode` existe na toolbar.
- Container muda entre `bg-white dark:bg-bible-darkPaper` e layout normal.
- Barra de progresso some no foco.
- Header do conteudo e acoes inferiores somem no foco.
- O corpo continua renderizando `BlockRenderer` com layout editorial completo.
- A toolbar segue sticky no topo e continua muito presente.
- Nao ha largura de coluna propria para leitura focada.
- Nao ha painel de preferencias real de leitura.
- Nao ha extracao/normalizacao dos blocos para modo texto.

## Experiencia Alvo

Ao ativar o modo leitura focada:

1. A tela entra em um "reader shell" dedicado.
2. O conteudo fica em coluna central de leitura, entre `680px` e `760px`.
3. A toolbar vira um controle compacto e auto-ocultavel.
4. Hero, cards e blocos visuais deixam de dominar a tela.
5. O texto ganha entrelinha maior, espaco vertical consistente e contraste controlado.
6. Acoes secundarias somem ou vao para um menu discreto.
7. O progresso de leitura vira uma linha sutil ou marcador lateral.
8. O usuario consegue sair, concluir, ouvir e ajustar texto sem interromper a leitura.

## Fase 1: Reader Shell Real

Criar um shell especifico para foco em `PublicPlanPage`.

Mudancas:

- Substituir o container focado por uma estrutura dedicada:
  - `min-h-screen`
  - fundo neutro e sem cards externos
  - coluna central `max-w-[720px]`
  - padding responsivo confortavel
- Remover `max-w-7xl` quando `isFocusedMode` estiver ativo.
- Reduzir `p-2 md:p-4` para padding controlado pelo shell focado.
- Fazer a toolbar usar `fixed` ou `absolute` com auto-hide, nao ocupar espaco de leitura.

Criterios de aceite:

- Ao ativar foco, a largura do texto muda claramente.
- O primeiro bloco comeca proximo ao topo util, sem parecer abaixo de uma barra flutuante.
- Em desktop, o texto nao ocupa a largura inteira.
- Em mobile, nao ha overflow horizontal.

## Fase 2: Normalizador de Conteudo Focado

Criar uma camada de renderizacao focada para blocos de aula.

Mudancas:

- Implementar helper `getFocusedReadingBlocks(blocksConfig)` ou componente `FocusedLessonContent`.
- Renderizar blocos em modo leitura, nao em modo landing page.
- Tratar blocos:
  - `hero` / `hero-split`: transformar em titulo, subtitulo e imagem opcional compacta.
  - `biblical`: destacar versiculo como citacao textual, sem card pesado.
  - `study-outline`: virar sumario compacto ou oculto em foco.
  - `rich-text`: manter conteudo principal com tipografia otimizada.
  - `slide`: renderizar como secao textual ou ocultar midia secundaria.
  - `related-verses`: virar lista simples ao final.
  - `authority` / `footer` / `cta`: ocultar no foco, exceto se necessario.
  - `reflection-question`: manter ao final como pausa devocional discreta.

Criterios de aceite:

- O modo foco nao parece uma one-page comprimida.
- Imagens nao empurram a leitura principal para baixo de forma excessiva.
- Blocos decorativos nao competem com o texto.
- O conteudo continua fiel ao material criado pelo autor.

## Fase 3: Toolbar Minimalista

Redesenhar os controles de leitura focada.

Mudancas:

- Toolbar reduzida no foco:
  - voltar
  - tamanho do texto
  - audio
  - sair do foco
  - menu secundario
- Auto-hide ao rolar para baixo.
- Reaparecer ao rolar para cima, tocar no topo ou pressionar `Esc`.
- No mobile, usar uma barra inferior compacta ou botao flutuante unico.
- Separar controles essenciais de acoes secundarias como editar, compartilhar e acompanhar.

Criterios de aceite:

- A toolbar nao cobre titulo nem primeiro paragrafo.
- Em leitura continua, os controles desaparecem.
- Todos os controles seguem acessiveis por teclado e possuem `title`/`aria-label`.

## Fase 4: Preferencias de Leitura

Adicionar preferencias reais para leitura focada.

Controles:

- Tamanho da fonte.
- Entrelinha: compacta, confortavel, ampla.
- Tema: claro, escuro, sepia.
- Largura da coluna: estreita, media, ampla.
- Alternar midias: mostrar/ocultar imagens decorativas.

Persistencia:

- Reusar `SettingsContext` quando for preferencia global.
- Usar `localStorage` para preferencias especificas do leitor de jornada se ainda nao houver campo global.

Criterios de aceite:

- Ao ajustar fonte/tema, a mudanca e perceptivel imediatamente.
- Preferencias persistem ao reabrir outra aula.
- Contraste deve permanecer legivel em todos os temas.

## Fase 5: Progresso Sem Distracao

Trocar a barra chamativa por progresso silencioso.

Mudancas:

- Linha fina no topo apenas quando toolbar esta visivel, ou marcador lateral discreto.
- Exibir percentual apenas em menu/rodape.
- Manter `Concluir` como acao final contextual, fora do corpo principal durante leitura.

Criterios de aceite:

- O usuario entende que ha progresso.
- O progresso nao parece elemento de gamificacao durante leitura profunda.
- A conclusao da aula continua facil no fim.

## Fase 6: Estados e Integracoes

Garantir que o modo foco respeite todos os fluxos.

Casos:

- Usuario dono da sala.
- Usuario membro inscrito.
- Espectador sem `myStats`.
- Aula com `blocksConfig`.
- Aula legada com `htmlContent`.
- Aula com audio ativo.
- Aula com comentarios/forum.
- Tema claro/escuro.
- Mobile e desktop.

Criterios de aceite:

- Entrar e sair do foco nao perde audio, progresso ou scroll de forma inesperada.
- Comentarios nao aparecem durante foco, mas continuam acessiveis fora dele.
- O botao `Concluir` segue disponivel no fim da leitura.

## Implementacao Recomendada

1. Criar `components/reader/FocusedReadingShell.tsx`.
2. Criar `components/reader/FocusedLessonContent.tsx`.
3. Criar `components/reader/FocusedReadingToolbar.tsx`.
4. Mover regras de bloco focado para helper testavel.
5. Integrar em `views/public/PublicPlanPage.tsx` usando `isFocusedMode`.
6. Adicionar testes de renderizacao para:
   - largura focada
   - ocultacao de blocos decorativos
   - titulo e versiculo presentes
   - toolbar compacta

## Fora de Escopo Nesta Primeira Entrega

- Reescrever o editor de aulas.
- Alterar templates do criador de conteudo.
- Mudar layout publico da sala fora da leitura.
- Criar IA para reescrever conteudo.
- Refatorar o leitor biblico inteiro antes de validar o padrao na jornada.

## Riscos

- Alguns blocos podem depender de visual forte para fazer sentido.
- Autores podem esperar que a aula publicada fique igual ao editor.
- Extrair texto de blocos muito customizados pode perder nuances.
- Preferencias globais podem conflitar com configuracoes atuais de `SettingsContext`.

Mitigacao:

- O modo foco deve ser opt-in.
- O modo normal continua intacto.
- Blocos complexos podem ter fallback visual simplificado, nao remocao cega.

## Definition of Done

- O modo foco muda claramente a experiencia visual e cognitiva.
- A leitura fica centralizada, linear e com baixa distracao.
- Toolbar nao ocupa o fluxo principal.
- Acoes secundarias somem durante leitura.
- Fonte, largura e entrelinha melhoram conforto real.
- Funciona em mobile e desktop.
- `npm run typecheck` passa.
- Validacao visual feita em pelo menos:
  - 390px mobile
  - 768px tablet
  - 1440px desktop

