# Roadmap - Configuração da Sala de Estudo

Este documento descreve o plano de desenvolvimento para a criação e configuração de Salas de Estudo (Jornadas/Planos) no Workspace Pastoral.

## Etapa 1 - Planejamento da Sala
Nesta etapa, o usuário define as informações básicas e a estrutura temporal da sala de estudo.

- [ ] **1.1 - Título da Sala:** Campo para o nome do plano de estudo.
- [ ] **1.2 - Descrição:** Área de texto para descrever o propósito e conteúdo da sala.
- [ ] **1.3 - Tempo de Estudo:** Seleção da frequência (Diário, Semanal ou Mensal).
- [ ] **1.4 - Período:** Definição da Data de Início e Fim, ou opção de "Sem data definida" (curso contínuo).

## Etapa 2 - Edição do Estudo (Conteúdo da Aula)
Nesta etapa, o usuário cria o conteúdo específico de cada aula/dia.
*(Fluxo: Clica em "Adicionar Aula" -> Abre uma página/modal para criação da nova aula)*

### 2.1 - Aba 1: Configuração da Aula (Conteúdo)
- [ ] **2.1.1 - Formulário Manual:** Editor de texto rico para criação do conteúdo do zero.
- [ ] **2.1.2 - Obreiro IA:** Assistente de IA para gerar o conteúdo. O Obreiro deve estruturar o texto em formato de uma **Landing Page**. Este formato gerado deve ser fixo e também utilizado/disponível pelo modo manual.
- [ ] **2.1.3 - Ferramenta de Ditar e Formatar Texto:** Funcionalidade de transcrição de áudio (speech-to-text) e formatação rica.

## Etapa 3 - Configuração da Aula (Regras e Metadados)
Nesta etapa, o usuário define as regras de acesso e elementos visuais da aula.

- [ ] **3.1 - Visibilidade:** Controle de quem pode acessar a aula:
  - Pública
  - Privada com convite
  - Membros da Célula
  - Membros da Igreja
- [ ] **3.2 - Ativar Ranking:** Toggle para habilitar/desabilitar a gamificação e ranking para esta aula específica.
- [ ] **3.3 - Gerar Capa IA:** Ferramenta para gerar uma imagem de capa para a aula usando inteligência artificial.
- [ ] **3.4 - Criar Prova (Opcional):** Botão/opção para adicionar um questionário de avaliação ao final da aula.

## Etapa 4 - Edição da Prova
Nesta etapa (se ativada na Etapa 3.4), o usuário configura a avaliação da aula.

- [ ] **4.1 - Criação de Perguntas:** Interface para adicionar perguntas de múltipla escolha ou dissertativas.
- [ ] **4.2 - Configuração de Pontuação:** Definição de XP/Pontos por acerto.
- [ ] **4.3 - Geração com IA (Opcional):** Opção para o Obreiro IA gerar perguntas baseadas no conteúdo da aula (Etapa 2).
