# Guia de Pedidos Diretos do BibliaLM

Este documento serve para pedir mudancas pequenas com o minimo de ambiguidade.

## Como usar este guia

Quando quiser alterar algo, descreva 3 coisas:

1. Onde mexer.
2. O que mudar.
3. O que nao pode ser tocado.

Exemplo bom:

> Alterar somente o topo mobile da tela de leitura. Nao mexer no conteudo do leitor, nem no menu inferior.

Exemplo ruim:

> Melhora a tela de leitura.

## Mapa Do Sistema

O app tem uma base global e varias telas especificas.

### 1. Estrutura global

- [`app/layout.tsx`](../app/layout.tsx) define a arvore principal da aplicacao.
- [`components/Layout.tsx`](../components/Layout.tsx) controla o shell global: topo, lateral desktop, voltar, configuracoes, notificacoes, menu inferior e modais globais.
- [`contexts/HeaderContext.tsx`](../contexts/HeaderContext.tsx) alimenta titulo, subtitulo, breadcrumbs e visibilidade do topo.
- [`contexts/SettingsContext.tsx`](../contexts/SettingsContext.tsx) controla tema, foco e preferencias visuais.
- [`contexts/AuthContext.tsx`](../contexts/AuthContext.tsx) controla login, perfil e notificacoes.

### 2. Topo e voltar

- O topo mobile e desktop ficam em [`components/Layout.tsx`](../components/Layout.tsx).
- O botao de voltar tambem fica em [`components/Layout.tsx`](../components/Layout.tsx).
- O header customizado de paginas especificas fica em [`components/ui/StandardHeader.tsx`](../components/ui/StandardHeader.tsx).
- Se a mudanca for apenas visual ou de comportamento do topo, normalmente o arquivo principal e [`components/Layout.tsx`](../components/Layout.tsx).

### 3. Configuracoes

- O menu de configuracoes global fica em [`components/Layout.tsx`](../components/Layout.tsx).
- A janela de aparencia fica em [`components/SettingsModal.tsx`](../components/SettingsModal.tsx).
- Se o pedido for tema, modo foco, fonte ou leitura inteligente, o alvo costuma ser um desses dois arquivos.

### 4. Navegacao

- A navegacao inferior mobile fica em [`components/MobileBottomNav.tsx`](../components/MobileBottomNav.tsx).
- A navegacao lateral desktop fica em [`components/Layout.tsx`](../components/Layout.tsx).
- Se o pedido for mudar abas, rotas, ordem dos itens ou destaque da pagina atual, quase sempre o ajuste esta aqui.

### 5. Telas principais

- Home: [`app/page.tsx`](../app/page.tsx) e [`views/HomeDashboardPage.tsx`](../views/HomeDashboardPage.tsx)
- Biblia/Leitor: [`app/biblia/page.tsx`](../app/biblia/page.tsx) e [`views/ReaderPage.tsx`](../views/ReaderPage.tsx)
- Social/Reino: [`app/social/page.tsx`](../app/social/page.tsx) e [`views/social/SocialFeedPage.tsx`](../views/social/SocialFeedPage.tsx)
- Perfil: [`app/perfil/page.tsx`](../app/perfil/page.tsx) e [`views/UserProfilePage.tsx`](../views/UserProfilePage.tsx)
- Chat IA: [`app/chat/page.tsx`](../app/chat/page.tsx) e [`views/ChatPage.tsx`](../views/ChatPage.tsx)
- Devocional: [`app/devocional/page.tsx`](../app/devocional/page.tsx) e [`views/DevotionalPage.tsx`](../views/DevotionalPage.tsx)
- Planos e leitura: [`app/plano/page.tsx`](../app/plano/page.tsx), [`app/plano/leitura/page.tsx`](../app/plano/leitura/page.tsx), [`views/ReadingPlanDashboardPage.tsx`](../views/ReadingPlanDashboardPage.tsx)
- Pulpito e pastoral: [`app/pulpito/page.tsx`](../app/pulpito/page.tsx), [`app/pulpito/editor/page.tsx`](../app/pulpito/editor/page.tsx), [`views/PulpitDashboardPage.tsx`](../views/PulpitDashboardPage.tsx), [`views/PastoralWorkspacePage.tsx`](../views/PastoralWorkspacePage.tsx)

### 6. Modais e ferramentas globais

- Login: [`components/LoginModal.tsx`](../components/LoginModal.tsx)
- Suporte: [`components/SupportModal.tsx`](../components/SupportModal.tsx)
- Compra de creditos: [`components/BuyCreditsModal.tsx`](../components/BuyCreditsModal.tsx)
- Tutorial do sistema: [`components/SystemTutorialModal.tsx`](../components/SystemTutorialModal.tsx)
- Busca global: [`components/OmniSearch.tsx`](../components/OmniSearch.tsx)
- Chat flutuante: [`components/ObreiroIAChatbot.tsx`](../components/ObreiroIAChatbot.tsx)

### 7. Componentes de leitura e social

- Leitor: [`components/Reader.tsx`](../components/Reader.tsx) e [`components/reader/ReaderView.tsx`](../components/reader/ReaderView.tsx)
- Barra de audio: [`components/reader/AudioPlayerBar.tsx`](../components/reader/AudioPlayerBar.tsx)
- Menu de selecao: [`components/reader/FloatingSelectionMenu.tsx`](../components/reader/FloatingSelectionMenu.tsx)
- Feed social: [`components/social/FeedPostCard.tsx`](../components/social/FeedPostCard.tsx)
- Composer social: [`components/social/KingdomComposer.tsx`](../components/social/KingdomComposer.tsx)
- Navegacao social: [`components/SocialNavigation.tsx`](../components/SocialNavigation.tsx)

## Como pedir sem abrir escopo

Use o nome da parte exata.

### Pedidos bons

- “Alterar somente o botao de voltar do topo mobile.”
- “Mudar apenas o dropdown de configuracoes.”
- “Ajustar somente a navegacao inferior.”
- “Trocar somente o texto do header da tela de perfil.”
- “Mexer apenas no menu lateral desktop.”
- “Alterar somente o modo foco, sem tocar no restante do layout.”

### Pedidos ruins

- “Melhora o header.”
- “Arruma a pagina de leitura.”
- “Deixa o sistema mais bonito.”
- “Refaz a tela de perfil.”

## Template de pedido

Use este modelo:

```text
Objetivo: quero alterar [uma coisa especifica].
Tela/area: [nome da tela ou componente].
Escopo permitido: [o que pode mudar].
Escopo bloqueado: [o que nao pode mudar].
Resultado esperado: [como deve ficar].
```

## Exemplos Praticos

### 1. Alterar somente o topo

Pedido:

> Quero mudar somente o topo da tela de leitura. Manter o conteudo da pagina, o menu inferior e a busca intactos.

Arquivos mais provaveis:

- [`components/Layout.tsx`](../components/Layout.tsx)
- [`components/ui/StandardHeader.tsx`](../components/ui/StandardHeader.tsx)
- [`contexts/HeaderContext.tsx`](../contexts/HeaderContext.tsx)

### 2. Alterar somente o voltar

Pedido:

> Quero mudar somente o botao de voltar do mobile. Nao mexer nos icones, no menu nem no conteudo.

Arquivos mais provaveis:

- [`components/Layout.tsx`](../components/Layout.tsx)
- [`components/ui/StandardHeader.tsx`](../components/ui/StandardHeader.tsx)

### 3. Alterar somente configuracoes

Pedido:

> Quero mudar somente o menu de configuracoes. Nao tocar na lateral, no footer mobile nem nas telas internas.

Arquivos mais provaveis:

- [`components/Layout.tsx`](../components/Layout.tsx)
- [`components/SettingsModal.tsx`](../components/SettingsModal.tsx)
- [`contexts/SettingsContext.tsx`](../contexts/SettingsContext.tsx)

### 4. Alterar somente a navegacao inferior

Pedido:

> Quero trocar apenas os itens da navegacao mobile.

Arquivos mais provaveis:

- [`components/MobileBottomNav.tsx`](../components/MobileBottomNav.tsx)

### 5. Alterar somente uma tela

Pedido:

> Quero ajustar somente a tela de perfil, sem mexer no resto do sistema.

Arquivos mais provaveis:

- [`app/perfil/page.tsx`](../app/perfil/page.tsx)
- [`views/UserProfilePage.tsx`](../views/UserProfilePage.tsx)
- componentes usados dentro dessa tela

## Regra de ouro

Se o pedido citar uma parte do sistema, mexa primeiro nela e so nela.

Se existir duvida sobre impacto colateral, pare no componente mais local possivel e nao suba para o shell global sem necessidade.
