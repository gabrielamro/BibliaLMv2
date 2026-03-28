# Route Usage Audit

> Baseado no catálogo atual de 69 screenshots em [manifest.json](C:/Users/gabri/Downloads/biblialm/docs/mockups/route-catalog/manifest.json) e na leitura dos arquivos de rota.

**Critério**
- `Usada`: tela que hoje entrega UI própria e faz parte do fluxo central do app.
- `Redireciona`: rota que hoje cai em outra tela, seja por `redirect()` explícito ou por proteção sem sessão.
- `Mock / demo`: rota de validação, iframe, apresentação ou conteúdo de exemplo.
- `Não usada no fluxo principal`: rota real do projeto, mas fora do caminho de navegação atual e sem presença clara no fluxo principal.

## Usada

- `/intro`
- `/intro-v2`
- `/navegar`
- `/social`
- `/planos`
- `/aluno`
- `/biblia`
- `/chat`
- `/devocional`
- `/oracoes`
- `/suporte`
- `/privacidade`
- `/termos`
- `/regras`
- `/artes-sacras`
- `/criar-conteudo`
- `/criar-arte-sacra`
- `/criar-podcast`
- `/faith-tech`
- `/fonte-conhecimento`

## Redireciona

### Redireciona explicitamente

- `/estudio-criativo` -> `/navegar`
- `/trilhas` -> `/aluno`

### Redireciona por proteção sem sessão

- `/`
- `/admin`
- `/apresentacao`
- `/biblia-dashboard`
- `/complete-profile`
- `/criador-jornada`
- `/criar-estudo`
- `/estudos`
- `/estudos/livro/[bookId]`
- `/estudos/planos`
- `/grupo/[cellSlug]`
- `/historico`
- `/login`
- `/minha-conta`
- `/notes`
- `/oracoes/gerenciar`
- `/perfil`
- `/plano`
- `/plano/leitura`
- `/pulpito`
- `/pulpito/editor`
- `/rotina`
- `/s/[token]`
- `/social/church`
- `/social/profile`
- `/social/u/[username]`
- `/system-integrity`
- `/workspace`
- `/workspace-pastoral`

## Mock / Demo

- `/mockinicio1`
- `/mocsantuario`
- `/landing/[slug]`
- `/jornada/[planId]`
- `/p/[postId]`
- `/v/[studyId]`

## Não usada no fluxo principal

- `/biblia-dashboard`
- `/criar-estudo`
- `/estudos/livro/[bookId]`
- `/grupo/[cellSlug]`
- `/minha-conta`
- `/social/igreja/[churchSlug]`

## Observação

As rotas protegidas podem voltar a ser relevantes quando houver sessão autenticada. Aqui a classificação reflete o uso visível no fluxo atual, com o catálogo gerado sem login ativo. As telas de `não usada` são as que hoje não aparecem como entrada clara no fluxo principal nem como mock/iframe.
