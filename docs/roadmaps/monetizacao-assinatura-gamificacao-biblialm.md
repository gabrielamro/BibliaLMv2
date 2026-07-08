# Roadmap de monetizacao por assinatura e gamificacao do BibliaLM

Status: implementacao em andamento
Data: 2026-06-09

Atualizacao de implementacao:
- Pacote 0 iniciado.
- Admin ganhou a aba Monetizacao para editar precos, promocao, limites gratuitos, custos/creditos por IA e Mana por acao.
- Gestao de membros no Admin passou a editar plano, status, validade, creditos, Mana total e badges.
- `checkFeatureAccess` passou a respeitar a matriz de permissoes em vez de liberar tudo automaticamente.
- A matriz comecou a controlar fluxos reais: criacao OnePage/estudo com IA, quiz gerado por IA, imagens com IA no editor/plano, narracao de audio biblico, Workspace Pastoral e Criar Sala.
- `openSubscription` passou a abrir o modal real de assinatura globalmente, com mensagem contextual sobre o recurso bloqueado.
- O modal de assinatura passou a ler planos configuraveis em `SystemSettings.subscription.plans`, com fallback em `SUBSCRIPTION_PLANS`.
- O Admin de Monetizacao passou a editar nome, descricao, ativo/destaque, creditos e beneficios dos planos exibidos no paywall.
- A rota `/planos` foi reativada e passou a renderizar a pagina real de assinatura.
- A pagina `/planos` tambem passou a ler os planos configuraveis do Admin, incluindo nome, descricao, visibilidade, destaque, beneficios e precos.
- O checkout de assinatura passou a diferenciar recorrencia mensal e anual no servico de pagamento.
- Ainda faltam auditoria administrativa, editor de badges/niveis/streaks, migracao dos pontos remanescentes de exibicao de plano e consolidacao da integracao de pagamento real em ambiente de producao.

## Resumo executivo

O BibliaLM deve monetizar depois de provar valor, nao antes. A estrategia recomendada e usar o Mapa Vivo, o Tour Guiado e o Checklist de Descoberta como motor de ativacao e gamificacao, levando o usuario a experimentar leitura, devocional, quiz, IA e comunidade antes de encontrar uma oferta paga.

O modelo mais indicado e:

1. Gratis com Biblia, devocional, oracao basica, quiz basico, Mapa Vivo, Tour Guiado, Checklist e comunidade inicial.
2. Plus para estudo com IA, historico expandido, organizacao, progresso avancado e gamificacao mais rica.
3. Criador para arte, podcast, exportacoes e creditos de IA.
4. Igreja/Pastoral para salas, Culto+, equipe, relatorios agregados e gestao.
5. Creditos para recursos de custo variavel, sem misturar dinheiro com status espiritual.

Decisao de produto: o BibliaLM nao deve vender acesso a Deus, Biblia ou oracao essencial. Deve vender capacidade, profundidade, organizacao, criacao e gestao.

## Tese de monetizacao

O BibliaLM tem tres motores de valor:

1. Hábito espiritual: leitura, devocional, oracao, quiz, streaks e Mana.
2. Produtividade com IA: estudos, explicacoes, arte, podcast, exportacao e historico.
3. Organizacao pastoral: salas, Culto+, igreja, equipe, relatorios e acompanhamento.

Cada motor pode gerar receita de forma diferente:

| Motor | Usuario sente valor quando | Monetizacao indicada |
| --- | --- | --- |
| Habito espiritual | cria rotina e percebe progresso | Plus individual, anual e familia/grupo |
| Produtividade com IA | economiza tempo e cria material melhor | Plus, Criador e creditos |
| Organizacao pastoral | reduz trabalho da lideranca e organiza pessoas | Plano Igreja/Pastoral |

## Funil recomendado

```mermaid
flowchart LR
  A[Mapa Vivo] --> B[Tour Guiado por perfil]
  B --> C[Checklist de Descoberta]
  C --> D[Primeiro valor percebido]
  D --> E[Mana, streaks e badges]
  E --> F[Uso recorrente]
  F --> G[Limite contextual]
  G --> H[Assinatura ou creditos]
  H --> I[Mais capacidade e profundidade]
  I --> F
```

O paywall ideal aparece em "Limite contextual", nao na primeira tela. O usuario deve entender: "isso custa porque usa IA, armazenamento, exportacao, equipe ou gestao", nao "isso custa porque e espiritual".

## O que sera implementado

### Pacote 0 - Admin de monetizacao, Mana e perfis

Implementar:
- Central Admin para configurar planos, limites, permissoes, Mana, creditos e perfis.
- Editor de planos comerciais: Gratis, Plus, Criador, Igreja/Pastoral e futuros add-ons.
- Editor de matriz de permissoes por plano.
- Editor de limites por plano: IA, imagens, podcasts, analises, salas, membros, exportacoes e armazenamento.
- Editor de precos: mensal, anual, promocional, trial e desconto.
- Editor de Mana: pontos por acao, badges, niveis, streaks, desafios e limites anti-abuso.
- Gestao de perfis: plano atual, status, validade, creditos, Mana, badges, papel, igreja, bloqueios e historico administrativo.
- Auditoria de toda acao admin: quem alterou, quando, antes/depois e motivo.

Valor para o usuario:
- Planos mais claros e coerentes.
- Menos erros de acesso.
- Promocoes, trials e ajustes manuais sem depender de deploy.
- Suporte mais rapido quando houver problema de plano, creditos ou perfil.

Valor para o negocio:
- Permite operar assinatura sem mexer no codigo a cada mudanca.
- Controla custo de IA por limite e credito.
- Reduz risco de liberar premium por falha de configuracao.
- Cria base para teste A/B de preco, trial e paywall.

Estado atual no app:
- Ja existe uma rota Admin ativa em `views/AdminPage.tsx`.
- Ja existe gestao basica de usuarios com busca e troca manual de `subscriptionTier`.
- Ja existe matriz de permissoes por plano em `SystemSettings.featuresMatrix`.
- Ja existem configuracoes de precos em `SystemSettings.subscription.prices`.
- Ja existem configuracoes de Mana em `SystemSettings.gamification`.
- Ja existem limites gerais gratuitos em `SystemSettings.limits`.
- Ja existem creditos no perfil (`UserProfile.credits`) e Mana acumulado (`UserProfile.lifetimeXp`).
- Ja existem feature flags no Admin/Roadmap.

Lacunas atuais:
- O Admin ainda nao tem uma tela madura para editar Mana, badges, niveis e streaks.
- A troca manual de plano concede 30 dias fixos e nao pede motivo.
- O Admin de usuario ainda nao edita creditos, Mana, badges, status, papel, igreja ou bloqueios.
- A matriz de permissoes existe, mas precisa ser conectada de ponta a ponta ao paywall real.
- `AuthContext.checkFeatureAccess` ja respeita a matriz, mas cada recurso premium ainda precisa chamar essa verificacao nos pontos certos.
- O modal de assinatura ainda usa beneficios vindos de constantes, enquanto precos podem vir de settings; precisa haver uma fonte unica de verdade para planos.
- Ainda falta auditoria administrativa e logs especificos de mudancas financeiras/perfil.

### Pacote 1 - Ativacao gamificada

Implementar:
- Tour Guiado por perfil: visitante, membro, criador, pastor/lider.
- Checklist de Descoberta ligado ao Mapa Vivo.
- Primeiras recompensas: Mana, badge de primeiros passos e progresso visual.
- Eventos de analytics para medir ativacao.

Valor para o usuario:
- Entende rapidamente o app.
- Descobre recursos sem se perder.
- Sente progresso desde o primeiro uso.
- Cria primeira rotina.

Valor para o negocio:
- Aumenta retencao D1/D7.
- Melhora conversao futura porque o usuario ja experimentou valor.
- Mostra quais perfis e fluxos mais monetizam.

### Pacote 2 - Plus individual

Implementar:
- Plano Plus.
- Cadastro do plano no Admin com preco, limites, beneficios e permissoes.
- Limites gratuitos claros para IA.
- Paywall contextual apos uso real.
- Historico expandido.
- Estudos salvos e progresso avancado.
- Mana avancado, estatisticas e metas semanais.

Valor para o usuario:
- Estuda com mais profundidade.
- Organiza seu crescimento.
- Tem mais IA sem atrito.
- Percebe evolucao semanal.

Valor para o negocio:
- Cria MRR individual.
- Monetiza usuarios engajados.
- Reduz dependencia de vendas B2B no inicio.

### Pacote 3 - Criador + creditos

Implementar:
- Plano Criador ou add-on Criador.
- Configuracao no Admin de creditos inclusos por plano.
- Creditos mensais.
- Compra avulsa de creditos.
- Limites para imagem, podcast, audio e exportacoes.
- Templates criativos.

Valor para o usuario:
- Produz conteudo melhor para estudo, redes, igreja e aulas.
- Economiza tempo.
- Ganha qualidade de entrega.

Valor para o negocio:
- Controla custo variavel de IA.
- Aumenta ARPU de usuarios intensivos.
- Evita que um plano barato seja consumido por geracoes caras.

### Pacote 4 - Igreja/Pastoral

Implementar:
- Plano Igreja.
- Configuracao no Admin de limites por igreja, equipe e membros.
- Workspace Pastoral como centro pago.
- Criar salas com limites por plano.
- Culto+ com equipe.
- Relatorios agregados.
- Convites de membros.

Valor para o usuario:
- Pastor organiza ensino, culto e acompanhamento em um so lugar.
- Igreja ganha continuidade entre culto, sala e comunidade.
- Equipe pastoral economiza tempo operacional.

Valor para o negocio:
- Maior LTV.
- Receita menos dependente de uso individual.
- Possibilidade de expansao por igreja, celula e membro convidado.

### Pacote 5 - Comunidade e crescimento

Implementar:
- Desafios por igreja/celula.
- Badges coletivos.
- Ranking opcional por grupo pequeno.
- Indicacao com beneficio.
- Plano familia/grupo.

Valor para o usuario:
- Cresce com outras pessoas.
- Participa de jornadas coletivas.
- Transforma uso individual em discipulado.

Valor para o negocio:
- Aumenta aquisicao organica.
- Melhora retencao por grupo.
- Cria caminho natural para planos familia e igreja.

## Principais decisoes melhoradas

1. Nao comecar com hard paywall geral, apesar de ele converter melhor em muitos apps. Para o BibliaLM, o risco de percepcao espiritual e alto.
2. Usar paywall contextual em recursos de custo ou produtividade: IA, exportacao, historico, criacao, salas e relatorios.
3. Separar Mana de creditos. Mana mede constancia; credito paga capacidade tecnica.
4. Fazer gamificacao privada por padrao e social por escolha.
5. Tratar Igreja/Pastoral como produto premium principal no medio prazo.
6. Usar o Mapa Vivo como "sistema operacional de descoberta", nao apenas pagina informativa.
7. Fazer o Admin de monetizacao antes de ligar cobranca real, para que planos, limites e ajustes de suporte sejam operaveis sem deploy.

## Sinais de mercado considerados

- Benchmarks recentes da RevenueCat indicam que hard paywalls podem converter melhor que freemium em download-to-paid, mas isso precisa ser ponderado pelo contexto espiritual do BibliaLM.
- Apps de educacao e habito, como Duolingo, mostram que recorrencia, progresso e produto bem gamificado podem sustentar assinatura em escala.
- Apps espirituais como Hallow combinam camada gratuita, assinatura, trial, rotinas, streaks e conteudo profundo, o que reforca a estrategia de valor antes da venda.
- Modelos com familia/grupo e anual tendem a fazer sentido quando o produto cria rotina e compartilhamento.

## Admin: funcionalidades editaveis

### Planos e assinatura

O Admin deve permitir editar:
- Nome publico do plano.
- Identificador interno do plano.
- Descricao curta.
- Preco mensal.
- Preco anual.
- Percentual/texto de desconto anual.
- Status do plano: ativo, oculto, legado ou descontinuado.
- Plano recomendado.
- Beneficios exibidos no modal de assinatura.
- Limites de uso: chat, analise, imagem, podcast, audio, exportacao, estudos, salas, membros e armazenamento.
- Creditos inclusos por ciclo.
- Trial: ativo/inativo, dias, elegibilidade e mensagem.
- Promocao: ativa/inativa, titulo, descricao, cor, data de inicio/fim.
- Paywall copy: titulo, subtitulo, CTA e mensagem pastoral prudente.
- Recursos liberados por plano via matriz de permissoes.

Regra de produto:
Planos devem ter uma unica fonte de verdade. Preco, beneficio, limite e permissao nao devem ficar espalhados entre `constants.ts`, `SystemSettings` e componentes.

### Mana, badges e gamificacao

O Admin deve permitir editar:
- Mana por leitura de capitulo.
- Mana por meta diaria.
- Mana por devocional.
- Mana por estudo criado.
- Mana por compartilhar.
- Mana por marcar versiculo.
- Mana por criar imagem.
- Mana por usar chat.
- Mana por quiz completo.
- Mana por participacao no Reino.
- Limite diario de Mana por categoria.
- Multiplicadores de campanha.
- Badges: nome, descricao, icone, categoria, requisito, cor e status.
- Niveis: nome, faixa de Mana e mensagem de conquista.
- Streaks: criterios, tolerancia, pausa/descanso e recuperacao.
- Desafios: titulo, duracao, acoes validas, recompensa e publico.
- Regras anti-abuso: repeticao maxima, cooldown, revisao manual e anulacao.

Regra de produto:
Mana mede constancia e descoberta. Creditos medem capacidade tecnica paga. Um nao deve substituir o outro.

### Perfis e usuarios

O Admin deve permitir editar:
- Plano atual.
- Status da assinatura: ativa, inativa, trial, cancelada, suspensa.
- Data de validade.
- Motivo da alteracao manual.
- Creditos.
- Mana total.
- Badges concedidos/removidos.
- Papel: usuario, pastor, admin, suporte, moderador.
- Igreja vinculada.
- Grupo/celula vinculada.
- Visibilidade do perfil.
- Username e nome de exibicao, com trilha de auditoria.
- Bloqueio de postagem/comentario.
- Bloqueio de IA.
- Banimento temporario ou permanente.
- Reset de uso diario, quando necessario.
- Historico de pagamentos/checkout, quando integrado.
- Historico de acoes admin.

Regra de produto:
Toda alteracao manual em plano, credito, Mana, papel, bloqueio ou igreja deve registrar antes/depois, admin responsavel, horario e motivo.

### Igrejas e plano pastoral

O Admin deve permitir editar:
- Status da igreja: externa, reivindicada, verificada, suspensa.
- Plano da igreja.
- Validade do plano.
- Assentos/membros permitidos.
- Responsaveis e administradores.
- Equipe pastoral.
- Limites de salas, cultos, membros e relatorios.
- Recursos liberados no Workspace Pastoral.
- Solicitacoes de responsavel por igreja.

Regra de produto:
O plano Igreja/Pastoral deve ser operado como uma conta organizacional, nao apenas como assinatura de um usuario.

### FinOps e IA

O Admin deve permitir editar:
- Custo estimado por tipo de recurso.
- Creditos cobrados por imagem, podcast, audio, analise e exportacao.
- Limite diario gratuito.
- Limite por plano.
- Kill switch de IA.
- Alertas de custo.
- Relatorio por feature, usuario e plano.

Regra de produto:
Nenhum recurso de IA de custo variavel deve escalar sem limite operacional.

## 1. Objetivo

Criar um modelo de monetizacao que sustente o BibliaLM sem ferir sua missao: estudo biblico, oracao, comunidade, cuidado pastoral e criacao com IA.

A tese central: o BibliaLM deve monetizar conveniencia, profundidade, organizacao, capacidade de IA e recursos avancados; nao deve monetizar acesso basico a Biblia, oracao essencial ou participacao espiritual minima.

## 2. Hipotese principal

O melhor modelo inicial para o BibliaLM e um hibrido:

1. Freemium generoso para leitura biblica, devocional, quiz basico, oracao e comunidade.
2. Assinatura individual para IA, estudos avancados, historico, criacao, audio, arte e recursos de produtividade espiritual.
3. Plano familia/grupo para pequenos grupos, casais, discipulado e celulas.
4. Plano igreja/pastoral para salas, Culto+, acompanhamento, relatorios e gestao.
5. Creditos consumiveis para custos variaveis de IA, principalmente imagem, podcast, audio e geracoes pesadas.

Motivo: apps de assinatura convertem melhor com paywalls fortes, mas o BibliaLM tem missao espiritual, valor comunitario e necessidade de confianca. Um hard paywall inicial pode aumentar conversao de curto prazo, mas pode reduzir alcance, reputacao e compartilhamento. O caminho mais saudavel e entregar valor real primeiro e apresentar assinatura depois do "momento aha".

## 3. O que mais funciona no mercado

### 3.1 Hard paywall com trial

Como funciona:
O usuario instala, passa por onboarding, ve a promessa de valor e encontra uma tela de assinatura antes de usar plenamente.

Funciona melhor quando:
- O valor e facil de entender em segundos.
- O app resolve uma dor clara e urgente.
- O usuario ja veio com intencao de pagar.
- O produto nao depende de comunidade ou rede.

Risco para o BibliaLM:
Pode parecer "pagar para acessar algo espiritual", especialmente se aparecer antes de Biblia, oracao e devocional.

Uso recomendado:
Nao usar como porta principal. Testar apenas em fluxos premium muito claros, como "gerar podcast", "criar arte em alta qualidade", "plano pastoral da igreja" ou "estudo profundo com IA".

### 3.2 Freemium com upgrade contextual

Como funciona:
O usuario usa recursos essenciais gratis. O upgrade aparece quando ele encontra um limite natural.

Exemplos de limite natural:
- Mais geracoes de IA por dia.
- Salvar historico ilimitado.
- Exportar PDF, slides, podcast ou imagem em alta.
- Criar mais salas.
- Acessar analytics pastoral.
- Criar jornada com varios modulos.

Funciona melhor quando:
- O produto precisa criar habito.
- Existe conteudo gratuito de valor.
- O usuario precisa confiar antes de pagar.
- O app tem comunidade, compartilhamento ou missao.

Uso recomendado:
Modelo principal do BibliaLM.

### 3.3 Assinatura em camadas

Como funciona:
Planos diferentes para necessidades diferentes.

Modelo sugerido:

Plano Gratis:
- Biblia.
- Devocional.
- Quiz basico.
- Mapa Vivo.
- Tour Guiado inicial.
- Checklist de descoberta.
- Comunidade/Reino basico.
- Limite pequeno de IA.

Plano Plus:
- Mais IA para estudo e perguntas.
- Estudos salvos.
- Historico expandido.
- Quizzes personalizados.
- Mais recursos de criacao.
- Mana/XP com estatisticas pessoais.

Plano Criador:
- Arte sacra com mais qualidade.
- Podcast IA.
- Exportacoes.
- Templates.
- Biblioteca criativa.
- Mais creditos mensais.

Plano Igreja/Pastoral:
- Workspace Pastoral.
- Criar salas.
- Culto+.
- Gestao de oracoes.
- Equipe da igreja.
- Relatorios de engajamento.
- Biblioteca da igreja.

Plano Familia/Grupo:
- Perfis conectados.
- Desafios familiares.
- Checklist compartilhado.
- Quiz em grupo.
- Devocional em familia.

Uso recomendado:
Comecar com Gratis + Plus + Igreja. Criador e Familia podem entrar depois, quando houver dados.

### 3.4 Modelo hibrido: assinatura + creditos

Como funciona:
A assinatura da acesso recorrente, mas alguns recursos de custo variavel usam creditos.

Exemplos no BibliaLM:
- Gerar imagem.
- Gerar podcast.
- Gerar audio longo.
- Criar grande volume de estudos com IA.
- Exportar pacote de midia.

Regra saudavel:
Creditos devem comprar capacidade computacional, nao status espiritual.

Uso recomendado:
Essencial para controlar custo de IA sem criar planos caros demais.

### 3.5 Plano B2B para igrejas

Como funciona:
A igreja paga por recursos de gestao e formacao.

Valor percebido:
- Organizar ensino.
- Acompanhar membros.
- Criar salas.
- Preparar cultos.
- Distribuir estudos.
- Reduzir trabalho operacional do pastor.

Uso recomendado:
Provavelmente o maior LTV do BibliaLM no medio prazo. Deve ser vendido como ferramenta pastoral, nao como rede social.

## 4. Exemplos de referencia

### Duolingo

Aprendizado util para BibliaLM:
- Freemium forte.
- Assinatura remove friccoes e adiciona vantagens.
- Streaks, ligas, XP e metas criam habito diario.
- Crescimento vem de produto, comunidade e repeticao diaria.

Aplicacao no BibliaLM:
- Mana diario por leitura, oracao, quiz e estudo.
- Sequencias semanais.
- Metas leves.
- Desafios por tema biblico.
- Ranking opcional e por grupo, nao global agressivo.

### Hallow

Aprendizado util para BibliaLM:
- App espiritual pode ter assinatura se mantiver uma camada gratuita real.
- Conteudo premium, musica, jornadas guiadas e habito diario sustentam a assinatura.
- Acesso gratuito essencial reduz a percepcao de "paywall da fe".

Aplicacao no BibliaLM:
- Oracao, Biblia e devocional basicos sempre livres.
- Premium para jornadas profundas, audio, biblioteca guiada, trilhas devocionais premium e recursos de rotina.

### Spotify / YouTube

Aprendizado util:
- Gratis com limites ou friccao.
- Premium remove limites e melhora experiencia.
- Familia e estudante aumentam conversao por contexto.

Aplicacao no BibliaLM:
- Gratis com limites de IA.
- Plus com mais capacidade e historico.
- Familia/Grupo para discipulado e uso domestico.

### Strava / Fitbit

Aprendizado util:
- Progresso pessoal, desafios, conquistas e comunidade aumentam recorrencia.
- O valor pago vem de analise, comparacao e acompanhamento.

Aplicacao no BibliaLM:
- Progresso espiritual privado.
- Desafios por igreja/celula.
- Relatorios pastorais agregados.
- Metas de leitura e oracao.

## 5. Papel do Tour Guiado e Checklist de Descoberta

O Tour Guiado e o Checklist de Descoberta podem ser o primeiro motor de gamificacao do BibliaLM.

Eles nao devem ser apenas "tutorial". Devem funcionar como uma jornada de ativacao, descoberta e progressao.

### Tour Guiado

Objetivo:
Levar o usuario ao primeiro valor real em ate 5 minutos.

Fluxos por perfil:
- Visitante: ler Biblia, fazer quiz, abrir devocional, conhecer Mapa Vivo.
- Membro: salvar progresso, responder quiz, entrar no Reino, criar primeiro estudo.
- Criador: gerar conteudo, criar arte, transformar estudo em midia.
- Pastor/lider: criar sala, explorar Culto+, conhecer workspace.

Recompensa:
- Mana inicial.
- Badge "Primeiros Passos".
- Checklist desbloqueado.
- Sugestao de proximo passo.

Momento de monetizacao:
Apos concluir 3 a 5 passos e perceber valor. Exemplo: "Voce desbloqueou recursos avancados para continuar sua jornada com mais IA e organizacao."

### Checklist de Descoberta

Objetivo:
Transformar descoberta de funcionalidades em progresso visivel.

Exemplos de itens:
- Leia um capitulo.
- Complete o devocional.
- Faca um quiz.
- Salve um estudo.
- Crie uma arte.
- Entre no Reino.
- Participe de um pedido de oracao.
- Crie uma sala.

Recompensas:
- XP/Mana.
- Badges.
- Sequencia semanal.
- Desbloqueio de dicas.
- Cupom ou trial premium apos ativacao.

Monetizacao contextual:
Ao tentar completar itens premium, mostrar uma explicacao simples: "Este passo usa recursos avancados de IA. Continue com Plus."

## 6. Gamificacao recomendada para o BibliaLM

### Principios

1. Gamificacao deve servir a formacao espiritual, nao substituir maturidade por pontos.
2. XP nao compra autoridade espiritual.
3. Ranking deve ser opcional, preferencialmente por grupo pequeno.
4. Nao punir ausencia com culpa.
5. Celebrar constancia, retorno e aprendizado.
6. Separar Mana/XP de creditos pagos.

### Mecanicas recomendadas

Mana:
Pontuacao de progresso por acoes saudaveis.

Sequencia:
Contador de constancia em leitura, oracao ou estudo. Deve permitir "pausa de descanso" para evitar culpa.

Badges:
Marcos como "7 dias de leitura", "Primeiro estudo criado", "Intercessor", "Criador", "Disciplador".

Desafios:
Semanais, tematicos e por comunidade. Exemplo: "Semana de Provérbios", "7 dias de oracao pela familia".

Checklist:
Mapa de descoberta do app e de progresso espiritual.

Niveis:
Niveis pessoais: Aprendiz, Leitor, Intercessor, Criador, Disciplador. Evitar titulos que parecam hierarquia espiritual.

Conquistas de igreja:
Metricas agregadas, sem expor pessoas. Exemplo: "Nossa igreja completou 300 capitulos lidos esta semana."

### Mecanicas a evitar

- Comprar Mana com dinheiro.
- Ranking global de espiritualidade.
- Punicao dura por perder streak.
- Badges com linguagem de superioridade espiritual.
- Paywall em Biblia, oracao essencial ou devocional basico.
- Pressao emocional do tipo "Deus quer que voce assine".

## 7. Proposta de planos

### Gratis

Promessa:
Comece sua jornada biblica com leitura, devocional, quiz e comunidade.

Inclui:
- Biblia.
- Devocional.
- Quiz basico.
- Mapa Vivo.
- Tour Guiado.
- Checklist.
- Reino basico.
- IA limitada.
- Progresso simples.

### Plus

Promessa:
Estude com mais profundidade e mantenha sua rotina espiritual organizada.

Inclui:
- IA ampliada.
- Historico expandido.
- Estudos salvos.
- Quiz personalizado.
- Metas e estatisticas.
- Mana avancado.
- Exportacoes simples.

### Criador

Promessa:
Transforme estudos biblicos em conteudo, imagem e audio.

Inclui:
- Arte sacra com mais geracoes.
- Podcast IA.
- Templates.
- Biblioteca criativa.
- Exportacao em alta.
- Creditos mensais.

### Igreja

Promessa:
Organize ensino, culto e cuidado pastoral em um so lugar.

Inclui:
- Workspace Pastoral.
- Criar salas.
- Culto+.
- Gestao de oracoes.
- Equipe.
- Relatorios agregados.
- Biblioteca da igreja.
- Convites para membros.

## 8. Roadmap proposto

### Fase 1 - Fundacao admin, descoberta e ativacao

Objetivo:
Preparar a operacao de planos/Mana e medir ativacao antes de vender pesado.

Entregas de produto:
- Admin de monetizacao v1.
- Cadastro e edicao dos planos comerciais.
- Matriz de permissoes por plano conectada ao paywall real.
- Editor de regras de Mana por acao.
- Gestao basica de perfil: plano, status, validade, creditos e Mana.
- Auditoria minima de acoes admin.
- Tour Guiado por perfil.
- Checklist de Descoberta.
- Eventos de analytics.
- Mana basico.
- Limites claros de IA.
- Paywall contextual leve.

Metricas:
- Percentual de funcionalidades premium realmente protegidas pela matriz.
- Tempo para resolver ajuste manual de plano/perfil no suporte.
- Taxa de conclusao do tour.
- Primeiro valor em ate 5 minutos.
- Retencao D1, D7 e D30.
- Uso de IA por usuario.
- Cliques em upgrade.

### Fase 2 - Plus individual

Objetivo:
Validar assinatura pessoal.

Entregas:
- Plano Plus.
- Trial de 7 dias ou oferta apos ativacao.
- Limites de IA por plano.
- Precos e beneficios vindos do Admin como fonte unica de verdade.
- Tela admin para editar copy, beneficios, limites e preco do Plus.
- Historico expandido.
- Estudos salvos premium.
- Mana avancado.

Metricas:
- Conversao para trial.
- Conversao trial para pago.
- Churn no primeiro mes.
- Uso de recursos premium.
- Receita por usuario ativo.

### Fase 3 - Criador e creditos

Objetivo:
Monetizar recursos de custo variavel.

Entregas:
- Creditos mensais.
- Pacotes extras.
- Admin de creditos: conceder, remover, expirar e auditar creditos.
- Admin de custo por acao: imagem, podcast, audio, analise e exportacao.
- Arte e podcast com limites por plano.
- Exportacao premium.
- Templates de conteudo.

Metricas:
- Custo medio por usuario IA.
- Margem por plano.
- Compra de creditos.
- Uso de exportacao.
- Retencao de criadores.

### Fase 4 - Igreja/Pastoral

Objetivo:
Criar receita B2B e aumentar LTV.

Entregas:
- Plano Igreja.
- Admin de igrejas pagantes.
- Edicao de assentos, membros, equipe, responsaveis e validade.
- Upgrade/downgrade manual de igreja com auditoria.
- Equipe pastoral.
- Salas com membros.
- Relatorios agregados.
- Convites.
- Biblioteca da igreja.
- Beneficios para membros.

Metricas:
- Igrejas cadastradas.
- Conversao pastor para plano pago.
- Membros por igreja.
- Atividade por sala.
- Retencao mensal da igreja.

### Fase 5 - Comunidade e expansao

Objetivo:
Fazer a gamificacao alimentar comunidade e assinatura sem virar competicao toxica.

Entregas:
- Desafios por igreja.
- Badges de grupo.
- Ranking opcional por celula.
- Admin de campanhas de Mana e desafios sazonais.
- Moderacao de rankings e anulacao de pontuacao suspeita.
- Campanhas sazonais.
- Plano Familia/Grupo.

Metricas:
- Participacao em desafios.
- Convites enviados.
- Conversao por indicacao.
- Retencao de grupos.
- Engajamento no Reino.

## 9. Momentos de paywall recomendados

Baixa friccao:
- Ao exceder limite diario de IA.
- Ao exportar PDF, audio ou imagem em alta.
- Ao tentar criar muitos estudos.
- Ao salvar historico avancado.
- Ao criar mais salas.
- Ao acessar relatorio pastoral.

Boa mensagem:
"Este recurso usa IA avancada e armazenamento extra. O plano Plus ajuda voce a continuar com mais profundidade."

Mensagem a evitar:
"Assine para continuar sua vida espiritual."

## 10. Experimentos de preco

Nao definir preco definitivo sem teste. Comecar com faixas.

Hipoteses:
- Plus mensal acessivel.
- Plus anual com desconto forte.
- Igreja com preco por igreja ou por faixa de membros.
- Criador com assinatura + creditos.
- Trial curto apos Tour Guiado pode converter melhor que trial na primeira tela.

Experimentos:
- Trial de 7 dias vs sem trial com desconto anual.
- Paywall apos tour vs paywall apos limite de IA.
- Plano unico Plus vs Plus + Criador.
- Creditos inclusos vs creditos separados.
- Oferta anual no primeiro aha moment.

## 11. Metricas essenciais

Ativacao:
- Usuarios que completam Tour Guiado.
- Usuarios que completam 3 itens do Checklist.
- Primeiro estudo, primeira oracao, primeiro quiz, primeira criacao.

Engajamento:
- DAU/MAU.
- Sequencias ativas.
- Mana ganho por semana.
- Retencao D1/D7/D30.
- Participacao no Reino.

Monetizacao:
- Trial start rate.
- Trial-to-paid.
- Free-to-paid.
- ARPDAU.
- MRR.
- Churn.
- LTV.
- Custo de IA por usuario.
- Margem por plano.

Pastoral/B2B:
- Igrejas ativas.
- Salas criadas.
- Membros convidados.
- Cultos publicados.
- Retencao de igrejas.

## 12. Recomendacao final

O caminho mais forte para o BibliaLM e:

1. Manter Biblia, devocional, oracao basica, quiz basico e comunidade inicial livres.
2. Usar Tour Guiado e Checklist para criar ativacao e habito.
3. Introduzir Mana como progresso pessoal, nao como moeda espiritual.
4. Monetizar IA, criacao, historico, exportacao e organizacao.
5. Separar assinatura de creditos de IA.
6. Criar plano Igreja como produto de maior valor no medio prazo.
7. Evitar paywall agressivo antes do usuario experimentar valor real.

Frase guia:
O BibliaLM nao vende acesso a Deus; vende ferramentas para estudar melhor, organizar melhor, criar melhor e servir melhor.

## 13. Criterios de sucesso

O roadmap deve ser considerado bem-sucedido se produzir estes sinais:

1. Mais usuarios completando o primeiro ciclo: ler, orar, fazer quiz, explorar Mapa Vivo e usar IA.
2. Mais usuarios retornando semanalmente por causa de progresso, checklist e Mana.
3. Conversao para Plus acontecendo apos uso real, nao por bloqueio frio.
4. Custo de IA controlado por limites e creditos.
5. Plano Igreja gerando receita previsivel e uso recorrente de salas, Culto+ e relatorios.
6. Gamificacao aumentando constancia sem criar culpa, competicao espiritual ou exibicionismo.
7. Admin consegue alterar plano, limite, credito e Mana sem deploy.
8. Toda alteracao sensivel no Admin possui auditoria.
9. A matriz de permissoes bloqueia/libera recursos de forma real no app.

Meta qualitativa:
O usuario deve sentir que a assinatura amplia sua capacidade de estudar, criar e servir; nao que bloqueia sua vida espiritual.

## 14. Perguntas em aberto

1. O plano Plus deve incluir Criador ou Criador deve ser separado?
2. Qual limite gratuito de IA e suficiente para gerar valor sem estourar custo?
3. O plano Igreja sera por igreja, por pastor ou por membro ativo?
4. Mana deve aparecer publicamente ou ser majoritariamente privado?
5. O Tour Guiado deve perguntar perfil logo no inicio ou inferir pelo comportamento?
6. Havera bolsas/descontos para pastores, missionarios ou igrejas pequenas?
7. Quais papeis administrativos devem existir alem de admin total: suporte, financeiro, moderador, conteudo, igreja?
8. O Admin pode ajustar Mana manualmente ou apenas conceder/reverter eventos auditados?
9. Creditos devem expirar mensalmente ou acumular?
10. Planos atuais bronze/silver/gold serao mantidos, renomeados para Plus/Criador/Igreja ou migrados gradualmente?
11. Plano pastoral sera um `subscriptionTier` de usuario ou uma assinatura organizacional vinculada a igreja?

## 15. Fontes consultadas e aprendizados

- RevenueCat, State of Subscription Apps 2026: https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/
  - Aprendizado: hard paywalls podem converter muito melhor que freemium em download-to-paid, mas a estrategia precisa considerar categoria, confianca e percepcao de valor.
- RevenueCat, benchmarks 2026 por categoria: https://www.revenuecat.com/state-of-subscription-apps/
  - Aprendizado: educacao e utilidade performam bem em trials quando o valor e entendido rapidamente; BibliaLM deve medir ativacao antes de paywall forte.
- RevenueCat, guia de gamificacao em apps: https://www.revenuecat.com/blog/growth/gamification-in-apps-complete-guide/
  - Aprendizado: gamificacao funciona melhor quando reforca metas reais do usuario, nao quando vira distracao.
- Adjust, subscription app monetization guide: https://www.adjust.com/resources/guides/subscription-apps/
- Duolingo Investor Relations: https://investors.duolingo.com/investor-relations
  - Aprendizado: rotina, progresso, produto gamificado e assinatura podem coexistir em escala quando o uso diario e forte.
- Duolingo FY 2025 Results: https://investors.duolingo.com/news-releases/news-release-details/duolingo-reports-fourth-quarter-and-full-year-2025-results
  - Aprendizado: Duolingo passou de 50 milhoes de usuarios ativos diarios e US$ 1 bilhao em bookings em 2025, reforcando o poder de habito + assinatura.
- Hallow, versao gratuita e assinatura: https://help.hallow.com/en/articles/2880438-how-much-does-the-subscription-cost
  - Aprendizado: app espiritual pode ter assinatura, trial e plano familia, desde que preserve acesso gratuito real.
- Hallow, recursos de habito e streaks: https://hallow.com/features/
  - Aprendizado: lembretes, metas, streaks e diario ajudam a transformar uso espiritual em rotina, com cuidado pastoral de linguagem.
