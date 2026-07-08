# Roadmap de expansao do Mana, niveis e rankings

Status: implementado no app; migration Supabase pronta para aplicacao
Data: 2026-06-11
Relacionado: `docs/roadmaps/monetizacao-assinatura-gamificacao-biblialm.md`

## 0. Implementacao v2.3.0

Entregue em 2026-06-12:

- Fonte unica de regras em `utils/activityRules.ts`.
- Servico de apoio em `services/gamificationService.ts`.
- Persistencia auditavel preparada em `mana_events`, com `scripts/create_mana_gamification.sql`.
- Niveis de usuario, pastor e igreja semeados na migration.
- Funcao SQL `refresh_church_gamification_snapshot(period_key)` para snapshots de igreja.
- Rota `/competicao` com progresso pessoal, checklist diario, regras, desafios ativos e rankings.
- Ranking global de usuarios via `profiles.lifetime_xp`.
- Ranking de igrejas via `church_gamification_snapshots` quando a migration estiver aplicada.
- Admin com editor de valores de Mana, campanhas/temporadas e auditoria de eventos em revisao.
- Eventos explicitos para comentarios, convites, mencoes e comentarios de jornada.
- `ManaNudge` contextual na Home.
- Mapa Vivo atualizado com Central de Competicao e Auditoria Mana.

Observacao operacional:
- A camada app funciona com fallback seguro antes da migration.
- Para auditoria persistente, ranking de igrejas e snapshots reais, aplicar `scripts/create_mana_gamification.sql` no Supabase.

## 1. Objetivo

Expandir o sistema de Mana do BibliaLM para deixar claro:

1. Quais funcionalidades geram Mana.
2. Quais regras, limites e protecoes anti-abuso se aplicam.
3. Quais niveis, metas e selos existem para usuarios, pastores e igrejas.
4. Como uma igreja acompanha seu ranking interno e seu ranking global entre igrejas.
5. Onde o usuario, pastor e admin visualizam indicadores, progresso e competicao.

A meta e transformar Mana em um sistema confiavel de constancia, participacao e descoberta, sem virar uma competicao espiritual toxica.

## 2. Estado atual confirmado no app

O app ja possui uma base funcional:

- `recordActivity` em `contexts/AuthContext.tsx` registra atividade, soma `lifetimeXp`, salva `activityLog` e atualiza badges de nivel.
- `utils/activityRules.ts` centraliza parte da regra de XP por acao.
- `profiles.lifetime_xp`, `profiles.activity_log`, `profiles.badges`, `profiles.stats` e `profiles.usage_today` existem no schema.
- `settings.global.gamification` guarda valores configuraveis de Mana por acao.
- Admin ja permite editar valores de Mana por acao em `views/AdminPage.tsx`.
- Existem pontos de chamada em leitura, devocional, chat, Obreiro IA, quiz, estudo, arte, notas, compartilhamento, Reino, Culto+ e planos/salas.
- Existe ranking global de usuarios por `lifetime_xp` em `dbService.getGlobalRanking`.
- A estrutura de convites ja existe para grupos privados (`group_access_invites`) e conteudos/salas por convite (`content_access_invites`).
- Compartilhamentos ja existem como metrica em posts, estudos e salas por `shares_count`/`metrics.shares`.
- Comentarios ja existem para posts do Reino (`post_comments`) e para aulas/dias de planos/salas (`plan_comments`).
- Marcacao com `@usuario` ja existe em grupo privado como mecanismo de convite por mencao (`source = mention`).

## 3. Lacunas atuais

### Regras incompletas

- Nem todas as `ActionType` possuem valor proprio em `ACTION_XP_SETTING`.
- Acoes nao mapeadas caem em 1 Mana por padrao.
- Alguns fluxos passam `xpGained` manualmente, criando risco de valores divergentes.
- Ainda nao existe limite diario por categoria.
- Ainda nao existe cooldown por acao repetida.
- Ainda nao existe regra clara para evitar farm de Mana.

### Estatisticas incompletas

- `lifetimeXp` e `activityLog` sao atualizados, mas `stats` nem sempre acompanha a acao.
- Badges de nivel sao tratados, mas badges por conquista, streak e papel ainda nao estao completos.
- Ranking de usuarios existe, mas ranking de igreja, pastor e celula ainda precisa de agregacao.
- Convites, marcacoes, comentarios e compartilhamentos ainda nao possuem uma regra completa e padronizada de Mana/badges.
- Comentario em sala/plano ja pode gerar Mana como `social_interaction`, mas comentario em post do Reino salva comentario sem registrar atividade de Mana no componente atual.
- Convite aceito, convite enviado e mencao com `@` ainda precisam de decisao explicita: gerar Mana para quem convidou, para quem aceitou, para ambos ou apenas badge.

### Produto incompleto

- Niveis atuais parecem focados no usuario individual.
- Pastor precisa de progressao propria ligada a cuidado, ensino, salas e acompanhamento.
- Igreja precisa de pontuacao agregada, ranking interno e ranking global.
- Falta uma pagina unica de indicadores e competicao.

## 4. Principios de produto

1. Mana mede constancia, participacao e descoberta.
2. Mana nao compra autoridade espiritual.
3. Ranking global individual deve ser discreto e opcional.
4. Ranking de igreja deve usar metricas agregadas, sem expor dados sensiveis.
5. Igrejas pequenas nao devem ser esmagadas por igrejas grandes; rankings devem ter visao absoluta e proporcional.
6. Pastor deve ser reconhecido por cuidado e organizacao, nao por volume artificial.
7. Toda regra de Mana deve ser explicavel ao usuario.
8. Toda concessao automatica deve ter trilha auditavel.

## 5. Modelo de entidades

### Usuario

Representa a jornada pessoal.

Indicadores:
- Mana total.
- Mana semanal.
- Sequencia/streak.
- Capitulos lidos.
- Devocionais concluidos.
- Estudos criados.
- Quiz completos.
- Oracoes/intercessoes.
- Participacao no Reino.
- Selos pessoais.

### Pastor/lider

Representa cuidado, ensino e lideranca.

Indicadores:
- Salas criadas.
- Planos publicados.
- Cultos organizados.
- Membros acompanhados.
- Respostas/interacoes pastorais.
- Estudos ou materiais publicados.
- Engajamento medio das salas.
- Selos pastorais.

### Igreja

Representa atividade agregada da comunidade.

Indicadores:
- Mana total da igreja.
- Mana semanal da igreja.
- Membros ativos.
- Capitulos lidos pela igreja.
- Devocionais concluidos.
- Oracoes publicadas/intercedidas.
- Participacao em salas.
- Cultos com check-in/interacao.
- Desafios concluidos.
- Selos coletivos.

### Celula/grupo

Representa subcomunidades dentro da igreja.

Indicadores:
- Mana do grupo.
- Membros ativos.
- Progresso em planos.
- Participacao em desafios.
- Ranking interno da igreja.

## 6. Niveis propostos

### Niveis de usuario

Evitar nomes que parecam hierarquia espiritual. Sugestao:

| Nivel | Faixa de Mana | Foco |
| --- | ---: | --- |
| Visitante em Jornada | 0-99 | Primeiros passos |
| Leitor Constante | 100-499 | Leitura e devocional |
| Aprendiz da Palavra | 500-1.499 | Estudo e quiz |
| Intercessor Ativo | 1.500-3.999 | Oracao e comunidade |
| Servo da Comunidade | 4.000-9.999 | Participacao e apoio |
| Disciplador Digital | 10.000+ | Constancia ampla |

### Niveis de pastor/lider

Baseados em organizacao pastoral e cuidado.

| Nivel | Criterio principal | Foco |
| --- | --- | --- |
| Lider em Formacao | Primeira sala ou plano | Inicio pastoral |
| Mentor de Grupo | Grupo ativo com membros | Discipulado |
| Organizador Pastoral | Cultos/salas recorrentes | Rotina de cuidado |
| Guardiao da Jornada | Membros acompanhados com constancia | Acompanhamento |
| Mestre de Trilhas | Conteudos e planos consistentes | Ensino |
| Referencia Pastoral | Alta retencao e engajamento | Maturidade operacional |

### Niveis de igreja

Baseados em engajamento agregado.

| Nivel | Criterio principal | Foco |
| --- | --- | --- |
| Igreja Conectada | Perfil e membros iniciais | Entrada |
| Comunidade Ativa | Membros ativos na semana | Uso recorrente |
| Casa de Oracao | Oracoes e intercessoes | Cuidado |
| Escola da Palavra | Leitura, estudos e salas | Ensino |
| Igreja em Missao | Participacao social e desafios | Comunidade |
| Rede de Discipulado | Engajamento sustentado | Maturidade |

## 7. Selos propostos

### Selos de usuario

- Primeiro Capitulo.
- Primeiro Devocional.
- Primeiro Amen.
- Primeiro Estudo.
- Primeiro Quiz.
- Primeira Intercessao.
- Primeira Publicacao.
- 7 Dias de Constancia.
- 30 Dias de Constancia.
- Leitor dos Evangelhos.
- Explorador do App.
- Primeiro Compartilhamento.
- Voz que Edifica: primeiro comentario no Reino, grupo ou igreja.
- Conector: primeiro convite enviado.
- Bem-vindo a Bordo: primeiro convite aceito.
- Ponte de Comunhao: 5 convites aceitos.
- Semeador Digital: 10 compartilhamentos validos.
- Palavra Marcada: primeira mencao `@usuario` valida no Reino/grupo.
- Conversa Edificante: 10 comentarios validos.
- Pacificador: comentarios consistentes sem denuncias/moderacao.

### Selos de pastor/lider

- Primeira Sala Criada.
- Primeiro Plano Publicado.
- Primeiro Culto Organizado.
- Mentor de 10 Pessoas.
- Mentor de 50 Pessoas.
- Sala com 70% de Conclusao.
- Cuidado Pastoral Ativo.
- Biblioteca Pastoral Viva.
- Anfitriao de Sala: 5 convites aceitos para uma sala/grupo.
- Mobilizador Pastoral: 25 convites aceitos em conteudos, grupos ou salas.
- Conversas que Cuidam: comentarios pastorais recorrentes em grupos/salas.
- Igreja Conectada: membros marcados com `@` e engajados em uma jornada.

### Selos de igreja

- Igreja Verificada.
- 10 Membros Ativos.
- 100 Capitulos Lidos.
- 500 Intercessoes.
- Semana de Oracao Concluida.
- Desafio Biblico Concluido.
- Comunidade em Movimento.
- Igreja Discipuladora.
- Igreja que Convida: 25 convites aceitos.
- Igreja Compartilhadora: 100 compartilhamentos validos de estudos, salas ou posts.
- Comunidade em Dialogo: 250 comentarios validos em grupos, salas ou mural.
- Rede de Comunhao: 50 mencoes `@usuario` que geraram interacao ou convite aceito.
- Ponte Aberta: 10 novos membros vindos por convite.

## 8. Regras de Mana por funcionalidade

### Auditoria obrigatoria

Criar uma matriz de auditoria com todas as funcionalidades do app:

| Area | Funcionalidade | ActionType | Gera Mana? | Regra | Limite | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Biblia | Ler capitulo | `reading_chapter` | Sim | Por capitulo concluido | 1x por capitulo/dia | Parcial |
| Biblia | Marcar versiculo | `mark_verse` | Sim | Baixo valor | Limite diario | Parcial |
| Devocional | Concluir devocional | `devotional` | Sim | 1x por dia | 1x/dia | Parcial |
| IA | Usar chat | `use_chat` | Sim | Por conversa valida | Limite diario | Parcial |
| Estudos | Criar estudo | `create_study` | Sim | Por estudo salvo | Cooldown | Parcial |
| Sermoes | Criar sermao | `create_sermon` | Sim | Por sermao salvo | Cooldown | Parcial |
| Arte | Criar imagem | `create_image` | Sim | Por geracao concluida | Limite por plano | Parcial |
| Social | Compartilhar | `share_content` | Sim | Baixo valor | Limite diario | Parcial |
| Social | Postar no Reino | `social_post` | Sim | Participacao | Limite diario | Pendente regra propria |
| Social | Curtir/reagir | `social_like` | Sim | Muito baixo valor | Limite diario | Pendente regra propria |
| Social | Comentar post do Reino | Novo `social_comment` ou `social_interaction` | Sim | Comentario valido | Limite diario + tamanho minimo | Estrutura existe, gamificacao pendente |
| Social | Marcar `@usuario` | Novo `social_mention` ou `invite_sent` | Sim/Badge | Mencao valida que notifica ou convida | Limite diario + anti-spam | Parcial em grupos privados |
| Social | Convite enviado | Novo `invite_sent` | Badge/baixo Mana | Convite unico enviado | Limite diario | Estrutura existe |
| Social | Convite aceito | Novo `invite_accepted` | Sim | Recompensa maior ao aceite | 1x por convite | Estrutura existe |
| Oracao | Pedido/intercessao | `prayer_wall` | Sim | Por acao valida | Limite diario | Pendente regra propria |
| Planos | Entrar em plano | `join_plan` | Sim | 1x por plano | 1x por plano | Pendente regra propria |
| Planos | Concluir etapa | `daily_goal` ou novo tipo | Sim | Por etapa concluida | 1x por etapa | Parcial |
| Planos/Salas | Comentar aula/dia | `social_interaction` ou novo `plan_comment` | Sim | Comentario valido | Limite diario + tamanho minimo | Parcial |
| Planos/Salas | Compartilhar sala no Reino | `social_post` + `share_content` | Sim | Compartilhamento valido | Cooldown por sala | Parcial |
| Igreja/Grupo | Comentar no grupo/igreja | Novo `church_comment`/`group_comment` ou `social_interaction` | Sim | Participacao comunitaria | Limite diario | Pendente |
| Quiz | Completar quiz | `quiz_completion` | Sim | Por desempenho | Anti-repeticao | Parcial |
| Culto+ | Check-in/interacao | `social_interaction` | Sim | Por evento valido | 1x por culto/tipo | Pendente regra propria |

### Regra tecnica

Toda funcionalidade relevante deve chamar um servico central, nao somar Mana diretamente no componente.

Recomendacao:
- Evoluir `utils/activityRules.ts` para uma matriz completa.
- Criar `services/gamificationService.ts`.
- Criar uma Edge Function/RPC para validar e conceder Mana no backend.
- Registrar cada concessao em uma tabela `mana_events`.
- Atualizar `profiles.lifetime_xp` por agregacao segura.
- Adicionar `ActionType` explicitos para convites, comentarios e mencoes, evitando tratar tudo como `social_interaction`.

ActionTypes recomendados:
- `invite_sent`
- `invite_accepted`
- `social_comment`
- `social_mention`
- `group_comment`
- `church_comment`
- `content_share`

## 9. Regras anti-abuso

### Limites por acao

- Leitura de capitulo: 1 concessao por usuario/capitulo/dia.
- Devocional: 1 concessao por usuario/dia.
- Chat IA: limite diario de eventos com Mana.
- Marcar versiculo: limite baixo por dia.
- Compartilhar: limite por conteudo e por dia.
- Convite enviado: contar pouco ou apenas badge; evitar farm por envio em massa.
- Convite aceito: contar mais que convite enviado, pois representa engajamento real.
- Mencao com `@`: contar apenas se gerar notificacao valida, convite aceito ou interacao posterior.
- Comentario: exigir tamanho minimo, limite diario e nao contar comentarios repetidos/emoji-only em excesso.
- Reacoes/likes: limite baixo e sem recompensa infinita.
- Quiz: Mana reduzido ao repetir mesmo tema/quiz.
- Post social: exigir conteudo minimo e limite diario.
- Oracao/intercessao: limite diario e protecao contra repeticao.
- Culto+: 1 check-in por culto.

### Penalidades e moderacao

- Evento suspeito fica marcado como `review`.
- Admin pode anular evento de Mana com motivo.
- Ranking deve ignorar eventos anulados.
- Usuario nunca deve perder acesso espiritual por moderacao de Mana.

## 10. Ranking de igreja

### Ranking interno da igreja

Mostra a competicao saudavel dentro da igreja.

Visoes:
- Ranking de membros por Mana semanal.
- Ranking de celulas/grupos.
- Ranking por desafio ativo.
- Top intercessores.
- Top leitores.
- Top participantes de sala.

Cuidados:
- Permitir anonimato ou apelido.
- Mostrar ranking por periodo, nao apenas total historico.
- Permitir que pastor desligue ranking individual.

### Ranking global entre igrejas

Mostra igrejas em comparacao com outras.

Visoes:
- Ranking global por Mana total semanal.
- Ranking por crescimento percentual.
- Ranking por membros ativos.
- Ranking por media de Mana por membro ativo.
- Ranking por desafios concluidos.

Regra importante:
Igrejas grandes devem ter ranking absoluto e ranking proporcional. Caso contrario, uma igreja pequena nunca compete.

## 11. Pagina de indicadores e competicao

Criar uma pagina dedicada, sugestao de rota:

- `/competicao`
- Alternativa: `/mana`
- Alternativa admin/pastoral: `/workspace-pastoral/competicao`

### Publicos da pagina

Usuario comum:
- Meu Mana.
- Meu nivel.
- Proximo nivel.
- Meus selos.
- Minhas metas da semana.
- Minha posicao na igreja, se habilitado.
- Desafios ativos.

Pastor/lider:
- Indicadores da igreja.
- Ranking interno.
- Ranking por celula.
- Desafios ativos.
- Membros mais engajados.
- Membros em queda de atividade.
- Selos da igreja.

Admin:
- Ranking global de igrejas.
- Ranking global de usuarios.
- Eventos suspeitos.
- Configuracao de campanhas.
- Saude do sistema de Mana.

### Blocos da pagina

1. Cabecalho de temporada
   - Temporada atual.
   - Datas.
   - Regras resumidas.
   - Premio simbolico ou selo.

2. Meu progresso
   - Mana total.
   - Mana semanal.
   - Nivel atual.
   - Proximo nivel.
   - Streak.
   - Selos recentes.

3. Minha igreja
   - Mana da igreja.
   - Membros ativos.
   - Posicao global.
   - Posicao proporcional.
   - Crescimento semanal.

4. Ranking interno
   - Membros.
   - Celulas/grupos.
   - Categorias: leitura, oracao, estudo, quiz, participacao.

5. Ranking global entre igrejas
   - Absoluto.
   - Proporcional.
   - Por desafio.
   - Por crescimento.

6. Desafios ativos
   - Titulo.
   - Periodo.
   - Regras.
   - Progresso.
   - Recompensa.

7. Como ganhar Mana
   - Lista clara das acoes.
   - Limites diarios.
   - O que nao gera Mana.

## 12. Estimulos ao ganho de Mana no app

O sistema de Mana nao deve ficar escondido apenas na pagina de competicao. O app precisa espalhar sinais leves, contextuais e nao invasivos para ajudar o usuario a entender o que fazer agora para progredir.

### Principio de experiencia

O estimulo deve responder tres perguntas:

1. O que eu posso fazer agora?
2. Quanto isso ajuda meu progresso?
3. Por que essa acao e saudavel para minha jornada?

Evitar:
- Popups excessivos.
- Pressao emocional.
- Linguagem de culpa.
- Competicao espiritual agressiva.
- Mensagens que parecam "faca isso so para ganhar ponto".

Preferir:
- Sugestoes curtas.
- Proximas acoes naturais.
- Recompensas visuais discretas.
- Explicacao clara de limite diario.
- Celebracao de constancia.

### Pontos de estimulo por tela

| Area | Estimulo recomendado | Exemplo de mensagem | Acao |
| --- | --- | --- | --- |
| Home/Inicio | Card "Ganhe Mana hoje" | Complete 2 acoes simples para manter sua jornada ativa. | Abrir checklist diario |
| Perfil | Proximo nivel | Faltam 35 Mana para Leitor Constante. | Ver como ganhar |
| Historico | Contexto da atividade | Esta acao gerou 15 Mana. | Ver regras |
| Biblia | CTA apos leitura | Marque este capitulo como lido e avance sua jornada. | Concluir capitulo |
| Devocional | Confirmacao suave | Concluir o devocional de hoje fortalece sua sequencia. | Concluir devocional |
| Quiz | Recompensa antecipada | Complete o desafio e ganhe Mana conforme seu desempenho. | Iniciar quiz |
| Reino/Social | Sugestao comunitaria | Interaja com uma oracao ou compartilhe uma reflexao. | Abrir Reino |
| Oracao | Estimulo pastoral | Interceder tambem conta como participacao da comunidade. | Interceder |
| Criacao com IA | Aviso de valor | Criar um estudo salvo tambem registra progresso. | Criar estudo |
| Planos/Salas | Progresso coletivo | Concluir a etapa ajuda voce e sua sala. | Continuar plano |
| Planos/Salas | Convite contextual | Convide alguem para caminhar com voce nesta sala. | Convidar membro |
| Grupos/Igreja | Comentario edificante | Responda alguem com uma palavra de encorajamento. | Comentar |
| Reino | Marcacao saudavel | Marque alguem quando a reflexao puder edificar essa pessoa. | Mencionar `@usuario` |
| Conteudo | Compartilhamento | Compartilhe um estudo ou sala com alguem que pode se beneficiar. | Compartilhar |
| Igreja | Indicador coletivo | Sua igreja esta a 120 Mana do proximo selo coletivo. | Ver desafio |
| Competicao | Central de regras | Veja as formas validas de ganhar Mana esta semana. | Ver regras |

### Componentes sugeridos

#### `ManaNudge`

Pequeno bloco contextual para sugerir a proxima acao.

Usos:
- Home.
- Perfil.
- Pagina de leitura.
- Devocional.
- Quiz.
- Workspace Pastoral.

Estados:
- Acao disponivel.
- Acao ja concluida hoje.
- Limite diario atingido.
- Proximo nivel perto.
- Desafio ativo.

#### `ManaRewardToast`

Feedback apos uma acao gerar Mana.

Conteudo:
- Valor ganho.
- Acao realizada.
- Progresso para o proximo nivel.
- Badge desbloqueado, se houver.

Regra:
Nao mostrar para toda microacao se isso causar fadiga. Para acoes muito frequentes, agrupar ou mostrar feedback discreto.

#### `ManaDailyChecklist`

Lista curta de 3 a 5 acoes diarias.

Exemplo:
- Ler um capitulo.
- Concluir devocional.
- Fazer um quiz.
- Interceder por um pedido.
- Continuar uma sala/plano.

Cada item deve indicar:
- Status.
- Mana possivel.
- Limite diario.
- Link direto para a acao.

#### `ManaRulesDrawer`

Painel explicativo acessivel a partir de Home, Perfil, Historico e Competicao.

Conteudo:
- Como ganhar Mana.
- Limites diarios.
- O que nao gera Mana.
- Por que algumas repeticoes nao contam.
- Diferenca entre Mana e creditos.

#### `NextBestManaAction`

Motor simples para sugerir a melhor proxima acao com base no perfil.

Prioridade inicial:
1. Acao essencial ainda nao feita hoje: devocional, leitura ou oracao.
2. Acao de continuidade: plano/sala em andamento.
3. Acao de descoberta: quiz, Reino, estudo, arte.
4. Acao coletiva: desafio da igreja.
5. Acao de retorno: retomar onde parou.

### Tecnicas de estimulo

#### Meta diaria leve

Definir uma meta simples de Mana diario ou de acoes diarias.

Exemplo:
- 3 acoes por dia.
- 50 Mana por dia.
- 5 dias ativos na semana.

Cuidados:
- Permitir descanso.
- Nao punir ausencia com linguagem pesada.
- Mostrar retomada com encorajamento.

#### Progresso ate o proximo nivel

Mostrar barra de progresso em locais de alta visibilidade.

Locais:
- Header ou Home.
- Perfil.
- Pagina de competicao.
- Modal de conquista.

Mensagem:
- "Faltam 20 Mana para o proximo nivel."
- "Voce ja completou 70% da meta semanal."

#### Missao diaria

Criar pequenas missoes rotativas.

Exemplos:
- Leia 1 capitulo de Salmos.
- Interceda por 1 pedido.
- Complete 1 quiz.
- Continue sua sala.
- Compartilhe uma reflexao.
- Convide uma pessoa para uma sala.
- Comente em uma publicacao da sua igreja.
- Marque alguem com `@` em uma reflexao realmente relevante.

Regra:
Missoes devem ser ligadas a acoes saudaveis, nao a volume artificial.

#### Desafios semanais

Desafios com tema e periodo.

Exemplos:
- Semana de Proverbios.
- 7 dias de oracao pela familia.
- Igreja em leitura.
- Desafio de gratidao.

Recompensas:
- Mana bonus limitado.
- Selo de participacao.
- Selo coletivo da igreja.

#### Sugestao contextual apos concluir acao

Depois de uma acao, sugerir uma proxima etapa.

Exemplos:
- Apos leitura: "Quer registrar uma nota sobre esse capitulo?"
- Apos devocional: "Ore por alguem hoje."
- Apos quiz: "Compartilhe seu resultado com sua igreja."
- Apos criar estudo: "Publique no Reino ou envie para sua sala."

#### Temporadas

Criar periodos com tema e ranking proprio.

Exemplo:
- Temporada: Caminho dos Evangelhos.
- Duracao: 30 dias.
- Pontos contam para ranking semanal e selo final.

Cuidados:
- Ranking historico nao deve apagar o progresso pessoal.
- Temporada deve incentivar retorno, nao ansiedade.

#### Selos proximos

Mostrar selos quase desbloqueados.

Exemplo:
- "Falta 1 devocional para desbloquear Coração Devoto."
- "Sua igreja esta a 8 intercessoes do selo Casa de Oracao."
- "Faltam 2 convites aceitos para o selo Ponte de Comunhao."
- "Faltam 3 comentarios validos para o selo Conversa Edificante."

#### Recuperacao de inatividade

Quando o usuario retorna depois de alguns dias, sugerir retomada simples.

Exemplo:
- "Bom te ver de volta. Comece com uma leitura curta hoje."

Regra:
Nao usar culpa por streak perdido.

### Regras para nao poluir a interface

- No maximo um estimulo principal por tela.
- Evitar varios cards de Mana competindo com a funcao principal da pagina.
- Priorizar texto curto e acao direta.
- Esconder estimulos ja concluidos.
- Mostrar detalhes completos apenas no `ManaRulesDrawer` ou pagina `/competicao`.
- Permitir que o usuario reduza notificacoes de gamificacao.

### Eventos e metricas de estimulo

Medir:
- Visualizacao de nudge.
- Clique no nudge.
- Acao concluida apos nudge.
- Mana ganho por origem.
- Missoes diarias concluidas.
- Retencao de usuarios que veem checklist.
- Usuarios que desativam ou ignoram estimulos.

Eventos sugeridos:
- `mana_nudge_viewed`
- `mana_nudge_clicked`
- `mana_daily_checklist_completed`
- `mana_reward_seen`
- `mana_rules_opened`
- `mana_next_action_completed`

### Criterios de aceite

- Home mostra pelo menos uma proxima acao clara para ganhar Mana.
- Perfil mostra proximo nivel e caminho para saber como ganhar Mana.
- Historico mostra quanto Mana cada atividade gerou.
- Competicao tem painel completo "Como ganhar Mana".
- Leitura, devocional, quiz e oracao possuem feedback de progresso.
- Igreja mostra progresso para selo coletivo ou desafio ativo.
- Usuario entende Mana sem precisar perguntar ao suporte.

## 13. Estrutura de dados recomendada

### `mana_events`

Evento imutavel de concessao.

Campos:
- `id`
- `user_id`
- `church_id`
- `group_id`
- `actor_role`
- `action_type`
- `source_type`
- `source_id`
- `xp_amount`
- `occurred_at`
- `period_key`
- `status`: valid, review, void
- `meta`

### `gamification_rules`

Fonte de verdade das regras.

Campos:
- `action_type`
- `audience`: user, pastor, church
- `xp_amount`
- `daily_limit`
- `cooldown_seconds`
- `unique_key_strategy`
- `is_enabled`
- `starts_at`
- `ends_at`

### `gamification_levels`

Niveis configuraveis.

Campos:
- `audience`: user, pastor, church
- `level_key`
- `name`
- `min_xp`
- `max_xp`
- `description`
- `badge_id`
- `is_active`

### `badges`

Selos configuraveis.

Campos:
- `id`
- `audience`
- `name`
- `description`
- `icon`
- `category`
- `requirement_type`
- `requirement_value`
- `is_active`

### Convites, compartilhamentos e comentarios existentes

Estruturas ja encontradas no app que devem ser conectadas ao motor de Mana:

| Capacidade | Estrutura atual | Status para Mana |
| --- | --- | --- |
| Convite para grupo privado | `group_access_invites`, RPC `create_private_group_invite`, `accept_private_group_invite` | Estrutura existe; falta regra de Mana/badge para envio e aceite |
| Convite por mencao `@usuario` em grupo privado | `GroupAccessInviteSource = mention` e deteccao de `@([a-zA-Z0-9_]+)` em grupo | Estrutura existe; falta regra de Mana/badge e anti-spam |
| Convite/acesso a estudo ou sala | `content_access_invites`, RPC `create_content_access_invite`, `accept_content_access_invite` | Estrutura existe; falta conectar ao motor de Mana |
| Convite direto para plano/sala | `inviteUserToPlan` em `dbService` | Estrutura existe; falta evento de Mana e badge |
| Compartilhamento de post/estudo/sala | `shares_count`, `metrics.shares`, `incrementMetric(..., 'shares')` | Estrutura existe; algumas telas registram atividade, mas falta padronizar |
| Comentario em post do Reino | `post_comments`, `addPostComment`, `increment_post_comments_count` | Estrutura existe; componente atual nao registra Mana |
| Comentario em plano/sala | `plan_comments`, `addPlanComment` | Estrutura existe; tela chama `earnMana('social_interaction')`, mas regra deve ficar explicita |
| Comentario/mural de igreja ou grupo | `prayer_wall`/pedidos e interacoes em igreja/grupo | Parcial; falta separar comentario, pedido de oracao e intercessao |

### `church_gamification_snapshots`

Agregados periodicos para ranking rapido.

Campos:
- `church_id`
- `period_key`
- `total_xp`
- `active_members`
- `xp_per_active_member`
- `chapters_read`
- `devotionals_completed`
- `prayers_count`
- `quiz_completed`
- `rank_global_total`
- `rank_global_normalized`

## 14. Roadmap de implementacao

### Fase 1 - Auditoria e fonte unica de regras

Entregas:
- Criar matriz completa de funcionalidades x `ActionType`.
- Mapear todos os pontos que chamam `recordActivity` ou `earnMana`.
- Mapear todos os pontos de convite, compartilhamento, mencao e comentario.
- Definir se cada acao gera Mana, stats, badge, ranking ou apenas historico.
- Completar `ACTION_XP_SETTING` para todas as acoes validas.
- Criar ou aprovar `ActionType` para `invite_sent`, `invite_accepted`, `social_comment`, `social_mention`, `group_comment`, `church_comment` e `content_share`.
- Remover valores manuais divergentes quando possivel.
- Criar testes unitarios para cada regra.

Criterio de aceite:
- Nenhuma `ActionType` fica sem decisao explicita.
- Toda funcionalidade relevante tem status: implementada, parcial, nao gera Mana ou pendente.

### Fase 2 - Anti-abuso e eventos auditaveis

Entregas:
- Criar tabela `mana_events`.
- Criar servico central de concessao de Mana.
- Adicionar limite diario por acao.
- Adicionar cooldown por acao.
- Adicionar chave unica por fonte, ex.: usuario + acao + conteudo + dia.
- Admin pode visualizar e anular eventos suspeitos.

Criterio de aceite:
- O usuario nao consegue farmar Mana repetindo a mesma acao simples.
- Ranking usa apenas eventos validos.

### Fase 3 - Niveis e selos por audiencia

Entregas:
- Criar niveis de usuario.
- Criar niveis de pastor/lider.
- Criar niveis de igreja.
- Criar selos por audiencia.
- Expandir motor de badges para `achievement`, `streak`, `pastor` e `church`.
- Adicionar selos por convites, compartilhamentos, mencoes `@` e comentarios validos.
- Admin pode ativar/desativar selos.

Criterio de aceite:
- Usuario, pastor e igreja possuem progresso proprio.
- Selos nao dependem de deploy para ajustes basicos.

### Fase 4 - Ranking interno da igreja

Entregas:
- Agregar Mana por igreja.
- Agregar Mana por celula/grupo.
- Criar ranking interno por periodo.
- Permitir pastor configurar visibilidade do ranking individual.
- Exibir ranking no Workspace Pastoral.

Criterio de aceite:
- Pastor enxerga membros, grupos e desafios da propria igreja.
- Dados sensiveis nao ficam publicos indevidamente.

### Fase 5 - Ranking global entre igrejas

Entregas:
- Criar snapshots semanais/mensais por igreja.
- Criar ranking global absoluto.
- Criar ranking global proporcional por membro ativo.
- Criar ranking por desafio.
- Criar selos coletivos por temporada.

Criterio de aceite:
- Igreja pequena consegue competir por media/crescimento.
- Ranking global nao depende de consulta pesada em tempo real.

### Fase 6 - Pagina de indicadores e competicao

Entregas:
- Criar rota `/competicao`.
- Criar visao do usuario.
- Criar visao do pastor.
- Criar visao global de igrejas.
- Criar bloco "Como ganhar Mana".
- Criar bloco "Regras da temporada".
- Criar filtros por periodo: hoje, semana, mes, temporada.

Criterio de aceite:
- Usuario entende seu progresso.
- Pastor entende a saude da igreja.
- Igreja entende sua posicao no ranking interno e global.

### Fase 7 - Estimulos contextuais de Mana

Entregas:
- Criar `ManaNudge`.
- Criar `ManaRewardToast`.
- Criar `ManaDailyChecklist`.
- Criar `ManaRulesDrawer`.
- Criar motor `NextBestManaAction`.
- Espalhar sugestoes em Home, Perfil, Historico, Biblia, Devocional, Quiz, Reino, Oracao, Planos/Salas, Igreja e Competicao.
- Adicionar estimulos para convidar membros, comentar em grupos/igreja, mencionar `@usuario` com contexto e compartilhar conteudos uteis.
- Medir visualizacao, clique e conclusao de acoes sugeridas.

Criterio de aceite:
- Usuario sabe onde ganhar Mana sem depender de suporte.
- Estimulos aumentam acoes saudaveis sem poluir as telas.
- Regras e limites aparecem de forma clara quando o usuario pede detalhes.

### Fase 8 - Temporadas, campanhas e desafios

Entregas:
- Criar temporadas.
- Criar desafios por igreja, grupo e global.
- Criar multiplicadores temporarios.
- Criar premios simbolicos: selos, destaque, certificado digital.
- Criar painel admin de campanhas.

Criterio de aceite:
- Admin consegue lançar uma campanha sem deploy.
- A campanha respeita limites anti-abuso.

## 15. Checklist tecnico de auditoria

Para cada funcionalidade:

- Existe `ActionType` correto?
- Chama `recordActivity`/servico central no ponto certo?
- Atualiza `lifetimeXp`?
- Atualiza `activityLog`?
- Atualiza `stats` correspondente?
- Pode liberar badge?
- Conta para ranking de usuario?
- Conta para ranking de pastor?
- Conta para ranking de igreja?
- Tem limite diario?
- Tem cooldown?
- Tem chave anti-duplicidade?
- Tem teste?
- Tem mensagem clara no historico?
- Pode ser auditada pelo admin?
- Existe estimulo contextual para essa acao?
- O estimulo respeita limite diario/cooldown?
- O usuario consegue entender por que ganhou ou nao ganhou Mana?
- Convite enviado e convite aceito sao tratados separadamente?
- Compartilhamento incrementa metrica e registra evento de Mana quando valido?
- Comentario em post, sala, grupo e igreja tem regra propria?
- Marcacao `@usuario` gera notificacao/convite real antes de contar para Mana?

## 16. Indicadores de sucesso

Produto:
- Aumento de usuarios que completam primeira semana.
- Aumento de usuarios com 3 ou mais acoes de Mana por semana.
- Aumento de igrejas com membros ativos.
- Aumento de conclusao de planos/salas.

Comunidade:
- Mais intercessoes reais.
- Mais participacao em desafios.
- Mais grupos ativos por igreja.
- Retencao maior em igrejas que usam ranking/desafios.

Qualidade:
- Reducao de eventos repetidos suspeitos.
- Regras compreendidas pelos usuarios.
- Menos divergencia entre UI, Admin e backend.
- Mais usuarios abrindo "Como ganhar Mana".
- Mais acoes saudaveis vindas de nudges.
- Baixa taxa de rejeicao/desativacao de estimulos.

## 17. Decisoes em aberto

1. A rota principal sera `/competicao`, `/mana` ou uma secao dentro do Workspace Pastoral?
2. Ranking individual global deve existir publicamente ou apenas ranking por igreja/grupo?
3. Pastor tera progressao individual separada do usuario ou sera um perfil com camada extra?
4. Igreja tera assinatura propria no futuro ou usara o plano do pastor responsavel?
5. Quais indicadores de igreja podem ser publicos sem expor informacoes sensiveis?
6. Mana antigo sera migrado para eventos retroativos ou mantido como saldo legado?
7. Temporadas terao reset parcial do ranking ou apenas periodos filtraveis?
8. Estimulos de Mana devem aparecer para todos ou ser reduzidos por preferencia do usuario?
9. A meta diaria sera em Mana, em quantidade de acoes ou em ambos?
10. O app deve permitir que pastores criem missoes de Mana para suas igrejas?

## 18. Recomendacao de sequencia

1. Fazer a auditoria completa das funcionalidades e ActionTypes.
2. Completar regras de Mana e testes.
3. Criar `mana_events` antes de expandir ranking.
4. Implementar niveis por audiencia.
5. Implementar ranking interno de igreja.
6. Implementar ranking global proporcional.
7. Criar pagina `/competicao`.
8. Espalhar estimulos contextuais de Mana.
9. Implementar temporadas, campanhas e desafios.

Sem a fase de auditoria e eventos, a pagina de competicao pode mostrar dados bonitos, mas frageis. A prioridade deve ser confiabilidade da regra antes de ampliar a exibicao publica.
