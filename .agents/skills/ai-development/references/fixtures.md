# Fixtures do harness

Fixtures representam tarefas reais e permitem validar o processo sem chamar modelos.

Formato mínimo:

```json
{
  "id": "frontend-route",
  "mode": "implement",
  "include": ["app/example", "views/ExamplePage.tsx"],
  "exclude": ["supabase", ".env"],
  "checks": ["typecheck"],
  "externalAiCalls": 0
}
```

Comece com uma fixture por domínio: frontend, API, Supabase, bug e revisão.
