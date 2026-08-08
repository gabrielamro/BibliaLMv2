---
name: ai-development
description: Desenvolvimento assistido por IA no Culto+ com contexto mínimo, escopo explícito, patches pequenos, memória compacta e validação determinística. Use ao implementar, diagnosticar, revisar ou testar alterações no repositório quando o objetivo for reduzir tokens, retrabalho e leitura desnecessária sem perder as regras arquiteturais.
---

# AI Development

Use esta skill para trabalhar no Culto+ com o menor contexto suficiente e evidência verificável.

## Fluxo obrigatório

1. Classifique o pedido: responder, diagnosticar, revisar ou implementar. Não implemente durante diagnóstico/revisão sem autorização.
2. Monte um pacote mínimo: skill aplicável, regras globais, rota/feature, arquivos afetados, tipos/serviços dependentes e testes próximos.
3. Defina objetivo, inclusões, exclusões, critérios de aceite e comandos de validação antes de editar.
4. Busque com `rg` e leia somente as faixas necessárias.
5. Faça o menor patch possível. Não combine correção com refatoração não solicitada.
6. Rode `scripts/ai-diff-guard.mjs` e `scripts/ai-harness.mjs` antes da validação cara.
7. Valide em ordem: diff, teste focado, typecheck, testes do módulo, build e E2E/QA.
8. Entregue resumo compacto: arquivos, decisões, validações, falhas e próximo passo.

## Regras do Culto+

- Preserve a separação entre UI e `services/`.
- Consulte `types.ts` antes de criar contratos globais e `constants.ts` antes de criar limites/configurações.
- Em frontend, siga `culto-plus-visual` e o shell/token do módulo correto.
- Em Supabase, siga a skill `supabase`, mantenha RLS e valide permissões.
- Não exponha segredos, `.env` ou dados privados em contexto, logs ou diff.
- Não altere arquivos fora do escopo sem justificar.
- Não use chamadas reais de IA para validar código; o harness padrão é offline.

## Recursos

- `references/context-routing.md`: seleção de contexto.
- `references/task-contract.md`: contrato compacto antes de editar.
- `references/validation-order.md`: ordem de checks.
- `references/fixtures.md`: formato de casos do harness.
- `scripts/ai-context-pack.mjs`: pacote mínimo de contexto.
- `scripts/ai-diff-guard.mjs`: proteção do diff.
- `scripts/ai-harness.mjs`: validação determinística.

## Comandos

```text
node .agents/skills/ai-development/scripts/ai-context-pack.mjs --task frontend --route /meus-cultos
node .agents/skills/ai-development/scripts/ai-diff-guard.mjs --base HEAD
node .agents/skills/ai-development/scripts/ai-diff-guard.mjs --base HEAD --scope .agents/skills/ai-development,package.json
node .agents/skills/ai-development/scripts/ai-harness.mjs --changed
node .agents/skills/ai-development/scripts/ai-harness.mjs --fixture .agents/skills/ai-development/tests/fixtures/frontend-route.json
```
