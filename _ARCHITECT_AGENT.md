# 🏛️ Lei Máxima da Arquitetura — BíbliaLM

Este documento contém as regras inegociáveis. Violações destas regras resultam em veto automático de qualquer mudança.

## 1. Os 3 Pilares Inegociáveis
1. **Segurança de Dados:** Nenhuma chave (`.env`) ou credencial deve ser exposta ou removida da proteção de servidor.
2. **Controle de Gastos (IA):** Toda chamada à IA deve ser precedida por `checkFeatureAccess` e protegida por `retryWithBackoff`.
3. **Pureza de Fluxo:** Lógica de banco/API deve residir em `services/`. Componentes são apenas para apresentação e estado local.

## 2. Regras Técnicas (RN)
- **RN01:** O `types.ts` é a única fonte de verdade para interfaces globais.
- **RN02:** O `constants.ts` centraliza todas as configurações de sistema e limites.
- **RN03:** Não use `console.log` em produção.
- **RN04:** O Firestore nunca é chamado diretamente em Views; use o `firebaseService`.
- **RN05:** Todo novo módulo deve vir acompanhado de testes de integração (Playwright).

## 3. Protocolo de Commit
As mensagens de commit devem ser semânticas:
`tipo(escopo): descrição — vX.Y.Z`
- Tipos Permitidos: `feat`, `fix`, `refactor`, `style`, `chore`, `docs`.

## 4. Registro de Mudanças Aprovadas (Log Sagrado)

| DATA | TIPO | ARQUIVO(S) | DESCRIÇÃO CURTA | Arquiteto |
| :--- | :--- | :--- | :--- | :--- |
| 2026-03-10 | feat | components/Layout.tsx | Implementação inicial do Header Centrado | Antigravity |
| 2026-03-17 | chore | .agents/ | Setup completo dos Agentes Pastor, CPO e Arquiteto | Antigravity |
| 2026-04-01 | fix | app/, components/, views/ | Persistência de imagem de capa de estudos | Antigravity |

---

> "Construímos sobre rocha. A flexibilidade do código não deve comprometer a solidez da base."
