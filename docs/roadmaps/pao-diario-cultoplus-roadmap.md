# Roadmap — Pão Diário Culto+

## Status

Roadmap vivo. Os incrementos **Encontro diário guiado + publicação opcional no feed**, **experiência editorial de leitura**, **leitor de estudo compacto** e **contexto bíblico ampliado** foram implementados em 21/07/2026. As fases posteriores continuam como evolução planejada.

## Decisão bíblica implementada — v2.5.9

- o versículo-base é lido junto aos dois versos anteriores e posteriores, quando disponíveis;
- o contexto usa a Bíblia completa local por um endpoint server-side, sem enviar o arquivo integral ao navegador;
- o versículo-base recebe destaque visual dentro do trecho, mas permanece parte da mesma passagem;
- localização bíblica, perguntas de observação e reflexão pastoral têm hierarquias distintas;
- reflexões geradas seguem contexto imediato, sentido central e aplicação prudente;
- texto bíblico, interpretação e aplicação nunca devem aparecer como se fossem a mesma fonte;
- o capítulo completo permanece acessível para aprofundamento e verificação.

## Decisão de leitura implementada — v2.5.8

- o estudo mostra somente uma etapa por vez para evitar uma página longa e cansativa;
- o cabeçalho editorial foi reduzido para antecipar o contato com a Palavra, sobretudo no mobile;
- um único caderno central reúne progresso, capítulos, conteúdo e ações, sem voltar à aparência de sistema;
- botões de etapa anterior e continuidade tornam a progressão evidente e dispensam rolagem entre blocos;
- o leitor retoma automaticamente a primeira etapa pendente, preservando a autonomia para revisar qualquer capítulo;
- áudio, fonte e modo sem interrupções permanecem no cabeçalho do caderno;
- a conclusão e o compartilhamento opcional continuam na quinta etapa, sem expor a reflexão privada.

## Decisão editorial implementada — v2.5.7

- `/devocional` funciona como uma experiência independente de leitura, com navegação mínima da marca;
- a abertura tem linguagem de landing page e conduz para um único próximo passo;
- o conteúdo usa uma coluna central confortável, sem menu lateral interno, dashboard, resumo operacional ou grade de cards;
- as cinco etapas continuam presentes, mas são tratadas como movimentos narrativos de uma mesma leitura;
- controles de áudio, fonte e modo sem interrupções permanecem disponíveis sem competir com o texto;
- formulários e confirmações aparecem somente no trecho em que fazem sentido;
- navegação inferior mobile e assistente flutuante ficam ocultos durante essa experiência;
- o versículo vem antes da interpretação e o encerramento reforça que a reflexão não substitui o texto bíblico em contexto.

## Decisão de produto

Evoluir `/devocional` de uma página extensa de conteúdo com ações dispersas para um encontro diário guiado de 5–8 minutos:

**Ler → Refletir → Orar → Praticar → Concluir**

O Pão Diário deve ajudar o usuário a criar constância na Palavra sem competir com a leitura bíblica, medir espiritualidade ou transformar a experiência em um feed infinito.

## Objetivo

Permitir que uma pessoa:

- encontre rapidamente a mensagem do dia;
- entenda o contexto do texto bíblico;
- registre uma resposta pessoal privada;
- ore e escolha uma aplicação prática;
- conclua o encontro e acompanhe sua constância;
- transforme o aprendizado em uma publicação opcional, revisável e própria para o feed;
- retorne à Bíblia, às notas, aos estudos e às orações do Culto+ quando desejar aprofundar.

## Princípios inegociáveis

1. **A Bíblia vem primeiro:** a reflexão auxilia a leitura, mas não substitui o texto bíblico nem seu contexto.
2. **Uma ação principal por etapa:** a página deve conduzir, não apresentar todos os recursos ao mesmo tempo.
3. **Privacidade por padrão:** reflexões e orações pessoais nunca são publicadas automaticamente.
4. **IA transparente:** toda resposta de IA deve ser identificada como apoio reflexivo, sem atribuir inspiração divina à tecnologia.
5. **Conteúdo pastoral revisado:** referência, texto, interpretação e aplicação precisam ser verificáveis e diferenciados.
6. **Gamificação saudável:** Maná reconhece constância e uso válido; não mede fé, oração ou maturidade espiritual.
7. **Um Pão Diário estável:** o conteúdo do dia deve permanecer igual para o usuário. Alternativas são secundárias, limitadas e explícitas.
8. **Acessível e mobile-first:** leitura confortável, alvos de toque adequados, foco visível, áudio e controles tipográficos.

## Estado atual verificado

A base existente já oferece:

- conteúdo oficial, personalizado e fallback;
- prevenção de repetição de referências por até seis meses;
- persistência de visualização, “Amém” e reflexão em `user_devotionals`;
- versículo, mensagem, oração, reflexão pessoal e compartilhamento;
- Maná e histórico central de atividades;
- infraestrutura de notas centralizadas, estudo profundo, deep links e narração usada em outros módulos;
- editor administrativo básico para o conteúdo diário;
- testes unitários para a resolução e seleção do devocional.

## Problemas a resolver antes de expandir

### Produto e UX

- O banner ocupa espaço demais antes da mensagem principal.
- O título específico do devocional não recebe destaque adequado.
- Não existe começo, progresso ou conclusão claramente definidos.
- “Novo Pão Diário” se comporta como atualização infinita, contrariando a ideia de encontro diário estável.
- Reflexão, oração, “Amém”, compartilhamento e IA competem pela atenção na mesma tela.
- O usuário não vê histórico, sequência, reflexão salva ou onde continuar depois.
- Visitantes podem clicar em algumas ações protegidas sem receber orientação clara para entrar na conta.

### Confiança e conteúdo

- “Inspirado pelo Espírito” não é uma identificação prudente para conteúdo que pode ter origem administrativa ou em IA.
- “Insight espiritual” deve ser apresentado como apoio à reflexão, não como autoridade pastoral ou revelação.
- A análise de reflexão exibida atualmente é simulada e fixa, embora já exista serviço real no projeto.
- A geração usada pelo resolvedor não passa obrigatoriamente pelo fluxo pastoral auditado.
- Referência, texto bíblico e versão precisam ser validados antes da publicação.
- O fluxo de auditoria existente libera conteúdo quando a auditoria falha; para publicação diária, o comportamento deve usar conteúdo seguro previamente revisado.

### Consistência técnica

- Existem implementações devocionais duplicadas com recursos diferentes.
- A recompensa exibida na página não está alinhada à regra central de atividade devocional.
- A reflexão salva não é restaurada ao reabrir o conteúdo.
- Existem imports, estado de modal e caminhos antigos sem uso na página atual.

## Experiência-alvo

### Primeiro viewport

- cabeçalho compacto com data, tempo estimado, sequência e botão “Ouvir”;
- título do devocional;
- texto bíblico, referência e versão;
- ação “Ler no contexto”, abrindo o leitor já na passagem;
- progresso do encontro, por exemplo “1 de 5 — Leitura”.

### Corpo guiado

1. **Palavra:** versículo e acesso ao capítulo completo.
2. **Compreenda:** reflexão curta, separando contexto bíblico e aplicação pastoral.
3. **Responda:** uma ou duas perguntas e campo privado opcional.
4. **Ore:** oração sugerida, com opção de ouvir e registrar uma oração própria.
5. **Pratique:** uma ação pequena, concreta e editável para o dia.
6. **Concluir:** confirma o encontro, registra a atividade e mostra o próximo passo.

### Depois da conclusão

- confirmação discreta, sem exagerar a recompensa;
- sequência semanal e calendário de constância;
- acesso à reflexão salva;
- próximos passos opcionais: “Ler o capítulo”, “Salvar nas notas”, “Aprofundar em estudo” ou “Ir para Orações”.

### Publicação opcional no feed

- a ação só aparece depois da conclusão das cinco etapas;
- a publicação nunca é automática e exige confirmação em popup;
- a prévia usa o mesmo layout específico que será exibido no Reino;
- o card público contém título, versículo, referência, link para o Pão Diário e uma mensagem pública editável;
- a reflexão pessoal não é copiada para o post, nem mesmo como texto inicial;
- o usuário escolhe o público disponível: Reino, igreja ou grupo;
- depois de publicar, o fluxo registra a atividade social e oferece acesso direto ao Reino.

### Organização responsiva

- **Desktop:** conteúdo principal em aproximadamente dois terços da largura e um resumo lateral compacto com progresso, oração e aplicação.
- **Mobile:** fluxo em uma coluna, progresso fixo discreto e uma única ação principal por etapa.
- Histórico, configurações e alternativas devem abrir em popup ou drawer, evitando novas páginas concorrentes.

## Roadmap de execução

### Fase 0 — Integridade, confiança e consolidação (P0)

Objetivo: tornar verdadeiro, previsível e seguro tudo o que a página já promete.

Entregas:

- escolher `views/DevotionalPage.tsx` como implementação canônica;
- inventariar e migrar somente os recursos válidos das implementações antigas antes de removê-las;
- substituir a análise simulada pelo serviço real ou ocultar a ação até estar pronta;
- exigir `checkFeatureAccess` e o controle central de consumo nas ações de IA;
- padronizar “Amém” e conclusão usando `recordActivity('devotional')`, sem valor manual divergente;
- orientar visitante a entrar quando tentar salvar, concluir ou solicitar personalização;
- renomear “Inspirado pelo Espírito” para “Reflexão do dia” e “Insight espiritual” para “Apoio à reflexão”;
- manter um conteúdo estável por pessoa e data;
- validar referência e texto bíblico e usar fallback revisado quando geração ou auditoria falhar;
- remover código morto e chamadas duplicadas.

Critérios de aceite:

- nenhum botão termina silenciosamente;
- nenhuma resposta fixa é apresentada como análise de IA;
- o mesmo usuário recebe o mesmo conteúdo ao reabrir o dia;
- a recompensa visual corresponde à regra central;
- conteúdo não auditado não substitui o fallback seguro;
- testes cobrem visitante, usuário autenticado, falha de IA e fallback.

### Fase 1 — Encontro diário guiado (P0)

Objetivo: criar uma hierarquia simples que conduza à conclusão.

Entregas:

- reduzir o hero e colocar título e versículo no primeiro viewport;
- criar o progresso “Ler, Refletir, Orar, Praticar e Concluir”;
- apresentar uma ação principal por etapa;
- adicionar tempo estimado de leitura;
- adicionar “Ler no contexto” com deep link para a passagem;
- incluir aplicação prática curta e editável;
- criar estados “Não iniciado”, “Em andamento” e “Concluído”;
- manter compartilhamento e aprofundamento como ações secundárias.
- liberar, após a conclusão, uma prévia específica para publicação opcional no feed;
- persistir localmente o progresso, a prática e o estado de compartilhamento, reconciliando reflexão e “Amém” com `user_devotionals`.

Critérios de aceite:

- em 390 px e no desktop, versículo e ação principal aparecem sem rolagem excessiva;
- o usuário entende o próximo passo sem precisar interpretar vários botões;
- o progresso sobrevive ao recarregamento;
- a conclusão é registrada uma única vez por dia.
- nenhuma reflexão privada aparece no payload ou na prévia da publicação.

#### Entregue neste incremento

- cabeçalho compacto com título em escala compatível com a identidade Culto+;
- controles A−, A e A+ e modo sem interrupções;
- áudio pelo recurso central de narração;
- cinco etapas visíveis, progresso persistente e deep link para a passagem bíblica;
- restauração da reflexão e compatibilidade com “Amém” já registrado;
- conclusão integrada à regra central de atividade devocional;
- popup de prévia, escolha de público e card exclusivo do Pão Diário no feed;
- conteúdo social serializado no post existente, sem nova tabela e sem duplicar dados privados;
- rascunho e aplicação não são enviados para a tabela genérica de configurações; a reflexão autenticada continua protegida em `user_devotionals`.
- shell operacional removido da rota do Pão Diário e substituído por navegação editorial mínima;
- cards de etapas e coluna lateral removidos em favor de uma leitura contínua, responsiva e centrada no texto.
- leitura contínua refinada para um caderno de estudo com somente a etapa ativa, reduzindo a rolagem e acrescentando navegação anterior/próxima.

### Fase 2 — Memória e constância (P1)

Objetivo: fazer o Pão Diário gerar continuidade, não apenas consumo pontual.

Entregas:

- restaurar automaticamente a reflexão salva;
- criar histórico em popup com calendário mensal;
- mostrar sequência atual, melhor sequência e dias concluídos na semana;
- permitir consultar devocionais anteriores e suas reflexões;
- adicionar lembrete configurável por horário;
- permitir favoritar conteúdos sem publicá-los;
- registrar conclusão, oração e aplicação separadamente, sem expor conteúdo sensível em métricas.

Critérios de aceite:

- reflexões continuam privadas por RLS;
- o usuário reencontra conteúdo e reflexão de qualquer dia disponível;
- lembrete pode ser ativado, alterado e desativado;
- sequência considera conclusão real e fuso horário do usuário.

### Fase 3 — Leitura confortável e acessível (P1)

Objetivo: atender diferentes rotinas, capacidades e ambientes de leitura.

Entregas:

- reutilizar `useAudioNarration` para ouvir versículo, reflexão e oração;
- oferecer tamanho de fonte, largura de leitura e espaçamento;
- criar modo foco sem menu interno ou ações secundárias;
- respeitar `prefers-reduced-motion`;
- melhorar skeleton, erro, modo offline e retomada;
- garantir semântica, ordem de títulos, foco visível e anúncios de estado por leitor de tela.

Critérios de aceite:

- toda ação é operável por teclado;
- alvos de toque têm pelo menos 44 px;
- áudio pode pausar, continuar e parar;
- a página funciona com fallback sem bloquear a prática diária.

### Fase 4 — Personalização responsável (P2)

Objetivo: adaptar a experiência sem distorcer o texto bíblico ou criar dependência de IA.

Entregas:

- preferências opcionais por tema, duração e momento do dia;
- alternativa de conteúdo somente após conclusão ou por ação secundária limitada;
- análise real da reflexão com transparência, consentimento e limite de uso;
- resposta estruturada em “O que você percebeu”, “Conexão com o texto” e “Próximo passo”;
- alerta de que o apoio de IA não substitui acompanhamento pastoral, psicológico ou emergencial;
- auditoria pastoral obrigatória e telemetria de falhas/rejeições.

Critérios de aceite:

- personalização nunca altera a citação bíblica para adequá-la ao perfil;
- o usuário sabe quando há IA e pode usar a página sem ela;
- respostas problemáticas são bloqueadas e substituídas por orientação segura;
- não existe pontuação de fé, oração ou “qualidade espiritual”.

### Fase 5 — Integração com o ecossistema Culto+ (P2)

Objetivo: conectar o encontro diário aos recursos já existentes sem inflar a página.

Entregas:

- salvar reflexão nas notas centralizadas com origem `devotional`;
- transformar conteúdo em estudo profundo usando o fluxo existente;
- abrir a passagem diretamente na Bíblia Sagrada;
- levar uma oração pessoal para a área de Orações mediante confirmação;
- compartilhar no Reino somente por ação explícita e com pré-visualização;
- permitir que igrejas publiquem séries devocionais revisadas, mantendo o Pão Diário pessoal como padrão.

Critérios de aceite:

- cada integração abre no contexto correto e preserva a origem;
- nenhuma reflexão privada vira publicação sem confirmação final;
- os atalhos aparecem somente depois de concluir ou no menu secundário.

O item de compartilhamento no Reino foi antecipado e entregue junto à Fase 1 por depender diretamente do novo estado de conclusão.

### Fase 6 — Operação editorial e aprendizado de produto (P2)

Objetivo: garantir qualidade recorrente e medir valor real.

Entregas:

- ampliar o editor com rascunho, revisão, agendamento, publicação e arquivamento;
- registrar autor, revisor, versão bíblica, fonte, data de revisão e status de auditoria;
- validar automaticamente referência e correspondência do texto bíblico;
- permitir conteúdo oficial Culto+, conteúdo de igreja identificado e conteúdo personalizado claramente rotulado;
- criar painel de qualidade e métricas do funil.

Critérios de aceite:

- somente conteúdo publicado e revisado entra no catálogo oficial;
- alterações editoriais ficam auditáveis;
- falha de geração nunca deixa o dia sem conteúdo seguro;
- métricas não armazenam o texto privado das reflexões.

## Modelo de dados recomendado

### `daily_devotionals`

Adicionar ou formalizar:

- `status`: draft, review, published, archived;
- `source_type`: culto_plus, church, personalized_ai, safe_fallback;
- `bible_version`;
- `reading_minutes`;
- `context_summary`;
- `reflection_questions`;
- `practical_action`;
- `related_references`;
- `reviewed_by`, `reviewed_at`;
- `audit_status`, `audit_notes`;
- `published_at`.

### `user_devotionals`

Preservar RLS por usuário e adicionar somente o necessário:

- `started_at`;
- `completed_at`;
- `prayer_completed_at`;
- `practical_action` e `practical_action_completed_at`;
- `is_favorite`;
- `last_step`;
- `updated_at`.

Dados privados não devem ser copiados para eventos analíticos ou notificações.

## Métricas

### Métrica principal

**Dias com encontro diário concluído por usuário ativo na semana.**

### Indicadores de apoio

- abertura → início;
- início → conclusão;
- retorno em 7 e 30 dias;
- uso de “Ler no contexto”;
- taxa de reflexão salva;
- uso de áudio;
- conclusão da aplicação prática;
- falhas, bloqueios e rejeições da auditoria;
- tempo até o versículo aparecer.

“Améns”, tamanho da oração e texto da reflexão não devem ser usados para classificar espiritualidade.

## Fora de escopo

- feed infinito de devocionais;
- contagem pública de “Améns”;
- publicação automática de reflexão ou oração;
- ranking de fé ou de constância espiritual;
- recomendação que substitua leitura bíblica, liderança pastoral ou cuidado profissional;
- geração ilimitada de novos conteúdos no mesmo dia;
- nova página para cada recurso secundário.

## Arquivos e recursos que a implementação deverá considerar

- `views/DevotionalPage.tsx` — experiência canônica atual;
- `services/devotionalResolver.ts` e `services/devotionalResolverCore.ts` — resolução, histórico e não repetição;
- `services/pastorAgent.ts` e `services/pastorAuditor.ts` — IA e auditoria;
- `services/supabase.ts` — persistência;
- `services/devotionalJourneyService.ts` — retomada e sincronização da jornada;
- `components/DevotionalFeedShareModal.tsx` — confirmação e publicação opcional;
- `components/DevotionalFeedCardContent.tsx` — layout compartilhado entre prévia e feed;
- `utils/devotionalSharePost.ts` — contrato serializado do card devocional;
- `components/AdminPage.tsx` — operação editorial;
- `hooks/useAudioNarration.ts` — áudio reutilizável;
- `utils/centralizedNotes.ts` — notas e origem devocional;
- `utils/activityRules.ts` — atividade e Maná;
- `tests/devotionalResolver.test.ts` — base unitária existente;
- testes Playwright novos para desktop, mobile, visitante, autenticação, conclusão e histórico.

## Ordem recomendada

Começar por **Fase 0 + Fase 1 + restauração da reflexão da Fase 2**. Esse pacote entrega confiança, clareza e continuidade sem depender de personalização avançada, comunidade ou novas chamadas de IA.

A prioridade não deve ser adicionar mais cards. Deve ser tornar o encontro diário menor, mais verdadeiro, mais guiado e fácil de concluir.
