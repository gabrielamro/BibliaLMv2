# Roadmap: Regras de Visibilidade e Descoberta do Reino

## Objetivo

Transformar o Reino em um feed com lógica real de rede social: o usuário vê principalmente postagens de quem segue, além de conteúdos públicos selecionados para descoberta. A experiência deve preservar privacidade, incentivar conexões saudáveis e evitar que o feed vire uma lista global sem contexto.

## Princípios de Produto

- O feed principal não é "tudo de todos"; é "minha rede + descoberta edificante".
- Conteúdo privado nunca entra em descoberta.
- Perfis públicos podem aparecer para não seguidores, mas com limite, contexto e sinais de qualidade.
- O usuário deve entender por que está vendo uma postagem.
- Interações no Reino devem favorecer edificação, comunidade, igreja, grupo e constância.

## Tipos de Visibilidade

### Postagem Pública

Visível para:
- seguidores do autor;
- visitantes do perfil público do autor;
- feeds de descoberta, se elegível;
- links diretos compartilhados.

Uso recomendado:
- reflexões, artes, testemunhos, estudos públicos, convites abertos.

### Apenas Seguidores

Visível para:
- seguidores do autor;
- autor;
- links diretos apenas se o visualizador for seguidor.

Uso recomendado:
- reflexões pessoais, rotina espiritual, bastidores, pedidos menos públicos.

### Igreja

Visível para:
- membros da mesma igreja;
- admins/pastores da igreja;
- autor.

Uso recomendado:
- avisos, cultos, check-ins, campanhas e comunicações locais.

### Grupo/Célula

Visível para:
- membros do grupo/célula;
- liderança autorizada;
- autor.

Uso recomendado:
- pedidos de oração, acompanhamento, desafios e conversas de célula.

### Privado

Visível para:
- apenas autor;
- opcionalmente usuários convidados em fase futura.

Uso recomendado:
- rascunhos, diário espiritual, anotações sensíveis.

## Regra Central do Feed

O feed principal do Reino deve ser montado em camadas:

1. **Rede direta**
   - Postagens recentes de usuários que o visualizador segue.
   - Postagens da própria pessoa.

2. **Comunidade próxima**
   - Postagens públicas ou internas da igreja do usuário.
   - Postagens de grupos/células aos quais o usuário pertence.

3. **Descoberta de não seguidores**
   - Postagens públicas elegíveis de perfis públicos.
   - Conteúdo com bom sinal de qualidade, relevância e segurança.

4. **Cards editoriais/sistema**
   - Devocional, leitura, estudo, arte, oração, sugestões de seguir.

## Lógica Para Aparecer Postagens de Não Seguidores

Uma postagem de não seguidor só pode entrar no feed se cumprir todos os requisitos:

- `post.visibility = public`;
- autor com `isProfilePublic = true`;
- autor não bloqueado e não denunciado pelo usuário;
- post não marcado como removido/moderado;
- conteúdo não sensível;
- não exceder o limite de descoberta do feed.

Depois disso, aplicar pontuação.

### Sinais Positivos

- Autor é da mesma igreja.
- Autor é da mesma cidade/estado.
- Usuários que você segue interagiram com o post.
- Post tem boas interações recentes.
- Post pertence a uma categoria que você consome: estudo, oração, arte, reflexão, check-in.
- Autor tem histórico positivo no Reino.
- Post tem conteúdo bíblico/referência/devocional clara.

### Sinais Negativos

- Autor apareceu muitas vezes nos últimos dias.
- Post recebeu denúncias.
- Baixa qualidade textual ou spam.
- Excesso de links externos.
- Conteúdo repetitivo.
- O usuário ocultou conteúdo parecido.
- O usuário viu e ignorou muitas postagens daquele autor.

### Limites de Descoberta

No feed principal:
- máximo de 20% a 30% do feed pode ser de não seguidores;
- no início da conta, quando o usuário segue pouca gente, descoberta pode subir até 50%;
- nunca mostrar mais de 2 posts seguidos de não seguidores;
- limitar o mesmo autor não seguido a 1 aparição por janela de feed;
- inserir label discreto: "Sugerido por ser público", "Da sua igreja", "Popular no Reino" ou "Perto de você".

## Regras de Perfil

### Perfil Público

- Pode ser encontrado em busca e descoberta.
- Postagens públicas podem aparecer para não seguidores.
- Conteúdos `followers`, `church`, `group` e `private` continuam protegidos.

### Perfil Privado

- Não aparece em descoberta.
- Postagens públicas antigas devem respeitar o perfil privado: não entram em feed de não seguidores.
- Perfil pode ser acessado por link, mas mostrar apenas dados mínimos e CTA para seguir, conforme regra do produto.

## Regras de Seguimento

### Seguir

Quando A segue B:
- A passa a ver posts públicos e "apenas seguidores" de B;
- B recebe notificação;
- ação pode gerar Mana se respeitar anti-spam.

### Deixar de Seguir

Quando A deixa de seguir B:
- posts `followers` de B somem do feed de A;
- posts públicos de B ainda podem aparecer via descoberta, mas com baixa prioridade por um período.

### Bloquear/Ocultar

Necessário para completar a lógica social:
- bloquear usuário remove tudo dele do feed;
- ocultar autor reduz ou zera descoberta daquele autor;
- ocultar post informa o algoritmo.

## Modelo de Dados Proposto

### `posts`

Adicionar ou padronizar:
- `visibility`: `public | followers | church | group | private`;
- `author_profile_public`: cache opcional para ranking rápido;
- `moderation_status`: `active | hidden | removed | under_review`;
- `topic`: `reflection | prayer | art | study | checkin | testimony | church`;
- `quality_score`: número calculado;
- `discovery_score`: número calculado;
- `last_ranked_at`: data do último cálculo;
- `hidden_by`: opcional, ou tabela separada.

### `follows`

Já existe base:
- `follower_id`;
- `following_id`;
- `created_at`.

Garantir índice:
- `(follower_id, following_id)`;
- `(following_id)`;
- unicidade em `(follower_id, following_id)`.

### `post_visibility_events`

Nova tabela opcional:
- `user_id`;
- `post_id`;
- `event_type`: `seen | hidden | reported | clicked_author | followed_author`;
- `created_at`.

Serve para reduzir repetição e melhorar descoberta.

### `blocked_users`

Nova tabela:
- `blocker_id`;
- `blocked_id`;
- `created_at`.

## Serviço de Feed Proposto

Criar um método único:

```ts
getKingdomPersonalizedFeed(viewerProfile, options)
```

Responsabilidades:
- buscar lista de seguidos;
- buscar vínculos de igreja/grupos;
- montar candidatos por origem;
- aplicar regras de visibilidade;
- aplicar ranking;
- intercalar rede e descoberta;
- retornar metadado `reason`, por exemplo:
  - `following`;
  - `same_church`;
  - `same_group`;
  - `public_discovery`;
  - `popular_public`;
  - `near_you`.

## Ranking Inicial

Pontuação sugerida:

- seguindo: `+100`;
- mesmo grupo: `+90`;
- mesma igreja: `+70`;
- perfil público recomendado: `+25`;
- amigo/interação indireta: `+20`;
- engajamento recente: `+0 a +30`;
- post novo: `+0 a +20`;
- denúncia: `-80`;
- autor repetido: `-40`;
- post já visto: `-30`;
- ocultado similar: `-60`.

Ordenar por score com leve aleatoriedade controlada para descoberta não ficar sempre igual.

## UX Necessária

### Composer

Ao criar post, o usuário escolhe visibilidade:
- Público;
- Seguidores;
- Igreja;
- Grupo;
- Privado.

Texto de apoio curto:
- "Público pode aparecer em descoberta do Reino."
- "Seguidores aparece apenas para quem segue você."
- "Igreja aparece para membros da sua igreja."
- "Grupo aparece para sua célula/grupo."

### Card do Post

Mostrar motivo quando não for seguidor:
- "Sugerido: perfil público";
- "Da sua igreja";
- "Popular no Reino";
- "Perto de você".

Adicionar ações:
- Seguir;
- Não quero ver este autor;
- Ocultar;
- Denunciar.

### Feed Vazio

Quando o usuário segue poucas pessoas:
- sugerir perfis públicos;
- sugerir igreja/grupos;
- mostrar descoberta com label claro.

## Fases de Implementação

### Fase 1: Base de Privacidade

- Adicionar `visibility` em `Post`.
- Atualizar criação de posts com seleção de visibilidade.
- Garantir fallback para posts antigos como `public`.
- Aplicar filtro básico:
  - próprio autor;
  - seguindo;
  - público;
  - igreja/grupo quando houver vínculo.

Critério de aceite:
- posts `followers` não aparecem para não seguidores;
- posts `public` continuam acessíveis;
- posts de igreja/grupo só aparecem para membros relacionados.

### Fase 2: Feed Personalizado

- Criar `getKingdomPersonalizedFeed`.
- Substituir `getGlobalFeed` no `/social`.
- Separar fontes:
  - seguindo;
  - igreja;
  - grupo;
  - descoberta pública.
- Intercalar resultados com limite de descoberta.

Critério de aceite:
- usuário com seguidos vê majoritariamente pessoas seguidas;
- usuário novo vê descoberta pública sem feed vazio;
- não seguidores nunca veem posts `followers`.

### Fase 3: Descoberta Inteligente

- Adicionar score simples de descoberta.
- Criar motivos de recomendação.
- Priorizar:
  - mesma igreja;
  - mesma cidade;
  - posts com engajamento recente;
  - autores públicos com boa reputação.

Critério de aceite:
- post de não seguidor aparece com motivo;
- máximo de 30% do feed de usuário ativo vem de descoberta;
- autores não seguidos não repetem excessivamente.

### Fase 4: Controle do Usuário

- Implementar ocultar post.
- Implementar ocultar autor.
- Implementar bloquear usuário.
- Implementar denunciar com impacto no ranking.

Critério de aceite:
- conteúdo ocultado não volta no feed;
- autor bloqueado não aparece em feed, perfil sugerido ou descoberta;
- denúncias reduzem entrega até revisão.

### Fase 5: Segurança e Performance

- Criar índices Supabase.
- Avaliar RLS para impedir leitura indevida de posts privados.
- Adicionar testes unitários para elegibilidade.
- Adicionar testes de integração do feed.
- Monitorar tempo de resposta e quantidade de queries.

Critério de aceite:
- regras são aplicadas no backend/serviço, não só na UI;
- feed carrega com performance aceitável;
- casos sensíveis têm cobertura de testes.

## Casos de Teste Obrigatórios

- Usuário A não segue B e B posta `followers`: A não vê.
- Usuário A segue B e B posta `followers`: A vê.
- B tem perfil privado e posta `public`: A não recebe em descoberta se não segue.
- B tem perfil público e posta `public`: A pode receber em descoberta.
- A e B são da mesma igreja: A pode ver posts `church`.
- A e B são do mesmo grupo: A pode ver posts `group`.
- A bloqueou B: A não vê nenhum post de B.
- A ocultou autor B: B não aparece na descoberta.
- Feed de usuário novo não fica vazio.
- Feed de usuário com muitos seguidos não vira feed global.

## Métricas de Sucesso

- Aumento de follows por sessão.
- Redução de feed vazio.
- Mais interações em posts de seguidos.
- Taxa saudável de descoberta: cliques, follows, ocultações baixas.
- Queda em denúncias/spam no Reino.
- Tempo médio de carregamento do feed estável.

## Fora do Escopo Inicial

- Algoritmo com IA para ranking sem base de eventos.
- Feed totalmente em tempo real.
- Recomendações por embeddings.
- Conteúdo pago/premium no feed.
- Convites privados por post.

## Decisão Recomendada

Começar pela Fase 1 e Fase 2 juntas. Isso entrega o comportamento essencial de rede social: ver quem sigo, proteger posts não públicos e ainda permitir descoberta controlada de perfis públicos. Depois, evoluir para ranking e controles de usuário.
