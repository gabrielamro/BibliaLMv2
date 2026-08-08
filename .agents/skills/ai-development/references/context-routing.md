# Roteamento de contexto

## Sempre incluir

- pedido atual e critérios de aceite;
- regras aplicáveis de `_ARCHITECT_AGENT.md` e `_PROJECT_CONTEXT.md`;
- skill especialista acionada;
- tipos, serviço, view/route e testes diretamente conectados.

## Por domínio

| Tarefa | Contexto preferencial |
| --- | --- |
| Frontend | rota, view, shell, `moduleThemes.ts`, `globals.css`, telas semelhantes e testes |
| Supabase | serviço, tipos, migration, RLS e testes de perfil |
| API | rota, cliente/serviço, contrato e testes |
| Bug | stack trace, arquivo apontado, chamadas próximas e reprodução |
| Revisão | diff, contratos afetados e testes |

## Evitar

`node_modules`, `.next`, backups, logs antigos e roadmaps não relacionados. Use `rg` antes de abrir arquivos grandes.
