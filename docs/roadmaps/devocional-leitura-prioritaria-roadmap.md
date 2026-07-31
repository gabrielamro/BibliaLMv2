# Roadmap — Pão Diário com leitura prioritária

Data: 27/07/2026  
Status: implementado na v2.6.10

## 1. Objetivo

Transformar `/devocional` em uma experiência de leitura clara, na qual o usuário encontre primeiro:

1. o versículo do dia;
2. a reflexão pastoral;
3. o contexto bíblico necessário;
4. as perguntas de observação;
5. a continuidade do estudo.

A navegação das cinco etapas deve orientar sem ocupar a área mais importante da primeira dobra.

## 2. Problemas confirmados

- `A Presença Inabalável` é o título real do Pão Diário, mas `A Palavra antes de tudo` aparece como um segundo título principal e cria concorrência semântica.
- O bloco de etapas ocupa grande parte da primeira dobra antes do conteúdo.
- A reflexão `Sentido central`, que deveria ser o núcleo da experiência, aparece depois do versículo, metadados, contexto e perguntas.
- `Contexto bíblico imediato` e `Observe no texto` possuem o mesmo peso visual da reflexão.
- Os metadados `Livro e capítulo`, `Versículo-base` e `Parte da Bíblia` repetem informações que podem ser apresentadas em uma linha compacta.
- O usuário precisa percorrer muitos elementos de interface antes de começar efetivamente a leitura.

## 3. Decisão de produto

### Título único

- Manter `A Presença Inabalável` como único `h1`.
- Retirar `A Palavra antes de tudo` como título de conteúdo.
- `Ler a Palavra` permanece apenas como rótulo discreto da etapa atual.
- A instrução “Leia sem pressa...” pode aparecer como microtexto abaixo do versículo, sem criar outra seção.

### Conteúdo prioritário

A ordem visual da etapa de leitura será:

1. Versículo e referência.
2. Reflexão pastoral.
3. Contexto bíblico imediato, integrado à área da reflexão.
4. Link para o capítulo completo.
5. `Observe no texto`.
6. Ação para seguir à reflexão pessoal.

### Etapas como navegação secundária

- Desktop: trilho lateral compacto e fixo dentro do leitor.
- Tablet: seletor compacto recolhível no topo direito.
- Mobile: resumo de progresso no topo e lista completa depois do conteúdo da etapa.
- A etapa atual continua identificada, mas não antecede o versículo com cinco cards grandes.

## 4. Arquitetura de informação proposta

### Desktop

```text
┌─────────────────────────────────────────────────────────────┐
│ Pão Diário · data · duração              Ouvir  A− A A+ Foco│
│ A Presença Inabalável                                      │
├───────────────────────────────────────────┬─────────────────┤
│                                           │  1 Ler          │
│  “Deus é o nosso refúgio...”              │  2 Refletir     │
│  Salmos 46:1                              │  3 Orar         │
│                                           │  4 Praticar     │
│  REFLEXÃO                                 │  5 Concluir     │
│  Sentido central e texto pastoral         │                 │
│                                           │  20% concluído  │
│  ┌ Contexto bíblico imediato ──────────┐  │                 │
│  │ trecho e explicação de apoio        │  │                 │
│  └─────────────────────────────────────┘  │                 │
│                                           │                 │
│  Observe no texto                         │                 │
│  1 ...  2 ...  3 ...                      │                 │
│                                           │                 │
│                         Continuar →        │                 │
└───────────────────────────────────────────┴─────────────────┘
```

### Mobile

```text
Título único
Progresso compacto: Etapa 1 de 5
Controles essenciais

Versículo
Reflexão pastoral
Contexto bíblico recolhível
Observe no texto
Continuar

Ver todas as etapas
```

## 5. Roadmap de implementação

### Fase 1 — Corrigir hierarquia editorial

Prioridade: alta

- Remover o segundo título visual `A Palavra antes de tudo`.
- Manter um único `h1` com o título do conteúdo diário.
- Levar o versículo para o início do leitor, imediatamente após os controles compactos.
- Mover `Sentido central` para logo depois do versículo.
- Renomear visualmente `Sentido central` para `Reflexão`, mantendo “Sentido central” como descrição opcional ou marcador editorial.
- Compactar os metadados em uma linha:
  `Salmos 46:1 · Antigo Testamento · Abrir capítulo`.

Critério de aceite:

- Versículo e início da reflexão aparecem na primeira dobra em desktop.
- Existe apenas um título principal perceptível.
- Nenhum card de navegação aparece antes do versículo.

### Fase 2 — Unificar reflexão e contexto

Prioridade: alta

- Criar uma seção editorial única de leitura.
- Reflexão ocupa o maior espaço e aparece primeiro.
- `Contexto bíblico imediato` entra como bloco de apoio dentro da mesma seção.
- Desktop: contexto pode ocupar uma coluna lateral menor ou um bloco inserido após os primeiros parágrafos.
- Mobile: contexto aparece depois da reflexão em acordeão inicialmente recolhido.
- Preservar a identificação de texto bíblico versus reflexão pastoral.

Critério de aceite:

- A reflexão possui maior peso visual que o contexto.
- O contexto continua acessível sem interromper a leitura principal.
- Texto bíblico e comentário pastoral permanecem claramente identificados.

### Fase 3 — Reposicionar as etapas

Prioridade: alta

- Substituir os cinco cards horizontais por um trilho lateral compacto no desktop.
- Mostrar número, nome, estado atual e conclusão de cada etapa.
- No mobile, exibir somente `Etapa X de 5` e progresso no topo.
- Colocar a lista completa de etapas no fim da etapa atual, acionada por `Ver todas as etapas`.
- Preservar navegação direta, teclado, `aria-current` e estados concluídos.

Critério de aceite:

- A navegação não compete com versículo e reflexão.
- O usuário continua podendo acessar qualquer etapa permitida.
- O progresso é compreensível sem ocupar uma seção inteira.

### Fase 4 — Levar “Observe no texto” para o fechamento

Prioridade: média

- Posicionar `Observe no texto` depois da reflexão e do contexto.
- Manter as três perguntas em formato numerado e mais leve.
- Tratar o bloco como ponte para a etapa de reflexão pessoal.
- Inserir em seguida o CTA `Continuar para reflexão`.

Critério de aceite:

- As perguntas nunca aparecem antes da reflexão pastoral.
- O fluxo termina naturalmente em uma ação de continuidade.

### Fase 5 — Simplificar controles e cabeçalho

Prioridade: média

- Reduzir a altura do hero sem retirar título, data, duração ou atualização diária.
- Manter `Ouvir`, tamanho da fonte e modo sem interrupções em uma barra compacta.
- Retirar o botão redundante `Começar estudo` quando o leitor já estiver visível; alternativamente, transformá-lo em âncora discreta para o versículo.
- No modo sem interrupções, ocultar trilho de etapas e elementos não essenciais.

Critério de aceite:

- O cabeçalho contextualiza sem dominar a tela.
- Os controles permanecem acessíveis por teclado e com alvos de toque adequados.
- O modo de foco mostra apenas título, versículo, reflexão e navegação essencial.

### Fase 6 — Validação e proteção contra regressões

Prioridade: obrigatória

- Testar desktop, tablet e mobile.
- Validar tamanhos de fonte pequeno, médio e grande.
- Validar modo claro, escuro e sem interrupções.
- Garantir que áudio, atualização diária, retomada e conclusão das cinco etapas continuem funcionando.
- Atualizar testes para verificar a ordem semântica dos blocos.

Critérios automatizados recomendados:

- O `h1` deve ser o título do devocional.
- O versículo deve aparecer antes da reflexão, contexto, observação e navegação completa.
- A reflexão deve aparecer antes de `Contexto bíblico imediato`.
- `Observe no texto` deve aparecer depois do contexto.
- O desktop deve renderizar o trilho lateral.
- O mobile não deve renderizar os cinco cards no topo.

## 6. Conteúdo preservado

Esta reorganização não deve remover:

- áudio;
- tamanho de fonte;
- modo sem interrupções;
- atualização pessoal diária;
- versículo e referência;
- contexto bíblico ampliado;
- reflexão pastoral;
- link para o capítulo completo;
- perguntas de observação;
- reflexão privada do usuário;
- oração;
- prática;
- conclusão;
- publicação opcional no feed.

## 7. Fora de escopo

- Alterar o conteúdo pastoral gerado.
- Mudar a lógica de seleção diária.
- Modificar banco de dados ou histórico do usuário.
- Redesenhar as etapas 2 a 5 além do necessário para a nova navegação.
- Alterar a identidade marrom, ouro e pergaminho do Pão Diário.

## 8. Resultado esperado

O usuário entra em `/devocional` e entende imediatamente:

1. qual é o tema do dia;
2. qual é a Palavra-base;
3. qual é a reflexão;
4. como aprofundar o contexto;
5. o que observar;
6. qual é o próximo passo.

O Pão Diário deixa de parecer um painel de etapas e passa a funcionar como uma leitura guiada.

## 9. Entrega realizada

- Título concorrente removido da etapa inicial.
- Versículo e referência mantidos como primeiro conteúdo do leitor.
- Reflexão pastoral promovida para o núcleo da experiência.
- Contexto bíblico integrado à reflexão, com capítulo completo preservado.
- `Observe no texto` movido para o encerramento da leitura.
- Navegação das cinco etapas reposicionada para a lateral no desktop e para depois do conteúdo no mobile.
- Áudio, fonte, foco, atualização diária, retomada, conclusão e publicação no feed preservados.
- TypeScript e os seis cenários Playwright do Pão Diário validados com sucesso.
