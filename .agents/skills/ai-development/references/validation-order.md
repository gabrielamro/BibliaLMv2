# Ordem de validação

1. `ai-diff-guard` e inspeção do diff.
2. Teste unitário/contrato focado.
3. `npm run typecheck`.
4. Testes do módulo.
5. `npm run build`.
6. Playwright, QA ou inspeção visual quando necessário.

Pare na primeira falha acionável; não rode build repetidamente para descobrir erro que o typecheck já revela.
