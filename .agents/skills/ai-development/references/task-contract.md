# Contrato compacto de tarefa

```yaml
objective: "resultado observável"
mode: implement
include: ["arquivo ou diretório permitido"]
exclude: ["mudança fora do escopo"]
acceptance: ["critério verificável"]
validation: ["comando"]
```

Se uma dependência exigir ampliar `include`, registre a razão antes de editar. Para diagnóstico, use `mode: diagnose` e mantenha o diff vazio.
