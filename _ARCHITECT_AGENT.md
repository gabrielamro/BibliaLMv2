# Lei Maxima da Arquitetura - BibliaLM

Este documento contem as regras inegociaveis. Violacoes destas regras resultam em veto automatico de qualquer mudanca.

## 1. Os 3 Pilares Inegociaveis
1. **Seguranca de Dados:** Nenhuma chave (`.env`) ou credencial deve ser exposta ou removida da protecao de servidor.
2. **Controle de Gastos (IA):** Toda chamada a IA deve ser precedida por `checkFeatureAccess` e protegida por `retryWithBackoff`.
3. **Pureza de Fluxo:** Logica de banco/API deve residir em `services/`. Componentes sao apenas para apresentacao e estado local.

## 2. Regras Tecnicas (RN)
- **RN01:** O `types.ts` e a unica fonte de verdade para interfaces globais.
- **RN02:** O `constants.ts` centraliza todas as configuracoes de sistema e limites.
- **RN03:** Nao use `console.log` em producao.
- **RN04:** O Firestore nunca e chamado diretamente em Views; use o `firebaseService`.
- **RN05:** Todo novo modulo deve vir acompanhado de testes de integracao (Playwright).
- **RN06 (VERSAO):** O Arquiteto e responsavel por atualizar o numero da versao em `constants.ts` e os `_RELEASENOTES.md` em cada entrega significativa.
- **RN07 (ATIVIDADES):** Toda criacao ou alteracao de funcionalidade que represente uma acao relevante do usuario deve avaliar se precisa registrar historico em `/historico`. Quando aplicavel, use o fluxo central `recordActivity`/`earnMana`, preservando as regras de Mana em `systemSettings.gamification` e a persistencia de `profiles.activity_log`; nao implemente logs paralelos em componentes.

## 3. Protocolo de Commit
As mensagens de commit devem ser semanticas:
`tipo(escopo): descricao - vX.Y.Z`
- Tipos Permitidos: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`.

## 4. Registro de Mudancas Aprovadas (Log Sagrado)

| DATA | TIPO | ARQUIVO(S) | DESCRICAO CURTA | Arquiteto |
| :--- | :--- | :--- | :--- | :--- |
| 2026-03-10 | feat | components/Layout.tsx | Implementacao inicial do Header Centrado | Antigravity |
| 2026-03-17 | chore | .agents/ | Setup completo dos Agentes Pastor, CPO e Arquiteto | Antigravity |
| 2026-04-01 | fix | app/, components/, views/ | Persistencia de imagem de capa de estudos | Antigravity |
| 2026-04-23 | feat | app/, components/, utils/ | Acesso Freemium & Estudio Profissional - v1.9.0 | Antigravity |
| 2026-04-29 | docs | _ARCHITECT_AGENT.md | Regra obrigatoria para avaliar e manter log de atividades em funcionalidades modificadas | Codex |
| 2026-05-06 | feat | core | Ecossistema Social & Expansão Eclesiástica - v2.0.0 | Antigravity |
| 2026-06-12 | feat | utils/, services/, app/competicao, views/ | Expansao de Mana, niveis, regras e competicao - v2.3.0 | Codex |
| 2026-07-12 | feat | app/newhome, views/, components/ | New Home isolada, responsiva e personalizada por papel - v2.4.0 | Codex |


---

> "Construimos sobre rocha. A flexibilidade do codigo nao deve comprometer a solidez da base."
