
# 📖 Especificação de Requisitos de Software (SRS) - BíbliaLM

## 1. Visão e Cultura do Produto (O Manifesto)

### 1.1 A Essência (Leia antes de sugerir features)
O **BíbliaLM** não é apenas um "ChatGPT Cristão" ou uma rede social gospel. É uma ferramenta de **Aprofundamento Espiritual** onde a tecnologia é subserviente à teologia.

A cultura raiz do produto baseia-se em três pilares inegociáveis que devem guiar qualquer decisão de produto (CPO/PM):

1.  **A Bíblia é o Protagonista, a IA é o "Obreiro":**
    *   O usuário entra no app para se conectar com Deus, não para "brincar com tecnologia".
    *   A Inteligência Artificial (Gemini) atua nos bastidores. Ela é o "óculos" que melhora a visão, não a paisagem. Ela serve para tirar dúvidas difíceis (exegese), ilustrar conceitos (arte sacra) e resumir sermões, mas **nunca** deve substituir a leitura do texto sagrado.
    *   **Regra de Ouro:** Se uma funcionalidade de IA distrai o usuário da leitura bíblica em vez de incentivá-la, ela não pertence ao escopo.

2.  **Simplicidade Sagrada (Design Calmante):**
    *   Diferente de redes sociais desenhadas para viciar (dopamina rápida), o BíbliaLM é desenhado para **focar e acalmar**.
    *   O design é "papel e tinta" (Clean). O Feed do Reino serve para edificação comunitária (pedidos de oração, testemunhos), não para entretenimento vazio ou viralização.

3.  **Acessibilidade Universal:**
    *   O app deve ser simples o suficiente para um idoso ler e ouvir seu Salmo diário (Interface intuitiva, botões claros).
    *   Ao mesmo tempo, robusto o suficiente para um pastor preparar um sermão teológico complexo (Workspace Pastoral).

---

## 2. Requisitos Funcionais (RF)

### Módulo 1: Leitura e Estudo Bíblico (Core - O Alicerce)
| ID | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF01** | **Leitura Bíblica** | O sistema deve permitir a navegação fluida da Bíblia (Livro > Capítulo > Versículo) com foco total no texto. |
| **RF02** | **Marcação de Versículos** | O usuário deve poder selecionar versículos para marcar como lidos, criar notas ou gerar conteúdo a partir deles. |
| **RF03** | **Anotações Inteligentes** | O sistema permite criar notas pessoais que podem ser melhoradas/expandidas pela IA para maior clareza teológica. |
| **RF04** | **Narração (TTS)** | O sistema converte texto em áudio natural para acessibilidade e consumo "on-the-go" (Podcast Bíblico). |
| **RF05** | **Planos de Leitura** | Gestão de progresso (Ex: Bíblia em 1 ano), calculando automaticamente a meta do dia para manter a constância. |
| **RF06** | **OmniSearch** | Busca global poderosa: encontra versículos, conceitos ("ansiedade"), usuários ou igrejas em um único lugar. |

### Módulo 2: Inteligência Artificial (Obreiro IA - O Suporte)
*Nota: A IA age sob demanda, quando o usuário clica em "Entender" ou "Gerar". Ela não é intrusiva.*

| ID | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF07** | **Pão Diário** | Geração diária de um devocional único (Título, Versículo, Reflexão, Oração) contextualizado para o usuário. |
| **RF08** | **Chat Conselheiro** | Chat teológico (RAG) para dúvidas. Ex: "Explique a parábola do filho pródigo no contexto cultural da época". |
| **RF09** | **Estudo Profundo (NotebookLM)** | Gera uma página de estudo completa (Exegese, Contexto Histórico, Aplicação Prática) a partir de qualquer capítulo. |
| **RF10** | **Podcast Automático** | Transforma um texto ou tema em um diálogo de áudio entre dois apresentadores virtuais para estudo dinâmico. |
| **RF11** | **Estúdio Criativo** | Gera imagens artísticas (Artes Sacras) fiéis ao texto bíblico para evangelismo visual. |
| **RF12** | **Púlpito Digital** | Ferramenta para pastores: auxilia na estruturação de esboços homiléticos (Introdução, Tópicos, Conclusão). |

### Módulo 3: Comunidade e Social (Ecclesia - A Conexão)
| ID | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF14** | **Feed do Reino** | Feed cronológico focado em edificação (versículos, orações, estudos). Sem algoritmo de vício. |
| **RF15** | **Interações Sóbrias** | Curtir (Amém), Comentar e Compartilhar. Foco em apoio mútuo ("Estou orando por você"). |
| **RF16** | **Perfil Eclesiástico** | Cadastro de Igrejas com localização e liderança, servindo como hub para membros. |
| **RF17** | **Fórum de Células** | Espaço privado para pequenos grupos da igreja trocarem mensagens e pedidos de oração. |
| **RF18** | **Mural de Oração** | Área dedicada onde usuários postam causas e outros clicam em "Interceder" para notificar apoio. |

### Módulo 4: Gamificação (O Incentivo)
| ID | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF20** | **Sistema de Maná (XP)** | Pontos por constância espiritual (ler, orar, estudar). Não é competição, é disciplina. |
| **RF21** | **Jornada do Peregrino** | Níveis (Iniciante > Mestre) e Medalhas baseadas em conquistas reais de leitura. |
| **RF22** | **Ranking de Leitura** | Ranking amigável focado em quem mais leu capítulos, incentivando a prática. |
| **RF23** | **Quiz da Sabedoria** | Jogo de perguntas e respostas bíblicas para fixação de conhecimento. |
| **RF24** | **Ofensiva (Streak)** | Contagem de dias consecutivos buscando a Deus. |

### Módulo 5: Administrativo e Sustentabilidade
| ID | Requisito | Descrição |
| :--- | :--- | :--- |
| **RF25** | **Gestão de Planos** | Controle de acesso (Free, Bronze, Silver, Gold, Pastor) para cobrir custos de servidor/IA. |
| **RF26** | **Micro-transações** | Compra de créditos avulsos para uso intensivo de IA sem assinatura mensal. |
| **RF27** | **Painel Admin** | Controle de integridade, moderação de conteúdo impróprio e métricas de uso. |

---

## 3. Regras de Negócio (Limites e Lógica)

| ID | Regra | Restrição/Lógica |
| :--- | :--- | :--- |
| **RN01** | **Custo Consciente** | Usuários Free têm cotas limitadas de IA (ex: 2 imagens/dia) para garantir a sustentabilidade do projeto. |
| **RN02** | **Autoridade Eclesiástica** | Apenas usuários verificados (Plano Fiel/Silver+) podem fundar Igrejas oficiais na plataforma. |
| **RN03** | **Integridade de Célula** | Subgrupos (células) estão sempre vinculados a uma Igreja mãe para manter a ordem eclesiástica. |
| **RN04** | **Anti-Farm de XP** | A leitura de um capítulo só gera XP uma vez a cada 24h para evitar gamificação tóxica. |
| **RN05** | **Privacidade de Oração** | Pedidos de oração podem ser marcados como anônimos ou exclusivos para a célula. |
| **RN06** | **Moderação Rígida** | Conteúdo desviante (discurso de ódio, heresia agressiva, spam) resulta em "shadowban" ou bloqueio imediato. |

---

## 4. Casos de Uso Principais (A Jornada do Usuário)

### UC01: O Devocional Matinal (O Hábito)
1.  Usuário abre o app.
2.  Tela inicial mostra "Pão Diário".
3.  Usuário lê a reflexão e clica em "Amém" (Ganham Maná).
4.  Usuário clica em "Aprofundar" -> A IA gera um estudo mais denso sobre aquele versículo.
5.  Usuário compartilha o insight no Feed do Reino.

### UC02: Preparação de Estudo (O Líder)
1.  Pastor/Líder acessa "Workspace Pastoral".
2.  Cria uma "Nova Jornada" sobre "Ansiedade".
3.  Usa o "Púlpito Digital" para gerar esboço do sermão.
4.  Cria uma imagem de capa no "Estúdio Criativo".
5.  Publica a jornada para os membros da sua Igreja no app.

---

## 5. Requisitos Não Funcionais (Qualidade)

*   **Performance:** Carregamento instantâneo da Bíblia (texto local/cacheado). A IA pode demorar (streaming), mas o texto sagrado não.
*   **Offline First:** O app deve permitir leitura da Bíblia mesmo sem internet.
*   **Segurança:** Dados sensíveis (orações privadas) devem ter regras de acesso estritas no banco de dados (RLS).
*   **Escalabilidade:** Arquitetura preparada para migrar de Firebase para SQL (Supabase) quando a base de usuários crescer.
