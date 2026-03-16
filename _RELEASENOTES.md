# 📜 Histórico de Mudanças (Changelog)

> **AI INSTRUCTION:** Ao finalizar uma tarefa, adicione uma nova entrada no topo desta lista.
> **VERSION SYNC:** Lembre-se de atualizar `constants.ts`, `_ARCHITECTURE.md` e `_PROJECT_CONTEXT.md` ao mudar a versão aqui.

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
