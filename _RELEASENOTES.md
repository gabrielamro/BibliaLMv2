# 📜 Histórico de Mudanças (Changelog)

> **AI INSTRUCTION:** Ao finalizar uma tarefa, adicione uma nova entrada no topo desta lista.
> **VERSION SYNC:** Lembre-se de atualizar `constants.ts`, `_ARCHITECTURE.md` e `_PROJECT_CONTEXT.md` ao mudar a versão aqui.
> **GIT SYNC:** Após atualizar este arquivo, o Arquiteto deve executar `git commit` com a mensagem do release.

## [v2.10.2] - 2026-08-03 (Fluxo temporal do culto)
### Tipo: Fix / Mobile / Cultos
- **Retorno previsivel:** o botao voltar da experiencia de culto leva diretamente a `/meus-cultos`, inclusive no mobile.
- **Horario soberano:** o intervalo configurado em `startsAt` e `endsAt` define o estado apresentado ao membro, sem antecipacao causada pelo status operacional salvo.
- **Estados claros:** antes do horario mostra `Inicia as HH:mm`, durante mostra `Ao vivo` e depois mostra `Terminou`.
- **Consistencia:** OnePage, cards de culto e perfil da igreja usam a mesma regra temporal.
- **Validacao:** testes de experiencia, estado temporal, retorno mobile e TypeScript aprovados.

## [v2.10.1] - 2026-08-03 (Marca e dominio canonicos)
### Tipo: Refactor / Arquitetura / Deploy
- **Marca publica:** superficies ativas, SEO, textos de ajuda e arte exportada passam a apresentar exclusivamente Culto+.
- **Dominio canonico:** sitemap, robots, compartilhamentos, contratos e fallbacks passam a usar `https://cultomais.vercel.app`.
- **Fonte unica:** marca, origem publica e hosts legados ficam centralizados em `constants.ts`.
- **Compatibilidade:** links antigos de BibliaLM continuam sendo reconhecidos como internos, sem serem gerados novamente.
- **Infraestrutura:** CORS inclui a origem Culto Mais e o alias de producao passa a apontar para o deploy validado.

## [v2.10.0] - 2026-08-02 (Template Culto+ consolidado)
### Tipo: Refactor / UI / UX / Navegação
- **TTS resiliente a picos:** indisponibilidade temporária do Gemini recebe novas tentativas com espera progressiva, fallback TTS sem streaming e mensagem controlada no player, sem overlay técnico.
- **Player bíblico compacto:** “Ouvir” abre um reprodutor flutuante com play/pausa, velocidade, salto entre versículos e barra de andamento exclusivamente informativa.
- **Narração bíblica restaurada:** áudio e podcast usam o modelo Gemini TTS compatível com streaming, modalidade de áudio e voz configurada, eliminando o erro de modelo somente textual.
- **Leitura bíblica fluida:** livro, capítulo e versículo selecionado atualizam a URL sem perder trocas posteriores; capítulos já abertos usam cache em memória e respostas antigas não substituem a leitura atual.
- **Retorno limpo da leitura:** ao voltar de um livro ou versículo, a biblioteca remove os parâmetros de livro e capítulo e restaura `/bibliasagrada`.
- **Biblioteca mais direta:** removido o cabeçalho redundante “Livros da Bíblia”; filtros e grade aparecem imediatamente, com reset compacto quando necessário.
- **Culto ao vivo mobile:** o contador original recebe o relógio ao lado; menu superior persistente e dois botões flutuantes organizam funcionalidades e interações sob demanda.
- **Página do culto mais objetiva:** blocos redundantes de momento atual, modo ao vivo, reações e versículo-chave saem da área inferior; a publicação no Reino passa para um terceiro botão flutuante com compositor próprio.
- **Retorno ao culto:** depois de abrir um culto em andamento, o destino `Cultos` recebe um indicador de play e retorna diretamente à experiência ativa.
- **Partilha rolável:** o compositor passa a usar a altura visual do dispositivo e uma única região de rolagem no mobile.
- **Home canônica:** `/` e `/inicio03` convergem para a Home Culto+, eliminando experiências concorrentes.
- **Reino completo:** igreja, grupo, post, oração, artigos e perfis passam a usar o shell oficial, tokens do Reino e navegação unificada.
- **Folha editorial:** oração e superfícies comunitárias recebem o detalhe visual de página sem interceptar ações.
- **Cultos e estudos:** registro pessoal de culto, dashboard bíblico, biblioteca, jornadas e leitores passam a herdar o shell do módulo correto.
- **Criação consolidada:** `/criar-estudo` converge para o Estúdio da Palavra; podcast, sala e chat entram nos shells de criação ou pastoral.
- **Identidade:** metadados, compartilhamentos e superfícies ativas adotam Culto+ como marca principal.
- **Oração global corrigida:** o mural global usa `target_type = global` e `target_id` nulo, respeitando o contrato UUID e as políticas de audiência.
- **Protótipos removidos:** as rotas de demonstração `/mockinicio1` e `/mocsantuario` deixam de fazer parte da aplicação.
- **Catálogo futuro consistente:** os geradores do mapa visual não classificam nem publicam novamente essas rotas removidas.
- **Validação:** TypeScript, testes estruturais, suíte do Reino e inspeção responsiva em desktop/mobile aprovados.

## [v2.9.4] - 2026-08-01 (Próximo culto usa o vínculo real do membro)
### Tipo: Fix / UI / UX / Cultos
- **Vínculo confiável:** `/meus-cultos` consulta a associação persistida em `memberships`, com o resumo do perfil apenas como fallback.
- **Próximo culto visível:** a agenda utiliza a igreja efetivamente vinculada ao usuário e busca o culto publicado mais próximo nos próximos 60 dias.
- **Conteúdo objetivo:** somente um culto aparece no bloco; os demais permanecem acessíveis em `Ver mais cultos`.
- **Estado vazio correto:** a orientação para vincular-se a uma igreja só aparece quando não existe associação real.
- **Validação:** testes específicos e TypeScript aprovados.

## [v2.9.3] - 2026-08-01 (Destaque móvel acompanha a página ativa)
### Tipo: Fix / UI / UX / Navegação
- **Premium contextual:** o botão elevado passa a ser determinado por `aria-current="page"`, não pela identidade fixa do Reino.
- **Estados consistentes:** Início, Bíblia, Reino, Cultos e Perfil recebem o mesmo tratamento quando suas rotas estão ativas.
- **Identidade por módulo:** o gradiente do destaque consome os tokens visuais da página atual.
- **Validação:** Reino, Bíblia e Cultos verificados no navegador; 12 testes do Reino, TypeScript e build de produção aprovados sem erros no console.

## [v2.9.2] - 2026-08-01 (Meus Cultos compacto e agenda da igreja)
### Tipo: Refactor / UI / UX / Cultos
- **Resumo em uma linha:** os cinco indicadores pessoais cabem em uma única faixa no mobile, mantendo apenas ícone e valor visíveis.
- **Rótulos sob demanda:** cada indicador comunica seu significado por nome acessível e tooltip acionado por hover, foco ou toque.
- **Agenda da igreja:** `/meus-cultos` consulta os próximos 60 dias e mostra cultos publicados, com data, horário, estado e acesso à OnePage.
- **Contexto preservado:** cultos futuros da igreja complementam, sem misturar, o histórico pessoal de check-ins e registros manuais.
- **Estados vazios:** pessoas sem igreja recebem acesso à descoberta; igrejas sem programação publicada recebem orientação explícita.
- **Validação:** 2 testes específicos, TypeScript e build de produção aprovados.

## [v2.9.1] - 2026-08-01 (Reino móvel e navegação principal unificada)
### Tipo: Refactor / UI / UX / Navegação
- **Cinco destinos estáveis:** a barra inferior usa `Início`, `Bíblia`, `Reino`, `Cultos` e `Perfil` em todas as páginas pessoais.
- **Reino central:** o acesso social recebe o gesto visual de página/partilha, gradiente Culto+ e posição central sem alterar sua rota canônica.
- **Contexto no lugar certo:** igreja, orações e comunidade passam para uma faixa própria do feed; descoberta e grupos continuam disponíveis dentro do módulo.
- **Trama Viva mobile:** linha da comunidade, avatar externo e tipo editorial na margem aproximam os cards do conceito visual aprovado.
- **Conteúdo prioritário:** Pulso do Reino deixa a primeira dobra do celular, enquanto `Seu caminho` permanece disponível como painel expansível.
- **Acessibilidade:** destinos possuem nome acessível, estado `aria-current`, alvos de toque amplos e área segura inferior.
- **Validação:** 12 testes do Reino, TypeScript e inspeção visual em 390×844 aprovados sem overflow horizontal.

## [v2.9.0] - 2026-07-31 (Reino editorial e jornada contextual)
### Tipo: Refactor / UI / UX / Conteúdo
- **Cards em folha:** toda publicação recebe uma dobra editorial inferior com variação visual para conteúdo da igreja, sem bloquear as ações do card.
- **Reflexão enriquecida:** a passagem escolhida no Caderno de Partilha é preservada no payload e exibida em um painel bíblico próprio na publicação.
- **Contexto explícito:** o cabeçalho do post informa tipo e audiência, mantendo autoria, destino e motivo de recomendação compreensíveis.
- **Seu caminho real:** a lateral combina próximo culto, convite ou compromisso de escala, oração da comunidade, estudo salvo, publicações salvas e acesso à igreja.
- **Responsividade:** o trilho permanece fixo no desktop e vira uma seção expansível no celular, sem rolagem horizontal nem duplicação de conteúdo.
- **Resiliência:** fontes independentes usam carregamento parcial; a falha de um detalhe não impede a exibição dos demais.
- **Validação:** 11 testes do Reino, TypeScript e inspeção visual em desktop e mobile aprovados.

## [v2.8.9] - 2026-07-31 (Trama Viva aplicada e Caderno contextual)
### Tipo: Refactor / UI / UX / Navegação
- **Feed alinhado aos mockups:** hierarquia editorial, Fio da Comunhão, cards em formato de página/conversa e título curto do Reino.
- **Pulso real:** o Pulso do Reino resume publicações e conversas carregadas sem inventar atividades ou métricas.
- **Seu caminho:** rail desktop conecta cultos, igreja, estudos, salvos e orações; no mobile o conteúdo prioritário permanece em uma coluna.
- **Caderno responsivo:** escrita e enriquecimento ficam ao lado de audiência e prévia no desktop e viram sequência vertical no celular.
- **Taxonomia preservada:** anexar imagem não transforma reflexão ou oração em tipo genérico; upload mantém extensão coerente e menções apontam ao permalink.
- **Contexto reaproveitado:** igreja e grupo abrem o mesmo composer com audiência pré-selecionada; o mural do grupo combina posts canônicos e pedidos legados.
- **Rotas canônicas:** aliases sociais de perfil, igreja e grupo agora redirecionam de verdade para `/u`, `/igreja` e `/grupo`.
- **Perfil:** superfície pública recebe a identidade cromática e densidade compacta do Reino; ações de post agora persistem também nessa página.
- **Validação:** 9 testes do Reino, 12 testes de igreja/grupo, TypeScript, build e inspeção visual desktop/mobile aprovados.

## [v2.8.8] - 2026-07-31 (Interações persistentes e publicação individual)
### Tipo: Refactor / UI / UX / Segurança
- **Interações reais:** curtir, salvar, ocultar, denunciar e comentar usam um serviço único e persistência no Supabase.
- **Moderação pessoal:** a pessoa pode ocultar conteúdos e denunciar motivos padronizados; publicações ocultas deixam de voltar ao feed.
- **Comentários confiáveis:** contagem sincronizada no banco e exclusão autorizada para autor do comentário ou da publicação.
- **Post individual canônico:** `/p/[postId]` reutiliza o mesmo card, métricas e conversa do feed, com estados de loading, erro e indisponibilidade.
- **Segurança:** novas tabelas usam RLS, grants explícitos, identidade derivada da sessão e função de trigger com `search_path` protegido.
- **Acessibilidade:** salvar usa estado pressionado, imagens respeitam texto alternativo e o painel de comentários possui semântica de diálogo, Escape e alvos táteis.
- **Validação:** 7 testes do Reino, TypeScript e build de produção aprovados.

## [v2.8.7] - 2026-07-31 (Reino Trama Viva e Caderno de Partilha)
### Tipo: Refactor / UI / UX / Acessibilidade
- **Feed proprietário:** hierarquia visual Trama Viva, conteúdo na primeira dobra e filtros Para você, Seguindo, Minha igreja e Grupos.
- **Estados confiáveis:** falha de backend, vazio e loading são distintos; posts mockados não mascaram erro de produção.
- **Um único launcher:** removidos CTAs concorrentes e o FAB duplicado no mobile.
- **Caderno de Partilha:** rascunho recuperável, confirmação de descarte, foco preso, Escape e restauração de foco.
- **Audiência compreensível:** opções textuais explicam alcance e por que igreja/grupo podem estar indisponíveis.
- **Anexos responsáveis:** localização somente após ação explícita; imagens validam tipo/tamanho e aceitam descrição acessível.
- **Conteúdo organizado:** igreja recebe tabs reais Mural, Cultos, Grupos, Sobre e Membros; grupo recebe Mural, Subgrupos, Sobre e Membros.
- **PostCard refinado:** rotas canônicas, alvos de 44 px e ação Salvar retirada enquanto não há persistência real.
- **Validação:** contrato automatizado, matriz de grupos, TypeScript, build e inspeção visual em desktop/mobile aprovados.

## [v2.8.6] - 2026-07-31 (Igrejas e grupos com permissões reais)
### Tipo: Refactor / UX / Segurança
- **Membro e seguidor separados:** a página da igreja comunica e persiste cada relação de forma independente.
- **Grupos sob liderança:** criação, edição, moderação, convite e arquivamento consomem capabilities compartilhadas de pastor/líder ativo e escopo de igreja ou grupo.
- **RLS como autoridade:** políticas e funções do banco impedem que chamadas diretas contornem as regras exibidas pela interface.
- **Privacidade corrigida:** convite pendente não abre o feed privado; o aceite valida membresia da igreja, expiração e vínculo em uma única transação.
- **Navegação contextual:** igreja, grupo pai, subgrupo e perfis usam rotas canônicas e breadcrumbs coerentes.
- **Onboarding seguro:** novos membros escolhem grupos existentes; a criação acontece na página da igreja por liderança reconhecida.
- **Cobertura:** testes verificam matriz de permissões, privacidade, rotas, relações da igreja e contratos da migration.

## [v2.8.5] - 2026-07-29 (NewHome compacta e devocional em destaque)
### Tipo: Refactor / UI / Hierarquia
- **Pão Diário prioritário:** o devocional ocupa o card principal da jornada e recebe acesso direto para a reflexão do dia.
- **Continuidade reposicionada:** “Continuar leitura” passa para o atalho compacto anteriormente ocupado pelo Pão Diário.
- **Agenda objetiva:** “Minha semana” exibe até três próximos cultos da igreja; cultos em que o usuário já confirmou a escala recebem destaque próprio, sem repetir convites ou designações como programações.
- **Cabeçalho simplificado:** os textos auxiliares “Sua agenda” e “Cultos e escalas em um único resumo” foram removidos para priorizar o título e a lista.
- **Convite para servir:** quando não há escala futura confirmada, a Home mantém os três próximos cultos e oferece candidatura pelo formulário ativo da igreja; sem formulário publicado, orienta o membro a procurar a liderança.
- **Arte Sacra sem rolagem operacional:** o painel “Comece pela Palavra” foi compactado, Feed/Story migrou para a barra de salvamento do canvas e o botão principal do Motor de Criação IA permanece fixo e visível fora da área rolável.
- **Canvas da Arte Sacra simplificado:** “Gerar Arte Inédita” e “Explorar Acervo” foram removidos do estado vazio por duplicarem as abas laterais no desktop e os comandos IA/Substituir do dock no mobile e tablet.
- **Menu lateral ajustável:** o novo menu Culto+ pode alternar entre a visualização completa e a compacta por ícones, preservando a preferência durante a navegação.
- **Coluna social sem lacunas:** “Minha escala” mantém sua altura de conteúdo e “No Reino” ocupa o restante da lateral, alinhando o encerramento dos blocos com a coluna principal no desktop.
- **Duas prévias do Reino:** a lateral utiliza a altura ampliada para apresentar duas publicações compactas, com trechos e interações, em vez de deixar espaço vazio.
- **Cards principais alinhados:** Pão Diário e Minha semana compartilham a mesma linha de cabeçalho e mantêm os CTAs ancorados na mesma altura inferior.
- **Voluntariado padronizado:** o CTA “Quer servir?” adota a mesma altura, raio, espaçamento e proporção de ícone das programações de culto.
- **Escala com contexto:** o convite da NewHome informa equipe, área, culto, data e horário; ausências de identificação da equipe recebem fallback explícito.
- **Convite de escala enxuto:** o bloco complementar “O que você vai fazer” foi removido para priorizar os dados operacionais essenciais e as ações de resposta.
- **Atalhos da jornada padronizados:** Meta de Leitura, Continuar leitura e Oração ao Amanhecer exibem título e descrição ao lado do ícone, conteúdo em blocos equivalentes e CTAs alinhados.
- **Atalhos sem espaço residual:** os três cards da jornada crescem igualmente até o final da coluna principal, eliminando a faixa vazia criada quando a lateral possui mais conteúdo.
- **Devocional premium:** Pão Diário mantém a mesma altura da agenda, recebe painel editorial para a Palavra, selo de referência, bloco de meditação e tempo estimado de leitura.
- **Títulos equilibrados:** Pão Diário e Minha semana compartilham a mesma escala tipográfica de 24 px.
- **Blocos compactos:** cards, tipografia, ícones, espaçamentos, a coluna do Reino e a estante de estudos foram reduzidos para melhorar a leitura da página.
- **Faixas redundantes removidas:** os resumos inferiores de próximos cultos e escala deixam a visão inicial, pois os mesmos destinos já estão disponíveis nos CTAs.
- **Cobertura:** Playwright valida a nova prioridade, os destinos, a ausência da lista repetida e os limites de altura dos cards.

## [v2.8.4] - 2026-07-29 (Filtros da Bíblia restaurados)
### Tipo: Feature / Biblioteca bíblica / Acessibilidade
- **Traduções visíveis:** o seletor de versão mostra ARA, ARC, NVI, ACF e Almeida 1917 também no mobile.
- **Testamentos restaurados:** Toda a Bíblia, Antigo Testamento e Novo Testamento voltam a filtrar a biblioteca.
- **Bíblia Católica:** uma opção dedicada apresenta os sete livros deuterocanônicos disponíveis no catálogo.
- **Filtros combináveis e compactos:** testamento/cânon, categoria literária e busca funcionam em conjunto; as categorias ficam em um dropdown lateral e “Ver todos os livros” limpa o conjunto.
- **Responsividade:** os quatro filtros principais usam grade de duas colunas no mobile e faixa horizontal no desktop.
- **Cobertura:** Playwright valida tradução, Antigo, Novo, Católica, abertura do leitor, mobile e alias `/biblia`.

## [v2.8.3] - 2026-07-29 (Pão Diário resiliente)
### Tipo: Fix / API / Resiliência
- **Leitura sempre disponível:** falha na personalização autenticada não bloqueia mais o conteúdo canônico já resolvido para o dia.
- **Fallback autenticado:** se a API inteira estiver temporariamente indisponível, usuários logados também recebem o catálogo local somente leitura.
- **Atualização protegida:** a ação de gerar um novo conteúdo continua falhando explicitamente e não consome a atualização diária quando não há confirmação no servidor.
- **Diagnóstico seguro:** erros de Supabase são registrados no servidor com código, mensagem, detalhes e dica, sem expor token ou credenciais.
- **Cobertura:** testes verificam fallback normal, preservação da atualização explícita e retorno canônico na falha de personalização.

## [v2.8.2] - 2026-07-29 (NewHome orientada por módulos)
### Tipo: Refactor / UI / Design system
- **Paleta sem conflitos:** as abas Criar, Reino, Gestão e Calendário deixam de manter gradientes e cores locais concorrentes.
- **Componentes temáticos:** hero, cards, CTAs, ícones, bordas, superfícies e foco consomem os tokens oficiais do módulo ativo.
- **Home composta:** leitura e jornada usam Bíblia; agenda e escala usam Cultos; comunidade usa Reino; Criar Sala usa Workspace Pastoral.
- **Base equilibrada:** o canvas permanece neutro, com uma ambientação discreta da aba, preservando legibilidade em claro e escuro.
- **Menu simplificado:** metadados cromáticos obsoletos foram removidos; desktop e mobile usam a mesma fonte de verdade.
- **Semântica preservada:** alertas e convites pendentes continuam âmbar, sem confundir estado operacional com identidade de módulo.

## [v2.8.1] - 2026-07-29 (Identidade visual por módulos)
### Tipo: Design system / UI / Acessibilidade
- **Temas centralizados:** oito identidades tipadas cobrem Início, Bíblia, Reino, Cultos, Criar, Gestão, Workspace Pastoral e áreas neutras.
- **Rotas previsíveis:** um resolver único define o módulo visual, inclusive nas áreas compartilhadas de culto, oração e criação de sala.
- **Navegação consistente:** menu pessoal, shell Culto+, bottom navigation, alternador de visões e shells profissionais usam os mesmos tokens.
- **New Home:** cada aba herda sua identidade; Calendário usa Cultos, Gestão usa preto premium e Criar usa o gradiente da marca.
- **Reino:** hero, progresso, compositor e navegação principal deixam o verde institucional e adotam o gradiente social próprio.
- **Claro e escuro:** todos os módulos possuem contraste, foco, seleção, superfície, borda e gradiente equivalentes.
- **Cobertura:** testes validam o contrato de rotas, fallback neutro, aliases, tokens e alternador de visões.

## [v2.8.0] - 2026-07-28 (Estúdio da Palavra concluído)
### Tipo: Feature / Editor / IA / Segurança
- **Revisão da IA:** o Obreiro IA gera uma proposta isolada e nunca altera o documento silenciosamente; o autor pode aplicar tudo, mesclar blocos escolhidos, inserir como novos ou descartar.
- **Persistência transacional:** estudos e aulas usam revisão otimista, autosave remoto, recuperação local e estado explícito para conflito ou falha.
- **Banco protegido:** `public_studies` e `custom_plans` receberam documento JSONB, versão, revisão, índices, grants mínimos e policies que impedem leitura anônima de rascunhos.
- **Biblioteca editorial:** busca, grupos Texto/Bíblia/Mídia/Interação/Layout, memória de recentes, cinco modelos orientadores e documento em branco.
- **Teclado e acessibilidade:** comando `/`, menu semântico, modal com foco restaurado, Escape, seleções anunciadas e ações com alvos de toque.
- **Consolidação:** V2 e V3 redirecionam para `/criar-conteudo`; os dois editores duplicados e seus testes obsoletos foram removidos.
- **Performance:** mídia editorial usa carregamento e decodificação assíncronos; o autosave permanece temporizado e sem criação automática.
- **Cobertura:** suíte focada cobre shell, mobile, recuperação, persistência, revisão da IA, biblioteca, comando `/`, rotas e revisão de aulas.

## [v2.7.1] - 2026-07-28 (Estúdio da Palavra com recuperação)
### Tipo: Refactor / Persistência / UX
- **Componente canônico:** estudo standalone, rota V3 e edição de aulas agora entram pelo mesmo `StudyStudio`.
- **Adapters de contexto:** estudo e aula recebem capabilities explícitas para publicação, audiência, PDF, Reino, IA e ação final.
- **Recuperação local:** alterações ainda não confirmadas são armazenadas com versão e podem ser recuperadas após recarregar.
- **Saída protegida:** o editor alerta antes de sair com alterações não salvas e diferencia visualmente `Salvo`, `Salvando` e `Alterações não salvas`.
- **Privacidade local:** rascunhos são separados por usuário ou sessão anônima e removidos quando o proprietário da sessão muda.
- **Acessibilidade:** campos de título e categoria possuem associação semântica e ações novas mantêm alvo mínimo de toque.
- **Cobertura:** 14 testes focados aprovados para standalone, V3, sala protegida, mobile, layout, slots e recuperação.

## [v2.7.0] - 2026-07-28 (Estúdio da Palavra unificado)
### Tipo: Refactor / Editor / IA / Responsividade
- **Um só estúdio:** a criação de conteúdo e a edição de aulas agora usam o mesmo componente, preservando os blocos e recursos já existentes.
- **Editor visual moderno:** nova barra de ferramentas com Estrutura, Inserir, Modelos, Bíblia e Obreiro IA, painel contextual e canvas limpo.
- **Layout WordPress:** grade real de 12 colunas com composições de largura total, 2/3, 1/2 e 1/3, inclusive no conteúdo publicado.
- **Persistência segura da aula:** salvar dentro da sala grava o plano antes de fechar o editor e mantém a tela aberta quando ocorre erro.
- **IA protegida:** o Estúdio usa rota autenticada no servidor, valida elegibilidade e aplica repetição com espera progressiva.
- **Contrato compartilhado:** `StudyDocumentV2`, normalização de conteúdo legado e `StudyDocumentRenderer` reduzem diferenças entre edição, prévia e leitura pública.
- **Cobertura:** teste Playwright dedicado ao shell unificado e à responsividade mobile.

## [v2.6.17] - 2026-07-27 (Atalhos essenciais da jornada)
### Tipo: Melhoria / UI / Hierarquia
- **CTA removido:** `Meus Estudos` deixou a faixa de atalhos da `/newhome`, permanecendo disponível no menu e na biblioteca.
- **Distribuição equilibrada:** Meta de Leitura, Pão Diário e Oração ao Amanhecer agora ocupam três colunas equivalentes no desktop.
- **Responsividade:** os atalhos continuam empilhados no mobile e preservam áreas de toque acessíveis.
- **Cobertura:** o teste valida a presença de três CTAs, a remoção de Meus Estudos e larguras equivalentes.

## [v2.6.16] - 2026-07-27 (Pesquisa compacta e saudação lateral)
### Tipo: Correção / UI / Otimização de espaço
- **Alvo corrigido:** a redução de largura foi aplicada à pesquisa da `/newhome`, mantendo a navegação por abas em seu tamanho confortável.
- **Saudação reposicionada:** `Bem-vindo, [nome]` aparece imediatamente à direita da pesquisa no desktop, antes das notificações e do perfil.
- **Hierarquia preservada:** a saudação grande continua removida do conteúdo inicial, evitando duplicidade.
- **Cobertura:** o teste valida largura limitada da pesquisa e posicionamento horizontal da saudação.

## [v2.6.15] - 2026-07-27 (Barra compacta e saudação integrada)
### Tipo: Melhoria / UI / Otimização de espaço
- **Barra reduzida:** a navegação de áreas da `/newhome` passou de 56px para 44px de altura, com abas e ícones mais compactos.
- **Saudação integrada:** `Bom dia, [nome]` foi substituído por `Bem-vindo, [nome]` e colocado à direita da barra no desktop.
- **Duplicação removida:** a saudação grande deixou de ocupar uma linha própria dentro do painel inicial.
- **Conteúdo antecipado:** o espaçamento superior do conteúdo foi reduzido, trazendo os cards para mais perto da navegação.
- **Cobertura:** testes validam a nova saudação, ausência do texto antigo, abas e menu mobile.

## [v2.6.14] - 2026-07-27 (Minha semana priorizada na nova Home)
### Tipo: Refactor / UI / UX
- **CTA reorganizado:** o card principal independente de `Próximo culto` foi substituído por uma versão aprimorada de `Minha semana`.
- **Agenda unificada:** o novo card reúne até três compromissos entre cultos e escalas, com acesso direto ao calendário completo.
- **Contexto preservado:** o primeiro culto agendado recebe o selo pequeno `Próximo culto` dentro da lista.
- **Lateral objetiva:** a antiga cópia de `Minha semana` foi removida da coluna lateral e `Minha escala` sobe para a primeira posição quando aplicável.
- **Cobertura:** testes confirmam título único, CTA do calendário, ausência do botão antigo e responsividade.

## [v2.6.13] - 2026-07-27 (Menu Cultos centralizado em Meus Cultos)
### Tipo: Ajuste / Navegação
- **Destino principal:** o item `Cultos` no shell Culto+, no menu mobile e na página inicial agora direciona para `/meus-cultos`.
- **Agenda preservada:** `/culto` continua disponível nos atalhos internos que representam explicitamente a agenda pública.
- **Cobertura:** teste Playwright confirma o `href` apresentado no menu real.

## [v2.6.12] - 2026-07-27 (Reino com largura editorial ampliada)
### Tipo: Melhoria / UI / Responsividade
- **Desktop melhor aproveitado:** a coluna principal de `/social` passou de `max-w-3xl` para um limite editorial de `980px`.
- **Proporção moderna:** cabeçalho, compositor e cards crescem juntos e permanecem alinhados, sem ocupar toda a largura disponível.
- **Mobile preservado:** a coluna continua fluida em telas pequenas e não cria rolagem horizontal.
- **Cobertura:** testes verificam o intervalo de largura no desktop, alinhamento entre blocos e comportamento mobile.

## [v2.6.11] - 2026-07-27 (Orações no tema bíblico premium)
### Tipo: Refactor / UI / UX / Acessibilidade
- **Ecossistema bíblico:** `/oracoes` agora compartilha a paleta de pergaminho, couro, marrom, ouro envelhecido e carvão quente do Pão Diário.
- **Oração do dia:** o antigo banner verde foi substituído por uma superfície editorial marrom e dourada, com texto em branco envelhecido.
- **Contraste corrigido:** os destaques do texto inteligente respeitam a cor do contexto e não deixam trechos escuros sobre o banner.
- **Componentes harmonizados:** gerador personalizado, filtros, cards, ações e estados de carregamento receberam o mesmo vocabulário visual.
- **Fluxos preservados:** áudio, geração por tema, filtros, leitura completa e cópia continuam funcionando.
- **Cobertura:** dois cenários Playwright validam tema, contraste, filtros, gerador e responsividade mobile.

## [v2.6.10] - 2026-07-27 (Pão Diário com leitura prioritária)
### Tipo: Refactor / UI / UX / Acessibilidade
- **Hierarquia editorial:** o título diário é o único título principal; `A Palavra antes de tudo` foi retirado e `Ler a Palavra` tornou-se um marcador discreto.
- **Conteúdo essencial primeiro:** a etapa inicial agora segue versículo, reflexão pastoral, contexto bíblico imediato e `Observe no texto`.
- **Reflexão integrada:** o sentido central recebeu maior peso visual e o contexto bíblico passou a funcionar como aprofundamento dentro do mesmo bloco editorial.
- **Etapas secundárias:** a navegação completa virou trilho lateral no desktop e aparece depois do conteúdo no mobile, sem competir com a leitura.
- **Fluxos preservados:** áudio, tamanho de fonte, foco, atualização diária, cinco etapas e publicação no feed continuam funcionais.
- **Cobertura:** testes validam ordem semântica, responsividade, fluxo completo, tema e rolagem.

## [v2.6.9] - 2026-07-24 (Culto compacto em telas horizontais)
### Tipo: Melhoria / Responsividade / UI
- **Primeira tela completa:** cabeçalho, transmissão e as seis ações rápidas cabem sem rolagem em telas horizontais com pouca altura.
- **Player adaptável:** o vídeo ocupa o espaço restante e mantém conteúdo, controles e mensagem centralizados.
- **Ações em linha:** Check-in, Anotações, Oração, Ofertar, Convidar e Compartilhar ficam em uma grade única e compacta.
- **Gestão preservada:** Ver escala e Editar culto também estão disponíveis no menu superior quando a faixa administrativa é recolhida.
- **Escopo seguro:** o modo compacto só é ativado em paisagem até `900px × 520px`; o layout vertical permanece inalterado.

## [v2.6.8] - 2026-07-24 (Reações no rodapé da timeline)
### Tipo: Ajuste / UI / UX
- **Posição contextual:** Amém, Glória e Aleluia foram movidos para depois da área rolável da timeline.
- **Alinhamento:** a faixa ocupa o rodapé do painel lateral, na mesma direção visual do botão Compartilhar.
- **Acesso preservado:** reações, contadores, carregamento e animações continuam funcionando sem cobrir os eventos.

## [v2.6.7] - 2026-07-24 (Filtro responsivo da timeline)
### Tipo: Fix / UI / Acessibilidade
- **Camadas corrigidas:** o menu do filtro agora abre acima da faixa fixa de reações, sem ser cortado ou encoberto.
- **Responsividade:** botão e menu respeitam a largura útil do painel e não criam rolagem horizontal no mobile.
- **Interação completa:** o seletor fecha ao escolher uma opção, clicar fora ou pressionar Esc.
- **Acessibilidade:** filtro e opções expõem estado, relacionamento e semântica de menu para tecnologias assistivas.

## [v2.6.6] - 2026-07-24 (Continuidade pós-login no culto)
### Tipo: Fix / Autenticação / UX
- **Retorno ao culto:** o login deixa de enviar o participante para a home e restaura a rota completa que iniciou a autenticação.
- **Intenção preservada:** a reação escolhida antes do login fica temporariamente guardada na sessão e é registrada automaticamente após autenticar.
- **Execução segura:** o retorno aceita somente rotas internas; a reação expira, pertence ao culto de origem e é consumida uma única vez.
- **Cobertura:** testes validam o retorno após recarga de OAuth, bloqueio de redirecionamento externo e consumo correto da reação.

## [v2.6.5] - 2026-07-24 (Reações vivas na timeline)
### Tipo: Feature / Realtime / UI / Responsividade
- **Três reações fixas:** Amém, Glória e Aleluia ficam sempre acessíveis junto ao cabeçalho da timeline.
- **Contagem acumulativa:** cada toque gera um novo evento e incrementa o respectivo emoji, inclusive para reações repetidas da mesma pessoa.
- **Presença humana:** foto pública ou iniciais do participante sobem brevemente sobre o painel e desaparecem após a animação.
- **Atualização ao vivo:** reações feitas em outros dispositivos atualizam o contador e a animação pelo canal Realtime do culto.
- **Mobile protegido:** a faixa fica antes dos eventos roláveis, sem sobreposição e sem criar rolagem horizontal.

## [v2.6.4] - 2026-07-24 (Timeline viva do culto)
### Tipo: Feature / Realtime / Segurança / UX
- **Liturgia viva:** o painel lateral organiza check-ins, orações, posts e comentários dentro de cada momento da programação.
- **Leitura imediata:** participantes, cronômetro e progresso litúrgico ficam compactos no topo; filtros permitem focar cada tipo de atividade.
- **Participação contextual:** cada usuário pode publicar ou editar um comentário por bloco litúrgico, sem criar conversas paralelas.
- **Privacidade por contrato:** oração pública mostra até 120 caracteres; oração privada chega à timeline sem conteúdo sensível.
- **Tempo real:** check-ins, posts, orações redigidas e comentários atualizam o culto sem recarregar a página.
- **QA completa:** massa repetível, testes de domínio, validação SQL/RLS/Realtime e revisão responsiva em desktop e mobile.

## [v2.6.3] - 2026-07-24 (Experiência pública de culto imersiva)
### Tipo: Refactor / UI / Responsividade
- **Template compartilhado:** todos os cultos públicos passam a usar a mesma composição visual validada no cenário QA.
- **Foco na transmissão:** vídeo, identificação do culto e atalhos ocupam o painel principal, enquanto contexto ao vivo, participantes e contagem ficam agrupados lateralmente.
- **Ações rápidas:** check-in, anotações, oração, oferta, convite e compartilhamento aparecem imediatamente abaixo da transmissão.
- **Shell imersivo:** menu lateral e navegação móvel globais deixam de competir com a experiência pública do culto.
- **Liturgia confiável:** o intervalo para o próximo momento aceita horários simples e timestamps completos sem exibir valores inválidos.

## [v2.6.2] - 2026-07-23 (Massa QA integral e repetível)
### Tipo: Feature / QA / Supabase / Documentation
- **Cinco personas:** membro, pastor, gestor, líder e visitante possuem contas confirmadas, perfis coerentes e acessos distintos.
- **Cenário completo:** igreja, célula, equipes, funções, cultos, escalas, convites, formulários QR, inbox, notificações e conteúdos foram preenchidos com estados reais.
- **Feed coberto:** os onze tipos de publicação e as cinco visibilidades podem ser avaliados sem depender de dados pessoais.
- **Operação segura:** criação idempotente, credenciais somente em arquivo local ignorado e limpeza isolada pela chave `cultoplus_full_qa_v1`.
- **Validação real:** o gerador confere quantidades mínimas, vínculo entre módulos e autenticação das cinco contas após cada execução.

## [v2.6.1] - 2026-07-23 (Operação da igreja completa e protegida por escopo)
### Tipo: Fix / Security / Supabase / Permissions
- **Estrutura operacional:** funções de equipe, vagas, convites de escala e participação passam a existir no banco com chaves compatíveis com os IDs textuais dos cultos.
- **Quiz personalizado:** criação, leitura pública ativa e gerenciamento pelo autor agora possuem tabela, índices, RLS e contrato JSON consistente.
- **Papéis separados:** pastor deixa de herdar administração; gestor opera toda a igreja e líder atua somente na equipe autorizada.
- **QR seguro:** formulários de equipe carregam escopo explícito, enquanto candidaturas de voluntariado exigem autenticação e vínculo com a igreja.
- **Respostas protegidas:** voluntários podem aceitar ou recusar seus convites sem alterar dados administrativos da escala.
- **Banco validado:** estruturas novas ficaram sem alertas de segurança ou performance no Supabase Advisor.

## [v2.6.0] - 2026-07-23 (Publicação central e segura no Reino)
### Tipo: Feature / Security / Feed / Supabase
- **Contrato único:** Quiz, Pão Diário, oração, reflexão, sentimento e check-in passam pelo serviço central de publicação.
- **Audiência protegida:** políticas RLS diferenciam conteúdo público, seguidores, igreja, grupo e privado diretamente no banco.
- **Conteúdo estruturado:** posts recebem origem, metadados e chave de deduplicação para cards ricos e prevenção de envios repetidos.
- **Fluxo rápido:** o Quiz publica o resultado real, retorna ao Feed sem atraso artificial e destaca a publicação criada.
- **Operações confiáveis:** criação retorna o registro persistido; atualização e exclusão agora propagam falhas para a interface.

## [v2.5.18] - 2026-07-22 (Sentido central alinhado ao leitor)
### Tipo: Fix / Layout / Reading Experience
- **Coluna central:** título, orientação e reflexão pastoral agora compartilham uma coluna de leitura centralizada.
- **Justificação preservada:** cada parágrafo continua justificado dentro da coluna, com a última linha alinhada naturalmente à esquerda.
- **Responsividade:** o bloco ocupa toda a largura disponível no mobile e ganha margens equilibradas em telas largas.

## [v2.5.17] - 2026-07-22 (Etapas e reflexão legíveis no Pão Diário)
### Tipo: Refactor / UX / Reading Experience / Accessibility
- **Etapas reconhecíveis:** o estudo apresenta título, instrução, cinco cartões numerados e estado atual com contraste claro.
- **Progresso visível:** etapas concluídas recebem check e o mobile orienta o gesto para visualizar toda a sequência.
- **Sentido central organizado:** o texto é dividido em parágrafos, recebe alinhamento justificado e preserva uma última linha natural.
- **Ênfase editorial segura:** termos bíblicos relevantes recebem negrito sem alterar a mensagem e sem injetar HTML.
- **Cobertura:** seis testes Playwright validam etapas, estrutura textual, destaques, mobile, rolagem e fluxo completo.

## [v2.5.16] - 2026-07-22 (Tema bíblico escuro suavizado)
### Tipo: Style / UI / Reading Experience / Accessibility
- **Menos peso visual:** grandes superfícies marrons foram substituídas por carvão quente e cinzas de pergaminho.
- **Branco envelhecido:** versículo principal e textos da passagem contextual usam `#E7E0D4`, inspirado na tinta suave de Bíblias usadas.
- **Destaque moderado:** versos-base deixam o laranja saturado e recebem fundo neutro, preservando contraste sem dominar a página.
- **Ouro pontual:** referências, números e progresso mantêm ouro envelhecido apenas como detalhe de hierarquia.
- **Cobertura:** seis testes Playwright aprovam paleta, tipografia, fluxo, mobile e rolagem.

## [v2.5.15] - 2026-07-22 (Rolagem restaurada no shell Culto+)
### Tipo: Fix / Layout / Responsive
- **Causa corrigida:** a cadeia de flexboxes do menu limitava o shell à altura da tela e o `overflow-hidden` do Pão Diário recortava o restante do leitor.
- **Altura natural:** o shell agora cresce conforme o conteúdo, preservando o menu lateral fixo e o contêiner de rolagem global.
- **Eixos separados:** o Pão Diário bloqueia somente o excesso horizontal e mantém a rolagem vertical livre.
- **Cobertura:** teste percorre programaticamente do cabeçalho ao rodapé; os seis cenários Playwright foram aprovados.

## [v2.5.14] - 2026-07-22 (Menu oficial no Pão Diário)
### Tipo: Refactor / Navigation / Responsive / Accessibility
- **Menu oficial:** `/devocional` passa a usar o `CultoPlusPageShell`, com navegação lateral no desktop e cabeçalho expansível no mobile.
- **Estado ativo:** Bíblia permanece expandida e Pão Diário é identificado como a rota atual.
- **Sem duplicidade:** a barra interna antiga foi removida para manter uma única fonte de navegação.
- **Leitura focada:** o modo sem interrupções continua ocultando todo o menu automaticamente.
- **Cobertura:** cinco testes Playwright aprovam desktop, mobile, estado ativo, foco e fluxo completo.

## [v2.5.13] - 2026-07-22 (Pão Diário em identidade bíblica premium)
### Tipo: Refactor / UI / UX / Branding / Responsive
- **Paleta bíblica:** couro profundo, marrom, ouro envelhecido, marfim e pergaminho substituem os acentos verdes e azuis predominantes.
- **Tipografia das Escrituras:** versículo principal e passagem contextual usam uma família serifada clássica inspirada em Bíblias impressas, sem alterar a fonte dos controles.
- **Largura total:** navegação, cabeçalho e leitor passam a acompanhar toda a largura útil disponível, com margens responsivas.
- **Leitura preservada:** reflexões mantêm largura confortável de linha mesmo dentro da superfície ampliada.
- **Cobertura:** cinco testes Playwright aprovam fluxo, mobile, atualização diária, largura, gradiente e tipografia bíblica.

## [v2.5.12] - 2026-07-22 (Pão Diário compartilhado e sem repetição)
### Tipo: Feature / Supabase / Segurança / UX / Mobile
- **Conteúdo oficial do dia:** o primeiro acesso cria ou seleciona o Pão Diário de `America/Manaus`, grava no banco e fixa o mesmo conteúdo para todos naquele dia.
- **Histórico sem repetição:** usuários autenticados recebem uma alternativa do catálogo ou uma nova geração quando já visualizaram o conteúdo oficial.
- **Atualização pessoal:** cada usuário pode gerar um novo Pão Diário uma vez por dia sem alterar a experiência dos demais; falhas liberam a reserva e não gastam a cota.
- **Catálogo reutilizável:** conteúdos gerados são persistidos e podem voltar à rotação em outro dia para pessoas que ainda não os leram.
- **Desktop e mobile:** ação discreta “Atualizar” no desktop e gesto de puxar para baixo no mobile, ambos com confirmação explícita.
- **Proteção de dados:** geração e escrita usam rota de servidor; tabelas de catálogo, agenda, estado e histórico têm RLS e permissões mínimas.

## [v2.5.11] - 2026-07-21 (Feed do Reino na identidade Culto+)
### Tipo: Refactor / UI / UX / Branding / Navigation
- **Menu oficial:** `/social` passa a usar o shell Culto+ e o menu lateral legado deixa de ser renderizado nessa rota.
- **Identidade do Reino:** fundo marfim, azul-marinho e verde operacional organizam abertura, estados e ações sem descaracterizar os tipos de publicação.
- **Publicação mais direta:** uma entrada visível reúne reflexão, check-in e criação de arte; o botão flutuante permanece no mobile com rótulos acessíveis.
- **Navegação contextual:** Feed, igreja e exploração ficam disponíveis no cabeçalho, além do menu principal.
- **Cards atualizados:** publicações, conteúdos sugeridos, meditação, carregamento, erro e módulo indisponível adotam superfícies e hierarquia da nova interface.
- **Fluxos preservados:** publicar, comentar, curtir, compartilhar, editar, excluir, atualizar e abrir o compositor continuam usando a lógica existente.
- **Correção de rolagem:** o comando de voltar ao topo passa a apontar para o contêiner realmente rolável do Feed.
- **Cobertura:** TypeScript direcionado e 19 testes do shell, Feed e regras sociais aprovados, incluindo três novos cenários estruturais.

## [v2.5.10] - 2026-07-21 (Alternância de visão slim)
### Tipo: Refactor / UI / UX / Accessibility
- **Ícones lado a lado:** Minha visão, Gestão da Igreja e Workspace Pastoral agora aparecem em um único controle horizontal compacto.
- **Menu mais leve:** os cards com título e descrição foram removidos; o seletor ocupa o antigo espaço do selo “Papéis acumulativos”.
- **Sempre disponível:** a opção de ocultar e o estado persistido em `localStorage` foram retirados.
- **Permissões preservadas:** cada usuário continua vendo somente as visões para as quais possui acesso.
- **Acessibilidade:** todos os ícones mantêm nome acessível, tooltip, foco por teclado e indicação visual/semântica da visão atual.
- **Cobertura:** TypeScript direcionado e dois testes de regra aprovados.

## [v2.5.9] - 2026-07-21 (Palavra com contexto bíblico ampliado)
### Tipo: Feature / Content / Bible / UI / UX / Pastoral
- **Versículo dentro da passagem:** a etapa Palavra mostra dois versículos anteriores e dois posteriores, com o versículo-base destacado e referência do trecho ampliado.
- **Fonte bíblica local:** um endpoint interno lê `biblia_completa.json` no servidor e entrega somente os versos necessários, evitando incluir os 4,3 MB da Bíblia no bundle do navegador.
- **Leitura estruturada:** livro, capítulo, versículo-base e testamento aparecem antes do contexto; perguntas de observação ajudam o usuário a retornar ao próprio texto.
- **Separação pastoral:** “Sentido central” identifica claramente a reflexão editorial e lembra que ela auxilia, mas não substitui, a leitura do capítulo completo.
- **Conteúdo mais profundo:** o devocional padrão agora explica contexto imediato, sentido central e aplicação prudente em três parágrafos.
- **Geração futura protegida:** novos devocionais devem seguir a mesma estrutura, omitir detalhes incertos e não transformar aplicação pastoral em citação bíblica.
- **Áudio enriquecido:** quando o contexto está disponível, a narração inclui o trecho ampliado antes da reflexão e da oração.
- **Fallback resiliente:** o serviço prioriza a Bíblia local, mantém o cache existente como alternativa e preserva o versículo-base se o contexto ampliado falhar.
- **Cobertura:** TypeScript direcionado aprovado, 17 testes de regra passaram e 8 cenários Playwright validaram contexto real, fluxo, foco e mobile.

## [v2.5.8] - 2026-07-21 (Pão Diário em leitor de estudo compacto)
### Tipo: Refactor / UI / UX / Reading Experience / Accessibility
- **Uma etapa por vez:** Palavra, reflexão, oração, prática e conclusão deixam de ocupar uma página longa e passam a ser capítulos do mesmo leitor.
- **Rolagem reduzida:** o cabeçalho foi compactado e apenas o conteúdo da etapa ativa permanece no DOM, diminuindo drasticamente a altura total da página.
- **Fluxo explícito:** botões “Etapa anterior” e ações de continuidade conduzem o usuário sem depender de rolagem ou de descobrir o próximo bloco.
- **Caderno de estudo:** uma única superfície editorial reúne progresso, capítulos, leitura e ações, substituindo a percepção de dashboard por uma experiência de leitura concentrada.
- **Controles preservados:** áudio, tamanho da fonte, modo sem interrupções, deep link bíblico, reflexão privada, oração, prática, conclusão e publicação opcional continuam disponíveis.
- **Retomada inteligente:** ao abrir a página, o leitor posiciona o usuário na primeira etapa ainda não concluída; jornadas finalizadas abrem no encerramento.
- **Mobile mais direto:** abertura encurtada, capítulos roláveis horizontalmente, alvos de toque acessíveis e ausência de menu inferior ou assistente flutuante durante o estudo.
- **Prudência pastoral:** a sequência mantém a Palavra antes da interpretação e apresenta a prática como decisão pessoal, nunca como medida de fé.
- **Cobertura:** TypeScript direcionado aprovado e 8 cenários Playwright passaram, cobrindo identidade, sessão, fluxo integral, foco e responsividade.

## [v2.5.7] - 2026-07-21 (Pão Diário em experiência editorial)
### Tipo: Refactor / UI / UX / Reading Experience
- **Fim da aparência de sistema:** `/devocional` deixa de usar o shell com menu lateral e passa a ter navegação mínima, própria para um momento de leitura.
- **Landing acolhedora:** a abertura reúne marca, data, duração estimada, título, introdução, áudio, tipografia, modo sem interrupções e um único CTA para iniciar ou continuar.
- **Leitura contínua:** os cards operacionais e o resumo lateral foram removidos; Palavra, reflexão, oração, prática e conclusão agora formam uma coluna editorial de rolagem.
- **Progresso discreto:** as cinco etapas permanecem acessíveis em uma linha narrativa, sem aparência de checklist administrativo.
- **Hierarquia pastoral:** o versículo antecede a reflexão; a oração ganha uma pausa visual própria e a prática é apresentada como decisão pessoal, não como medida de fé.
- **Ações contextuais:** salvar, dizer “Amém”, marcar a prática, concluir e compartilhar aparecem dentro do momento correspondente da leitura.
- **Sem interrupções artificiais:** a barra inferior mobile e o botão flutuante do Obreiro IA ficam ocultos nessa rota, preservando o caráter contemplativo da leitura.
- **Responsividade:** a composição mantém largura confortável, alvos de toque acessíveis e ausência de rolagem horizontal no mobile.
- **Fluxos preservados:** retomada, atividade devocional, privacidade, áudio, foco, deep link bíblico e publicação específica no Reino continuam funcionais.
- **Cobertura:** TypeScript direcionado aprovado e 8 cenários Playwright passaram de forma sequencial, cobrindo identidade, navegação, fluxo integral, foco e mobile.

## [v2.5.6] - 2026-07-21 (Pão Diário guiado e compartilhável)
### Tipo: Feature / UI / UX / Social / Accessibility
- **Encontro em cinco etapas:** `/devocional` conduz por leitura, reflexão, oração, prática e conclusão, com todas as etapas visíveis e progresso objetivo.
- **Retomada real:** progresso, prática, conclusão e estado de compartilhamento são restaurados localmente; reflexão e “Amém” autenticados continuam reconciliados com `user_devotionals`.
- **Leitura confortável:** título compacto, controles A−/A/A+, narração central e modo sem interrupções seguem a identidade visual do Culto+ em desktop e mobile.
- **Bíblia no contexto:** a referência do dia abre diretamente no livro, capítulo e versículo do leitor existente.
- **Atividade consistente:** a conclusão registra `recordActivity('devotional')` uma única vez, sem recompensa manual divergente no botão “Amém”.
- **Publicação opcional:** após concluir, o usuário pode abrir uma prévia, escrever uma mensagem pública e escolher Reino, igreja ou grupo antes de confirmar.
- **Privacidade por padrão:** a reflexão pessoal não compõe o payload nem o card do feed; somente a mensagem pública digitada no popup é publicada.
- **Persistência prudente:** rascunho e aplicação pessoal não são enviados para a tabela genérica de configurações; a reflexão autenticada permanece no fluxo com RLS já existente.
- **Card exclusivo no Reino:** posts `devotional` recebem layout próprio com título, versículo, referência e link de retorno ao Pão Diário, reutilizado também na prévia.
- **Compatibilidade de dados:** o conteúdo estruturado é serializado na tabela de posts existente; nenhuma migração ou tabela adicional foi necessária.
- **Cobertura:** 32 testes de regras, persistência, resolução e feed passaram; 3 cenários Playwright validaram fluxo completo, modo foco e responsividade mobile.

## [v2.5.5] - 2026-07-21 (Módulos bíblicos na identidade Culto+)
### Tipo: Refactor / UI / UX / Branding / Navigation
- **Experiência integrada:** `/devocional`, `/oracoes`, `/plano` e `/quiz` passam a usar o shell oficial, a logo e o menu pessoal do Culto+.
- **Navegação coerente:** o módulo Bíblia abre automaticamente na rota ativa e mantém Pão Diário, Meta de Leitura, Orações e Quiz Bíblico no mesmo contexto.
- **Identidade visual:** as páginas adotam fundo marfim, azul-marinho e verde operacional, preservando acentos próprios para oração, devocional e modos do quiz.
- **Mobile unificado:** cabeçalho e barra inferior seguem o padrão Culto+, com Bíblia destacada em todas as quatro experiências e sem o deslocamento do menu legado.
- **SEO e produto:** títulos, descrições, metadados e compartilhamento passam a apresentar Culto+ como marca principal.
- **Fluxos preservados:** geração e reprodução de orações, reflexão diária, progresso de leitura, autenticação da meta e modos do quiz não tiveram suas regras alteradas.
- **Cobertura:** testes Playwright validam shell, logo, menu ativo, navegação protegida e comportamento mobile, em conjunto com a cobertura da Bíblia Sagrada.

## [v2.5.4] - 2026-07-21 (Bíblia Sagrada na identidade Culto+)
### Tipo: Refactor / UI / UX / Branding / Navigation
- **Shell oficial:** `/bibliasagrada` e o alias `/biblia` passam a usar a logo, a alternância de visão e o menu pessoal do Culto+.
- **Módulo bíblico completo:** o menu da Bíblia reúne Bíblia Sagrada, Pão Diário, Meta de leitura, Orações e Quiz Bíblico, abrindo automaticamente na rota ativa.
- **Navegação mobile unificada:** a barra inferior adota `Início`, `Bíblia`, `Cultos`, `Reino` e `Perfil`, mantendo Bíblia destacada e removendo o espaçamento do cabeçalho legado.
- **Identidade da página:** título, descrição e metadados passam a apresentar `Bíblia Sagrada | Culto+` e a logo oficial.
- **Leitor preservado:** o conteúdo de capítulos e versículos não foi alterado; no mobile, o cabeçalho do shell é ocultado durante a leitura para manter a barra própria do leitor.
- **Cobertura:** testes Playwright validam desktop, mobile, menu expandido, identidade, alinhamento do topo e abertura de Gênesis 1.

## [v2.5.3] - 2026-07-17 (Culto+ como ecossistema completo)
### Tipo: Refactor / UI / UX / Branding
- **Nova apresentação:** `/intro` passa a comunicar o Culto+ como evolução integral do BibliaLM, conectando Bíblia, jornada espiritual, comunidade, cultos, serviço, cuidado pastoral e gestão.
- **Identidade oficial:** a página adota a logo atual e combina o marfim, azul-marinho e verde operacional do app com os acentos roxo, coral e dourado da marca.
- **Três visões conectadas:** Minha visão, Workspace Pastoral e Gestão da Igreja aparecem como experiências acumulativas de uma única conta.
- **Narrativa de produto:** seis pilares e a jornada “Ler, Crescer, Participar, Servir, Cuidar e Gerir” tornam a capacidade do ecossistema mais clara.
- **Responsividade e acesso:** layout em largura total, navegação semântica, foco visível, alvos de toque acessíveis e reorganização completa para mobile.
- **Cobertura visual:** testes Playwright validam conteúdo, CTAs, remoção da marca antiga na apresentação e ausência de rolagem horizontal no mobile.

## [v2.5.2] - 2026-07-17 (Recusa de solicitação de voluntariado)
### Tipo: Feature / UI / UX / Notifications
- **Decisão completa:** o detalhe da candidatura no Inbox passa a oferecer a ação “Recusar solicitação” ao lado do fluxo de aprovação.
- **Confirmação segura:** a recusa exige confirmação no próprio popup e permite registrar uma orientação opcional para o candidato.
- **Retorno ao usuário:** a solicitação é encerrada com status público específico, aparece como “Recusada” em Meus Cultos e gera uma notificação direcionada para essa área.
- **Nova tentativa liberada:** a recusa encerra somente o envio atual e informa explicitamente que o usuário pode enviar uma nova candidatura quando desejar.
- **Reenvio pelo acompanhamento:** solicitações recusadas exibem “Tentar novamente” em Meus Cultos e reabrem o formulário original da mesma igreja quando ele continua ativo.
- **Retorno legível:** somente a orientação escrita pela liderança recebe negrito; o texto operacional permanece com peso normal.
- **Identificação no convite:** formulários de voluntariado preenchem o contato com o `@usuário`; o nome completo vem do cadastro somente quando não é igual ao apelido, permanecendo editável quando ausente.
- **Estado consistente:** solicitações recusadas saem das pendências, aparecem como “Recusado” na lista e não podem ser reabertas pelo controle genérico de status.

## [v2.5.1] - 2026-07-16 (Pessoas como fluxo operacional único)
### Tipo: Refactor / UI / UX / Navigation
- **Sem abas internas:** `/gestao-igreja/pessoas` deixa de apresentar sete áreas concorrentes e passa a começar diretamente pela lista de pessoas.
- **Hierarquia compacta:** quatro indicadores, uma faixa acionável de pendências, busca e filtros ocupam o primeiro viewport sem hero ou cards excessivos.
- **Perfil sob demanda:** clicar em uma pessoa abre um drawer temporário, sem abas, com próximas escalas, equipes, acessos e contato em sequência.
- **Escala preservada:** a agenda mensal continua disponível no drawer e permite selecionar dia, culto, equipe e função sem navegar para outra página.
- **Convite para equipe:** “Adicionar à equipe” envia convite pendente; o papel de voluntário só é ativado depois do aceite explícito do membro.
- **Fluxos contextuais:** equipes, designações, voluntariado, QR Codes e permissões abrem em pop-ups; as rotas antigas redirecionam usando `panel`, não abas.
- **Inbox rápido:** o cabeçalho mantém aprovações diretas em um card temporário e a faixa de pendências abre uma lista objetiva para decisão.
- **Responsivo:** tabela vira blocos legíveis no mobile e o perfil operacional ocupa um drawer de largura adaptativa.

## [v2.5.0] - 2026-07-16 (Central operacional da igreja)
### Tipo: Feature / Refactor / UI / UX / Security
- **Página única:** Pessoas, equipes, escalas, voluntariado, convites, QR Codes e permissões passam a funcionar em abas de `/gestao-igreja/pessoas`.
- **Agenda individual:** clicar em uma pessoa abre um perfil operacional em pop-up com calendário mensal, equipes, permissões, histórico e status de cada escala.
- **Escala pelo calendário:** gestor ou líder autorizado pode selecionar um dia, culto e equipe para enviar uma escala pontual que exige confirmação do voluntário.
- **Regras preservadas:** vínculo com a equipe e participação no culto continuam independentes; a operação bloqueia pessoa sem vínculo, equipe fora do escopo, duplicidade e conflito de horário.
- **Indicadores e filtros:** a central apresenta métricas reais e mantém busca por pessoa, equipe, papel e situação operacional.
- **Menu consolidado:** seis entradas administrativas são reunidas em “Pessoas e equipes”; rotas antigas redirecionam para a aba correspondente.
- **Compatibilidade:** detalhes, edições e cadastros antigos continuam disponíveis enquanto os fluxos principais passam a abrir na central.

## [v2.4.1] - 2026-07-16 (Cultos como central pessoal)
### Tipo: Refactor / UI / UX / Navigation
- **Hub único:** `/meus-cultos` reúne indicadores, escalas, candidaturas de voluntariado, equipes e histórico pessoal em largura total.
- **Fluxo por pop-ups:** detalhes de designações, solicitações e equipes abrem no próprio painel; convites de escala podem ser aceitos ou recusados sem trocar de página.
- **Status real:** a área Minha escala diferencia convite pendente, escala confirmada, candidatura enviada, em análise, aguardando usuário e aprovada.
- **Notificações preservadas:** candidaturas continuam chegando aos alertas da gestão e o retorno público é mostrado no painel pessoal.
- **Rotas consolidadas:** `/minha-igreja/*` permanece apenas como compatibilidade e redireciona para a seção correspondente de `/meus-cultos`.
- **Menu simplificado:** Minha Igreja deixa de competir com Cultos; escala, equipes e solicitações ficam agrupadas sob Cultos.
- **Menu consistente:** o hub de Cultos adota os mesmos módulos expansíveis, alternador de visão, permissões e menu mobile da nova Home, mantendo Cultos aberto por padrão.
- **Inbox em Gestão de Cultos:** o cabeçalho administrativo recebe um atalho com contador e card rápido das aprovações de escala e voluntariado, com acesso ao Inbox completo.
- **Aprovação pelo card:** cada pendência do Inbox em Gestão de Cultos exibe a ação Aprovar; escalas são confirmadas no próprio card e candidaturas abrem diretamente a seleção de equipe e função.

## [v2.4.0] - 2026-07-12 (New Home isolada)
### Tipo: Feature / UI / UX / Architecture
- **Gestao de Cultos:** `/gestao-igreja/cultos` recebe shell administrativo Culto+, menu completo com Cultos em primeiro lugar e rota propria `/gestao-igreja/cultos/novo` para criacao.
- **Visoes acumulativas:** o shell de Gestao da Igreja agora permite alternar entre a visao pessoal, pastoral (quando autorizada) e administrativa sem modificar o perfil ou perder papeis.
- **Menu pessoal adaptativo:** a `/newhome` agora identifica as visoes autorizadas da mesma conta e oferece retorno bidirecional para o Workspace Pastoral e a Gestao da Igreja no desktop e no mobile.
- **Workspace Pastoral no menu:** a Home e a rota pastoral passam a reconhecer tambem os papeis ativos de pastor e gestor em `church_member_roles`, sem depender apenas do tipo geral do perfil.
- **Template pastoral:** o Workspace Pastoral recebe shell Culto+ proprio, menu responsivo e alternador compartilhado entre as tres visoes, com opcao persistente de ocultar e mostrar o bloco.
- **Alertas do gestor:** contas com acesso a Gestao da Igreja recebem uma central rapida com aprovacoes de escala, solicitacoes de voluntariado, notificacoes operacionais e cultos incompletos nas proximas 72 horas.
- **Painel de notificacoes responsivo:** a central rapida do gestor passa a respeitar as bordas e a altura do viewport no mobile, mantendo lista rolavel e rodape sempre acessivel.
- **Data das notificacoes:** cada pendencia da central do gestor agora exibe data e horario; alertas vinculados a cultos tambem destacam quando o culto acontecera.
- **Marca na nova Home:** a logo Culto+ ganhou maior destaque no menu lateral e no cabecalho mobile, mantendo sua proporcao original.
- **Meus Cultos pessoal:** a rota `/meus-cultos` passa a reunir somente check-ins, registros externos, escalas e times do usuario, com o shell visual do Culto+ e sem listar cultos sem vinculo.
- **Menus por perfil:** Workspace Pastoral passa a aparecer na nova Home somente para perfis pastorais; Configuracoes fica disponivel com conta, perfil, planos e suporte.
- **Navegacao por modulo:** sidebar e mobile receberam submenus expansiveis com paleta, icones e atalhos completos por area, filtrados pelas permissoes do usuario.
- **Refinamento visual:** cards de Meta de Leitura, Pao Diario, Oracao e Meus Estudos, coluna Minha Semana, resumo do Reino e area de escala responsiva.
- **Abas completas:** Criar, Reino, Gestao e Calendario receberam os mesmos grupos funcionais da `Inicio03`, respeitando acesso e dados reais.
- **Marca oficial:** o shell da nova Home utiliza o arquivo de logo Culto+ fornecido, sem redesenho da identidade.
- **Resumo:** Nova experiência de Home disponível em `/newhome`, sem substituir ou remover a Home atual em `/`.
- **Novidades:**
  - **Home como hub:** cinco abas exclusivas da página (`Início`, `Criar`, `Reino`, `Gestão` e `Calendário`) com navegação acessível e estado persistido na URL.
  - **Conteúdo real:** estudos, notas, salas, cultos e designações são carregados pelas camadas de serviço existentes, sem dados operacionais fictícios.
  - **Personalização por papel:** pastores e gestores veem salas próprias; voluntários veem convites e escalas; papéis simultâneos compõem os dois blocos.
  - **Estados seguros:** visitantes, ausência de igreja, listas vazias e falhas parciais recebem mensagens e atalhos adequados.
  - **Shell isolado:** marca Culto+, sidebar e navegação móvel específicas da nova rota, preservando integralmente o shell da Home atual.
  - **Verificação:** typecheck e teste Playwright dedicado à rota e às abas.

## [Unreleased] - 2026-06-23 (Gestao da Igreja independente)
### Tipo: Feature / Security / MVP
- **Resumo:** Avanco do roadmap de Gestao da Igreja para reduzir dependencia de previews e fechar fluxos reais do MVP.
- **Novidades:**
  - **Perfis gerais separados de permissoes:** Perfis agora suportam `Usuario`, `Pastor` e `Gestor` via `profileType`, mantendo permissoes reais da igreja em roles operacionais.
  - **Pastor/Gestor sem igreja:** `/complete-profile` permite escolher Pastor ou Gestor sem solicitar permissao da igreja; a Gestao da Igreja mostra CTA de vinculo/solicitacao sem conceder acesso automatico.
  - **Compatibilidade Supabase:** `profiles.profile_type` foi adicionado com backfill para contas `subscription_tier = pastor`, mantendo fallback para ambientes ainda nao migrados.
  - **QR publico real:** `/qr/[token]` agora busca o formulario ativo via `churchManagementService.getQrFormByToken`, registra scan por sessao e usa preview apenas como fallback quando o schema ainda nao estiver disponivel.
  - **Envio para inbox:** O formulario publico aceita `ChurchQrForm` real e envia respostas para `church_form_submissions`, preservando mensagem de fallback para ambientes demonstrativos.
  - **Gate operacional:** Novo `ChurchManagementAccessGate` protege todo o segmento `/gestao-igreja` por igreja vinculada e papel operacional ativo (`church_manager`, `pastor` ou `leader`), mantendo admin como excecao tecnica.
  - **Minha Igreja com dados reais:** A home de `/minha-igreja` passa a exibir submissions, designacoes e insignias reais do membro quando disponiveis, mantendo previews apenas como estado demonstrativo.
  - **Contadores de QR:** O SQL do modulo agora inclui `increment_church_qr_counter`, usado para scans e envios sem depender de RPC generica externa ao roadmap.
  - **Admin legado da igreja:** O gate operacional tambem reconhece admins/fundadores registrados em `churches.admins`, preservando compatibilidade com igrejas criadas antes dos novos roles.
  - **Inbox operacional:** A inbox ganhou atribuicao de responsavel, prioridade e botao "atribuir a mim", conectados a `updateSubmissionStatus`.
  - **Notificacoes dedicadas:** Criado `churchNotificationService` com matriz inicial de eventos, canais e severidades padrao para os fluxos essenciais.
  - **Eventos de notificacao:** SQL e service agora registram `church_notification_events` com origem, dedupe, status e payload minimo antes da notificacao visivel.
  - **Central de alertas operacional:** `/gestao-igreja/notificacoes` ganhou filtros por estado, refresh, leitura em lote, links acionaveis e RLS para operadores atualizarem alertas do dashboard.
  - **Diretorio operacional real:** `/gestao-igreja/pessoas` deixou de preencher cards ficticios quando nao ha papeis reais, usa metadados dos roles quando existem e mostra estado vazio com atalho para nova permissao.
  - **QR anonimo com alerta seguro:** SQL adiciona `notify_church_form_submission`, uma RPC `security definer` para criar eventos/notificacoes de submissions publicas sem depender de permissao client-side.
  - **Listagens sem operacao ficticia:** Designacoes, QR Codes, Equipes e Notificacoes deixam de usar cards demonstrativos quando a base real esta vazia e passam a exibir estados vazios acionaveis.
  - **Detalhes e hubs sem preview:** Detalhes, Inbox, Grupos/Celulas e Culto+ deixam de preencher registros ficticios e passam a mostrar estados vazios reais com atalhos para a acao correta.
  - **Services sem fallback ficticio:** `churchManagementService` passa a retornar listas vazias/contadores zerados quando o schema do modulo ainda nao foi aplicado, mantendo previews apenas em catalogos intencionais da UI.
  - **Jornadas guiadas:** Novas paginas `/gestao-igreja/jornada` e `/minha-igreja/jornada-obreiro` explicam os fluxos de gestor, lider, pastor, voluntario e obreiro.
  - **Pipeline de voluntariado:** Nova rota `/gestao-igreja/voluntariado` organiza interesses reais de QR/formulario `volunteer` por etapa, com atribuicao, acompanhamento e encerramento.
  - **Categorias de voluntariado:** Pipeline e QR de voluntarios agora usam cargos padronizados por ministerio, com filtro por categoria, contagem e inferencia para envios antigos.
  - **Admin de gestao de igrejas:** `/admin?view=church_management` lista gestores aprovados/ativos por igreja, e `/admin?view=users` mostra igreja vinculada e tipo de conta de cada usuario.
  - **Impressao premium de QR Codes:** Cada QR Code da Gestao ganhou pagina A4 para mural, com dados da igreja, lider, criador, vaga/formulario, QR central e link publico.
  - **Culto+ operacional:** `/gestao-igreja/cultos` agora usa resumo da Gestao para mostrar check-ins, pedidos de oracao, escalas e pendencias por culto sem duplicar o CRUD do Culto+.
  - **Status das fases:** Novo documento `docs/roadmaps/gestao-igreja-independente-status.md` consolida fases implementadas, parciais e pendentes do MVP.
  - **Reconhecimento de voluntario:** Aceite de designacao passa a tentar registrar insignia privada de disponibilidade, evento de Mana auditavel e notificacao ao membro, sem bloquear o aceite se o schema ainda nao estiver aplicado.
  - **RLS de reconhecimento:** SQL atualizado para permitir que o proprio assignee registre apenas a badge de designacao aceita vinculada a uma designacao real aceita.
  - **Snapshots leves:** SQL, service e tela de relatorios agora suportam `church_analytics_snapshots`, com criacao/listagem de snapshots diarios para indicadores historicos de baixo custo.
  - **Grupos com convites reais:** `/gestao-igreja/grupos` passou a consumir `churchManagementService.getGroupOperationalItems`, exibindo grupos/celulas reais e convites pendentes sem acesso direto da UI ao banco.
  - **Infra SQL/RLS validavel:** Novos comandos `church:sql:apply`, `church:sql:validate` e `church:rls:validate` aplicam/auditam o SQL principal no Postgres do Supabase quando a conexao real esta correta.
  - **Testes ESM organizados:** `test:church-management` agora usa um runner local com esbuild e `node --test`, evitando falha do loader `ts-node/esm` no Node 24.
  - **Sincronizacao Culto+ -> Gestao:** `syncCultoPlusOperationalItems` importa escalas como designacoes e pedidos publicos de oracao como inbox, usando `source_type/source_id` para evitar duplicidade.
  - **Acompanhamento de grupos:** Grupos/celulas agora podem gerar alertas operacionais deduplicados para convites pendentes.
  - **RLS por perfil real:** Novo comando `church:rls:profiles` prepara testes com UUIDs reais de gestor, pastor, lider, voluntario, membro comum e admin.
  - **Regras testaveis do modulo:** Nova camada `utils/churchManagementRules.ts` cobre gate, QR publico, inbox, notificacoes e categorias de voluntariado com testes locais; `test:church-management` agora executa 28 casos.

## [v2.3.0] - 2026-06-12 (Mana, Niveis e Rankings)
### Tipo: Feature / Architecture / Database
- **Resumo:** Implementacao inicial do roadmap de expansao de Mana, niveis e rankings.
- **Novidades:**
  - **Fonte unica de regras:** Matriz completa de `ActionType` com XP, limites diarios, cooldowns, estrategia anti-duplicidade, publico e status.
  - **Progresso e badges:** `recordActivity` agora atualiza `stats` e libera conquistas baseadas em estatisticas, alem dos niveis por XP.
  - **Anti-abuso inicial:** Leitura de capitulo so concede Mana quando o capitulo ainda nao estava concluido e eventos repetidos por fonte/dia passam a ser ignorados.
  - **Competicao:** Nova rota protegida `/competicao` com progresso pessoal, checklist diario, regras de Mana e ranking global de usuarios.
  - **Eventos sociais:** Comentarios no Reino, comentarios em jornadas, convites e mencoes passam a usar ActionTypes explicitos.
  - **Banco preparado:** Novo script `scripts/create_mana_gamification.sql` para `mana_events`, regras, niveis, badges configuraveis e snapshots de igreja.
  - **Auditoria Admin:** Nova aba `Auditoria Mana` para revisar e anular eventos quando `mana_events` estiver disponivel.
  - **Campanhas:** Temporadas/desafios de Mana configuraveis em `SystemSettings.gamificationCampaigns`.
  - **Estimulos:** `ManaNudge` contextual na Home e Mapa Vivo atualizado com a Central de Competicao.

## [v2.2.0] - 2026-05-18 (Culto+ MVP)
### Tipo: Feature / Architecture / Database
- **Resumo:** Primeira entrega do Culto+, criando a base de acompanhamento digital de cultos no BibliaLM.
- **Novidades:**
  - **Workspace Pastoral:** Novo gestor de cultos com cadastro, tema, pregador, horarios, versiculo-chave, banner e timeline liturgica.
  - **OnePage do Culto:** Nova rota publica `/culto/[serviceSlug]` com check-in, anotacoes privadas, timeline e postagem vinculada ao mural da igreja.
  - **Pagina da Igreja:** Nova aba `Cultos` mostrando as OnePages publicadas pela comunidade.
  - **Feed do Reino:** Posts agora podem receber `service_id` e `service_title` para copostagem ligada ao culto.
  - **Infraestrutura:** Novo servico `cultoPlusService`, tipos globais e script `scripts/create_culto_plus.sql` com tabelas/RLS iniciais.

## [v2.1.0] - 2026-05-11 (Ecossistema Social & Gestão de Perfil)
### Tipo: Feature / UI / UX / Database
- **Resumo:** Expansão das funcionalidades sociais e melhoria profunda na gestão de perfis e interatividade.
- **Novidades:**
  - **Interatividade Social**: Implementação de sistema de comentários em posts (`PostCommentsSheet`), contagem de visualizações e curtidas em tempo real.
  - **Gestão de Perfil**: Refatoração completa da edição de perfil (`CompleteProfilePage`), incluindo campos para biografia, redes sociais e personalização de avatar/capa.
  - **Feed do Reino Otimizado**: Melhorias no hook `useKingdomFeed` para suportar filtragem avançada por igreja e integração de posts oficiais no mural geral.
  - **Infraestrutura de Banco**: Scripts de migração SQL para novas colunas sociais, visualizações e metadados de comentários no Supabase.
  - **Experiência do Usuário**: Novo cabeçalho padrão (`StandardHeader`) e navegação social aprimorada.
  - **Suíte de Testes**: Adição de testes para mood de posts, interações sociais, e fluxos de edição de perfil.

## [v2.0.0] - 2026-05-06 (Ecossistema Social & Expansão Eclesiástica)
### Tipo: Feature / Architecture / UX
- **Resumo:** Lançamento da v2.0 com foco total em comunidade e remoção de barreiras financeiras.
- **Novidades:**
  - **Remoção de Monetização**: Todo o sistema de planos e pagamentos foi desativado. Usuários agora possuem acesso total às funcionalidades premium globalmente.
  - **Ecossistema de Igrejas**: Sistema completo de gestão de igrejas, incluindo administração, perfis públicos e fundação de comunidades.
  - **Grupos Sociais**: Implementação de grupos sociais com regras de acesso, convites e moderação.
  - **Privacidade de Conteúdo**: Novos controles de privacidade para posts e estudos.
  - **Infraestrutura Social**: Fallback inteligente para o feed do Reino e melhorias no payload de posts.
  - **Testes de Integridade**: Adição de suíte de testes abrangente para regras de atividade, busca de igrejas e segurança de grupos.

---

### Tipo: Infrastructure / Fix / DOM
- **Resumo:** Expansão do sistema de auto-cura para neutralizar erros de `isBatchingLegacy` no `react-dom`.
- **Novidades:**
  - **React DOM Patch**: Proteção contra falhas de `ReactCurrentActQueue` em 23 arquivos do `react-dom`.
  - **Bridge v2**: Reforço da ponte de runtime no `layout.tsx` para garantir estabilidade do `ErrorBoundary` no navegador.
  - **Zero-Crash Build**: Validada a renderização estática de 61 páginas sem erros de reconciliador.

---

## [v1.9.2] - 2026-04-24 (Estabilização Nuclear do Reconciler)
### Tipo: Infrastructure / Fix / Security
- **Resumo:** Implementação de um sistema de auto-cura universal que neutraliza falhas de internos do React diretamente no `node_modules`.
- **Novidades:**
  - **Nuclear Reconciler Patch**: Patch cirúrgico injetado no `react-reconciler` (dev/prod) para prevenir o erro de `ReactSharedInternals is undefined`.
  - **Auto-Healing System (v2)**: Novo script `fix-konva-crash.cjs` que monitora e cura automaticamente `its-fine`, `react-konva` e `react-reconciler` após cada instalação.
  - **ESM Compatibility**: Script de automação convertido para CommonJS para garantir execução estável em ambientes Next.js com módulos nativos.
- **Arquivos Afetados:**
  - `scripts/fix-konva-crash.cjs` (Novo motor de estabilização)
  - `package.json` (Vínculo do patch ao ciclo de vida de instalação)
  - `constants.ts` (Bump v1.9.2)

---

## [v1.9.1] - 2026-04-24 (Estabilização do Motor de Canvas)
### Tipo: Infrastructure / Fix / DevOps
- **Resumo:** Estabilização crítica do motor de renderização Konva para resolver erros de "ReactSharedInternals is undefined" no Turbopack.
- **Novidades:**
  - **React Internals Bridge**: Implementada ponte de compatibilidade no `layout.tsx` para garantir que o Konva acesse corretamente os segredos do React em ambientes Next.js modernos.
  - **Isolamento de SSR**: Refatoração de todos os componentes de Canvas (`SlideKonva`, `SacredArtCanvas`, `TextNode`) para importação dinâmica 100% isolada do servidor.
  - **Dependency Overrides**: Forçada a consistência de instâncias do React via `package.json` para evitar duplicidade de bibliotecas no bundle final.
- **Arquivos Afetados:**
  - `app/layout.tsx` (Implementação da Ponte Global)
  - `package.json` (Adicionado `overrides` de React)
  - `next.config.ts` (Otimização de `transpilePackages`)
  - `components/Builder/blocks/SlideKonva.tsx` (Ponte local e isolamento)
  - `components/sacred-art-editor/SacredArtCanvas.tsx` (Ponte local e isolamento)
  - `constants.ts` (Bump v1.9.1)

---

## [v1.9.0] - 2026-04-23 (Acesso Freemium & Estúdio Profissional)
### Tipo: Feature / UI / UX / Architecture
- **Resumo:** Transformação do modelo de acesso para "Freemium" (convidados podem explorar sem login) e refatoração completa do Estúdio de Arte Sacra para um design de sidebar profissional.
- **Novidades:**
  - **Modelo Freemium**: Removida a obrigatoriedade de login para acessar o app. Visitantes podem explorar o Santuário e usar o Estúdio de Arte (limite de 2 usos gratuitos via localStorage).
  - **Sidebar Profissional**: O painel de ferramentas da Arte Sacra foi refatorado para uma barra lateral direita em estilo glassmorphic, melhorando a ergonomia e o foco na arte.
  - **Sincronização de Precisão**: Corrigido erro de desalinhamento (âncora) entre o editor e o exportador de imagem, garantindo exportações 100% fiéis ao preview.
  - **UI de Entrada de Texto**: Nova barra de busca com indicador visual de inserção de texto e controles de ferramenta externos para maior clareza.
- **Arquivos Afetados:**
  - `app/criar-arte-sacra/page.tsx` (Lógica de limites guest e novo layout de header)
  - `components/sacred-art-editor/SacredArtDrawer.tsx` (Refatoração para Sidebar)
  - `components/sacred-art-editor/SacredArtCanvas.tsx` (Fix de offset e escala Konva)
  - `utils/imageCompositor.ts` (Sincronização de âncoras de exportação)
  - `constants.ts` (Bump v1.9.0)
  - `package.json` (Fix: Downgrade react-konva para compatibilidade com React 18)

---

## [v1.8.0] - 2026-04-22 (Layout Avançado & Sumário Inteligente)
### Tipo: Feature / UI / UX
- **Resumo:** Implementação de ferramentas de layout flexível e automação de conteúdo. O bloco "Template" agora é o "Sumário", com extração automática de H2.
- **Novidades:**
  - **Sumário Automático**: O bloco Sumário agora monitora o editor em tempo real e extrai todos os subtítulos (H2) para criar o índice automaticamente.
  - **Alinhamento de Blocos**: Blocos de 1/3 e 1/2 agora possuem controles de alinhamento (Esquerda, Centro, Direita), permitindo composições mais complexas.
  - **Grid de Versículos**: Melhoria no bloco de Versículos Relacionados (1/1) para exibir 3 colunas por padrão.
  - **UI Refinement**: O botão "Configurar" foi redesenhado como um pill flutuante com maior z-index para evitar sobreposições.
- **Arquivos Afetados:**
  - `components/Builder/blocks/StudyOutlineBlock.tsx` (Lógica de Auto-ToC)
  - `components/UnifiedEditor/components/BlockNodeView.tsx` (UI de Alinhamento e Configurar)
  - `components/Builder/blocks/RelatedVersesBlock.tsx` (Grid 3 colunas)
  - `components/UnifiedEditor/extensions/BlockExtension.ts` (Sync de Alinhamento)
  - `constants.ts` (Bump v1.8.0)

---

## [v1.7.2] - 2026-04-22 (Estabilização do Editor Unificado)
### Tipo: Refactor / UI / UX / Fix
- **Resumo:** Consolidação do `CreateContentV3Page` como o motor principal de edição para estudos e aulas. Implementada lógica de contexto embutido (`embeddedContext`) para esconder controles irrelevantes no criador de jornadas. Corrigidos múltiplos erros de Tipagem (TypeScript).
- **Arquivos Afetados:**
  - `views/CreateContentV3Page.tsx` (Suporte a modo embutido e validações)
  - `views/PlanBuilderPage.tsx` (Migração para o novo editor unificado)
  - `components/UnifiedEditor/UnifiedEditor.tsx` (Fix de tipagem e setContent)
  - `components/Builder/blocks/HeroSplitBlock.tsx` (Fix TS2322)
  - `components/Builder/blocks/TextNode.tsx` (Fix TS18047)
  - `constants.ts` (Bump v1.7.2)
- **Contexto Técnico:** Removida a fragmentação entre a criação de artigos e edição de aulas. O modo embutido agora desabilita automaticamente botões de Preview/Configurações e ajusta o padding do canvas para máxima produtividade.

---

## [v1.7.1] - 2026-04-22 (Manutenção de Agentes)
### Tipo: Docs / Architecture / UI
- **Resumo:** Atualização das instruções dos agentes Dev e Arquiteto. Adição da exibição da versão do sistema no rodapé do menu lateral (Sidebar).
- **Arquivos Afetados:**
  - `constants.ts` (Bump v1.7.1)
  - `.agents/skills/dev/SKILL.md` (Novas responsabilidades)
  - `_ARCHITECT_AGENT.md` (Novas responsabilidades)
  - `components/Layout.tsx` (Versão no rodapé)
- **Contexto Técnico:** Formalização do processo de documentação e versionamento. Adição de link mestre para `SYSTEM_VERSION` no Layout.

---

## [v1.7.0] - 2026-03-16 (Refino de Perfis e Topo Unificado)
### Tipo: Style / Refactor / UX
- **Resumo:** Padronização do topo global para perfis públicos (Usuário, Igreja, Planos e Estudos). Removidas duplicações de cabeçalho e ajustada a visibilidade do topo no modo leitura.
- **Arquivos Afetados:**
  - `components/Layout.tsx` (Ajuste de tipografia suave e alinhamento no mobile)
  - `views/public/ChurchProfilePage.tsx` (Remoção de título redundante)
  - `views/public/PublicUserProfilePage.tsx` (Remoção de título redundante e adição de selo de identificação)
  - `views/public/PublicPlanPage.tsx` (Gestão de visibilidade do topo global no modo de leitura do dia)
  - `views/public/PublicStudyPage.tsx` (Integração com HeaderContext)
- **Hash Git:** (pendente commit)
- **Contexto Técnico:** Utilização intensiva do `HeaderContext` para gerir títulos e breadcrumbs de forma centralizada pelo Layout, garantindo uma UI premium e sem elementos repetidos.

---

## [v1.6.3] - 2026-03-16 (Controle de Versão Git)
### Tipo: Infrastructure / DevOps
- **Resumo:** Inicialização do repositório Git local para controle de versões do BíbliaLM. Criado workflow `/versao` para salvar, listar e restaurar snapshots.
- **Arquivos Afetados:**
  - `.git/` (Repositório inicializado)
  - `.gitignore` (Configurado para Next.js — exclui node_modules, .next, dist, .env)
  - `.agents/workflows/versao.md` (Novo workflow de controle de versão)
  - `_ARCHITECT_AGENT.md` (Adicionada responsabilidade de release notes)
  - `_RELEASENOTES.md` (Este arquivo — atualizado com protocolo Git)
- **Hash Git:** `970836e`
- **Contexto Técnico:** Possibilita restore de qualquer arquivo para qualquer commit anterior. Protege contra regressões acidentais de UI/lógica.

---

## [v1.6.2] - 2026-03-16 (Ajuste de Espaçamentos — Pão Diário)
### Tipo: Style / UI
- **Resumo:** Refatoração de espaçamentos e fontes da `DevotionalPage` após padronização tipográfica. Ponto médio equilibrado entre hero muito grande e muito pequeno.
- **Arquivos Afetados:**
  - `views/DevotionalPage.tsx` (Hero, versículo, parágrafos, sidebar, botões)
- **Hash Git:** (sessão atual — não commitado ainda)
- **Detalhes:**
  - Hero: `h-56 md:h-80` (antes: h-96, depois h-48, agora equilíbrio)
  - Título: `text-5xl md:text-6xl` (antes: text-8xl)
  - Versículo: `text-2xl md:text-3xl`
  - Parágrafos: `text-lg` com `space-y-6`
  - Padding interno: `p-5 md:p-10`

---

## [v1.6.1] - 2026-03-16 (Capitular + Tipografia — Pão Diário)
### Tipo: Style / Fix
- **Resumo:** Restaurado efeito de letra capitular (`first-letter:`) nos parágrafos do corpo devocional. Reduzido `md:text-8xl → md:text-5xl` no título do hero.
- **Arquivos Afetados:**
  - `views/DevotionalPage.tsx`
  - `app/globals.css` (ajuste na utility `@layer` para md:text-8xl → 5xl)
- **Hash Git:** `674d79a` (snapshot inicial)

---

## [v1.6.0] - 2026-03-16 (Pão Diário — Fallback IA + Normalização)
### Tipo: Feature / Fix / Architecture
- **Resumo:** Implementado sistema de fallback em 3 camadas para o Pão Diário: Supabase → IA → Constante estática. Corrigido erro 406 com `.maybeSingle()`. Adicionada função `normalizeDevotional` para unificar campos de dados.
- **Arquivos Afetados:**
  - `views/DevotionalPage.tsx` (Fallback IA, normalização, tela de erro)
  - `services/supabase.ts` (maybeSingle, try/catch em user_devotionals)
  - `hooks/useMana.ts` (removido import não utilizado)
- **Hash Git:** `674d79a` (snapshot inicial)

## [v1.5.2] - 2024-03-20 (Onboarding Eclesiástico)
### Tipo: Feature / UX
- **Resumo:** Adicionada etapa de vínculo com igreja durante o cadastro de novos usuários.
- **Arquivos Afetados:**
  - `components/LoginModal.tsx` (Nova UI de busca)
  - `contexts/AuthContext.tsx` (Lógica de registro com igreja)
  - `constants.ts` (Bump de versão)
- **Contexto Técnico:** Permite que o usuário já entre na plataforma com o contexto de sua comunidade local, populando o feed e mural de oração imediatamente.

---

## [v1.5.1] - 2024-03-20 (Atualização de UI)
### Tipo: Feature / UI
- **Resumo:** Adicionado link "Apresentação" no menu de configurações do usuário.
- **Arquivos Afetados:**
  - `components/Layout.tsx` (Menu Dropdown)
  - `constants.ts` (Bump de versão)
  - Documentação Mestra (`.md`)
- **Contexto Técnico:** Facilita o acesso à página de One Page (Landing) mesmo para usuários logados.

---

## [v1.5.0] - 2024-03-20 (Nova Jornada)
### Tipo: Feature / Admin / Architecture
- **Resumo:** Implementação do sistema de integridade de versão e funcionalidade de "Wipe Data" (Reset Total).
- **Arquivos Afetados:**
  - `_RELEASENOTES.md` (Novo)
  - `_ARCHITECTURE.md` (Versionamento)
  - `_PROJECT_CONTEXT.md` (Versionamento)
  - `constants.ts` (Bump de versão)
  - `services/firebase.ts` (Nova função `wipeAllUserData`)
  - `components/AdminPage.tsx` (UI da Zona de Perigo)
- **Contexto Técnico:** Adicionado suporte a `writeBatch` no Firebase para deleção em massa. Criada estrutura de documentação viva para reduzir alucinações da IA.
- **Igrejas no novo Reino:** a página de descoberta de igrejas agora usa o shell Culto+, identidade visual roxo/fúcsia do Reino, busca responsiva e cards adaptados para desktop e mobile.
- **Menu único em Igrejas:** `/social/igrejas` agora é reconhecida como página com shell próprio, impedindo a renderização simultânea dos menus legado e Culto+.
- **Explorar integrado ao Reino:** a busca global e os atalhos de descoberta agora usam o shell Culto+, identidade roxo/fúcsia, cards responsivos e um Espaço + reorganizado.
- **Cabeçalhos compactos no Reino:** Feed, Igrejas e Explorar agora usam faixas reduzidas, com títulos objetivos e menos informação introdutória para priorizar o conteúdo.
- **Logo adaptativa:** os shells do Culto+ agora exibem automaticamente a versão clara da marca no modo escuro e preservam a logo original no tema claro.
- **Logos sem moldura:** as versões clara e escura da marca foram recortadas, receberam fundo transparente e agora aparecem sem blocos branco ou preto ao redor.
- **Cache da logo corrigido:** o componente passou a usar novos arquivos transparentes versionados por nome, impedindo que o navegador reutilize a antiga imagem escura com fundo preto.
- **Menus recolhíveis em todo o sistema:** NewHome, módulos pessoais, menu legado, Gestão e Workspace Pastoral agora compartilham um controle pequeno para esconder ou expandir a navegação, com preferência persistida.
- **Biblioteca mais objetiva:** a área “Sua jornada hoje” foi removida da Bíblia Sagrada e os filtros Antigo Testamento, Novo Testamento e Bíblia Católica agora aparecem em linha como pequenas Bíblias.
- **Loading bíblico transparente:** o leitor deixou de usar “Inspirando conteúdo” e agora informa o livro e o capítulo que estão sendo carregados da versão bíblica selecionada.
