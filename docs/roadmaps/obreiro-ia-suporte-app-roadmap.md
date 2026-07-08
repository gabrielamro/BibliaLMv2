# Roadmap Obreiro IA Suporte do App

## Objetivo

Transformar o Obreiro IA em um assistente de ajuda dentro do BibliaLM, capaz de responder duvidas praticas sobre uso do app, localizacao de funcionalidades, planos, historico, criacao de posts, igreja, Culto+, Reino e configuracoes da conta.

Exemplos de perguntas que devem ser respondidas:

- Onde posso ver meu historico?
- Como faco para criar um post?
- Nao encontrei informacoes sobre o plano, onde acho?
- Como vejo meus cultos?
- Como encontro minha igreja?
- Como altero meu perfil?
- Onde ficam meus estudos salvos?

## Product Direction

O Obreiro IA nao deve ser apenas um chatbot biblico. Ele tambem deve funcionar como um guia sereno do proprio produto, ajudando o usuario a encontrar caminhos dentro do app sem precisar sair da experiencia.

A experiencia deve parecer:

- simples para usuarios novos;
- objetiva para quem esta perdido;
- segura para informacoes de conta e plano;
- alinhada ao tom pastoral do BibliaLM;
- barata e controlada em uso de IA.

## Current State

Pontos existentes no produto:

- O projeto ja define a persona **Obreiro IA** no contexto do produto.
- A aplicacao possui modulos como Inicio, Biblia, Reino, Estudio Criativo, Workspace Pastoral, Culto+ e Historico.
- A arquitetura exige que chamadas de IA passem por controle de acesso e custo.
- Historico de acoes relevantes deve avaliar uso de `recordActivity`/`earnMana`.

Gap principal:

- O Obreiro IA ainda nao possui uma base estruturada de conhecimento sobre navegacao e funcionalidades do app.
- Duvidas operacionais do usuario podem ser tratadas como perguntas genericas, sem resposta confiavel sobre rotas, botoes, limites, planos e proximos passos.

## Scope

In scope:

- Criar base de conhecimento de ajuda do app.
- Ensinar o Obreiro IA a distinguir duvida operacional de estudo biblico/devocional.
- Responder com passos curtos e diretos.
- Indicar onde fica cada funcionalidade.
- Explicar limites e beneficios dos planos.
- Sugerir a rota ou area correta do app.
- Incluir fallback quando a funcionalidade nao existir ou estiver indisponivel.
- Preparar telemetria simples para identificar perguntas frequentes.

Out of scope na primeira entrega:

- Abrir telas automaticamente para o usuario.
- Executar acoes sensiveis, como alterar plano, publicar post ou apagar dados.
- Dar informacoes financeiras personalizadas que dependam de dados externos.
- Criar central de atendimento humana.
- Chatbot publico fora do app.
- Treinamento fino de modelo.

## Personas And Use Cases

### Usuario novo

- Pergunta onde fica uma funcionalidade.
- Recebe caminho curto, nome da aba e o que esperar ao chegar la.
- Exemplo: "Onde vejo meu historico?"

### Usuario social

- Quer criar, editar ou encontrar postagens no Reino.
- Recebe instrucao objetiva para acessar Reino, criar publicacao e escolher tipo de conteudo.
- Exemplo: "Como faco pra fazer um post?"

### Usuario com duvida de plano

- Pergunta onde ver informacoes sobre assinatura, beneficios ou limites.
- Recebe orientacao para acessar perfil, plano/assinatura ou area de conta.
- Quando houver incerteza, o Obreiro deve dizer que nao consegue confirmar cobrancas individuais e orientar a tela correta.

### Pastor ou lider

- Pergunta sobre Culto+, igreja, celulas ou Workspace Pastoral.
- Recebe resposta baseada no papel do usuario e nos recursos disponiveis para sua permissao.

## UX Requirements

### Entry points

- [ ] Chat do Obreiro IA.
- [ ] Botao de ajuda contextual em telas principais, quando existir espaco.
- [ ] Empty states com CTA `Perguntar ao Obreiro IA`.
- [ ] Area de planos/conta com ajuda sobre limites e beneficios.
- [ ] Reino com ajuda sobre posts, igreja, grupos e mural.
- [ ] Historico com ajuda sobre atividades registradas.

### Response format

As respostas de suporte devem ser curtas:

- reconhecer a duvida;
- indicar o caminho no app;
- explicar o que fazer na tela;
- sugerir proximo passo se a pessoa nao encontrar.

Modelo de resposta:

```text
Voce encontra isso em Historico.

Va em Perfil > Historico. Ali aparecem suas atividades recentes, como estudos, leituras, interacoes e acoes que geram Mana quando aplicavel.

Se essa opcao nao aparecer, verifique se voce esta logado na conta correta.
```

### Tone

- Usar linguagem simples e pastoralmente acolhedora.
- Evitar respostas longas quando a pergunta for operacional.
- Nao usar tom tecnico com usuario final.
- Nao prometer que uma funcionalidade existe se a base de conhecimento nao confirmar.
- Quando houver duvida, dizer: "Posso te orientar pelo caminho mais provavel, mas essa tela pode variar conforme sua conta."

## Knowledge Base

Criar uma base versionada de ajuda do app, preferencialmente em arquivo estruturado.

Arquivo sugerido:

- [ ] `data/appHelpKnowledge.ts`

Modelo sugerido:

```ts
export interface AppHelpArticle {
  id: string;
  title: string;
  intentKeywords: string[];
  module: 'inicio' | 'biblia' | 'reino' | 'culto-plus' | 'historico' | 'planos' | 'perfil' | 'ia';
  audience?: Array<'visitante' | 'semeador' | 'fiel' | 'visionario' | 'pastor' | 'admin'>;
  route?: string;
  steps: string[];
  relatedQuestions: string[];
  unavailableFallback?: string;
  updatedAt: string;
}
```

Artigos iniciais obrigatorios:

- [ ] Onde ver o historico.
- [ ] Como criar um post no Reino.
- [ ] Onde ver informacoes do plano.
- [ ] Como editar perfil.
- [ ] Como encontrar igreja.
- [ ] Como entrar ou criar celula/grupo.
- [ ] Onde ver meus cultos.
- [ ] Como registrar culto manual.
- [ ] Como criar estudo ou conteudo.
- [ ] Como usar explicacao de versiculo.
- [ ] Como gerar arte sacra.
- [ ] Como ver progresso, Mana e sequencia.
- [ ] Como reportar conteudo inadequado.
- [ ] Como sair da conta.

## Intent Detection

Criar uma etapa antes da resposta do Obreiro IA:

- [ ] Detectar se a pergunta e sobre uso do app.
- [ ] Detectar modulo provavel: Historico, Reino, Planos, Perfil, Culto+, Biblia, IA.
- [ ] Buscar artigos relevantes na base local.
- [ ] Montar contexto curto para o modelo.
- [ ] Se houver match forte, responder com base no artigo.
- [ ] Se nao houver match, responder com fallback seguro e sugerir termos de busca.

Exemplos de intents:

- `app.history.find`
- `app.kingdom.create_post`
- `app.plan.view`
- `app.profile.edit`
- `app.church.find`
- `app.culto.view_mine`
- `app.bible.explain_verse`

## Service Layer

Criar ou estender service de suporte:

- [ ] `services/appHelpService.ts`

Funcoes sugeridas:

- [ ] `detectAppHelpIntent(message: string)`
- [ ] `findHelpArticles(message: string, userRole?: UserRole)`
- [ ] `buildAppHelpContext(articles: AppHelpArticle[])`
- [ ] `shouldAnswerAsAppSupport(message: string)`
- [ ] `recordHelpQuestion(input)`

Regras:

- [ ] Nao chamar Supabase diretamente em componentes.
- [ ] Nao colocar base de conhecimento solta dentro da tela de chat.
- [ ] Manter respostas de suporte em contexto curto para reduzir custo.
- [ ] Toda chamada de IA deve respeitar `checkFeatureAccess` e `retryWithBackoff`.

## AI Behavior

### System behavior

Quando a pergunta for de suporte do app, o Obreiro IA deve:

- responder como guia do BibliaLM;
- usar somente informacoes da base de ajuda e contexto seguro do usuario;
- explicar caminhos em passos;
- avisar quando a resposta depende do plano ou permissao;
- nao inventar tela, botao, preco ou regra.

### Fallback seguro

Se nao houver artigo confiavel:

```text
Ainda nao tenho uma instrucao confirmada para essa parte do app.

Tente procurar em Perfil ou Inicio, ou me diga o nome da tela onde voce esta para eu te orientar melhor.
```

### Dados sensiveis

O Obreiro IA nao deve:

- revelar dados de assinatura, pagamento ou conta que nao estejam no contexto autorizado;
- afirmar que uma cobranca foi feita ou cancelada;
- alterar plano;
- publicar conteudo;
- apagar historico;
- entrar em conta de usuario.

## Routes And Components

Possiveis pontos de alteracao:

- [ ] Chat atual do Obreiro IA.
- [ ] Componente de input do chat.
- [ ] Service responsavel por chamadas de IA.
- [ ] Nova base `data/appHelpKnowledge.ts`.
- [ ] Novo service `services/appHelpService.ts`.
- [ ] Tipos em `types.ts`, se necessario.

Componentes opcionais:

- [ ] `components/help/AppHelpSuggestionChips.tsx`
- [ ] `components/help/AppHelpAnswerCard.tsx`
- [ ] `components/help/ContextualHelpButton.tsx`

Sugestoes de chips iniciais:

- `Onde vejo meu historico?`
- `Como criar um post?`
- `Onde vejo meu plano?`
- `Como encontro minha igreja?`
- `Como vejo meus cultos?`

## Implementation Phases

### Phase 1 - Base de conhecimento

- [x] Mapear rotas reais e nomes de telas do app.
- [x] Criar `AppHelpArticle`.
- [x] Criar artigos iniciais para as perguntas mais comuns.
- [x] Revisar linguagem com tom pastoral simples.

Acceptance criteria:

- Existe uma base versionada com pelo menos 12 artigos de ajuda.
- Cada artigo possui titulo, modulo, palavras-chave, passos e fallback.
- Nenhum artigo promete funcionalidade nao confirmada.

### Phase 2 - Intent local e service

- [x] Criar `appHelpService.ts`.
- [x] Implementar matching por keywords e sinonimos.
- [x] Retornar os 1 a 3 artigos mais relevantes.
- [x] Filtrar artigos por papel/plano quando aplicavel.
- [x] Adicionar testes unitarios do matching.

Acceptance criteria:

- Perguntas sobre historico, post e plano encontram o artigo correto.
- Perguntas biblicas continuam indo para o fluxo normal do Obreiro IA.
- Perguntas ambigueas retornam fallback ou pedem contexto curto.

### Phase 3 - Integracao com Obreiro IA

- [x] Antes da chamada de IA, verificar se a mensagem e duvida do app.
- [x] Se match forte, responder com base no artigo sem enviar contexto grande.
- [ ] Se precisar de IA, enviar apenas artigos relevantes.
- [x] Preservar `checkFeatureAccess` no fluxo de IA existente.
- [x] Evitar custo quando resposta puder ser gerada localmente por template.

Acceptance criteria:

- O usuario recebe resposta objetiva sobre uso do app.
- O fluxo nao aumenta custo de IA para perguntas simples.
- Nao ha regressao nas perguntas biblicas/devocionais.

### Phase 4 - UX de ajuda rapida

- [x] Adicionar chips de perguntas frequentes no chat do Obreiro IA.
- [ ] Adicionar empty states com CTA para perguntar ao Obreiro onde fizer sentido.
- [ ] Adicionar resposta visual com caminho da tela, quando houver rota conhecida.
- [ ] Permitir copiar resposta.

Acceptance criteria:

- Usuario novo consegue descobrir Historico, Reino e Planos sem tentativa e erro.
- As sugestoes aparecem sem poluir telas principais.
- Layout funciona em mobile 360px.

### Phase 5 - Observabilidade e melhoria continua

- [ ] Registrar perguntas de ajuda sem dados sensiveis.
- [ ] Contar intents mais buscadas.
- [ ] Identificar perguntas sem resposta.
- [ ] Criar rotina de atualizacao da base quando novas telas forem lancadas.

Acceptance criteria:

- Equipe consegue ver quais duvidas mais aparecem.
- Perguntas sem match viram backlog de novos artigos.
- Logs nao armazenam conteudo sensivel desnecessario.

## Initial Help Articles Draft

### Onde posso ver meu historico?

- Caminho sugerido: `Perfil > Historico`.
- Explicar que o historico mostra atividades recentes, leituras, estudos e acoes relevantes.
- Se nao aparecer, orientar login e conta correta.

### Como faco para criar um post?

- Caminho sugerido: `Reino > Criar publicacao`.
- Explicar que o usuario pode criar reflexao, pedido de oracao ou conteudo permitido pelo Reino.
- Orientar revisar privacidade/visibilidade antes de publicar.

### Onde vejo informacoes sobre meu plano?

- Caminho sugerido: `Perfil > Plano` ou area de assinatura/conta equivalente.
- Explicar que ali devem aparecer beneficios, limites e status do plano quando disponivel.
- Se envolver cobranca, orientar verificar a tela de assinatura e nao prometer alteracao via chat.

## Privacy And Safety

- [ ] Nao expor dados financeiros no chat.
- [ ] Nao registrar perguntas com informacoes pessoais sensiveis sem sanitizacao.
- [ ] Nao permitir que o Obreiro execute acoes destrutivas.
- [ ] Nao transformar ajuda operacional em aconselhamento pastoral quando a pessoa so pediu navegacao.
- [ ] Nao responder sobre politicas de plano sem base atualizada.

## Test Plan

- [ ] Unit tests:
  - matching de historico;
  - matching de criacao de post;
  - matching de plano/assinatura;
  - pergunta biblica nao classificada como suporte;
  - fallback para pergunta desconhecida;
  - filtro por papel/plano.
- [ ] Typecheck.
- [ ] Build.
- [ ] Manual QA:
  - usuario visitante;
  - usuario logado;
  - usuario pastor;
  - mobile 360px;
  - pergunta curta com erro de digitacao;
  - pergunta ambigua;
  - pergunta com dados sensiveis de cobranca.

## Definition Of Done

- [ ] Obreiro IA responde onde encontrar o Historico.
- [ ] Obreiro IA explica como criar um post no Reino.
- [ ] Obreiro IA orienta onde ver informacoes do plano.
- [ ] Base de conhecimento inicial esta versionada.
- [ ] Matching local cobre perguntas frequentes.
- [ ] Perguntas simples nao exigem chamada cara de IA.
- [ ] Chamadas de IA seguem controle de acesso e retry.
- [ ] Respostas nao inventam rotas, precos ou permissoes.
- [ ] Testes principais passam.
- [ ] Documentacao e exemplos estao atualizados.
